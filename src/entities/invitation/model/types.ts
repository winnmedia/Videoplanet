/**
 * Invitation Entity Types
 * 
 * Schema-first design for member invitation system with email tracking and status management
 * Following FSD architecture principles for entity layer
 */

export type InvitationStatus = 
  | 'pending'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revoked'

export type InvitationRole = 
  | 'viewer'
  | 'commenter'
  | 'editor'
  | 'admin'

export type InvitationMethod = 
  | 'email'
  | 'link'
  | 'qr_code'
  | 'bulk_import'

export interface InvitationMetadata {
  emailOpens: number
  lastEmailOpened?: string
  linkClicks: number
  lastLinkClicked?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
  location?: {
    country?: string
    city?: string
    timezone?: string
  }
}

export interface InvitationEmail {
  id: string
  invitationId: string
  emailAddress: string
  emailType: 'initial' | 'reminder' | 'expiration_warning' | 'revocation'
  sentAt: string
  deliveredAt?: string
  openedAt?: string
  bounced: boolean
  bounceReason?: string
  templateId: string
  templateVersion: string
  personalizedContent?: Record<string, any>
}

export interface InvitationLink {
  id: string
  invitationId: string
  token: string
  shortUrl: string
  fullUrl: string
  isActive: boolean
  expiresAt: string
  clickCount: number
  createdAt: string
  lastUsedAt?: string
}

export interface Invitation {
  id: string
  projectId: number
  videoId?: string
  inviterId: number
  inviteeEmail: string
  inviteeName?: string
  role: InvitationRole
  status: InvitationStatus
  method: InvitationMethod
  message?: string
  
  // Timestamps
  createdAt: string
  sentAt?: string
  viewedAt?: string
  respondedAt?: string
  expiresAt: string
  
  // Email and link tracking
  emails: InvitationEmail[]
  links: InvitationLink[]
  metadata: InvitationMetadata
  
  // Permissions
  permissions: {
    canViewVideo: boolean
    canComment: boolean
    canReply: boolean
    canReact: boolean
    canDownload: boolean
    canShare: boolean
    canInviteOthers: boolean
    accessDuration?: number // in hours, null for permanent
    ipRestrictions?: string[] // CIDR blocks
    timeRestrictions?: {
      startTime?: string // HH:MM format
      endTime?: string
      timezone?: string
      allowedDays?: number[] // 0-6, Sunday-Saturday
    }
  }
  
  // Usage tracking
  lastActivity?: string
  totalSessions: number
  totalWatchTime: number // in seconds
  feedbackCount: number
  commentCount: number
  
  // Compliance and audit
  gdprConsent?: boolean
  gdprConsentDate?: string
  dataRetentionDate?: string
  auditLog: InvitationAuditEvent[]
}

export interface InvitationAuditEvent {
  id: string
  invitationId: string
  eventType: 'created' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'revoked' | 'reminded' | 'permission_changed'
  performedBy: number // user ID
  timestamp: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface InvitationBatch {
  id: string
  projectId: number
  createdBy: number
  name: string
  description?: string
  
  // Batch configuration
  role: InvitationRole
  message?: string
  expirationDuration: number // in hours
  permissions: Invitation['permissions']
  
  // Batch status
  status: 'preparing' | 'sending' | 'completed' | 'failed' | 'cancelled'
  totalInvitations: number
  sentCount: number
  acceptedCount: number
  failedCount: number
  
  // Email list
  emails: {
    email: string
    name?: string
    customMessage?: string
    status: 'pending' | 'sent' | 'failed'
    error?: string
  }[]
  
  // Timestamps
  createdAt: string
  startedAt?: string
  completedAt?: string
  
  // Results
  successfulInvitations: string[] // invitation IDs
  failedEmails: {
    email: string
    reason: string
    error?: string
  }[]
}

export interface InvitationTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  subject: string
  htmlContent: string
  textContent: string
  variables: {
    name: string
    type: 'text' | 'number' | 'boolean' | 'date'
    required: boolean
    defaultValue?: any
    validation?: {
      pattern?: string
      minLength?: number
      maxLength?: number
      min?: number
      max?: number
    }
  }[]
  isActive: boolean
  isDefault: boolean
  version: string
  createdAt: string
  updatedAt: string
  createdBy: number
}

export interface InvitationStats {
  totalInvitations: number
  byStatus: Record<InvitationStatus, number>
  byRole: Record<InvitationRole, number>
  byMethod: Record<InvitationMethod, number>
  
  emailMetrics: {
    totalSent: number
    deliveryRate: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  
  responseMetrics: {
    acceptanceRate: number
    declineRate: number
    expirationRate: number
    averageResponseTime: number // in hours
  }
  
  engagementMetrics: {
    activeUsers: number
    averageSessionDuration: number
    totalWatchTime: number
    averageFeedbackPerUser: number
  }
  
  timeRange: {
    from: string
    to: string
  }
}

// API Request/Response Types
export interface CreateInvitationRequest {
  projectId: number
  videoId?: string
  inviteeEmail: string
  inviteeName?: string
  role: InvitationRole
  message?: string
  expirationHours?: number
  permissions?: Partial<Invitation['permissions']>
  method?: InvitationMethod
  templateId?: string
}

export interface CreateBatchInvitationRequest {
  projectId: number
  name: string
  description?: string
  role: InvitationRole
  message?: string
  expirationHours?: number
  permissions?: Partial<Invitation['permissions']>
  emails: {
    email: string
    name?: string
    customMessage?: string
  }[]
  templateId?: string
}

export interface UpdateInvitationRequest {
  role?: InvitationRole
  message?: string
  expiresAt?: string
  permissions?: Partial<Invitation['permissions']>
}

export interface InvitationResponse {
  success: boolean
  data?: Invitation
  error?: {
    code: string
    message: string
    field?: string
    details?: Record<string, any>
  }
}

export interface InvitationListResponse {
  invitations: Invitation[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  stats: InvitationStats
}

export interface AcceptInvitationRequest {
  token: string
  gdprConsent?: boolean
  userInfo?: {
    name?: string
    timezone?: string
    preferences?: Record<string, any>
  }
}

// Validation and Quality Checks
export interface InvitationValidationRule {
  field: keyof Invitation
  type: 'required' | 'email' | 'url' | 'date' | 'enum' | 'array' | 'object' | 'custom'
  message: string
  validator?: (value: any, invitation: Partial<Invitation>) => boolean
}

export const INVITATION_VALIDATION_RULES: InvitationValidationRule[] = [
  {
    field: 'projectId',
    type: 'required',
    message: 'Project ID is required'
  },
  {
    field: 'inviteeEmail',
    type: 'email',
    message: 'Valid email address is required'
  },
  {
    field: 'role',
    type: 'enum',
    message: 'Valid role is required'
  },
  {
    field: 'expiresAt',
    type: 'date',
    message: 'Expiration date must be in the future',
    validator: (value: string) => new Date(value) > new Date()
  }
]

// Event Types for Real-time Updates
export interface InvitationEvent {
  type: 'invitation_created' | 'invitation_sent' | 'invitation_viewed' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired' | 'invitation_revoked'
  invitationId: string
  projectId: number
  userId?: number
  data: Partial<Invitation>
  timestamp: string
  metadata?: Record<string, any>
}

// Constants
export const INVITATION_DEFAULTS = {
  EXPIRATION_HOURS: 168, // 7 days
  MAX_REMINDERS: 2,
  REMINDER_INTERVALS: [72, 24], // hours before expiration
  MAX_BATCH_SIZE: 100,
  EMAIL_TEMPLATE_VERSION: '1.0.0',
  LINK_TOKEN_LENGTH: 32,
  DEFAULT_PERMISSIONS: {
    canViewVideo: true,
    canComment: true,
    canReply: true,
    canReact: true,
    canDownload: false,
    canShare: false,
    canInviteOthers: false
  }
} as const

export const INVITATION_LIMITS = {
  MAX_PENDING_PER_PROJECT: 50,
  MAX_TOTAL_PER_PROJECT: 500,
  MAX_DAILY_INVITATIONS: 100,
  MAX_MESSAGE_LENGTH: 500,
  MAX_NAME_LENGTH: 100,
  MIN_EXPIRATION_HOURS: 1,
  MAX_EXPIRATION_HOURS: 8760 // 1 year
} as const