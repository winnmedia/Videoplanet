/**
 * 실시간 데이터 검증 및 타입 안전성 시스템
 * 
 * Zod 스키마 기반의 런타임 검증, 데이터 변환, 스키마 버전 관리,
 * 성능 최적화된 검증 파이프라인을 제공
 */

import { z } from 'zod'
import { 
  BaseRealTimeEvent, 
  RealTimeEventType,
  WebSocketMessage,
  DashboardSnapshot 
} from '@/shared/types/realtime.types'

// ===========================================
// 기본 스키마 정의
// ===========================================

// 공통 스키마
export const TimestampSchema = z.string().datetime()
export const UserIdSchema = z.number().positive()
export const ProjectIdSchema = z.number().positive()
export const VideoIdSchema = z.string().min(1)
export const UUIDSchema = z.string().uuid()

// 메타데이터 스키마
export const MetadataSchema = z.record(z.any()).optional()

// 실시간 이벤트 타입 스키마
export const RealTimeEventTypeSchema = z.enum([
  'feedback:created',
  'feedback:updated',
  'feedback:deleted',
  'feedback:reply:added',
  'feedback:reaction:added',
  'feedback:reaction:removed',
  'feedback:status:changed',
  'feedback:assignment:changed',
  'invitation:sent',
  'invitation:resent',
  'invitation:viewed',
  'invitation:accepted',
  'invitation:declined',
  'invitation:expired',
  'invitation:revoked',
  'invitation:reminder:sent',
  'project:status:changed',
  'project:milestone:completed',
  'project:timeline:updated',
  'project:deadline:approaching',
  'project:team:updated',
  'project:progress:updated',
  'system:connection:established',
  'system:connection:lost',
  'system:sync:required',
  'system:maintenance:scheduled'
])

// 기본 실시간 이벤트 스키마
export const BaseRealTimeEventSchema = z.object({
  id: UUIDSchema,
  type: RealTimeEventTypeSchema,
  timestamp: TimestampSchema,
  userId: UserIdSchema,
  projectId: ProjectIdSchema.optional(),
  videoId: VideoIdSchema.optional(),
  sessionId: z.string().min(1),
  version: z.string().default('1.0.0'),
  metadata: MetadataSchema
})

// ===========================================
// 피드백 이벤트 스키마
// ===========================================

export const FeedbackTypeSchema = z.enum([
  'timestamp',
  'region',
  'drawing',
  'annotation',
  'voice_note',
  'screen_capture',
  'chapter_marker',
  'bookmark'
])

export const FeedbackCategorySchema = z.enum([
  'content',
  'technical',
  'creative',
  'accessibility',
  'performance',
  'legal',
  'marketing',
  'educational'
])

export const FeedbackSeveritySchema = z.enum([
  'suggestion',
  'minor',
  'major',
  'critical',
  'blocking'
])

export const FeedbackStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'rejected',
  'deferred',
  'duplicate',
  'archived'
])

export const VideoTimestampSchema = z.object({
  currentTime: z.number().min(0),
  duration: z.number().positive().optional(),
  playbackRate: z.number().positive().default(1),
  isExact: z.boolean().default(true),
  bufferTime: z.number().nonnegative().optional(),
  seekAccuracy: z.number().nonnegative().optional()
})

export const VideoRegionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  videoWidth: z.number().positive(),
  videoHeight: z.number().positive(),
  containerWidth: z.number().positive(),
  containerHeight: z.number().positive(),
  rotation: z.number().optional(),
  isRelative: z.boolean().default(true)
})

export const EnhancedFeedbackSchema = z.object({
  id: UUIDSchema,
  projectId: ProjectIdSchema,
  videoId: VideoIdSchema,
  authorId: UserIdSchema,
  authorName: z.string().min(1),
  authorRole: z.enum(['owner', 'admin', 'editor', 'reviewer', 'viewer']),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: FeedbackTypeSchema,
  category: FeedbackCategorySchema,
  severity: FeedbackSeveritySchema,
  status: FeedbackStatusSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  timestamp: VideoTimestampSchema,
  region: VideoRegionSchema.optional(),
  assignedTo: z.array(UserIdSchema).optional(),
  reviewers: z.array(UserIdSchema).optional(),
  tags: z.array(z.string()).max(20).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  version: z.number().positive().default(1),
  metadata: MetadataSchema
})

export const FeedbackCreatedEventSchema = BaseRealTimeEventSchema.extend({
  type: z.literal('feedback:created'),
  data: z.object({
    feedback: EnhancedFeedbackSchema,
    notifyUsers: z.array(UserIdSchema),
    autoAssigned: z.array(UserIdSchema).optional(),
    aiSuggestions: z.object({
      category: z.string(),
      severity: z.string(),
      assignees: z.array(UserIdSchema)
    }).optional()
  })
})

export const FeedbackUpdatedEventSchema = BaseRealTimeEventSchema.extend({
  type: z.literal('feedback:updated'),
  data: z.object({
    feedbackId: UUIDSchema,
    changes: z.array(z.object({
      field: z.string(),
      oldValue: z.any(),
      newValue: z.any()
    })),
    updatedFeedback: EnhancedFeedbackSchema.partial(),
    changeReason: z.string().optional(),
    notifyUsers: z.array(UserIdSchema)
  })
})

// ===========================================
// 초대 이벤트 스키마
// ===========================================

export const InvitationStatusSchema = z.enum([
  'pending',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'revoked'
])

export const InvitationRoleSchema = z.enum([
  'viewer',
  'commenter',
  'editor',
  'admin'
])

export const InvitationSchema = z.object({
  id: UUIDSchema,
  projectId: ProjectIdSchema,
  videoId: VideoIdSchema.optional(),
  inviterId: UserIdSchema,
  inviteeEmail: z.string().email(),
  inviteeName: z.string().optional(),
  role: InvitationRoleSchema,
  status: InvitationStatusSchema,
  message: z.string().max(500).optional(),
  createdAt: TimestampSchema,
  sentAt: TimestampSchema.optional(),
  viewedAt: TimestampSchema.optional(),
  respondedAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema,
  metadata: MetadataSchema
})

export const InvitationSentEventSchema = BaseRealTimeEventSchema.extend({
  type: z.literal('invitation:sent'),
  data: z.object({
    invitation: InvitationSchema,
    emailTemplate: z.object({
      subject: z.string(),
      preview: z.string()
    }),
    deliveryInfo: z.object({
      provider: z.string(),
      messageId: z.string(),
      estimatedDelivery: TimestampSchema
    }),
    notifyUsers: z.array(UserIdSchema)
  })
})

export const InvitationStatusEventSchema = BaseRealTimeEventSchema.extend({
  type: z.enum(['invitation:viewed', 'invitation:accepted', 'invitation:declined']),
  data: z.object({
    invitationId: UUIDSchema,
    oldStatus: InvitationStatusSchema,
    newStatus: InvitationStatusSchema,
    inviteeInfo: z.object({
      name: z.string().optional(),
      timezone: z.string().optional(),
      deviceInfo: z.string().optional()
    }).optional(),
    accessGranted: z.object({
      permissions: z.array(z.string()),
      expiresAt: TimestampSchema.optional()
    }).optional(),
    notifyUsers: z.array(UserIdSchema)
  })
})

// ===========================================
// 프로젝트 일정 스키마
// ===========================================

export const ProjectStageStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'delayed',
  'on_hold'
])

export const ProjectStageTypeSchema = z.enum(['PLAN', 'SHOOT', 'EDIT'])

export const ProjectMilestoneSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  dueDate: TimestampSchema,
  completed: z.boolean().default(false),
  completedAt: TimestampSchema.optional()
})

export const ProjectGanttStageSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  type: ProjectStageTypeSchema,
  status: ProjectStageStatusSchema,
  progress: z.number().min(0).max(100),
  plannedStart: TimestampSchema,
  plannedEnd: TimestampSchema,
  actualStart: TimestampSchema.optional(),
  actualEnd: TimestampSchema.optional(),
  assignees: z.array(UserIdSchema),
  dependencies: z.array(UUIDSchema).default([]),
  milestones: z.array(ProjectMilestoneSchema).default([]),
  resources: z.object({
    equipment: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    budget: z.number().nonnegative().optional()
  }).optional(),
  blockers: z.array(z.object({
    id: UUIDSchema,
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    reportedBy: UserIdSchema,
    reportedAt: TimestampSchema
  })).optional()
})

export const ProjectProgressEventSchema = BaseRealTimeEventSchema.extend({
  type: z.literal('project:progress:updated'),
  data: z.object({
    projectId: ProjectIdSchema,
    stage: ProjectGanttStageSchema,
    progressChange: z.object({
      oldProgress: z.number().min(0).max(100),
      newProgress: z.number().min(0).max(100),
      trigger: z.enum(['manual', 'automatic', 'milestone', 'task_completion'])
    }),
    overallProgress: z.number().min(0).max(100),
    impactedStages: z.array(UUIDSchema),
    notifications: z.object({
      milestoneCompleted: z.string().optional(),
      deadlineApproaching: z.object({
        stage: z.string(),
        daysRemaining: z.number()
      }).optional(),
      budgetAlert: z.object({
        stage: z.string(),
        usedPercentage: z.number().min(0).max(100)
      }).optional()
    }).optional(),
    notifyUsers: z.array(UserIdSchema)
  })
})

// ===========================================
// 대시보드 스냅샷 스키마
// ===========================================

export const DashboardSnapshotSchema = z.object({
  timestamp: TimestampSchema,
  projectId: ProjectIdSchema,
  data: z.object({
    feedback: z.object({
      total: z.number().nonnegative(),
      new: z.number().nonnegative(),
      resolved: z.number().nonnegative(),
      pending: z.number().nonnegative(),
      byType: z.record(FeedbackTypeSchema, z.number().nonnegative()),
      byStatus: z.record(FeedbackStatusSchema, z.number().nonnegative()),
      avgResolutionTime: z.number().nonnegative(),
      mostActiveVideo: z.object({
        videoId: VideoIdSchema,
        feedbackCount: z.number().nonnegative()
      }).optional()
    }),
    invitations: z.object({
      total: z.number().nonnegative(),
      sent: z.number().nonnegative(),
      accepted: z.number().nonnegative(),
      pending: z.number().nonnegative(),
      acceptanceRate: z.number().min(0).max(100),
      activeCollaborators: z.number().nonnegative(),
      byRole: z.record(InvitationRoleSchema, z.number().nonnegative())
    }),
    timeline: z.object({
      totalProjects: z.number().nonnegative(),
      onTrack: z.number().nonnegative(),
      delayed: z.number().nonnegative(),
      completed: z.number().nonnegative(),
      upcomingDeadlines: z.array(z.object({
        projectId: ProjectIdSchema,
        stage: z.string(),
        daysRemaining: z.number()
      })),
      resourceUtilization: z.object({
        team: z.number().min(0).max(100),
        equipment: z.number().min(0).max(100),
        budget: z.number().min(0).max(100)
      }),
      criticalPath: z.array(z.object({
        stages: z.array(UUIDSchema),
        totalDuration: z.number().positive(),
        riskLevel: z.enum(['low', 'medium', 'high'])
      }))
    }),
    system: z.object({
      onlineUsers: z.number().nonnegative(),
      activeConnections: z.number().nonnegative(),
      lastSyncAt: TimestampSchema,
      pendingSyncs: z.number().nonnegative(),
      errorCount: z.number().nonnegative(),
      performanceScore: z.number().min(0).max(100)
    })
  })
})

// ===========================================
// WebSocket 메시지 스키마
// ===========================================

export const WebSocketMessageTypeSchema = z.enum([
  'auth',
  'subscribe',
  'unsubscribe',
  'event',
  'heartbeat',
  'error',
  'ack'
])

export const WebSocketMessageSchema = z.object({
  id: UUIDSchema,
  type: WebSocketMessageTypeSchema,
  timestamp: TimestampSchema,
  data: z.any(),
  requiresAck: z.boolean().optional(),
  replyTo: UUIDSchema.optional()
})

export const WebSocketAuthMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('auth'),
  data: z.object({
    token: z.string().min(1),
    userId: UserIdSchema,
    sessionId: z.string().min(1),
    capabilities: z.array(z.string())
  })
})

export const WebSocketSubscribeMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('subscribe'),
  data: z.object({
    channels: z.array(z.string()),
    filters: z.object({
      eventTypes: z.array(RealTimeEventTypeSchema).optional(),
      priority: z.enum(['high', 'normal', 'low']).optional(),
      userId: z.array(UserIdSchema).optional()
    }).optional()
  })
})

export const WebSocketEventMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('event'),
  data: BaseRealTimeEventSchema
})

// ===========================================
// 통합 이벤트 스키마 (Union Type)
// ===========================================

export const RealTimeEventSchema = z.discriminatedUnion('type', [
  FeedbackCreatedEventSchema,
  FeedbackUpdatedEventSchema,
  InvitationSentEventSchema,
  ProjectProgressEventSchema
])

// ===========================================
// 검증 유틸리티 클래스
// ===========================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public errors: z.ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class SchemaValidator {
  private static schemaCache = new Map<string, z.ZodSchema>()
  private static validationStats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageValidationTime: 0
  }
  
  /**
   * 스키마를 캐시하여 성능 최적화
   */
  private static cacheSchema(key: string, schema: z.ZodSchema): z.ZodSchema {
    this.schemaCache.set(key, schema)
    return schema
  }
  
  /**
   * 캐시된 스키마 조회
   */
  private static getCachedSchema(key: string): z.ZodSchema | undefined {
    return this.schemaCache.get(key)
  }
  
  /**
   * 실시간 이벤트 검증
   */
  static validateRealTimeEvent(data: any): BaseRealTimeEvent {
    const startTime = performance.now()
    
    try {
      this.validationStats.totalValidations++
      
      const result = RealTimeEventSchema.parse(data)
      
      this.validationStats.successfulValidations++
      this.updateAverageTime(performance.now() - startTime)
      
      return result
    } catch (error) {
      this.validationStats.failedValidations++
      
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Real-time event validation failed: ${this.formatZodError(error)}`,
          'realTimeEvent',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * WebSocket 메시지 검증
   */
  static validateWebSocketMessage(data: any): WebSocketMessage {
    try {
      return WebSocketMessageSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `WebSocket message validation failed: ${this.formatZodError(error)}`,
          'webSocketMessage',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * 피드백 데이터 검증
   */
  static validateFeedback(data: any) {
    try {
      return EnhancedFeedbackSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Feedback validation failed: ${this.formatZodError(error)}`,
          'feedback',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * 초대 데이터 검증
   */
  static validateInvitation(data: any) {
    try {
      return InvitationSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Invitation validation failed: ${this.formatZodError(error)}`,
          'invitation',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * 대시보드 스냅샷 검증
   */
  static validateDashboardSnapshot(data: any) {
    try {
      return DashboardSnapshotSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Dashboard snapshot validation failed: ${this.formatZodError(error)}`,
          'dashboardSnapshot',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * 배치 검증 (성능 최적화)
   */
  static async validateBatch<T>(
    items: any[],
    schema: z.ZodSchema<T>,
    options: {
      skipOnError?: boolean
      maxConcurrency?: number
      onProgress?: (processed: number, total: number) => void
    } = {}
  ): Promise<{ valid: T[]; invalid: Array<{ item: any; error: z.ZodError }> }> {
    const { skipOnError = true, maxConcurrency = 10, onProgress } = options
    const valid: T[] = []
    const invalid: Array<{ item: any; error: z.ZodError }> = []
    
    // 배치를 청크로 분할하여 메모리 사용량 최적화
    const chunks = this.chunkArray(items, maxConcurrency)
    let processed = 0
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item) => {
        try {
          const result = schema.parse(item)
          valid.push(result)
        } catch (error) {
          if (error instanceof z.ZodError) {
            invalid.push({ item, error })
            
            if (!skipOnError) {
              throw error
            }
          }
        }
        
        processed++
        onProgress?.(processed, items.length)
      })
      
      await Promise.all(chunkPromises)
    }
    
    return { valid, invalid }
  }
  
  /**
   * 스키마 변환 (데이터 정규화)
   */
  static transform<TInput, TOutput>(
    data: TInput,
    schema: z.ZodSchema<TOutput>
  ): TOutput {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 변환 가능한 경우 자동 변환 시도
        const transformed = this.attemptAutoTransform(data, error)
        if (transformed !== null) {
          return schema.parse(transformed)
        }
        
        throw new ValidationError(
          `Data transformation failed: ${this.formatZodError(error)}`,
          'transform',
          data,
          error
        )
      }
      throw error
    }
  }
  
  /**
   * 조건부 스키마 (스키마 버전 관리)
   */
  static createVersionedSchema<T>(
    schemas: Record<string, z.ZodSchema<T>>,
    versionExtractor: (data: any) => string = (data) => data.version || '1.0.0'
  ): z.ZodSchema<T> {
    return z.any().transform((data) => {
      const version = versionExtractor(data)
      const schema = schemas[version]
      
      if (!schema) {
        throw new Error(`Unsupported schema version: ${version}`)
      }
      
      return schema.parse(data)
    })
  }
  
  /**
   * 동적 스키마 생성 (런타임 스키마 조합)
   */
  static createDynamicSchema(
    baseSchema: z.ZodSchema,
    conditions: Array<{
      condition: (data: any) => boolean
      schema: z.ZodSchema
    }>
  ): z.ZodSchema {
    return z.any().superRefine((data, ctx) => {
      // 기본 스키마 검증
      const baseResult = baseSchema.safeParse(data)
      if (!baseResult.success) {
        baseResult.error.issues.forEach((issue) => {
          ctx.addIssue(issue)
        })
        return
      }
      
      // 조건부 스키마 검증
      for (const { condition, schema } of conditions) {
        if (condition(data)) {
          const conditionResult = schema.safeParse(data)
          if (!conditionResult.success) {
            conditionResult.error.issues.forEach((issue) => {
              ctx.addIssue(issue)
            })
          }
          break // 첫 번째 매칭되는 조건만 적용
        }
      }
    })
  }
  
  // 유틸리티 메소드들
  
  private static formatZodError(error: z.ZodError): string {
    return error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
  }
  
  private static updateAverageTime(time: number): void {
    const alpha = 0.1 // 지수 이동 평균 계수
    this.validationStats.averageValidationTime = 
      this.validationStats.averageValidationTime * (1 - alpha) + time * alpha
  }
  
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
  
  private static attemptAutoTransform(data: any, error: z.ZodError): any {
    // 자동 변환 로직 구현
    const transformed = { ...data }
    let hasChanges = false
    
    for (const issue of error.issues) {
      const path = issue.path.join('.')
      
      // 타입 변환 시도
      if (issue.code === z.ZodIssueCode.invalid_type) {
        const value = this.getNestedValue(data, issue.path)
        
        if (issue.expected === 'number' && typeof value === 'string') {
          const numValue = parseFloat(value)
          if (!isNaN(numValue)) {
            this.setNestedValue(transformed, issue.path, numValue)
            hasChanges = true
          }
        } else if (issue.expected === 'string' && typeof value === 'number') {
          this.setNestedValue(transformed, issue.path, value.toString())
          hasChanges = true
        }
      }
      
      // 날짜 형식 변환
      if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'datetime') {
        const value = this.getNestedValue(data, issue.path)
        
        if (typeof value === 'string' || typeof value === 'number') {
          try {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              this.setNestedValue(transformed, issue.path, date.toISOString())
              hasChanges = true
            }
          } catch {
            // 변환 실패 무시
          }
        }
      }
    }
    
    return hasChanges ? transformed : null
  }
  
  private static getNestedValue(obj: any, path: (string | number)[]): any {
    return path.reduce((current, key) => current?.[key], obj)
  }
  
  private static setNestedValue(obj: any, path: (string | number)[], value: any): void {
    const lastKey = path[path.length - 1]
    const parentPath = path.slice(0, -1)
    const parent = parentPath.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    
    parent[lastKey] = value
  }
  
  /**
   * 검증 통계 조회
   */
  static getValidationStats() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.totalValidations > 0 
        ? this.validationStats.successfulValidations / this.validationStats.totalValidations * 100
        : 0,
      cacheSize: this.schemaCache.size
    }
  }
  
  /**
   * 통계 초기화
   */
  static resetStats(): void {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0
    }
  }
  
  /**
   * 캐시 정리
   */
  static clearCache(): void {
    this.schemaCache.clear()
  }
}

// ===========================================
// 타입 안전 헬퍼 함수들
// ===========================================

/**
 * 타입 가드 함수들
 */
export const isValidRealTimeEvent = (data: any): data is BaseRealTimeEvent => {
  return BaseRealTimeEventSchema.safeParse(data).success
}

export const isFeedbackEvent = (event: BaseRealTimeEvent): boolean => {
  return event.type.startsWith('feedback:')
}

export const isInvitationEvent = (event: BaseRealTimeEvent): boolean => {
  return event.type.startsWith('invitation:')
}

export const isProjectEvent = (event: BaseRealTimeEvent): boolean => {
  return event.type.startsWith('project:')
}

/**
 * 타입 안전 파서들
 */
export const parseRealTimeEvent = (data: unknown) => 
  SchemaValidator.validateRealTimeEvent(data)

export const parseWebSocketMessage = (data: unknown) => 
  SchemaValidator.validateWebSocketMessage(data)

export const parseFeedback = (data: unknown) => 
  SchemaValidator.validateFeedback(data)

export const parseInvitation = (data: unknown) => 
  SchemaValidator.validateInvitation(data)

export const parseDashboardSnapshot = (data: unknown) => 
  SchemaValidator.validateDashboardSnapshot(data)

/**
 * 스키마 내보내기 (타입 추론용)
 */
export type ValidatedRealTimeEvent = z.infer<typeof RealTimeEventSchema>
export type ValidatedWebSocketMessage = z.infer<typeof WebSocketMessageSchema>
export type ValidatedFeedback = z.infer<typeof EnhancedFeedbackSchema>
export type ValidatedInvitation = z.infer<typeof InvitationSchema>
export type ValidatedDashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>

// ===========================================
// 개발/디버깅용 유틸리티
// ===========================================

if (process.env.NODE_ENV === 'development') {
  // 개발 모드에서만 글로벌에 검증 함수 노출
  (globalThis as any).videoplanetValidation = {
    SchemaValidator,
    schemas: {
      BaseRealTimeEventSchema,
      WebSocketMessageSchema,
      EnhancedFeedbackSchema,
      InvitationSchema,
      DashboardSnapshotSchema
    },
    parsers: {
      parseRealTimeEvent,
      parseWebSocketMessage,
      parseFeedback,
      parseInvitation,
      parseDashboardSnapshot
    }
  }
}