// =============================================================================
// Feedback Types - VideoPlanet 피드백 시스템 TypeScript 타입 정의
// =============================================================================

// 기본 피드백 인터페이스
export interface Feedback {
  id: number;
  email: string;
  nickname: string;
  rating: 'manager' | 'basic';
  section: string; // 타임스탬프 (예: "05:30")
  text: string; // 피드백 내용
  contents: string; // 피드백 내용 (text와 동일한 용도)
  title?: string;
  secret?: boolean; // 비밀댓글(익명) 여부
  security?: boolean; // secret과 동일한 의미
  created: string; // ISO 날짜 문자열
  updated?: string;
}

// 피드백 입력 폼 데이터
export interface FeedbackInputData {
  secret: boolean | string; // 익명 여부
  title?: string;
  section: string; // 타임스탬프
  contents: string; // 피드백 내용
}

// 실시간 채팅 메시지 인터페이스
export interface ChatMessage {
  id?: number;
  email: string;
  nickname: string;
  rating: 'manager' | 'basic';
  message: string;
  timestamp?: string;
  created?: string;
}

// WebSocket 메시지 타입
export interface WebSocketMessage {
  type?: 'message' | 'connection' | 'disconnection';
  result: ChatMessage;
}

// 멤버 인터페이스
export interface ProjectMember {
  id?: number;
  email: string;
  nickname: string;
  rating: 'manager' | 'basic';
  avatar?: string;
}

// 피드백 프로젝트 인터페이스
export interface FeedbackProject {
  id: number;
  title: string;
  description: string;
  manager: string;
  consumer: string;
  owner_email: string;
  owner_nickname: string;
  member_list: ProjectMember[];
  feedback: Feedback[];
  files?: string; // 비디오 파일 URL
  created: string;
  updated: string;
}

// 파일 업로드 관련
export interface FileUploadData {
  files: File;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_url?: string;
}

// API 응답 타입들
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  result?: T;
  data?: {
    result: T;
  };
}

export interface FeedbackListResponse extends ApiResponse<FeedbackProject> {}

export interface FeedbackCreateResponse extends ApiResponse<Feedback> {}

export interface FeedbackDeleteResponse extends ApiResponse<{id: number}> {}

// 피드백 상태 관리 타입
export interface FeedbackState {
  currentProject: FeedbackProject | null;
  feedbacks: Feedback[];
  chatMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
}

// 피드백 컴포넌트 Props 타입들
export interface FeedbackPageProps {
  params: {
    projectId: string;
  };
}

export interface FeedbackInputProps {
  project_id: string;
  refetch: () => void;
  onSubmit?: (data: FeedbackInputData) => Promise<void>;
}

export interface FeedbackManageProps {
  refetch: () => void;
  current_project: FeedbackProject;
  user: string;
}

export interface FeedbackMessageProps {
  Rating: (rating: string) => string;
  ws: React.MutableRefObject<WebSocket | null>;
  socketConnected: boolean;
  items: ChatMessage[];
  me: {
    email: string;
    nickname: string;
    rating: string;
  };
}

export interface FeedbackMoreProps {
  current_project: FeedbackProject;
}

export interface VideoPlayerProps {
  url: string;
  SetVideoLoad: (loading: boolean) => void;
}

// 피드백 폼 상태
export interface FeedbackFormState {
  secret: boolean | string;
  title: string;
  section: string;
  contents: string;
}

// 피드백 폼 검증
export interface FeedbackFormValidation {
  secret: boolean;
  section: boolean;
  contents: boolean;
}

export interface FeedbackFormErrors {
  secret?: string;
  title?: string;
  section?: string;
  contents?: string;
  general?: string;
}

// WebSocket 연결 설정
export interface WebSocketConfig {
  url: string;
  projectId: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// 권한 확인 타입
export type UserRole = 'owner' | 'manager' | 'basic';

export interface PermissionCheck {
  canManageFeedback: boolean;
  canDeleteFeedback: boolean;
  canUploadVideo: boolean;
  canDeleteVideo: boolean;
  canEditProject: boolean;
  role: UserRole;
}

// 피드백 필터링 옵션
export interface FeedbackFilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  users?: string[]; // 이메일 목록
  isSecret?: boolean;
  hasTimestamp?: boolean;
}

// 피드백 정렬 옵션
export type FeedbackSortBy = 'created' | 'updated' | 'section' | 'author';
export type SortOrder = 'asc' | 'desc';

export interface FeedbackSortOptions {
  sortBy: FeedbackSortBy;
  order: SortOrder;
}

// 피드백 그룹화 (날짜별)
export interface GroupedFeedback {
  date: string; // YYYY.MM.DD.dd 형식
  feedbacks: Feedback[];
}

// 채팅 세션 저장 타입
export interface ChatSession {
  id: string; // projectId
  items: ChatMessage[];
  lastUpdated: string;
}

// 비디오 플레이어 이벤트
export interface VideoPlayerEvents {
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: Error) => void;
}

// 타임스탬프 관련 유틸리티 타입
export interface ParsedTimestamp {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isValid: boolean;
}

// 알림 타입
export interface FeedbackNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

// 훅 반환 타입들
export interface UseFeedbackReturn {
  // 상태
  currentProject: FeedbackProject | null;
  feedbacks: Feedback[];
  loading: boolean;
  error: string | null;
  
  // 액션
  fetchProject: (projectId: string) => Promise<void>;
  createFeedback: (data: FeedbackInputData) => Promise<void>;
  deleteFeedback: (feedbackId: number) => Promise<void>;
  uploadVideo: (file: File) => Promise<void>;
  deleteVideo: () => Promise<void>;
  refetch: () => void;
  
  // 권한
  permissions: PermissionCheck;
  
  // 사용자 정보
  currentUser: { email: string; nickname: string; rating: 'manager' | 'basic'; } | null;
}

export interface UseWebSocketReturn {
  // 상태
  connected: boolean;
  messages: ChatMessage[];
  reconnecting: boolean;
  
  // 액션
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
  
  // WebSocket 인스턴스 (필요한 경우)
  ws: React.MutableRefObject<WebSocket | null>;
  
  // 유틸리티
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'closing' | 'unknown' | 'error';
}

export interface UseFeedbackFormReturn {
  // 폼 상태
  values: FeedbackFormState;
  errors: FeedbackFormErrors;
  isValid: boolean;
  isSubmitting: boolean;
  
  // 폼 액션
  handleChange: (field: keyof FeedbackFormState, value: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  setValues: (values: Partial<FeedbackFormState>) => void;
  
  // 검증
  validateField: (field: keyof FeedbackFormState) => boolean;
  validateForm: () => boolean;
  getFieldError: (field: keyof FeedbackFormState) => string | undefined;
  
  // 유틸리티
  touched: Record<keyof FeedbackFormState, boolean>;
  shouldShowError: (field: keyof FeedbackFormState) => boolean | string | undefined;
  formStatus: 'pristine' | 'dirty' | 'submitting' | 'invalid';
}

// 에러 타입
export interface FeedbackError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

// 환경 설정 타입
export interface FeedbackConfig {
  socketUrl: string;
  apiBaseUrl: string;
  maxFileSize: number;
  allowedVideoTypes: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

// 성능 최적화를 위한 타입
export interface FeedbackMemoProps {
  currentProject: FeedbackProject;
  user: string;
  onRefetch: () => void;
}

// 테스트를 위한 Mock 타입들
export interface MockWebSocket {
  readyState: number;
  send: jest.Mock;
  close: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

export interface FeedbackTestUtils {
  createMockProject: (overrides?: Partial<FeedbackProject>) => FeedbackProject;
  createMockFeedback: (overrides?: Partial<Feedback>) => Feedback;
  createMockChatMessage: (overrides?: Partial<ChatMessage>) => ChatMessage;
  createMockWebSocket: () => MockWebSocket;
}

// 타입 가드 함수들의 시그니처
export type FeedbackTypeGuards = {
  isFeedback: (obj: any) => obj is Feedback;
  isChatMessage: (obj: any) => obj is ChatMessage;
  isFeedbackProject: (obj: any) => obj is FeedbackProject;
  isApiResponse: (obj: any) => obj is ApiResponse;
  isWebSocketMessage: (obj: any) => obj is WebSocketMessage;
  isValidTimestamp: (timestamp: string) => boolean;
  isValidEmail: (email: string) => boolean;
  isVideoFile: (file: File) => boolean;
};

// 유틸리티 함수 타입들
export type FeedbackUtils = {
  formatTimestamp: (timestamp: string) => string;
  parseTimestamp: (timestamp: string) => ParsedTimestamp;
  groupFeedbacksByDate: (feedbacks: Feedback[]) => GroupedFeedback[];
  sortFeedbacks: (feedbacks: Feedback[], options: FeedbackSortOptions) => Feedback[];
  filterFeedbacks: (feedbacks: Feedback[], options: FeedbackFilterOptions) => Feedback[];
  formatFileSize: (bytes: number) => string;
  generateChatSessionId: (projectId: string) => string;
  sanitizeMessage: (message: string) => string;
};

// 상수 타입들
export const FEEDBACK_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_SECTION_LENGTH: 10,
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  SOCKET_RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  SESSION_STORAGE_KEY: 'feedback_chat_session',
} as const;

// Export all types - already exported above individually

// 기본 export
export default {
  // 필요한 경우 기본 내보내기
};