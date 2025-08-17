import { apiClient } from '@/lib/api/client'
import { SOCKET_URL } from '@/lib/config'
import { ChatMessage, WebSocketMessage } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Manage feedback API configuration error:', error)
}

export const manageFeedbackApi = {
  /**
   * 피드백 삭제
   */
  deleteFeedback: async (feedbackId: number): Promise<void> => {
    try {
      await apiClient.delete(`/feedbacks/${feedbackId}`);
    } catch (error) {
      throw createFeedbackError(error);
    }
  },

  /**
   * 피드백 비디오 파일 삭제
   */
  deleteFeedbackVideo: async (projectId: string): Promise<void> => {
    try {
      await apiClient.delete(`/feedbacks/file/${projectId}`);
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
export const handleManageFeedbackError = (error: any) => {
  if (error?.response?.status === 401) {
    return '로그인이 필요합니다.'
  }
  
  if (error?.response?.status === 403) {
    return '피드백을 관리할 권한이 없습니다.'
  }
  
  if (error?.response?.status === 404) {
    return '피드백을 찾을 수 없습니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '피드백 관리 중 오류가 발생했습니다.'
  
  return message
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
 * WebSocket URL 생성
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

// 유틸리티 함수들
export const managementUtils = {
  /**
   * 에러 메시지 한국어 변환
   */
  translateErrorMessage: (error: any): string => {
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
  },

  /**
   * 파일 크기 포맷팅
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}