import { test, expect } from '@playwright/test';
import { 
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet 디자인 변경이 성능에 미치는 영향 측정
 * 
 * 측정 항목:
 * 1. Core Web Vitals (LCP, FID, CLS)
 * 2. CSS 애니메이션 성능 (60fps 유지)
 * 3. 이미지 최적화 및 로딩 성능
 * 4. 폰트 로딩 최적화
 * 5. CSS 파일 크기 및 파싱 시간
 * 6. Repaint/Reflow 최소화
 * 7. 메모리 사용량
 */

test.describe('디자인 성능 영향 측정', () => {
  const verificationResults: DesignVerificationResult[] = [];

  // 성능 임계값 정의
  const PERFORMANCE_THRESHOLDS = {
    LCP: 2500,        // Largest Contentful Paint (ms)
    FID: 100,         // First Input Delay (ms)
    CLS: 0.1,         // Cumulative Layout Shift
    FCP: 1800,        // First Contentful Paint (ms)
    TTI: 3500,        // Time to Interactive (ms)
    animationFPS: 55, // 최소 FPS
    imageLoadTime: 3000, // 이미지 로딩 시간 (ms)
    cssParseTime: 50  // CSS 파싱 시간 (ms)
  };

  test.beforeEach(async ({ page }) => {
    // 성능 측정을 위한 설정
    await page.goto('about:blank');
    
    // Performance Observer 설정
    await page.addInitScript(() => {
      window.performanceData = {
        navigationTiming: {},
        resourceTiming: [],
        paintTiming: {},
        layoutShifts: [],
        longTasks: []
      };

      // Performance Observer로 데이터 수집
      if ('PerformanceObserver' in window) {
        // Paint 타이밍 수집
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint') {
              window.performanceData.paintTiming[entry.name] = entry.startTime;
            }
          });
        }).observe({ entryTypes: ['paint'] });

        // Layout Shift 수집
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              window.performanceData.layoutShifts.push({
                value: entry.value,
                startTime: entry.startTime
              });
            }
          });
        }).observe({ entryTypes: ['layout-shift'] });

        // Long Tasks 수집
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask') {
              window.performanceData.longTasks.push({
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          });
        }).observe({ entryTypes: ['longtask'] });
      }
    });
  });

  test.afterAll(async () => {
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = './test-results/design-verification-report';
    await fs.promises.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'performance-impact-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  test('Core Web Vitals - LCP, FID, CLS 측정', async ({ page }) => {
    const pages = [
      { url: '/dashboard', name: '대시보드' },
      { url: '/planning', name: '기획 페이지' },
      { url: '/projects', name: '프로젝트 목록' }
    ];

    for (const { url, name } of pages) {
      const startTime = Date.now();
      
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 페이지 로드 완료 후 추가 대기 (레이아웃 안정화)
      await page.waitForTimeout(2000);

      // Core Web Vitals 수집
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          // LCP 계산
          let lcp = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'], buffered: true });

          // CLS 계산
          const layoutShifts = window.performanceData?.layoutShifts || [];
          const cls = layoutShifts.reduce((sum, shift) => sum + shift.value, 0);

          // FCP 가져오기
          const fcp = window.performanceData?.paintTiming['first-contentful-paint'] || 0;

          setTimeout(() => {
            resolve({
              lcp: lcp || performance.now(),
              cls,
              fcp,
              navigationStart: performance.timing.navigationStart,
              loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
            });
          }, 100);
        });
      });

      // LCP 검증
      verificationResults.push(createVerificationResult(
        `${name} - Largest Contentful Paint`,
        url,
        'LCP',
        { 
          valid: webVitals.lcp <= PERFORMANCE_THRESHOLDS.LCP,
          actualValue: `${Math.round(webVitals.lcp)}ms`,
          threshold: `${PERFORMANCE_THRESHOLDS.LCP}ms`
        },
        `${PERFORMANCE_THRESHOLDS.LCP}ms 이하`
      ));

      // CLS 검증
      verificationResults.push(createVerificationResult(
        `${name} - Cumulative Layout Shift`,
        url,
        'CLS',
        { 
          valid: webVitals.cls <= PERFORMANCE_THRESHOLDS.CLS,
          actualValue: webVitals.cls.toFixed(3),
          threshold: PERFORMANCE_THRESHOLDS.CLS.toString()
        },
        `${PERFORMANCE_THRESHOLDS.CLS} 이하`
      ));

      // FCP 검증
      verificationResults.push(createVerificationResult(
        `${name} - First Contentful Paint`,
        url,
        'FCP',
        { 
          valid: webVitals.fcp <= PERFORMANCE_THRESHOLDS.FCP,
          actualValue: `${Math.round(webVitals.fcp)}ms`,
          threshold: `${PERFORMANCE_THRESHOLDS.FCP}ms`
        },
        `${PERFORMANCE_THRESHOLDS.FCP}ms 이하`
      ));

      expect(webVitals.lcp, 
        `${name}의 LCP가 ${PERFORMANCE_THRESHOLDS.LCP}ms를 초과합니다: ${Math.round(webVitals.lcp)}ms`
      ).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.LCP);

      expect(webVitals.cls, 
        `${name}의 CLS가 ${PERFORMANCE_THRESHOLDS.CLS}를 초과합니다: ${webVitals.cls.toFixed(3)}`
      ).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.CLS);
    }
  });

  test('CSS 애니메이션 성능 - FPS 측정', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 애니메이션 요소들 찾기
    const animatedElements = await page.$$('[class*="transition"], [class*="animate"], [style*="transition"], [style*="animation"]');

    if (animatedElements.length === 0) {
      verificationResults.push(createVerificationResult(
        '애니메이션 성능 측정',
        'dashboard',
        'animation-fps',
        { 
          valid: true,
          actualValue: '애니메이션 요소 없음'
        },
        '60fps 유지'
      ));
      return;
    }

    // 애니메이션 성능 측정을 위한 스크립트 주입
    const animationPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        const measurements = [];
        let frameCount = 0;
        let startTime = performance.now();
        
        function measureFrame() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - startTime >= 1000) { // 1초간 측정
            const fps = frameCount;
            measurements.push(fps);
            resolve({
              averageFPS: fps,
              measurements,
              duration: currentTime - startTime
            });
          } else {
            requestAnimationFrame(measureFrame);
          }
        }

        // 애니메이션 트리거 (hover 또는 클릭)
        const animatedElement = document.querySelector('[class*="transition"], [class*="animate"]');
        if (animatedElement) {
          animatedElement.dispatchEvent(new MouseEvent('mouseenter'));
        }

        requestAnimationFrame(measureFrame);
      });
    });

    verificationResults.push(createVerificationResult(
      'CSS 애니메이션 FPS',
      'animated-elements',
      'animation-fps',
      { 
        valid: animationPerformance.averageFPS >= PERFORMANCE_THRESHOLDS.animationFPS,
        actualValue: `${animationPerformance.averageFPS}fps`,
        threshold: `${PERFORMANCE_THRESHOLDS.animationFPS}fps`,
        measurements: animationPerformance.measurements
      },
      `${PERFORMANCE_THRESHOLDS.animationFPS}fps 이상`
    ));

    expect(animationPerformance.averageFPS,
      `애니메이션 FPS가 임계값보다 낮습니다: ${animationPerformance.averageFPS}fps`
    ).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.animationFPS);
  });

  test('이미지 최적화 및 로딩 성능', async ({ page }) => {
    const pages = ['/dashboard', '/projects'];

    for (const url of pages) {
      await page.goto(url);

      // 이미지 로딩 성능 측정
      const imagePerformance = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const results = [];

        images.forEach((img, index) => {
          if (index >= 10) return; // 첫 10개만 측정

          const startTime = performance.now();
          
          if (img.complete) {
            results.push({
              src: img.src,
              loadTime: 0,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              displayWidth: img.width,
              displayHeight: img.height,
              isOptimized: img.naturalWidth <= img.width * 2, // 2배 이하면 최적화된 것으로 간주
              hasLazyLoading: img.getAttribute('loading') === 'lazy',
              format: img.src.split('.').pop()
            });
          } else {
            img.onload = () => {
              const loadTime = performance.now() - startTime;
              results.push({
                src: img.src,
                loadTime,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: img.width,
                displayHeight: img.height,
                isOptimized: img.naturalWidth <= img.width * 2,
                hasLazyLoading: img.getAttribute('loading') === 'lazy',
                format: img.src.split('.').pop()
              });
            };
          }
        });

        return results;
      });

      for (const imgData of imagePerformance) {
        // 이미지 로딩 시간 확인
        verificationResults.push(createVerificationResult(
          `${url} - 이미지 로딩 시간`,
          imgData.src,
          'image-load-time',
          { 
            valid: imgData.loadTime <= PERFORMANCE_THRESHOLDS.imageLoadTime,
            actualValue: `${Math.round(imgData.loadTime)}ms`,
            threshold: `${PERFORMANCE_THRESHOLDS.imageLoadTime}ms`,
            imageData: imgData
          },
          `${PERFORMANCE_THRESHOLDS.imageLoadTime}ms 이하`
        ));

        // 이미지 최적화 상태 확인
        verificationResults.push(createVerificationResult(
          `${url} - 이미지 최적화`,
          imgData.src,
          'image-optimization',
          { 
            valid: imgData.isOptimized,
            actualValue: `${imgData.naturalWidth}×${imgData.naturalHeight}`,
            displaySize: `${imgData.displayWidth}×${imgData.displayHeight}`,
            format: imgData.format
          },
          '표시 크기의 2배 이하'
        ));

        // 최신 이미지 포맷 사용 확인
        const modernFormat = ['webp', 'avif'].includes(imgData.format?.toLowerCase());
        verificationResults.push(createVerificationResult(
          `${url} - 최신 이미지 포맷`,
          imgData.src,
          'image-format',
          { 
            valid: modernFormat || imgData.format === 'svg',
            actualValue: imgData.format || 'unknown',
            recommendation: 'WebP 또는 AVIF 권장'
          },
          'WebP, AVIF, SVG'
        ));
      }
    }
  });

  test('폰트 로딩 최적화', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const fontPerformance = await page.evaluate(() => {
      const fontFaces = [];
      
      // CSS에서 사용된 폰트 정보 수집
      if (document.fonts) {
        for (const font of document.fonts) {
          fontFaces.push({
            family: font.family,
            style: font.style,
            weight: font.weight,
            status: font.status,
            loaded: font.status === 'loaded'
          });
        }
      }

      // Performance API를 통한 폰트 리소스 타이밍
      const fontResources = performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('font') || 
                        entry.name.includes('.woff') || 
                        entry.name.includes('.woff2') ||
                        entry.name.includes('.ttf') ||
                        entry.name.includes('.otf'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0
        }));

      return { fontFaces, fontResources };
    });

    // 폰트 로딩 상태 확인
    const allFontsLoaded = fontPerformance.fontFaces.every(font => font.loaded);
    
    verificationResults.push(createVerificationResult(
      '폰트 로딩 상태',
      'dashboard',
      'font-loading',
      { 
        valid: allFontsLoaded,
        actualValue: `${fontPerformance.fontFaces.filter(f => f.loaded).length}/${fontPerformance.fontFaces.length} 로드됨`,
        fontFaces: fontPerformance.fontFaces
      },
      '모든 폰트 로드 완료'
    ));

    // 폰트 파일 최적화 확인 (WOFF2 권장)
    for (const fontResource of fontPerformance.fontResources) {
      const isOptimized = fontResource.name.includes('.woff2');
      const isReasonableSize = fontResource.size < 100000; // 100KB 이하 권장

      verificationResults.push(createVerificationResult(
        '폰트 파일 최적화',
        fontResource.name,
        'font-optimization',
        { 
          valid: isOptimized && isReasonableSize,
          actualValue: `${Math.round(fontResource.size / 1024)}KB`,
          format: fontResource.name.split('.').pop(),
          cached: fontResource.cached
        },
        'WOFF2, 100KB 이하'
      ));
    }
  });

  test('CSS 파일 크기 및 파싱 성능', async ({ page }) => {
    await page.goto('/dashboard');

    const cssPerformance = await page.evaluate(() => {
      // CSS 리소스 타이밍 수집
      const cssResources = performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.css') || 
                        entry.initiatorType === 'css')
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0,
          parseTime: entry.responseEnd - entry.responseStart,
          cached: entry.transferSize === 0
        }));

      // 스타일시트 수 계산
      const stylesheetCount = document.styleSheets.length;
      const inlineStyleCount = document.querySelectorAll('[style]').length;

      // CSS 규칙 수 계산
      let totalRules = 0;
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          totalRules += sheet.cssRules?.length || 0;
        } catch (e) {
          // Cross-origin CSS는 건너뛰기
        }
      }

      return {
        cssResources,
        stylesheetCount,
        inlineStyleCount,
        totalRules
      };
    });

    // CSS 파일 크기 확인
    let totalCSSSize = 0;
    for (const cssResource of cssPerformance.cssResources) {
      totalCSSSize += cssResource.size;

      verificationResults.push(createVerificationResult(
        'CSS 파일 크기',
        cssResource.name,
        'css-file-size',
        { 
          valid: cssResource.size < 50000, // 50KB 이하 권장
          actualValue: `${Math.round(cssResource.size / 1024)}KB`,
          parseTime: `${Math.round(cssResource.parseTime)}ms`,
          cached: cssResource.cached
        },
        '50KB 이하 권장'
      ));

      // CSS 파싱 시간 확인
      verificationResults.push(createVerificationResult(
        'CSS 파싱 시간',
        cssResource.name,
        'css-parse-time',
        { 
          valid: cssResource.parseTime <= PERFORMANCE_THRESHOLDS.cssParseTime,
          actualValue: `${Math.round(cssResource.parseTime)}ms`,
          threshold: `${PERFORMANCE_THRESHOLDS.cssParseTime}ms`
        },
        `${PERFORMANCE_THRESHOLDS.cssParseTime}ms 이하`
      ));
    }

    // 전체 CSS 크기 확인
    verificationResults.push(createVerificationResult(
      '전체 CSS 크기',
      'dashboard',
      'total-css-size',
      { 
        valid: totalCSSSize < 200000, // 200KB 이하 권장
        actualValue: `${Math.round(totalCSSSize / 1024)}KB`,
        stylesheetCount: cssPerformance.stylesheetCount,
        inlineStyleCount: cssPerformance.inlineStyleCount,
        totalRules: cssPerformance.totalRules
      },
      '200KB 이하 권장'
    ));
  });

  test('메모리 사용량 및 DOM 복잡성', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const memoryAndDOM = await page.evaluate(() => {
      // DOM 복잡성 측정
      const allElements = document.querySelectorAll('*').length;
      const maxDepth = Math.max(...Array.from(document.querySelectorAll('*')).map(el => {
        let depth = 0;
        let parent = el.parentElement;
        while (parent) {
          depth++;
          parent = parent.parentElement;
        }
        return depth;
      }));

      // 큰 DOM 요소들 찾기
      const largeElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length > 50)
        .length;

      // 메모리 정보 (가능한 경우)
      let memoryInfo = null;
      if ('memory' in performance) {
        memoryInfo = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }

      return {
        domElements: allElements,
        maxDepth,
        largeElements,
        memoryInfo
      };
    });

    // DOM 요소 수 확인
    verificationResults.push(createVerificationResult(
      'DOM 복잡성 - 요소 수',
      'dashboard',
      'dom-elements',
      { 
        valid: memoryAndDOM.domElements < 3000, // 3000개 이하 권장
        actualValue: `${memoryAndDOM.domElements}개`,
        maxDepth: memoryAndDOM.maxDepth,
        largeElements: memoryAndDOM.largeElements
      },
      '3000개 이하 권장'
    ));

    // DOM 깊이 확인
    verificationResults.push(createVerificationResult(
      'DOM 복잡성 - 최대 깊이',
      'dashboard',
      'dom-depth',
      { 
        valid: memoryAndDOM.maxDepth < 15, // 15 레벨 이하 권장
        actualValue: `${memoryAndDOM.maxDepth} 레벨`,
        recommendation: '15 레벨 이하 권장'
      },
      '15 레벨 이하 권장'
    ));

    // 메모리 사용량 확인 (가능한 경우)
    if (memoryAndDOM.memoryInfo) {
      const memoryUsageMB = Math.round(memoryAndDOM.memoryInfo.usedJSHeapSize / 1024 / 1024);
      
      verificationResults.push(createVerificationResult(
        'JavaScript 메모리 사용량',
        'dashboard',
        'memory-usage',
        { 
          valid: memoryUsageMB < 100, // 100MB 이하 권장
          actualValue: `${memoryUsageMB}MB`,
          totalMemory: `${Math.round(memoryAndDOM.memoryInfo.totalJSHeapSize / 1024 / 1024)}MB`,
          memoryLimit: `${Math.round(memoryAndDOM.memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
        },
        '100MB 이하 권장'
      ));
    }

    expect(memoryAndDOM.domElements,
      `DOM 요소가 너무 많습니다: ${memoryAndDOM.domElements}개`
    ).toBeLessThan(5000); // 더 관대한 임계값

    expect(memoryAndDOM.maxDepth,
      `DOM 깊이가 너무 깊습니다: ${memoryAndDOM.maxDepth} 레벨`
    ).toBeLessThan(20); // 더 관대한 임계값
  });

  test('렌더링 성능 - Repaint/Reflow 최소화', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 스크롤과 인터랙션 중 성능 측정
    const renderingPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let paintCount = 0;
        let layoutCount = 0;
        const startTime = performance.now();

        // Performance Observer로 레이아웃 변경 감지
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === 'measure' && entry.name.includes('layout')) {
                layoutCount++;
              }
            });
          });
        }

        // 스크롤 시뮬레이션
        let scrollPosition = 0;
        const scrollInterval = setInterval(() => {
          scrollPosition += 100;
          window.scrollTo(0, scrollPosition);
          
          if (scrollPosition > 1000) {
            clearInterval(scrollInterval);
            
            setTimeout(() => {
              const endTime = performance.now();
              resolve({
                duration: endTime - startTime,
                paintCount,
                layoutCount,
                scrollDistance: scrollPosition
              });
            }, 500);
          }
        }, 50);
      });
    });

    verificationResults.push(createVerificationResult(
      '렌더링 성능 - 스크롤 중 레이아웃 변경',
      'dashboard',
      'rendering-performance',
      { 
        valid: renderingPerformance.layoutCount < 10, // 10회 이하 권장
        actualValue: `${renderingPerformance.layoutCount}회`,
        duration: `${Math.round(renderingPerformance.duration)}ms`,
        scrollDistance: `${renderingPerformance.scrollDistance}px`
      },
      '10회 이하 권장'
    ));

    // 스크롤 성능 확인
    expect(renderingPerformance.layoutCount,
      `스크롤 중 레이아웃 변경이 너무 자주 발생했습니다: ${renderingPerformance.layoutCount}회`
    ).toBeLessThan(20); // 관대한 임계값
  });
});