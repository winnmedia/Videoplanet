import { apiClient, fileApiClient } from '@/lib/api/client'
import { Feedback, FeedbackInputData, FeedbackCreateResponse, FileUploadResponse } from '../model/types'
import { validateEnvironment } from '@/lib/config'
import { AxiosResponse, AxiosRequestConfig } from 'axios'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Submit feedback API configuration error:', error)
}

export const submitFeedbackApi = {
  /**
   * 피드백 생성
   */
  createFeedback: async (
    data: FeedbackInputData,
    projectId: string
  ): Promise<Feedback> => {
    try {
      const response: AxiosResponse<FeedbackCreateResponse> = await apiClient.put(
        `/feedbacks/${projectId}`,
        data
      );
      
      if (response.data.result) {
        return response.data.result;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw createFeedbackError(error);
    }
  },

  /**
   * 피드백 비디오 파일 업로드
   */
  uploadFeedbackVideo: async (
    file: File,
    projectId: string,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...(onUploadProgress && { onUploadProgress }),
      };
      
      const response: AxiosResponse<FileUploadResponse> = await fileApiClient.post(
        `/feedbacks/${projectId}`,
        formData,
        config
      );
      
      return response.data;
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
export const handleSubmitFeedbackError = (error: any) => {
  if (error?.response?.status === 400) {
    const data = error?.response?.data
    if (data?.section) {
      return '타임스탬프가 유효하지 않습니다.'
    }
    if (data?.contents) {
      return '피드백 내용을 입력해주세요.'
    }
  }
  
  if (error?.response?.status === 403) {
    return '피드백을 작성할 권한이 없습니다.'
  }
  
  if (error?.response?.status === 404) {
    return '프로젝트를 찾을 수 없습니다.'
  }
  
  if (error?.response?.status === 413) {
    return '파일 크기가 너무 큽니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '피드백 제출 중 오류가 발생했습니다.'
  
  return message
}

// 유틸리티 함수들
export const feedbackValidation = {
  /**
   * 파일 타입 검증
   */
  isValidVideoFile: (file: File): boolean => {
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-mplayer2'
    ];
    
    return allowedTypes.includes(file.type);
  },

  /**
   * 파일 크기 검증
   */
  isValidFileSize: (file: File, maxSizeInMB: number = 100): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },

  /**
   * 타임스탬프 형식 검증 (MM:SS 또는 HH:MM:SS)
   */
  isValidTimestamp: (timestamp: string): boolean => {
    const timeRegex = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/;
    return timeRegex.test(timestamp);
  },

  /**
   * 타임스탬프를 초로 변환
   */
  timestampToSeconds: (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    
    if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
      // MM:SS 형식
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
      // HH:MM:SS 형식
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return 0;
  },

  /**
   * 초를 타임스탬프로 변환
   */
  secondsToTimestamp: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}