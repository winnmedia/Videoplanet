import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import { Invitation, InvitationBatch, InvitationStats, InvitationStatus, InvitationEvent } from './types'

// Entity adapters for normalized state management
const invitationAdapter = createEntityAdapter<Invitation>({
  selectId: (invitation) => invitation.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
})

const batchAdapter = createEntityAdapter<InvitationBatch>({
  selectId: (batch) => batch.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
})

interface InvitationState {
  // Entity collections
  invitations: ReturnType<typeof invitationAdapter.getInitialState>
  batches: ReturnType<typeof batchAdapter.getInitialState>
  
  // Current selections
  currentInvitation: string | null
  currentBatch: string | null
  
  // Filters and pagination
  filters: {
    projectId?: number
    status?: InvitationStatus[]
    role?: string[]
    search?: string
    dateRange?: {
      from: string
      to: string
    }
  }
  pagination: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
  
  // Statistics
  stats: InvitationStats | null
  
  // UI state
  isLoading: boolean
  isCreating: boolean
  isSending: boolean
  isUpdating: boolean
  
  // Real-time events
  realtimeEvents: InvitationEvent[]
  
  // Error handling
  error: string | null
  validationErrors: Record<string, string[]>
  
  // Background operations
  backgroundTasks: {
    id: string
    type: 'batch_creation' | 'batch_sending' | 'reminder_sending' | 'cleanup'
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress: number
    message?: string
    startedAt: string
    completedAt?: string
    error?: string
  }[]
}

const initialState: InvitationState = {
  invitations: invitationAdapter.getInitialState(),
  batches: batchAdapter.getInitialState(),
  currentInvitation: null,
  currentBatch: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  },
  stats: null,
  isLoading: false,
  isCreating: false,
  isSending: false,
  isUpdating: false,
  realtimeEvents: [],
  error: null,
  validationErrors: {},
  backgroundTasks: []
}

const invitationSlice = createSlice({
  name: 'invitation',
  initialState,
  reducers: {
    // Invitation CRUD operations
    setInvitations: (state, action: PayloadAction<{ invitations: Invitation[]; total: number; page: number; hasMore: boolean }>) => {
      invitationAdapter.setAll(state.invitations, action.payload.invitations)
      state.pagination = {
        ...state.pagination,
        total: action.payload.total,
        page: action.payload.page,
        hasMore: action.payload.hasMore
      }
      state.error = null
    },
    
    addInvitation: (state, action: PayloadAction<Invitation>) => {
      invitationAdapter.addOne(state.invitations, action.payload)
      state.pagination.total += 1
    },
    
    updateInvitation: (state, action: PayloadAction<{ id: string; changes: Partial<Invitation> }>) => {
      invitationAdapter.updateOne(state.invitations, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString()
        }
      })
    },
    
    removeInvitation: (state, action: PayloadAction<string>) => {
      invitationAdapter.removeOne(state.invitations, action.payload)
      state.pagination.total -= 1
      if (state.currentInvitation === action.payload) {
        state.currentInvitation = null
      }
    },
    
    setCurrentInvitation: (state, action: PayloadAction<string | null>) => {
      state.currentInvitation = action.payload
    },
    
    // Batch operations
    setBatches: (state, action: PayloadAction<InvitationBatch[]>) => {
      batchAdapter.setAll(state.batches, action.payload)
    },
    
    addBatch: (state, action: PayloadAction<InvitationBatch>) => {
      batchAdapter.addOne(state.batches, action.payload)
    },
    
    updateBatch: (state, action: PayloadAction<{ id: string; changes: Partial<InvitationBatch> }>) => {
      batchAdapter.updateOne(state.batches, {
        id: action.payload.id,
        changes: action.payload.changes
      })
    },
    
    setCurrentBatch: (state, action: PayloadAction<string | null>) => {
      state.currentBatch = action.payload
    },
    
    // Filters and search
    setFilters: (state, action: PayloadAction<InvitationState['filters']>) => {
      state.filters = action.payload
      state.pagination.page = 1 // Reset pagination when filters change
    },
    
    updateFilters: (state, action: PayloadAction<Partial<InvitationState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1
    },
    
    clearFilters: (state) => {
      state.filters = {}
      state.pagination.page = 1
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<InvitationState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    
    // Statistics
    setStats: (state, action: PayloadAction<InvitationStats>) => {
      state.stats = action.payload
    },
    
    // UI state management
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload
    },
    
    setSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload
    },
    
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.isUpdating = action.payload
    },
    
    // Real-time events
    addRealtimeEvent: (state, action: PayloadAction<InvitationEvent>) => {
      state.realtimeEvents.unshift(action.payload)
      // Keep only last 50 events
      if (state.realtimeEvents.length > 50) {
        state.realtimeEvents = state.realtimeEvents.slice(0, 50)
      }
      
      // Update invitation if it exists in store
      if (action.payload.invitationId) {
        const invitation = state.invitations.entities[action.payload.invitationId]
        if (invitation) {
          invitationAdapter.updateOne(state.invitations, {
            id: action.payload.invitationId,
            changes: action.payload.data
          })
        }
      }
    },
    
    clearRealtimeEvents: (state) => {
      state.realtimeEvents = []
    },
    
    // Background tasks
    addBackgroundTask: (state, action: PayloadAction<InvitationState['backgroundTasks'][0]>) => {
      state.backgroundTasks.push(action.payload)
    },
    
    updateBackgroundTask: (state, action: PayloadAction<{ id: string; changes: Partial<InvitationState['backgroundTasks'][0]> }>) => {
      const index = state.backgroundTasks.findIndex(task => task.id === action.payload.id)
      if (index !== -1) {
        state.backgroundTasks[index] = { ...state.backgroundTasks[index], ...action.payload.changes }
      }
    },
    
    removeBackgroundTask: (state, action: PayloadAction<string>) => {
      state.backgroundTasks = state.backgroundTasks.filter(task => task.id !== action.payload)
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
      state.isCreating = false
      state.isSending = false
      state.isUpdating = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    setValidationErrors: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.validationErrors = action.payload
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = {}
    },
    
    // Bulk operations
    bulkUpdateInvitations: (state, action: PayloadAction<{ ids: string[]; changes: Partial<Invitation> }>) => {
      action.payload.ids.forEach(id => {
        invitationAdapter.updateOne(state.invitations, {
          id,
          changes: {
            ...action.payload.changes,
            updatedAt: new Date().toISOString()
          }
        })
      })
    },
    
    bulkDeleteInvitations: (state, action: PayloadAction<string[]>) => {
      invitationAdapter.removeMany(state.invitations, action.payload)
      state.pagination.total -= action.payload.length
    },
    
    // Status updates
    updateInvitationStatus: (state, action: PayloadAction<{ id: string; status: InvitationStatus; metadata?: Record<string, any> }>) => {
      const invitation = state.invitations.entities[action.payload.id]
      if (invitation) {
        invitationAdapter.updateOne(state.invitations, {
          id: action.payload.id,
          changes: {
            status: action.payload.status,
            respondedAt: ['accepted', 'declined'].includes(action.payload.status) ? new Date().toISOString() : invitation.respondedAt,
            metadata: {
              ...invitation.metadata,
              ...action.payload.metadata
            },
            updatedAt: new Date().toISOString()
          }
        })
      }
    },
    
    // Reset state
    resetState: () => initialState
  }
})

// Selectors using entity adapter selectors
export const {
  selectAll: selectAllInvitations,
  selectById: selectInvitationById,
  selectIds: selectInvitationIds,
  selectEntities: selectInvitationEntities,
  selectTotal: selectTotalInvitations
} = invitationAdapter.getSelectors((state: { invitation: InvitationState }) => state.invitation.invitations)

export const {
  selectAll: selectAllBatches,
  selectById: selectBatchById,
  selectIds: selectBatchIds,
  selectEntities: selectBatchEntities,
  selectTotal: selectTotalBatches
} = batchAdapter.getSelectors((state: { invitation: InvitationState }) => state.invitation.batches)

// Custom selectors
export const selectCurrentInvitation = (state: { invitation: InvitationState }) => {
  if (!state.invitation.currentInvitation) return null
  return selectInvitationById(state, state.invitation.currentInvitation)
}

export const selectCurrentBatch = (state: { invitation: InvitationState }) => {
  if (!state.invitation.currentBatch) return null
  return selectBatchById(state, state.invitation.currentBatch)
}

export const selectFilteredInvitations = (state: { invitation: InvitationState }) => {
  const allInvitations = selectAllInvitations(state)
  const { filters } = state.invitation
  
  return allInvitations.filter(invitation => {
    if (filters.projectId && invitation.projectId !== filters.projectId) return false
    if (filters.status && !filters.status.includes(invitation.status)) return false
    if (filters.role && !filters.role.includes(invitation.role)) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        invitation.inviteeEmail.toLowerCase().includes(searchLower) ||
        invitation.inviteeName?.toLowerCase().includes(searchLower) ||
        invitation.message?.toLowerCase().includes(searchLower)
      )
    }
    if (filters.dateRange) {
      const createdAt = new Date(invitation.createdAt)
      const from = new Date(filters.dateRange.from)
      const to = new Date(filters.dateRange.to)
      return createdAt >= from && createdAt <= to
    }
    return true
  })
}

export const selectActiveBackgroundTasks = (state: { invitation: InvitationState }) => {
  return state.invitation.backgroundTasks.filter(task => task.status === 'pending' || task.status === 'running')
}

export const selectRecentEvents = (state: { invitation: InvitationState }) => {
  return state.invitation.realtimeEvents.slice(0, 10)
}

export const {
  setInvitations,
  addInvitation,
  updateInvitation,
  removeInvitation,
  setCurrentInvitation,
  setBatches,
  addBatch,
  updateBatch,
  setCurrentBatch,
  setFilters,
  updateFilters,
  clearFilters,
  setPagination,
  setStats,
  setLoading,
  setCreating,
  setSending,
  setUpdating,
  addRealtimeEvent,
  clearRealtimeEvents,
  addBackgroundTask,
  updateBackgroundTask,
  removeBackgroundTask,
  setError,
  clearError,
  setValidationErrors,
  clearValidationErrors,
  bulkUpdateInvitations,
  bulkDeleteInvitations,
  updateInvitationStatus,
  resetState
} = invitationSlice.actions

export const invitationReducer = invitationSlice.reducer