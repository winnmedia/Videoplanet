import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// 커스텀 메트릭
const errorRate = new Rate('errors')
const generatePlanDuration = new Trend('generate_plan_duration')
const planCRUDDuration = new Trend('plan_crud_duration')

// 테스트 설정
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 10명까지 증가
    { duration: '1m', target: 10 },    // 10명 유지
    { duration: '30s', target: 50 },   // 50명까지 증가
    { duration: '2m', target: 50 },    // 50명 유지
    { duration: '30s', target: 100 },  // 100명까지 증가
    { duration: '1m', target: 100 },   // 100명 유지
    { duration: '1m', target: 0 }      // 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],  // 95%가 10초 이내
    http_req_failed: ['rate<0.05'],      // 실패율 5% 미만
    errors: ['rate<0.05'],                // 에러율 5% 미만
    generate_plan_duration: ['p(95)<10000'],
    plan_crud_duration: ['p(95)<2000']
  }
}

const BASE_URL = 'http://localhost:3005/api'

// 테스트 데이터 생성기
function generateTestData() {
  const titles = [
    '브이래닛 홍보영상',
    'AI 기술 소개',
    '제품 데모 영상',
    '고객 후기 영상',
    '회사 문화 영상'
  ]

  const stories = [
    'AI 기술로 영상 제작을 혁신하는 브이래닛의 이야기',
    '창작자들의 시간을 10배 단축시키는 혁신적인 플랫폼',
    '누구나 쉽게 전문적인 영상을 만들 수 있는 도구',
    '영상 제작의 미래를 선도하는 기업의 비전',
    '기술과 창의성이 만나는 지점에서의 혁신'
  ]

  const genres = ['홍보영상', '광고', '다큐멘터리', '교육영상', '브랜드필름']
  const tempos = ['fast', 'normal', 'slow']
  const methods = [
    'hook-immersion-twist-clue',
    'classic-kishōtenketsu',
    'induction',
    'deduction',
    'documentary',
    'pixar-story'
  ]

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    oneLinerStory: stories[Math.floor(Math.random() * stories.length)],
    genre: genres[Math.floor(Math.random() * genres.length)],
    duration: ['30초', '60초', '90초', '120초'][Math.floor(Math.random() * 4)],
    tempo: tempos[Math.floor(Math.random() * tempos.length)],
    developmentMethod: methods[Math.floor(Math.random() * methods.length)],
    developmentIntensity: ['as-is', 'moderate', 'rich'][Math.floor(Math.random() * 3)],
    toneAndManner: ['친근한', '전문적', '감성적']
  }
}

// 시나리오 1: AI 기획 생성
export function generatePlanScenario() {
  const data = generateTestData()
  
  const startTime = Date.now()
  const response = http.post(
    `${BASE_URL}/ai/generate-plan`,
    JSON.stringify(data),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s'
    }
  )
  const duration = Date.now() - startTime
  
  generatePlanDuration.add(duration)
  
  const success = check(response, {
    '생성 성공': (r) => r.status === 200,
    'ID 존재': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.success && body.data && body.data.id
      } catch {
        return false
      }
    },
    '4단계 스토리 존재': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.data && body.data.storyStages
      } catch {
        return false
      }
    },
    '12개 숏트 존재': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.data && body.data.shotBreakdown && 
               body.data.shotBreakdown.length === 12
      } catch {
        return false
      }
    },
    '응답 시간 < 10초': (r) => duration < 10000
  })
  
  errorRate.add(!success)
  
  return response
}

// 시나리오 2: CRUD 작업
export function crudScenario() {
  // 1. 생성
  const createStartTime = Date.now()
  const createResponse = http.post(
    `${BASE_URL}/plans`,
    JSON.stringify({
      title: `성능 테스트 ${Date.now()}`,
      content: '테스트 내용'
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
  planCRUDDuration.add(Date.now() - createStartTime)
  
  const createSuccess = check(createResponse, {
    'CRUD 생성 성공': (r) => r.status === 200 || r.status === 201
  })
  
  if (!createSuccess) {
    errorRate.add(1)
    return
  }
  
  let planId
  try {
    const body = JSON.parse(createResponse.body)
    planId = body.data.id
  } catch {
    errorRate.add(1)
    return
  }
  
  // 2. 조회
  const readStartTime = Date.now()
  const readResponse = http.get(`${BASE_URL}/plans/${planId}`)
  planCRUDDuration.add(Date.now() - readStartTime)
  
  check(readResponse, {
    'CRUD 조회 성공': (r) => r.status === 200
  })
  
  // 3. 수정
  const updateStartTime = Date.now()
  const updateResponse = http.put(
    `${BASE_URL}/plans/${planId}`,
    JSON.stringify({
      title: '수정된 제목'
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
  planCRUDDuration.add(Date.now() - updateStartTime)
  
  check(updateResponse, {
    'CRUD 수정 성공': (r) => r.status === 200
  })
  
  // 4. 삭제
  const deleteStartTime = Date.now()
  const deleteResponse = http.del(`${BASE_URL}/plans/${planId}`)
  planCRUDDuration.add(Date.now() - deleteStartTime)
  
  check(deleteResponse, {
    'CRUD 삭제 성공': (r) => r.status === 200 || r.status === 204
  })
}

// 시나리오 3: 목록 조회 (페이지네이션)
export function listScenario() {
  const page = Math.floor(Math.random() * 10) + 1
  const limit = [10, 20, 50][Math.floor(Math.random() * 3)]
  
  const response = http.get(`${BASE_URL}/plans?page=${page}&limit=${limit}`)
  
  check(response, {
    '목록 조회 성공': (r) => r.status === 200,
    '페이지 정보 존재': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.data && body.data.page && body.data.limit
      } catch {
        return false
      }
    }
  })
}

// 메인 시나리오
export default function() {
  const scenario = Math.random()
  
  if (scenario < 0.6) {
    // 60% - AI 기획 생성
    generatePlanScenario()
    sleep(Math.random() * 3 + 2)  // 2-5초 대기
  } else if (scenario < 0.8) {
    // 20% - CRUD 작업
    crudScenario()
    sleep(Math.random() * 2 + 1)  // 1-3초 대기
  } else {
    // 20% - 목록 조회
    listScenario()
    sleep(Math.random() * 1 + 0.5)  // 0.5-1.5초 대기
  }
}

// 테스트 종료 후 요약
export function handleSummary(data) {
  return {
    'test/video-planning/performance/summary.json': JSON.stringify(data, null, 2),
    'test/video-planning/performance/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  }
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>성능 테스트 리포트</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .success { color: green; }
    .warning { color: orange; }
    .error { color: red; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>VideoPlanet 영상 기획 기능 성능 테스트 리포트</h1>
  
  <div class="metric">
    <h2>테스트 개요</h2>
    <p>실행 시간: ${new Date().toISOString()}</p>
    <p>총 요청 수: ${data.metrics.http_reqs.values.count}</p>
    <p>평균 응답 시간: ${Math.round(data.metrics.http_req_duration.values.avg)}ms</p>
  </div>
  
  <div class="metric">
    <h2>주요 메트릭</h2>
    <table>
      <tr>
        <th>메트릭</th>
        <th>값</th>
        <th>목표</th>
        <th>상태</th>
      </tr>
      <tr>
        <td>P95 응답 시간</td>
        <td>${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms</td>
        <td>&lt; 10000ms</td>
        <td class="${data.metrics.http_req_duration.values['p(95)'] < 10000 ? 'success' : 'error'}">
          ${data.metrics.http_req_duration.values['p(95)'] < 10000 ? '✓' : '✗'}
        </td>
      </tr>
      <tr>
        <td>실패율</td>
        <td>${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td>
        <td>&lt; 5%</td>
        <td class="${data.metrics.http_req_failed.values.rate < 0.05 ? 'success' : 'error'}">
          ${data.metrics.http_req_failed.values.rate < 0.05 ? '✓' : '✗'}
        </td>
      </tr>
      <tr>
        <td>처리량</td>
        <td>${Math.round(data.metrics.http_reqs.values.rate)} req/s</td>
        <td>-</td>
        <td>-</td>
      </tr>
    </table>
  </div>
  
  <div class="metric">
    <h2>시나리오별 성능</h2>
    <table>
      <tr>
        <th>시나리오</th>
        <th>평균 응답 시간</th>
        <th>P95</th>
        <th>P99</th>
      </tr>
      <tr>
        <td>AI 기획 생성</td>
        <td>${Math.round(data.metrics.generate_plan_duration.values.avg)}ms</td>
        <td>${Math.round(data.metrics.generate_plan_duration.values['p(95)'])}ms</td>
        <td>${Math.round(data.metrics.generate_plan_duration.values['p(99)'])}ms</td>
      </tr>
      <tr>
        <td>CRUD 작업</td>
        <td>${Math.round(data.metrics.plan_crud_duration.values.avg)}ms</td>
        <td>${Math.round(data.metrics.plan_crud_duration.values['p(95)'])}ms</td>
        <td>${Math.round(data.metrics.plan_crud_duration.values['p(99)'])}ms</td>
      </tr>
    </table>
  </div>
  
  <div class="metric">
    <h2>권장사항</h2>
    <ul>
      ${data.metrics.http_req_duration.values['p(95)'] > 10000 ? 
        '<li class="warning">AI 생성 시간이 목표를 초과합니다. 캐싱 또는 비동기 처리를 고려하세요.</li>' : ''}
      ${data.metrics.http_req_failed.values.rate > 0.05 ? 
        '<li class="error">실패율이 높습니다. 서버 용량 증설을 고려하세요.</li>' : ''}
      ${data.metrics.http_reqs.values.rate < 10 ? 
        '<li class="warning">처리량이 낮습니다. 성능 최적화가 필요할 수 있습니다.</li>' : ''}
    </ul>
  </div>
</body>
</html>
  `
}

function textSummary(data) {
  return `
========================================
VideoPlanet 성능 테스트 결과
========================================

✅ 총 요청: ${data.metrics.http_reqs.values.count}
✅ 성공률: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
✅ 평균 응답 시간: ${Math.round(data.metrics.http_req_duration.values.avg)}ms
✅ P95 응답 시간: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms

========================================
  `
}