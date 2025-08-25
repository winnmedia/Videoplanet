/**
 * VideoPlanet Mobile and Responsive Design Testing Suite
 * 
 * Tests responsive design, touch interactions, and mobile-specific features
 * across different devices and viewport sizes
 */

import { test, expect, Page } from '@playwright/test';

// Standard viewport configurations for testing
const VIEWPORT_CONFIGS = {
  // Mobile devices
  'iPhone-SE': { width: 375, height: 667, deviceType: 'mobile', orientation: 'portrait' },
  'iPhone-14': { width: 390, height: 844, deviceType: 'mobile', orientation: 'portrait' },
  'iPhone-14-landscape': { width: 844, height: 390, deviceType: 'mobile', orientation: 'landscape' },
  'Galaxy-S22': { width: 360, height: 800, deviceType: 'mobile', orientation: 'portrait' },
  'Pixel-7': { width: 393, height: 851, deviceType: 'mobile', orientation: 'portrait' },
  
  // Tablet devices
  'iPad-Mini': { width: 768, height: 1024, deviceType: 'tablet', orientation: 'portrait' },
  'iPad-Pro-11': { width: 1194, height: 834, deviceType: 'tablet', orientation: 'landscape' },
  'Galaxy-Tab-S8': { width: 1138, height: 712, deviceType: 'tablet', orientation: 'landscape' },
  
  // Desktop viewports
  'Desktop-Small': { width: 1024, height: 768, deviceType: 'desktop', orientation: 'landscape' },
  'Desktop-Standard': { width: 1366, height: 768, deviceType: 'desktop', orientation: 'landscape' },
  'Desktop-Large': { width: 1920, height: 1080, deviceType: 'desktop', orientation: 'landscape' },
  'Desktop-Ultrawide': { width: 2560, height: 1440, deviceType: 'desktop', orientation: 'landscape' },
};

// Responsive breakpoints used in the application
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface ResponsiveTestContext {
  viewportName: string;
  viewport: typeof VIEWPORT_CONFIGS[keyof typeof VIEWPORT_CONFIGS];
  expectedBreakpoint: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
}

test.describe('Responsive Design and Device Testing', () => {
  Object.entries(VIEWPORT_CONFIGS).forEach(([viewportName, viewport]) => {
    const context = createTestContext(viewportName, viewport);
    
    test.describe(`${viewportName} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });

      test('Layout adapts correctly to viewport @responsive @layout', async ({ page }) => {
        // Test 1: Verify viewport meta tag
        const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewportMeta).toContain('width=device-width');
        expect(viewportMeta).toContain('initial-scale=1');

        // Test 2: Check responsive container behavior
        const mainContainer = page.locator('main, [role="main"]').first();
        await expect(mainContainer).toBeVisible();
        
        const containerBox = await mainContainer.boundingBox();
        expect(containerBox?.width).toBeLessThanOrEqual(viewport.width);
        expect(containerBox?.width).toBeGreaterThan(0);

        // Test 3: Navigation responsive behavior
        const navigation = page.locator('nav, [role="navigation"]').first();
        if (await navigation.isVisible()) {
          if (context.isMobile) {
            // Mobile should have hamburger menu or collapsed navigation
            const mobileMenu = page.locator('[aria-label*="menu"], [class*="hamburger"], [class*="mobile-menu"]');
            const hasCollapsedNav = await mobileMenu.isVisible() || 
                                  await navigation.evaluate(nav => window.getComputedStyle(nav).display === 'none');
            
            if (!hasCollapsedNav) {
              // If navigation is visible, it should fit properly
              const navBox = await navigation.boundingBox();
              expect(navBox?.width).toBeLessThanOrEqual(viewport.width);
            }
          } else {
            // Desktop should have full navigation visible
            await expect(navigation).toBeVisible();
          }
        }

        // Test 4: Text readability and scaling
        const textElements = page.locator('p, h1, h2, h3, span').first();
        if (await textElements.isVisible()) {
          const fontSize = await textElements.evaluate(el => {
            return parseInt(window.getComputedStyle(el).fontSize);
          });
          
          // Ensure text is readable (minimum 14px on mobile, 16px on desktop)
          const minFontSize = context.isMobile ? 14 : 16;
          expect(fontSize).toBeGreaterThanOrEqual(minFontSize);
        }
      });

      test('Touch interactions and accessibility @responsive @touch', async ({ page }) => {
        test.skip(!context.hasTouch, 'Touch-specific test skipped on non-touch devices');

        // Test 1: Touch target sizes (minimum 44px for accessibility)
        const touchTargets = page.locator('button, a, input, [role="button"], [class*="clickable"]');
        const touchTargetCount = await touchTargets.count();

        for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
          const target = touchTargets.nth(i);
          if (await target.isVisible()) {
            const box = await target.boundingBox();
            
            if (box) {
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }

        // Test 2: Touch gestures work correctly
        const interactiveElement = touchTargets.first();
        if (await interactiveElement.isVisible()) {
          // Test tap
          await interactiveElement.tap();
          
          // Test double tap (if applicable)
          if (context.isMobile) {
            await page.waitForTimeout(100);
            await interactiveElement.tap();
          }
        }

        // Test 3: Scroll behavior on touch devices
        if (context.isMobile || context.isTablet) {
          const scrollableContent = page.locator('body');
          const initialScrollTop = await scrollableContent.evaluate(el => el.scrollTop);
          
          // Simulate touch scroll
          await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
          await page.mouse.wheel(0, 200);
          
          await page.waitForTimeout(500);
          const newScrollTop = await scrollableContent.evaluate(el => el.scrollTop);
          
          // Should have scrolled (unless page doesn't have scrollable content)
          if (await isPageScrollable(page)) {
            expect(newScrollTop).toBeGreaterThan(initialScrollTop);
          }
        }
      });

      test('Video player responsive behavior @responsive @video', async ({ page }) => {
        await page.goto('/projects');
        
        const videoContainer = page.locator('video, [class*="video"], [data-testid*="video"]').first();
        
        if (await videoContainer.isVisible({ timeout: 5000 })) {
          const videoBox = await videoContainer.boundingBox();
          
          // Video should fit within viewport
          expect(videoBox?.width).toBeLessThanOrEqual(viewport.width);
          
          // Video aspect ratio should be maintained
          if (videoBox) {
            const aspectRatio = videoBox.width / videoBox.height;
            expect(aspectRatio).toBeGreaterThan(0.5); // Reasonable aspect ratio
            expect(aspectRatio).toBeLessThan(3.0);
          }

          // Test video controls responsiveness
          if (context.isMobile) {
            // Mobile should have touch-friendly controls
            const playButton = page.locator('[aria-label*="play"], [title*="play"]').first();
            if (await playButton.isVisible()) {
              const buttonBox = await playButton.boundingBox();
              expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
              expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
            }
          }

          // Test video on different orientations (for mobile)
          if (context.isMobile && viewport.orientation === 'portrait') {
            // Test landscape orientation
            await page.setViewportSize({ width: viewport.height, height: viewport.width });
            await page.waitForTimeout(500);
            
            const landscapeVideoBox = await videoContainer.boundingBox();
            expect(landscapeVideoBox?.width).toBeLessThanOrEqual(viewport.height);
            
            // Restore original orientation
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
          }
        }
      });

      test('Form elements responsiveness @responsive @forms', async ({ page }) => {
        await page.goto('/login');
        
        // Test form container responsiveness
        const form = page.locator('form').first();
        if (await form.isVisible()) {
          const formBox = await form.boundingBox();
          
          // Form should fit within viewport with reasonable margins
          expect(formBox?.width).toBeLessThanOrEqual(viewport.width - 32); // 16px margin each side
          
          // Test input field sizing
          const inputs = form.locator('input[type="text"], input[type="email"], input[type="password"], textarea');
          const inputCount = await inputs.count();
          
          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            if (await input.isVisible()) {
              const inputBox = await input.boundingBox();
              
              if (inputBox) {
                // Input should be wide enough to be usable
                const minWidth = context.isMobile ? 200 : 250;
                expect(inputBox.width).toBeGreaterThan(minWidth);
                
                // Input height should be touch-friendly on mobile
                const minHeight = context.isMobile ? 44 : 32;
                expect(inputBox.height).toBeGreaterThanOrEqual(minHeight);
              }
            }
          }

          // Test button sizing and placement
          const buttons = form.locator('button[type="submit"], button');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < buttonCount; i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const buttonBox = await button.boundingBox();
              
              if (buttonBox) {
                // Buttons should be touch-friendly
                expect(buttonBox.height).toBeGreaterThanOrEqual(44);
                
                if (context.isMobile) {
                  // Mobile buttons should be full-width or adequately sized
                  expect(buttonBox.width).toBeGreaterThan(120);
                }
              }
            }
          }
        }
      });

      test('Navigation and menu responsiveness @responsive @navigation', async ({ page }) => {
        const navigation = page.locator('nav, [role="navigation"]').first();
        
        if (await navigation.isVisible()) {
          if (context.isMobile) {
            // Test mobile menu functionality
            const mobileMenuTrigger = page.locator('[aria-label*="menu"], [class*="hamburger"], [class*="menu-toggle"]').first();
            
            if (await mobileMenuTrigger.isVisible()) {
              // Test menu toggle
              await mobileMenuTrigger.click();
              
              // Menu should appear
              const mobileMenu = page.locator('[class*="mobile-menu"], [role="menu"], [aria-expanded="true"]').first();
              await expect(mobileMenu).toBeVisible({ timeout: 1000 });
              
              // Menu should not overflow viewport
              const menuBox = await mobileMenu.boundingBox();
              if (menuBox) {
                expect(menuBox.width).toBeLessThanOrEqual(viewport.width);
                expect(menuBox.height).toBeLessThanOrEqual(viewport.height);
              }
              
              // Test menu close
              await mobileMenuTrigger.click();
              await expect(mobileMenu).not.toBeVisible({ timeout: 1000 });
            }
          } else {
            // Desktop navigation should be fully visible
            await expect(navigation).toBeVisible();
            
            const navLinks = navigation.locator('a, [role="menuitem"]');
            const linkCount = await navLinks.count();
            
            // Ensure navigation links are accessible
            for (let i = 0; i < Math.min(linkCount, 5); i++) {
              const link = navLinks.nth(i);
              if (await link.isVisible()) {
                await expect(link).toBeEnabled();
              }
            }
          }
        }
      });

      test('Image and media responsiveness @responsive @media', async ({ page }) => {
        // Test responsive images
        const images = page.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const image = images.nth(i);
          if (await image.isVisible()) {
            const imageBox = await image.boundingBox();
            
            if (imageBox) {
              // Images should not overflow viewport
              expect(imageBox.width).toBeLessThanOrEqual(viewport.width);
              
              // Check for responsive image attributes
              const srcset = await image.getAttribute('srcset');
              const sizes = await image.getAttribute('sizes');
              
              if (context.deviceType === 'mobile' && srcset) {
                // Mobile should use appropriate image sizes
                console.log(`📱 Image has srcset for responsive loading: ${!!srcset}`);
              }
            }
          }
        }

        // Test CSS background images responsiveness
        const elementsWithBg = page.locator('[style*="background-image"], [class*="bg-"]');
        const bgCount = await elementsWithBg.count();
        
        for (let i = 0; i < Math.min(bgCount, 3); i++) {
          const element = elementsWithBg.nth(i);
          if (await element.isVisible()) {
            const bgBox = await element.boundingBox();
            
            if (bgBox) {
              expect(bgBox.width).toBeLessThanOrEqual(viewport.width);
            }
          }
        }
      });

      test('Typography and text responsiveness @responsive @typography', async ({ page }) => {
        // Test heading hierarchy and sizing
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        
        let previousFontSize = Infinity;
        
        for (let i = 0; i < Math.min(headingCount, 6); i++) {
          const heading = headings.nth(i);
          if (await heading.isVisible()) {
            const fontSize = await heading.evaluate(el => {
              return parseInt(window.getComputedStyle(el).fontSize);
            });
            
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            
            // Font sizes should generally decrease from h1 to h6
            if (tagName === 'h1') {
              expect(fontSize).toBeGreaterThan(context.isMobile ? 20 : 24);
            }
            
            // Ensure text is readable on all devices
            expect(fontSize).toBeGreaterThan(context.isMobile ? 14 : 16);
          }
        }

        // Test paragraph text readability
        const paragraphs = page.locator('p');
        const paragraphCount = await paragraphs.count();
        
        for (let i = 0; i < Math.min(paragraphCount, 3); i++) {
          const paragraph = paragraphs.nth(i);
          if (await paragraph.isVisible()) {
            const styles = await paragraph.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                fontSize: parseInt(computed.fontSize),
                lineHeight: parseFloat(computed.lineHeight),
                maxWidth: computed.maxWidth,
              };
            });
            
            // Readable font size
            expect(styles.fontSize).toBeGreaterThanOrEqual(context.isMobile ? 14 : 16);
            
            // Reasonable line height for readability
            if (styles.lineHeight > 0) {
              expect(styles.lineHeight / styles.fontSize).toBeGreaterThan(1.2);
              expect(styles.lineHeight / styles.fontSize).toBeLessThan(2.0);
            }
          }
        }
      });

      test('Performance on device viewport @responsive @performance', async ({ page }) => {
        const startTime = Date.now();
        
        // Measure viewport-specific loading performance
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        console.log(`⏱️  ${viewportName} load time: ${loadTime}ms`);
        
        // Device-specific performance expectations
        const performanceTarget = getDevicePerformanceTarget(context);
        expect(loadTime).toBeLessThan(performanceTarget.maxLoadTime);
        
        // Test scroll performance
        if (await isPageScrollable(page)) {
          const scrollStartTime = Date.now();
          
          // Scroll to bottom
          await page.evaluate(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          });
          
          await page.waitForTimeout(1000);
          const scrollTime = Date.now() - scrollStartTime;
          
          console.log(`📜 Scroll performance: ${scrollTime}ms`);
          expect(scrollTime).toBeLessThan(2000); // Should complete smooth scroll in 2s
        }
        
        // Memory usage check for mobile devices
        if (context.isMobile) {
          const memoryInfo = await page.evaluate(() => {
            return (performance as any).memory || null;
          });
          
          if (memoryInfo) {
            const memoryUsageMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
            console.log(`🧠 Mobile memory usage: ${Math.round(memoryUsageMB)}MB`);
            
            // Mobile devices should use less memory
            expect(memoryUsageMB).toBeLessThan(50); // 50MB limit for mobile
          }
        }
      });
    });
  });
});

test.describe('Cross-Device Feature Compatibility', () => {
  test('File upload across devices @device-compatibility @upload', async ({ page }) => {
    await page.goto('/file-upload-demo');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      const testInfo = test.info();
      const deviceType = testInfo.project.metadata?.deviceType || 'desktop';
      
      if (deviceType === 'mobile' && testInfo.project.name?.includes('safari')) {
        // iOS Safari has file upload restrictions
        console.log('📱 iOS Safari: Testing file upload with restrictions');
        
        // Should at least show file input
        await expect(fileInput).toBeVisible();
        
        // Accept attribute should be properly set
        const acceptAttr = await fileInput.getAttribute('accept');
        expect(acceptAttr).toBeTruthy();
      } else {
        // Full file upload testing for other devices
        await fileInput.setInputFiles({
          name: 'test-mobile.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('test image content')
        });
        
        const files = await fileInput.evaluate((input: HTMLInputElement) => input.files?.length || 0);
        expect(files).toBe(1);
      }
    }
  });

  test('Video playback across devices @device-compatibility @video', async ({ page }) => {
    await page.goto('/projects');
    
    const video = page.locator('video').first();
    
    if (await video.isVisible({ timeout: 5000 })) {
      const testInfo = test.info();
      const deviceType = testInfo.project.metadata?.deviceType;
      const browser = testInfo.project.metadata?.browser;
      
      if (deviceType === 'mobile' && browser?.includes('safari')) {
        // iOS Safari has autoplay restrictions
        console.log('📱 iOS Safari: Testing video with autoplay restrictions');
        
        // Manual play should work
        const playButton = page.locator('[aria-label*="play"], button').filter({ hasText: /play|재생/i }).first();
        if (await playButton.isVisible()) {
          await playButton.click();
          
          await page.waitForTimeout(1000);
          const isPlaying = await video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0);
          expect(isPlaying).toBe(true);
        }
      } else {
        // Standard video testing
        const canPlay = await video.evaluate((v: HTMLVideoElement) => v.canPlayType('video/mp4') !== '');
        expect(canPlay).toBe(true);
      }
    }
  });

  test('Real-time features across devices @device-compatibility @websocket', async ({ page }) => {
    await page.goto('/feedback/demo');
    
    // WebSocket should work on all modern devices
    const wsSupport = await page.evaluate(() => typeof WebSocket !== 'undefined');
    expect(wsSupport).toBe(true);
    
    // Connection establishment might vary by device/network
    const testInfo = test.info();
    const deviceType = testInfo.project.metadata?.deviceType;
    
    const connectionTimeout = deviceType === 'mobile' ? 10000 : 5000;
    
    const connectionStatus = page.locator('[data-testid="connection-status"], [class*="connection"]').first();
    
    if (await connectionStatus.isVisible({ timeout: connectionTimeout })) {
      const statusText = await connectionStatus.textContent();
      expect(statusText).toMatch(/connect|연결|online|live/i);
    }
  });
});

// Helper functions

function createTestContext(viewportName: string, viewport: any): ResponsiveTestContext {
  const expectedBreakpoint = getExpectedBreakpoint(viewport.width);
  
  return {
    viewportName,
    viewport,
    expectedBreakpoint,
    isMobile: viewport.deviceType === 'mobile',
    isTablet: viewport.deviceType === 'tablet',
    isDesktop: viewport.deviceType === 'desktop',
    hasTouch: viewport.deviceType === 'mobile' || viewport.deviceType === 'tablet',
  };
}

function getExpectedBreakpoint(width: number): string {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

async function isPageScrollable(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.body.scrollHeight > window.innerHeight;
  });
}

function getDevicePerformanceTarget(context: ResponsiveTestContext) {
  if (context.isMobile) {
    return { maxLoadTime: 8000, maxMemoryMB: 50 };
  } else if (context.isTablet) {
    return { maxLoadTime: 6000, maxMemoryMB: 75 };
  } else {
    return { maxLoadTime: 4000, maxMemoryMB: 100 };
  }
}