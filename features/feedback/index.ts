// =============================================================================
// Feedback Feature Index - VideoPlanet 피드백 시스템 통합 Export
// =============================================================================

// 컴포넌트 Export
export {
  FeedbackInput,
  FeedbackMessage,
  FeedbackManage,
  FeedbackMore,
  VideoPlayer,
} from './components';

// 훅 Export
export {
  useFeedback,
  useWebSocket,
  useFeedbackForm,
  useTimestampInput,
} from './hooks';

// API Export
export * as feedbackApi from './api/feedbackApi';

// 타입 Export
export type {
  // 기본 타입들
  Feedback,
  FeedbackProject,
  FeedbackInputData,
  ChatMessage,
  WebSocketMessage,
  ProjectMember,
  
  // 컴포넌트 Props 타입들
  FeedbackPageProps,
  FeedbackInputProps,
  FeedbackManageProps,
  FeedbackMessageProps,
  FeedbackMoreProps,
  VideoPlayerProps,
  
  // 훅 반환 타입들
  UseFeedbackReturn,
  UseWebSocketReturn,
  UseFeedbackFormReturn,
  
  // API 관련 타입들
  ApiResponse,
  FeedbackListResponse,
  FeedbackCreateResponse,
  FeedbackDeleteResponse,
  FileUploadResponse,
  
  // 상태 관리 타입들
  FeedbackState,
  FeedbackFormState,
  FeedbackFormErrors,
  FeedbackFormValidation,
  
  // 유틸리티 타입들
  PermissionCheck,
  UserRole,
  FeedbackFilterOptions,
  FeedbackSortOptions,
  GroupedFeedback,
  ParsedTimestamp,
  FeedbackNotification,
  FeedbackError,
  FeedbackConfig,
  
  // Note: Test-specific types (FeedbackTestUtils, MockWebSocket) moved to ./types/test.ts
} from './types';

// 상수 Export
export { FEEDBACK_CONSTANTS } from './types';

// 기본 Export (필요시)
export default {
  // 컴포넌트들
  components: {
    FeedbackInput: () => import('./components/FeedbackInput'),
    FeedbackMessage: () => import('./components/FeedbackMessage'),
    FeedbackManage: () => import('./components/FeedbackManage'),
    FeedbackMore: () => import('./components/FeedbackMore'),
    VideoPlayer: () => import('./components/VideoPlayer'),
  },
  
  // 훅들
  hooks: {
    useFeedback: () => import('./hooks/useFeedback'),
    useWebSocket: () => import('./hooks/useWebSocket'),
    useFeedbackForm: () => import('./hooks/useFeedbackForm'),
  },
  
  // API
  api: () => import('./api/feedbackApi'),
  
  // 타입들
  types: () => import('./types'),
};