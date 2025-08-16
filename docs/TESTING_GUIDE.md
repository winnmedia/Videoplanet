# VideoPlanet 테스트 가이드

## 개요

이 문서는 VideoPlanet 프로젝트의 테스트 환경 설정과 테스트 작성 가이드라인을 제공합니다.

## 테스트 환경 구성

### 1. 단위 테스트 (Jest + React Testing Library)

#### 설치된 패키지
- `jest`: JavaScript 테스트 프레임워크
- `@testing-library/react`: React 컴포넌트 테스트 라이브러리
- `@testing-library/jest-dom`: Jest DOM 매처 확장
- `@testing-library/user-event`: 사용자 이벤트 시뮬레이션
- `jest-environment-jsdom`: DOM 환경 시뮬레이션

#### 설정 파일
- `jest.config.js`: Jest 메인 설정
- `jest.setup.js`: 테스트 환경 초기화
- `src/utils/test-utils.tsx`: 커스텀 테스트 유틸리티

### 2. E2E 테스트 (Cypress)

#### 설치된 패키지
- `cypress`: E2E 테스트 프레임워크
- `@cypress/webpack-preprocessor`: TypeScript 지원
- `start-server-and-test`: 테스트 전 서버 시작

#### 설정 파일
- `cypress.config.js`: Cypress 메인 설정
- `cypress/support/e2e.js`: E2E 테스트 지원 파일
- `cypress/support/commands.js`: 커스텀 명령어

## 테스트 실행 명령어

### 단위 테스트
```bash
# 모든 테스트 실행
npm run test

# 감시 모드로 실행
npm run test:watch

# 커버리지 포함 실행
npm run test:coverage

# CI 환경에서 실행
npm run test:ci

# 디버그 모드로 실행
npm run test:debug
```

### E2E 테스트
```bash
# Cypress 대화형 모드
npm run cypress

# Cypress 헤드리스 모드
npm run cypress:headless

# 컴포넌트 테스트
npm run cypress:component

# 개발 서버와 함께 E2E 테스트
npm run e2e

# 개발 서버와 함께 대화형 모드
npm run e2e:open

# 모든 테스트 실행 (단위 + E2E)
npm run test:all
```

## 테스트 작성 가이드라인

### 1. 단위 테스트 작성

#### 컴포넌트 테스트 구조
```javascript
import React from 'react'
import { render, screen, fireEvent } from '../../src/utils/test-utils'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  // 기본 props
  const defaultProps = {
    prop1: 'value1',
    prop2: 'value2',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<ComponentName {...defaultProps} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('handles click events', () => {
      const mockHandler = jest.fn()
      render(<ComponentName {...defaultProps} onClick={mockHandler} />)
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ComponentName {...defaultProps} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label')
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot', () => {
      const { container } = render(<ComponentName {...defaultProps} />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
```

#### API 함수 테스트
```javascript
import { apiFunction } from '../api/module'
import { createMockApiResponse } from '../utils/test-utils'

describe('API Function', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    global.fetch.mockRestore()
  })

  it('makes correct API call', async () => {
    global.fetch.mockResolvedValueOnce(
      createMockApiResponse({ data: 'test' }, 200)
    )

    const result = await apiFunction()

    expect(fetch).toHaveBeenCalledWith('/api/endpoint', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    expect(result).toEqual({ data: 'test' })
  })
})
```

#### 커스텀 훅 테스트
```javascript
import { renderHook, act } from '@testing-library/react'
import { useCustomHook } from '../hooks/useCustomHook'

describe('useCustomHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCustomHook())
    
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('updates state correctly', async () => {
    const { result } = renderHook(() => useCustomHook())
    
    act(() => {
      result.current.updateData('new data')
    })
    
    expect(result.current.data).toBe('new data')
  })
})
```

### 2. E2E 테스트 작성

#### 페이지 테스트 구조
```javascript
describe('Page Name', () => {
  beforeEach(() => {
    cy.task('resetDb')
    cy.loginWithAPI()
  })

  it('displays page content correctly', () => {
    cy.visit('/page-url')
    cy.get('[data-testid="main-content"]').should('be.visible')
  })

  it('handles user interactions', () => {
    cy.visit('/page-url')
    cy.get('[data-testid="button"]').click()
    cy.url().should('include', '/next-page')
  })
})
```

#### 사용자 플로우 테스트
```javascript
describe('User Flow', () => {
  it('completes entire user journey', () => {
    // 1. 회원가입
    cy.visit('/signup')
    cy.fillForm({
      'email-input': 'user@example.com',
      'password-input': 'password123'
    })
    cy.submitForm('signup-submit')

    // 2. 이메일 인증 (실제 환경에서는 스킵)
    cy.visit('/verify-email?token=test-token')

    // 3. 로그인
    cy.loginWithUI({ email: 'user@example.com', password: 'password123' })

    // 4. 프로젝트 생성
    cy.createProject({
      title: 'Test Project',
      description: 'Test Description'
    })

    // 5. 결과 확인
    cy.url().should('include', '/project/view/')
  })
})
```

## 테스트 데이터 관리

### 1. Mock 데이터
```javascript
// src/utils/test-utils.tsx
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 1,
  title: 'Test Project',
  description: 'Test Description',
  ...overrides,
})
```

### 2. Fixture 데이터 (Cypress)
```javascript
// cypress/fixtures/users.json
{
  "testUser": {
    "email": "test@videoplanet.com",
    "password": "testpassword123",
    "name": "Test User"
  }
}

// 사용법
cy.fixture('users').then((users) => {
  cy.loginWithUI(users.testUser)
})
```

## 커버리지 목표

### 코드 커버리지 임계값
- **Statements**: 70% 이상
- **Branches**: 70% 이상
- **Functions**: 70% 이상
- **Lines**: 70% 이상

### 핵심 비즈니스 로직
- **인증 관련**: 90% 이상
- **프로젝트 관리**: 90% 이상
- **피드백 시스템**: 85% 이상

## 모범 사례

### 1. 테스트 명명 규칙
```javascript
// Good
it('displays error message when login fails')
it('creates new project with valid data')
it('shows loading state during API call')

// Bad
it('test login')
it('project creation')
it('loading')
```

### 2. 테스트 구조
- **AAA 패턴**: Arrange, Act, Assert
- **단일 책임**: 하나의 테스트는 하나의 기능만 검증
- **독립성**: 각 테스트는 다른 테스트에 의존하지 않음

### 3. 선택자 사용
```javascript
// Good - data-testid 사용
cy.get('[data-testid="login-button"]')
screen.getByTestId('user-profile')

// Bad - CSS 클래스나 태그에 의존
cy.get('.btn-primary')
screen.getByClassName('user-info')
```

### 4. 비동기 처리
```javascript
// Good - 적절한 대기
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

cy.get('[data-testid="result"]', { timeout: 10000 }).should('be.visible')

// Bad - 고정 대기
setTimeout(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
}, 1000)
```

## 트러블슈팅

### 1. 일반적인 문제

#### Jest 테스트가 실행되지 않음
```bash
# Node modules 재설치
rm -rf node_modules package-lock.json
npm install

# Jest 캐시 클리어
npm run test -- --clearCache
```

#### Cypress가 실행되지 않음
```bash
# Cypress 재설치
npm uninstall cypress
npm install cypress

# Cypress 검증
npx cypress verify
```

### 2. 성능 최적화

#### 테스트 속도 향상
```javascript
// 병렬 실행 설정 (jest.config.js)
module.exports = {
  maxWorkers: '50%',
  testTimeout: 10000,
}

// 불필요한 렌더링 방지
const { container } = render(<Component />)
expect(container.firstChild).toMatchSnapshot()
```

#### Cypress 최적화
```javascript
// cypress.config.js
module.exports = {
  video: false, // 개발 시 비디오 비활성화
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 5000,
}
```

## CI/CD 통합

### GitHub Actions 예시
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run e2e
```

### 테스트 리포트
- Jest: JUnit XML 형식으로 리포트 생성
- Cypress: 대시보드 서비스 활용
- 커버리지: Codecov 또는 Coveralls 연동

## 추가 리소스

### 문서
- [Jest 공식 문서](https://jestjs.io/docs)
- [React Testing Library 가이드](https://testing-library.com/docs/react-testing-library/intro)
- [Cypress 공식 문서](https://docs.cypress.io)

### 유용한 도구
- [MSW](https://mswjs.io/): API 모킹
- [Storybook](https://storybook.js.org/): 컴포넌트 시각적 테스트
- [Chromatic](https://www.chromatic.com/): 시각적 회귀 테스트