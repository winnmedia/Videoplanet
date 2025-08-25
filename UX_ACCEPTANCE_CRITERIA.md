# VideoPlanet UX 수락 기준 및 테스트 시나리오

## 🎯 핵심 사용자 여정별 수락 기준

### 1. AI 비디오 기획 여정

```gherkin
Feature: AI 비디오 기획 사용자 경험
  As a 콘텐츠 크리에이터
  I want to AI를 활용한 비디오 기획을 쉽게 생성
  So that 전문적인 기획안을 빠르게 만들 수 있다

  Background:
    Given 사용자가 VideoPlanet 홈페이지에 있고
    And 브라우저 viewport는 1920x1080이며
    And 네트워크 연결이 안정적이다

  @critical @guest
  Scenario: 게스트 사용자의 AI 기획 첫 경험
    Given 로그인하지 않은 상태에서
    When 홈페이지의 "AI 기획 체험하기" CTA를 클릭하면
    Then 1초 이내에 AI 기획 페이지로 이동하고
    And 페이지 상단에 "로그인 없이 체험 가능" 배지가 표시되며
    And 스토리 입력 폼이 즉시 인터랙티브 상태가 되고
    And 각 입력 필드에 플레이스홀더와 도움말 아이콘이 있으며
    And 하단에 "저장하려면 로그인" 안내가 부드럽게 표시된다

  @critical @form-validation
  Scenario Outline: 실시간 폼 유효성 검사
    Given AI 기획 폼이 표시된 상태에서
    When "<field>" 필드에 "<input>"을 입력하면
    Then <delay>ms 디바운스 후 검증이 실행되고
    And "<validation_result>"가 필드 하단에 표시되며
    And 입력 필드 테두리가 "<border_color>"로 변경된다

    Examples:
      | field           | input                | delay | validation_result        | border_color |
      | story-title     | 테스트              | 300   | 3자 이상 입력필요       | #ffc107      |
      | story-title     | 매우 긴 제목 테스트... | 300   | 30자 이내로 입력       | #dc3545      |
      | story-title     | 완벽한 제목         | 300   | 적절한 길이입니다       | #28a745      |
      | target-audience | 2                   | 300   | 구체적으로 작성해주세요  | #ffc107      |
      | target-audience | 20-30대 직장인 여성  | 300   | 명확한 타겟입니다       | #28a745      |

  @critical @ai-generation
  Scenario: 4단계 스토리 생성 성공
    Given 모든 필수 필드가 유효하게 입력된 상태에서
    When "4단계 생성하기" 버튼을 클릭하면
    Then 버튼이 비활성화되고 "생성 중..." 텍스트로 변경되며
    And 프로그레스 바가 0%에서 시작하여 점진적으로 증가하고
    And 15초 이내에 4개의 스토리 카드가 순차적으로 나타나며
    And 각 카드에는 "기", "승", "전", "결" 라벨이 있고
    And 편집 가능 아이콘이 각 카드에 표시되며
    And "다음: 12개 숏트 생성" 버튼이 활성화된다

  @error-handling
  Scenario: AI API 실패 시 우아한 처리
    Given AI 생성 요청이 진행 중일 때
    When API 응답이 5초 이상 지연되면
    Then "조금만 기다려주세요" 메시지가 추가로 표시되고
    When API가 500 에러를 반환하면
    Then 에러 모달이 슬라이드업 애니메이션으로 표시되고
    And "일시적인 문제가 발생했습니다" 제목이 표시되며
    And "다시 시도" 버튼과 "수동 입력" 옵션이 제공되고
    And 입력했던 데이터는 모두 보존된다

  @accessibility
  Scenario: 키보드 전용 네비게이션
    Given 사용자가 키보드만 사용하는 상황에서
    When Tab 키를 누르면
    Then 포커스가 "AI 기획 체험하기" 버튼으로 이동하고
    When Enter 키를 누르면
    Then AI 기획 페이지로 이동하고
    When Tab 키를 연속으로 누르면
    Then 포커스가 논리적 순서로 이동하며:
      | 순서 | 요소                    |
      | 1    | 스킵 네비게이션 링크    |
      | 2    | 로고                    |
      | 3    | 메인 네비게이션         |
      | 4    | 스토리 제목 입력 필드   |
      | 5    | 한 줄 요약 입력 필드    |
      | 6    | 톤앤매너 체크박스 그룹  |
    And 각 포커스 시 명확한 아웃라인이 표시된다
```

### 2. 피드백 시스템 여정

```gherkin
Feature: 비디오 피드백 시스템
  As a 클라이언트 또는 팀원
  I want to 비디오의 특정 시점에 피드백을 남기고
  So that 명확한 수정 요청을 전달할 수 있다

  @critical @guest-feedback
  Scenario: 게스트 피드백 제출 플로우
    Given 게스트가 공유 링크로 피드백 페이지에 접속했을 때
    And 비디오가 로드되어 재생 가능한 상태일 때
    When 비디오를 재생하고 특정 시점에서 일시정지하면
    Then 현재 타임스탬프가 "00:15" 형식으로 표시되고
    When "이 시점에 피드백 추가" 버튼을 클릭하면
    Then 피드백 입력 폼이 비디오 옆에 슬라이드인되고
    And 타임스탬프가 자동으로 폼에 포함되며
    When 피드백 내용을 입력하고 "제출"을 클릭하면
    Then 3초 이내에 성공 토스트가 표시되고
    And 타임라인에 피드백 마커가 추가되며
    And "계정을 만들어 피드백 관리하기" CTA가 표시된다

  @critical @feedback-visualization
  Scenario: 피드백 타임라인 시각화
    Given 피드백이 있는 비디오를 볼 때
    Then 비디오 타임라인에 피드백 마커가 표시되고
    And 마커 색상이 피드백 유형별로 구분되며:
      | 유형   | 색상    | 아이콘       |
      | 수정   | #dc3545 | exclamation  |
      | 제안   | #ffc107 | lightbulb    |
      | 승인   | #28a745 | check        |
      | 질문   | #17a2b8 | question     |
    When 마커에 호버하면
    Then 피드백 미리보기가 툴팁으로 표시되고
    When 마커를 클릭하면
    Then 비디오가 해당 시점으로 이동하고
    And 피드백 상세 내용이 사이드 패널에 표시된다

  @collaboration
  Scenario: 실시간 협업 피드백
    Given 2명 이상의 사용자가 같은 비디오를 보고 있을 때
    When 사용자 A가 피드백을 추가하면
    Then 1초 이내에 사용자 B의 화면에 알림이 표시되고
    And 새 피드백 마커가 실시간으로 추가되며
    And "A님이 피드백을 추가했습니다" 토스트가 표시된다
    When 사용자 B가 해당 피드백에 답글을 달면
    Then 스레드 형태로 대화가 이어지고
    And 참여자 모두에게 실시간으로 업데이트된다
```

### 3. 대시보드 및 프로젝트 관리

```gherkin
Feature: 프로젝트 대시보드
  As a 팀 리더
  I want to 모든 프로젝트 상태를 한눈에 파악하고
  So that 효율적으로 팀을 관리할 수 있다

  @critical @dashboard-overview
  Scenario: 대시보드 초기 로드 최적화
    Given 인증된 사용자가 로그인했을 때
    When 대시보드 페이지로 이동하면
    Then 1.5초 이내에 First Contentful Paint가 발생하고
    And 중요 위젯들이 순차적으로 로드되며:
      | 순서 | 위젯              | 로드시간 |
      | 1    | 프로젝트 요약     | 0.5s    |
      | 2    | 최근 피드백       | 1.0s    |
      | 3    | 팀 활동 타임라인  | 1.5s    |
      | 4    | 간트 차트         | 2.0s    |
    And 각 위젯이 로드되는 동안 스켈레톤 UI가 표시되고
    And 전체 레이아웃 시프트(CLS)가 0.1 미만이다

  @critical @project-status
  Scenario: 프로젝트 상태별 필터링
    Given 대시보드에 10개 이상의 프로젝트가 있을 때
    When 상태 필터 드롭다운을 클릭하면
    Then 다음 옵션들이 표시되고:
      | 상태      | 색상 인디케이터 | 개수 배지 |
      | 전체      | 없음           | 15        |
      | 진행 중   | 파란색         | 8         |
      | 검토 대기 | 노란색         | 4         |
      | 완료      | 초록색         | 2         |
      | 보류      | 회색           | 1         |
    When "검토 대기"를 선택하면
    Then 300ms 이내에 필터링이 적용되고
    And 부드러운 페이드 애니메이션으로 전환되며
    And URL이 업데이트되어 새로고침해도 유지된다
```

## 📊 상태 매트릭스 정의

### 1. 컴포넌트 상태 정의

```typescript
// 전역 상태 타입 정의
export interface ComponentState {
  empty: EmptyState;
  loading: LoadingState;
  error: ErrorState;
  success: SuccessState;
  partial: PartialState;
}

// 빈 상태
interface EmptyState {
  type: 'empty';
  icon: 'empty-box.svg';
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    handler: () => void;
  };
  secondaryAction?: {
    label: string;
    handler: () => void;
  };
}

// 로딩 상태
interface LoadingState {
  type: 'loading';
  variant: 'spinner' | 'skeleton' | 'progress';
  message?: string;
  progress?: number;
  estimatedTime?: number;
}

// 에러 상태
interface ErrorState {
  type: 'error';
  severity: 'warning' | 'error' | 'critical';
  code?: string;
  title: string;
  message: string;
  retryable: boolean;
  actions: Array<{
    label: string;
    handler: () => void;
    variant: 'primary' | 'secondary';
  }>;
  helpLink?: string;
}

// 성공 상태
interface SuccessState {
  type: 'success';
  icon: 'check-circle.svg';
  title: string;
  message?: string;
  duration?: number; // 자동 해제 시간
  persistent?: boolean;
  nextAction?: {
    label: string;
    handler: () => void;
  };
}

// 부분 로드 상태
interface PartialState {
  type: 'partial';
  loadedCount: number;
  totalCount: number;
  message: string;
  loadMoreAction: () => void;
}
```

### 2. 페이지별 상태 매핑

```typescript
// AI 기획 페이지 상태
export const aiPlanningStates: StateMatrix = {
  initial: {
    empty: {
      title: "AI와 함께 시작하세요",
      description: "몇 가지 정보만 입력하면 AI가 전문적인 기획안을 만들어드립니다",
      primaryAction: { label: "시작하기", handler: startPlanning }
    }
  },
  generating: {
    loading: {
      variant: 'progress',
      message: "AI가 스토리를 구성하고 있습니다...",
      estimatedTime: 15000
    }
  },
  apiError: {
    error: {
      severity: 'error',
      title: "일시적인 문제가 발생했습니다",
      message: "AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
      retryable: true,
      actions: [
        { label: "다시 시도", handler: retry, variant: 'primary' },
        { label: "수동 입력", handler: manualInput, variant: 'secondary' }
      ]
    }
  },
  quotaExceeded: {
    error: {
      severity: 'warning',
      title: "일일 사용량을 초과했습니다",
      message: "내일 다시 이용하거나 프로 플랜으로 업그레이드하세요",
      retryable: false,
      actions: [
        { label: "프로 플랜 보기", handler: showPlans, variant: 'primary' },
        { label: "알림 설정", handler: setReminder, variant: 'secondary' }
      ]
    }
  },
  completed: {
    success: {
      title: "기획안이 완성되었습니다!",
      message: "PDF로 다운로드하거나 팀과 공유할 수 있습니다",
      persistent: true,
      nextAction: { label: "PDF 다운로드", handler: downloadPDF }
    }
  }
};

// 피드백 페이지 상태
export const feedbackStates: StateMatrix = {
  noFeedback: {
    empty: {
      title: "아직 피드백이 없습니다",
      description: "비디오를 재생하고 피드백을 남겨보세요",
      primaryAction: { label: "첫 피드백 남기기", handler: addFeedback }
    }
  },
  submitting: {
    loading: {
      variant: 'spinner',
      message: "피드백을 저장하는 중..."
    }
  },
  submitted: {
    success: {
      title: "피드백이 추가되었습니다",
      duration: 3000,
      nextAction: { label: "더 추가하기", handler: addMore }
    }
  },
  offline: {
    error: {
      severity: 'warning',
      title: "오프라인 상태입니다",
      message: "인터넷 연결을 확인해주세요. 피드백은 로컬에 저장됩니다.",
      retryable: true,
      actions: [
        { label: "재연결", handler: reconnect, variant: 'primary' }
      ]
    }
  }
};

// 대시보드 상태
export const dashboardStates: StateMatrix = {
  firstTime: {
    empty: {
      title: "환영합니다! 🎬",
      description: "첫 프로젝트를 만들고 팀과 협업을 시작하세요",
      primaryAction: { label: "프로젝트 만들기", handler: createProject },
      secondaryAction: { label: "튜토리얼 보기", handler: showTutorial }
    }
  },
  loading: {
    loading: {
      variant: 'skeleton',
      message: "대시보드를 준비하는 중..."
    }
  },
  partial: {
    partial: {
      loadedCount: 10,
      totalCount: 25,
      message: "10개 프로젝트 표시 중",
      loadMoreAction: loadMoreProjects
    }
  },
  serverError: {
    error: {
      severity: 'critical',
      code: 'DASHBOARD_500',
      title: "서버 오류",
      message: "대시보드를 불러올 수 없습니다. 기술팀에 문의해주세요.",
      retryable: true,
      actions: [
        { label: "다시 시도", handler: retry, variant: 'primary' },
        { label: "지원팀 문의", handler: contactSupport, variant: 'secondary' }
      ],
      helpLink: "/support/dashboard-errors"
    }
  }
};
```

## 🎨 인터랙션 디자인 명세

### 1. 애니메이션 타이밍

```scss
// 애니메이션 토큰
$timing: (
  instant: 0ms,
  fast: 150ms,
  normal: 300ms,
  slow: 500ms,
  deliberate: 700ms
);

$easing: (
  standard: cubic-bezier(0.4, 0, 0.2, 1),     // 기본
  decelerate: cubic-bezier(0, 0, 0.2, 1),     // 진입
  accelerate: cubic-bezier(0.4, 0, 1, 1),     // 이탈
  sharp: cubic-bezier(0.4, 0, 0.6, 1),        // 빠른 전환
  bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) // 바운스
);

// 사용 예시
.modal-enter {
  animation: slideUp $timing-normal $easing-decelerate;
}

.toast-exit {
  animation: fadeOut $timing-fast $easing-accelerate;
}

.button-press {
  transition: transform $timing-instant $easing-sharp;
}
```

### 2. 포커스 관리

```typescript
// 포커스 트랩 구현
export function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef]);
}
```

## 📱 반응형 동작 명세

```gherkin
Feature: 반응형 레이아웃
  
  @mobile
  Scenario: 모바일 뷰포트 적응
    Given 뷰포트 너비가 768px 미만일 때
    Then 네비게이션이 햄버거 메뉴로 변경되고
    And 대시보드 그리드가 1열로 재배치되며
    And 모든 터치 타겟이 최소 44x44px 크기를 유지하고
    And 가로 스크롤이 발생하지 않는다

  @tablet
  Scenario: 태블릿 뷰포트 적응
    Given 뷰포트 너비가 768px 이상 1024px 미만일 때
    Then 사이드바가 접힌 상태로 표시되고
    And 대시보드 그리드가 2열로 표시되며
    And 모달이 전체 화면의 80%를 차지한다

  @desktop
  Scenario: 데스크톱 뷰포트 최적화
    Given 뷰포트 너비가 1024px 이상일 때
    Then 사이드바가 고정 너비 280px로 표시되고
    And 대시보드 그리드가 3열로 표시되며
    And 키보드 단축키가 활성화된다
```

## ✅ 구현 체크리스트

### Phase 1: 핵심 UX 수정
- [ ] SSR/SSG 구현으로 초기 렌더링 개선
- [ ] 로딩 상태 스켈레톤 UI 적용
- [ ] 에러 상태 처리 및 복구 플로우
- [ ] 폼 실시간 유효성 검사
- [ ] 키보드 네비게이션 지원

### Phase 2: 접근성 및 성능
- [ ] ARIA 레이블 전체 적용
- [ ] 포커스 관리 구현
- [ ] 이미지 지연 로딩
- [ ] 코드 스플리팅
- [ ] 웹 폰트 최적화

### Phase 3: 고급 기능
- [ ] 실시간 협업 기능
- [ ] 오프라인 지원
- [ ] PWA 구현
- [ ] 다크 모드
- [ ] 국제화(i18n)

---

작성일: 2025-08-23
작성자: Eleanor (UX Lead)
버전: 1.0.0