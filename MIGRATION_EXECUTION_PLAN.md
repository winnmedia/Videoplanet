# VideoPlanet 아키텍처 마이그레이션 실행 계획

## 개요
본 문서는 VideoPlanet 프로젝트의 아키텍처 개선을 위한 구체적인 실행 계획입니다.
FSD 준수도를 75%에서 95%로 향상시키고, 시스템 통합을 완성하는 것이 목표입니다.

## 마이그레이션 로드맵

### 🚀 Phase 0: 준비 단계 (현재 - 2025-08-25)

#### 즉시 수정 필요 사항
```bash
# 1. Redux Persist SSR 이슈 해결
# src/app/providers.tsx 수정
```

```typescript
// Before
import storage from 'redux-persist/lib/storage';

// After
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage();
```

#### 체크리스트
- [ ] Redux Persist SSR 수정
- [ ] 백업 브랜치 생성
- [ ] 팀 공지 및 동의
- [ ] 테스트 환경 준비

### 📋 Phase 1: 레거시 정리 (2025-08-26 ~ 2025-08-30)

#### Week 1 Tasks

##### Day 1-2: 레거시 코드 제거
```bash
# 레거시 디렉토리 제거
rm -rf vridge_front/
rm -rf __MACOSX/

# 중복 타입 통합
# src/entities/video-planning/model/types.ts와
# src/features/plan-creation/model/types.ts 통합
```

##### Day 3-4: FSD 구조 정비
```bash
# processes 레이어 활성화
mkdir -p src/processes/{auth,planning,collaboration}

# widgets 레이어 완성
mkdir -p src/widgets/{dashboard,planning-workspace}
```

##### Day 5: 의존성 정리
```javascript
// .eslintrc.json 규칙 강화
{
  "rules": {
    "import/no-internal-modules": ["error", {
      "allow": ["**/index"]
    }],
    "boundaries/element-types": ["error", {
      // 레이어별 의존성 규칙
    }]
  }
}
```

#### 산출물
- [ ] 레거시 코드 제거 완료
- [ ] 타입 정의 통합 완료
- [ ] FSD 폴더 구조 완성
- [ ] ESLint 규칙 적용

### 🔧 Phase 2: API 통합 (2025-08-31 ~ 2025-09-06)

#### Week 2 Tasks

##### Day 1-2: API Gateway 구현
```typescript
// src/shared/api/gateway/index.ts
export class APIGateway {
  private static instance: APIGateway;
  private baseURL = process.env.NEXT_PUBLIC_API_URL;
  
  static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }
  
  async request<T>(config: RequestConfig): Promise<T> {
    // 통합 요청 처리
  }
}
```

##### Day 3-4: OpenAPI 스펙 완성
```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: VideoPlanet API
  version: 1.0.0
paths:
  /api/v1/projects:
    post:
      summary: Create Project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
```

##### Day 5: 계약 테스트 설정
```typescript
// test/contracts/api.contract.test.ts
import { Pact } from '@pact-foundation/pact';

describe('API Contracts', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'Backend',
  });
  
  // 계약 테스트 구현
});
```

#### 산출물
- [ ] API Gateway 클래스 구현
- [ ] OpenAPI 3.0 스펙 문서
- [ ] 계약 테스트 환경 구축
- [ ] API 클라이언트 생성

### ⚡ Phase 3: 실시간 기능 (2025-09-07 ~ 2025-09-13)

#### Week 3 Tasks

##### Day 1-2: WebSocket Manager
```typescript
// src/shared/lib/realtime/websocket-manager.ts
export class WebSocketManager {
  private connections: Map<string, WebSocket>;
  private reconnectAttempts: Map<string, number>;
  
  connect(channel: string): WebSocket {
    // 연결 관리 로직
  }
  
  disconnect(channel: string): void {
    // 연결 해제 로직
  }
  
  private handleReconnection(channel: string): void {
    // 재연결 로직
  }
}
```

##### Day 3-4: 상태 동기화
```typescript
// src/entities/realtime/model/sync.slice.ts
const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    local: {},
    server: {},
    pending: [],
    conflicts: [],
  },
  reducers: {
    optimisticUpdate: (state, action) => {
      // 낙관적 업데이트
    },
    serverReconcile: (state, action) => {
      // 서버 조정
    },
  },
});
```

##### Day 5: 실시간 기능 테스트
```typescript
// test/websocket/integration.test.ts
describe('WebSocket Integration', () => {
  test('실시간 피드백 동기화', async () => {
    // 테스트 구현
  });
});
```

#### 산출물
- [ ] WebSocket Manager 구현
- [ ] 상태 동기화 메커니즘
- [ ] 실시간 기능 테스트
- [ ] 재연결 로직 구현

### 🎯 Phase 4: 성능 최적화 (2025-09-14 ~ 2025-09-20)

#### Week 4 Tasks

##### Day 1-2: 캐싱 전략
```typescript
// src/shared/lib/cache/strategy.ts
export const cacheConfig = {
  rtk: {
    defaultTTL: 300, // 5분
    endpoints: {
      getProjects: 600,
      getFeedback: 300,
    },
  },
  redis: {
    defaultTTL: 86400, // 24시간
    patterns: {
      'project:*': 3600,
      'user:*': 7200,
    },
  },
};
```

##### Day 3-4: 번들 최적화
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', 'lodash'],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
        },
        common: {
          minChunks: 2,
          priority: -10,
        },
      },
    };
    return config;
  },
};
```

##### Day 5: 성능 벤치마크
```bash
# Lighthouse CI 설정
npm run lighthouse:ci

# 번들 분석
npm run analyze

# 성능 테스트
npm run test:performance
```

#### 산출물
- [ ] 캐싱 전략 구현
- [ ] 코드 스플리팅 완료
- [ ] 번들 크기 20% 감소
- [ ] 성능 메트릭 달성

### ✅ Phase 5: 품질 보증 (2025-09-21 ~ 2025-09-27)

#### Week 5 Tasks

##### Day 1-2: 테스트 커버리지
```json
// vitest.config.ts
{
  "coverage": {
    "thresholds": {
      "global": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

##### Day 3-4: 모니터링 설정
```typescript
// src/shared/lib/monitoring/index.ts
export const monitoring = {
  performance: {
    reportWebVitals: (metric) => {
      // 성능 메트릭 전송
    },
  },
  errors: {
    captureException: (error) => {
      // 에러 추적
    },
  },
  analytics: {
    trackEvent: (event) => {
      // 이벤트 추적
    },
  },
};
```

##### Day 5: 최종 검증
```bash
# 전체 테스트 실행
npm run test:all

# 보안 감사
npm audit

# 접근성 검사
npm run a11y

# 배포 준비
npm run build
```

#### 산출물
- [ ] 테스트 커버리지 90% 달성
- [ ] 모니터링 대시보드 구축
- [ ] 보안 취약점 제거
- [ ] 배포 준비 완료

## 리스크 관리

### 위험 요소 및 대응 방안

| 단계 | 리스크 | 확률 | 영향 | 대응 방안 |
|------|--------|------|------|-----------|
| Phase 1 | 레거시 제거 시 의존성 문제 | 중 | 고 | 단계적 제거, 테스트 강화 |
| Phase 2 | API 변경으로 인한 하위 호환성 | 중 | 중 | 버전 관리, 점진적 마이그레이션 |
| Phase 3 | WebSocket 연결 불안정 | 고 | 고 | 재연결 메커니즘, 폴백 전략 |
| Phase 4 | 성능 저하 | 낮 | 중 | 성능 모니터링, 롤백 계획 |
| Phase 5 | 테스트 커버리지 미달 | 중 | 낮 | 단계적 목표 설정 |

## 일일 체크리스트

### 매일 수행할 작업
```markdown
## Daily Checklist
- [ ] 코드 리뷰 수행
- [ ] 테스트 실행 및 확인
- [ ] 성능 메트릭 확인
- [ ] 이슈 트래킹 업데이트
- [ ] 팀 스탠드업 미팅
```

## 주간 마일스톤

| 주차 | 시작일 | 종료일 | 주요 목표 | 완료 기준 |
|------|--------|--------|-----------|-----------|
| Week 1 | 08-26 | 08-30 | 레거시 정리 | FSD 구조 완성 |
| Week 2 | 08-31 | 09-06 | API 통합 | Gateway 구현 |
| Week 3 | 09-07 | 09-13 | 실시간 기능 | WebSocket 안정화 |
| Week 4 | 09-14 | 09-20 | 성능 최적화 | 메트릭 달성 |
| Week 5 | 09-21 | 09-27 | 품질 보증 | 배포 준비 |

## 성공 지표

### 기술적 지표
- **FSD 준수도**: 95% 이상
- **테스트 커버리지**: 90% 이상
- **번들 크기**: 20% 감소
- **빌드 시간**: 30% 단축
- **API 응답시간**: P95 < 200ms

### 비즈니스 지표
- **페이지 로드**: < 1초
- **에러율**: < 0.1%
- **가용성**: 99.9%
- **개발 속도**: 30% 향상

## 롤백 계획

### 각 Phase별 롤백 전략
1. **Phase 1**: Git 이전 커밋으로 복원
2. **Phase 2**: 기존 API 클라이언트 유지
3. **Phase 3**: WebSocket 비활성화, 폴링 방식 전환
4. **Phase 4**: 이전 빌드 설정 복원
5. **Phase 5**: 스테이징 환경 유지

## 커뮤니케이션 계획

### 이해관계자 소통
- **일일 스탠드업**: 오전 10시
- **주간 진행 리포트**: 금요일 오후 5시
- **Phase 완료 리뷰**: 각 Phase 종료 시
- **최종 검토 미팅**: 2025-09-27

### 문서화
- 각 Phase 완료 시 ADR 업데이트
- 주요 변경사항 CHANGELOG 기록
- 팀 위키 업데이트

## 다음 단계

1. **즉시 시작**: Redux Persist 이슈 수정
2. **팀 리뷰**: 실행 계획 검토 (08-24)
3. **킥오프**: Phase 1 시작 (08-26)
4. **모니터링**: 일일 진행 상황 추적

**작성자**: Arthur (Chief Architect)
**승인**: Pending
**최종 수정**: 2025-08-23