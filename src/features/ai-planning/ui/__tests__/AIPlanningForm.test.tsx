import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { axe, toHaveNoViolations } from 'jest-axe'

// 테스트를 위한 모의 컴포넌트 (실제 구현 필요)
import { AIPlanningForm } from '../AIPlanningForm'
import videoPlanningReducer from '@/entities/video-planning/model/video-planning.slice'

// jest-axe 매처 확장
expect.extend(toHaveNoViolations)

// 테스트용 스토어 생성 유틸리티
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      videoPlanning: videoPlanningReducer
    },
    preloadedState: initialState
  })
}

describe('AIPlanningForm - 종합 UI 테스트', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = createTestStore()
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('1. 입력 유효성 검사', () => {
    describe('제목 필드', () => {
      test('최소 길이(2자) 미만 입력 시 에러 표시', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
        await user.type(titleInput, 'a')
        await user.tab() // blur 이벤트 발생

        expect(await screen.findByText('제목은 최소 2자 이상이어야 합니다')).toBeInTheDocument()
      })

      test('최대 길이(100자) 초과 입력 시 더 이상 입력되지 않음', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
        const longText = 'a'.repeat(101)
        await user.type(titleInput, longText)

        expect(titleInput).toHaveValue('a'.repeat(100))
        expect(screen.getByText('100/100')).toBeInTheDocument()
      })

      test('특수문자 입력 제한 검증', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
        await user.type(titleInput, '테스트@#$%영상')

        expect(await screen.findByText('제목에 특수문자는 사용할 수 없습니다')).toBeInTheDocument()
      })
    })

    describe('한 줄 스토리 필드', () => {
      test('최소 길이(10자) 검증', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })
        await user.type(storyInput, '짧은내용')
        await user.tab()

        expect(await screen.findByText('스토리는 최소 10자 이상 작성해주세요')).toBeInTheDocument()
      })

      test('최대 길이(500자) 표시 및 제한', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })
        const longStory = '테스트 '.repeat(100) // 400자
        await user.type(storyInput, longStory)

        expect(screen.getByText(/400\/500/)).toBeInTheDocument()
        expect(storyInput).toHaveAttribute('aria-invalid', 'false')
      })

      test('공백만 입력 시 에러 표시', async () => {
        render(
          <Provider store={store}>
            <AIPlanningForm />
          </Provider>
        )

        const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })
        await user.type(storyInput, '          ')
        await user.tab()

        expect(await screen.findByText('유효한 내용을 입력해주세요')).toBeInTheDocument()
      })
    })
  })

  describe('2. 전개방식 선택 테스트', () => {
    const developmentMethods = [
      { value: 'hook-immersion-twist-bait', label: '훅-몰입-반전-떡밥' },
      { value: 'classic-kishōtenketsu', label: '클래식 기승전결' },
      { value: 'inductive', label: '귀납법' },
      { value: 'deductive', label: '연역법' },
      { value: 'documentary', label: '다큐(인터뷰식)' },
      { value: 'pixar-story', label: '픽사스토리' }
    ]

    test.each(developmentMethods)('$label 선택 시 상세 설명 표시', async ({ value, label }) => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const methodButton = screen.getByRole('button', { name: new RegExp(label) })
      await user.click(methodButton)

      expect(methodButton).toHaveAttribute('aria-pressed', 'true')
      expect(methodButton).toHaveClass('selected')
      
      // 선택된 방식의 설명이 표시되는지 확인
      const description = methodButton.querySelector('.methodDesc')
      expect(description).toBeVisible()
    })

    test('전개방식 변경 시 이전 선택 해제', async () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const method1 = screen.getByRole('button', { name: /훅-몰입-반전-떡밥/ })
      const method2 = screen.getByRole('button', { name: /클래식 기승전결/ })

      await user.click(method1)
      expect(method1).toHaveAttribute('aria-pressed', 'true')

      await user.click(method2)
      expect(method1).toHaveAttribute('aria-pressed', 'false')
      expect(method2).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('3. 장르별 템플릿 변경', () => {
    const genres = [
      { value: '홍보영상', expectedTones: ['전문적인', '신뢰감 있는'] },
      { value: '교육영상', expectedTones: ['친근한', '명확한'] },
      { value: '브랜딩영상', expectedTones: ['감성적인', '세련된'] },
      { value: '제품소개', expectedTones: ['혁신적인', '모던한'] }
    ]

    test.each(genres)('$value 선택 시 추천 톤앤매너 자동 선택', async ({ value, expectedTones }) => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const genreSelect = screen.getByRole('combobox', { name: /장르/i })
      await user.selectOptions(genreSelect, value)

      // 추천 톤앤매너가 자동으로 선택되는지 확인
      for (const tone of expectedTones) {
        const toneCheckbox = screen.getByRole('checkbox', { name: tone })
        expect(toneCheckbox).toBeChecked()
      }
    })

    test('장르 변경 시 기본 분량 자동 설정', async () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const genreSelect = screen.getByRole('combobox', { name: /장르/i })
      const durationSelect = screen.getByRole('combobox', { name: /분량/i })

      // 홍보영상 선택 시 60초 기본값
      await user.selectOptions(genreSelect, '홍보영상')
      expect(durationSelect).toHaveValue('60초')

      // 교육영상 선택 시 3분 기본값
      await user.selectOptions(genreSelect, '교육영상')
      expect(durationSelect).toHaveValue('3분')
    })
  })

  describe('4. 에러 상태 처리', () => {
    test('네트워크 에러 발생 시 재시도 버튼 표시', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network Error'))
      global.fetch = mockFetch

      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // 필수 필드 입력
      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트 영상')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트 스토리입니다')

      // 생성 버튼 클릭
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))

      // 에러 메시지와 재시도 버튼 확인
      expect(await screen.findByText(/네트워크 오류가 발생했습니다/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /재시도/i })).toBeInTheDocument()
    })

    test('API 응답 실패 시 상세 에러 메시지 표시', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: '입력값이 올바르지 않습니다' })
      })
      global.fetch = mockFetch

      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // 필수 필드 입력 및 제출
      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트 스토리')
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))

      expect(await screen.findByText('입력값이 올바르지 않습니다')).toBeInTheDocument()
    })

    test('타임아웃 에러 처리', async () => {
      vi.useFakeTimers()
      
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 30000) // 30초 지연
        })
      )
      global.fetch = mockFetch

      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // 필수 필드 입력 및 제출
      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트 스토리')
      await user.click(screen.getByRole('button', { name: /AI 기획서 생성하기/i }))

      // 15초 후 타임아웃 에러
      vi.advanceTimersByTime(15000)
      
      expect(await screen.findByText(/요청 시간이 초과되었습니다/)).toBeInTheDocument()
      
      vi.useRealTimers()
    })
  })

  describe('5. 접근성(a11y) 테스트', () => {
    test('전체 폼이 WCAG 2.1 AA 기준을 충족', async () => {
      const { container } = render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('키보드 네비게이션이 올바른 순서로 작동', async () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })
      const firstToneCheckbox = screen.getByRole('checkbox', { name: '친근한' })

      // Tab 키로 순차 이동
      titleInput.focus()
      expect(document.activeElement).toBe(titleInput)

      await user.tab()
      expect(document.activeElement).toBe(storyInput)

      await user.tab()
      expect(document.activeElement).toBe(firstToneCheckbox)
    })

    test('필수 필드에 aria-required 속성 존재', () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      const storyInput = screen.getByRole('textbox', { name: /한 줄 스토리/i })

      expect(titleInput).toHaveAttribute('aria-required', 'true')
      expect(storyInput).toHaveAttribute('aria-required', 'true')
    })

    test('에러 상태에서 적절한 ARIA 속성 설정', async () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      await user.type(titleInput, 'a') // 최소 길이 미달
      await user.tab()

      const errorMessage = await screen.findByText('제목은 최소 2자 이상이어야 합니다')
      expect(titleInput).toHaveAttribute('aria-invalid', 'true')
      expect(titleInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'))
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })

    test('로딩 상태에서 aria-busy 속성 활성화', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      global.fetch = mockFetch

      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '테스트 스토리')
      
      const submitButton = screen.getByRole('button', { name: /AI 기획서 생성하기/i })
      await user.click(submitButton)

      expect(submitButton).toHaveAttribute('aria-busy', 'true')
      expect(submitButton).toBeDisabled()
    })

    test('스크린 리더를 위한 숨김 텍스트 제공', () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // 시각적으로 숨겨진 도움말 텍스트 확인
      expect(screen.getByText(/필수 입력 항목입니다/i, { selector: '.sr-only' })).toBeInTheDocument()
      expect(screen.getByText(/여러 개 선택 가능/i, { selector: '.sr-only' })).toBeInTheDocument()
    })

    test('색상 대비가 WCAG AA 기준 충족', async () => {
      const { container } = render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // axe-core의 색상 대비 규칙만 실행
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })

      expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0)
    })

    test('포커스 표시기가 명확하게 보임', () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      titleInput.focus()

      const styles = window.getComputedStyle(titleInput)
      expect(styles.outlineWidth).not.toBe('0px')
      expect(styles.outlineStyle).not.toBe('none')
    })
  })

  describe('6. 반응형 디자인 테스트', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ]

    test.each(viewports)('$name 뷰포트에서 레이아웃 정상 작동', async ({ width, height }) => {
      global.innerWidth = width
      global.innerHeight = height
      global.dispatchEvent(new Event('resize'))

      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      const form = screen.getByRole('form')
      expect(form).toBeVisible()

      // 모바일에서는 세로 정렬, 데스크톱에서는 그리드
      if (width < 768) {
        expect(form).toHaveStyle({ display: 'flex', flexDirection: 'column' })
      } else {
        expect(form).toHaveStyle({ display: 'grid' })
      }
    })
  })

  describe('7. 폼 상태 관리', () => {
    test('자동 저장 기능 작동', async () => {
      vi.useFakeTimers()
      const mockSave = vi.fn()
      
      render(
        <Provider store={store}>
          <AIPlanningForm onAutoSave={mockSave} />
        </Provider>
      )

      const titleInput = screen.getByRole('textbox', { name: /영상 제목/i })
      await user.type(titleInput, '테스트 영상')

      // 3초 후 자동 저장
      vi.advanceTimersByTime(3000)
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        title: '테스트 영상'
      }))

      vi.useRealTimers()
    })

    test('폼 리셋 기능', async () => {
      render(
        <Provider store={store}>
          <AIPlanningForm />
        </Provider>
      )

      // 데이터 입력
      await user.type(screen.getByRole('textbox', { name: /영상 제목/i }), '테스트')
      await user.type(screen.getByRole('textbox', { name: /한 줄 스토리/i }), '스토리')
      
      // 리셋 버튼 클릭
      await user.click(screen.getByRole('button', { name: /초기화/i }))

      // 확인 다이얼로그
      await user.click(screen.getByRole('button', { name: /확인/i }))

      expect(screen.getByRole('textbox', { name: /영상 제목/i })).toHaveValue('')
      expect(screen.getByRole('textbox', { name: /한 줄 스토리/i })).toHaveValue('')
    })
  })
})