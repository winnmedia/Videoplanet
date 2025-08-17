// 프로젝트 수정 관련 타입

/**
 * 프로젝트 회원 등급
 */
export type MemberRating = 'manager' | 'normal'

/**
 * 프로젝트 상태
 */
export type ProjectStatus = 'active' | 'completed' | 'suspended' | 'draft'

/**
 * 프로젝트 날짜 단계 정보
 */
export interface ProjectDatePhase {
  id?: number
  start_date: string | null
  end_date: string | null
  phase_name?: string
}

/**
 * 프로젝트 일정 정보 (8단계)
 */
export interface ProjectSchedule {
  basic_plan: ProjectDatePhase      // 기초기획안 작성
  story_board: ProjectDatePhase     // 스토리보드 작성
  filming: ProjectDatePhase         // 촬영 (계획/진행)
  video_edit: ProjectDatePhase      // 비디오 편집
  post_work: ProjectDatePhase       // 후반 작업
  video_preview: ProjectDatePhase   // 비디오 시사 (피드백)
  confirmation: ProjectDatePhase    // 최종 컨펌
  video_delivery: ProjectDatePhase  // 영상 납품
}

/**
 * 프로젝트 파일 정보
 */
export interface ProjectFile {
  id: number
  file_name: string
  files: string // 파일 URL
  upload_date?: string
  file_size?: number
  file_type?: string
}

/**
 * 프로젝트 멤버 정보
 */
export interface ProjectMember {
  id: number
  email: string
  nickname: string
  rating: MemberRating
  joined_date?: string
  is_active?: boolean
}

/**
 * 프로젝트 메모 정보
 */
export interface ProjectMemo {
  id: number
  content: string
  author: string
  created_date: string
  updated_date?: string
  date?: string // 캘린더 날짜
}

/**
 * 전체 프로젝트 정보
 */
export interface Project extends ProjectSchedule {
  id: number
  name: string
  description: string
  manager: string
  consumer: string
  status?: ProjectStatus
  
  // 소유자 정보
  owner_email: string
  owner_nickname: string
  
  // 날짜 정보
  created: string
  updated: string
  
  // 관련 데이터
  files: ProjectFile[]
  member_list: ProjectMember[]
  memo_list?: ProjectMemo[]
}

/**
 * 프로젝트 수정 입력 데이터
 */
export interface UpdateProjectInputData {
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
 * 프로젝트 업데이트를 위한 전체 데이터
 */
export interface UpdateProjectData {
  inputs: UpdateProjectInputData
  process: ProjectDateRange[]
  files?: File[]
  members?: ProjectMember[]
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
 * 프로젝트 상세 API 응답
 */
export interface ProjectDetailResponse extends ApiResponse<Project> {}

/**
 * 프로젝트 수정 상태
 */
export interface EditProjectState {
  loading: boolean
  error: string | null
  success: boolean
  project: Project | null
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
  errors: Partial<Record<keyof UpdateProjectInputData, string>>
}

/**
 * 컴포넌트 Props 타입
 */
export interface EditProjectFormProps {
  project: Project
  onSubmit: (data: UpdateProjectData) => void
  loading?: boolean
  error?: string | null
}

export interface ProjectInputProps {
  inputs: UpdateProjectInputData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  errors?: Partial<Record<keyof UpdateProjectInputData, string>>
  disabled?: boolean
}

/**
 * 훅 반환 타입
 */
export interface UseEditProjectReturn {
  // 폼 상태
  inputs: UpdateProjectInputData
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
  handleSubmit: (projectId: string | number) => Promise<Project | null>
}

/**
 * 권한 정보
 */
export interface ProjectPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canManageMembers: boolean
  canManageFiles: boolean
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