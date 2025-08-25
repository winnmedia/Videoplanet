import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';

/**
 * VideoPlanet Cross-Browser Testing Configuration
 * 
 * Supports comprehensive testing across:
 * - Major desktop browsers (Chrome, Firefox, Safari, Edge)
 * - Mobile browsers (Chrome Mobile, Safari Mobile)
 * - Multiple viewport sizes and device types
 * - Performance benchmarking and compatibility verification
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// Environment-specific configuration
const isCI = !!process.env.CI;
const isDevelopment = process.env.NODE_ENV === 'development';
const skipSlowTests = process.env.SKIP_SLOW_TESTS === 'true';
const browserFilter = process.env.BROWSER_FILTER; // 'chrome', 'firefox', 'safari', 'edge', 'mobile'

// Performance thresholds for different test scenarios
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals targets
  LCP: 2500,  // Largest Contentful Paint (ms)
  FCP: 1800,  // First Contentful Paint (ms)
  TTI: 3500,  // Time to Interactive (ms)
  CLS: 0.1,   // Cumulative Layout Shift
  FID: 100,   // First Input Delay (ms)
  
  // Video-specific performance
  videoLoadTime: 5000,    // Video initial load (ms)
  feedbackSubmit: 1000,   // Feedback submission (ms)
  realtimeLatency: 500,   // WebSocket message latency (ms)
};

export default defineConfig({
  testDir: './test',
  
  /* Test execution configuration */
  fullyParallel: !isCI, // Parallel on local, sequential on CI for stability
  forbidOnly: isCI,
  retries: isCI ? 3 : 1, // More retries on CI due to network variability
  workers: isCI ? 1 : 4, // Single worker in CI, limited workers locally for stability
  maxFailures: isCI ? 3 : undefined, // Fail fast on CI if too many failures
  
  /* Global timeout settings */
  globalTimeout: isCI ? 60 * 60 * 1000 : 30 * 60 * 1000, // 1 hour CI, 30 min local
  
  /* Reporting configuration */
  reporter: [
    ['html', { 
      outputFolder: 'test-results/cross-browser-report',
      open: isDevelopment ? 'always' : 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/cross-browser-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/cross-browser-junit.xml' 
    }],
    ['list', { printSteps: isDevelopment }],
    // Custom compatibility reporter
    ['./test/reporters/compatibility-reporter.ts']
  ],
  
  /* Global test configuration */
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Force headless mode for all browsers in any environment */
    headless: true,
    
    /* Debugging and monitoring */
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off', // Disable video in CI to save resources
    
    /* Performance monitoring */
    actionTimeout: 30000,
    navigationTimeout: 45000,
    
    /* Security headers verification */
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
    
    /* Locale and timezone for consistent testing */
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    
    /* Global test metadata */
    metadata: {
      testSuite: 'VideoPlanet Cross-Browser Compatibility',
      environment: process.env.NODE_ENV || 'test',
      performanceThresholds: PERFORMANCE_THRESHOLDS,
    }
  },

  /* Cross-Browser Test Matrix */
  projects: [
    // Desktop Browsers - Core Compatibility
    {
      name: 'chrome-desktop',
      testMatch: ['**/journeys/**', '**/cross-browser/**'],
      use: {
        ...devices['Desktop Chrome'],
        // channel: 'chrome', // Use default Chromium instead
        viewport: { width: 1920, height: 1080 },
        headless: true, // Force headless mode
        launchOptions: {
          args: [
            '--headless=new', // Use new headless mode
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--single-process', // For environments with limited resources
          ]
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chromium',
        primary: true, // Primary test browser
      }
    },

    {
      name: 'firefox-desktop',
      testMatch: ['**/journeys/**', '**/cross-browser/**'],
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        headless: true, // Force headless mode
        launchOptions: {
          args: ['--headless'],
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
            'dom.webnotifications.enabled': false,
          }
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'firefox',
        knownIssues: ['WebSocket reconnection slower', 'CSS Grid minor differences']
      }
    },

    {
      name: 'safari-desktop',
      testMatch: ['**/journeys/**', '**/cross-browser/**'],
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        headless: true, // Force headless mode
      },
      metadata: {
        platform: 'desktop',
        browser: 'webkit',
        knownIssues: ['Video codec support limited', 'IndexedDB storage limits']
      }
    },

    {
      name: 'edge-desktop',
      testMatch: ['**/journeys/**', '**/cross-browser/**'],
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chromium-edge'
      }
    },

    // Mobile Browsers - Touch and Responsive Testing
    {
      name: 'mobile-chrome',
      testMatch: ['**/journeys/**', '**/mobile/**', '**/cross-browser/**'],
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 393, height: 851 },
        hasTouch: true,
        isMobile: true,
      },
      metadata: {
        platform: 'mobile',
        browser: 'chrome-mobile',
        deviceType: 'android',
        touchSupport: true
      }
    },

    {
      name: 'mobile-safari',
      testMatch: ['**/journeys/**', '**/mobile/**', '**/cross-browser/**'],
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
      metadata: {
        platform: 'mobile',
        browser: 'safari-mobile',
        deviceType: 'ios',
        touchSupport: true,
        knownIssues: ['Video autoplay restrictions', 'File upload limitations']
      }
    },

    // Tablet Testing
    {
      name: 'tablet-ipad',
      testMatch: ['**/journeys/**', '**/tablet/**', '**/cross-browser/**'],
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
        isMobile: false, // iPad as desktop-like experience
      },
      metadata: {
        platform: 'tablet',
        browser: 'safari-tablet',
        deviceType: 'ipad'
      }
    },

    {
      name: 'tablet-android',
      testMatch: ['**/journeys/**', '**/tablet/**', '**/cross-browser/**'],
      use: {
        ...devices['Galaxy Tab S4'],
        viewport: { width: 1138, height: 712 },
        hasTouch: true,
        isMobile: false,
      },
      metadata: {
        platform: 'tablet',
        browser: 'chrome-tablet',
        deviceType: 'android-tablet'
      }
    },

    // Performance Testing - Different viewport sizes
    {
      name: 'performance-ultrawide',
      testMatch: ['**/performance/**', '**/cross-browser/performance/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chrome-ultrawide',
        performanceFocus: true,
        viewport: 'ultrawide'
      }
    },

    {
      name: 'performance-standard',
      testMatch: ['**/performance/**', '**/cross-browser/performance/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }, // Most common resolution
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chrome-standard',
        performanceFocus: true,
        viewport: 'standard'
      }
    },

    // Accessibility Testing
    {
      name: 'accessibility-chrome',
      testMatch: ['**/accessibility/**', '**/cross-browser/accessibility/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--force-prefers-reduced-motion', // Test reduced motion
            '--disable-background-timer-throttling',
          ]
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chrome-accessibility',
        accessibilityFocus: true,
        reducedMotion: true
      }
    },

    // Legacy Browser Support (if needed)
    ...(process.env.INCLUDE_LEGACY === 'true' ? [{
      name: 'legacy-chrome',
      testMatch: ['**/cross-browser/legacy/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-features=VizDisplayCompositor' // Simulate older rendering
          ]
        }
      },
      metadata: {
        platform: 'desktop',
        browser: 'chrome-legacy',
        legacy: true
      }
    }] : []),
  ].filter(project => {
    // Filter projects based on environment variable
    if (!browserFilter) return true;
    
    const browserMap = {
      'chrome': ['chrome-desktop', 'mobile-chrome', 'performance-ultrawide', 'performance-standard', 'accessibility-chrome'],
      'firefox': ['firefox-desktop'],
      'safari': ['safari-desktop', 'mobile-safari', 'tablet-ipad'],
      'edge': ['edge-desktop'],
      'mobile': ['mobile-chrome', 'mobile-safari'],
      'tablet': ['tablet-ipad', 'tablet-android'],
      'performance': ['performance-ultrawide', 'performance-standard'],
      'accessibility': ['accessibility-chrome']
    };
    
    return browserMap[browserFilter]?.includes(project.name) ?? true;
  }),

  /* Development server configuration - using existing server */
  // webServer: {
  //   command: isDevelopment ? 'npm run dev' : 'npm run build && npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !isCI,
  //   timeout: 120 * 1000,
  //   env: {
  //     NODE_ENV: process.env.NODE_ENV || 'test',
  //     NEXT_TELEMETRY_DISABLED: '1'
  //   }
  // },
  
  /* Timeout configuration */
  timeout: isCI ? 60 * 1000 : 30 * 1000, // Longer on CI
  expect: {
    timeout: 10 * 1000, // Generous timeout for cross-browser differences
    toHaveScreenshot: { 
      threshold: 0.2, // Allow minor rendering differences
      maxDiffPixels: 500 
    },
    toMatchScreenshot: { 
      threshold: 0.2,
      maxDiffPixels: 500 
    }
  },
  
  /* Global Setup and Teardown */
  globalSetup: require.resolve('./test/global-setup.ts'),
  globalTeardown: require.resolve('./test/cross-browser/global-teardown.ts'),
  
  /* Output directories */
  outputDir: 'test-results/cross-browser-artifacts',
  
  /* Advanced configuration */
  forbidOnly: isCI,
  preserveOutput: isCI ? 'failures-only' : 'always',
});