/**
 * WebSocket 클라이언트 - 실시간 통신 관리
 * 자동 재연결, 하트비트, 메시지 큐잉 지원
 */

import { EventEmitter } from 'events';

// WebSocket 연결 상태
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  RECONNECTING = 'RECONNECTING',
}

// WebSocket 메시지 타입
export interface WebSocketMessage {
  type: string;
  payload?: any;
  timestamp?: number;
  id?: string;
}

// WebSocket 클라이언트 옵션
export interface WebSocketClientOptions {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectDecay?: number;
  reconnectAttempts?: number;
  timeout?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  debug?: boolean;
  token?: string;
}

// 기본 옵션
const DEFAULT_OPTIONS: Partial<WebSocketClientOptions> = {
  reconnect: true,
  reconnectInterval: 1000,
  reconnectDecay: 1.5,
  reconnectAttempts: 5,
  timeout: 30000,
  heartbeat: true,
  heartbeatInterval: 30000,
  messageQueueSize: 100,
  debug: false,
};

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private state: ConnectionState = ConnectionState.CLOSED;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempt = 0;
  private forcedClose = false;
  private connectionId: string | null = null;

  constructor(options: WebSocketClientOptions) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // 연결 시작
  public connect(): void {
    if (this.state === ConnectionState.OPEN || this.state === ConnectionState.CONNECTING) {
      this.log('Already connected or connecting');
      return;
    }

    this.forcedClose = false;
    this.state = ConnectionState.CONNECTING;
    this.emit('connecting');

    try {
      // URL에 토큰 추가 (필요한 경우)
      let url = this.options.url;
      if (this.options.token) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}token=${this.options.token}`;
      }

      this.ws = new WebSocket(url, this.options.protocols);
      this.setupEventHandlers();
      this.startConnectionTimeout();
    } catch (error) {
      this.handleError(error);
      this.scheduleReconnect();
    }
  }

  // 연결 종료
  public disconnect(): void {
    this.forcedClose = true;
    this.clearTimers();
    
    if (this.ws) {
      this.state = ConnectionState.CLOSING;
      this.ws.close(1000, 'Client disconnect');
    }
  }

  // 메시지 전송
  public send(message: WebSocketMessage): boolean {
    if (!message.id) {
      message.id = this.generateMessageId();
    }
    
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    if (this.state === ConnectionState.OPEN && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.emit('message:sent', message);
        return true;
      } catch (error) {
        this.handleError(error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  // 연결 상태 확인
  public getState(): ConnectionState {
    return this.state;
  }

  // 연결 ID 가져오기
  public getConnectionId(): string | null {
    return this.connectionId;
  }

  // 이벤트 핸들러 설정
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  // 연결 성공 처리
  private handleOpen(event: Event): void {
    this.log('WebSocket connected');
    this.state = ConnectionState.OPEN;
    this.reconnectAttempt = 0;
    this.connectionId = this.generateConnectionId();
    
    this.clearTimers();
    this.startHeartbeat();
    this.flushMessageQueue();
    
    this.emit('open', event);
    this.emit('connected', { connectionId: this.connectionId });
  }

  // 메시지 수신 처리
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // 하트비트 응답 처리
      if (message.type === 'pong') {
        this.emit('heartbeat:pong');
        return;
      }
      
      this.emit('message', message);
      this.emit(`message:${message.type}`, message.payload);
    } catch (error) {
      this.log('Failed to parse message:', error);
      this.emit('message:error', { error, rawData: event.data });
    }
  }

  // 에러 처리
  private handleError(error: any): void {
    this.log('WebSocket error:', error);
    this.emit('error', error);
  }

  // 연결 종료 처리
  private handleClose(event: CloseEvent): void {
    this.log('WebSocket closed:', event.code, event.reason);
    this.state = ConnectionState.CLOSED;
    this.connectionId = null;
    
    this.clearTimers();
    this.emit('close', event);
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    if (!this.forcedClose && this.options.reconnect) {
      this.scheduleReconnect();
    }
  }

  // 재연결 스케줄링
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= (this.options.reconnectAttempts || 5)) {
      this.log('Max reconnect attempts reached');
      this.emit('reconnect:failed');
      return;
    }
    
    this.state = ConnectionState.RECONNECTING;
    this.reconnectAttempt++;
    
    const delay = Math.min(
      (this.options.reconnectInterval || 1000) * Math.pow(this.options.reconnectDecay || 1.5, this.reconnectAttempt - 1),
      30000
    );
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempt, delay });
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 하트비트 시작
  private startHeartbeat(): void {
    if (!this.options.heartbeat) return;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ConnectionState.OPEN) {
        this.send({ type: 'ping' });
        this.emit('heartbeat:ping');
      }
    }, this.options.heartbeatInterval);
  }

  // 연결 타임아웃 설정
  private startConnectionTimeout(): void {
    setTimeout(() => {
      if (this.state === ConnectionState.CONNECTING) {
        this.log('Connection timeout');
        this.ws?.close();
        this.handleClose(new CloseEvent('timeout'));
      }
    }, this.options.timeout);
  }

  // 메시지 큐에 추가
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= (this.options.messageQueueSize || 100)) {
      this.messageQueue.shift(); // 오래된 메시지 제거
    }
    
    this.messageQueue.push(message);
    this.emit('message:queued', message);
  }

  // 메시지 큐 전송
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // 타이머 정리
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 메시지 ID 생성
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 연결 ID 생성
  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 디버그 로그
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }

  // 정리
  public destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    this.messageQueue = [];
  }
}

// React Hook
export function useWebSocket(url: string, options?: Partial<WebSocketClientOptions>) {
  const [client, setClient] = React.useState<WebSocketClient | null>(null);
  const [state, setState] = React.useState<ConnectionState>(ConnectionState.CLOSED);
  const [lastMessage, setLastMessage] = React.useState<WebSocketMessage | null>(null);

  React.useEffect(() => {
    const wsClient = new WebSocketClient({ url, ...options });
    
    wsClient.on('open', () => setState(ConnectionState.OPEN));
    wsClient.on('close', () => setState(ConnectionState.CLOSED));
    wsClient.on('connecting', () => setState(ConnectionState.CONNECTING));
    wsClient.on('reconnecting', () => setState(ConnectionState.RECONNECTING));
    wsClient.on('message', (msg) => setLastMessage(msg));
    
    wsClient.connect();
    setClient(wsClient);
    
    return () => {
      wsClient.destroy();
    };
  }, [url]);

  const sendMessage = React.useCallback((message: WebSocketMessage) => {
    return client?.send(message) || false;
  }, [client]);

  return {
    client,
    state,
    lastMessage,
    sendMessage,
    isConnected: state === ConnectionState.OPEN,
    isConnecting: state === ConnectionState.CONNECTING || state === ConnectionState.RECONNECTING,
  };
}

// 싱글톤 인스턴스 관리
const clientInstances = new Map<string, WebSocketClient>();

export function getWebSocketClient(key: string, options: WebSocketClientOptions): WebSocketClient {
  if (!clientInstances.has(key)) {
    clientInstances.set(key, new WebSocketClient(options));
  }
  return clientInstances.get(key)!;
}

export function destroyWebSocketClient(key: string): void {
  const client = clientInstances.get(key);
  if (client) {
    client.destroy();
    clientInstances.delete(key);
  }
}

// 전역 클라이언트 정리
export function destroyAllWebSocketClients(): void {
  clientInstances.forEach(client => client.destroy());
  clientInstances.clear();
}

// TypeScript를 위한 React import (필요시 주석 해제)
import * as React from 'react';