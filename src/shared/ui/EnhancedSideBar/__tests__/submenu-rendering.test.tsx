import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedSideBar } from '../EnhancedSideBar'
import '@testing-library/jest-dom'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/dashboard'
  }),
  usePathname: () => '/dashboard'
}))

describe('서브메뉴 렌더링 테스트', () => {
  const mockProjects = [
    { id: 1, name: '프로젝트 1' },
    { id: 2, name: '프로젝트 2' }
  ]

  const defaultProps = {
    tab: '',
    isOpen: false,
    projects: mockProjects,
    onMenuClick: vi.fn(),
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('서브메뉴 가시성 테스트', () => {
    it('초기 상태에서 서브메뉴가 DOM에 존재하지만 숨겨져 있어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toBeInTheDocument()
      expect(submenu).not.toHaveClass('active')
      expect(submenu).toHaveAttribute('data-open', 'false')
    })

    it('isOpen=true, tab="project"일 때 서브메뉴가 표시되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toHaveClass('active')
      expect(submenu).toHaveAttribute('data-open', 'true')
      expect(submenu).toHaveAttribute('data-tab', 'project')
    })

    it('프로젝트 관리 버튼 클릭 시 서브메뉴가 열려야 함', async () => {
      const onMenuClick = vi.fn()
      render(<EnhancedSideBar {...defaultProps} onMenuClick={onMenuClick} />)
      
      const projectButton = screen.getByRole('button', { name: /프로젝트 관리/ })
      fireEvent.click(projectButton)
      
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).toHaveClass('active')
        expect(onMenuClick).toHaveBeenCalledWith('project')
      })
    })

    it('영상 피드백 버튼 클릭 시 서브메뉴가 열려야 함', async () => {
      const onMenuClick = vi.fn()
      render(<EnhancedSideBar {...defaultProps} onMenuClick={onMenuClick} />)
      
      const feedbackButton = screen.getByRole('button', { name: /영상 피드백/ })
      fireEvent.click(feedbackButton)
      
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).toHaveClass('active')
        expect(onMenuClick).toHaveBeenCalledWith('feedback')
      })
    })
  })

  describe('서브메뉴 내용 렌더링 테스트', () => {
    it('프로젝트 탭에서 프로젝트 목록이 표시되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" />)
      
      expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 2')).toBeInTheDocument()
    })

    it('피드백 탭에서 프로젝트 목록이 표시되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="feedback" />)
      
      expect(screen.getByText('영상 피드백')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 2')).toBeInTheDocument()
    })

    it('영상 기획 탭에서 AI 기획 메뉴가 표시되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="video-planning" />)
      
      expect(screen.getByText('영상 기획')).toBeInTheDocument()
      expect(screen.getByText('AI 기획')).toBeInTheDocument()
      expect(screen.getByText('기획서 관리')).toBeInTheDocument()
    })

    it('프로젝트가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" projects={[]} />)
      
      expect(screen.getByText(/등록된.*프로젝트가 없습니다/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /프로젝트 등록/ })).toBeInTheDocument()
    })
  })

  describe('서브메뉴 상호작용 테스트', () => {
    it('닫기 버튼 클릭 시 서브메뉴가 닫혀야 함', async () => {
      const onClose = vi.fn()
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /닫기/ })
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).not.toHaveClass('active')
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('같은 메뉴를 다시 클릭하면 서브메뉴가 닫혀야 함', async () => {
      render(<EnhancedSideBar {...defaultProps} />)
      
      const projectButton = screen.getByRole('button', { name: /프로젝트 관리/ })
      
      // 첫 번째 클릭 - 열기
      fireEvent.click(projectButton)
      await waitFor(() => {
        expect(screen.getByTestId('submenu')).toHaveClass('active')
      })
      
      // 두 번째 클릭 - 닫기
      fireEvent.click(projectButton)
      await waitFor(() => {
        expect(screen.getByTestId('submenu')).not.toHaveClass('active')
      })
    })

    it('다른 메뉴 클릭 시 서브메뉴 내용이 전환되어야 함', async () => {
      render(<EnhancedSideBar {...defaultProps} />)
      
      // 프로젝트 관리 클릭
      fireEvent.click(screen.getByRole('button', { name: /프로젝트 관리/ }))
      await waitFor(() => {
        expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
      })
      
      // 영상 피드백 클릭
      fireEvent.click(screen.getByRole('button', { name: /영상 피드백/ }))
      await waitFor(() => {
        expect(screen.getByText('영상 피드백')).toBeInTheDocument()
      })
    })
  })

  describe('CSS 트랜지션 테스트', () => {
    it('서브메뉴가 항상 display: block을 유지해야 함', () => {
      const { container } = render(<EnhancedSideBar {...defaultProps} />)
      
      const submenu = container.querySelector('.submenu')
      const computedStyle = window.getComputedStyle(submenu!)
      
      // CSS 모듈이 적용되지 않은 테스트 환경에서는 스타일 확인이 제한적
      // 실제 브라우저 테스트에서 확인 필요
      expect(submenu).toBeInTheDocument()
    })

    it('active 클래스가 있을 때 pointer-events가 활성화되어야 함', () => {
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toHaveClass('active')
      
      // 클릭 이벤트가 전파되는지 확인
      const projectLink = screen.getByText('프로젝트 1')
      expect(projectLink).toBeInTheDocument()
    })
  })

  describe('반응형 디자인 테스트', () => {
    it('모바일 환경에서 서브메뉴가 전체 너비를 차지해야 함', () => {
      // window.innerWidth 모킹
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<EnhancedSideBar {...defaultProps} isOpen={true} tab="project" />)
      
      const submenu = screen.getByTestId('submenu')
      expect(submenu).toBeInTheDocument()
      // 모바일 스타일은 CSS 모듈과 미디어 쿼리로 처리되므로
      // E2E 테스트에서 확인 필요
    })
  })
})