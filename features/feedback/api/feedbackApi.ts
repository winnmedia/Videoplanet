// =============================================================================
// Feedback API - VideoPlanet 피드백 시스템 API 로직
// =============================================================================

import { AxiosResponse, AxiosRequestConfig } from 'axios';
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
import { SOCKET_URL } from '@/lib/config';
import { apiClient, fileApiClient } from '@/lib/api/client';
import { errorHandler, ErrorType } from '@/lib/error-handling/errorHandler';

// apiClient 사용 (통합 API 클라이언트)
// 독립적인 axios 인스턴스 대신 lib/api/client.ts의 apiClient 사용

// 인증 로직은 apiClient에서 통합 관리됨
// 별도 인증 처리 불필요

// 하위 호환성을 위한 레거시 함수들
export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function clearAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VGID');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    
    document.cookie = 'VGID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  }
}

// 에러 생성 유틸리티 - 통합 에러 핸들러 사용
export function createFeedbackError(error: any): FeedbackError {
  // 상태 코드에 따른 에러 타입 결정
  let errorType = ErrorType.UNKNOWN_ERROR;
  
  if (error.response?.status === 401) {
    errorType = ErrorType.AUTH_EXPIRED;
  } else if (error.response?.status === 403) {
    errorType = ErrorType.PERMISSION_DENIED;
  } else if (error.response?.status === 404) {
    errorType = ErrorType.PROJECT_NOT_FOUND;
  } else if (error.response?.status >= 500) {
    errorType = ErrorType.NETWORK_SERVER_ERROR;
  } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    errorType = ErrorType.NETWORK_TIMEOUT;
  }
  
  // 통합 에러 핸들러로 에러 생성
  const appError = errorHandler.createError(errorType, {
    customMessage: error.response?.data?.message || error.message,
    context: {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    }
  });
  
  // FeedbackError 형식으로 변환 (기존 호환성 유지)
  const feedbackError = new Error(appError.message) as FeedbackError;
  feedbackError.code = errorType;
  feedbackError.status = error.response?.status;
  feedbackError.details = error.response?.data;
  
  return feedbackError;
}

// 인증 상태 확인 헬퍼 함수 - apiClient의 getAuthToken 로직과 동일
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const vgidData = localStorage.getItem('VGID');
  if (!vgidData) return false;
  
  try {
    const parsed = JSON.parse(vgidData);
    return !!(parsed.access || parsed.token || parsed.access_token);
  } catch {
    return !!vgidData;
  }
}

// API 함수들

/**
 * 피드백 프로젝트 상세 정보 조회
 */
export async function getFeedbackProject(projectId: string): Promise<FeedbackProject> {
  // 인증 체크는 apiClient에서 자동 처리
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
}

/**
 * 피드백 생성
 */
export async function createFeedback(
  data: FeedbackInputData,
  projectId: string
): Promise<Feedback> {
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
}

/**
 * 피드백 삭제
 */
export async function deleteFeedback(feedbackId: number): Promise<void> {
  try {
    await apiClient.delete(`/feedbacks/${feedbackId}`);
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
    
    // 파일 업로드는 fileApiClient 사용 (대용량 파일 대응)
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

/**
 * 피드백 비디오 파일 삭제
 */
export async function deleteFeedbackVideo(projectId: string): Promise<void> {
  try {
    await apiClient.delete(`/feedbacks/file/${projectId}`);
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

interface WebSocketCallbacks {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * WebSocket Manager 클래스 - 중복 연결 방지 및 재연결 로직
 */
export class WebSocketManager {
  private static instances: Map<string, WebSocketManager> = new Map();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1초
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;
  
  constructor(
    private projectId: string,
    private callbacks: WebSocketCallbacks = {}
  ) {}
  
  /**
   * 싱글턴 인스턴스 생성/반환 - 중복 연결 방지
   */
  public static getInstance(
    projectId: string,
    callbacks?: WebSocketCallbacks
  ): WebSocketManager {
    if (!WebSocketManager.instances.has(projectId)) {
      WebSocketManager.instances.set(projectId, new WebSocketManager(projectId, callbacks));
    }
    
    const instance = WebSocketManager.instances.get(projectId)!;
    
    // 콜백 업데이트
    if (callbacks) {
      instance.updateCallbacks(callbacks);
    }
    
    return instance;
  }
  
  /**
   * 콜백 업데이트
   */
  public updateCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  /**
   * WebSocket 연결
   */
  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected for project ${this.projectId}`);
      return;
    }
    
    this.isManualClose = false;
    const url = `${SOCKET_URL}/ws/chat/${this.projectId}/`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log(`WebSocket connected to project ${this.projectId}`);
        this.reconnectAttempts = 0;
        this.callbacks.onOpen?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket disconnected for project ${this.projectId}:`, event.code, event.reason);
        this.callbacks.onClose?.();
        
        // 수동 종료가 아니면 재연결 시도
        if (!this.isManualClose && this.shouldReconnect(event.code)) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (event) => {
        console.error(`WebSocket error for project ${this.projectId}:`, event);
        this.callbacks.onError?.(event);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * WebSocket 연결 종료
   */
  public disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    // 인스턴스 정리
    WebSocketManager.instances.delete(this.projectId);
  }
  
  /**
   * 메시지 전송
   */
  public send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    
    console.warn('WebSocket is not connected');
    return false;
  }
  
  /**
   * 연결 상태 확인
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * 재연결 스케줄링
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached for project ${this.projectId}`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 지수 백오프
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.callbacks.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, delay);
  }
  
  /**
   * 재연결 여부 결정
   */
  private shouldReconnect(code: number): boolean {
    // 1000: Normal closure, 1001: Going away - 재연결 불필요
    // 1006: Abnormal closure - 재연결 필요
    return code !== 1000 && code !== 1001;
  }
  
  /**
   * 모든 인스턴스 정리 (전역 정리용)
   */
  public static disconnectAll(): void {
    WebSocketManager.instances.forEach(instance => {
      instance.disconnect();
    });
    WebSocketManager.instances.clear();
  }
}

/**
 * WebSocket URL 생성 (하위 호환성)
 */
export function createWebSocketUrl(projectId: string): string {
  return `${SOCKET_URL}/ws/chat/${projectId}/`;
}

/**
 * WebSocket 연결 생성 (하위 호환성 - 레거시 지원)
 */
export function createWebSocketConnection(
  projectId: string,
  onMessage?: (data: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  const callbacks: WebSocketCallbacks = {};
  if (onMessage) callbacks.onMessage = onMessage;
  if (onOpen) callbacks.onOpen = onOpen;
  if (onClose) callbacks.onClose = onClose;
  if (onError) callbacks.onError = onError;
  
  const manager = WebSocketManager.getInstance(projectId, callbacks);
  manager.connect();
  
  // 레거시 지원을 위해 가짜 WebSocket 객체 반환
  return {
    close: () => manager.disconnect(),
    send: (data: string) => manager.send(JSON.parse(data)),
    readyState: manager.isConnected() ? WebSocket.OPEN : WebSocket.CLOSED,
    // 추가 WebSocket 속성들 (필수)
    binaryType: 'blob' as BinaryType,
    bufferedAmount: 0,
    extensions: '',
    onclose: null,
    onerror: null,
    onmessage: null,
    onopen: null,
    protocol: '',
    url: createWebSocketUrl(projectId),
    CLOSED: WebSocket.CLOSED,
    CLOSING: WebSocket.CLOSING,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  } as WebSocket;
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
    'NEED_ACCESS_TOKEN': '로그인이 만료되었습니다. 다시 로그인해주세요.',
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

// feedbackApi 레거시 지원 (apiClient로 대체됨)
export const feedbackApi = apiClient;

// Export all functions as default object
export default {
  isAuthenticated,
  getFeedbackProject,
  createFeedback,
  deleteFeedback,
  uploadFeedbackVideo,
  deleteFeedbackVideo,
  getAllFeedbacks,
  getUserFeedbacks,
  createWebSocketUrl,
  createWebSocketConnection,
  WebSocketManager,
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