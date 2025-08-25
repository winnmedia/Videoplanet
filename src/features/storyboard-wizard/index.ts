/**
 * Storyboard Wizard Feature Public API
 * FSD 아키텍처의 Feature 레이어 Public API
 */

// UI 컴포넌트 exports
export { default as StoryInputForm } from './ui/StoryInputForm'

// Redux slice exports
export {
  // 액션들
  setCurrentStep,
  nextStep,
  prevStep,
  updateFormField,
  toggleTone,
  toggleGenre,
  setFormData,
  showValidationErrors,
  clearValidationErrors,
  setFieldTouched,
  markAsSaved,
  markAsDirty,
  setAutoSaveEnabled,
  setStepCompleted,
  resetWizard,
  applyTemplate,
  
  // 선택자들
  selectWizardCurrentStep,
  selectWizardFormData,
  selectWizardValidation,
  selectWizardNavigation,
  selectWizardSaveState,
  selectFieldError,
  selectFormField,
  selectWizardProgress
} from './model/wizard.slice'

// 기본 리듀서
export { default as wizardReducer } from './model/wizard.slice'