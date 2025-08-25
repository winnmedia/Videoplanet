import { test, expect, Page } from '@playwright/test'

// UX 분석 테스트 - 서브메뉴 렌더링 플로우 검증
test.describe('서브메뉴 UX 분석', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('서브메뉴 렌더링 상태 분석', async () => {
    // 1. 초기 렌더링 상태 확인
    const sidebar = await page.locator('[role="navigation"]').first()
    await expect(sidebar).toBeVisible()

    // 2. 서브메뉴 초기 상태 확인
    const submenu = await page.locator('[data-testid="submenu"]')
    const isSubmenuVisible = await submenu.isVisible()
    console.log('서브메뉴 초기 표시 상태:', isSubmenuVisible)

    // 3. 서브메뉴 DOM 속성 확인
    const submenuElement = await submenu.elementHandle()
    if (submenuElement) {
      const properties = await submenuElement.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          transform: computed.transform,
          position: computed.position,
          left: computed.left,
          width: computed.width,
          height: computed.height,
          zIndex: computed.zIndex,
          overflow: computed.overflow,
          dataOpen: el.getAttribute('data-open'),
          dataTab: el.getAttribute('data-tab'),
          className: el.className,
          ariaHidden: el.getAttribute('aria-hidden')
        }
      })
      console.log('서브메뉴 계산된 스타일:', properties)
    }

    // 4. 프로젝트 관리 메뉴 클릭 테스트
    const projectButton = await page.locator('button:has-text("프로젝트 관리")')
    await expect(projectButton).toBeVisible()
    
    // 클릭 전 상태 기록
    const beforeClick = await submenu.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        visibility: computed.visibility,
        opacity: computed.opacity
      }
    })
    console.log('클릭 전 서브메뉴 상태:', beforeClick)

    // 프로젝트 관리 클릭
    await projectButton.click()
    await page.waitForTimeout(600) // 애니메이션 대기

    // 클릭 후 상태 기록
    const afterClick = await submenu.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        visibility: computed.visibility,
        opacity: computed.opacity,
        display: computed.display
      }
    })
    console.log('클릭 후 서브메뉴 상태:', afterClick)

    // 5. 서브메뉴 내용 확인
    const submenuTitle = await page.locator('.submenuTitle').textContent()
    console.log('서브메뉴 타이틀:', submenuTitle)

    // 6. 접근성 검증
    const ariaHidden = await submenu.getAttribute('aria-hidden')
    const ariaLabel = await submenu.getAttribute('aria-label')
    console.log('접근성 속성:', { ariaHidden, ariaLabel })
  })

  test('키보드 네비게이션 분석', async () => {
    // Tab 키 네비게이션 테스트
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.textContent)
    console.log('첫 번째 포커스 요소:', firstFocused)

    // 여러 번 Tab 키 눌러서 프로젝트 관리까지 이동
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => ({
        text: document.activeElement?.textContent,
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role')
      }))
      console.log(`Tab ${i + 1} 포커스:`, focused)
      
      if (focused.text?.includes('프로젝트 관리')) {
        // Enter 키로 활성화
        await page.keyboard.press('Enter')
        await page.waitForTimeout(600)
        
        const submenuVisible = await page.locator('[data-testid="submenu"]').isVisible()
        console.log('Enter 키 후 서브메뉴 표시:', submenuVisible)
        break
      }
    }

    // Escape 키로 닫기 테스트
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    const submenuAfterEscape = await page.locator('[data-testid="submenu"]').isVisible()
    console.log('Escape 키 후 서브메뉴 표시:', submenuAfterEscape)
  })

  test('모바일 반응형 동작 분석', async () => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    // 햄버거 메뉴 표시 확인
    const hamburger = await page.locator('[aria-label*="메뉴"]').first()
    const isHamburgerVisible = await hamburger.isVisible()
    console.log('모바일 햄버거 메뉴 표시:', isHamburgerVisible)

    if (isHamburgerVisible) {
      // 햄버거 메뉴 클릭
      await hamburger.click()
      await page.waitForTimeout(500)

      // 사이드바 표시 확인
      const sidebar = await page.locator('[role="navigation"]').first()
      const sidebarStyle = await sidebar.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          transform: computed.transform,
          position: computed.position,
          display: computed.display
        }
      })
      console.log('모바일 사이드바 스타일:', sidebarStyle)

      // 프로젝트 관리 클릭
      const projectButton = await page.locator('button:has-text("프로젝트 관리")')
      if (await projectButton.isVisible()) {
        await projectButton.click()
        await page.waitForTimeout(600)

        // 서브메뉴 상태 확인
        const submenu = await page.locator('[data-testid="submenu"]')
        const submenuMobileStyle = await submenu.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            transform: computed.transform,
            left: computed.left,
            position: computed.position
          }
        })
        console.log('모바일 서브메뉴 스타일:', submenuMobileStyle)
      }
    }

    // 데스크톱으로 복귀
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('애니메이션 및 트랜지션 분석', async () => {
    const submenu = await page.locator('[data-testid="submenu"]')
    
    // 트랜지션 속성 확인
    const transitionProps = await submenu.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transition: computed.transition,
        transitionDuration: computed.transitionDuration,
        transitionTimingFunction: computed.transitionTimingFunction,
        transitionProperty: computed.transitionProperty
      }
    })
    console.log('트랜지션 속성:', transitionProps)

    // 애니메이션 성능 측정
    const projectButton = await page.locator('button:has-text("프로젝트 관리")')
    
    // Performance API로 애니메이션 측정
    const animationMetrics = await page.evaluate(async () => {
      const button = document.querySelector('button:has-text("프로젝트 관리")') as HTMLElement
      if (!button) return null

      performance.mark('animation-start')
      button.click()
      
      // 애니메이션 완료 대기
      await new Promise(resolve => setTimeout(resolve, 600))
      performance.mark('animation-end')
      
      performance.measure('animation-duration', 'animation-start', 'animation-end')
      const measure = performance.getEntriesByName('animation-duration')[0]
      
      return {
        duration: measure.duration,
        startTime: measure.startTime
      }
    })
    console.log('애니메이션 성능:', animationMetrics)
  })

  test('상태 전환 시나리오 분석', async () => {
    const results: any[] = []

    // 시나리오 1: 프로젝트 관리 -> 영상 피드백
    const projectBtn = await page.locator('button:has-text("프로젝트 관리")')
    await projectBtn.click()
    await page.waitForTimeout(600)
    
    let state = await page.locator('[data-testid="submenu"]').evaluate(el => ({
      open: el.getAttribute('data-open'),
      tab: el.getAttribute('data-tab'),
      visible: window.getComputedStyle(el).visibility
    }))
    results.push({ scenario: '프로젝트 관리 열기', state })

    const feedbackBtn = await page.locator('button:has-text("영상 피드백")')
    await feedbackBtn.click()
    await page.waitForTimeout(600)
    
    state = await page.locator('[data-testid="submenu"]').evaluate(el => ({
      open: el.getAttribute('data-open'),
      tab: el.getAttribute('data-tab'),
      visible: window.getComputedStyle(el).visibility
    }))
    results.push({ scenario: '영상 피드백으로 전환', state })

    // 시나리오 2: 닫기 버튼 클릭
    const closeBtn = await page.locator('[aria-label="서브메뉴 닫기"], [aria-label="닫기"]').first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await page.waitForTimeout(600)
      
      state = await page.locator('[data-testid="submenu"]').evaluate(el => ({
        open: el.getAttribute('data-open'),
        tab: el.getAttribute('data-tab'),
        visible: window.getComputedStyle(el).visibility
      }))
      results.push({ scenario: '닫기 버튼 클릭', state })
    }

    console.log('상태 전환 결과:', JSON.stringify(results, null, 2))
  })
})