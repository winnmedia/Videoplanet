/**
 * API 테스트 헬퍼 유틸리티
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import type {
  APITestContext,
  APITestMetrics,
  ValidationResult,
  ValidationRule,
  ConcurrencyTestConfig,
  ConcurrencyTestResult,
  BenchmarkResult
} from '../types/api-test.types'

// ============================
// API 요청 헬퍼
// ============================

export class APITestClient {
  private context: APITestContext

  constructor(context?: Partial<APITestContext>) {
    this.context = {
      baseUrl: context?.baseUrl || 'http://localhost:3005',
      headers: {
        'Content-Type': 'application/json',
        ...context?.headers
      },
      timeout: context?.timeout || 30000,
      retryCount: context?.retryCount || 0
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{
    data: T
    metrics: APITestMetrics
  }> {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()
    const startCpu = process.cpuUsage()

    const url = `${this.context.baseUrl}${endpoint}`
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.context.headers,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.context.timeout)
    }

    let response: Response
    let lastError: any

    for (let i = 0; i <= this.context.retryCount; i++) {
      try {
        response = await fetch(url, requestOptions)
        break
      } catch (error) {
        lastError = error
        if (i < this.context.retryCount) {
          await this.sleep(Math.pow(2, i) * 1000) // Exponential backoff
        }
      }
    }

    if (!response!) {
      throw lastError || new Error('Request failed after retries')
    }

    const responseData = await response.json()
    const endTime = Date.now()
    const endMemory = process.memoryUsage()
    const endCpu = process.cpuUsage()

    const metrics: APITestMetrics = {
      responseTime: endTime - startTime,
      statusCode: response.status,
      success: response.ok,
      scenario: options.method || 'GET',
      timestamp: new Date().toISOString(),
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      cpuUsage: {
        user: endCpu.user - startCpu.user,
        system: endCpu.system - startCpu.system
      }
    }

    return { data: responseData, metrics }
  }

  async get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async put<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  async patch<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  }

  async delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================
// 검증 헬퍼
// ============================

export class Validator {
  static validate<T>(
    data: T,
    rules: ValidationRule<T>[]
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of rules) {
      const value = (data as any)[rule.field]
      if (!rule.validator(value)) {
        errors.push(rule.errorMessage)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validateStructure(obj: any, structure: any): boolean {
    if (obj === null || obj === undefined) return false

    for (const key in structure) {
      if (!(key in obj)) return false

      const expectedType = structure[key]
      const actualValue = obj[key]

      if (typeof expectedType === 'string') {
        if (typeof actualValue !== expectedType) return false
      } else if (typeof expectedType === 'object') {
        if (!this.validateStructure(actualValue, expectedType)) return false
      }
    }

    return true
  }

  static validateArrayLength(arr: any[], min: number, max?: number): boolean {
    if (!Array.isArray(arr)) return false
    if (arr.length < min) return false
    if (max !== undefined && arr.length > max) return false
    return true
  }

  static validateRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  }

  static validateString(
    str: string,
    options?: {
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      allowEmpty?: boolean
    }
  ): boolean {
    if (!options?.allowEmpty && (!str || str.trim().length === 0)) return false
    if (options?.minLength && str.length < options.minLength) return false
    if (options?.maxLength && str.length > options.maxLength) return false
    if (options?.pattern && !options.pattern.test(str)) return false
    return true
  }
}

// ============================
// 동시성 테스트 헬퍼
// ============================

export class ConcurrencyTester {
  static async run(
    config: ConcurrencyTestConfig
  ): Promise<ConcurrencyTestResult> {
    const results: APITestMetrics[] = []
    const errors: Map<string, number> = new Map()
    const startTime = Date.now()

    const executeRequest = async (index: number) => {
      try {
        const result = await config.requestGenerator()
        results.push(result.metrics || {
          responseTime: Date.now() - startTime,
          statusCode: 200,
          success: true,
          scenario: `request-${index}`,
          timestamp: new Date().toISOString()
        })
      } catch (error: any) {
        const errorKey = error.message || 'Unknown error'
        errors.set(errorKey, (errors.get(errorKey) || 0) + 1)
      }
    }

    // Create batches for concurrent execution
    const batchSize = config.concurrentRequests
    const totalBatches = Math.ceil(config.totalRequests / batchSize)

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchPromises: Promise<void>[] = []
      const batchStart = batch * batchSize
      const batchEnd = Math.min(batchStart + batchSize, config.totalRequests)

      // Add ramp-up delay if specified
      if (config.rampUpTime && batch > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, config.rampUpTime / totalBatches)
        )
      }

      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(executeRequest(i))
      }

      await Promise.all(batchPromises)
    }

    // Calculate metrics
    const successfulResults = results.filter(r => r.success)
    const responseTimes = successfulResults.map(r => r.responseTime)
    responseTimes.sort((a, b) => a - b)

    const totalDuration = Date.now() - startTime

    return {
      totalRequests: config.totalRequests,
      successfulRequests: successfulResults.length,
      failedRequests: config.totalRequests - successfulResults.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      percentiles: {
        p50: this.calculatePercentile(responseTimes, 50),
        p90: this.calculatePercentile(responseTimes, 90),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      },
      errors: Array.from(errors.entries()).map(([error, count]) => ({
        error,
        count
      })),
      throughput: (config.totalRequests / totalDuration) * 1000
    }
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const index = Math.ceil((percentile / 100) * values.length) - 1
    return values[Math.max(0, index)]
  }
}

// ============================
// 성능 벤치마크 헬퍼
// ============================

export class PerformanceBenchmarker {
  static async benchmark(
    name: string,
    fn: () => Promise<any>,
    iterations: number,
    warmupIterations: number = 5
  ): Promise<BenchmarkResult> {
    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn()
    }

    // Actual benchmark
    const times: number[] = []
    let successCount = 0

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      try {
        await fn()
        successCount++
      } catch (error) {
        // Count failed iterations
      }
      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    times.sort((a, b) => a - b)

    const mean = times.reduce((a, b) => a + b, 0) / times.length
    const median = times[Math.floor(times.length / 2)]
    const variance = times.reduce((sum, time) => 
      sum + Math.pow(time - mean, 2), 0
    ) / times.length
    const standardDeviation = Math.sqrt(variance)

    const totalTime = times.reduce((a, b) => a + b, 0)
    const throughput = (iterations / totalTime) * 1000

    return {
      name,
      iterations,
      metrics: {
        mean,
        median,
        min: times[0],
        max: times[times.length - 1],
        standardDeviation,
        percentiles: {
          p50: this.getPercentile(times, 50),
          p75: this.getPercentile(times, 75),
          p90: this.getPercentile(times, 90),
          p95: this.getPercentile(times, 95),
          p99: this.getPercentile(times, 99)
        }
      },
      throughput,
      successRate: (successCount / iterations) * 100
    }
  }

  private static getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, index)]
  }
}

// ============================
// 테스트 데이터 생성기
// ============================

export class TestDataFactory {
  private static counter = 0

  static generateAIPlanRequest(overrides?: any) {
    this.counter++
    return {
      title: `테스트 영상 기획 ${this.counter}`,
      genre: '광고',
      duration: 60,
      budget: '500만원',
      targetAudience: '20-30대',
      concept: '혁신적인 제품 소개',
      purpose: '브랜드 인지도 향상',
      tone: '전문적이고 신뢰감 있는',
      ...overrides
    }
  }

  static generatePlanCreateRequest(overrides?: any) {
    this.counter++
    return {
      title: `기획서 ${this.counter}`,
      description: `테스트 기획서 설명 ${this.counter}`,
      planType: 'ai-generated' as const,
      tags: ['테스트', '자동생성'],
      ...overrides
    }
  }

  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static generateSpecialChars(): string {
    return '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
  }

  static generateEmoji(): string {
    const emojis = ['😀', '🎬', '📹', '🎥', '🎞️', '📽️', '🎨', '✨', '🚀', '💡']
    return emojis[Math.floor(Math.random() * emojis.length)]
  }

  static generateKoreanText(length: number = 10): string {
    const syllables = '가나다라마바사아자차카타파하'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += syllables.charAt(Math.floor(Math.random() * syllables.length))
    }
    return result
  }

  static generateMultilingualText(): string {
    return `Hello 안녕하세요 こんにちは 你好 ${this.generateEmoji()}`
  }
}

// ============================
// 어서션 헬퍼
// ============================

export class TestAssertions {
  static assertResponseStructure(response: any, expectedStructure: any) {
    if (!Validator.validateStructure(response, expectedStructure)) {
      throw new Error(`Response structure mismatch. Expected: ${JSON.stringify(expectedStructure)}`)
    }
  }

  static assertStatusCode(actual: number, expected: number) {
    if (actual !== expected) {
      throw new Error(`Status code mismatch. Expected: ${expected}, Actual: ${actual}`)
    }
  }

  static assertResponseTime(actual: number, maxTime: number) {
    if (actual > maxTime) {
      throw new Error(`Response time exceeded. Max: ${maxTime}ms, Actual: ${actual}ms`)
    }
  }

  static assertArrayLength(arr: any[], expectedLength: number) {
    if (!Array.isArray(arr) || arr.length !== expectedLength) {
      throw new Error(`Array length mismatch. Expected: ${expectedLength}, Actual: ${arr?.length}`)
    }
  }

  static assertContains(str: string, substring: string) {
    if (!str.includes(substring)) {
      throw new Error(`String does not contain expected substring: ${substring}`)
    }
  }

  static assertNotEmpty(value: any) {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error('Value is empty or undefined')
    }
  }

  static assertInRange(value: number, min: number, max: number) {
    if (value < min || value > max) {
      throw new Error(`Value ${value} is not in range [${min}, ${max}]`)
    }
  }
}

// ============================
// 메트릭 수집기
// ============================

export class MetricsCollector {
  private metrics: APITestMetrics[] = []

  add(metric: APITestMetrics) {
    this.metrics.push(metric)
  }

  getStats() {
    const responseTimes = this.metrics.map(m => m.responseTime)
    const successCount = this.metrics.filter(m => m.success).length

    return {
      totalRequests: this.metrics.length,
      successRate: (successCount / this.metrics.length) * 100,
      averageResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50: this.calculatePercentile(responseTimes, 50),
      p90: this.calculatePercentile(responseTimes, 90),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99)
    }
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  exportToCSV(): string {
    const headers = ['timestamp', 'scenario', 'responseTime', 'statusCode', 'success']
    const rows = this.metrics.map(m => 
      [m.timestamp, m.scenario, m.responseTime, m.statusCode, m.success].join(',')
    )
    return [headers.join(','), ...rows].join('\n')
  }
}