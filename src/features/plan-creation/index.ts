/**
 * Plan Creation Feature Public API
 * 
 * This module exports all public components and hooks for the plan creation feature
 * Following FSD architecture principles - only UI components and hooks exposed
 */

// ===== UI COMPONENTS =====
export { PlanCreationForm } from './ui/PlanCreationForm'

// Additional components that would be implemented:
// export { TemplateSelector } from './ui/TemplateSelector'
// export { SectionBuilder } from './ui/SectionBuilder'
// export { PlanCreationModal } from './ui/PlanCreationModal'
// export { PlanCreationWizard } from './ui/PlanCreationWizard'

// Step components
// export { BasicInfoStep } from './ui/steps/BasicInfoStep'
// export { TemplateSelectionStep } from './ui/steps/TemplateSelectionStep'
// export { CollaborationStep } from './ui/steps/CollaborationStep'
// export { ReviewStep } from './ui/steps/ReviewStep'

// ===== CUSTOM HOOKS =====
// Note: Custom hooks would be implemented when needed
// export { usePlanCreation } from './model/hooks'
// export { useTemplateSelection } from './model/hooks'
// export { useSectionBuilder } from './model/hooks'
// export { useCreationValidation } from './model/hooks'
// export { useCreationDraft } from './model/hooks'

// ===== REDUX SELECTORS & ACTIONS (for advanced usage) =====
// Generally, features shouldn't expose their internal state management,
// but sometimes it's needed for complex integrations

export {
  // Selectors
  selectCreationState,
  selectCurrentStep,
  selectFormData,
  selectSelectedTemplate,
  selectSectionConfiguration,
  selectValidation,
  selectIsCreating,
  selectCreationError,
  selectPreview,
  selectDraftState,
  selectIsStepValid,
  selectCanProceedToNextStep,
  selectCreationProgress,
  
  // Actions (for programmatic control)
  nextStep,
  previousStep,
  setStep,
  updateFormData,
  selectTemplate,
  clearTemplate,
  startCreation,
  completeCreation,
  resetCreation
} from './model/creation.slice'

// State type for advanced TypeScript usage
export type { PlanCreationState } from './model/creation.slice'

// Reducer export for store integration
export { planCreationReducer } from './model/creation.slice'