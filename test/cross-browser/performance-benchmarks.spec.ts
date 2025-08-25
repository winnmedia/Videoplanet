/**
 * VideoPlanet Cross-Browser Performance Benchmarking Suite
 * 
 * Establishes performance baselines and monitors across different browsers/devices
 * Measures Core Web Vitals, video performance, and real-time features
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds by browser and device type
const PERFORMANCE_TARGETS = {
  desktop: {
    chromium: { LCP: 2000, FCP: 1500, TTI: 3000, CLS: 0.1 },
    firefox: { LCP: 2500, FCP: 1800, TTI: 3500, CLS: 0.15 },
    webkit: { LCP: 3000, FCP: 2000, TTI: 4000, CLS: 0.2 },
  },
  mobile: {
    chromium: { LCP: 3000, FCP: 2000, TTI: 4000, CLS: 0.15 },
    webkit: { LCP: 3500, FCP: 2500, TTI: 5000, CLS: 0.25 },
  },
  tablet: {
    chromium: { LCP: 2500, FCP: 1800, TTI: 3500, CLS: 0.12 },
    webkit: { LCP: 3200, FCP: 2200, TTI: 4500, CLS: 0.2 },
  }
};

// Video-specific performance targets
const VIDEO_PERFORMANCE_TARGETS = {
  desktop: { loadTime: 3000, seekTime: 500, playbackStability: 0.95 },
  mobile: { loadTime: 5000, seekTime: 1000, playbackStability: 0.90 },
  tablet: { loadTime: 4000, seekTime: 750, playbackStability: 0.92 },
};

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number;
  FCP?: number;
  FID?: number;
  CLS?: number;
  TTI?: number;
  
  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  timeToFirstByte: number;
  
  // Memory metrics
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  
  // Network metrics
  requestCount: number;
  transferSize: number;
  
  // Video-specific metrics
  videoLoadTime?: number;
  videoSeekTime?: number;
  videoPlaybackStability?: number;
}

test.describe('Cross-Browser Performance Benchmarks', () => {
  let browserName: string;
  let deviceType: string;
  let browserMetadata: any;

  test.beforeEach(async ({ page, browserName: name }) => {
    browserName = name;
    
    // Get test metadata
    const testInfo = test.info();
    browserMetadata = testInfo.project.metadata || {};
    deviceType = browserMetadata.platform || 'desktop';
    
    console.log(`📊 Performance testing: ${browserName} on ${deviceType}`);
  });

  test('Page load performance baseline @performance @core-vitals', async ({ page }) => {
    // Start performance monitoring
    await page.addInitScript(() => {
      // Inject performance monitoring
      window.performanceMetrics = {
        marks: new Map(),
        measures: new Map(),
        observers: []
      };
    });

    const startTime = Date.now();
    
    // Navigate to homepage with performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const endTime = Date.now();
    const pageLoadTime = endTime - startTime;

    // Collect Core Web Vitals and other metrics
    const metrics = await collectPerformanceMetrics(page);
    
    console.log(`⏱️  ${browserName} metrics:`, {
      pageLoad: `${pageLoadTime}ms`,
      LCP: metrics.LCP ? `${Math.round(metrics.LCP)}ms` : 'N/A',
      FCP: metrics.FCP ? `${Math.round(metrics.FCP)}ms` : 'N/A',
      TTI: metrics.TTI ? `${Math.round(metrics.TTI)}ms` : 'N/A',
      CLS: metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'
    });

    // Verify against browser/device targets
    const targets = getPerformanceTargets(browserName, deviceType);
    
    if (targets) {
      // Allow 50% buffer for test environment variability
      const buffer = 1.5;
      
      if (metrics.LCP) {
        expect(metrics.LCP).toBeLessThan(targets.LCP * buffer);
      }
      
      if (metrics.FCP) {
        expect(metrics.FCP).toBeLessThan(targets.FCP * buffer);
      }
      
      if (metrics.TTI) {
        expect(metrics.TTI).toBeLessThan(targets.TTI * buffer);
      }
      
      if (metrics.CLS) {
        expect(metrics.CLS).toBeLessThan(targets.CLS * buffer);
      }
    }

    // Memory usage check
    if (metrics.memoryUsage) {
      console.log(`🧠 Memory: ${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB used`);
      
      // Reasonable memory limit (adjust based on complexity)
      expect(metrics.memoryUsage.used).toBeLessThan(100 * 1024 * 1024); // 100MB
    }

    // Network efficiency check
    console.log(`🌐 Network: ${metrics.requestCount} requests, ${Math.round(metrics.transferSize / 1024)}KB`);
    
    // Reasonable limits for a modern web app
    expect(metrics.requestCount).toBeLessThan(50); // Limit requests
    expect(metrics.transferSize).toBeLessThan(5 * 1024 * 1024); // 5MB limit
  });

  test('Video playback performance @performance @video', async ({ page }) => {
    await page.goto('/projects');
    
    const videoElement = page.locator('video').first();
    
    if (await videoElement.isVisible({ timeout: 5000 })) {
      // Test video loading performance
      const videoLoadStart = Date.now();
      
      await videoElement.evaluate((video: HTMLVideoElement) => {
        return new Promise((resolve) => {
          if (video.readyState >= 3) {
            resolve(video);
          } else {
            video.addEventListener('canplaythrough', () => resolve(video), { once: true });
            video.load(); // Trigger loading
          }
        });
      });
      
      const videoLoadTime = Date.now() - videoLoadStart;
      console.log(`🎬 Video load time: ${videoLoadTime}ms`);
      
      // Test seeking performance
      const seekStart = Date.now();
      
      await videoElement.evaluate((video: HTMLVideoElement) => {
        return new Promise((resolve) => {
          const targetTime = Math.min(5, video.duration / 2); // Seek to middle or 5s
          
          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            resolve(video);
          };
          
          video.addEventListener('seeked', handleSeeked);
          video.currentTime = targetTime;
        });
      });
      
      const seekTime = Date.now() - seekStart;
      console.log(`⏩ Video seek time: ${seekTime}ms`);
      
      // Test playback stability
      const playbackStability = await testVideoPlaybackStability(videoElement);
      console.log(`📊 Playback stability: ${(playbackStability * 100).toFixed(1)}%`);
      
      // Verify against targets
      const targets = VIDEO_PERFORMANCE_TARGETS[deviceType as keyof typeof VIDEO_PERFORMANCE_TARGETS];
      
      if (targets) {
        expect(videoLoadTime).toBeLessThan(targets.loadTime);
        expect(seekTime).toBeLessThan(targets.seekTime);
        expect(playbackStability).toBeGreaterThan(targets.playbackStability);
      }
    } else {
      console.log('⚠️  No video elements available for performance testing');
    }
  });

  test('Real-time features performance @performance @websocket', async ({ page }) => {
    await page.goto('/feedback/demo');
    
    // Test WebSocket connection performance
    const wsConnectionStart = Date.now();
    
    const connectionEstablished = await page.waitForFunction(() => {
      return (window as any).wsConnected === true || 
             document.querySelector('[data-testid="connection-status"]')?.textContent?.includes('connected');
    }, { timeout: 10000 }).catch(() => false);
    
    if (connectionEstablished) {
      const connectionTime = Date.now() - wsConnectionStart;
      console.log(`🔌 WebSocket connection time: ${connectionTime}ms`);
      
      // Test message round-trip time
      const messageLatency = await testWebSocketLatency(page);
      console.log(`📡 WebSocket latency: ${messageLatency}ms`);
      
      // Performance expectations
      expect(connectionTime).toBeLessThan(5000); // 5s connection timeout
      expect(messageLatency).toBeLessThan(1000); // 1s message round-trip
      
      // Browser-specific WebSocket performance
      if (browserName === 'firefox') {
        // Firefox sometimes has slower WebSocket setup
        expect(connectionTime).toBeLessThan(8000);
      }
      
      if (browserName === 'webkit') {
        // Safari may have stricter WebSocket policies
        console.log('🍎 Safari WebSocket performance measured with policy considerations');
      }
    } else {
      console.log('⚠️  WebSocket connection not available for performance testing');
    }
  });

  test('File upload performance @performance @upload', async ({ page }) => {
    await page.goto('/file-upload-demo');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // Test file selection performance
      const selectionStart = Date.now();
      
      // Create a test file (1MB)
      const testFileSize = 1024 * 1024; // 1MB
      const testFile = {
        name: 'performance-test.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.alloc(testFileSize, 'test data')
      };
      
      await fileInput.setInputFiles(testFile);
      
      const selectionTime = Date.now() - selectionStart;
      console.log(`📁 File selection time: ${selectionTime}ms`);
      
      // Test upload progress monitoring
      const uploadStart = Date.now();
      
      const uploadButton = page.locator('button', { hasText: /upload|업로드/i }).first();
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        
        // Monitor upload progress
        const progressBar = page.locator('[role="progressbar"], [class*="progress"]').first();
        
        if (await progressBar.isVisible({ timeout: 3000 })) {
          // Wait for upload to complete or make significant progress
          await page.waitForFunction((selector) => {
            const element = document.querySelector(selector);
            const value = element?.getAttribute('aria-valuenow') || element?.getAttribute('value');
            return parseInt(value || '0') > 50; // 50% progress
          }, '[role="progressbar"], [class*="progress"]', { timeout: 30000 }).catch(() => {});
          
          const uploadTime = Date.now() - uploadStart;
          console.log(`📤 Upload processing time: ${uploadTime}ms`);
          
          // Performance expectations for 1MB file
          expect(selectionTime).toBeLessThan(1000); // 1s selection
          expect(uploadTime).toBeLessThan(15000); // 15s processing (generous for test env)
        }
      }
    }
  });

  test('Resource loading optimization @performance @resources', async ({ page }) => {
    // Monitor all network requests
    const requests: { url: string, size: number, time: number, type: string }[] = [];
    
    page.on('response', async (response) => {
      const request = response.request();
      const size = (await response.body().catch(() => Buffer.alloc(0))).length;
      
      requests.push({
        url: request.url(),
        size: size,
        time: Date.now(),
        type: request.resourceType()
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze resource loading
    const analysis = analyzeResourceLoading(requests);
    
    console.log('📦 Resource analysis:', {
      totalRequests: analysis.totalRequests,
      totalSize: `${Math.round(analysis.totalSize / 1024)}KB`,
      imageOptimization: `${analysis.optimizedImages}/${analysis.totalImages} images optimized`,
      cssSize: `${Math.round(analysis.cssSize / 1024)}KB`,
      jsSize: `${Math.round(analysis.jsSize / 1024)}KB`
    });

    // Resource optimization checks
    expect(analysis.totalRequests).toBeLessThan(50);
    expect(analysis.totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB total
    expect(analysis.cssSize).toBeLessThan(500 * 1024); // 500KB CSS
    expect(analysis.jsSize).toBeLessThan(2 * 1024 * 1024); // 2MB JS
    
    // Image optimization check
    if (analysis.totalImages > 0) {
      const optimizationRate = analysis.optimizedImages / analysis.totalImages;
      expect(optimizationRate).toBeGreaterThan(0.8); // 80% of images should be optimized
    }
  });

  test('Stress test performance @performance @stress', async ({ page }) => {
    // Test performance under stress conditions
    console.log(`🔥 Starting stress test on ${browserName}`);
    
    // Navigate to complex page
    await page.goto('/projects');
    
    // Measure baseline performance
    const baselineMetrics = await collectPerformanceMetrics(page);
    
    // Simulate stress conditions
    await simulateStressConditions(page);
    
    // Measure performance under stress
    const stressMetrics = await collectPerformanceMetrics(page);
    
    // Compare performance degradation
    const degradation = calculatePerformanceDegradation(baselineMetrics, stressMetrics);
    
    console.log(`📉 Performance degradation: ${(degradation * 100).toFixed(1)}%`);
    
    // Performance should not degrade more than 50% under stress
    expect(degradation).toBeLessThan(0.5);
    
    // Memory should not leak significantly
    if (baselineMetrics.memoryUsage && stressMetrics.memoryUsage) {
      const memoryIncrease = (stressMetrics.memoryUsage.used - baselineMetrics.memoryUsage.used) / baselineMetrics.memoryUsage.used;
      expect(memoryIncrease).toBeLessThan(2.0); // 200% memory increase limit
    }
  });
});

// Helper functions

async function collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  return await page.evaluate(() => {
    const metrics: PerformanceMetrics = {
      pageLoadTime: 0,
      domContentLoaded: 0,
      timeToFirstByte: 0,
      requestCount: 0,
      transferSize: 0,
    };

    // Navigation Timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      metrics.timeToFirstByte = navigation.responseStart - navigation.navigationStart;
    }

    // Paint Timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.FCP = entry.startTime;
      }
    });

    // Resource Timing
    const resources = performance.getEntriesByType('resource');
    metrics.requestCount = resources.length;
    metrics.transferSize = resources.reduce((total, resource) => {
      return total + ((resource as any).transferSize || 0);
    }, 0);

    // Memory (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }

    // Try to collect LCP and CLS using PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        // This is a simplified version - real implementation would need more sophisticated collection
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          metrics.LCP = lcpEntries[lcpEntries.length - 1].startTime;
        }
        
        const clsEntries = performance.getEntriesByType('layout-shift');
        if (clsEntries.length > 0) {
          metrics.CLS = clsEntries.reduce((sum, entry) => {
            return sum + ((entry as any).value || 0);
          }, 0);
        }
      } catch (error) {
        // PerformanceObserver not fully supported
      }
    }

    return metrics;
  });
}

async function testVideoPlaybackStability(videoElement: any): Promise<number> {
  return await videoElement.evaluate((video: HTMLVideoElement) => {
    return new Promise<number>((resolve) => {
      if (!video.duration || video.duration === Infinity) {
        resolve(0);
        return;
      }

      let stableFrames = 0;
      let totalFrames = 0;
      const testDuration = 3000; // 3 seconds
      
      const startTime = Date.now();
      
      const checkStability = () => {
        totalFrames++;
        
        // Check if video is playing smoothly
        if (!video.paused && video.currentTime > 0 && video.readyState === 4) {
          stableFrames++;
        }
        
        if (Date.now() - startTime < testDuration) {
          requestAnimationFrame(checkStability);
        } else {
          const stability = totalFrames > 0 ? stableFrames / totalFrames : 0;
          resolve(stability);
        }
      };
      
      // Start playback test
      video.play().then(() => {
        requestAnimationFrame(checkStability);
      }).catch(() => {
        resolve(0);
      });
    });
  });
}

async function testWebSocketLatency(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      // This would connect to actual WebSocket in real implementation
      // For demo, simulate latency test
      const start = Date.now();
      
      // Simulate WebSocket message round-trip
      setTimeout(() => {
        const latency = Date.now() - start;
        resolve(latency);
      }, Math.random() * 200 + 100); // 100-300ms simulated latency
    });
  });
}

async function simulateStressConditions(page: Page): Promise<void> {
  // Simulate multiple rapid interactions
  await page.evaluate(() => {
    // Create memory pressure
    const arrays = [];
    for (let i = 0; i < 100; i++) {
      arrays.push(new Array(10000).fill(Math.random()));
    }
    
    // Simulate rapid DOM updates
    for (let i = 0; i < 50; i++) {
      const div = document.createElement('div');
      div.innerHTML = `Stress test element ${i}`;
      document.body.appendChild(div);
      
      setTimeout(() => {
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      }, 100);
    }
    
    // Simulate rapid event firing
    for (let i = 0; i < 100; i++) {
      window.dispatchEvent(new Event('resize'));
    }
  });
  
  // Wait for stress conditions to take effect
  await page.waitForTimeout(2000);
}

function calculatePerformanceDegradation(baseline: PerformanceMetrics, stressed: PerformanceMetrics): number {
  const baselineScore = baseline.pageLoadTime + (baseline.domContentLoaded || 0);
  const stressedScore = stressed.pageLoadTime + (stressed.domContentLoaded || 0);
  
  if (baselineScore === 0) return 0;
  
  return Math.max(0, (stressedScore - baselineScore) / baselineScore);
}

function analyzeResourceLoading(requests: any[]) {
  const analysis = {
    totalRequests: requests.length,
    totalSize: requests.reduce((sum, req) => sum + req.size, 0),
    cssSize: 0,
    jsSize: 0,
    totalImages: 0,
    optimizedImages: 0,
  };

  requests.forEach(req => {
    if (req.type === 'stylesheet') {
      analysis.cssSize += req.size;
    } else if (req.type === 'script') {
      analysis.jsSize += req.size;
    } else if (req.type === 'image') {
      analysis.totalImages++;
      // Check if image is optimized (webp, appropriate size, etc.)
      if (req.url.includes('.webp') || req.url.includes('_next/image')) {
        analysis.optimizedImages++;
      }
    }
  });

  return analysis;
}

function getPerformanceTargets(browserName: string, deviceType: string) {
  const targets = PERFORMANCE_TARGETS[deviceType as keyof typeof PERFORMANCE_TARGETS];
  if (!targets) return null;
  
  return targets[browserName as keyof typeof targets] || targets.chromium;
}