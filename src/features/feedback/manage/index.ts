// Public API for feedback management
export { 
  manageFeedbackApi, 
  handleManageFeedbackError, 
  WebSocketManager, 
  createWebSocketUrl, 
  createWebSocketConnection,
  managementUtils 
} from './api/manage.api'
export type {
  ChatMessage,
  WebSocketMessage,
  ManageFeedbackState,
  WebSocketConfig,
  ChatSession,
  FeedbackManageProps,
  FeedbackMessageProps,
  DeleteConfirmationProps,
  UseManageFeedbackReturn,
  UseWebSocketReturn,
  UseChatSessionReturn,
  FeedbackManagementPermissions,
  BulkAction,
  BulkActionResult,
  FeedbackNotification,
  FeedbackDashboardStats,
  RealTimeEvent,
  ExportOptions,
  FeedbackManagementError
} from './model/types'