import { test, expect, Page, BrowserContext } from '@playwright/test';
import { performance } from 'perf_hooks';

/**
 * VideoPlanet 성능 벤치마크 테스트
 * 
 * 성능 목표:
 * - 초기 로딩: 3초 이내
 * - 인터랙션 응답: 100ms 이내  
 * - Core Web Vitals 달성
 * - 메모리 사용량 최적화
 */

test.describe('VideoPlanet 성능 벤치마크', () => {
  let context: BrowserContext;
  let page: Page;

  const PERFORMANCE_THRESHOLDS = {
    LCP: 2500,      // Largest Contentful Paint
    FCP: 1800,      // First Contentful Paint  
    TTI: 3500,      // Time to Interactive
    CLS: 0.1,       // Cumulative Layout Shift
    FID: 100,       // First Input Delay
    TBT: 200,       // Total Blocking Time
    SI: 3400,       // Speed Index
  };

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
    
    // 성능 메트릭 수집 설정
    await page.addInitScript(() => {
      // Web Vitals 측정을 위한 초기 설정
      (window as any).performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as any).performanceMetrics = (window as any).performanceMetrics || {};
          (window as any).performanceMetrics[entry.name || entry.entryType] = entry;
        }
      });
      
      (window as any).performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('대시보드 초기 로딩 성능 측정', async () => {
    const startTime = performance.now();
    
    // 페이지 로드 시작
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // 기본 로딩 시간 확인 (3초 이내)
    expect(loadTime).toBeLessThan(3000);

    // Core Web Vitals 측정
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {
            LCP: 0,
            FCP: 0,
            CLS: 0,
          };

          entries.forEach((entry) => {
            switch (entry.entryType) {
              case 'largest-contentful-paint':
                vitals.LCP = entry.startTime;
                break;
              case 'first-contentful-paint':
                vitals.FCP = entry.startTime;
                break;
              case 'layout-shift':
                if (!(entry as any).hadRecentInput) {
                  vitals.CLS += (entry as any).value;
                }
                break;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint', 'layout-shift'] });

        // 타임아웃 설정
        setTimeout(() => resolve({ LCP: 0, FCP: 0, CLS: 0 }), 10000);
      });
    });

    // Web Vitals 기준 검증
    if (metrics.LCP > 0) {
      expect(metrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    }
    if (metrics.FCP > 0) {
      expect(metrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    }
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);

    // 리소스 로딩 분석
    const resourceTiming = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        duration: entry.duration,
        transferSize: (entry as PerformanceResourceTiming).transferSize,
        initiatorType: (entry as PerformanceResourceTiming).initiatorType,
      }));
    });

    // 큰 리소스 파일 확인
    const largeResources = resourceTiming.filter(resource => 
      resource.transferSize > 500000 // 500KB 이상
    );
    
    console.log('Large resources (>500KB):', largeResources);
    
    // 번들 크기 검증 (1.2MB 이하)
    const totalJSSize = resourceTiming
      .filter(resource => resource.initiatorType === 'script')
      .reduce((sum, resource) => sum + resource.transferSize, 0);
    
    expect(totalJSSize).toBeLessThan(1.2 * 1024 * 1024); // 1.2MB
  });

  test('대시보드 위젯 렌더링 성능', async () => {
    await page.goto('/dashboard');

    // 피드백 알림 위젯 렌더링 시간 측정
    const feedbackRenderTime = await page.evaluate(async () => {
      const startTime = performance.now();
      
      // 위젯이 완전히 렌더링될 때까지 대기
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const feedbackWidget = document.querySelector('[data-testid="feedback-notifications"]');
          if (feedbackWidget?.children.length > 0) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      return performance.now() - startTime;
    });

    expect(feedbackRenderTime).toBeLessThan(500); // 500ms 이내

    // 초대 관리 위젯 렌더링 시간 측정
    const invitationRenderTime = await page.evaluate(async () => {
      const startTime = performance.now();
      
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const invitationWidget = document.querySelector('[data-testid="invitation-management"]');
          if (invitationWidget?.children.length > 0) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      return performance.now() - startTime;
    });

    expect(invitationRenderTime).toBeLessThan(500); // 500ms 이내

    // 간트차트 렌더링 시간 측정
    const ganttRenderTime = await page.evaluate(async () => {
      const startTime = performance.now();
      
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const ganttWidget = document.querySelector('[data-testid="enhanced-gantt-section"]');
          const ganttChart = ganttWidget?.querySelector('[data-testid="gantt-chart"]');
          if (ganttChart?.children.length > 0) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      return performance.now() - startTime;
    });

    expect(ganttRenderTime).toBeLessThan(800); // 800ms 이내 (복잡한 차트)
  });

  test('사용자 인터랙션 응답 성능', async () => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 피드백 알림 클릭 응답 시간
    const notificationClickTime = await page.evaluate(async () => {
      const notification = document.querySelector('[data-testid="notification-item"]') as HTMLElement;
      if (!notification) return 0;

      const startTime = performance.now();
      notification.click();
      
      // 상태 변경 대기 (읽음 처리)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return performance.now() - startTime;
    });

    expect(notificationClickTime).toBeLessThan(100); // 100ms 이내

    // 프로젝트 선택 드롭다운 응답 시간
    const dropdownResponseTime = await page.evaluate(async () => {
      const dropdown = document.querySelector('[data-testid="project-selector"]') as HTMLElement;
      if (!dropdown) return 0;

      const startTime = performance.now();
      dropdown.click();
      
      // 드롭다운 열림 대기
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const dropdownList = document.querySelector('[data-testid="project-options"]');
          if (dropdownList) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      return performance.now() - startTime;
    });

    expect(dropdownResponseTime).toBeLessThan(150); // 150ms 이내

    // 검색 입력 응답 시간
    const searchResponseTime = await page.evaluate(async () => {
      const searchInput = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
      if (!searchInput) return 0;

      const startTime = performance.now();
      
      // 검색어 입력 시뮬레이션
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 검색 결과 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return performance.now() - startTime;
    });

    expect(searchResponseTime).toBeLessThan(50); // 50ms 이내
  });

  test('메모리 사용량 최적화 확인', async () => {
    await page.goto('/dashboard');

    // 초기 메모리 사용량 측정
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null;
    });

    if (!initialMemory) {
      console.warn('Memory API not available in this browser');
      return;
    }

    // 대량의 데이터 로드 시뮬레이션
    await page.evaluate(() => {
      // 100개의 알림 데이터 시뮬레이션
      const notifications = Array.from({ length: 100 }, (_, i) => ({
        id: `notification-${i}`,
        message: `Test notification ${i}`,
        priority: ['low', 'medium', 'high'][i % 3],
        timestamp: new Date().toISOString(),
      }));

      // 전역 상태에 데이터 추가
      (window as any).testNotifications = notifications;
    });

    // 데이터 로드 후 메모리 사용량
    const afterLoadMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });

    // 메모리 증가량 확인
    if (initialMemory && afterLoadMemory) {
      const memoryIncrease = afterLoadMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      
      // 100개 알림 데이터로 10MB 이상 증가하지 않아야 함
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100} MB`);
    }

    // 가비지 컬렉션 후 메모리 해제 확인
    await page.evaluate(() => {
      // 테스트 데이터 삭제
      delete (window as any).testNotifications;
      
      // 강제 가비지 컬렉션 (Chrome에서만 동작)
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // 일정 시간 후 메모리 확인
    await page.waitForTimeout(1000);

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      } : null;
    });

    if (initialMemory && finalMemory) {
      // 메모리가 초기 수준 ± 20% 범위 내로 돌아왔는지 확인
      const memoryDifference = Math.abs(finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize);
      const allowedDifference = initialMemory.usedJSHeapSize * 0.2; // 20%

      expect(memoryDifference).toBeLessThan(allowedDifference);
    }
  });

  test('네트워크 요청 최적화 확인', async () => {
    // 네트워크 요청 모니터링 시작
    const networkRequests: any[] = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      });
    });

    page.on('response', response => {
      const request = networkRequests.find(req => 
        req.url === response.url() && !req.responseTime
      );
      if (request) {
        request.responseTime = Date.now() - request.timestamp;
        request.status = response.status();
        request.size = response.headers()['content-length'];
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // API 요청 분석
    const apiRequests = networkRequests.filter(req => 
      req.url.includes('/api/') && req.method === 'GET'
    );

    // API 응답 시간 확인 (200ms 이내)
    apiRequests.forEach(request => {
      if (request.responseTime) {
        expect(request.responseTime).toBeLessThan(200);
      }
    });

    // 중복 요청 확인
    const uniqueUrls = new Set(apiRequests.map(req => req.url));
    const duplicateRequests = apiRequests.length - uniqueUrls.size;
    
    expect(duplicateRequests).toBeLessThan(3); // 3개 미만의 중복 요청만 허용

    console.log(`Total API requests: ${apiRequests.length}`);
    console.log(`Unique API endpoints: ${uniqueUrls.size}`);
    console.log(`Duplicate requests: ${duplicateRequests}`);
  });

  test('WebSocket 연결 성능', async () => {
    let websocketConnected = false;
    let connectionTime = 0;

    // WebSocket 연결 모니터링
    page.on('websocket', ws => {
      const startTime = Date.now();
      
      ws.on('open', () => {
        connectionTime = Date.now() - startTime;
        websocketConnected = true;
      });

      ws.on('close', () => {
        websocketConnected = false;
      });
    });

    await page.goto('/dashboard');
    
    // WebSocket 연결 대기
    await page.waitForFunction(() => websocketConnected, { timeout: 5000 });

    // 연결 시간 확인 (100ms 이내)
    expect(connectionTime).toBeLessThan(100);

    // 메시지 전송 지연 시간 측정
    const messageLatency = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const startTime = Date.now();
        
        // 테스트 메시지 전송
        const testMessage = { type: 'ping', timestamp: startTime };
        
        // WebSocket을 통한 메시지 전송 시뮬레이션
        const messageEvent = new CustomEvent('websocket:send', { detail: testMessage });
        window.dispatchEvent(messageEvent);
        
        // 응답 메시지 대기
        const handleResponse = (event: any) => {
          if (event.detail.type === 'pong') {
            const latency = Date.now() - startTime;
            window.removeEventListener('websocket:message', handleResponse);
            resolve(latency);
          }
        };

        window.addEventListener('websocket:message', handleResponse);
        
        // 타임아웃 설정
        setTimeout(() => resolve(1000), 1000);
      });
    });

    // 메시지 지연 시간 확인 (50ms 이내)
    expect(messageLatency).toBeLessThan(50);
  });
});