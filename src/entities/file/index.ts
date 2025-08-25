/**
 * File Entity Public API
 * 
 * Exports all public interfaces, types, and utilities
 * Following FSD architecture barrel export pattern
 */

// Types
export type {
  FileUploadStatus,
  SupportedFileType,
  SupportedMimeType,
  FileValidationRule,
  FileUploadChunk,
  FileUploadProgress,
  FileMetadata,
  FileUploadOptions,
  FileUploadError,
  FileUploadItem,
  FileUploadBatch,
  StorageQuota,
  FileFilters,
  FileSortOptions,
  FileListResponse,
  FileUploadResponse,
  FileDeleteResponse,
  ChunkUploadResponse
} from './model/types'

// Constants
export {
  FILE_SIZE_LIMITS,
  CHUNK_SIZE,
  UPLOAD_TIMEOUTS,
  FILE_TYPE_MAPPING,
  DEFAULT_VALIDATION_RULES,
  DEFAULT_UPLOAD_OPTIONS
} from './model/types'

// Validation utilities
export {
  validateFile,
  validateFiles,
  validateQuota,
  validateFileSize,
  validateMimeType,
  validateFileContent,
  getFileExtension,
  detectFileType,
  validateExtension,
  formatBytes,
  getValidationRules,
  supportsChunkedUpload,
  generateChecksum,
  sanitizeFilename,
  extractFileMetadata
} from './lib/validation'

export type { ValidationResult } from './lib/validation'

// Redux slice
export {
  default as fileReducer,
  fetchFileList,
  uploadFile,
  deleteFiles,
  fetchStorageQuota,
  addToUploadQueue,
  removeFromUploadQueue,
  clearUploadQueue,
  updateUploadStatus,
  updateUploadProgress,
  updateUploadError,
  createBatch,
  selectFile,
  deselectFile,
  selectAllFiles,
  clearSelection,
  setFilters,
  setSortOptions,
  setCurrentPage,
  setDragOver,
  setShowUploadModal,
  clearError,
  clearUploadErrors,
  selectUploadQueue,
  selectFiles,
  selectSelectedFiles,
  selectIsUploading,
  selectUploadProgress,
  selectStorageQuota
} from './model/file.slice'

export type { FileUploadState } from './model/file.slice'