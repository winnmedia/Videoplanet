# ADR-001: VideoPlanet 영상 기획 시스템 아키텍처 결정 기록

## 상태
**채택됨** - 2025-08-22

## 컨텍스트

VideoPlanet 프로젝트에 영상 기획 기능을 추가하는 과정에서 다음과 같은 아키텍처 결정이 필요했습니다:

### 현재 상황
- 기존 FSD(Feature-Sliced Design) 아키텍처 사용 중
- React 19 + Next.js 14 App Router 환경
- Redux Toolkit 기반 상태 관리
- TypeScript 완전 적용

### 요구사항
1. **기능적 요구사항**
   - 영상 기획서 CRUD (생성, 읽기, 수정, 삭제)
   - 템플릿 기반 기획서 생성
   - 실시간 협업 (다중 사용자 편집, 댓글)
   - 버전 관리 시스템
   - 프로젝트 연결 및 통합

2. **비기능적 요구사항**
   - 확장성: 향후 AI 기반 기능 추가 용이성
   - 유지보수성: 모듈간 독립성 보장
   - 성능: 대용량 기획서 처리 가능
   - 테스트 가능성: 레이어별 단위 테스트

### 고려한 대안들

#### 대안 1: 단일 거대 컴포넌트 구조
- **장점**: 구현 속도 빠름, 초기 복잡성 낮음
- **단점**: 확장성 부족, 테스트 어려움, 협업 시 충돌

#### 대안 2: 기존 페이지 단위 구조 확장
- **장점**: 기존 패턴과 일치, 러닝 커브 없음
- **단점**: 컴포넌트 재사용성 부족, 비즈니스 로직 분산

#### 대안 3: Feature-Sliced Design 완전 적용
- **장점**: 모듈성, 확장성, 테스트 용이성, 팀 협업 최적화
- **단점**: 초기 설계 복잡성, 보일러플레이트 코드 증가

## 결정사항

**Feature-Sliced Design (FSD) 아키텍처를 영상 기획 시스템에 완전 적용**합니다.

### 레이어 구조
```
app → processes → pages → widgets → features → entities → shared
```

### 구체적 구현 결정

#### 1. Entity Layer: 도메인 모델 중심 설계
```typescript
src/entities/
├── planning/           # 기획서 도메인
│   ├── model/         
│   │   ├── types.ts           # 500+ 라인 종합 타입 정의
│   │   ├── planning.slice.ts  # Redux 상태 관리
│   │   └── selectors.ts       # 복합 선택자
│   ├── lib/           # 도메인 로직
│   ├── api/           # API 통신
│   └── index.ts       # Public API
├── template/          # 템플릿 도메인  
└── collaboration/     # 협업 도메인
```

**결정 근거:**
- 도메인별 완전한 책임 분리
- 타입 안전성 보장 (500+ 라인 TypeScript 정의)
- 비즈니스 로직의 중앙집중식 관리

#### 2. Feature Layer: 기능별 독립 모듈
```typescript
src/features/
├── plan-creation/     # 기획서 생성
├── plan-editor/       # 기획서 편집
├── plan-collaboration/ # 실시간 협업
├── plan-versioning/   # 버전 관리
└── template-management/ # 템플릿 관리
```

**결정 근거:**
- 기능별 독립적 개발 및 테스트 가능
- 각 피처는 UI + 비즈니스 로직만 포함
- 크로스 컷팅 관심사는 shared layer로 분리

#### 3. Widget Layer: 복합 컴포넌트 조립
```typescript
src/widgets/
├── planning-dashboard/ # 종합 대시보드
├── plan-workspace/    # 작업 공간
└── collaboration-panel/ # 협업 패널
```

**결정 근거:**
- 여러 피처를 조합한 고수준 UI 컴포넌트
- 페이지 레벨에서의 복잡성 제거
- 재사용 가능한 복합 기능 모듈

#### 4. 의존성 규칙 엄격 적용
- **상위 레이어 → 하위 레이어만 허용**
- **같은 레이어 내 직접 import 금지**
- **모든 import는 public API (index.ts) 통과**

**ESLint 규칙으로 강제:**
```json
"no-restricted-imports": [
  "error", {
    "patterns": [
      "**/features/*/ui/*",
      "**/entities/*/model/*"
    ],
    "message": "Import through public API only"
  }
]
```

## 세부 아키텍처 결정

### 1. 상태 관리 구조

#### Redux Slice 분리 전략
```typescript
// Entity level: 도메인 상태
planningSlice: {
  plans: VideoPlan[]
  currentPlan: VideoPlan | null
  collaboration: CollaborationState
  analytics: AnalyticsState
}

// Feature level: UI 상태
planCreationSlice: {
  currentStep: number
  formData: CreatePlanRequest
  validation: ValidationState
}
```

**결정 근거:**
- 도메인 상태와 UI 상태 완전 분리
- 각 슬라이스는 단일 책임 원칙 준수
- 타임 트래블 디버깅 및 상태 예측 가능성

### 2. 타입 시스템 설계

#### 포괄적 타입 정의 (500+ 라인)
```typescript
// 핵심 도메인 타입
VideoPlan, PlanSection, PlanVersion, PlanCollaborator, PlanTemplate

// 상태별 열거형
PlanStatus, PlanType, PlanPriority, SectionType, CollaboratorRole

// API 요청/응답 타입
CreatePlanRequest, UpdatePlanRequest, PlanListResponse, PlanStats

// 실시간 이벤트 타입
PlanEvent, CollaborationEvent

// 검증 및 설정 타입  
PlanValidationRule, PLAN_DEFAULTS, PLAN_LIMITS
```

**결정 근거:**
- 컴파일 타임 타입 안전성 보장
- API 계약 명시적 정의
- 자동완성 및 리팩토링 지원 강화

### 3. 실시간 협업 아키텍처

#### WebSocket 통합 전략
```typescript
// Shared layer: 실시간 인프라
shared/lib/realtime/
├── websocket-manager.ts    # 연결 관리
├── event-handlers.ts       # 이벤트 처리
└── presence-tracker.ts     # 사용자 존재감

// Entity layer: 협업 도메인
entities/collaboration/
├── model/realtime.slice.ts # 실시간 상태
├── lib/conflict-resolution.ts # 충돌 해결
└── lib/presence.ts         # 존재감 로직
```

**결정 근거:**
- 기존 WebSocket 테스팅 인프라 활용
- 충돌 해결 및 존재감 관리 내장
- 확장 가능한 이벤트 기반 아키텍처

### 4. 성능 최적화 전략

#### 지연 로딩 및 코드 분할
```typescript
// 동적 import를 통한 피처별 분할
const PlanEditor = lazy(() => import('@/features/plan-editor'))
const CollaborationPanel = lazy(() => import('@/widgets/collaboration-panel'))

// React.memo 및 선택적 렌더링
const MemoizedPlanSection = memo(PlanSection, (prev, next) => 
  prev.content === next.content && prev.lastEditedAt === next.lastEditedAt
)
```

**결정 근거:**
- 초기 로딩 시간 최적화
- 메모리 사용량 효율화
- 대용량 기획서 처리 성능 보장

### 5. 테스트 전략

#### 레이어별 테스트 접근법
```typescript
// Entity: 단위 테스트 (비즈니스 로직)
describe('planningSlice', () => {
  test('should add new plan', () => {...})
  test('should update section content', () => {...})
})

// Feature: 컴포넌트 테스트 (UI 상호작용)  
describe('PlanCreationForm', () => {
  test('should validate form data', () => {...})
  test('should handle step navigation', () => {...})
})

// Widget: 통합 테스트 (워크플로우)
describe('PlanningDashboard', () => {
  test('should load and display plans', () => {...})
  test('should handle filtering and search', () => {...})
})
```

**결정 근거:**
- 각 레이어별 적절한 테스트 범위
- 높은 테스트 커버리지와 신뢰성
- TDD 개발 프로세스 지원

## 기술적 혜택

### 1. 확장성 (Scalability)
- **수평적 확장**: 새로운 피처 추가 시 기존 코드 영향 최소화
- **수직적 확장**: 각 레이어 내에서 독립적 확장 가능
- **팀 확장**: 개발자별 레이어/피처 분담 작업 가능

### 2. 유지보수성 (Maintainability)  
- **단일 책임**: 각 모듈이 하나의 관심사만 담당
- **느슨한 결합**: 레이어 간 의존성 최소화
- **높은 응집성**: 관련 로직의 물리적 집중

### 3. 테스트 가능성 (Testability)
- **모킹 용이성**: 각 레이어별 독립적 테스트
- **예측 가능성**: 순수 함수 및 불변 상태 활용
- **자동화**: CI/CD 파이프라인 통합 지원

### 4. 개발 효율성 (Development Efficiency)
- **코드 재사용**: 공통 로직의 shared layer 집중
- **타입 안전성**: 컴파일 타임 오류 방지
- **개발자 경험**: 자동완성, 리팩토링 지원

## 구현 로드맵

### Phase 1: Foundation (Week 1-2)
- [x] Entity layer 구축 (planning, template, collaboration)
- [x] Redux 상태 관리 설정
- [x] 기본 타입 시스템 완성

### Phase 2: Core Features (Week 3-4) 
- [ ] plan-creation, plan-editor 피처 개발
- [ ] 기본 CRUD 기능 구현
- [ ] 단위 테스트 작성

### Phase 3: Advanced Features (Week 5-6)
- [ ] collaboration, versioning 피처
- [ ] 실시간 기능 구현
- [ ] 통합 테스트

### Phase 4: UI Assembly (Week 7-8)
- [ ] Widget 컴포넌트 구성
- [ ] 사용자 인터페이스 완성
- [ ] E2E 테스트

## 마이그레이션 전략

### 기존 Planning Page 처리
1. **기존 코드 보존**: `/planning/calendar`로 이동
2. **점진적 교체**: 새로운 대시보드를 메인으로 설정
3. **데이터 연결**: 기존 프로젝트 데이터와 통합
4. **사용자 교육**: 새로운 UI/UX 가이드 제공

### 위험 완화 계획
- **롤백 준비**: 기존 시스템 병렬 유지
- **점진적 배포**: 피처별 단계적 릴리스  
- **모니터링**: 성능 및 사용성 지표 추적
- **피드백 루프**: 사용자 의견 반영 프로세스

## 결정의 이유

### 왜 FSD를 선택했는가?

1. **확장성**: VideoPlanet의 미래 성장에 대비
2. **팀 협업**: 여러 개발자가 동시 작업 가능한 구조
3. **코드 품질**: 높은 응집성과 낮은 결합도
4. **유지보수**: 버그 수정 및 기능 추가 시 영향 범위 최소화
5. **테스트**: 각 레이어별 독립적 테스트 환경

### 기대 효과

#### 단기적 효과 (3개월)
- 영상 기획 기능의 안정적 서비스 제공
- 개발팀의 생산성 향상 (모듈별 병렬 개발)
- 코드 품질 지표 개선 (테스트 커버리지, 복잡도)

#### 장기적 효과 (1년)
- AI 기반 기획 지원 기능 추가 용이성
- 다른 도메인(비디오, 피드백)으로의 아키텍처 확산
- 신규 개발자의 빠른 온보딩 및 기여

## 모니터링 및 검증

### 성공 지표
- **코드 메트릭**: 순환 복잡도, 결합도, 응집도
- **성능 지표**: 번들 크기, 로딩 시간, 런타임 성능
- **개발 효율성**: 기능 개발 시간, 버그 발생률
- **사용자 만족도**: UI/UX 피드백, 작업 완료율

### 주기적 검토
- **주간**: 개발 진행 상황 및 차단 요소 검토
- **월간**: 아키텍처 결정의 효과성 평가
- **분기**: 전체 시스템 아키텍처 방향성 재검토

---

**작성자**: Arthur (Chief Architect)  
**검토자**: 개발팀 전체  
**승인일**: 2025-08-22  
**다음 검토 예정일**: 2025-09-22

이 ADR은 VideoPlanet 영상 기획 시스템의 아키텍처 기반이 되며, 모든 개발 결정의 참고 기준으로 활용됩니다.