import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/shared/lib/store'
import {
  PlanType,
  PlanPriority,
  PlanSection,
  SectionType,
  SECTION_TEMPLATES,
  PLAN_DEFAULTS
} from '@/entities/planning'

// Plan Creation State
export interface PlanCreationState {
  // Creation wizard state
  currentStep: number
  totalSteps: number
  isCreating: boolean
  
  // Form data
  formData: {
    title: string
    description: string
    type: PlanType
    priority: PlanPriority
    projectId?: number
    templateId?: string
    collaborators: {
      userId: number
      role: 'owner' | 'editor' | 'reviewer' | 'viewer'
    }[]
    tags: string[]
    customFields: Record<string, any>
  }
  
  // Template selection
  selectedTemplate: {
    id?: string
    name?: string
    sections: Omit<PlanSection, 'id' | 'content' | 'comments'>[]
  } | null
  
  // Section customization
  sectionConfiguration: {
    selectedSections: SectionType[]
    sectionOrder: SectionType[]
    customSections: {
      type: 'custom'
      title: string
      placeholder: string
      order: number
    }[]
    requiredSections: SectionType[]
  }
  
  // Validation state
  validation: {
    isValid: boolean
    errors: Record<string, string[]>
    warnings: Record<string, string[]>
  }
  
  // Preview state
  preview: {
    isPreviewMode: boolean
    previewPlan: any | null // Would be VideoPlan in real implementation
  }
  
  // Collaboration setup
  collaborationSetup: {
    shareSettings: {
      isPublic: boolean
      allowComments: boolean
      allowDownload: boolean
      allowCopy: boolean
    }
    invitations: {
      email: string
      role: 'editor' | 'reviewer' | 'viewer'
      message?: string
    }[]
    pendingInvitations: string[]
  }
  
  // Auto-save for draft
  draftState: {
    isDraft: boolean
    lastSaved?: string
    autoSaveEnabled: boolean
  }
  
  error: string | null
}

const initialState: PlanCreationState = {
  currentStep: 1,
  totalSteps: 5,
  isCreating: false,
  
  formData: {
    title: '',
    description: '',
    type: PLAN_DEFAULTS.TYPE,
    priority: PLAN_DEFAULTS.PRIORITY,
    collaborators: [],
    tags: [],
    customFields: {}
  },
  
  selectedTemplate: null,
  
  sectionConfiguration: {
    selectedSections: ['concept', 'target', 'story'],
    sectionOrder: ['concept', 'target', 'story'],
    customSections: [],
    requiredSections: ['concept']
  },
  
  validation: {
    isValid: false,
    errors: {},
    warnings: {}
  },
  
  preview: {
    isPreviewMode: false,
    previewPlan: null
  },
  
  collaborationSetup: {
    shareSettings: {
      isPublic: false,
      allowComments: true,
      allowDownload: false,
      allowCopy: false
    },
    invitations: [],
    pendingInvitations: []
  },
  
  draftState: {
    isDraft: false,
    autoSaveEnabled: true
  },
  
  error: null
}

const planCreationSlice = createSlice({
  name: 'planCreation',
  initialState,
  reducers: {
    // Wizard navigation
    setStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= state.totalSteps) {
        state.currentStep = action.payload
      }
    },
    
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep += 1
      }
    },
    
    previousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1
      }
    },
    
    // Form data updates
    updateFormData: (state, action: PayloadAction<Partial<PlanCreationState['formData']>>) => {
      state.formData = { ...state.formData, ...action.payload }
      state.draftState.isDraft = true
      state.validation = { isValid: false, errors: {}, warnings: {} } // Reset validation
    },
    
    setTitle: (state, action: PayloadAction<string>) => {
      state.formData.title = action.payload
      state.draftState.isDraft = true
    },
    
    setDescription: (state, action: PayloadAction<string>) => {
      state.formData.description = action.payload
      state.draftState.isDraft = true
    },
    
    setType: (state, action: PayloadAction<PlanType>) => {
      state.formData.type = action.payload
      state.draftState.isDraft = true
      
      // Reset template selection when type changes
      state.selectedTemplate = null
    },
    
    setPriority: (state, action: PayloadAction<PlanPriority>) => {
      state.formData.priority = action.payload
    },
    
    setProjectId: (state, action: PayloadAction<number | undefined>) => {
      state.formData.projectId = action.payload
    },
    
    addTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload.trim()
      if (tag && !state.formData.tags.includes(tag)) {
        state.formData.tags.push(tag)
      }
    },
    
    removeTag: (state, action: PayloadAction<string>) => {
      state.formData.tags = state.formData.tags.filter(tag => tag !== action.payload)
    },
    
    // Template selection
    selectTemplate: (state, action: PayloadAction<{
      id?: string
      name?: string
      sections: Omit<PlanSection, 'id' | 'content' | 'comments'>[]
    }>) => {
      state.selectedTemplate = action.payload
      state.formData.templateId = action.payload.id
      
      // Update section configuration based on template
      if (action.payload.sections) {
        const sectionTypes = action.payload.sections.map(s => s.type)
        state.sectionConfiguration.selectedSections = sectionTypes
        state.sectionConfiguration.sectionOrder = sectionTypes.sort((a, b) => {
          const aOrder = SECTION_TEMPLATES[a]?.order || 99
          const bOrder = SECTION_TEMPLATES[b]?.order || 99
          return aOrder - bOrder
        })
      }
    },
    
    clearTemplate: (state) => {
      state.selectedTemplate = null
      state.formData.templateId = undefined
      
      // Reset to default sections
      state.sectionConfiguration.selectedSections = ['concept', 'target', 'story']
      state.sectionConfiguration.sectionOrder = ['concept', 'target', 'story']
    },
    
    // Section configuration
    toggleSection: (state, action: PayloadAction<SectionType>) => {
      const sectionType = action.payload
      const { selectedSections, requiredSections } = state.sectionConfiguration
      
      // Can't remove required sections
      if (requiredSections.includes(sectionType)) {
        return
      }
      
      if (selectedSections.includes(sectionType)) {
        // Remove section
        state.sectionConfiguration.selectedSections = selectedSections.filter(
          type => type !== sectionType
        )
        state.sectionConfiguration.sectionOrder = state.sectionConfiguration.sectionOrder.filter(
          type => type !== sectionType
        )
      } else {
        // Add section
        state.sectionConfiguration.selectedSections.push(sectionType)
        
        // Insert in correct order
        const newOrder = [...state.sectionConfiguration.sectionOrder, sectionType]
        newOrder.sort((a, b) => {
          const aOrder = SECTION_TEMPLATES[a]?.order || 99
          const bOrder = SECTION_TEMPLATES[b]?.order || 99
          return aOrder - bOrder
        })
        state.sectionConfiguration.sectionOrder = newOrder
      }
    },
    
    reorderSections: (state, action: PayloadAction<SectionType[]>) => {
      // Validate that all required sections are present
      const hasAllRequired = state.sectionConfiguration.requiredSections.every(
        required => action.payload.includes(required)
      )
      
      if (hasAllRequired) {
        state.sectionConfiguration.sectionOrder = action.payload
      }
    },
    
    addCustomSection: (state, action: PayloadAction<{
      title: string
      placeholder: string
    }>) => {
      const { title, placeholder } = action.payload
      const order = Math.max(
        ...Object.values(SECTION_TEMPLATES).map(t => t.order),
        ...state.sectionConfiguration.customSections.map(s => s.order)
      ) + 1
      
      state.sectionConfiguration.customSections.push({
        type: 'custom',
        title,
        placeholder,
        order
      })
      
      state.sectionConfiguration.selectedSections.push('custom')
      state.sectionConfiguration.sectionOrder.push('custom')
    },
    
    removeCustomSection: (state, action: PayloadAction<number>) => {
      const index = action.payload
      if (index >= 0 && index < state.sectionConfiguration.customSections.length) {
        state.sectionConfiguration.customSections.splice(index, 1)
        
        // Remove from selected sections if no custom sections remain
        if (state.sectionConfiguration.customSections.length === 0) {
          state.sectionConfiguration.selectedSections = state.sectionConfiguration.selectedSections.filter(
            type => type !== 'custom'
          )
          state.sectionConfiguration.sectionOrder = state.sectionConfiguration.sectionOrder.filter(
            type => type !== 'custom'
          )
        }
      }
    },
    
    // Collaboration setup
    updateShareSettings: (state, action: PayloadAction<Partial<PlanCreationState['collaborationSetup']['shareSettings']>>) => {
      state.collaborationSetup.shareSettings = {
        ...state.collaborationSetup.shareSettings,
        ...action.payload
      }
    },
    
    addCollaborator: (state, action: PayloadAction<{
      userId: number
      role: 'owner' | 'editor' | 'reviewer' | 'viewer'
    }>) => {
      const { userId, role } = action.payload
      
      // Check if collaborator already exists
      const existingIndex = state.formData.collaborators.findIndex(c => c.userId === userId)
      
      if (existingIndex !== -1) {
        // Update existing collaborator role
        state.formData.collaborators[existingIndex].role = role
      } else {
        // Add new collaborator
        state.formData.collaborators.push({ userId, role })
      }
    },
    
    removeCollaborator: (state, action: PayloadAction<number>) => {
      const userId = action.payload
      state.formData.collaborators = state.formData.collaborators.filter(
        c => c.userId !== userId
      )
    },
    
    addInvitation: (state, action: PayloadAction<{
      email: string
      role: 'editor' | 'reviewer' | 'viewer'
      message?: string
    }>) => {
      const { email, role, message } = action.payload
      
      // Check if email already invited
      const existingIndex = state.collaborationSetup.invitations.findIndex(
        inv => inv.email === email
      )
      
      if (existingIndex !== -1) {
        // Update existing invitation
        state.collaborationSetup.invitations[existingIndex] = { email, role, message }
      } else {
        // Add new invitation
        state.collaborationSetup.invitations.push({ email, role, message })
      }
    },
    
    removeInvitation: (state, action: PayloadAction<string>) => {
      const email = action.payload
      state.collaborationSetup.invitations = state.collaborationSetup.invitations.filter(
        inv => inv.email !== email
      )
    },
    
    setPendingInvitations: (state, action: PayloadAction<string[]>) => {
      state.collaborationSetup.pendingInvitations = action.payload
    },
    
    // Validation
    setValidation: (state, action: PayloadAction<{
      isValid: boolean
      errors: Record<string, string[]>
      warnings?: Record<string, string[]>
    }>) => {
      state.validation = {
        isValid: action.payload.isValid,
        errors: action.payload.errors,
        warnings: action.payload.warnings || {}
      }
    },
    
    validateStep: (state, action: PayloadAction<number>) => {
      const step = action.payload
      let isValid = true
      const errors: Record<string, string[]> = {}
      
      switch (step) {
        case 1: // Basic info
          if (!state.formData.title.trim()) {
            errors.title = ['제목은 필수입니다']
            isValid = false
          }
          if (!state.formData.type) {
            errors.type = ['타입을 선택해주세요']
            isValid = false
          }
          break
          
        case 2: // Template & sections
          if (state.sectionConfiguration.selectedSections.length === 0) {
            errors.sections = ['최소 하나의 섹션을 선택해야 합니다']
            isValid = false
          }
          break
          
        case 3: // Collaboration (optional, always valid)
          break
          
        case 4: // Review & preview
          // Final validation
          if (!state.formData.title.trim() || !state.formData.type) {
            errors.form = ['필수 정보를 모두 입력해주세요']
            isValid = false
          }
          break
      }
      
      state.validation = { isValid, errors, warnings: {} }
    },
    
    // Preview
    togglePreview: (state) => {
      state.preview.isPreviewMode = !state.preview.isPreviewMode
      
      if (state.preview.isPreviewMode) {
        // Generate preview plan
        state.preview.previewPlan = {
          title: state.formData.title,
          description: state.formData.description,
          type: state.formData.type,
          priority: state.formData.priority,
          sections: state.sectionConfiguration.selectedSections.map(type => {
            if (type === 'custom') {
              return state.sectionConfiguration.customSections.map(custom => ({
                type: 'custom',
                title: custom.title,
                content: '',
                order: custom.order,
                isRequired: false,
                isVisible: true
              }))
            }
            
            const template = SECTION_TEMPLATES[type]
            return {
              type,
              title: template.title,
              content: '',
              order: template.order,
              isRequired: template.isRequired,
              isVisible: true
            }
          }).flat(),
          collaborators: state.formData.collaborators,
          tags: state.formData.tags
        }
      }
    },
    
    // Draft management
    saveDraft: (state) => {
      state.draftState.isDraft = false
      state.draftState.lastSaved = new Date().toISOString()
    },
    
    loadDraft: (state, action: PayloadAction<Partial<PlanCreationState>>) => {
      const { formData, sectionConfiguration, collaborationSetup } = action.payload
      
      if (formData) state.formData = { ...state.formData, ...formData }
      if (sectionConfiguration) {
        state.sectionConfiguration = { ...state.sectionConfiguration, ...sectionConfiguration }
      }
      if (collaborationSetup) {
        state.collaborationSetup = { ...state.collaborationSetup, ...collaborationSetup }
      }
      
      state.draftState.isDraft = false
    },
    
    clearDraft: (state) => {
      state.draftState = { isDraft: false, autoSaveEnabled: true }
    },
    
    // Creation state
    startCreation: (state) => {
      state.isCreating = true
      state.error = null
    },
    
    completeCreation: (state) => {
      state.isCreating = false
      // Reset form for next creation
      return initialState
    },
    
    setCreationError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isCreating = false
    },
    
    // Reset
    resetCreation: () => initialState
  }
})

// Actions
export const {
  setStep,
  nextStep,
  previousStep,
  updateFormData,
  setTitle,
  setDescription,
  setType,
  setPriority,
  setProjectId,
  addTag,
  removeTag,
  selectTemplate,
  clearTemplate,
  toggleSection,
  reorderSections,
  addCustomSection,
  removeCustomSection,
  updateShareSettings,
  addCollaborator,
  removeCollaborator,
  addInvitation,
  removeInvitation,
  setPendingInvitations,
  setValidation,
  validateStep,
  togglePreview,
  saveDraft,
  loadDraft,
  clearDraft,
  startCreation,
  completeCreation,
  setCreationError,
  resetCreation
} = planCreationSlice.actions

// Selectors
export const selectCreationState = (state: RootState) => state.planCreation
export const selectCurrentStep = (state: RootState) => state.planCreation?.currentStep || 1
export const selectFormData = (state: RootState) => state.planCreation?.formData
export const selectSelectedTemplate = (state: RootState) => state.planCreation?.selectedTemplate
export const selectSectionConfiguration = (state: RootState) => state.planCreation?.sectionConfiguration
export const selectValidation = (state: RootState) => state.planCreation?.validation
export const selectIsCreating = (state: RootState) => state.planCreation?.isCreating || false
export const selectCreationError = (state: RootState) => state.planCreation?.error
export const selectPreview = (state: RootState) => state.planCreation?.preview
export const selectDraftState = (state: RootState) => state.planCreation?.draftState

// Complex selectors
export const selectIsStepValid = (state: RootState, step: number): boolean => {
  const planCreation = state.planCreation
  if (!planCreation) return false
  
  switch (step) {
    case 1:
      return !!(planCreation.formData.title.trim() && planCreation.formData.type)
    case 2:
      return planCreation.sectionConfiguration.selectedSections.length > 0
    case 3:
      return true // Collaboration is optional
    case 4:
      return planCreation.validation.isValid
    default:
      return false
  }
}

export const selectCanProceedToNextStep = (state: RootState): boolean => {
  const planCreation = state.planCreation
  if (!planCreation) return false
  
  return selectIsStepValid(state, planCreation.currentStep)
}

export const selectCreationProgress = (state: RootState): number => {
  const planCreation = state.planCreation
  if (!planCreation) return 0
  
  return Math.round((planCreation.currentStep / planCreation.totalSteps) * 100)
}

export const planCreationReducer = planCreationSlice.reducer