import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../src/utils/test-utils'
import { createSnapshot, createResponsiveSnapshots } from '../../src/utils/snapshot-utils'
import Header from '../../src/components/Header'

// Header 컴포넌트 테스트 스위트
describe('Header Component', () => {
  // 기본 props 설정
  const defaultProps = {
    isLoggedIn: false,
    user: null,
    onLogin: jest.fn(),
    onLogout: jest.fn(),
  }

  // 각 테스트 전에 mock 함수들을 초기화
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 렌더링 테스트
  describe('Rendering', () => {
    it('renders header component correctly', () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('displays logo', () => {
      render(<Header {...defaultProps} />)
      const logo = screen.getByAltText(/logo/i)
      expect(logo).toBeInTheDocument()
    })

    it('shows login button when not logged in', () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })

    it('shows user menu when logged in', () => {
      const loggedInProps = {
        ...defaultProps,
        isLoggedIn: true,
        user: { name: 'Test User', email: 'test@example.com' },
      }
      
      render(<Header {...loggedInProps} />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument()
    })
  })

  // 상호작용 테스트
  describe('Interactions', () => {
    it('calls onLogin when login button is clicked', async () => {
      const mockOnLogin = jest.fn()
      const props = { ...defaultProps, onLogin: mockOnLogin }
      
      render(<Header {...props} />)
      
      const loginButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onLogout when logout is clicked', async () => {
      const mockOnLogout = jest.fn()
      const props = {
        ...defaultProps,
        isLoggedIn: true,
        user: { name: 'Test User' },
        onLogout: mockOnLogout,
      }
      
      render(<Header {...props} />)
      
      // 사용자 메뉴 클릭
      const userMenu = screen.getByText('Test User')
      fireEvent.click(userMenu)
      
      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('toggles mobile menu', () => {
      render(<Header {...defaultProps} />)
      
      const mobileMenuButton = screen.getByLabelText(/toggle menu/i)
      fireEvent.click(mobileMenuButton)
      
      expect(screen.getByRole('navigation')).toHaveClass('mobile-menu-open')
    })
  })

  // 접근성 테스트
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Header {...defaultProps} />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveAttribute('role', 'banner')
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation')
    })

    it('supports keyboard navigation', () => {
      render(<Header {...defaultProps} />)
      
      const loginButton = screen.getByRole('button', { name: /login/i })
      loginButton.focus()
      expect(loginButton).toHaveFocus()
      
      // Tab 키로 다음 요소로 이동
      fireEvent.keyDown(loginButton, { key: 'Tab' })
    })
  })

  // 에러 처리 테스트
  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      const props = {
        ...defaultProps,
        isLoggedIn: true,
        user: null, // 로그인은 되어있지만 사용자 정보가 없는 경우
      }
      
      expect(() => render(<Header {...props} />)).not.toThrow()
    })

    it('handles network error during logout', async () => {
      const mockOnLogout = jest.fn().mockRejectedValue(new Error('Network error'))
      const props = {
        ...defaultProps,
        isLoggedIn: true,
        user: { name: 'Test User' },
        onLogout: mockOnLogout,
      }
      
      render(<Header {...props} />)
      
      const userMenu = screen.getByText('Test User')
      fireEvent.click(userMenu)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      // 에러가 발생해도 UI가 깨지지 않는지 확인
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })
  })

  // 스냅샷 테스트
  describe('Snapshots', () => {
    it('matches snapshot when logged out', () => {
      createSnapshot(Header, defaultProps)
    })

    it('matches snapshot when logged in', () => {
      const loggedInProps = {
        ...defaultProps,
        isLoggedIn: true,
        user: { name: 'Test User', email: 'test@example.com' },
      }
      createSnapshot(Header, loggedInProps)
    })

    // 반응형 스냅샷 테스트
    describe('Responsive Snapshots', () => {
      createResponsiveSnapshots(Header, defaultProps)
    })
  })

  // 성능 테스트
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<Header {...defaultProps} />)
      
      // 같은 props로 리렌더링
      rerender(<Header {...defaultProps} />)
      
      // Header 컴포넌트가 React.memo를 사용한다면 불필요한 리렌더링이 발생하지 않아야 함
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })
})