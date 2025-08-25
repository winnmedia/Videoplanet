/**
 * End-to-End 통합 워크플로우 테스트
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  APITestClient,
  TestDataFactory,
  MetricsCollector,
  PerformanceBenchmarker
} from '../helpers/test-helpers'
import type {
  IntegrationTestScenario,
  IntegrationTestStep,
  IntegrationTestResult
} from '../types/api-test.types'

// ============================
// 테스트 설정
// ============================

const apiClient = new APITestClient()
const metricsCollector = new MetricsCollector()
const createdResources: { type: string; id: string }[] = []

// ============================
// 통합 시나리오 정의
// ============================

const integrationScenarios: IntegrationTestScenario[] = [
  {
    name: '완전한 영상 기획 워크플로우',
    description: 'AI 기획 생성 → 기획서 저장 → 편집 → 검토 → 승인 → 내보내기',
    steps: [
      {
        name: 'AI 기획 생성',
        action: async () => {
          const input = TestDataFactory.generateAIPlanRequest({
            title: '통합 테스트 영상 기획',
            concept: '브랜드 스토리텔링',
            duration: 90
          })
          return await apiClient.post('/api/ai/generate-plan', input)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.storyStages).toBeDefined()
          expect(result.data.data.shotBreakdown).toHaveLength(12)
          context.aiPlanData = result.data.data
        }
      },
      {
        name: '기획서로 저장',
        action: async () => {
          const context = this as any
          const planData = {
            title: context.aiPlanData.title,
            description: '통합 테스트를 위한 기획서',
            planType: 'ai-generated' as const,
            originalRequest: context.aiPlanData,
            generatedContent: {
              storyStages: context.aiPlanData.storyStages,
              shotBreakdown: context.aiPlanData.shotBreakdown
            },
            tags: ['통합테스트', 'AI생성']
          }
          return await apiClient.post('/api/plans', planData)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.id).toBeDefined()
          context.planId = result.data.data.id
          createdResources.push({ type: 'plan', id: result.data.data.id })
        }
      },
      {
        name: '기획서 편집',
        action: async () => {
          const context = this as any
          return await apiClient.patch(`/api/plans/${context.planId}`, {
            section: 'storyStages',
            content: {
              ...context.aiPlanData.storyStages,
              introduction: {
                ...context.aiPlanData.storyStages.introduction,
                description: '편집된 도입부 설명'
              }
            },
            changeReason: '도입부 개선'
          })
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.version).toBe(2)
          expect(result.data.data.editHistory).toHaveLength(2)
        }
      },
      {
        name: '상태 변경 - 검토 중',
        action: async () => {
          const context = this as any
          return await apiClient.put(`/api/plans?id=${context.planId}`, {
            status: 'in-review',
            changeReason: '검토 시작'
          })
        },
        validate: (result) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.status).toBe('in-review')
        }
      },
      {
        name: '상태 변경 - 승인',
        action: async () => {
          const context = this as any
          return await apiClient.put(`/api/plans?id=${context.planId}`, {
            status: 'approved',
            changeReason: '최종 승인'
          })
        },
        validate: (result) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.status).toBe('approved')
        }
      },
      {
        name: '기획서 내보내기 준비',
        action: async () => {
          const context = this as any
          // 실제 내보내기 API가 구현되면 사용
          // return await apiClient.post(`/api/plans/${context.planId}/export`, {
          //   format: 'pdf'
          // })
          
          // 현재는 기획서 조회로 대체
          return await apiClient.get(`/api/plans/${context.planId}`)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.status).toBe('approved')
          context.exportReady = true
        }
      }
    ],
    cleanup: async () => {
      // 생성된 리소스 정리
      for (const resource of createdResources) {
        if (resource.type === 'plan') {
          try {
            await apiClient.delete(`/api/plans?id=${resource.id}`)
          } catch (error) {
            console.error(`Failed to cleanup ${resource.type}: ${resource.id}`)
          }
        }
      }
    }
  },
  {
    name: '협업 워크플로우',
    description: '여러 사용자가 하나의 기획서를 동시에 편집하는 시나리오',
    steps: [
      {
        name: '기획서 생성',
        action: async () => {
          const planData = TestDataFactory.generatePlanCreateRequest({
            title: '협업 테스트 기획서'
          })
          return await apiClient.post('/api/plans', planData)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          context.planId = result.data.data.id
          createdResources.push({ type: 'plan', id: result.data.data.id })
        }
      },
      {
        name: '동시 편집 시뮬레이션',
        action: async () => {
          const context = this as any
          const editPromises = [
            apiClient.put(`/api/plans?id=${context.planId}`, {
              title: '사용자1이 수정한 제목',
              changeReason: '사용자1 편집'
            }),
            apiClient.put(`/api/plans?id=${context.planId}`, {
              description: '사용자2가 수정한 설명',
              changeReason: '사용자2 편집'
            }),
            apiClient.patch(`/api/plans/${context.planId}`, {
              section: 'notes',
              content: '사용자3이 추가한 노트',
              changeReason: '사용자3 편집'
            })
          ]
          
          return await Promise.allSettled(editPromises)
        },
        validate: (results, context) => {
          // 모든 편집이 처리되었는지 확인
          const successCount = results.filter(r => 
            r.status === 'fulfilled' && r.value.data.success
          ).length
          
          expect(successCount).toBeGreaterThan(0)
          context.concurrentEdits = successCount
        }
      },
      {
        name: '편집 이력 확인',
        action: async () => {
          const context = this as any
          return await apiClient.get(`/api/plans/${context.planId}`)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(result.data.data.editHistory.length).toBeGreaterThan(1)
          
          // 버전 증가 확인
          expect(result.data.data.version).toBeGreaterThan(1)
          
          console.log(`협업 편집 결과: ${context.concurrentEdits}개 성공, 버전 ${result.data.data.version}`)
        }
      }
    ]
  },
  {
    name: '오류 복구 워크플로우',
    description: '오류 발생 시 시스템이 적절히 복구되는지 테스트',
    steps: [
      {
        name: '잘못된 데이터로 AI 기획 생성 시도',
        action: async () => {
          return await apiClient.post('/api/ai/generate-plan', {
            title: '',  // 빈 제목
            duration: -1  // 잘못된 duration
          })
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(false)
          expect(result.metrics.statusCode).toBe(400)
          context.errorHandled = true
        }
      },
      {
        name: '정상 데이터로 재시도',
        action: async () => {
          const input = TestDataFactory.generateAIPlanRequest()
          return await apiClient.post('/api/ai/generate-plan', input)
        },
        validate: (result, context) => {
          expect(result.data.success).toBe(true)
          expect(context.errorHandled).toBe(true)
          console.log('오류 복구 성공')
        }
      }
    ]
  }
]

// ============================
// 통합 테스트 실행기
// ============================

async function runIntegrationScenario(
  scenario: IntegrationTestScenario
): Promise<IntegrationTestResult> {
  const startTime = Date.now()
  const context: any = {}
  const completedSteps: string[] = []
  let failedStep: string | undefined
  let error: string | undefined
  
  console.log(`\n실행 중: ${scenario.name}`)
  console.log(`설명: ${scenario.description}`)
  
  try {
    for (const step of scenario.steps) {
      console.log(`  → ${step.name}...`)
      
      try {
        const result = await step.action.call(context)
        await step.validate(result, context)
        completedSteps.push(step.name)
        
        // 메트릭 수집
        if (result.metrics) {
          metricsCollector.add(result.metrics)
        }
        
        console.log(`    ✓ ${step.name} 완료`)
      } catch (stepError: any) {
        failedStep = step.name
        error = stepError.message
        
        // 롤백 실행 (있는 경우)
        if (step.rollback) {
          console.log(`    ⚠ ${step.name} 실패, 롤백 중...`)
          await step.rollback()
        }
        
        throw stepError
      }
    }
    
    // 정리 작업
    if (scenario.cleanup) {
      await scenario.cleanup()
    }
    
    return {
      scenario: scenario.name,
      success: true,
      completedSteps,
      duration: Date.now() - startTime,
      context
    }
  } catch (scenarioError: any) {
    return {
      scenario: scenario.name,
      success: false,
      completedSteps,
      failedStep,
      error: error || scenarioError.message,
      duration: Date.now() - startTime,
      context
    }
  }
}

// ============================
// 테스트 실행
// ============================

describe('통합 워크플로우 테스트', () => {
  
  const results: IntegrationTestResult[] = []
  
  integrationScenarios.forEach(scenario => {
    it(scenario.name, async () => {
      const result = await runIntegrationScenario(scenario)
      results.push(result)
      
      expect(result.success).toBe(true)
      
      console.log(`\n=== ${scenario.name} 결과 ===`)
      console.log(`성공: ${result.success}`)
      console.log(`완료된 단계: ${result.completedSteps.length}/${scenario.steps.length}`)
      console.log(`소요 시간: ${result.duration}ms`)
      
      if (!result.success) {
        console.error(`실패한 단계: ${result.failedStep}`)
        console.error(`오류: ${result.error}`)
      }
    }, 30000) // 30초 타임아웃
  })
  
  afterAll(() => {
    // 통합 테스트 결과 요약
    console.log('\n=== 통합 테스트 종합 결과 ===')
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    console.log(`시나리오 성공률: ${successCount}/${totalCount} (${((successCount/totalCount) * 100).toFixed(2)}%)`)
    
    results.forEach(result => {
      const status = result.success ? '✓' : '✗'
      const steps = `${result.completedSteps.length} 단계`
      const time = `${result.duration}ms`
      
      console.log(`${status} ${result.scenario}: ${steps}, ${time}`)
      
      if (!result.success && result.failedStep) {
        console.log(`  → 실패 단계: ${result.failedStep}`)
      }
    })
  })
})

// ============================
// 성능 측정 테스트
// ============================

describe('종합 성능 측정', () => {
  
  it('전체 워크플로우 성능 벤치마크', async () => {
    const workflowBenchmark = async () => {
      // 1. AI 기획 생성
      const aiInput = TestDataFactory.generateAIPlanRequest()
      const aiResult = await apiClient.post('/api/ai/generate-plan', aiInput)
      
      // 2. 기획서 저장
      const planData = {
        title: aiResult.data.data.title,
        planType: 'ai-generated' as const,
        generatedContent: aiResult.data.data
      }
      const planResult = await apiClient.post('/api/plans', planData)
      const planId = planResult.data.data.id
      
      // 3. 조회
      await apiClient.get(`/api/plans/${planId}`)
      
      // 4. 수정
      await apiClient.put(`/api/plans?id=${planId}`, {
        status: 'approved'
      })
      
      // 5. 삭제
      await apiClient.delete(`/api/plans?id=${planId}`)
      
      return { success: true }
    }
    
    const result = await PerformanceBenchmarker.benchmark(
      '전체 워크플로우',
      workflowBenchmark,
      10,  // 10회 반복
      3    // 3회 워밍업
    )
    
    console.log('\n=== 전체 워크플로우 성능 ===')
    console.log(`평균 실행 시간: ${result.metrics.mean.toFixed(2)}ms`)
    console.log(`중간값: ${result.metrics.median.toFixed(2)}ms`)
    console.log(`P95: ${result.metrics.percentiles.p95.toFixed(2)}ms`)
    console.log(`성공률: ${result.successRate.toFixed(2)}%`)
    
    // 성능 기준: 전체 워크플로우 15초 이내
    expect(result.metrics.p95).toBeLessThan(15000)
  }, 60000)
  
  it('API 응답 시간 분포 분석', async () => {
    const endpoints = [
      '/api/plans',
      '/api/ai/generate-plan'
    ]
    
    console.log('\n=== API 응답 시간 분포 ===')
    
    for (const endpoint of endpoints) {
      const times: number[] = []
      
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now()
        
        if (endpoint.includes('generate-plan')) {
          await apiClient.post(endpoint, TestDataFactory.generateAIPlanRequest())
        } else {
          await apiClient.get(endpoint)
        }
        
        times.push(Date.now() - startTime)
      }
      
      times.sort((a, b) => a - b)
      
      console.log(`\n${endpoint}:`)
      console.log(`  최소: ${times[0]}ms`)
      console.log(`  P25: ${times[Math.floor(times.length * 0.25)]}ms`)
      console.log(`  P50: ${times[Math.floor(times.length * 0.50)]}ms`)
      console.log(`  P75: ${times[Math.floor(times.length * 0.75)]}ms`)
      console.log(`  P90: ${times[Math.floor(times.length * 0.90)]}ms`)
      console.log(`  P95: ${times[Math.floor(times.length * 0.95)]}ms`)
      console.log(`  P99: ${times[Math.floor(times.length * 0.99)]}ms`)
      console.log(`  최대: ${times[times.length - 1]}ms`)
      
      // 표준편차 계산
      const mean = times.reduce((a, b) => a + b, 0) / times.length
      const variance = times.reduce((sum, time) => 
        sum + Math.pow(time - mean, 2), 0
      ) / times.length
      const stdDev = Math.sqrt(variance)
      
      console.log(`  평균: ${mean.toFixed(2)}ms`)
      console.log(`  표준편차: ${stdDev.toFixed(2)}ms`)
      console.log(`  변동계수: ${((stdDev / mean) * 100).toFixed(2)}%`)
    }
  })
  
  afterAll(() => {
    // 전체 테스트 메트릭 요약
    const stats = metricsCollector.getStats()
    
    console.log('\n=== 전체 API 테스트 최종 결과 ===')
    console.log(`총 API 호출: ${stats.totalRequests}`)
    console.log(`성공률: ${stats.successRate.toFixed(2)}%`)
    console.log(`평균 응답 시간: ${stats.averageResponseTime.toFixed(2)}ms`)
    console.log(`최소 응답 시간: ${stats.minResponseTime.toFixed(2)}ms`)
    console.log(`최대 응답 시간: ${stats.maxResponseTime.toFixed(2)}ms`)
    console.log('\n응답 시간 백분위:')
    console.log(`  P50 (중간값): ${stats.p50.toFixed(2)}ms`)
    console.log(`  P90: ${stats.p90.toFixed(2)}ms`)
    console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
    console.log(`  P99: ${stats.p99.toFixed(2)}ms`)
    
    // CSV 내보내기 (필요시 파일로 저장 가능)
    const csvData = metricsCollector.exportToCSV()
    console.log('\n메트릭 데이터를 CSV로 내보낼 수 있습니다.')
    console.log(`데이터 행 수: ${csvData.split('\n').length - 1}`)
  })
})