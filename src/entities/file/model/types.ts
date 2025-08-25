/**
 * File Upload Entity Types
 * 
 * Core types for file upload and management functionality
 * Following FSD architecture principles for entity layer
 */

export type FileUploadStatus = 
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type SupportedFileType = 
  | 'video'
  | 'image'
  | 'document'
  | 'audio'
  | 'archive'

export type SupportedMimeType =
  // Video formats
  | 'video/mp4'
  | 'video/mov'
  | 'video/avi'
  | 'video/webm'
  | 'video/quicktime'
  | 'video/x-msvideo'
  // Image formats
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  // Document formats
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  // Audio formats
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/ogg'
  // Archive formats
  | 'application/zip'
  | 'application/x-rar-compressed'

export interface FileValidationRule {
  maxSize: number // in bytes
  allowedTypes: SupportedMimeType[]
  allowedExtensions: string[]
  validateContent?: boolean
}

export interface FileUploadChunk {
  id: string
  index: number
  start: number
  end: number
  size: number
  data: Blob
  uploaded: boolean
  retryCount: number
  checksum?: string
}

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
  speed: number // bytes per second
  timeRemaining: number // seconds
  chunksUploaded: number
  totalChunks: number
}

export interface FileMetadata {
  id: string
  name: string
  originalName: string
  size: number
  type: SupportedFileType
  mimeType: SupportedMimeType
  extension: string
  lastModified: number
  createdAt: string
  updatedAt: string
  checksum?: string
  thumbnailUrl?: string
  previewUrl?: string
  duration?: number // for video/audio files
  dimensions?: {
    width: number
    height: number
  }
  tags?: string[]
  description?: string
}

export interface FileUploadOptions {
  chunkSize: number // default 1MB for large files
  maxRetries: number // default 3
  enableProgressTracking: boolean
  enableChecksum: boolean
  enableThumbnailGeneration: boolean
  enablePreview: boolean
  autoUpload: boolean
  parallelChunks: number // max concurrent chunk uploads
  compressionOptions?: {
    quality: number
    maxWidth?: number
    maxHeight?: number
  }
}

export interface FileUploadError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
  retryable: boolean
  timestamp: string
}

export interface FileUploadItem {
  id: string
  file: File
  metadata: Partial<FileMetadata>
  status: FileUploadStatus
  progress: FileUploadProgress
  chunks: FileUploadChunk[]
  options: FileUploadOptions
  error?: FileUploadError
  uploadUrl?: string
  abortController?: AbortController
  startTime?: number
  endTime?: number
}

export interface FileUploadBatch {
  id: string
  items: FileUploadItem[]
  status: FileUploadStatus
  progress: {
    completed: number
    total: number
    percentage: number
  }
  createdAt: string
  completedAt?: string
  errors: FileUploadError[]
}

export interface StorageQuota {
  used: number
  total: number
  available: number
  percentage: number
  nearLimit: boolean // when > 80%
  exceeded: boolean
}

export interface FileFilters {
  type?: SupportedFileType[]
  mimeType?: SupportedMimeType[]
  sizeRange?: {
    min: number
    max: number
  }
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
  searchQuery?: string
}

export interface FileSortOptions {
  field: 'name' | 'size' | 'createdAt' | 'type'
  direction: 'asc' | 'desc'
}

export interface FileListResponse {
  files: FileMetadata[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  quota: StorageQuota
}

// API Response Types
export interface FileUploadResponse {
  success: boolean
  data?: {
    fileId: string
    metadata: FileMetadata
    uploadUrl?: string
  }
  error?: FileUploadError
}

export interface FileDeleteResponse {
  success: boolean
  deletedCount: number
  errors?: FileUploadError[]
}

export interface ChunkUploadResponse {
  success: boolean
  chunkId: string
  nextChunkIndex?: number
  uploadComplete?: boolean
  fileMetadata?: FileMetadata
}

// Constants
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  AUDIO: 100 * 1024 * 1024, // 100MB
  ARCHIVE: 200 * 1024 * 1024, // 200MB
} as const

export const CHUNK_SIZE = {
  SMALL_FILE: 1024 * 1024, // 1MB
  LARGE_FILE: 5 * 1024 * 1024, // 5MB
  CHUNKED_THRESHOLD: 10 * 1024 * 1024, // 10MB - start chunking above this size
} as const

export const UPLOAD_TIMEOUTS = {
  CHUNK: 30000, // 30 seconds per chunk
  SMALL_FILE: 60000, // 1 minute for small files
  LARGE_FILE: 300000, // 5 minutes for large files
} as const

export const FILE_TYPE_MAPPING: Record<SupportedMimeType, SupportedFileType> = {
  'video/mp4': 'video',
  'video/mov': 'video',
  'video/avi': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
} as const

export const DEFAULT_VALIDATION_RULES: Record<SupportedFileType, FileValidationRule> = {
  video: {
    maxSize: FILE_SIZE_LIMITS.VIDEO,
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    allowedExtensions: ['.mp4', '.mov', '.avi', '.webm'],
    validateContent: true,
  },
  image: {
    maxSize: FILE_SIZE_LIMITS.IMAGE,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    validateContent: true,
  },
  document: {
    maxSize: FILE_SIZE_LIMITS.DOCUMENT,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
    validateContent: false,
  },
  audio: {
    maxSize: FILE_SIZE_LIMITS.AUDIO,
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    allowedExtensions: ['.mp3', '.wav', '.ogg'],
    validateContent: false,
  },
  archive: {
    maxSize: FILE_SIZE_LIMITS.ARCHIVE,
    allowedTypes: ['application/zip', 'application/x-rar-compressed'],
    allowedExtensions: ['.zip', '.rar'],
    validateContent: false,
  },
} as const

export const DEFAULT_UPLOAD_OPTIONS: FileUploadOptions = {
  chunkSize: CHUNK_SIZE.LARGE_FILE,
  maxRetries: 3,
  enableProgressTracking: true,
  enableChecksum: true,
  enableThumbnailGeneration: true,
  enablePreview: true,
  autoUpload: false,
  parallelChunks: 3,
  compressionOptions: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  },
} as const