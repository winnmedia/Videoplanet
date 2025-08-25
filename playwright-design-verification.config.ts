import { defineConfig, devices } from '@playwright/test';

/**
 * VideoPlanet UX/UI 디자인 자동 검증 시스템
 * MCP Playwright 활용 설정
 * 
 * 검증 영역:
 * 1. 디자인 일관성 (색상, 폰트, 간격)
 * 2. 톤앤매너 준수
 * 3. 반응형 디자인
 * 4. 접근성 표준 (WCAG 2.1 AA)
 * 5. 성능 영향 측정
 * 6. UI 일관성
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './test/design-verification',
  
  /* 디자인 검증 전용 설정 */
  fullyParallel: false, // 디자인 검증은 순차 실행으로 일관성 보장
  retries: 1,
  workers: 1, // 단일 워커로 디자인 토큰 검증의 일관성 유지
  
  /* 타임아웃 설정 */
  timeout: 60 * 1000, // 디자인 분석은 충분한 시간 확보
  
  /* 리포팅 설정 */
  reporter: [
    ['html', { 
      outputFolder: 'test-results/design-verification-report',
      open: isDevelopment ? 'always' : 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/design-verification-results.json' 
    }],
    ['./test/reporters/design-verification-reporter.ts'],
  ],
  
  /* 글로벌 테스트 설정 */
  use: {
    // 실제 개발 서버 주소 (3001 포트)
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    
    /* 디자인 검증을 위한 브라우저 설정 */
    headless: !isDevelopment, // 개발 환경에서는 visual debugging 가능
    
    /* 스크린샷 및 영상 설정 */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    /* 디자인 검증에 최적화된 설정 */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* 한국어 환경 설정 */
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    
    /* 디자인 검증을 위한 메타데이터 */
    metadata: {
      testSuite: 'VideoPlanet Design Verification Suite',
      environment: process.env.NODE_ENV || 'test',
      designTokensVersion: '2.2.0',
      brandColors: {
        primary: '#1631F8',
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      }
    }
  },

  /* 디자인 검증 전용 프로젝트 설정 */
  projects: [
    /* 데스크톱 - 디자인 토큰 검증 */
    {
      name: 'desktop-design-tokens',
      testMatch: ['**/design-tokens/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-web-security', // CSS 분석을 위한 CORS 우회
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--force-color-profile=srgb', // 색상 일관성을 위한 표준 컬러 프로필
            '--disable-features=TranslateUI',
          ]
        }
      },
      metadata: {
        category: 'design-tokens',
        viewport: 'desktop',
        focus: 'brand-consistency'
      }
    },

    /* 모바일 - 반응형 디자인 검증 */
    {
      name: 'mobile-responsive-design',
      testMatch: ['**/responsive-design/**'],
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
      metadata: {
        category: 'responsive-design',
        viewport: 'mobile',
        focus: 'touch-interactions'
      }
    },

    /* 태블릿 - 중간 뷰포트 디자인 검증 */
    {
      name: 'tablet-responsive-design',
      testMatch: ['**/responsive-design/**'],
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
        isMobile: false,
      },
      metadata: {
        category: 'responsive-design',
        viewport: 'tablet',
        focus: 'adaptive-layouts'
      }
    },

    /* 접근성 검증 - 고대비/감소 모션 */
    {
      name: 'accessibility-verification',
      testMatch: ['**/accessibility/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion', // 모션 감소 설정 테스트
            '--force-color-profile=srgb',
            '--disable-background-timer-throttling',
          ]
        },
        // 고대비 모드 시뮬레이션
        extraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
        }
      },
      metadata: {
        category: 'accessibility',
        viewport: 'desktop',
        focus: 'wcag-compliance',
        wcagLevel: 'AA'
      }
    },

    /* 성능 영향 측정 */
    {
      name: 'performance-impact',
      testMatch: ['**/performance-impact/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--enable-precise-memory-info', // 메모리 사용량 정확한 측정
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ]
        }
      },
      metadata: {
        category: 'performance',
        viewport: 'desktop',
        focus: 'design-impact-on-performance'
      }
    },

    /* UI 일관성 검증 - 크로스 브라우저 */
    {
      name: 'ui-consistency-chrome',
      testMatch: ['**/ui-consistency/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      metadata: {
        category: 'ui-consistency',
        browser: 'chrome',
        baseline: true
      }
    },

    {
      name: 'ui-consistency-firefox',
      testMatch: ['**/ui-consistency/**'],
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      metadata: {
        category: 'ui-consistency',
        browser: 'firefox'
      }
    },

    {
      name: 'ui-consistency-safari',
      testMatch: ['**/ui-consistency/**'],
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      metadata: {
        category: 'ui-consistency',
        browser: 'safari'
      }
    },
  ],
  
  /* 스크린샷 비교 설정 */
  expect: {
    timeout: 15 * 1000,
    toHaveScreenshot: { 
      threshold: 0.05, // 디자인 검증은 엄격한 임계값 
      maxDiffPixels: 100,
      animations: 'disabled', // 애니메이션 비활성화로 일관된 스크린샷
    },
    toMatchScreenshot: { 
      threshold: 0.05,
      maxDiffPixels: 100,
      animations: 'disabled'
    }
  },
  
  /* 출력 디렉토리 */
  outputDir: 'test-results/design-verification-artifacts',
  
  /* 글로벌 설정 */
  globalSetup: require.resolve('./test/design-verification/global-setup.ts'),
  globalTeardown: require.resolve('./test/design-verification/global-teardown.ts'),
});