/**
 * 실시간 데이터 파이프라인 에러 핸들링 및 재시도 시스템
 * 
 * Circuit Breaker, Exponential Backoff, Error Classification,
 * Health Check, Recovery Strategies를 포함한 포괄적인 에러 관리
 */

import { EventEmitter } from 'events'

// ===========================================
// Error Types & Classification
// ===========================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  WEBSOCKET = 'websocket',
  CACHE = 'cache',
  STORAGE = 'storage',
  PARSING = 'parsing',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  operation: string
  timestamp: number
  userAgent: string
  userId?: number
  sessionId?: string
  url?: string
  requestId?: string
  metadata?: Record<string, any>
}

export interface ClassifiedError {
  id: string
  originalError: Error
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  stack?: string
  code?: string | number
  statusCode?: number
  retryable: boolean
  context: ErrorContext
  recoveryStrategies: RecoveryStrategy[]
  telemetry?: {
    fingerprint: string
    groupingKey: string
    breadcrumbs: string[]
    tags: Record<string, string>
  }
}

export enum RecoveryStrategy {
  RETRY_IMMEDIATE = 'retry_immediate',
  RETRY_EXPONENTIAL_BACKOFF = 'retry_exponential_backoff',
  RETRY_LINEAR_BACKOFF = 'retry_linear_backoff',
  FALLBACK_CACHE = 'fallback_cache',
  FALLBACK_OFFLINE = 'fallback_offline',
  RECONNECT_WEBSOCKET = 'reconnect_websocket',
  REFRESH_AUTH = 'refresh_auth',
  CLEAR_CACHE = 'clear_cache',
  SHOW_ERROR_UI = 'show_error_ui',
  LOG_AND_IGNORE = 'log_and_ignore',
  ESCALATE = 'escalate'
}

// ===========================================
// Error Classifier
// ===========================================

export class ErrorClassifier {
  private static readonly CLASSIFICATION_RULES = new Map<string | RegExp, {
    category: ErrorCategory
    severity: ErrorSeverity
    retryable: boolean
    strategies: RecoveryStrategy[]
  }>([
    // Network Errors
    [/network|connection|fetch|cors/i, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      strategies: [RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF, RecoveryStrategy.FALLBACK_OFFLINE]
    }],
    
    // WebSocket Errors
    [/websocket|ws|socket/i, {
      category: ErrorCategory.WEBSOCKET,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      strategies: [RecoveryStrategy.RECONNECT_WEBSOCKET, RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF]
    }],
    
    // Authentication
    [/unauthorized|authentication|auth/i, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      strategies: [RecoveryStrategy.REFRESH_AUTH, RecoveryStrategy.SHOW_ERROR_UI]
    }],
    
    // Authorization
    [/forbidden|access.denied|permission/i, {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      strategies: [RecoveryStrategy.SHOW_ERROR_UI, RecoveryStrategy.LOG_AND_IGNORE]
    }],
    
    // Rate Limiting
    [/rate.limit|too.many.requests|429/i, {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      strategies: [RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF]
    }],
    
    // Validation Errors
    [/validation|invalid|bad.request|400/i, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      retryable: false,
      strategies: [RecoveryStrategy.SHOW_ERROR_UI, RecoveryStrategy.LOG_AND_IGNORE]
    }],
    
    // Server Errors
    [/5\d{2}|internal.server|server.error/i, {
      category: ErrorCategory.SERVER_ERROR,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      strategies: [RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF, RecoveryStrategy.FALLBACK_CACHE]
    }],
    
    // Timeout Errors
    [/timeout|timed.out/i, {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      strategies: [RecoveryStrategy.RETRY_LINEAR_BACKOFF, RecoveryStrategy.FALLBACK_CACHE]
    }],
    
    // Cache Errors
    [/cache|storage|indexeddb/i, {
      category: ErrorCategory.CACHE,
      severity: ErrorSeverity.LOW,
      retryable: true,
      strategies: [RecoveryStrategy.CLEAR_CACHE, RecoveryStrategy.RETRY_IMMEDIATE]
    }],
    
    // Parsing Errors
    [/parse|json|syntax/i, {
      category: ErrorCategory.PARSING,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      strategies: [RecoveryStrategy.LOG_AND_IGNORE, RecoveryStrategy.ESCALATE]
    }]
  ])
  
  static classify(error: Error, context: ErrorContext): ClassifiedError {
    const errorMessage = error.message || error.toString()
    const errorStack = error.stack
    
    let classification = {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      strategies: [RecoveryStrategy.LOG_AND_IGNORE]
    }
    
    // HTTP 상태 코드로 분류
    const statusCode = this.extractStatusCode(error)
    if (statusCode) {
      classification = this.classifyByStatusCode(statusCode)
    }
    
    // 메시지 패턴으로 분류
    for (const [pattern, rule] of this.CLASSIFICATION_RULES) {
      if (pattern instanceof RegExp) {
        if (pattern.test(errorMessage) || (errorStack && pattern.test(errorStack))) {
          classification = rule
          break
        }
      } else if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        classification = rule
        break
      }
    }
    
    return {
      id: this.generateErrorId(),
      originalError: error,
      category: classification.category,
      severity: classification.severity,
      message: errorMessage,
      stack: errorStack,
      code: (error as any).code,
      statusCode,
      retryable: classification.retryable,
      context,
      recoveryStrategies: classification.strategies,
      telemetry: {
        fingerprint: this.generateFingerprint(error, context),
        groupingKey: this.generateGroupingKey(error, context),
        breadcrumbs: this.extractBreadcrumbs(context),
        tags: this.extractTags(error, context)
      }
    }
  }
  
  private static extractStatusCode(error: Error): number | undefined {
    const statusCode = (error as any).status || 
                      (error as any).statusCode || 
                      (error as any).response?.status
    
    return typeof statusCode === 'number' ? statusCode : undefined
  }
  
  private static classifyByStatusCode(statusCode: number) {
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401) {
        return {
          category: ErrorCategory.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          retryable: true,
          strategies: [RecoveryStrategy.REFRESH_AUTH]
        }
      } else if (statusCode === 403) {
        return {
          category: ErrorCategory.AUTHORIZATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          strategies: [RecoveryStrategy.SHOW_ERROR_UI]
        }
      } else if (statusCode === 429) {
        return {
          category: ErrorCategory.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          strategies: [RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF]
        }
      } else {
        return {
          category: ErrorCategory.CLIENT_ERROR,
          severity: ErrorSeverity.LOW,
          retryable: false,
          strategies: [RecoveryStrategy.SHOW_ERROR_UI]
        }
      }
    } else if (statusCode >= 500) {
      return {
        category: ErrorCategory.SERVER_ERROR,
        severity: ErrorSeverity.HIGH,
        retryable: true,
        strategies: [RecoveryStrategy.RETRY_EXPONENTIAL_BACKOFF, RecoveryStrategy.FALLBACK_CACHE]
      }
    }
    
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      strategies: [RecoveryStrategy.LOG_AND_IGNORE]
    }
  }
  
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}_${context.operation}_${error.message.substring(0, 50)}`
    return this.hash(key)
  }
  
  private static generateGroupingKey(error: Error, context: ErrorContext): string {
    return `${error.name}_${context.operation}`
  }
  
  private static extractBreadcrumbs(context: ErrorContext): string[] {
    const breadcrumbs = []
    
    if (context.operation) {
      breadcrumbs.push(`Operation: ${context.operation}`)
    }
    
    if (context.url) {
      breadcrumbs.push(`URL: ${context.url}`)
    }
    
    if (context.metadata) {
      Object.entries(context.metadata).forEach(([key, value]) => {
        breadcrumbs.push(`${key}: ${value}`)
      })
    }
    
    return breadcrumbs
  }
  
  private static extractTags(error: Error, context: ErrorContext): Record<string, string> {
    return {
      operation: context.operation,
      userAgent: context.userAgent,
      userId: context.userId?.toString() || 'anonymous',
      timestamp: new Date(context.timestamp).toISOString()
    }
  }
  
  private static hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// ===========================================
// Circuit Breaker
// ===========================================

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  expectedErrors?: ErrorCategory[]
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0
  private nextAttempt = 0
  
  constructor(config: CircuitBreakerConfig) {
    super()
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...config
    }
  }
  
  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for operation: ${operationName}`)
      } else {
        this.state = CircuitState.HALF_OPEN
        this.emit('stateChange', this.state)
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
      
    } catch (error) {
      this.onFailure(error as Error, operationName)
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0
    this.successCount++
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED
      this.emit('stateChange', this.state)
      this.emit('recovered')
    }
  }
  
  private onFailure(error: Error, operationName: string): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    // 예상된 에러인지 확인
    if (this.config.expectedErrors) {
      const context: ErrorContext = {
        operation: operationName,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
      
      const classified = ErrorClassifier.classify(error, context)
      if (!this.config.expectedErrors.includes(classified.category)) {
        return // 예상된 에러가 아니므로 circuit breaker에 영향 없음
      }
    }
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      this.nextAttempt = Date.now() + this.config.recoveryTimeout
      this.emit('stateChange', this.state)
      this.emit('opened', { failureCount: this.failureCount, error })
    }
  }
  
  getState(): {
    state: CircuitState
    failureCount: number
    successCount: number
    lastFailureTime: number
    nextAttempt: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    }
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.nextAttempt = 0
    this.emit('reset')
  }
}

// ===========================================
// Retry Manager
// ===========================================

export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
  jitterMs: number
  retryCondition?: (error: ClassifiedError, attempt: number) => boolean
}

export class RetryManager {
  private config: RetryConfig
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitterMs: 100,
      ...config
    }
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig }
    let lastError: ClassifiedError
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const context: ErrorContext = {
          operation: operationName,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          metadata: { attempt }
        }
        
        const classifiedError = ErrorClassifier.classify(error as Error, context)
        lastError = classifiedError
        
        // 마지막 시도인 경우 에러 throw
        if (attempt > config.maxRetries) {
          throw classifiedError
        }
        
        // 재시도 조건 확인
        if (!classifiedError.retryable) {
          throw classifiedError
        }
        
        if (config.retryCondition && !config.retryCondition(classifiedError, attempt)) {
          throw classifiedError
        }
        
        // 백오프 계산 및 대기
        const delay = this.calculateDelay(attempt - 1, config)
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }
  
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffFactor, attempt)
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay)
    const jitter = Math.random() * config.jitterMs
    
    return cappedDelay + jitter
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ===========================================
// Recovery Manager
// ===========================================

export class RecoveryManager extends EventEmitter {
  private strategies = new Map<RecoveryStrategy, (error: ClassifiedError) => Promise<boolean>>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  constructor() {
    super()
    this.setupDefaultStrategies()
  }
  
  private setupDefaultStrategies(): void {
    this.strategies.set(RecoveryStrategy.RETRY_IMMEDIATE, async (error) => {
      // 즉시 재시도는 RetryManager가 처리
      return true
    })
    
    this.strategies.set(RecoveryStrategy.FALLBACK_CACHE, async (error) => {
      try {
        this.emit('fallbackRequested', { type: 'cache', error })
        return true
      } catch {
        return false
      }
    })
    
    this.strategies.set(RecoveryStrategy.FALLBACK_OFFLINE, async (error) => {
      try {
        this.emit('fallbackRequested', { type: 'offline', error })
        return true
      } catch {
        return false
      }
    })
    
    this.strategies.set(RecoveryStrategy.RECONNECT_WEBSOCKET, async (error) => {
      try {
        this.emit('reconnectRequested', { error })
        return true
      } catch {
        return false
      }
    })
    
    this.strategies.set(RecoveryStrategy.REFRESH_AUTH, async (error) => {
      try {
        this.emit('authRefreshRequested', { error })
        return true
      } catch {
        return false
      }
    })
    
    this.strategies.set(RecoveryStrategy.CLEAR_CACHE, async (error) => {
      try {
        this.emit('cacheClearRequested', { error })
        return true
      } catch {
        return false
      }
    })
    
    this.strategies.set(RecoveryStrategy.SHOW_ERROR_UI, async (error) => {
      this.emit('errorUIRequested', { error })
      return true
    })
    
    this.strategies.set(RecoveryStrategy.LOG_AND_IGNORE, async (error) => {
      console.error('Error logged and ignored:', error)
      this.emit('errorLogged', { error })
      return true
    })
    
    this.strategies.set(RecoveryStrategy.ESCALATE, async (error) => {
      this.emit('errorEscalated', { error })
      return true
    })
  }
  
  async recover(error: ClassifiedError): Promise<boolean> {
    for (const strategy of error.recoveryStrategies) {
      const handler = this.strategies.get(strategy)
      
      if (handler) {
        try {
          const success = await handler(error)
          if (success) {
            this.emit('recoverySuccess', { error, strategy })
            return true
          }
        } catch (recoveryError) {
          this.emit('recoveryFailed', { error, strategy, recoveryError })
        }
      }
    }
    
    this.emit('recoveryExhausted', { error })
    return false
  }
  
  getCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const breaker = new CircuitBreaker(config || {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000
      })
      
      breaker.on('opened', (data) => {
        this.emit('circuitBreakerOpened', { name, ...data })
      })
      
      breaker.on('recovered', () => {
        this.emit('circuitBreakerRecovered', { name })
      })
      
      this.circuitBreakers.set(name, breaker)
    }
    
    return this.circuitBreakers.get(name)!
  }
  
  addCustomStrategy(
    strategy: RecoveryStrategy,
    handler: (error: ClassifiedError) => Promise<boolean>
  ): void {
    this.strategies.set(strategy, handler)
  }
  
  getMetrics() {
    const breakerMetrics = Array.from(this.circuitBreakers.entries()).map(
      ([name, breaker]) => ({
        name,
        state: breaker.getState()
      })
    )
    
    return {
      circuitBreakers: breakerMetrics,
      strategiesCount: this.strategies.size
    }
  }
}

// ===========================================
// Health Monitor
// ===========================================

export interface HealthCheck {
  name: string
  check: () => Promise<boolean>
  timeout: number
  critical: boolean
}

export interface HealthStatus {
  name: string
  healthy: boolean
  lastCheck: number
  lastSuccess: number
  consecutiveFailures: number
  responseTime: number
  critical: boolean
}

export class HealthMonitor extends EventEmitter {
  private checks = new Map<string, HealthCheck>()
  private statuses = new Map<string, HealthStatus>()
  private interval: NodeJS.Timeout | null = null
  private checkInterval = 30000 // 30 seconds
  
  addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check)
    this.statuses.set(check.name, {
      name: check.name,
      healthy: true,
      lastCheck: 0,
      lastSuccess: 0,
      consecutiveFailures: 0,
      responseTime: 0,
      critical: check.critical
    })
  }
  
  removeCheck(name: string): void {
    this.checks.delete(name)
    this.statuses.delete(name)
  }
  
  start(interval?: number): void {
    this.checkInterval = interval || this.checkInterval
    
    if (this.interval) {
      clearInterval(this.interval)
    }
    
    this.interval = setInterval(() => {
      this.performHealthChecks()
    }, this.checkInterval)
    
    // 즉시 한 번 실행
    this.performHealthChecks()
  }
  
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
  
  private async performHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, check]) => {
        const status = this.statuses.get(name)!
        const startTime = Date.now()
        
        try {
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
          })
          
          const healthy = await Promise.race([
            check.check(),
            timeoutPromise
          ])
          
          const endTime = Date.now()
          
          status.healthy = healthy
          status.lastCheck = endTime
          status.responseTime = endTime - startTime
          
          if (healthy) {
            status.lastSuccess = endTime
            status.consecutiveFailures = 0
            this.emit('healthCheckPassed', name)
          } else {
            status.consecutiveFailures++
            this.emit('healthCheckFailed', { name, consecutive: status.consecutiveFailures })
          }
          
        } catch (error) {
          const endTime = Date.now()
          
          status.healthy = false
          status.lastCheck = endTime
          status.responseTime = endTime - startTime
          status.consecutiveFailures++
          
          this.emit('healthCheckError', { 
            name, 
            error, 
            consecutive: status.consecutiveFailures 
          })
        }
      }
    )
    
    await Promise.allSettled(checkPromises)
    this.emit('healthCheckComplete', this.getOverallHealth())
  }
  
  getOverallHealth(): {
    healthy: boolean
    checks: HealthStatus[]
    summary: {
      total: number
      healthy: number
      unhealthy: number
      critical: number
      criticalUnhealthy: number
    }
  } {
    const checks = Array.from(this.statuses.values())
    
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.healthy).length,
      unhealthy: checks.filter(c => !c.healthy).length,
      critical: checks.filter(c => c.critical).length,
      criticalUnhealthy: checks.filter(c => c.critical && !c.healthy).length
    }
    
    // 전체적으로 건강한 상태인지 판단
    const healthy = summary.criticalUnhealthy === 0 && 
                   (summary.unhealthy / summary.total) < 0.5 // 50% 미만 실패
    
    return { healthy, checks, summary }
  }
  
  getStatus(name: string): HealthStatus | undefined {
    return this.statuses.get(name)
  }
  
  async runCheck(name: string): Promise<HealthStatus | undefined> {
    const check = this.checks.get(name)
    const status = this.statuses.get(name)
    
    if (!check || !status) return undefined
    
    const startTime = Date.now()
    
    try {
      const healthy = await check.check()
      const endTime = Date.now()
      
      status.healthy = healthy
      status.lastCheck = endTime
      status.responseTime = endTime - startTime
      
      if (healthy) {
        status.lastSuccess = endTime
        status.consecutiveFailures = 0
      } else {
        status.consecutiveFailures++
      }
      
    } catch (error) {
      const endTime = Date.now()
      
      status.healthy = false
      status.lastCheck = endTime
      status.responseTime = endTime - startTime
      status.consecutiveFailures++
    }
    
    return status
  }
}

// ===========================================
// Main Error Handler
// ===========================================

export class RealTimeErrorHandler extends EventEmitter {
  private retryManager: RetryManager
  private recoveryManager: RecoveryManager
  private healthMonitor: HealthMonitor
  private errorHistory: ClassifiedError[] = []
  private maxHistorySize = 1000
  
  constructor() {
    super()
    
    this.retryManager = new RetryManager()
    this.recoveryManager = new RecoveryManager()
    this.healthMonitor = new HealthMonitor()
    
    this.setupEventHandlers()
    this.setupDefaultHealthChecks()
  }
  
  private setupEventHandlers(): void {
    this.recoveryManager.on('fallbackRequested', (data) => {
      this.emit('fallbackRequested', data)
    })
    
    this.recoveryManager.on('reconnectRequested', (data) => {
      this.emit('reconnectRequested', data)
    })
    
    this.recoveryManager.on('authRefreshRequested', (data) => {
      this.emit('authRefreshRequested', data)
    })
    
    this.recoveryManager.on('cacheClearRequested', (data) => {
      this.emit('cacheClearRequested', data)
    })
    
    this.recoveryManager.on('errorUIRequested', (data) => {
      this.emit('errorUIRequested', data)
    })
    
    this.healthMonitor.on('healthCheckFailed', (data) => {
      if (data.consecutive >= 3) {
        this.emit('systemUnhealthy', data)
      }
    })
  }
  
  private setupDefaultHealthChecks(): void {
    // WebSocket 연결 상태
    this.healthMonitor.addCheck({
      name: 'websocket',
      check: async () => {
        // 실제 구현에서는 WebSocket 상태 확인
        return true
      },
      timeout: 5000,
      critical: true
    })
    
    // 캐시 시스템
    this.healthMonitor.addCheck({
      name: 'cache',
      check: async () => {
        try {
          // 간단한 캐시 읽기/쓰기 테스트
          const testKey = 'health_check_test'
          localStorage.setItem(testKey, 'test')
          const value = localStorage.getItem(testKey)
          localStorage.removeItem(testKey)
          return value === 'test'
        } catch {
          return false
        }
      },
      timeout: 1000,
      critical: false
    })
    
    // 네트워크 연결
    this.healthMonitor.addCheck({
      name: 'network',
      check: async () => {
        return navigator.onLine
      },
      timeout: 500,
      critical: true
    })
  }
  
  async handleError(
    error: Error,
    context: Partial<ErrorContext>,
    options: {
      skipRetry?: boolean
      skipRecovery?: boolean
      customStrategies?: RecoveryStrategy[]
    } = {}
  ): Promise<void> {
    const fullContext: ErrorContext = {
      operation: 'unknown',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ...context
    }
    
    const classifiedError = ErrorClassifier.classify(error, fullContext)
    
    // 사용자 지정 복구 전략이 있으면 적용
    if (options.customStrategies) {
      classifiedError.recoveryStrategies = options.customStrategies
    }
    
    // 히스토리에 추가
    this.addToHistory(classifiedError)
    
    this.emit('errorClassified', classifiedError)
    
    // 재시도 가능하고 스킵하지 않는 경우
    if (classifiedError.retryable && !options.skipRetry) {
      try {
        // 재시도는 상위에서 처리하는 것으로 가정
        this.emit('retryRequested', classifiedError)
        return
      } catch (retryError) {
        // 재시도 실패 시 복구 전략 실행
      }
    }
    
    // 복구 전략 실행
    if (!options.skipRecovery) {
      const recovered = await this.recoveryManager.recover(classifiedError)
      
      if (!recovered) {
        this.emit('unrecoverableError', classifiedError)
      }
    }
  }
  
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: {
      circuitBreakerConfig?: CircuitBreakerConfig
      retryConfig?: Partial<RetryConfig>
      customContext?: Partial<ErrorContext>
    } = {}
  ): Promise<T> {
    const circuitBreaker = this.recoveryManager.getCircuitBreaker(
      operationName,
      options.circuitBreakerConfig
    )
    
    return circuitBreaker.execute(async () => {
      return this.retryManager.execute(
        operation,
        operationName,
        options.retryConfig
      )
    }, operationName)
  }
  
  private addToHistory(error: ClassifiedError): void {
    this.errorHistory.unshift(error)
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }
  
  getErrorHistory(filters?: {
    category?: ErrorCategory
    severity?: ErrorSeverity
    operation?: string
    timeRange?: { from: number; to: number }
  }): ClassifiedError[] {
    let filtered = this.errorHistory
    
    if (filters) {
      if (filters.category) {
        filtered = filtered.filter(e => e.category === filters.category)
      }
      
      if (filters.severity) {
        filtered = filtered.filter(e => e.severity === filters.severity)
      }
      
      if (filters.operation) {
        filtered = filtered.filter(e => e.context.operation.includes(filters.operation))
      }
      
      if (filters.timeRange) {
        filtered = filtered.filter(e => 
          e.context.timestamp >= filters.timeRange!.from &&
          e.context.timestamp <= filters.timeRange!.to
        )
      }
    }
    
    return filtered
  }
  
  getErrorStats() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    
    const recent = this.errorHistory.filter(e => 
      (now - e.context.timestamp) <= oneHour
    )
    
    const daily = this.errorHistory.filter(e => 
      (now - e.context.timestamp) <= oneDay
    )
    
    return {
      total: this.errorHistory.length,
      recentHour: {
        count: recent.length,
        byCategory: this.groupByCategory(recent),
        bySeverity: this.groupBySeverity(recent)
      },
      daily: {
        count: daily.length,
        byCategory: this.groupByCategory(daily),
        bySeverity: this.groupBySeverity(daily)
      },
      health: this.healthMonitor.getOverallHealth()
    }
  }
  
  private groupByCategory(errors: ClassifiedError[]) {
    const groups: Record<ErrorCategory, number> = {} as any
    
    errors.forEach(error => {
      groups[error.category] = (groups[error.category] || 0) + 1
    })
    
    return groups
  }
  
  private groupBySeverity(errors: ClassifiedError[]) {
    const groups: Record<ErrorSeverity, number> = {} as any
    
    errors.forEach(error => {
      groups[error.severity] = (groups[error.severity] || 0) + 1
    })
    
    return groups
  }
  
  startHealthMonitoring(interval?: number): void {
    this.healthMonitor.start(interval)
  }
  
  stopHealthMonitoring(): void {
    this.healthMonitor.stop()
  }
  
  clearHistory(): void {
    this.errorHistory = []
  }
}

// ===========================================
// Singleton Export
// ===========================================

export const realTimeErrorHandler = new RealTimeErrorHandler()