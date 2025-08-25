import { Page, expect } from '@playwright/test';

/**
 * VideoPlanet E2E 테스트 헬퍼 유틸리티
 * 
 * 공통적으로 사용되는 테스트 작업을 위한 헬퍼 함수 모음
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 사용자 로그인
   */
  async login(user: { email: string; password: string }) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
    
    // 로그인 성공 확인
    const authToken = await this.page.evaluate(() => localStorage.getItem('auth_token'));
    expect(authToken).toBeTruthy();
  }

  /**
   * 로그아웃
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  /**
   * 프로젝트 생성 (빠른 생성)
   */
  async createProject(projectData: {
    name: string;
    description?: string;
    category?: string;
  }) {
    await this.page.goto('/projects/create');
    await this.page.fill('[data-testid="project-name"]', projectData.name);
    
    if (projectData.description) {
      await this.page.fill('[data-testid="project-description"]', projectData.description);
    }
    
    if (projectData.category) {
      await this.page.selectOption('[data-testid="project-category"]', projectData.category);
    }
    
    await this.page.click('[data-testid="quick-create-button"]');
    await this.page.waitForURL(/\/projects\/\d+/);
    
    // 프로젝트 ID 반환
    const url = this.page.url();
    const projectId = url.match(/\/projects\/(\d+)/)?.[1];
    return projectId;
  }

  /**
   * 피드백 추가
   */
  async addFeedback(feedbackData: {
    title: string;
    description?: string;
    timestamp?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    // 피드백 추가 버튼 클릭
    await this.page.click('[data-testid="add-feedback-button"]');
    
    // 피드백 폼 작성
    await this.page.fill('[data-testid="feedback-title"]', feedbackData.title);
    
    if (feedbackData.description) {
      await this.page.fill('[data-testid="feedback-description"]', feedbackData.description);
    }
    
    if (feedbackData.timestamp) {
      await this.page.fill('[data-testid="timestamp-input"]', this.formatTimestamp(feedbackData.timestamp));
    }
    
    if (feedbackData.priority) {
      await this.page.selectOption('[data-testid="priority-select"]', feedbackData.priority);
    }
    
    // 제출
    await this.page.click('[data-testid="submit-feedback"]');
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  /**
   * 코멘트 추가
   */
  async addComment(text: string, mentions?: string[]) {
    const commentInput = this.page.locator('[data-testid="comment-input"]');
    await commentInput.fill(text);
    
    // 멘션 추가
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        await commentInput.type(` @${mention}`);
        await this.page.waitForTimeout(500); // 멘션 드롭다운 대기
        await this.page.keyboard.press('Enter');
      }
    }
    
    await this.page.click('[data-testid="submit-comment"]');
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  /**
   * 파일 업로드
   */
  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
    
    // 업로드 완료 대기
    await expect(this.page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });
  }

  /**
   * 모달 대기 및 확인
   */
  async waitForModal(testId: string) {
    const modal = this.page.locator(`[data-testid="${testId}"]`);
    await expect(modal).toBeVisible();
    return modal;
  }

  /**
   * 토스트 메시지 확인
   */
  async expectToast(message: string | RegExp) {
    const toast = this.page.locator('[data-testid="success-toast"], [data-testid="error-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
  }

  /**
   * 에러 메시지 확인
   */
  async expectError(selector: string, message: string | RegExp) {
    const errorElement = this.page.locator(selector);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(message);
  }

  /**
   * 페이지 로딩 대기
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * API 응답 대기
   */
  async waitForAPI(endpoint: string) {
    await this.page.waitForResponse(
      response => response.url().includes(endpoint) && response.status() === 200
    );
  }

  /**
   * WebSocket 연결 대기
   */
  async waitForWebSocket() {
    await this.page.waitForFunction(() => {
      return window['WebSocket'] && document.querySelector('[data-testid="realtime-indicator"].connected');
    });
  }

  /**
   * 스크린샷 캡처
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  /**
   * 성능 메트릭 수집
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        responseTime: navigation.responseEnd - navigation.requestStart
      };
    });
  }

  /**
   * 접근성 검사
   */
  async checkAccessibility(options?: { 
    skipFailures?: boolean; 
    tags?: string[];
  }) {
    // axe-core를 사용한 접근성 검사
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    });

    const results = await this.page.evaluate((options) => {
      return (window as any).axe.run(document, {
        tags: options?.tags || ['wcag2a', 'wcag2aa'],
        elementRef: true
      });
    }, options);

    if (!options?.skipFailures && results.violations.length > 0) {
      console.error('Accessibility violations found:', results.violations);
      throw new Error(`Found ${results.violations.length} accessibility violations`);
    }

    return results;
  }

  /**
   * 네트워크 조건 시뮬레이션
   */
  async simulateSlowNetwork() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms
    });
  }

  /**
   * 오프라인 모드 시뮬레이션
   */
  async goOffline() {
    await this.page.context().setOffline(true);
  }

  /**
   * 온라인 모드 복구
   */
  async goOnline() {
    await this.page.context().setOffline(false);
  }

  /**
   * 쿠키 설정
   */
  async setCookie(name: string, value: string) {
    await this.page.context().addCookies([{
      name,
      value,
      domain: 'localhost',
      path: '/'
    }]);
  }

  /**
   * 로컬 스토리지 설정
   */
  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key, value });
  }

  /**
   * 세션 스토리지 설정
   */
  async setSessionStorage(key: string, value: string) {
    await this.page.evaluate(({ key, value }) => {
      sessionStorage.setItem(key, value);
    }, { key, value });
  }

  /**
   * 요소가 뷰포트에 있는지 확인
   */
  async isInViewport(selector: string) {
    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }

  /**
   * 드래그 앤 드롭
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string) {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);
    
    await source.dragTo(target);
  }

  /**
   * 무한 스크롤 시뮬레이션
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  /**
   * 타임스탬프 포맷팅
   */
  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 랜덤 문자열 생성
   */
  generateRandomString(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * 랜덤 이메일 생성
   */
  generateRandomEmail(): string {
    return `test${Date.now()}@example.com`;
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 대기 함수
   */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }
}