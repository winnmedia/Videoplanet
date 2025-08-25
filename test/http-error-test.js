#!/usr/bin/env node

/**
 * HTTP Error Comprehensive Test Script
 * Grace (QA Lead) - 2025-08-24
 * 
 * 테스트 범위:
 * 1. 모든 페이지 라우트 접속 테스트
 * 2. API 엔드포인트 응답 확인
 * 3. 404, 500 에러 페이지 동작 확인
 * 4. CORS 설정 검증
 * 5. 인증/인가 오류 처리
 * 6. 네트워크 타임아웃 처리
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3005';
const API_BASE_URL = 'http://localhost:8000';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 테스트 결과 저장
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  errors: [],
};

// 로그 헬퍼 함수
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`${colors.green}✓${colors.reset} ${message}`);
      break;
    case 'error':
      console.log(`${colors.red}✗${colors.reset} ${message}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
      break;
    case 'info':
      console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
      break;
    case 'section':
      console.log(`\n${colors.bright}${colors.blue}▸ ${message}${colors.reset}`);
      break;
    default:
      console.log(message);
  }
}

// HTTP 요청 유틸리티
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'VideoplanetHTTPTestAgent/1.0',
        ...options.headers,
      },
      timeout: options.timeout || 5000,
    };

    const startTime = Date.now();
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime,
          url,
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url,
        responseTime: Date.now() - startTime,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url,
        responseTime: Date.now() - startTime,
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 페이지 라우트 테스트
async function testPageRoutes() {
  log('페이지 라우트 테스트', 'section');
  
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/projects', name: 'Projects List' },
    { path: '/projects/create', name: 'Create Project' },
    { path: '/projects/123', name: 'Project Detail' },
    { path: '/planning', name: 'Planning' },
    { path: '/feedback/456', name: 'Feedback Detail' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' },
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route.path}`);
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        log(`${route.name} (${route.path}): ${response.statusCode} - ${response.responseTime}ms`, 'success');
        testResults.passed.push({
          test: `Page: ${route.name}`,
          path: route.path,
          statusCode: response.statusCode,
          responseTime: response.responseTime,
        });
      } else if (response.statusCode === 404) {
        log(`${route.name} (${route.path}): 404 Not Found`, 'warning');
        testResults.warnings.push({
          test: `Page: ${route.name}`,
          path: route.path,
          statusCode: response.statusCode,
          message: 'Page not found',
        });
      } else {
        log(`${route.name} (${route.path}): ${response.statusCode}`, 'error');
        testResults.failed.push({
          test: `Page: ${route.name}`,
          path: route.path,
          statusCode: response.statusCode,
        });
      }
    } catch (error) {
      log(`${route.name} (${route.path}): ${error.error}`, 'error');
      testResults.errors.push({
        test: `Page: ${route.name}`,
        path: route.path,
        error: error.error,
      });
    }
  }
}

// API 엔드포인트 테스트
async function testAPIEndpoints() {
  log('API 엔드포인트 테스트', 'section');
  
  const endpoints = [
    { path: '/api/health', name: 'Health Check', baseUrl: BASE_URL },
    { path: '/api/dashboard/stats', name: 'Dashboard Stats', baseUrl: BASE_URL },
    { path: '/api/notifications/feedback', name: 'Feedback Notifications', baseUrl: BASE_URL },
    { path: '/api/notifications/project', name: 'Project Notifications', baseUrl: BASE_URL },
    { path: '/api/projects', name: 'Projects API', baseUrl: BASE_URL },
    { path: '/api/feedback', name: 'Feedback API', baseUrl: BASE_URL },
    { path: '/api/v1/feedbacks', name: 'Backend Feedbacks', baseUrl: BASE_URL },
    { path: '/api/v1/projects', name: 'Backend Projects', baseUrl: BASE_URL },
    { path: '/api/v1/users', name: 'Backend Users', baseUrl: BASE_URL },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${endpoint.baseUrl}${endpoint.path}`);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        log(`${endpoint.name} (${endpoint.path}): ${response.statusCode} - ${response.responseTime}ms`, 'success');
        testResults.passed.push({
          test: `API: ${endpoint.name}`,
          path: endpoint.path,
          statusCode: response.statusCode,
          responseTime: response.responseTime,
        });
      } else if (response.statusCode === 401 || response.statusCode === 403) {
        log(`${endpoint.name} (${endpoint.path}): ${response.statusCode} Auth Required`, 'warning');
        testResults.warnings.push({
          test: `API: ${endpoint.name}`,
          path: endpoint.path,
          statusCode: response.statusCode,
          message: 'Authentication required',
        });
      } else {
        log(`${endpoint.name} (${endpoint.path}): ${response.statusCode}`, 'error');
        testResults.failed.push({
          test: `API: ${endpoint.name}`,
          path: endpoint.path,
          statusCode: response.statusCode,
        });
      }
    } catch (error) {
      log(`${endpoint.name} (${endpoint.path}): ${error.error}`, 'error');
      testResults.errors.push({
        test: `API: ${endpoint.name}`,
        path: endpoint.path,
        error: error.error,
      });
    }
  }
}

// 에러 페이지 테스트
async function testErrorPages() {
  log('에러 페이지 테스트', 'section');
  
  const errorPaths = [
    { path: '/this-page-does-not-exist', expectedCode: 404, name: '404 Error Page' },
    { path: '/api/this-endpoint-does-not-exist', expectedCode: 404, name: 'API 404' },
    { path: '/_error', expectedCode: 500, name: '500 Error Page' },
  ];

  for (const errorPath of errorPaths) {
    try {
      const response = await makeRequest(`${BASE_URL}${errorPath.path}`);
      
      if (response.statusCode === errorPath.expectedCode || 
          (errorPath.expectedCode === 404 && response.statusCode === 404)) {
        log(`${errorPath.name}: 정상 작동 (${response.statusCode})`, 'success');
        testResults.passed.push({
          test: `Error Page: ${errorPath.name}`,
          path: errorPath.path,
          statusCode: response.statusCode,
        });
      } else {
        log(`${errorPath.name}: 예상 ${errorPath.expectedCode}, 실제 ${response.statusCode}`, 'warning');
        testResults.warnings.push({
          test: `Error Page: ${errorPath.name}`,
          path: errorPath.path,
          expected: errorPath.expectedCode,
          actual: response.statusCode,
        });
      }
    } catch (error) {
      log(`${errorPath.name}: ${error.error}`, 'error');
      testResults.errors.push({
        test: `Error Page: ${errorPath.name}`,
        path: errorPath.path,
        error: error.error,
      });
    }
  }
}

// CORS 설정 테스트
async function testCORSConfiguration() {
  log('CORS 설정 테스트', 'section');
  
  const corsTests = [
    {
      path: '/api/dashboard/stats',
      origin: 'https://example.com',
      name: 'Cross-Origin Request',
    },
    {
      path: '/feedback/public/123',
      origin: 'https://external-site.com',
      name: 'Public Feedback CORS',
    },
  ];

  for (const test of corsTests) {
    try {
      const response = await makeRequest(`${BASE_URL}${test.path}`, {
        headers: {
          'Origin': test.origin,
        },
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
      };
      
      if (test.path.includes('/public/') && corsHeaders['access-control-allow-origin'] === '*') {
        log(`${test.name}: CORS 허용됨`, 'success');
        testResults.passed.push({
          test: `CORS: ${test.name}`,
          path: test.path,
          corsHeaders,
        });
      } else if (!test.path.includes('/public/') && !corsHeaders['access-control-allow-origin']) {
        log(`${test.name}: CORS 보호됨`, 'success');
        testResults.passed.push({
          test: `CORS: ${test.name}`,
          path: test.path,
          message: 'CORS properly restricted',
        });
      } else {
        log(`${test.name}: CORS 설정 확인 필요`, 'warning');
        testResults.warnings.push({
          test: `CORS: ${test.name}`,
          path: test.path,
          corsHeaders,
        });
      }
    } catch (error) {
      log(`${test.name}: ${error.error}`, 'error');
      testResults.errors.push({
        test: `CORS: ${test.name}`,
        path: test.path,
        error: error.error,
      });
    }
  }
}

// 보안 헤더 테스트
async function testSecurityHeaders() {
  log('보안 헤더 테스트', 'section');
  
  const securityPaths = [
    { path: '/', name: 'Home Page Security' },
    { path: '/dashboard', name: 'Dashboard Security' },
    { path: '/feedback/public/123', name: 'Public Feedback Security' },
  ];

  const requiredHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'x-xss-protection',
  ];

  for (const test of securityPaths) {
    try {
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const missingHeaders = [];
      
      for (const header of requiredHeaders) {
        if (!response.headers[header]) {
          missingHeaders.push(header);
        }
      }
      
      if (missingHeaders.length === 0) {
        log(`${test.name}: 모든 보안 헤더 존재`, 'success');
        testResults.passed.push({
          test: `Security: ${test.name}`,
          path: test.path,
          message: 'All security headers present',
        });
      } else {
        log(`${test.name}: 누락된 헤더 - ${missingHeaders.join(', ')}`, 'warning');
        testResults.warnings.push({
          test: `Security: ${test.name}`,
          path: test.path,
          missingHeaders,
        });
      }
    } catch (error) {
      log(`${test.name}: ${error.error}`, 'error');
      testResults.errors.push({
        test: `Security: ${test.name}`,
        path: test.path,
        error: error.error,
      });
    }
  }
}

// 응답 시간 성능 테스트
async function testResponseTimes() {
  log('응답 시간 성능 테스트', 'section');
  
  const performanceTests = [
    { path: '/', threshold: 1000, name: 'Home Page' },
    { path: '/dashboard', threshold: 2000, name: 'Dashboard' },
    { path: '/api/health', threshold: 500, name: 'Health Check' },
  ];

  for (const test of performanceTests) {
    try {
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      
      if (response.responseTime <= test.threshold) {
        log(`${test.name}: ${response.responseTime}ms (기준: ${test.threshold}ms)`, 'success');
        testResults.passed.push({
          test: `Performance: ${test.name}`,
          path: test.path,
          responseTime: response.responseTime,
          threshold: test.threshold,
        });
      } else {
        log(`${test.name}: ${response.responseTime}ms (기준 초과: ${test.threshold}ms)`, 'warning');
        testResults.warnings.push({
          test: `Performance: ${test.name}`,
          path: test.path,
          responseTime: response.responseTime,
          threshold: test.threshold,
        });
      }
    } catch (error) {
      log(`${test.name}: ${error.error}`, 'error');
      testResults.errors.push({
        test: `Performance: ${test.name}`,
        path: test.path,
        error: error.error,
      });
    }
  }
}

// 최종 보고서 생성
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}HTTP 오류 점검 보고서${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`테스트 시간: ${new Date().toISOString()}`);
  console.log('');
  
  console.log(`${colors.green}통과: ${testResults.passed.length}개${colors.reset}`);
  console.log(`${colors.yellow}경고: ${testResults.warnings.length}개${colors.reset}`);
  console.log(`${colors.red}실패: ${testResults.failed.length}개${colors.reset}`);
  console.log(`${colors.red}오류: ${testResults.errors.length}개${colors.reset}`);
  
  // 실패한 테스트 상세
  if (testResults.failed.length > 0) {
    console.log(`\n${colors.red}실패한 테스트:${colors.reset}`);
    testResults.failed.forEach(test => {
      console.log(`  - ${test.test}: ${test.path} (${test.statusCode})`);
    });
  }
  
  // 오류 발생 테스트 상세
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}오류 발생:${colors.reset}`);
    testResults.errors.forEach(test => {
      console.log(`  - ${test.test}: ${test.path}`);
      console.log(`    오류: ${test.error}`);
    });
  }
  
  // 경고 사항
  if (testResults.warnings.length > 0) {
    console.log(`\n${colors.yellow}경고 사항:${colors.reset}`);
    testResults.warnings.forEach(test => {
      if (test.message) {
        console.log(`  - ${test.test}: ${test.message}`);
      } else {
        console.log(`  - ${test.test}: ${test.path}`);
      }
    });
  }
  
  // 권장 사항
  console.log(`\n${colors.cyan}권장 사항:${colors.reset}`);
  
  if (testResults.errors.some(e => e.error.includes('ECONNREFUSED'))) {
    console.log('  1. 백엔드 서버가 실행 중인지 확인하세요 (port 8000)');
  }
  
  if (testResults.warnings.some(w => w.statusCode === 404)) {
    console.log('  2. 일부 페이지가 구현되지 않았습니다. 라우팅 설정을 확인하세요');
  }
  
  if (testResults.warnings.some(w => w.statusCode === 401 || w.statusCode === 403)) {
    console.log('  3. 일부 API는 인증이 필요합니다. 인증 시스템을 구현하세요');
  }
  
  if (testResults.warnings.some(w => w.responseTime > w.threshold)) {
    console.log('  4. 일부 페이지의 응답 시간이 느립니다. 성능 최적화가 필요합니다');
  }
  
  if (testResults.warnings.some(w => w.missingHeaders)) {
    console.log('  5. 일부 보안 헤더가 누락되었습니다. next.config.ts를 확인하세요');
  }
  
  console.log('\n' + '='.repeat(80));
  
  // JSON 보고서 저장
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed.length,
      warnings: testResults.warnings.length,
      failed: testResults.failed.length,
      errors: testResults.errors.length,
    },
    details: testResults,
  };
  
  require('fs').writeFileSync(
    'http-error-test-report.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log(`\n보고서가 http-error-test-report.json 파일로 저장되었습니다.`);
}

// 메인 실행 함수
async function runTests() {
  console.log(`${colors.bright}${colors.blue}VideoPlanet HTTP 오류 종합 점검${colors.reset}`);
  console.log('='.repeat(80));
  
  try {
    await testPageRoutes();
    await testAPIEndpoints();
    await testErrorPages();
    await testCORSConfiguration();
    await testSecurityHeaders();
    await testResponseTimes();
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  } finally {
    generateReport();
  }
}

// 스크립트 실행
runTests();