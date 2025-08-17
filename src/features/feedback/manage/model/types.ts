// 피드백 관리 관련 타입

/**
 * 실시간 채팅 메시지 인터페이스
 */
export interface ChatMessage {
  id?: number
  email: string
  nickname: string
  rating: 'manager' | 'basic'
  message: string
  timestamp?: string
  created?: string
}

/**
 * WebSocket 메시지 타입
 */
export interface WebSocketMessage {
  type?: 'message' | 'connection' | 'disconnection'
  result: ChatMessage
}

/**
 * 피드백 관리 상태
 */
export interface ManageFeedbackState {
  loading: boolean
  error: string | null
  success: boolean
  deletingIds: number[]
}

/**
 * WebSocket 연결 설정
 */
export interface WebSocketConfig {
  url: string
  projectId: string
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

/**
 * 채팅 세션 저장 타입
 */
export interface ChatSession {
  id: string // projectId
  items: ChatMessage[]
  lastUpdated: string
}

/**
 * 컴포넌트 Props 타입
 */
export interface FeedbackManageProps {
  refetch: () => void
  current_project: any
  user: string
}

export interface FeedbackMessageProps {
  Rating: (rating: string) => string
  ws: React.MutableRefObject<WebSocket | null>
  socketConnected: boolean
  items: ChatMessage[]
  me: {
    email: string
    nickname: string
    rating: string
  }
}

export interface DeleteConfirmationProps {
  feedbackId: number
  feedbackContent: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

/**
 * 훅 반환 타입
 */
export interface UseManageFeedbackReturn {
  // 상태
  manageState: ManageFeedbackState
  
  // 액션
  deleteFeedback: (feedbackId: number) => Promise<boolean>
  deleteVideo: (projectId: string) => Promise<boolean>
  
  // 유틸리티
  clearError: () => void
  isDeleting: (feedbackId: number) => boolean
}

export interface UseWebSocketReturn {
  // 상태
  connected: boolean
  messages: ChatMessage[]
  reconnecting: boolean
  
  // 액션
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  connect: () => void
  disconnect: () => void
  clearMessages: () => void
  
  // WebSocket 인스턴스 (필요한 경우)
  ws: React.MutableRefObject<WebSocket | null>
  
  // 유틸리티
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'closing' | 'unknown' | 'error'
}

export interface UseChatSessionReturn {
  // 세션 상태
  messages: ChatMessage[]
  sessionId: string
  
  // 세션 액션
  addMessage: (message: ChatMessage) => void
  clearSession: () => void
  saveSession: () => void
  loadSession: () => void
  
  // 세션 정보
  lastUpdated: string | null
  messageCount: number
  hasUnsavedChanges: boolean
}

/**
 * 권한 관리 타입
 */
export interface FeedbackManagementPermissions {
  canDeleteAnyFeedback: boolean
  canDeleteOwnFeedback: boolean
  canManageVideo: boolean
  canModerateChat: boolean
  canViewAllMessages: boolean
  canExportData: boolean
}

/**
 * 대량 작업 타입
 */
export interface BulkAction {
  type: 'delete' | 'export' | 'archive'
  feedbackIds: number[]
  metadata?: Record<string, any>
}

export interface BulkActionResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    id: number
    error: string
  }>
}

/**
 * 알림 타입
 */
export interface FeedbackNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  autoClose?: boolean
  duration?: number
}

/**
 * 관리자 대시보드 타입
 */
export interface FeedbackDashboardStats {
  totalFeedbacks: number
  todayFeedbacks: number
  activeSessions: number
  averageResponseTime: number
  topContributors: Array<{
    email: string
    nickname: string
    count: number
  }>
  recentActivity: Array<{
    type: 'feedback_created' | 'feedback_deleted' | 'video_uploaded'
    timestamp: string
    user: string
    details: string
  }>
}

/**
 * 실시간 이벤트 타입
 */
export interface RealTimeEvent {
  type: 'feedback_added' | 'feedback_deleted' | 'user_joined' | 'user_left' | 'video_uploaded'
  projectId: string
  userId: string
  data: any
  timestamp: string
}

/**
 * 내보내기 옵션
 */
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  dateRange?: {
    start: Date
    end: Date
  }
  includeDeleted?: boolean
  includeAnonymous?: boolean
  fields?: string[]
}

/**
 * 에러 타입
 */
export interface FeedbackManagementError extends Error {
  code?: string
  status?: number
  details?: any
  action?: string
}