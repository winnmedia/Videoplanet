/**
 * 보조 기능 통합 테스트
 * 캘린더, 프로필 설정, 알림 기능 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock components (실제 구현에서는 실제 컴포넌트를 import)
import CalendarPage from '@/app/(main)/calendar/page';
import ProfileSettings from '@/components/organisms/ProfileSettings';
import NotificationCenter from '@/components/organisms/NotificationCenter';

// Mock API responses
jest.mock('@/lib/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/lib/api/client';

const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { id: '1', name: '테스트 사용자', email: 'test@example.com' } }) => state,
    calendar: (state = { events: [], loading: false }) => state,
    notifications: (state = { items: [], unreadCount: 0 }) => state,
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('보조 기능 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('캘린더 기능', () => {
    it('캘린더를 로드하고 이벤트를 표시할 수 있어야 한다', async () => {
      // Mock calendar data
      const mockEvents = [
        {
          id: 'event-1',
          title: '프로젝트 A 마감',
          start: '2025-08-20T09:00:00Z',
          end: '2025-08-20T17:00:00Z',
          type: 'deadline',
          projectId: 'proj-1',
        },
        {
          id: 'event-2',
          title: '팀 미팅',
          start: '2025-08-21T14:00:00Z',
          end: '2025-08-21T15:00:00Z',
          type: 'meeting',
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { events: mockEvents },
      });

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      // 캘린더 로딩 확인
      expect(screen.getByTestId('calendar-container')).toBeInTheDocument();

      // 이벤트 로드 대기
      await waitFor(() => {
        expect(screen.getByText('프로젝트 A 마감')).toBeInTheDocument();
        expect(screen.getByText('팀 미팅')).toBeInTheDocument();
      });

      // API 호출 확인
      expect(api.get).toHaveBeenCalledWith('/calendar/events');
    });

    it('새로운 이벤트를 생성할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: { events: [] },
      });

      (api.post as jest.Mock).mockResolvedValue({
        data: {
          event: {
            id: 'event-new',
            title: '새 이벤트',
            start: '2025-08-25T10:00:00Z',
            end: '2025-08-25T11:00:00Z',
          },
        },
      });

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      // 이벤트 생성 버튼 클릭
      const createEventButton = await screen.findByTestId('create-event-button');
      await user.click(createEventButton);

      // 이벤트 생성 모달 확인
      expect(screen.getByTestId('event-creation-modal')).toBeInTheDocument();

      // 이벤트 정보 입력
      await user.type(screen.getByTestId('event-title-input'), '새 이벤트');
      await user.type(screen.getByTestId('event-start-input'), '2025-08-25T10:00');
      await user.type(screen.getByTestId('event-end-input'), '2025-08-25T11:00');

      // 이벤트 생성 확인
      await user.click(screen.getByTestId('confirm-create-event'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/calendar/events', {
          title: '새 이벤트',
          start: '2025-08-25T10:00',
          end: '2025-08-25T11:00',
        });
      });
    });

    it('월/주/일 보기를 전환할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: { events: [] },
      });

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      // 초기 상태 (월 보기)
      expect(screen.getByTestId('calendar-month-view')).toBeInTheDocument();

      // 주 보기로 전환
      await user.click(screen.getByTestId('view-week-button'));
      expect(screen.getByTestId('calendar-week-view')).toBeInTheDocument();

      // 일 보기로 전환
      await user.click(screen.getByTestId('view-day-button'));
      expect(screen.getByTestId('calendar-day-view')).toBeInTheDocument();

      // 다시 월 보기로 전환
      await user.click(screen.getByTestId('view-month-button'));
      expect(screen.getByTestId('calendar-month-view')).toBeInTheDocument();
    });

    it('프로젝트 관련 이벤트를 필터링할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      const mockEventsWithProjects = [
        {
          id: 'event-1',
          title: '프로젝트 A 마감',
          projectId: 'proj-a',
          projectName: '프로젝트 A',
        },
        {
          id: 'event-2',
          title: '프로젝트 B 리뷰',
          projectId: 'proj-b',
          projectName: '프로젝트 B',
        },
        {
          id: 'event-3',
          title: '개인 미팅',
          projectId: null,
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { events: mockEventsWithProjects },
      });

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      // 모든 이벤트 표시 확인
      await waitFor(() => {
        expect(screen.getByText('프로젝트 A 마감')).toBeInTheDocument();
        expect(screen.getByText('프로젝트 B 리뷰')).toBeInTheDocument();
        expect(screen.getByText('개인 미팅')).toBeInTheDocument();
      });

      // 프로젝트 A 필터 적용
      await user.click(screen.getByTestId('filter-by-project'));
      await user.selectOptions(screen.getByTestId('project-filter-select'), 'proj-a');

      // 프로젝트 A 이벤트만 표시되는지 확인
      expect(screen.getByText('프로젝트 A 마감')).toBeInTheDocument();
      expect(screen.queryByText('프로젝트 B 리뷰')).not.toBeInTheDocument();
      expect(screen.queryByText('개인 미팅')).not.toBeInTheDocument();
    });
  });

  describe('프로필 설정', () => {
    it('사용자 프로필 정보를 로드하고 표시할 수 있어야 한다', async () => {
      const mockProfile = {
        id: '1',
        name: '홍길동',
        email: 'hong@example.com',
        avatar: '/avatars/hong.jpg',
        timezone: 'Asia/Seoul',
        language: 'ko',
        notifications: {
          email: true,
          push: false,
          slack: true,
        },
      };

      (api.get as jest.Mock).mockResolvedValue({
        data: { profile: mockProfile },
      });

      render(
        <TestWrapper>
          <ProfileSettings />
        </TestWrapper>
      );

      // 프로필 정보 표시 확인
      await waitFor(() => {
        expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
        expect(screen.getByDisplayValue('hong@example.com')).toBeInTheDocument();
      });
    });

    it('프로필 정보를 수정할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          profile: {
            id: '1',
            name: '홍길동',
            email: 'hong@example.com',
          },
        },
      });

      (api.put as jest.Mock).mockResolvedValue({
        data: { message: '프로필이 업데이트되었습니다.' },
      });

      render(
        <TestWrapper>
          <ProfileSettings />
        </TestWrapper>
      );

      // 이름 변경
      const nameInput = await screen.findByTestId('profile-name-input');
      await user.clear(nameInput);
      await user.type(nameInput, '김길동');

      // 저장 버튼 클릭
      await user.click(screen.getByTestId('save-profile-button'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/user/profile', {
          name: '김길동',
          email: 'hong@example.com',
        });
      });

      // 성공 메시지 확인
      expect(screen.getByText('프로필이 업데이트되었습니다.')).toBeInTheDocument();
    });

    it('알림 설정을 변경할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          profile: {
            notifications: {
              email: true,
              push: false,
              slack: false,
            },
          },
        },
      });

      (api.put as jest.Mock).mockResolvedValue({
        data: { message: '알림 설정이 업데이트되었습니다.' },
      });

      render(
        <TestWrapper>
          <ProfileSettings />
        </TestWrapper>
      );

      // 푸시 알림 활성화
      const pushToggle = await screen.findByTestId('notification-push-toggle');
      await user.click(pushToggle);

      // 설정 저장
      await user.click(screen.getByTestId('save-notifications-button'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/user/notifications', {
          email: true,
          push: true,
          slack: false,
        });
      });
    });

    it('프로필 이미지를 업로드할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: { profile: { avatar: null } },
      });

      (api.post as jest.Mock).mockResolvedValue({
        data: { avatarUrl: '/avatars/new-avatar.jpg' },
      });

      render(
        <TestWrapper>
          <ProfileSettings />
        </TestWrapper>
      );

      // 파일 업로드
      const fileInput = await screen.findByTestId('avatar-upload-input');
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/user/avatar',
          expect.any(FormData)
        );
      });

      // 새 아바타 표시 확인
      const avatarImage = screen.getByTestId('user-avatar');
      expect(avatarImage).toHaveAttribute('src', '/avatars/new-avatar.jpg');
    });
  });

  describe('알림 센터', () => {
    it('알림 목록을 로드하고 표시할 수 있어야 한다', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: '새로운 피드백이 도착했습니다',
          message: '프로젝트 A에 새로운 피드백이 추가되었습니다.',
          type: 'feedback',
          read: false,
          createdAt: '2025-08-17T10:00:00Z',
        },
        {
          id: 'notif-2',
          title: '프로젝트 마감 알림',
          message: '프로젝트 B의 마감일이 내일입니다.',
          type: 'deadline',
          read: true,
          createdAt: '2025-08-16T15:00:00Z',
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { notifications: mockNotifications },
      });

      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      );

      // 알림 표시 확인
      await waitFor(() => {
        expect(screen.getByText('새로운 피드백이 도착했습니다')).toBeInTheDocument();
        expect(screen.getByText('프로젝트 마감 알림')).toBeInTheDocument();
      });

      // 읽지 않은 알림 표시 확인
      expect(screen.getByTestId('notification-notif-1')).toHaveClass('unread');
      expect(screen.getByTestId('notification-notif-2')).toHaveClass('read');
    });

    it('알림을 읽음으로 표시할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      const mockNotifications = [
        {
          id: 'notif-1',
          title: '새로운 피드백',
          read: false,
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { notifications: mockNotifications },
      });

      (api.put as jest.Mock).mockResolvedValue({
        data: { message: '알림이 읽음으로 표시되었습니다.' },
      });

      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      );

      // 읽지 않은 알림 클릭
      const notification = await screen.findByTestId('notification-notif-1');
      await user.click(notification);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/notifications/notif-1/read');
      });
    });

    it('알림을 타입별로 필터링할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      const mockNotifications = [
        {
          id: 'notif-1',
          title: '피드백 알림',
          type: 'feedback',
        },
        {
          id: 'notif-2',
          title: '마감 알림',
          type: 'deadline',
        },
        {
          id: 'notif-3',
          title: '팀 초대',
          type: 'invitation',
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: { notifications: mockNotifications },
      });

      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      );

      // 모든 알림 표시 확인
      await waitFor(() => {
        expect(screen.getByText('피드백 알림')).toBeInTheDocument();
        expect(screen.getByText('마감 알림')).toBeInTheDocument();
        expect(screen.getByText('팀 초대')).toBeInTheDocument();
      });

      // 피드백 알림만 필터링
      await user.click(screen.getByTestId('filter-feedback-notifications'));

      expect(screen.getByText('피드백 알림')).toBeInTheDocument();
      expect(screen.queryByText('마감 알림')).not.toBeInTheDocument();
      expect(screen.queryByText('팀 초대')).not.toBeInTheDocument();
    });

    it('모든 알림을 읽음으로 표시할 수 있어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          notifications: [
            { id: 'notif-1', read: false },
            { id: 'notif-2', read: false },
          ],
        },
      });

      (api.put as jest.Mock).mockResolvedValue({
        data: { message: '모든 알림이 읽음으로 표시되었습니다.' },
      });

      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      );

      // 모두 읽음 버튼 클릭
      const markAllReadButton = await screen.findByTestId('mark-all-read-button');
      await user.click(markAllReadButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/notifications/mark-all-read');
      });
    });
  });

  describe('통합 시나리오', () => {
    it('캘린더에서 이벤트 생성 시 알림이 생성되어야 한다', async () => {
      const user = userEvent.setup();

      // Calendar API 모킹
      (api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/calendar/events') {
          return Promise.resolve({ data: { events: [] } });
        }
        if (url === '/notifications') {
          return Promise.resolve({ data: { notifications: [] } });
        }
      });

      (api.post as jest.Mock).mockResolvedValue({
        data: {
          event: { id: 'event-1', title: '새 이벤트' },
          notification: { id: 'notif-1', message: '이벤트가 생성되었습니다.' },
        },
      });

      render(
        <TestWrapper>
          <div>
            <CalendarPage />
            <NotificationCenter />
          </div>
        </TestWrapper>
      );

      // 캘린더에서 이벤트 생성
      const createEventButton = await screen.findByTestId('create-event-button');
      await user.click(createEventButton);

      await user.type(screen.getByTestId('event-title-input'), '새 이벤트');
      await user.click(screen.getByTestId('confirm-create-event'));

      // 알림 생성 확인
      await waitFor(() => {
        expect(screen.getByText('이벤트가 생성되었습니다.')).toBeInTheDocument();
      });
    });

    it('프로필에서 알림 설정 변경이 실시간으로 반영되어야 한다', async () => {
      const user = userEvent.setup();

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          profile: { notifications: { email: false } },
          notifications: [],
        },
      });

      (api.put as jest.Mock).mockResolvedValue({
        data: { message: '설정이 저장되었습니다.' },
      });

      render(
        <TestWrapper>
          <div>
            <ProfileSettings />
            <NotificationCenter />
          </div>
        </TestWrapper>
      );

      // 프로필에서 이메일 알림 활성화
      const emailToggle = await screen.findByTestId('notification-email-toggle');
      await user.click(emailToggle);
      await user.click(screen.getByTestId('save-notifications-button'));

      // 알림 센터에 설정 변경 알림 표시
      await waitFor(() => {
        expect(screen.getByText('설정이 저장되었습니다.')).toBeInTheDocument();
      });
    });
  });
});