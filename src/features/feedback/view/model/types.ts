// 피드백 조회 관련 타입

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
 * 멤버 인터페이스
 */
export interface ProjectMember {
  id?: number
  email: string
  nickname: string
  rating: 'manager' | 'basic'
  avatar?: string
}

/**
 * 피드백 프로젝트 인터페이스
 */
export interface FeedbackProject {
  id: number
  title: string
  description: string
  manager: string
  consumer: string
  owner_email: string
  owner_nickname: string
  member_list: ProjectMember[]
  feedback: Feedback[]
  files?: string // 비디오 파일 URL
  created: string
  updated: string
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
 * 피드백 목록 API 응답
 */
export interface FeedbackListResponse extends ApiResponse<FeedbackProject> {}

/**
 * 피드백 조회 상태
 */
export interface ViewFeedbackState {
  currentProject: FeedbackProject | null
  feedbacks: Feedback[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

/**
 * 피드백 필터링 옵션
 */
export interface FeedbackFilterOptions {
  dateRange?: {
    start: Date
    end: Date
  }
  users?: string[] // 이메일 목록
  isSecret?: boolean
  hasTimestamp?: boolean
}

/**
 * 피드백 정렬 옵션
 */
export type FeedbackSortBy = 'created' | 'updated' | 'section' | 'author'
export type SortOrder = 'asc' | 'desc'

export interface FeedbackSortOptions {
  sortBy: FeedbackSortBy
  order: SortOrder
}

/**
 * 피드백 그룹화 (날짜별)
 */
export interface GroupedFeedback {
  date: string // YYYY.MM.DD 형식
  feedbacks: Feedback[]
}

/**
 * 권한 확인 타입
 */
export type UserRole = 'owner' | 'manager' | 'basic'

export interface PermissionCheck {
  canManageFeedback: boolean
  canDeleteFeedback: boolean
  canUploadVideo: boolean
  canDeleteVideo: boolean
  canEditProject: boolean
  role: UserRole
}

/**
 * 컴포넌트 Props 타입
 */
export interface FeedbackListProps {
  feedbacks: Feedback[]
  loading?: boolean
  onFeedbackClick?: (feedback: Feedback) => void
  showFilters?: boolean
  showGrouping?: boolean
}

export interface FeedbackCardProps {
  feedback: Feedback
  onClick?: () => void
  showTimestamp?: boolean
  showAuthor?: boolean
}

export interface FeedbackFilterProps {
  onFilterChange: (filters: FeedbackFilterOptions) => void
  onSortChange: (sort: FeedbackSortOptions) => void
  currentFilters?: FeedbackFilterOptions
  currentSort?: FeedbackSortOptions
}

export interface FeedbackViewerProps {
  projectId: string
  initialFilters?: FeedbackFilterOptions
  showHeader?: boolean
  showFilters?: boolean
}

/**
 * 훅 반환 타입
 */
export interface UseViewFeedbackReturn {
  // 상태
  currentProject: FeedbackProject | null
  feedbacks: Feedback[]
  filteredFeedbacks: Feedback[]
  groupedFeedbacks: GroupedFeedback[]
  loading: boolean
  error: string | null
  
  // 액션
  fetchProject: (projectId: string) => Promise<void>
  fetchFeedbacks: (projectId: string) => Promise<void>
  refetch: () => void
  
  // 필터링 & 정렬
  setFilters: (filters: FeedbackFilterOptions) => void
  setSort: (sort: FeedbackSortOptions) => void
  clearFilters: () => void
  
  // 권한
  permissions: PermissionCheck
  
  // 사용자 정보
  currentUser: { email: string; nickname: string; rating: 'manager' | 'basic'; } | null
  
  // 유틸리티
  clearError: () => void
}

export interface UseFeedbackFiltersReturn {
  // 필터 상태
  filters: FeedbackFilterOptions
  sort: FeedbackSortOptions
  
  // 필터 액션
  setFilter: (key: keyof FeedbackFilterOptions, value: any) => void
  setSort: (sort: FeedbackSortOptions) => void
  clearFilters: () => void
  resetToDefaults: () => void
  
  // 필터링된 결과
  applyFilters: (feedbacks: Feedback[]) => Feedback[]
  
  // 활성 필터 정보
  hasActiveFilters: boolean
  activeFilterCount: number
}

/**
 * 비디오 플레이어 관련 타입
 */
export interface VideoPlayerProps {
  url: string
  onTimeUpdate?: (currentTime: number) => void
  onSeek?: (time: number) => void
  SetVideoLoad?: (loading: boolean) => void
}

export interface VideoPlayerEvents {
  onTimeUpdate?: (currentTime: number) => void
  onSeek?: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  onLoadStart?: () => void
  onLoadedData?: () => void
  onError?: (error: Error) => void
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
 * 에러 타입
 */
export interface FeedbackError extends Error {
  code?: string
  status?: number
  details?: any
}

/**
 * 피드백 통계 타입
 */
export interface FeedbackStatistics {
  totalCount: number
  managerCount: number
  basicCount: number
  secretCount: number
  withTimestampCount: number
  recentCount: number // 최근 24시간
  todayCount: number
}

/**
 * 페이지네이션 타입
 */
export interface FeedbackPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}