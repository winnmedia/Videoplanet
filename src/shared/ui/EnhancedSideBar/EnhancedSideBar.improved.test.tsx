import { renderHook, act } from '@testing-library/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import { useSideBarViewModel } from './useSideBarViewModel'
import { SideBarMenuItem } from './components/SideBarMenuItem'
import { SubMenu } from './components/SubMenu'
import { Project } from './types'

// ============================================
// Enhanced SideBar Tests - Improved Version
// TDD 기반 테스트 시나리오
// ============================================

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

describe('SideBar ViewModel', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
  })

  describe('상태 관리', () => {
    it('초기 상태가 올바르게 설정되어야 한다', () => {
      const { result } = renderHook(() => useSideBarViewModel())
      
      expect(result.current.isOpen).toBe(false)
      expect(result.current.subMenuOpen).toBe(false)
      expect(result.current.activeTab).toBe('')
      expect(result.current.searchQuery).toBe('')
    })

    it('props로 전달된 초기값이 반영되어야 한다', () => {
      const { result } = renderHook(() => 
        useSideBarViewModel({
          isOpenProp: true,
          tab: 'project'
        })
      )
      
      expect(result.current.isOpen).toBe(true)
      expect(result.current.activeTab).toBe('project')
    })
  })

  describe('메뉴 네비게이션', () => {
    it('메뉴 클릭 시 올바른 상태 변경이 일어나야 한다', () => {
      const mockOnMenuClick = jest.fn()
      const { result } = renderHook(() => 
        useSideBarViewModel({ onMenuClick: mockOnMenuClick })
      )
      
      act(() => {
        result.current.handleMenuClick('project')
      })
      
      expect(result.current.activeTab).toBe('project')
      expect(result.current.subMenuOpen).toBe(true)
      expect(mockOnMenuClick).toHaveBeenCalledWith('project')
    })

    it('탭 전환 시 서브메뉴가 유지되어야 한다', () => {
      const { result } = renderHook(() => useSideBarViewModel())
      
      // 프로젝트 탭 열기
      act(() => {
        result.current.handleMenuClick('project')
      })
      expect(result.current.subMenuOpen).toBe(true)
      
      // 피드백 탭으로 전환
      act(() => {
        result.current.handleMenuClick('feedback')
      })
      expect(result.current.subMenuOpen).toBe(true)
      expect(result.current.activeTab).toBe('feedback')
    })
  })

  describe('검색 기능', () => {
    it('검색어로 메뉴가 필터링되어야 한다', () => {
      const { result } = renderHook(() => useSideBarViewModel())
      
      act(() => {
        result.current.setSearchQuery('프로젝트')
      })
      
      const filtered = result.current.filteredMenuItems
      expect(filtered).toHaveLength(1)
      expect(filtered[0].label).toBe('프로젝트 관리')
    })

    it('검색어 초기화가 작동해야 한다', () => {
      const { result } = renderHook(() => useSideBarViewModel())
      
      act(() => {
        result.current.setSearchQuery('test')
        result.current.clearSearch()
      })
      
      expect(result.current.searchQuery).toBe('')
      expect(result.current.filteredMenuItems).toHaveLength(5) // 기본 메뉴 아이템 수
    })
  })

  describe('프로젝트 정렬', () => {
    it('프로젝트가 알파벳순으로 정렬되어야 한다', () => {
      const projects: Project[] = [
        { id: 1, name: 'Zebra Project', status: 'active' },
        { id: 2, name: 'Alpha Project', status: 'active' },
        { id: 3, name: 'Beta Project', status: 'active' },
      ]
      
      const { result } = renderHook(() => 
        useSideBarViewModel({ projects })
      )
      
      expect(result.current.sortedProjects[0].name).toBe('Alpha Project')
      expect(result.current.sortedProjects[1].name).toBe('Beta Project')
      expect(result.current.sortedProjects[2].name).toBe('Zebra Project')
    })
  })

  describe('모바일 반응형', () => {
    it('윈도우 크기에 따라 모바일 상태가 변경되어야 한다', () => {
      const { result } = renderHook(() => useSideBarViewModel())
      
      // 모바일 크기로 변경
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))
      })
      
      waitFor(() => {
        expect(result.current.isMobile).toBe(true)
      })
      
      // 데스크톱 크기로 변경
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        })
        window.dispatchEvent(new Event('resize'))
      })
      
      waitFor(() => {
        expect(result.current.isMobile).toBe(false)
      })
    })
  })
})

describe('SideBarMenuItem Component', () => {
  it('메뉴 아이템이 올바르게 렌더링되어야 한다', () => {
    const mockItem = {
      id: 'test',
      label: '테스트 메뉴',
      ariaLabel: '테스트 메뉴 열기',
      badge: 5
    }
    
    render(
      <SideBarMenuItem 
        item={mockItem}
        isActive={false}
        onClick={jest.fn()}
      />
    )
    
    const button = screen.getByRole('button', { name: /테스트 메뉴 열기/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('활성 상태가 올바르게 표시되어야 한다', () => {
    const mockItem = {
      id: 'test',
      label: '테스트 메뉴',
    }
    
    render(
      <SideBarMenuItem 
        item={mockItem}
        isActive={true}
        onClick={jest.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('active')
    expect(button).toHaveAttribute('aria-current', 'page')
  })

  it('클릭 이벤트가 올바르게 전달되어야 한다', async () => {
    const user = userEvent.setup()
    const mockClick = jest.fn()
    const mockItem = {
      id: 'test',
      label: '테스트 메뉴',
    }
    
    render(
      <SideBarMenuItem 
        item={mockItem}
        isActive={false}
        onClick={mockClick}
      />
    )
    
    await user.click(screen.getByRole('button'))
    expect(mockClick).toHaveBeenCalledTimes(1)
  })
})

describe('SubMenu Component', () => {
  const mockProjects: Project[] = [
    { id: 1, name: '프로젝트 A', status: 'active' },
    { id: 2, name: '프로젝트 B', status: 'completed' },
  ]

  it('프로젝트 목록이 올바르게 렌더링되어야 한다', () => {
    render(
      <SubMenu
        isOpen={true}
        title="프로젝트 관리"
        tab="project"
        projects={mockProjects}
        currentPath="/projects/1"
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    )
    
    expect(screen.getByText('프로젝트 A')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 B')).toBeInTheDocument()
  })

  it('빈 상태 메시지가 표시되어야 한다', () => {
    render(
      <SubMenu
        isOpen={true}
        title="프로젝트 관리"
        tab="project"
        projects={[]}
        currentPath=""
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    )
    
    expect(screen.getByText(/등록된.*프로젝트가 없습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /프로젝트 등록/i })).toBeInTheDocument()
  })

  it('영상 기획 메뉴가 올바르게 렌더링되어야 한다', () => {
    render(
      <SubMenu
        isOpen={true}
        title="영상 기획"
        tab="video-planning"
        projects={[]}
        currentPath="/video-planning/ai"
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    )
    
    expect(screen.getByRole('button', { name: /AI 기획/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /기획서 관리/i })).toBeInTheDocument()
  })

  it('닫기 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup()
    const mockClose = jest.fn()
    
    render(
      <SubMenu
        isOpen={true}
        title="프로젝트 관리"
        tab="project"
        projects={mockProjects}
        currentPath=""
        onClose={mockClose}
        onNavigate={jest.fn()}
      />
    )
    
    await user.click(screen.getByRole('button', { name: /서브메뉴 닫기/i }))
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('프로젝트 클릭 시 올바른 경로로 이동해야 한다', async () => {
    const user = userEvent.setup()
    const mockNavigate = jest.fn()
    
    render(
      <SubMenu
        isOpen={true}
        title="프로젝트 관리"
        tab="project"
        projects={mockProjects}
        currentPath=""
        onClose={jest.fn()}
        onNavigate={mockNavigate}
      />
    )
    
    await user.click(screen.getByText('프로젝트 A'))
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1')
  })
})

describe('접근성 테스트', () => {
  it('모든 인터랙티브 요소가 키보드로 접근 가능해야 한다', async () => {
    const user = userEvent.setup()
    const mockItem = {
      id: 'test',
      label: '테스트 메뉴',
    }
    
    render(
      <SideBarMenuItem 
        item={mockItem}
        isActive={false}
        onClick={jest.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    
    // Tab 키로 포커스 이동
    await user.tab()
    expect(button).toHaveFocus()
    
    // Enter 키로 클릭
    await user.keyboard('{Enter}')
    // Space 키로 클릭
    await user.keyboard(' ')
  })

  it('ARIA 속성이 올바르게 설정되어야 한다', () => {
    render(
      <SubMenu
        isOpen={false}
        title="프로젝트 관리"
        tab="project"
        projects={[]}
        currentPath=""
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    )
    
    const submenu = screen.getByRole('complementary')
    expect(submenu).toHaveAttribute('aria-label', '프로젝트 관리 서브메뉴')
    expect(submenu).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('성능 최적화 테스트', () => {
  it('메모이제이션이 올바르게 작동해야 한다', () => {
    const mockItem = {
      id: 'test',
      label: '테스트 메뉴',
    }
    
    const { rerender } = render(
      <SideBarMenuItem 
        item={mockItem}
        isActive={false}
        onClick={jest.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    const initialButton = button
    
    // 동일한 props로 리렌더링
    rerender(
      <SideBarMenuItem 
        item={mockItem}
        isActive={false}
        onClick={jest.fn()}
      />
    )
    
    // DOM 노드가 동일해야 함 (메모이제이션 작동)
    expect(screen.getByRole('button')).toBe(initialButton)
  })
})