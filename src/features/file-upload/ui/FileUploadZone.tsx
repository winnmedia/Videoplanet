/**
 * FileUploadZone Component
 * 
 * Drag-and-drop file upload zone with accessibility support
 * Supports multiple files, validation, and chunked uploads
 */

'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import classNames from 'classnames'
import { Upload, X, FileText, Video, Image, Archive, FileAudio, AlertTriangle } from 'lucide-react'
import { 
  SupportedFileType,
  FileValidationRule,
  validateFiles,
  ValidationResult,
  formatBytes,
  DEFAULT_VALIDATION_RULES 
} from '@/entities/file'

export interface FileUploadZoneProps {
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  fileType?: SupportedFileType
  validationRules?: FileValidationRule
  onFilesSelected?: (files: File[], validationResults: ValidationResult[]) => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

interface FilePreview {
  file: File
  validation: ValidationResult
  id: string
}

const FILE_TYPE_ICONS = {
  video: Video,
  image: Image,
  document: FileText,
  audio: FileAudio,
  archive: Archive
} as const

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  accept = {
    'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  maxSize = 500 * 1024 * 1024, // 500MB
  maxFiles = 10,
  multiple = true,
  disabled = false,
  fileType = 'video',
  validationRules,
  onFilesSelected,
  onError,
  className,
  children
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const rules = validationRules || DEFAULT_VALIDATION_RULES[fileType]
  
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      onError?.(error.message)
      return
    }
    
    if (acceptedFiles.length === 0) return
    
    setIsValidating(true)
    
    try {
      // Validate all files
      const validationResults = await validateFiles(acceptedFiles, rules)
      
      // Create previews
      const newPreviews: FilePreview[] = acceptedFiles.map((file, index) => ({
        file,
        validation: validationResults[index],
        id: crypto.randomUUID()
      }))
      
      setPreviews(prev => [...prev, ...newPreviews])
      
      // Notify parent component
      onFilesSelected?.(acceptedFiles, validationResults)
      
      // Handle validation errors
      const hasErrors = validationResults.some(result => !result.isValid)
      if (hasErrors) {
        const errorMessages = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors.map(error => error.message))
        onError?.(errorMessages.join('; '))
      }
      
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }, [disabled, rules, onFilesSelected, onError])
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled: disabled || isValidating,
    noClick: false,
    noKeyboard: false
  })
  
  const removePreview = useCallback((id: string) => {
    setPreviews(prev => prev.filter(preview => preview.id !== id))
  }, [])
  
  const clearAll = useCallback(() => {
    setPreviews([])
  }, [])
  
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('video/')) return FILE_TYPE_ICONS.video
    if (file.type.startsWith('image/')) return FILE_TYPE_ICONS.image
    if (file.type.startsWith('audio/')) return FILE_TYPE_ICONS.audio
    if (file.type.includes('zip') || file.type.includes('rar')) return FILE_TYPE_ICONS.archive
    return FILE_TYPE_ICONS.document
  }
  
  const rootProps = getRootProps()
  
  return (
    <div className={classNames('file-upload-zone', className)}>
      {/* Upload Zone */}
      <div
        {...rootProps}
        className={classNames(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          {
            'border-blue-300 bg-blue-50': isDragActive && !isDragReject,
            'border-red-300 bg-red-50': isDragReject,
            'border-gray-300 hover:border-gray-400': !isDragActive && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
            'animate-pulse': isValidating
          }
        )}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${fileType} files. Drag and drop or click to select files.`}
        aria-describedby="upload-description"
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          aria-label="File upload input"
        />
        
        {children || (
          <div className="space-y-4">
            <Upload 
              className={classNames(
                'mx-auto h-12 w-12',
                {
                  'text-blue-500': isDragActive && !isDragReject,
                  'text-red-500': isDragReject,
                  'text-gray-400': !isDragActive && !disabled,
                  'text-gray-300': disabled
                }
              )}
              aria-hidden="true"
            />
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? isDragReject
                    ? 'Some files are not supported'
                    : 'Drop files here'
                  : 'Drag & drop files here'
                }
              </p>
              
              <p 
                id="upload-description"
                className="text-sm text-gray-500"
              >
                or click to browse files
              </p>
              
              {!disabled && (
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    Supports {Object.values(accept).flat().join(', ')} files
                  </p>
                  <p>
                    Maximum file size: {formatBytes(maxSize)}
                  </p>
                  {multiple && (
                    <p>
                      Up to {maxFiles} files at once
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {isValidating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-sm text-gray-600">
              Validating files...
            </div>
          </div>
        )}
      </div>
      
      {/* File Previews */}
      {previews.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({previews.length})
            </h3>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
              aria-label="Clear all selected files"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {previews.map((preview) => {
              const { file, validation } = preview
              const FileIcon = getFileTypeIcon(file)
              const hasErrors = !validation.isValid
              const hasWarnings = validation.warnings.length > 0
              
              return (
                <div
                  key={preview.id}
                  className={classNames(
                    'flex items-center justify-between p-3 rounded-lg border',
                    {
                      'border-red-200 bg-red-50': hasErrors,
                      'border-yellow-200 bg-yellow-50': hasWarnings && !hasErrors,
                      'border-gray-200 bg-gray-50': !hasErrors && !hasWarnings
                    }
                  )}
                  role="listitem"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon 
                      className={classNames(
                        'h-6 w-6 flex-shrink-0',
                        {
                          'text-red-500': hasErrors,
                          'text-yellow-500': hasWarnings && !hasErrors,
                          'text-gray-500': !hasErrors && !hasWarnings
                        }
                      )}
                      aria-hidden="true"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(file.size)} • {file.type}
                      </p>
                      
                      {hasErrors && (
                        <div className="mt-1">
                          {validation.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600">
                              <AlertTriangle className="inline h-3 w-3 mr-1" aria-hidden="true" />
                              {error.message}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {hasWarnings && !hasErrors && (
                        <div className="mt-1">
                          {validation.warnings.map((warning, index) => (
                            <p key={index} className="text-xs text-yellow-600">
                              <AlertTriangle className="inline h-3 w-3 mr-1" aria-hidden="true" />
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removePreview(preview.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadZone