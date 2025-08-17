// 프로젝트 생성 관련 타입

/**
 * 프로젝트 생성 입력 데이터
 */
export interface ProjectInputData {
  name: string
  description: string
  manager: string
  consumer: string
}

/**
 * 프로젝트 날짜 범위 설정 데이터 (폼용)
 */
export interface ProjectDateRange {
  startDate: Date | null
  endDate: Date | null
  phase_name?: string
}

/**
 * 프로젝트 생성을 위한 전체 데이터
 */
export interface CreateProjectData {
  inputs: ProjectInputData
  process: ProjectDateRange[]
  files: File[]
  members?: any[]
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  result: T
  error?: string
}

/**
 * 프로젝트 생성 API 응답
 */
export interface ProjectCreateResponse extends ApiResponse<{ id: number }> {}

/**
 * 파일 업로드 상태
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'completed' | 'error'

/**
 * 파일 업로드 상태 정보
 */
export interface FileUploadState {
  file: File
  status: FileUploadStatus
  progress: number
  error?: string
}

/**
 * 프로젝트 생성 상태
 */
export interface CreateProjectState {
  loading: boolean
  error: string | null
  success: boolean
  projectId: number | null
}

/**
 * 폼 검증 타입
 */
export interface FormValidationError {
  field: string
  message: string
}

export interface ProjectFormValidation {
  isValid: boolean
  errors: Partial<Record<keyof ProjectInputData, string>>
}

/**
 * 날짜 검증 결과
 */
export interface DateValidation {
  isValid: boolean
  errors: string[]
}

/**
 * 컴포넌트 Props 타입
 */
export interface ProjectInputProps {
  inputs: ProjectInputData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  errors?: Partial<Record<keyof ProjectInputData, string>>
  disabled?: boolean
}

export interface ProcessDateProps {
  process: ProjectDateRange[]
  set_process: React.Dispatch<React.SetStateAction<ProjectDateRange[]>>
  disabled?: boolean
}

export interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectData) => void
  loading?: boolean
  error?: string | null
  initialData?: Partial<CreateProjectData>
}

/**
 * 훅 반환 타입
 */
export interface UseCreateProjectReturn {
  // 폼 상태
  inputs: ProjectInputData
  process: ProjectDateRange[]
  files: File[]
  validation: ProjectFormValidation
  isSubmitting: boolean
  
  // 폼 액션
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  setProcess: React.Dispatch<React.SetStateAction<ProjectDateRange[]>>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileDelete: (index: number) => void
  validateForm: () => ProjectFormValidation
  resetForm: () => void
  
  // 제출 액션
  handleSubmit: () => Promise<number | null>
}

/**
 * 파일 업로드 훅 반환 타입
 */
export interface UseFileUploadReturn {
  files: File[]
  uploadStates: FileUploadState[]
  
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileDelete: (index: number) => void
  clearFiles: () => void
}

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string
  code?: string
  status: number
  details?: any
}