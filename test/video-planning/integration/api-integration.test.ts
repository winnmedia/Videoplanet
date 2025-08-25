import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// MSW 서버 설정
const server = setupServer()

// API 응답 모킹 데이터
const mockSuccessResponse = {
  success: true,
  data: {
    id: 'test-plan-123',
    title: '테스트 영상',
    status: 'completed',
    storyStages: {
      introduction: {
        title: '도입부',
        description: '시청자 관심 유도',
        duration: 12,
        keyPoints: ['주목', '소개', '톤 설정']
      },
      rising: {
        title: '전개부',
        description: '핵심 내용 전개',
        duration: 24,
        keyPoints: ['정보 전달', '참여 유도']
      },
      climax: {
        title: '절정부',
        description: '메시지 강조',
        duration: 18,
        keyPoints: ['임팩트', '핵심 전달']
      },
      conclusion: {
        title: '결말부',
        description: '마무리',
        duration: 6,
        keyPoints: ['정리', 'CTA']
      }
    },
    shotBreakdown: Array.from({ length: 12 }, (_, i) => ({
      shotNumber: i + 1,
      storyStage: i < 3 ? 'introduction' : i < 7 ? 'rising' : i < 10 ? 'climax' : 'conclusion',
      shotType: 'medium',
      cameraMovement: 'static',
      composition: 'center',
      duration: 5,
      description: `Shot ${i + 1} description`,
      dialogue: ''
    })),
    generatedAt: new Date().toISOString()
  }
}

// API 클라이언트
class VideoPlanningAPI {
  private baseURL = '/api'

  async generatePlan(data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/ai/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async savePlan(data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async getPlan(id: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/plans/${id}`)
    return response.json()
  }

  async updatePlan(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async deletePlan(id: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/plans/${id}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  async listPlans(params?: any): Promise<any> {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    const response = await fetch(`${this.baseURL}/plans${queryString ? `?${queryString}` : ''}`)
    return response.json()
  }
}

describe('API 통합 테스트', () => {
  let api: VideoPlanningAPI

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    api = new VideoPlanningAPI()
  })

  afterAll(() => {
    server.close()
  })

  describe('AI 기획 생성 API', () => {
    it('정상적인 기획 생성 요청', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const result = await api.generatePlan({
        title: '테스트 영상',
        oneLinerStory: 'AI 기술로 영상 제작을 혁신하는 이야기',
        genre: '홍보영상',
        duration: '60초',
        tempo: 'normal',
        developmentMethod: 'classic-kishōtenketsu',
        developmentIntensity: 'moderate'
      })

      expect(result.success).toBe(true)
      expect(result.data.id).toBeDefined()
      expect(result.data.storyStages).toBeDefined()
      expect(result.data.shotBreakdown).toHaveLength(12)
    })

    it('필수 필드 누락 시 에러', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json(
            {
              success: false,
              error: '제목과 한 줄 스토리는 필수입니다'
            },
            { status: 400 }
          )
        })
      )

      const result = await api.generatePlan({
        title: '',
        oneLinerStory: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('필수')
    })

    it('서버 오류 처리', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json(
            {
              success: false,
              error: '서버 내부 오류가 발생했습니다'
            },
            { status: 500 }
          )
        })
      )

      const result = await api.generatePlan({
        title: '테스트',
        oneLinerStory: '테스트 스토리'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('서버')
    })

    it('타임아웃 시뮬레이션', async () => {
      server.use(
        http.post('/api/ai/generate-plan', async () => {
          await new Promise(resolve => setTimeout(resolve, 31000))
          return HttpResponse.json({ success: false, error: 'Timeout' })
        })
      )

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch('/api/ai/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'test', oneLinerStory: 'test' }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        expect(response.ok).toBe(false)
      } catch (error: any) {
        expect(error.name).toBe('AbortError')
      }
    }, 35000)
  })

  describe('기획서 CRUD API', () => {
    it('기획서 저장', async () => {
      server.use(
        http.post('/api/plans', () => {
          return HttpResponse.json({
            success: true,
            data: {
              ...mockSuccessResponse.data,
              id: 'plan-456'
            }
          })
        })
      )

      const result = await api.savePlan(mockSuccessResponse.data)
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('plan-456')
    })

    it('기획서 조회', async () => {
      server.use(
        http.get('/api/plans/plan-456', () => {
          return HttpResponse.json({
            success: true,
            data: mockSuccessResponse.data
          })
        })
      )

      const result = await api.getPlan('plan-456')
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('테스트 영상')
    })

    it('기획서 목록 조회', async () => {
      server.use(
        http.get('/api/plans', ({ request }) => {
          const url = new URL(request.url)
          const page = url.searchParams.get('page') || '1'
          const limit = url.searchParams.get('limit') || '10'
          
          return HttpResponse.json({
            success: true,
            data: {
              items: [mockSuccessResponse.data],
              total: 1,
              page: parseInt(page),
              limit: parseInt(limit)
            }
          })
        })
      )

      const result = await api.listPlans({ page: 1, limit: 10 })
      expect(result.success).toBe(true)
      expect(result.data.items).toHaveLength(1)
      expect(result.data.total).toBe(1)
    })

    it('기획서 수정', async () => {
      server.use(
        http.put('/api/plans/plan-456', () => {
          return HttpResponse.json({
            success: true,
            data: {
              ...mockSuccessResponse.data,
              title: '수정된 제목'
            }
          })
        })
      )

      const result = await api.updatePlan('plan-456', { title: '수정된 제목' })
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('수정된 제목')
    })

    it('기획서 삭제', async () => {
      server.use(
        http.delete('/api/plans/plan-456', () => {
          return HttpResponse.json({
            success: true,
            message: '삭제되었습니다'
          })
        })
      )

      const result = await api.deletePlan('plan-456')
      expect(result.success).toBe(true)
      expect(result.message).toContain('삭제')
    })
  })

  describe('동시 요청 처리', () => {
    it('10개 동시 생성 요청', async () => {
      let requestCount = 0
      
      server.use(
        http.post('/api/ai/generate-plan', async () => {
          requestCount++
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
          return HttpResponse.json({
            ...mockSuccessResponse,
            data: {
              ...mockSuccessResponse.data,
              id: `plan-concurrent-${requestCount}`
            }
          })
        })
      )

      const promises = Array.from({ length: 10 }, (_, i) => 
        api.generatePlan({
          title: `동시 요청 ${i + 1}`,
          oneLinerStory: '테스트 스토리',
          genre: '홍보영상',
          duration: '60초'
        })
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data.id).toContain('plan-concurrent')
      })
      expect(requestCount).toBe(10)
    })

    it('읽기/쓰기 동시 작업', async () => {
      server.use(
        http.get('/api/plans', () => {
          return HttpResponse.json({
            success: true,
            data: { items: [], total: 0 }
          })
        }),
        http.post('/api/plans', () => {
          return HttpResponse.json({
            success: true,
            data: { id: 'new-plan' }
          })
        })
      )

      const [readResult, writeResult] = await Promise.all([
        api.listPlans(),
        api.savePlan({ title: '새 기획' })
      ])

      expect(readResult.success).toBe(true)
      expect(writeResult.success).toBe(true)
    })
  })

  describe('에러 복구 시나리오', () => {
    it('재시도 로직', async () => {
      let attemptCount = 0
      
      server.use(
        http.post('/api/ai/generate-plan', () => {
          attemptCount++
          if (attemptCount < 3) {
            return HttpResponse.json(
              { success: false, error: 'Service unavailable' },
              { status: 503 }
            )
          }
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      async function retryableGeneratePlan(data: any, maxRetries = 3): Promise<any> {
        for (let i = 0; i < maxRetries; i++) {
          const result = await api.generatePlan(data)
          if (result.success) return result
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          }
        }
        throw new Error('Max retries exceeded')
      }

      const result = await retryableGeneratePlan({
        title: '재시도 테스트',
        oneLinerStory: '테스트 스토리'
      })

      expect(result.success).toBe(true)
      expect(attemptCount).toBe(3)
    })

    it('부분 실패 처리', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json({
            success: true,
            data: {
              ...mockSuccessResponse.data,
              shotBreakdown: null  // 일부 데이터 누락
            }
          })
        })
      )

      const result = await api.generatePlan({
        title: '부분 실패 테스트',
        oneLinerStory: '테스트 스토리'
      })

      expect(result.success).toBe(true)
      expect(result.data.storyStages).toBeDefined()
      expect(result.data.shotBreakdown).toBeNull()
      
      // 기본값으로 대체하는 로직
      const processedData = {
        ...result.data,
        shotBreakdown: result.data.shotBreakdown || []
      }
      expect(processedData.shotBreakdown).toEqual([])
    })
  })

  describe('데이터 검증', () => {
    it('4단계 스토리 구조 검증', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const result = await api.generatePlan({
        title: '구조 검증',
        oneLinerStory: '테스트'
      })

      const stages = result.data.storyStages
      expect(stages.introduction).toBeDefined()
      expect(stages.rising).toBeDefined()
      expect(stages.climax).toBeDefined()
      expect(stages.conclusion).toBeDefined()

      // 시간 분배 검증
      const totalDuration = 
        stages.introduction.duration +
        stages.rising.duration +
        stages.climax.duration +
        stages.conclusion.duration
      
      expect(totalDuration).toBe(60)
    })

    it('12개 숏트 분배 검증', async () => {
      server.use(
        http.post('/api/ai/generate-plan', () => {
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const result = await api.generatePlan({
        title: '숏트 검증',
        oneLinerStory: '테스트'
      })

      const shots = result.data.shotBreakdown
      expect(shots).toHaveLength(12)
      
      // 숏트 번호 연속성
      shots.forEach((shot: any, index: number) => {
        expect(shot.shotNumber).toBe(index + 1)
      })

      // 스토리 단계별 분배
      const distribution = {
        introduction: shots.filter((s: any) => s.storyStage === 'introduction').length,
        rising: shots.filter((s: any) => s.storyStage === 'rising').length,
        climax: shots.filter((s: any) => s.storyStage === 'climax').length,
        conclusion: shots.filter((s: any) => s.storyStage === 'conclusion').length
      }

      expect(distribution.introduction).toBeGreaterThanOrEqual(2)
      expect(distribution.rising).toBeGreaterThanOrEqual(4)
      expect(distribution.climax).toBeGreaterThanOrEqual(3)
      expect(distribution.conclusion).toBeGreaterThanOrEqual(1)
    })
  })
})