/**
 * 프로젝트 관리 모듈 TypeScript 타입 정의
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

// ===== 기본 타입 정의 =====

/**
 * 프로젝트 회원 등급
 */
export type MemberRating = 'manager' | 'normal';

/**
 * 프로젝트 상태
 */
export type ProjectStatus = 'active' | 'completed' | 'suspended' | 'draft';

/**
 * 파일 업로드 상태
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

// ===== 프로젝트 관련 타입 =====

/**
 * 프로젝트 날짜 단계 정보
 */
export interface ProjectDatePhase {
  id?: number;
  start_date: string | null;
  end_date: string | null;
  phase_name?: string;
}

/**
 * 프로젝트 일정 정보 (8단계)
 */
export interface ProjectSchedule {
  basic_plan: ProjectDatePhase;      // 기초기획안 작성
  story_board: ProjectDatePhase;     // 스토리보드 작성
  filming: ProjectDatePhase;         // 촬영 (계획/진행)
  video_edit: ProjectDatePhase;      // 비디오 편집
  post_work: ProjectDatePhase;       // 후반 작업
  video_preview: ProjectDatePhase;   // 비디오 시사 (피드백)
  confirmation: ProjectDatePhase;    // 최종 컨펌
  video_delivery: ProjectDatePhase;  // 영상 납품
}

/**
 * 프로젝트 파일 정보
 */
export interface ProjectFile {
  id: number;
  file_name: string;
  files: string; // 파일 URL
  upload_date?: string;
  file_size?: number;
  file_type?: string;
}

/**
 * 프로젝트 멤버 정보
 */
export interface ProjectMember {
  id: number;
  email: string;
  nickname: string;
  rating: MemberRating;
  joined_date?: string;
  is_active?: boolean;
}

/**
 * 프로젝트 초대 정보
 */
export interface ProjectInvitation {
  id: number;
  email: string;
  invited_date: string;
  is_pending: boolean;
  invite_token?: string;
}

/**
 * 프로젝트 메모 정보
 */
export interface ProjectMemo {
  id: number;
  content: string;
  author: string;
  created_date: string;
  updated_date?: string;
  date?: string; // 캘린더 날짜
}

/**
 * 전체 프로젝트 정보
 */
export interface Project extends ProjectSchedule {
  id: number;
  name: string;
  description: string;
  manager: string;
  consumer: string;
  status?: ProjectStatus;
  
  // 소유자 정보
  owner_email: string;
  owner_nickname: string;
  
  // 날짜 정보
  created: string;
  updated: string;
  
  // 관련 데이터
  files: ProjectFile[];
  member_list: ProjectMember[];
  pending_list: ProjectInvitation[];
  memo_list?: ProjectMemo[];
}

/**
 * 프로젝트 생성/수정 입력 데이터
 */
export interface ProjectInputData {
  name: string;
  description: string;
  manager: string;
  consumer: string;
}

/**
 * 프로젝트 날짜 범위 설정 데이터 (폼용)
 */
export interface ProjectDateRange {
  startDate: Date | null;
  endDate: Date | null;
  phase_name?: string;
}

// ===== API 응답 타입 =====

/**
 * API 기본 응답 구조
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  result: T;
  error?: string;
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
 * 프로젝트 생성 API 응답
 */
export interface ProjectCreateResponse extends ApiResponse<{ id: number }> {}

/**
 * 파일 업로드 API 응답
 */
export interface FileUploadResponse extends ApiResponse<ProjectFile> {}

// ===== 컴포넌트 Props 타입 =====

/**
 * ProjectInput 컴포넌트 Props
 */
export interface ProjectInputProps {
  inputs: ProjectInputData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors?: Partial<Record<keyof ProjectInputData, string>>;
  disabled?: boolean;
}

/**
 * ProcessDate 컴포넌트 Props
 */
export interface ProcessDateProps {
  process: ProjectDateRange[];
  set_process: React.Dispatch<React.SetStateAction<ProjectDateRange[]>>;
  disabled?: boolean;
}

/**
 * ProjectList 컴포넌트 Props
 */
export interface ProjectListProps {
  project_list: Project[];
  onProjectClick?: (project: Project) => void;
  showAllPhases?: boolean;
}

/**
 * InviteInput 컴포넌트 Props
 */
export interface InviteInputProps {
  project_id: string | number;
  set_current_project: React.Dispatch<React.SetStateAction<Project | null>>;
  pending_list: ProjectInvitation[];
  disabled?: boolean;
}

/**
 * 프로젝트 정보 표시 컴포넌트 Props
 */
export interface ProjectInfoProps {
  current_project: Project;
  isAdmin?: boolean;
  onEdit?: () => void;
}

// ===== 폼 검증 타입 =====

/**
 * 프로젝트 폼 검증 결과
 */
export interface ProjectFormValidation {
  isValid: boolean;
  errors: Partial<Record<keyof ProjectInputData, string>>;
}

/**
 * 날짜 검증 결과
 */
export interface DateValidation {
  isValid: boolean;
  errors: string[];
}

// ===== 훅 관련 타입 =====

/**
 * useProjects 훅 반환 타입
 */
export interface UseProjectsReturn {
  // 상태
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // 액션
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string | number) => Promise<Project>;
  createProject: (data: FormData) => Promise<Project>;
  updateProject: (id: string | number, data: FormData) => Promise<Project>;
  deleteProject: (id: string | number) => Promise<void>;
  inviteMember: (projectId: string | number, email: string) => Promise<void>;
  updateMemberRating: (projectId: string | number, memberId: number, rating: MemberRating) => Promise<void>;
  deleteFile: (fileId: number) => Promise<void>;
  
  // 유틸리티
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * useProjectForm 훅 반환 타입
 */
export interface UseProjectFormReturn {
  // 폼 상태
  inputs: ProjectInputData;
  process: ProjectDateRange[];
  files: File[];
  validation: ProjectFormValidation;
  isSubmitting: boolean;
  
  // 폼 액션
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setProcess: React.Dispatch<React.SetStateAction<ProjectDateRange[]>>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDelete: (index: number) => void;
  validateForm: () => ProjectFormValidation;
  resetForm: () => void;
  
  // 제출 액션
  handleSubmit: (action: 'create' | 'update', projectId?: string | number) => Promise<void>;
}

// ===== 캘린더 관련 타입 =====

/**
 * 캘린더 표시 타입
 */
export type CalendarViewType = '월' | '주' | '일';

/**
 * 캘린더 날짜 정보
 */
export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

/**
 * 캘린더 컴포넌트 Props
 */
export interface CalendarProps {
  totalDate: Date[] | Date[][];
  month: number;
  year: number;
  week_index: number;
  type: CalendarViewType;
  day: number;
  current_project: Project;
  is_admin: boolean;
  refetch: () => void;
}

// ===== 파일 관리 타입 =====

/**
 * 파일 업로드 상태
 */
export interface FileUploadState {
  file: File;
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

/**
 * useFileUpload 훅 반환 타입
 */
export interface UseFileUploadReturn {
  files: File[];
  uploadStates: FileUploadState[];
  
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDelete: (index: number) => void;
  uploadFiles: (projectId: string | number) => Promise<ProjectFile[]>;
  clearFiles: () => void;
}

// ===== 권한 관리 타입 =====

/**
 * 프로젝트 권한 정보
 */
export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  canManageFiles: boolean;
}

/**
 * 권한 확인 결과
 */
export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

// ===== 에러 타입 =====

/**
 * 프로젝트 관련 에러
 */
export class ProjectError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ProjectError';
  }
}

/**
 * API 에러 응답
 */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: any;
}

// ===== 유틸리티 타입 =====

/**
 * 부분 업데이트를 위한 프로젝트 타입
 */
export type PartialProject = Partial<Omit<Project, 'id'>> & { id: number };

/**
 * 프로젝트 생성을 위한 필수 필드만 포함
 */
export type CreateProjectData = Pick<Project, 'name' | 'description' | 'manager' | 'consumer'> & {
  process: ProjectDateRange[];
  files?: File[];
};

/**
 * 프로젝트 업데이트를 위한 데이터
 */
export type UpdateProjectData = Partial<CreateProjectData> & {
  members?: ProjectMember[];
};

/**
 * 검색/필터링 옵션
 */
export interface ProjectSearchOptions {
  query?: string;
  status?: ProjectStatus;
  manager?: string;
  consumer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'name' | 'created' | 'updated' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 프로젝트 통계 정보
 */
export interface ProjectStatistics {
  total: number;
  active: number;
  completed: number;
  suspended: number;
  draft: number;
  thisMonth: number;
  thisWeek: number;
}

// ===== 내보내기 =====
export default Project;