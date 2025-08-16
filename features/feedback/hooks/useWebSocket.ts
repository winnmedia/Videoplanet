// =============================================================================
// useWebSocket Hook - VideoPlanet 실시간 채팅 WebSocket 훅
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  WebSocketMessage,
  UseWebSocketReturn,
  FEEDBACK_CONSTANTS,
} from '../types';
import { createWebSocketUrl } from '../api/feedbackApi';

const { SESSION_STORAGE_KEY, SOCKET_RECONNECT_INTERVAL, MAX_RECONNECT_ATTEMPTS } = FEEDBACK_CONSTANTS;

interface UseWebSocketOptions {
  projectId: string;
  autoReconnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: ChatMessage) => void;
}

/**
 * WebSocket 실시간 채팅 훅
 * 연결 관리, 메시지 송수신, 자동 재연결, 세션 저장을 담당
 */
export function useWebSocket({
  projectId,
  autoReconnect = true,
  onConnect,
  onDisconnect,
  onError,
  onMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  // 상태 관리
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reconnecting, setReconnecting] = useState<boolean>(false);

  // 세션 저장소에서 메시지 로드
  const loadMessagesFromSession = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.id === projectId && Array.isArray(session.items)) {
          setMessages(session.items);
        }
      }
    } catch (error) {
      console.warn('Failed to load messages from session storage:', error);
    }
  }, [projectId]);

  // 세션 저장소에 메시지 저장
  const saveMessagesToSession = useCallback((msgs: ChatMessage[]) => {
    try {
      if (msgs.length > 0) {
        const session = {
          id: projectId,
          items: msgs,
          lastUpdated: new Date().toISOString(),
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn('Failed to save messages to session storage:', error);
    }
  }, [projectId]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setConnected(false);
    setReconnecting(false);
  }, []);

  // 재연결 로직
  const attemptReconnect = useCallback(() => {
    if (!mountedRef.current || !autoReconnect) return;

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      setReconnecting(false);
      return;
    }

    setReconnecting(true);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        reconnectAttemptsRef.current += 1;
        console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        connect();
      }
    }, SOCKET_RECONNECT_INTERVAL);
  }, [autoReconnect]);

  // WebSocket 연결
  const connect = useCallback(() => {
    if (!projectId || ws.current?.readyState === WebSocket.OPEN) return;

    disconnect(); // 기존 연결 정리

    try {
      const url = createWebSocketUrl(projectId);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connected to:', url);
        setConnected(true);
        setReconnecting(false);
        reconnectAttemptsRef.current = 0;
        
        // 세션에서 메시지 로드
        loadMessagesFromSession();
        
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          const message = data.result;

          if (message) {
            setMessages(prev => {
              const newMessages = [...prev, message];
              saveMessagesToSession(newMessages);
              return newMessages;
            });

            onMessage?.(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        if (!mountedRef.current) return;

        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        
        onDisconnect?.();

        // 비정상 종료인 경우 재연결 시도
        if (event.code !== 1000 && autoReconnect && mountedRef.current) {
          attemptReconnect();
        }
      };

      ws.current.onerror = (error) => {
        if (!mountedRef.current) return;

        console.error('WebSocket error:', error);
        setConnected(false);
        
        onError?.(error);

        if (autoReconnect && mountedRef.current) {
          attemptReconnect();
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (autoReconnect && mountedRef.current) {
        attemptReconnect();
      }
    }
  }, [projectId, disconnect, loadMessagesFromSession, saveMessagesToSession, onConnect, onDisconnect, onError, onMessage, autoReconnect, attemptReconnect]);

  // 메시지 전송
  const sendMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert('채팅 서버가 불안정합니다. 재접속 해주세요.');
      return;
    }

    // 메시지 유효성 검사
    if (!message.message || !message.message.trim()) {
      return;
    }

    if (message.message.length > FEEDBACK_CONSTANTS.MAX_MESSAGE_LENGTH) {
      alert(`메시지는 ${FEEDBACK_CONSTANTS.MAX_MESSAGE_LENGTH}자를 초과할 수 없습니다.`);
      return;
    }

    try {
      const payload = {
        email: message.email,
        nickname: message.nickname,
        rating: message.rating,
        message: message.message.trim(),
      };

      ws.current.send(JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  }, []);

  // 메시지 초기화 (새 프로젝트로 이동 시)
  const clearMessages = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }, []);

  // 연결 상태 확인
  const getConnectionStatus = useCallback(() => {
    if (!ws.current) return 'disconnected';
    
    switch (ws.current.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }, []);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    mountedRef.current = true;
    
    if (projectId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [projectId, connect, disconnect]);

  // 프로젝트 변경 시 메시지 초기화
  useEffect(() => {
    clearMessages();
  }, [projectId, clearMessages]);

  // 메시지 변경 시 세션 저장
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToSession(messages);
    }
  }, [messages, saveMessagesToSession]);

  return {
    // 상태
    connected,
    messages,
    reconnecting,
    
    // 액션
    sendMessage,
    connect,
    disconnect,
    clearMessages,
    
    // WebSocket 인스턴스 (필요한 경우)
    ws,
    
    // 유틸리티
    connectionStatus: getConnectionStatus(),
  };
}

export default useWebSocket;