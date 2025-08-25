/**
 * API 연동 테스트 엔드포인트
 * /api/test로 접근하여 API 연결 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG, API_ENDPOINTS } from '@/shared/api/config'

// 테스트할 엔드포인트 목록
const TEST_ENDPOINTS = [
  { name: 'Health Check', endpoint: API_ENDPOINTS.HEALTH, method: 'GET' },
  { name: 'API Info', endpoint: API_ENDPOINTS.INFO, method: 'GET' },
  { name: 'Dashboard Stats', endpoint: API_ENDPOINTS.DASHBOARD_STATS, method: 'GET' },
  { name: 'Projects List', endpoint: API_ENDPOINTS.PROJECTS, method: 'GET' },
  { name: 'Feedbacks List', endpoint: API_ENDPOINTS.FEEDBACKS, method: 'GET' },
  { name: 'Notifications', endpoint: API_ENDPOINTS.NOTIFICATIONS, method: 'GET' },
]

// 단일 엔드포인트 테스트
async function testEndpoint(endpoint: string, method: string = 'GET') {
  const url = API_CONFIG.USE_MOCK_API 
    ? `http://localhost:3000${endpoint}`
    : `${API_CONFIG.API_BASE_URL}${endpoint}`
  
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // 타임아웃 설정
      signal: AbortSignal.timeout(5000),
    })
    const responseTime = Date.now() - startTime
    
    let data = null
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }
    } else {
      data = await response.text()
    }
    
    return {
      endpoint,
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime,
      data: data ? (typeof data === 'object' ? Object.keys(data) : data.substring(0, 100)) : null,
      error: null
    }
  } catch (error: any) {
    return {
      endpoint,
      url,
      status: 0,
      statusText: 'Connection Failed',
      ok: false,
      responseTime: 0,
      data: null,
      error: error.message || 'Unknown error'
    }
  }
}

export async function GET(request: NextRequest) {
  const results = []
  
  // 설정 정보
  const config = {
    mode: API_CONFIG.USE_MOCK_API ? 'Mock API' : 'Real Backend',
    apiUrl: API_CONFIG.API_BASE_URL,
    wsUrl: API_CONFIG.WS_URL,
    timestamp: new Date().toISOString()
  }
  
  // 모든 엔드포인트 테스트
  for (const test of TEST_ENDPOINTS) {
    const result = await testEndpoint(test.endpoint, test.method)
    results.push({
      name: test.name,
      ...result
    })
  }
  
  // 통계 계산
  const stats = {
    total: results.length,
    success: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    avgResponseTime: Math.round(
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    )
  }
  
  // HTML 응답 생성
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API 연동 테스트 결과</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2d3748;
      margin-bottom: 20px;
      font-size: 32px;
    }
    
    .config {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .config-item {
      display: flex;
      flex-direction: column;
    }
    
    .config-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .config-value {
      font-size: 16px;
      color: #2d3748;
      font-weight: 600;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #718096;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-success { color: #48bb78; }
    .stat-failed { color: #f56565; }
    .stat-total { color: #4299e1; }
    .stat-time { color: #9f7aea; }
    
    .results {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .results-header {
      padding: 20px 30px;
      background: #f7fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .results-header h2 {
      color: #2d3748;
      font-size: 24px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      background: #f7fafc;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
      color: #2d3748;
    }
    
    tr:hover {
      background: #f7fafc;
    }
    
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-success {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status-error {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .response-time {
      font-weight: 600;
    }
    
    .time-fast { color: #48bb78; }
    .time-medium { color: #ed8936; }
    .time-slow { color: #f56565; }
    
    .endpoint-url {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #718096;
      word-break: break-all;
    }
    
    .error-message {
      color: #e53e3e;
      font-size: 12px;
      font-style: italic;
    }
    
    .mode-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .mode-mock {
      background: #fef5e7;
      color: #f39c12;
    }
    
    .mode-real {
      background: #e8f5e9;
      color: #27ae60;
    }
    
    .refresh-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
      margin-top: 20px;
    }
    
    .refresh-btn:hover {
      transform: scale(1.05);
    }
    
    .data-preview {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #4a5568;
      background: #f7fafc;
      padding: 4px 8px;
      border-radius: 4px;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 VideoPlanet API 연동 테스트</h1>
      
      <div class="config">
        <div class="config-item">
          <span class="config-label">모드</span>
          <span class="config-value">
            <span class="mode-badge ${config.mode === 'Mock API' ? 'mode-mock' : 'mode-real'}">
              ${config.mode}
            </span>
          </span>
        </div>
        <div class="config-item">
          <span class="config-label">API URL</span>
          <span class="config-value">${config.apiUrl}</span>
        </div>
        <div class="config-item">
          <span class="config-label">WebSocket URL</span>
          <span class="config-value">${config.wsUrl}</span>
        </div>
        <div class="config-item">
          <span class="config-label">테스트 시간</span>
          <span class="config-value">${new Date(config.timestamp).toLocaleString('ko-KR')}</span>
        </div>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value stat-total">${stats.total}</div>
        <div class="stat-label">전체 테스트</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-success">${stats.success}</div>
        <div class="stat-label">성공</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-failed">${stats.failed}</div>
        <div class="stat-label">실패</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-time">${stats.avgResponseTime}ms</div>
        <div class="stat-label">평균 응답시간</div>
      </div>
    </div>
    
    <div class="results">
      <div class="results-header">
        <h2>📊 테스트 결과 상세</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>테스트 이름</th>
            <th>엔드포인트</th>
            <th>상태</th>
            <th>응답시간</th>
            <th>데이터</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(result => `
            <tr>
              <td><strong>${result.name}</strong></td>
              <td>
                <div class="endpoint-url">${result.endpoint}</div>
              </td>
              <td>
                <span class="status ${result.ok ? 'status-success' : 'status-error'}">
                  ${result.status} ${result.statusText}
                </span>
                ${result.error ? `<div class="error-message">${result.error}</div>` : ''}
              </td>
              <td>
                <span class="response-time ${
                  result.responseTime < 100 ? 'time-fast' : 
                  result.responseTime < 500 ? 'time-medium' : 'time-slow'
                }">
                  ${result.responseTime}ms
                </span>
              </td>
              <td>
                ${result.data ? `<div class="data-preview">${
                  Array.isArray(result.data) ? result.data.join(', ') : result.data
                }</div>` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button class="refresh-btn" onclick="location.reload()">
        🔄 다시 테스트하기
      </button>
    </div>
  </div>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}