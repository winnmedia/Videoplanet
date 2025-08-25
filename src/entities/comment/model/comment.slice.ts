import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import { Comment, CommentDraft, CommentTemplate, CommentStats, CommentEvent, TypingIndicator, CommentFilters, CommentSortOptions } from './types'

// Entity adapters for normalized state management
const commentAdapter = createEntityAdapter<Comment>({
  selectId: (comment) => comment.id,
  sortComparer: (a, b) => {
    // Sort by timestamp first (for video comments), then by creation date
    if (a.timestamp !== undefined && b.timestamp !== undefined) {
      return a.timestamp - b.timestamp
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }
})

const draftAdapter = createEntityAdapter<CommentDraft>({
  selectId: (draft) => draft.id,
  sortComparer: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
})

const templateAdapter = createEntityAdapter<CommentTemplate>({
  selectId: (template) => template.id,
  sortComparer: (a, b) => b.usageCount - a.usageCount
})

interface CommentState {
  // Entity collections
  comments: ReturnType<typeof commentAdapter.getInitialState>
  drafts: ReturnType<typeof draftAdapter.getInitialState>
  templates: ReturnType<typeof templateAdapter.getInitialState>
  
  // Thread management
  threads: Record<string, {
    id: string
    rootCommentId: string
    commentIds: string[]
    isCollapsed: boolean
    lastActivityAt: string
    participantCount: number
  }>
  
  // Current selections
  currentComment: string | null
  currentThread: string | null
  selectedComments: string[]
  
  // Filters and pagination
  filters: CommentFilters
  sort: CommentSortOptions
  pagination: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
  
  // Statistics
  stats: CommentStats | null
  
  // Real-time features
  typingIndicators: TypingIndicator[]
  realtimeEvents: CommentEvent[]
  
  // UI state
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Editor state
  activeEditor: {
    commentId: string | null
    parentId: string | null
    videoTimestamp: number | null
    videoRegion: Comment['videoRegion'] | null
    content: string
    isDraft: boolean
    lastSaved: string | null
  } | null
  
  // Emotion analysis
  emotionAnalysis: {
    isAnalyzing: boolean
    results: Record<string, {
      emotions: Comment['emotions']
      sentimentScore: number
      confidence: number
    }>
  }
  
  // Moderation
  moderationQueue: {
    flaggedComments: string[]
    pendingReviews: string[]
    aiSuggestions: {
      commentId: string
      suggestions: {
        type: 'duplicate' | 'inappropriate' | 'spam' | 'off_topic'
        confidence: number
        details: string
      }[]
    }[]
  }
  
  // Search and discovery
  searchResults: {
    query: string
    results: string[]
    total: number
    isSearching: boolean
  }
  
  // Error handling
  error: string | null
  validationErrors: Record<string, string[]>
  
  // Performance optimization
  virtualization: {
    visibleRange: { start: number; end: number }
    totalHeight: number
    itemHeight: number
  }
}

const initialState: CommentState = {
  comments: commentAdapter.getInitialState(),
  drafts: draftAdapter.getInitialState(),
  templates: templateAdapter.getInitialState(),
  threads: {},
  currentComment: null,
  currentThread: null,
  selectedComments: [],
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    hasMore: false
  },
  stats: null,
  typingIndicators: [],
  realtimeEvents: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  activeEditor: null,
  emotionAnalysis: {
    isAnalyzing: false,
    results: {}
  },
  moderationQueue: {
    flaggedComments: [],
    pendingReviews: [],
    aiSuggestions: []
  },
  searchResults: {
    query: '',
    results: [],
    total: 0,
    isSearching: false
  },
  error: null,
  validationErrors: {},
  virtualization: {
    visibleRange: { start: 0, end: 50 },
    totalHeight: 0,
    itemHeight: 100
  }
}

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    // Comment CRUD operations
    setComments: (state, action: PayloadAction<{ comments: Comment[]; total: number; page: number; hasMore: boolean }>) => {
      commentAdapter.setAll(state.comments, action.payload.comments)
      state.pagination = {
        ...state.pagination,
        total: action.payload.total,
        page: action.payload.page,
        hasMore: action.payload.hasMore
      }
      
      // Update threads
      action.payload.comments.forEach(comment => {
        if (!comment.parentId) {
          // Root comment - create or update thread
          state.threads[comment.id] = {
            id: comment.id,
            rootCommentId: comment.id,
            commentIds: [comment.id, ...comment.childrenIds],
            isCollapsed: false,
            lastActivityAt: comment.lastActivityAt,
            participantCount: 1
          }
        }
      })
      
      state.error = null
    },
    
    addComment: (state, action: PayloadAction<Comment>) => {
      const comment = action.payload
      commentAdapter.addOne(state.comments, comment)
      state.pagination.total += 1
      
      // Update thread
      if (comment.parentId) {
        // Reply - add to existing thread
        const parentComment = state.comments.entities[comment.parentId]
        if (parentComment) {
          const threadId = parentComment.threadId || parentComment.id
          if (state.threads[threadId]) {
            state.threads[threadId].commentIds.push(comment.id)
            state.threads[threadId].lastActivityAt = comment.createdAt
            state.threads[threadId].participantCount += 1
          }
        }
      } else {
        // Root comment - create new thread
        state.threads[comment.id] = {
          id: comment.id,
          rootCommentId: comment.id,
          commentIds: [comment.id],
          isCollapsed: false,
          lastActivityAt: comment.createdAt,
          participantCount: 1
        }
      }
    },
    
    updateComment: (state, action: PayloadAction<{ id: string; changes: Partial<Comment> }>) => {
      commentAdapter.updateOne(state.comments, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString()
        }
      })
      
      // Update thread last activity
      const comment = state.comments.entities[action.payload.id]
      if (comment) {
        const threadId = comment.threadId || comment.id
        if (state.threads[threadId]) {
          state.threads[threadId].lastActivityAt = new Date().toISOString()
        }
      }
    },
    
    removeComment: (state, action: PayloadAction<string>) => {
      const comment = state.comments.entities[action.payload]
      if (comment) {
        // Remove from thread
        const threadId = comment.threadId || comment.id
        if (state.threads[threadId]) {
          state.threads[threadId].commentIds = state.threads[threadId].commentIds.filter(id => id !== action.payload)
          if (state.threads[threadId].commentIds.length === 0) {
            delete state.threads[threadId]
          }
        }
      }
      
      commentAdapter.removeOne(state.comments, action.payload)
      state.pagination.total -= 1
      
      if (state.currentComment === action.payload) {
        state.currentComment = null
      }
      state.selectedComments = state.selectedComments.filter(id => id !== action.payload)
    },
    
    // Thread management
    toggleThread: (state, action: PayloadAction<string>) => {
      if (state.threads[action.payload]) {
        state.threads[action.payload].isCollapsed = !state.threads[action.payload].isCollapsed
      }
    },
    
    setCurrentThread: (state, action: PayloadAction<string | null>) => {
      state.currentThread = action.payload
    },
    
    // Selection management
    setCurrentComment: (state, action: PayloadAction<string | null>) => {
      state.currentComment = action.payload
    },
    
    toggleCommentSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedComments.indexOf(action.payload)
      if (index >= 0) {
        state.selectedComments.splice(index, 1)
      } else {
        state.selectedComments.push(action.payload)
      }
    },
    
    clearSelection: (state) => {
      state.selectedComments = []
    },
    
    selectAllComments: (state) => {
      state.selectedComments = commentAdapter.getSelectors().selectIds(state.comments) as string[]
    },
    
    // Filters and sorting
    setFilters: (state, action: PayloadAction<CommentFilters>) => {
      state.filters = action.payload
      state.pagination.page = 1
    },
    
    updateFilters: (state, action: PayloadAction<Partial<CommentFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1
    },
    
    setSort: (state, action: PayloadAction<CommentSortOptions>) => {
      state.sort = action.payload
      state.pagination.page = 1
    },
    
    // Statistics
    setStats: (state, action: PayloadAction<CommentStats>) => {
      state.stats = action.payload
    },
    
    // Real-time features
    addTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const existing = state.typingIndicators.findIndex(
        indicator => indicator.userId === action.payload.userId && indicator.projectId === action.payload.projectId
      )
      if (existing >= 0) {
        state.typingIndicators[existing] = action.payload
      } else {
        state.typingIndicators.push(action.payload)
      }
    },
    
    removeTypingIndicator: (state, action: PayloadAction<{ userId: number; projectId: number }>) => {
      state.typingIndicators = state.typingIndicators.filter(
        indicator => !(indicator.userId === action.payload.userId && indicator.projectId === action.payload.projectId)
      )
    },
    
    addRealtimeEvent: (state, action: PayloadAction<CommentEvent>) => {
      state.realtimeEvents.unshift(action.payload)
      // Keep only last 100 events
      if (state.realtimeEvents.length > 100) {
        state.realtimeEvents = state.realtimeEvents.slice(0, 100)
      }
      
      // Update comment if it exists
      if (action.payload.commentId && action.payload.data) {
        const comment = state.comments.entities[action.payload.commentId]
        if (comment) {
          commentAdapter.updateOne(state.comments, {
            id: action.payload.commentId,
            changes: action.payload.data
          })
        }
      }
    },
    
    // Editor state
    setActiveEditor: (state, action: PayloadAction<CommentState['activeEditor']>) => {
      state.activeEditor = action.payload
    },
    
    updateEditorContent: (state, action: PayloadAction<string>) => {
      if (state.activeEditor) {
        state.activeEditor.content = action.payload
        state.activeEditor.lastSaved = null // Mark as unsaved
      }
    },
    
    saveEditorDraft: (state) => {
      if (state.activeEditor) {
        state.activeEditor.isDraft = true
        state.activeEditor.lastSaved = new Date().toISOString()
      }
    },
    
    // Draft management
    setDrafts: (state, action: PayloadAction<CommentDraft[]>) => {
      draftAdapter.setAll(state.drafts, action.payload)
    },
    
    addDraft: (state, action: PayloadAction<CommentDraft>) => {
      draftAdapter.addOne(state.drafts, action.payload)
    },
    
    updateDraft: (state, action: PayloadAction<{ id: string; changes: Partial<CommentDraft> }>) => {
      draftAdapter.updateOne(state.drafts, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString()
        }
      })
    },
    
    removeDraft: (state, action: PayloadAction<string>) => {
      draftAdapter.removeOne(state.drafts, action.payload)
    },
    
    // Template management
    setTemplates: (state, action: PayloadAction<CommentTemplate[]>) => {
      templateAdapter.setAll(state.templates, action.payload)
    },
    
    addTemplate: (state, action: PayloadAction<CommentTemplate>) => {
      templateAdapter.addOne(state.templates, action.payload)
    },
    
    updateTemplate: (state, action: PayloadAction<{ id: string; changes: Partial<CommentTemplate> }>) => {
      templateAdapter.updateOne(state.templates, {
        id: action.payload.id,
        changes: action.payload.changes
      })
    },
    
    incrementTemplateUsage: (state, action: PayloadAction<string>) => {
      const template = state.templates.entities[action.payload]
      if (template) {
        templateAdapter.updateOne(state.templates, {
          id: action.payload,
          changes: { usageCount: template.usageCount + 1 }
        })
      }
    },
    
    // Reactions
    addReaction: (state, action: PayloadAction<{ commentId: string; reaction: Comment['reactions'][0] }>) => {
      const comment = state.comments.entities[action.payload.commentId]
      if (comment) {
        const updatedReactions = [...comment.reactions, action.payload.reaction]
        const updatedCounts = { ...comment.reactionCounts }
        updatedCounts[action.payload.reaction.type] = (updatedCounts[action.payload.reaction.type] || 0) + 1
        
        commentAdapter.updateOne(state.comments, {
          id: action.payload.commentId,
          changes: {
            reactions: updatedReactions,
            reactionCounts: updatedCounts,
            lastActivityAt: new Date().toISOString()
          }
        })
      }
    },
    
    removeReaction: (state, action: PayloadAction<{ commentId: string; reactionId: string; reactionType: Comment['reactions'][0]['type'] }>) => {
      const comment = state.comments.entities[action.payload.commentId]
      if (comment) {
        const updatedReactions = comment.reactions.filter(r => r.id !== action.payload.reactionId)
        const updatedCounts = { ...comment.reactionCounts }
        updatedCounts[action.payload.reactionType] = Math.max(0, (updatedCounts[action.payload.reactionType] || 0) - 1)
        
        commentAdapter.updateOne(state.comments, {
          id: action.payload.commentId,
          changes: {
            reactions: updatedReactions,
            reactionCounts: updatedCounts
          }
        })
      }
    },
    
    // Emotion analysis
    setEmotionAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.emotionAnalysis.isAnalyzing = action.payload
    },
    
    setEmotionResults: (state, action: PayloadAction<{ commentId: string; emotions: Comment['emotions']; sentimentScore: number; confidence: number }>) => {
      state.emotionAnalysis.results[action.payload.commentId] = {
        emotions: action.payload.emotions,
        sentimentScore: action.payload.sentimentScore,
        confidence: action.payload.confidence
      }
      
      // Update comment with emotion data
      commentAdapter.updateOne(state.comments, {
        id: action.payload.commentId,
        changes: {
          emotions: action.payload.emotions,
          sentimentScore: action.payload.sentimentScore
        }
      })
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchResults.query = action.payload
      state.searchResults.isSearching = true
    },
    
    setSearchResults: (state, action: PayloadAction<{ results: string[]; total: number }>) => {
      state.searchResults.results = action.payload.results
      state.searchResults.total = action.payload.total
      state.searchResults.isSearching = false
    },
    
    // Moderation
    flagComment: (state, action: PayloadAction<{ commentId: string; reason: string }>) => {
      state.moderationQueue.flaggedComments.push(action.payload.commentId)
      commentAdapter.updateOne(state.comments, {
        id: action.payload.commentId,
        changes: {
          isFlagged: true,
          flagReason: action.payload.reason
        }
      })
    },
    
    // UI state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload
    },
    
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.isUpdating = action.payload
    },
    
    setDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
      state.isCreating = false
      state.isUpdating = false
      state.isDeleting = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    setValidationErrors: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.validationErrors = action.payload
    },
    
    // Virtualization
    setVirtualization: (state, action: PayloadAction<Partial<CommentState['virtualization']>>) => {
      state.virtualization = { ...state.virtualization, ...action.payload }
    },
    
    // Reset
    resetState: () => initialState
  }
})

// Selectors using entity adapter selectors
export const {
  selectAll: selectAllComments,
  selectById: selectCommentById,
  selectIds: selectCommentIds,
  selectEntities: selectCommentEntities,
  selectTotal: selectTotalComments
} = commentAdapter.getSelectors((state: { comment: CommentState }) => state.comment.comments)

export const {
  selectAll: selectAllDrafts,
  selectById: selectDraftById,
  selectIds: selectDraftIds,
  selectEntities: selectDraftEntities
} = draftAdapter.getSelectors((state: { comment: CommentState }) => state.comment.drafts)

export const {
  selectAll: selectAllTemplates,
  selectById: selectTemplateById,
  selectIds: selectTemplateIds,
  selectEntities: selectTemplateEntities
} = templateAdapter.getSelectors((state: { comment: CommentState }) => state.comment.templates)

// Custom selectors
export const selectCurrentComment = (state: { comment: CommentState }) => {
  if (!state.comment.currentComment) return null
  return selectCommentById(state, state.comment.currentComment)
}

export const selectThreadComments = (state: { comment: CommentState }, threadId: string) => {
  const thread = state.comment.threads[threadId]
  if (!thread) return []
  return thread.commentIds.map(id => state.comment.comments.entities[id]).filter(Boolean) as Comment[]
}

export const selectRootComments = (state: { comment: CommentState }) => {
  return selectAllComments(state).filter(comment => !comment.parentId)
}

export const selectCommentReplies = (state: { comment: CommentState }, commentId: string) => {
  return selectAllComments(state).filter(comment => comment.parentId === commentId)
}

export const selectTypingUsers = (state: { comment: CommentState }, projectId: number) => {
  return state.comment.typingIndicators.filter(indicator => indicator.projectId === projectId)
}

export const selectFlaggedComments = (state: { comment: CommentState }) => {
  return state.comment.moderationQueue.flaggedComments.map(id => state.comment.comments.entities[id]).filter(Boolean) as Comment[]
}

export const {
  setComments,
  addComment,
  updateComment,
  removeComment,
  toggleThread,
  setCurrentThread,
  setCurrentComment,
  toggleCommentSelection,
  clearSelection,
  selectAllComments: selectAllCommentsAction,
  setFilters,
  updateFilters,
  setSort,
  setStats,
  addTypingIndicator,
  removeTypingIndicator,
  addRealtimeEvent,
  setActiveEditor,
  updateEditorContent,
  saveEditorDraft,
  setDrafts,
  addDraft,
  updateDraft,
  removeDraft,
  setTemplates,
  addTemplate,
  updateTemplate,
  incrementTemplateUsage,
  addReaction,
  removeReaction,
  setEmotionAnalyzing,
  setEmotionResults,
  setSearchQuery,
  setSearchResults,
  flagComment,
  setLoading,
  setCreating,
  setUpdating,
  setDeleting,
  setError,
  clearError,
  setValidationErrors,
  setVirtualization,
  resetState
} = commentSlice.actions

export const commentReducer = commentSlice.reducer