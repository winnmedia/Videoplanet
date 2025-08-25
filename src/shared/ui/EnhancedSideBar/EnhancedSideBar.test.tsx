import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import { EnhancedSideBar } from './EnhancedSideBar'
import { Project } from './types'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

describe('EnhancedSideBar', () => {
  const mockPush = jest.fn()
  const mockProjects: Project[] = [
    { id: 1, name: '프로젝트 1', status: 'active' },
    { id: 2, name: '프로젝트 2', status: 'completed' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')

    // Mock localStorage
    Storage.prototype.removeItem = jest.fn()
  })

  describe('접근성 (Accessibility)', () => {
    it('올바른 ARIA 속성을 가져야 한다', () => {
      render(<EnhancedSideBar ariaLabel="메인 네비게이션" />)
      
      const nav = screen.getByRole('navigation', { name: '메인 네비게이션' })
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveAttribute('aria-label', '메인 네비게이션')
    })

    it('키보드 네비게이션이 가능해야 한다', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar />)
      
      const homeButton = screen.getByRole('button', { name: /홈/i })
      const planningButton = screen.getByRole('button', { name: /전체 일정/i })
      
      // Tab 키로 포커스 이동
      await user.tab()
      expect(homeButton).toHaveFocus()
      
      await user.tab()
      expect(planningButton).toHaveFocus()
      
      // Enter 키로 메뉴 선택
      await user.keyboard('{Enter}')
      expect(mockPush).toHaveBeenCalledWith('/planning')
    })

    it('Escape 키로 서브메뉴를 닫을 수 있어야 한다', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          onClose={mockOnClose}
          projects={mockProjects}
        />
      )
      
      await user.keyboard('{Escape}')
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('스크린 리더를 위한 현재 페이지 표시가 있어야 한다', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
      render(<EnhancedSideBar />)
      
      const homeButton = screen.getByRole('button', { name: /홈/i })
      expect(homeButton).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('모바일 반응형', () => {
    it('모바일에서 햄버거 메뉴가 표시되어야 한다', () => {
      // window.innerWidth를 모바일 크기로 설정
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<EnhancedSideBar />)
      
      const hamburgerButton = screen.getByRole('button', { name: /메뉴 열기/i })
      expect(hamburgerButton).toBeInTheDocument()
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('햄버거 메뉴 클릭 시 사이드바가 슬라이드 인/아웃 되어야 한다', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<EnhancedSideBar />)
      
      const hamburgerButton = screen.getByRole('button', { name: /메뉴 열기/i })
      const sidebar = screen.getByRole('navigation')
      
      // 초기 상태: 닫혀있음
      expect(sidebar).toHaveAttribute('data-open', 'false')
      
      // 햄버거 메뉴 클릭: 열림
      await user.click(hamburgerButton)
      expect(sidebar).toHaveAttribute('data-open', 'true')
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')
      expect(hamburgerButton).toHaveAttribute('aria-label', '메뉴 닫기')
      
      // 다시 클릭: 닫힘
      await user.click(hamburgerButton)
      expect(sidebar).toHaveAttribute('data-open', 'false')
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('모바일에서 배경 오버레이 클릭 시 사이드바가 닫혀야 한다', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<EnhancedSideBar isOpen={true} />)
      
      const overlay = screen.getByTestId('sidebar-overlay')
      await user.click(overlay)
      
      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveAttribute('data-open', 'false')
    })
  })

  describe('검색 기능', () => {
    it('검색바가 표시되어야 한다', () => {
      render(<EnhancedSideBar searchable={true} searchPlaceholder="메뉴 검색..." />)
      
      const searchInput = screen.getByRole('searchbox', { name: /메뉴 검색/i })
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', '메뉴 검색...')
    })

    it('검색어 입력 시 메뉴가 필터링되어야 한다', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar searchable={true} projects={mockProjects} />)
      
      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, '프로젝트')
      
      // 프로젝트 관련 메뉴만 표시
      expect(screen.getByRole('button', { name: /프로젝트 관리/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /홈/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /전체 일정/i })).not.toBeInTheDocument()
    })

    it('검색 결과가 없을 때 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar searchable={true} />)
      
      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'xyz123')
      
      expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
    })

    it('검색어 지우기 버튼이 작동해야 한다', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar searchable={true} />)
      
      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, '검색어')
      
      const clearButton = screen.getByRole('button', { name: /검색어 지우기/i })
      expect(clearButton).toBeInTheDocument()
      
      await user.click(clearButton)
      expect(searchInput).toHaveValue('')
      
      // 모든 메뉴가 다시 표시되어야 함
      expect(screen.getByRole('button', { name: /홈/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /전체 일정/i })).toBeInTheDocument()
    })
  })

  describe('브레드크럼 네비게이션', () => {
    it('브레드크럼이 표시되어야 한다', () => {
      const breadcrumbs = [
        { label: '홈', path: '/dashboard' },
        { label: '프로젝트', path: '/projects' },
        { label: '프로젝트 1' },
      ]
      
      render(<EnhancedSideBar breadcrumbs={breadcrumbs} />)
      
      const nav = screen.getByRole('navigation', { name: /브레드크럼/i })
      expect(nav).toBeInTheDocument()
      
      const items = within(nav).getAllByRole('listitem')
      expect(items).toHaveLength(3)
      
      // 마지막 아이템은 현재 페이지를 나타냄
      expect(items[2]).toHaveAttribute('aria-current', 'page')
    })

    it('브레드크럼 아이템 클릭 시 해당 경로로 이동해야 한다', async () => {
      const user = userEvent.setup()
      const breadcrumbs = [
        { label: '홈', path: '/dashboard' },
        { label: '프로젝트', path: '/projects' },
        { label: '프로젝트 1' },
      ]
      
      render(<EnhancedSideBar breadcrumbs={breadcrumbs} />)
      
      const homeLink = screen.getByRole('link', { name: /홈/i })
      await user.click(homeLink)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('터치 타겟', () => {
    it('모든 인터랙티브 요소가 최소 44x44px 크기를 가져야 한다', () => {
      render(<EnhancedSideBar projects={mockProjects} />)
      
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const width = parseFloat(styles.minWidth) || parseFloat(styles.width)
        const height = parseFloat(styles.minHeight) || parseFloat(styles.height)
        
        expect(width).toBeGreaterThanOrEqual(44)
        expect(height).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe('기본 기능', () => {
    it('메뉴 아이템을 렌더링해야 한다', () => {
      render(<EnhancedSideBar />)
      
      expect(screen.getByRole('button', { name: /홈/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /전체 일정/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /프로젝트 관리/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /영상 기획/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /영상 피드백/i })).toBeInTheDocument()
    })

    it('현재 경로에 따라 활성 메뉴를 표시해야 한다', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
      render(<EnhancedSideBar />)
      
      const homeButton = screen.getByRole('button', { name: /홈/i })
      expect(homeButton).toHaveClass('active')
      expect(homeButton).toHaveAttribute('aria-current', 'page')
    })

    it('메뉴 클릭 시 올바른 경로로 이동해야 한다', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar />)
      
      const planningButton = screen.getByRole('button', { name: /전체 일정/i })
      await user.click(planningButton)
      
      expect(mockPush).toHaveBeenCalledWith('/planning')
    })

    it('프로젝트 개수 배지를 표시해야 한다', () => {
      render(<EnhancedSideBar projects={mockProjects} />)
      
      const badge = screen.getByText('2')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-label', '프로젝트 2개')
    })

    it('로그아웃 버튼이 작동해야 한다', async () => {
      const user = userEvent.setup()
      const mockOnLogout = jest.fn()
      
      render(<EnhancedSideBar onLogout={mockOnLogout} />)
      
      const logoutButton = screen.getByRole('button', { name: /로그아웃/i })
      await user.click(logoutButton)
      
      expect(mockOnLogout).toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalledWith('isAuthenticated')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('서브메뉴', () => {
    it('프로젝트 관리 클릭 시 서브메뉴가 열려야 한다', async () => {
      const user = userEvent.setup()
      const mockOnMenuClick = jest.fn()
      
      render(
        <EnhancedSideBar 
          projects={mockProjects}
          onMenuClick={mockOnMenuClick}
        />
      )
      
      const projectButton = screen.getByRole('button', { name: /프로젝트 관리/i })
      await user.click(projectButton)
      
      expect(mockOnMenuClick).toHaveBeenCalledWith('project')
      
      // 서브메뉴가 표시되어야 함
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 2')).toBeInTheDocument()
    })

    it('서브메뉴 닫기 버튼이 작동해야 한다', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()
      
      render(
        <EnhancedSideBar 
          tab="project"
          isOpen={true}
          projects={mockProjects}
          onClose={mockOnClose}
        />
      )
      
      const closeButton = screen.getByRole('button', { name: /닫기/i })
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('프로젝트 생성 버튼이 작동해야 한다', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          tab="project"
          isOpen={true}
          projects={mockProjects}
        />
      )
      
      const createButton = screen.getByRole('button', { name: /프로젝트 추가/i })
      await user.click(createButton)
      
      expect(mockPush).toHaveBeenCalledWith('/projects/create')
    })
  })

  describe('포커스 관리', () => {
    it('메뉴가 열릴 때 첫 번째 아이템에 포커스가 이동해야 한다', async () => {
      render(<EnhancedSideBar isOpen={true} />)
      
      await waitFor(() => {
        const firstMenuItem = screen.getAllByRole('button')[0]
        expect(firstMenuItem).toHaveFocus()
      })
    })

    it('탭 트랩이 작동해야 한다 (포커스가 사이드바 내에서만 순환)', async () => {
      const user = userEvent.setup()
      render(<EnhancedSideBar isOpen={true} />)
      
      const buttons = screen.getAllByRole('button')
      const firstButton = buttons[0]
      const lastButton = buttons[buttons.length - 1]
      
      // 마지막 요소에서 Tab 키를 누르면 첫 번째 요소로 이동
      lastButton.focus()
      await user.tab()
      expect(firstButton).toHaveFocus()
      
      // 첫 번째 요소에서 Shift+Tab을 누르면 마지막 요소로 이동
      firstButton.focus()
      await user.tab({ shift: true })
      expect(lastButton).toHaveFocus()
    })
  })
})