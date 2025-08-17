/**
 * 테스트 시나리오 유틸리티
 * 공통 테스트 시나리오와 헬퍼 함수들
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// 사용자 여정 시나리오 타입 정의
export interface UserJourneyStep {
  id: string;
  title: string;
  description: string;
  actions: Array<{
    type: 'click' | 'type' | 'wait' | 'verify';
    selector?: string;
    value?: string;
    assertion?: string;
  }>;
  expectedResults: string[];
}

export interface UserJourneyScenario {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  steps: UserJourneyStep[];
  teardown?: string[];
}

// 핵심 사용자 여정 시나리오 정의
export const coreUserJourneyScenarios: UserJourneyScenario[] = [
  {
    id: 'complete-workflow',
    title: '완전한 워크플로우',
    description: '로그인부터 피드백 분석까지 전체 프로세스',
    prerequisites: [
      '유효한 사용자 계정이 있음',
      '브라우저가 WebSocket을 지원함',
      '인터넷 연결이 안정적임',
    ],
    steps: [
      {
        id: 'login',
        title: '로그인',
        description: '사용자가 계정으로 로그인',
        actions: [
          { type: 'click', selector: '[data-testid="login-button"]' },
          { type: 'type', selector: '[data-testid="email-input"]', value: 'test@example.com' },
          { type: 'type', selector: '[data-testid="password-input"]', value: 'password123' },
          { type: 'click', selector: '[data-testid="submit-login"]' },
          { type: 'wait', selector: '[data-testid="dashboard"]' },
        ],
        expectedResults: [
          '대시보드 페이지로 리디렉션됨',
          '사용자 프로필이 표시됨',
          '네비게이션 메뉴가 활성화됨',
        ],
      },
      {
        id: 'create-project',
        title: '프로젝트 생성',
        description: '새 비디오 프로젝트 생성',
        actions: [
          { type: 'click', selector: '[data-testid="create-project-button"]' },
          { type: 'type', selector: '[data-testid="project-name-input"]', value: '테스트 프로젝트' },
          { type: 'type', selector: '[data-testid="project-description-input"]', value: '테스트용 프로젝트입니다' },
          { type: 'click', selector: '[data-testid="confirm-create"]' },
          { type: 'wait', selector: '[data-testid="project-view"]' },
        ],
        expectedResults: [
          '프로젝트가 성공적으로 생성됨',
          '프로젝트 상세 페이지로 이동',
          '피드백 링크가 생성됨',
        ],
      },
      {
        id: 'collect-feedback',
        title: '피드백 수집',
        description: '프로젝트에 대한 피드백 수집',
        actions: [
          { type: 'click', selector: '[data-testid="share-feedback-link"]' },
          { type: 'verify', assertion: '피드백 링크가 클립보드에 복사됨' },
          { type: 'click', selector: '[data-testid="enable-feedback-collection"]' },
        ],
        expectedResults: [
          '피드백 수집이 활성화됨',
          '공유 가능한 링크가 생성됨',
          '피드백 현황이 실시간으로 표시됨',
        ],
      },
      {
        id: 'analyze-feedback',
        title: '피드백 분석',
        description: '수집된 피드백을 분석하고 인사이트 도출',
        actions: [
          { type: 'click', selector: '[data-testid="analytics-tab"]' },
          { type: 'wait', selector: '[data-testid="feedback-chart"]' },
          { type: 'click', selector: '[data-testid="export-report"]' },
        ],
        expectedResults: [
          '피드백 통계가 표시됨',
          '감정 분석 결과가 나타남',
          '액션 아이템이 제안됨',
          '리포트를 내보낼 수 있음',
        ],
      },
    ],
    teardown: [
      '테스트 프로젝트 삭제',
      '사용자 로그아웃',
    ],
  },
  {
    id: 'new-user-onboarding',
    title: '신규 사용자 온보딩',
    description: '회원가입부터 첫 프로젝트 생성까지',
    prerequisites: [
      '유효하지 않은 이메일 주소 준비',
      '이메일 인증 시스템 동작',
    ],
    steps: [
      {
        id: 'signup',
        title: '회원가입',
        description: '새 계정 생성',
        actions: [
          { type: 'click', selector: '[data-testid="signup-link"]' },
          { type: 'type', selector: '[data-testid="fullname-input"]', value: '홍길동' },
          { type: 'type', selector: '[data-testid="email-input"]', value: 'newuser@example.com' },
          { type: 'type', selector: '[data-testid="password-input"]', value: 'newPassword123!' },
          { type: 'type', selector: '[data-testid="password-confirm-input"]', value: 'newPassword123!' },
          { type: 'click', selector: '[data-testid="terms-checkbox"]' },
          { type: 'click', selector: '[data-testid="signup-button"]' },
        ],
        expectedResults: [
          '회원가입이 성공적으로 완료됨',
          '이메일 인증 안내 메시지 표시',
          '인증 이메일 발송됨',
        ],
      },
      {
        id: 'onboarding-flow',
        title: '온보딩 프로세스',
        description: '사용자 설정 및 선호도 입력',
        actions: [
          { type: 'click', selector: '[data-testid="start-onboarding"]' },
          { type: 'click', selector: '[data-testid="purpose-video-production"]' },
          { type: 'click', selector: '[data-testid="team-size-small"]' },
          { type: 'click', selector: '[data-testid="feature-feedback"]' },
          { type: 'click', selector: '[data-testid="complete-onboarding"]' },
        ],
        expectedResults: [
          '온보딩 단계가 순차적으로 진행됨',
          '사용자 선호도가 저장됨',
          '개인화된 대시보드 생성',
        ],
      },
    ],
  },
];

// 보조 기능 테스트 시나리오
export const secondaryFeatureScenarios: UserJourneyScenario[] = [
  {
    id: 'calendar-management',
    title: '캘린더 관리',
    description: '일정 관리 및 프로젝트 마감일 설정',
    prerequisites: ['로그인된 상태', '프로젝트가 1개 이상 존재'],
    steps: [
      {
        id: 'view-calendar',
        title: '캘린더 보기',
        description: '월/주/일 보기 전환',
        actions: [
          { type: 'click', selector: '[data-testid="calendar-menu"]' },
          { type: 'click', selector: '[data-testid="month-view"]' },
          { type: 'click', selector: '[data-testid="week-view"]' },
          { type: 'click', selector: '[data-testid="day-view"]' },
        ],
        expectedResults: [
          '캘린더 보기가 전환됨',
          '프로젝트 관련 이벤트가 표시됨',
          '네비게이션이 부드럽게 작동',
        ],
      },
      {
        id: 'create-event',
        title: '이벤트 생성',
        description: '새 일정 생성',
        actions: [
          { type: 'click', selector: '[data-testid="create-event"]' },
          { type: 'type', selector: '[data-testid="event-title"]', value: '팀 미팅' },
          { type: 'type', selector: '[data-testid="event-date"]', value: '2025-08-20' },
          { type: 'click', selector: '[data-testid="save-event"]' },
        ],
        expectedResults: [
          '이벤트가 캘린더에 추가됨',
          '관련자에게 알림 발송',
        ],
      },
    ],
  },
  {
    id: 'profile-settings',
    title: '프로필 설정',
    description: '사용자 정보 및 알림 설정 관리',
    prerequisites: ['로그인된 상태'],
    steps: [
      {
        id: 'update-profile',
        title: '프로필 업데이트',
        description: '개인정보 수정',
        actions: [
          { type: 'click', selector: '[data-testid="profile-menu"]' },
          { type: 'type', selector: '[data-testid="display-name"]', value: '김길동' },
          { type: 'click', selector: '[data-testid="save-profile"]' },
        ],
        expectedResults: [
          '프로필 정보가 업데이트됨',
          '변경사항이 즉시 반영됨',
        ],
      },
      {
        id: 'notification-settings',
        title: '알림 설정',
        description: '알림 선호도 설정',
        actions: [
          { type: 'click', selector: '[data-testid="notification-settings"]' },
          { type: 'click', selector: '[data-testid="email-notifications"]' },
          { type: 'click', selector: '[data-testid="push-notifications"]' },
          { type: 'click', selector: '[data-testid="save-notifications"]' },
        ],
        expectedResults: [
          '알림 설정이 저장됨',
          '설정에 따라 알림 동작 변경',
        ],
      },
    ],
  },
];

// 접근성 테스트 시나리오
export const accessibilityScenarios = {
  keyboardNavigation: {
    title: '키보드 네비게이션',
    tests: [
      {
        name: 'Tab 순서',
        description: '모든 상호작용 요소가 논리적 순서로 포커스됨',
        steps: [
          '페이지 로드',
          'Tab 키로 모든 요소 순회',
          '포커스 순서가 시각적 순서와 일치하는지 확인',
        ],
      },
      {
        name: 'Enter/Space 활성화',
        description: 'Enter와 Space 키로 버튼 활성화',
        steps: [
          '버튼에 포커스',
          'Enter 키 입력',
          '버튼 액션 실행 확인',
          'Space 키로도 동일한 결과 확인',
        ],
      },
      {
        name: 'Escape 키 처리',
        description: 'Escape 키로 모달/드롭다운 닫기',
        steps: [
          '모달 또는 드롭다운 열기',
          'Escape 키 입력',
          '요소가 닫히고 이전 포커스로 복귀 확인',
        ],
      },
    ],
  },
  screenReader: {
    title: '스크린 리더 호환성',
    tests: [
      {
        name: 'ARIA 레이블',
        description: '모든 UI 요소에 적절한 ARIA 레이블',
        checks: [
          'aria-label 또는 aria-labelledby 존재',
          'aria-describedby로 추가 정보 제공',
          'role 속성이 적절히 설정됨',
        ],
      },
      {
        name: '랜드마크',
        description: '페이지 구조를 나타내는 랜드마크',
        checks: [
          'header, nav, main, footer 요소 존재',
          '각 랜드마크가 고유한 레이블 보유',
          '중첩 구조가 논리적임',
        ],
      },
      {
        name: '라이브 영역',
        description: '동적 콘텐츠 변경 알림',
        checks: [
          'aria-live 속성 적절히 사용',
          '상태 변경이 스크린 리더에 알림',
          '불필요한 중복 알림 방지',
        ],
      },
    ],
  },
  colorContrast: {
    title: '색상 대비',
    tests: [
      {
        name: 'WCAG AA 준수',
        description: '텍스트 대비비 4.5:1 이상',
        checks: [
          '기본 텍스트 대비',
          '링크 텍스트 대비',
          '버튼 텍스트 대비',
        ],
      },
      {
        name: 'WCAG AAA 준수',
        description: '텍스트 대비비 7:1 이상',
        checks: [
          '제목 텍스트 대비',
          '중요한 정보 대비',
        ],
      },
    ],
  },
  responsiveness: {
    title: '반응형 디자인',
    viewports: [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
    ],
    tests: [
      {
        name: '레이아웃 적응',
        description: '화면 크기에 따른 레이아웃 변경',
        checks: [
          '콘텐츠가 화면을 벗어나지 않음',
          '네비게이션이 적절히 조정됨',
          '터치 타겟 크기가 충분함 (44px 이상)',
        ],
      },
      {
        name: '폰트 크기 조정',
        description: '시스템 폰트 크기 설정 반영',
        checks: [
          '200% 확대 시에도 레이아웃 유지',
          '텍스트 오버플로우 없음',
          '스크롤 없이 읽기 가능',
        ],
      },
    ],
  },
};

// 성능 메트릭 기준
export const performanceMetrics = {
  coreWebVitals: {
    LCP: { good: 2500, poor: 4000, unit: 'ms' }, // Largest Contentful Paint
    FID: { good: 100, poor: 300, unit: 'ms' },   // First Input Delay
    CLS: { good: 0.1, poor: 0.25, unit: '' },    // Cumulative Layout Shift
  },
  customMetrics: {
    pageLoadTime: { target: 3000, unit: 'ms' },
    apiResponseTime: { target: 200, unit: 'ms' },
    bundleSize: { target: 500, unit: 'KB' },
    imageOptimization: { target: 85, unit: '%' },
  },
};

// 테스트 환경 설정
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, user: null, ...initialState.auth }) => state,
      projects: (state = { items: [], loading: false, ...initialState.projects }) => state,
      calendar: (state = { events: [], loading: false, ...initialState.calendar }) => state,
      notifications: (state = { items: [], unreadCount: 0, ...initialState.notifications }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

export const renderWithProviders = (
  ui: ReactElement,
  { initialState = {}, store = createTestStore(initialState), ...renderOptions }: CustomRenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// 테스트 데이터 팩토리
export const createTestData = {
  user: (overrides = {}) => ({
    id: 'user-123',
    name: '테스트 사용자',
    email: 'test@example.com',
    avatar: '/avatars/test-user.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }),

  project: (overrides = {}) => ({
    id: 'project-123',
    name: '테스트 프로젝트',
    description: '테스트용 프로젝트입니다',
    type: 'video-production',
    status: 'active',
    ownerId: 'user-123',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }),

  feedback: (overrides = {}) => ({
    id: 'feedback-123',
    projectId: 'project-123',
    content: '좋은 영상입니다!',
    rating: 5,
    isAnonymous: false,
    createdAt: '2025-01-01T12:00:00Z',
    ...overrides,
  }),

  notification: (overrides = {}) => ({
    id: 'notification-123',
    title: '새로운 알림',
    message: '알림 메시지입니다',
    type: 'info',
    read: false,
    createdAt: '2025-01-01T12:00:00Z',
    ...overrides,
  }),
};

export default {
  coreUserJourneyScenarios,
  secondaryFeatureScenarios,
  accessibilityScenarios,
  performanceMetrics,
  renderWithProviders,
  createTestData,
};