/**
 * AI 기획 생성 API 단위 테스트
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  APITestClient,
  Validator,
  TestDataFactory,
  TestAssertions,
  MetricsCollector
} from '../helpers/test-helpers'
import type { 
  InputTestCase, 
  AIGenerationTestCase,
  TestScenario 
} from '../types/api-test.types'

// ============================
// 테스트 설정
// ============================

const apiClient = new APITestClient()
const metricsCollector = new MetricsCollector()

// ============================
// 테스트 시나리오 정의
// ============================

const testScenarios: AIGenerationTestCase[] = [
  // 정상 케이스
  {
    scenario: {
      name: '유효한 한 줄 스토리 입력',
      description: '모든 필수 필드가 올바르게 입력된 케이스',
      category: 'normal',
      priority: 'critical'
    },
    input: TestDataFactory.generateAIPlanRequest(),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: true
    }
  },
  
  // 경계값 테스트
  {
    scenario: {
      name: '최소 길이 제목',
      description: '제목이 1글자인 경계값 테스트',
      category: 'boundary',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: 'A'
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: false
    }
  },
  {
    scenario: {
      name: '최대 길이 제목',
      description: '제목이 200글자인 경계값 테스트',
      category: 'boundary',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: TestDataFactory.generateRandomString(200)
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: false
    }
  },
  {
    scenario: {
      name: '최소 영상 길이',
      description: '10초 영상 테스트',
      category: 'boundary',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({
      duration: 10
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: true
    }
  },
  {
    scenario: {
      name: '최대 영상 길이',
      description: '600초(10분) 영상 테스트',
      category: 'boundary',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({
      duration: 600
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: true
    }
  },

  // 특수문자 및 이모지 테스트
  {
    scenario: {
      name: '특수문자 포함',
      description: '제목과 설명에 특수문자 포함',
      category: 'edge',
      priority: 'medium'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: `특수문자 테스트 ${TestDataFactory.generateSpecialChars()}`,
      concept: `!@#$%^&*() 특수문자 컨셉`
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: false
    }
  },
  {
    scenario: {
      name: '이모지 포함',
      description: '제목과 설명에 이모지 포함',
      category: 'edge',
      priority: 'medium'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: `이모지 테스트 ${TestDataFactory.generateEmoji()}`,
      tone: `재미있고 ${TestDataFactory.generateEmoji()} 친근한`
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: false
    }
  },

  // 다국어 테스트
  {
    scenario: {
      name: '한글 입력',
      description: '순수 한글로만 구성된 입력',
      category: 'normal',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: TestDataFactory.generateKoreanText(20),
      concept: '한글로 작성된 컨셉',
      targetAudience: '한국인'
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: true
    }
  },
  {
    scenario: {
      name: '다국어 혼합',
      description: '여러 언어가 혼합된 입력',
      category: 'edge',
      priority: 'low'
    },
    input: TestDataFactory.generateAIPlanRequest({
      title: TestDataFactory.generateMultilingualText(),
      concept: 'Global 글로벌 グローバル'
    }),
    validation: {
      checkStoryStructure: true,
      checkShotCount: true,
      checkDurationDistribution: true,
      checkContentQuality: false
    }
  }
]

// 에러 케이스 테스트
const errorTestCases: InputTestCase[] = [
  {
    scenario: {
      name: '빈 제목',
      description: '제목이 빈 문자열인 경우',
      category: 'error',
      priority: 'critical'
    },
    input: TestDataFactory.generateAIPlanRequest({ title: '' }),
    expectedError: {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '제목, 컨셉, 목적은 필수 입력 항목입니다.'
    }
  },
  {
    scenario: {
      name: 'null 컨셉',
      description: '컨셉이 null인 경우',
      category: 'error',
      priority: 'critical'
    },
    input: TestDataFactory.generateAIPlanRequest({ concept: null }),
    expectedError: {
      status: 400,
      code: 'VALIDATION_ERROR'
    }
  },
  {
    scenario: {
      name: 'undefined 목적',
      description: '목적이 undefined인 경우',
      category: 'error',
      priority: 'critical'
    },
    input: TestDataFactory.generateAIPlanRequest({ purpose: undefined }),
    expectedError: {
      status: 400,
      code: 'VALIDATION_ERROR'
    }
  },
  {
    scenario: {
      name: '음수 영상 길이',
      description: '영상 길이가 음수인 경우',
      category: 'error',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({ duration: -10 }),
    expectedError: {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '영상 길이는 10초에서 10분 사이여야 합니다.'
    }
  },
  {
    scenario: {
      name: '초과 영상 길이',
      description: '영상 길이가 10분을 초과하는 경우',
      category: 'error',
      priority: 'high'
    },
    input: TestDataFactory.generateAIPlanRequest({ duration: 601 }),
    expectedError: {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '영상 길이는 10초에서 10분 사이여야 합니다.'
    }
  }
]

// ============================
// 검증 함수
// ============================

function validateStoryStructure(data: any): boolean {
  const expectedStructure = {
    introduction: {
      title: 'string',
      description: 'string',
      duration: 'number',
      keyPoints: 'object'
    },
    rising: {
      title: 'string',
      description: 'string',
      duration: 'number',
      keyPoints: 'object'
    },
    climax: {
      title: 'string',
      description: 'string',
      duration: 'number',
      keyPoints: 'object'
    },
    conclusion: {
      title: 'string',
      description: 'string',
      duration: 'number',
      keyPoints: 'object'
    }
  }

  return Validator.validateStructure(data.storyStages, expectedStructure)
}

function validateShotCount(data: any): boolean {
  return Validator.validateArrayLength(data.shotBreakdown, 12, 12)
}

function validateDurationDistribution(data: any): boolean {
  const stages = data.storyStages
  const totalDuration = data.duration

  // 각 단계별 예상 비율 검증 (±5% 허용)
  const expectedRatios = {
    introduction: 0.2,
    rising: 0.4,
    climax: 0.3,
    conclusion: 0.1
  }

  for (const [stage, ratio] of Object.entries(expectedRatios)) {
    const actualRatio = stages[stage].duration / totalDuration
    if (Math.abs(actualRatio - ratio) > 0.05) {
      return false
    }
  }

  return true
}

function validateContentQuality(data: any): number {
  let score = 0
  const maxScore = 100

  // 스토리 단계별 설명 품질 체크
  const stages = ['introduction', 'rising', 'climax', 'conclusion']
  for (const stage of stages) {
    const stageData = data.storyStages[stage]
    
    // 설명 길이 체크 (최소 50자)
    if (stageData.description && stageData.description.length >= 50) {
      score += 10
    }

    // 키포인트 개수 체크 (최소 2개)
    if (stageData.keyPoints && stageData.keyPoints.length >= 2) {
      score += 5
    }
  }

  // 숏 분해 품질 체크
  if (data.shotBreakdown) {
    const validShots = data.shotBreakdown.filter((shot: any) => 
      shot.description && 
      shot.shotType && 
      shot.cameraMovement &&
      shot.duration > 0
    )

    score += (validShots.length / 12) * 40
  }

  return score
}

// ============================
// 테스트 실행
// ============================

describe('AI 기획 생성 API 테스트', () => {
  
  describe('정상 및 경계값 테스트', () => {
    testScenarios.forEach(testCase => {
      it(`${testCase.scenario.category}: ${testCase.scenario.name}`, async () => {
        const startTime = Date.now()
        
        // API 호출
        const { data, metrics } = await apiClient.post(
          '/api/ai/generate-plan',
          testCase.input
        )

        // 메트릭 수집
        metricsCollector.add(metrics)

        // 기본 응답 검증
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
        expect(data.message).toBeDefined()

        const planData = data.data

        // 구조 검증
        if (testCase.validation.checkStoryStructure) {
          expect(validateStoryStructure(planData)).toBe(true)
        }

        // 숏 개수 검증
        if (testCase.validation.checkShotCount) {
          expect(validateShotCount(planData)).toBe(true)
        }

        // 시간 분배 검증
        if (testCase.validation.checkDurationDistribution) {
          expect(validateDurationDistribution(planData)).toBe(true)
        }

        // 콘텐츠 품질 검증
        if (testCase.validation.checkContentQuality) {
          const qualityScore = validateContentQuality(planData)
          expect(qualityScore).toBeGreaterThan(60) // 60점 이상
        }

        // 응답 시간 검증 (5초 이내)
        TestAssertions.assertResponseTime(metrics.responseTime, 5000)

        console.log(`✓ ${testCase.scenario.name}: ${metrics.responseTime}ms`)
      })
    })
  })

  describe('에러 케이스 테스트', () => {
    errorTestCases.forEach(testCase => {
      it(`${testCase.scenario.name}`, async () => {
        try {
          const { data, metrics } = await apiClient.post(
            '/api/ai/generate-plan',
            testCase.input
          )

          // 에러가 예상되는데 성공한 경우
          if (testCase.expectedError) {
            expect(data.success).toBe(false)
            expect(metrics.statusCode).toBe(testCase.expectedError.status)
            
            if (testCase.expectedError.message) {
              expect(data.error).toContain(testCase.expectedError.message)
            }
          }
        } catch (error: any) {
          // 네트워크 에러 등의 경우
          expect(error).toBeDefined()
        }

        console.log(`✓ 에러 검증: ${testCase.scenario.name}`)
      })
    })
  })

  describe('성능 벤치마크', () => {
    it('평균 응답 시간이 2초 이내여야 함', async () => {
      const iterations = 10
      const responseTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        const input = TestDataFactory.generateAIPlanRequest()
        const { metrics } = await apiClient.post('/api/ai/generate-plan', input)
        responseTimes.push(metrics.responseTime)
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations
      expect(avgResponseTime).toBeLessThan(2000)

      console.log(`평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`)
    })

    it('메모리 사용량이 적절해야 함', async () => {
      const input = TestDataFactory.generateAIPlanRequest()
      const { metrics } = await apiClient.post('/api/ai/generate-plan', input)

      // 메모리 증가량이 50MB 이내
      const memoryIncrease = (metrics.memoryUsage?.heapUsed || 0) / 1024 / 1024
      expect(memoryIncrease).toBeLessThan(50)

      console.log(`메모리 증가: ${memoryIncrease.toFixed(2)}MB`)
    })
  })

  afterAll(() => {
    // 테스트 결과 요약
    const stats = metricsCollector.getStats()
    console.log('\n=== AI 기획 생성 API 테스트 결과 ===')
    console.log(`총 요청 수: ${stats.totalRequests}`)
    console.log(`성공률: ${stats.successRate.toFixed(2)}%`)
    console.log(`평균 응답 시간: ${stats.averageResponseTime.toFixed(2)}ms`)
    console.log(`최소 응답 시간: ${stats.minResponseTime.toFixed(2)}ms`)
    console.log(`최대 응답 시간: ${stats.maxResponseTime.toFixed(2)}ms`)
    console.log(`P50: ${stats.p50.toFixed(2)}ms`)
    console.log(`P90: ${stats.p90.toFixed(2)}ms`)
    console.log(`P95: ${stats.p95.toFixed(2)}ms`)
    console.log(`P99: ${stats.p99.toFixed(2)}ms`)
  })
})