#!/usr/bin/env node

/**
 * 🎬 VideoPlanet Manual User Journey Test Suite
 * 
 * "Checkout" scope: 프로젝트 완료 및 승인 프로세스
 * - 영상 기획 완료 → 검토 → 피드백 → 최종 승인
 * - AI 기획서 생성 → 편집 → 클라이언트 검토 → 배포
 * 
 * Headless Testing Alternative when Playwright browsers unavailable
 */

const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3005',
  TEST_USER: {
    email: 'ceo@winnmedia.co.kr',
    password: 'dnlsdos213$',
    name: '윤석근 CEO'
  },
  TIMEOUT: 10000,
  REPORT_DIR: './test-results/manual-journey'
};

// Test Results Storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  journeys: [],
  frictionPoints: [],
  regressionIssues: [],
  performanceMetrics: {}
};

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '✅',
    'warn': '⚠️',
    'error': '❌',
    'test': '🧪'
  }[level] || 'ℹ️';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordJourney(journeyName, status, details = {}) {
  const journey = {
    name: journeyName,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.journeys.push(journey);
  testResults.summary.total++;
  
  if (status === 'passed') {
    testResults.summary.passed++;
    log(`Journey "${journeyName}" completed successfully`, 'info');
  } else if (status === 'failed') {
    testResults.summary.failed++;
    log(`Journey "${journeyName}" failed: ${details.error}`, 'error');
  } else if (status === 'warning') {
    testResults.summary.warnings++;
    log(`Journey "${journeyName}" completed with warnings: ${details.warning}`, 'warn');
  }
}

function recordFriction(description, severity = 'medium', page = 'unknown') {
  testResults.frictionPoints.push({
    description,
    severity,
    page,
    timestamp: new Date().toISOString()
  });
  log(`UX Friction detected: ${description} (${severity})`, 'warn');
}

async function makeRequest(url, options = {}) {
  try {
    const fetch = await import('node-fetch').then(m => m.default);
    const response = await fetch(url, {
      timeout: CONFIG.TIMEOUT,
      ...options
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      text: await response.text(),
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      ok: false
    };
  }
}

// Core Test Functions
async function testServerHealth() {
  log('Testing server health and basic connectivity...', 'test');
  
  try {
    const response = await makeRequest(CONFIG.BASE_URL);
    
    if (response.ok) {
      recordJourney('Server Health Check', 'passed', {
        responseTime: Date.now(),
        statusCode: response.status
      });
    } else {
      recordJourney('Server Health Check', 'failed', {
        error: `Server returned ${response.status}: ${response.statusText}`
      });
    }
  } catch (error) {
    recordJourney('Server Health Check', 'failed', {
      error: error.message
    });
  }
}

async function testCoreRoutes() {
  log('Testing core route accessibility...', 'test');
  
  const coreRoutes = [
    '/',                    // Home page
    '/login',               // Authentication
    '/dashboard',           // Main dashboard (may redirect if not authenticated)
    '/video-planning',      // Video planning redirect
    '/video-planning/ai',   // AI planning page
    '/video-planning/history', // Planning history
    '/projects',            // Projects page (may require auth)
    '/feedback/public/test' // Public feedback (guest access)
  ];
  
  const routeResults = [];
  
  for (const route of coreRoutes) {
    try {
      const url = CONFIG.BASE_URL + route;
      const response = await makeRequest(url);
      
      routeResults.push({
        route,
        status: response.status,
        accessible: response.ok || response.status === 302, // 302 = auth redirect is OK
        responseTime: Date.now()
      });
      
      // Check for critical errors (5xx)
      if (response.status >= 500) {
        recordFriction(
          `Server error on ${route}: ${response.status}`,
          'high',
          route
        );
      }
      
      // Check for broken links (404)
      if (response.status === 404) {
        recordFriction(
          `Page not found: ${route}`,
          'medium',
          route
        );
      }
      
    } catch (error) {
      routeResults.push({
        route,
        status: 0,
        accessible: false,
        error: error.message
      });
    }
  }
  
  const accessibleRoutes = routeResults.filter(r => r.accessible).length;
  const totalRoutes = routeResults.length;
  
  if (accessibleRoutes === totalRoutes) {
    recordJourney('Core Routes Accessibility', 'passed', {
      accessibleRoutes,
      totalRoutes,
      routeResults
    });
  } else if (accessibleRoutes > totalRoutes * 0.7) {
    recordJourney('Core Routes Accessibility', 'warning', {
      accessibleRoutes,
      totalRoutes,
      warning: 'Some routes may require authentication',
      routeResults
    });
  } else {
    recordJourney('Core Routes Accessibility', 'failed', {
      accessibleRoutes,
      totalRoutes,
      error: 'Too many routes are inaccessible',
      routeResults
    });
  }
}

async function testVideoPlanning() {
  log('Testing video planning workflow...', 'test');
  
  try {
    // Test AI planning page structure
    const aiPlanningResponse = await makeRequest(CONFIG.BASE_URL + '/video-planning/ai');
    
    if (aiPlanningResponse.ok) {
      const content = aiPlanningResponse.text;
      
      // Check for essential form elements (basic structure validation)
      const hasTitle = content.includes('영상 제목') || content.includes('title');
      const hasStory = content.includes('한 줄 스토리') || content.includes('story');
      const hasGenerate = content.includes('생성') || content.includes('generate');
      const hasFormStructure = content.includes('<form') && content.includes('</form>');
      
      if (hasTitle && hasStory && hasGenerate && hasFormStructure) {
        recordJourney('AI Video Planning Form Structure', 'passed', {
          hasEssentialFields: true,
          pageLoaded: true
        });
      } else {
        recordJourney('AI Video Planning Form Structure', 'warning', {
          warning: 'Some form elements may be missing or loaded via JavaScript',
          hasTitle,
          hasStory,
          hasGenerate,
          hasFormStructure
        });
      }
    } else {
      recordJourney('AI Video Planning Access', 'failed', {
        error: `Cannot access AI planning page: ${aiPlanningResponse.status}`
      });
    }
    
    // Test planning history page
    const historyResponse = await makeRequest(CONFIG.BASE_URL + '/video-planning/history');
    
    if (historyResponse.ok) {
      recordJourney('Planning History Page Access', 'passed');
    } else if (historyResponse.status === 302) {
      recordJourney('Planning History Page Access', 'warning', {
        warning: 'Page redirects (likely requires authentication)'
      });
    } else {
      recordJourney('Planning History Page Access', 'failed', {
        error: `Cannot access history page: ${historyResponse.status}`
      });
    }
    
  } catch (error) {
    recordJourney('Video Planning Workflow Test', 'failed', {
      error: error.message
    });
  }
}

async function testFeedbackSystem() {
  log('Testing feedback system accessibility...', 'test');
  
  try {
    // Test public feedback access (should work without auth)
    const publicFeedbackUrl = CONFIG.BASE_URL + '/feedback/public/sample';
    const publicResponse = await makeRequest(publicFeedbackUrl);
    
    if (publicResponse.ok) {
      const content = publicResponse.text;
      
      // Check for guest feedback form elements
      const hasGuestForm = content.includes('textarea') || content.includes('피드백');
      const hasNameField = content.includes('이름') || content.includes('name');
      const hasSubmitButton = content.includes('제출') || content.includes('submit');
      
      if (hasGuestForm && hasSubmitButton) {
        recordJourney('Guest Feedback System', 'passed', {
          guestAccessible: true,
          hasEssentialElements: true
        });
      } else {
        recordJourney('Guest Feedback System', 'warning', {
          warning: 'Feedback form may be loaded dynamically',
          hasGuestForm,
          hasNameField,
          hasSubmitButton
        });
      }
    } else {
      recordJourney('Guest Feedback System', 'failed', {
        error: `Public feedback not accessible: ${publicResponse.status}`
      });
    }
    
  } catch (error) {
    recordJourney('Feedback System Test', 'failed', {
      error: error.message
    });
  }
}

async function testPerformanceBasics() {
  log('Testing basic performance metrics...', 'test');
  
  const performanceTests = [
    { name: 'Home Page', url: '/' },
    { name: 'AI Planning', url: '/video-planning/ai' },
    { name: 'Login Page', url: '/login' }
  ];
  
  const metrics = {};
  
  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(CONFIG.BASE_URL + test.url);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      metrics[test.name] = {
        responseTime,
        status: response.status,
        contentLength: response.text?.length || 0
      };
      
      // Performance thresholds
      if (responseTime > 5000) {
        recordFriction(
          `Slow response time for ${test.name}: ${responseTime}ms`,
          'high',
          test.url
        );
      } else if (responseTime > 2000) {
        recordFriction(
          `Moderate response time for ${test.name}: ${responseTime}ms`,
          'medium',
          test.url
        );
      }
      
    } catch (error) {
      metrics[test.name] = {
        error: error.message,
        responseTime: CONFIG.TIMEOUT
      };
    }
  }
  
  testResults.performanceMetrics = metrics;
  
  const avgResponseTime = Object.values(metrics)
    .filter(m => m.responseTime && !m.error)
    .reduce((sum, m) => sum + m.responseTime, 0) / 
    Object.values(metrics).filter(m => !m.error).length;
  
  if (avgResponseTime < 1000) {
    recordJourney('Basic Performance Test', 'passed', {
      averageResponseTime: avgResponseTime,
      metrics
    });
  } else if (avgResponseTime < 3000) {
    recordJourney('Basic Performance Test', 'warning', {
      averageResponseTime: avgResponseTime,
      warning: 'Response times are acceptable but could be improved',
      metrics
    });
  } else {
    recordJourney('Basic Performance Test', 'failed', {
      averageResponseTime: avgResponseTime,
      error: 'Response times exceed acceptable thresholds',
      metrics
    });
  }
}

async function testSecurityHeaders() {
  log('Testing security headers and basic security measures...', 'test');
  
  try {
    const response = await makeRequest(CONFIG.BASE_URL);
    const headers = response.headers;
    
    const securityChecks = {
      'X-Frame-Options': headers['x-frame-options'],
      'X-Content-Type-Options': headers['x-content-type-options'],
      'Content-Security-Policy': headers['content-security-policy'],
      'Strict-Transport-Security': headers['strict-transport-security']
    };
    
    const securityScore = Object.values(securityChecks).filter(Boolean).length;
    const totalChecks = Object.keys(securityChecks).length;
    
    if (securityScore >= 3) {
      recordJourney('Security Headers Check', 'passed', {
        securityScore: `${securityScore}/${totalChecks}`,
        headers: securityChecks
      });
    } else if (securityScore >= 1) {
      recordJourney('Security Headers Check', 'warning', {
        securityScore: `${securityScore}/${totalChecks}`,
        warning: 'Some security headers are missing',
        headers: securityChecks
      });
    } else {
      recordJourney('Security Headers Check', 'failed', {
        securityScore: `${securityScore}/${totalChecks}`,
        error: 'Critical security headers are missing',
        headers: securityChecks
      });
    }
    
  } catch (error) {
    recordJourney('Security Headers Check', 'failed', {
      error: error.message
    });
  }
}

async function generateReport() {
  log('Generating comprehensive test report...', 'test');
  
  // Ensure report directory exists
  if (!fs.existsSync(CONFIG.REPORT_DIR)) {
    fs.mkdirSync(CONFIG.REPORT_DIR, { recursive: true });
  }
  
  const reportData = {
    ...testResults,
    generatedAt: new Date().toISOString(),
    testEnvironment: {
      baseUrl: CONFIG.BASE_URL,
      nodeVersion: process.version,
      platform: process.platform
    },
    recommendations: generateRecommendations()
  };
  
  // Generate JSON report
  const jsonPath = path.join(CONFIG.REPORT_DIR, 'journey-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
  
  // Generate Markdown report
  const markdownPath = path.join(CONFIG.REPORT_DIR, 'journey-report.md');
  fs.writeFileSync(markdownPath, generateMarkdownReport(reportData));
  
  log(`Reports generated:`, 'info');
  log(`  JSON: ${jsonPath}`, 'info');
  log(`  Markdown: ${markdownPath}`, 'info');
  
  return reportData;
}

function generateRecommendations() {
  const recommendations = [];
  
  // Performance recommendations
  if (testResults.performanceMetrics) {
    const avgTime = Object.values(testResults.performanceMetrics)
      .filter(m => m.responseTime && !m.error)
      .reduce((sum, m) => sum + m.responseTime, 0) / 
      Object.values(testResults.performanceMetrics).filter(m => !m.error).length;
    
    if (avgTime > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        description: 'Optimize server response times',
        details: `Average response time is ${Math.round(avgTime)}ms, should be < 1000ms`
      });
    }
  }
  
  // UX friction recommendations
  if (testResults.frictionPoints.length > 0) {
    const highFriction = testResults.frictionPoints.filter(f => f.severity === 'high');
    if (highFriction.length > 0) {
      recommendations.push({
        category: 'UX',
        priority: 'High',
        description: 'Address critical UX friction points',
        details: `${highFriction.length} high-severity friction points found`
      });
    }
  }
  
  // Accessibility recommendations
  const failedJourneys = testResults.journeys.filter(j => j.status === 'failed');
  if (failedJourneys.length > testResults.summary.total * 0.3) {
    recommendations.push({
      category: 'Reliability',
      priority: 'High',
      description: 'Improve system reliability',
      details: `${failedJourneys.length} out of ${testResults.summary.total} journeys failed`
    });
  }
  
  return recommendations;
}

function generateMarkdownReport(data) {
  return `# VideoPlanet User Journey Test Report

**Generated:** ${data.generatedAt}  
**Environment:** ${data.testEnvironment.baseUrl}  
**Platform:** ${data.testEnvironment.platform} ${data.testEnvironment.nodeVersion}

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Journeys | ${data.summary.total} | - |
| Passed | ${data.summary.passed} | ✅ |
| Failed | ${data.summary.failed} | ${data.summary.failed > 0 ? '❌' : '✅'} |
| Warnings | ${data.summary.warnings} | ${data.summary.warnings > 0 ? '⚠️' : '✅'} |
| Success Rate | ${Math.round((data.summary.passed / data.summary.total) * 100)}% | ${data.summary.passed / data.summary.total > 0.8 ? '✅' : '❌'} |

## 🛣️ Journey Results

${data.journeys.map(journey => `
### ${journey.name}
- **Status:** ${journey.status === 'passed' ? '✅ PASSED' : journey.status === 'failed' ? '❌ FAILED' : '⚠️ WARNING'}
- **Time:** ${journey.timestamp}
${journey.error ? `- **Error:** ${journey.error}` : ''}
${journey.warning ? `- **Warning:** ${journey.warning}` : ''}
${journey.details ? `- **Details:** ${JSON.stringify(journey.details, null, 2)}` : ''}
`).join('')}

## ⚠️ UX Friction Points

${data.frictionPoints.length > 0 ? data.frictionPoints.map(friction => `
- **${friction.severity.toUpperCase()}:** ${friction.description} (${friction.page})
`).join('') : 'No friction points detected ✅'}

## 📈 Performance Metrics

${data.performanceMetrics ? Object.entries(data.performanceMetrics).map(([name, metrics]) => `
### ${name}
- Response Time: ${metrics.responseTime}ms
- Status: ${metrics.status || 'N/A'}
- Content Length: ${metrics.contentLength || 'N/A'} bytes
${metrics.error ? `- Error: ${metrics.error}` : ''}
`).join('') : 'No performance metrics available'}

## 🔧 Recommendations

${data.recommendations.length > 0 ? data.recommendations.map(rec => `
### ${rec.category} - ${rec.priority} Priority
${rec.description}
> ${rec.details}
`).join('') : 'No specific recommendations at this time ✅'}

## 📋 Next Actions

### Immediate (High Priority)
${data.recommendations.filter(r => r.priority === 'High').map(r => `- [ ] ${r.description}`).join('\n') || '- All systems operational ✅'}

### Short Term (Medium Priority)  
${data.recommendations.filter(r => r.priority === 'Medium').map(r => `- [ ] ${r.description}`).join('\n') || '- No medium priority items'}

### Long Term (Low Priority)
${data.recommendations.filter(r => r.priority === 'Low').map(r => `- [ ] ${r.description}`).join('\n') || '- Continue monitoring performance'}

---
*Generated by VideoPlanet Manual Journey Test Suite*
`;
}

// Main Test Execution
async function runAllTests() {
  log('🎬 Starting VideoPlanet Manual User Journey Tests...', 'info');
  log(`📍 Testing against: ${CONFIG.BASE_URL}`, 'info');
  
  const startTime = Date.now();
  
  try {
    // Core Infrastructure Tests
    await testServerHealth();
    await testCoreRoutes();
    
    // Feature-Specific Tests  
    await testVideoPlanning();
    await testFeedbackSystem();
    
    // Quality & Performance Tests
    await testPerformanceBasics();
    await testSecurityHeaders();
    
    // Generate comprehensive report
    const report = await generateReport();
    
    const duration = Date.now() - startTime;
    
    log('', 'info');
    log('🎯 Test Execution Complete!', 'info');
    log(`⏱️  Duration: ${Math.round(duration / 1000)}s`, 'info');
    log(`📊 Results: ${report.summary.passed}✅ ${report.summary.failed}❌ ${report.summary.warnings}⚠️`, 'info');
    log(`📋 Success Rate: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`, 'info');
    
    if (report.summary.failed === 0) {
      log('🚀 All critical journeys passed! System ready for production.', 'info');
    } else {
      log('⚠️  Some issues detected. Review the report for details.', 'warn');
    }
    
    return report;
    
  } catch (error) {
    log(`Fatal error during test execution: ${error.message}`, 'error');
    process.exit(1);
  }
}

// CLI Execution
if (require.main === module) {
  runAllTests()
    .then(report => {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  CONFIG,
  testResults
};