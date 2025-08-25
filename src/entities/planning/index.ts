/**
 * Planning Entity Public API
 * 
 * This module exports all public interfaces for the planning domain
 * Following FSD architecture principles - only public API exposed
 */

// ===== TYPES & INTERFACES =====
// Core domain types
export type {
  VideoPlan,
  PlanSection,
  PlanVersion,
  PlanCollaborator,
  PlanTemplate,
  PlanComment,
  PlanAttachment
} from './model/types'

// Enum types
export type {
  PlanStatus,
  PlanType,
  PlanPriority,
  SectionType,
  CollaboratorRole
} from './model/types'

// Request/Response types
export type {
  CreatePlanRequest,
  UpdatePlanRequest,
  PlanFilters,
  PlanSortOptions,
  PlanListResponse,
  PlanStats
} from './model/types'

// Event types for real-time communication
export type {
  PlanEvent
} from './model/types'

// Validation types
export type {
  PlanValidationRule
} from './model/types'

// ===== CONSTANTS =====
export {
  PLAN_DEFAULTS,
  PLAN_LIMITS,
  SECTION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  PLAN_INDUSTRIES,
  PLAN_VALIDATION_RULES
} from './model/types'

// ===== REDUX STATE MANAGEMENT =====
// Redux slice exports
export {
  planningReducer,
  // Actions
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
} from './model/planning.slice'

// Redux selectors
export {
  selectPlans,
  selectCurrentPlan,
  selectSelectedPlanIds,
  selectIsLoading,
  selectIsSaving,
  selectIsCreating,
  selectError,
  selectEditor,
  selectFilters,
  selectActiveFilters,
  selectSearchTerm,
  selectPagination,
  selectPlanStats,
  selectPlanById,
  selectPlansByStatus,
  selectPlansByType,
  selectFilteredPlans,
  selectSelectedPlans,
  selectHasUnsavedChanges,
  selectIsEditing,
  selectActiveCollaborators
} from './model/planning.slice'

// State interface for typing
export type {
  PlanningState
} from './model/planning.slice'

// ===== API COMMUNICATION =====
// Note: API modules would be implemented here when needed
// export { planningApi } from './api/planning.api'

// ===== UTILITY FUNCTIONS =====
// Note: Utility functions would be implemented here when needed
// export { validatePlan, formatPlanDate } from './lib/validation'
// export { calculatePlanProgress, getPlanCompletionScore } from './lib/utils'

// ===== HOOKS (for React components) =====
// Note: Custom hooks would be implemented here when needed
// export { usePlan, usePlanList, usePlanEditor } from './model/hooks'