/**
 * API 설정 및 환경 변수 관리
 */

export const API_CONFIG = {
  // Mock API 사용 여부 (환경변수 또는 기본값)
  USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
  
  // API Base URL
  API_BASE_URL: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' 
    ? '/api'  // Next.js API Routes (Mock)
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),
  
  // WebSocket URL
  WS_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000',
  
  // App URL
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // API 타임아웃 설정
  TIMEOUT: 30000,
  
  // 재시도 설정
  RETRY: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2
  }
}

// API 엔드포인트 정의
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/api/health/',
  INFO: '/api/info/',
  
  // Authentication
  LOGIN: '/api/users/login/',
  LOGOUT: '/api/users/logout/',
  REGISTER: '/api/users/register/',
  REFRESH_TOKEN: '/api/users/refresh/',
  USER_INFO: '/api/users/me/',
  
  // Projects
  PROJECTS: '/api/projects/',
  PROJECT_DETAIL: (id: string | number) => `/api/projects/${id}/`,
  PROJECT_MEMBERS: (id: string | number) => `/api/projects/${id}/members/`,
  PROJECT_INVITATIONS: (id: string | number) => `/api/projects/${id}/invitations/`,
  
  // Feedbacks
  FEEDBACKS: '/api/feedbacks/',
  FEEDBACK_DETAIL: (id: string | number) => `/api/feedbacks/${id}/`,
  FEEDBACK_COMMENTS: (id: string | number) => `/api/feedbacks/${id}/comments/`,
  FEEDBACK_REACTIONS: (id: string | number) => `/api/feedbacks/${id}/reactions/`,
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats/',
  DASHBOARD_PROGRESS: '/api/dashboard/progress/',
  DASHBOARD_ACTIVITY: '/api/dashboard/activity_timeline/',
  DASHBOARD_SUMMARY: '/api/dashboard/summary/',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications/',
  NOTIFICATIONS_FEEDBACK: '/api/notifications/feedback/',
  NOTIFICATIONS_PROJECT: '/api/notifications/project/',
  NOTIFICATION_READ: (id: string | number) => `/api/notifications/${id}/read/`,
  NOTIFICATIONS_MARK_ALL_READ: '/api/notifications/mark-all-read/',
  
  // Planning
  PLANNING_TASKS: '/api/planning/tasks/',
  PLANNING_TASK_DETAIL: (id: string | number) => `/api/planning/tasks/${id}/`,
  PLANNING_GANTT: '/api/planning/gantt/',
  
  // Comments
  COMMENTS: '/api/comments/',
  COMMENT_DETAIL: (id: string | number) => `/api/comments/${id}/`,
  COMMENT_THREAD: (id: string | number) => `/api/comments/${id}/thread/`,
  
  // Invitations
  INVITATIONS: '/api/invitations/',
  INVITATION_RESEND: (id: string | number) => `/api/invitations/${id}/resend/`,
  INVITATION_VERIFY: '/api/invitations/verify/',
  
  // WebSocket Endpoints
  WS: {
    DASHBOARD: '/ws/dashboard/',
    FEEDBACK: (id: string | number) => `/ws/feedback/${id}/`,
    PROJECT: (id: string | number) => `/ws/project/${id}/`,
    GANTT: (id: string | number) => `/ws/gantt/${id}/`,
  }
}

// HTTP Headers 기본값
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

// HTTP 메서드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// API 응답 타입
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
  ok: boolean
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
  ordering?: string
  search?: string
}

// API 에러 타입
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}