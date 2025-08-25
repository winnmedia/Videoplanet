/**
 * AI 영상 기획 시스템 에러 처리기
 * 중앙화된 에러 처리, 로깅, 모니터링
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'
import type { APIResponse } from '@/entities/video-planning'

// ============================
// 에러 타입 정의
// ============================

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  AI_SERVICE = 'ai_service',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface APIError extends Error {
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  statusCode: number
  details?: any
  context?: Record<string, any>
  retryable?: boolean
  userMessage?: string
  timestamp?: string
  requestId?: string
}

// ============================
// 사전 정의된 에러 코드
// ============================

export const ERROR_CODES = {
  // 검증 에러 (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    retryable: false
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    retryable: false
  },
  INVALID_INPUT_FORMAT: {
    code: 'INVALID_INPUT_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    retryable: false
  },
  INPUT_TOO_LONG: {
    code: 'INPUT_TOO_LONG',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    retryable: false
  },

  // 인증/인가 에러 (401, 403)
  AUTHENTICATION_REQUIRED: {
    code: 'AUTHENTICATION_REQUIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 401,
    retryable: false
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 401,
    retryable: false
  },
  ACCESS_DENIED: {
    code: 'ACCESS_DENIED',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 403,
    retryable: false
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 403,
    retryable: false
  },

  // 리소스 에러 (404, 409)
  PLAN_NOT_FOUND: {
    code: 'PLAN_NOT_FOUND',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.LOW,
    statusCode: 404,
    retryable: false
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.LOW,
    statusCode: 404,
    retryable: false
  },
  RESOURCE_CONFLICT: {
    code: 'RESOURCE_CONFLICT',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 409,
    retryable: false
  },

  // AI 서비스 에러 (422, 429, 502, 503, 504)
  AI_GENERATION_FAILED: {
    code: 'AI_GENERATION_FAILED',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    statusCode: 422,
    retryable: true
  },
  AI_RATE_LIMIT_EXCEEDED: {
    code: 'AI_RATE_LIMIT_EXCEEDED',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 429,
    retryable: true
  },
  AI_SERVICE_UNAVAILABLE: {
    code: 'AI_SERVICE_UNAVAILABLE',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    statusCode: 503,
    retryable: true
  },
  AI_SERVICE_TIMEOUT: {
    code: 'AI_SERVICE_TIMEOUT',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    statusCode: 504,
    retryable: true
  },
  AI_RESPONSE_PARSING_ERROR: {
    code: 'AI_RESPONSE_PARSING_ERROR',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    statusCode: 502,
    retryable: true
  },

  // 시스템 에러 (500)
  DATABASE_CONNECTION_ERROR: {
    code: 'DATABASE_CONNECTION_ERROR',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    statusCode: 500,
    retryable: true
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    statusCode: 500,
    retryable: false
  },
  EXTERNAL_API_ERROR: {
    code: 'EXTERNAL_API_ERROR',
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.HIGH,
    statusCode: 502,
    retryable: true
  }
} as const

// ============================
// 에러 생성 함수들
// ============================

export class VideoPlanningAPIError extends Error implements APIError {
  public readonly code: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly details?: any
  public readonly context?: Record<string, any>
  public readonly retryable: boolean
  public readonly userMessage?: string
  public readonly timestamp: string
  public readonly requestId?: string

  constructor(
    errorDef: typeof ERROR_CODES[keyof typeof ERROR_CODES],
    message?: string,
    options?: {
      details?: any
      context?: Record<string, any>
      userMessage?: string
      requestId?: string
    }
  ) {
    super(message || errorDef.code)
    
    this.name = 'VideoPlanningAPIError'
    this.code = errorDef.code
    this.category = errorDef.category
    this.severity = errorDef.severity
    this.statusCode = errorDef.statusCode
    this.retryable = errorDef.retryable
    this.details = options?.details
    this.context = options?.context
    this.userMessage = options?.userMessage
    this.requestId = options?.requestId
    this.timestamp = new Date().toISOString()

    // Stack trace 보존
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VideoPlanningAPIError)
    }
  }
}

// ============================
// 편의 함수들
// ============================

export function createValidationError(
  message: string,
  field?: string,
  value?: any
): VideoPlanningAPIError {
  return new VideoPlanningAPIError(
    ERROR_CODES.VALIDATION_ERROR,
    message,
    {
      details: { field, value },
      userMessage: message
    }
  )
}

export function createAuthenticationError(
  message?: string
): VideoPlanningAPIError {
  return new VideoPlanningAPIError(
    ERROR_CODES.AUTHENTICATION_REQUIRED,
    message || '로그인이 필요합니다',
    {
      userMessage: '로그인이 필요합니다'
    }
  )
}

export function createAuthorizationError(
  message?: string,
  requiredPermission?: string
): VideoPlanningAPIError {
  return new VideoPlanningAPIError(
    ERROR_CODES.ACCESS_DENIED,
    message || '접근 권한이 없습니다',
    {
      details: { requiredPermission },
      userMessage: '해당 작업을 수행할 권한이 없습니다'
    }
  )
}

export function createPlanNotFoundError(planId: string): VideoPlanningAPIError {
  return new VideoPlanningAPIError(
    ERROR_CODES.PLAN_NOT_FOUND,
    `Plan not found: ${planId}`,
    {
      details: { planId },
      userMessage: '해당 기획서를 찾을 수 없습니다'
    }
  )
}

export function createAIServiceError(
  type: 'generation_failed' | 'rate_limit' | 'timeout' | 'parsing_error' | 'unavailable',
  originalError?: Error,
  context?: Record<string, any>
): VideoPlanningAPIError {
  const errorMappings = {
    generation_failed: {
      def: ERROR_CODES.AI_GENERATION_FAILED,
      userMessage: 'AI 기획서 생성에 실패했습니다. 다시 시도해 주세요.'
    },
    rate_limit: {
      def: ERROR_CODES.AI_RATE_LIMIT_EXCEEDED,
      userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    },
    timeout: {
      def: ERROR_CODES.AI_SERVICE_TIMEOUT,
      userMessage: '처리 시간이 초과되었습니다. 다시 시도해 주세요.'
    },
    parsing_error: {
      def: ERROR_CODES.AI_RESPONSE_PARSING_ERROR,
      userMessage: '응답 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
    },
    unavailable: {
      def: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
      userMessage: 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    }
  }

  const mapping = errorMappings[type]
  
  return new VideoPlanningAPIError(
    mapping.def,
    originalError?.message || mapping.def.code,
    {
      details: { originalError: originalError?.message },
      context,
      userMessage: mapping.userMessage
    }
  )
}

export function createDatabaseError(
  operation: string,
  originalError?: Error
): VideoPlanningAPIError {
  return new VideoPlanningAPIError(
    ERROR_CODES.DATABASE_CONNECTION_ERROR,
    `Database ${operation} failed: ${originalError?.message}`,
    {
      details: { operation, originalError: originalError?.message },
      userMessage: '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }
  )
}

// ============================
// 에러 처리기
// ============================

export interface ErrorHandlerOptions {
  includeStack?: boolean
  logError?: boolean
  requestId?: string
}

export function handleAPIError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): NextResponse {
  const { includeStack = false, logError = true, requestId } = options

  let apiError: VideoPlanningAPIError

  // 에러 타입 확인 및 변환
  if (error instanceof VideoPlanningAPIError) {
    apiError = error
  } else if (error instanceof Error) {
    // 일반 Error를 APIError로 변환
    apiError = classifyError(error, requestId)
  } else {
    // 알 수 없는 에러 타입
    apiError = new VideoPlanningAPIError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unknown error occurred',
      {
        details: { originalError: String(error) },
        userMessage: '알 수 없는 오류가 발생했습니다',
        requestId
      }
    )
  }

  // 에러 로깅
  if (logError) {
    logError(apiError)
  }

  // 클라이언트 응답 생성
  const response: APIResponse<never> = {
    success: false,
    error: apiError.userMessage || apiError.message,
    code: apiError.code,
    timestamp: apiError.timestamp
  }

  // 개발 환경에서만 추가 정보 제공
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      category: apiError.category,
      severity: apiError.severity,
      retryable: apiError.retryable,
      ...(apiError.details && { originalDetails: apiError.details }),
      ...(includeStack && { stack: apiError.stack })
    }
  }

  // 요청 ID가 있으면 헤더에 추가
  const headers: Record<string, string> = {}
  if (requestId) {
    headers['X-Request-ID'] = requestId
  }

  return NextResponse.json(response, {
    status: apiError.statusCode,
    headers
  })
}

// ============================
// 에러 분류 함수
// ============================

function classifyError(error: Error, requestId?: string): VideoPlanningAPIError {
  const message = error.message.toLowerCase()
  const stack = error.stack || ''

  // OpenAI API 에러 분류
  if (message.includes('openai') || message.includes('api key')) {
    if (message.includes('rate limit') || message.includes('429')) {
      return createAIServiceError('rate_limit', error, { requestId })
    }
    if (message.includes('timeout')) {
      return createAIServiceError('timeout', error, { requestId })
    }
    if (message.includes('parsing') || message.includes('json')) {
      return createAIServiceError('parsing_error', error, { requestId })
    }
    if (message.includes('unavailable') || message.includes('503')) {
      return createAIServiceError('unavailable', error, { requestId })
    }
    return createAIServiceError('generation_failed', error, { requestId })
  }

  // 데이터베이스 에러 분류
  if (message.includes('database') || message.includes('connection') || message.includes('sql')) {
    return createDatabaseError('query', error)
  }

  // 인증 에러 분류
  if (message.includes('unauthorized') || message.includes('token') || message.includes('auth')) {
    return createAuthenticationError(error.message)
  }

  // 권한 에러 분류
  if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
    return createAuthorizationError(error.message)
  }

  // 검증 에러 분류
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return createValidationError(error.message)
  }

  // 네트워크/외부 API 에러 분류
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return new VideoPlanningAPIError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      error.message,
      {
        details: { originalError: error.message },
        userMessage: '외부 서비스 연결 중 오류가 발생했습니다',
        requestId
      }
    )
  }

  // 기타 시스템 에러
  return new VideoPlanningAPIError(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    error.message,
    {
      details: { originalError: error.message, stack },
      userMessage: '시스템 오류가 발생했습니다',
      requestId
    }
  )
}

// ============================
// 로깅 함수
// ============================

function logError(error: VideoPlanningAPIError): void {
  const logLevel = getLogLevel(error.severity)
  const logData = {
    timestamp: error.timestamp,
    code: error.code,
    category: error.category,
    severity: error.severity,
    message: error.message,
    requestId: error.requestId,
    context: error.context,
    details: error.details
  }

  // 콘솔 로깅 (실제 환경에서는 구조화된 로깅 시스템 사용)
  console[logLevel](`[${error.category.toUpperCase()}] ${error.code}:`, logData)

  // 심각한 에러는 외부 모니터링 시스템으로 전송
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    sendToMonitoringSystem(error)
  }
}

function getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error'
    case ErrorSeverity.MEDIUM:
      return 'warn'
    case ErrorSeverity.LOW:
    default:
      return 'info'
  }
}

function sendToMonitoringSystem(error: VideoPlanningAPIError): void {
  // 실제 환경에서는 Sentry, DataDog 등으로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error)
    // DataDog.logger.error(error.message, { ...error })
  }
}

// ============================
// Circuit Breaker 패턴 (AI 서비스용)
// ============================

export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000 // 1분
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw createAIServiceError('unavailable', new Error('Circuit breaker is OPEN'))
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getStatus(): { state: string; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// AI 서비스용 Circuit Breaker 인스턴스
export const aiServiceCircuitBreaker = new CircuitBreaker(5, 60000)

// ============================
// Retry 유틸리티
// ============================

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = []
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // 재시도 가능한 에러인지 확인
      if (error instanceof VideoPlanningAPIError && !error.retryable) {
        throw error
      }

      // 특정 에러 코드만 재시도
      if (retryableErrors.length > 0) {
        const errorCode = error instanceof VideoPlanningAPIError ? error.code : error.message
        if (!retryableErrors.includes(errorCode)) {
          throw error
        }
      }

      // 마지막 시도면 에러 던지기
      if (attempt === maxAttempts) {
        throw error
      }

      // 백오프 대기
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// ============================
// 내보내기
// ============================

export {
  ERROR_CODES,
  VideoPlanningAPIError,
  handleAPIError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createPlanNotFoundError,
  createAIServiceError,
  createDatabaseError
}