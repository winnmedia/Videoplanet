import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../src/utils/test-utils';
import { createSnapshot, createResponsiveSnapshots } from '../../../src/utils/snapshot-utils';
import Sidebar from '../../../components/organisms/Sidebar/Sidebar';
import { User, Project, SidebarTabName } from '../../../types/layout';

// Mock Next.js router
const mockPush = jest.fn();
const mockPathname = '/test';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    pathname: mockPathname,
  }),
  usePathname: () => mockPathname,
}));

// Test data
const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  nickname: 'TestUser',
  name: 'Test User',
};

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Project Alpha',
    created: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    name: 'Project Beta',
    created: '2024-01-02',
    status: 'completed',
  },
  {
    id: '3',
    name: 'Project Gamma',
    created: '2024-01-03',
    status: 'paused',
  },
];

describe('Sidebar Organism', () => {
  const defaultProps = {
    user: mockUser,
    projects: mockProjects,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('기본 렌더링', () => {
    it('사이드바가 올바르게 렌더링된다', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: '주 네비게이션' })).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toBeInTheDocument();
      expect(screen.getByText('로그아웃')).toBeInTheDocument();
    });

    it('기본 네비게이션 메뉴가 표시된다', () => {
      render(<Sidebar {...defaultProps} />);
      
      // 기본 메뉴 항목들
      expect(screen.getByText('홈')).toBeInTheDocument();
      expect(screen.getByText('전체 일정')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 관리')).toBeInTheDocument();
      expect(screen.getByText('영상 피드백')).toBeInTheDocument();
      expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    });

    it('프로젝트 수가 배지로 표시된다', () => {
      render(<Sidebar {...defaultProps} />);
      
      // 프로젝트 관리 메뉴에 프로젝트 수 배지가 표시되는지 확인
      expect(screen.getByText('3')).toBeInTheDocument(); // mockProjects.length
    });

    it('로그아웃 버튼이 표시된다', () => {
      render(<Sidebar {...defaultProps} />);
      
      const logoutButton = screen.getByText('로그아웃');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveAttribute('type', 'button');
    });
  });

  describe('메뉴 상호작용', () => {
    it('홈 메뉴를 클릭하면 해당 페이지로 이동한다', () => {
      const mockNavigate = jest.fn();
      render(<Sidebar {...defaultProps} onNavigate={mockNavigate} />);
      
      const homeMenu = screen.getByText('홈');
      fireEvent.click(homeMenu);
      
      expect(mockNavigate).toHaveBeenCalledWith('/CmsHome');
    });

    it('전체 일정 메뉴를 클릭하면 해당 페이지로 이동한다', () => {
      const mockNavigate = jest.fn();
      render(<Sidebar {...defaultProps} onNavigate={mockNavigate} />);
      
      const calendarMenu = screen.getByText('전체 일정');
      fireEvent.click(calendarMenu);
      
      expect(mockNavigate).toHaveBeenCalledWith('/Calendar');
    });

    it('프로젝트 관리 메뉴를 클릭하면 서브메뉴가 열린다', async () => {
      const mockTabChange = jest.fn();
      render(<Sidebar {...defaultProps} onTabChange={mockTabChange} />);
      
      const projectMenu = screen.getByText('프로젝트 관리');
      fireEvent.click(projectMenu);
      
      expect(mockTabChange).toHaveBeenCalledWith('project');
      
      // 서브메뉴가 나타나는지 확인
      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });
    });

    it('영상 피드백 메뉴를 클릭하면 서브메뉴가 열린다', async () => {
      const mockTabChange = jest.fn();
      render(<Sidebar {...defaultProps} onTabChange={mockTabChange} />);
      
      const feedbackMenu = screen.getByText('영상 피드백');
      fireEvent.click(feedbackMenu);
      
      expect(mockTabChange).toHaveBeenCalledWith('feedback');
      
      // 서브메뉴가 나타나는지 확인
      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });
    });
  });

  describe('서브메뉴 기능', () => {
    it('프로젝트 서브메뉴에서 프로젝트를 클릭하면 프로젝트 상세로 이동한다', async () => {
      const mockNavigate = jest.fn();
      render(
        <Sidebar 
          {...defaultProps} 
          tab="project" 
          onMenu={true}
          onNavigate={mockNavigate} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });
      
      const projectItem = screen.getByText('Project Alpha');
      fireEvent.click(projectItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/projects/1/view');
    });

    it('피드백 서브메뉴에서 프로젝트를 클릭하면 피드백 페이지로 이동한다', async () => {
      const mockNavigate = jest.fn();
      render(
        <Sidebar 
          {...defaultProps} 
          tab="feedback" 
          onMenu={true}
          onNavigate={mockNavigate} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });
      
      const projectItem = screen.getByText('Project Alpha');
      fireEvent.click(projectItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/feedback/1');
    });

    it('서브메뉴 닫기 버튼이 동작한다', async () => {
      render(
        <Sidebar 
          {...defaultProps} 
          tab="project" 
          onMenu={true} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('submenu-close')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByTestId('submenu-close');
      fireEvent.click(closeButton);
      
      // 서브메뉴가 닫혔는지 확인
      await waitFor(() => {
        expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
      });
    });

    it('프로젝트 생성 버튼이 동작한다', async () => {
      const mockNavigate = jest.fn();
      render(
        <Sidebar 
          {...defaultProps} 
          tab="project" 
          onMenu={true}
          onNavigate={mockNavigate} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('submenu-create-project')).toBeInTheDocument();
      });
      
      const createButton = screen.getByTestId('submenu-create-project');
      fireEvent.click(createButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/projects/create');
    });
  });

  describe('프로젝트가 없는 경우', () => {
    it('빈 프로젝트 목록에 대한 메시지가 표시된다', async () => {
      render(
        <Sidebar 
          {...defaultProps} 
          projects={[]}
          tab="project" 
          onMenu={true} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('등록된')).toBeInTheDocument();
        expect(screen.getByText('프로젝트가 없습니다')).toBeInTheDocument();
      });
    });

    it('빈 상태에서 프로젝트 등록 버튼이 표시된다', async () => {
      render(
        <Sidebar 
          {...defaultProps} 
          projects={[]}
          tab="project" 
          onMenu={true} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('프로젝트 등록')).toBeInTheDocument();
      });
    });
  });

  describe('로그아웃 기능', () => {
    it('로그아웃 버튼을 클릭하면 핸들러가 호출된다', () => {
      const mockLogout = jest.fn();
      render(<Sidebar {...defaultProps} onLogout={mockLogout} />);
      
      const logoutButton = screen.getByText('로그아웃');
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });

    it('로그아웃 핸들러가 없으면 기본 동작을 수행한다', () => {
      const mockRemoveItem = jest.fn();
      window.localStorage.removeItem = mockRemoveItem;
      
      render(<Sidebar {...defaultProps} />);
      
      const logoutButton = screen.getByText('로그아웃');
      fireEvent.click(logoutButton);
      
      expect(mockRemoveItem).toHaveBeenCalledWith('VGID');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 속성을 가진다', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: '주 네비게이션' })).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toBeInTheDocument();
      
      // 각 메뉴 아이템이 menuitem role을 가지는지 확인
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(5); // 5개 메뉴 아이템
    });

    it('키보드 네비게이션이 지원된다', () => {
      render(<Sidebar {...defaultProps} />);
      
      const homeMenu = screen.getByText('홈');
      homeMenu.focus();
      expect(homeMenu).toHaveFocus();
      
      // Enter 키로 메뉴 활성화
      fireEvent.keyDown(homeMenu, { key: 'Enter' });
    });

    it('로그아웃 버튼에 적절한 라벨이 있다', () => {
      render(<Sidebar {...defaultProps} />);
      
      const logoutButton = screen.getByLabelText('로그아웃');
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('활성 상태', () => {
    it('현재 경로에 따라 활성 메뉴가 표시된다', () => {
      // Mock pathname을 '/CmsHome'으로 설정
      jest.mocked(require('next/navigation').usePathname).mockReturnValue('/CmsHome');
      
      render(<Sidebar {...defaultProps} />);
      
      // 홈 메뉴가 활성 상태여야 함
      const homeMenu = screen.getByText('홈');
      expect(homeMenu.closest('li')).toHaveClass('navItem--active');
    });

    it('서브메뉴가 열려있을 때 해당 메뉴가 활성화된다', () => {
      render(<Sidebar {...defaultProps} tab="project" onMenu={true} />);
      
      const projectMenu = screen.getByText('프로젝트 관리');
      expect(projectMenu.closest('li')).toHaveClass('navItem--active');
    });
  });

  describe('프로젝트 정렬', () => {
    it('프로젝트가 이름순으로 정렬된다', async () => {
      const unsortedProjects = [
        { id: '1', name: 'Zebra Project', created: '2024-01-01', status: 'active' as const },
        { id: '2', name: 'Alpha Project', created: '2024-01-02', status: 'active' as const },
        { id: '3', name: 'Beta Project', created: '2024-01-03', status: 'active' as const },
      ];
      
      render(
        <Sidebar 
          {...defaultProps} 
          projects={unsortedProjects}
          tab="project" 
          onMenu={true} 
        />
      );
      
      await waitFor(() => {
        const projectItems = screen.getAllByText(/Project$/);
        expect(projectItems[0]).toHaveTextContent('Alpha Project');
        expect(projectItems[1]).toHaveTextContent('Beta Project');
        expect(projectItems[2]).toHaveTextContent('Zebra Project');
      });
    });
  });

  describe('반응형 동작', () => {
    it('축소된 상태가 올바르게 적용된다', () => {
      render(<Sidebar {...defaultProps} collapsed={true} />);
      
      const sidebar = screen.getByRole('navigation', { name: '주 네비게이션' });
      expect(sidebar).toHaveClass('sidebar--collapsed');
    });
  });

  describe('스냅샷 테스트', () => {
    it('기본 사이드바 스냅샷이 일치한다', () => {
      createSnapshot(Sidebar, defaultProps);
    });

    it('서브메뉴가 열린 상태 스냅샷이 일치한다', () => {
      createSnapshot(Sidebar, {
        ...defaultProps,
        tab: 'project',
        onMenu: true,
      });
    });

    it('프로젝트가 없는 상태 스냅샷이 일치한다', () => {
      createSnapshot(Sidebar, {
        ...defaultProps,
        projects: [],
        tab: 'project',
        onMenu: true,
      });
    });

    it('축소된 상태 스냅샷이 일치한다', () => {
      createSnapshot(Sidebar, {
        ...defaultProps,
        collapsed: true,
      });
    });

    // 반응형 스냅샷
    describe('반응형 스냅샷', () => {
      createResponsiveSnapshots(Sidebar, defaultProps);
    });
  });

  describe('성능 최적화', () => {
    it('프로젝트 목록 변경 시에만 재정렬된다', () => {
      const { rerender } = render(<Sidebar {...defaultProps} />);
      
      // 동일한 프로젝트 목록으로 리렌더링
      rerender(<Sidebar {...defaultProps} />);
      
      // 컴포넌트가 여전히 올바르게 작동하는지 확인
      expect(screen.getByText('Project Alpha')).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('잘못된 프로젝트 데이터를 처리한다', () => {
      const invalidProjects = [
        { id: '1', name: '', created: '2024-01-01', status: 'active' as const },
        { id: '2', name: null as any, created: '2024-01-02', status: 'active' as const },
      ];
      
      expect(() => {
        render(<Sidebar {...defaultProps} projects={invalidProjects} />);
      }).not.toThrow();
    });

    it('네트워크 오류 시에도 안정적으로 동작한다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // onNavigate 함수가 에러를 던지는 경우
      const errorNavigate = () => {
        throw new Error('Navigation error');
      };
      
      render(<Sidebar {...defaultProps} onNavigate={errorNavigate} />);
      
      expect(() => {
        const homeMenu = screen.getByText('홈');
        fireEvent.click(homeMenu);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});

// 통합 테스트
describe('Sidebar 통합 테스트', () => {
  const integrationProps = {
    user: mockUser,
    projects: mockProjects,
  };

  it('전체 네비게이션 플로우가 동작한다', async () => {
    const mockNavigate = jest.fn();
    const mockTabChange = jest.fn();
    const mockLogout = jest.fn();

    render(
      <Sidebar
        {...integrationProps}
        onNavigate={mockNavigate}
        onTabChange={mockTabChange}
        onLogout={mockLogout}
      />
    );

    // 1. 프로젝트 관리 메뉴 클릭
    const projectMenu = screen.getByText('프로젝트 관리');
    fireEvent.click(projectMenu);
    expect(mockTabChange).toHaveBeenCalledWith('project');

    // 2. 서브메뉴에서 프로젝트 클릭
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    const projectItem = screen.getByText('Project Alpha');
    fireEvent.click(projectItem);
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1/view');

    // 3. 로그아웃
    const logoutButton = screen.getByText('로그아웃');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('키보드로 전체 네비게이션이 가능하다', async () => {
    const mockNavigate = jest.fn();
    
    render(<Sidebar {...integrationProps} onNavigate={mockNavigate} />);

    // Tab으로 첫 번째 메뉴로 이동
    const homeMenu = screen.getByText('홈');
    homeMenu.focus();
    
    // Enter로 활성화
    fireEvent.keyDown(homeMenu, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/CmsHome');

    // Space로도 활성화 가능한지 확인
    const calendarMenu = screen.getByText('전체 일정');
    calendarMenu.focus();
    fireEvent.keyDown(calendarMenu, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/Calendar');
  });
});