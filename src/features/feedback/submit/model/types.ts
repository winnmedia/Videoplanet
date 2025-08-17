// 피드백 제출 관련 타입

/**
 * 피드백 기본 인터페이스
 */
export interface Feedback {
  id: number
  email: string
  nickname: string
  rating: 'manager' | 'basic'
  section: string // 타임스탬프 (예: "05:30")
  text: string // 피드백 내용
  contents: string // 피드백 내용 (text와 동일한 용도)
  title?: string
  secret?: boolean // 비밀댓글(익명) 여부
  security?: boolean // secret과 동일한 의미
  created: string // ISO 날짜 문자열
  updated?: string
}

/**
 * 피드백 입력 폼 데이터
 */
export interface FeedbackInputData {
  secret: boolean | string // 익명 여부
  title?: string
  section: string // 타임스탬프
  contents: string // 피드백 내용
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  result?: T
  data?: {
    result: T
  }
}

/**
 * 피드백 생성 API 응답
 */
export interface FeedbackCreateResponse extends ApiResponse<Feedback> {}

/**
 * 파일 업로드 응답
 */
export interface FileUploadResponse {
  success: boolean
  message: string
  file_url?: string
}

/**
 * 피드백 제출 상태
 */
export interface SubmitFeedbackState {
  loading: boolean
  error: string | null
  success: boolean
  uploadProgress: number
}

/**
 * 피드백 폼 상태
 */
export interface FeedbackFormState {
  secret: boolean | string
  title: string
  section: string
  contents: string
}

/**
 * 피드백 폼 검증
 */
export interface FeedbackFormValidation {
  secret: boolean
  section: boolean
  contents: boolean
}

export interface FeedbackFormErrors {
  secret?: string
  title?: string
  section?: string
  contents?: string
  general?: string
}

/**
 * 컴포넌트 Props 타입
 */
export interface FeedbackInputProps {
  project_id: string
  refetch: () => void
  onSubmit?: (data: FeedbackInputData) => Promise<void>
}

export interface SubmitFeedbackFormProps {
  projectId: string
  onSuccess?: (feedback: Feedback) => void
  onError?: (error: string) => void
  initialData?: Partial<FeedbackFormState>
}

export interface VideoUploadProps {
  projectId: string
  onUploadProgress?: (progress: number) => void
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

/**
 * 훅 반환 타입
 */
export interface UseSubmitFeedbackReturn {
  // 상태
  submitState: SubmitFeedbackState
  formState: FeedbackFormState
  
  // 폼 액션
  updateForm: (field: keyof FeedbackFormState, value: string | boolean) => void
  resetForm: () => void
  
  // 제출 액션
  submitFeedback: (projectId: string) => Promise<Feedback | null>
  uploadVideo: (file: File, projectId: string) => Promise<string | null>
  
  // 검증
  validateForm: () => FeedbackFormErrors
  isFormValid: () => boolean
  
  // 유틸리티
  clearError: () => void
}

export interface UseFeedbackFormReturn {
  // 폼 상태
  values: FeedbackFormState
  errors: FeedbackFormErrors
  isValid: boolean
  isSubmitting: boolean
  
  // 폼 액션
  handleChange: (field: keyof FeedbackFormState, value: string | boolean) => void
  handleSubmit: () => Promise<void>
  reset: () => void
  setValues: (values: Partial<FeedbackFormState>) => void
  
  // 검증
  validateField: (field: keyof FeedbackFormState) => boolean
  validateForm: () => boolean
  getFieldError: (field: keyof FeedbackFormState) => string | undefined
  
  // 유틸리티
  touched: Record<keyof FeedbackFormState, boolean>
  shouldShowError: (field: keyof FeedbackFormState) => boolean | string | undefined
  formStatus: 'pristine' | 'dirty' | 'submitting' | 'invalid'
}

/**
 * 타임스탬프 관련 유틸리티 타입
 */
export interface ParsedTimestamp {
  minutes: number
  seconds: number
  totalSeconds: number
  isValid: boolean
}

/**
 * 파일 업로드 상태
 */
export interface FileUploadState {
  uploading: boolean
  progress: number
  error: string | null
  url: string | null
}

/**
 * 에러 타입
 */
export interface FeedbackError extends Error {
  code?: string
  status?: number
  details?: any
}

/**
 * 피드백 폼 설정
 */
export interface FeedbackFormConfig {
  maxContentLength: number
  maxTitleLength: number
  allowAnonymous: boolean
  requireTimestamp: boolean
  maxFileSize: number
  allowedVideoTypes: string[]
}