/**
 * 동시성 및 부하 테스트
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  APITestClient,
  ConcurrencyTester,
  PerformanceBenchmarker,
  TestDataFactory,
  MetricsCollector
} from '../helpers/test-helpers'
import type {
  ConcurrencyTestConfig,
  LoadTestStage,
  LoadTestMetrics
} from '../types/api-test.types'

// ============================
// 테스트 설정
// ============================

const apiClient = new APITestClient()
const metricsCollector = new MetricsCollector()

// ============================
// 동시성 테스트
// ============================

describe('동시성 테스트', () => {
  
  describe('AI 기획 생성 API 동시성', () => {
    
    it('동시 요청 10개 처리', async () => {
      const config: ConcurrencyTestConfig = {
        concurrentRequests: 10,
        totalRequests: 10,
        requestGenerator: async () => {
          const input = TestDataFactory.generateAIPlanRequest()
          return await apiClient.post('/api/ai/generate-plan', input)
        }
      }
      
      const result = await ConcurrencyTester.run(config)
      
      expect(result.successfulRequests).toBeGreaterThan(8) // 80% 이상 성공
      expect(result.averageResponseTime).toBeLessThan(5000) // 평균 5초 이내
      
      console.log('=== AI 기획 생성 동시성 테스트 (10개) ===')
      console.log(`성공: ${result.successfulRequests}/${result.totalRequests}`)
      console.log(`평균 응답 시간: ${result.averageResponseTime.toFixed(2)}ms`)
      console.log(`P95: ${result.percentiles.p95.toFixed(2)}ms`)
      console.log(`처리량: ${result.throughput.toFixed(2)} req/s`)
    })
    
    it('점진적 부하 증가 (Ramp-up)', async () => {
      const config: ConcurrencyTestConfig = {
        concurrentRequests: 5,
        totalRequests: 30,
        rampUpTime: 3000, // 3초간 점진적 증가
        requestGenerator: async () => {
          const input = TestDataFactory.generateAIPlanRequest()
          return await apiClient.post('/api/ai/generate-plan', input)
        }
      }
      
      const result = await ConcurrencyTester.run(config)
      
      expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.7)
      
      console.log('=== 점진적 부하 증가 테스트 ===')
      console.log(`성공률: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`)
      console.log(`최소/최대 응답 시간: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`)
    })
    
    it('레이스 컨디션 체크', async () => {
      // 동일한 제목으로 동시에 여러 기획서 생성 시도
      const sharedTitle = `레이스컨디션테스트_${Date.now()}`
      const createdIds: string[] = []
      
      const config: ConcurrencyTestConfig = {
        concurrentRequests: 5,
        totalRequests: 5,
        requestGenerator: async () => {
          const planData = TestDataFactory.generatePlanCreateRequest({
            title: sharedTitle
          })
          const result = await apiClient.post('/api/plans', planData)
          if (result.data.data?.id) {
            createdIds.push(result.data.data.id)
          }
          return result
        }
      }
      
      const result = await ConcurrencyTester.run(config)
      
      // 모든 요청이 성공했는지 확인
      expect(result.successfulRequests).toBe(5)
      
      // 생성된 기획서들이 모두 고유한 ID를 가지는지 확인
      const uniqueIds = new Set(createdIds)
      expect(uniqueIds.size).toBe(createdIds.length)
      
      console.log('=== 레이스 컨디션 테스트 ===')
      console.log(`생성된 고유 ID 수: ${uniqueIds.size}/${createdIds.length}`)
      
      // 정리
      for (const id of createdIds) {
        await apiClient.delete(`/api/plans?id=${id}`)
      }
    })
  })
  
  describe('기획서 CRUD 동시성', () => {
    
    it('읽기/쓰기 동시 작업', async () => {
      // 하나의 기획서 생성
      const { data: createData } = await apiClient.post('/api/plans', 
        TestDataFactory.generatePlanCreateRequest()
      )
      const planId = createData.data.id
      
      let readCount = 0
      let writeCount = 0
      
      const config: ConcurrencyTestConfig = {
        concurrentRequests: 10,
        totalRequests: 20,
        requestGenerator: async () => {
          const isRead = Math.random() > 0.3 // 70% 읽기, 30% 쓰기
          
          if (isRead) {
            readCount++
            return await apiClient.get(`/api/plans/${planId}`)
          } else {
            writeCount++
            return await apiClient.put(`/api/plans?id=${planId}`, {
              title: `수정된 제목 ${Date.now()}`
            })
          }
        }
      }
      
      const result = await ConcurrencyTester.run(config)
      
      expect(result.successfulRequests).toBeGreaterThan(18) // 90% 이상 성공
      
      console.log('=== 읽기/쓰기 동시 작업 테스트 ===')
      console.log(`읽기: ${readCount}회, 쓰기: ${writeCount}회`)
      console.log(`성공률: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`)
      
      // 정리
      await apiClient.delete(`/api/plans?id=${planId}`)
    })
    
    it('동시 삭제 방지', async () => {
      // 기획서 생성
      const { data: createData } = await apiClient.post('/api/plans',
        TestDataFactory.generatePlanCreateRequest()
      )
      const planId = createData.data.id
      
      let deleteSuccessCount = 0
      let deleteFailCount = 0
      
      const config: ConcurrencyTestConfig = {
        concurrentRequests: 5,
        totalRequests: 5,
        requestGenerator: async () => {
          try {
            const result = await apiClient.delete(`/api/plans?id=${planId}`)
            if (result.data.success) {
              deleteSuccessCount++
            } else {
              deleteFailCount++
            }
            return result
          } catch (error) {
            deleteFailCount++
            throw error
          }
        }
      }
      
      await ConcurrencyTester.run(config)
      
      // 하나만 성공하고 나머지는 실패해야 함
      expect(deleteSuccessCount).toBe(1)
      expect(deleteFailCount).toBe(4)
      
      console.log('=== 동시 삭제 방지 테스트 ===')
      console.log(`삭제 성공: ${deleteSuccessCount}, 실패: ${deleteFailCount}`)
    })
  })
})

// ============================
// 부하 테스트
// ============================

describe('부하 테스트', () => {
  
  describe('지속적 부하 테스트', () => {
    
    it('1분간 지속적 부하', async () => {
      const duration = 60000 // 60초
      const targetRPS = 10 // 초당 10개 요청 목표
      const startTime = Date.now()
      const metrics: LoadTestMetrics[] = []
      
      let totalRequests = 0
      let successfulRequests = 0
      let totalResponseTime = 0
      
      // 1초 간격으로 메트릭 수집
      const interval = setInterval(() => {
        const currentTime = Date.now() - startTime
        const memoryUsage = process.memoryUsage()
        
        metrics.push({
          timestamp: new Date().toISOString(),
          activeVUs: targetRPS,
          requestsPerSecond: totalRequests / (currentTime / 1000),
          averageResponseTime: totalResponseTime / Math.max(totalRequests, 1),
          errorRate: ((totalRequests - successfulRequests) / Math.max(totalRequests, 1)) * 100,
          memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
          cpuUsage: process.cpuUsage().user / 1000000 // seconds
        })
      }, 1000)
      
      // 부하 생성
      const endTime = startTime + duration
      while (Date.now() < endTime) {
        const batchPromises = []
        
        for (let i = 0; i < targetRPS; i++) {
          batchPromises.push(
            (async () => {
              const requestStart = Date.now()
              try {
                const { data } = await apiClient.get('/api/plans?limit=10')
                if (data.success) successfulRequests++
                totalResponseTime += Date.now() - requestStart
                totalRequests++
              } catch (error) {
                totalRequests++
              }
            })()
          )
        }
        
        await Promise.all(batchPromises)
        
        // 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      clearInterval(interval)
      
      // 결과 분석
      const avgResponseTime = totalResponseTime / totalRequests
      const successRate = (successfulRequests / totalRequests) * 100
      
      expect(successRate).toBeGreaterThan(95) // 95% 이상 성공
      expect(avgResponseTime).toBeLessThan(1000) // 평균 1초 이내
      
      console.log('=== 1분 지속 부하 테스트 ===')
      console.log(`총 요청: ${totalRequests}`)
      console.log(`성공률: ${successRate.toFixed(2)}%`)
      console.log(`평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`실제 RPS: ${(totalRequests / 60).toFixed(2)}`)
    }, 70000) // 70초 타임아웃
    
    it('스파이크 부하 테스트', async () => {
      const stages: LoadTestStage[] = [
        { duration: 10, targetVU: 5 },   // 10초간 5 VU
        { duration: 5, targetVU: 20 },   // 5초간 20 VU (스파이크)
        { duration: 10, targetVU: 5 }    // 10초간 5 VU
      ]
      
      const results = []
      
      for (const stage of stages) {
        const stageStart = Date.now()
        const stageEnd = stageStart + (stage.duration * 1000)
        
        console.log(`스테이지: ${stage.targetVU} VU for ${stage.duration}s`)
        
        while (Date.now() < stageEnd) {
          const config: ConcurrencyTestConfig = {
            concurrentRequests: stage.targetVU,
            totalRequests: stage.targetVU,
            requestGenerator: async () => {
              return await apiClient.get('/api/plans')
            }
          }
          
          const result = await ConcurrencyTester.run(config)
          results.push({
            stage: stage.targetVU,
            ...result
          })
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // 스파이크 중에도 시스템이 안정적인지 확인
      const spikeResults = results.filter(r => r.stage === 20)
      const avgSpikeSuccess = spikeResults.reduce((sum, r) => 
        sum + (r.successfulRequests / r.totalRequests), 0
      ) / spikeResults.length
      
      expect(avgSpikeSuccess).toBeGreaterThan(0.8) // 스파이크 중 80% 이상 성공
      
      console.log('=== 스파이크 부하 테스트 ===')
      console.log(`스파이크 중 평균 성공률: ${(avgSpikeSuccess * 100).toFixed(2)}%`)
    }, 30000)
  })
})

// ============================
// 성능 벤치마크
// ============================

describe('성능 벤치마크', () => {
  
  it('API 엔드포인트별 벤치마크', async () => {
    const benchmarks = [
      {
        name: 'GET /api/plans',
        fn: async () => await apiClient.get('/api/plans?limit=10')
      },
      {
        name: 'POST /api/plans',
        fn: async () => {
          const data = TestDataFactory.generatePlanCreateRequest()
          const result = await apiClient.post('/api/plans', data)
          // 생성된 기획서 즉시 삭제
          if (result.data.data?.id) {
            await apiClient.delete(`/api/plans?id=${result.data.data.id}`)
          }
          return result
        }
      },
      {
        name: 'POST /api/ai/generate-plan',
        fn: async () => {
          const data = TestDataFactory.generateAIPlanRequest()
          return await apiClient.post('/api/ai/generate-plan', data)
        }
      }
    ]
    
    console.log('\n=== API 엔드포인트별 성능 벤치마크 ===')
    
    for (const benchmark of benchmarks) {
      const result = await PerformanceBenchmarker.benchmark(
        benchmark.name,
        benchmark.fn,
        20,  // 20회 반복
        5    // 5회 워밍업
      )
      
      console.log(`\n${result.name}:`)
      console.log(`  평균: ${result.metrics.mean.toFixed(2)}ms`)
      console.log(`  중간값: ${result.metrics.median.toFixed(2)}ms`)
      console.log(`  최소/최대: ${result.metrics.min.toFixed(2)}ms / ${result.metrics.max.toFixed(2)}ms`)
      console.log(`  표준편차: ${result.metrics.standardDeviation.toFixed(2)}ms`)
      console.log(`  P95: ${result.metrics.percentiles.p95.toFixed(2)}ms`)
      console.log(`  처리량: ${result.throughput.toFixed(2)} req/s`)
      console.log(`  성공률: ${result.successRate.toFixed(2)}%`)
      
      // 성능 기준 검증
      expect(result.metrics.p95).toBeLessThan(
        benchmark.name.includes('ai') ? 10000 : 2000
      )
      expect(result.successRate).toBeGreaterThan(95)
    }
  })
  
  it('메모리 누수 테스트', async () => {
    const iterations = 100
    const memorySnapshots = []
    
    // 초기 메모리 스냅샷
    if (global.gc) global.gc()
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024
    
    for (let i = 0; i < iterations; i++) {
      // API 호출
      const planData = TestDataFactory.generatePlanCreateRequest()
      const { data } = await apiClient.post('/api/plans', planData)
      
      if (data.data?.id) {
        await apiClient.get(`/api/plans/${data.data.id}`)
        await apiClient.delete(`/api/plans?id=${data.data.id}`)
      }
      
      // 10회마다 메모리 체크
      if (i % 10 === 0) {
        if (global.gc) global.gc()
        const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024
        memorySnapshots.push(currentMemory)
      }
    }
    
    // 최종 메모리 스냅샷
    if (global.gc) global.gc()
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024
    
    // 메모리 증가량 계산
    const memoryIncrease = finalMemory - initialMemory
    const avgMemoryPerRequest = memoryIncrease / iterations
    
    console.log('=== 메모리 누수 테스트 ===')
    console.log(`초기 메모리: ${initialMemory.toFixed(2)}MB`)
    console.log(`최종 메모리: ${finalMemory.toFixed(2)}MB`)
    console.log(`메모리 증가: ${memoryIncrease.toFixed(2)}MB`)
    console.log(`요청당 평균 메모리: ${avgMemoryPerRequest.toFixed(4)}MB`)
    
    // 메모리 누수 기준: 요청당 0.5MB 이하
    expect(avgMemoryPerRequest).toBeLessThan(0.5)
  })
})

afterAll(() => {
  // 전체 테스트 결과 요약
  const stats = metricsCollector.getStats()
  
  console.log('\n=== 동시성 및 부하 테스트 종합 결과 ===')
  console.log(`총 테스트 요청: ${stats.totalRequests}`)
  console.log(`전체 성공률: ${stats.successRate.toFixed(2)}%`)
  console.log(`평균 응답 시간: ${stats.averageResponseTime.toFixed(2)}ms`)
  console.log(`P50: ${stats.p50.toFixed(2)}ms`)
  console.log(`P90: ${stats.p90.toFixed(2)}ms`)
  console.log(`P95: ${stats.p95.toFixed(2)}ms`)
  console.log(`P99: ${stats.p99.toFixed(2)}ms`)
})