/**
 * Data Quality and Validation Framework
 * 
 * Comprehensive data validation rules and quality checks for all entities
 * Implements TDD approach with schema-first validation
 */

import { z } from 'zod'

// Base validation types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number // 0-100 quality score
  metadata: {
    validatedAt: string
    validatorVersion: string
    entityType: string
    validationTime: number // ms
  }
}

export interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
  severity: 'critical' | 'high' | 'medium' | 'low'
  fixSuggestion?: string
}

export interface ValidationWarning {
  field: string
  code: string
  message: string
  value?: any
  recommendation?: string
}

export interface DataQualityMetrics {
  completeness: number // 0-100
  accuracy: number // 0-100
  consistency: number // 0-100
  validity: number // 0-100
  uniqueness: number // 0-100
  timeliness: number // 0-100
  overall: number // weighted average
}

export interface QualityCheck {
  name: string
  description: string
  weight: number // for overall score calculation
  execute: (data: any) => Promise<QualityCheckResult>
}

export interface QualityCheckResult {
  passed: boolean
  score: number
  details: string
  metrics?: Record<string, number>
  suggestions?: string[]
}

// Schema definitions for each entity
export const InvitationSchema = z.object({
  id: z.string().uuid('Invitation ID must be a valid UUID'),
  projectId: z.number().int().positive('Project ID must be a positive integer'),
  inviterId: z.number().int().positive('Inviter ID must be a positive integer'),
  inviteeEmail: z.string().email('Must be a valid email address'),
  inviteeName: z.string().min(1).max(100).optional(),
  role: z.enum(['viewer', 'commenter', 'editor', 'admin']),
  status: z.enum(['pending', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'revoked']),
  method: z.enum(['email', 'link', 'qr_code', 'bulk_import']),
  message: z.string().max(500).optional(),
  expiresAt: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    'Expiration date must be in the future'
  ),
  createdAt: z.string().datetime(),
  permissions: z.object({
    canViewVideo: z.boolean(),
    canComment: z.boolean(),
    canReply: z.boolean(),
    canReact: z.boolean(),
    canDownload: z.boolean(),
    canShare: z.boolean(),
    canInviteOthers: z.boolean(),
    accessDuration: z.number().int().positive().optional(),
    ipRestrictions: z.array(z.string().ip()).optional(),
  }),
  metadata: z.object({
    emailOpens: z.number().int().nonnegative(),
    linkClicks: z.number().int().nonnegative(),
    lastEmailOpened: z.string().datetime().optional(),
    lastLinkClicked: z.string().datetime().optional(),
  })
})

export const CommentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.number().int().positive(),
  authorId: z.number().int().positive(),
  authorName: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  type: z.enum(['text', 'audio', 'video', 'drawing', 'screen_annotation']),
  status: z.enum(['draft', 'published', 'edited', 'resolved', 'archived', 'deleted']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.number().nonnegative().optional(),
  parentId: z.string().uuid().optional(),
  depth: z.number().int().nonnegative().max(5),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reactions: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thinking', 'celebrate', 'fire', 'heart_eyes']),
    userId: z.number().int().positive(),
    createdAt: z.string().datetime(),
  })),
  emotions: z.array(z.object({
    type: z.enum(['positive', 'negative', 'neutral', 'confused', 'excited', 'frustrated', 'surprised', 'thoughtful']),
    confidence: z.number().min(0).max(1),
    source: z.enum(['text_analysis', 'user_selected', 'voice_analysis', 'facial_recognition']),
    detectedAt: z.string().datetime(),
  })),
  mentions: z.array(z.object({
    userId: z.number().int().positive(),
    userName: z.string().min(1).max(100),
    startPosition: z.number().int().nonnegative(),
    endPosition: z.number().int().positive(),
  }))
})

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  projectId: z.number().int().positive(),
  videoId: z.string().uuid(),
  authorId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: z.enum(['timestamp', 'region', 'drawing', 'annotation', 'voice_note', 'screen_capture', 'chapter_marker', 'bookmark']),
  category: z.enum(['content', 'technical', 'creative', 'accessibility', 'performance', 'legal', 'marketing', 'educational']),
  severity: z.enum(['suggestion', 'minor', 'major', 'critical', 'blocking']),
  status: z.enum(['open', 'in_progress', 'resolved', 'rejected', 'deferred', 'duplicate', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  timestamp: z.object({
    currentTime: z.number().nonnegative(),
    duration: z.number().positive().optional(),
    playbackRate: z.number().positive().optional(),
    isExact: z.boolean(),
  }),
  region: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
    videoWidth: z.number().int().positive(),
    videoHeight: z.number().int().positive(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string().min(1).max(50)).max(20),
})

export const VideoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['uploading', 'processing', 'transcoding', 'ready', 'failed', 'archived', 'deleted']),
  accessLevel: z.enum(['public', 'unlisted', 'private', 'password_protected', 'team_only', 'invite_only']),
  originalFileName: z.string().min(1),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024 * 1024), // 5GB
  metadata: z.object({
    duration: z.number().positive().max(4 * 60 * 60), // 4 hours
    width: z.number().int().min(240).max(3840),
    height: z.number().int().min(180).max(2160),
    aspectRatio: z.string().regex(/^\d+:\d+$/),
    frameRate: z.number().positive().max(120),
    bitrate: z.number().positive(),
    format: z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv']),
    codec: z.enum(['h264', 'h265', 'av1', 'vp8', 'vp9']),
    hasAudio: z.boolean(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string().min(1).max(50)).max(20),
})

export const AnalyticsEventSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['video', 'feedback', 'comment', 'invitation', 'project', 'user', 'system', 'collaboration', 'sharing', 'performance']),
  action: z.enum(['view', 'play', 'pause', 'seek', 'volume_change', 'quality_change', 'fullscreen', 'screenshot', 'share', 'comment', 'react', 'invite', 'upload', 'download', 'error', 'performance']),
  label: z.string().optional(),
  value: z.number().optional(),
  timestamp: z.string().datetime(),
  serverTimestamp: z.string().datetime(),
  context: z.object({
    sessionId: z.string().uuid(),
    userId: z.number().int().positive().optional(),
    projectId: z.number().int().positive().optional(),
    videoId: z.string().uuid().optional(),
    device: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet', 'tv', 'unknown']),
      os: z.enum(['windows', 'macos', 'linux', 'ios', 'android', 'other']),
      screenResolution: z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        pixelRatio: z.number().positive(),
      }),
    }),
    browser: z.object({
      name: z.enum(['chrome', 'firefox', 'safari', 'edge', 'opera', 'other']),
      version: z.string(),
      language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
      timezone: z.string(),
    }),
    page: z.object({
      url: z.string().url(),
      title: z.string(),
      pathname: z.string(),
    }),
  }),
  isAnonymized: z.boolean(),
  gdprConsent: z.boolean().optional(),
  processed: z.boolean(),
  isValid: z.boolean(),
})

// Quality check implementations
export class DataQualityChecker {
  private checks: Map<string, QualityCheck> = new Map()

  constructor() {
    this.registerDefaultChecks()
  }

  private registerDefaultChecks() {
    // Completeness checks
    this.addCheck({
      name: 'field_completeness',
      description: 'Checks for missing required fields',
      weight: 0.25,
      execute: async (data: any) => {
        const requiredFields = this.getRequiredFields(data)
        const missingFields = requiredFields.filter(field => 
          data[field] === undefined || data[field] === null || data[field] === ''
        )
        
        const score = Math.max(0, 100 - (missingFields.length / requiredFields.length) * 100)
        
        return {
          passed: missingFields.length === 0,
          score,
          details: missingFields.length > 0 
            ? `Missing required fields: ${missingFields.join(', ')}`
            : 'All required fields present',
          suggestions: missingFields.length > 0 
            ? [`Fill in missing fields: ${missingFields.join(', ')}`]
            : []
        }
      }
    })

    // Accuracy checks
    this.addCheck({
      name: 'data_format',
      description: 'Validates data format and structure',
      weight: 0.20,
      execute: async (data: any) => {
        const errors: string[] = []
        let score = 100

        // Email format validation
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.push('Invalid email format')
          score -= 20
        }

        // URL format validation
        if (data.url && !/^https?:\/\/.+/.test(data.url)) {
          errors.push('Invalid URL format')
          score -= 20
        }

        // Date format validation
        if (data.createdAt && isNaN(Date.parse(data.createdAt))) {
          errors.push('Invalid date format')
          score -= 20
        }

        // UUID format validation
        if (data.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
          errors.push('Invalid UUID format')
          score -= 20
        }

        return {
          passed: errors.length === 0,
          score: Math.max(0, score),
          details: errors.length > 0 ? errors.join(', ') : 'All data formats valid',
          suggestions: errors.map(error => `Fix ${error.toLowerCase()}`)
        }
      }
    })

    // Consistency checks
    this.addCheck({
      name: 'temporal_consistency',
      description: 'Validates temporal relationships',
      weight: 0.15,
      execute: async (data: any) => {
        const errors: string[] = []
        let score = 100

        // Created before updated
        if (data.createdAt && data.updatedAt) {
          const created = new Date(data.createdAt)
          const updated = new Date(data.updatedAt)
          
          if (created > updated) {
            errors.push('Created date is after updated date')
            score -= 30
          }
        }

        // Expiration in future
        if (data.expiresAt) {
          const expires = new Date(data.expiresAt)
          const now = new Date()
          
          if (expires <= now) {
            errors.push('Expiration date is in the past')
            score -= 25
          }
        }

        // Video timestamp within duration
        if (data.timestamp && data.metadata?.duration) {
          if (data.timestamp.currentTime > data.metadata.duration) {
            errors.push('Video timestamp exceeds duration')
            score -= 20
          }
        }

        return {
          passed: errors.length === 0,
          score: Math.max(0, score),
          details: errors.length > 0 ? errors.join(', ') : 'All temporal relationships valid',
          suggestions: errors.map(error => `Fix ${error.toLowerCase()}`)
        }
      }
    })

    // Business rule validation
    this.addCheck({
      name: 'business_rules',
      description: 'Validates business logic constraints',
      weight: 0.20,
      execute: async (data: any) => {
        const errors: string[] = []
        let score = 100

        // Invitation role permissions
        if (data.role && data.permissions) {
          if (data.role === 'viewer' && data.permissions.canInviteOthers) {
            errors.push('Viewers cannot invite others')
            score -= 25
          }
          
          if (data.role === 'viewer' && data.permissions.canComment === false) {
            // This is actually OK, but might be unusual
          }
        }

        // Video file size limits
        if (data.fileSize && data.fileSize > 5 * 1024 * 1024 * 1024) {
          errors.push('File size exceeds 5GB limit')
          score -= 50
        }

        // Comment depth limits
        if (data.depth && data.depth > 5) {
          errors.push('Comment nesting too deep')
          score -= 30
        }

        // Tag limits
        if (data.tags && data.tags.length > 20) {
          errors.push('Too many tags (max 20)')
          score -= 15
        }

        return {
          passed: errors.length === 0,
          score: Math.max(0, score),
          details: errors.length > 0 ? errors.join(', ') : 'All business rules satisfied',
          suggestions: errors.map(error => `Fix ${error.toLowerCase()}`)
        }
      }
    })

    // Security validation
    this.addCheck({
      name: 'security_validation',
      description: 'Validates security constraints',
      weight: 0.20,
      execute: async (data: any) => {
        const errors: string[] = []
        let score = 100

        // XSS prevention in text fields
        const textFields = ['content', 'message', 'title', 'description']
        textFields.forEach(field => {
          if (data[field] && typeof data[field] === 'string') {
            if (/<script|javascript:|on\w+=/i.test(data[field])) {
              errors.push(`Potential XSS in ${field}`)
              score -= 40
            }
          }
        })

        // SQL injection patterns
        textFields.forEach(field => {
          if (data[field] && typeof data[field] === 'string') {
            if (/(union|select|insert|update|delete|drop|create|alter)\s+/i.test(data[field])) {
              errors.push(`Potential SQL injection in ${field}`)
              score -= 40
            }
          }
        })

        // Path traversal
        if (data.fileName && /\.\.\/|\.\.\\/.test(data.fileName)) {
          errors.push('Path traversal detected in file name')
          score -= 50
        }

        return {
          passed: errors.length === 0,
          score: Math.max(0, score),
          details: errors.length > 0 ? errors.join(', ') : 'No security issues detected',
          suggestions: errors.map(error => `Address ${error.toLowerCase()}`)
        }
      }
    })
  }

  addCheck(check: QualityCheck) {
    this.checks.set(check.name, check)
  }

  async validateEntity(entityType: string, data: any): Promise<ValidationResult> {
    const startTime = Date.now()
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Schema validation
    const schema = this.getSchemaForEntity(entityType)
    if (schema) {
      try {
        schema.parse(data)
      } catch (error: any) {
        if (error.errors) {
          errors.push(...error.errors.map((err: any) => ({
            field: err.path.join('.'),
            code: err.code,
            message: err.message,
            value: err.received,
            severity: 'high' as const,
            fixSuggestion: this.generateFixSuggestion(err)
          })))
        }
      }
    }

    // Quality checks
    const checkResults: QualityCheckResult[] = []
    for (const check of this.checks.values()) {
      try {
        const result = await check.execute(data)
        checkResults.push(result)

        if (!result.passed) {
          errors.push({
            field: 'data_quality',
            code: check.name,
            message: result.details,
            severity: this.getSeverityFromScore(result.score),
            fixSuggestion: result.suggestions?.[0]
          })
        }
      } catch (error: any) {
        errors.push({
          field: 'validation',
          code: 'check_error',
          message: `Quality check '${check.name}' failed: ${error.message}`,
          severity: 'medium'
        })
      }
    }

    // Calculate overall quality score
    const totalWeight = Array.from(this.checks.values()).reduce((sum, check) => sum + check.weight, 0)
    const weightedScore = checkResults.reduce((sum, result, index) => {
      const check = Array.from(this.checks.values())[index]
      return sum + (result.score * check.weight)
    }, 0)
    const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0

    const validationTime = Date.now() - startTime

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      score,
      metadata: {
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
        entityType,
        validationTime
      }
    }
  }

  async calculateDataQuality(data: any): Promise<DataQualityMetrics> {
    const checks = await Promise.all(Array.from(this.checks.values()).map(check => check.execute(data)))
    
    // Map check results to quality dimensions
    const completeness = checks.find(c => c.details.includes('completeness'))?.score || 100
    const accuracy = checks.find(c => c.details.includes('format'))?.score || 100
    const consistency = checks.find(c => c.details.includes('consistency'))?.score || 100
    const validity = checks.find(c => c.details.includes('business'))?.score || 100
    const uniqueness = 100 // TODO: Implement uniqueness checks
    const timeliness = 100 // TODO: Implement timeliness checks

    const overall = (completeness * 0.25 + accuracy * 0.20 + consistency * 0.15 + 
                    validity * 0.20 + uniqueness * 0.10 + timeliness * 0.10)

    return {
      completeness,
      accuracy,
      consistency,
      validity,
      uniqueness,
      timeliness,
      overall: Math.round(overall)
    }
  }

  private getSchemaForEntity(entityType: string): z.ZodSchema | null {
    const schemas: Record<string, z.ZodSchema> = {
      invitation: InvitationSchema,
      comment: CommentSchema,
      feedback: FeedbackSchema,
      video: VideoSchema,
      analytics_event: AnalyticsEventSchema
    }
    
    return schemas[entityType] || null
  }

  private getRequiredFields(data: any): string[] {
    // This would ideally come from schema definitions
    const baseRequired = ['id', 'createdAt']
    
    if (data.projectId !== undefined) baseRequired.push('projectId')
    if (data.authorId !== undefined) baseRequired.push('authorId')
    if (data.title !== undefined) baseRequired.push('title')
    if (data.content !== undefined) baseRequired.push('content')
    if (data.email !== undefined) baseRequired.push('email')
    
    return baseRequired
  }

  private generateFixSuggestion(error: any): string {
    const suggestions: Record<string, string> = {
      'invalid_type': 'Ensure field has correct data type',
      'invalid_string': 'Provide a valid string value',
      'invalid_email': 'Use format: user@domain.com',
      'invalid_date': 'Use ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ',
      'too_small': 'Increase value to meet minimum requirement',
      'too_big': 'Reduce value to meet maximum requirement',
      'invalid_enum_value': 'Use one of the allowed values'
    }
    
    return suggestions[error.code] || 'Please fix the validation error'
  }

  private getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score < 25) return 'critical'
    if (score < 50) return 'high'
    if (score < 75) return 'medium'
    return 'low'
  }
}

// Export singleton instance
export const dataQualityChecker = new DataQualityChecker()

// Utility functions
export function validateRequired<T>(value: T, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (value === undefined || value === null || value === '') {
    errors.push({
      field: fieldName,
      code: 'required',
      message: `${fieldName} is required`,
      severity: 'high',
      fixSuggestion: `Provide a value for ${fieldName}`
    })
  }
  
  return errors
}

export function validateRange(value: number, min: number, max: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (value < min || value > max) {
    errors.push({
      field: fieldName,
      code: 'out_of_range',
      message: `${fieldName} must be between ${min} and ${max}`,
      value,
      severity: 'medium',
      fixSuggestion: `Set ${fieldName} to a value between ${min} and ${max}`
    })
  }
  
  return errors
}

export function validateEmail(email: string, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: fieldName,
      code: 'invalid_email',
      message: 'Invalid email format',
      value: email,
      severity: 'medium',
      fixSuggestion: 'Use format: user@domain.com'
    })
  }
  
  return errors
}

export function validateTimestamp(timestamp: string, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (isNaN(Date.parse(timestamp))) {
    errors.push({
      field: fieldName,
      code: 'invalid_date',
      message: 'Invalid timestamp format',
      value: timestamp,
      severity: 'medium',
      fixSuggestion: 'Use ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ'
    })
  }
  
  return errors
}