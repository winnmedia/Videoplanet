/**
 * 협업 커서 서비스
 * 실시간 커서 위치 및 선택 영역 동기화
 */

import { WebSocketClient } from '@/shared/lib/realtime/websocket-client';
import { 
  UserCursor, 
  CursorPosition, 
  TextSelection, 
  CursorEventType,
  CursorEvent,
  CollaborationSession 
} from '../model/cursor.types';

// 커서 색상 팔레트
const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#52B788', '#FF6B9D', '#C9E4CA', '#55CBCD',
];

// 협업 커서 서비스
export class CursorService {
  private wsClient: WebSocketClient | null = null;
  private sessionId: string | null = null;
  private userId: string;
  private userName: string;
  private userColor: string;
  private userAvatar?: string;
  private users = new Map<string, UserCursor>();
  private listeners = new Map<string, Set<Function>>();
  private mouseThrottle: NodeJS.Timeout | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private idleTimeout: NodeJS.Timeout | null = null;

  constructor(userId: string, userName: string, userAvatar?: string) {
    this.userId = userId;
    this.userName = userName;
    this.userAvatar = userAvatar;
    this.userColor = this.generateUserColor(userId);
  }

  // 세션 시작
  public async startSession(sessionId: string, wsUrl?: string): Promise<void> {
    this.sessionId = sessionId;
    
    const url = wsUrl || `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/collaboration/${sessionId}/`;
    
    this.wsClient = new WebSocketClient({
      url,
      reconnect: true,
      heartbeat: true,
      debug: process.env.NODE_ENV === 'development',
    });

    // 이벤트 핸들러 설정
    this.wsClient.on('message', this.handleMessage.bind(this));
    this.wsClient.on('connected', this.handleConnected.bind(this));
    this.wsClient.on('disconnected', this.handleDisconnected.bind(this));

    // 연결 시작
    this.wsClient.connect();

    // 마우스 이벤트 리스너
    this.setupEventListeners();
  }

  // 세션 종료
  public stopSession(): void {
    this.removeEventListeners();
    
    if (this.wsClient) {
      // 떠나기 이벤트 전송
      this.sendEvent(CursorEventType.USER_LEAVE);
      this.wsClient.destroy();
      this.wsClient = null;
    }

    this.users.clear();
    this.sessionId = null;
    this.clearTimeouts();
  }

  // 이벤트 리스너 설정
  private setupEventListeners(): void {
    // 마우스 이동
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('touchmove', this.handleTouchMove);
    
    // 클릭
    document.addEventListener('click', this.handleClick);
    document.addEventListener('touchstart', this.handleTouchStart);
    
    // 텍스트 선택
    document.addEventListener('selectionchange', this.handleSelectionChange);
    
    // 키보드 입력
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // 포커스
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('blur', this.handleBlur, true);
  }

  // 이벤트 리스너 제거
  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
  }

  // 마우스 이동 처리
  private handleMouseMove = (event: MouseEvent): void => {
    // 쓰로틀링 (50ms)
    if (this.mouseThrottle) return;
    
    this.mouseThrottle = setTimeout(() => {
      this.mouseThrottle = null;
    }, 50);

    const position: CursorPosition = {
      x: event.clientX,
      y: event.clientY,
      elementId: (event.target as HTMLElement)?.id,
      timestamp: Date.now(),
    };

    this.sendEvent(CursorEventType.MOVE, { position });
    this.resetIdleTimer();
  };

  // 터치 이동 처리
  private handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const position: CursorPosition = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      this.sendEvent(CursorEventType.MOVE, { position });
      this.resetIdleTimer();
    }
  };

  // 클릭 처리
  private handleClick = (event: MouseEvent): void => {
    const position: CursorPosition = {
      x: event.clientX,
      y: event.clientY,
      elementId: (event.target as HTMLElement)?.id,
      timestamp: Date.now(),
    };

    this.sendEvent(CursorEventType.CLICK, { position });
    this.resetIdleTimer();
  };

  // 터치 시작 처리
  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const position: CursorPosition = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      this.sendEvent(CursorEventType.CLICK, { position });
      this.resetIdleTimer();
    }
  };

  // 텍스트 선택 처리
  private handleSelectionChange = (): void => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement;

    if (!element) return;

    const textSelection: TextSelection = {
      start: range.startOffset,
      end: range.endOffset,
      elementId: element.id || '',
      text: selection.toString(),
    };

    this.sendEvent(CursorEventType.SELECT, { selection: textSelection });
    this.resetIdleTimer();
  };

  // 키 입력 시작
  private handleKeyDown = (): void => {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (!this.users.get(this.userId)?.isTyping) {
      this.sendEvent(CursorEventType.TYPING_START);
    }

    this.resetIdleTimer();
  };

  // 키 입력 종료
  private handleKeyUp = (): void => {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendEvent(CursorEventType.TYPING_STOP);
    }, 1000);
  };

  // 포커스 획득
  private handleFocus = (): void => {
    this.sendEvent(CursorEventType.USER_ACTIVE);
    this.resetIdleTimer();
  };

  // 포커스 잃음
  private handleBlur = (): void => {
    this.startIdleTimer();
  };

  // WebSocket 연결 성공
  private handleConnected(): void {
    // 참여 이벤트 전송
    this.sendEvent(CursorEventType.USER_JOIN, {
      userName: this.userName,
      userColor: this.userColor,
      userAvatar: this.userAvatar,
    });

    this.emit('connected');
  }

  // WebSocket 연결 해제
  private handleDisconnected(): void {
    this.emit('disconnected');
  }

  // WebSocket 메시지 처리
  private handleMessage(message: any): void {
    const event: CursorEvent = message;
    
    // 자신의 이벤트는 무시
    if (event.userId === this.userId) return;

    switch (event.type) {
      case CursorEventType.USER_JOIN:
        this.handleUserJoin(event);
        break;
      
      case CursorEventType.USER_LEAVE:
        this.handleUserLeave(event);
        break;
      
      case CursorEventType.MOVE:
        this.updateUserCursor(event.userId, { position: event.data.position });
        break;
      
      case CursorEventType.CLICK:
        this.updateUserCursor(event.userId, { position: event.data.position });
        this.emit('user:click', { userId: event.userId, position: event.data.position });
        break;
      
      case CursorEventType.SELECT:
        this.updateUserCursor(event.userId, { selection: event.data.selection });
        break;
      
      case CursorEventType.TYPING_START:
        this.updateUserCursor(event.userId, { isTyping: true });
        break;
      
      case CursorEventType.TYPING_STOP:
        this.updateUserCursor(event.userId, { isTyping: false });
        break;
      
      case CursorEventType.USER_IDLE:
        this.updateUserCursor(event.userId, { isActive: false });
        break;
      
      case CursorEventType.USER_ACTIVE:
        this.updateUserCursor(event.userId, { isActive: true });
        break;
    }
  }

  // 사용자 참여 처리
  private handleUserJoin(event: CursorEvent): void {
    const user: UserCursor = {
      userId: event.userId,
      userName: event.data.userName,
      userColor: event.data.userColor,
      userAvatar: event.data.userAvatar,
      position: { x: 0, y: 0, timestamp: Date.now() },
      isActive: true,
      isTyping: false,
      lastActivity: new Date(),
    };

    this.users.set(event.userId, user);
    this.emit('user:join', user);
  }

  // 사용자 떠나기 처리
  private handleUserLeave(event: CursorEvent): void {
    const user = this.users.get(event.userId);
    if (user) {
      this.users.delete(event.userId);
      this.emit('user:leave', user);
    }
  }

  // 사용자 커서 업데이트
  private updateUserCursor(userId: string, updates: Partial<UserCursor>): void {
    let user = this.users.get(userId);
    
    if (!user) {
      // 새 사용자 생성
      user = {
        userId,
        userName: 'Unknown User',
        userColor: this.generateUserColor(userId),
        position: { x: 0, y: 0, timestamp: Date.now() },
        isActive: true,
        isTyping: false,
        lastActivity: new Date(),
        ...updates,
      };
      this.users.set(userId, user);
    } else {
      // 기존 사용자 업데이트
      Object.assign(user, updates, { lastActivity: new Date() });
    }

    this.emit('cursor:update', user);
  }

  // 이벤트 전송
  private sendEvent(type: CursorEventType, data?: any): void {
    if (!this.wsClient) return;

    const event: CursorEvent = {
      type,
      userId: this.userId,
      data,
      timestamp: Date.now(),
    };

    this.wsClient.send({ type: 'cursor.event', payload: event });
  }

  // 유휴 타이머 시작
  private startIdleTimer(): void {
    this.clearTimeouts();
    
    this.idleTimeout = setTimeout(() => {
      this.sendEvent(CursorEventType.USER_IDLE);
    }, 30000); // 30초
  }

  // 유휴 타이머 리셋
  private resetIdleTimer(): void {
    this.clearTimeouts();
    this.sendEvent(CursorEventType.USER_ACTIVE);
    this.startIdleTimer();
  }

  // 타이머 정리
  private clearTimeouts(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  // 사용자 색상 생성
  private generateUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
  }

  // 이벤트 발생
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  // 이벤트 리스너 등록
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  // 이벤트 리스너 제거
  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // 현재 사용자 목록
  public getUsers(): UserCursor[] {
    return Array.from(this.users.values());
  }

  // 특정 사용자 정보
  public getUser(userId: string): UserCursor | undefined {
    return this.users.get(userId);
  }
}