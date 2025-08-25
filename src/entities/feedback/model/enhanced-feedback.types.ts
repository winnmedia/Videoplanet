/**
 * Enhanced Feedback Entity Types
 * 
 * Schema-first design for timestamp-based feedback with video position data
 * Extends the basic feedback system with advanced video interaction features
 */

export type FeedbackType = 
  | 'timestamp'
  | 'region'
  | 'drawing'
  | 'annotation'
  | 'voice_note'
  | 'screen_capture'
  | 'chapter_marker'
  | 'bookmark'

export type FeedbackCategory = 
  | 'content'
  | 'technical'
  | 'creative'
  | 'accessibility'
  | 'performance'
  | 'legal'
  | 'marketing'
  | 'educational'

export type FeedbackSeverity = 
  | 'suggestion'
  | 'minor'
  | 'major'
  | 'critical'
  | 'blocking'

export type FeedbackStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'deferred'
  | 'duplicate'
  | 'archived'

export interface VideoTimestamp {
  currentTime: number // in seconds with millisecond precision
  duration?: number // total video duration at time of feedback
  playbackRate?: number // playback speed when feedback was created
  isExact: boolean // whether timestamp is exact or approximate
  bufferTime?: number // any buffering that occurred
  seekAccuracy?: number // accuracy of the seek operation
}

export interface VideoRegion {
  x: number // x coordinate (0-1 normalized)
  y: number // y coordinate (0-1 normalized)
  width: number // width (0-1 normalized)
  height: number // height (0-1 normalized)
  videoWidth: number // actual video width in pixels
  videoHeight: number // actual video height in pixels
  containerWidth: number // player container width
  containerHeight: number // player container height
  rotation?: number // rotation angle in degrees
  isRelative: boolean // whether coordinates are relative to video or container
}

export interface DrawingData {
  strokes: {
    id: string
    points: {
      x: number
      y: number
      pressure?: number // 0-1 for pressure-sensitive devices
      timestamp: number // relative to stroke start
    }[]
    color: string
    thickness: number
    opacity: number
    tool: 'pen' | 'marker' | 'brush' | 'eraser' | 'highlighter'
    smoothed: boolean
    createdAt: string
  }[]
  canvasSize: {
    width: number
    height: number
  }
  videoFrame?: {
    timestamp: number
    base64Data?: string // compressed frame data
  }
  layers: {
    id: string
    name: string
    visible: boolean
    opacity: number
    blendMode: string
    strokeIds: string[]
  }[]
}

export interface AnnotationData {
  type: 'arrow' | 'circle' | 'rectangle' | 'highlight' | 'text' | 'callout' | 'blur' | 'spotlight'
  style: {
    color: string
    thickness: number
    opacity: number
    fill?: string
    fontSize?: number
    fontFamily?: string
    borderRadius?: number
    shadow?: boolean
  }
  geometry: {
    x: number
    y: number
    width?: number
    height?: number
    radius?: number
    points?: { x: number; y: number }[]
    text?: string
  }
  animation?: {
    type: 'fade_in' | 'slide_in' | 'bounce' | 'pulse'
    duration: number
    delay: number
    easing: string
  }
}

export interface VoiceNoteData {
  audioUrl: string
  duration: number
  waveformData?: number[] // amplitude data for visualization
  transcription?: {
    text: string
    confidence: number
    language: string
    speaker?: {
      id: string
      confidence: number
    }
    timestamps?: {
      start: number
      end: number
      text: string
    }[]
  }
  noiseReduction?: boolean
  volumeNormalized?: boolean
}

export interface ScreenCaptureData {
  imageUrl: string
  thumbnailUrl?: string
  dimensions: {
    width: number
    height: number
  }
  captureMethod: 'manual' | 'automatic' | 'on_pause' | 'on_error'
  deviceInfo?: {
    userAgent: string
    screen: {
      width: number
      height: number
      pixelRatio: number
    }
    browser: {
      name: string
      version: string
    }
  }
}

export interface ChapterMarker {
  title: string
  description?: string
  thumbnailUrl?: string
  isGenerated: boolean // auto-generated vs manual
  confidence?: number // for auto-generated markers
  tags?: string[]
  color?: string
  icon?: string
}

export interface BookmarkData {
  title: string
  description?: string
  isPrivate: boolean
  tags: string[]
  color: string
  reminderAt?: string // ISO datetime for reminder
  sharedWith?: number[] // user IDs
}

export interface FeedbackMetrics {
  viewCount: number
  likeCount: number
  dislikeCount: number
  shareCount: number
  implementationTime?: number // time taken to implement in seconds
  resolutionComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex'
  businessImpact: 'low' | 'medium' | 'high' | 'critical'
  technicalDebt?: number // 1-10 scale
}

export interface FeedbackContext {
  sessionId: string
  userAgent: string
  deviceType: 'desktop' | 'tablet' | 'mobile' | 'tv' | 'unknown'
  screenSize: {
    width: number
    height: number
  }
  networkInfo?: {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
    downlink: number
    rtt: number
  }
  playerState: {
    version: string
    volume: number
    quality: string
    subtitles: boolean
    fullscreen: boolean
    pictureInPicture: boolean
  }
  previousActions?: {
    action: string
    timestamp: number
    data?: any
  }[]
}

export interface EnhancedFeedback {
  id: string
  projectId: number
  videoId: string
  authorId: number
  authorName: string
  authorRole: 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer'
  
  // Basic feedback data
  title: string
  content: string
  type: FeedbackType
  category: FeedbackCategory
  severity: FeedbackSeverity
  status: FeedbackStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Video-specific data
  timestamp: VideoTimestamp
  region?: VideoRegion
  
  // Type-specific data
  drawingData?: DrawingData
  annotationData?: AnnotationData
  voiceNoteData?: VoiceNoteData
  screenCaptureData?: ScreenCaptureData
  chapterMarker?: ChapterMarker
  bookmarkData?: BookmarkData
  
  // Collaboration
  assignedTo?: number[]
  reviewers?: number[]
  approvers?: number[]
  watchers?: number[]
  
  // Resolution tracking
  implementedBy?: number
  implementedAt?: string
  implementationDetails?: string
  implementationCommit?: string
  testResults?: {
    passed: boolean
    details: string
    testedBy: number
    testedAt: string
  }
  
  // Dependencies and relationships
  dependsOn?: string[] // other feedback IDs
  blockedBy?: string[]
  relatedFeedback?: string[]
  duplicateOf?: string
  
  // Metrics and analytics
  metrics: FeedbackMetrics
  context: FeedbackContext
  
  // Workflow and automation
  workflow?: {
    currentStep: string
    nextSteps: string[]
    automatedActions: {
      trigger: string
      action: string
      scheduledAt?: string
      executedAt?: string
      result?: any
    }[]
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  dueDate?: string
  
  // Versioning
  version: number
  changeHistory: {
    version: number
    changedBy: number
    changedAt: string
    changes: {
      field: string
      oldValue: any
      newValue: any
      reason?: string
    }[]
  }[]
  
  // Tags and classification
  tags: string[]
  customFields?: Record<string, any>
  
  // AI analysis
  aiAnalysis?: {
    sentiment: number // -1 to 1
    urgency: number // 0 to 1
    complexity: number // 0 to 1
    suggestedCategory: FeedbackCategory
    suggestedAssignees: number[]
    similarFeedback: string[]
    autoTags: string[]
    extractedActionItems: string[]
    estimatedEffort: number // in hours
  }
}

export interface FeedbackTemplate {
  id: string
  name: string
  description: string
  type: FeedbackType
  category: FeedbackCategory
  templateContent: {
    title: string
    content: string
    severity: FeedbackSeverity
    priority: EnhancedFeedback['priority']
    tags: string[]
    customFields?: Record<string, any>
  }
  isPublic: boolean
  createdBy: number
  usageCount: number
  rating: number
  createdAt: string
  updatedAt: string
}

export interface FeedbackBatch {
  id: string
  name: string
  description: string
  projectId: number
  videoId: string
  createdBy: number
  feedbackIds: string[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  totalFeedback: number
  resolvedFeedback: number
  createdAt: string
  submittedAt?: string
  reviewedAt?: string
  dueDate?: string
}

export interface FeedbackStats {
  total: number
  byType: Record<FeedbackType, number>
  byCategory: Record<FeedbackCategory, number>
  bySeverity: Record<FeedbackSeverity, number>
  byStatus: Record<FeedbackStatus, number>
  
  resolutionMetrics: {
    averageResolutionTime: number // in hours
    resolutionRate: number // percentage
    reopenRate: number // percentage
    byPriority: Record<EnhancedFeedback['priority'], {
      averageTime: number
      count: number
    }>
  }
  
  engagementMetrics: {
    averageViewsPerFeedback: number
    averageTimeSpentPerFeedback: number
    participationRate: number
    feedbackPerUser: number
  }
  
  timeRange: {
    from: string
    to: string
  }
}

// API Types
export interface CreateFeedbackRequest {
  projectId: number
  videoId: string
  title: string
  content: string
  type: FeedbackType
  category: FeedbackCategory
  severity: FeedbackSeverity
  priority: EnhancedFeedback['priority']
  timestamp: VideoTimestamp
  region?: VideoRegion
  drawingData?: DrawingData
  annotationData?: AnnotationData
  voiceNoteData?: VoiceNoteData
  screenCaptureData?: ScreenCaptureData
  chapterMarker?: ChapterMarker
  bookmarkData?: BookmarkData
  assignedTo?: number[]
  tags?: string[]
  dueDate?: string
  templateId?: string
}

export interface UpdateFeedbackRequest {
  title?: string
  content?: string
  category?: FeedbackCategory
  severity?: FeedbackSeverity
  priority?: EnhancedFeedback['priority']
  status?: FeedbackStatus
  assignedTo?: number[]
  tags?: string[]
  dueDate?: string
  implementationDetails?: string
}

export interface FeedbackFilters {
  projectId?: number
  videoId?: string
  authorId?: number
  type?: FeedbackType[]
  category?: FeedbackCategory[]
  severity?: FeedbackSeverity[]
  status?: FeedbackStatus[]
  priority?: EnhancedFeedback['priority'][]
  assignedTo?: number[]
  timestampRange?: {
    start: number
    end: number
  }
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
  hasDrawings?: boolean
  hasVoiceNotes?: boolean
  hasScreenCaptures?: boolean
  search?: string
}

export interface FeedbackSortOptions {
  field: 'createdAt' | 'updatedAt' | 'timestamp' | 'priority' | 'severity' | 'status' | 'viewCount'
  direction: 'asc' | 'desc'
}

export interface FeedbackListResponse {
  feedback: EnhancedFeedback[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  stats: FeedbackStats
  timeline?: {
    timestamp: number
    count: number
    types: Record<FeedbackType, number>
  }[]
}

// Event Types
export interface FeedbackEvent {
  type: 'feedback_created' | 'feedback_updated' | 'feedback_resolved' | 'feedback_assigned' | 'feedback_commented' | 'feedback_liked' | 'feedback_shared'
  feedbackId: string
  projectId: number
  videoId: string
  userId: number
  data: Partial<EnhancedFeedback>
  timestamp: string
  metadata?: Record<string, any>
}

// Validation Rules
export interface FeedbackValidationRule {
  field: keyof EnhancedFeedback | keyof CreateFeedbackRequest
  type: 'required' | 'maxLength' | 'minLength' | 'pattern' | 'range' | 'custom'
  message: string
  value?: any
  validator?: (value: any, feedback: Partial<EnhancedFeedback>) => boolean
}

export const FEEDBACK_VALIDATION_RULES: FeedbackValidationRule[] = [
  {
    field: 'title',
    type: 'required',
    message: 'Feedback title is required'
  },
  {
    field: 'title',
    type: 'maxLength',
    value: 200,
    message: 'Title cannot exceed 200 characters'
  },
  {
    field: 'content',
    type: 'required',
    message: 'Feedback content is required'
  },
  {
    field: 'content',
    type: 'maxLength',
    value: 10000,
    message: 'Content cannot exceed 10,000 characters'
  },
  {
    field: 'timestamp',
    type: 'custom',
    message: 'Timestamp must be valid and within video duration',
    validator: (timestamp: VideoTimestamp) => {
      return timestamp.currentTime >= 0 && 
             (!timestamp.duration || timestamp.currentTime <= timestamp.duration)
    }
  }
]

// Constants
export const FEEDBACK_DEFAULTS = {
  TYPE: 'timestamp' as FeedbackType,
  CATEGORY: 'content' as FeedbackCategory,
  SEVERITY: 'minor' as FeedbackSeverity,
  STATUS: 'open' as FeedbackStatus,
  PRIORITY: 'medium' as EnhancedFeedback['priority'],
  PAGE_SIZE: 25,
  MAX_DRAWING_STROKES: 1000,
  MAX_VOICE_NOTE_DURATION: 300, // 5 minutes
  MAX_TAGS: 20,
  AUTO_SAVE_INTERVAL: 10000, // 10 seconds
  TIMESTAMP_PRECISION: 0.1 // 100ms precision
} as const

export const FEEDBACK_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MAX_FEEDBACK_PER_VIDEO: 500,
  MAX_ATTACHMENTS_PER_FEEDBACK: 10,
  MAX_ASSIGNEES: 10,
  MAX_WATCHERS: 50,
  MAX_TAGS_PER_FEEDBACK: 20,
  MAX_RELATED_FEEDBACK: 10,
  MAX_DRAWING_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VOICE_NOTE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SCREEN_CAPTURE_SIZE: 2 * 1024 * 1024 // 2MB
} as const

export const FEEDBACK_COLORS = {
  suggestion: '#22c55e',
  minor: '#3b82f6',
  major: '#f59e0b',
  critical: '#ef4444',
  blocking: '#dc2626'
} as const

export const FEEDBACK_ICONS = {
  timestamp: '⏰',
  region: '🎯',
  drawing: '✏️',
  annotation: '📝',
  voice_note: '🎙️',
  screen_capture: '📸',
  chapter_marker: '📚',
  bookmark: '🔖'
} as const