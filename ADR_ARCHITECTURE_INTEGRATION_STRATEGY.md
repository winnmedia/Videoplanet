# ADR-002: VideoPlanet 통합 아키텍처 전략 및 검증 보고서

## 상태
**검증 완료 및 채택** - 2025-08-23

## 요약
VideoPlanet 프로젝트의 전체 아키텍처를 검증하고, 프론트엔드-백엔드 통합 전략을 수립했습니다. Feature-Sliced Design(FSD) 준수도를 평가하고, 마이크로서비스 vs 모놀리스 결정, 실시간 기능 아키텍처, 캐싱 전략을 포함한 종합적인 통합 계획을 제시합니다.

## 컨텍스트

### 현재 아키텍처 상태 평가

#### 1. 기술 스택 검증 ✅
- **Frontend**: Next.js 15.1.3, React 19, TypeScript 5.7.2
- **Backend**: Django 4.2.2, PostgreSQL, Redis
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **Testing**: Vitest, Playwright
- **Real-time**: WebSocket (Django Channels) - 부분 구현

#### 2. FSD 준수도 평가: 75/100
**강점**:
- ✅ 명확한 레이어 구조 (app → features → entities → shared)
- ✅ TypeScript 경로 별칭 설정 완료
- ✅ ESLint 규칙으로 의존성 강제
- ✅ Public API (index.ts) 패턴 부분 적용

**개선 필요 사항**:
- ⚠️ processes 레이어 미활용 (복잡한 비즈니스 플로우 분산)
- ⚠️ widgets 레이어 불완전한 구현
- ⚠️ 일부 features에서 직접 API 호출 (entities 우회)
- ⚠️ 도메인 모델과 DTO 분리 미흡

### 아키텍처 이슈 분석

#### 1. 구조적 문제
- **중복 코드베이스**: vridge_front (React 레거시) + src (Next.js) 병존
- **타입 중복**: 동일한 인터페이스가 여러 위치에 정의
- **레이어 위반**: app layer에서 직접 비즈니스 로직 처리
- **API 일관성 부족**: REST와 WebSocket 간 데이터 포맷 불일치

#### 2. 성능 이슈
- **Redux Persist 오류**: SSR 환경에서 localStorage 접근 실패
- **Long Task 경고**: video-planning/ai 페이지 290ms (임계값 50ms 초과)
- **번들 크기**: 사용하지 않는 수동 기획 기능 포함

#### 3. 보안 및 인프라
- **CORS 설정 불일치**: Django와 Next.js 간 설정 차이
- **인증 토큰 관리**: JWT 갱신 로직 미구현
- **WebSocket 확장성**: 로드 밸런싱 미구현

## 결정 사항

### 1. 아키텍처 패러다임: 모듈라 모놀리스 선택

**결정**: 마이크로서비스 대신 **모듈라 모놀리스** 아키텍처 채택

**근거**:
- 현재 팀 규모(5-10명)에 적합
- 운영 복잡도 최소화
- 향후 마이크로서비스 전환 가능한 구조
- 도메인 경계 명확화를 통한 모듈성 확보

**구현 전략**:
```
Frontend (Next.js)          Backend (Django)
├── app/                    ├── core/
├── processes/              ├── projects/
├── pages/                  ├── feedbacks/
├── widgets/                ├── ai_planning/
├── features/               ├── users/
├── entities/               └── utils/
└── shared/
```

### 2. 프론트엔드-백엔드 통합 전략

#### 계약 기반 개발 (Contract-First Development)
```yaml
# OpenAPI 3.0 Specification
/api/v1/projects:
  post:
    contract:
      request: CreateProjectRequest
      response: ProjectResponse
      errors: [ValidationError, AuthError]
```

#### API Gateway 패턴
```typescript
// src/shared/api/gateway.ts
class APIGateway {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;
  private wsURL = process.env.NEXT_PUBLIC_WS_URL;
  
  // REST API 통합
  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // 인증, 재시도, 에러 처리 통합
  }
  
  // WebSocket 연결 관리
  createRealtimeConnection(channel: string): WebSocketConnection {
    // 재연결, 하트비트, 상태 동기화
  }
}
```

### 3. 실시간 기능 아키텍처

#### WebSocket 통합 전략
```typescript
// src/entities/realtime/model/websocket-manager.ts
interface RealtimeArchitecture {
  transport: 'websocket' | 'socket.io' | 'sse';
  channels: {
    feedback: '/ws/feedback/{id}/',
    project: '/ws/project/{id}/',
    notifications: '/ws/notifications/',
  };
  features: {
    reconnection: true,
    heartbeat: 30000, // 30초
    compression: true,
    authentication: 'jwt-token',
  };
}
```

#### 상태 동기화 전략
```typescript
// Optimistic Updates + Server Reconciliation
const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: {
    local: {},      // 낙관적 업데이트
    server: {},     // 서버 상태
    pending: [],    // 대기 중인 작업
  },
  reducers: {
    optimisticUpdate: (state, action) => {
      // 즉시 UI 업데이트
      state.local[action.payload.id] = action.payload.data;
      state.pending.push(action.payload);
    },
    serverConfirm: (state, action) => {
      // 서버 확인 후 동기화
      state.server[action.payload.id] = action.payload.data;
      state.pending = state.pending.filter(p => p.id !== action.payload.id);
    },
  },
});
```

### 4. 캐싱 및 상태 관리 전략

#### 다층 캐싱 아키텍처
```typescript
interface CachingStrategy {
  layers: {
    L1_Browser: {
      tool: 'RTK Query',
      ttl: 300, // 5분
      scope: 'session',
    },
    L2_CDN: {
      tool: 'Vercel Edge Cache',
      ttl: 3600, // 1시간
      scope: 'global',
    },
    L3_Redis: {
      tool: 'Redis',
      ttl: 86400, // 24시간
      scope: 'application',
    },
    L4_Database: {
      tool: 'PostgreSQL',
      ttl: Infinity,
      scope: 'persistent',
    },
  },
  invalidation: {
    strategy: 'event-driven',
    triggers: ['mutation', 'websocket', 'manual'],
  },
}
```

#### 상태 관리 통합
```typescript
// src/shared/lib/store/index.ts
export const store = configureStore({
  reducer: {
    // Domain slices (entities)
    user: userSlice.reducer,
    project: projectSlice.reducer,
    feedback: feedbackSlice.reducer,
    planning: planningSlice.reducer,
    
    // Feature slices
    auth: authSlice.reducer,
    fileUpload: fileSlice.reducer,
    
    // Infrastructure
    api: apiSlice.reducer,        // RTK Query
    realtime: realtimeSlice.reducer, // WebSocket
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['realtime/connect'],
      },
    }).concat(apiSlice.middleware),
});
```

### 5. 의존성 규칙 및 경계 정의

#### 엄격한 레이어 규칙 적용
```javascript
// .eslintrc.json 강화
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
    ]
  }
}
```

### 6. 계약 테스트 전략

#### Consumer-Driven Contract Testing
```typescript
// test/contracts/feedback-api.contract.test.ts
describe('Feedback API Contract', () => {
  const pact = new Pact({
    consumer: 'Frontend',
    provider: 'Backend API',
  });

  beforeAll(() => pact.setup());
  afterAll(() => pact.finalize());

  test('create feedback', async () => {
    await pact.addInteraction({
      state: 'authenticated user',
      uponReceiving: 'a request to create feedback',
      withRequest: {
        method: 'POST',
        path: '/api/v1/feedbacks',
        headers: { 'Content-Type': 'application/json' },
        body: like({
          content: 'Great work!',
          timestamp: 120,
        }),
      },
      willRespondWith: {
        status: 201,
        body: like({
          id: uuid(),
          content: 'Great work!',
          timestamp: 120,
          createdAt: iso8601DateTime(),
        }),
      },
    });

    // 실제 테스트 실행
    const response = await api.createFeedback({
      content: 'Great work!',
      timestamp: 120,
    });

    expect(response.status).toBe(201);
  });
});
```

## 마이그레이션 계획

### Phase 1: 기반 정비 (Week 1-2)
1. **레거시 코드 제거**
   - vridge_front 디렉토리 제거
   - 중복 타입 정의 통합
   - 사용하지 않는 의존성 제거

2. **FSD 구조 강화**
   - processes 레이어 활성화
   - widgets 레이어 완성
   - Public API 패턴 전면 적용

### Phase 2: API 통합 (Week 3-4)
1. **OpenAPI 스펙 완성**
   - 모든 엔드포인트 문서화
   - 요청/응답 스키마 정의
   - 에러 코드 표준화

2. **API Gateway 구현**
   - 통합 클라이언트 개발
   - 인증/인가 중앙화
   - 에러 처리 통합

### Phase 3: 실시간 기능 (Week 5-6)
1. **WebSocket 인프라**
   - 연결 관리자 구현
   - 재연결 로직
   - 상태 동기화

2. **실시간 기능 구현**
   - 협업 편집
   - 실시간 알림
   - 프레즌스 표시

### Phase 4: 성능 최적화 (Week 7-8)
1. **캐싱 전략 구현**
   - RTK Query 설정
   - Redis 캐시 레이어
   - CDN 최적화

2. **번들 최적화**
   - 코드 스플리팅
   - 동적 임포트
   - Tree shaking

### Phase 5: 품질 보증 (Week 9-10)
1. **테스트 커버리지**
   - 단위 테스트 90%
   - 통합 테스트
   - E2E 테스트

2. **모니터링 설정**
   - 성능 모니터링
   - 에러 추적
   - 사용자 행동 분석

## 리스크 및 완화 전략

### 기술적 리스크
| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| WebSocket 확장성 | 높음 | 높음 | Redis Pub/Sub, 로드 밸런싱 |
| 상태 동기화 충돌 | 중간 | 높음 | CRDT, Event Sourcing |
| 캐시 일관성 | 중간 | 중간 | 이벤트 기반 무효화 |
| 타입 안정성 | 낮음 | 높음 | 런타임 검증, Zod 스키마 |

### 비즈니스 리스크
| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| 마이그레이션 지연 | 중간 | 높음 | 단계적 릴리즈, 기능 플래그 |
| 사용자 혼란 | 낮음 | 중간 | A/B 테스팅, 점진적 롤아웃 |
| 다운타임 | 낮음 | 높음 | Blue-Green 배포, 롤백 계획 |

## 성공 지표

### 기술 지표
- **FSD 준수도**: 75% → 95%
- **테스트 커버리지**: 71% → 90%
- **번들 크기**: -20% 감소
- **API 응답 시간**: <200ms (P95)
- **WebSocket 레이턴시**: <100ms

### 비즈니스 지표
- **페이지 로드 시간**: <1초
- **에러율**: <0.1%
- **가용성**: 99.9%
- **개발 속도**: +30% 향상

## 권장 사항

### 즉시 실행 (Priority 1)
1. Redux Persist SSR 이슈 해결
2. 중복 타입 정의 통합
3. ESLint 규칙 강화
4. API 계약 문서화

### 단기 실행 (Priority 2)
1. processes 레이어 활성화
2. WebSocket 매니저 구현
3. 캐싱 전략 구현
4. 계약 테스트 도입

### 장기 실행 (Priority 3)
1. 마이크로프론트엔드 검토
2. GraphQL 마이그레이션 검토
3. 서버리스 아키텍처 검토
4. 쿠버네티스 오케스트레이션

## 결론

VideoPlanet 프로젝트는 견고한 기술 기반을 갖추고 있으나, FSD 아키텍처 준수도와 프론트엔드-백엔드 통합에서 개선이 필요합니다. 제시된 모듈라 모놀리스 아키텍처와 단계적 마이그레이션 계획을 통해 확장 가능하고 유지보수가 용이한 시스템으로 진화할 수 있을 것입니다.

**승인**: Arthur (Chief Architect)
**날짜**: 2025-08-23
**버전**: 1.0.0