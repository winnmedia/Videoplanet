import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '../index'
import { LoginForm } from '../ui/LoginForm'
import { RegisterForm } from '../ui/RegisterForm'
import { ForgotPasswordForm } from '../ui/ForgotPasswordForm'

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        loginMethod: null,
        user: null,
        isLoading: false,
        error: null,
        isRegistering: false,
        isForgotPassword: false,
        ...initialState,
      },
    },
  })
}

// Test wrapper component
const TestWrapper = ({ children, initialState }: { children: React.ReactNode; initialState?: any }) => {
  const store = createMockStore(initialState)
  return <Provider store={store}>{children}</Provider>
}

describe('Authentication Components', () => {
  describe('LoginForm', () => {
    test('renders login form with all required fields', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      expect(screen.getByRole('textbox', { name: /이메일/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /로그인 상태 유지/i })).toBeInTheDocument()
    })

    test('displays validation errors for empty fields', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /로그인/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument()
        expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument()
      })
    })

    test('displays validation error for invalid email format', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/올바른 이메일 형식을 입력해주세요/i)).toBeInTheDocument()
      })
    })

    test('shows loading state during submission', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      expect(screen.getByText(/로그인 중.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    test('displays social login options', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Naver/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Kakao/i })).toBeInTheDocument()
    })
  })

  describe('RegisterForm', () => {
    test('renders registration form with all required fields', () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      expect(screen.getByRole('textbox', { name: /이름/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /이메일/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^비밀번호$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/비밀번호 확인/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /서비스 이용약관/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /개인정보처리방침/i })).toBeInTheDocument()
    })

    test('validates password strength requirements', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText(/^비밀번호$/i)
      const submitButton = screen.getByRole('button', { name: /회원가입/i })

      fireEvent.change(passwordInput, { target: { value: 'weak' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다/i)).toBeInTheDocument()
      })
    })

    test('validates password confirmation match', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText(/^비밀번호$/i)
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
      const submitButton = screen.getByRole('button', { name: /회원가입/i })

      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password456!' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
      })
    })

    test('requires terms acceptance', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const nameInput = screen.getByRole('textbox', { name: /이름/i })
      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const passwordInput = screen.getByLabelText(/^비밀번호$/i)
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
      const submitButton = screen.getByRole('button', { name: /회원가입/i })

      fireEvent.change(nameInput, { target: { value: '홍길동' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/서비스 이용약관에 동의해주세요/i)).toBeInTheDocument()
        expect(screen.getByText(/개인정보처리방침에 동의해주세요/i)).toBeInTheDocument()
      })
    })
  })

  describe('ForgotPasswordForm', () => {
    test('renders forgot password form', () => {
      render(
        <TestWrapper>
          <ForgotPasswordForm />
        </TestWrapper>
      )

      expect(screen.getByRole('textbox', { name: /이메일/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /비밀번호 재설정 링크 전송/i })).toBeInTheDocument()
    })

    test('validates email before submission', async () => {
      render(
        <TestWrapper>
          <ForgotPasswordForm />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /비밀번호 재설정 링크 전송/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument()
      })
    })

    test('shows success message after email submission', async () => {
      render(
        <TestWrapper>
          <ForgotPasswordForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const submitButton = screen.getByRole('button', { name: /비밀번호 재설정 링크 전송/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/비밀번호 재설정 링크가 이메일로 전송되었습니다/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('login form has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const passwordInput = screen.getByLabelText(/비밀번호/i)
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      expect(emailInput).toHaveAttribute('aria-label')
      expect(passwordInput).toHaveAttribute('aria-label')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    test('error messages are associated with form fields', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const submitButton = screen.getByRole('button', { name: /로그인/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/이메일을 입력해주세요/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('keyboard navigation works properly', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByRole('textbox', { name: /이메일/i })
      const passwordInput = screen.getByLabelText(/비밀번호/i)

      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)

      fireEvent.keyDown(emailInput, { key: 'Tab' })
      expect(document.activeElement).toBe(passwordInput)
    })
  })
})