/**
 * Analytics and Event Tracking Entity Types
 * 
 * Schema-first design for comprehensive user interaction tracking
 * Following FSD architecture principles for entity layer
 */

export type EventCategory = 
  | 'video'
  | 'feedback'
  | 'comment'
  | 'invitation'
  | 'project'
  | 'user'
  | 'system'
  | 'collaboration'
  | 'sharing'
  | 'performance'

export type EventAction = 
  | 'view'
  | 'play'
  | 'pause'
  | 'seek'
  | 'volume_change'
  | 'quality_change'
  | 'fullscreen'
  | 'screenshot'
  | 'share'
  | 'comment'
  | 'react'
  | 'invite'
  | 'upload'
  | 'download'
  | 'error'
  | 'performance'

export type DeviceType = 
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'tv'
  | 'unknown'

export type BrowserType = 
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'edge'
  | 'opera'
  | 'other'

export type OperatingSystem = 
  | 'windows'
  | 'macos'
  | 'linux'
  | 'ios'
  | 'android'
  | 'other'

export interface EventContext {
  sessionId: string
  userId?: number
  guestId?: string
  projectId?: number
  videoId?: string
  
  // Device and browser information
  device: {
    type: DeviceType
    model?: string
    brand?: string
    os: OperatingSystem
    osVersion?: string
    screenResolution: {
      width: number
      height: number
      pixelRatio: number
    }
    touchSupport: boolean
    orientation?: 'portrait' | 'landscape'
  }
  
  browser: {
    name: BrowserType
    version: string
    userAgent: string
    language: string
    timezone: string
    cookiesEnabled: boolean
    doNotTrack: boolean
  }
  
  // Network information
  network?: {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
    downlink: number
    rtt: number
    saveData: boolean
  }
  
  // Page context
  page: {
    url: string
    referrer?: string
    title: string
    pathname: string
    search: string
    hash: string
    loadTime?: number
  }
  
  // Geographic information
  location?: {
    country: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
    timezone: string
  }
  
  // A/B testing and experiments
  experiments?: {
    id: string
    variant: string
  }[]
}

export interface VideoEventData {
  timestamp: number // video position in seconds
  duration: number // total video duration
  playbackRate: number
  volume: number
  quality: string
  isFullscreen: boolean
  isMuted: boolean
  bufferHealth?: number // seconds of buffer ahead
  
  // Video-specific metrics
  watchTime?: number // cumulative watch time
  seekCount?: number
  pauseCount?: number
  bufferCount?: number
  errorCount?: number
  
  // Engagement metrics
  lastHeartbeat?: number
  engagement?: {
    score: number // 0-100
    interactionCount: number
    focusTime: number // time page was in focus
    visibilityTime: number // time video was visible
  }
}

export interface FeedbackEventData {
  feedbackId: string
  feedbackType: string
  timestamp?: number // video timestamp if applicable
  region?: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // Feedback creation context
  creationMethod: 'click' | 'keyboard' | 'voice' | 'drawing' | 'import'
  timeToCreate?: number // time spent creating feedback
  editCount?: number
  attachmentCount?: number
  
  // AI assistance
  aiSuggestions?: {
    used: boolean
    suggestionsShown: number
    suggestionsAccepted: number
  }
}

export interface CommentEventData {
  commentId: string
  parentCommentId?: string
  depth: number
  contentLength: number
  mentionCount: number
  attachmentCount: number
  reactionType?: string
  
  // Comment creation
  creationMethod: 'type' | 'voice' | 'template' | 'ai_assist'
  draftTime?: number // time spent in draft
  editTime?: number // time spent editing
  
  // Emotional analysis
  sentiment?: number
  emotionDetected?: string
  confidence?: number
}

export interface InvitationEventData {
  invitationId: string
  inviteeEmail: string
  role: string
  method: 'email' | 'link' | 'qr_code' | 'bulk'
  
  // Email tracking
  emailOpened?: boolean
  emailOpenTime?: number
  linkClicked?: boolean
  linkClickTime?: number
  
  // Response tracking
  responseTime?: number // time to respond to invitation
  declineReason?: string
}

export interface ShareEventData {
  shareMethod: 'link' | 'email' | 'social' | 'embed' | 'download'
  socialPlatform?: 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok'
  recipientCount?: number
  customMessage?: boolean
  
  // Share success tracking
  shareSuccessful: boolean
  shareError?: string
  
  // Generated content
  generatedThumbnail?: boolean
  generatedPreview?: boolean
}

export interface ScreenshotEventData {
  timestamp: number // video position
  method: 'button' | 'keyboard' | 'context_menu' | 'auto'
  quality: string
  format: 'png' | 'jpg' | 'webp'
  includeAnnotations: boolean
  
  // Screenshot metadata
  videoDimensions: {
    width: number
    height: number
  }
  screenshotSize: number // file size in bytes
  
  // User action after screenshot
  action?: 'save' | 'share' | 'annotate' | 'feedback' | 'discard'
}

export interface PerformanceEventData {
  metric: 'page_load' | 'video_load' | 'first_frame' | 'buffer_event' | 'error'
  duration: number
  
  // Performance context
  resourceCount?: number
  domContentLoaded?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
  
  // Video-specific performance
  videoLoadTime?: number
  firstFrameTime?: number
  seekTime?: number
  bufferDuration?: number
  
  // Error details
  errorType?: string
  errorMessage?: string
  errorStack?: string
}

export interface ErrorEventData {
  errorType: 'video' | 'network' | 'permission' | 'validation' | 'system'
  errorCode: string
  errorMessage: string
  errorStack?: string
  
  // Context when error occurred
  userAction?: string
  videoTimestamp?: number
  retryCount?: number
  
  // Recovery information
  wasRecovered: boolean
  recoveryMethod?: string
  recoveryTime?: number
  
  // User impact
  blockingError: boolean
  userNotified: boolean
  fallbackUsed?: boolean
}

export interface UserBehaviorData {
  sessionDuration: number
  pageViews: number
  interactions: number
  
  // Navigation patterns
  entryPoint: string
  exitPoint?: string
  navigationPath: string[]
  
  // Engagement patterns
  mouseMovements?: number
  scrollEvents?: number
  keyboardEvents?: number
  touchEvents?: number
  
  // Focus and attention
  tabSwitches: number
  windowMinimized: number
  idleTime: number // total idle time
  activeTime: number // total active time
  
  // Feature usage
  featuresUsed: string[]
  tooltipsViewed: string[]
  shortcutsUsed: string[]
}

export interface CollaborationEventData {
  collaborationType: 'real_time' | 'asynchronous'
  participantCount: number
  activeParticipants: number
  
  // Real-time collaboration
  simultaneousEditors?: number
  conflictCount?: number
  mergeSuccessful?: boolean
  
  // Communication
  messagesSent?: number
  mentionsUsed?: number
  reactionsGiven?: number
  
  // Workflow
  workflowStage?: string
  approvalCount?: number
  rejectionCount?: number
}

export interface AnalyticsEvent {
  id: string
  category: EventCategory
  action: EventAction
  label?: string
  value?: number
  
  // Event timing
  timestamp: string
  serverTimestamp: string
  timezoneOffset: number
  
  // Context and metadata
  context: EventContext
  
  // Event-specific data
  videoData?: VideoEventData
  feedbackData?: FeedbackEventData
  commentData?: CommentEventData
  invitationData?: InvitationEventData
  shareData?: ShareEventData
  screenshotData?: ScreenshotEventData
  performanceData?: PerformanceEventData
  errorData?: ErrorEventData
  userBehaviorData?: UserBehaviorData
  collaborationData?: CollaborationEventData
  
  // Custom properties
  customProperties?: Record<string, any>
  
  // Privacy and compliance
  isAnonymized: boolean
  gdprConsent?: boolean
  dataRetentionDays?: number
  
  // Event processing
  processed: boolean
  processedAt?: string
  processingErrors?: string[]
  
  // Data quality
  isValid: boolean
  validationErrors?: string[]
  dataQualityScore?: number
}

export interface AnalyticsSession {
  id: string
  userId?: number
  guestId?: string
  
  // Session boundaries
  startTime: string
  endTime?: string
  duration?: number
  lastActivityAt: string
  
  // Session context
  context: EventContext
  
  // Session summary
  eventCount: number
  pageViews: number
  videoViews: number
  feedbackCreated: number
  commentsCreated: number
  errorsEncountered: number
  
  // Engagement metrics
  totalWatchTime: number
  uniqueVideosWatched: number
  averageEngagementScore: number
  
  // Technical metrics
  averageLoadTime: number
  errorRate: number
  performanceScore: number
  
  // Conversion tracking
  goalsCompleted: string[]
  conversionValue?: number
  
  // Session quality
  isHealthy: boolean
  bounceRate?: number
  exitPage?: string
}

export interface AnalyticsFunnel {
  id: string
  name: string
  description: string
  
  steps: {
    id: string
    name: string
    eventCriteria: {
      category: EventCategory
      action: EventAction
      filters?: Record<string, any>
    }
    order: number
    isRequired: boolean
  }[]
  
  // Funnel configuration
  timeWindow: number // hours
  allowRepeats: boolean
  trackPartialCompletion: boolean
  
  // Results
  totalUsers: number
  completions: number
  conversionRate: number
  
  stepConversions: {
    stepId: string
    entrances: number
    completions: number
    conversionRate: number
    averageTimeToComplete: number
    dropoffRate: number
  }[]
  
  // Time analysis
  dateRange: {
    from: string
    to: string
  }
}

export interface AnalyticsSegment {
  id: string
  name: string
  description: string
  
  criteria: {
    userProperties?: Record<string, any>
    eventCriteria?: {
      category: EventCategory
      action: EventAction
      timeRange?: {
        from: string
        to: string
      }
      frequency?: {
        min: number
        max?: number
      }
    }[]
    behaviorCriteria?: {
      sessionCount?: { min: number; max?: number }
      totalWatchTime?: { min: number; max?: number }
      feedbackCount?: { min: number; max?: number }
      lastActivityDays?: number
    }
  }
  
  // Segment size and characteristics
  userCount: number
  refreshedAt: string
  
  // Segment insights
  topEvents: {
    category: EventCategory
    action: EventAction
    count: number
    percentage: number
  }[]
  
  avgSessionDuration: number
  avgEventsPerSession: number
  conversionRate: number
}

export interface AnalyticsReport {
  id: string
  name: string
  type: 'overview' | 'funnel' | 'cohort' | 'retention' | 'custom'
  
  // Report configuration
  dateRange: {
    from: string
    to: string
  }
  granularity: 'hour' | 'day' | 'week' | 'month'
  filters: {
    segments?: string[]
    events?: {
      category: EventCategory
      action: EventAction
    }[]
    userProperties?: Record<string, any>
  }
  
  // Report data
  metrics: {
    name: string
    value: number
    previousValue?: number
    changePercentage?: number
    trend: 'up' | 'down' | 'flat'
  }[]
  
  charts: {
    type: 'line' | 'bar' | 'pie' | 'funnel' | 'heatmap'
    title: string
    data: any[]
    xAxis?: string
    yAxis?: string
  }[]
  
  insights: {
    type: 'trend' | 'anomaly' | 'recommendation'
    title: string
    description: string
    confidence: number
    actionable: boolean
  }[]
  
  // Report metadata
  generatedAt: string
  generatedBy: number
  scheduled: boolean
  recipients?: string[]
}

// Real-time Analytics
export interface RealTimeMetrics {
  timestamp: string
  
  // Current activity
  activeUsers: number
  activeViewers: number
  currentVideoViews: number
  
  // Recent activity (last 5 minutes)
  recentEvents: number
  recentUploads: number
  recentFeedback: number
  recentComments: number
  
  // System metrics
  systemLoad: number
  responseTime: number
  errorRate: number
  
  // Top content
  topVideos: {
    videoId: string
    title: string
    currentViewers: number
    totalViews: number
  }[]
  
  topFeedback: {
    feedbackId: string
    title: string
    engagementScore: number
  }[]
}

// Data Pipeline Types
export interface EventBatch {
  batchId: string
  events: AnalyticsEvent[]
  timestamp: string
  source: string
  compressed: boolean
  checksum: string
}

export interface DataQualityCheck {
  checkId: string
  batchId: string
  timestamp: string
  
  checks: {
    name: string
    passed: boolean
    score: number
    details?: string
  }[]
  
  overallScore: number
  passed: boolean
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    affectedEvents: number
    recommendation?: string
  }[]
}

// Constants
export const ANALYTICS_DEFAULTS = {
  BATCH_SIZE: 100,
  FLUSH_INTERVAL: 5000, // 5 seconds
  MAX_QUEUE_SIZE: 1000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  DATA_RETENTION_DAYS: 365,
  ANONYMIZATION_DELAY_HOURS: 24
} as const

export const EVENT_PRIORITIES = {
  critical: ['error', 'performance'],
  high: ['video_view', 'feedback_created', 'user_signup'],
  normal: ['comment', 'reaction', 'share'],
  low: ['page_view', 'mouse_move', 'scroll']
} as const

export const PRIVACY_LEVELS = {
  public: 0,
  registered: 1,
  team: 2,
  private: 3,
  sensitive: 4
} as const