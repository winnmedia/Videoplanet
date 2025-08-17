/**
 * TDD: 사용자 여정 E2E 테스트
 * 실제 사용자 시나리오 기반 통합 테스트
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import projectsReducer from '../../features/projects/projectsSlice';
import DashboardPage from '../../app/(main)/dashboard/page';
import ProjectsPage from '../../app/(main)/projects/page';
import FeedbackPage from '../../app/(main)/feedback/[projectId]/page';

// Mock 설정
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({
    projectId: '1',
  }),
}));

jest.mock('../../features/projects/api/projectsApi');
jest.mock('../../features/feedback/api/feedbackApi');

describe('사용자 여정 E2E 테스트', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        projects: projectsReducer,
      },
    });

    // 로그인 상태 시뮬레이션
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'producer@example.com',
      name: '김영상',
      role: 'producer'
    }));
  });

  describe('Journey 1: 영상 제작자의 프로젝트 생성 플로우', () => {
    it('1. 대시보드에서 프로젝트 관리 메뉴에 접근할 수 있어야 함', () => {
      render(
        <Provider store={store}>
          <DashboardPage />
        </Provider>
      );

      const projectMenu = screen.getByText(/프로젝트 관리/i);
      expect(projectMenu).toBeInTheDocument();
      
      fireEvent.click(projectMenu);
      
      // 사이드바 또는 페이지 전환 확인
      expect(screen.getByRole('navigation')).toHaveClass('active');
    });

    it('2. 새 프로젝트를 생성할 수 있어야 함', async () => {
      const { projectsApi } = require('../../features/projects/api/projectsApi');
      
      projectsApi.createProject.mockResolvedValue({
        id: 1,
        name: 'A사 제품 홍보 영상',
        description: '30초 제품 홍보 영상',
        deadline: '2025-09-01',
        status: 'active'
      });

      render(
        <Provider store={store}>
          <ProjectsPage />
        </Provider>
      );

      const newProjectButton = screen.getByRole('button', { name: /새 프로젝트/i });
      fireEvent.click(newProjectButton);

      // 프로젝트 생성 폼 입력
      const nameInput = await screen.findByLabelText(/프로젝트명/i);
      const descInput = screen.getByLabelText(/설명/i);
      const deadlineInput = screen.getByLabelText(/마감일/i);

      fireEvent.change(nameInput, { target: { value: 'A사 제품 홍보 영상' } });
      fireEvent.change(descInput, { target: { value: '30초 제품 홍보 영상' } });
      fireEvent.change(deadlineInput, { target: { value: '2025-09-01' } });

      const submitButton = screen.getByRole('button', { name: /생성/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(projectsApi.createProject).toHaveBeenCalledWith({
          name: 'A사 제품 홍보 영상',
          description: '30초 제품 홍보 영상',
          deadline: '2025-09-01'
        });
      });
    });

    it('3. 클라이언트를 프로젝트에 초대할 수 있어야 함', async () => {
      const { projectsApi } = require('../../features/projects/api/projectsApi');
      
      projectsApi.inviteToProject.mockResolvedValue({
        success: true,
        message: '초대 이메일이 발송되었습니다'
      });

      render(
        <Provider store={store}>
          <ProjectsPage />
        </Provider>
      );

      const inviteButton = screen.getByRole('button', { name: /초대/i });
      fireEvent.click(inviteButton);

      const emailInput = await screen.findByPlaceholderText(/이메일 주소/i);
      const roleSelect = screen.getByLabelText(/역할/i);
      const messageInput = screen.getByLabelText(/초대 메시지/i);

      fireEvent.change(emailInput, { target: { value: 'client@example.com' } });
      fireEvent.change(roleSelect, { target: { value: 'reviewer' } });
      fireEvent.change(messageInput, { target: { value: '프로젝트 검토를 부탁드립니다.' } });

      const sendButton = screen.getByRole('button', { name: /발송/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/초대 이메일이 발송되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('Journey 2: 피드백 제공 및 관리', () => {
    it('1. 영상에 타임스탬프 기반 피드백을 추가할 수 있어야 함', async () => {
      const { feedbackApi } = require('../../features/feedback/api/feedbackApi');
      
      feedbackApi.createFeedback.mockResolvedValue({
        id: 1,
        timestamp: 15,
        content: '화면 전환이 너무 빠릅니다',
        priority: 'high',
        createdAt: new Date().toISOString()
      });

      render(
        <Provider store={store}>
          <FeedbackPage />
        </Provider>
      );

      // 비디오 플레이어에서 특정 시점 클릭
      const videoPlayer = screen.getByTestId('video-player');
      fireEvent.click(videoPlayer, { clientX: 150 }); // 15초 지점 시뮬레이션

      // 피드백 입력 폼이 나타나야 함
      const feedbackInput = await screen.findByPlaceholderText(/피드백을 입력하세요/i);
      const prioritySelect = screen.getByLabelText(/중요도/i);

      fireEvent.change(feedbackInput, { 
        target: { value: '화면 전환이 너무 빠릅니다' } 
      });
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      const submitButton = screen.getByRole('button', { name: /피드백 추가/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(feedbackApi.createFeedback).toHaveBeenCalledWith({
          projectId: '1',
          timestamp: 15,
          content: '화면 전환이 너무 빠릅니다',
          priority: 'high'
        });
      });
    });

    it('2. 스크린샷을 첨부한 피드백을 생성할 수 있어야 함', async () => {
      const { feedbackApi } = require('../../features/feedback/api/feedbackApi');
      
      feedbackApi.createFeedbackWithScreenshot.mockResolvedValue({
        id: 2,
        timestamp: 45,
        content: '자막 위치 조정 필요',
        screenshot: 'screenshot-url.jpg',
        priority: 'medium'
      });

      render(
        <Provider store={store}>
          <FeedbackPage />
        </Provider>
      );

      // 스크린샷 캡처 버튼 클릭
      const screenshotButton = screen.getByRole('button', { name: /스크린샷/i });
      fireEvent.click(screenshotButton);

      // 캡처 영역 선택 시뮬레이션
      const canvas = await screen.findByTestId('screenshot-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 300 });
      fireEvent.mouseUp(canvas);

      // 피드백 추가
      const feedbackInput = screen.getByPlaceholderText(/피드백을 입력하세요/i);
      fireEvent.change(feedbackInput, { 
        target: { value: '자막 위치 조정 필요' } 
      });

      const submitButton = screen.getByRole('button', { name: /피드백 추가/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(feedbackApi.createFeedbackWithScreenshot).toHaveBeenCalled();
      });
    });

    it('3. 피드백 상태를 관리할 수 있어야 함', async () => {
      const { feedbackApi } = require('../../features/feedback/api/feedbackApi');
      
      feedbackApi.updateFeedbackStatus.mockResolvedValue({
        id: 1,
        status: 'in_progress'
      });

      render(
        <Provider store={store}>
          <FeedbackPage />
        </Provider>
      );

      // 피드백 목록에서 상태 변경
      const feedbackItem = screen.getByTestId('feedback-item-1');
      const statusButton = within(feedbackItem).getByRole('button', { name: /상태 변경/i });
      
      fireEvent.click(statusButton);

      const inProgressOption = await screen.findByText(/처리 중/i);
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(feedbackApi.updateFeedbackStatus).toHaveBeenCalledWith(1, 'in_progress');
      });
    });
  });

  describe('Journey 3: 프로젝트 진행 상황 추적', () => {
    it('1. 대시보드에서 프로젝트 진행률을 확인할 수 있어야 함', () => {
      render(
        <Provider store={store}>
          <DashboardPage />
        </Provider>
      );

      // 프로젝트 진행률 위젯 확인
      const progressWidget = screen.getByTestId('project-progress-widget');
      expect(progressWidget).toBeInTheDocument();

      // 진행률 표시 확인
      const progressBar = within(progressWidget).getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
    });

    it('2. 피드백 처리 현황을 확인할 수 있어야 함', () => {
      render(
        <Provider store={store}>
          <DashboardPage />
        </Provider>
      );

      const feedbackWidget = screen.getByTestId('feedback-status-widget');
      
      // 피드백 통계 확인
      expect(within(feedbackWidget).getByText(/전체 피드백/i)).toBeInTheDocument();
      expect(within(feedbackWidget).getByText(/처리 완료/i)).toBeInTheDocument();
      expect(within(feedbackWidget).getByText(/처리 중/i)).toBeInTheDocument();
      expect(within(feedbackWidget).getByText(/대기 중/i)).toBeInTheDocument();
    });

    it('3. 초대 현황을 모니터링할 수 있어야 함', () => {
      render(
        <Provider store={store}>
          <DashboardPage />
        </Provider>
      );

      const invitationWidget = screen.getByTestId('invitation-status-widget');
      
      // 초대 상태 확인
      expect(within(invitationWidget).getByText(/발송됨/i)).toBeInTheDocument();
      expect(within(invitationWidget).getByText(/수락됨/i)).toBeInTheDocument();
      expect(within(invitationWidget).getByText(/대기 중/i)).toBeInTheDocument();
    });
  });

  describe('Journey 4: 반응형 디자인 및 접근성', () => {
    it('1. 모바일 화면에서도 피드백 기능이 작동해야 함', () => {
      // 모바일 뷰포트 시뮬레이션
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(
        <Provider store={store}>
          <FeedbackPage />
        </Provider>
      );

      // 모바일 메뉴 버튼 확인
      const mobileMenuButton = screen.getByRole('button', { name: /메뉴/i });
      expect(mobileMenuButton).toBeInTheDocument();

      // 피드백 입력 가능 확인
      const feedbackInput = screen.getByPlaceholderText(/피드백을 입력하세요/i);
      expect(feedbackInput).toBeInTheDocument();
    });

    it('2. 키보드 네비게이션이 가능해야 함', () => {
      render(
        <Provider store={store}>
          <DashboardPage />
        </Provider>
      );

      const firstMenuItem = screen.getAllByRole('link')[0];
      firstMenuItem.focus();

      // Tab 키로 다음 요소로 이동
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      
      const secondMenuItem = screen.getAllByRole('link')[1];
      expect(document.activeElement).toBe(secondMenuItem);
    });

    it('3. 스크린 리더를 위한 ARIA 레이블이 있어야 함', () => {
      render(
        <Provider store={store}>
          <FeedbackPage />
        </Provider>
      );

      // ARIA 레이블 확인
      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /피드백 추가/i }))
        .toHaveAttribute('aria-describedby');
    });
  });
});