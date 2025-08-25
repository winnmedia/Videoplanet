/**
 * File Upload Entity Slice
 * 
 * Redux state management for file upload and management
 * Following FSD architecture and Redux Toolkit patterns
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  FileUploadItem,
  FileUploadBatch,
  FileMetadata,
  FileUploadStatus,
  FileUploadError,
  FileUploadProgress,
  StorageQuota,
  FileListResponse,
  FileFilters,
  FileSortOptions,
  DEFAULT_UPLOAD_OPTIONS
} from './types'
import { validateFile, validateQuota } from '../lib/validation'

export interface FileUploadState {
  // Upload queue and batches
  uploadQueue: FileUploadItem[]
  currentBatch: FileUploadBatch | null
  batches: FileUploadBatch[]
  
  // File management
  files: FileMetadata[]
  selectedFiles: string[]
  
  // Pagination and filtering
  currentPage: number
  pageSize: number
  totalFiles: number
  hasMore: boolean
  filters: FileFilters
  sortOptions: FileSortOptions
  
  // Storage quota
  quota: StorageQuota | null
  
  // UI state
  isUploading: boolean
  isLoading: boolean
  isDragOver: boolean
  showUploadModal: boolean
  
  // Error state
  error: FileUploadError | null
  uploadErrors: FileUploadError[]
}

const initialState: FileUploadState = {
  uploadQueue: [],
  currentBatch: null,
  batches: [],
  files: [],
  selectedFiles: [],
  currentPage: 1,
  pageSize: 20,
  totalFiles: 0,
  hasMore: false,
  filters: {},
  sortOptions: {
    field: 'createdAt',
    direction: 'desc'
  },
  quota: null,
  isUploading: false,
  isLoading: false,
  isDragOver: false,
  showUploadModal: false,
  error: null,
  uploadErrors: []
}

// Async thunks for API operations
export const fetchFileList = createAsyncThunk(
  'file/fetchFileList',
  async (params: {
    page?: number
    pageSize?: number
    filters?: FileFilters
    sort?: FileSortOptions
  }) => {
    const { page = 1, pageSize = 20, filters = {}, sort = { field: 'createdAt', direction: 'desc' } } = params
    
    // Mock API call - replace with actual API implementation
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, pageSize, filters, sort })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch files')
    }
    
    return response.json() as Promise<FileListResponse>
  }
)

export const uploadFile = createAsyncThunk(
  'file/uploadFile',
  async (file: File, { getState, dispatch }) => {
    const state = getState() as { file: FileUploadState }
    
    // Validate file
    const validationResult = await validateFile(file)
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0]?.message || 'File validation failed')
    }
    
    // Check quota
    const currentUsage = state.file.quota?.used || 0
    const totalQuota = state.file.quota?.total || Infinity
    const quotaResult = validateQuota([file], currentUsage, totalQuota)
    if (!quotaResult.isValid) {
      throw new Error(quotaResult.errors[0]?.message || 'Storage quota exceeded')
    }
    
    // Create upload item
    const uploadItem: FileUploadItem = {
      id: crypto.randomUUID(),
      file,
      metadata: {
        id: crypto.randomUUID(),
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: validationResult.detectedType!,
        mimeType: validationResult.detectedMimeType!,
        extension: file.name.split('.').pop()?.toLowerCase() || '',
        lastModified: file.lastModified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      status: 'preparing',
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
      options: DEFAULT_UPLOAD_OPTIONS,
      startTime: Date.now()
    }
    
    dispatch(addToUploadQueue(uploadItem))
    
    // Mock upload progress
    return new Promise<FileMetadata>((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          const metadata: FileMetadata = {
            ...uploadItem.metadata,
            id: crypto.randomUUID(),
            name: file.name,
            originalName: file.name,
            size: file.size,
            type: validationResult.detectedType!,
            mimeType: validationResult.detectedMimeType!,
            extension: file.name.split('.').pop()?.toLowerCase() || '',
            lastModified: file.lastModified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          dispatch(updateUploadProgress({
            id: uploadItem.id,
            progress: {
              ...uploadItem.progress,
              loaded: file.size,
              percentage: 100
            }
          }))
          
          dispatch(updateUploadStatus({
            id: uploadItem.id,
            status: 'completed'
          }))
          
          resolve(metadata)
        } else {
          dispatch(updateUploadProgress({
            id: uploadItem.id,
            progress: {
              ...uploadItem.progress,
              loaded: Math.floor((progress / 100) * file.size),
              percentage: Math.floor(progress)
            }
          }))
        }
      }, 200)
    })
  }
)

export const deleteFiles = createAsyncThunk(
  'file/deleteFiles',
  async (fileIds: string[]) => {
    // Mock API call
    const response = await fetch('/api/files/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds })
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete files')
    }
    
    return fileIds
  }
)

export const fetchStorageQuota = createAsyncThunk(
  'file/fetchStorageQuota',
  async () => {
    // Mock API call
    const response = await fetch('/api/storage/quota')
    
    if (!response.ok) {
      throw new Error('Failed to fetch storage quota')
    }
    
    return response.json() as Promise<StorageQuota>
  }
)

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    // Upload queue management
    addToUploadQueue: (state, action: PayloadAction<FileUploadItem>) => {
      state.uploadQueue.push(action.payload)
    },
    
    removeFromUploadQueue: (state, action: PayloadAction<string>) => {
      state.uploadQueue = state.uploadQueue.filter(item => item.id !== action.payload)
    },
    
    clearUploadQueue: (state) => {
      state.uploadQueue = []
    },
    
    updateUploadStatus: (state, action: PayloadAction<{ id: string; status: FileUploadStatus }>) => {
      const { id, status } = action.payload
      const item = state.uploadQueue.find(item => item.id === id)
      if (item) {
        item.status = status
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          item.endTime = Date.now()
        }
      }
    },
    
    updateUploadProgress: (state, action: PayloadAction<{ id: string; progress: Partial<FileUploadProgress> }>) => {
      const { id, progress } = action.payload
      const item = state.uploadQueue.find(item => item.id === id)
      if (item) {
        item.progress = { ...item.progress, ...progress }
      }
    },
    
    updateUploadError: (state, action: PayloadAction<{ id: string; error: FileUploadError }>) => {
      const { id, error } = action.payload
      const item = state.uploadQueue.find(item => item.id === id)
      if (item) {
        item.error = error
        item.status = 'failed'
      }
      state.uploadErrors.push(error)
    },
    
    // Batch management
    createBatch: (state, action: PayloadAction<string[]>) => {
      const itemIds = action.payload
      const items = state.uploadQueue.filter(item => itemIds.includes(item.id))
      
      const batch: FileUploadBatch = {
        id: crypto.randomUUID(),
        items,
        status: 'preparing',
        progress: {
          completed: 0,
          total: items.length,
          percentage: 0
        },
        createdAt: new Date().toISOString(),
        errors: []
      }
      
      state.currentBatch = batch
      state.batches.push(batch)
    },
    
    // File selection
    selectFile: (state, action: PayloadAction<string>) => {
      const fileId = action.payload
      if (!state.selectedFiles.includes(fileId)) {
        state.selectedFiles.push(fileId)
      }
    },
    
    deselectFile: (state, action: PayloadAction<string>) => {
      state.selectedFiles = state.selectedFiles.filter(id => id !== action.payload)
    },
    
    selectAllFiles: (state) => {
      state.selectedFiles = state.files.map(file => file.id)
    },
    
    clearSelection: (state) => {
      state.selectedFiles = []
    },
    
    // Filters and sorting
    setFilters: (state, action: PayloadAction<FileFilters>) => {
      state.filters = action.payload
      state.currentPage = 1 // Reset to first page when filtering
    },
    
    setSortOptions: (state, action: PayloadAction<FileSortOptions>) => {
      state.sortOptions = action.payload
      state.currentPage = 1 // Reset to first page when sorting
    },
    
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    
    // UI state
    setDragOver: (state, action: PayloadAction<boolean>) => {
      state.isDragOver = action.payload
    },
    
    setShowUploadModal: (state, action: PayloadAction<boolean>) => {
      state.showUploadModal = action.payload
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    clearUploadErrors: (state) => {
      state.uploadErrors = []
    }
  },
  extraReducers: (builder) => {
    // Fetch file list
    builder
      .addCase(fetchFileList.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchFileList.fulfilled, (state, action) => {
        state.isLoading = false
        state.files = action.payload.files
        state.totalFiles = action.payload.total
        state.currentPage = action.payload.page
        state.pageSize = action.payload.pageSize
        state.hasMore = action.payload.hasMore
        state.quota = action.payload.quota
      })
      .addCase(fetchFileList.rejected, (state, action) => {
        state.isLoading = false
        state.error = {
          code: 'FETCH_FILES_FAILED',
          message: action.error.message || 'Failed to fetch files',
          retryable: true,
          timestamp: new Date().toISOString()
        }
      })
    
    // Upload file
    builder
      .addCase(uploadFile.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isUploading = false
        state.files.unshift(action.payload) // Add to beginning of list
        
        // Update quota
        if (state.quota) {
          state.quota.used += action.payload.size
          state.quota.available = state.quota.total - state.quota.used
          state.quota.percentage = (state.quota.used / state.quota.total) * 100
          state.quota.nearLimit = state.quota.percentage > 80
          state.quota.exceeded = state.quota.used > state.quota.total
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isUploading = false
        state.error = {
          code: 'UPLOAD_FAILED',
          message: action.error.message || 'File upload failed',
          retryable: true,
          timestamp: new Date().toISOString()
        }
      })
    
    // Delete files
    builder
      .addCase(deleteFiles.fulfilled, (state, action) => {
        const deletedIds = action.payload
        const deletedFiles = state.files.filter(file => deletedIds.includes(file.id))
        const deletedSize = deletedFiles.reduce((sum, file) => sum + file.size, 0)
        
        state.files = state.files.filter(file => !deletedIds.includes(file.id))
        state.selectedFiles = state.selectedFiles.filter(id => !deletedIds.includes(id))
        
        // Update quota
        if (state.quota) {
          state.quota.used -= deletedSize
          state.quota.available = state.quota.total - state.quota.used
          state.quota.percentage = (state.quota.used / state.quota.total) * 100
          state.quota.nearLimit = state.quota.percentage > 80
          state.quota.exceeded = state.quota.used > state.quota.total
        }
      })
    
    // Fetch storage quota
    builder
      .addCase(fetchStorageQuota.fulfilled, (state, action) => {
        state.quota = action.payload
      })
  }
})

export const {
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
  clearUploadErrors
} = fileSlice.actions

export default fileSlice.reducer

// Selectors
export const selectUploadQueue = (state: { file: FileUploadState }) => state.file.uploadQueue
export const selectFiles = (state: { file: FileUploadState }) => state.file.files
export const selectSelectedFiles = (state: { file: FileUploadState }) => state.file.selectedFiles
export const selectIsUploading = (state: { file: FileUploadState }) => state.file.isUploading
export const selectUploadProgress = (state: { file: FileUploadState }) => {
  const queue = state.file.uploadQueue
  if (queue.length === 0) return null
  
  const totalProgress = queue.reduce((sum, item) => sum + item.progress.percentage, 0)
  return Math.round(totalProgress / queue.length)
}
export const selectStorageQuota = (state: { file: FileUploadState }) => state.file.quota