/**
 * Load Testing and Stress Testing Suite
 * Tests application performance under various load conditions
 */

import { test, expect, Browser, Page } from '@playwright/test';

interface LoadTestResult {
  testName: string;
  concurrentUsers: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  memoryUsage?: number;
  cpuUsage?: number;
  timestamp: number;
}

interface UserSession {
  page: Page;
  userId: string;
  sessionId: string;
  startTime: number;
  actions: string[];
  errors: string[];
}

test.describe('Load Testing and Stress Testing', () => {
  
  test('Concurrent User Load Test - 10 Users', async ({ browser }) => {
    await runConcurrentUserTest(browser, 10, 60000); // 10 users for 1 minute
  });

  test('Concurrent User Load Test - 25 Users', async ({ browser }) => {
    await runConcurrentUserTest(browser, 25, 60000); // 25 users for 1 minute
  });

  test('Concurrent User Load Test - 50 Users', async ({ browser }) => {
    await runConcurrentUserTest(browser, 50, 60000); // 50 users for 1 minute
  });

  test('File Upload Stress Test', async ({ browser }) => {
    await runFileUploadStressTest(browser, 15, 30000); // 15 concurrent uploads for 30s
  });

  test('WebSocket Connection Stress Test', async ({ browser }) => {
    await runWebSocketStressTest(browser, 20, 45000); // 20 concurrent WebSocket connections
  });

  test('Database Query Load Test', async ({ browser }) => {
    await runDatabaseQueryLoadTest(browser, 30, 60000); // 30 concurrent database operations
  });

  test('API Endpoint Stress Test', async ({ browser }) => {
    await runAPIStressTest(browser, 40, 45000); // 40 concurrent API requests
  });

  test('Memory Leak Detection Test', async ({ browser }) => {
    await runMemoryLeakDetectionTest(browser, 300000); // 5 minute memory monitoring
  });

  test('Browser Resource Limits Test', async ({ browser }) => {
    await runResourceLimitsTest(browser); // Test browser resource limits
  });

  test('Performance Under Network Latency', async ({ browser }) => {
    await runNetworkLatencyTest(browser, 200); // Simulate 200ms network latency
  });
});

/**
 * Run concurrent user load test
 */
async function runConcurrentUserTest(
  browser: Browser, 
  userCount: number, 
  duration: number
): Promise<LoadTestResult> {
  console.log(`\n🔄 Starting concurrent user test: ${userCount} users for ${duration/1000}s`);
  
  const startTime = Date.now();
  const sessions: UserSession[] = [];
  const metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [] as number[],
    errors: [] as string[]
  };

  // Create user sessions
  for (let i = 0; i < userCount; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const session: UserSession = {
      page,
      userId: `user_${i}`,
      sessionId: `session_${Date.now()}_${i}`,
      startTime: Date.now(),
      actions: [],
      errors: []
    };

    // Monitor page errors
    page.on('pageerror', error => {
      session.errors.push(error.message);
      metrics.errors.push(`${session.userId}: ${error.message}`);
    });

    // Monitor network responses
    page.on('response', response => {
      metrics.totalRequests++;
      const responseTime = Date.now() - startTime;
      metrics.responseTimes.push(responseTime);
      
      if (response.status() >= 200 && response.status() < 400) {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
        session.errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    sessions.push(session);
    
    // Start user journey for each session
    simulateUserJourney(session).catch(error => {
      console.error(`Error in user journey for ${session.userId}:`, error);
      session.errors.push(error.message);
    });
  }

  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, duration));

  // Calculate results
  const endTime = Date.now();
  const actualDuration = endTime - startTime;
  
  const result: LoadTestResult = {
    testName: `Concurrent Users (${userCount})`,
    concurrentUsers: userCount,
    duration: actualDuration,
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    averageResponseTime: metrics.responseTimes.length > 0 
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
      : 0,
    minResponseTime: Math.min(...metrics.responseTimes) || 0,
    maxResponseTime: Math.max(...metrics.responseTimes) || 0,
    requestsPerSecond: metrics.totalRequests / (actualDuration / 1000),
    errorsPerSecond: metrics.failedRequests / (actualDuration / 1000),
    timestamp: Date.now()
  };

  // Cleanup sessions
  for (const session of sessions) {
    await session.page.context().close();
  }

  // Log results
  console.log(`\n📊 Load Test Results:`);
  console.log(`   Users: ${result.concurrentUsers}`);
  console.log(`   Duration: ${(result.duration/1000).toFixed(1)}s`);
  console.log(`   Total Requests: ${result.totalRequests}`);
  console.log(`   Success Rate: ${((result.successfulRequests/result.totalRequests)*100).toFixed(1)}%`);
  console.log(`   Avg Response Time: ${result.averageResponseTime.toFixed(0)}ms`);
  console.log(`   Requests/sec: ${result.requestsPerSecond.toFixed(1)}`);
  console.log(`   Errors/sec: ${result.errorsPerSecond.toFixed(2)}`);

  // Validate performance criteria
  expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.95); // 95% success rate
  expect(result.averageResponseTime).toBeLessThan(2000); // Average response < 2s
  expect(result.requestsPerSecond).toBeGreaterThan(10); // Minimum throughput

  await storeLoadTestResult(result);
  return result;
}

/**
 * Simulate realistic user journey
 */
async function simulateUserJourney(session: UserSession): Promise<void> {
  const { page, userId } = session;
  
  try {
    // Journey: Home -> Login -> Dashboard -> Projects -> Feedback
    
    // Step 1: Visit home page
    session.actions.push('visit_home');
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(1000, 3000);

    // Step 2: Navigate to login
    session.actions.push('navigate_login');
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(2000, 5000);

    // Step 3: Simulate login form interaction
    session.actions.push('interact_login_form');
    await page.fill('input[type="email"]', `${userId}@test.com`);
    await randomDelay(500, 1500);
    await page.fill('input[type="password"]', 'testpassword123');
    await randomDelay(500, 1500);

    // Step 4: Visit dashboard
    session.actions.push('visit_dashboard');
    await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(2000, 4000);

    // Step 5: Browse projects
    session.actions.push('browse_projects');
    await page.goto('http://localhost:3005/projects', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(3000, 6000);

    // Step 6: Check feedback
    session.actions.push('check_feedback');
    await page.goto('http://localhost:3005/feedback', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(2000, 4000);

    // Step 7: Test file upload demo
    session.actions.push('test_file_upload');
    await page.goto('http://localhost:3005/file-upload-demo', { waitUntil: 'networkidle', timeout: 10000 });
    await randomDelay(1000, 3000);

    // Repeat the journey for continuous load
    setTimeout(() => simulateUserJourney(session), randomDelay(5000, 10000));
    
  } catch (error) {
    session.errors.push(`Journey error: ${error.message}`);
    console.error(`User journey error for ${userId}:`, error);
  }
}

/**
 * Run file upload stress test
 */
async function runFileUploadStressTest(
  browser: Browser, 
  concurrentUploads: number, 
  duration: number
): Promise<void> {
  console.log(`\n📁 Starting file upload stress test: ${concurrentUploads} concurrent uploads`);
  
  const uploadPromises: Promise<void>[] = [];
  
  for (let i = 0; i < concurrentUploads; i++) {
    const uploadPromise = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto('http://localhost:3005/file-upload-demo', { waitUntil: 'networkidle' });
        
        // Simulate file upload
        const fileContent = 'x'.repeat(1024 * 100); // 100KB test file
        await page.setInputFiles('input[type="file"]', {
          name: `test-file-${i}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from(fileContent)
        });
        
        console.log(`📤 Upload ${i} initiated`);
        await randomDelay(1000, 3000);
        
      } catch (error) {
        console.error(`Upload ${i} failed:`, error);
      } finally {
        await context.close();
      }
    };
    
    uploadPromises.push(uploadPromise());
  }

  // Wait for all uploads or timeout
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, duration));
  await Promise.race([Promise.all(uploadPromises), timeoutPromise]);
  
  console.log(`✅ File upload stress test completed`);
}

/**
 * Run WebSocket connection stress test
 */
async function runWebSocketStressTest(
  browser: Browser, 
  connectionCount: number, 
  duration: number
): Promise<void> {
  console.log(`\n🔌 Starting WebSocket stress test: ${connectionCount} connections`);
  
  const connections: Promise<void>[] = [];
  
  for (let i = 0; i < connectionCount; i++) {
    const connectionPromise = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto('http://localhost:3005/feedback', { waitUntil: 'networkidle' });
        
        // Simulate WebSocket usage
        await page.evaluate((userId) => {
          // Mock WebSocket connection
          const ws = new WebSocket('ws://localhost:3005/ws');
          ws.onopen = () => {
            console.log(`WebSocket ${userId} connected`);
            // Send periodic messages
            setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'test_message',
                  userId: userId,
                  timestamp: Date.now()
                }));
              }
            }, 1000);
          };
        }, i);
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
      } catch (error) {
        console.error(`WebSocket connection ${i} failed:`, error);
      } finally {
        await context.close();
      }
    };
    
    connections.push(connectionPromise());
  }

  await Promise.all(connections);
  console.log(`✅ WebSocket stress test completed`);
}

/**
 * Run database query load test
 */
async function runDatabaseQueryLoadTest(
  browser: Browser, 
  concurrentQueries: number, 
  duration: number
): Promise<void> {
  console.log(`\n🗄️ Starting database query load test: ${concurrentQueries} concurrent queries`);
  
  const queries: Promise<void>[] = [];
  
  for (let i = 0; i < concurrentQueries; i++) {
    const queryPromise = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        // Simulate heavy database operations by loading data-heavy pages
        const startTime = Date.now();
        
        await page.goto('http://localhost:3005/api/analytics/performance?type=all&limit=100', {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`📊 Query ${i} completed in ${responseTime}ms`);
        
        await randomDelay(500, 1500);
        
      } catch (error) {
        console.error(`Database query ${i} failed:`, error);
      } finally {
        await context.close();
      }
    };
    
    queries.push(queryPromise());
  }

  const timeoutPromise = new Promise(resolve => setTimeout(resolve, duration));
  await Promise.race([Promise.all(queries), timeoutPromise]);
  
  console.log(`✅ Database query load test completed`);
}

/**
 * Run API endpoint stress test
 */
async function runAPIStressTest(
  browser: Browser, 
  concurrentRequests: number, 
  duration: number
): Promise<void> {
  console.log(`\n🌐 Starting API stress test: ${concurrentRequests} concurrent requests`);
  
  const apiEndpoints = [
    '/api/analytics/performance',
    '/api/monitoring/alerts',
    '/api/test'
  ];
  
  const requests: Promise<void>[] = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    const requestPromise = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        const endpoint = apiEndpoints[i % apiEndpoints.length];
        const startTime = Date.now();
        
        const response = await page.goto(`http://localhost:3005${endpoint}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`🚀 API request ${i} to ${endpoint}: ${response?.status()} (${responseTime}ms)`);
        
        await randomDelay(100, 500);
        
      } catch (error) {
        console.error(`API request ${i} failed:`, error);
      } finally {
        await context.close();
      }
    };
    
    requests.push(requestPromise());
  }

  const timeoutPromise = new Promise(resolve => setTimeout(resolve, duration));
  await Promise.race([Promise.all(requests), timeoutPromise]);
  
  console.log(`✅ API stress test completed`);
}

/**
 * Run memory leak detection test
 */
async function runMemoryLeakDetectionTest(browser: Browser, duration: number): Promise<void> {
  console.log(`\n🧠 Starting memory leak detection test for ${duration/1000}s`);
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const memorySnapshots: number[] = [];
  
  // Monitor memory usage
  const monitorInterval = setInterval(async () => {
    try {
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
        };
      });
      
      memorySnapshots.push(metrics.usedJSHeapSize);
      console.log(`🧠 Memory usage: ${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
      
    } catch (error) {
      console.error('Memory monitoring error:', error);
    }
  }, 5000);

  try {
    // Simulate memory-intensive operations
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle' });
    
    for (let i = 0; i < duration / 10000; i++) {
      // Navigate through different pages to test for memory leaks
      await page.goto('http://localhost:3005/projects', { waitUntil: 'networkidle' });
      await randomDelay(2000, 4000);
      
      await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle' });
      await randomDelay(2000, 4000);
      
      await page.goto('http://localhost:3005/feedback', { waitUntil: 'networkidle' });
      await randomDelay(2000, 4000);
    }
    
  } finally {
    clearInterval(monitorInterval);
    await context.close();
  }

  // Analyze memory trend
  if (memorySnapshots.length >= 3) {
    const initialMemory = memorySnapshots[0];
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
    
    console.log(`📈 Memory change: ${memoryIncrease > 0 ? '+' : ''}${memoryIncrease.toFixed(1)}%`);
    
    if (memoryIncrease > 50) {
      console.log(`🚨 POTENTIAL MEMORY LEAK DETECTED: ${memoryIncrease.toFixed(1)}% increase`);
    } else {
      console.log(`✅ No significant memory leaks detected`);
    }
  }
}

/**
 * Run resource limits test
 */
async function runResourceLimitsTest(browser: Browser): Promise<void> {
  console.log(`\n📊 Testing browser resource limits`);
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle' });
    
    // Test with many DOM elements
    await page.evaluate(() => {
      for (let i = 0; i < 10000; i++) {
        const div = document.createElement('div');
        div.textContent = `Element ${i}`;
        document.body.appendChild(div);
      }
    });
    
    console.log(`📦 Added 10,000 DOM elements`);
    
    // Test large data processing
    const processingTime = await page.evaluate(() => {
      const start = performance.now();
      const largeArray = new Array(1000000).fill(0).map((_, i) => i);
      const sorted = largeArray.sort((a, b) => b - a);
      return performance.now() - start;
    });
    
    console.log(`⚡ Large array processing: ${processingTime.toFixed(1)}ms`);
    
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    
  } finally {
    await context.close();
  }
}

/**
 * Run network latency test
 */
async function runNetworkLatencyTest(browser: Browser, latencyMs: number): Promise<void> {
  console.log(`\n🌐 Testing performance under ${latencyMs}ms network latency`);
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Simulate network latency (this is a simplified simulation)
  await page.route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    await route.continue();
  });
  
  try {
    const startTime = Date.now();
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Page load time with ${latencyMs}ms latency: ${loadTime}ms`);
    
    // Performance should degrade gracefully under latency
    expect(loadTime).toBeLessThan(30000); // Should load within 30 seconds even with latency
    
  } finally {
    await context.close();
  }
}

/**
 * Store load test result
 */
async function storeLoadTestResult(result: LoadTestResult): Promise<void> {
  try {
    const fs = await import('fs');
    const path = './test/performance/load-test-results.json';
    
    let results: LoadTestResult[] = [];
    try {
      const data = fs.readFileSync(path, 'utf8');
      results = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    results.push(result);
    
    // Keep only last 50 results
    if (results.length > 50) {
      results = results.slice(-50);
    }

    fs.writeFileSync(path, JSON.stringify(results, null, 2));
  } catch (error) {
    console.warn('Failed to store load test result:', error);
  }
}

/**
 * Generate random delay between min and max milliseconds
 */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}