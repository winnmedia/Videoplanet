/**
 * File Validation Tests
 * 
 * Comprehensive test suite for file validation utilities
 * Tests format checking, size validation, and content verification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validateFile,
  validateFiles,
  validateQuota,
  validateFileSize,
  validateMimeType,
  getFileExtension,
  detectFileType,
  validateExtension,
  formatBytes,
  supportsChunkedUpload,
  sanitizeFilename,
  generateChecksum
} from './validation'
import { DEFAULT_VALIDATION_RULES, FILE_SIZE_LIMITS } from '../model/types'

// Mock File constructor
class MockFile implements File {
  readonly lastModified: number
  readonly name: string
  readonly size: number
  readonly type: string
  readonly webkitRelativePath: string = ''

  constructor(
    fileBits: BlobPart[],
    fileName: string,
    options: FilePropertyBag = {}
  ) {
    this.name = fileName
    this.size = fileBits.reduce((acc, bit) => {
      if (typeof bit === 'string') return acc + bit.length
      if (bit instanceof ArrayBuffer) return acc + bit.byteLength
      return acc + (bit as Blob).size
    }, 0)
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size))
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([], { type: contentType })
  }

  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented.')
  }

  text(): Promise<string> {
    return Promise.resolve('')
  }
}

// Helper function to create test files
function createTestFile(
  name: string,
  size: number,
  type: string,
  content: string = ''
): File {
  // For large files, don't create actual content to avoid memory issues
  const mockSize = Math.min(size, 1000)
  const paddedContent = content.padEnd(mockSize, ' ')
  const file = new MockFile([paddedContent], name, { type })
  
  // Override the size property to simulate large files
  Object.defineProperty(file, 'size', { value: size, writable: false })
  
  return file
}

describe('File Validation Utilities', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-123',
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
      }
    })

    // Mock FileReader
    class MockFileReader {
      result: string | ArrayBuffer | null = null
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null

      readAsArrayBuffer(blob: Blob) {
        setTimeout(() => {
          this.result = new ArrayBuffer(16)
          this.onload?.({} as ProgressEvent<FileReader>)
        }, 0)
      }
    }

    vi.stubGlobal('FileReader', MockFileReader)
  })

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('video.mp4')).toBe('.mp4')
      expect(getFileExtension('document.pdf')).toBe('.pdf')
      expect(getFileExtension('image.jpeg')).toBe('.jpeg')
      expect(getFileExtension('archive.tar.gz')).toBe('.gz')
    })

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('filename')).toBe('')
      expect(getFileExtension('.')).toBe('.')
    })

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('')
      expect(getFileExtension('.hidden')).toBe('.hidden')
      expect(getFileExtension('file.UPPER.MP4')).toBe('.mp4')
    })
  })

  describe('detectFileType', () => {
    it('should detect video file types', () => {
      expect(detectFileType('video/mp4')).toBe('video')
      expect(detectFileType('video/avi')).toBe('video')
      expect(detectFileType('video/webm')).toBe('video')
    })

    it('should detect image file types', () => {
      expect(detectFileType('image/jpeg')).toBe('image')
      expect(detectFileType('image/png')).toBe('image')
      expect(detectFileType('image/gif')).toBe('image')
    })

    it('should detect document file types', () => {
      expect(detectFileType('application/pdf')).toBe('document')
      expect(detectFileType('application/msword')).toBe('document')
    })

    it('should return null for unsupported types', () => {
      expect(detectFileType('text/plain')).toBe(null)
      expect(detectFileType('application/unknown')).toBe(null)
    })
  })

  describe('validateExtension', () => {
    it('should validate allowed extensions', () => {
      const allowedExtensions = ['.mp4', '.avi', '.mov']
      
      expect(validateExtension('video.mp4', allowedExtensions)).toBe(true)
      expect(validateExtension('movie.AVI', allowedExtensions)).toBe(true)
      expect(validateExtension('clip.mov', allowedExtensions)).toBe(true)
    })

    it('should reject disallowed extensions', () => {
      const allowedExtensions = ['.mp4', '.avi', '.mov']
      
      expect(validateExtension('video.mkv', allowedExtensions)).toBe(false)
      expect(validateExtension('audio.mp3', allowedExtensions)).toBe(false)
      expect(validateExtension('document.pdf', allowedExtensions)).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('should pass validation for files within size limit', () => {
      const file = createTestFile('video.mp4', 50 * 1024 * 1024, 'video/mp4') // 50MB
      const result = validateFileSize(file, FILE_SIZE_LIMITS.VIDEO)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for oversized files', () => {
      const file = createTestFile('video.mp4', 600 * 1024 * 1024, 'video/mp4') // 600MB
      const result = validateFileSize(file, FILE_SIZE_LIMITS.VIDEO)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('FILE_TOO_LARGE')
    })

    it('should fail validation for empty files', () => {
      const file = createTestFile('empty.mp4', 0, 'video/mp4')
      const result = validateFileSize(file, FILE_SIZE_LIMITS.VIDEO)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('EMPTY_FILE')
    })

    it('should warn about large files', () => {
      const file = createTestFile('large.mp4', 150 * 1024 * 1024, 'video/mp4') // 150MB
      const result = validateFileSize(file, FILE_SIZE_LIMITS.VIDEO)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('validateMimeType', () => {
    it('should validate allowed MIME types', () => {
      const file = createTestFile('video.mp4', 1024, 'video/mp4')
      const allowedTypes = ['video/mp4', 'video/avi', 'video/webm'] as any
      const result = validateMimeType(file, allowedTypes)
      
      expect(result.isValid).toBe(true)
      expect(result.detectedType).toBe('video')
      expect(result.detectedMimeType).toBe('video/mp4')
    })

    it('should reject disallowed MIME types', () => {
      const file = createTestFile('audio.mp3', 1024, 'audio/mpeg')
      const allowedTypes = ['video/mp4', 'video/avi'] as any
      const result = validateMimeType(file, allowedTypes)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_MIME_TYPE')
    })

    it('should warn about octet-stream type', () => {
      const file = createTestFile('unknown', 1024, 'application/octet-stream')
      const allowedTypes = ['application/octet-stream'] as any
      const result = validateMimeType(file, allowedTypes)
      
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('validateFile', () => {
    it('should validate a correct video file', async () => {
      const file = createTestFile('video.mp4', 50 * 1024 * 1024, 'video/mp4')
      const result = await validateFile(file, 'video')
      
      expect(result.isValid).toBe(true)
      expect(result.detectedType).toBe('video')
      expect(result.detectedMimeType).toBe('video/mp4')
    })

    it('should reject files with validation errors', async () => {
      const file = createTestFile('video.mp4', 600 * 1024 * 1024, 'video/mp4') // Too large
      const result = await validateFile(file, 'video')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject files with wrong extension', async () => {
      const file = createTestFile('video.txt', 1024, 'video/mp4')
      const result = await validateFile(file, 'video')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_EXTENSION')).toBe(true)
    })

    it('should validate using custom rules', async () => {
      const customRules = {
        maxSize: 1024,
        allowedTypes: ['video/mp4'] as any,
        allowedExtensions: ['.mp4'],
        validateContent: false
      }
      
      const file = createTestFile('video.mp4', 2048, 'video/mp4') // Exceeds custom limit
      const result = await validateFile(file, customRules)
      
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateFiles', () => {
    it('should validate multiple files', async () => {
      const files = [
        createTestFile('video1.mp4', 1024, 'video/mp4'),
        createTestFile('video2.avi', 2048, 'video/avi'),
        createTestFile('invalid.txt', 1024, 'text/plain')
      ]
      
      const results = await validateFiles(files, 'video')
      
      expect(results).toHaveLength(3)
      expect(results[0].isValid).toBe(true)
      expect(results[1].isValid).toBe(true)
      expect(results[2].isValid).toBe(false)
    })
  })

  describe('validateQuota', () => {
    it('should pass when within quota limits', () => {
      const files = [createTestFile('video.mp4', 100 * 1024 * 1024, 'video/mp4')] // 100MB
      const result = validateQuota(files, 500 * 1024 * 1024, 1024 * 1024 * 1024) // 500MB used, 1GB total
      
      expect(result.isValid).toBe(true)
    })

    it('should fail when exceeding quota', () => {
      const files = [createTestFile('video.mp4', 600 * 1024 * 1024, 'video/mp4')] // 600MB
      const result = validateQuota(files, 500 * 1024 * 1024, 1024 * 1024 * 1024) // 500MB used, 1GB total
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('QUOTA_EXCEEDED')
    })

    it('should warn when approaching quota limit', () => {
      const files = [createTestFile('video.mp4', 300 * 1024 * 1024, 'video/mp4')] // 300MB
      const result = validateQuota(files, 600 * 1024 * 1024, 1024 * 1024 * 1024) // 600MB used, 1GB total
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 2)).toBe('1.5 KB')
    })
  })

  describe('supportsChunkedUpload', () => {
    it('should return true for large files', () => {
      const file = createTestFile('large.mp4', 50 * 1024 * 1024, 'video/mp4') // 50MB
      expect(supportsChunkedUpload(file)).toBe(true)
    })

    it('should return false for small files', () => {
      const file = createTestFile('small.mp4', 1024, 'video/mp4') // 1KB
      expect(supportsChunkedUpload(file)).toBe(false)
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file_.txt')
    })

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my video file.mp4')).toBe('my_video_file.mp4')
    })

    it('should handle multiple underscores', () => {
      expect(sanitizeFilename('file___name.txt')).toBe('file_name.txt')
    })

    it('should remove leading/trailing underscores', () => {
      expect(sanitizeFilename('___filename___.txt')).toBe('filename_.txt')
    })

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.MP4')).toBe('myfile.mp4')
    })

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const sanitized = sanitizeFilename(longName)
      expect(sanitized.length).toBeLessThanOrEqual(255)
    })
  })

  describe('generateChecksum', () => {
    it('should generate checksum for file', async () => {
      const file = createTestFile('test.mp4', 1024, 'video/mp4')
      const checksum = await generateChecksum(file)
      
      expect(typeof checksum).toBe('string')
      expect(checksum.length).toBeGreaterThan(0)
    })

    it('should generate consistent checksums', async () => {
      const file1 = createTestFile('test.mp4', 1024, 'video/mp4', 'same content')
      const file2 = createTestFile('test2.mp4', 1024, 'video/mp4', 'same content')
      
      const checksum1 = await generateChecksum(file1)
      const checksum2 = await generateChecksum(file2)
      
      expect(checksum1).toBe(checksum2)
    })
  })

  describe('Error handling', () => {
    it('should handle FileReader errors gracefully', async () => {
      // Mock FileReader to throw error
      class ErrorFileReader {
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
        
        readAsArrayBuffer() {
          setTimeout(() => {
            this.onerror?.({} as ProgressEvent<FileReader>)
          }, 0)
        }
      }

      vi.stubGlobal('FileReader', ErrorFileReader)

      const file = createTestFile('test.mp4', 1024, 'video/mp4')
      
      try {
        await generateChecksum(file)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle invalid validation rules', async () => {
      const invalidRules = {
        maxSize: -1,
        allowedTypes: [] as any,
        allowedExtensions: [],
        validateContent: false
      }
      
      const file = createTestFile('test.mp4', 1024, 'video/mp4')
      const result = await validateFile(file, invalidRules)
      
      expect(result.isValid).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should validate large file efficiently', async () => {
      const file = createTestFile('large.mp4', 100 * 1024 * 1024, 'video/mp4')
      
      const startTime = Date.now()
      const result = await validateFile(file, 'video')
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.isValid).toBe(true)
    })

    it('should handle batch validation efficiently', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createTestFile(`video${i}.mp4`, 1024, 'video/mp4')
      )
      
      const startTime = Date.now()
      const results = await validateFiles(files, 'video')
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(results).toHaveLength(10)
      expect(results.every(r => r.isValid)).toBe(true)
    })
  })
})