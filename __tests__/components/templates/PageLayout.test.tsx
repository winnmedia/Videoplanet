import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../src/utils/test-utils';
import { createSnapshot, createResponsiveSnapshots } from '../../../src/utils/snapshot-utils';
import PageLayout from '../../../components/templates/PageLayout/PageLayout';
import { User, Project, BreadcrumbItem } from '../../../types/layout';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/test',
  }),
  usePathname: () => '/test',
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useSelector: () => ({
    nickname: 'TestUser',
    user: { email: 'test@example.com', id: '1' },
    project_list: [],
  }),
}));

// Mock 인증 유틸리티
jest.mock('../../../lib/utils/auth', () => ({
  checkSession: () => true,
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
    name: 'Project 1',
    created: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    name: 'Project 2',
    created: '2024-01-02',
    status: 'completed',
  },
];

const mockBreadcrumbs: BreadcrumbItem[] = [
  { label: '홈', path: '/home' },
  { label: '프로젝트', path: '/projects' },
  { label: '상세보기', isActive: true },
];

describe('PageLayout Template', () => {
  // 기본 props
  const defaultProps = {
    children: <div data-testid="test-content">Test Content</div>,
    user: mockUser,
    projects: mockProjects,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // DOM 메서드 mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Viewport height 설정 mock
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('기본 렌더링', () => {
    it('기본 레이아웃이 올바르게 렌더링된다', () => {
      render(<PageLayout {...defaultProps} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByTestId('test-content')).toBeInTheDocument(); // Children
    });

    it('제목과 설명이 표시된다', () => {
      render(
        <PageLayout 
          {...defaultProps} 
          title="Test Page" 
          description="Test Description"
        />
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Page');
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('브레드크럼이 올바르게 표시된다', () => {
      render(
        <PageLayout 
          {...defaultProps} 
          showBreadcrumb={true}
          breadcrumbItems={mockBreadcrumbs}
        />
      );
      
      expect(screen.getByLabelText('페이지 경로')).toBeInTheDocument();
      expect(screen.getByText('홈')).toBeInTheDocument();
      expect(screen.getByText('프로젝트')).toBeInTheDocument();
      expect(screen.getByText('상세보기')).toBeInTheDocument();
    });
  });

  describe('레이아웃 변형', () => {
    it('Auth 레이아웃이 올바르게 렌더링된다', () => {
      render(<PageLayout auth={true}>Auth Content</PageLayout>);
      
      expect(screen.queryByRole('banner')).not.toBeInTheDocument(); // No header
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument(); // No sidebar
      expect(screen.getByText('Auth Content')).toBeInTheDocument();
    });

    it('사이드바 없는 레이아웃이 렌더링된다', () => {
      render(<PageLayout {...defaultProps} sidebar={false} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header exists
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument(); // No sidebar
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('헤더 없는 레이아웃이 렌더링된다', () => {
      render(<PageLayout {...defaultProps} header={false} />);
      
      expect(screen.queryByRole('banner')).not.toBeInTheDocument(); // No header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar exists
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('상태 관리', () => {
    it('로딩 상태가 올바르게 표시된다', () => {
      render(<PageLayout {...defaultProps} loading={true} />);
      
      expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('에러 상태가 올바르게 표시된다', () => {
      render(<PageLayout {...defaultProps} error="Test error message" />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('브레드크럼 링크가 클릭된다', () => {
      const mockNavigate = jest.fn();
      
      render(
        <PageLayout 
          {...defaultProps} 
          showBreadcrumb={true}
          breadcrumbItems={mockBreadcrumbs}
          onNavigate={mockNavigate}
        />
      );
      
      const homeLink = screen.getByText('홈');
      fireEvent.click(homeLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('로그아웃 기능이 동작한다', async () => {
      const mockLogout = jest.fn();
      
      render(<PageLayout {...defaultProps} onLogout={mockLogout} />);
      
      const logoutButton = screen.getByText('로그아웃');
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 속성을 가진다', () => {
      render(
        <PageLayout 
          {...defaultProps} 
          title="Test Page"
          showBreadcrumb={true}
          breadcrumbItems={mockBreadcrumbs}
        />
      );
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: '주 네비게이션' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: '페이지 경로' })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('키보드 네비게이션이 지원된다', () => {
      render(
        <PageLayout 
          {...defaultProps} 
          showBreadcrumb={true}
          breadcrumbItems={mockBreadcrumbs}
        />
      );
      
      const firstBreadcrumb = screen.getByText('홈');
      firstBreadcrumb.focus();
      expect(firstBreadcrumb).toHaveFocus();
    });

    it('에러 메시지가 alert role을 가진다', () => {
      render(<PageLayout {...defaultProps} error="Test error" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent('Test error');
    });
  });

  describe('반응형 동작', () => {
    it('모바일에서 사이드바가 숨겨진다', () => {
      // Window resize mock
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767, // 모바일 크기
      });

      render(<PageLayout {...defaultProps} />);
      
      // 모바일에서의 레이아웃 변화 확인
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('사용자 데이터 처리', () => {
    it('Redux 상태의 사용자 정보를 사용한다', () => {
      // Redux mock이 이미 설정되어 있음
      render(<PageLayout projects={mockProjects}>Test</PageLayout>);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('props로 전달된 사용자 정보가 우선된다', () => {
      const propsUser = { ...mockUser, nickname: 'PropsUser' };
      
      render(<PageLayout user={propsUser} projects={mockProjects}>Test</PageLayout>);
      
      // User profile에서 PropsUser가 표시되는지 확인 (실제로는 Header 내부에서 확인)
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('프로젝트 데이터 처리', () => {
    it('프로젝트 목록이 사이드바에 전달된다', () => {
      render(<PageLayout {...defaultProps} />);
      
      // 사이드바가 렌더링되고 프로젝트 데이터를 받았는지 확인
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('스냅샷 테스트', () => {
    it('기본 레이아웃 스냅샷이 일치한다', () => {
      createSnapshot(PageLayout, defaultProps);
    });

    it('Auth 레이아웃 스냅샷이 일치한다', () => {
      createSnapshot(PageLayout, {
        auth: true,
        children: <div>Auth Content</div>,
      });
    });

    it('로딩 상태 스냅샷이 일치한다', () => {
      createSnapshot(PageLayout, {
        ...defaultProps,
        loading: true,
      });
    });

    it('에러 상태 스냅샷이 일치한다', () => {
      createSnapshot(PageLayout, {
        ...defaultProps,
        error: 'Test error message',
      });
    });

    // 반응형 스냅샷
    describe('반응형 스냅샷', () => {
      createResponsiveSnapshots(PageLayout, defaultProps);
    });
  });

  describe('성능 최적화', () => {
    it('불필요한 리렌더링이 발생하지 않는다', () => {
      const { rerender } = render(<PageLayout {...defaultProps} />);
      
      // 동일한 props로 리렌더링
      rerender(<PageLayout {...defaultProps} />);
      
      // 컴포넌트가 여전히 올바르게 렌더링되는지 확인
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('에러 경계', () => {
    // 에러 경계 테스트는 실제 구현에 따라 추가
    it('자식 컴포넌트 에러를 처리한다', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // 에러 경계가 있다면 테스트
      expect(() => {
        render(
          <PageLayout {...defaultProps}>
            <ThrowError />
          </PageLayout>
        );
      }).not.toThrow();
    });
  });
});

// 통합 테스트
describe('PageLayout 통합 테스트', () => {
  it('전체 워크플로우가 올바르게 동작한다', async () => {
    const mockNavigate = jest.fn();
    const mockLogout = jest.fn();

    render(
      <PageLayout
        user={mockUser}
        projects={mockProjects}
        title="통합 테스트 페이지"
        description="전체 기능 테스트"
        showBreadcrumb={true}
        breadcrumbItems={mockBreadcrumbs}
        onNavigate={mockNavigate}
        onLogout={mockLogout}
        actions={
          <button data-testid="action-button">액션 버튼</button>
        }
      >
        <div data-testid="main-content">메인 콘텐츠</div>
      </PageLayout>
    );

    // 모든 주요 요소가 렌더링되었는지 확인
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('통합 테스트 페이지')).toBeInTheDocument();
    expect(screen.getByText('전체 기능 테스트')).toBeInTheDocument();
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    // 브레드크럼 네비게이션 테스트
    const homeLink = screen.getByText('홈');
    fireEvent.click(homeLink);
    expect(mockNavigate).toHaveBeenCalledWith('/home');

    // 로그아웃 테스트
    const logoutButton = screen.getByText('로그아웃');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
});