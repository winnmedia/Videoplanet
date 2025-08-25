/**
 * 스토리보드 위저드 Feature Slice
 * 3단계 위저드 워크플로우 상태 관리
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/shared/lib/store'
import type {
  StoryboardFormData,
  ToneOption,
  GenreOption,
  VideoFormat,
  TempoOption,
  NarrativeStyle,
  DevelopmentIntensity
} from '@/entities/storyboard'

// ============================
// 1. 위저드 상태 인터페이스
// ============================

interface ValidationError {
  field: string
  message: string
}

interface StoryboardWizardState {
  // 현재 단계 (1: 입력, 2: 4단계 검토, 3: 12숏트 편집)
  currentStep: 1 | 2 | 3
  
  // 각 단계별 완성 상태
  stepCompleted: {
    step1: boolean  // 기본 입력 완료
    step2: boolean  // 4단계 스토리 확정
    step3: boolean  // 12숏트 생성 완료
  }
  
  // 폼 데이터
  formData: StoryboardFormData
  
  // 검증 상태
  validation: {
    isValid: boolean
    errors: ValidationError[]
    touched: Record<string, boolean>
  }
  
  // UI 상태
  isNextEnabled: boolean
  isPrevEnabled: boolean
  showValidationErrors: boolean
  
  // 저장 상태
  isDirty: boolean        // 변경사항 있음
  lastSaved: Date | null  // 마지막 저장 시간
  autoSaveEnabled: boolean
}

// 초기 상태
const initialState: StoryboardWizardState = {
  currentStep: 1,
  stepCompleted: {
    step1: false,
    step2: false,
    step3: false
  },
  formData: {
    title: '',
    storyline: '',
    tones: [],
    genres: [],
    target: '',
    duration: 60,
    format: 'horizontal',
    tempo: 'normal',
    narrativeStyle: 'classic-four-act',
    developmentIntensity: 'moderate'
  },
  validation: {
    isValid: false,
    errors: [],
    touched: {}
  },
  isNextEnabled: false,
  isPrevEnabled: false,
  showValidationErrors: false,
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true
}

// ============================
// 2. 검증 로직 함수들
// ============================

const validateFormData = (formData: StoryboardFormData): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // 필수 필드 검증
  if (!formData.title.trim()) {
    errors.push({ field: 'title', message: '제목을 입력해주세요.' })
  } else if (formData.title.length < 2) {
    errors.push({ field: 'title', message: '제목은 2글자 이상 입력해주세요.' })
  } else if (formData.title.length > 100) {
    errors.push({ field: 'title', message: '제목은 100글자 이하로 입력해주세요.' })
  }
  
  if (!formData.storyline.trim()) {
    errors.push({ field: 'storyline', message: '한 줄 스토리를 입력해주세요.' })
  } else if (formData.storyline.length < 10) {
    errors.push({ field: 'storyline', message: '한 줄 스토리는 10글자 이상 입력해주세요.' })
  } else if (formData.storyline.length > 500) {
    errors.push({ field: 'storyline', message: '한 줄 스토리는 500글자 이하로 입력해주세요.' })
  }
  
  if (formData.tones.length === 0) {
    errors.push({ field: 'tones', message: '톤앤매너를 최소 1개 이상 선택해주세요.' })
  }
  
  if (formData.genres.length === 0) {
    errors.push({ field: 'genres', message: '장르를 최소 1개 이상 선택해주세요.' })
  }
  
  if (!formData.target.trim()) {
    errors.push({ field: 'target', message: '타겟을 입력해주세요.' })
  }
  
  if (formData.duration < 15) {
    errors.push({ field: 'duration', message: '분량은 15초 이상으로 설정해주세요.' })
  } else if (formData.duration > 300) {
    errors.push({ field: 'duration', message: '분량은 300초(5분) 이하로 설정해주세요.' })
  }
  
  return errors
}

const canProceedToNextStep = (currentStep: number, formData: StoryboardFormData): boolean => {
  switch (currentStep) {
    case 1: {
      const errors = validateFormData(formData)
      return errors.length === 0
    }
    case 2: {
      // 2단계에서는 4단계 스토리가 생성되어야 함
      // 실제로는 storyboard entity의 상태를 확인해야 함
      return true // placeholder
    }
    case 3: {
      // 3단계에서는 12숏트가 생성되어야 함
      return true // placeholder
    }
    default:
      return false
  }
}

// ============================
// 3. Slice 정의
// ============================

const storyboardWizardSlice = createSlice({
  name: 'storyboardWizard',
  initialState,
  reducers: {
    // 단계 관리
    setCurrentStep: (state, action: PayloadAction<1 | 2 | 3>) => {
      const newStep = action.payload
      
      // 이전 단계로만 이동 가능하도록 제한
      if (newStep < state.currentStep || (newStep === state.currentStep + 1 && state.isNextEnabled)) {
        state.currentStep = newStep
        state.isPrevEnabled = newStep > 1
        state.isNextEnabled = canProceedToNextStep(newStep, state.formData)
      }
    },
    
    nextStep: (state) => {
      if (state.currentStep < 3 && state.isNextEnabled) {
        // 현재 단계 완성으로 표시
        if (state.currentStep === 1) state.stepCompleted.step1 = true
        if (state.currentStep === 2) state.stepCompleted.step2 = true
        
        state.currentStep = (state.currentStep + 1) as 1 | 2 | 3
        state.isPrevEnabled = true
        state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
        state.showValidationErrors = false
      }
    },
    
    prevStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep = (state.currentStep - 1) as 1 | 2 | 3
        state.isPrevEnabled = state.currentStep > 1
        state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
        state.showValidationErrors = false
      }
    },
    
    // 폼 데이터 업데이트
    updateFormField: <K extends keyof StoryboardFormData>(
      state: StoryboardWizardState,
      action: PayloadAction<{
        field: K
        value: StoryboardFormData[K]
      }>
    ) => {
      const { field, value } = action.payload
      state.formData[field] = value
      state.isDirty = true
      
      // 해당 필드를 touched로 표시
      state.validation.touched[field] = true
      
      // 검증 수행
      const errors = validateFormData(state.formData)
      state.validation.errors = errors
      state.validation.isValid = errors.length === 0
      
      // 다음 단계 진행 가능 여부 업데이트
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
    },
    
    // 톤앤매너 토글 (복수 선택)
    toggleTone: (state, action: PayloadAction<ToneOption>) => {
      const tone = action.payload
      const currentTones = state.formData.tones
      
      if (currentTones.includes(tone)) {
        state.formData.tones = currentTones.filter(t => t !== tone)
      } else {
        state.formData.tones = [...currentTones, tone]
      }
      
      state.isDirty = true
      state.validation.touched.tones = true
      
      // 검증 업데이트
      const errors = validateFormData(state.formData)
      state.validation.errors = errors
      state.validation.isValid = errors.length === 0
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
    },
    
    // 장르 토글 (복수 선택)
    toggleGenre: (state, action: PayloadAction<GenreOption>) => {
      const genre = action.payload
      const currentGenres = state.formData.genres
      
      if (currentGenres.includes(genre)) {
        state.formData.genres = currentGenres.filter(g => g !== genre)
      } else {
        state.formData.genres = [...currentGenres, genre]
      }
      
      state.isDirty = true
      state.validation.touched.genres = true
      
      // 검증 업데이트
      const errors = validateFormData(state.formData)
      state.validation.errors = errors
      state.validation.isValid = errors.length === 0
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
    },
    
    // 전체 폼 데이터 설정 (불러오기용)
    setFormData: (state, action: PayloadAction<StoryboardFormData>) => {
      state.formData = action.payload
      
      // 모든 필드를 touched로 표시
      Object.keys(action.payload).forEach(key => {
        state.validation.touched[key] = true
      })
      
      // 검증 수행
      const errors = validateFormData(state.formData)
      state.validation.errors = errors
      state.validation.isValid = errors.length === 0
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
      
      state.isDirty = false
    },
    
    // 검증 관리
    showValidationErrors: (state) => {
      state.showValidationErrors = true
      // 모든 필드를 touched로 표시
      Object.keys(state.formData).forEach(key => {
        state.validation.touched[key] = true
      })
    },
    
    clearValidationErrors: (state) => {
      state.showValidationErrors = false
      state.validation.touched = {}
    },
    
    // 특정 필드 터치 상태 설정
    setFieldTouched: (state, action: PayloadAction<string>) => {
      state.validation.touched[action.payload] = true
    },
    
    // 저장 상태 관리
    markAsSaved: (state) => {
      state.isDirty = false
      state.lastSaved = new Date()
    },
    
    markAsDirty: (state) => {
      state.isDirty = true
    },
    
    // 자동 저장 설정
    setAutoSaveEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload
    },
    
    // 단계 완성 상태 설정
    setStepCompleted: (state, action: PayloadAction<{
      step: 1 | 2 | 3
      completed: boolean
    }>) => {
      const { step, completed } = action.payload
      
      if (step === 1) state.stepCompleted.step1 = completed
      if (step === 2) state.stepCompleted.step2 = completed
      if (step === 3) state.stepCompleted.step3 = completed
      
      // 다음 단계 활성화 상태 업데이트
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
    },
    
    // 위저드 초기화
    resetWizard: (state) => {
      return {
        ...initialState,
        autoSaveEnabled: state.autoSaveEnabled // 자동저장 설정은 유지
      }
    },
    
    // 템플릿 적용
    applyTemplate: (state, action: PayloadAction<Partial<StoryboardFormData>>) => {
      state.formData = {
        ...state.formData,
        ...action.payload
      }
      
      // 적용된 필드들을 touched로 표시
      Object.keys(action.payload).forEach(key => {
        state.validation.touched[key] = true
      })
      
      // 검증 수행
      const errors = validateFormData(state.formData)
      state.validation.errors = errors
      state.validation.isValid = errors.length === 0
      state.isNextEnabled = canProceedToNextStep(state.currentStep, state.formData)
      
      state.isDirty = true
    }
  }
})

// ============================
// 4. 선택자들 (Selectors)
// ============================

// 기본 선택자들
export const selectWizardCurrentStep = (state: RootState) => state.storyboardWizard.currentStep
export const selectWizardFormData = (state: RootState) => state.storyboardWizard.formData
export const selectWizardValidation = (state: RootState) => state.storyboardWizard.validation
export const selectWizardNavigation = (state: RootState) => ({
  isNextEnabled: state.storyboardWizard.isNextEnabled,
  isPrevEnabled: state.storyboardWizard.isPrevEnabled,
  stepCompleted: state.storyboardWizard.stepCompleted
})
export const selectWizardSaveState = (state: RootState) => ({
  isDirty: state.storyboardWizard.isDirty,
  lastSaved: state.storyboardWizard.lastSaved,
  autoSaveEnabled: state.storyboardWizard.autoSaveEnabled
})

// 필드별 에러 선택자
export const selectFieldError = (field: string) => (state: RootState) => {
  const { errors, touched } = state.storyboardWizard.validation
  const showErrors = state.storyboardWizard.showValidationErrors || touched[field]
  
  if (!showErrors) return null
  
  return errors.find(error => error.field === field)?.message || null
}

// 특정 필드 값 선택자
export const selectFormField = <K extends keyof StoryboardFormData>(field: K) => 
  (state: RootState): StoryboardFormData[K] => state.storyboardWizard.formData[field]

// 진행률 계산 선택자
export const selectWizardProgress = (state: RootState) => {
  const { currentStep, stepCompleted } = state.storyboardWizard
  const completedSteps = Object.values(stepCompleted).filter(Boolean).length
  const totalSteps = 3
  
  return {
    currentStep,
    completedSteps,
    totalSteps,
    percentage: Math.round((completedSteps / totalSteps) * 100)
  }
}

// ============================
// 5. 액션 및 리듀서 내보내기
// ============================

export const {
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
  applyTemplate
} = storyboardWizardSlice.actions

export default storyboardWizardSlice.reducer