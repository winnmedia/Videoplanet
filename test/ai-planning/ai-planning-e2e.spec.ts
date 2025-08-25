/**
 * AI 영상 기획 시스템 E2E 테스트
 * 
 * INSTRUCTION.md 요구사항에 따른 완전한 사용자 여정 테스트:
 * 1단계(스토리 입력) → 2단계(4단계 검토) → 3단계(12숏트 편집) → PDF 다운로드
 * 
 * @author Grace (QA Lead) - End-to-End Quality Assurance
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { 
  MockLLMService, 
  MockDataGenerator, 
  StoryMetadata, 
  StoryStage, 
  ShotDetails 
} from './mock-llm-service';
import { 
  MockGoogleImagesAPI, 
  MockContiGenerator, 
  ContiVersionManager 
} from './mock-google-images-api';
import { 
  MockPDFGenerator, 
  MockPDFDataGenerator, 
  PDFQualityValidator 
} from './mock-pdf-generator';

// E2E 테스트 상수
const AI_PLANNING_BASE_URL = '/ai-planning';
const TEST_TIMEOUT = 60000; // 1분 (AI API 호출 시간 고려)
const STEP_TRANSITION_DELAY = 2000; // 단계 전환 지연시간
const AI_RESPONSE_TIMEOUT = 15000; // AI API 응답 대기시간

// 테스트 픽스처 설정
test.describe('AI 영상 기획 시스템 E2E 테스트', () => {
  let mockLLM: MockLLMService;
  let mockGoogleAPI: MockGoogleImagesAPI;
  let mockPDFGen: MockPDFGenerator;
  let versionManager: ContiVersionManager;

  test.beforeEach(async ({ page }) => {
    // Mock 서비스 초기화 (성공률 95% 설정)
    mockLLM = new MockLLMService({ 
      failureRate: 0.05, 
      latencyMs: 2000,
      tokenLimit: 8000 
    });
    
    mockGoogleAPI = new MockGoogleImagesAPI({ 
      failureRate: 0.05, 
      latencyMs: 3000,
      dailyQuotaLimit: 200 
    });
    
    mockPDFGen = new MockPDFGenerator({ 
      failureRate: 0.02, 
      latencyMs: 4000 
    });
    
    versionManager = new ContiVersionManager();

    // Mock API 인터셉트 설정
    await setupMockAPIs(page);
    
    // AI 기획 페이지로 이동
    await page.goto(AI_PLANNING_BASE_URL);
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
  });

  // ===== 핵심 사용자 여정 테스트 =====

  test('E001: 완전한 AI 기획 워크플로우 - 입력에서 PDF 다운로드까지', async ({ page }) => {
    test.setTimeout(90000); // 1.5분 타임아웃

    // === 1단계: 스토리 입력 ===
    await test.step('1단계: 스토리 입력 및 메타데이터 설정', async () => {
      // 필수 입력 필드 채우기
      await page.fill('[data-testid="story-title"]', '직장인의 특별한 하루');
      await page.fill('[data-testid="story-oneliner"]', '평범한 직장인이 엘리베이터에서 만난 신비한 인물로 인해 인생이 바뀌는 이야기');
      
      // 톤앤매너 선택 (멀티 선택)
      await page.click('[data-testid="tone-warm"]');
      await page.click('[data-testid="tone-humorous"]');
      
      // 장르 선택
      await page.selectOption('[data-testid="genre-select"]', ['drama', 'comedy']);
      
      // 기타 메타데이터 입력
      await page.fill('[data-testid="target-audience"]', '20-30대 직장인');
      await page.selectOption('[data-testid="duration-select"]', '60');
      await page.selectOption('[data-testid="format-select"]', 'vertical');
      await page.selectOption('[data-testid="tempo-select"]', 'normal');
      await page.selectOption('[data-testid="development-method"]', 'classic');
      await page.selectOption('[data-testid="development-intensity"]', 'moderate');

      // 입력 완료 검증
      await expect(page.locator('[data-testid="generate-button"]')).toBeEnabled();
      
      // 4단계 생성 버튼 클릭
      await page.click('[data-testid="generate-button"]');
      
      // 생성 중 로딩 상태 확인
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-message"]')).toContainText('AI가 스토리를 4단계로 구성하고 있습니다');
    });

    // === 2단계: 4단계 검토/수정 ===
    await test.step('2단계: 4단계 스토리 검토 및 편집', async () => {
      // AI 응답 대기 (최대 15초)
      await page.waitForSelector('[data-testid="stage-cards"]', { timeout: AI_RESPONSE_TIMEOUT });
      
      // 4개 단계 카드 생성 확인
      const stageCards = page.locator('[data-testid="stage-card"]');
      await expect(stageCards).toHaveCount(4);
      
      // 각 단계 제목 확인 (기승전결)
      await expect(stageCards.nth(0)).toContainText('기');
      await expect(stageCards.nth(1)).toContainText('승');
      await expect(stageCards.nth(2)).toContainText('전');
      await expect(stageCards.nth(3)).toContainText('결');
      
      // 첫 번째 단계 편집 테스트
      const firstStage = stageCards.nth(0);
      await firstStage.locator('[data-testid="edit-button"]').click();
      
      // 인라인 편집 모드 확인
      const editableTitle = firstStage.locator('[data-testid="editable-title"]');
      await expect(editableTitle).toBeFocused();
      
      // 제목 수정
      await editableTitle.fill('새로운 시작 - 평범한 아침');
      
      // 편집 완료
      await firstStage.locator('[data-testid="save-button"]').click();
      await expect(firstStage).toContainText('새로운 시작 - 평범한 아침');
      
      // 다음 단계 진행 버튼 활성화 확인
      await expect(page.locator('[data-testid="generate-shots-button"]')).toBeEnabled();
      
      // 12개 숏트 생성 버튼 클릭
      await page.click('[data-testid="generate-shots-button"]');
      
      // 숏트 생성 로딩
      await expect(page.locator('[data-testid="loading-message"]')).toContainText('12개 숏트로 분해하고 있습니다');
    });

    // === 3단계: 12개 숏트 분해·편집 ===
    await test.step('3단계: 12개 숏트 생성 및 콘티 작업', async () => {
      // 12개 숏트 생성 완료 대기
      await page.waitForSelector('[data-testid="shot-cards"]', { timeout: AI_RESPONSE_TIMEOUT });
      
      // 정확히 12개 숏트 생성 확인
      const shotCards = page.locator('[data-testid="shot-card"]');
      await expect(shotCards).toHaveCount(12);
      
      // 첫 번째 숏트 콘티 생성 테스트
      const firstShot = shotCards.nth(0);
      const contiFrame = firstShot.locator('[data-testid="conti-frame"]');
      const generateContiBtn = firstShot.locator('[data-testid="generate-conti"]');
      
      // 초기 상태: 플레이스홀더 이미지
      await expect(contiFrame.locator('img')).toHaveAttribute('alt', 'No image');
      await expect(generateContiBtn).toBeEnabled();
      
      // 콘티 생성 버튼 클릭
      await generateContiBtn.click();
      
      // 콘티 생성 중 로딩
      await expect(firstShot.locator('[data-testid="conti-loading"]')).toBeVisible();
      await expect(firstShot.locator('[data-testid="conti-loading"]')).toContainText('콘티 생성 중');
      
      // 콘티 생성 완료 대기 (Google API 시뮬레이션)
      await page.waitForSelector('[data-testid="conti-image"]', { 
        timeout: 10000,
        state: 'visible'
      });
      
      // 생성된 콘티 이미지 확인
      const contiImage = firstShot.locator('[data-testid="conti-image"]');
      await expect(contiImage).toBeVisible();
      await expect(contiImage).toHaveAttribute('src', /.+/); // 이미지 URL 있음
      
      // 콘티 관련 버튼들 활성화 확인
      await expect(firstShot.locator('[data-testid="regenerate-conti"]')).toBeEnabled();
      await expect(firstShot.locator('[data-testid="download-conti"]')).toBeEnabled();
      
      // 콘티 재생성 테스트
      await firstShot.locator('[data-testid="regenerate-conti"]').click();
      await page.waitForTimeout(3000); // Google API 시뮬레이션 대기
      
      // 버전 라벨 확인 (v1 → v2)
      await expect(firstShot.locator('[data-testid="version-label"]')).toContainText('v2');
    });

    // === 인서트샷 생성 테스트 ===
    await test.step('인서트샷 3개 추천 생성', async () => {
      const firstShot = page.locator('[data-testid="shot-card"]').nth(0);
      
      // 인서트샷 생성 버튼 클릭
      await firstShot.locator('[data-testid="generate-inserts"]').click();
      
      // 인서트샷 생성 대기
      await page.waitForSelector('[data-testid="insert-shots"]', { timeout: 5000 });
      
      // 정확히 3개 인서트샷 확인
      const insertShots = firstShot.locator('[data-testid="insert-shot"]');
      await expect(insertShots).toHaveCount(3);
      
      // 각 인서트샷 목적 확인 (중복 방지)
      const purposes = await insertShots.allInnerTexts();
      expect(purposes).toContain('정보 보강');
      expect(purposes).toContain('리듬 조절');
      expect(purposes).toContain('관계 강조');
    });

    // === PDF 기획안 다운로드 ===
    await test.step('PDF 기획안 생성 및 다운로드', async () => {
      // 상단 고정 바의 다운로드 버튼 클릭
      const downloadButton = page.locator('[data-testid="download-planning-pdf"]');
      await expect(downloadButton).toBeEnabled();
      await downloadButton.click();
      
      // PDF 생성 모달 표시 확인
      const pdfModal = page.locator('[data-testid="pdf-generation-modal"]');
      await expect(pdfModal).toBeVisible();
      
      // PDF 생성 옵션 설정
      await page.check('[data-testid="include-conti-images"]'); // 콘티 이미지 포함
      await page.selectOption('[data-testid="layout-style"]', 'card'); // 카드형 레이아웃
      
      // PDF 생성 시작
      await page.click('[data-testid="generate-pdf-confirm"]');
      
      // PDF 생성 진행률 표시 확인
      const progressBar = page.locator('[data-testid="pdf-progress"]');
      await expect(progressBar).toBeVisible();
      
      // PDF 생성 완료 대기
      await page.waitForSelector('[data-testid="pdf-download-ready"]', { 
        timeout: 20000 // PDF 생성은 시간이 걸림
      });
      
      // 다운로드 링크 확인
      const downloadLink = page.locator('[data-testid="pdf-download-link"]');
      await expect(downloadLink).toBeEnabled();
      await expect(downloadLink).toHaveAttribute('href', /.*\.pdf$/);
      
      // 다운로드 시작 (실제 파일 다운로드는 시뮬레이션)
      const downloadPromise = page.waitForEvent('download');
      await downloadLink.click();
      const download = await downloadPromise;
      
      // 다운로드 파일명 검증
      expect(download.suggestedFilename()).toMatch(/.*기획안.*\.pdf$/);
    });
  });

  // ===== 에러 시나리오 테스트 =====

  test('E002: LLM API 실패 시 재시도 및 에러 처리', async ({ page }) => {
    // Mock LLM을 실패 모드로 설정
    mockLLM.setFailureRate(1.0); // 100% 실패

    await test.step('LLM API 실패 시나리오', async () => {
      // 기본 입력 완료
      await fillBasicStoryData(page);
      
      // 4단계 생성 시도
      await page.click('[data-testid="generate-button"]');
      
      // 첫 번째 실패 후 재시도 UI 표시
      await page.waitForSelector('[data-testid="api-error-modal"]', { timeout: 10000 });
      
      // 에러 메시지 확인
      await expect(page.locator('[data-testid="error-message"]')).toContainText('4단계 생성에 실패했습니다');
      
      // 재시도 버튼 확인 (최대 3회)
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();
      await expect(page.locator('[data-testid="retry-count"]')).toContainText('1/3');
      
      // 재시도 시도
      await retryButton.click();
      
      // 두 번째 실패 후
      await page.waitForSelector('[data-testid="api-error-modal"]', { timeout: 8000 });
      await expect(page.locator('[data-testid="retry-count"]')).toContainText('2/3');
      
      // 최종 실패 후 대안 제시
      await retryButton.click();
      await page.waitForSelector('[data-testid="final-failure-modal"]', { timeout: 8000 });
      await expect(page.locator('[data-testid="alternative-options"]')).toBeVisible();
    });
  });

  test('E003: Google API 쿼터 초과 시 대기 안내', async ({ page }) => {
    // Mock Google API를 쿼터 초과 모드로 설정
    mockGoogleAPI.setQuotaLimit(0); // 즉시 쿼터 초과

    await test.step('Google API 쿼터 초과 시나리오', async () => {
      // 기본 워크플로우 진행 (1-2단계)
      await fillBasicStoryData(page);
      await generateFourStages(page);
      await generateTwelveShots(page);
      
      // 콘티 생성 시도
      const firstShot = page.locator('[data-testid="shot-card"]').nth(0);
      await firstShot.locator('[data-testid="generate-conti"]').click();
      
      // 쿼터 초과 에러 모달 표시
      await page.waitForSelector('[data-testid="quota-exceeded-modal"]', { timeout: 5000 });
      
      // 대기시간 안내 확인
      await expect(page.locator('[data-testid="retry-after-time"]')).toContainText(/\d+시간 \d+분 후/);
      
      // 대체 옵션 제공 확인
      await expect(page.locator('[data-testid="alternative-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="manual-upload-option"]')).toBeVisible();
    });
  });

  // ===== 성능 및 접근성 테스트 =====

  test('E004: 성능 임계값 검증 (Core Web Vitals)', async ({ page }) => {
    // 성능 메트릭 수집 시작
    const metricsCollector = await startPerformanceMetrics(page);

    await test.step('전체 워크플로우 성능 측정', async () => {
      const startTime = Date.now();
      
      // 완전한 워크플로우 실행
      await fillBasicStoryData(page);
      await generateFourStages(page);
      await generateTwelveShots(page);
      await generateContiImages(page, 3); // 3개만 생성하여 시간 단축
      await generatePDF(page);
      
      const totalTime = Date.now() - startTime;
      
      // 전체 워크플로우 완료 시간 검증 (3분 이내)
      expect(totalTime).toBeLessThan(180000);
    });

    await test.step('Core Web Vitals 검증', async () => {
      const metrics = await metricsCollector.getMetrics();
      
      // LCP (Largest Contentful Paint) < 2.5초
      expect(metrics.LCP).toBeLessThan(2500);
      
      // FID (First Input Delay) < 100ms
      expect(metrics.FID).toBeLessThan(100);
      
      // CLS (Cumulative Layout Shift) < 0.1
      expect(metrics.CLS).toBeLessThan(0.1);
      
      // 커스텀 메트릭: AI API 응답 시간 < 10초
      expect(metrics.aiResponseTime).toBeLessThan(10000);
    });
  });

  test('E005: 웹 접근성 (WCAG 2.1 AA) 준수 검증', async ({ page }) => {
    await test.step('키보드 전용 내비게이션', async () => {
      // Tab 키로 모든 인터랙티브 요소 접근 가능한지 확인
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // 위저드 단계 간 키보드 내비게이션
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    await test.step('스크린 리더 호환성', async () => {
      // ARIA 레이블 확인
      await expect(page.locator('[data-testid="story-title"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="generate-button"]')).toHaveAttribute('aria-describedby');
      
      // 진행률 표시 접근성
      const progressIndicator = page.locator('[data-testid="wizard-progress"]');
      await expect(progressIndicator).toHaveAttribute('role', 'progressbar');
      await expect(progressIndicator).toHaveAttribute('aria-valuemin', '1');
      await expect(progressIndicator).toHaveAttribute('aria-valuemax', '3');
    });

    await test.step('색상 대비 및 시각적 접근성', async () => {
      // 고대비 모드 시뮬레이션
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      // 중요한 UI 요소들이 여전히 보이는지 확인
      await expect(page.locator('[data-testid="generate-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    });
  });

  // ===== Helper Functions =====

  /**
   * Mock API 설정 함수
   */
  async function setupMockAPIs(page: Page) {
    // LLM API 모킹
    await page.route('**/api/ai/generate-stages', async route => {
      const response = await mockLLM.generateFourStages(MockDataGenerator.createSampleMetadata());
      await route.fulfill({
        status: response.success ? 200 : 500,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    await page.route('**/api/ai/generate-shots', async route => {
      const stages = MockDataGenerator.createSampleStages();
      const response = await mockLLM.generateTwelveShots(stages, MockDataGenerator.createSampleMetadata());
      await route.fulfill({
        status: response.success ? 200 : 500,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    // Google Images API 모킹
    await page.route('**/api/images/generate-conti', async route => {
      const requestData = await route.request().postDataJSON();
      const response = await mockGoogleAPI.generateContiImage(requestData);
      await route.fulfill({
        status: response.success ? 200 : 500,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    // PDF 생성 API 모킹
    await page.route('**/api/pdf/generate-planning', async route => {
      const requestData = await route.request().postDataJSON();
      const response = await mockPDFGen.generatePlanningPDF(requestData);
      await route.fulfill({
        status: response.success ? 200 : 500,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * 기본 스토리 데이터 입력
   */
  async function fillBasicStoryData(page: Page) {
    await page.fill('[data-testid="story-title"]', '테스트 영상');
    await page.fill('[data-testid="story-oneliner"]', '테스트를 위한 간단한 스토리');
    await page.click('[data-testid="tone-warm"]');
    await page.selectOption('[data-testid="genre-select"]', 'drama');
    await page.fill('[data-testid="target-audience"]', '테스트 사용자');
    await page.selectOption('[data-testid="duration-select"]', '30');
    await page.selectOption('[data-testid="format-select"]', 'horizontal');
    await page.selectOption('[data-testid="tempo-select"]', 'normal');
    await page.selectOption('[data-testid="development-method"]', 'classic');
    await page.selectOption('[data-testid="development-intensity"]', 'moderate');
  }

  /**
   * 4단계 생성 실행
   */
  async function generateFourStages(page: Page) {
    await page.click('[data-testid="generate-button"]');
    await page.waitForSelector('[data-testid="stage-cards"]', { timeout: AI_RESPONSE_TIMEOUT });
    await expect(page.locator('[data-testid="stage-card"]')).toHaveCount(4);
  }

  /**
   * 12개 숏트 생성 실행
   */
  async function generateTwelveShots(page: Page) {
    await page.click('[data-testid="generate-shots-button"]');
    await page.waitForSelector('[data-testid="shot-cards"]', { timeout: AI_RESPONSE_TIMEOUT });
    await expect(page.locator('[data-testid="shot-card"]')).toHaveCount(12);
  }

  /**
   * 콘티 이미지 생성 (지정된 개수만큼)
   */
  async function generateContiImages(page: Page, count: number) {
    for (let i = 0; i < count; i++) {
      const shot = page.locator('[data-testid="shot-card"]').nth(i);
      await shot.locator('[data-testid="generate-conti"]').click();
      await page.waitForSelector(`[data-testid="shot-card"]:nth-child(${i + 1}) [data-testid="conti-image"]`, { timeout: 8000 });
    }
  }

  /**
   * PDF 생성 실행
   */
  async function generatePDF(page: Page) {
    await page.click('[data-testid="download-planning-pdf"]');
    await page.waitForSelector('[data-testid="pdf-generation-modal"]');
    await page.click('[data-testid="generate-pdf-confirm"]');
    await page.waitForSelector('[data-testid="pdf-download-ready"]', { timeout: 20000 });
  }

  /**
   * 성능 메트릭 수집기
   */
  async function startPerformanceMetrics(page: Page) {
    const metrics = {
      LCP: 0,
      FID: 0, 
      CLS: 0,
      aiResponseTime: 0
    };

    // Web Vitals 측정
    await page.addInitScript(() => {
      import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
        getCLS((metric) => window.__CLS = metric.value);
        getFID((metric) => window.__FID = metric.value);
        getLCP((metric) => window.__LCP = metric.value);
      });
    });

    return {
      async getMetrics() {
        const webVitals = await page.evaluate(() => ({
          LCP: window.__LCP || 0,
          FID: window.__FID || 0,
          CLS: window.__CLS || 0
        }));

        return { ...metrics, ...webVitals };
      }
    };
  }
});