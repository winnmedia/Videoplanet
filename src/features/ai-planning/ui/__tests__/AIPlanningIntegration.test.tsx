import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// 테스트 대상 컴포넌트
import AIPlanningPage from '@/app/video-planning/ai/page'
import videoPlanningReducer from '@/entities/video-planning/model/video-planning.slice'

// MSW 서버 설정
const server = setupServer(
  rest.post('/api/ai/generate-plan', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: 'test-plan-id',
          title: '테스트 영상',
          genre: '홍보영상',
          duration: 60,
          budget: '500만원',
          targetAudience: '20-30대',
          concept: '혁신적인 서비스 소개',
          purpose: '브랜드 인지도 향상',
          tone: '전문적이고 친근한',
          storyStages: {
            introduction: {
              title: '도입부',
              description: '시청자의 관심을 끄는 강렬한 오프닝',
              duration: 15,
              keyPoints: ['문제 제시', '공감대 형성']
            },
            rising: {
              title: '전개부',
              description: '솔루션 소개 및 장점 설명',
              duration: 20,
              keyPoints: ['기능 소개', '차별화 포인트']
            },
            climax: {
              title: '절정부',
              description: '핵심 가치 전달',
              duration: 15,
              keyPoints: ['감정적 호소', '변화의 순간']
            },
            conclusion: {
              title: '결말부',
              description: '행동 유도 및 마무리',
              duration: 10,
              keyPoints: ['CTA', '브랜드 각인']
            }
          },
          shotBreakdown: Array.from({ length: 12 }, (_, i) => ({
            shotNumber: i + 1,
            storyStage: ['introduction', 'rising', 'climax', 'conclusion'][Math.floor(i / 3)],
            shotType: ['와이드샷', '미디엄샷', '클로즈업'][i % 3],
            cameraMovement: ['고정', '팬', '트래킹'][i % 3],
            composition: '3분할 구도',
            duration: 5,
            description: `샷 ${i + 1} 설명`,
            dialogue: `대사 ${i + 1}`
          })),
          generatedAt: new Date().toISOString(),
          status: 'completed'
        }
      })
    )
  }),

  rest.post('/api/ai/generate-story', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        stages: [
          {
            title: '도입',
            description: '문제 상황 제시',
            content: '일상에서 겪는 불편함을 생생하게 보여준다',
            objective: '공감대 형성',
            durationHint: '15초'
          },
          {
            title: '전개',
            description: '해결책 제시',
            content: '우리의 서비스가 어떻게 문제를 해결하는지 보여준다',
            objective: '솔루션 이해',
            durationHint: '20초'
          },
          {
            title: '절정',
            description: '변화의 순간',
            content: '서비스 사용 후 달라진 모습을 극적으로 표현',
            objective: '감동 전달',
            durationHint: '15초'
          },
          {
            title: '결말',
            description: '행동 촉구',
            content: '지금 바로 시작하세요 메시지와 함께 CTA 제공',
            objective: '전환 유도',
            durationHint: '10초'
          }
        ]
      })
    )
  }),

  rest.post('/api/ai/generate-image', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        imageUrl: 'https://example.com/storyboard-image.jpg',
        prompt: 'storyboard sketch',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'jpg'
        }
      })
    )
  })
)

// 테스트 스토어 생성
const createTestStore = () => {
  return configureStore({
    reducer: {
      videoPlanning: videoPlanningReducer
    }
  })
}

describe('AIPlanningPage - 통합 테스트', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    server.listen()
    store = createTestStore()
    user = userEvent.setup()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.clearAllMocks()
  })

  describe('전체 워크플로우 테스트', () => {
    test('기획서 생성 전체 과정이 정상 작동', async () => {
      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      // Step 1: 기본 정보 입력
      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })
      
      await user.type(titleInput, '브이래닛 서비스 소개 영상')
      await user.type(storyInput, '영상 제작의 모든 과정을 한 곳에서 해결하는 혁신적인 플랫폼')

      // Step 2: 톤앤매너 선택 (다중 선택)
      const tones = ['전문적인', '혁신적인', '신뢰감 있는']
      for (const tone of tones) {
        const checkbox = screen.getByRole('checkbox', { name: tone })
        await user.click(checkbox)
        expect(checkbox).toBeChecked()
      }

      // Step 3: 메타 정보 설정
      const genreSelect = screen.getByRole('combobox', { name: /장르/i })
      const targetSelect = screen.getByRole('combobox', { name: /타겟/i })
      const durationSelect = screen.getByRole('combobox', { name: /분량/i })
      
      await user.selectOptions(genreSelect, '홍보영상')
      await user.selectOptions(targetSelect, '창업가/CEO')
      await user.selectOptions(durationSelect, '90초')

      // Step 4: 템포 선택
      const tempoButton = screen.getByRole('button', { name: /빠르게.*역동적인 전개/i })
      await user.click(tempoButton)
      expect(tempoButton).toHaveClass('selected')

      // Step 5: 전개 방식 선택
      const methodButton = screen.getByRole('button', { name: /훅-몰입-반전-떡밥/i })
      await user.click(methodButton)
      expect(methodButton).toHaveClass('selected')

      // Step 6: 전개 강도 선택
      const intensityButton = screen.getByRole('button', { name: /풍부하게.*감정적 묘사/i })
      await user.click(intensityButton)
      expect(intensityButton).toHaveClass('selected')

      // Step 7: 생성 버튼 클릭
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/i })
      await user.click(generateButton)

      // Step 8: 생성 중 UI 확인
      expect(await screen.findByText('AI가 영상 기획서를 생성하고 있습니다')).toBeInTheDocument()
      
      // 프로그레스 단계 확인
      expect(screen.getByText('스토리 구조 분석')).toBeInTheDocument()
      expect(screen.getByText('4단계 스토리 생성')).toBeInTheDocument()
      expect(screen.getByText('12개 숏트 분해')).toBeInTheDocument()

      // Step 9: 결과 화면 확인
      await waitFor(() => {
        expect(screen.getByText('AI 영상 기획서 생성 완료!')).toBeInTheDocument()
      }, { timeout: 10000 })

      // 결과 내용 확인
      expect(screen.getByText(/브이래닛 서비스 소개 영상/)).toBeInTheDocument()
      expect(screen.getByText('4단계 스토리 구조')).toBeInTheDocument()
      expect(screen.getByText('12개 숏트 분해')).toBeInTheDocument()

      // 액션 버튼 확인
      expect(screen.getByRole('button', { name: /기획서 편집/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /PDF 다운로드/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /새 기획서 만들기/i })).toBeInTheDocument()
    })

    test('생성된 기획서 편집 기능', async () => {
      // 기획서 생성 완료 상태로 시작
      const initialState = {
        videoPlanning: {
          currentPlan: {
            id: 'test-id',
            title: '테스트 영상',
            status: 'completed',
            stages: [
              { id: '1', type: 'intro', content: '도입부 내용', isEdited: false },
              { id: '2', type: 'rising', content: '전개부 내용', isEdited: false },
              { id: '3', type: 'climax', content: '절정부 내용', isEdited: false },
              { id: '4', type: 'resolution', content: '결말부 내용', isEdited: false }
            ],
            shots: Array.from({ length: 12 }, (_, i) => ({
              id: `shot-${i}`,
              shotNumber: i + 1,
              description: `샷 ${i + 1} 설명`,
              isEdited: false
            }))
          },
          currentStep: 3,
          isLoading: false,
          error: null
        }
      }

      store = configureStore({
        reducer: { videoPlanning: videoPlanningReducer },
        preloadedState: initialState
      })

      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      // 편집 모드 진입
      const editButton = screen.getByRole('button', { name: /기획서 편집/i })
      await user.click(editButton)

      // 스토리 단계 편집
      const stageEditButtons = screen.getAllByRole('button', { name: /편집/i })
      await user.click(stageEditButtons[0])

      const stageTextarea = await screen.findByRole('textbox', { name: /도입부 내용/i })
      await user.clear(stageTextarea)
      await user.type(stageTextarea, '수정된 도입부 내용')

      // 저장
      const saveButton = screen.getByRole('button', { name: /저장/i })
      await user.click(saveButton)

      // 수정 사항 확인
      expect(screen.getByText('수정된 도입부 내용')).toBeInTheDocument()
      expect(screen.getByText('(수정됨)')).toBeInTheDocument()
    })
  })

  describe('에러 복구 시나리오', () => {
    test('네트워크 에러 후 재시도 성공', async () => {
      let callCount = 0
      server.use(
        rest.post('/api/ai/generate-plan', (req, res, ctx) => {
          callCount++
          if (callCount === 1) {
            return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
          }
          return res(ctx.json({
            success: true,
            data: { id: 'retry-success', title: '재시도 성공' }
          }))
        })
      )

      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      // 필수 정보 입력
      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트 스토리')
      
      // 첫 번째 시도 (실패)
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))
      
      // 에러 메시지 확인
      expect(await screen.findByText(/서버 오류가 발생했습니다/)).toBeInTheDocument()
      
      // 재시도 버튼 클릭
      const retryButton = screen.getByRole('button', { name: /재시도/i })
      await user.click(retryButton)
      
      // 성공 확인
      await waitFor(() => {
        expect(screen.queryByText(/서버 오류/)).not.toBeInTheDocument()
        expect(screen.getByText(/생성 완료/)).toBeInTheDocument()
      })
    })

    test('부분 실패 시 복구 가능', async () => {
      server.use(
        rest.post('/api/ai/generate-story', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ error: 'Invalid parameters' }))
        })
      )

      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트')
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))

      // 스토리 생성 실패 메시지
      expect(await screen.findByText(/스토리 생성에 실패했습니다/)).toBeInTheDocument()
      
      // 수동 입력 옵션 제공
      expect(screen.getByRole('button', { name: /수동으로 입력/i })).toBeInTheDocument()
    })
  })

  describe('실시간 검증 및 피드백', () => {
    test('입력 중 실시간 유효성 검사', async () => {
      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      
      // 짧은 제목 입력
      await user.type(titleInput, 'a')
      expect(await screen.findByText(/최소 2자 이상/)).toBeInTheDocument()
      
      // 유효한 제목으로 수정
      await user.type(titleInput, 'bc')
      expect(screen.queryByText(/최소 2자 이상/)).not.toBeInTheDocument()
      
      // 성공 피드백
      expect(screen.getByText(/올바른 형식입니다/)).toBeInTheDocument()
    })

    test('AI 추천 기능 작동', async () => {
      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      // 장르 선택 시 AI 추천
      const genreSelect = screen.getByRole('combobox', { name: /장르/i })
      await user.selectOptions(genreSelect, '교육영상')
      
      // AI 추천 배지 표시
      expect(await screen.findByText(/AI 추천/)).toBeInTheDocument()
      
      // 추천된 설정들 자동 적용
      expect(screen.getByRole('combobox', { name: /분량/i })).toHaveValue('3분')
      expect(screen.getByRole('checkbox', { name: '친근한' })).toBeChecked()
    })
  })

  describe('성능 최적화 검증', () => {
    test('디바운싱이 적용된 자동 저장', async () => {
      vi.useFakeTimers()
      const mockAutoSave = vi.fn()
      
      // 자동 저장 API 모킹
      server.use(
        rest.post('/api/plans/:id/autosave', (req, res, ctx) => {
          mockAutoSave()
          return res(ctx.json({ success: true }))
        })
      )

      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      
      // 연속 입력
      await user.type(titleInput, 'a')
      vi.advanceTimersByTime(100)
      await user.type(titleInput, 'b')
      vi.advanceTimersByTime(100)
      await user.type(titleInput, 'c')
      
      // 아직 저장 안됨
      expect(mockAutoSave).not.toHaveBeenCalled()
      
      // 디바운스 시간(500ms) 경과
      vi.advanceTimersByTime(500)
      
      // 한 번만 저장
      expect(mockAutoSave).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    test('대용량 데이터 처리 시 UI 응답성 유지', async () => {
      // 많은 수의 샷 데이터
      const largeData = {
        shotBreakdown: Array.from({ length: 100 }, (_, i) => ({
          shotNumber: i + 1,
          description: `샷 ${i + 1}의 매우 긴 설명...`.repeat(10)
        }))
      }

      server.use(
        rest.post('/api/ai/generate-plan', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: largeData }))
        })
      )

      render(
        <Provider store={store}>
          <AIPlanningPage />
        </Provider>
      )

      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트')
      
      const startTime = performance.now()
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))
      
      // 로딩 표시가 즉시 나타남
      expect(screen.getByText(/생성하고 있습니다/)).toBeInTheDocument()
      
      const loadingTime = performance.now() - startTime
      expect(loadingTime).toBeLessThan(100) // 100ms 이내 응답
    })
  })
})