/**
 * Dashboard Integration Test
 * Simple tests to verify dashboard functionality
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';

// Mock the API service
vi.mock('@/shared/services/api.service', () => ({
  default: {
    getFeedbackNotifications: vi.fn(() => Promise.resolve([
      {
        id: 'fb1',
        type: 'new_feedback',
        title: '새 피드백',
        message: '테스트 피드백',
        timestamp: new Date(),
        isRead: false,
        priority: 'high',
        projectName: '테스트 프로젝트',
        author: '테스터'
      }
    ])),
    getProjectNotifications: vi.fn(() => Promise.resolve([
      {
        id: 'pn1',
        type: 'invitation',
        title: '프로젝트 초대',
        message: '새 프로젝트 초대',
        timestamp: new Date(),
        isRead: false,
        projectName: '테스트 프로젝트',
        actionRequired: true
      }
    ])),
    getDashboardStats: vi.fn(() => Promise.resolve({
      inProgress: 5,
      completed: 12,
      thisMonth: 3
    })),
    getProjectProgress: vi.fn(() => Promise.resolve([
      {
        id: 'proj1',
        name: '테스트 프로젝트',
        progress: 75,
        status: 'on_track',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        phase: 'editing'
      }
    ])),
    markAsRead: vi.fn(() => Promise.resolve()),
    markAllAsRead: vi.fn(() => Promise.resolve()),
  }
}));

// Mock WebSocket service
vi.mock('@/shared/services/websocket-native.service', () => ({
  useWebSocket: vi.fn(() => ({ isConnected: true, send: vi.fn() })),
  webSocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Set up localStorage
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({
      name: '테스트 사용자',
      email: 'test@example.com'
    }));
  });

  test('대시보드가 정상적으로 렌더링되어야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  test('4가지 핵심 섹션이 모두 표시되어야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      expect(screen.getByText('피드백 알림')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 알림')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 일정 진행상황')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 통계')).toBeInTheDocument();
    });
  });

  test('피드백 알림 아이템이 표시되어야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      const feedbackItem = screen.getByTestId('feedback-notification-fb1');
      expect(feedbackItem).toBeInTheDocument();
      expect(screen.getByText('테스트 피드백')).toBeInTheDocument();
    });
  });

  test('프로젝트 통계가 올바르게 표시되어야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      expect(screen.getByTestId('stat-value-inProgress')).toHaveTextContent('5');
      expect(screen.getByTestId('stat-value-completed')).toHaveTextContent('12');
      expect(screen.getByTestId('stat-value-thisMonth')).toHaveTextContent('3');
    });
  });

  test('읽음 처리 버튼이 작동해야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      const markAsReadBtn = screen.getByTestId('mark-as-read-fb1');
      expect(markAsReadBtn).toBeInTheDocument();
    });

    const markAsReadBtn = screen.getByTestId('mark-as-read-fb1');
    fireEvent.click(markAsReadBtn);

    await waitFor(() => {
      const feedbackItem = screen.getByTestId('feedback-notification-fb1');
      expect(feedbackItem).toHaveClass('read');
    });
  });

  test('필터 버튼이 작동해야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      const unreadFilter = screen.getByTestId('filter-unread');
      expect(unreadFilter).toBeInTheDocument();
    });

    const unreadFilter = screen.getByTestId('filter-unread');
    fireEvent.click(unreadFilter);

    expect(unreadFilter).toHaveClass('active');
  });

  test('WebSocket 연결 상태가 표시되어야 함', async () => {
    const Page = await DashboardPage();
    render(Page);
    
    await waitFor(() => {
      const liveIndicator = screen.getByTestId('live-indicator');
      expect(liveIndicator).toBeInTheDocument();
      expect(liveIndicator).toHaveTextContent('LIVE');
    });
  });

  test('반응형 레이아웃이 적용되어야 함', () => {
    // Set mobile viewport
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    const Page = await DashboardPage();
    render(Page);
    
    const mainGrid = screen.getByTestId('dashboard-main');
    const computedStyle = window.getComputedStyle(mainGrid);
    
    // On mobile, should be single column
    expect(computedStyle.gridTemplateColumns).toContain('1fr');
  });
});