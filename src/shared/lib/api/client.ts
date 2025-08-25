import { safeFetch, CircuitBreaker, APIResponse } from './error-handler'

/**
 * API 클라이언트 싱글톤
 */
class APIClient {
  private baseURL: string
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
  }
  
  /**
   * Circuit Breaker 가져오기 (endpoint별로 분리)
   */
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker())
    }
    return this.circuitBreakers.get(endpoint)!
  }
  
  /**
   * GET 요청
   */
  async get<T = any>(
    endpoint: string,
    options?: {
      params?: Record<string, any>
      retries?: number
      useCircuitBreaker?: boolean
    }
  ): Promise<APIResponse<T>> {
    const { params, retries = 0, useCircuitBreaker = true } = options || {}
    
    // Query string 생성
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    const url = `${this.baseURL}${endpoint}${queryString}`
    
    const fetchFn = () => safeFetch<T>(url, {
      method: 'GET',
      headers: this.getHeaders(),
      retries
    })
    
    if (useCircuitBreaker) {
      const breaker = this.getCircuitBreaker(endpoint)
      try {
        return await breaker.execute(fetchFn)
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Service temporarily unavailable',
            code: 'CIRCUIT_OPEN'
          }
        }
      }
    }
    
    return fetchFn()
  }
  
  /**
   * POST 요청
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: {
      retries?: number
      useCircuitBreaker?: boolean
    }
  ): Promise<APIResponse<T>> {
    const { retries = 0, useCircuitBreaker = true } = options || {}
    const url = `${this.baseURL}${endpoint}`
    
    const fetchFn = () => safeFetch<T>(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      retries
    })
    
    if (useCircuitBreaker) {
      const breaker = this.getCircuitBreaker(endpoint)
      try {
        return await breaker.execute(fetchFn)
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Service temporarily unavailable',
            code: 'CIRCUIT_OPEN'
          }
        }
      }
    }
    
    return fetchFn()
  }
  
  /**
   * PUT 요청
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: {
      retries?: number
      useCircuitBreaker?: boolean
    }
  ): Promise<APIResponse<T>> {
    const { retries = 0, useCircuitBreaker = true } = options || {}
    const url = `${this.baseURL}${endpoint}`
    
    const fetchFn = () => safeFetch<T>(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      retries
    })
    
    if (useCircuitBreaker) {
      const breaker = this.getCircuitBreaker(endpoint)
      try {
        return await breaker.execute(fetchFn)
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Service temporarily unavailable',
            code: 'CIRCUIT_OPEN'
          }
        }
      }
    }
    
    return fetchFn()
  }
  
  /**
   * DELETE 요청
   */
  async delete<T = any>(
    endpoint: string,
    options?: {
      retries?: number
      useCircuitBreaker?: boolean
    }
  ): Promise<APIResponse<T>> {
    const { retries = 0, useCircuitBreaker = true } = options || {}
    const url = `${this.baseURL}${endpoint}`
    
    const fetchFn = () => safeFetch<T>(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      retries
    })
    
    if (useCircuitBreaker) {
      const breaker = this.getCircuitBreaker(endpoint)
      try {
        return await breaker.execute(fetchFn)
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Service temporarily unavailable',
            code: 'CIRCUIT_OPEN'
          }
        }
      }
    }
    
    return fetchFn()
  }
  
  /**
   * 파일 업로드
   */
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    options?: {
      onProgress?: (progress: number) => void
      retries?: number
    }
  ): Promise<APIResponse<T>> {
    const { retries = 0, onProgress } = options || {}
    const url = `${this.baseURL}${endpoint}`
    
    return safeFetch<T>(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders()
        // Content-Type은 FormData가 자동으로 설정
      },
      body: formData,
      retries
    })
  }
  
  /**
   * 기본 헤더 가져오기
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    }
  }
  
  /**
   * 인증 헤더 가져오기
   */
  private getAuthHeaders(): HeadersInit {
    // 토큰이 있으면 추가
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        }
      }
    }
    return {}
  }
  
  /**
   * Circuit Breaker 상태 확인
   */
  getCircuitBreakerStatus(endpoint?: string) {
    if (endpoint) {
      const breaker = this.circuitBreakers.get(endpoint)
      return breaker ? breaker.getState() : null
    }
    
    // 전체 상태
    const status: Record<string, any> = {}
    this.circuitBreakers.forEach((breaker, key) => {
      status[key] = breaker.getState()
    })
    return status
  }
  
  /**
   * Circuit Breaker 리셋
   */
  resetCircuitBreaker(endpoint?: string) {
    if (endpoint) {
      this.circuitBreakers.get(endpoint)?.reset()
    } else {
      this.circuitBreakers.forEach(breaker => breaker.reset())
    }
  }
}

// 싱글톤 인스턴스
const apiClient = new APIClient()

export default apiClient

// 간편 사용을 위한 export
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
  getCircuitBreakerStatus: apiClient.getCircuitBreakerStatus.bind(apiClient),
  resetCircuitBreaker: apiClient.resetCircuitBreaker.bind(apiClient)
}