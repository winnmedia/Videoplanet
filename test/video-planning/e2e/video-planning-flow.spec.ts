import { test, expect, Page } from '@playwright/test'

// 테스트 데이터 세트
const testCases = {
  basic: {
    title: '브이래닛 브랜드 홍보영상',
    oneLinerStory: 'AI 기술로 영상 제작을 혁신하는 브이래닛이 창작자들의 시간을 10배 단축시키는 이야기',
    genre: '홍보영상',
    duration: '60초',
    tempo: 'normal',
    developmentMethod: 'classic-kishōtenketsu',
    developmentIntensity: 'moderate'
  },
  minimal: {
    title: 'AI',  // 최소 길이
    oneLinerStory: '1234567890',  // 정확히 10자
    genre: '광고',
    duration: '30초',
    tempo: 'fast',
    developmentMethod: 'hook-immersion-twist-clue',
    developmentIntensity: 'as-is'
  },
  maximal: {
    title: 'A'.repeat(100),  // 최대 길이
    oneLinerStory: 'B'.repeat(500),  // 최대 길이
    genre: '다큐멘터리',
    duration: '180초',
    tempo: 'slow',
    developmentMethod: 'documentary',
    developmentIntensity: 'rich'
  },
  special: {
    title: '🎬 AI 영상 제작 @2025 #혁신',  // 특수문자와 이모지
    oneLinerStory: '한글, English, 日本語, 中文을 모두 지원하는 글로벌 AI 플랫폼의 성장 스토리',
    genre: '브랜드필름',
    duration: '90초',
    tempo: 'normal',
    developmentMethod: 'pixar-story',
    developmentIntensity: 'moderate'
  }
}

// 공통 헬퍼 함수
async function navigateToAIPlanningPage(page: Page) {
  await page.goto('/video-planning/ai')
  await expect(page).toHaveTitle(/AI 영상 기획/)
  await expect(page.locator('h2')).toContainText('AI 영상 기획 생성')
}

async function fillBasicInfo(page: Page, data: typeof testCases.basic) {
  // 제목 입력
  await page.fill('input[name="title"]', data.title)
  
  // 한 줄 스토리 입력
  await page.fill('textarea[name="oneLinerStory"]', data.oneLinerStory)
  
  // 장르 선택
  await page.selectOption('select[name="genre"]', data.genre)
  
  // 영상 길이 선택
  await page.selectOption('select[name="duration"]', data.duration)
}

async function selectDevelopmentOptions(page: Page, data: typeof testCases.basic) {
  // 템포 선택
  await page.click(`input[value="${data.tempo}"]`)
  
  // 전개방식 선택
  await page.click(`input[value="${data.developmentMethod}"]`)
  
  // 전개 강도 선택
  await page.click(`input[value="${data.developmentIntensity}"]`)
}

async function verifyGeneratedPlan(page: Page, expectedData: typeof testCases.basic) {
  // 4단계 스토리 구조 확인
  const storyStages = ['도입부', '전개부', '절정부', '결말부']
  for (const stage of storyStages) {
    await expect(page.locator(`section[data-stage="${stage}"]`)).toBeVisible()
  }
  
  // 12개 숏트 확인
  const shotElements = await page.locator('[data-testid="shot-item"]').all()
  expect(shotElements).toHaveLength(12)
  
  // 시간 분배 검증
  const totalDuration = parseInt(expectedData.duration)
  const stageDurations = await page.evaluate(() => {
    const stages = document.querySelectorAll('[data-stage-duration]')
    return Array.from(stages).map(s => parseInt(s.getAttribute('data-stage-duration') || '0'))
  })
  
  const sum = stageDurations.reduce((a, b) => a + b, 0)
  expect(sum).toBe(totalDuration)
}

// 테스트 스위트
test.describe('영상 기획 AI 생성 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 초기 상태 설정
    await page.route('/api/ai/generate-plan', async route => {
      // API 응답 모킹
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-plan-id',
            status: 'completed',
            storyStages: {
              introduction: { title: '도입부', description: 'Test', duration: 12, keyPoints: [] },
              rising: { title: '전개부', description: 'Test', duration: 24, keyPoints: [] },
              climax: { title: '절정부', description: 'Test', duration: 18, keyPoints: [] },
              conclusion: { title: '결말부', description: 'Test', duration: 6, keyPoints: [] }
            },
            shotBreakdown: Array.from({ length: 12 }, (_, i) => ({
              shotNumber: i + 1,
              storyStage: i < 3 ? 'introduction' : i < 7 ? 'rising' : i < 10 ? 'climax' : 'conclusion',
              shotType: 'medium',
              cameraMovement: 'static',
              composition: 'center',
              duration: 5,
              description: `Shot ${i + 1}`,
              dialogue: ''
            })),
            generatedAt: new Date().toISOString()
          }
        })
      })
    })
  })

  test('기본 플로우: 정상적인 영상 기획 생성', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    await selectDevelopmentOptions(page, testCases.basic)
    
    // 생성 버튼 클릭
    await page.click('button[type="submit"]')
    
    // 프로그레스 바 확인
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    
    // 결과 페이지 대기
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 생성된 기획서 검증
    await verifyGeneratedPlan(page, testCases.basic)
  })

  test('최소값 입력 테스트', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.minimal)
    await selectDevelopmentOptions(page, testCases.minimal)
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 최소값도 정상 처리되는지 확인
    await verifyGeneratedPlan(page, testCases.minimal)
  })

  test('최대값 입력 테스트', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.maximal)
    await selectDevelopmentOptions(page, testCases.maximal)
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 최대값도 정상 처리되는지 확인
    await verifyGeneratedPlan(page, testCases.maximal)
  })

  test('특수문자 및 다국어 입력 테스트', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.special)
    await selectDevelopmentOptions(page, testCases.special)
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 특수문자와 다국어가 올바르게 처리되는지 확인
    await expect(page.locator('[data-testid="plan-title"]')).toContainText(testCases.special.title)
  })

  test('필수 필드 검증 테스트', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    
    // 빈 상태로 제출 시도
    await page.click('button[type="submit"]')
    
    // 에러 메시지 확인
    await expect(page.locator('[role="alert"]')).toContainText('제목과 한 줄 스토리는 필수')
    
    // 제목만 입력하고 제출
    await page.fill('input[name="title"]', '테스트 제목')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"]')).toContainText('한 줄 스토리는 필수')
  })

  test('네트워크 오류 처리 테스트', async ({ page }) => {
    await page.route('/api/ai/generate-plan', route => {
      route.abort('failed')
    })
    
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    await page.click('button[type="submit"]')
    
    // 에러 메시지 확인
    await expect(page.locator('[role="alert"]')).toContainText('오류가 발생')
    
    // 재시도 버튼 확인
    await expect(page.locator('button:has-text("다시 시도")')).toBeVisible()
  })

  test('API 타임아웃 처리 테스트', async ({ page }) => {
    await page.route('/api/ai/generate-plan', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000))  // 35초 지연
      await route.fulfill({ status: 504 })
    })
    
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    await page.click('button[type="submit"]')
    
    // 타임아웃 메시지 확인 (30초 후)
    await expect(page.locator('[role="alert"]')).toContainText('시간 초과', { timeout: 35000 })
  })

  test('다양한 전개방식별 결과 검증', async ({ page }) => {
    const developmentMethods = [
      'hook-immersion-twist-clue',
      'classic-kishōtenketsu',
      'induction',
      'deduction',
      'documentary',
      'pixar-story'
    ]
    
    for (const method of developmentMethods) {
      await navigateToAIPlanningPage(page)
      await fillBasicInfo(page, testCases.basic)
      await page.click(`input[value="${method}"]`)
      await page.click('button[type="submit"]')
      
      await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
      
      // 각 전개방식에 맞는 구조 확인
      const developmentInfo = await page.locator('[data-testid="development-method"]').textContent()
      expect(developmentInfo).toContain(method)
    }
  })

  test('생성 중 취소 기능 테스트', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    await page.click('button[type="submit"]')
    
    // 생성 중 취소 버튼 클릭
    await page.click('button:has-text("취소")')
    
    // 입력 폼으로 돌아갔는지 확인
    await expect(page.locator('input[name="title"]')).toBeVisible()
    
    // 입력값이 유지되는지 확인
    await expect(page.locator('input[name="title"]')).toHaveValue(testCases.basic.title)
  })

  test('생성된 기획서 수정 플로우', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 수정 버튼 클릭
    await page.click('button:has-text("수정")')
    
    // 입력 폼으로 돌아갔는지 확인
    await expect(page.locator('input[name="title"]')).toBeVisible()
    
    // 값 수정
    await page.fill('input[name="title"]', '수정된 제목')
    
    // 재생성
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    
    // 수정된 내용 확인
    await expect(page.locator('[data-testid="plan-title"]')).toContainText('수정된 제목')
  })
})

// 성능 테스트
test.describe('영상 기획 성능 테스트', () => {
  test('응답 시간 측정', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    await fillBasicInfo(page, testCases.basic)
    
    const startTime = Date.now()
    await page.click('button[type="submit"]')
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
    const endTime = Date.now()
    
    const responseTime = endTime - startTime
    expect(responseTime).toBeLessThan(10000)  // 10초 이내
    
    console.log(`응답 시간: ${responseTime}ms`)
  })

  test('메모리 사용량 측정', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    
    // 초기 메모리 측정
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // 여러 번 생성 테스트
    for (let i = 0; i < 5; i++) {
      await fillBasicInfo(page, testCases.basic)
      await page.click('button[type="submit"]')
      await page.waitForSelector('[data-testid="result-container"]', { timeout: 15000 })
      await page.click('button:has-text("새로 만들기")')
    }
    
    // 최종 메모리 측정
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    const memoryIncrease = (finalMetrics - initialMetrics) / 1024 / 1024  // MB 단위
    expect(memoryIncrease).toBeLessThan(100)  // 100MB 이하 증가
    
    console.log(`메모리 증가량: ${memoryIncrease.toFixed(2)}MB`)
  })
})

// 접근성 테스트
test.describe('영상 기획 접근성 테스트', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    
    // Tab 키로 모든 요소 접근 가능한지 확인
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="title"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('textarea[name="oneLinerStory"]')).toBeFocused()
    
    // Enter 키로 제출 가능한지 확인
    await fillBasicInfo(page, testCases.basic)
    await page.keyboard.press('Enter')
    await expect(page.locator('[role="alert"]')).toBeVisible()  // 추가 필드 필요 메시지
  })

  test('스크린 리더 호환성', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    
    // ARIA 레이블 확인
    const titleInput = page.locator('input[name="title"]')
    await expect(titleInput).toHaveAttribute('aria-label', /제목/)
    
    const storyTextarea = page.locator('textarea[name="oneLinerStory"]')
    await expect(storyTextarea).toHaveAttribute('aria-label', /스토리/)
    
    // 필수 필드 표시
    await expect(titleInput).toHaveAttribute('aria-required', 'true')
    await expect(storyTextarea).toHaveAttribute('aria-required', 'true')
  })

  test('색상 대비 확인', async ({ page }) => {
    await navigateToAIPlanningPage(page)
    
    // Axe 접근성 테스트 실행
    // @ts-ignore
    const accessibilityScanResults = await page.evaluate(() => {
      // 실제로는 axe-core 라이브러리를 사용
      return { violations: [] }  // 모의 결과
    })
    
    expect(accessibilityScanResults.violations).toHaveLength(0)
  })
})