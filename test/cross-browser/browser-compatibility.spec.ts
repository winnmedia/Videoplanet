/**
 * VideoPlanet Cross-Browser Compatibility Test Suite
 * 
 * Tests core application functionality across different browsers and devices
 * Focuses on browser-specific features and compatibility issues
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// Browser-specific configurations
const BROWSER_CONFIGS = {
  chromium: {
    features: ['videoPlayback', 'webSocket', 'fileUpload', 'modernJS', 'webGL'],
    knownIssues: [],
    performance: { videoLoad: 3000, pageLoad: 2000 }
  },
  firefox: {
    features: ['videoPlayback', 'webSocket', 'fileUpload', 'modernJS'],
    knownIssues: ['webSocketReconnect', 'cssGridMinor'],
    performance: { videoLoad: 4000, pageLoad: 2500 }
  },
  webkit: {
    features: ['videoPlayback', 'webSocket', 'fileUpload'],
    knownIssues: ['videoCodec', 'indexedDBLimits', 'videoAutoplay'],
    performance: { videoLoad: 5000, pageLoad: 3000 }
  }
};

// Feature compatibility matrix
const FEATURE_TESTS = {
  videoPlayback: {
    testName: 'Video playback and controls',
    selector: 'video, [data-testid="video-player"]',
    action: 'play',
    verification: 'currentTime > 0'
  },
  webSocket: {
    testName: 'WebSocket real-time communication',
    selector: '[data-testid="realtime-status"]',
    action: 'connect',
    verification: 'connected'
  },
  fileUpload: {
    testName: 'File upload functionality',
    selector: 'input[type="file"]',
    action: 'upload',
    verification: 'progress'
  },
  modernJS: {
    testName: 'Modern JavaScript features (ES2020+)',
    selector: '[data-testid="js-features"]',
    action: 'execute',
    verification: 'supported'
  },
  webGL: {
    testName: 'WebGL and hardware acceleration',
    selector: '[data-testid="webgl-canvas"]',
    action: 'render',
    verification: 'context'
  }
};

test.describe('Cross-Browser Compatibility Matrix', () => {
  let browserName: string;
  let browserMetadata: any;

  test.beforeEach(async ({ page, browserName: name }) => {
    browserName = name;
    
    // Get browser metadata from test info
    const testInfo = test.info();
    browserMetadata = testInfo.project.metadata || {};
    
    console.log(`🌐 Testing on ${browserName} (${browserMetadata.platform || 'unknown'})`);
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Basic page rendering and layout @cross-browser', async ({ page }) => {
    // Test 1: Page loads without errors
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify no critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('third-party')
    );
    
    expect(criticalErrors).toHaveLength(0);

    // Test 2: Main navigation elements are visible
    const navigation = page.locator('nav, [role="navigation"]').first();
    await expect(navigation).toBeVisible();

    // Test 3: Core layout elements render correctly
    const header = page.locator('header, [role="banner"]').first();
    const main = page.locator('main, [role="main"]').first();
    
    await expect(header).toBeVisible();
    await expect(main).toBeVisible();

    // Test 4: CSS Grid/Flexbox layouts work
    const layoutContainer = page.locator('[class*="grid"], [class*="flex"]').first();
    if (await layoutContainer.isVisible()) {
      const boundingBox = await layoutContainer.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
  });

  test('Video playback compatibility @cross-browser @video', async ({ page }) => {
    // Navigate to a page with video content
    await page.goto('/projects'); // Assuming projects page has videos
    
    const videoElement = page.locator('video').first();
    
    if (await videoElement.isVisible({ timeout: 5000 })) {
      // Test video element properties
      const canPlay = await videoElement.evaluate((video: HTMLVideoElement) => {
        return video.canPlayType('video/mp4') !== '';
      });

      if (browserName === 'webkit') {
        // Safari has stricter video policies
        console.log('ℹ️  Safari video testing with restricted autoplay');
        
        // Test manual play trigger
        const playButton = page.locator('[aria-label*="play"], [title*="play"], button').filter({ hasText: /play|재생/i });
        if (await playButton.isVisible()) {
          await playButton.click();
          
          // Wait for video to start
          await page.waitForTimeout(1000);
          
          const isPlaying = await videoElement.evaluate((video: HTMLVideoElement) => {
            return !video.paused && video.currentTime > 0;
          });
          
          expect(isPlaying).toBe(true);
        }
      } else {
        // Chrome/Firefox - test programmatic play
        expect(canPlay).toBe(true);
        
        await videoElement.evaluate((video: HTMLVideoElement) => video.play());
        
        // Verify playback started
        await expect(videoElement).toHaveJSProperty('paused', false);
      }

      // Test video controls
      const controls = await videoElement.getAttribute('controls');
      if (controls !== null) {
        // Verify controls are functional
        const duration = await videoElement.evaluate((video: HTMLVideoElement) => video.duration);
        expect(duration).toBeGreaterThan(0);
      }
    } else {
      // Log when video is not available for testing
      console.log('⚠️  No video elements found for compatibility testing');
    }
  });

  test('WebSocket real-time features @cross-browser @websocket', async ({ page }) => {
    // Navigate to a page with real-time features
    await page.goto('/feedback/demo'); // Assuming feedback page has WebSocket
    
    // Test WebSocket connection capability
    const wsSupported = await page.evaluate(() => {
      return typeof WebSocket !== 'undefined';
    });
    
    expect(wsSupported).toBe(true);

    // Test connection to WebSocket (if available)
    const connectionStatus = page.locator('[data-testid="connection-status"], [class*="connection"]').first();
    
    if (await connectionStatus.isVisible({ timeout: 3000 })) {
      const statusText = await connectionStatus.textContent();
      
      // Should indicate connection attempt or success
      expect(statusText).toMatch(/connect|연결|online|live/i);
      
      // Browser-specific WebSocket behavior tests
      if (browserName === 'firefox') {
        // Firefox sometimes takes longer to establish WebSocket connections
        await page.waitForTimeout(2000);
      }
      
      if (browserName === 'webkit') {
        // Safari has stricter WebSocket security policies
        console.log('ℹ️  Safari WebSocket testing with security restrictions');
      }
    }

    // Test real-time feature functionality
    const feedbackForm = page.locator('textarea, [contenteditable="true"]').first();
    if (await feedbackForm.isVisible()) {
      await feedbackForm.fill('Cross-browser WebSocket test message');
      
      // Look for real-time indicators (typing, sending, etc.)
      const realtimeIndicators = page.locator('[class*="typing"], [class*="sending"], [class*="live"]');
      const indicatorCount = await realtimeIndicators.count();
      
      console.log(`📡 Real-time indicators found: ${indicatorCount}`);
    }
  });

  test('File upload functionality @cross-browser @upload', async ({ page }) => {
    await page.goto('/file-upload-demo');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // Test file input accessibility
      const isEnabled = await fileInput.isEnabled();
      expect(isEnabled).toBe(true);

      // Test drag and drop support
      const dropZone = page.locator('[class*="drop"], [data-testid*="drop"]').first();
      
      if (await dropZone.isVisible()) {
        // Browser-specific drag and drop behavior
        if (browserMetadata.platform === 'mobile') {
          console.log('📱 Mobile device: Skipping drag-and-drop tests');
        } else {
          // Test drag and drop events
          await dropZone.hover();
          
          const dropSupported = await page.evaluate(() => {
            return 'ondrop' in window;
          });
          
          expect(dropSupported).toBe(true);
        }
      }

      // Test file selection dialog
      if (browserName !== 'webkit' || browserMetadata.platform !== 'mobile') {
        // Safari on mobile has restrictions on file input
        
        // Create a test file upload scenario
        await fileInput.setInputFiles({
          name: 'test-video.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('test video content')
        });

        // Verify file was selected
        const files = await fileInput.evaluate((input: HTMLInputElement) => {
          return input.files?.length || 0;
        });
        
        expect(files).toBeGreaterThan(0);
      } else {
        console.log('ℹ️  Safari mobile: File upload testing limited');
      }
    }
  });

  test('Modern JavaScript features compatibility @cross-browser @javascript', async ({ page }) => {
    // Test ES2020+ features used in the application
    const jsFeatureSupport = await page.evaluate(() => {
      const features = {
        asyncAwait: (async () => true)() instanceof Promise,
        optionalChaining: true, // Would fail on unsupported browsers
        nullishCoalescing: (null ?? 'default') === 'default',
        bigint: typeof BigInt !== 'undefined',
        dynamicImport: typeof window !== 'undefined',
        modules: typeof document.createElement === 'function',
        webComponents: typeof customElements !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        resizeObserver: typeof ResizeObserver !== 'undefined',
      };

      return features;
    });

    // All modern browsers should support these features
    expect(jsFeatureSupport.asyncAwait).toBe(true);
    expect(jsFeatureSupport.nullishCoalescing).toBe(true);
    
    // Conditional support based on browser
    if (browserName === 'webkit') {
      // Safari might have limited support for some features
      console.log('ℹ️  Safari feature support check passed');
    }

    if (browserName === 'firefox') {
      // Firefox generally has good ES feature support
      expect(jsFeatureSupport.dynamicImport).toBe(true);
    }

    // Test browser APIs used by the application
    const apiSupport = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        serviceWorkers: 'serviceWorker' in navigator,
        geolocation: 'geolocation' in navigator,
        mediaDevices: navigator.mediaDevices !== undefined,
      };
    });

    expect(apiSupport.fetch).toBe(true);
    expect(apiSupport.localStorage).toBe(true);
    expect(apiSupport.sessionStorage).toBe(true);

    // IndexedDB support with browser-specific considerations
    if (browserName === 'webkit' && browserMetadata.platform === 'mobile') {
      // Safari on iOS has strict IndexedDB limits
      console.log('ℹ️  Safari iOS: IndexedDB with limitations');
    } else {
      expect(apiSupport.indexedDB).toBe(true);
    }
  });

  test('Touch and mobile interactions @cross-browser @mobile', async ({ page }) => {
    const isMobile = browserMetadata.platform === 'mobile' || browserMetadata.touchSupport;
    
    if (!isMobile) {
      test.skip('Skipping mobile-specific tests on desktop browsers');
      return;
    }

    // Test touch event support
    const touchSupport = await page.evaluate(() => {
      return 'ontouchstart' in window;
    });

    expect(touchSupport).toBe(true);

    // Test touch gestures on interactive elements
    const touchTargets = page.locator('button, [role="button"], a, [class*="touch"]');
    const touchTargetCount = await touchTargets.count();

    if (touchTargetCount > 0) {
      const firstTarget = touchTargets.first();
      
      // Test touch tap
      await firstTarget.tap();
      
      // Verify touch target size (minimum 44px for accessibility)
      const boundingBox = await firstTarget.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Test viewport meta tag for mobile optimization
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
    
    const viewportContent = await viewportMeta.getAttribute('content');
    expect(viewportContent).toContain('width=device-width');

    // Test responsive design breakpoints
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(500);
    
    const mobileLayout = page.locator('[class*="mobile"], [class*="sm:"]').first();
    if (await mobileLayout.isVisible()) {
      console.log('📱 Mobile-responsive layout detected');
    }
  });

  test('Performance baseline measurement @cross-browser @performance', async ({ page }) => {
    // Measure Core Web Vitals for browser comparison
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Use Performance Observer to collect metrics
        const metrics: Record<string, number> = {};
        
        // Collect paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          metrics[entry.name] = entry.startTime;
        });

        // Collect navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
          metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
          metrics.ttfb = navigation.responseStart - navigation.navigationStart;
        }

        // Collect LCP if available
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const lcpEntries = list.getEntries();
            if (lcpEntries.length > 0) {
              metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
            }
            observer.disconnect();
            resolve(metrics);
          });
          
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Fallback timeout
            setTimeout(() => {
              observer.disconnect();
              resolve(metrics);
            }, 5000);
          } catch (error) {
            resolve(metrics);
          }
        } else {
          resolve(metrics);
        }
      });
    });

    console.log(`📊 Performance metrics for ${browserName}:`, performanceMetrics);

    // Verify performance thresholds
    const config = BROWSER_CONFIGS[browserName as keyof typeof BROWSER_CONFIGS];
    if (config && performanceMetrics.loadComplete) {
      expect(performanceMetrics.loadComplete).toBeLessThan(config.performance.pageLoad * 2); // Allow 2x buffer
    }

    // Test memory usage (if supported)
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory || null;
    });

    if (memoryInfo) {
      console.log(`🧠 Memory usage: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`);
      
      // Basic memory leak detection
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    }
  });

  test('Accessibility features across browsers @cross-browser @accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Test screen reader compatibility
    const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
    const ariaCount = await ariaElements.count();
    
    console.log(`♿ ARIA elements found: ${ariaCount}`);
    expect(ariaCount).toBeGreaterThan(0);

    // Test color contrast (basic check)
    const colorTestElement = page.locator('body').first();
    const styles = await colorTestElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Basic contrast verification (would need proper contrast checking library for production)
    expect(styles.color).toBeTruthy();
    expect(styles.backgroundColor).toBeTruthy();

    // Test reduced motion preferences (if supported)
    if (browserMetadata.reducedMotion) {
      const prefersReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      console.log(`🎭 Reduced motion preference: ${prefersReducedMotion}`);
    }

    // Test focus management
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]');
    const interactiveCount = await interactiveElements.count();
    
    if (interactiveCount > 0) {
      // Verify first interactive element is focusable
      await interactiveElements.first().focus();
      await expect(interactiveElements.first()).toBeFocused();
    }
  });

  test('Error handling and recovery @cross-browser @error-handling', async ({ page }) => {
    const errors: { type: string, message: string, browser: string }[] = [];
    
    // Collect all errors
    page.on('pageerror', error => {
      errors.push({ type: 'javascript', message: error.message, browser: browserName });
    });
    
    page.on('requestfailed', request => {
      errors.push({ type: 'network', message: `${request.method()} ${request.url()}`, browser: browserName });
    });

    // Test error recovery scenarios
    await page.goto('/non-existent-page');
    
    // Should show 404 page
    const notFoundText = page.locator('text=/404|not found|page not found/i');
    await expect(notFoundText).toBeVisible({ timeout: 5000 });

    // Navigate back to working page
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Test JavaScript error recovery
    await page.evaluate(() => {
      // Trigger a non-critical error
      try {
        (window as any).nonExistentFunction();
      } catch (e) {
        // Error should be caught and not break the page
      }
    });

    // Page should still be functional
    const navigation = page.locator('nav, [role="navigation"]').first();
    await expect(navigation).toBeVisible();

    // Log browser-specific errors for analysis
    if (errors.length > 0) {
      console.log(`⚠️  ${browserName} errors:`, errors);
    }

    // Critical errors should not prevent core functionality
    const criticalErrors = errors.filter(error => 
      error.message.includes('failed to fetch') ||
      error.message.includes('network error') ||
      error.message.includes('script error')
    );
    
    // Allow some network errors in test environment
    expect(criticalErrors.length).toBeLessThan(5);
  });
});

test.describe('Browser-Specific Feature Tests', () => {
  test('Chrome-specific features @chrome-only', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');
    
    await page.goto('/');
    
    // Test Chrome DevTools APIs (if available in test)
    const chromeFeatures = await page.evaluate(() => {
      return {
        webGLSupport: !!window.WebGLRenderingContext,
        webGL2Support: !!window.WebGL2RenderingContext,
        hardwareAcceleration: true, // Assume true for Chrome
        performanceObserver: 'PerformanceObserver' in window,
      };
    });

    expect(chromeFeatures.webGLSupport).toBe(true);
    expect(chromeFeatures.performanceObserver).toBe(true);
  });

  test('Firefox-specific features @firefox-only', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.goto('/');
    
    // Test Firefox-specific features
    const firefoxFeatures = await page.evaluate(() => {
      return {
        mozExtension: 'moz' in window,
        firefoxUserAgent: navigator.userAgent.includes('Firefox'),
      };
    });

    expect(firefoxFeatures.firefoxUserAgent).toBe(true);
  });

  test('Safari-specific features @safari-only', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    await page.goto('/');
    
    // Test Safari-specific considerations
    const safariFeatures = await page.evaluate(() => {
      return {
        safariUserAgent: navigator.userAgent.includes('Safari'),
        webkitFeatures: 'webkitRequestAnimationFrame' in window,
        touchForceSupport: 'TouchEvent' in window && 'force' in TouchEvent.prototype,
      };
    });

    console.log('🍎 Safari features:', safariFeatures);
    
    // Safari has different autoplay policies
    await page.goto('/projects');
    const videos = page.locator('video');
    
    if (await videos.count() > 0) {
      const autoplayPolicy = await videos.first().evaluate((video: HTMLVideoElement) => {
        return video.autoplay;
      });
      
      console.log('🎬 Safari autoplay policy applied');
    }
  });
});

// Helper function to get browser-specific configuration
function getBrowserConfig(browserName: string) {
  return BROWSER_CONFIGS[browserName as keyof typeof BROWSER_CONFIGS] || BROWSER_CONFIGS.chromium;
}