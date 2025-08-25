import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * VideoPlanet 대시보드 핵심 사용자 여정 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 팀 리더가 대시보드 접근
 * 2. 피드백 알림 확인 및 상호작용
 * 3. 초대 관리로 새 팀원 초대
 * 4. 간트차트에서 프로젝트 현황 확인
 * 5. 실시간 업데이트 확인
 */

test.describe('대시보드 핵심 사용자 여정', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 각 테스트마다 새로운 컨텍스트 생성
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
    });
    page = await context.newPage();
    
    // 로그인 모킹 (실제 구현 시 로그인 플로우로 대체)
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('user_role', 'team_leader');
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('팀 리더가 대시보드에서 프로젝트 현황을 확인하는 시나리오', async () => {
    // 1. 대시보드 접근
    await page.goto('/dashboard');
    
    // 페이지 로딩 확인
    await expect(page).toHaveTitle(/VideoPlanet.*Dashboard/);
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();

    // 2. 피드백 알림 섹션 확인
    const feedbackSection = page.locator('[data-testid="feedback-notifications"]');
    await expect(feedbackSection).toBeVisible();

    // 읽지 않은 알림 카운트 확인
    const unreadBadge = feedbackSection.locator('[data-testid="unread-count"]');
    await expect(unreadBadge).toContainText(/[1-9]/); // 1개 이상의 읽지 않은 알림

    // 첫 번째 중요한 피드백 클릭
    const firstHighPriorityNotification = feedbackSection.locator(
      '[data-testid="notification-item"][data-priority="high"]'
    ).first();
    
    await expect(firstHighPriorityNotification).toBeVisible();
    await firstHighPriorityNotification.click();

    // 피드백 상세보기 모달 또는 페이지로 이동 확인
    await expect(page.locator('[data-testid="feedback-detail"]')).toBeVisible({ timeout: 5000 });

    // 뒤로가기 또는 모달 닫기
    await page.goBack();
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();

    // 3. 초대 관리 섹션에서 새 팀원 초대
    const invitationSection = page.locator('[data-testid="invitation-management"]');
    await expect(invitationSection).toBeVisible();

    // 새 초대 버튼 클릭
    const inviteButton = invitationSection.locator('[data-testid="invite-new-member"]');
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();

    // 초대 폼 작성
    const inviteModal = page.locator('[data-testid="invite-modal"]');
    await expect(inviteModal).toBeVisible();

    await page.fill('[data-testid="invite-email"]', 'newmember@example.com');
    await page.selectOption('[data-testid="invite-role"]', 'collaborator');
    await page.fill('[data-testid="invite-message"]', '프로젝트에 참여해주세요!');

    // 초대 발송
    await page.click('[data-testid="send-invitation"]');

    // 성공 메시지 확인
    await expect(page.locator('[data-testid="success-message"]')).toContainText('초대가 발송되었습니다');

    // 모달 닫기
    await page.click('[data-testid="close-modal"]');

    // 4. 간트차트에서 프로젝트 현황 확인
    const ganttSection = page.locator('[data-testid="enhanced-gantt-section"]');
    await expect(ganttSection).toBeVisible();

    // 프로젝트 선택 드롭다운 확인
    const projectSelector = ganttSection.locator('[data-testid="project-selector"]');
    await expect(projectSelector).toBeVisible();

    // 현재 선택된 프로젝트 정보 확인
    const selectedProject = ganttSection.locator('[data-testid="selected-project-info"]');
    await expect(selectedProject).toBeVisible();

    // 진행률 정보 확인
    const progressInfo = ganttSection.locator('[data-testid="project-progress"]');
    await expect(progressInfo).toContainText(/%/); // 퍼센트 표시 확인

    // 간트차트 렌더링 확인
    const ganttChart = ganttSection.locator('[data-testid="gantt-chart"]');
    await expect(ganttChart).toBeVisible();

    // 작업 항목들이 표시되는지 확인
    const taskItems = ganttChart.locator('[data-testid="task-item"]');
    await expect(taskItems.first()).toBeVisible();

    // 5. 지연된 작업 확인 (있다면)
    const delayedTasks = ganttChart.locator('[data-testid="task-item"][data-status="delayed"]');
    const delayedTaskCount = await delayedTasks.count();
    
    if (delayedTaskCount > 0) {
      // 지연 경고 표시 확인
      await expect(page.locator('[data-testid="delay-warning"]')).toBeVisible();
      
      // 첫 번째 지연된 작업 클릭
      await delayedTasks.first().click();
      
      // 작업 상세 정보 확인
      await expect(page.locator('[data-testid="task-details"]')).toBeVisible();
    }

    // 6. 전체 대시보드 성능 확인
    // 페이지 로드 시간이 3초 이내인지 확인
    const performanceEntries = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')));
    });
    
    const loadTime = performanceEntries[0]?.loadEventEnd - performanceEntries[0]?.navigationStart;
    expect(loadTime).toBeLessThan(3000); // 3초 이내
  });

  test('실시간 업데이트 기능 확인', async () => {
    await page.goto('/dashboard');
    
    // WebSocket 연결 모킹
    await page.evaluate(() => {
      // 실시간 업데이트 시뮬레이션
      const event = new CustomEvent('websocket:notification', {
        detail: {
          id: Date.now(),
          type: 'feedback',
          priority: 'high',
          message: '새로운 중요 피드백이 도착했습니다',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    // 새 알림이 즉시 표시되는지 확인
    await expect(
      page.locator('[data-testid="notification-item"]').first()
    ).toContainText('새로운 중요 피드백이 도착했습니다');

    // 읽지 않은 알림 카운트 증가 확인
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    await expect(unreadBadge).toBeVisible();
  });

  test('반응형 레이아웃 확인', async () => {
    // 데스크톱 뷰 확인
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    // 3열 레이아웃 확인
    await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveClass(/grid-cols-3/);

    // 태블릿 뷰 확인
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // 레이아웃 변경 대기

    // 2열 또는 1열 레이아웃으로 변경 확인
    await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveClass(/(grid-cols-2|grid-cols-1)/);

    // 모바일 뷰 확인
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // 1열 레이아웃 확인
    await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveClass(/grid-cols-1/);

    // 모바일에서 햄버거 메뉴 확인 (있다면)
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    }
  });

  test('접근성 확인', async () => {
    await page.goto('/dashboard');

    // 키보드 내비게이션 테스트
    await page.keyboard.press('Tab');
    
    // 첫 번째 포커스 가능한 요소 확인
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // 여러 번 탭하여 모든 중요 요소가 포커스 가능한지 확인
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = await page.locator(':focus').first();
      await expect(currentFocus).toBeVisible();
    }

    // ARIA 라벨 확인
    const importantElements = [
      '[data-testid="feedback-notifications"]',
      '[data-testid="invitation-management"]',
      '[data-testid="enhanced-gantt-section"]'
    ];

    for (const selector of importantElements) {
      const element = page.locator(selector);
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      
      // ARIA 라벨이 있어야 함
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }

    // 색상 대비 확인 (기본적인 체크)
    const backgroundColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    const textColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // 기본 색상이 설정되어 있는지 확인
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(textColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('에러 상태 처리 확인', async () => {
    // 네트워크 에러 시뮬레이션
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/dashboard');

    // 에러 상태 UI 확인
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/오류가 발생했습니다/);

    // 재시도 버튼 확인
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();

    // 재시도 기능 테스트 (성공 응답으로 변경)
    await page.unroute('**/api/dashboard/**');
    await retryButton.click();

    // 정상 상태로 복구 확인
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible({ timeout: 10000 });
  });
});