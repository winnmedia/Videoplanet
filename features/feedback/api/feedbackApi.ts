// =============================================================================
// Feedback API - VideoPlanet 피드백 시스템 API 로직
// =============================================================================

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import {
  FeedbackProject,
  Feedback,
  FeedbackInputData,
  ApiResponse,
  FeedbackListResponse,
  FeedbackCreateResponse,
  FeedbackDeleteResponse,
  FileUploadData,
  FileUploadResponse,
  FeedbackError,
} from '../types';
import { API_BASE_URL, validateEnvironment, SOCKET_URL } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Feedback API configuration error:', error)
}

// Axios 인스턴스 생성
export const feedbackApi = axios.create({
  ...(API_BASE_URL && { baseURL: API_BASE_URL }),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 인터셉터 설정
feedbackApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 설정 (토큰 갱신)
feedbackApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return feedbackApi(originalRequest);
        }
      } catch (refreshError) {
        // 리프레시 실패 시 로그아웃 처리
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(createFeedbackError(error));
  }
);

// 에러 생성 유틸리티
function createFeedbackError(error: any): FeedbackError {
  const feedbackError = new Error(
    error.response?.data?.message || error.message || 'Unknown error'
  ) as FeedbackError;
  
  feedbackError.code = error.response?.data?.code || 'UNKNOWN_ERROR';
  feedbackError.status = error.response?.status;
  feedbackError.details = error.response?.data;
  
  return feedbackError;
}

// API 함수들

/**
 * 피드백 프로젝트 상세 정보 조회
 */
export async function getFeedbackProject(projectId: string): Promise<FeedbackProject> {
  try {
    const response: AxiosResponse<FeedbackListResponse> = await feedbackApi.get(
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
}

/**
 * 피드백 생성
 */
export async function createFeedback(
  data: FeedbackInputData,
  projectId: string
): Promise<Feedback> {
  try {
    const response: AxiosResponse<FeedbackCreateResponse> = await feedbackApi.put(
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
}

/**
 * 피드백 삭제
 */
export async function deleteFeedback(feedbackId: number): Promise<void> {
  try {
    await feedbackApi.delete(`/feedbacks/${feedbackId}`);
  } catch (error) {
    throw createFeedbackError(error);
  }
}

/**
 * 피드백 비디오 파일 업로드
 */
export async function uploadFeedbackVideo(
  file: File,
  projectId: string,
  onUploadProgress?: (progressEvent: any) => void
): Promise<FileUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('files', file);
    
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...(onUploadProgress && { onUploadProgress }),
    };
    
    const response: AxiosResponse<FileUploadResponse> = await feedbackApi.post(
      `/feedbacks/${projectId}`,
      formData,
      config
    );
    
    return response.data;
  } catch (error) {
    throw createFeedbackError(error);
  }
}

/**
 * 피드백 비디오 파일 삭제
 */
export async function deleteFeedbackVideo(projectId: string): Promise<void> {
  try {
    await feedbackApi.delete(`/feedbacks/file/${projectId}`);
  } catch (error) {
    throw createFeedbackError(error);
  }
}

/**
 * 피드백 목록 조회 (전체)
 */
export async function getAllFeedbacks(projectId: string): Promise<Feedback[]> {
  try {
    const project = await getFeedbackProject(projectId);
    return project.feedback || [];
  } catch (error) {
    throw createFeedbackError(error);
  }
}

/**
 * 사용자별 피드백 목록 조회
 */
export async function getUserFeedbacks(
  projectId: string,
  userEmail: string
): Promise<Feedback[]> {
  try {
    const project = await getFeedbackProject(projectId);
    return project.feedback?.filter(feedback => feedback.email === userEmail) || [];
  } catch (error) {
    throw createFeedbackError(error);
  }
}

// WebSocket 관련 유틸리티

/**
 * WebSocket URL 생성
 */
export function createWebSocketUrl(projectId: string): string {
  return `${SOCKET_URL}/ws/chat/${projectId}/`;
}

/**
 * WebSocket 연결 생성
 */
export function createWebSocketConnection(
  projectId: string,
  onMessage?: (data: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  const url = createWebSocketUrl(projectId);
  const ws = new WebSocket(url);
  
  ws.onopen = (event) => {
    console.log('WebSocket connected to:', url);
    onOpen?.();
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    onClose?.();
  };
  
  ws.onerror = (event) => {
    console.error('WebSocket error:', event);
    onError?.(event);
  };
  
  return ws;
}

// 타입 가드 함수들

/**
 * 피드백 객체 타입 가드
 */
export function isFeedback(obj: any): obj is Feedback {
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
}

/**
 * 피드백 프로젝트 객체 타입 가드
 */
export function isFeedbackProject(obj: any): obj is FeedbackProject {
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

/**
 * API 응답 타입 가드
 */
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.message === 'string'
  );
}

// 유틸리티 함수들

/**
 * 파일 타입 검증
 */
export function isValidVideoFile(file: File): boolean {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-mplayer2'
  ];
  
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기 검증
 */
export function isValidFileSize(file: File, maxSizeInMB: number = 100): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * 타임스탬프 형식 검증 (MM:SS 또는 HH:MM:SS)
 */
export function isValidTimestamp(timestamp: string): boolean {
  const timeRegex = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/;
  return timeRegex.test(timestamp);
}

/**
 * 타임스탬프를 초로 변환
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
    // MM:SS 형식
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
    // HH:MM:SS 형식
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * 초를 타임스탬프로 변환
 */
export function secondsToTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * 사용자 권한 확인
 */
export function getUserPermissions(
  project: FeedbackProject,
  userEmail: string
): {
  isOwner: boolean;
  isManager: boolean;
  canManageFeedback: boolean;
  canDeleteFeedback: boolean;
  canUploadVideo: boolean;
  canDeleteVideo: boolean;
} {
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
}

/**
 * 에러 메시지 한국어 변환
 */
export function translateErrorMessage(error: FeedbackError): string {
  const errorMessages: Record<string, string> = {
    'Network Error': '네트워크 연결을 확인해주세요.',
    'Invalid token': '로그인이 만료되었습니다. 다시 로그인해주세요.',
    'Permission denied': '권한이 없습니다.',
    'File too large': '파일 크기가 너무 큽니다.',
    'Invalid file type': '지원하지 않는 파일 형식입니다.',
    'Project not found': '프로젝트를 찾을 수 없습니다.',
    'Feedback not found': '피드백을 찾을 수 없습니다.',
  };
  
  return errorMessages[error.message] || error.message || '알 수 없는 오류가 발생했습니다.';
}

/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export all functions as default object
export default {
  getFeedbackProject,
  createFeedback,
  deleteFeedback,
  uploadFeedbackVideo,
  deleteFeedbackVideo,
  getAllFeedbacks,
  getUserFeedbacks,
  createWebSocketUrl,
  createWebSocketConnection,
  isFeedback,
  isFeedbackProject,
  isApiResponse,
  isValidVideoFile,
  isValidFileSize,
  isValidTimestamp,
  timestampToSeconds,
  secondsToTimestamp,
  getUserPermissions,
  translateErrorMessage,
  formatFileSize,
};

// Legacy exports for backward compatibility (기존 코드와의 호환성)
export {
  getFeedbackProject as GetFeedBack,
  createFeedback as CreateFeedback,
  deleteFeedback as DeleteFeedback,
  uploadFeedbackVideo as FeedbackFile,
  deleteFeedbackVideo as DeleteFeedbackFile,
};