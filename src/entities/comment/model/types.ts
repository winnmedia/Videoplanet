/**
 * Enhanced Comment Entity Types
 * 
 * Schema-first design for enhanced comment system with emotions, nested replies, and reactions
 * Following FSD architecture principles for entity layer
 */

export type CommentType = 
  | 'text'
  | 'audio'
  | 'video'
  | 'drawing'
  | 'screen_annotation'

export type CommentStatus = 
  | 'draft'
  | 'published'
  | 'edited'
  | 'resolved'
  | 'archived'
  | 'deleted'

export type CommentPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type EmotionType = 
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'confused'
  | 'excited'
  | 'frustrated'
  | 'surprised'
  | 'thoughtful'

export type ReactionType = 
  | 'like'
  | 'love'
  | 'laugh'
  | 'wow'
  | 'sad'
  | 'angry'
  | 'thinking'
  | 'celebrate'
  | 'fire'
  | 'heart_eyes'

export interface CommentEmotion {
  type: EmotionType
  confidence: number // 0.0 to 1.0
  detectedAt: string
  source: 'text_analysis' | 'user_selected' | 'voice_analysis' | 'facial_recognition'
  metadata?: {
    keywords?: string[]
    sentiment_score?: number
    voice_characteristics?: {
      tone: string
      speed: number
      volume: number
    }
    facial_features?: {
      expressions: Record<string, number>
      engagement_level: number
    }
  }
}

export interface CommentReaction {
  id: string
  type: ReactionType
  userId: number
  userName: string
  userAvatar?: string
  createdAt: string
  isAnimated?: boolean
}

export interface CommentAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'document' | 'drawing' | 'screenshot'
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  duration?: number // for video/audio
  dimensions?: {
    width: number
    height: number
  }
  metadata?: {
    drawing_data?: {
      strokes: {
        points: { x: number; y: number; pressure?: number }[]
        color: string
        thickness: number
        timestamp: number
      }[]
      canvas_size: { width: number; height: number }
      tool_used: string
    }
    annotation_data?: {
      target_element: string
      position: { x: number; y: number }
      size: { width: number; height: number }
      annotation_type: 'highlight' | 'circle' | 'arrow' | 'text_box'
      style?: Record<string, any>
    }
  }
  createdAt: string
}

export interface CommentMention {
  id: string
  userId: number
  userName: string
  startPosition: number
  endPosition: number
  notified: boolean
  notifiedAt?: string
}

export interface CommentThread {
  id: string
  parentCommentId: string
  depth: number
  childCount: number
  lastActivityAt: string
  isCollapsed: boolean
  participants: {
    userId: number
    userName: string
    userAvatar?: string
    commentCount: number
    lastCommentAt: string
  }[]
}

export interface CommentVersion {
  id: string
  commentId: string
  content: string
  editedAt: string
  editedBy: number
  editReason?: string
  changesSummary: {
    added: string[]
    removed: string[]
    modified: string[]
  }
}

export interface Comment {
  id: string
  projectId: number
  videoId?: string
  authorId: number
  authorName: string
  authorAvatar?: string
  authorRole: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer'
  
  // Content
  content: string
  type: CommentType
  status: CommentStatus
  priority: CommentPriority
  
  // Video context
  timestamp?: number // video position in seconds
  videoRegion?: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // Threading
  parentId?: string // for nested replies
  threadId?: string // top-level thread identifier
  depth: number // nesting level (0 = top-level)
  childrenIds: string[]
  
  // Emotions and sentiment
  emotions: CommentEmotion[]
  sentimentScore?: number // -1.0 (negative) to 1.0 (positive)
  
  // Reactions and engagement
  reactions: CommentReaction[]
  reactionCounts: Record<ReactionType, number>
  
  // Attachments and media
  attachments: CommentAttachment[]
  
  // Mentions and notifications
  mentions: CommentMention[]
  
  // Collaboration features
  isResolved: boolean
  resolvedBy?: number
  resolvedAt?: string
  assignedTo?: number[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  
  // Versioning and editing
  isEdited: boolean
  editCount: number
  versions: CommentVersion[]
  
  // Privacy and permissions
  isPrivate: boolean
  visibleTo?: number[] // user IDs who can see private comments
  isAnonymous: boolean
  
  // Moderation
  isFlagged: boolean
  flagReason?: string
  flaggedBy?: number
  moderatedBy?: number
  moderatedAt?: string
  
  // Analytics and engagement
  viewCount: number
  viewedBy: {
    userId: number
    viewedAt: string
    timeSpent: number
  }[]
  
  // AI analysis
  aiAnalysis?: {
    topics: string[]
    actionItems: string[]
    urgencyScore: number
    relevanceScore: number
    suggestedAssignees?: number[]
    duplicateComments?: string[]
  }
  
  // Metadata
  metadata: Record<string, any>
}

export interface CommentDraft {
  id: string
  projectId: number
  videoId?: string
  authorId: number
  content: string
  type: CommentType
  timestamp?: number
  videoRegion?: Comment['videoRegion']
  parentId?: string
  attachments: CommentAttachment[]
  mentions: CommentMention[]
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  autoSaveInterval: number
}

export interface CommentTemplate {
  id: string
  name: string
  content: string
  type: CommentType
  category: string
  tags: string[]
  isShared: boolean
  createdBy: number
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface CommentStats {
  totalComments: number
  totalReplies: number
  totalReactions: number
  totalResolved: number
  
  byStatus: Record<CommentStatus, number>
  byType: Record<CommentType, number>
  byPriority: Record<CommentPriority, number>
  byEmotion: Record<EmotionType, number>
  byReaction: Record<ReactionType, number>
  
  participantStats: {
    totalParticipants: number
    activeParticipants: number
    averageCommentsPerUser: number
    topContributors: {
      userId: number
      userName: string
      commentCount: number
      reactionCount: number
    }[]
  }
  
  engagementMetrics: {
    averageResponseTime: number
    resolutionRate: number
    averageThreadDepth: number
    averageReactionsPerComment: number
  }
  
  timeRange: {
    from: string
    to: string
  }
}

// API Request/Response Types
export interface CreateCommentRequest {
  projectId: number
  videoId?: string
  content: string
  type?: CommentType
  priority?: CommentPriority
  timestamp?: number
  videoRegion?: Comment['videoRegion']
  parentId?: string
  attachments?: Omit<CommentAttachment, 'id' | 'createdAt'>[]
  mentions?: Omit<CommentMention, 'id' | 'notified' | 'notifiedAt'>[]
  isPrivate?: boolean
  visibleTo?: number[]
  isAnonymous?: boolean
  templateId?: string
}

export interface UpdateCommentRequest {
  content?: string
  priority?: CommentPriority
  status?: CommentStatus
  isPrivate?: boolean
  visibleTo?: number[]
  editReason?: string
}

export interface CommentFilters {
  projectId?: number
  videoId?: string
  authorId?: number
  status?: CommentStatus[]
  type?: CommentType[]
  priority?: CommentPriority[]
  emotion?: EmotionType[]
  hasReactions?: boolean
  hasAttachments?: boolean
  isResolved?: boolean
  isPrivate?: boolean
  timeRange?: {
    from: string
    to: string
  }
  search?: string
  tags?: string[]
}

export interface CommentSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'reactionCount' | 'timestamp'
  direction: 'asc' | 'desc'
}

export interface CommentListResponse {
  comments: Comment[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  stats: CommentStats
  filters: CommentFilters
  sort: CommentSortOptions
}

export interface CommentResponse {
  success: boolean
  data?: Comment
  error?: {
    code: string
    message: string
    field?: string
    details?: Record<string, any>
  }
}

// Real-time Event Types
export interface CommentEvent {
  type: 'comment_created' | 'comment_updated' | 'comment_deleted' | 'comment_resolved' | 'reaction_added' | 'reaction_removed' | 'mention_added' | 'typing_started' | 'typing_stopped'
  commentId: string
  projectId: number
  videoId?: string
  userId: number
  data: Partial<Comment> | { reactionType?: ReactionType; mentionedUserId?: number }
  timestamp: string
  metadata?: Record<string, any>
}

export interface TypingIndicator {
  userId: number
  userName: string
  userAvatar?: string
  projectId: number
  videoId?: string
  parentCommentId?: string
  timestamp: number
  lastActivity: string
}

// Validation Rules
export interface CommentValidationRule {
  field: keyof Comment | keyof CreateCommentRequest
  type: 'required' | 'maxLength' | 'minLength' | 'pattern' | 'custom'
  message: string
  value?: any
  validator?: (value: any, comment: Partial<Comment>) => boolean
}

export const COMMENT_VALIDATION_RULES: CommentValidationRule[] = [
  {
    field: 'content',
    type: 'required',
    message: 'Comment content is required'
  },
  {
    field: 'content',
    type: 'maxLength',
    value: 10000,
    message: 'Comment content cannot exceed 10,000 characters'
  },
  {
    field: 'content',
    type: 'minLength',
    value: 1,
    message: 'Comment content must be at least 1 character'
  }
]

// Constants
export const COMMENT_DEFAULTS = {
  TYPE: 'text' as CommentType,
  STATUS: 'published' as CommentStatus,
  PRIORITY: 'medium' as CommentPriority,
  DEPTH_LIMIT: 5,
  AUTO_SAVE_INTERVAL: 5000, // 5 seconds
  TYPING_TIMEOUT: 3000, // 3 seconds
  MAX_ATTACHMENTS: 10,
  MAX_MENTIONS: 20,
  MAX_CONTENT_LENGTH: 10000,
  EMOTION_CONFIDENCE_THRESHOLD: 0.7
} as const

export const COMMENT_LIMITS = {
  MAX_COMMENTS_PER_VIDEO: 1000,
  MAX_REPLIES_PER_COMMENT: 100,
  MAX_REACTIONS_PER_COMMENT: 500,
  MAX_ATTACHMENTS_PER_COMMENT: 10,
  MAX_MENTIONS_PER_COMMENT: 20,
  MAX_VERSIONS_PER_COMMENT: 50,
  MAX_DRAFT_AGE_DAYS: 30
} as const

export const EMOTION_MAPPINGS = {
  positive: ['happy', 'excited', 'satisfied', 'pleased', 'delighted'],
  negative: ['sad', 'angry', 'frustrated', 'disappointed', 'upset'],
  neutral: ['calm', 'indifferent', 'balanced', 'objective'],
  confused: ['puzzled', 'uncertain', 'perplexed', 'bewildered'],
  excited: ['enthusiastic', 'thrilled', 'energetic', 'eager'],
  frustrated: ['annoyed', 'irritated', 'impatient', 'exasperated'],
  surprised: ['amazed', 'astonished', 'shocked', 'startled'],
  thoughtful: ['contemplative', 'reflective', 'analytical', 'pensive']
} as const

// 반응 아이콘 매핑 (IconType으로 대체)
export const REACTION_ICONS: Record<ReactionType, string> = {
  like: 'THUMB_UP',
  love: 'HEART_FILLED',
  laugh: 'EMOJI_LAUGH',
  wow: 'EMOJI_WOW',
  sad: 'EMOJI_SAD',
  angry: 'EMOJI_ANGRY',
  thinking: 'QUESTION',
  celebrate: 'STAR_FILLED',
  fire: 'TRENDING',
  heart_eyes: 'HEART'
} as const