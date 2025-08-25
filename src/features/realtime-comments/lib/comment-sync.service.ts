/**
 * 실시간 코멘트 동기화 서비스
 * WebSocket을 통한 코멘트 실시간 업데이트
 */

import { WebSocketClient } from '@/shared/lib/realtime/websocket-client';
import { EventEmitter } from 'events';

// 코멘트 타입
export interface Comment {
  id: string;
  feedbackId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
  videoTimestamp?: number;
  parentId?: string;
  reactions?: CommentReaction[];
  mentions?: string[];
  edited?: boolean;
  editedAt?: number;
  deleted?: boolean;
}

// 코멘트 반응
export interface CommentReaction {
  type: 'like' | 'dislike' | 'question';
  userId: string;
  userName: string;
  timestamp: number;
}

// 코멘트 이벤트 타입
export enum CommentEventType {
  NEW = 'comment.new',
  UPDATE = 'comment.update',
  DELETE = 'comment.delete',
  REACTION_ADD = 'comment.reaction.add',
  REACTION_REMOVE = 'comment.reaction.remove',
  TYPING_START = 'comment.typing.start',
  TYPING_STOP = 'comment.typing.stop',
}

// 타이핑 사용자
export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

// 코멘트 동기화 서비스
export class CommentSyncService extends EventEmitter {
  private wsClient: WebSocketClient | null = null;
  private feedbackId: string | null = null;
  private comments = new Map<string, Comment>();
  private typingUsers = new Map<string, TypingUser>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  private userId: string;
  private userName: string;

  constructor(userId: string, userName: string) {
    super();
    this.userId = userId;
    this.userName = userName;
  }

  // 피드백 세션 시작
  public async startSession(feedbackId: string): Promise<void> {
    this.feedbackId = feedbackId;
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/feedback/${feedbackId}/`;
    
    this.wsClient = new WebSocketClient({
      url: wsUrl,
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

    // 초기 코멘트 로드
    await this.loadComments();
  }

  // 세션 종료
  public stopSession(): void {
    if (this.wsClient) {
      this.wsClient.destroy();
      this.wsClient = null;
    }

    this.comments.clear();
    this.typingUsers.clear();
    this.clearTypingTimeouts();
    this.feedbackId = null;
  }

  // 코멘트 로드
  private async loadComments(): Promise<void> {
    if (!this.feedbackId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/feedbacks/${this.feedbackId}/comments/`
      );

      if (!response.ok) {
        throw new Error('Failed to load comments');
      }

      const data = await response.json();
      const comments = Array.isArray(data) ? data : data.results || [];
      
      comments.forEach((comment: any) => {
        const parsed = this.parseComment(comment);
        this.comments.set(parsed.id, parsed);
      });

      this.emit('comments:loaded', this.getComments());
    } catch (error) {
      console.error('Failed to load comments:', error);
      this.emit('error', error);
    }
  }

  // WebSocket 연결 성공
  private handleConnected(): void {
    console.log('Comment sync connected');
    this.emit('connected');
    
    // 동기화 요청
    this.sendMessage({
      type: 'sync.request',
      payload: {
        lastSync: this.getLastSyncTime(),
      },
    });
  }

  // WebSocket 연결 해제
  private handleDisconnected(): void {
    console.log('Comment sync disconnected');
    this.emit('disconnected');
  }

  // WebSocket 메시지 처리
  private handleMessage(message: any): void {
    switch (message.type) {
      case CommentEventType.NEW:
        this.handleNewComment(message.payload);
        break;
      
      case CommentEventType.UPDATE:
        this.handleUpdateComment(message.payload);
        break;
      
      case CommentEventType.DELETE:
        this.handleDeleteComment(message.payload);
        break;
      
      case CommentEventType.REACTION_ADD:
        this.handleAddReaction(message.payload);
        break;
      
      case CommentEventType.REACTION_REMOVE:
        this.handleRemoveReaction(message.payload);
        break;
      
      case CommentEventType.TYPING_START:
        this.handleTypingStart(message.payload);
        break;
      
      case CommentEventType.TYPING_STOP:
        this.handleTypingStop(message.payload);
        break;
      
      case 'sync.response':
        this.handleSyncResponse(message.payload);
        break;
    }
  }

  // 새 코멘트 처리
  private handleNewComment(payload: any): void {
    const comment = this.parseComment(payload);
    this.comments.set(comment.id, comment);
    this.emit('comment:new', comment);
  }

  // 코멘트 업데이트 처리
  private handleUpdateComment(payload: any): void {
    const comment = this.comments.get(payload.id);
    if (comment) {
      Object.assign(comment, payload, {
        edited: true,
        editedAt: Date.now(),
      });
      this.emit('comment:update', comment);
    }
  }

  // 코멘트 삭제 처리
  private handleDeleteComment(payload: any): void {
    const comment = this.comments.get(payload.id);
    if (comment) {
      comment.deleted = true;
      this.emit('comment:delete', comment);
      
      // 실제 삭제는 일정 시간 후
      setTimeout(() => {
        this.comments.delete(payload.id);
      }, 5000);
    }
  }

  // 반응 추가 처리
  private handleAddReaction(payload: any): void {
    const comment = this.comments.get(payload.commentId);
    if (comment) {
      if (!comment.reactions) {
        comment.reactions = [];
      }
      
      // 중복 체크
      const existing = comment.reactions.find(
        r => r.userId === payload.userId && r.type === payload.type
      );
      
      if (!existing) {
        comment.reactions.push({
          type: payload.type,
          userId: payload.userId,
          userName: payload.userName,
          timestamp: Date.now(),
        });
        
        this.emit('reaction:add', { comment, reaction: payload });
      }
    }
  }

  // 반응 제거 처리
  private handleRemoveReaction(payload: any): void {
    const comment = this.comments.get(payload.commentId);
    if (comment && comment.reactions) {
      comment.reactions = comment.reactions.filter(
        r => !(r.userId === payload.userId && r.type === payload.type)
      );
      
      this.emit('reaction:remove', { comment, reaction: payload });
    }
  }

  // 타이핑 시작 처리
  private handleTypingStart(payload: any): void {
    // 자신의 타이핑은 무시
    if (payload.userId === this.userId) return;

    const typingUser: TypingUser = {
      userId: payload.userId,
      userName: payload.userName,
      timestamp: Date.now(),
    };

    this.typingUsers.set(payload.userId, typingUser);
    
    // 타이핑 타임아웃 설정 (3초)
    this.setTypingTimeout(payload.userId);
    
    this.emit('typing:start', typingUser);
    this.emit('typing:users', this.getTypingUsers());
  }

  // 타이핑 중지 처리
  private handleTypingStop(payload: any): void {
    if (this.typingUsers.has(payload.userId)) {
      const user = this.typingUsers.get(payload.userId);
      this.typingUsers.delete(payload.userId);
      this.clearTypingTimeout(payload.userId);
      
      this.emit('typing:stop', user);
      this.emit('typing:users', this.getTypingUsers());
    }
  }

  // 동기화 응답 처리
  private handleSyncResponse(payload: any): void {
    if (payload.comments) {
      payload.comments.forEach((comment: any) => {
        const parsed = this.parseComment(comment);
        this.comments.set(parsed.id, parsed);
      });
      
      this.emit('comments:synced', this.getComments());
    }
  }

  // 새 코멘트 전송
  public async sendComment(content: string, options?: {
    parentId?: string;
    videoTimestamp?: number;
    mentions?: string[];
  }): Promise<void> {
    const comment: Partial<Comment> = {
      id: this.generateId(),
      feedbackId: this.feedbackId!,
      userId: this.userId,
      userName: this.userName,
      content,
      timestamp: Date.now(),
      ...options,
    };

    // 낙관적 업데이트
    this.comments.set(comment.id!, comment as Comment);
    this.emit('comment:new', comment);

    // WebSocket 전송
    this.sendMessage({
      type: CommentEventType.NEW,
      payload: comment,
    });

    // REST API 백업
    try {
      await this.postComment(comment);
    } catch (error) {
      // 실패 시 롤백
      this.comments.delete(comment.id!);
      this.emit('comment:error', { comment, error });
    }
  }

  // 코멘트 수정
  public async updateComment(commentId: string, content: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment || comment.userId !== this.userId) return;

    const originalContent = comment.content;
    
    // 낙관적 업데이트
    comment.content = content;
    comment.edited = true;
    comment.editedAt = Date.now();
    this.emit('comment:update', comment);

    // WebSocket 전송
    this.sendMessage({
      type: CommentEventType.UPDATE,
      payload: {
        id: commentId,
        content,
      },
    });

    // REST API 백업
    try {
      await this.patchComment(commentId, { content });
    } catch (error) {
      // 실패 시 롤백
      comment.content = originalContent;
      delete comment.edited;
      delete comment.editedAt;
      this.emit('comment:error', { comment, error });
    }
  }

  // 코멘트 삭제
  public async deleteComment(commentId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment || comment.userId !== this.userId) return;

    // 낙관적 업데이트
    comment.deleted = true;
    this.emit('comment:delete', comment);

    // WebSocket 전송
    this.sendMessage({
      type: CommentEventType.DELETE,
      payload: { id: commentId },
    });

    // REST API 백업
    try {
      await this.deleteCommentAPI(commentId);
      
      // 성공 시 완전 삭제
      setTimeout(() => {
        this.comments.delete(commentId);
      }, 5000);
    } catch (error) {
      // 실패 시 롤백
      comment.deleted = false;
      this.emit('comment:error', { comment, error });
    }
  }

  // 반응 토글
  public async toggleReaction(commentId: string, type: 'like' | 'dislike' | 'question'): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    const hasReaction = comment.reactions?.some(
      r => r.userId === this.userId && r.type === type
    );

    if (hasReaction) {
      // 반응 제거
      this.sendMessage({
        type: CommentEventType.REACTION_REMOVE,
        payload: {
          commentId,
          userId: this.userId,
          type,
        },
      });
    } else {
      // 반응 추가
      this.sendMessage({
        type: CommentEventType.REACTION_ADD,
        payload: {
          commentId,
          userId: this.userId,
          userName: this.userName,
          type,
        },
      });
    }
  }

  // 타이핑 시작
  public startTyping(): void {
    this.sendMessage({
      type: CommentEventType.TYPING_START,
      payload: {
        userId: this.userId,
        userName: this.userName,
      },
    });
  }

  // 타이핑 중지
  public stopTyping(): void {
    this.sendMessage({
      type: CommentEventType.TYPING_STOP,
      payload: {
        userId: this.userId,
      },
    });
  }

  // 코멘트 목록 가져오기
  public getComments(): Comment[] {
    return Array.from(this.comments.values())
      .filter(c => !c.deleted)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // 타이핑 중인 사용자 목록
  public getTypingUsers(): TypingUser[] {
    return Array.from(this.typingUsers.values());
  }

  // WebSocket 메시지 전송
  private sendMessage(message: any): void {
    if (this.wsClient) {
      this.wsClient.send(message);
    }
  }

  // REST API: 코멘트 생성
  private async postComment(comment: Partial<Comment>): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/feedbacks/${this.feedbackId}/comments/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }
  }

  // REST API: 코멘트 수정
  private async patchComment(commentId: string, updates: any): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update comment');
    }
  }

  // REST API: 코멘트 삭제
  private async deleteCommentAPI(commentId: string): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}/`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
  }

  // 코멘트 파싱
  private parseComment(data: any): Comment {
    return {
      id: data.id || this.generateId(),
      feedbackId: data.feedback_id || data.feedbackId || this.feedbackId!,
      userId: data.user_id || data.userId,
      userName: data.user_name || data.userName || 'Unknown',
      userAvatar: data.user_avatar || data.userAvatar,
      content: data.content || data.text || '',
      timestamp: data.timestamp || Date.parse(data.created_at) || Date.now(),
      videoTimestamp: data.video_timestamp || data.videoTimestamp,
      parentId: data.parent_id || data.parentId,
      reactions: data.reactions || [],
      mentions: data.mentions || [],
      edited: data.edited || false,
      editedAt: data.edited_at || data.editedAt,
      deleted: data.deleted || false,
    };
  }

  // 타이핑 타임아웃 설정
  private setTypingTimeout(userId: string): void {
    this.clearTypingTimeout(userId);
    
    const timeout = setTimeout(() => {
      this.handleTypingStop({ userId });
    }, 3000);
    
    this.typingTimeouts.set(userId, timeout);
  }

  // 타이핑 타임아웃 제거
  private clearTypingTimeout(userId: string): void {
    const timeout = this.typingTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(userId);
    }
  }

  // 모든 타이핑 타임아웃 제거
  private clearTypingTimeouts(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  // 마지막 동기화 시간
  private getLastSyncTime(): string | null {
    const comments = Array.from(this.comments.values());
    if (comments.length === 0) return null;
    
    const latest = Math.max(...comments.map(c => c.timestamp));
    return new Date(latest).toISOString();
  }

  // ID 생성
  private generateId(): string {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}