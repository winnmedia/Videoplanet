# VideoPlanet UX 개선 사양서

## 1. 정보 아키텍처 개선

### 1.1 네비게이션 구조 단순화

```
Primary Navigation (항상 표시)
├── 홈 (Dashboard)
├── 프로젝트
│   ├── 전체 보기
│   ├── 진행 중
│   └── 완료됨
├── 영상 기획
│   ├── AI 기획
│   └── 기획서 관리
└── 피드백
    ├── 내 피드백
    └── 공유된 피드백
```

### 1.2 사용자 플로우 최적화

#### 게스트 → 회원 전환 플로우
```gherkin
Feature: 게스트 사용자 온보딩
  
  Scenario: 게스트가 AI 기획 체험 후 회원가입
    Given 게스트 사용자가 홈페이지에 방문했을 때
    When "AI 기획 체험하기" 버튼을 클릭하면
    Then 간단한 입력 폼이 표시되고
    And 게스트로 기획서를 생성할 수 있으며
    When 기획서 생성이 완료되면
    Then "저장하려면 회원가입" CTA가 표시되고
    And 소셜 로그인으로 즉시 저장 가능
```

#### 주요 태스크 플로우
```gherkin
Feature: 영상 피드백 수집
  
  Scenario: 피드백 링크 공유 및 수집
    Given 로그인한 사용자가 피드백 페이지에 있을 때
    When 영상을 업로드하고
    And "공유 링크 생성" 버튼을 클릭하면
    Then 고유한 공유 URL이 생성되고
    And 클립보드에 자동 복사되며
    And "링크가 복사되었습니다" 토스트가 표시됨
    
  Scenario: 게스트의 피드백 제공
    Given 공유 링크를 받은 게스트가 접속했을 때
    Then 영상이 즉시 재생 가능하고
    And 타임스탬프 기반 댓글을 남길 수 있으며
    When 피드백을 제출하면
    Then "피드백이 전송되었습니다" 확인 메시지가 표시됨
```

## 2. UI 컴포넌트 표준화

### 2.1 버튼 시스템

```typescript
// 버튼 변형 정의
type ButtonVariant = 
  | 'primary'    // 주요 액션 (브랜드 색상)
  | 'secondary'  // 보조 액션
  | 'danger'     // 삭제, 취소 등
  | 'ghost'      // 최소 스타일
  | 'link'       // 링크 스타일

// 버튼 크기
type ButtonSize = 
  | 'small'      // 32px height
  | 'medium'     // 40px height
  | 'large'      // 48px height

// 상태별 스타일
type ButtonState =
  | 'default'
  | 'hover'
  | 'focus'
  | 'active'
  | 'disabled'
  | 'loading'
```

### 2.2 폼 컨트롤

```typescript
// 입력 필드 상태
interface InputState {
  default: string;
  focus: string;
  error: string;
  success: string;
  disabled: string;
}

// 폼 피드백 메시지
interface FormFeedback {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  icon?: ReactNode;
}
```

## 3. 에러 상태 디자인

### 3.1 404 페이지 개선

```tsx
interface NotFoundPageProps {
  title: "페이지를 찾을 수 없습니다";
  description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.";
  suggestions: [
    "홈으로 돌아가기",
    "이전 페이지로",
    "고객 지원 문의"
  ];
  illustration: "minimal-404.svg";
}
```

### 3.2 500 에러 페이지

```tsx
interface ErrorPageProps {
  title: "일시적인 오류가 발생했습니다";
  description: "잠시 후 다시 시도해 주세요.";
  actions: [
    { label: "새로고침", action: "reload" },
    { label: "홈으로", action: "home" },
    { label: "문제 신고", action: "report" }
  ];
  errorId: string; // 추적을 위한 고유 ID
}
```

### 3.3 빈 상태 (Empty State)

```tsx
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 사용 예시
const emptyStates = {
  projects: {
    title: "아직 프로젝트가 없습니다",
    description: "첫 번째 프로젝트를 만들어 보세요",
    action: "프로젝트 만들기"
  },
  feedback: {
    title: "피드백이 없습니다",
    description: "영상을 공유하고 피드백을 받아보세요",
    action: "영상 업로드"
  },
  search: {
    title: "검색 결과가 없습니다",
    description: "다른 검색어를 시도해 보세요",
    action: null
  }
};
```

## 4. 로딩 상태 패턴

### 4.1 스켈레톤 로더

```tsx
// 프로젝트 카드 스켈레톤
<div className="skeleton-card">
  <div className="skeleton-image" />
  <div className="skeleton-title" />
  <div className="skeleton-text" />
  <div className="skeleton-text short" />
</div>

// 리스트 스켈레톤
<div className="skeleton-list">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="skeleton-item">
      <div className="skeleton-avatar" />
      <div className="skeleton-content">
        <div className="skeleton-text" />
        <div className="skeleton-text short" />
      </div>
    </div>
  ))}
</div>
```

### 4.2 프로그레스 인디케이터

```tsx
interface ProgressIndicator {
  type: 'linear' | 'circular' | 'dots';
  value?: number; // 0-100 for determinate
  label?: string;
  size?: 'small' | 'medium' | 'large';
}
```

## 5. 접근성 개선

### 5.1 키보드 네비게이션

```typescript
// 키보드 단축키 정의
const keyboardShortcuts = {
  'cmd+k': 'openSearch',
  'cmd+n': 'createProject',
  'cmd+/': 'toggleHelp',
  'esc': 'closeModal',
  'tab': 'nextFocusable',
  'shift+tab': 'prevFocusable',
  'enter': 'activateElement',
  'space': 'toggleCheckbox'
};

// 포커스 트랩 구현
function useFocusTrap(ref: RefObject<HTMLElement>) {
  // 모달, 드롭다운 등에서 포커스를 가둠
}
```

### 5.2 ARIA 속성

```tsx
// 버튼 접근성
<button
  aria-label="프로젝트 삭제"
  aria-describedby="delete-warning"
  aria-pressed={isActive}
  aria-busy={isLoading}
  role="button"
  tabIndex={0}
>
  삭제
</button>

// 라이브 리전
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>

// 네비게이션 랜드마크
<nav aria-label="주 메뉴">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/dashboard">홈</a>
    </li>
  </ul>
</nav>
```

### 5.3 색상 대비

```scss
// WCAG AA 기준 충족
$color-contrasts: (
  'text-on-primary': 7.5:1,    // #fff on #1631F8
  'text-on-surface': 15.3:1,   // #0f172a on #fff
  'text-muted': 4.5:1,         // #64748b on #fff
  'error-text': 4.5:1,         // #dc3545 on #fff
  'success-text': 4.5:1        // #28a745 on #fff
);
```

## 6. 반응형 디자인 개선

### 6.1 브레이크포인트 전략

```scss
// Mobile First 접근
$breakpoints: (
  'sm': 640px,   // 태블릿 세로
  'md': 768px,   // 태블릿 가로
  'lg': 1024px,  // 데스크톱
  'xl': 1280px,  // 대형 데스크톱
  '2xl': 1536px  // 초대형 화면
);

// 적응형 레이아웃
.container {
  width: 100%;
  padding: 0 1rem;
  
  @media (min-width: 640px) {
    max-width: 640px;
    margin: 0 auto;
  }
  
  @media (min-width: 768px) {
    max-width: 768px;
  }
  
  @media (min-width: 1024px) {
    max-width: 1024px;
    padding: 0 2rem;
  }
}
```

### 6.2 모바일 네비게이션

```tsx
// 하단 네비게이션 바 (모바일)
<nav className="mobile-nav">
  <a href="/dashboard" className="nav-item active">
    <HomeIcon />
    <span>홈</span>
  </a>
  <a href="/projects" className="nav-item">
    <ProjectIcon />
    <span>프로젝트</span>
  </a>
  <a href="/planning" className="nav-item">
    <PlanIcon />
    <span>기획</span>
  </a>
  <a href="/feedback" className="nav-item">
    <FeedbackIcon />
    <span>피드백</span>
  </a>
  <a href="/profile" className="nav-item">
    <ProfileIcon />
    <span>프로필</span>
  </a>
</nav>
```

## 7. 성능 최적화

### 7.1 코드 스플리팅

```typescript
// 라우트 기반 스플리팅
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Planning = lazy(() => import('./pages/Planning'));
const Feedback = lazy(() => import('./pages/Feedback'));

// 컴포넌트 레벨 스플리팅
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));
const CommentSystem = lazy(() => import('./components/CommentSystem'));
```

### 7.2 이미지 최적화

```tsx
// Next.js Image 컴포넌트 활용
import Image from 'next/image';

<Image
  src="/hero-image.webp"
  alt="Hero"
  width={1200}
  height={600}
  priority={true}
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### 7.3 메모이제이션

```tsx
// 컴포넌트 메모이제이션
const ProjectCard = React.memo(({ project }) => {
  // 렌더링 로직
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id;
});

// 값 메모이제이션
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 콜백 메모이제이션
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## 8. 마이크로인터랙션

### 8.1 호버 효과

```scss
.interactive-element {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
```

### 8.2 애니메이션

```scss
// 페이드 인
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// 슬라이드
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

// 펄스
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 9. 테스트 시나리오

### 9.1 E2E 테스트 케이스

```gherkin
Feature: 사용자 온보딩

  Background:
    Given 사용자가 VideoPlanet 홈페이지에 접속했을 때
    
  Scenario: 첫 방문자 온보딩
    When 처음 방문하는 사용자일 때
    Then 환영 메시지가 표시되고
    And "시작하기" CTA 버튼이 강조되며
    When "시작하기" 버튼을 클릭하면
    Then 간단한 튜토리얼이 시작됨
    
  Scenario: 회원가입 플로우
    When "회원가입" 버튼을 클릭하면
    Then 소셜 로그인 옵션이 표시되고
    When Google 로그인을 선택하면
    Then OAuth 플로우가 시작되고
    And 성공 시 대시보드로 이동함
    
  Scenario: 게스트 체험
    When "체험하기" 버튼을 클릭하면
    Then AI 기획 도구가 제한적으로 사용 가능하고
    When 기획서를 생성하면
    Then "저장하려면 로그인" 프롬프트가 표시됨
```

### 9.2 접근성 테스트

```typescript
describe('Accessibility Tests', () => {
  test('키보드만으로 전체 네비게이션 가능', async () => {
    // Tab 키로 모든 인터랙티브 요소 접근 가능
    // Enter/Space로 활성화 가능
    // Esc로 모달/드롭다운 닫기 가능
  });
  
  test('스크린 리더 호환성', async () => {
    // 모든 이미지에 alt 텍스트
    // 폼 요소에 라벨 연결
    // ARIA 랜드마크 적절히 사용
  });
  
  test('색상 대비 WCAG AA 충족', async () => {
    // 텍스트 대비 4.5:1 이상
    // 큰 텍스트 대비 3:1 이상
    // 인터랙티브 요소 구분 가능
  });
});
```

## 10. 성공 지표 (KPIs)

### 10.1 사용성 지표
- 태스크 완료율: 85% 이상
- 평균 태스크 완료 시간: 3분 이내
- 오류 발생률: 5% 이하
- 사용자 만족도 (SUS): 80점 이상

### 10.2 성능 지표
- First Contentful Paint: 1.5초 이내
- Time to Interactive: 3초 이내
- Cumulative Layout Shift: 0.1 이하
- 페이지 로드 시간: 2초 이내

### 10.3 접근성 지표
- Lighthouse 접근성 점수: 95점 이상
- 키보드 네비게이션 성공률: 100%
- 스크린 리더 호환성: 100%
- WCAG 2.1 AA 준수율: 100%

### 10.4 비즈니스 지표
- 게스트 → 회원 전환율: 25% 이상
- 일일 활성 사용자 (DAU): 20% 증가
- 사용자 이탈률: 15% 감소
- 피드백 제출 완료율: 70% 이상

## 11. 구현 우선순위

### Phase 1 (즉시 개선 - 1주차)
1. ✅ 하드코딩된 색상을 디자인 토큰으로 교체
2. ✅ 버튼 컴포넌트 통일
3. ✅ 에러/로딩/빈 상태 컴포넌트 구현
4. ✅ 기본 접근성 개선 (포커스, ARIA)

### Phase 2 (핵심 개선 - 2-3주차)
1. 네비게이션 구조 단순화
2. 폼 피드백 시스템 구현
3. 모바일 반응형 디자인
4. 키보드 네비게이션 지원

### Phase 3 (최적화 - 4주차)
1. 성능 최적화 (메모이제이션, 코드 스플리팅)
2. 마이크로인터랙션 추가
3. E2E 테스트 구현
4. 분석 및 모니터링 설정

## 12. 기술 스택 권장사항

### 상태 관리
- Redux Toolkit (글로벌 상태)
- React Query (서버 상태)
- React Hook Form (폼 상태)

### 스타일링
- CSS Modules (컴포넌트 스타일)
- Tailwind CSS (유틸리티)
- Framer Motion (애니메이션)

### 테스팅
- Vitest (단위 테스트)
- Playwright (E2E 테스트)
- Storybook (컴포넌트 테스트)

### 성능
- Next.js Image (이미지 최적화)
- React.lazy (코드 스플리팅)
- Web Vitals (성능 모니터링)

---

이 사양서는 VideoPlanet의 UX/UI를 체계적으로 개선하기 위한 상세한 가이드라인입니다. 각 섹션은 독립적으로 구현 가능하며, 우선순위에 따라 단계적으로 적용할 수 있습니다.