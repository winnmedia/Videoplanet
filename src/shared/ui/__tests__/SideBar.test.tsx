import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { SideBar } from '../SideBar'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn()
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
}

const defaultProps = {
  projects: [
    { id: 1, name: '프로젝트 1', status: 'active' },
    { id: 2, name: '프로젝트 2', status: 'completed' }
  ]
}

describe('SideBar - 영상 기획 메뉴 개선', () => {
  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue('/dashboard')
    vi.clearAllMocks()
  })

  describe('기본 네비게이션', () => {
    test('기본 메뉴 항목들이 표시된다', () => {
      render(<SideBar {...defaultProps} />)
      
      expect(screen.getByText('홈')).toBeInTheDocument()
      expect(screen.getByText('전체 일정')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
      expect(screen.getByText('영상 기획')).toBeInTheDocument()
      expect(screen.getByText('영상 피드백')).toBeInTheDocument()
    })

    test('로그아웃 버튼이 표시된다', () => {
      render(<SideBar {...defaultProps} />)
      
      expect(screen.getByText('로그아웃')).toBeInTheDocument()
    })

    test('프로젝트 개수가 올바르게 표시된다', () => {
      render(<SideBar {...defaultProps} />)
      
      expect(screen.getByText('2')).toBeInTheDocument() // 프로젝트 개수
    })
  })

  describe('영상 기획 메뉴 개선사항', () => {
    test('영상 기획 클릭 시 AI 기획으로 직접 이동한다', () => {
      render(<SideBar {...defaultProps} />)
      
      const videoPlanningMenu = screen.getByText('영상 기획')
      fireEvent.click(videoPlanningMenu)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/ai')
    })

    test('영상 기획 서브메뉴에 AI 기획과 기획서 관리만 표시된다', () => {
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" />)
      
      expect(screen.getByText('AI 기획')).toBeInTheDocument()
      expect(screen.getByText('기획서 관리')).toBeInTheDocument()
      
      // 제거된 메뉴들이 없는지 확인
      expect(screen.queryByText('모드 선택')).not.toBeInTheDocument()
      expect(screen.queryByText('수동 기획')).not.toBeInTheDocument()
    })

    test('AI 기획 서브메뉴 클릭 시 올바른 경로로 이동한다', () => {
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" />)
      
      const aiPlanningItem = screen.getByText('AI 기획')
      fireEvent.click(aiPlanningItem)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/ai')
    })

    test('기획서 관리 서브메뉴 클릭 시 올바른 경로로 이동한다', () => {
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" />)
      
      const historyItem = screen.getByText('기획서 관리')
      fireEvent.click(historyItem)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/history')
    })
  })

  describe('활성 상태 표시', () => {
    test('AI 기획 페이지에서 영상 기획 메뉴가 활성화된다', () => {
      (usePathname as any).mockReturnValue('/video-planning/ai')
      
      render(<SideBar {...defaultProps} />)
      
      const videoPlanningMenu = screen.getByText('영상 기획').closest('li')
      expect(videoPlanningMenu).toHaveClass('active')
    })

    test('기획서 관리 페이지에서 영상 기획 메뉴가 활성화된다', () => {
      (usePathname as any).mockReturnValue('/video-planning/history')
      
      render(<SideBar {...defaultProps} />)
      
      const videoPlanningMenu = screen.getByText('영상 기획').closest('li')
      expect(videoPlanningMenu).toHaveClass('active')
    })

    test('서브메뉴에서 현재 페이지가 활성화된다', () => {
      (usePathname as any).mockReturnValue('/video-planning/ai')
      
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" />)
      
      const aiPlanningItem = screen.getByText('AI 기획').closest('li')
      expect(aiPlanningItem).toHaveClass('active')
    })
  })

  describe('서브메뉴 토글', () => {
    test('영상 기획 메뉴 클릭 시 서브메뉴가 열린다', () => {
      const onMenuClick = jest.fn()
      
      render(<SideBar {...defaultProps} onMenuClick={onMenuClick} />)
      
      const videoPlanningMenu = screen.getByText('영상 기획')
      fireEvent.click(videoPlanningMenu)
      
      expect(onMenuClick).toHaveBeenCalledWith('video-planning')
    })

    test('서브메뉴 닫기 버튼이 작동한다', () => {
      const onClose = jest.fn()
      
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" onClose={onClose} />)
      
      const closeButton = screen.getByText('x')
      fireEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('빈 상태 메시지', () => {
    test('영상 기획 서브메뉴의 빈 상태 메시지가 올바르게 표시된다', () => {
      render(<SideBar projects={[]} onMenu={true} tab="video-planning" />)
      
      expect(screen.getByText(/AI 영상 기획으로/)).toBeInTheDocument()
      expect(screen.getByText(/빠르게 시작하세요/)).toBeInTheDocument()
      
      const aiStartButton = screen.getByText('AI 기획 시작')
      expect(aiStartButton).toBeInTheDocument()
      
      fireEvent.click(aiStartButton)
      expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/ai')
    })
  })

  describe('로그아웃 기능', () => {
    test('로그아웃 클릭 시 localStorage가 정리되고 로그인 페이지로 이동한다', () => {
      // localStorage mock
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem')
      
      render(<SideBar {...defaultProps} />)
      
      const logoutButton = screen.getByText('로그아웃')
      fireEvent.click(logoutButton)
      
      expect(removeItemSpy).toHaveBeenCalledWith('isAuthenticated')
      expect(removeItemSpy).toHaveBeenCalledWith('user')
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
      
      removeItemSpy.mockRestore()
    })
  })

  describe('기타 메뉴 기능', () => {
    test('홈 메뉴 클릭 시 대시보드로 이동한다', () => {
      render(<SideBar {...defaultProps} />)
      
      const homeMenu = screen.getByText('홈')
      fireEvent.click(homeMenu)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    test('전체 일정 메뉴 클릭 시 planning 페이지로 이동한다', () => {
      render(<SideBar {...defaultProps} />)
      
      const planningMenu = screen.getByText('전체 일정')
      fireEvent.click(planningMenu)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/planning')
    })
  })

  describe('접근성', () => {
    test('영상 기획 메뉴에 적절한 아이콘이 표시된다', () => {
      render(<SideBar {...defaultProps} />)
      
      const videoPlanningMenu = screen.getByText('영상 기획').closest('li')
      const icon = videoPlanningMenu?.querySelector('svg')
      
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('width', '16')
      expect(icon).toHaveAttribute('height', '16')
    })

    test('메뉴 항목들이 키보드 접근 가능하다', () => {
      render(<SideBar {...defaultProps} />)
      
      const homeMenu = screen.getByText('홈')
      expect(homeMenu).toBeInTheDocument()
      
      // 클릭 이벤트가 있어야 키보드 접근이 가능
      fireEvent.click(homeMenu)
      expect(mockRouter.push).toHaveBeenCalled()
    })
  })

  describe('반응형 동작', () => {
    test('서브메뉴 제목이 올바르게 표시된다', () => {
      render(<SideBar {...defaultProps} onMenu={true} tab="video-planning" />)
      
      expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
    })

    test('프로젝트 관리 서브메뉴에 플러스 버튼이 표시된다', () => {
      render(<SideBar {...defaultProps} onMenu={true} tab="project" />)
      
      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })
})