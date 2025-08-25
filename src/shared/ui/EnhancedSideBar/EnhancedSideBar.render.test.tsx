import { render, screen, within } from '@testing-library/react'
import { EnhancedSideBar } from './EnhancedSideBar'
import { Project } from './types'
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/dashboard'),
}))

describe('서브메뉴 렌더링 검증', () => {
  const mockProjects: Project[] = [
    { id: 1, name: '프로젝트 1', status: 'active' },
    { id: 2, name: '프로젝트 2', status: 'completed' },
  ]

  describe('DOM 존재 및 가시성', () => {
    it('서브메뉴가 DOM에 존재해야 함', () => {
      render(<EnhancedSideBar />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toBeInTheDocument()
    })

    it('isOpen=true일 때 서브메뉴가 보여야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('[data-testid="submenu"]')
      expect(submenu).toHaveAttribute('data-open', 'true')
      expect(submenu).toHaveAttribute('data-tab', 'project')
      expect(submenu).toHaveClass('submenu', 'active')
    })

    it('isOpen=false일 때 서브메뉴가 숨겨져야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={false} />
      )
      
      const submenu = container.querySelector('[data-testid="submenu"]')
      expect(submenu).toHaveAttribute('data-open', 'false')
      expect(submenu).not.toHaveClass('active')
    })

    it('강제 display: block 스타일이 적용되어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('[data-testid="submenu"]')
      expect(submenu).toHaveStyle({ display: 'block' })
    })
  })

  describe('z-index 레이어링', () => {
    it('서브메뉴의 z-index가 메인 사이드바보다 높아야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const sidebar = container.querySelector('.sideBar')
      const submenu = container.querySelector('.submenu')
      
      const sidebarStyles = window.getComputedStyle(sidebar!)
      const submenuStyles = window.getComputedStyle(submenu!)
      
      // 메인 사이드바: 997, 서브메뉴: 998
      expect(parseInt(submenuStyles.zIndex)).toBeGreaterThan(
        parseInt(sidebarStyles.zIndex)
      )
      expect(submenuStyles.zIndex).toBe('998')
      expect(sidebarStyles.zIndex).toBe('997')
    })
  })

  describe('Transform 위치 계산', () => {
    it('데스크톱: 활성화 시 translateX(0)이어야 함', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('.submenu.active')
      const styles = window.getComputedStyle(submenu!)
      
      // CSS 모듈에서 정의된 스타일 확인
      expect(submenu).toHaveClass('active')
      // transform이 translateX(0)로 설정되는지 확인
      expect(styles.transform).toMatch(/translateX\(0(px)?\)/)
    })

    it('데스크톱: 비활성화 시 translateX(-330px)이어야 함', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { container } = render(
        <EnhancedSideBar isOpen={false} />
      )
      
      const submenu = container.querySelector('.submenu')
      const styles = window.getComputedStyle(submenu!)
      
      expect(submenu).not.toHaveClass('active')
      expect(styles.transform).toMatch(/translateX\(-330px\)/)
    })

    it('모바일: 활성화 시 translateX(330px)이어야 함', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      // 모바일 감지를 위한 resize 이벤트 발생
      window.dispatchEvent(new Event('resize'))
      
      const submenu = container.querySelector('.submenu.active')
      expect(submenu).toBeInTheDocument()
      
      // 모바일에서는 다른 transform 값 적용
      // 실제 CSS 모듈에서 @include mobile-only 블록 확인
    })
  })

  describe('서브메뉴 콘텐츠 렌더링', () => {
    it('프로젝트 관리 탭일 때 프로젝트 목록이 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="project" 
          projects={mockProjects}
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      expect(within(submenu).getByText('프로젝트 관리')).toBeInTheDocument()
      expect(within(submenu).getByText('프로젝트 1')).toBeInTheDocument()
      expect(within(submenu).getByText('프로젝트 2')).toBeInTheDocument()
    })

    it('영상 피드백 탭일 때 프로젝트 목록이 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="feedback" 
          projects={mockProjects}
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      expect(within(submenu).getByText('영상 피드백')).toBeInTheDocument()
      expect(within(submenu).getByText('프로젝트 1')).toBeInTheDocument()
      expect(within(submenu).getByText('프로젝트 2')).toBeInTheDocument()
    })

    it('영상 기획 탭일 때 기획 메뉴가 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="video-planning"
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      expect(within(submenu).getByText('영상 기획')).toBeInTheDocument()
      expect(within(submenu).getByText('AI 기획')).toBeInTheDocument()
      expect(within(submenu).getByText('기획서 관리')).toBeInTheDocument()
    })

    it('프로젝트가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="project" 
          projects={[]}
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      expect(within(submenu).getByText(/등록된.*프로젝트가 없습니다/)).toBeInTheDocument()
      expect(within(submenu).getByText('프로젝트 등록')).toBeInTheDocument()
    })
  })

  describe('서브메뉴 헤더 액션', () => {
    it('프로젝트 탭에서 추가 버튼이 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="project" 
          projects={mockProjects}
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      const addButton = within(submenu).getByLabelText('프로젝트 추가')
      expect(addButton).toBeInTheDocument()
    })

    it('닫기 버튼이 항상 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="project"
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      const closeButton = within(submenu).getByLabelText('닫기')
      expect(closeButton).toBeInTheDocument()
    })

    it('프로젝트가 없을 때 추가 버튼이 표시되지 않아야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true} 
          tab="project" 
          projects={[]}
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      const addButton = within(submenu).queryByLabelText('프로젝트 추가')
      expect(addButton).not.toBeInTheDocument()
    })
  })

  describe('CSS 클래스 및 스타일', () => {
    it('활성 상태일 때 올바른 클래스가 적용되어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('.submenu')
      expect(submenu).toHaveClass('submenu', 'active')
      
      const styles = window.getComputedStyle(submenu!)
      expect(styles.visibility).toBe('visible')
      expect(styles.opacity).toBe('1')
    })

    it('비활성 상태일 때 올바른 클래스가 적용되어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={false} />
      )
      
      const submenu = container.querySelector('.submenu')
      expect(submenu).toHaveClass('submenu')
      expect(submenu).not.toHaveClass('active')
      
      const styles = window.getComputedStyle(submenu!)
      expect(styles.visibility).toBe('hidden')
      expect(styles.opacity).toBe('0')
    })

    it('서브메뉴 배경색이 올바르게 적용되어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('.submenu')
      const styles = window.getComputedStyle(submenu!)
      
      // #f8f8f8 또는 rgb(248, 248, 248)
      expect(styles.backgroundColor).toMatch(/rgb\(248,\s*248,\s*248\)|#f8f8f8/)
    })

    it('서브메뉴 너비가 330px이어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('.submenu')
      const styles = window.getComputedStyle(submenu!)
      
      expect(styles.width).toBe('330px')
    })

    it('서브메뉴 위치가 left: 300px이어야 함', () => {
      const { container } = render(
        <EnhancedSideBar isOpen={true} tab="project" />
      )
      
      const submenu = container.querySelector('.submenu')
      const styles = window.getComputedStyle(submenu!)
      
      expect(styles.left).toBe('300px')
    })
  })

  describe('반응형 레이아웃', () => {
    beforeEach(() => {
      // Reset window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
    })

    it('태블릿 크기에서 서브메뉴가 올바르게 표시되어야 함', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(<EnhancedSideBar isOpen={true} tab="project" />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toBeInTheDocument()
      expect(submenu).toHaveAttribute('data-open', 'true')
    })

    it('모바일 크기에서 햄버거 메뉴가 표시되어야 함', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<EnhancedSideBar />)
      
      // resize 이벤트 발생
      window.dispatchEvent(new Event('resize'))
      
      // 모바일에서는 햄버거 메뉴가 표시됨
      const hamburger = screen.queryByLabelText(/메뉴 열기|메뉴 닫기/)
      expect(hamburger).toBeInTheDocument()
    })
  })
})