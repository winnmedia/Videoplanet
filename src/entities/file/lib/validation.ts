/**
 * File Validation Library
 * 
 * Comprehensive file validation utilities for upload and management
 * Includes format, size, and content validation
 */

import { 
  FileValidationRule, 
  SupportedFileType, 
  SupportedMimeType, 
  FileUploadError,
  FILE_TYPE_MAPPING,
  DEFAULT_VALIDATION_RULES,
  FILE_SIZE_LIMITS
} from '../model/types'

export interface ValidationResult {
  isValid: boolean
  errors: FileUploadError[]
  warnings: string[]
  detectedType: SupportedFileType | null
  detectedMimeType: SupportedMimeType | null
}

/**
 * File signature bytes for content validation
 * First few bytes of common file formats
 */
const FILE_SIGNATURES: Record<string, number[]> = {
  // Video formats
  'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
  'video/avi': [0x52, 0x49, 0x46, 0x46], // RIFF
  'video/mov': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // QuickTime
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // WebM/Matroska
  
  // Image formats
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF8
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF (WebP)
  
  // Document formats
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  
  // Audio formats
  'audio/mpeg': [0xFF, 0xFB], // MP3
  'audio/wav': [0x52, 0x49, 0x46, 0x46], // RIFF
  'audio/ogg': [0x4F, 0x67, 0x67, 0x53], // OggS
  
  // Archive formats
  'application/zip': [0x50, 0x4B, 0x03, 0x04], // PK
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21], // Rar!
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) return ''
  return filename.slice(lastDotIndex).toLowerCase()
}

/**
 * Detect file type from MIME type
 */
export function detectFileType(mimeType: string): SupportedFileType | null {
  const supportedMimeType = mimeType as SupportedMimeType
  return FILE_TYPE_MAPPING[supportedMimeType] || null
}

/**
 * Validate file extension against allowed extensions
 */
export function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = getFileExtension(filename)
  return allowedExtensions.includes(extension)
}

/**
 * Validate file size against limits
 */
export function validateFileSize(file: File, maxSize: number): ValidationResult {
  const errors: FileUploadError[] = []
  const warnings: string[] = []
  
  if (file.size > maxSize) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size ${formatBytes(file.size)} exceeds maximum allowed size ${formatBytes(maxSize)}`,
      field: 'size',
      retryable: false,
      timestamp: new Date().toISOString()
    })
  }
  
  if (file.size === 0) {
    errors.push({
      code: 'EMPTY_FILE',
      message: 'File appears to be empty',
      field: 'size',
      retryable: false,
      timestamp: new Date().toISOString()
    })
  }
  
  // Warning for very large files
  if (file.size > 100 * 1024 * 1024) { // 100MB
    warnings.push(`Large file detected (${formatBytes(file.size)}). Upload may take longer.`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedType: null,
    detectedMimeType: null
  }
}

/**
 * Validate MIME type against allowed types
 */
export function validateMimeType(file: File, allowedTypes: SupportedMimeType[]): ValidationResult {
  const errors: FileUploadError[] = []
  const warnings: string[] = []
  
  const mimeType = file.type as SupportedMimeType
  const detectedType = detectFileType(mimeType)
  
  if (!allowedTypes.includes(mimeType)) {
    errors.push({
      code: 'INVALID_MIME_TYPE',
      message: `File type "${mimeType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      field: 'type',
      details: { actualType: mimeType, allowedTypes },
      retryable: false,
      timestamp: new Date().toISOString()
    })
  }
  
  // Warning for potentially problematic types
  if (mimeType === 'application/octet-stream') {
    warnings.push('File type could not be determined. Please ensure file is in correct format.')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedType,
    detectedMimeType: mimeType
  }
}

/**
 * Read file header bytes for content validation
 */
export async function readFileHeader(file: File, bytesToRead: number = 16): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer
      const bytes = new Uint8Array(buffer)
      resolve(Array.from(bytes))
    }
    
    reader.onerror = () => reject(new Error('Failed to read file header'))
    
    const blob = file.slice(0, bytesToRead)
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Validate file content by checking file signature
 */
export async function validateFileContent(file: File, expectedMimeType: SupportedMimeType): Promise<ValidationResult> {
  const errors: FileUploadError[] = []
  const warnings: string[] = []
  
  try {
    const signature = FILE_SIGNATURES[expectedMimeType]
    if (!signature) {
      warnings.push('Content validation not available for this file type')
      return {
        isValid: true,
        errors,
        warnings,
        detectedType: detectFileType(expectedMimeType),
        detectedMimeType: expectedMimeType
      }
    }
    
    const headerBytes = await readFileHeader(file, signature.length + 8)
    
    // Check if file signature matches
    const signatureMatches = signature.some((_, index) => {
      return signature.every((byte, i) => headerBytes[index + i] === byte)
    })
    
    if (!signatureMatches) {
      errors.push({
        code: 'CONTENT_MISMATCH',
        message: `File content does not match expected type "${expectedMimeType}"`,
        field: 'content',
        details: { 
          expectedSignature: signature,
          actualHeader: headerBytes.slice(0, 16)
        },
        retryable: false,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    errors.push({
      code: 'CONTENT_VALIDATION_FAILED',
      message: `Failed to validate file content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      field: 'content',
      retryable: true,
      timestamp: new Date().toISOString()
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedType: detectFileType(expectedMimeType),
    detectedMimeType: expectedMimeType
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File, 
  rules: FileValidationRule | SupportedFileType = 'video'
): Promise<ValidationResult> {
  // Get validation rules
  const validationRules = typeof rules === 'string' 
    ? DEFAULT_VALIDATION_RULES[rules]
    : rules
    
  const allErrors: FileUploadError[] = []
  const allWarnings: string[] = []
  let detectedType: SupportedFileType | null = null
  let detectedMimeType: SupportedMimeType | null = null
  
  // 1. Validate file size
  const sizeResult = validateFileSize(file, validationRules.maxSize)
  allErrors.push(...sizeResult.errors)
  allWarnings.push(...sizeResult.warnings)
  
  // 2. Validate MIME type
  const mimeResult = validateMimeType(file, validationRules.allowedTypes)
  allErrors.push(...mimeResult.errors)
  allWarnings.push(...mimeResult.warnings)
  detectedType = mimeResult.detectedType
  detectedMimeType = mimeResult.detectedMimeType
  
  // 3. Validate file extension
  if (!validateExtension(file.name, validationRules.allowedExtensions)) {
    const extension = getFileExtension(file.name)
    allErrors.push({
      code: 'INVALID_EXTENSION',
      message: `File extension "${extension}" is not allowed. Allowed extensions: ${validationRules.allowedExtensions.join(', ')}`,
      field: 'extension',
      details: { 
        actualExtension: extension, 
        allowedExtensions: validationRules.allowedExtensions 
      },
      retryable: false,
      timestamp: new Date().toISOString()
    })
  }
  
  // 4. Validate file content (if enabled and MIME type is valid)
  if (validationRules.validateContent && detectedMimeType && allErrors.length === 0) {
    const contentResult = await validateFileContent(file, detectedMimeType)
    allErrors.push(...contentResult.errors)
    allWarnings.push(...contentResult.warnings)
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    detectedType,
    detectedMimeType
  }
}

/**
 * Validate multiple files at once
 */
export async function validateFiles(
  files: FileList | File[], 
  rules: FileValidationRule | SupportedFileType = 'video'
): Promise<ValidationResult[]> {
  const fileArray = Array.from(files)
  const validationPromises = fileArray.map(file => validateFile(file, rules))
  return Promise.all(validationPromises)
}

/**
 * Check if uploaded files exceed storage quota
 */
export function validateQuota(
  files: File[], 
  currentUsage: number, 
  totalQuota: number
): ValidationResult {
  const errors: FileUploadError[] = []
  const warnings: string[] = []
  
  const totalFileSize = files.reduce((sum, file) => sum + file.size, 0)
  const projectedUsage = currentUsage + totalFileSize
  
  if (projectedUsage > totalQuota) {
    errors.push({
      code: 'QUOTA_EXCEEDED',
      message: `Upload would exceed storage quota. Current: ${formatBytes(currentUsage)}, Upload: ${formatBytes(totalFileSize)}, Limit: ${formatBytes(totalQuota)}`,
      field: 'quota',
      details: {
        currentUsage,
        uploadSize: totalFileSize,
        totalQuota,
        projectedUsage
      },
      retryable: false,
      timestamp: new Date().toISOString()
    })
  }
  
  // Warning when approaching quota limit (80%)
  if (projectedUsage > totalQuota * 0.8) {
    warnings.push(`Approaching storage limit. Usage will be ${Math.round((projectedUsage / totalQuota) * 100)}% after upload.`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedType: null,
    detectedMimeType: null
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get validation rules for file type
 */
export function getValidationRules(fileType: SupportedFileType): FileValidationRule {
  return DEFAULT_VALIDATION_RULES[fileType]
}

/**
 * Check if file type supports chunked upload
 */
export function supportsChunkedUpload(file: File): boolean {
  const CHUNKED_THRESHOLD = 10 * 1024 * 1024 // 10MB
  return file.size > CHUNKED_THRESHOLD
}

/**
 * Generate file checksum (MD5)
 */
export async function generateChecksum(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        resolve(hashHex)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file for checksum'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
    .substring(0, 255) // Limit filename length
}

/**
 * Extract metadata from file
 */
export async function extractFileMetadata(file: File): Promise<Partial<{
  duration: number
  dimensions: { width: number; height: number }
  thumbnailUrl: string
}>> {
  const metadata: Partial<{
    duration: number
    dimensions: { width: number; height: number }
    thumbnailUrl: string
  }> = {}
  
  const fileType = detectFileType(file.type)
  
  if (fileType === 'image') {
    // Extract image dimensions
    const dimensions = await getImageDimensions(file)
    if (dimensions) {
      metadata.dimensions = dimensions
    }
  }
  
  if (fileType === 'video') {
    // Extract video metadata
    const videoMetadata = await getVideoMetadata(file)
    if (videoMetadata.duration) {
      metadata.duration = videoMetadata.duration
    }
    if (videoMetadata.dimensions) {
      metadata.dimensions = videoMetadata.dimensions
    }
  }
  
  return metadata
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    
    img.src = url
  })
}

/**
 * Get video metadata
 */
async function getVideoMetadata(file: File): Promise<{
  duration?: number
  dimensions?: { width: number; height: number }
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        duration: video.duration,
        dimensions: {
          width: video.videoWidth,
          height: video.videoHeight
        }
      })
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({})
    }
    
    video.src = url
  })
}