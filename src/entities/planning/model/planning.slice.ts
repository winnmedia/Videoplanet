import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/shared/lib/store'
import {
  VideoPlan,
  PlanStatus,
  PlanType,
  PlanPriority,
  PlanSection,
  PlanCollaborator,
  PlanVersion,
  PlanFilters,
  PlanSortOptions,
  PLAN_DEFAULTS
} from './types'

// Planning State Interface
export interface PlanningState {
  // Plan management
  plans: VideoPlan[]
  currentPlan: VideoPlan | null
  selectedPlanIds: string[]
  
  // UI state
  isLoading: boolean
  isSaving: boolean
  isCreating: boolean
  error: string | null
  
  // List management
  filters: PlanFilters
  sortOptions: PlanSortOptions
  pagination: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
  
  // Search and filtering
  searchTerm: string
  activeFilters: {
    status: PlanStatus[]
    type: PlanType[]
    priority: PlanPriority[]
    collaborators: number[]
    tags: string[]
    dateRange?: {
      from: string
      to: string
    }
  }
  
  // Editor state
  editor: {
    isEditing: boolean
    editingPlanId: string | null
    editingSectionId: string | null
    hasUnsavedChanges: boolean
    lastSaved: string | null
    autoSaveEnabled: boolean
    focusedElement: string | null
  }
  
  // Collaboration state
  collaboration: {
    activeCollaborators: {
      planId: string
      collaborators: {
        userId: number
        userName: string
        lastSeen: string
        currentSection?: string
      }[]
    }[]
    realtimeUpdates: {
      planId: string
      updates: {
        type: 'content' | 'section' | 'collaborator'
        userId: number
        timestamp: string
        data: any
      }[]
    }[]
  }
  
  // Template state
  templates: {
    available: any[] // PlanTemplate[]
    favorites: string[]
    recent: string[]
  }
  
  // Analytics
  analytics: {
    planStats: {
      totalPlans: number
      byStatus: Record<PlanStatus, number>
      byType: Record<PlanType, number>
      recentActivity: {
        planId: string
        planTitle: string
        lastActivity: string
        activityType: string
      }[]
    } | null
    isLoadingStats: boolean
  }
}

// Initial State
const initialState: PlanningState = {
  plans: [],
  currentPlan: null,
  selectedPlanIds: [],
  
  isLoading: false,
  isSaving: false,
  isCreating: false,
  error: null,
  
  filters: {},
  sortOptions: {
    field: 'updatedAt',
    direction: 'desc'
  },
  pagination: {
    page: 1,
    pageSize: PLAN_DEFAULTS.PAGE_SIZE,
    total: 0,
    hasMore: false
  },
  
  searchTerm: '',
  activeFilters: {
    status: [],
    type: [],
    priority: [],
    collaborators: [],
    tags: []
  },
  
  editor: {
    isEditing: false,
    editingPlanId: null,
    editingSectionId: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    autoSaveEnabled: PLAN_DEFAULTS.SETTINGS.autoSave,
    focusedElement: null
  },
  
  collaboration: {
    activeCollaborators: [],
    realtimeUpdates: []
  },
  
  templates: {
    available: [],
    favorites: [],
    recent: []
  },
  
  analytics: {
    planStats: null,
    isLoadingStats: false
  }
}

// Planning Slice
const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    // Plan CRUD operations
    setPlans: (state, action: PayloadAction<VideoPlan[]>) => {
      state.plans = action.payload
      state.error = null
      state.isLoading = false
    },
    
    addPlan: (state, action: PayloadAction<VideoPlan>) => {
      state.plans.unshift(action.payload)
      state.analytics.planStats = null // Reset stats to trigger refresh
    },
    
    updatePlan: (state, action: PayloadAction<{ id: string; updates: Partial<VideoPlan> }>) => {
      const index = state.plans.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.plans[index] = { ...state.plans[index], ...action.payload.updates }
        
        // Update current plan if it's the same
        if (state.currentPlan?.id === action.payload.id) {
          state.currentPlan = { ...state.currentPlan, ...action.payload.updates }
        }
      }
    },
    
    removePlan: (state, action: PayloadAction<string>) => {
      state.plans = state.plans.filter(p => p.id !== action.payload)
      
      // Clear current plan if it was deleted
      if (state.currentPlan?.id === action.payload) {
        state.currentPlan = null
        state.editor.isEditing = false
        state.editor.editingPlanId = null
      }
      
      // Remove from selected plans
      state.selectedPlanIds = state.selectedPlanIds.filter(id => id !== action.payload)
      
      state.analytics.planStats = null
    },
    
    setCurrentPlan: (state, action: PayloadAction<VideoPlan | null>) => {
      state.currentPlan = action.payload
      if (action.payload) {
        state.editor.editingPlanId = action.payload.id
      }
    },
    
    // Plan selection
    selectPlan: (state, action: PayloadAction<string>) => {
      if (!state.selectedPlanIds.includes(action.payload)) {
        state.selectedPlanIds.push(action.payload)
      }
    },
    
    deselectPlan: (state, action: PayloadAction<string>) => {
      state.selectedPlanIds = state.selectedPlanIds.filter(id => id !== action.payload)
    },
    
    selectAllPlans: (state) => {
      state.selectedPlanIds = state.plans.map(p => p.id)
    },
    
    deselectAllPlans: (state) => {
      state.selectedPlanIds = []
    },
    
    // Section operations
    updateSection: (state, action: PayloadAction<{ 
      planId: string; 
      sectionId: string; 
      updates: Partial<PlanSection> 
    }>) => {
      const { planId, sectionId, updates } = action.payload
      
      // Update in plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        const sectionIndex = state.plans[planIndex].sections.findIndex(s => s.id === sectionId)
        if (sectionIndex !== -1) {
          state.plans[planIndex].sections[sectionIndex] = {
            ...state.plans[planIndex].sections[sectionIndex],
            ...updates
          }
        }
      }
      
      // Update in current plan
      if (state.currentPlan?.id === planId) {
        const sectionIndex = state.currentPlan.sections.findIndex(s => s.id === sectionId)
        if (sectionIndex !== -1) {
          state.currentPlan.sections[sectionIndex] = {
            ...state.currentPlan.sections[sectionIndex],
            ...updates
          }
        }
      }
      
      state.editor.hasUnsavedChanges = true
    },
    
    addSection: (state, action: PayloadAction<{ planId: string; section: PlanSection }>) => {
      const { planId, section } = action.payload
      
      // Add to plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        state.plans[planIndex].sections.push(section)
      }
      
      // Add to current plan
      if (state.currentPlan?.id === planId) {
        state.currentPlan.sections.push(section)
      }
      
      state.editor.hasUnsavedChanges = true
    },
    
    removeSection: (state, action: PayloadAction<{ planId: string; sectionId: string }>) => {
      const { planId, sectionId } = action.payload
      
      // Remove from plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        state.plans[planIndex].sections = state.plans[planIndex].sections.filter(
          s => s.id !== sectionId
        )
      }
      
      // Remove from current plan
      if (state.currentPlan?.id === planId) {
        state.currentPlan.sections = state.currentPlan.sections.filter(s => s.id !== sectionId)
      }
      
      state.editor.hasUnsavedChanges = true
    },
    
    reorderSections: (state, action: PayloadAction<{ 
      planId: string; 
      sectionIds: string[] 
    }>) => {
      const { planId, sectionIds } = action.payload
      
      const reorderPlanSections = (sections: PlanSection[]) => {
        return sectionIds
          .map(id => sections.find(s => s.id === id))
          .filter(Boolean) as PlanSection[]
      }
      
      // Reorder in plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        state.plans[planIndex].sections = reorderPlanSections(state.plans[planIndex].sections)
      }
      
      // Reorder in current plan
      if (state.currentPlan?.id === planId) {
        state.currentPlan.sections = reorderPlanSections(state.currentPlan.sections)
      }
      
      state.editor.hasUnsavedChanges = true
    },
    
    // Editor state management
    startEditing: (state, action: PayloadAction<{ planId: string; sectionId?: string }>) => {
      state.editor.isEditing = true
      state.editor.editingPlanId = action.payload.planId
      state.editor.editingSectionId = action.payload.sectionId || null
    },
    
    stopEditing: (state) => {
      state.editor.isEditing = false
      state.editor.editingPlanId = null
      state.editor.editingSectionId = null
      state.editor.hasUnsavedChanges = false
    },
    
    setUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.editor.hasUnsavedChanges = action.payload
    },
    
    setSaved: (state) => {
      state.editor.hasUnsavedChanges = false
      state.editor.lastSaved = new Date().toISOString()
      state.isSaving = false
    },
    
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.editor.autoSaveEnabled = action.payload
    },
    
    setFocusedElement: (state, action: PayloadAction<string | null>) => {
      state.editor.focusedElement = action.payload
    },
    
    // Collaboration
    updateActiveCollaborators: (state, action: PayloadAction<{
      planId: string
      collaborators: PlanningState['collaboration']['activeCollaborators'][0]['collaborators']
    }>) => {
      const { planId, collaborators } = action.payload
      const index = state.collaboration.activeCollaborators.findIndex(ac => ac.planId === planId)
      
      if (index !== -1) {
        state.collaboration.activeCollaborators[index].collaborators = collaborators
      } else {
        state.collaboration.activeCollaborators.push({ planId, collaborators })
      }
    },
    
    addCollaborator: (state, action: PayloadAction<{ 
      planId: string; 
      collaborator: PlanCollaborator 
    }>) => {
      const { planId, collaborator } = action.payload
      
      // Add to plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        state.plans[planIndex].collaborators.push(collaborator)
      }
      
      // Add to current plan
      if (state.currentPlan?.id === planId) {
        state.currentPlan.collaborators.push(collaborator)
      }
    },
    
    removeCollaborator: (state, action: PayloadAction<{ 
      planId: string; 
      userId: number 
    }>) => {
      const { planId, userId } = action.payload
      
      // Remove from plans array
      const planIndex = state.plans.findIndex(p => p.id === planId)
      if (planIndex !== -1) {
        state.plans[planIndex].collaborators = state.plans[planIndex].collaborators.filter(
          c => c.userId !== userId
        )
      }
      
      // Remove from current plan
      if (state.currentPlan?.id === planId) {
        state.currentPlan.collaborators = state.currentPlan.collaborators.filter(
          c => c.userId !== userId
        )
      }
    },
    
    // Filtering and sorting
    setFilters: (state, action: PayloadAction<Partial<PlanFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    setActiveFilters: (state, action: PayloadAction<Partial<PlanningState['activeFilters']>>) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = {}
      state.activeFilters = {
        status: [],
        type: [],
        priority: [],
        collaborators: [],
        tags: []
      }
    },
    
    setSortOptions: (state, action: PayloadAction<PlanSortOptions>) => {
      state.sortOptions = action.payload
    },
    
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<PlanningState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload
    },
    
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
      state.isSaving = false
      state.isCreating = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    // Analytics
    setPlanStats: (state, action: PayloadAction<PlanningState['analytics']['planStats']>) => {
      state.analytics.planStats = action.payload
      state.analytics.isLoadingStats = false
    },
    
    setLoadingStats: (state, action: PayloadAction<boolean>) => {
      state.analytics.isLoadingStats = action.payload
    },
    
    // Bulk operations
    bulkUpdatePlans: (state, action: PayloadAction<{
      planIds: string[]
      updates: Partial<VideoPlan>
    }>) => {
      const { planIds, updates } = action.payload
      
      planIds.forEach(planId => {
        const index = state.plans.findIndex(p => p.id === planId)
        if (index !== -1) {
          state.plans[index] = { ...state.plans[index], ...updates }
        }
      })
      
      state.analytics.planStats = null
    },
    
    bulkDeletePlans: (state, action: PayloadAction<string[]>) => {
      const planIds = action.payload
      state.plans = state.plans.filter(p => !planIds.includes(p.id))
      state.selectedPlanIds = state.selectedPlanIds.filter(id => !planIds.includes(id))
      
      // Clear current plan if deleted
      if (state.currentPlan && planIds.includes(state.currentPlan.id)) {
        state.currentPlan = null
        state.editor.isEditing = false
        state.editor.editingPlanId = null
      }
      
      state.analytics.planStats = null
    },
    
    // Reset state
    resetPlanningState: () => initialState
  }
})

// Actions
export const {
  setPlans,
  addPlan,
  updatePlan,
  removePlan,
  setCurrentPlan,
  selectPlan,
  deselectPlan,
  selectAllPlans,
  deselectAllPlans,
  updateSection,
  addSection,
  removeSection,
  reorderSections,
  startEditing,
  stopEditing,
  setUnsavedChanges,
  setSaved,
  setAutoSave,
  setFocusedElement,
  updateActiveCollaborators,
  addCollaborator,
  removeCollaborator,
  setFilters,
  setActiveFilters,
  clearFilters,
  setSortOptions,
  setSearchTerm,
  setPagination,
  setLoading,
  setSaving,
  setCreating,
  setError,
  clearError,
  setPlanStats,
  setLoadingStats,
  bulkUpdatePlans,
  bulkDeletePlans,
  resetPlanningState
} = planningSlice.actions

// Selectors
export const selectPlans = (state: RootState) => state.planning?.plans || []
export const selectCurrentPlan = (state: RootState) => state.planning?.currentPlan
export const selectSelectedPlanIds = (state: RootState) => state.planning?.selectedPlanIds || []
export const selectIsLoading = (state: RootState) => state.planning?.isLoading || false
export const selectIsSaving = (state: RootState) => state.planning?.isSaving || false
export const selectIsCreating = (state: RootState) => state.planning?.isCreating || false
export const selectError = (state: RootState) => state.planning?.error
export const selectEditor = (state: RootState) => state.planning?.editor
export const selectFilters = (state: RootState) => state.planning?.filters || {}
export const selectActiveFilters = (state: RootState) => state.planning?.activeFilters
export const selectSearchTerm = (state: RootState) => state.planning?.searchTerm || ''
export const selectPagination = (state: RootState) => state.planning?.pagination
export const selectPlanStats = (state: RootState) => state.planning?.analytics.planStats

// Complex selectors
export const selectPlanById = createSelector(
  [selectPlans, (state: RootState, planId: string) => planId],
  (plans, planId) => plans.find(plan => plan.id === planId)
)

export const selectPlansByStatus = createSelector(
  [selectPlans, (state: RootState, status: PlanStatus) => status],
  (plans, status) => plans.filter(plan => plan.status === status)
)

export const selectPlansByType = createSelector(
  [selectPlans, (state: RootState, type: PlanType) => type],
  (plans, type) => plans.filter(plan => plan.type === type)
)

export const selectFilteredPlans = createSelector(
  [selectPlans, selectActiveFilters, selectSearchTerm],
  (plans, filters, searchTerm) => {
    let filtered = plans
    
    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(plan => filters.status.includes(plan.status))
    }
    
    // Apply type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(plan => filters.type.includes(plan.type))
    }
    
    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(plan => filters.priority.includes(plan.priority))
    }
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(plan =>
        plan.title.toLowerCase().includes(search) ||
        plan.description?.toLowerCase().includes(search) ||
        plan.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }
    
    return filtered
  }
)

export const selectSelectedPlans = createSelector(
  [selectPlans, selectSelectedPlanIds],
  (plans, selectedIds) => plans.filter(plan => selectedIds.includes(plan.id))
)

export const selectHasUnsavedChanges = createSelector(
  [selectEditor],
  (editor) => editor?.hasUnsavedChanges || false
)

export const selectIsEditing = createSelector(
  [selectEditor],
  (editor) => editor?.isEditing || false
)

export const selectActiveCollaborators = createSelector(
  [(state: RootState) => state.planning?.collaboration.activeCollaborators, 
   (state: RootState, planId: string) => planId],
  (activeCollaborators, planId) => 
    activeCollaborators?.find(ac => ac.planId === planId)?.collaborators || []
)

// Reducer
export const planningReducer = planningSlice.reducer