import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '@/shared/lib/store'
import LoginPage from './page'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render split-screen layout with 2 columns', () => {
    renderWithProvider(<LoginPage />)
    
    const loginContainer = screen.getByTestId('login-page')
    expect(loginContainer).toHaveClass('login-page')
    expect(loginContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      height: '100vh'
    })
  })

  it('should render LoginIntro component in left panel', () => {
    renderWithProvider(<LoginPage />)
    
    const leftPanel = screen.getByTestId('login-intro')
    expect(leftPanel).toBeInTheDocument()
    expect(leftPanel).toHaveAttribute('aria-label', 'VideoPlanet Introduction')
  })

  it('should render LoginForm component in right panel', () => {
    renderWithProvider(<LoginPage />)
    
    const rightPanel = screen.getByTestId('login-form-panel')
    expect(rightPanel).toBeInTheDocument()
    expect(rightPanel).toHaveClass('auth-form')
  })

  it('should have proper responsive design for mobile', () => {
    // Mock window.matchMedia for mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    renderWithProvider(<LoginPage />)
    
    const loginContainer = screen.getByTestId('login-page')
    expect(loginContainer).toHaveClass('login-page', 'mobile')
  })

  it('should maintain exact height and viewport calculations', () => {
    renderWithProvider(<LoginPage />)
    
    const loginContainer = screen.getByTestId('login-page')
    expect(loginContainer).toHaveStyle({
      height: '100vh',
      minHeight: 'calc(var(--vh, 1vh) * 100)'
    })
  })

  it('should handle social login callbacks correctly', async () => {
    renderWithProvider(<LoginPage />)
    
    const googleButton = screen.getByTestId('google-login-button')
    const kakaoButton = screen.getByTestId('kakao-login-button')
    const naverButton = screen.getByTestId('naver-login-button')
    
    expect(googleButton).toBeInTheDocument()
    expect(kakaoButton).toBeInTheDocument()
    expect(naverButton).toBeInTheDocument()
  })

  it('should display proper title and form elements', () => {
    renderWithProvider(<LoginPage />)
    
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument()
  })

  it('should handle navigation to other pages', () => {
    renderWithProvider(<LoginPage />)
    
    const signupLink = screen.getByText('간편 가입하기')
    fireEvent.click(signupLink)
    
    expect(mockPush).toHaveBeenCalledWith('/register')
  })
})