/**
 * API 테스트 도메인 타입 정의
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

// ============================
// 테스트 시나리오 타입
// ============================

export interface TestScenario {
  name: string
  description: string
  category: 'normal' | 'boundary' | 'edge' | 'error'
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface InputTestCase<T = any> {
  scenario: TestScenario
  input: T
  expectedOutput?: any
  expectedError?: {
    status: number
    code: string
    message?: string
  }
  validate?: (response: any) => void | Promise<void>
}

// ============================
// API 테스트 컨텍스트
// ============================

export interface APITestContext {
  baseUrl: string
  headers: Record<string, string>
  timeout: number
  retryCount: number
}

export interface APITestMetrics {
  responseTime: number
  statusCode: number
  success: boolean
  scenario: string
  timestamp: string
  memoryUsage?: NodeJS.MemoryUsage
  cpuUsage?: NodeJS.CpuUsage
}

// ============================
// 동시성 테스트 타입
// ============================

export interface ConcurrencyTestConfig {
  concurrentRequests: number
  totalRequests: number
  rampUpTime?: number // milliseconds
  testDuration?: number // milliseconds
  requestGenerator: () => Promise<any>
}

export interface ConcurrencyTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  percentiles: {
    p50: number
    p90: number
    p95: number
    p99: number
  }
  errors: Array<{
    error: string
    count: number
  }>
  throughput: number // requests per second
}

// ============================
// 부하 테스트 타입
// ============================

export interface LoadTestStage {
  duration: number // seconds
  targetVU: number // virtual users
  rampUp?: boolean
}

export interface LoadTestConfig {
  stages: LoadTestStage[]
  thresholds?: {
    maxResponseTime?: number
    maxErrorRate?: number
    minThroughput?: number
  }
}

export interface LoadTestMetrics {
  timestamp: string
  activeVUs: number
  requestsPerSecond: number
  averageResponseTime: number
  errorRate: number
  memoryUsage: number
  cpuUsage: number
}

// ============================
// 통합 테스트 타입
// ============================

export interface IntegrationTestScenario {
  name: string
  description: string
  steps: IntegrationTestStep[]
  cleanup?: () => Promise<void>
}

export interface IntegrationTestStep {
  name: string
  action: () => Promise<any>
  validate: (result: any, context: any) => void | Promise<void>
  rollback?: () => Promise<void>
}

export interface IntegrationTestResult {
  scenario: string
  success: boolean
  completedSteps: string[]
  failedStep?: string
  error?: string
  duration: number
  context?: any
}

// ============================
// 성능 벤치마크 타입
// ============================

export interface PerformanceBenchmark {
  name: string
  endpoint: string
  method: string
  payload?: any
  iterations: number
  warmupIterations?: number
}

export interface BenchmarkResult {
  name: string
  iterations: number
  metrics: {
    mean: number
    median: number
    min: number
    max: number
    standardDeviation: number
    percentiles: {
      p50: number
      p75: number
      p90: number
      p95: number
      p99: number
    }
  }
  throughput: number
  successRate: number
}

// ============================
// 검증 유틸리티 타입
// ============================

export interface ValidationRule<T = any> {
  field: string
  validator: (value: T) => boolean
  errorMessage: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

// ============================
// 모니터링 타입
// ============================

export interface APIHealthCheck {
  endpoint: string
  expectedStatus: number
  timeout: number
  interval: number
}

export interface HealthCheckResult {
  healthy: boolean
  responseTime: number
  statusCode: number
  error?: string
  timestamp: string
}

// ============================
// 데이터 생성기 타입
// ============================

export interface TestDataGenerator<T = any> {
  generate(): T
  generateMany(count: number): T[]
  generateWithOverrides(overrides: Partial<T>): T
}

export interface TestDataFactoryConfig {
  seed?: number
  locale?: string
  deterministic?: boolean
}

// ============================
// AI 기획 생성 테스트 타입
// ============================

export interface AIGenerationTestCase {
  scenario: TestScenario
  input: {
    title: string
    genre: string
    duration: number
    budget: string
    targetAudience: string
    concept: string
    purpose: string
    tone: string
  }
  validation: {
    checkStoryStructure: boolean
    checkShotCount: boolean
    checkDurationDistribution: boolean
    checkContentQuality: boolean
  }
}

export interface AIGenerationValidationResult {
  structureValid: boolean
  shotCountValid: boolean
  durationValid: boolean
  contentQualityScore: number
  issues: string[]
}