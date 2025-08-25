import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AIPlanningPage from '../page'

import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock fetch API
global.fetch = vi.fn()

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
}

describe('AIPlanningPage', () => {
  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('초기 렌더링', () => {
    test('페이지 제목과 설명이 올바르게 표시된다', () => {
      render(<AIPlanningPage />)
      
      expect(screen.getByText('AI 영상 기획 생성')).toBeInTheDocument()
      expect(screen.getByText(/한 줄 스토리와 기본 메타 정보만 입력하면/)).toBeInTheDocument()
    })

    test('기본 정보 섹션이 표시된다', () => {
      render(<AIPlanningPage />)
      
      expect(screen.getByText('기본 정보')).toBeInTheDocument()
      expect(screen.getByLabelText(/영상 제목/)).toBeInTheDocument()
      expect(screen.getByLabelText(/한 줄 스토리/)).toBeInTheDocument()
    })

    test('메타 정보 섹션이 표시된다', () => {
      render(<AIPlanningPage />)
      
      expect(screen.getByText('메타 정보')).toBeInTheDocument()
      expect(screen.getByText(/톤앤매너/)).toBeInTheDocument()
      expect(screen.getByLabelText('장르')).toBeInTheDocument()
      expect(screen.getByLabelText('타겟')).toBeInTheDocument()
    })

    test('생성 버튼이 활성 상태로 표시된다', () => {
      render(<AIPlanningPage />)
      
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      expect(generateButton).toBeInTheDocument()
      expect(generateButton).not.toBeDisabled()
    })
  })

  describe('폼 입력 및 검증', () => {
    test('제목 입력이 올바르게 작동한다', () => {
      render(<AIPlanningPage />)
      
      const titleInput = screen.getByLabelText(/영상 제목/)
      fireEvent.change(titleInput, { target: { value: '테스트 영상' } })
      
      expect(titleInput).toHaveValue('테스트 영상')
    })

    test('한 줄 스토리 입력이 올바르게 작동한다', () => {
      render(<AIPlanningPage />)
      
      const storyTextarea = screen.getByLabelText(/한 줄 스토리/)
      fireEvent.change(storyTextarea, { target: { value: '테스트 스토리입니다' } })
      
      expect(storyTextarea).toHaveValue('테스트 스토리입니다')
    })

    test('톤앤매너 체크박스가 올바르게 작동한다', () => {
      render(<AIPlanningPage />)
      
      // 초기에 '친근한'이 선택되어 있어야 함
      const friendlyCheckbox = screen.getByLabelText('친근한')
      expect(friendlyCheckbox).toBeChecked()
      
      // '전문적인' 체크박스 선택
      const professionalCheckbox = screen.getByLabelText('전문적인')
      fireEvent.click(professionalCheckbox)
      expect(professionalCheckbox).toBeChecked()
      
      // 여러 개 선택 가능한지 확인
      expect(friendlyCheckbox).toBeChecked()
    })

    test('전개 방식 선택이 올바르게 작동한다', () => {
      render(<AIPlanningPage />)
      
      const methodSelect = screen.getByLabelText('전개 방식')
      fireEvent.change(methodSelect, { target: { value: 'hook-immersion-twist-clue' } })
      
      expect(methodSelect).toHaveValue('hook-immersion-twist-clue')
    })

    test('필수 필드 검증이 작동한다', async () => {
      // window.alert 모킹
      window.alert = vi.fn()
      
      render(<AIPlanningPage />)
      
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      fireEvent.click(generateButton)
      
      expect(window.alert).toHaveBeenCalledWith('제목과 한 줄 스토리는 필수 입력 항목입니다.')
    })
  })

  describe('AI 기획서 생성 프로세스', () => {
    test('올바른 정보 입력 후 생성 프로세스가 시작된다', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'test-id',
          title: '테스트 영상',
          storyStages: {
            introduction: { title: '시작', description: '테스트', duration: 15, keyPoints: ['포인트1'] },
            rising: { title: '발전', description: '테스트', duration: 15, keyPoints: ['포인트2'] },
            climax: { title: '절정', description: '테스트', duration: 15, keyPoints: ['포인트3'] },
            conclusion: { title: '결말', description: '테스트', duration: 15, keyPoints: ['포인트4'] }
          },
          shotBreakdown: [],
          generatedAt: new Date().toISOString(),
          status: 'completed'
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(mockResponse)
      })

      render(<AIPlanningPage />)
      
      // 필수 필드 입력
      const titleInput = screen.getByLabelText(/영상 제목/)
      const storyTextarea = screen.getByLabelText(/한 줄 스토리/)
      
      fireEvent.change(titleInput, { target: { value: '테스트 영상' } })
      fireEvent.change(storyTextarea, { target: { value: '테스트 스토리' } })
      
      // 생성 버튼 클릭
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      fireEvent.click(generateButton)
      
      // 생성 중 UI 표시 확인
      await waitFor(() => {
        expect(screen.getByText('AI가 영상 기획서를 생성하고 있습니다')).toBeInTheDocument()
      })
      
      // 프로그레스 바 확인
      expect(screen.getByText('스토리 구조 분석')).toBeInTheDocument()
      expect(screen.getByText('4단계 스토리 생성')).toBeInTheDocument()
    })

    test('생성 완료 후 결과 화면이 표시된다', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'test-id',
          title: '테스트 영상',
          genre: '홍보영상',
          duration: '60초',
          target: '20-30대',
          storyStages: {
            introduction: { title: '시작', description: '테스트', duration: 15, keyPoints: ['포인트1'] },
            rising: { title: '발전', description: '테스트', duration: 15, keyPoints: ['포인트2'] },
            climax: { title: '절정', description: '테스트', duration: 15, keyPoints: ['포인트3'] },
            conclusion: { title: '결말', description: '테스트', duration: 15, keyPoints: ['포인트4'] }
          },
          shotBreakdown: [
            {
              shotNumber: 1,
              storyStage: 'introduction' as const,
              shotType: '풀샷',
              cameraMovement: '고정',
              composition: '중앙',
              duration: 5,
              description: '테스트 장면',
              dialogue: '테스트 대사'
            }
          ],
          generatedAt: new Date().toISOString(),
          status: 'completed' as const
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(mockResponse)
      })

      render(<AIPlanningPage />)
      
      // 필수 필드 입력 및 생성
      const titleInput = screen.getByLabelText(/영상 제목/)
      const storyTextarea = screen.getByLabelText(/한 줄 스토리/)
      
      fireEvent.change(titleInput, { target: { value: '테스트 영상' } })
      fireEvent.change(storyTextarea, { target: { value: '테스트 스토리' } })
      
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      fireEvent.click(generateButton)
      
      // 결과 화면 표시 대기 및 확인
      await waitFor(() => {
        expect(screen.getByText('AI 영상 기획서 생성 완료!')).toBeInTheDocument()
      }, { timeout: 10000 })
      
      expect(screen.getByText('"테스트 영상" 기획서가 성공적으로 생성되었습니다.')).toBeInTheDocument()
      expect(screen.getByText('4단계 스토리 구조')).toBeInTheDocument()
      expect(screen.getByText('12개 숏트 분해')).toBeInTheDocument()
    })
  })

  describe('에러 처리', () => {
    test('API 에러 시 적절한 에러 메시지가 표시된다', async () => {
      window.alert = vi.fn()
      
      ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

      render(<AIPlanningPage />)
      
      // 필수 필드 입력
      const titleInput = screen.getByLabelText(/영상 제목/)
      const storyTextarea = screen.getByLabelText(/한 줄 스토리/)
      
      fireEvent.change(titleInput, { target: { value: '테스트 영상' } })
      fireEvent.change(storyTextarea, { target: { value: '테스트 스토리' } })
      
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('AI 기획서 생성 중 오류가 발생했습니다.')
      })
    })
  })

  describe('접근성', () => {
    test('모든 form 요소가 적절한 label을 가진다', () => {
      render(<AIPlanningPage />)
      
      expect(screen.getByLabelText(/영상 제목/)).toBeInTheDocument()
      expect(screen.getByLabelText(/한 줄 스토리/)).toBeInTheDocument()
      expect(screen.getByLabelText('장르')).toBeInTheDocument()
      expect(screen.getByLabelText('타겟')).toBeInTheDocument()
      expect(screen.getByLabelText('분량')).toBeInTheDocument()
      expect(screen.getByLabelText('템포')).toBeInTheDocument()
      expect(screen.getByLabelText('전개 방식')).toBeInTheDocument()
      expect(screen.getByLabelText('전개 강도')).toBeInTheDocument()
    })

    test('버튼들이 적절한 role과 이름을 가진다', () => {
      render(<AIPlanningPage />)
      
      const generateButton = screen.getByRole('button', { name: /AI 기획서 생성하기/ })
      expect(generateButton).toBeInTheDocument()
    })
  })
})