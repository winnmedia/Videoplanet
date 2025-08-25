# VideoPlanet 아키텍처 개선 전략 - 에러 방지 및 FSD 준수도 향상

## 📊 현재 상태 분석 (2025-08-23)

### 1. FSD 준수도 현황: 75%

#### ✅ 잘 구현된 부분 (준수)
- **레이어 구조**: app → features → entities → shared 계층 구조 확립
- **배럴 파일**: 대부분의 슬라이스에 index.ts 구현
- **ESLint 규칙**: FSD 아키텍처 import 규칙 부분 적용
- **에러 처리**: 중앙화된 에러 핸들러 구현 (`shared/lib/errors/error-handlers.ts`)
- **타입 안전성**: TypeScript 전면 도입

#### ❌ 개선 필요 사항 (미준수)
- **상향 의존성 위반**: 6개 파일에서 `../../` 패턴 발견
  - `features/ai-planning/ui/AIPlanningForm/index.tsx`
  - `features/plan-creation/ui/steps/*` (4개 파일)
  - `shared/lib/gantt/gantt.slice.ts`
- **processes 레이어**: 미활용 (복잡한 플로우 처리 누락)
- **widgets 레이어**: 부재 (재사용 가능한 UI 블록 미분리)
- **도메인 순수성**: entities에서 UI 프레임워크 의존성 일부 존재

### 2. 에러 현황 분석

#### 🔴 404 에러 (라우팅)
- **현재 문제점**:
  - 동적 라우트 에러 처리 미흡
  - 중첩 라우트에서 not-found.tsx 일관성 부족
  - 일부 페이지에 error.tsx/not-found.tsx 누락

#### 🔴 500 에러 (서버)
- **현재 문제점**:
  - API 라우트별 에러 처리 일관성 부족
  - Circuit Breaker 미적용 (구현은 있으나 활용 안됨)
  - 재시도 로직 부분 적용

#### 🔴 400 에러 (클라이언트)
- **현재 문제점**:
  - 입력 검증 로직 분산
  - 에러 메시지 일관성 부족
  - 폼 레벨 검증 미흡

#### 🟡 네트워크 에러
- **부분 구현**:
  - WebSocket 에러 처리 존재
  - 오프라인 매니저 구현
  - 일부 API에만 타임아웃 설정

## 🎯 개선 목표

### Phase 1: 즉시 개선 (1주)
- FSD 준수도: 75% → 85%
- 에러 발생률: 30% 감소
- 사용자 경험: 에러 페이지 표시 50% 감소

### Phase 2: 단기 개선 (2-3주)
- FSD 준수도: 85% → 95%
- 에러 발생률: 60% 감소
- 시스템 안정성: 99.5% 가동률

### Phase 3: 장기 개선 (1-2개월)
- FSD 준수도: 95% → 100%
- 에러 발생률: 80% 감소
- 시스템 안정성: 99.9% 가동률

## 🏗️ 아키텍처 개선 전략

### 1. FSD 레이어 분리 강화

#### 1.1 상향 의존성 제거
```typescript
// ❌ 현재 (잘못된 예)
// features/plan-creation/ui/steps/BasicInfoStep/BasicInfoStep.tsx
import { Button } from '../../../shared/ui'

// ✅ 개선 (올바른 예)
import { Button } from '@/shared/ui'
```

#### 1.2 widgets 레이어 도입
```
src/widgets/
├── video-editor/
│   ├── ui/
│   │   ├── VideoEditor.tsx
│   │   └── VideoEditor.module.scss
│   ├── model/
│   │   └── editor.slice.ts
│   └── index.ts
├── comment-thread/
│   ├── ui/
│   │   └── CommentThread.tsx
│   ├── model/
│   │   └── thread.slice.ts
│   └── index.ts
└── project-card/
    ├── ui/
    │   └── ProjectCard.tsx
    └── index.ts
```

#### 1.3 processes 레이어 활성화
```
src/processes/
├── video-planning-flow/
│   ├── ui/
│   │   ├── PlanningWizard.tsx
│   │   └── steps/
│   ├── model/
│   │   └── flow.slice.ts
│   └── index.ts
├── collaboration-session/
│   ├── ui/
│   │   └── CollaborationManager.tsx
│   ├── model/
│   │   └── session.slice.ts
│   └── index.ts
└── onboarding/
    ├── ui/
    │   └── OnboardingFlow.tsx
    └── index.ts
```

### 2. 에러 방지 시스템 구축

#### 2.1 404 에러 방지 전략

##### a) 라우트 가드 구현
```typescript
// src/shared/lib/routing/route-guard.ts
export class RouteGuard {
  private static validRoutes = new Set([
    '/',
    '/dashboard',
    '/planning',
    '/projects',
    '/video-planning',
    '/feedback'
  ])

  static validateRoute(path: string): boolean {
    // 정적 라우트 검증
    if (this.validRoutes.has(path)) return true
    
    // 동적 라우트 패턴 검증
    const dynamicPatterns = [
      /^\/projects\/[a-zA-Z0-9-]+$/,
      /^\/feedback\/[a-zA-Z0-9-]+$/,
      /^\/video-planning\/[a-zA-Z0-9-]+$/
    ]
    
    return dynamicPatterns.some(pattern => pattern.test(path))
  }

  static async validateResource(
    type: 'project' | 'feedback' | 'plan',
    id: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/${type}s/${id}/exists`)
      return response.ok
    } catch {
      return false
    }
  }
}
```

##### b) 모든 동적 라우트에 generateStaticParams 추가
```typescript
// src/app/projects/[id]/page.tsx
export async function generateStaticParams() {
  const projects = await fetchPopularProjects()
  return projects.map(project => ({
    id: project.id
  }))
}

export async function generateMetadata({ params }: Props) {
  const project = await fetchProject(params.id)
  if (!project) notFound()
  
  return {
    title: project.title,
    description: project.description
  }
}
```

##### c) 일관된 에러 페이지 구조
```typescript
// src/app/[segment]/not-found.tsx (모든 세그먼트에 적용)
export default function SegmentNotFound() {
  return (
    <NotFoundTemplate
      title="페이지를 찾을 수 없습니다"
      description="요청하신 페이지가 존재하지 않거나 이동되었습니다"
      suggestions={[
        { label: '대시보드로 이동', href: '/dashboard' },
        { label: '프로젝트 목록', href: '/projects' }
      ]}
    />
  )
}
```

#### 2.2 500 에러 방지 전략

##### a) API 라우트 래퍼 구현
```typescript
// src/shared/lib/api/route-wrapper.ts
export function withErrorHandling<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest) => {
    const requestId = generateRequestId()
    
    try {
      // 요청 검증
      await validateRequest(req)
      
      // 핸들러 실행
      const response = await handler(req)
      
      // 응답 로깅
      logResponse(requestId, response)
      
      return response
    } catch (error) {
      return handleAPIError(error, { requestId })
    }
  }
}

// 사용 예
// src/app/api/plans/route.ts
export const POST = withErrorHandling(async (req) => {
  const data = await req.json()
  const validated = planSchema.parse(data)
  const plan = await createPlan(validated)
  return NextResponse.json({ success: true, data: plan })
})
```

##### b) Circuit Breaker 전역 적용
```typescript
// src/shared/lib/resilience/circuit-breaker-manager.ts
export class CircuitBreakerManager {
  private static breakers = new Map<string, CircuitBreaker>()

  static getBreaker(service: string): CircuitBreaker {
    if (!this.breakers.has(service)) {
      this.breakers.set(service, new CircuitBreaker({
        name: service,
        failureThreshold: 5,
        recoveryTimeout: 60000,
        onStateChange: (state) => {
          console.log(`Circuit breaker ${service}: ${state}`)
          // 모니터링 시스템에 상태 전송
        }
      }))
    }
    return this.breakers.get(service)!
  }

  static async execute<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getBreaker(service)
    return breaker.execute(operation)
  }
}

// 사용 예
const result = await CircuitBreakerManager.execute(
  'openai',
  () => generateAIPlan(input)
)
```

##### c) 재시도 정책 표준화
```typescript
// src/shared/config/retry-policies.ts
export const RETRY_POLICIES = {
  ai: {
    maxAttempts: 3,
    delayMs: 2000,
    backoffMultiplier: 2,
    retryableErrors: ['AI_RATE_LIMIT_EXCEEDED', 'AI_SERVICE_TIMEOUT']
  },
  database: {
    maxAttempts: 2,
    delayMs: 500,
    backoffMultiplier: 1.5,
    retryableErrors: ['DATABASE_CONNECTION_ERROR']
  },
  external: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['EXTERNAL_API_ERROR', 'NETWORK_ERROR']
  }
} as const

// 적용
const result = await withRetry(
  () => database.query(sql),
  RETRY_POLICIES.database
)
```

#### 2.3 400 에러 방지 전략

##### a) 통합 검증 시스템
```typescript
// src/shared/lib/validation/validator.ts
import { z } from 'zod'

export class Validator {
  static schemas = {
    planCreation: z.object({
      title: z.string().min(1).max(100),
      description: z.string().min(10).max(500),
      targetAudience: z.string().min(1).max(200),
      duration: z.number().min(10).max(3600),
      style: z.enum(['documentary', 'vlog', 'tutorial', 'commercial'])
    }),
    
    feedback: z.object({
      content: z.string().min(1).max(1000),
      rating: z.number().min(1).max(5).optional(),
      attachments: z.array(z.string().url()).optional()
    })
  }

  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: ValidationError[] } {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    return {
      success: false,
      errors: this.formatZodErrors(result.error)
    }
  }

  private static formatZodErrors(error: z.ZodError): ValidationError[] {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: this.translateError(err.message),
      code: err.code
    }))
  }

  private static translateError(message: string): string {
    const translations: Record<string, string> = {
      'Required': '필수 입력 항목입니다',
      'String must contain at least': '최소 글자 수를 충족해야 합니다',
      'String must contain at most': '최대 글자 수를 초과했습니다',
      'Invalid email': '올바른 이메일 형식이 아닙니다'
    }

    for (const [key, value] of Object.entries(translations)) {
      if (message.includes(key)) return value
    }
    
    return message
  }
}
```

##### b) 클라이언트 사이드 실시간 검증
```typescript
// src/features/form-validation/hooks/useFormValidation.ts
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback((field: string, value: any) => {
    try {
      const fieldSchema = schema.shape[field]
      fieldSchema.parse(value)
      setErrors(prev => ({ ...prev, [field]: '' }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0].message
        }))
      }
      return false
    }
  }, [schema])

  const validateForm = useCallback((data: Partial<T>) => {
    const result = schema.safeParse(data)
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        const field = err.path[0] as string
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    
    setErrors({})
    return true
  }, [schema])

  return {
    errors,
    touched,
    setTouched,
    validateField,
    validateForm,
    isValid: Object.keys(errors).length === 0
  }
}
```

#### 2.4 네트워크 에러 처리 강화

##### a) 통합 네트워크 관리자
```typescript
// src/shared/lib/network/network-manager.ts
export class NetworkManager {
  private static instance: NetworkManager
  private isOnline = navigator.onLine
  private listeners = new Set<(online: boolean) => void>()
  private requestQueue: QueuedRequest[] = []

  private constructor() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  static getInstance(): NetworkManager {
    if (!this.instance) {
      this.instance = new NetworkManager()
    }
    return this.instance
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners(true)
    this.processQueue()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners(false)
  }

  async fetch(
    url: string,
    options?: RequestInit & { priority?: 'high' | 'normal' | 'low' }
  ): Promise<Response> {
    if (!this.isOnline) {
      if (options?.priority === 'high') {
        throw new NetworkError('오프라인 상태입니다')
      }
      
      // 낮은 우선순위 요청은 큐에 추가
      return this.queueRequest(url, options)
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeout)
      return response
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('요청 시간이 초과되었습니다')
      }
      throw error
    }
  }

  private async queueRequest(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      })
    })
  }

  private async processQueue() {
    while (this.requestQueue.length > 0 && this.isOnline) {
      const request = this.requestQueue.shift()!
      
      try {
        const response = await fetch(request.url, request.options)
        request.resolve(response)
      } catch (error) {
        request.reject(error)
      }
    }
  }
}
```

##### b) WebSocket 재연결 관리
```typescript
// src/shared/lib/realtime/reconnecting-websocket.ts
export class ReconnectingWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(
    private url: string,
    private protocols?: string | string[]
  ) {
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url, this.protocols)
      this.setupEventHandlers()
      this.startHeartbeat()
    } catch (error) {
      this.handleReconnect()
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.onOpen?.()
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket closed', event)
      this.stopHeartbeat()
      
      if (!event.wasClean) {
        this.handleReconnect()
      }
      
      this.onClose?.(event)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error)
      this.onError?.(error)
    }

    this.ws.onmessage = (event) => {
      if (event.data === 'pong') return
      this.onMessage?.(event)
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.onMaxReconnectAttemptsReached?.()
      return
    }

    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      console.warn('WebSocket is not connected')
      // 옵션: 메시지를 큐에 저장하고 재연결 시 전송
    }
  }

  close() {
    this.stopHeartbeat()
    this.ws?.close()
  }

  // 이벤트 핸들러
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (error: Event) => void
  onMessage?: (event: MessageEvent) => void
  onMaxReconnectAttemptsReached?: () => void
}
```

### 3. 의존성 경계 규칙 강화

#### 3.1 ESLint 규칙 업데이트
```json
// .eslintrc.json 추가 규칙
{
  "rules": {
    "boundaries/element-types": [
      "error",
      {
        "default": "disallow",
        "rules": [
          {
            "from": "app",
            "allow": ["processes", "pages", "widgets", "features", "entities", "shared"]
          },
          {
            "from": "processes",
            "allow": ["pages", "widgets", "features", "entities", "shared"]
          },
          {
            "from": "pages",
            "allow": ["widgets", "features", "entities", "shared"]
          },
          {
            "from": "widgets",
            "allow": ["features", "entities", "shared"]
          },
          {
            "from": "features",
            "allow": ["entities", "shared"]
          },
          {
            "from": "entities",
            "allow": ["shared"]
          },
          {
            "from": "shared",
            "allow": []
          }
        ]
      }
    ],
    "boundaries/entry-point": [
      "error",
      {
        "default": "disallow",
        "rules": [
          {
            "target": ["app", "processes", "pages", "widgets", "features", "entities", "shared"],
            "allow": "index.ts"
          }
        ]
      }
    ]
  }
}
```

#### 3.2 빌드 타임 검증
```typescript
// scripts/validate-architecture.ts
import { analyzeProject } from '@feature-sliced/eslint-plugin'

async function validateArchitecture() {
  const violations = await analyzeProject({
    rootDir: './src',
    layers: ['app', 'processes', 'pages', 'widgets', 'features', 'entities', 'shared'],
    strict: true
  })

  if (violations.length > 0) {
    console.error('Architecture violations found:')
    violations.forEach(v => {
      console.error(`  - ${v.file}: ${v.message}`)
    })
    process.exit(1)
  }

  console.log('✅ Architecture validation passed')
}

validateArchitecture()
```

### 4. 모니터링 및 로깅 시스템

#### 4.1 통합 모니터링 대시보드
```typescript
// src/shared/lib/monitoring/monitor.ts
export class Monitor {
  private static metrics = {
    errors: new Map<string, number>(),
    performance: new Map<string, number[]>(),
    availability: {
      uptime: 0,
      downtime: 0,
      lastCheck: Date.now()
    }
  }

  static recordError(category: ErrorCategory, code: string) {
    const key = `${category}:${code}`
    const count = this.metrics.errors.get(key) || 0
    this.metrics.errors.set(key, count + 1)
    
    // 임계값 초과 시 알림
    if (count > 10) {
      this.sendAlert({
        type: 'error_threshold',
        message: `Error ${key} exceeded threshold: ${count} occurrences`
      })
    }
  }

  static recordPerformance(operation: string, duration: number) {
    const durations = this.metrics.performance.get(operation) || []
    durations.push(duration)
    
    // 최근 100개만 유지
    if (durations.length > 100) {
      durations.shift()
    }
    
    this.metrics.performance.set(operation, durations)
    
    // 평균 응답 시간이 임계값 초과 시 알림
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    if (avg > 1000) {
      this.sendAlert({
        type: 'performance_degradation',
        message: `Operation ${operation} average time: ${avg}ms`
      })
    }
  }

  static getMetrics() {
    return {
      errors: Object.fromEntries(this.metrics.errors),
      performance: Object.fromEntries(
        Array.from(this.metrics.performance.entries()).map(([key, values]) => [
          key,
          {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
          }
        ])
      ),
      availability: this.metrics.availability
    }
  }

  private static sendAlert(alert: { type: string; message: string }) {
    // 실제 환경에서는 Slack, Email, PagerDuty 등으로 전송
    console.error(`[ALERT] ${alert.type}: ${alert.message}`)
  }
}
```

#### 4.2 에러 추적 대시보드 컴포넌트
```typescript
// src/widgets/error-dashboard/ui/ErrorDashboard.tsx
export function ErrorDashboard() {
  const [metrics, setMetrics] = useState<MetricsData>()
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/monitoring/metrics')
      const data = await response.json()
      setMetrics(data)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (!metrics) return <LoadingSpinner />

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="에러 발생률"
        value={metrics.errorRate}
        trend={metrics.errorTrend}
        status={metrics.errorRate < 0.01 ? 'good' : 'warning'}
      />
      
      <MetricCard
        title="평균 응답 시간"
        value={`${metrics.avgResponseTime}ms`}
        trend={metrics.responseTrend}
        status={metrics.avgResponseTime < 200 ? 'good' : 'warning'}
      />
      
      <MetricCard
        title="가동률"
        value={`${metrics.uptime}%`}
        trend="stable"
        status={metrics.uptime > 99.5 ? 'good' : 'critical'}
      />
      
      <div className="col-span-full">
        <ErrorChart data={metrics.errorHistory} />
      </div>
      
      <div className="col-span-full">
        <RecentErrors errors={metrics.recentErrors} />
      </div>
    </div>
  )
}
```

## 📋 실행 계획

### Phase 1: 즉시 개선 (Week 1)

#### Day 1-2: 의존성 정리
- [ ] 상향 의존성 6개 파일 수정
- [ ] 절대 경로 임포트로 전환
- [ ] ESLint 규칙 업데이트 및 적용

#### Day 3-4: 에러 페이지 통합
- [ ] 모든 라우트에 error.tsx, not-found.tsx 추가
- [ ] NotFoundTemplate, ErrorTemplate 컴포넌트 생성
- [ ] 404 처리 로직 통합

#### Day 5-7: API 에러 처리
- [ ] withErrorHandling 래퍼 적용
- [ ] 모든 API 라우트에 일관된 에러 처리
- [ ] Circuit Breaker 활성화

### Phase 2: 단기 개선 (Week 2-3)

#### Week 2: 레이어 구조 개선
- [ ] widgets 레이어 도입 및 컴포넌트 이동
- [ ] processes 레이어 활성화
- [ ] 도메인 순수성 확보 (entities 정리)

#### Week 3: 검증 시스템
- [ ] 통합 검증 시스템 구현
- [ ] 모든 폼에 실시간 검증 적용
- [ ] 에러 메시지 표준화

### Phase 3: 장기 개선 (Month 2)

#### Week 4-6: 모니터링 시스템
- [ ] 모니터링 대시보드 구현
- [ ] 알림 시스템 구축
- [ ] 성능 메트릭 수집

#### Week 7-8: 최적화
- [ ] 네트워크 관리자 통합
- [ ] WebSocket 재연결 로직 개선
- [ ] 오프라인 지원 강화

## 📊 성공 지표

### 정량적 지표
- **FSD 준수도**: ESLint 위반 0건
- **에러 발생률**: 월간 에러 80% 감소
- **가동률**: 99.9% 달성
- **평균 응답 시간**: 200ms 이하
- **페이지 로드 시간**: 3초 이하

### 정성적 지표
- **개발자 경험**: 새 기능 개발 시간 30% 단축
- **유지보수성**: 버그 수정 시간 50% 감소
- **코드 품질**: 코드 리뷰 승인률 90% 이상
- **팀 만족도**: 아키텍처 만족도 점수 4.5/5 이상

## 🚀 다음 단계

1. **즉시 시작**: Phase 1 작업 착수
2. **팀 교육**: FSD 아키텍처 워크샵 진행
3. **문서화**: 아키텍처 가이드 작성
4. **자동화**: CI/CD 파이프라인에 검증 추가
5. **모니터링**: 대시보드 구축 및 알림 설정

---

**작성자**: Arthur (Chief Architect)  
**작성일**: 2025-08-23  
**버전**: 1.0.0  
**상태**: 검토 필요

## 부록: 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design)
- [Next.js Error Handling Best Practices](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Web Vitals](https://web.dev/vitals/)