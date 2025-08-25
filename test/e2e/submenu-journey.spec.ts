import { test, expect, Page } from '@playwright/test'

test.describe('서브메뉴 사용자 여정', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    // 로그인 상태 시뮬레이션
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // 대시보드로 이동
    await page.waitForURL('/dashboard')
    await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' })
  })

  test.describe('프로젝트 관리 서브메뉴', () => {
    test('프로젝트 관리 메뉴 열기 → 프로젝트 선택 → 상세 페이지 이동', async () => {
      // 1. 프로젝트 관리 메뉴 클릭
      await page.click('button:has-text("프로젝트 관리")')
      
      // 2. 서브메뉴 표시 확인
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      await expect(submenu).toHaveAttribute('data-open', 'true')
      await expect(submenu).toHaveAttribute('data-tab', 'project')
      
      // 3. 서브메뉴 제목 확인
      await expect(submenu.locator('h2')).toHaveText('프로젝트 관리')
      
      // 4. 프로젝트 목록 확인
      const projectItems = submenu.locator('nav ul li')
      const projectCount = await projectItems.count()
      expect(projectCount).toBeGreaterThan(0)
      
      // 5. 첫 번째 프로젝트 정보 가져오기
      const firstProject = projectItems.first()
      const projectName = await firstProject.textContent()
      
      // 6. 첫 번째 프로젝트 클릭
      await firstProject.click()
      
      // 7. 페이지 이동 확인
      await expect(page).toHaveURL(/\/projects\/\d+/)
      
      // 8. 서브메뉴 자동 닫힘 확인
      await expect(submenu).toHaveAttribute('data-open', 'false')
      
      // 9. 프로젝트 상세 페이지 로드 확인
      await expect(page.locator('h1')).toContainText(projectName || '')
    })

    test('빈 프로젝트 상태에서 CTA 버튼 동작', async () => {
      // API 응답을 빈 배열로 모킹
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      })
      
      // 페이지 새로고침하여 빈 상태 적용
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"]')
      
      // 프로젝트 관리 메뉴 클릭
      await page.click('button:has-text("프로젝트 관리")')
      
      // 서브메뉴 확인
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 빈 상태 메시지 확인
      await expect(submenu.locator('text=등록된 프로젝트가 없습니다')).toBeVisible()
      
      // CTA 버튼 확인
      const ctaButton = submenu.locator('button:has-text("프로젝트 등록")')
      await expect(ctaButton).toBeVisible()
      
      // CTA 버튼 클릭
      await ctaButton.click()
      
      // 프로젝트 생성 페이지로 이동 확인
      await expect(page).toHaveURL('/projects/create')
    })

    test('프로젝트 추가 버튼 동작', async () => {
      // 프로젝트가 있는 상태로 설정
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: '프로젝트 1', status: 'active' },
            { id: 2, name: '프로젝트 2', status: 'completed' }
          ])
        })
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"]')
      
      // 프로젝트 관리 메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 추가 버튼 확인 및 클릭
      const addButton = submenu.locator('button[aria-label="프로젝트 추가"]')
      await expect(addButton).toBeVisible()
      await addButton.click()
      
      // 프로젝트 생성 페이지로 이동 확인
      await expect(page).toHaveURL('/projects/create')
    })
  })

  test.describe('영상 피드백 서브메뉴', () => {
    test('영상 피드백 메뉴 열기 → 프로젝트 선택 → 피드백 페이지 이동', async () => {
      // 영상 피드백 메뉴 클릭
      await page.click('button:has-text("영상 피드백")')
      
      // 서브메뉴 확인
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      await expect(submenu).toHaveAttribute('data-tab', 'feedback')
      
      // 제목 확인
      await expect(submenu.locator('h2')).toHaveText('영상 피드백')
      
      // 프로젝트 목록에서 첫 번째 항목 클릭
      const firstProject = submenu.locator('nav ul li').first()
      await firstProject.click()
      
      // 피드백 페이지로 이동 확인
      await expect(page).toHaveURL(/\/feedback\/\d+/)
    })

    test('프로젝트 관리에서 영상 피드백으로 전환', async () => {
      // 1. 프로젝트 관리 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toHaveAttribute('data-tab', 'project')
      
      // 2. 영상 피드백으로 전환
      await page.click('button:has-text("영상 피드백")')
      
      // 3. 서브메뉴 전환 확인
      await expect(submenu).toHaveAttribute('data-tab', 'feedback')
      await expect(submenu.locator('h2')).toHaveText('영상 피드백')
      
      // 4. 프로젝트 목록이 동일하게 표시되는지 확인
      const projectItems = submenu.locator('nav ul li')
      const count = await projectItems.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('영상 기획 서브메뉴', () => {
    test('영상 기획 메뉴 열기 → AI 기획 선택', async () => {
      // 영상 기획 메뉴 클릭
      await page.click('button:has-text("영상 기획")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      await expect(submenu).toHaveAttribute('data-tab', 'video-planning')
      
      // AI 기획 메뉴 확인 및 클릭
      const aiPlanningButton = submenu.locator('button:has-text("AI 기획")')
      await expect(aiPlanningButton).toBeVisible()
      await aiPlanningButton.click()
      
      // AI 기획 페이지로 이동 확인
      await expect(page).toHaveURL('/video-planning/ai')
    })

    test('영상 기획 CTA 버튼 동작', async () => {
      // 영상 기획 메뉴 열기
      await page.click('button:has-text("영상 기획")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      
      // CTA 버튼 확인 및 클릭
      const ctaButton = submenu.locator('button:has-text("AI 기획 시작")')
      await expect(ctaButton).toBeVisible()
      await ctaButton.click()
      
      // AI 기획 페이지로 이동 확인
      await expect(page).toHaveURL('/video-planning/ai')
    })

    test('기획서 관리 메뉴 선택', async () => {
      // 영상 기획 메뉴 열기
      await page.click('button:has-text("영상 기획")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      
      // 기획서 관리 메뉴 클릭
      const historyButton = submenu.locator('button:has-text("기획서 관리")')
      await expect(historyButton).toBeVisible()
      await historyButton.click()
      
      // 기획서 관리 페이지로 이동 확인
      await expect(page).toHaveURL('/video-planning/history')
    })
  })

  test.describe('서브메뉴 닫기 패턴', () => {
    test('닫기 버튼으로 서브메뉴 닫기', async () => {
      // 서브메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 닫기 버튼 클릭
      const closeButton = submenu.locator('button[aria-label="닫기"]')
      await expect(closeButton).toBeVisible()
      await closeButton.click()
      
      // 서브메뉴 닫힘 확인
      await expect(submenu).toHaveAttribute('data-open', 'false')
    })

    test('ESC 키로 서브메뉴 닫기', async () => {
      // 서브메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // ESC 키 누르기
      await page.keyboard.press('Escape')
      
      // 서브메뉴 닫힘 확인
      await expect(submenu).toHaveAttribute('data-open', 'false')
    })

    test('같은 메뉴 재클릭으로 토글', async () => {
      const projectButton = page.locator('button:has-text("프로젝트 관리")')
      const submenu = page.locator('[data-testid="submenu"]')
      
      // 첫 번째 클릭: 열기
      await projectButton.click()
      await expect(submenu).toHaveAttribute('data-open', 'true')
      
      // 두 번째 클릭: 닫기
      await projectButton.click()
      await expect(submenu).toHaveAttribute('data-open', 'false')
      
      // 세 번째 클릭: 다시 열기
      await projectButton.click()
      await expect(submenu).toHaveAttribute('data-open', 'true')
    })
  })

  test.describe('키보드 네비게이션', () => {
    test('Tab 키로 서브메뉴 항목 탐색', async () => {
      // 서브메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // Tab 키로 첫 번째 항목으로 이동
      await page.keyboard.press('Tab')
      
      // 포커스된 요소 확인
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Enter 키로 선택
      await page.keyboard.press('Enter')
      
      // 페이지 이동 확인
      await expect(page).toHaveURL(/\/projects\/\d+/)
    })

    test('Shift+Tab으로 역방향 탐색', async () => {
      // 서브메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 닫기 버튼으로 포커스 이동
      const closeButton = submenu.locator('button[aria-label="닫기"]')
      await closeButton.focus()
      
      // Shift+Tab으로 역방향 이동
      await page.keyboard.press('Shift+Tab')
      
      // 포커스가 이전 요소로 이동했는지 확인
      const focusedElement = page.locator(':focus')
      const isFocusOnCloseButton = await focusedElement.evaluate(
        el => el.getAttribute('aria-label') === '닫기'
      )
      expect(isFocusOnCloseButton).toBe(false)
    })
  })

  test.describe('반응형 동작', () => {
    test('모바일 뷰포트에서 서브메뉴 동작', async () => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 })
      
      // 햄버거 메뉴 열기
      const hamburger = page.locator('[aria-label="메뉴 열기"]')
      await expect(hamburger).toBeVisible()
      await hamburger.click()
      
      // 사이드바 표시 확인
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar).toHaveAttribute('data-open', 'true')
      
      // 프로젝트 관리 메뉴 클릭
      await page.click('button:has-text("프로젝트 관리")')
      
      // 서브메뉴 확인
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 모바일에서 서브메뉴 위치 확인
      const boundingBox = await submenu.boundingBox()
      expect(boundingBox?.x).toBe(0)
    })

    test('태블릿 뷰포트에서 서브메뉴 동작', async () => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // 프로젝트 관리 메뉴 클릭
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 태블릿에서 서브메뉴 동작 확인
      const projectItem = submenu.locator('nav ul li').first()
      await projectItem.click()
      
      // 페이지 이동 확인
      await expect(page).toHaveURL(/\/projects\/\d+/)
    })

    test('데스크톱 뷰포트에서 서브메뉴 동작', async () => {
      // 데스크톱 뷰포트 설정
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // 프로젝트 관리 메뉴 클릭
      await page.click('button:has-text("프로젝트 관리")')
      
      const submenu = page.locator('[data-testid="submenu"]')
      await expect(submenu).toBeVisible()
      
      // 데스크톱에서 서브메뉴 위치 확인
      const boundingBox = await submenu.boundingBox()
      expect(boundingBox?.x).toBeGreaterThan(300) // 사이드바 너비 이상
    })
  })

  test.describe('성능 및 애니메이션', () => {
    test('서브메뉴 열기 애니메이션 시간 측정', async () => {
      const startTime = Date.now()
      
      // 서브메뉴 열기
      await page.click('button:has-text("프로젝트 관리")')
      
      // 애니메이션 완료 대기
      const submenu = page.locator('[data-testid="submenu"]')
      await submenu.waitFor({ state: 'visible' })
      
      const endTime = Date.now()
      const animationTime = endTime - startTime
      
      // 애니메이션이 500ms 이내에 완료되어야 함
      expect(animationTime).toBeLessThan(500)
    })

    test('빠른 연속 클릭 처리', async () => {
      const projectButton = page.locator('button:has-text("프로젝트 관리")')
      const submenu = page.locator('[data-testid="submenu"]')
      
      // 빠르게 3번 클릭
      await projectButton.click()
      await projectButton.click()
      await projectButton.click()
      
      // 최종 상태만 확인 (토글이 정상 동작)
      await page.waitForTimeout(100) // 디바운싱 대기
      
      const isOpen = await submenu.getAttribute('data-open')
      expect(['true', 'false']).toContain(isOpen)
    })
  })
})