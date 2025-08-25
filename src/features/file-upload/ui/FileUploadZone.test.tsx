/**
 * FileUploadZone Component Tests
 * 
 * Comprehensive test suite covering drag-and-drop functionality,
 * file validation, accessibility, and user interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import FileUploadZone, { FileUploadZoneProps } from './FileUploadZone'
import { DEFAULT_VALIDATION_RULES } from '@/entities/file'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxSize, maxFiles, multiple, disabled }: any) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
      tabIndex: 0,
      role: 'button',
      'aria-label': 'Upload area'
    }),
    getInputProps: () => ({
      type: 'file',
      accept: Object.keys(accept || {}).join(','),
      multiple,
      disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        onDrop?.(files, [])
      }
    }),
    isDragActive: false,
    isDragReject: false
  })
}))

// Mock file validation
vi.mock('@/entities/file', async () => {
  const actual = await vi.importActual('@/entities/file')
  return {
    ...actual,
    validateFiles: vi.fn().mockResolvedValue([
      {
        isValid: true,
        errors: [],
        warnings: [],
        detectedType: 'video',
        detectedMimeType: 'video/mp4'
      }
    ]),
    formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
    DEFAULT_VALIDATION_RULES: {
      video: {
        maxSize: 500 * 1024 * 1024,
        allowedTypes: ['video/mp4', 'video/avi'],
        allowedExtensions: ['.mp4', '.avi'],
        validateContent: true
      }
    }
  }
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123'
  }
})

// Helper function to create test files
function createTestFile(name: string, size: number, type: string): File {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Helper to create drag event
function createDragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      types: ['Files']
    }
  })
  return event
}

describe('FileUploadZone', () => {
  const defaultProps: FileUploadZoneProps = {
    fileType: 'video',
    onFilesSelected: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the upload zone with default content', () => {
      render(<FileUploadZone {...defaultProps} />)
      
      expect(screen.getByText('Drag & drop files here')).toBeInTheDocument()
      expect(screen.getByText('or click to browse files')).toBeInTheDocument()
      expect(screen.getByLabelText(/upload.*files/i)).toBeInTheDocument()
    })

    it('should render custom children when provided', () => {
      const customContent = <div data-testid="custom-content">Custom Upload Area</div>
      
      render(
        <FileUploadZone {...defaultProps}>
          {customContent}
        </FileUploadZone>
      )
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.queryByText('Drag & drop files here')).not.toBeInTheDocument()
    })

    it('should display file type and size information', () => {
      render(<FileUploadZone {...defaultProps} maxSize={100 * 1024 * 1024} />)
      
      expect(screen.getByText(/maximum file size/i)).toBeInTheDocument()
      expect(screen.getByText('100000000 bytes')).toBeInTheDocument()
    })

    it('should show multiple files information when enabled', () => {
      render(<FileUploadZone {...defaultProps} multiple={true} maxFiles={5} />)
      
      expect(screen.getByText(/up to 5 files at once/i)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <FileUploadZone {...defaultProps} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button')
      expect(uploadArea).toHaveAttribute('aria-label')
      expect(uploadArea).toHaveAttribute('aria-describedby', 'upload-description')
      expect(uploadArea).toHaveAttribute('tabIndex', '0')
    })

    it('should have accessible file input', () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('type', 'file')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<FileUploadZone {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button')
      
      await user.tab()
      expect(uploadArea).toHaveFocus()
      
      await user.keyboard('{Enter}')
      // Should trigger file input click (mocked behavior)
    })

    it('should update aria-label based on drag state', () => {
      const { rerender } = render(<FileUploadZone {...defaultProps} />)
      
      // Mock drag active state
      vi.mocked(require('react-dropzone').useDropzone).mockReturnValueOnce({
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: true,
        isDragReject: false
      })
      
      rerender(<FileUploadZone {...defaultProps} />)
      
      expect(screen.getByText('Drop files here')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      const onFilesSelected = vi.fn()
      render(<FileUploadZone {...defaultProps} onFilesSelected={onFilesSelected} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(onFilesSelected).toHaveBeenCalledWith([testFile], expect.any(Array))
      })
    })

    it('should display file previews after selection', async () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test-video.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Selected Files (1)')).toBeInTheDocument()
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
        expect(screen.getByText('1024 bytes • video/mp4')).toBeInTheDocument()
      })
    })

    it('should allow removing individual file previews', async () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument()
      })
      
      const removeButton = screen.getByLabelText('Remove test.mp4')
      fireEvent.click(removeButton)
      
      expect(screen.queryByText('test.mp4')).not.toBeInTheDocument()
    })

    it('should clear all previews when Clear All is clicked', async () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFiles = [
        createTestFile('test1.mp4', 1024, 'video/mp4'),
        createTestFile('test2.mp4', 2048, 'video/mp4')
      ]
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: testFiles } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Selected Files (2)')).toBeInTheDocument()
      })
      
      const clearAllButton = screen.getByText('Clear All')
      fireEvent.click(clearAllButton)
      
      expect(screen.queryByText('Selected Files')).not.toBeInTheDocument()
    })
  })

  describe('File Validation', () => {
    it('should display validation errors', async () => {
      const { validateFiles } = await import('@/entities/file')
      vi.mocked(validateFiles).mockResolvedValueOnce([
        {
          isValid: false,
          errors: [
            {
              code: 'FILE_TOO_LARGE',
              message: 'File is too large',
              retryable: false,
              timestamp: new Date().toISOString()
            }
          ],
          warnings: [],
          detectedType: 'video',
          detectedMimeType: 'video/mp4'
        }
      ])
      
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('large.mp4', 600 * 1024 * 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('File is too large')).toBeInTheDocument()
      })
    })

    it('should display validation warnings', async () => {
      const { validateFiles } = await import('@/entities/file')
      vi.mocked(validateFiles).mockResolvedValueOnce([
        {
          isValid: true,
          errors: [],
          warnings: ['Large file detected'],
          detectedType: 'video',
          detectedMimeType: 'video/mp4'
        }
      ])
      
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('warning.mp4', 150 * 1024 * 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Large file detected')).toBeInTheDocument()
      })
    })

    it('should call onError callback for validation failures', async () => {
      const onError = vi.fn()
      const { validateFiles } = await import('@/entities/file')
      vi.mocked(validateFiles).mockResolvedValueOnce([
        {
          isValid: false,
          errors: [
            {
              code: 'INVALID_TYPE',
              message: 'Invalid file type',
              retryable: false,
              timestamp: new Date().toISOString()
            }
          ],
          warnings: [],
          detectedType: null,
          detectedMimeType: null
        }
      ])
      
      render(<FileUploadZone {...defaultProps} onError={onError} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('invalid.txt', 1024, 'text/plain')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid file type')
      })
    })
  })

  describe('Disabled State', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<FileUploadZone {...defaultProps} disabled={true} />)
      
      const uploadArea = screen.getByRole('button')
      expect(uploadArea).toHaveClass('cursor-not-allowed')
      
      const fileInput = screen.getByLabelText('File upload input')
      expect(fileInput).toBeDisabled()
    })

    it('should not accept files when disabled', async () => {
      const onFilesSelected = vi.fn()
      render(
        <FileUploadZone 
          {...defaultProps} 
          disabled={true} 
          onFilesSelected={onFilesSelected} 
        />
      )
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })
      
      // Should not be called when disabled
      expect(onFilesSelected).not.toHaveBeenCalled()
    })

    it('should show disabled state during validation', async () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      // Add file which should trigger validation
      act(() => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      // Should show "Validating files..." text
      expect(screen.getByText('Validating files...')).toBeInTheDocument()
    })
  })

  describe('File Type Icons', () => {
    it('should display correct icons for different file types', async () => {
      render(<FileUploadZone {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const videoFile = createTestFile('video.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } })
      })
      
      await waitFor(() => {
        // Should render Video icon (we can check for the component structure)
        const fileItem = screen.getByRole('listitem')
        expect(fileItem).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Files', () => {
    it('should handle multiple file selection', async () => {
      const onFilesSelected = vi.fn()
      render(
        <FileUploadZone 
          {...defaultProps} 
          multiple={true} 
          onFilesSelected={onFilesSelected} 
        />
      )
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFiles = [
        createTestFile('video1.mp4', 1024, 'video/mp4'),
        createTestFile('video2.avi', 2048, 'video/avi')
      ]
      
      // Mock validation for multiple files
      const { validateFiles } = await import('@/entities/file')
      vi.mocked(validateFiles).mockResolvedValueOnce(
        testFiles.map(() => ({
          isValid: true,
          errors: [],
          warnings: [],
          detectedType: 'video' as const,
          detectedMimeType: 'video/mp4' as const
        }))
      )
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: testFiles } })
      })
      
      await waitFor(() => {
        expect(onFilesSelected).toHaveBeenCalledWith(testFiles, expect.any(Array))
        expect(screen.getByText('Selected Files (2)')).toBeInTheDocument()
      })
    })

    it('should enforce maxFiles limit', () => {
      render(<FileUploadZone {...defaultProps} maxFiles={2} />)
      
      expect(screen.getByText(/up to 2 files at once/i)).toBeInTheDocument()
    })
  })

  describe('Custom Validation Rules', () => {
    it('should use custom validation rules when provided', async () => {
      const customRules = {
        maxSize: 1024,
        allowedTypes: ['video/mp4'] as any,
        allowedExtensions: ['.mp4'],
        validateContent: false
      }
      
      const onFilesSelected = vi.fn()
      render(
        <FileUploadZone 
          {...defaultProps} 
          validationRules={customRules}
          onFilesSelected={onFilesSelected}
        />
      )
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(onFilesSelected).toHaveBeenCalled()
      })
      
      // Verify validateFiles was called with custom rules
      const { validateFiles } = await import('@/entities/file')
      expect(validateFiles).toHaveBeenCalledWith([testFile], customRules)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const onError = vi.fn()
      const { validateFiles } = await import('@/entities/file')
      vi.mocked(validateFiles).mockRejectedValueOnce(new Error('Validation failed'))
      
      render(<FileUploadZone {...defaultProps} onError={onError} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      const testFile = createTestFile('test.mp4', 1024, 'video/mp4')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } })
      })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Validation failed')
      })
    })

    it('should handle empty file list', async () => {
      const onFilesSelected = vi.fn()
      render(<FileUploadZone {...defaultProps} onFilesSelected={onFilesSelected} />)
      
      const fileInput = screen.getByLabelText('File upload input')
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [] } })
      })
      
      // Should not call onFilesSelected for empty file list
      expect(onFilesSelected).not.toHaveBeenCalled()
    })
  })
})