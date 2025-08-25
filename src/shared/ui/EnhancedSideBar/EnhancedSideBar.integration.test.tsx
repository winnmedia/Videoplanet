import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedSideBar } from './EnhancedSideBar'
import { Project } from './types'
import '@testing-library/jest-dom'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
  usePathname: jest.fn(() => '/dashboard'),
}))

describe('사이드바-서브메뉴 통합 테스트', () => {
  const mockProjects: Project[] = [
    { id: 1, name: '프로젝트 A', status: 'active' },
    { id: 2, name: '프로젝트 B', status: 'completed' },
    { id: 3, name: '프로젝트 C', status: 'pending' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  describe('메뉴 클릭 상호작용', () => {
    it('프로젝트 관리 메뉴 클릭 시 서브메뉴가 열려야 함', async () => {
      const user = userEvent.setup()
      const onMenuClick = jest.fn()
      
      const { container } = render(
        <EnhancedSideBar 
          projects={mockProjects}
          onMenuClick={onMenuClick}
        />
      )
      
      // 프로젝트 관리 메뉴 클릭
      const projectMenu = screen.getByRole('button', { name: /프로젝트 관리.*3/ })
      await user.click(projectMenu)
      
      // 콜백 호출 확인
      expect(onMenuClick).toHaveBeenCalledWith('project')
      
      // 서브메뉴 상태 확인
      await waitFor(() => {
        const submenu = container.querySelector('[data-testid="submenu"]')
        expect(submenu).toHaveAttribute('data-open', 'true')
        expect(submenu).toHaveAttribute('data-tab', 'project')
      })
      
      // 프로젝트 목록 표시 확인
      expect(screen.getByText('프로젝트 A')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 B')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 C')).toBeInTheDocument()
    })

    it('영상 피드백 메뉴 클릭 시 서브메뉴가 열려야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar projects={mockProjects} />
      )
      
      // 영상 피드백 메뉴 클릭
      const feedbackMenu = screen.getByRole('button', { name: /영상 피드백/ })
      await user.click(feedbackMenu)
      
      // 서브메뉴 확인
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).toHaveAttribute('data-tab', 'feedback')
        expect(within(submenu).getByText('영상 피드백')).toBeInTheDocument()
      })
    })

    it('영상 기획 메뉴 클릭 시 서브메뉴가 열려야 함', async () => {
      const user = userEvent.setup()
      
      render(<EnhancedSideBar />)
      
      // 영상 기획 메뉴 클릭
      const planningMenu = screen.getByRole('button', { name: /영상 기획/ })
      await user.click(planningMenu)
      
      // 서브메뉴 확인
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).toHaveAttribute('data-tab', 'video-planning')
        expect(within(submenu).getByText('AI 기획')).toBeInTheDocument()
        expect(within(submenu).getByText('기획서 관리')).toBeInTheDocument()
      })
    })
  })

  describe('서브메뉴 전환', () => {
    it('다른 메뉴 클릭 시 서브메뉴가 전환되어야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar projects={mockProjects} />
      )
      
      // 첫 번째: 프로젝트 관리 열기
      await user.click(screen.getByRole('button', { name: /프로젝트 관리/ }))
      
      await waitFor(() => {
        expect(screen.getByTestId('submenu')).toHaveAttribute('data-tab', 'project')
      })
      
      // 두 번째: 영상 피드백으로 전환
      await user.click(screen.getByRole('button', { name: /영상 피드백/ }))
      
      await waitFor(() => {
        const submenu = screen.getByTestId('submenu')
        expect(submenu).toHaveAttribute('data-tab', 'feedback')
        expect(within(submenu).getByText('영상 피드백')).toBeInTheDocument()
      })
    })

    it('같은 메뉴 재클릭 시 서브메뉴가 닫혀야 함', async () => {
      const user = userEvent.setup()
      
      const { container } = render(
        <EnhancedSideBar projects={mockProjects} />
      )
      
      const projectMenu = screen.getByRole('button', { name: /프로젝트 관리/ })
      
      // 첫 번째 클릭: 열기
      await user.click(projectMenu)
      await waitFor(() => {
        expect(container.querySelector('[data-testid="submenu"]')).toHaveAttribute('data-open', 'true')
      })
      
      // 두 번째 클릭: 닫기
      await user.click(projectMenu)
      await waitFor(() => {
        expect(container.querySelector('[data-testid="submenu"]')).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('프로젝트 목록 상호작용', () => {
    it('프로젝트 클릭 시 해당 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          projects={mockProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 프로젝트 클릭
      const projectItem = screen.getByText('프로젝트 A')
      await user.click(projectItem)
      
      // 라우팅 확인
      expect(mockPush).toHaveBeenCalledWith('/projects/1')
    })

    it('피드백 탭에서 프로젝트 클릭 시 피드백 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          projects={mockProjects}
          isOpen={true}
          tab="feedback"
        />
      )
      
      // 프로젝트 클릭
      const projectItem = screen.getByText('프로젝트 B')
      await user.click(projectItem)
      
      // 라우팅 확인
      expect(mockPush).toHaveBeenCalledWith('/feedback/2')
    })

    it('프로젝트가 추가되면 목록이 업데이트되어야 함', async () => {
      const { rerender } = render(
        <EnhancedSideBar 
          projects={mockProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 초기 프로젝트 확인
      expect(screen.getAllByRole('button')).toHaveLength(
        expect.any(Number)
      )
      
      // 새 프로젝트 추가
      const updatedProjects = [
        ...mockProjects,
        { id: 4, name: '프로젝트 D', status: 'active' }
      ]
      
      rerender(
        <EnhancedSideBar 
          projects={updatedProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 새 프로젝트 표시 확인
      await waitFor(() => {
        expect(screen.getByText('프로젝트 D')).toBeInTheDocument()
      })
    })

    it('프로젝트가 삭제되면 목록에서 제거되어야 함', async () => {
      const { rerender } = render(
        <EnhancedSideBar 
          projects={mockProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 초기 프로젝트 확인
      expect(screen.getByText('프로젝트 B')).toBeInTheDocument()
      
      // 프로젝트 삭제
      const updatedProjects = mockProjects.filter(p => p.id !== 2)
      
      rerender(
        <EnhancedSideBar 
          projects={updatedProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 삭제된 프로젝트 확인
      await waitFor(() => {
        expect(screen.queryByText('프로젝트 B')).not.toBeInTheDocument()
      })
    })
  })

  describe('서브메뉴 닫기 동작', () => {
    it('닫기 버튼 클릭 시 서브메뉴가 닫혀야 함', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      const { container } = render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={mockProjects}
          onClose={onClose}
        />
      )
      
      // 닫기 버튼 클릭
      const closeButton = within(screen.getByTestId('submenu')).getByLabelText('닫기')
      await user.click(closeButton)
      
      // 콜백 호출 확인
      expect(onClose).toHaveBeenCalled()
      
      // 서브메뉴 상태 확인
      await waitFor(() => {
        expect(container.querySelector('[data-testid="submenu"]')).toHaveAttribute('data-open', 'false')
      })
    })

    it('ESC 키 입력 시 서브메뉴가 닫혀야 함', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={mockProjects}
          onClose={onClose}
        />
      )
      
      // ESC 키 입력
      await user.keyboard('{Escape}')
      
      // 콜백 호출 확인
      expect(onClose).toHaveBeenCalled()
    })

    it('페이지 이동 시 서브메뉴가 자동으로 닫혀야 함', async () => {
      const user = userEvent.setup()
      
      const { container } = render(
        <EnhancedSideBar 
          projects={mockProjects}
          isOpen={true}
          tab="project"
        />
      )
      
      // 프로젝트 클릭으로 페이지 이동
      await user.click(screen.getByText('프로젝트 A'))
      
      // 라우팅 확인
      expect(mockPush).toHaveBeenCalledWith('/projects/1')
      
      // 서브메뉴 닫힘 확인
      await waitFor(() => {
        expect(container.querySelector('[data-testid="submenu"]')).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('빈 상태 처리', () => {
    it('프로젝트가 없을 때 빈 상태 메시지와 CTA가 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          projects={[]}
          isOpen={true}
          tab="project"
        />
      )
      
      const submenu = screen.getByTestId('submenu')
      expect(within(submenu).getByText(/등록된.*프로젝트가 없습니다/)).toBeInTheDocument()
      expect(within(submenu).getByRole('button', { name: '프로젝트 등록' })).toBeInTheDocument()
    })

    it('빈 상태에서 CTA 클릭 시 프로젝트 생성 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          projects={[]}
          isOpen={true}
          tab="project"
        />
      )
      
      const ctaButton = within(screen.getByTestId('submenu')).getByRole('button', { name: '프로젝트 등록' })
      await user.click(ctaButton)
      
      expect(mockPush).toHaveBeenCalledWith('/projects/create')
    })
  })

  describe('영상 기획 메뉴 상호작용', () => {
    it('AI 기획 클릭 시 해당 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="video-planning"
        />
      )
      
      const aiPlanningButton = screen.getByText('AI 기획')
      await user.click(aiPlanningButton)
      
      expect(mockPush).toHaveBeenCalledWith('/video-planning/ai')
    })

    it('기획서 관리 클릭 시 해당 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="video-planning"
        />
      )
      
      const historyButton = screen.getByText('기획서 관리')
      await user.click(historyButton)
      
      expect(mockPush).toHaveBeenCalledWith('/video-planning/history')
    })

    it('영상 기획 CTA 버튼 클릭 시 AI 기획 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="video-planning"
        />
      )
      
      const ctaButton = screen.getByRole('button', { name: 'AI 기획 시작' })
      await user.click(ctaButton)
      
      expect(mockPush).toHaveBeenCalledWith('/video-planning/ai')
    })
  })

  describe('상태 동기화', () => {
    it('외부 props 변경 시 서브메뉴 상태가 동기화되어야 함', async () => {
      const { rerender, container } = render(
        <EnhancedSideBar 
          isOpen={false}
          tab="project"
          projects={mockProjects}
        />
      )
      
      // 초기 상태 확인
      expect(container.querySelector('[data-testid="submenu"]')).toHaveAttribute('data-open', 'false')
      
      // props 변경
      rerender(
        <EnhancedSideBar 
          isOpen={true}
          tab="feedback"
          projects={mockProjects}
        />
      )
      
      // 변경된 상태 확인
      await waitFor(() => {
        const submenu = container.querySelector('[data-testid="submenu"]')
        expect(submenu).toHaveAttribute('data-open', 'true')
        expect(submenu).toHaveAttribute('data-tab', 'feedback')
      })
    })

    it('탭 변경 시 서브메뉴 콘텐츠가 업데이트되어야 함', async () => {
      const { rerender } = render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={mockProjects}
        />
      )
      
      // 초기 탭 확인
      expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
      
      // 탭 변경
      rerender(
        <EnhancedSideBar 
          isOpen={true}
          tab="feedback"
          projects={mockProjects}
        />
      )
      
      // 변경된 탭 확인
      await waitFor(() => {
        expect(screen.getByText('영상 피드백')).toBeInTheDocument()
      })
    })
  })

  describe('프로젝트 추가 버튼', () => {
    it('프로젝트가 있을 때만 추가 버튼이 표시되어야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={mockProjects}
        />
      )
      
      const addButton = within(screen.getByTestId('submenu')).getByLabelText('프로젝트 추가')
      expect(addButton).toBeInTheDocument()
    })

    it('프로젝트가 없을 때 추가 버튼이 표시되지 않아야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={[]}
        />
      )
      
      const addButton = within(screen.getByTestId('submenu')).queryByLabelText('프로젝트 추가')
      expect(addButton).not.toBeInTheDocument()
    })

    it('피드백 탭에서는 추가 버튼이 표시되지 않아야 함', () => {
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="feedback"
          projects={mockProjects}
        />
      )
      
      const addButton = within(screen.getByTestId('submenu')).queryByLabelText('프로젝트 추가')
      expect(addButton).not.toBeInTheDocument()
    })

    it('추가 버튼 클릭 시 프로젝트 생성 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedSideBar 
          isOpen={true}
          tab="project"
          projects={mockProjects}
        />
      )
      
      const addButton = within(screen.getByTestId('submenu')).getByLabelText('프로젝트 추가')
      await user.click(addButton)
      
      expect(mockPush).toHaveBeenCalledWith('/projects/create')
    })
  })
})