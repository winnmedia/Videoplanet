// 프로젝트 목록 조회 관련 타입

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
 * 프로젝트 초대 정보
 */
export interface ProjectInvitation {
  id: number
  email: string
  invited_date: string
  is_pending: boolean
  invite_token?: string
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
  pending_list: ProjectInvitation[]
  memo_list?: ProjectMemo[]
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
 * 프로젝트 목록 API 응답
 */
export interface ProjectListResponse extends ApiResponse<Project[]> {}

/**
 * 프로젝트 상세 API 응답
 */
export interface ProjectDetailResponse extends ApiResponse<Project> {}

/**
 * 검색/필터링 옵션
 */
export interface ProjectSearchOptions {
  query?: string
  status?: ProjectStatus
  manager?: string
  consumer?: string
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy?: 'name' | 'created' | 'updated' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * 프로젝트 통계 정보
 */
export interface ProjectStatistics {
  total: number
  active: number
  completed: number
  suspended: number
  draft: number
  thisMonth: number
  thisWeek: number
}

/**
 * 프로젝트 목록 상태
 */
export interface ProjectListState {
  projects: Project[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  totalCount: number
}

/**
 * 프로젝트 상세 상태
 */
export interface ProjectDetailState {
  project: Project | null
  loading: boolean
  error: string | null
}

/**
 * 컴포넌트 Props 타입
 */
export interface ProjectListProps {
  project_list: Project[]
  onProjectClick?: (project: Project) => void
  showAllPhases?: boolean
  loading?: boolean
}

export interface ProjectCardProps {
  project: Project
  onClick?: () => void
  showStatus?: boolean
}

export interface ProjectSearchProps {
  onSearch: (options: ProjectSearchOptions) => void
  loading?: boolean
  initialOptions?: ProjectSearchOptions
}

/**
 * 훅 반환 타입
 */
export interface UseProjectListReturn {
  // 상태
  projects: Project[]
  loading: boolean
  error: string | null
  hasMore: boolean
  
  // 액션
  fetchProjects: (options?: ProjectSearchOptions) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
}

export interface UseProjectDetailReturn {
  // 상태
  project: Project | null
  loading: boolean
  error: string | null
  
  // 액션
  fetchProject: (id: string | number) => Promise<Project>
  refetch: () => Promise<void>
  clearError: () => void
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