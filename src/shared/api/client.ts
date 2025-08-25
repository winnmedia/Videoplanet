/**
 * 통합 API 클라이언트
 * Mock API와 실제 백엔드를 자동으로 전환
 */

import { API_CONFIG, DEFAULT_HEADERS, ApiResponse, ApiError, HttpMethod, API_ENDPOINTS } from './config'

// 토큰 관리
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }
}

export const getAuthToken = (): string | null => {
  if (authToken) return authToken
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken')
  }
  return authToken
}

// API 요청 옵션
interface RequestOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  timeout?: number
  retry?: boolean
}

// 재시도 로직
const retryRequest = async (
  fn: () => Promise<Response>,
  maxAttempts: number = API_CONFIG.RETRY.maxAttempts,
  delay: number = API_CONFIG.RETRY.delay
): Promise<Response> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(API_CONFIG.RETRY.backoff, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`)
      }
    }
  }
  
  throw lastError
}

// 기본 fetch 래퍼
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

// 메인 API 클라이언트
export class ApiClient {
  private baseUrl: string
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.API_BASE_URL
  }
  
  // URL 생성
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Mock API 모드에서는 /api 프리픽스 제거
    if (API_CONFIG.USE_MOCK_API && endpoint.startsWith('/api/')) {
      endpoint = endpoint
    } else if (!API_CONFIG.USE_MOCK_API && !endpoint.startsWith('/')) {
      endpoint = '/' + endpoint
    }
    
    const url = new URL(endpoint, this.baseUrl)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return url.toString()
  }
  
  // 헤더 생성
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...customHeaders
    }
    
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // CSRF 토큰 처리 (Django용)
    if (typeof window !== 'undefined') {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
    }
    
    return headers
  }
  
  // 기본 요청 메서드
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers,
      body,
      params,
      timeout,
      retry = true
    } = options
    
    const url = this.buildUrl(endpoint, params)
    const requestHeaders = this.buildHeaders(headers)
    
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // 쿠키 포함
    }
    
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }
    
    try {
      const fetchFn = () => fetchWithTimeout(url, fetchOptions, timeout)
      const response = retry && method === 'GET' 
        ? await retryRequest(fetchFn)
        : await fetchFn()
      
      const contentType = response.headers.get('content-type')
      let data: any = null
      
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json()
        } catch {
          // JSON 파싱 실패 시 텍스트로 처리
          data = await response.text()
        }
      } else {
        data = await response.text()
      }
      
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText, data)
      }
      
      return {
        data,
        status: response.status,
        ok: response.ok
      }
    } catch (error: any) {
      console.error('API Request Error:', error)
      
      // Mock API 모드에서 에러 발생 시 빈 데이터 반환
      if (API_CONFIG.USE_MOCK_API) {
        console.log('Using mock data due to error')
        return {
          data: this.getMockData(endpoint, method),
          status: 200,
          ok: true
        }
      }
      
      // 에러 재가공
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError(
        error.status || 500,
        error.message || 'Unknown error',
        error
      )
    }
  }
  
  // Mock 데이터 생성
  private getMockData(endpoint: string, method: string): any {
    // 엔드포인트별 기본 Mock 데이터 반환
    if (endpoint.includes('stats')) {
      return {
        totalProjects: 5,
        activeFeedbacks: 12,
        totalCollaborators: 8,
        completionRate: 75
      }
    }
    
    if (endpoint.includes('notifications')) {
      return []
    }
    
    if (endpoint.includes('projects')) {
      return []
    }
    
    if (endpoint.includes('feedbacks')) {
      return []
    }
    
    return null
  }
  
  // 편의 메서드들
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }
  
  async post<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, params })
  }
  
  async put<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, params })
  }
  
  async patch<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, params })
  }
  
  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient()

// 특화된 API 서비스들
export const api = {
  // Health Check
  health: () => apiClient.get(API_ENDPOINTS.HEALTH),
  info: () => apiClient.get(API_ENDPOINTS.INFO),
  
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.LOGIN, credentials),
    logout: () => apiClient.post(API_ENDPOINTS.LOGOUT),
    register: (data: any) => apiClient.post(API_ENDPOINTS.REGISTER, data),
    refreshToken: () => apiClient.post(API_ENDPOINTS.REFRESH_TOKEN),
    getUserInfo: () => apiClient.get(API_ENDPOINTS.USER_INFO),
  },
  
  // Projects
  projects: {
    list: (params?: any) => apiClient.get(API_ENDPOINTS.PROJECTS, params),
    get: (id: string | number) => apiClient.get(API_ENDPOINTS.PROJECT_DETAIL(id)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.PROJECTS, data),
    update: (id: string | number, data: any) => 
      apiClient.patch(API_ENDPOINTS.PROJECT_DETAIL(id), data),
    delete: (id: string | number) => apiClient.delete(API_ENDPOINTS.PROJECT_DETAIL(id)),
    getMembers: (id: string | number) => apiClient.get(API_ENDPOINTS.PROJECT_MEMBERS(id)),
    inviteMembers: (id: string | number, emails: string[]) =>
      apiClient.post(API_ENDPOINTS.PROJECT_INVITATIONS(id), { emails }),
  },
  
  // Feedbacks
  feedbacks: {
    list: (params?: any) => apiClient.get(API_ENDPOINTS.FEEDBACKS, params),
    get: (id: string | number) => apiClient.get(API_ENDPOINTS.FEEDBACK_DETAIL(id)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.FEEDBACKS, data),
    update: (id: string | number, data: any) =>
      apiClient.patch(API_ENDPOINTS.FEEDBACK_DETAIL(id), data),
    delete: (id: string | number) => apiClient.delete(API_ENDPOINTS.FEEDBACK_DETAIL(id)),
    getComments: (id: string | number) => apiClient.get(API_ENDPOINTS.FEEDBACK_COMMENTS(id)),
    addComment: (id: string | number, data: any) =>
      apiClient.post(API_ENDPOINTS.FEEDBACK_COMMENTS(id), data),
    addReaction: (id: string | number, reaction: string) =>
      apiClient.post(API_ENDPOINTS.FEEDBACK_REACTIONS(id), { reaction }),
  },
  
  // Dashboard
  dashboard: {
    getStats: () => apiClient.get(API_ENDPOINTS.DASHBOARD_STATS),
    getProgress: () => apiClient.get(API_ENDPOINTS.DASHBOARD_PROGRESS),
    getActivity: () => apiClient.get(API_ENDPOINTS.DASHBOARD_ACTIVITY),
    getSummary: () => apiClient.get(API_ENDPOINTS.DASHBOARD_SUMMARY),
  },
  
  // Notifications
  notifications: {
    list: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS),
    getFeedback: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS_FEEDBACK),
    getProject: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS_PROJECT),
    markAsRead: (id: string | number) => apiClient.post(API_ENDPOINTS.NOTIFICATION_READ(id)),
    markAllAsRead: () => apiClient.post(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ),
  },
}

export default api