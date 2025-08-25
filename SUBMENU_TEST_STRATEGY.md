# 🎯 VideoplaNet 서브메뉴 UI 테스트 전략

## 📋 문서 정보
- **작성자**: Grace (QA Lead)
- **작성일**: 2025-08-25
- **버전**: 1.0
- **대상 컴포넌트**: EnhancedSideBar 서브메뉴 시스템
- **우선순위**: Critical (P0)

---

## 🔍 현재 문제 분석

### 식별된 문제점
1. **렌더링 실패**: 서브메뉴가 DOM에 존재하지만 시각적으로 표시되지 않음
2. **CSS 클래스 충돌**: z-index 레이어링 문제로 메인 사이드바에 가려짐
3. **상태 동기화 실패**: props와 내부 상태 간 불일치
4. **애니메이션 결함**: transform 값 계산 오류로 위치 이탈

### 근본 원인 (Root Cause)
- **z-index 계층 구조**: 메인 사이드바(997) < 서브메뉴(998) 설정 필요
- **CSS transform 복잡성**: left + translateX 중복 사용
- **상태 관리 분산**: 여러 컴포넌트 간 상태 동기화 미흡

---

## 🏗️ 테스트 피라미드 아키텍처

```
         /\
        /E2E\       15% - 사용자 여정 검증 (8개 시나리오)
       /______\
      /        \
     /Integration\   35% - 컴포넌트 상호작용 (20개 테스트)
    /______________\
   /                \
  /   Unit Tests     \ 50% - 격리된 로직 검증 (40개 테스트)
 /____________________\
```

---

## 📝 1. 단위 테스트 전략 (Unit Tests)

### 1.1 렌더링 검증 테스트
```typescript
// EnhancedSideBar.render.test.tsx
describe('서브메뉴 렌더링 검증', () => {
  const testCases = [
    {
      name: '서브메뉴 DOM 존재 확인',
      props: { isOpen: true, tab: 'project' },
      expected: {
        element: '[data-testid="submenu"]',
        visibility: 'visible',
        opacity: '1'
      }
    },
    {
      name: 'z-index 레이어링 검증',
      props: { isOpen: true },
      expected: {
        mainSidebar: { zIndex: 997 },
        submenu: { zIndex: 998 }
      }
    },
    {
      name: 'transform 위치 계산',
      props: { isOpen: true },
      expected: {
        desktop: 'translateX(0)',
        mobile: 'translateX(330px)'
      }
    }
  ]

  testCases.forEach(({ name, props, expected }) => {
    it(name, () => {
      const { container } = render(<EnhancedSideBar {...props} />)
      // 검증 로직
    })
  })
})
```

### 1.2 상태 관리 테스트
```typescript
// useSideBarViewModel.test.ts
describe('서브메뉴 상태 관리', () => {
  it('isOpen prop 변경 시 내부 상태 동기화', () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useSideBarViewModel({ isOpen }),
      { initialProps: { isOpen: false } }
    )
    
    expect(result.current.subMenuOpen).toBe(false)
    
    rerender({ isOpen: true })
    expect(result.current.subMenuOpen).toBe(true)
  })

  it('탭 전환 시 상태 유지', () => {
    const { result } = renderHook(() => useSideBarViewModel({
      isOpen: true,
      tab: 'project'
    }))
    
    act(() => result.current.switchTab('feedback'))
    
    expect(result.current.tabName).toBe('feedback')
    expect(result.current.subMenuOpen).toBe(true)
  })
})
```

### 1.3 CSS 클래스 적용 테스트
```typescript
// EnhancedSideBar.styles.test.tsx
describe('CSS 클래스 적용 검증', () => {
  it('활성 상태 클래스 적용', () => {
    const { container } = render(
      <EnhancedSideBar isOpen={true} tab="project" />
    )
    
    const submenu = container.querySelector('.submenu')
    expect(submenu).toHaveClass('active')
    expect(submenu).toHaveStyle({
      visibility: 'visible',
      opacity: '1',
      transform: 'translateX(0)'
    })
  })

  it('비활성 상태 클래스 적용', () => {
    const { container } = render(
      <EnhancedSideBar isOpen={false} />
    )
    
    const submenu = container.querySelector('.submenu')
    expect(submenu).not.toHaveClass('active')
    expect(submenu).toHaveStyle({
      visibility: 'hidden',
      opacity: '0',
      transform: 'translateX(-330px)'
    })
  })
})
```

---

## 🔗 2. 통합 테스트 전략 (Integration Tests)

### 2.1 사이드바-서브메뉴 상호작용
```typescript
// SideBar.integration.test.tsx
describe('사이드바-서브메뉴 통합', () => {
  it('메뉴 클릭 시 서브메뉴 토글', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppLayout />)
    
    const projectMenu = screen.getByRole('button', { name: /프로젝트 관리/i })
    await user.click(projectMenu)
    
    await waitFor(() => {
      const submenu = container.querySelector('[data-testid="submenu"]')
      expect(submenu).toHaveAttribute('data-open', 'true')
      expect(submenu).toHaveAttribute('data-tab', 'project')
    })
  })

  it('다른 메뉴 클릭 시 서브메뉴 전환', async () => {
    const user = userEvent.setup()
    render(<AppLayout />)
    
    // 첫 번째 메뉴 열기
    await user.click(screen.getByText('프로젝트 관리'))
    expect(screen.getByTestId('submenu')).toHaveAttribute('data-tab', 'project')
    
    // 두 번째 메뉴로 전환
    await user.click(screen.getByText('영상 피드백'))
    await waitFor(() => {
      expect(screen.getByTestId('submenu')).toHaveAttribute('data-tab', 'feedback')
    })
  })
})
```

### 2.2 프로젝트 목록 동기화
```typescript
// ProjectList.integration.test.tsx
describe('프로젝트 목록 동기화', () => {
  it('프로젝트 추가 시 서브메뉴 업데이트', async () => {
    const mockProjects = [
      { id: 1, name: '프로젝트 1' },
      { id: 2, name: '프로젝트 2' }
    ]
    
    const { rerender } = render(
      <EnhancedSideBar projects={mockProjects} isOpen={true} tab="project" />
    )
    
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    
    // 프로젝트 추가
    const updatedProjects = [...mockProjects, { id: 3, name: '프로젝트 3' }]
    rerender(
      <EnhancedSideBar projects={updatedProjects} isOpen={true} tab="project" />
    )
    
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(3)
    })
  })
})
```

---

## 🚀 3. E2E 테스트 시나리오

### 3.1 핵심 사용자 여정
```typescript
// submenu-journey.spec.ts
import { test, expect } from '@playwright/test'

test.describe('서브메뉴 사용자 여정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="sidebar"]')
  })

  test('프로젝트 관리 서브메뉴 열기 → 프로젝트 선택 → 상세 페이지 이동', async ({ page }) => {
    // 1. 프로젝트 관리 메뉴 클릭
    await page.click('button:has-text("프로젝트 관리")')
    
    // 2. 서브메뉴 표시 확인
    await expect(page.locator('[data-testid="submenu"]')).toBeVisible()
    await expect(page.locator('[data-testid="submenu"]')).toHaveAttribute('data-open', 'true')
    
    // 3. 프로젝트 목록 확인
    const projectItems = page.locator('[data-testid="submenu"] li')
    await expect(projectItems).toHaveCount(3)
    
    // 4. 첫 번째 프로젝트 클릭
    await projectItems.first().click()
    
    // 5. 페이지 이동 확인
    await expect(page).toHaveURL(/\/projects\/\d+/)
    
    // 6. 서브메뉴 자동 닫힘 확인
    await expect(page.locator('[data-testid="submenu"]')).toHaveAttribute('data-open', 'false')
  })

  test('빈 프로젝트 상태에서 CTA 버튼 동작', async ({ page }) => {
    // Mock empty projects
    await page.route('**/api/projects', async route => {
      await route.fulfill({ json: [] })
    })
    
    await page.click('button:has-text("프로젝트 관리")')
    
    // 빈 상태 메시지 확인
    await expect(page.locator('text=등록된 프로젝트가 없습니다')).toBeVisible()
    
    // CTA 버튼 클릭
    await page.click('button:has-text("프로젝트 등록")')
    
    // 프로젝트 생성 페이지로 이동
    await expect(page).toHaveURL('/projects/create')
  })
})
```

### 3.2 반응형 테스트
```typescript
// responsive-submenu.spec.ts
test.describe('반응형 서브메뉴 동작', () => {
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ]

  viewports.forEach(({ name, width, height }) => {
    test(`${name} 뷰포트에서 서브메뉴 동작`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/dashboard')
      
      if (name === 'Mobile') {
        // 모바일: 햄버거 메뉴 먼저 열기
        await page.click('[aria-label="메뉴 열기"]')
      }
      
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 뷰포트별 위치 검증
      const boundingBox = await submenu.boundingBox()
      if (name === 'Desktop') {
        expect(boundingBox?.x).toBeGreaterThan(300) // 사이드바 너비 이상
      } else if (name === 'Mobile') {
        expect(boundingBox?.x).toBe(0) // 화면 왼쪽 끝
      }
    })
  })
})
```

---

## 🎨 4. 시각적 회귀 테스트

### 4.1 스크린샷 기반 테스트
```typescript
// visual-regression.spec.ts
test.describe('서브메뉴 시각적 회귀', () => {
  test('서브메뉴 상태별 스크린샷', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 닫힌 상태
    await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('sidebar-closed.png')
    
    // 프로젝트 서브메뉴 열린 상태
    await page.click('button:has-text("프로젝트 관리")')
    await page.waitForTimeout(500) // 애니메이션 완료 대기
    await expect(page.locator('body')).toHaveScreenshot('submenu-project-open.png')
    
    // 피드백 서브메뉴 전환
    await page.click('button:has-text("영상 피드백")')
    await page.waitForTimeout(500)
    await expect(page.locator('body')).toHaveScreenshot('submenu-feedback-open.png')
  })

  test('다크모드 서브메뉴 스타일', async ({ page }) => {
    await page.goto('/dashboard')
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    
    await page.click('button:has-text("프로젝트 관리")')
    await expect(page.locator('[data-testid="submenu"]')).toHaveScreenshot('submenu-dark-mode.png')
  })
})
```

### 4.2 CSS 계산값 검증
```typescript
// computed-styles.test.tsx
describe('계산된 스타일 검증', () => {
  it('서브메뉴 위치 계산값 확인', () => {
    const { container } = render(
      <EnhancedSideBar isOpen={true} tab="project" />
    )
    
    const submenu = container.querySelector('[data-testid="submenu"]')
    const computedStyle = window.getComputedStyle(submenu!)
    
    expect(computedStyle.position).toBe('fixed')
    expect(computedStyle.zIndex).toBe('998')
    expect(computedStyle.transform).toBe('translateX(0px)')
    expect(computedStyle.visibility).toBe('visible')
    expect(computedStyle.opacity).toBe('1')
  })
})
```

---

## ♿ 5. 접근성 테스트

### 5.1 ARIA 속성 검증
```typescript
// accessibility.test.tsx
describe('서브메뉴 접근성', () => {
  it('ARIA 속성 완전성 검증', () => {
    render(<EnhancedSideBar isOpen={true} tab="project" projects={mockProjects} />)
    
    const submenu = screen.getByRole('complementary', { name: /서브메뉴/i })
    expect(submenu).toHaveAttribute('aria-label', '프로젝트 관리 서브메뉴')
    expect(submenu).toHaveAttribute('aria-hidden', 'false')
    
    const nav = within(submenu).getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', '프로젝트 관리 목록')
    
    const items = within(nav).getAllByRole('listitem')
    items.forEach(item => {
      expect(item).toHaveAttribute('role', 'listitem')
    })
  })

  it('키보드 네비게이션 흐름', async () => {
    const user = userEvent.setup()
    render(<EnhancedSideBar isOpen={true} tab="project" projects={mockProjects} />)
    
    // Tab 키 순환
    await user.tab()
    expect(screen.getByText('프로젝트 1')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByText('프로젝트 2')).toHaveFocus()
    
    // Escape 키로 닫기
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.getByTestId('submenu')).toHaveAttribute('data-open', 'false')
    })
  })

  it('스크린 리더 안내 메시지', () => {
    const { container } = render(
      <EnhancedSideBar isOpen={true} tab="project" projects={mockProjects} />
    )
    
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toHaveTextContent('프로젝트 관리 서브메뉴가 열렸습니다. 3개의 프로젝트가 있습니다.')
  })
})
```

### 5.2 포커스 관리 테스트
```typescript
// focus-management.test.tsx
describe('포커스 관리', () => {
  it('서브메뉴 열릴 때 첫 항목으로 포커스 이동', async () => {
    const { rerender } = render(<EnhancedSideBar isOpen={false} />)
    
    rerender(<EnhancedSideBar isOpen={true} tab="project" projects={mockProjects} />)
    
    await waitFor(() => {
      const firstItem = screen.getByText('프로젝트 1')
      expect(firstItem).toHaveFocus()
    })
  })

  it('포커스 트랩 동작', async () => {
    const user = userEvent.setup()
    render(<EnhancedSideBar isOpen={true} tab="project" projects={mockProjects} />)
    
    const lastItem = screen.getByText('프로젝트 3')
    const closeButton = screen.getByLabelText('서브메뉴 닫기')
    
    // 마지막 항목에서 Tab
    lastItem.focus()
    await user.tab()
    expect(closeButton).toHaveFocus()
    
    // 닫기 버튼에서 Tab (첫 항목으로 순환)
    await user.tab()
    expect(screen.getByText('프로젝트 1')).toHaveFocus()
  })
})
```

---

## 🔍 6. 테스트 데이터 관리

### 6.1 테스트 픽스처
```typescript
// fixtures/submenu.fixtures.ts
export const submenuFixtures = {
  projects: {
    empty: [],
    single: [{ id: 1, name: '프로젝트 1', status: 'active' }],
    multiple: [
      { id: 1, name: '프로젝트 1', status: 'active' },
      { id: 2, name: '프로젝트 2', status: 'completed' },
      { id: 3, name: '프로젝트 3', status: 'pending' }
    ],
    large: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `프로젝트 ${i + 1}`,
      status: ['active', 'completed', 'pending'][i % 3]
    }))
  },
  
  videoPlanningItems: [
    { id: 'ai', label: 'AI 기획', path: '/video-planning/ai' },
    { id: 'history', label: '기획서 관리', path: '/video-planning/history' }
  ]
}
```

### 6.2 Mock 서비스 워커
```typescript
// mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/projects', (req, res, ctx) => {
    const scenario = req.url.searchParams.get('scenario')
    
    switch (scenario) {
      case 'empty':
        return res(ctx.json([]))
      case 'error':
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
      default:
        return res(ctx.json(submenuFixtures.projects.multiple))
    }
  }),
  
  rest.post('/api/projects/:id/navigate', (req, res, ctx) => {
    return res(ctx.json({ success: true, url: `/projects/${req.params.id}` }))
  })
]
```

---

## 📊 7. 성능 테스트

### 7.1 렌더링 성능
```typescript
// performance.test.tsx
describe('서브메뉴 렌더링 성능', () => {
  it('초기 렌더링 시간 측정', () => {
    const startTime = performance.now()
    
    render(<EnhancedSideBar isOpen={true} tab="project" projects={largeProjectList} />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(100) // 100ms 이내
  })

  it('리렌더링 최적화 확인', () => {
    const { rerender } = render(
      <EnhancedSideBar isOpen={false} tab="project" />
    )
    
    const renderSpy = jest.spyOn(React, 'createElement')
    
    // 동일한 props로 리렌더링
    rerender(<EnhancedSideBar isOpen={false} tab="project" />)
    
    expect(renderSpy).not.toHaveBeenCalled() // 메모이제이션 확인
  })
})
```

### 7.2 애니메이션 성능
```typescript
// animation-performance.spec.ts
test('서브메뉴 애니메이션 60fps 유지', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Performance API 활성화
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = []
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          window.performanceMetrics.push(entry)
        }
      }
    })
    observer.observe({ entryTypes: ['measure'] })
  })
  
  // 애니메이션 트리거
  await page.click('button:has-text("프로젝트 관리")')
  await page.waitForTimeout(500) // 애니메이션 완료 대기
  
  // FPS 계산
  const metrics = await page.evaluate(() => window.performanceMetrics)
  const fps = calculateFPS(metrics)
  
  expect(fps).toBeGreaterThan(55) // 60fps에 근접
})
```

---

## 🛡️ 8. 에러 및 엣지 케이스

### 8.1 에러 핸들링 테스트
```typescript
// error-handling.test.tsx
describe('서브메뉴 에러 처리', () => {
  it('프로젝트 로딩 실패 시 에러 상태 표시', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    
    // API 에러 시뮬레이션
    server.use(
      rest.get('/api/projects', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )
    
    render(<EnhancedSideBar isOpen={true} tab="project" />)
    
    await waitFor(() => {
      expect(screen.getByText('프로젝트를 불러올 수 없습니다')).toBeInTheDocument()
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
    })
    
    consoleError.mockRestore()
  })

  it('잘못된 props 전달 시 graceful degradation', () => {
    const invalidProps = {
      isOpen: 'true', // boolean이어야 함
      tab: 123, // string이어야 함
      projects: null // array여야 함
    }
    
    // 에러 없이 렌더링되어야 함
    expect(() => {
      render(<EnhancedSideBar {...invalidProps} />)
    }).not.toThrow()
    
    // 기본값으로 동작
    expect(screen.getByTestId('submenu')).toHaveAttribute('data-open', 'false')
  })
})
```

### 8.2 엣지 케이스 테스트
```typescript
// edge-cases.test.tsx
describe('서브메뉴 엣지 케이스', () => {
  it('매우 긴 프로젝트 이름 처리', () => {
    const longNameProject = {
      id: 1,
      name: '매우 긴 프로젝트 이름이 있을 때 UI가 깨지지 않고 적절히 말줄임 처리가 되는지 확인하는 테스트입니다'
    }
    
    render(<EnhancedSideBar isOpen={true} tab="project" projects={[longNameProject]} />)
    
    const projectItem = screen.getByText(/매우 긴 프로젝트/)
    const styles = window.getComputedStyle(projectItem)
    
    expect(styles.textOverflow).toBe('ellipsis')
    expect(styles.whiteSpace).toBe('nowrap')
    expect(styles.overflow).toBe('hidden')
  })

  it('빠른 연속 클릭 처리 (debouncing)', async () => {
    const user = userEvent.setup()
    const onMenuClick = jest.fn()
    
    render(<EnhancedSideBar onMenuClick={onMenuClick} />)
    
    const projectMenu = screen.getByText('프로젝트 관리')
    
    // 빠른 연속 클릭
    await user.click(projectMenu)
    await user.click(projectMenu)
    await user.click(projectMenu)
    
    // 한 번만 처리되어야 함
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('메모리 누수 방지 확인', () => {
    const { unmount } = render(<EnhancedSideBar isOpen={true} />)
    
    // 이벤트 리스너 등록 확인
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    
    unmount()
    
    // 모든 리스너가 제거되었는지 확인
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(
      addEventListenerSpy.mock.calls.length
    )
  })
})
```

---

## 📈 9. 테스트 메트릭스 및 품질 게이트

### 9.1 품질 기준
| 메트릭 | 임계값 | 측정 도구 | 자동화 |
|--------|--------|-----------|---------|
| **단위 테스트 커버리지** | ≥ 85% | Vitest Coverage | CI/CD |
| **통합 테스트 커버리지** | ≥ 70% | Jest Coverage | CI/CD |
| **E2E 테스트 성공률** | ≥ 95% | Playwright Report | CI/CD |
| **변이 테스트 점수** | ≥ 75% | Stryker | Weekly |
| **시각적 회귀 차이** | < 0.1% | Percy/Chromatic | PR |
| **접근성 위반** | 0 | axe-core | CI/CD |
| **성능 (FCP)** | < 300ms | Lighthouse | PR |
| **Flaky 테스트** | < 1% | Test Analytics | Daily |

### 9.2 CI/CD 통합
```yaml
# .github/workflows/submenu-tests.yml
name: Submenu Test Suite

on:
  pull_request:
    paths:
      - 'src/shared/ui/EnhancedSideBar/**'
      - 'test/**/*submenu*'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Unit Tests
        run: |
          npm run test:unit -- --coverage src/shared/ui/EnhancedSideBar
          npm run test:coverage-report
      
      - name: Check Coverage Threshold
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 85" | bc -l) )); then
            echo "Coverage $coverage% is below threshold 85%"
            exit 1
          fi

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Integration Tests
        run: npm run test:integration -- --testPathPattern=submenu

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E Tests
        run: |
          npx playwright test --browser=${{ matrix.browser }} test/e2e/submenu

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Visual Tests
        run: npm run test:visual -- --update-snapshots=false

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Accessibility Tests
        run: npm run test:a11y
```

---

## 🔄 10. 테스트 실행 계획

### 10.1 단계별 실행 순서
1. **Phase 1 - 기본 기능 (Week 1)**
   - [ ] 단위 테스트: 렌더링 검증
   - [ ] 단위 테스트: 상태 관리
   - [ ] 단위 테스트: CSS 클래스 적용

2. **Phase 2 - 통합 검증 (Week 2)**
   - [ ] 통합 테스트: 사이드바-서브메뉴 상호작용
   - [ ] 통합 테스트: 프로젝트 목록 동기화
   - [ ] 통합 테스트: 라우팅 연동

3. **Phase 3 - 사용자 경험 (Week 3)**
   - [ ] E2E 테스트: 핵심 사용자 여정
   - [ ] E2E 테스트: 반응형 동작
   - [ ] 시각적 회귀 테스트

4. **Phase 4 - 품질 보증 (Week 4)**
   - [ ] 접근성 테스트
   - [ ] 성능 테스트
   - [ ] 에러 핸들링 및 엣지 케이스

### 10.2 일일 테스트 실행 스케줄
```bash
# Morning Smoke Tests (09:00)
npm run test:smoke -- --testPathPattern=submenu

# Continuous Integration (On PR)
npm run test:ci

# Nightly Full Suite (02:00)
npm run test:full -- --testPathPattern=submenu

# Weekly Mutation Testing (Sunday 03:00)
npm run test:mutation -- src/shared/ui/EnhancedSideBar
```

---

## 📚 11. 테스트 문서화 및 리포팅

### 11.1 테스트 리포트 템플릿
```markdown
## Submenu Test Report - [DATE]

### Summary
- **Total Tests**: 68
- **Passed**: 65
- **Failed**: 2
- **Skipped**: 1
- **Coverage**: 87.3%

### Failed Tests
1. **Test**: 서브메뉴 애니메이션 60fps 유지
   - **Error**: Expected fps > 55, got 48
   - **Root Cause**: Heavy DOM manipulation during animation
   - **Fix**: Implement will-change CSS property

2. **Test**: 매우 긴 프로젝트 이름 처리
   - **Error**: Text overflow not applied correctly
   - **Root Cause**: Missing max-width constraint
   - **Fix**: Add max-width: 250px to project item

### Performance Metrics
- Initial Render: 67ms (✅ < 100ms)
- Re-render: 12ms (✅ < 50ms)
- Animation FPS: 48 (⚠️ < 55fps)

### Next Steps
- Fix animation performance issue
- Add text truncation for long names
- Increase mutation test coverage
```

---

## 🎯 결론 및 권장사항

### 즉시 수정 필요 (P0)
1. **z-index 레이어링 수정**: 서브메뉴가 메인 사이드바 위에 표시되도록
2. **Transform 계산 단순화**: left + translateX 중복 제거
3. **상태 동기화 로직 개선**: props와 내부 상태 일관성 유지

### 중기 개선 사항 (P1)
1. **애니메이션 최적화**: GPU 가속 활용
2. **접근성 개선**: ARIA 라이브 리전 추가
3. **에러 바운더리 구현**: 컴포넌트 레벨 에러 처리

### 장기 개선 사항 (P2)
1. **상태 관리 중앙화**: Context API 또는 Zustand 도입
2. **컴포넌트 분리**: SubMenu를 독립적인 컴포넌트로 분리
3. **테스트 자동화 강화**: Visual AI 테스팅 도입

---

**작성자**: Grace (QA Lead)
**검토자**: Robert (DevOps Lead), Isabelle (Product Owner)
**승인일**: 2025-08-25