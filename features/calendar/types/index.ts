/**
 * Calendar Module Types
 * VideoPlanet 프로젝트의 캘린더 모듈을 위한 TypeScript 타입 정의
 */

// ========================
// 기본 타입 정의
// ========================

export type CalendarViewType = '월' | '주' | '일';
export type DayOfWeek = '일' | '월' | '화' | '수' | '목' | '금' | '토';

// ========================
// 날짜 관련 타입
// ========================

export interface DateInfo {
  year: number;
  month: number; // 0-based (0 = January)
  date: number;
  day: number; // 0-based (0 = Sunday)
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export interface CalendarDate {
  date: Date;
  dateInfo: DateInfo;
  events: CalendarEvent[];
  memos: CalendarMemo[];
}

export interface WeekData {
  dates: CalendarDate[];
  weekIndex: number;
}

export interface MonthData {
  year: number;
  month: number;
  weeks: WeekData[];
  totalDates: CalendarDate[];
}

// ========================
// 캘린더 이벤트 타입
// ========================

export interface BaseEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  isAllDay?: boolean;
}

export interface CalendarEvent extends BaseEvent {
  type: 'project' | 'memo' | 'milestone';
  projectId?: number;
  userId?: number;
  metadata?: Record<string, any>;
}

// ========================
// 프로젝트 스케줄 타입
// ========================

export interface ProjectPhase {
  id: string;
  name: string;
  key: 'basic_plan' | 'story_board' | 'filming' | 'video_edit' | 'post_work' | 'video_preview' | 'confirmation' | 'video_delivery';
  startDate: Date | null;
  endDate: Date | null;
  color: string;
  order: number;
}

export interface ProjectSchedule {
  id: number;
  name: string;
  color: string;
  firstDate: Date;
  endDate: Date;
  phases: {
    basic_plan: ProjectPhase;
    story_board: ProjectPhase;
    filming: ProjectPhase;
    video_edit: ProjectPhase;
    post_work: ProjectPhase;
    video_preview: ProjectPhase;
    confirmation: ProjectPhase;
    video_delivery: ProjectPhase;
  };
  memo: CalendarMemo[];
  isActive: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  members: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

// ========================
// 메모 타입
// ========================

export interface CalendarMemo {
  id: number;
  memo: string;
  date: Date;
  projectId?: number;
  userId: number;
  userName: string;
  isUserMemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoInput {
  memo: string;
  date: string; // YYYY-MM-DD format
  projectId?: number;
}

// ========================
// 캘린더 상태 타입
// ========================

export interface CalendarState {
  currentView: CalendarViewType;
  currentDate: Date;
  selectedDate: Date | null;
  viewData: MonthData | WeekData[] | CalendarDate[];
  projects: ProjectSchedule[];
  filteredProjects: ProjectSchedule[];
  selectedProjectIds: number[];
  userMemos: CalendarMemo[];
  isLoading: boolean;
  error: string | null;
}

export interface CalendarNavigation {
  year: number;
  month: number;
  week: number;
  day: number;
  weekIndex: number;
  navigatePrev: () => void;
  navigateNext: () => void;
}

// ========================
// 통계 타입
// ========================

export interface CalendarStats {
  totalProjects: number;
  thisMonthProjects: number;
  nextMonthProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
}

// ========================
// 모달 타입
// ========================

export interface CalendarModal {
  isVisible: boolean;
  type: 'memo' | 'dateUpdate' | 'projectDetails' | null;
  data?: any;
  title?: React.ReactNode;
  content?: React.ReactNode;
}

export interface MemoModalData {
  date: Date;
  existingMemo?: CalendarMemo;
  projectId?: number;
  isUserMemo: boolean;
}

export interface DateUpdateModalData {
  phase: ProjectPhase;
  projectId: number;
}

// ========================
// 드래그 앤 드롭 타입
// ========================

export interface DragDropContext {
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  draggedPhase: ProjectPhase | null;
  dropTarget: Date | null;
}

export interface DragEventData {
  eventId: string;
  eventType: 'project' | 'memo' | 'phase';
  sourceDate: Date;
  targetDate: Date;
  projectId?: number;
  phaseKey?: string;
}

// ========================
// API 응답 타입
// ========================

export interface ProjectListResponse {
  projects: ProjectSchedule[];
  success: boolean;
  message?: string;
}

export interface MemoResponse {
  memo: CalendarMemo;
  success: boolean;
  message?: string;
}

export interface PhaseUpdateResponse {
  phase: ProjectPhase;
  success: boolean;
  message?: string;
}

export interface CalendarApiError {
  message: string;
  status: number;
  field?: string;
}

// ========================
// 폼 타입
// ========================

export interface MemoFormData {
  memo: string;
  date: Date;
  projectId?: number;
}

export interface MemoFormErrors {
  memo?: string;
  date?: string;
  general?: string;
}

export interface PhaseFormData {
  startDate: Date | null;
  endDate: Date | null;
  phaseKey: string;
  projectId: number;
}

export interface PhaseFormErrors {
  startDate?: string;
  endDate?: string;
  general?: string;
}

// ========================
// 이벤트 핸들러 타입
// ========================

export interface CalendarEventHandlers {
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (date: Date) => void;
  onProjectFilter: (projectIds: number[]) => void;
  onMemoCreate: (data: MemoFormData) => Promise<void>;
  onMemoUpdate: (id: number, data: Partial<MemoFormData>) => Promise<void>;
  onMemoDelete: (id: number) => Promise<void>;
  onPhaseUpdate: (data: PhaseFormData) => Promise<void>;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDragStart: (event: CalendarEvent | ProjectPhase) => void;
  onDragEnd: (data: DragEventData) => Promise<void>;
}

// ========================
// 캘린더 설정 타입
// ========================

export interface CalendarSettings {
  defaultView: CalendarViewType;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  showWeekNumbers: boolean;
  showWeekends: boolean;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  locale: string;
  theme: 'light' | 'dark' | 'auto';
}

// ========================
// 컴포넌트 Props 타입
// ========================

export interface CalendarProps {
  initialView?: CalendarViewType;
  initialDate?: Date;
  projects?: ProjectSchedule[];
  userMemos?: CalendarMemo[];
  settings?: Partial<CalendarSettings>;
  onViewChange?: (view: CalendarViewType) => void;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  currentView: CalendarViewType;
  navigation: CalendarNavigation;
  onNavigate: (direction: 'prev' | 'next') => void;
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (date: Date) => void;
  totalDate: Date[] | Date[][];
  weekIndex: number;
  onWeekIndexChange: (index: number) => void;
  dayIndex: number;
  onDayIndexChange: (index: number) => void;
}

export interface CalendarBodyProps {
  viewData: MonthData | WeekData[] | CalendarDate[];
  currentView: CalendarViewType;
  navigation: CalendarNavigation;
  projects: ProjectSchedule[];
  userMemos: CalendarMemo[];
  isAdmin: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onRefetch: () => void;
}

export interface CalendarDateProps {
  date: CalendarDate;
  currentView: CalendarViewType;
  isSelected?: boolean;
  events: CalendarEvent[];
  memos: CalendarMemo[];
  isAdmin: boolean;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onMemoClick: (memo: CalendarMemo) => void;
  onPhaseClick: (phase: ProjectPhase, projectId: number) => void;
}

export interface CalendarModalProps {
  modal: CalendarModal;
  onClose: () => void;
  onConfirm?: (data: any) => void;
}

export interface ProjectListProps {
  projects: ProjectSchedule[];
  className?: string;
}

export interface CalendarStatsProps {
  stats: CalendarStats;
  className?: string;
}

// ========================
// 훅 반환 타입
// ========================

export interface UseCalendarReturn {
  state: CalendarState;
  handlers: CalendarEventHandlers;
  navigation: CalendarNavigation;
  modal: CalendarModal;
  stats: CalendarStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setModal: React.Dispatch<React.SetStateAction<CalendarModal>>;
}

export interface UseProjectScheduleReturn {
  projects: ProjectSchedule[];
  filteredProjects: ProjectSchedule[];
  selectedProjectIds: number[];
  filterProjects: (projectIds: number[]) => void;
  updatePhase: (data: PhaseFormData) => Promise<void>;
  isUpdating: boolean;
  error: string | null;
  getProjectPhase: (projectId: number, phaseKey: ProjectPhaseKey) => ProjectPhase | null;
  getProjectProgress: (projectId: number) => any;
  getProjectsByPhase: (phaseKey: ProjectPhaseKey) => { project: ProjectSchedule; phase: ProjectPhase; }[];
  getUpcomingDeadlines: (days?: number) => any[];
  getOverdueProjects: () => { project: ProjectSchedule; phase: ProjectPhase; daysOverdue: number; }[];
  isPhaseEditable: (projectId: number, phaseKey: ProjectPhaseKey) => boolean;
  getPhaseValidationErrors: (data: any) => any;
  canDropPhase: (phaseKey: ProjectPhaseKey, targetDate: Date, projectId: number) => boolean;
  movePhase: (phaseKey: ProjectPhaseKey, targetDate: Date, projectId: number) => Promise<void>;
  clearError: () => void;
}

export interface UseCalendarMemoReturn {
  memos: CalendarMemo[];
  userMemos: CalendarMemo[];
  createMemo: (data: MemoFormData) => Promise<void>;
  updateMemo: (id: number, data: Partial<MemoFormData>) => Promise<void>;
  deleteMemo: (id: number) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  getMemosByDate: (date: Date) => CalendarMemo[];
  getMemosByProject: (projectId: number) => CalendarMemo[];
  getUserMemosByDate: (date: Date) => CalendarMemo[];
  getProjectMemosByDate: (date: Date, projectId?: number) => CalendarMemo[];
  getMemoStats: () => any;
  canEditMemo: (memoId: number, userId?: number) => boolean;
  canDeleteMemo: (memoId: number, userId?: number) => boolean;
  searchMemos: (query: string) => CalendarMemo[];
  getMemosInRange: (startDate: Date, endDate: Date) => CalendarMemo[];
  deleteMemosBulk: (ids: number[]) => Promise<void>;
  exportMemos: (format?: "json" | "csv") => string;
  validateMemoForm: (data: MemoFormData) => any;
  clearError: () => void;
}

// ========================
// 유틸리티 타입
// ========================

export type CalendarDateArray = CalendarDate[];
export type CalendarWeekArray = WeekData[];
export type ProjectPhaseKey = keyof ProjectSchedule['phases'];

// Type Guards
export const isProjectEvent = (event: CalendarEvent): event is CalendarEvent & { type: 'project' } => {
  return event.type === 'project';
};

export const isMemoEvent = (event: CalendarEvent): event is CalendarEvent & { type: 'memo' } => {
  return event.type === 'memo';
};

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidProjectPhase = (phase: any): phase is ProjectPhase => {
  return (
    typeof phase === 'object' &&
    phase !== null &&
    typeof phase.id === 'string' &&
    typeof phase.name === 'string' &&
    typeof phase.key === 'string'
  );
};

// Constants
export const CALENDAR_VIEWS: CalendarViewType[] = ['월', '주', '일'];
export const DAY_NAMES: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];

export const PROJECT_PHASES: Record<ProjectPhaseKey, { name: string; color: string; order: number }> = {
  basic_plan: { name: '기초기획안 작성', color: '#0131ff', order: 1 },
  story_board: { name: '스토리보드 작성', color: '#ff6b35', order: 2 },
  filming: { name: '촬영(계획/진행)', color: '#f7931e', order: 3 },
  video_edit: { name: '비디오 편집', color: '#ffcd3c', order: 4 },
  post_work: { name: '후반 작업', color: '#c5d86d', order: 5 },
  video_preview: { name: '비디오 시사', color: '#00a8cc', order: 6 },
  confirmation: { name: '최종 컨펌', color: '#0085c3', order: 7 },
  video_delivery: { name: '영상 납품', color: '#4c5c68', order: 8 },
};

// Default Values
export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultView: '월',
  firstDayOfWeek: 0, // Sunday
  showWeekNumbers: false,
  showWeekends: true,
  timeFormat: '24h',
  dateFormat: 'YYYY.MM.DD',
  locale: 'ko',
  theme: 'light',
};

export const DEFAULT_CALENDAR_STATE: CalendarState = {
  currentView: '월',
  currentDate: new Date(),
  selectedDate: null,
  viewData: [],
  projects: [],
  filteredProjects: [],
  selectedProjectIds: [],
  userMemos: [],
  isLoading: false,
  error: null,
};