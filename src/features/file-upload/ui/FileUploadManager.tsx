/**
 * FileUploadManager Component
 * 
 * Complete file upload management interface with queue, progress tracking,
 * and batch operations. Integrates with Redux store for state management.
 */

'use client'

import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames'
import { 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  X, 
  FileX,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import {
  uploadFile,
  selectUploadQueue,
  selectIsUploading,
  selectUploadProgress,
  addToUploadQueue,
  removeFromUploadQueue,
  updateUploadStatus,
  clearUploadQueue,
  clearUploadErrors,
  SupportedFileType,
  FileValidationRule,
  ValidationResult,
  DEFAULT_VALIDATION_RULES,
  FileUploadItem,
  DEFAULT_UPLOAD_OPTIONS
} from '@/entities/file'
import FileUploadZone from './FileUploadZone'
import FileUploadProgress from './FileUploadProgress'

export interface FileUploadManagerProps {
  fileType?: SupportedFileType
  validationRules?: FileValidationRule
  autoUpload?: boolean
  maxConcurrentUploads?: number
  onUploadComplete?: (metadata: any) => void
  onUploadError?: (error: string) => void
  className?: string
  showProgressList?: boolean
  allowBatchOperations?: boolean
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  fileType = 'video',
  validationRules,
  autoUpload = false,
  maxConcurrentUploads = 3,
  onUploadComplete,
  onUploadError,
  className,
  showProgressList = true,
  allowBatchOperations = true
}) => {
  const dispatch = useDispatch()
  const uploadQueue = useSelector(selectUploadQueue)
  const isUploading = useSelector(selectIsUploading)
  const overallProgress = useSelector(selectUploadProgress)
  
  const rules = validationRules || DEFAULT_VALIDATION_RULES[fileType]
  
  // Auto-upload when files are added
  useEffect(() => {
    if (autoUpload && uploadQueue.length > 0) {
      const pendingUploads = uploadQueue.filter(item => item.status === 'idle')
      pendingUploads.slice(0, maxConcurrentUploads).forEach(item => {
        handleStartUpload(item.id)
      })
    }
  }, [autoUpload, uploadQueue, maxConcurrentUploads])
  
  const handleFilesSelected = useCallback((files: File[], validationResults: ValidationResult[]) => {
    files.forEach((file, index) => {
      const validation = validationResults[index]
      
      if (validation.isValid) {
        const uploadItem: FileUploadItem = {
          id: crypto.randomUUID(),
          file,
          metadata: {
            id: crypto.randomUUID(),
            name: file.name,
            originalName: file.name,
            size: file.size,
            type: validation.detectedType!,
            mimeType: validation.detectedMimeType!,
            extension: file.name.split('.').pop()?.toLowerCase() || '',
            lastModified: file.lastModified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          status: 'idle',
          progress: {
            loaded: 0,
            total: file.size,
            percentage: 0,
            speed: 0,
            timeRemaining: 0,
            chunksUploaded: 0,
            totalChunks: 1
          },
          chunks: [],
          options: DEFAULT_UPLOAD_OPTIONS
        }
        
        dispatch(addToUploadQueue(uploadItem))
      }
    })
  }, [dispatch])
  
  const handleStartUpload = useCallback(async (itemId: string) => {
    const item = uploadQueue.find(item => item.id === itemId)
    if (!item) return
    
    try {
      dispatch(updateUploadStatus({ id: itemId, status: 'preparing' }))
      const result = await dispatch(uploadFile(item.file)).unwrap()
      onUploadComplete?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onUploadError?.(errorMessage)
    }
  }, [dispatch, uploadQueue, onUploadComplete, onUploadError])
  
  const handlePauseUpload = useCallback((itemId: string) => {
    // In a real implementation, this would pause the actual upload
    dispatch(updateUploadStatus({ id: itemId, status: 'paused' }))
  }, [dispatch])
  
  const handleResumeUpload = useCallback((itemId: string) => {
    // In a real implementation, this would resume the actual upload
    dispatch(updateUploadStatus({ id: itemId, status: 'uploading' }))
  }, [dispatch])
  
  const handleCancelUpload = useCallback((itemId: string) => {
    dispatch(updateUploadStatus({ id: itemId, status: 'cancelled' }))
    // Remove from queue after a delay to show cancellation
    setTimeout(() => {
      dispatch(removeFromUploadQueue(itemId))
    }, 1000)
  }, [dispatch])
  
  const handleRetryUpload = useCallback((itemId: string) => {
    handleStartUpload(itemId)
  }, [handleStartUpload])
  
  const handleRemoveItem = useCallback((itemId: string) => {
    dispatch(removeFromUploadQueue(itemId))
  }, [dispatch])
  
  const handleStartAllUploads = useCallback(() => {
    const pendingItems = uploadQueue.filter(item => item.status === 'idle')
    pendingItems.slice(0, maxConcurrentUploads).forEach(item => {
      handleStartUpload(item.id)
    })
  }, [uploadQueue, maxConcurrentUploads, handleStartUpload])
  
  const handleClearCompleted = useCallback(() => {
    const completedItems = uploadQueue.filter(item => 
      ['completed', 'cancelled', 'failed'].includes(item.status)
    )
    completedItems.forEach(item => {
      dispatch(removeFromUploadQueue(item.id))
    })
  }, [dispatch, uploadQueue])
  
  const handleClearAll = useCallback(() => {
    dispatch(clearUploadQueue())
    dispatch(clearUploadErrors())
  }, [dispatch])
  
  const pendingUploads = uploadQueue.filter(item => item.status === 'idle').length
  const activeUploads = uploadQueue.filter(item => 
    ['preparing', 'uploading'].includes(item.status)
  ).length
  const completedUploads = uploadQueue.filter(item => item.status === 'completed').length
  const failedUploads = uploadQueue.filter(item => item.status === 'failed').length
  const hasUploads = uploadQueue.length > 0
  
  return (
    <div className={classNames('file-upload-manager', className)}>
      {/* Upload Zone */}
      <FileUploadZone
        fileType={fileType}
        validationRules={rules}
        onFilesSelected={handleFilesSelected}
        onError={onUploadError}
        multiple={true}
        maxFiles={10}
      />
      
      {/* Upload Queue Summary */}
      {hasUploads && (
        <div className="mt-6 space-y-4">
          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {activeUploads} uploading
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">
                    {pendingUploads} pending
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {completedUploads} completed
                  </span>
                </div>
                
                {failedUploads > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {failedUploads} failed
                    </span>
                  </div>
                )}
              </div>
              
              {/* Overall Progress */}
              {(activeUploads > 0 || isUploading) && overallProgress && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{overallProgress}% overall</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Batch Actions */}
          {allowBatchOperations && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleStartAllUploads}
                  disabled={pendingUploads === 0 || activeUploads >= maxConcurrentUploads}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Start All ({pendingUploads})
                </button>
                
                {activeUploads > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      uploadQueue
                        .filter(item => item.status === 'uploading')
                        .forEach(item => handlePauseUpload(item.id))
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                    Pause All
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {(completedUploads > 0 || failedUploads > 0) && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Clear Completed
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Upload Progress List */}
      {showProgressList && hasUploads && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Upload Queue ({uploadQueue.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uploadQueue.map((item) => (
              <FileUploadProgress
                key={item.id}
                uploadItem={item}
                onPause={handlePauseUpload}
                onResume={handleResumeUpload}
                onCancel={handleCancelUpload}
                onRetry={handleRetryUpload}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!hasUploads && (
        <div className="mt-8 text-center text-gray-500">
          <FileX className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
          <p className="mt-2 text-sm">No files in upload queue</p>
          <p className="text-xs mt-1">
            Drag and drop files above to get started
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUploadManager