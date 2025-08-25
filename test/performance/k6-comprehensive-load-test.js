import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * VideoPlanet K6 종합 부하 테스트
 * 
 * 테스트 시나리오:
 * 1. 점진적 사용자 증가
 * 2. 피크 부하 유지
 * 3. 스파이크 테스트
 * 4. WebSocket 연결 부하
 * 5. 파일 업로드 부하
 */

// 커스텀 메트릭 정의
const websocketConnectionRate = new Rate('websocket_connection_success');
const websocketMessageLatency = new Trend('websocket_message_latency');
const apiErrorRate = new Rate('api_errors');
const fileUploadDuration = new Trend('file_upload_duration');
const memoryUsage = new Trend('memory_usage_mb');

// 테스트 환경 설정
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3005';
const WS_URL = BASE_URL.replace('http', 'ws') + '/api/ws';

// 테스트 데이터 준비
const TEST_USERS = [
  { email: 'test1@example.com', role: 'admin' },
  { email: 'test2@example.com', role: 'planner' },
  { email: 'test3@example.com', role: 'designer' },
  { email: 'test4@example.com', role: 'reviewer' },
];

const TEST_PROJECTS = [
  { title: '브랜드 홍보영상', category: 'marketing' },
  { title: '제품 소개영상', category: 'product' },
  { title: '교육 콘텐츠', category: 'education' },
];

// 테스트 단계별 설정
export let options = {
  scenarios: {
    // 1. 점진적 부하 증가 (Ramp-up)
    ramp_up_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // 20명까지 점진적 증가
        { duration: '3m', target: 50 },   // 50명까지 증가
        { duration: '2m', target: 50 },   // 50명 유지
        { duration: '2m', target: 0 },    // 점진적 감소
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'ramp_up' },
    },

    // 2. 정상 운영 부하 (Steady State)
    steady_state: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
      startTime: '10m',
      tags: { test_type: 'steady_state' },
    },

    // 3. 피크 시간 부하 (Peak Load)
    peak_load: {
      executor: 'ramping-vus',
      startTime: '15m',
      startVUs: 30,
      stages: [
        { duration: '1m', target: 100 },  // 급속 증가
        { duration: '3m', target: 100 },  // 피크 유지
        { duration: '1m', target: 30 },   // 정상으로 복귀
      ],
      tags: { test_type: 'peak_load' },
    },

    // 4. 스파이크 테스트 (Spike Test)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '20m',
      startVUs: 30,
      stages: [
        { duration: '30s', target: 200 }, // 급작스런 스파이크
        { duration: '1m', target: 200 },  // 스파이크 유지
        { duration: '30s', target: 30 },  // 급속 감소
      ],
      tags: { test_type: 'spike' },
    },

    // 5. WebSocket 전용 부하 테스트
    websocket_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
      startTime: '25m',
      exec: 'websocket_scenario',
      tags: { test_type: 'websocket' },
    },

    // 6. 파일 업로드 부하 테스트
    file_upload_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      startTime: '28m',
      exec: 'file_upload_scenario',
      tags: { test_type: 'file_upload' },
    },
  },

  // 성능 임계값 설정
  thresholds: {
    // HTTP 요청 성능
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    
    // API 별 임계값
    'http_req_duration{endpoint:dashboard}': ['p(95)<300'],
    'http_req_duration{endpoint:notifications}': ['p(95)<200'],
    'http_req_duration{endpoint:invitations}': ['p(95)<250'],
    'http_req_duration{endpoint:projects}': ['p(95)<400'],
    
    // WebSocket 성능
    websocket_connection_success: ['rate>0.95'],
    websocket_message_latency: ['p(95)<100'],
    
    // 전체 에러율
    api_errors: ['rate<0.01'],
    
    // 파일 업로드 성능
    file_upload_duration: ['p(95)<5000'], // 5초 이내
  },

  // 글로벌 설정
  userAgent: 'VideoPlanet-LoadTest/1.0',
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  
  // 리소스 제한
  batch: 10,
  batchPerHost: 5,
  
  // 태그
  tags: {
    environment: __ENV.ENV || 'test',
    version: __ENV.VERSION || '1.0.0',
  },
};

// 기본 HTTP 설정
export function setup() {
  console.log('🚀 Starting VideoPlanet Load Test');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  
  // 서버 헬스체크
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'Server is healthy': (r) => r.status === 200,
  });
  
  return {
    authTokens: generateAuthTokens(),
    testData: generateTestData(),
  };
}

// 메인 시나리오 (기본 사용자 흐름)
export default function(data) {
  const userIndex = (__VU - 1) % TEST_USERS.length;
  const user = TEST_USERS[userIndex];
  const authToken = data.authTokens[userIndex];

  group('User Authentication', () => {
    authenticateUser(user, authToken);
  });

  group('Dashboard Access', () => {
    loadDashboard(authToken);
  });

  group('Notifications Interaction', () => {
    interactWithNotifications(authToken);
  });

  group('Project Management', () => {
    manageProjects(authToken);
  });

  group('Collaborative Features', () => {
    collaborativeActions(authToken);
  });

  sleep(Math.random() * 3 + 1); // 1-4초 휴식
}

// WebSocket 전용 시나리오
export function websocket_scenario(data) {
  const userIndex = (__VU - 1) % TEST_USERS.length;
  const authToken = data.authTokens[userIndex];

  const wsUrl = `${WS_URL}?token=${authToken}`;
  
  const response = ws.connect(wsUrl, {
    tags: { scenario: 'websocket' },
  }, function (socket) {
    
    socket.on('open', () => {
      websocketConnectionRate.add(1);
      
      // 연결 즉시 사용자 정보 전송
      socket.send(JSON.stringify({
        type: 'user_join',
        userId: `user_${__VU}`,
        timestamp: Date.now(),
      }));
    });

    socket.on('message', (message) => {
      const data = JSON.parse(message);
      const latency = Date.now() - data.timestamp;
      websocketMessageLatency.add(latency);
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });

    socket.on('error', (e) => {
      console.error('WebSocket error:', e);
      websocketConnectionRate.add(0);
    });

    // 주기적으로 메시지 전송
    const messageInterval = setInterval(() => {
      const messages = [
        { type: 'notification', content: 'New feedback received' },
        { type: 'comment', content: 'Great work on the storyboard!' },
        { type: 'status_update', content: 'Project status changed' },
        { type: 'collaboration', content: 'User joined editing session' },
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      socket.send(JSON.stringify({
        ...randomMessage,
        userId: `user_${__VU}`,
        timestamp: Date.now(),
      }));
      
    }, 2000 + Math.random() * 3000); // 2-5초 간격

    // 30초 후 연결 종료
    setTimeout(() => {
      clearInterval(messageInterval);
      socket.close();
    }, 30000);
  });

  check(response, {
    'WebSocket connection established': (r) => r && r.url === wsUrl,
  });
}

// 파일 업로드 시나리오
export function file_upload_scenario(data) {
  const userIndex = (__VU - 1) % TEST_USERS.length;
  const authToken = data.authTokens[userIndex];

  // 다양한 크기의 더미 파일 생성
  const fileSizes = [100, 500, 1000, 2000]; // KB
  const fileSize = fileSizes[Math.floor(Math.random() * fileSizes.length)];
  const fileData = 'x'.repeat(fileSize * 1024); // 더미 데이터

  const uploadStart = Date.now();

  const uploadResponse = http.post(`${BASE_URL}/api/files/upload`, {
    file: http.file(fileData, `test-file-${__VU}.txt`, 'text/plain'),
    projectId: 'test-project-1',
    description: `Load test file upload from VU ${__VU}`,
  }, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    tags: {
      endpoint: 'file_upload',
      file_size: `${fileSize}KB`,
    },
    timeout: '30s',
  });

  const uploadDuration = Date.now() - uploadStart;
  fileUploadDuration.add(uploadDuration);

  check(uploadResponse, {
    'File upload successful': (r) => r.status === 201,
    'Upload response has file ID': (r) => r.json('fileId') !== undefined,
    'Upload within time limit': () => uploadDuration < 10000, // 10초 이내
  });

  if (uploadResponse.status !== 201) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }
}

// 헬퍼 함수들

function generateAuthTokens() {
  return TEST_USERS.map((user, index) => `mock-jwt-token-${index}`);
}

function generateTestData() {
  return {
    notifications: Array.from({ length: 50 }, (_, i) => ({
      id: `notification-${i}`,
      message: `Test notification ${i}`,
      priority: ['low', 'medium', 'high'][i % 3],
      timestamp: new Date().toISOString(),
    })),
    projects: TEST_PROJECTS,
  };
}

function authenticateUser(user, authToken) {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: 'test-password',
  }, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth' },
  });

  check(loginResponse, {
    'Login successful': (r) => r.status === 200,
    'Auth token received': (r) => r.json('token') !== undefined,
  });

  return loginResponse.json('token') || authToken;
}

function loadDashboard(authToken) {
  const dashboardResponse = http.get(`${BASE_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    tags: { endpoint: 'dashboard' },
  });

  check(dashboardResponse, {
    'Dashboard loaded': (r) => r.status === 200,
    'Dashboard contains widgets': (r) => r.body.includes('dashboard-overview'),
  });

  // 대시보드 API 데이터 로드
  const apiRequests = [
    { url: '/api/notifications', name: 'notifications' },
    { url: '/api/invitations', name: 'invitations' },
    { url: '/api/projects', name: 'projects' },
    { url: '/api/dashboard/stats', name: 'stats' },
  ];

  apiRequests.forEach(api => {
    const response = http.get(`${BASE_URL}${api.url}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { endpoint: api.name },
    });

    check(response, {
      [`${api.name} API success`]: (r) => r.status === 200,
      [`${api.name} response time OK`]: (r) => r.timings.duration < 500,
    });
  });
}

function interactWithNotifications(authToken) {
  // 알림 목록 조회
  const notificationsResponse = http.get(`${BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    tags: { endpoint: 'notifications' },
  });

  if (notificationsResponse.status === 200) {
    const notifications = notificationsResponse.json() || [];
    
    if (notifications.length > 0) {
      // 첫 번째 알림 읽음 처리
      const firstNotification = notifications[0];
      const markReadResponse = http.post(
        `${BASE_URL}/api/notifications/${firstNotification.id}/read`,
        {},
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          tags: { endpoint: 'mark_read' },
        }
      );

      check(markReadResponse, {
        'Notification marked as read': (r) => r.status === 200,
      });
    }
  }

  // 알림 필터링 테스트
  const filterResponse = http.get(
    `${BASE_URL}/api/notifications?priority=high&status=unread`,
    {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { endpoint: 'notifications_filter' },
    }
  );

  check(filterResponse, {
    'Filtered notifications loaded': (r) => r.status === 200,
  });
}

function manageProjects(authToken) {
  // 프로젝트 목록 조회
  const projectsResponse = http.get(`${BASE_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    tags: { endpoint: 'projects' },
  });

  check(projectsResponse, {
    'Projects loaded': (r) => r.status === 200,
  });

  // 새 프로젝트 생성 (10% 확률)
  if (Math.random() < 0.1) {
    const newProject = TEST_PROJECTS[Math.floor(Math.random() * TEST_PROJECTS.length)];
    const createResponse = http.post(`${BASE_URL}/api/projects`, newProject, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'create_project' },
    });

    check(createResponse, {
      'Project created successfully': (r) => r.status === 201,
    });
  }

  // 프로젝트 상세 조회 (기존 프로젝트 중 랜덤 선택)
  const projectDetailResponse = http.get(`${BASE_URL}/api/projects/project-1`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    tags: { endpoint: 'project_detail' },
  });

  check(projectDetailResponse, {
    'Project details loaded': (r) => r.status === 200,
  });
}

function collaborativeActions(authToken) {
  // 댓글 작성 (20% 확률)
  if (Math.random() < 0.2) {
    const commentResponse = http.post(`${BASE_URL}/api/comments`, {
      projectId: 'project-1',
      content: `Load test comment from VU ${__VU}`,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'create_comment' },
    });

    check(commentResponse, {
      'Comment created': (r) => r.status === 201,
    });
  }

  // 초대 발송 (5% 확률)
  if (Math.random() < 0.05) {
    const inviteResponse = http.post(`${BASE_URL}/api/invitations`, {
      email: `loadtest${__VU}@example.com`,
      role: 'collaborator',
      projectId: 'project-1',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'send_invitation' },
    });

    check(inviteResponse, {
      'Invitation sent': (r) => r.status === 201,
    });
  }
}

// 테스트 종료 후 정리
export function teardown(data) {
  console.log('🏁 Load Test Completed');
  
  // 테스트 결과 요약 (실제로는 외부 모니터링 시스템으로 전송)
  console.log('📊 Test Summary:');
  console.log(`- Total VUs: ${__ENV.K6_VUS || 'auto'}`);
  console.log(`- Duration: ${__ENV.K6_DURATION || 'variable'}`);
  console.log(`- Base URL: ${BASE_URL}`);
}

// 유틸리티 함수들
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>VideoPlanet Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .passed { color: green; }
        .failed { color: red; }
    </style>
</head>
<body>
    <h1>VideoPlanet Load Test Results</h1>
    <h2>Overall Results</h2>
    <div class="metric">
        <strong>Total Requests:</strong> ${data.metrics.http_reqs?.values?.count || 0}
    </div>
    <div class="metric">
        <strong>Failed Requests:</strong> ${data.metrics.http_req_failed?.values?.rate || 0}%
    </div>
    <div class="metric">
        <strong>Average Response Time:</strong> ${Math.round(data.metrics.http_req_duration?.values?.avg || 0)}ms
    </div>
    <div class="metric">
        <strong>95th Percentile:</strong> ${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms
    </div>
    
    <h2>Threshold Results</h2>
    ${Object.entries(data.thresholds || {}).map(([name, threshold]) => 
      `<div class="metric ${threshold.ok ? 'passed' : 'failed'}">
         <strong>${name}:</strong> ${threshold.ok ? 'PASSED' : 'FAILED'}
       </div>`
    ).join('')}
</body>
</html>`;
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = `${indent}📊 VideoPlanet Load Test Summary\n`;
  summary += `${indent}================================\n`;
  
  if (data.metrics.http_reqs) {
    summary += `${indent}Total HTTP Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Failed Requests: ${failRate}%\n`;
  }
  
  if (data.metrics.http_req_duration) {
    summary += `${indent}Avg Response Time: ${Math.round(data.metrics.http_req_duration.values.avg)}ms\n`;
    summary += `${indent}95th Percentile: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms\n`;
  }
  
  return summary;
}