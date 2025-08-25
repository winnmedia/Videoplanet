/**
 * Native WebSocket Service for Dashboard
 * Handles real-time communication with Django Channels
 * Enhanced with automatic reconnection, exponential backoff, and connection quality monitoring
 */

import { useEffect, useState, useCallback, useRef } from 'react';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface ConnectionQuality {
  latency: number;
  packetsLost: number;
  connectionTime: number;
  lastPingTime: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5; // 재연결 시도 횟수 증가
  private reconnectDelay = 1000; // 초기 재연결 지연 시간 감소
  private maxReconnectDelay = 30000; // 최대 재연결 지연
  private connectionStartTime = 0;
  private connectionQuality: ConnectionQuality = {
    latency: 0,
    packetsLost: 0,
    connectionTime: 0,
    lastPingTime: 0,
  };
  private pingInterval = 30000; // 30초마다 핑

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Skip WebSocket connection if backend is not available
      if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true') {
        console.log('WebSocket disabled via environment variable');
        resolve();
        return;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        setTimeout(() => this.connect(token).then(resolve).catch(reject), 100);
        return;
      }

      this.isConnecting = true;
      
      const wsUrl = token 
        ? `${WS_BASE_URL}/ws/dashboard/?token=${token}`
        : `${WS_BASE_URL}/ws/dashboard/`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionStartTime = Date.now();
          this.emit('connected', { connected: true });
          
          // 큐에 있던 메시지 전송
          this.flushMessageQueue();
          
          // 핑 시작
          this.startPing();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          // 첫 번째 연결 시도에서만 경고 표시
          if (this.reconnectAttempts === 0) {
            console.warn('WebSocket 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.');
          }
          this.isConnecting = false;
          this.emit('error', { error });
        };

        this.ws.onclose = (event) => {
          if (this.reconnectAttempts === 0) {
            console.log('WebSocket 연결이 종료되었습니다.', event.code, event.reason);
          }
          this.isConnecting = false;
          this.ws = null;
          this.stopPing();
          this.emit('connected', { connected: false });
          
          // 정상 종료가 아닌 경우만 재연결
          if (event.code !== 1000) {
            this.scheduleReconnect(token);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect(token?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.info('WebSocket 재연결을 중단합니다. 백엔드 서버 없이 계속 실행됩니다.');
      this.emit('reconnect:failed', { attempts: this.reconnectAttempts });
      return;
    }

    // 지수 백오프 알고리즘
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`WebSocket 재연결 시도 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) - ${delay}ms 후`);
        this.emit('reconnect:attempt', { attempt: this.reconnectAttempts, delay });
        this.connect(token);
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    
    // Map Django Channels message types to frontend events
    const eventMap: { [key: string]: string } = {
      'feedback.new': 'feedback:new',
      'feedback.reply': 'feedback:reply',
      'feedback.mention': 'feedback:mention',
      'project.invitation': 'project:invitation',
      'project.deadline': 'project:deadline',
      'project.status_change': 'project:status',
      'stats.update': 'stats:update',
    };
    
    const event = eventMap[type] || type;
    this.emit(event, data);
  }

  send(type: string, data: any, priority = false) {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        // 실패한 메시지를 큐에 추가
        this.queueMessage(message, priority);
      }
    } else {
      // 연결되지 않은 경우 메시지를 큐에 추가
      this.queueMessage(message, priority);
      
      // 자동 재연결 시도
      if (!this.isConnecting && !this.ws) {
        const token = localStorage.getItem('auth_token');
        this.connect(token || undefined).catch(console.error);
      }
    }
  }

  private queueMessage(message: WebSocketMessage, priority = false) {
    if (priority) {
      this.messageQueue.unshift(message);
    } else {
      this.messageQueue.push(message);
    }
    
    // 큐 크기 제한 (최대 100개)
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(0, 100);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to flush queued message:', error);
          // 실패한 메시지를 다시 큐에 추가
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  private startPing() {
    this.stopPing();
    
    this.pingTimeout = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingStart = Date.now();
        this.send('ping', { timestamp: pingStart });
        
        // 퐁 응답을 기다림
        const pongHandler = (data: any) => {
          const latency = Date.now() - pingStart;
          this.connectionQuality.latency = latency;
          this.connectionQuality.lastPingTime = Date.now();
          this.emit('connection:quality', this.connectionQuality);
        };
        
        this.once('pong', pongHandler);
        
        // 5초 내에 응답이 없으면 연결 문제로 간주
        setTimeout(() => {
          this.off('pong', pongHandler);
          if (Date.now() - this.connectionQuality.lastPingTime > 5000) {
            console.warn('Ping timeout - connection may be unstable');
            this.connectionQuality.packetsLost++;
          }
        }, 5000);
      }
    }, this.pingInterval);
  }

  private stopPing() {
    if (this.pingTimeout) {
      clearInterval(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  private once(event: string, callback: Function) {
    const onceWrapper = (data: any) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionQuality(): ConnectionQuality {
    return {
      ...this.connectionQuality,
      connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
    };
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// React Hook for WebSocket
export function useWebSocket(event?: string, handler?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const handlerRef = useRef(handler);

  // Update handler ref on each render
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Connection status listener
    const handleConnection = ({ connected }: { connected: boolean }) => {
      setIsConnected(connected);
    };

    webSocketService.on('connected', handleConnection);

    // Connect if not already connected
    const token = localStorage.getItem('auth_token');
    webSocketService.connect(token || undefined).catch(console.error);

    // Event listener
    if (event && handlerRef.current) {
      const eventHandler = (data: any) => {
        handlerRef.current?.(data);
      };
      webSocketService.on(event, eventHandler);

      return () => {
        webSocketService.off(event, eventHandler);
        webSocketService.off('connected', handleConnection);
      };
    }

    return () => {
      webSocketService.off('connected', handleConnection);
    };
  }, [event]);

  const send = useCallback((type: string, data: any) => {
    webSocketService.send(type, data);
  }, []);

  return { isConnected, send };
}

// Notification specific hooks
export function useFeedbackNotifications(onNewNotification?: (data: any) => void) {
  return useWebSocket('feedback:new', onNewNotification);
}

export function useProjectNotifications(onNewNotification?: (data: any) => void) {
  return useWebSocket('project:invitation', onNewNotification);
}

export default webSocketService;