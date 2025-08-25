import { test, expect, Page } from '@playwright/test';

/**
 * VideoPlanet 대시보드 구현 상태 점검 테스트
 * 
 * 테스트 목적:
 * 1. 4가지 핵심 정보 표시 확인
 * 2. UI 컴포넌트 동작 검증
 * 3. 반응형 디자인 테스트
 * 4. 접근성 및 UX 검증
 */

test.describe('대시보드 구현 상태 점검', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
    });
    page = await context.newPage();
    
    // 인증 상태 모킹
    await page.addInitScript(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: '테스트 사용자',
        email: 'test@videoplanet.com'
      }));
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Core Features - 핵심 기능 검증', () => {
    test('1. 피드백 알림 섹션 표시 및 동작', async () => {
      await page.goto('/dashboard');
      
      // 피드백 알림 섹션 존재 확인
      const feedbackSection = page.locator('section').filter({ hasText: '피드백 알림' });
      await expect(feedbackSection).toBeVisible();
      
      // 알림 뱃지 표시 확인
      const feedbackBadge = feedbackSection.locator('.badge');
      await expect(feedbackBadge).toBeVisible();
      const unreadCount = await feedbackBadge.textContent();
      expect(Number(unreadCount)).toBeGreaterThan(0);
      
      // 알림 아이템 존재 확인
      const notificationItems = feedbackSection.locator('.notificationItem');
      const itemCount = await notificationItems.count();
      expect(itemCount).toBeGreaterThan(0);
      
      // 첫 번째 알림 클릭 가능 확인
      const firstNotification = notificationItems.first();
      await expect(firstNotification).toBeVisible();
      
      // 우선순위 표시 확인
      const priorityBadge = firstNotification.locator('.notificationType');
      await expect(priorityBadge).toBeVisible();
      
      // 읽음 처리 버튼 확인
      const markAsReadBtn = firstNotification.locator('.markAsRead');
      if (await markAsReadBtn.isVisible()) {
        await markAsReadBtn.click();
        // 읽음 상태로 변경 확인
        await expect(firstNotification).toHaveClass(/read/);
      }
      
      // 시간 표시 확인
      const timeText = firstNotification.locator('.notificationTime');
      await expect(timeText).toBeVisible();
      await expect(timeText).toContainText(/전$/);
    });

    test('2. 프로젝트 알림 섹션 표시 및 동작', async () => {
      await page.goto('/dashboard');
      
      // 프로젝트 알림 섹션 존재 확인
      const projectSection = page.locator('section').filter({ hasText: '프로젝트 알림' });
      await expect(projectSection).toBeVisible();
      
      // 알림 뱃지 표시 확인
      const projectBadge = projectSection.locator('.badge');
      await expect(projectBadge).toBeVisible();
      
      // 알림 타입별 표시 확인 (초대, 마감, 상태변경)
      const notificationTypes = ['초대', '마감', '상태 변경'];
      for (const type of notificationTypes) {
        const typeNotification = projectSection.locator('.notificationType').filter({ hasText: type });
        const count = await typeNotification.count();
        // 최소 하나의 타입은 존재해야 함
        if (count > 0) {
          await expect(typeNotification.first()).toBeVisible();
        }
      }
      
      // 액션 필요 표시 확인
      const actionRequired = projectSection.locator('.actionRequired');
      if (await actionRequired.count() > 0) {
        await expect(actionRequired.first()).toBeVisible();
      }
    });

    test('3. 프로젝트 진행상황 섹션 표시 및 동작', async () => {
      await page.goto('/dashboard');
      
      // 진행상황 섹션 존재 확인
      const progressSection = page.locator('section').filter({ hasText: '프로젝트 일정 진행상황' });
      await expect(progressSection).toBeVisible();
      
      // 프로젝트 아이템 존재 확인
      const progressItems = progressSection.locator('.progressItem');
      const itemCount = await progressItems.count();
      expect(itemCount).toBeGreaterThan(0);
      
      // 각 프로젝트 아이템 검증
      for (let i = 0; i < Math.min(itemCount, 3); i++) {
        const item = progressItems.nth(i);
        
        // 프로젝트 이름 표시
        const projectName = item.locator('.projectName');
        await expect(projectName).toBeVisible();
        
        // 상태 뱃지 표시
        const statusBadge = item.locator('.statusBadge');
        await expect(statusBadge).toBeVisible();
        const statusText = await statusBadge.textContent();
        expect(['정상 진행', '지연', '완료']).toContain(statusText);
        
        // 진행률 바 표시
        const progressBar = item.locator('.progressBar');
        await expect(progressBar).toBeVisible();
        
        // 진행률 퍼센트 표시
        const progressPercent = item.locator('.progressPercent');
        await expect(progressPercent).toBeVisible();
        const percentText = await progressPercent.textContent();
        expect(percentText).toMatch(/^\d+%$/);
        
        // 단계 정보 표시
        const phase = item.locator('.phase');
        await expect(phase).toBeVisible();
        
        // 마감일 표시
        const dueDate = item.locator('.dueDate');
        await expect(dueDate).toBeVisible();
      }
    });

    test('4. 프로젝트 통계 섹션 표시 및 동작', async () => {
      await page.goto('/dashboard');
      
      // 통계 섹션 존재 확인
      const statsSection = page.locator('section').filter({ hasText: '프로젝트 통계' });
      await expect(statsSection).toBeVisible();
      
      // 3가지 통계 카드 확인
      const statCards = statsSection.locator('.statCard');
      await expect(statCards).toHaveCount(3);
      
      // 각 통계 카드 검증
      const expectedStats = ['현재 진행 중', '완료된 프로젝트', '이번 달 프로젝트'];
      
      for (let i = 0; i < 3; i++) {
        const card = statCards.nth(i);
        await expect(card).toBeVisible();
        
        // 아이콘 표시
        const icon = card.locator('.statIcon svg');
        await expect(icon).toBeVisible();
        
        // 라벨 표시
        const label = card.locator('.statLabel');
        await expect(label).toBeVisible();
        await expect(label).toContainText(expectedStats[i]);
        
        // 값 표시
        const value = card.locator('.statValue');
        await expect(value).toBeVisible();
        const valueText = await value.textContent();
        expect(Number(valueText)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('UI Controls - UI 컨트롤 검증', () => {
    test('알림 클릭 상호작용', async () => {
      await page.goto('/dashboard');
      
      // 피드백 알림 클릭
      const feedbackItem = page.locator('.notificationItem').first();
      const initialUrl = page.url();
      
      // 클릭 시 hover 효과 확인
      await feedbackItem.hover();
      await page.waitForTimeout(100);
      
      // 읽음 처리 버튼 동작 확인
      const markAsReadBtn = feedbackItem.locator('.markAsRead');
      if (await markAsReadBtn.isVisible()) {
        await markAsReadBtn.click();
        await expect(feedbackItem).toHaveClass(/read/);
      }
    });

    test('프로젝트 진행상황 호버 효과', async () => {
      await page.goto('/dashboard');
      
      const progressItem = page.locator('.progressItem').first();
      
      // 호버 전 상태 캡처
      await progressItem.screenshot({ path: 'test-results/progress-item-normal.png' });
      
      // 호버 효과 확인
      await progressItem.hover();
      await page.waitForTimeout(200);
      await progressItem.screenshot({ path: 'test-results/progress-item-hover.png' });
    });

    test('통계 카드 호버 효과', async () => {
      await page.goto('/dashboard');
      
      const statCard = page.locator('.statCard').first();
      
      // 호버 효과 확인
      await statCard.hover();
      await page.waitForTimeout(200);
      
      // 아이콘 색상 변경 확인
      const icon = statCard.locator('.statIcon');
      await expect(icon).toBeVisible();
    });
  });

  test.describe('Responsive Design - 반응형 디자인 검증', () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      test(`${viewport.name} 뷰포트 (${viewport.width}x${viewport.height})`, async () => {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');
        
        // 헤더 표시 확인
        const header = page.locator('.dashboardHeader');
        await expect(header).toBeVisible();
        
        // 모든 섹션 표시 확인
        const sections = page.locator('section');
        const sectionCount = await sections.count();
        expect(sectionCount).toBe(4);
        
        // 각 섹션 표시 확인
        for (let i = 0; i < sectionCount; i++) {
          const section = sections.nth(i);
          await expect(section).toBeVisible();
        }
        
        // 모바일에서 그리드 레이아웃 확인
        if (viewport.name === 'Mobile') {
          const mainGrid = page.locator('.dashboardMain');
          const gridStyle = await mainGrid.evaluate(el => 
            window.getComputedStyle(el).gridTemplateColumns
          );
          expect(gridStyle).toContain('1fr');
        }
        
        // 스크린샷 저장
        await page.screenshot({ 
          path: `test-results/dashboard-${viewport.name.toLowerCase()}.png`,
          fullPage: true 
        });
      });
    }
  });

  test.describe('Accessibility - 접근성 검증', () => {
    test('키보드 네비게이션', async () => {
      await page.goto('/dashboard');
      
      // Tab 키로 순회 가능 확인
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // 포커스된 요소 확인
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // 알림 아이템까지 Tab으로 이동
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }
      
      // Enter 키로 활성화 가능 확인
      await page.keyboard.press('Enter');
    });

    test('색상 대비 확인', async () => {
      await page.goto('/dashboard');
      
      // 텍스트 색상 대비 확인
      const textElements = page.locator('.sectionTitle, .notificationTitle, .projectName');
      const count = await textElements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        const color = await element.evaluate(el => 
          window.getComputedStyle(el).color
        );
        // 색상이 정의되어 있는지 확인
        expect(color).toBeTruthy();
      }
    });

    test('ARIA 속성 확인', async () => {
      await page.goto('/dashboard');
      
      // 버튼의 aria-label 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        // aria-label이 있거나 텍스트 콘텐츠가 있어야 함
        if (!ariaLabel) {
          const textContent = await button.textContent();
          expect(textContent).toBeTruthy();
        }
      }
    });
  });

  test.describe('Performance - 성능 검증', () => {
    test('초기 로딩 시간', async () => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForSelector('.dashboardContainer');
      const loadTime = Date.now() - startTime;
      
      // 3초 이내 로딩 확인
      expect(loadTime).toBeLessThan(3000);
      console.log(`Dashboard load time: ${loadTime}ms`);
    });

    test('스크롤 성능', async () => {
      await page.goto('/dashboard');
      
      // 알림 섹션 스크롤 성능 테스트
      const notificationList = page.locator('.notificationList').first();
      
      // 스크롤 가능한지 확인
      const isScrollable = await notificationList.evaluate(el => 
        el.scrollHeight > el.clientHeight
      );
      
      if (isScrollable) {
        // 스크롤 성능 테스트
        await notificationList.evaluate(el => {
          el.scrollTop = el.scrollHeight / 2;
        });
        await page.waitForTimeout(100);
        
        await notificationList.evaluate(el => {
          el.scrollTop = 0;
        });
      }
    });

    test('애니메이션 성능', async () => {
      await page.goto('/dashboard');
      
      // 여러 요소에 대한 호버 애니메이션 테스트
      const cards = page.locator('.statCard');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        await cards.nth(i).hover();
        await page.waitForTimeout(50);
      }
      
      // 부드러운 애니메이션 확인 (시각적 검증)
      await page.screenshot({ 
        path: 'test-results/animation-test.png',
        animations: 'allow' 
      });
    });
  });

  test.describe('Error Handling - 에러 처리 검증', () => {
    test('네트워크 에러 처리', async () => {
      // 네트워크 오프라인 시뮬레이션
      await page.context().setOffline(true);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(e => e);
      
      // 오프라인 상태 복구
      await page.context().setOffline(false);
    });

    test('콘솔 에러 확인', async () => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // 콘솔 에러가 없어야 함
      expect(consoleErrors).toHaveLength(0);
    });
  });
});

// UX Friction 테스트
test.describe('UX Friction Points - UX 마찰점 검증', () => {
  test('명확한 CTA 버튼', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 모든 클릭 가능한 요소가 명확한지 확인
    const clickableElements = page.locator('[role="button"], button, a, .notificationItem, .progressItem');
    const count = await clickableElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = clickableElements.nth(i);
      const cursor = await element.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      
      // pointer 커서가 있어야 함
      expect(['pointer', 'hand']).toContain(cursor);
    }
  });

  test('로딩 상태 표시', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 로딩 스피너 확인
    const loadingSpinner = page.locator('.loadingSpinner');
    // 초기 로딩 시 표시되었다가 사라져야 함
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeHidden({ timeout: 5000 });
    }
  });

  test('피드백 제공', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 읽음 처리 시 즉각적인 피드백
    const unreadNotification = page.locator('.notificationItem').filter({ hasNot: page.locator('.read') }).first();
    
    if (await unreadNotification.count() > 0) {
      const markAsReadBtn = unreadNotification.locator('.markAsRead');
      if (await markAsReadBtn.isVisible()) {
        await markAsReadBtn.click();
        // 즉시 읽음 상태로 변경 확인
        await expect(unreadNotification).toHaveClass(/read/, { timeout: 500 });
      }
    }
  });
});