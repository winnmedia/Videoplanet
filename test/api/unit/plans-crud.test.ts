/**
 * 기획서 CRUD API 단위 테스트
 * @author Benjamin (Backend Lead)
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  APITestClient,
  TestDataFactory,
  TestAssertions,
  MetricsCollector,
  Validator
} from '../helpers/test-helpers'
import type { InputTestCase } from '../types/api-test.types'

// ============================
// 테스트 설정
// ============================

const apiClient = new APITestClient()
const metricsCollector = new MetricsCollector()
let createdPlanIds: string[] = []

// ============================
// 테스트 케이스 정의
// ============================

describe('기획서 CRUD API 테스트', () => {
  
  // 생성된 기획서 ID 추적
  beforeEach(() => {
    createdPlanIds = []
  })

  describe('POST /api/plans - 기획서 생성', () => {
    
    it('정상적인 기획서 생성', async () => {
      const planData = TestDataFactory.generatePlanCreateRequest()
      
      const { data, metrics } = await apiClient.post('/api/plans', planData)
      
      metricsCollector.add(metrics)
      
      // 응답 검증
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.id).toBeDefined()
      expect(data.data.title).toBe(planData.title)
      expect(data.data.planType).toBe(planData.planType)
      expect(data.data.status).toBe('draft')
      expect(data.data.version).toBe(1)
      
      createdPlanIds.push(data.data.id)
      
      // 응답 시간 검증
      TestAssertions.assertResponseTime(metrics.responseTime, 1000)
      
      console.log(`✓ 기획서 생성 성공: ${data.data.id}`)
    })
    
    it('필수 필드 누락 시 에러', async () => {
      const invalidData = {
        description: '제목 없는 기획서'
      }
      
      const { data, metrics } = await apiClient.post('/api/plans', invalidData)
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(400)
      expect(data.error).toContain('기획서 제목은 필수입니다')
      
      console.log(`✓ 필수 필드 검증 성공`)
    })
    
    it('제목 길이 제한 검증', async () => {
      const longTitle = TestDataFactory.generateRandomString(201)
      const planData = TestDataFactory.generatePlanCreateRequest({
        title: longTitle
      })
      
      const { data, metrics } = await apiClient.post('/api/plans', planData)
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(400)
      expect(data.error).toContain('제목은 200자를 초과할 수 없습니다')
      
      console.log(`✓ 제목 길이 제한 검증 성공`)
    })
    
    it('잘못된 기획서 유형', async () => {
      const planData = TestDataFactory.generatePlanCreateRequest({
        planType: 'invalid-type'
      })
      
      const { data, metrics } = await apiClient.post('/api/plans', planData)
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(400)
      expect(data.error).toContain('유효하지 않은 기획서 유형')
      
      console.log(`✓ 기획서 유형 검증 성공`)
    })
    
    it('특수문자 및 이모지 처리', async () => {
      const planData = TestDataFactory.generatePlanCreateRequest({
        title: `특수문자 ${TestDataFactory.generateSpecialChars()} 이모지 ${TestDataFactory.generateEmoji()}`,
        tags: ['특수문자', '이모지', '🎬']
      })
      
      const { data, metrics } = await apiClient.post('/api/plans', planData)
      
      expect(data.success).toBe(true)
      expect(data.data.title).toContain('특수문자')
      expect(data.data.tags).toContain('🎬')
      
      createdPlanIds.push(data.data.id)
      
      console.log(`✓ 특수문자 및 이모지 처리 성공`)
    })
  })

  describe('GET /api/plans - 기획서 목록 조회', () => {
    
    beforeEach(async () => {
      // 테스트용 기획서 3개 생성
      for (let i = 0; i < 3; i++) {
        const planData = TestDataFactory.generatePlanCreateRequest({
          title: `테스트 기획서 ${i + 1}`,
          tags: i === 0 ? ['태그1'] : ['태그2']
        })
        const { data } = await apiClient.post('/api/plans', planData)
        if (data.data?.id) {
          createdPlanIds.push(data.data.id)
        }
      }
    })
    
    it('전체 목록 조회', async () => {
      const { data, metrics } = await apiClient.get('/api/plans')
      
      metricsCollector.add(metrics)
      
      expect(data.success).toBe(true)
      expect(data.data.items).toBeDefined()
      expect(Array.isArray(data.data.items)).toBe(true)
      expect(data.data.pagination).toBeDefined()
      
      console.log(`✓ 전체 목록 조회: ${data.data.items.length}개`)
    })
    
    it('페이지네이션', async () => {
      const { data: page1 } = await apiClient.get('/api/plans?page=1&limit=2')
      const { data: page2 } = await apiClient.get('/api/plans?page=2&limit=2')
      
      expect(page1.data.items.length).toBeLessThanOrEqual(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(2)
      
      // 페이지 간 중복 없음
      const page1Ids = page1.data.items.map((p: any) => p.id)
      const page2Ids = page2.data.items.map((p: any) => p.id)
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id))
      expect(intersection.length).toBe(0)
      
      console.log(`✓ 페이지네이션 검증 성공`)
    })
    
    it('상태 필터링', async () => {
      const { data } = await apiClient.get('/api/plans?status=draft')
      
      const allDraft = data.data.items.every((plan: any) => plan.status === 'draft')
      expect(allDraft).toBe(true)
      
      console.log(`✓ 상태 필터링: draft ${data.data.items.length}개`)
    })
    
    it('태그 필터링', async () => {
      const { data } = await apiClient.get('/api/plans?tags=태그1')
      
      const hasTag = data.data.items.every((plan: any) => 
        plan.tags.includes('태그1')
      )
      expect(hasTag).toBe(true)
      
      console.log(`✓ 태그 필터링 성공`)
    })
    
    it('검색 기능', async () => {
      const { data } = await apiClient.get('/api/plans?search=테스트')
      
      const allMatch = data.data.items.every((plan: any) => 
        plan.title.includes('테스트') || 
        plan.description?.includes('테스트')
      )
      expect(allMatch).toBe(true)
      
      console.log(`✓ 검색 기능: '테스트' ${data.data.items.length}개 결과`)
    })
    
    it('정렬 기능', async () => {
      const { data } = await apiClient.get('/api/plans?sortBy=title&sortOrder=asc')
      
      const titles = data.data.items.map((p: any) => p.title)
      const sortedTitles = [...titles].sort()
      expect(titles).toEqual(sortedTitles)
      
      console.log(`✓ 정렬 기능 검증 성공`)
    })
  })

  describe('GET /api/plans/[id] - 개별 기획서 조회', () => {
    let testPlanId: string
    
    beforeEach(async () => {
      const planData = TestDataFactory.generatePlanCreateRequest()
      const { data } = await apiClient.post('/api/plans', planData)
      testPlanId = data.data.id
      createdPlanIds.push(testPlanId)
    })
    
    it('존재하는 기획서 조회', async () => {
      const { data, metrics } = await apiClient.get(`/api/plans/${testPlanId}`)
      
      metricsCollector.add(metrics)
      
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testPlanId)
      expect(data.data.title).toBeDefined()
      expect(data.data.status).toBeDefined()
      
      console.log(`✓ 개별 기획서 조회 성공: ${testPlanId}`)
    })
    
    it('존재하지 않는 기획서 조회', async () => {
      const { data, metrics } = await apiClient.get('/api/plans/non-existent-id')
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(404)
      expect(data.error).toContain('해당 기획서를 찾을 수 없습니다')
      
      console.log(`✓ 404 에러 처리 검증 성공`)
    })
  })

  describe('PUT /api/plans - 기획서 수정', () => {
    let testPlanId: string
    
    beforeEach(async () => {
      const planData = TestDataFactory.generatePlanCreateRequest()
      const { data } = await apiClient.post('/api/plans', planData)
      testPlanId = data.data.id
      createdPlanIds.push(testPlanId)
    })
    
    it('제목 수정', async () => {
      const updateData = {
        title: '수정된 제목',
        changeReason: '제목 변경 테스트'
      }
      
      const { data, metrics } = await apiClient.put(
        `/api/plans?id=${testPlanId}`,
        updateData
      )
      
      metricsCollector.add(metrics)
      
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('수정된 제목')
      expect(data.data.version).toBe(2)
      expect(data.data.editHistory.length).toBeGreaterThan(0)
      
      console.log(`✓ 제목 수정 성공`)
    })
    
    it('상태 변경', async () => {
      const updateData = {
        status: 'in-review',
        changeReason: '검토 시작'
      }
      
      const { data } = await apiClient.put(
        `/api/plans?id=${testPlanId}`,
        updateData
      )
      
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('in-review')
      
      console.log(`✓ 상태 변경 성공: draft → in-review`)
    })
    
    it('태그 수정', async () => {
      const updateData = {
        tags: ['새태그1', '새태그2', '새태그3']
      }
      
      const { data } = await apiClient.put(
        `/api/plans?id=${testPlanId}`,
        updateData
      )
      
      expect(data.success).toBe(true)
      expect(data.data.tags).toEqual(['새태그1', '새태그2', '새태그3'])
      
      console.log(`✓ 태그 수정 성공`)
    })
    
    it('존재하지 않는 기획서 수정 시도', async () => {
      const { data, metrics } = await apiClient.put(
        '/api/plans?id=non-existent',
        { title: '수정 시도' }
      )
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(404)
      
      console.log(`✓ 존재하지 않는 기획서 수정 검증`)
    })
  })

  describe('PATCH /api/plans/[id] - 기획서 콘텐츠 부분 수정', () => {
    let testPlanId: string
    
    beforeEach(async () => {
      const planData = TestDataFactory.generatePlanCreateRequest({
        generatedContent: {
          section1: '원본 콘텐츠'
        }
      })
      const { data } = await apiClient.post('/api/plans', planData)
      testPlanId = data.data.id
      createdPlanIds.push(testPlanId)
    })
    
    it('섹션별 콘텐츠 수정', async () => {
      const patchData = {
        section: 'section1',
        content: '수정된 콘텐츠',
        changeReason: '콘텐츠 개선'
      }
      
      const { data, metrics } = await apiClient.patch(
        `/api/plans/${testPlanId}`,
        patchData
      )
      
      metricsCollector.add(metrics)
      
      expect(data.success).toBe(true)
      expect(data.data.editedContent.section1).toBe('수정된 콘텐츠')
      expect(data.data.version).toBe(2)
      
      // 편집 이력 확인
      const lastEdit = data.data.editHistory[data.data.editHistory.length - 1]
      expect(lastEdit.section).toBe('section1')
      expect(lastEdit.changeReason).toBe('콘텐츠 개선')
      
      console.log(`✓ 섹션별 콘텐츠 수정 성공`)
    })
    
    it('필수 필드 누락 시 에러', async () => {
      const { data, metrics } = await apiClient.patch(
        `/api/plans/${testPlanId}`,
        { content: '콘텐츠만' }
      )
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(400)
      expect(data.error).toContain('섹션과 콘텐츠 정보가 필요합니다')
      
      console.log(`✓ PATCH 검증 성공`)
    })
  })

  describe('DELETE /api/plans - 기획서 삭제', () => {
    let testPlanId: string
    
    beforeEach(async () => {
      const planData = TestDataFactory.generatePlanCreateRequest()
      const { data } = await apiClient.post('/api/plans', planData)
      testPlanId = data.data.id
    })
    
    it('기획서 삭제 성공', async () => {
      const { data, metrics } = await apiClient.delete(
        `/api/plans?id=${testPlanId}`
      )
      
      metricsCollector.add(metrics)
      
      expect(data.success).toBe(true)
      expect(data.message).toContain('성공적으로 삭제')
      
      // 삭제 확인
      const { data: checkData, metrics: checkMetrics } = await apiClient.get(
        `/api/plans/${testPlanId}`
      )
      expect(checkData.success).toBe(false)
      expect(checkMetrics.statusCode).toBe(404)
      
      console.log(`✓ 기획서 삭제 성공: ${testPlanId}`)
    })
    
    it('존재하지 않는 기획서 삭제 시도', async () => {
      const { data, metrics } = await apiClient.delete(
        '/api/plans?id=non-existent'
      )
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(404)
      
      console.log(`✓ 존재하지 않는 기획서 삭제 검증`)
    })
    
    it('게시된 기획서 삭제 방지', async () => {
      // 먼저 기획서를 published 상태로 변경
      await apiClient.put(
        `/api/plans?id=${testPlanId}`,
        { status: 'published' }
      )
      
      // 삭제 시도
      const { data, metrics } = await apiClient.delete(
        `/api/plans/${testPlanId}`
      )
      
      expect(data.success).toBe(false)
      expect(metrics.statusCode).toBe(400)
      expect(data.error).toContain('게시된 기획서는 삭제할 수 없습니다')
      
      // 다시 draft로 변경 후 삭제
      await apiClient.put(
        `/api/plans?id=${testPlanId}`,
        { status: 'draft' }
      )
      await apiClient.delete(`/api/plans/${testPlanId}`)
      
      console.log(`✓ 게시된 기획서 삭제 방지 검증`)
    })
  })

  describe('벌크 작업 성능 테스트', () => {
    it('대량 생성 테스트', async () => {
      const createCount = 20
      const startTime = Date.now()
      const promises = []
      
      for (let i = 0; i < createCount; i++) {
        const planData = TestDataFactory.generatePlanCreateRequest({
          title: `벌크 테스트 기획서 ${i + 1}`
        })
        promises.push(apiClient.post('/api/plans', planData))
      }
      
      const results = await Promise.all(promises)
      const endTime = Date.now()
      
      const successCount = results.filter(r => r.data.success).length
      expect(successCount).toBe(createCount)
      
      const totalTime = endTime - startTime
      const avgTime = totalTime / createCount
      
      console.log(`✓ 대량 생성: ${createCount}개, 총 ${totalTime}ms, 평균 ${avgTime.toFixed(2)}ms`)
      
      // 생성된 ID 수집 (정리용)
      results.forEach(r => {
        if (r.data.data?.id) {
          createdPlanIds.push(r.data.data.id)
        }
      })
    })
    
    it('대량 조회 테스트', async () => {
      const queryCount = 50
      const startTime = Date.now()
      const promises = []
      
      for (let i = 0; i < queryCount; i++) {
        promises.push(apiClient.get('/api/plans?limit=10'))
      }
      
      await Promise.all(promises)
      const endTime = Date.now()
      
      const totalTime = endTime - startTime
      const avgTime = totalTime / queryCount
      const throughput = (queryCount / totalTime) * 1000
      
      console.log(`✓ 대량 조회: ${queryCount}개, 평균 ${avgTime.toFixed(2)}ms, 처리량 ${throughput.toFixed(2)} req/s`)
    })
  })

  afterAll(async () => {
    // 테스트에서 생성된 모든 기획서 정리
    for (const id of createdPlanIds) {
      try {
        await apiClient.delete(`/api/plans?id=${id}`)
      } catch (error) {
        // 이미 삭제된 경우 무시
      }
    }
    
    // 테스트 결과 요약
    const stats = metricsCollector.getStats()
    console.log('\n=== 기획서 CRUD API 테스트 결과 ===')
    console.log(`총 요청 수: ${stats.totalRequests}`)
    console.log(`성공률: ${stats.successRate.toFixed(2)}%`)
    console.log(`평균 응답 시간: ${stats.averageResponseTime.toFixed(2)}ms`)
    console.log(`P95: ${stats.p95.toFixed(2)}ms`)
    console.log(`P99: ${stats.p99.toFixed(2)}ms`)
  })
})