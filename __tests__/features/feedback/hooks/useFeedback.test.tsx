// =============================================================================
// useFeedback Hook Tests - VideoPlanet 피드백 훅 테스트
// =============================================================================

import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useFeedback } from '@/features/feedback/hooks/useFeedback';
import * as feedbackApi from '@/features/feedback/api/feedbackApi';
import { FeedbackProject, FeedbackInputData } from '@/features/feedback/types';

// Next.js 라우터 모킹
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// API 함수들 모킹
jest.mock('@/features/feedback/api/feedbackApi');
const mockedFeedbackApi = feedbackApi as jest.Mocked<typeof feedbackApi>;

// Mock store 설정
const createMockStore = (user = 'test@example.com') => {
  return configureStore({
    reducer: {
      ProjectStore: (state = { user }) => state,
    },
  });
};

// Mock 데이터
const mockProject: FeedbackProject = {
  id: 123,
  title: '테스트 프로젝트',
  description: '테스트 프로젝트 설명',
  manager: '테스트 매니저',
  consumer: '테스트 고객사',
  owner_email: 'owner@example.com',
  owner_nickname: '프로젝트 소유자',
  member_list: [
    {
      email: 'test@example.com',
      nickname: '테스트 사용자',
      rating: 'basic',
    },
    {
      email: 'manager@example.com',
      nickname: '관리자',
      rating: 'manager',
    },
  ],
  feedback: [
    {
      id: 1,
      email: 'test@example.com',
      nickname: '테스트 사용자',
      rating: 'basic',
      section: '05:30',
      text: '좋은 장면입니다',
      contents: '좋은 장면입니다',
      created: '2024-01-01T10:00:00Z',
    },
  ],
  files: 'https://example.com/video.mp4',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T12:00:00Z',
};

// 테스트 헬퍼 함수
const renderUseFeedbackHook = (projectId: string, user = 'test@example.com') => {
  const store = createMockStore(user);
  return renderHook(() => useFeedback(projectId), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
};

describe('useFeedback Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본적으로 성공하는 API 응답 설정
    mockedFeedbackApi.getFeedbackProject.mockResolvedValue(mockProject);
    mockedFeedbackApi.createFeedback.mockResolvedValue(mockProject.feedback[0] as any);
    mockedFeedbackApi.deleteFeedback.mockResolvedValue();
    mockedFeedbackApi.uploadFeedbackVideo.mockResolvedValue({
      success: true,
      message: '업로드 성공',
    });
    mockedFeedbackApi.deleteFeedbackVideo.mockResolvedValue();
  });

  describe('초기화 및 데이터 로딩', () => {
    it('프로젝트 ID가 주어지면 프로젝트 데이터를 로드해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123');

      expect(result.current.loading).toBe(true);
      expect(result.current.currentProject).toBeNull();

      await waitFor(() => {
        expect(mockedFeedbackApi.getFeedbackProject).toHaveBeenCalledWith('123');
        expect(result.current.currentProject).toEqual(mockProject);
        expect(result.current.loading).toBe(false);
      });
    });

    it('프로젝트 ID가 없으면 API를 호출하지 않아야 한다', () => {
      renderUseFeedbackHook('');

      expect(mockedFeedbackApi.getFeedbackProject).not.toHaveBeenCalled();
    });

    it('API 호출 실패 시 에러 상태를 설정해야 한다', async () => {
      const errorMessage = '프로젝트를 찾을 수 없습니다';
      mockedFeedbackApi.getFeedbackProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.error).toContain(errorMessage);
        expect(result.current.loading).toBe(false);
        expect(result.current.currentProject).toBeNull();
      });
    });
  });

  describe('피드백 목록 관리', () => {
    it('프로젝트의 피드백 목록을 올바르게 반환해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.feedbacks).toEqual(mockProject.feedback);
      });
    });

    it('프로젝트가 없으면 빈 피드백 목록을 반환해야 한다', () => {
      mockedFeedbackApi.getFeedbackProject.mockResolvedValue({
        ...mockProject,
        feedback: [],
      });

      const { result } = renderUseFeedbackHook('123');

      expect(result.current.feedbacks).toEqual([]);
    });
  });

  describe('권한 관리', () => {
    it('프로젝트 소유자는 모든 권한을 가져야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.permissions).toEqual({
          canManageFeedback: true,
          canDeleteFeedback: true,
          canUploadVideo: true,
          canDeleteVideo: true,
          canEditProject: true,
          role: 'owner',
        });
      });
    });

    it('관리자는 관리 권한을 가져야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'manager@example.com');

      await waitFor(() => {
        expect(result.current.permissions).toEqual({
          canManageFeedback: true,
          canDeleteFeedback: true,
          canUploadVideo: true,
          canDeleteVideo: true,
          canEditProject: true,
          role: 'manager',
        });
      });
    });

    it('일반 사용자는 제한된 권한을 가져야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'test@example.com');

      await waitFor(() => {
        expect(result.current.permissions).toEqual({
          canManageFeedback: false,
          canDeleteFeedback: false,
          canUploadVideo: false,
          canDeleteVideo: false,
          canEditProject: false,
          role: 'basic',
        });
      });
    });

    it('로그인하지 않은 사용자는 권한이 없어야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', '');

      await waitFor(() => {
        expect(result.current.permissions).toEqual({
          canManageFeedback: false,
          canDeleteFeedback: false,
          canUploadVideo: false,
          canDeleteVideo: false,
          canEditProject: false,
          role: 'basic',
        });
      });
    });
  });

  describe('피드백 생성', () => {
    it('피드백을 성공적으로 생성해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123');

      const feedbackData: FeedbackInputData = {
        secret: false,
        title: '',
        section: '10:30',
        contents: '새로운 피드백입니다',
      };

      await waitFor(() => {
        expect(result.current.currentProject).toEqual(mockProject);
      });

      await result.current.createFeedback(feedbackData);

      expect(mockedFeedbackApi.createFeedback).toHaveBeenCalledWith(feedbackData, '123');
      expect(mockedFeedbackApi.getFeedbackProject).toHaveBeenCalledTimes(2); // 초기 로드 + 리페치
    });

    it('피드백 생성 실패 시 에러를 처리해야 한다', async () => {
      const errorMessage = '피드백 생성 실패';
      mockedFeedbackApi.createFeedback.mockRejectedValue(new Error(errorMessage));

      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.currentProject).toEqual(mockProject);
      });

      const feedbackData: FeedbackInputData = {
        secret: false,
        title: '',
        section: '10:30',
        contents: '새로운 피드백입니다',
      };

      await expect(result.current.createFeedback(feedbackData)).rejects.toThrow(errorMessage);
    });
  });

  describe('피드백 삭제', () => {
    it('권한이 있는 사용자는 피드백을 삭제할 수 있어야 한다', async () => {
      // window.confirm 모킹
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canDeleteFeedback).toBe(true);
      });

      await result.current.deleteFeedback(1);

      expect(mockedFeedbackApi.deleteFeedback).toHaveBeenCalledWith(1);
      expect(mockedFeedbackApi.getFeedbackProject).toHaveBeenCalledTimes(2); // 초기 로드 + 리페치

      window.confirm = originalConfirm;
    });

    it('권한이 없는 사용자는 피드백을 삭제할 수 없어야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'test@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canDeleteFeedback).toBe(false);
      });

      await expect(result.current.deleteFeedback(1)).rejects.toThrow('피드백을 삭제할 권한이 없습니다');
    });

    it('사용자가 삭제를 취소하면 API를 호출하지 않아야 한다', async () => {
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canDeleteFeedback).toBe(true);
      });

      await result.current.deleteFeedback(1);

      expect(mockedFeedbackApi.deleteFeedback).not.toHaveBeenCalled();

      window.confirm = originalConfirm;
    });
  });

  describe('비디오 업로드', () => {
    it('권한이 있는 사용자는 비디오를 업로드할 수 있어야 한다', async () => {
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canUploadVideo).toBe(true);
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      await result.current.uploadVideo(mockFile);

      expect(mockedFeedbackApi.uploadFeedbackVideo).toHaveBeenCalledWith(
        mockFile,
        '123',
        expect.any(Function)
      );

      window.confirm = originalConfirm;
    });

    it('권한이 없는 사용자는 비디오를 업로드할 수 없어야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'test@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canUploadVideo).toBe(false);
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await expect(result.current.uploadVideo(mockFile)).rejects.toThrow('비디오를 업로드할 권한이 없습니다');
    });
  });

  describe('비디오 삭제', () => {
    it('권한이 있는 사용자는 비디오를 삭제할 수 있어야 한다', async () => {
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canDeleteVideo).toBe(true);
      });

      await result.current.deleteVideo();

      expect(mockedFeedbackApi.deleteFeedbackVideo).toHaveBeenCalledWith('123');

      window.confirm = originalConfirm;
    });

    it('권한이 없는 사용자는 비디오를 삭제할 수 없어야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'test@example.com');

      await waitFor(() => {
        expect(result.current.permissions.canDeleteVideo).toBe(false);
      });

      await expect(result.current.deleteVideo()).rejects.toThrow('비디오를 삭제할 권한이 없습니다');
    });
  });

  describe('데이터 새로고침', () => {
    it('refetch 함수가 데이터를 다시 불러와야 한다', async () => {
      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.currentProject).toEqual(mockProject);
      });

      // 첫 번째 호출 후 mock 리셋
      mockedFeedbackApi.getFeedbackProject.mockClear();

      result.current.refetch();

      await waitFor(() => {
        expect(mockedFeedbackApi.getFeedbackProject).toHaveBeenCalledWith('123');
      });
    });

    it('fetchProject 함수가 특정 프로젝트를 불러와야 한다', async () => {
      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.currentProject).toEqual(mockProject);
      });

      await result.current.fetchProject('456');

      expect(mockedFeedbackApi.getFeedbackProject).toHaveBeenCalledWith('456');
    });
  });

  describe('에러 처리', () => {
    it('401 에러 시 로그인 페이지로 리다이렉트해야 한다', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockedFeedbackApi.getFeedbackProject.mockRejectedValue(error);

      renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('기타 에러는 에러 메시지로 처리해야 한다', async () => {
      const errorMessage = '서버 에러';
      mockedFeedbackApi.getFeedbackProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderUseFeedbackHook('123');

      await waitFor(() => {
        expect(result.current.error).toContain(errorMessage);
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('현재 사용자 정보', () => {
    it('프로젝트 소유자의 정보를 올바르게 반환해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'owner@example.com');

      await waitFor(() => {
        expect(result.current.currentUser).toEqual({
          email: 'owner@example.com',
          nickname: '프로젝트 소유자',
          rating: 'manager',
        });
      });
    });

    it('멤버의 정보를 올바르게 반환해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'test@example.com');

      await waitFor(() => {
        expect(result.current.currentUser).toEqual({
          email: 'test@example.com',
          nickname: '테스트 사용자',
          rating: 'basic',
        });
      });
    });

    it('프로젝트에 속하지 않은 사용자는 null을 반환해야 한다', async () => {
      const { result } = renderUseFeedbackHook('123', 'unknown@example.com');

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
      });
    });
  });
});