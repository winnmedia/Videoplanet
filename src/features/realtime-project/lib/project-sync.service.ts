/**
 * 프로젝트 상태 실시간 동기화 서비스
 * WebSocket을 통한 프로젝트 상태 동기화
 */

import { WebSocketClient } from '@/shared/lib/realtime/websocket-client';
import { EventEmitter } from 'events';

// 프로젝트 상태
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

// 프로젝트 인터페이스
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  startDate: Date;
  endDate: Date;
  members: ProjectMember[];
  milestones: Milestone[];
  updatedAt: Date;
}

// 프로젝트 멤버
export interface ProjectMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  isOnline?: boolean;
}

// 마일스톤
export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  progress: number;
}

// 프로젝트 이벤트 타입
export enum ProjectEventType {
  STATUS_CHANGE = 'project.status.change',
  PROGRESS_UPDATE = 'project.progress.update',
  MEMBER_JOIN = 'project.member.join',
  MEMBER_LEAVE = 'project.member.leave',
  MEMBER_ONLINE = 'project.member.online',
  MEMBER_OFFLINE = 'project.member.offline',
  MILESTONE_UPDATE = 'project.milestone.update',
  DEADLINE_CHANGE = 'project.deadline.change',
}

// 프로젝트 동기화 서비스
export class ProjectSyncService extends EventEmitter {
  private wsClient: WebSocketClient | null = null;
  private projectId: string | null = null;
  private project: Project | null = null;
  private onlineMembers = new Set<string>();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  // 프로젝트 세션 시작
  public async startSession(projectId: string): Promise<void> {
    this.projectId = projectId;
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/project/${projectId}/`;
    
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

    // 초기 프로젝트 데이터 로드
    await this.loadProject();

    // 주기적 동기화 (30초)
    this.syncInterval = setInterval(() => {
      this.syncProject();
    }, 30000);
  }

  // 세션 종료
  public stopSession(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.wsClient) {
      this.wsClient.destroy();
      this.wsClient = null;
    }

    this.project = null;
    this.projectId = null;
    this.onlineMembers.clear();
  }

  // 프로젝트 데이터 로드
  private async loadProject(): Promise<void> {
    if (!this.projectId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${this.projectId}/`
      );

      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const data = await response.json();
      this.project = this.parseProject(data);
      
      this.emit('project:loaded', this.project);
    } catch (error) {
      console.error('Failed to load project:', error);
      this.emit('error', error);
    }
  }

  // WebSocket 연결 성공
  private handleConnected(): void {
    console.log('Project sync connected');
    this.emit('connected');
    
    // 멤버 온라인 상태 알림
    this.sendMessage({
      type: ProjectEventType.MEMBER_ONLINE,
      payload: {
        userId: this.getCurrentUserId(),
      },
    });
  }

  // WebSocket 연결 해제
  private handleDisconnected(): void {
    console.log('Project sync disconnected');
    this.emit('disconnected');
    
    // 멤버 오프라인 상태 알림
    this.sendMessage({
      type: ProjectEventType.MEMBER_OFFLINE,
      payload: {
        userId: this.getCurrentUserId(),
      },
    });
  }

  // WebSocket 메시지 처리
  private handleMessage(message: any): void {
    switch (message.type) {
      case ProjectEventType.STATUS_CHANGE:
        this.handleStatusChange(message.payload);
        break;
      
      case ProjectEventType.PROGRESS_UPDATE:
        this.handleProgressUpdate(message.payload);
        break;
      
      case ProjectEventType.MEMBER_JOIN:
        this.handleMemberJoin(message.payload);
        break;
      
      case ProjectEventType.MEMBER_LEAVE:
        this.handleMemberLeave(message.payload);
        break;
      
      case ProjectEventType.MEMBER_ONLINE:
        this.handleMemberOnline(message.payload);
        break;
      
      case ProjectEventType.MEMBER_OFFLINE:
        this.handleMemberOffline(message.payload);
        break;
      
      case ProjectEventType.MILESTONE_UPDATE:
        this.handleMilestoneUpdate(message.payload);
        break;
      
      case ProjectEventType.DEADLINE_CHANGE:
        this.handleDeadlineChange(message.payload);
        break;
      
      case 'sync.response':
        this.handleSyncResponse(message.payload);
        break;
    }
  }

  // 상태 변경 처리
  private handleStatusChange(payload: any): void {
    if (this.project) {
      this.project.status = payload.status;
      this.project.updatedAt = new Date();
      this.emit('status:change', this.project);
    }
  }

  // 진행률 업데이트 처리
  private handleProgressUpdate(payload: any): void {
    if (this.project) {
      this.project.progress = payload.progress;
      this.project.updatedAt = new Date();
      this.emit('progress:update', this.project);
    }
  }

  // 멤버 참여 처리
  private handleMemberJoin(payload: any): void {
    if (this.project) {
      const member: ProjectMember = {
        userId: payload.userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar,
        role: payload.role || 'viewer',
        joinedAt: new Date(),
        isOnline: true,
      };
      
      this.project.members.push(member);
      this.onlineMembers.add(payload.userId);
      this.emit('member:join', member);
    }
  }

  // 멤버 나가기 처리
  private handleMemberLeave(payload: any): void {
    if (this.project) {
      const index = this.project.members.findIndex(m => m.userId === payload.userId);
      if (index !== -1) {
        const member = this.project.members[index];
        this.project.members.splice(index, 1);
        this.onlineMembers.delete(payload.userId);
        this.emit('member:leave', member);
      }
    }
  }

  // 멤버 온라인 처리
  private handleMemberOnline(payload: any): void {
    if (this.project) {
      const member = this.project.members.find(m => m.userId === payload.userId);
      if (member) {
        member.isOnline = true;
        this.onlineMembers.add(payload.userId);
        this.emit('member:online', member);
      }
    }
  }

  // 멤버 오프라인 처리
  private handleMemberOffline(payload: any): void {
    if (this.project) {
      const member = this.project.members.find(m => m.userId === payload.userId);
      if (member) {
        member.isOnline = false;
        this.onlineMembers.delete(payload.userId);
        this.emit('member:offline', member);
      }
    }
  }

  // 마일스톤 업데이트 처리
  private handleMilestoneUpdate(payload: any): void {
    if (this.project) {
      const milestone = this.project.milestones.find(m => m.id === payload.id);
      if (milestone) {
        Object.assign(milestone, payload);
        this.emit('milestone:update', milestone);
      } else {
        // 새 마일스톤
        const newMilestone: Milestone = {
          id: payload.id,
          name: payload.name,
          description: payload.description,
          dueDate: new Date(payload.dueDate),
          completed: payload.completed || false,
          progress: payload.progress || 0,
        };
        this.project.milestones.push(newMilestone);
        this.emit('milestone:new', newMilestone);
      }
    }
  }

  // 마감일 변경 처리
  private handleDeadlineChange(payload: any): void {
    if (this.project) {
      if (payload.startDate) {
        this.project.startDate = new Date(payload.startDate);
      }
      if (payload.endDate) {
        this.project.endDate = new Date(payload.endDate);
      }
      this.project.updatedAt = new Date();
      this.emit('deadline:change', this.project);
    }
  }

  // 동기화 응답 처리
  private handleSyncResponse(payload: any): void {
    if (payload.project) {
      this.project = this.parseProject(payload.project);
      this.emit('project:synced', this.project);
    }
  }

  // 프로젝트 상태 변경
  public async updateStatus(status: ProjectStatus): Promise<void> {
    if (!this.project) return;

    const originalStatus = this.project.status;
    
    // 낙관적 업데이트
    this.project.status = status;
    this.project.updatedAt = new Date();
    this.emit('status:change', this.project);

    // WebSocket 전송
    this.sendMessage({
      type: ProjectEventType.STATUS_CHANGE,
      payload: { status },
    });

    // REST API 백업
    try {
      await this.patchProject({ status });
    } catch (error) {
      // 실패 시 롤백
      this.project.status = originalStatus;
      this.emit('error', error);
    }
  }

  // 프로젝트 진행률 업데이트
  public async updateProgress(progress: number): Promise<void> {
    if (!this.project) return;

    const originalProgress = this.project.progress;
    
    // 낙관적 업데이트
    this.project.progress = Math.min(100, Math.max(0, progress));
    this.project.updatedAt = new Date();
    this.emit('progress:update', this.project);

    // WebSocket 전송
    this.sendMessage({
      type: ProjectEventType.PROGRESS_UPDATE,
      payload: { progress: this.project.progress },
    });

    // REST API 백업
    try {
      await this.patchProject({ progress: this.project.progress });
    } catch (error) {
      // 실패 시 롤백
      this.project.progress = originalProgress;
      this.emit('error', error);
    }
  }

  // 마일스톤 업데이트
  public async updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<void> {
    if (!this.project) return;

    const milestone = this.project.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const original = { ...milestone };
    
    // 낙관적 업데이트
    Object.assign(milestone, updates);
    this.emit('milestone:update', milestone);

    // WebSocket 전송
    this.sendMessage({
      type: ProjectEventType.MILESTONE_UPDATE,
      payload: { id: milestoneId, ...updates },
    });

    // REST API 백업
    try {
      await this.patchMilestone(milestoneId, updates);
    } catch (error) {
      // 실패 시 롤백
      Object.assign(milestone, original);
      this.emit('error', error);
    }
  }

  // 프로젝트 동기화
  private syncProject(): void {
    if (this.wsClient) {
      this.sendMessage({
        type: 'sync.request',
        payload: {
          projectId: this.projectId,
          timestamp: this.project?.updatedAt,
        },
      });
    }
  }

  // WebSocket 메시지 전송
  private sendMessage(message: any): void {
    if (this.wsClient) {
      this.wsClient.send(message);
    }
  }

  // REST API: 프로젝트 수정
  private async patchProject(updates: any): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${this.projectId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update project');
    }
  }

  // REST API: 마일스톤 수정
  private async patchMilestone(milestoneId: string, updates: any): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/milestones/${milestoneId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update milestone');
    }
  }

  // 프로젝트 파싱
  private parseProject(data: any): Project {
    return {
      id: data.id,
      name: data.name || data.title,
      description: data.description,
      status: data.status || ProjectStatus.PLANNING,
      progress: data.progress || 0,
      startDate: new Date(data.start_date || data.startDate),
      endDate: new Date(data.end_date || data.endDate),
      members: (data.members || []).map(this.parseMember),
      milestones: (data.milestones || []).map(this.parseMilestone),
      updatedAt: new Date(data.updated_at || data.updatedAt || Date.now()),
    };
  }

  // 멤버 파싱
  private parseMember(data: any): ProjectMember {
    return {
      userId: data.user_id || data.userId,
      userName: data.user_name || data.userName || 'Unknown',
      userAvatar: data.user_avatar || data.userAvatar,
      role: data.role || 'viewer',
      joinedAt: new Date(data.joined_at || data.joinedAt || Date.now()),
      isOnline: data.is_online || data.isOnline || false,
    };
  }

  // 마일스톤 파싱
  private parseMilestone(data: any): Milestone {
    return {
      id: data.id,
      name: data.name || data.title,
      description: data.description,
      dueDate: new Date(data.due_date || data.dueDate),
      completed: data.completed || false,
      progress: data.progress || 0,
    };
  }

  // 현재 사용자 ID (임시)
  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || 'anonymous';
  }

  // 현재 프로젝트 가져오기
  public getProject(): Project | null {
    return this.project;
  }

  // 온라인 멤버 목록
  public getOnlineMembers(): ProjectMember[] {
    if (!this.project) return [];
    return this.project.members.filter(m => m.isOnline);
  }
}