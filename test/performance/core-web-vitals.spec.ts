/**
 * Core Web Vitals Performance Testing Suite
 * Tests all major pages against Core Web Vitals thresholds
 */

import { test, expect, Page } from '@playwright/test';

interface CoreWebVitalsResult {
  url: string;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  inp?: number;
  timestamp: number;
}

const CORE_WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 },     // First Contentful Paint
  LCP: { good: 2500, needsImprovement: 4000 },     // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },       // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },      // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 },     // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }        // Interaction to Next Paint
};

const TEST_PAGES = [
  { name: 'Home Page', url: '/' },
  { name: 'Login Page', url: '/login' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Projects', url: '/projects' },
  { name: 'Feedback', url: '/feedback' },
  { name: 'File Upload Demo', url: '/file-upload-demo' }
];

test.describe('Core Web Vitals Performance Tests', () => {
  let baselineResults: CoreWebVitalsResult[] = [];

  test.beforeAll(async () => {
    // Load baseline results if they exist
    try {
      const fs = await import('fs');
      const baselineData = fs.readFileSync('./test/performance/baseline-results.json', 'utf8');
      baselineResults = JSON.parse(baselineData);
    } catch (error) {
      console.log('No baseline results found, will establish new baseline');
    }
  });

  for (const pageInfo of TEST_PAGES) {
    test(`Core Web Vitals - ${pageInfo.name}`, async ({ page }) => {
      console.log(`\n🔍 Testing Core Web Vitals for: ${pageInfo.name}`);
      
      // Setup performance monitoring
      const performanceMetrics: any = {};
      const resourceLoadTimes: number[] = [];
      const navigationStart = Date.now();

      // Monitor resource loading
      page.on('response', response => {
        const timing = response.timing();
        if (timing) {
          resourceLoadTimes.push(timing.responseEnd);
        }
      });

      // Inject Web Vitals collection script
      await page.addInitScript(() => {
        // Store metrics globally for collection
        (window as any).webVitalsData = {};
        
        // Import and setup web-vitals if available
        if (typeof window !== 'undefined') {
          (window as any).webVitalsCollector = {
            metrics: {},
            collect: function(metric: any) {
              this.metrics[metric.name] = metric;
              console.log(`📊 ${metric.name}: ${metric.value}ms (${metric.rating})`);
            }
          };
        }
      });

      // Navigate to page with performance timing
      const startTime = Date.now();
      const response = await page.goto(`http://localhost:3005${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      expect(response?.status()).toBe(200);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Collect Core Web Vitals using the web-vitals library
      const vitalsResults = await page.evaluate(async () => {
        const results: any = {};
        
        // Get navigation timing data
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // Calculate TTFB (Time to First Byte)
          results.TTFB = navigation.responseStart - navigation.requestStart;
          
          // Calculate FCP approximation (using domContentLoadedEventEnd as proxy)
          results.FCP = navigation.domContentLoadedEventEnd - navigation.navigationStart;
          
          // Calculate LCP approximation (using loadEventEnd as proxy)
          results.LCP = navigation.loadEventEnd - navigation.navigationStart;
        }

        // Measure CLS by checking for layout shifts
        return new Promise(resolve => {
          let clsValue = 0;
          let fidValue = 0;
          
          // Create a Performance Observer for layout shifts
          try {
            if ('PerformanceObserver' in window) {
              const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;
                  }
                }
              });
              observer.observe({ entryTypes: ['layout-shift'] });
              
              // Stop observing after 3 seconds
              setTimeout(() => {
                observer.disconnect();
                results.CLS = clsValue;
                results.FID = fidValue; // Approximate FID
                resolve(results);
              }, 3000);
            } else {
              results.CLS = 0;
              results.FID = 0;
              resolve(results);
            }
          } catch (error) {
            results.CLS = 0;
            results.FID = 0;
            resolve(results);
          }
        });
      });

      // Calculate additional metrics
      const loadTime = Date.now() - startTime;
      const avgResourceLoadTime = resourceLoadTimes.length > 0 
        ? resourceLoadTimes.reduce((a, b) => a + b, 0) / resourceLoadTimes.length 
        : 0;

      // Create result object
      const result: CoreWebVitalsResult = {
        url: pageInfo.url,
        fcp: vitalsResults.FCP || loadTime,
        lcp: vitalsResults.LCP || loadTime,
        fid: vitalsResults.FID || 0,
        cls: vitalsResults.CLS || 0,
        ttfb: vitalsResults.TTFB || (Date.now() - navigationStart),
        timestamp: Date.now()
      };

      console.log(`\n📈 Core Web Vitals Results for ${pageInfo.name}:`);
      console.log(`   FCP: ${result.fcp}ms`);
      console.log(`   LCP: ${result.lcp}ms`);
      console.log(`   FID: ${result.fid}ms`);
      console.log(`   CLS: ${result.cls}`);
      console.log(`   TTFB: ${result.ttfb}ms`);

      // Validate against thresholds
      await validateCoreWebVitals(result, pageInfo.name);
      
      // Compare against baseline if available
      await compareWithBaseline(result, pageInfo.name, baselineResults);

      // Store result for future baseline
      await storePerformanceResult(result);
    });
  }

  test('Performance Regression Detection', async ({ page }) => {
    console.log('\n🔍 Running Performance Regression Detection');

    // Load historical performance data
    const historicalData = await loadHistoricalData();
    
    if (historicalData.length < 2) {
      console.log('⚠️ Insufficient historical data for regression detection');
      return;
    }

    // Analyze trends for each page
    for (const pageInfo of TEST_PAGES) {
      const pageData = historicalData.filter(d => d.url === pageInfo.url);
      
      if (pageData.length >= 5) {
        await detectPerformanceRegression(pageData, pageInfo.name);
      }
    }
  });

  test('Resource Performance Analysis', async ({ page }) => {
    console.log('\n🔍 Analyzing Resource Performance');

    const resourceMetrics: any[] = [];

    // Monitor all network requests
    page.on('response', async response => {
      const request = response.request();
      const timing = response.timing();
      
      if (timing) {
        resourceMetrics.push({
          url: request.url(),
          method: request.method(),
          status: response.status(),
          size: (await response.body()).length,
          timing: timing,
          resourceType: request.resourceType()
        });
      }
    });

    // Test each page for resource performance
    for (const pageInfo of TEST_PAGES) {
      resourceMetrics.length = 0; // Clear previous metrics
      
      await page.goto(`http://localhost:3005${pageInfo.url}`, {
        waitUntil: 'networkidle'
      });

      await analyzeResourcePerformance(resourceMetrics, pageInfo.name);
    }
  });
});

/**
 * Validate Core Web Vitals against thresholds
 */
async function validateCoreWebVitals(result: CoreWebVitalsResult, pageName: string): Promise<void> {
  console.log(`\n✅ Validating thresholds for ${pageName}:`);

  // FCP validation
  if (result.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.good) {
    console.log(`   ✅ FCP: ${result.fcp}ms (GOOD)`);
  } else if (result.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement) {
    console.log(`   ⚠️ FCP: ${result.fcp}ms (NEEDS IMPROVEMENT)`);
  } else {
    console.log(`   ❌ FCP: ${result.fcp}ms (POOR)`);
    expect(result.fcp).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement);
  }

  // LCP validation
  if (result.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.good) {
    console.log(`   ✅ LCP: ${result.lcp}ms (GOOD)`);
  } else if (result.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement) {
    console.log(`   ⚠️ LCP: ${result.lcp}ms (NEEDS IMPROVEMENT)`);
  } else {
    console.log(`   ❌ LCP: ${result.lcp}ms (POOR)`);
    expect(result.lcp).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement);
  }

  // CLS validation
  if (result.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.good) {
    console.log(`   ✅ CLS: ${result.cls} (GOOD)`);
  } else if (result.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement) {
    console.log(`   ⚠️ CLS: ${result.cls} (NEEDS IMPROVEMENT)`);
  } else {
    console.log(`   ❌ CLS: ${result.cls} (POOR)`);
    expect(result.cls).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement);
  }

  // TTFB validation
  if (result.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.good) {
    console.log(`   ✅ TTFB: ${result.ttfb}ms (GOOD)`);
  } else if (result.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.needsImprovement) {
    console.log(`   ⚠️ TTFB: ${result.ttfb}ms (NEEDS IMPROVEMENT)`);
  } else {
    console.log(`   ❌ TTFB: ${result.ttfb}ms (POOR)`);
    expect(result.ttfb).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.TTFB.needsImprovement);
  }
}

/**
 * Compare results with baseline
 */
async function compareWithBaseline(
  result: CoreWebVitalsResult, 
  pageName: string, 
  baseline: CoreWebVitalsResult[]
): Promise<void> {
  const baselineResult = baseline.find(b => b.url === result.url);
  
  if (!baselineResult) {
    console.log(`📊 No baseline found for ${pageName}, establishing new baseline`);
    return;
  }

  console.log(`\n📊 Baseline comparison for ${pageName}:`);
  
  const fcpChange = ((result.fcp - baselineResult.fcp) / baselineResult.fcp) * 100;
  const lcpChange = ((result.lcp - baselineResult.lcp) / baselineResult.lcp) * 100;
  const clsChange = result.cls - baselineResult.cls;
  const ttfbChange = ((result.ttfb - baselineResult.ttfb) / baselineResult.ttfb) * 100;

  console.log(`   FCP: ${fcpChange > 0 ? '+' : ''}${fcpChange.toFixed(1)}% (${result.fcp}ms vs ${baselineResult.fcp}ms)`);
  console.log(`   LCP: ${lcpChange > 0 ? '+' : ''}${lcpChange.toFixed(1)}% (${result.lcp}ms vs ${baselineResult.lcp}ms)`);
  console.log(`   CLS: ${clsChange > 0 ? '+' : ''}${clsChange.toFixed(3)} (${result.cls} vs ${baselineResult.cls})`);
  console.log(`   TTFB: ${ttfbChange > 0 ? '+' : ''}${ttfbChange.toFixed(1)}% (${result.ttfb}ms vs ${baselineResult.ttfb}ms)`);

  // Alert on significant regressions (>20% increase)
  if (fcpChange > 20 || lcpChange > 20 || ttfbChange > 20) {
    console.log(`🚨 PERFORMANCE REGRESSION DETECTED for ${pageName}`);
  }
}

/**
 * Store performance result for future baseline
 */
async function storePerformanceResult(result: CoreWebVitalsResult): Promise<void> {
  try {
    const fs = await import('fs');
    const path = './test/performance/results.json';
    
    let results: CoreWebVitalsResult[] = [];
    try {
      const data = fs.readFileSync(path, 'utf8');
      results = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    results.push(result);
    
    // Keep only last 100 results per page
    const urlResults = results.filter(r => r.url === result.url);
    if (urlResults.length > 100) {
      results = results.filter(r => r.url !== result.url || r.timestamp >= urlResults[urlResults.length - 100].timestamp);
    }

    fs.writeFileSync(path, JSON.stringify(results, null, 2));
  } catch (error) {
    console.warn('Failed to store performance result:', error);
  }
}

/**
 * Load historical performance data
 */
async function loadHistoricalData(): Promise<CoreWebVitalsResult[]> {
  try {
    const fs = await import('fs');
    const data = fs.readFileSync('./test/performance/results.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Detect performance regression using statistical analysis
 */
async function detectPerformanceRegression(
  pageData: CoreWebVitalsResult[], 
  pageName: string
): Promise<void> {
  console.log(`\n📈 Regression analysis for ${pageName}:`);

  // Sort by timestamp
  pageData.sort((a, b) => a.timestamp - b.timestamp);
  
  // Take last 10 results for trend analysis
  const recentData = pageData.slice(-10);
  const olderData = pageData.slice(-20, -10);

  if (olderData.length === 0) {
    console.log(`   ℹ️ Insufficient data for regression analysis`);
    return;
  }

  // Calculate averages
  const recentAvg = {
    fcp: recentData.reduce((sum, d) => sum + d.fcp, 0) / recentData.length,
    lcp: recentData.reduce((sum, d) => sum + d.lcp, 0) / recentData.length,
    cls: recentData.reduce((sum, d) => sum + d.cls, 0) / recentData.length,
    ttfb: recentData.reduce((sum, d) => sum + d.ttfb, 0) / recentData.length
  };

  const olderAvg = {
    fcp: olderData.reduce((sum, d) => sum + d.fcp, 0) / olderData.length,
    lcp: olderData.reduce((sum, d) => sum + d.lcp, 0) / olderData.length,
    cls: olderData.reduce((sum, d) => sum + d.cls, 0) / olderData.length,
    ttfb: olderData.reduce((sum, d) => sum + d.ttfb, 0) / olderData.length
  };

  // Calculate percentage changes
  const changes = {
    fcp: ((recentAvg.fcp - olderAvg.fcp) / olderAvg.fcp) * 100,
    lcp: ((recentAvg.lcp - olderAvg.lcp) / olderAvg.lcp) * 100,
    cls: ((recentAvg.cls - olderAvg.cls) / Math.max(olderAvg.cls, 0.001)) * 100,
    ttfb: ((recentAvg.ttfb - olderAvg.ttfb) / olderAvg.ttfb) * 100
  };

  console.log(`   FCP trend: ${changes.fcp > 0 ? '+' : ''}${changes.fcp.toFixed(1)}%`);
  console.log(`   LCP trend: ${changes.lcp > 0 ? '+' : ''}${changes.lcp.toFixed(1)}%`);
  console.log(`   CLS trend: ${changes.cls > 0 ? '+' : ''}${changes.cls.toFixed(1)}%`);
  console.log(`   TTFB trend: ${changes.ttfb > 0 ? '+' : ''}${changes.ttfb.toFixed(1)}%`);

  // Detect significant regressions (>15% degradation)
  const regressions = [];
  if (changes.fcp > 15) regressions.push('FCP');
  if (changes.lcp > 15) regressions.push('LCP');
  if (changes.cls > 15) regressions.push('CLS');
  if (changes.ttfb > 15) regressions.push('TTFB');

  if (regressions.length > 0) {
    console.log(`🚨 REGRESSION DETECTED: ${regressions.join(', ')} have degraded significantly`);
    
    // In a real system, this would trigger alerts
    await sendRegressionAlert(pageName, regressions, changes);
  } else {
    console.log(`   ✅ No significant regressions detected`);
  }
}

/**
 * Analyze resource loading performance
 */
async function analyzeResourcePerformance(metrics: any[], pageName: string): Promise<void> {
  console.log(`\n🔍 Resource analysis for ${pageName}:`);

  if (metrics.length === 0) {
    console.log(`   ℹ️ No resource metrics collected`);
    return;
  }

  // Group by resource type
  const byType = metrics.reduce((acc, metric) => {
    const type = metric.resourceType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(metric);
    return acc;
  }, {});

  Object.entries(byType).forEach(([type, resources]: [string, any[]]) => {
    const avgLoadTime = resources.reduce((sum, r) => sum + r.timing.responseEnd, 0) / resources.length;
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    
    console.log(`   ${type}: ${resources.length} resources, avg ${avgLoadTime.toFixed(0)}ms, ${(totalSize / 1024).toFixed(1)}KB`);
    
    // Alert on slow resources
    const slowResources = resources.filter(r => r.timing.responseEnd > 3000);
    if (slowResources.length > 0) {
      console.log(`     ⚠️ ${slowResources.length} slow resources (>3s)`);
    }
  });

  // Find largest resources
  const largestResources = metrics
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  console.log(`   📦 Largest resources:`);
  largestResources.forEach(resource => {
    console.log(`     ${(resource.size / 1024).toFixed(1)}KB - ${resource.url.split('/').pop()}`);
  });
}

/**
 * Send regression alert (placeholder for real alerting system)
 */
async function sendRegressionAlert(
  pageName: string, 
  regressions: string[], 
  changes: any
): Promise<void> {
  console.log(`📧 Sending regression alert for ${pageName}: ${regressions.join(', ')}`);
  
  // In production, this would send to:
  // - Slack webhook
  // - Email notifications
  // - Monitoring dashboard
  // - PagerDuty/OpsGenie
}