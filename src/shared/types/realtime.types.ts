/**
 * VideoPlanet 실시간 데이터 파이프라인 타입 정의
 * 
 * 피드백, 초대, 프로젝트 일정 데이터의 실시간 처리를 위한 스키마
 * FSD 아키텍처와 기존 엔티티 타입과 완벽 호환 설계
 */

import { z } from 'zod'
import type { 
  EnhancedFeedback, 
  FeedbackEvent, 
  FeedbackType, 
  FeedbackStatus 
} from '@/entities/feedback/model/enhanced-feedback.types'
import type { 
  Invitation, 
  InvitationEvent, 
  InvitationStatus 
} from '@/entities/invitation/model/types'
import type { 
  VideoPlan, 
  PlanEvent, 
  PlanStatus 
} from '@/entities/planning/model/types'

// ===========================================
// 1. 기본 실시간 이벤트 시스템
// ===========================================

export type RealTimeEventType = 
  // 피드백 이벤트
  | 'feedback:created'
  | 'feedback:updated' 
  | 'feedback:deleted'
  | 'feedback:reply:added'
  | 'feedback:reaction:added'
  | 'feedback:reaction:removed'
  | 'feedback:status:changed'
  | 'feedback:assignment:changed'
  
  // 초대 관리 이벤트  
  | 'invitation:sent'
  | 'invitation:resent'
  | 'invitation:viewed'
  | 'invitation:accepted'
  | 'invitation:declined'
  | 'invitation:expired'
  | 'invitation:revoked'
  | 'invitation:reminder:sent'
  
  // 프로젝트 일정 이벤트
  | 'project:status:changed'
  | 'project:milestone:completed'
  | 'project:timeline:updated'
  | 'project:deadline:approaching'
  | 'project:team:updated'
  | 'project:progress:updated'
  
  // 시스템 이벤트
  | 'system:connection:established'
  | 'system:connection:lost'
  | 'system:sync:required'
  | 'system:maintenance:scheduled'

export interface BaseRealTimeEvent {
  id: string
  type: RealTimeEventType
  timestamp: string
  userId: number
  projectId?: number
  videoId?: string
  sessionId: string
  version: string // API 버전
  metadata?: Record<string, any>
}

// ===========================================
// 2. 피드백 실시간 이벤트
// ===========================================

export interface FeedbackCreatedEvent extends BaseRealTimeEvent {
  type: 'feedback:created'
  data: {
    feedback: EnhancedFeedback
    notifyUsers: number[]
    autoAssigned?: number[]
    aiSuggestions?: {
      category: string
      severity: string
      assignees: number[]
    }
  }
}

export interface FeedbackUpdatedEvent extends BaseRealTimeEvent {
  type: 'feedback:updated'
  data: {
    feedbackId: string
    changes: {
      field: keyof EnhancedFeedback
      oldValue: any
      newValue: any
    }[]
    updatedFeedback: Partial<EnhancedFeedback>
    changeReason?: string
    notifyUsers: number[]
  }
}

export interface FeedbackReplyEvent extends BaseRealTimeEvent {
  type: 'feedback:reply:added'
  data: {
    feedbackId: string
    reply: {
      id: string
      content: string
      authorId: number
      authorName: string
      parentId?: string // for nested replies
      timestamp: string
      mentions: number[]
      attachments?: string[]
    }
    notifyUsers: number[]
  }
}

export interface FeedbackReactionEvent extends BaseRealTimeEvent {
  type: 'feedback:reaction:added' | 'feedback:reaction:removed'
  data: {
    feedbackId: string
    replyId?: string // for reply reactions
    reaction: {
      type: '👍' | '👎' | '❤️' | '😊' | '🤔' | '⚡' | '🎯' | '🚀'
      userId: number
      timestamp: string
    }
    totalReactions: Record<string, number>
  }
}

// ===========================================
// 3. 초대 관리 실시간 이벤트
// ===========================================

export interface InvitationSentEvent extends BaseRealTimeEvent {
  type: 'invitation:sent'
  data: {
    invitation: Invitation
    emailTemplate: {
      subject: string
      preview: string
    }
    deliveryInfo: {
      provider: string
      messageId: string
      estimatedDelivery: string
    }
    notifyUsers: number[] // project managers, admins
  }
}

export interface InvitationStatusEvent extends BaseRealTimeEvent {
  type: 'invitation:viewed' | 'invitation:accepted' | 'invitation:declined'
  data: {
    invitationId: string
    oldStatus: InvitationStatus
    newStatus: InvitationStatus
    inviteeInfo?: {
      name?: string
      timezone?: string
      deviceInfo?: string
    }
    accessGranted?: {
      permissions: string[]
      expiresAt?: string
    }
    notifyUsers: number[]
  }
}

export interface InvitationBatchEvent extends BaseRealTimeEvent {
  type: 'invitation:batch:completed'
  data: {
    batchId: string
    summary: {
      total: number
      sent: number
      failed: number
      errors: { email: string; reason: string }[]
    }
    successfulInvitations: string[]
    notifyUsers: number[]
  }
}

// ===========================================
// 4. 프로젝트 일정 실시간 이벤트
// ===========================================

export interface ProjectGanttStage {
  id: string
  name: string
  type: 'PLAN' | 'SHOOT' | 'EDIT'
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'on_hold'
  progress: number // 0-100
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  assignees: number[]
  dependencies: string[] // other stage IDs
  milestones: {
    id: string
    name: string
    dueDate: string
    completed: boolean
    completedAt?: string
  }[]
  resources: {
    equipment?: string[]
    locations?: string[]
    budget?: number
  }
  blockers?: {
    id: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    reportedBy: number
    reportedAt: string
  }[]
}

export interface ProjectProgressEvent extends BaseRealTimeEvent {
  type: 'project:progress:updated'
  data: {
    projectId: number
    stage: ProjectGanttStage
    progressChange: {
      oldProgress: number
      newProgress: number
      trigger: 'manual' | 'automatic' | 'milestone' | 'task_completion'
    }
    overallProgress: number
    impactedStages: string[] // dependent stages affected
    notifications: {
      milestoneCompleted?: string
      deadlineApproaching?: {
        stage: string
        daysRemaining: number
      }
      budgetAlert?: {
        stage: string
        usedPercentage: number
      }
    }
    notifyUsers: number[]
  }
}

export interface ProjectTimelineEvent extends BaseRealTimeEvent {
  type: 'project:timeline:updated'
  data: {
    projectId: number
    changes: {
      stageId: string
      field: 'plannedStart' | 'plannedEnd' | 'status' | 'assignees'
      oldValue: any
      newValue: any
      reason: string
    }[]
    cascadeEffects: {
      affectedStages: string[]
      timelineShift: number // days shifted
      budgetImpact?: number
    }
    approval?: {
      required: boolean
      approvers: number[]
      deadline?: string
    }
    notifyUsers: number[]
  }
}

// ===========================================
// 5. 대시보드 집계 데이터
// ===========================================

export interface DashboardSnapshot {
  timestamp: string
  projectId: number
  data: {
    // 피드백 현황
    feedback: {
      total: number
      new: number // 24시간 내
      resolved: number // 24시간 내
      pending: number
      byType: Record<FeedbackType, number>
      byStatus: Record<FeedbackStatus, number>
      avgResolutionTime: number // hours
      mostActiveVideo: {
        videoId: string
        feedbackCount: number
      }
    }
    
    // 초대 현황
    invitations: {
      total: number
      sent: number // 24시간 내
      accepted: number // 24시간 내
      pending: number
      acceptanceRate: number // 7일 평균
      activeCollaborators: number
      byRole: Record<string, number>
    }
    
    // 프로젝트 일정 현황
    timeline: {
      totalProjects: number
      onTrack: number
      delayed: number
      completed: number // 24시간 내
      upcomingDeadlines: {
        projectId: number
        stage: string
        daysRemaining: number
      }[]
      resourceUtilization: {
        team: number // 0-100%
        equipment: number // 0-100%
        budget: number // 0-100%
      }
      criticalPath: {
        stages: string[]
        totalDuration: number
        riskLevel: 'low' | 'medium' | 'high'
      }[]
    }
    
    // 시스템 상태
    system: {
      onlineUsers: number
      activeConnections: number
      lastSyncAt: string
      pendingSyncs: number
      errorCount: number // 1시간 내
      performanceScore: number // 0-100
    }
  }
}

// ===========================================
// 6. WebSocket 메시지 스키마
// ===========================================

export type WebSocketMessageType = 
  | 'auth'
  | 'subscribe'
  | 'unsubscribe'
  | 'event'
  | 'heartbeat'
  | 'error'
  | 'ack'

export interface WebSocketMessage<T = any> {
  id: string
  type: WebSocketMessageType
  timestamp: string
  data: T
  requiresAck?: boolean
  replyTo?: string // for responses
}

export interface WebSocketAuthMessage extends WebSocketMessage {
  type: 'auth'
  data: {
    token: string
    userId: number
    sessionId: string
    capabilities: string[]
  }
}

export interface WebSocketSubscribeMessage extends WebSocketMessage {
  type: 'subscribe'
  data: {
    channels: string[] // ['project:123', 'video:456', 'user:789']
    filters?: {
      eventTypes?: RealTimeEventType[]
      priority?: 'high' | 'normal' | 'low'
      userId?: number[]
    }
  }
}

export interface WebSocketEventMessage extends WebSocketMessage {
  type: 'event'
  data: BaseRealTimeEvent
}

// ===========================================
// 7. 데이터 검증 스키마 (Zod)
// ===========================================

export const RealTimeEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'feedback:created', 'feedback:updated', 'feedback:deleted',
    'feedback:reply:added', 'feedback:reaction:added', 'feedback:reaction:removed',
    'invitation:sent', 'invitation:accepted', 'invitation:declined',
    'project:progress:updated', 'project:timeline:updated'
  ]),
  timestamp: z.string().datetime(),
  userId: z.number().positive(),
  projectId: z.number().positive().optional(),
  videoId: z.string().optional(),
  sessionId: z.string().min(1),
  version: z.string(),
  metadata: z.record(z.any()).optional()
})

export const WebSocketMessageSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['auth', 'subscribe', 'unsubscribe', 'event', 'heartbeat', 'error', 'ack']),
  timestamp: z.string().datetime(),
  data: z.any(),
  requiresAck: z.boolean().optional(),
  replyTo: z.string().optional()
})

export const DashboardSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  projectId: z.number().positive(),
  data: z.object({
    feedback: z.object({
      total: z.number().nonnegative(),
      new: z.number().nonnegative(),
      resolved: z.number().nonnegative(),
      pending: z.number().nonnegative(),
      avgResolutionTime: z.number().nonnegative()
    }),
    invitations: z.object({
      total: z.number().nonnegative(),
      sent: z.number().nonnegative(),
      accepted: z.number().nonnegative(),
      pending: z.number().nonnegative(),
      acceptanceRate: z.number().min(0).max(100),
      activeCollaborators: z.number().nonnegative()
    }),
    timeline: z.object({
      totalProjects: z.number().nonnegative(),
      onTrack: z.number().nonnegative(),
      delayed: z.number().nonnegative(),
      completed: z.number().nonnegative()
    })
  })
})

// ===========================================
// 8. 타입 가드 함수들
// ===========================================

export const isFeedbackEvent = (event: BaseRealTimeEvent): event is FeedbackCreatedEvent | FeedbackUpdatedEvent => {
  return event.type.startsWith('feedback:')
}

export const isInvitationEvent = (event: BaseRealTimeEvent): event is InvitationSentEvent | InvitationStatusEvent => {
  return event.type.startsWith('invitation:')
}

export const isProjectEvent = (event: BaseRealTimeEvent): event is ProjectProgressEvent | ProjectTimelineEvent => {
  return event.type.startsWith('project:')
}

export const isSystemEvent = (event: BaseRealTimeEvent): boolean => {
  return event.type.startsWith('system:')
}

// ===========================================
// 9. 실시간 데이터 구독 채널 정의
// ===========================================

export type SubscriptionChannel = 
  | `project:${number}` // 특정 프로젝트 전체
  | `video:${string}`   // 특정 비디오 피드백
  | `user:${number}`    // 사용자별 알림
  | `dashboard:${number}` // 대시보드 데이터
  | `invitation:${number}` // 초대 관리
  | 'global'           // 전체 시스템 알림

export interface SubscriptionConfig {
  channels: SubscriptionChannel[]
  eventTypes?: RealTimeEventType[]
  priority?: 'high' | 'normal' | 'low'
  maxEventsPerSecond?: number
  bufferSize?: number
  reconnectStrategy?: {
    maxRetries: number
    backoffMs: number
    jitterMs: number
  }
}

// ===========================================
// 10. 성능 최적화 설정
// ===========================================

export interface RealTimeConfig {
  // Connection settings
  websocket: {
    url: string
    heartbeatInterval: number // ms
    reconnectInterval: number // ms
    maxReconnectAttempts: number
    connectionTimeout: number // ms
  }
  
  // Performance settings
  performance: {
    batchSize: number
    flushInterval: number // ms
    maxBufferSize: number
    compressionEnabled: boolean
    priorityQueue: boolean
  }
  
  // Caching settings
  cache: {
    enabled: boolean
    ttl: number // seconds
    maxSize: number
    strategy: 'lru' | 'fifo' | 'lfu'
  }
  
  // Offline support
  offline: {
    enabled: boolean
    maxOfflineEvents: number
    syncStrategy: 'immediate' | 'batch' | 'smart'
    conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'manual'
  }
}

export const DEFAULT_REALTIME_CONFIG: RealTimeConfig = {
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    connectionTimeout: 10000
  },
  performance: {
    batchSize: 50,
    flushInterval: 1000,
    maxBufferSize: 1000,
    compressionEnabled: true,
    priorityQueue: true
  },
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 10000,
    strategy: 'lru'
  },
  offline: {
    enabled: true,
    maxOfflineEvents: 500,
    syncStrategy: 'smart',
    conflictResolution: 'server_wins'
  }
} as const