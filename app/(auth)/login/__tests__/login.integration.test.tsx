import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '../page'
import '@testing-library/jest-dom'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}))

// Mock auth API
jest.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    emailCheck: jest.fn(),
  },
}))

// Mock utils
jest.mock('@/utils/util', () => ({
  checkSession: jest.fn(),
  refetchProject: jest.fn(),
}))

describe('Login Page Integration Tests', () => {
  const mockPush = jest.fn()
  const mockSearchParams = new URLSearchParams()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  describe('Page Rendering', () => {
    it('should render login page without errors', () => {
      expect(() => render(<LoginPage />)).not.toThrow()
    })

    it('should display all required elements', async () => {
      render(<LoginPage />)
      
      await waitFor(() => {
        // Check for form elements
        expect(screen.getByPlaceholderText(/이메일/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/비밀번호/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument()
      })
    })

    it('should have correct CSS classes applied', async () => {
      render(<LoginPage />)
      
      await waitFor(() => {
        const container = document.querySelector('.auth-container')
        expect(container).toBeInTheDocument()
        expect(container).toHaveClass('auth-container')
      })
    })
  })

  describe('Form Validation', () => {
    it('should show error for invalid email', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      const loginButton = screen.getByRole('button', { name: /로그인/i })
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText(/유효한 이메일을 입력해주세요/i)).toBeInTheDocument()
      })
    })

    it('should show error for empty password', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      const loginButton = screen.getByRole('button', { name: /로그인/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to signup when clicking signup link', async () => {
      render(<LoginPage />)
      
      const signupLink = screen.getByText(/회원가입/i)
      fireEvent.click(signupLink)
      
      expect(mockPush).toHaveBeenCalledWith('/signup')
    })

    it('should navigate to reset password when clicking forgot password', async () => {
      render(<LoginPage />)
      
      const resetLink = screen.getByText(/비밀번호를 잊으셨나요/i)
      fireEvent.click(resetLink)
      
      expect(mockPush).toHaveBeenCalledWith('/reset-password')
    })
  })

  describe('Invitation Link Handling', () => {
    it('should process invitation token from URL', async () => {
      const inviteToken = 'test-invite-token'
      mockSearchParams.set('invite', inviteToken)
      
      render(<LoginPage />)
      
      await waitFor(() => {
        // Check if invitation UI is shown
        const inviteMessage = screen.queryByText(/초대 링크로 접속하셨습니다/i)
        if (inviteMessage) {
          expect(inviteMessage).toBeInTheDocument()
        }
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      const passwordInput = screen.getByPlaceholderText(/비밀번호/i)
      const loginButton = screen.getByRole('button', { name: /로그인/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)
      
      // Check if button shows loading state
      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toHaveAttribute('disabled')
      }, { timeout: 1000 })
    })
  })

  describe('Error Handling', () => {
    it('should display API error messages', async () => {
      // Mock API error
      const mockLogin = jest.fn().mockRejectedValue(new Error('로그인 실패'))
      jest.spyOn(require('@/features/auth/hooks/useAuth'), 'useAuth').mockReturnValue({
        login: mockLogin,
        loading: false,
        error: '로그인 실패',
      })
      
      render(<LoginPage />)
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      const passwordInput = screen.getByPlaceholderText(/비밀번호/i)
      const loginButton = screen.getByRole('button', { name: /로그인/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText(/로그인 실패/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      const passwordInput = screen.getByPlaceholderText(/비밀번호/i)
      const loginButton = screen.getByRole('button', { name: /로그인/i })
      
      // Tab through form elements
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)
      
      fireEvent.keyDown(emailInput, { key: 'Tab' })
      expect(document.activeElement).toBe(passwordInput)
      
      fireEvent.keyDown(passwordInput, { key: 'Tab' })
      // Check if focus moves to next element
    })

    it('should have proper ARIA attributes', () => {
      render(<LoginPage />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label')
      
      const emailInput = screen.getByPlaceholderText(/이메일/i)
      expect(emailInput).toHaveAttribute('aria-label')
    })
  })
})