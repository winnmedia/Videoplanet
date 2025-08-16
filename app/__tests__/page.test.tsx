import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HomePage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

describe('HomePage', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    mockPush.mockClear()
  })

  describe('이미지 렌더링 테스트', () => {
    it('emoji 이미지들이 올바른 크기 속성을 가져야 함', () => {
      render(<HomePage />)
      
      const emojiImages = screen.getAllByAltText(/emoji/i)
      
      emojiImages.forEach(img => {
        expect(img).toHaveStyle({
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          objectFit: 'contain'
        })
      })
    })

    it('emoji 이미지들이 적절한 width와 height 속성을 가져야 함', () => {
      render(<HomePage />)
      
      const designerEmoji = screen.getByAltText('Designer emoji')
      expect(designerEmoji).toHaveAttribute('width', '130')
      expect(designerEmoji).toHaveAttribute('height', '130')
      
      const plannerEmoji = screen.getByAltText('Planner emoji')
      expect(plannerEmoji).toHaveAttribute('width', '130')
      expect(plannerEmoji).toHaveAttribute('height', '130')
    })
  })

  describe('로그인 버튼 테스트', () => {
    it('로그인 버튼이 렌더링되어야 함', () => {
      render(<HomePage />)
      
      const loginButtons = screen.getAllByText('로그인')
      expect(loginButtons.length).toBeGreaterThan(0)
    })

    it('바로가기 버튼이 렌더링되어야 함', () => {
      render(<HomePage />)
      
      const goButtons = screen.getAllByText('바로가기')
      expect(goButtons.length).toBeGreaterThan(0)
    })

    it('로그인 버튼 클릭 시 /login으로 이동해야 함', async () => {
      render(<HomePage />)
      
      const loginButton = screen.getAllByText('로그인')[0]
      
      // Wait for hydration
      await waitFor(() => {
        fireEvent.click(loginButton)
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('바로가기 버튼 클릭 시 /login으로 이동해야 함', async () => {
      render(<HomePage />)
      
      const goButton = screen.getAllByText('바로가기')[0]
      
      // Wait for hydration
      await waitFor(() => {
        fireEvent.click(goButton)
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('버튼에 적절한 aria-label이 있어야 함', () => {
      render(<HomePage />)
      
      const loginButton = screen.getByRole('button', { name: /로그인 페이지로 이동/i })
      expect(loginButton).toBeInTheDocument()
    })
  })

  describe('Hydration 테스트', () => {
    it('컴포넌트 마운트 후 isClient 상태가 true가 되어야 함', async () => {
      const { container } = render(<HomePage />)
      
      // Initially, check if component renders
      expect(container.querySelector('#Home')).toBeInTheDocument()
      
      // Wait for useEffect to run
      await waitFor(() => {
        const loginButton = screen.getAllByText('로그인')[0]
        fireEvent.click(loginButton)
        
        // After hydration, navigation should work
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('콘솔 로그 테스트', () => {
    it('버튼 클릭 시 적절한 콘솔 로그가 출력되어야 함', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      
      render(<HomePage />)
      
      const loginButton = screen.getAllByText('로그인')[0]
      
      await waitFor(() => {
        fireEvent.click(loginButton)
        
        expect(consoleSpy).toHaveBeenCalledWith('Login button clicked')
        expect(consoleSpy).toHaveBeenCalledWith('Navigating to login page')
      })
      
      consoleSpy.mockRestore()
    })
  })
})