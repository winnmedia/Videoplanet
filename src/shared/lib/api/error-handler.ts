/**
 * API 에러 핸들링 유틸리티
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
}

/**
 * API 호출을 래핑하여 에러 처리를 표준화
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    fallback?: T
    retries?: number
    retryDelay?: number
    onError?: (error: Error) => void
  }
): Promise<APIResponse<T>> {
  const { fallback, retries = 0, retryDelay = 1000, onError } = options || {}
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data
      }
    } catch (error) {
      lastError = error as Error
      
      // 로깅
      console.error(`API Error (attempt ${attempt + 1}/${retries + 1}):`, error)
      
      // 커스텀 에러 핸들러 호출
      onError?.(lastError)
      
      // 재시도가 남아있으면 대기 후 재시도
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }
    }
  }
  
  // 모든 재시도 실패
  const errorMessage = lastError?.message || '알 수 없는 오류가 발생했습니다'
  
  // fallback이 있으면 사용
  if (fallback !== undefined) {
    return {
      success: false,
      data: fallback,
      error: {
        message: errorMessage,
        details: lastError
      }
    }
  }
  
  return {
    success: false,
    error: {
      message: errorMessage,
      details: lastError
    }
  }
}

/**
 * HTTP 상태 코드별 에러 메시지
 */
export const ERROR_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다. 입력값을 확인해주세요.',
  401: '인증이 필요합니다. 다시 로그인해주세요.',
  403: '접근 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  408: '요청 시간이 초과되었습니다.',
  409: '충돌이 발생했습니다. 다시 시도해주세요.',
  422: '처리할 수 없는 요청입니다.',
  429: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  500: '서버 오류가 발생했습니다.',
  502: '게이트웨이 오류가 발생했습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
  504: '게이트웨이 시간 초과가 발생했습니다.'
}

/**
 * fetch 래퍼 with 에러 처리
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit & { 
    timeout?: number
    retries?: number
  }
): Promise<APIResponse<T>> {
  const { timeout = 30000, retries = 0, ...fetchOptions } = options || {}
  
  // 타임아웃 설정
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await withErrorHandling(
      async () => {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!res.ok) {
          const errorMessage = ERROR_MESSAGES[res.status] || `HTTP ${res.status} 오류`
          throw new APIError(errorMessage, res.status)
        }
        
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return await res.json()
        }
        
        return await res.text()
      },
      { retries }
    )
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          message: '요청 시간이 초과되었습니다.',
          code: 'TIMEOUT'
        }
      }
    }
    
    throw error
  }
}

/**
 * Circuit Breaker 패턴 구현
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1분
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // OPEN 상태 체크
    if (this.state === 'OPEN') {
      const now = Date.now()
      if (now - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      
      // 성공 시 리셋
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failureCount = 0
      }
      
      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()
      
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN'
        console.error('Circuit breaker opened due to failures')
      }
      
      throw error
    }
  }
  
  reset() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold
    }
  }
}