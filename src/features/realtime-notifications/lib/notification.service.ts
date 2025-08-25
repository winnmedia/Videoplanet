/**
 * 알림 서비스
 * WebSocket과 REST API를 통한 알림 관리
 */

import { WebSocketClient, WebSocketMessage } from '@/shared/lib/realtime/websocket-client';
import { useNotificationStore } from '../model/notification.store';
import { Notification, NotificationCategory, NotificationPriority } from '../model/notification.types';

// 알림 서비스 싱글톤
class NotificationService {
  private wsClient: WebSocketClient | null = null;
  private apiUrl: string;
  private token: string | null = null;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // 초기화
  public async initialize(token?: string): Promise<void> {
    this.token = token || null;
    
    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // WebSocket 연결
    this.connectWebSocket();

    // 초기 알림 로드
    await this.loadNotifications();
  }

  // WebSocket 연결
  private connectWebSocket(): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    
    this.wsClient = new WebSocketClient({
      url: `${wsUrl}/ws/notifications/`,
      token: this.token || undefined,
      reconnect: true,
      heartbeat: true,
      debug: process.env.NODE_ENV === 'development',
    });

    // 이벤트 핸들러 설정
    this.wsClient.on('message', this.handleWebSocketMessage.bind(this));
    this.wsClient.on('connected', this.handleWebSocketConnected.bind(this));
    this.wsClient.on('disconnected', this.handleWebSocketDisconnected.bind(this));
    this.wsClient.on('error', this.handleWebSocketError.bind(this));

    // 연결 시작
    this.wsClient.connect();
  }

  // WebSocket 메시지 처리
  private handleWebSocketMessage(message: WebSocketMessage): void {
    const store = useNotificationStore.getState();

    switch (message.type) {
      case 'notification.new':
        this.handleNewNotification(message.payload);
        break;
      
      case 'notification.update':
        store.updateNotification(message.payload.id, message.payload);
        break;
      
      case 'notification.delete':
        store.removeNotification(message.payload.id);
        break;
      
      case 'notification.batch':
        store.addNotifications(message.payload.notifications);
        break;
      
      case 'notification.read':
        store.markAsRead(message.payload.id);
        break;
      
      case 'notification.read_all':
        store.markAllAsRead(message.payload.filter);
        break;
      
      default:
        console.log('Unknown notification message type:', message.type);
    }
  }

  // 새 알림 처리
  private handleNewNotification(payload: any): void {
    const notification: Notification = {
      id: payload.id || this.generateId(),
      title: payload.title,
      message: payload.message,
      category: payload.category || NotificationCategory.SYSTEM,
      priority: payload.priority || NotificationPriority.MEDIUM,
      timestamp: new Date(payload.timestamp || Date.now()),
      read: false,
      sender: payload.sender,
      actions: payload.actions,
      metadata: payload.metadata,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      groupId: payload.groupId,
      sound: payload.sound !== false,
      vibrate: payload.vibrate !== false,
    };

    useNotificationStore.getState().addNotification(notification);
  }

  // WebSocket 연결 성공
  private handleWebSocketConnected(): void {
    console.log('Notification WebSocket connected');
    
    // 연결 후 동기화
    this.syncNotifications();
  }

  // WebSocket 연결 해제
  private handleWebSocketDisconnected(): void {
    console.log('Notification WebSocket disconnected');
  }

  // WebSocket 에러
  private handleWebSocketError(error: any): void {
    console.error('Notification WebSocket error:', error);
    useNotificationStore.setState({ error: 'WebSocket connection error' });
  }

  // REST API로 알림 로드
  public async loadNotifications(): Promise<void> {
    const store = useNotificationStore.getState();
    store.setState({ isLoading: true, error: null });

    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load notifications: ${response.status}`);
      }

      const data = await response.json();
      const notifications = this.parseNotifications(data.results || data);
      
      store.addNotifications(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      store.setState({ error: error.message });
    } finally {
      store.setState({ isLoading: false });
    }
  }

  // 알림 동기화
  public async syncNotifications(): Promise<void> {
    if (!this.wsClient) return;

    const lastSync = localStorage.getItem('notification_last_sync');
    
    this.wsClient.send({
      type: 'sync.request',
      payload: {
        since: lastSync || undefined,
      },
    });

    localStorage.setItem('notification_last_sync', new Date().toISOString());
  }

  // 알림 읽음 처리
  public async markAsRead(notificationId: string): Promise<void> {
    const store = useNotificationStore.getState();
    
    // 낙관적 업데이트
    store.markAsRead(notificationId);

    try {
      // WebSocket 전송
      if (this.wsClient) {
        this.wsClient.send({
          type: 'notification.read',
          payload: { id: notificationId },
        });
      }

      // REST API 호출
      const response = await fetch(`${this.apiUrl}/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // 롤백
      store.updateNotification(notificationId, { read: false });
    }
  }

  // 모든 알림 읽음 처리
  public async markAllAsRead(): Promise<void> {
    const store = useNotificationStore.getState();
    
    // 낙관적 업데이트
    store.markAllAsRead();

    try {
      // WebSocket 전송
      if (this.wsClient) {
        this.wsClient.send({
          type: 'notification.read_all',
        });
      }

      // REST API 호출
      const response = await fetch(`${this.apiUrl}/api/notifications/mark-all-read/`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // 롤백은 복잡하므로 재로드
      await this.loadNotifications();
    }
  }

  // 알림 삭제
  public async deleteNotification(notificationId: string): Promise<void> {
    const store = useNotificationStore.getState();
    const notification = store.getNotificationById(notificationId);
    
    // 낙관적 업데이트
    store.removeNotification(notificationId);

    try {
      // WebSocket 전송
      if (this.wsClient) {
        this.wsClient.send({
          type: 'notification.delete',
          payload: { id: notificationId },
        });
      }

      // REST API 호출
      const response = await fetch(`${this.apiUrl}/api/notifications/${notificationId}/`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // 롤백
      if (notification) {
        store.addNotification(notification);
      }
    }
  }

  // 테스트 알림 생성
  public createTestNotification(type: 'feedback' | 'comment' | 'mention' | 'system' = 'system'): void {
    const testNotifications = {
      feedback: {
        title: '새로운 피드백',
        message: '프로젝트 "웹사이트 리뉴얼"에 새로운 피드백이 추가되었습니다.',
        category: NotificationCategory.FEEDBACK,
        priority: NotificationPriority.HIGH,
        metadata: {
          projectId: 'test-project-1',
          feedbackId: 'test-feedback-1',
        },
      },
      comment: {
        title: '새로운 댓글',
        message: '회원님의 피드백에 댓글이 달렸습니다.',
        category: NotificationCategory.COMMENT,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          commentId: 'test-comment-1',
          feedbackId: 'test-feedback-1',
        },
      },
      mention: {
        title: '멘션 알림',
        message: '@김철수님이 회원님을 멘션했습니다.',
        category: NotificationCategory.MENTION,
        priority: NotificationPriority.HIGH,
        sender: {
          id: 'user-1',
          name: '김철수',
        },
      },
      system: {
        title: '시스템 알림',
        message: '서비스 점검이 예정되어 있습니다.',
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.LOW,
      },
    };

    const notification: Notification = {
      id: this.generateId(),
      ...testNotifications[type],
      timestamp: new Date(),
      read: false,
      sound: true,
      vibrate: true,
    };

    useNotificationStore.getState().addNotification(notification);
  }

  // 알림 파싱
  private parseNotifications(data: any[]): Notification[] {
    return data.map(item => ({
      id: item.id || this.generateId(),
      title: item.title,
      message: item.message || item.text || item.content,
      category: item.category || item.type || NotificationCategory.SYSTEM,
      priority: item.priority || NotificationPriority.MEDIUM,
      timestamp: new Date(item.created_at || item.timestamp || Date.now()),
      read: item.read || item.is_read || false,
      sender: item.sender,
      actions: item.actions,
      metadata: item.metadata || item.extra_data,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      groupId: item.group_id,
    }));
  }

  // 헤더 생성
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // ID 생성
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 정리
  public destroy(): void {
    if (this.wsClient) {
      this.wsClient.destroy();
      this.wsClient = null;
    }
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();