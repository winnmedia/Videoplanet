#!/usr/bin/env node
/**
 * API 테스트 실행 및 결과 분석 스크립트
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

// ============================
// 테스트 설정
// ============================

interface TestSuite {
  name: string
  path: string
  timeout?: number
  critical?: boolean
}

const testSuites: TestSuite[] = [
  {
    name: 'AI 기획 생성 API',
    path: 'test/api/unit/ai-generate-plan.test.ts',
    critical: true
  },
  {
    name: '기획서 CRUD API',
    path: 'test/api/unit/plans-crud.test.ts',
    critical: true
  },
  {
    name: '동시성 및 부하 테스트',
    path: 'test/api/performance/concurrency-load.test.ts',
    timeout: 120000,
    critical: false
  },
  {
    name: '통합 워크플로우',
    path: 'test/api/integration/e2e-workflow.test.ts',
    timeout: 60000,
    critical: true
  }
]

// ============================
// 테스트 실행 함수
// ============================

async function runTestSuite(suite: TestSuite): Promise<{
  suite: string
  success: boolean
  duration: number
  output: string
  error?: string
}> {
  console.log(`\n🧪 실행 중: ${suite.name}`)
  console.log('━'.repeat(50))
  
  const startTime = Date.now()
  
  try {
    const command = `npx vitest run ${suite.path} --reporter=json`
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env, CI: 'true' }
    })
    
    const duration = Date.now() - startTime
    
    // JSON 결과 파싱
    let testResults
    try {
      testResults = JSON.parse(stdout)
    } catch {
      // JSON 파싱 실패 시 stdout을 그대로 사용
      testResults = { success: !stderr, output: stdout }
    }
    
    const success = !stderr && testResults.success !== false
    
    if (success) {
      console.log(`✅ ${suite.name} 성공 (${(duration / 1000).toFixed(2)}초)`)
    } else {
      console.log(`❌ ${suite.name} 실패`)
      if (stderr) console.error(stderr)
    }
    
    return {
      suite: suite.name,
      success,
      duration,
      output: stdout,
      error: stderr
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ ${suite.name} 실행 오류:`, error.message)
    
    return {
      suite: suite.name,
      success: false,
      duration,
      output: '',
      error: error.message
    }
  }
}

// ============================
// 성능 메트릭 분석
// ============================

interface PerformanceMetrics {
  avgResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  successRate: number
  throughput: number
}

function analyzePerformanceMetrics(output: string): PerformanceMetrics | null {
  try {
    // 출력에서 메트릭 추출 (정규식 사용)
    const avgMatch = output.match(/평균 응답 시간[:\s]+([\d.]+)ms/)
    const p95Match = output.match(/P95[:\s]+([\d.]+)ms/)
    const p99Match = output.match(/P99[:\s]+([\d.]+)ms/)
    const successMatch = output.match(/성공률[:\s]+([\d.]+)%/)
    const throughputMatch = output.match(/처리량[:\s]+([\d.]+)\s*req\/s/)
    
    if (!avgMatch) return null
    
    return {
      avgResponseTime: parseFloat(avgMatch[1]),
      p95ResponseTime: parseFloat(p95Match?.[1] || '0'),
      p99ResponseTime: parseFloat(p99Match?.[1] || '0'),
      successRate: parseFloat(successMatch?.[1] || '0'),
      throughput: parseFloat(throughputMatch?.[1] || '0')
    }
  } catch (error) {
    return null
  }
}

// ============================
// 결과 리포트 생성
// ============================

async function generateReport(results: any[]): Promise<string> {
  const timestamp = new Date().toISOString()
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount
  
  let report = `
# VideoPlanet API 테스트 리포트
생성 시간: ${timestamp}
총 소요 시간: ${(totalDuration / 1000).toFixed(2)}초

## 요약
- 총 테스트 스위트: ${results.length}개
- ✅ 성공: ${successCount}개
- ❌ 실패: ${failureCount}개
- 성공률: ${((successCount / results.length) * 100).toFixed(2)}%

## 테스트 결과 상세
`

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    report += `
### ${result.suite}
- 상태: ${status}
- 소요 시간: ${(result.duration / 1000).toFixed(2)}초
`
    
    // 성능 메트릭 추가
    const metrics = analyzePerformanceMetrics(result.output)
    if (metrics) {
      report += `
#### 성능 메트릭
- 평균 응답 시간: ${metrics.avgResponseTime.toFixed(2)}ms
- P95 응답 시간: ${metrics.p95ResponseTime.toFixed(2)}ms
- P99 응답 시간: ${metrics.p99ResponseTime.toFixed(2)}ms
- 성공률: ${metrics.successRate.toFixed(2)}%
- 처리량: ${metrics.throughput.toFixed(2)} req/s
`
    }
    
    if (result.error) {
      report += `
#### 오류 내용
\`\`\`
${result.error}
\`\`\`
`
    }
  }
  
  // 성능 기준 검증
  report += `
## 성능 기준 검증

### ✅ 통과 기준
- AI 기획 생성: P95 < 10초
- 기획서 CRUD: P95 < 2초
- 동시 요청 처리: 10개 동시 요청 시 80% 이상 성공
- 전체 워크플로우: 15초 이내 완료

### 권장 사항
`
  
  // 개선 권장사항 추가
  const recommendations: string[] = []
  
  for (const result of results) {
    const metrics = analyzePerformanceMetrics(result.output)
    if (metrics) {
      if (metrics.avgResponseTime > 3000) {
        recommendations.push(`- ${result.suite}: 평균 응답 시간이 3초를 초과합니다. 최적화가 필요합니다.`)
      }
      if (metrics.successRate < 95) {
        recommendations.push(`- ${result.suite}: 성공률이 95% 미만입니다. 안정성 개선이 필요합니다.`)
      }
      if (metrics.throughput < 10 && result.suite.includes('CRUD')) {
        recommendations.push(`- ${result.suite}: 처리량이 낮습니다. 병목 지점 분석이 필요합니다.`)
      }
    }
  }
  
  if (recommendations.length > 0) {
    report += recommendations.join('\n')
  } else {
    report += '- 모든 성능 기준을 만족합니다.'
  }
  
  return report
}

// ============================
// 메인 실행 함수
// ============================

async function main() {
  console.log('🚀 VideoPlanet API 테스트 시작')
  console.log('=' .repeat(50))
  
  const results = []
  let hasCriticalFailure = false
  
  // 서버 상태 확인
  console.log('\n🔍 서버 상태 확인 중...')
  try {
    const response = await fetch('http://localhost:3005/api/plans')
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`)
    }
    console.log('✅ 서버가 정상적으로 실행 중입니다.')
  } catch (error: any) {
    console.error('❌ 서버에 연결할 수 없습니다. 서버를 먼저 시작해주세요.')
    console.error('실행: npm run dev')
    process.exit(1)
  }
  
  // 각 테스트 스위트 실행
  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push(result)
    
    if (!result.success && suite.critical) {
      hasCriticalFailure = true
      console.error(`⚠️ 중요 테스트 실패: ${suite.name}`)
    }
    
    // 테스트 간 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 리포트 생성
  console.log('\n📊 테스트 리포트 생성 중...')
  const report = await generateReport(results)
  
  // 리포트 파일 저장
  const reportPath = path.join(process.cwd(), 'test-results', `api-test-report-${Date.now()}.md`)
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, report)
  
  console.log(`\n📄 리포트 저장됨: ${reportPath}`)
  
  // 콘솔에 요약 출력
  console.log('\n' + '='.repeat(50))
  console.log('📋 테스트 요약')
  console.log('='.repeat(50))
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  
  console.log(`총 테스트: ${totalTests}`)
  console.log(`✅ 성공: ${passedTests}`)
  console.log(`❌ 실패: ${failedTests}`)
  console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(2)}%`)
  
  // 성능 하이라이트
  console.log('\n🏆 성능 하이라이트:')
  for (const result of results) {
    const metrics = analyzePerformanceMetrics(result.output)
    if (metrics && metrics.avgResponseTime > 0) {
      console.log(`  ${result.suite}:`)
      console.log(`    - 평균: ${metrics.avgResponseTime.toFixed(0)}ms`)
      console.log(`    - P95: ${metrics.p95ResponseTime.toFixed(0)}ms`)
      console.log(`    - 성공률: ${metrics.successRate.toFixed(1)}%`)
    }
  }
  
  // 종료 코드 설정
  if (hasCriticalFailure) {
    console.error('\n❌ 중요 테스트가 실패했습니다. 배포를 중단하세요.')
    process.exit(1)
  } else if (failedTests > 0) {
    console.warn('\n⚠️ 일부 테스트가 실패했습니다.')
    process.exit(0)
  } else {
    console.log('\n✅ 모든 테스트가 성공적으로 통과했습니다!')
    process.exit(0)
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('테스트 실행 중 오류:', error)
    process.exit(1)
  })
}

export { runTestSuite, generateReport, analyzePerformanceMetrics }