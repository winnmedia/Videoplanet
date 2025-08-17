import { apiClient } from '@/lib/api/client'
import { FeedbackProject, Feedback, FeedbackListResponse } from '../model/types'
import { validateEnvironment } from '@/lib/config'
import { AxiosResponse } from 'axios'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('View feedback API configuration error:', error)
}

export const viewFeedbackApi = {
  /**
   * 피드백 프로젝트 상세 정보 조회
   */
  getFeedbackProject: async (projectId: string): Promise<FeedbackProject> => {
    try {
      const response: AxiosResponse<FeedbackListResponse> = await apiClient.get(
        `/feedbacks/${projectId}`
      );
      
      if (response.data.data?.result) {
        return response.data.data.result;
      } else if (response.data.result) {
        return response.data.result;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw createFeedbackError(error);
    }
  },

  /**
   * 피드백 목록 조회 (전체)
   */
  getAllFeedbacks: async (projectId: string): Promise<Feedback[]> => {
    try {
      const project = await viewFeedbackApi.getFeedbackProject(projectId);
      return project.feedback || [];
    } catch (error) {
      throw createFeedbackError(error);
    }
  },

  /**
   * 사용자별 피드백 목록 조회
   */
  getUserFeedbacks: async (
    projectId: string,
    userEmail: string
  ): Promise<Feedback[]> => {
    try {
      const project = await viewFeedbackApi.getFeedbackProject(projectId);
      return project.feedback?.filter(feedback => feedback.email === userEmail) || [];
    } catch (error) {
      throw createFeedbackError(error);
    }
  }
}

// 에러 생성 유틸리티
function createFeedbackError(error: any) {
  const feedbackError = new Error(error.response?.data?.message || error.message) as any;
  feedbackError.code = error.code;
  feedbackError.status = error.response?.status;
  feedbackError.details = error.response?.data;
  return feedbackError;
}

// 에러 처리 유틸리티
export const handleViewFeedbackError = (error: any) => {
  if (error?.response?.status === 401) {
    return '로그인이 필요합니다.'
  }
  
  if (error?.response?.status === 403) {
    return '피드백을 볼 권한이 없습니다.'
  }
  
  if (error?.response?.status === 404) {
    return '프로젝트를 찾을 수 없습니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '피드백을 불러오는 중 오류가 발생했습니다.'
  
  return message
}

// 타입 가드 함수들
export const feedbackTypeGuards = {
  /**
   * 피드백 객체 타입 가드
   */
  isFeedback: (obj: any): obj is Feedback => {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'number' &&
      typeof obj.email === 'string' &&
      typeof obj.nickname === 'string' &&
      (obj.rating === 'manager' || obj.rating === 'basic') &&
      typeof obj.section === 'string' &&
      typeof obj.text === 'string' &&
      typeof obj.created === 'string'
    );
  },

  /**
   * 피드백 프로젝트 객체 타입 가드
   */
  isFeedbackProject: (obj: any): obj is FeedbackProject => {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'number' &&
      typeof obj.title === 'string' &&
      typeof obj.owner_email === 'string' &&
      typeof obj.owner_nickname === 'string' &&
      Array.isArray(obj.member_list) &&
      Array.isArray(obj.feedback)
    );
  }
}

// 유틸리티 함수들
export const feedbackUtils = {
  /**
   * 사용자 권한 확인
   */
  getUserPermissions: (
    project: FeedbackProject,
    userEmail: string
  ): {
    isOwner: boolean;
    isManager: boolean;
    canManageFeedback: boolean;
    canDeleteFeedback: boolean;
    canUploadVideo: boolean;
    canDeleteVideo: boolean;
  } => {
    const isOwner = project.owner_email === userEmail;
    const member = project.member_list.find(m => m.email === userEmail);
    const isManager = isOwner || member?.rating === 'manager';
    
    return {
      isOwner,
      isManager,
      canManageFeedback: isManager,
      canDeleteFeedback: isManager,
      canUploadVideo: isManager,
      canDeleteVideo: isManager,
    };
  },

  /**
   * 피드백 그룹화 (날짜별)
   */
  groupFeedbacksByDate: (feedbacks: Feedback[]) => {
    const grouped = feedbacks.reduce((acc, feedback) => {
      const date = new Date(feedback.created).toLocaleDateString('ko-KR');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(feedback);
      return acc;
    }, {} as Record<string, Feedback[]>);

    return Object.entries(grouped).map(([date, feedbacks]) => ({
      date,
      feedbacks: feedbacks.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    }));
  },

  /**
   * 피드백 필터링
   */
  filterFeedbacks: (
    feedbacks: Feedback[],
    filters: {
      userEmail?: string;
      isSecret?: boolean;
      dateRange?: { start: Date; end: Date };
      hasTimestamp?: boolean;
    }
  ): Feedback[] => {
    return feedbacks.filter(feedback => {
      if (filters.userEmail && feedback.email !== filters.userEmail) {
        return false;
      }
      
      if (filters.isSecret !== undefined && !!feedback.secret !== filters.isSecret) {
        return false;
      }
      
      if (filters.hasTimestamp !== undefined) {
        const hasTimestamp = feedback.section && feedback.section.trim() !== '';
        if (hasTimestamp !== filters.hasTimestamp) {
          return false;
        }
      }
      
      if (filters.dateRange) {
        const feedbackDate = new Date(feedback.created);
        if (feedbackDate < filters.dateRange.start || feedbackDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  },

  /**
   * 피드백 정렬
   */
  sortFeedbacks: (
    feedbacks: Feedback[],
    sortBy: 'created' | 'updated' | 'section' | 'author' = 'created',
    order: 'asc' | 'desc' = 'desc'
  ): Feedback[] => {
    return [...feedbacks].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created':
          aValue = new Date(a.created).getTime();
          bValue = new Date(b.created).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updated || a.created).getTime();
          bValue = new Date(b.updated || b.created).getTime();
          break;
        case 'section':
          aValue = a.section || '';
          bValue = b.section || '';
          break;
        case 'author':
          aValue = a.nickname || a.email;
          bValue = b.nickname || b.email;
          break;
        default:
          aValue = new Date(a.created).getTime();
          bValue = new Date(b.created).getTime();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}