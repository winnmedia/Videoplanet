import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import { configureStore } from '@reduxjs/toolkit'
import LoginPage from '@/app/(auth)/login/page'
import { authApi } from '@/features/auth/api/authApi'
import * as utilModule from '@/utils/util'

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@/features/auth/api/authApi')
jest.mock('@/utils/util')

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, isAuthenticated: false }, action) => state,
  },
})

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockSearchParams = {
  get: jest.fn(),
}

describe('LoginPage', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(utilModule.checkSession as jest.Mock).mockReturnValue(false)
    ;(utilModule.refetchProject as jest.Mock).mockResolvedValue(undefined)
    
    // localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    })
  })

  const renderLoginPage = () => {
    return render(
      <Provider store={mockStore}>
        <LoginPage />
      </Provider>
    )
  }

  describe('Rendering', () => {
    it('로그인 폼이 올바르게 렌더링된다', () => {
      renderLoginPage()
      
      expect(screen.getByText('로그인')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
      expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument()
      expect(screen.getByText('간편 가입하기')).toBeInTheDocument()
    })

    it('입력 필드가 적절한 속성을 가진다', () => {
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  describe('Form Input', () => {
    it('이메일 입력이 올바르게 동작한다', async () => {
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('비밀번호 입력이 올바르게 동작한다', async () => {
      renderLoginPage()
      
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('Enter 키로 로그인을 시도할 수 있다', async () => {
      ;(authApi.signIn as jest.Mock).mockResolvedValue({
        data: { vridge_session: 'mock-token' }
      })
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(authApi.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })
  })

  describe('Form Validation', () => {
    it('이메일이 비어있으면 에러 메시지를 표시한다', async () => {
      renderLoginPage()
      
      const loginButton = screen.getByRole('button', { name: '로그인' })
      await user.click(loginButton)
      
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })

    it('비밀번호가 비어있으면 에러 메시지를 표시한다', async () => {
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.click(loginButton)
      
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })

    it('공백만 있는 입력을 검증한다', async () => {
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, '   ')
      await user.click(loginButton)
      
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })
  })

  describe('Authentication', () => {
    it('로그인 성공 시 대시보드로 리다이렉트된다', async () => {
      ;(authApi.signIn as jest.Mock).mockResolvedValue({
        data: { vridge_session: 'mock-token' }
      })
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('VGID', JSON.stringify('mock-token'))
        expect(utilModule.refetchProject).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('초대 링크가 있으면 이메일 체크 페이지로 리다이렉트된다', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'uid') return 'test-uid'
        if (key === 'token') return 'test-token'
        return null
      })
      
      ;(authApi.signIn as jest.Mock).mockResolvedValue({
        data: { vridge_session: 'mock-token' }
      })
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/email-check?uid=test-uid&token=test-token')
      })
    })

    it('로그인 실패 시 에러 메시지를 표시한다', async () => {
      const errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.'
      ;(authApi.signIn as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('네트워크 에러 시 기본 에러 메시지를 표시한다', async () => {
      ;(authApi.signIn as jest.Mock).mockRejectedValue(new Error('Network Error'))
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('로그인 중일 때 로딩 상태를 표시한다', async () => {
      ;(authApi.signIn as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)
      
      expect(screen.getByText('로그인 중...')).toBeInTheDocument()
      expect(loginButton).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
    })
  })

  describe('Navigation', () => {
    it('비밀번호 찾기 링크를 클릭하면 비밀번호 재설정 페이지로 이동한다', async () => {
      renderLoginPage()
      
      const resetLink = screen.getByText('비밀번호 찾기')
      await user.click(resetLink)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/reset-password')
    })

    it('회원가입 링크를 클릭하면 회원가입 페이지로 이동한다', async () => {
      renderLoginPage()
      
      const signupLink = screen.getByText('간편 가입하기')
      await user.click(signupLink)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/signup')
    })

    it('키보드로 링크를 활성화할 수 있다', async () => {
      renderLoginPage()
      
      const resetLink = screen.getByText('비밀번호 찾기')
      resetLink.focus()
      await user.keyboard('{Enter}')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/reset-password')
    })
  })

  describe('Session Check', () => {
    it('이미 로그인된 경우 대시보드로 리다이렉트된다', () => {
      ;(utilModule.checkSession as jest.Mock).mockReturnValue(true)
      
      renderLoginPage()
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('로그인된 상태에서 초대 링크가 있으면 이메일 체크로 리다이렉트된다', () => {
      ;(utilModule.checkSession as jest.Mock).mockReturnValue(true)
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'uid') return 'test-uid'
        if (key === 'token') return 'test-token'
        return null
      })
      
      renderLoginPage()
      
      expect(mockRouter.push).toHaveBeenCalledWith('/email-check?uid=test-uid&token=test-token')
    })
  })

  describe('Accessibility', () => {
    it('에러 메시지가 접근성 속성을 가진다', async () => {
      renderLoginPage()
      
      const loginButton = screen.getByRole('button', { name: '로그인' })
      await user.click(loginButton)
      
      const errorElement = screen.getByText('이메일을 입력해주세요.')
      expect(errorElement).toHaveAttribute('role', 'alert')
      expect(errorElement).toHaveAttribute('aria-live', 'polite')
    })

    it('모든 상호작용 요소가 키보드로 접근 가능하다', () => {
      renderLoginPage()
      
      const resetLink = screen.getByText('비밀번호 찾기')
      const signupLink = screen.getByText('간편 가입하기')
      
      expect(resetLink).toHaveAttribute('tabIndex', '0')
      expect(signupLink).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Error Handling', () => {
    it('에러 상태가 올바르게 초기화된다', async () => {
      ;(authApi.signIn as jest.Mock).mockRejectedValue({
        response: { data: { message: '첫 번째 에러' } }
      })
      
      renderLoginPage()
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const loginButton = screen.getByRole('button', { name: '로그인' })
      
      // 첫 번째 로그인 시도 (실패)
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrong')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText('첫 번째 에러')).toBeInTheDocument()
      })
      
      // 두 번째 로그인 시도 전에 에러 메시지가 클리어되는지 확인
      ;(authApi.signIn as jest.Mock).mockResolvedValue({
        data: { vridge_session: 'mock-token' }
      })
      
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correct')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.queryByText('첫 번째 에러')).not.toBeInTheDocument()
      })
    })
  })
})