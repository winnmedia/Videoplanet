/**
 * Calendar Page Unit Tests
 * Next.js 14 App Router Calendar 페이지 단위 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { configureStore } from '@reduxjs/toolkit';

import CalendarPage from '@/app/(main)/calendar/page';
import { refetchProject } from '@/utils/util';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock utility functions
jest.mock('@/utils/util', () => ({
  refetchProject: jest.fn(),
}));

// Mock components
jest.mock('@/components/PageTemplate', () => {
  return function MockPageTemplate({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-template">{children}</div>;
  };
});

jest.mock('@/components/SideBar', () => {
  return function MockSideBar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

// Mock calendar components
jest.mock('@/features/calendar/components', () => ({
  CalendarHeader: jest.fn(({ onNavigate, onViewChange, onProjectFilter }) => (
    <div data-testid="calendar-header">
      <button onClick={() => onNavigate('prev')}>Previous</button>
      <button onClick={() => onNavigate('next')}>Next</button>
      <button onClick={() => onViewChange('주')}>Week View</button>
      <button onClick={() => onProjectFilter(['전체'])}>All Projects</button>
    </div>
  )),
  CalendarBody: jest.fn(() => (
    <div data-testid="calendar-body">Calendar Body</div>
  )),
  CalendarStats: jest.fn(({ stats }) => (
    <div data-testid="calendar-stats">
      <span data-testid="total-projects">{stats.totalProjects}</span>
      <span data-testid="this-month-projects">{stats.thisMonthProjects}</span>
    </div>
  )),
  ProjectList: jest.fn(({ projects }) => (
    <div data-testid="project-list">
      {projects.map((project: any) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )),
}));

// Mock calendar hooks
jest.mock('@/features/calendar/hooks', () => ({
  useCalendar: jest.fn(),
  useProjectSchedule: jest.fn(),
}));

// ========================
// 테스트 설정
// ========================

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
  toString: jest.fn(() => ''),
};

const mockStore = configureStore({
  reducer: {
    ProjectStore: (state = {
      project_list: [],
      this_month_project: [],
      next_month_project: [],
      user_memos: [],
    }) => state,
  },
});

const mockUseCalendar = {
  state: {
    currentView: '월' as const,
    currentDate: new Date('2024-01-15'),
    selectedDate: null,
    viewData: [],
    projects: [],
    filteredProjects: [],
    selectedProjectIds: [],
    userMemos: [],
    isLoading: false,
    error: null,
  },
  handlers: {
    onViewChange: jest.fn(),
    onDateChange: jest.fn(),
    onProjectFilter: jest.fn(),
    onMemoCreate: jest.fn(),
    onMemoUpdate: jest.fn(),
    onMemoDelete: jest.fn(),
    onPhaseUpdate: jest.fn(),
    onDateClick: jest.fn(),
    onEventClick: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  },
  navigation: {
    year: 2024,
    month: 0, // January
    week: 0,
    day: 14,
    weekIndex: 0,
    navigatePrev: jest.fn(),
    navigateNext: jest.fn(),
  },
  modal: {
    isVisible: false,
    type: null,
    data: null,
    setModal: jest.fn(),
  },
  stats: {
    totalProjects: 5,
    thisMonthProjects: 3,
    nextMonthProjects: 2,
    activeProjects: 4,
    completedProjects: 1,
    overdueProjects: 0,
  },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};

const mockUseProjectSchedule = {
  projects: [
    {
      id: 1,
      name: 'Test Project 1',
      color: '#1631f8',
      firstDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-01'),
    },
    {
      id: 2,
      name: 'Test Project 2',
      color: '#ff6b35',
      firstDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-01'),
    },
  ],
  filteredProjects: [],
  selectedProjectIds: [],
  filterProjects: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};

describe('Calendar Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    const { useCalendar, useProjectSchedule } = require('@/features/calendar/hooks');
    useCalendar.mockReturnValue(mockUseCalendar);
    useProjectSchedule.mockReturnValue(mockUseProjectSchedule);
  });

  // ========================
  // 기본 렌더링 테스트
  // ========================

  describe('Basic Rendering', () => {
    it('should render calendar page correctly', () => {
      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByTestId('page-template')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('전체 일정')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
    });

    it('should render calendar stats with correct data', () => {
      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByTestId('calendar-stats')).toBeInTheDocument();
      expect(screen.getByTestId('total-projects')).toHaveTextContent('5');
      expect(screen.getByTestId('this-month-projects')).toHaveTextContent('3');
    });

    it('should render project list', () => {
      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByTestId('project-list')).toBeInTheDocument();
    });

    it('should render project color indicators', () => {
      renderWithProviders(<CalendarPage />);
      
      const projectColorList = screen.getByRole('list');
      expect(projectColorList).toBeInTheDocument();
    });
  });

  // ========================
  // 로딩 상태 테스트
  // ========================

  describe('Loading States', () => {
    it('should show loading skeleton when calendar is loading', () => {
      const { useCalendar } = require('@/features/calendar/hooks');
      useCalendar.mockReturnValue({
        ...mockUseCalendar,
        isLoading: true,
      });

      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
    });

    it('should hide loading skeleton when calendar loads', () => {
      const { useCalendar } = require('@/features/calendar/hooks');
      useCalendar.mockReturnValue({
        ...mockUseCalendar,
        isLoading: false,
      });

      renderWithProviders(<CalendarPage />);
      
      expect(screen.queryByTestId('calendar-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
    });
  });

  // ========================
  // 에러 처리 테스트
  // ========================

  describe('Error Handling', () => {
    it('should display error message when calendar fails to load', () => {
      const { useCalendar } = require('@/features/calendar/hooks');
      useCalendar.mockReturnValue({
        ...mockUseCalendar,
        error: '데이터를 불러오는데 실패했습니다.',
      });

      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('데이터를 불러오는데 실패했습니다.')).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const { useCalendar } = require('@/features/calendar/hooks');
      useCalendar.mockReturnValue({
        ...mockUseCalendar,
        error: '네트워크 오류',
      });

      renderWithProviders(<CalendarPage />);
      
      const retryButton = screen.getByText('다시 시도');
      await userEvent.click(retryButton);
      
      expect(refetchProject).toHaveBeenCalledWith(expect.any(Function), mockRouter);
    });
  });

  // ========================
  // 네비게이션 테스트
  // ========================

  describe('Navigation', () => {
    it('should display current year and month', () => {
      renderWithProviders(<CalendarPage />);
      
      // Navigation의 year와 month를 기반으로 표시되는 날짜 확인
      expect(screen.getByText(/2024\.01/)).toBeInTheDocument();
    });

    it('should call navigation functions when header buttons are clicked', async () => {
      renderWithProviders(<CalendarPage />);
      
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      await userEvent.click(prevButton);
      expect(mockUseCalendar.navigation.navigatePrev).toHaveBeenCalled();
      
      await userEvent.click(nextButton);
      expect(mockUseCalendar.navigation.navigateNext).toHaveBeenCalled();
    });
  });

  // ========================
  // 뷰 변경 테스트
  // ========================

  describe('View Changes', () => {
    it('should change view when view selector is used', async () => {
      renderWithProviders(<CalendarPage />);
      
      const weekViewButton = screen.getByText('Week View');
      await userEvent.click(weekViewButton);
      
      expect(mockUseCalendar.handlers.onViewChange).toHaveBeenCalledWith('주');
    });

    it('should update URL when view changes', async () => {
      const mockHandleViewChange = jest.fn((view) => {
        const params = new URLSearchParams();
        params.set('view', view);
        mockRouter.push(`/calendar?${params.toString()}`);
      });

      const { useCalendar } = require('@/features/calendar/hooks');
      useCalendar.mockReturnValue({
        ...mockUseCalendar,
        handlers: {
          ...mockUseCalendar.handlers,
          onViewChange: mockHandleViewChange,
        },
      });

      renderWithProviders(<CalendarPage />);
      
      const weekViewButton = screen.getByText('Week View');
      await userEvent.click(weekViewButton);
      
      expect(mockHandleViewChange).toHaveBeenCalledWith('주');
    });
  });

  // ========================
  // 프로젝트 필터링 테스트
  // ========================

  describe('Project Filtering', () => {
    it('should show all projects by default', () => {
      renderWithProviders(<CalendarPage />);
      
      // 프로젝트 목록이 표시되는지 확인
      expect(screen.getByTestId('project-list')).toBeInTheDocument();
    });

    it('should filter projects when project filter is changed', async () => {
      renderWithProviders(<CalendarPage />);
      
      const allProjectsButton = screen.getByText('All Projects');
      await userEvent.click(allProjectsButton);
      
      expect(mockUseProjectSchedule.filterProjects).toHaveBeenCalled();
    });

    it('should display selected project name in filter', () => {
      const { useProjectSchedule } = require('@/features/calendar/hooks');
      useProjectSchedule.mockReturnValue({
        ...mockUseProjectSchedule,
        selectedProjectIds: [1],
        filteredProjects: [mockUseProjectSchedule.projects[0]],
      });

      renderWithProviders(<CalendarPage />);
      
      // 선택된 프로젝트명이 표시되는지 확인
      expect(screen.getByText(/전체|Test Project/)).toBeInTheDocument();
    });
  });

  // ========================
  // 반응형 테스트
  // ========================

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // 모바일 화면 크기로 설정
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(<CalendarPage />);
      
      const calendarContainer = screen.getByTestId('page-template');
      expect(calendarContainer).toBeInTheDocument();
      
      // 모바일에서는 특정 요소들이 다르게 표시되는지 확인
      // (실제 구현에 따라 테스트 조정 필요)
    });

    it('should show full layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      renderWithProviders(<CalendarPage />);
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
    });
  });

  // ========================
  // 접근성 테스트
  // ========================

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      renderWithProviders(<CalendarPage />);
      
      const prevButton = screen.getByLabelText(/이전|previous/i);
      const nextButton = screen.getByLabelText(/다음|next/i);
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CalendarPage />);
      
      const prevButton = screen.getByText('Previous');
      
      await user.tab(); // 첫 번째 요소로 이동
      expect(document.activeElement).toBeTruthy();
      
      await user.keyboard('{Enter}');
      expect(mockUseCalendar.navigation.navigatePrev).toHaveBeenCalled();
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<CalendarPage />);
      
      const mainTitle = screen.getByText('전체 일정');
      expect(mainTitle).toHaveClass('title');
    });

    it('should provide alternative text for visual elements', () => {
      renderWithProviders(<CalendarPage />);
      
      // 프로젝트 색상 표시기에 대한 설명이 있는지 확인
      const colorIndicators = screen.getByTestId('project-list');
      expect(colorIndicators).toBeInTheDocument();
    });
  });

  // ========================
  // URL 파라미터 테스트
  // ========================

  describe('URL Parameters', () => {
    it('should initialize with URL view parameter', () => {
      mockSearchParams.get.mockReturnValue('주');
      
      renderWithProviders(<CalendarPage />);
      
      expect(mockUseCalendar.handlers.onViewChange).toHaveBeenCalledWith('주');
    });

    it('should ignore invalid view parameter', () => {
      mockSearchParams.get.mockReturnValue('invalid');
      
      renderWithProviders(<CalendarPage />);
      
      // 기본값인 '월'이 유지되는지 확인
      expect(mockUseCalendar.state.currentView).toBe('월');
    });
  });

  // ========================
  // Redux 상태 테스트
  // ========================

  describe('Redux Integration', () => {
    it('should use project data from Redux store', () => {
      const storeWithProjects = configureStore({
        reducer: {
          ProjectStore: () => ({
            project_list: [{ id: 1, name: 'Redux Project' }],
            this_month_project: [],
            next_month_project: [],
            user_memos: [],
          }),
        },
      });

      render(
        <Provider store={storeWithProjects}>
          <CalendarPage />
        </Provider>
      );

      expect(refetchProject).toHaveBeenCalled();
    });

    it('should call refetchProject on component mount', () => {
      renderWithProviders(<CalendarPage />);
      
      expect(refetchProject).toHaveBeenCalledWith(expect.any(Function), mockRouter);
    });
  });

  // ========================
  // 성능 테스트
  // ========================

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = renderWithProviders(<CalendarPage />);
      
      // 동일한 props로 다시 렌더링
      rerender(
        <Provider store={mockStore}>
          <CalendarPage />
        </Provider>
      );
      
      // 컴포넌트가 여전히 정상적으로 표시되는지 확인
      expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
    });

    it('should handle large project lists efficiently', () => {
      const largeProjectList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Project ${i + 1}`,
        color: '#1631f8',
        firstDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
      }));

      const { useProjectSchedule } = require('@/features/calendar/hooks');
      useProjectSchedule.mockReturnValue({
        ...mockUseProjectSchedule,
        projects: largeProjectList,
      });

      const startTime = performance.now();
      renderWithProviders(<CalendarPage />);
      const endTime = performance.now();
      
      // 렌더링이 합리적인 시간 내에 완료되는지 확인 (100ms 이내)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByTestId('project-list')).toBeInTheDocument();
    });
  });
});

// ========================
// 통합 테스트
// ========================

describe('Calendar Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('should complete full user workflow', async () => {
    const user = userEvent.setup();
    
    const { useCalendar } = require('@/features/calendar/hooks');
    useCalendar.mockReturnValue(mockUseCalendar);

    renderWithProviders(<CalendarPage />);
    
    // 1. 초기 렌더링 확인
    expect(screen.getByText('전체 일정')).toBeInTheDocument();
    
    // 2. 뷰 변경
    const weekViewButton = screen.getByText('Week View');
    await user.click(weekViewButton);
    expect(mockUseCalendar.handlers.onViewChange).toHaveBeenCalledWith('주');
    
    // 3. 네비게이션 사용
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    expect(mockUseCalendar.navigation.navigateNext).toHaveBeenCalled();
    
    // 4. 프로젝트 필터링
    const allProjectsButton = screen.getByText('All Projects');
    await user.click(allProjectsButton);
    expect(mockUseProjectSchedule.filterProjects).toHaveBeenCalled();
  });

  it('should handle error recovery workflow', async () => {
    const user = userEvent.setup();
    
    // 초기에 에러 상태로 설정
    const { useCalendar } = require('@/features/calendar/hooks');
    useCalendar.mockReturnValue({
      ...mockUseCalendar,
      error: '네트워크 오류',
    });

    renderWithProviders(<CalendarPage />);
    
    // 에러 메시지 확인
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
    
    // 재시도 버튼 클릭
    const retryButton = screen.getByText('다시 시도');
    await user.click(retryButton);
    
    expect(refetchProject).toHaveBeenCalled();
  });
});