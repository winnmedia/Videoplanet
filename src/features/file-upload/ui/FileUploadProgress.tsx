/**
 * FileUploadProgress Component
 * 
 * Displays real-time upload progress with speed, time remaining,
 * and chunked upload status. Includes pause/resume/cancel controls.
 */

'use client'

import React from 'react'
import classNames from 'classnames'
import { 
  Play, 
  Pause, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Activity,
  FileText,
  Video,
  Image,
  FileAudio,
  Archive
} from 'lucide-react'
import { 
  FileUploadItem, 
  FileUploadStatus, 
  formatBytes,
  SupportedFileType 
} from '@/entities/file'

export interface FileUploadProgressProps {
  uploadItem: FileUploadItem
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
  className?: string
  compact?: boolean
}

const STATUS_CONFIG = {
  idle: {
    label: 'Ready',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: Clock
  },
  preparing: {
    label: 'Preparing',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    icon: Activity
  },
  uploading: {
    label: 'Uploading',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    icon: Activity
  },
  paused: {
    label: 'Paused',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    icon: Pause
  },
  completed: {
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  failed: {
    label: 'Failed',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    icon: AlertTriangle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: X
  }
} as const

const FILE_TYPE_ICONS = {
  video: Video,
  image: Image,
  document: FileText,
  audio: FileAudio,
  archive: Archive
} as const

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  uploadItem,
  onPause,
  onResume,
  onCancel,
  onRetry,
  className,
  compact = false
}) => {
  const { file, metadata, status, progress, error, startTime, endTime } = uploadItem
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon
  const FileIcon = FILE_TYPE_ICONS[metadata.type as SupportedFileType] || FileText
  
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return '--'
    
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }
  
  const formatSpeed = (bytesPerSecond: number): string => {
    if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '--'
    return `${formatBytes(bytesPerSecond)}/s`
  }
  
  const getElapsedTime = (): string => {
    if (!startTime) return '--'
    const endTimeUsed = endTime || Date.now()
    const elapsed = (endTimeUsed - startTime) / 1000
    return formatTime(elapsed)
  }
  
  const canPause = status === 'uploading'
  const canResume = status === 'paused'
  const canCancel = ['preparing', 'uploading', 'paused'].includes(status)
  const canRetry = status === 'failed'
  const showProgress = ['preparing', 'uploading', 'paused'].includes(status)
  
  if (compact) {
    return (
      <div className={classNames('flex items-center space-x-3 p-2', className)}>
        <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          
          {showProgress && (
            <div className="mt-1">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{progress.percentage}%</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className={classNames(
                      'h-1 rounded-full transition-all duration-300',
                      {
                        'bg-blue-500': status === 'uploading',
                        'bg-yellow-500': status === 'paused',
                        'bg-gray-400': status === 'preparing'
                      }
                    )}
                    style={{ width: `${progress.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={progress.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Upload progress: ${progress.percentage}%`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <StatusIcon className={classNames('h-4 w-4', statusConfig.color)} aria-hidden="true" />
          
          {canPause && onPause && (
            <button
              type="button"
              onClick={() => onPause(uploadItem.id)}
              className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded"
              aria-label="Pause upload"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          
          {canResume && onResume && (
            <button
              type="button"
              onClick={() => onResume(uploadItem.id)}
              className="p-1 text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="Resume upload"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          
          {canCancel && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(uploadItem.id)}
              className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className={classNames('bg-white border border-gray-200 rounded-lg p-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <FileIcon className="h-8 w-8 text-gray-500 flex-shrink-0" aria-hidden="true" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h3>
            <p className="text-xs text-gray-500">
              {formatBytes(file.size)} • {file.type}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <div className={classNames(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            statusConfig.color,
            statusConfig.bgColor
          )}>
            <StatusIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            {statusConfig.label}
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center space-x-1">
            {canPause && onPause && (
              <button
                type="button"
                onClick={() => onPause(uploadItem.id)}
                className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded"
                aria-label="Pause upload"
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            
            {canResume && onResume && (
              <button
                type="button"
                onClick={() => onResume(uploadItem.id)}
                className="p-1 text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Resume upload"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            
            {canRetry && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(uploadItem.id)}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                aria-label="Retry upload"
              >
                Retry
              </button>
            )}
            
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(uploadItem.id)}
                className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                aria-label="Cancel upload"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {showProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{progress.percentage}% complete</span>
            <span>{formatBytes(progress.loaded)} of {formatBytes(progress.total)}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={classNames(
                'h-2 rounded-full transition-all duration-300',
                {
                  'bg-blue-500': status === 'uploading',
                  'bg-yellow-500': status === 'paused',
                  'bg-gray-400': status === 'preparing'
                }
              )}
              style={{ width: `${progress.percentage}%` }}
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Upload progress: ${progress.percentage}%`}
            />
          </div>
        </div>
      )}
      
      {/* Upload Statistics */}
      {showProgress && (
        <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Speed:</span>
            <span className="ml-1">{formatSpeed(progress.speed)}</span>
          </div>
          
          <div>
            <span className="font-medium">Remaining:</span>
            <span className="ml-1">{formatTime(progress.timeRemaining)}</span>
          </div>
          
          <div>
            <span className="font-medium">Elapsed:</span>
            <span className="ml-1">{getElapsedTime()}</span>
          </div>
        </div>
      )}
      
      {/* Chunked Upload Progress */}
      {progress.totalChunks > 1 && showProgress && (
        <div className="mt-3 text-xs text-gray-500">
          <span className="font-medium">Chunks:</span>
          <span className="ml-1">
            {progress.chunksUploaded} of {progress.totalChunks} uploaded
          </span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Upload Failed</p>
              <p className="text-red-600 mt-1">{error.message}</p>
              {error.retryable && (
                <p className="text-red-500 mt-1">
                  This error is retryable. You can try uploading again.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {status === 'completed' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-green-800 font-medium">
              Upload completed successfully in {getElapsedTime()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadProgress