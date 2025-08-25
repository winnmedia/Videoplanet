/**
 * Video Planning Entity Types
 * 
 * Schema-first design for video planning workflow with collaboration and versioning
 * Following FSD architecture principles for entity layer
 */

export type PlanStatus = 
  | 'draft'        // 초안
  | 'in_progress'  // 작업 중
  | 'review'       // 검토 중
  | 'approved'     // 승인됨
  | 'rejected'     // 거부됨
  | 'completed'    // 완료
  | 'archived'     // 보관됨

export type PlanType = 
  | 'commercial'   // 광고/홍보영상
  | 'content'      // 콘텐츠 영상
  | 'tutorial'     // 튜토리얼
  | 'documentary'  // 다큐멘터리
  | 'event'        // 이벤트 영상
  | 'corporate'    // 기업 홍보
  | 'educational'  // 교육 콘텐츠
  | 'entertainment' // 엔터테인먼트
  | 'other'        // 기타

export type PlanPriority = 'low' | 'normal' | 'high' | 'urgent'

export type CollaboratorRole = 
  | 'owner'        // 소유자 (모든 권한)
  | 'editor'       // 편집자 (편집 권한)
  | 'reviewer'     // 검토자 (댓글/승인 권한)
  | 'viewer'       // 뷰어 (읽기 권한만)

export type SectionType = 
  | 'concept'      // 컨셉
  | 'target'       // 타겟 분석
  | 'story'        // 스토리/시나리오
  | 'storyboard'   // 스토리보드
  | 'production'   // 제작 계획
  | 'budget'       // 예산
  | 'schedule'     // 스케줄
  | 'team'         // 팀 구성
  | 'equipment'    // 장비 목록
  | 'location'     // 촬영 장소
  | 'reference'    // 레퍼런스
  | 'notes'        // 기타 메모
  | 'custom'       // 사용자 정의

export interface PlanSection {
  id: string
  type: SectionType
  title: string
  content: string
  order: number
  isRequired: boolean
  isVisible: boolean
  metadata?: {
    wordCount?: number
    characterCount?: number
    estimatedReadTime?: number
    lastEditedBy?: number
    lastEditedAt?: string
    formatting?: {
      fontSize?: number
      fontFamily?: string
      textAlign?: 'left' | 'center' | 'right' | 'justify'
      backgroundColor?: string
      textColor?: string
    }
  }
  attachments?: PlanAttachment[]
  comments?: PlanComment[]
}

export interface PlanAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  mimeType: string
  uploadedBy: number
  uploadedAt: string
  description?: string
  thumbnailUrl?: string
  isReference: boolean
}

export interface PlanComment {
  id: string
  content: string
  authorId: number
  authorName: string
  authorAvatar?: string
  createdAt: string
  updatedAt?: string
  isResolved: boolean
  resolvedBy?: number
  resolvedAt?: string
  parentId?: string // for nested comments
  reactions?: {
    type: 'like' | 'agree' | 'disagree' | 'idea' | 'question'
    count: number
    users: number[]
  }[]
  mentions?: {
    userId: number
    userName: string
    position: number
  }[]
}

export interface PlanCollaborator {
  userId: number
  userName: string
  userEmail: string
  userAvatar?: string
  role: CollaboratorRole
  permissions: {
    canEdit: boolean
    canComment: boolean
    canApprove: boolean
    canInvite: boolean
    canDelete: boolean
    canExport: boolean
  }
  invitedBy: number
  invitedAt: string
  joinedAt?: string
  lastActiveAt?: string
  notificationSettings: {
    onEdit: boolean
    onComment: boolean
    onApproval: boolean
    onMention: boolean
    emailNotifications: boolean
  }
}

export interface PlanVersion {
  id: string
  planId: string
  version: number
  title: string
  description?: string
  createdBy: number
  createdAt: string
  sections: PlanSection[]
  changeLog: {
    action: 'created' | 'updated' | 'deleted' | 'restored'
    target: 'plan' | 'section' | 'attachment' | 'comment'
    targetId: string
    description: string
    userId: number
    timestamp: string
    diff?: {
      before?: any
      after?: any
    }
  }[]
  isSnapshot: boolean // true for auto-saved versions
  isPublished: boolean
  publishedAt?: string
  tags?: string[]
}

export interface PlanTemplate {
  id: string
  name: string
  description: string
  type: PlanType
  category: string
  thumbnailUrl?: string
  sections: Omit<PlanSection, 'id' | 'content' | 'comments'>[]
  isPublic: boolean
  isOfficial: boolean // Created by VideoPlanet team
  createdBy: number
  createdAt: string
  updatedAt: string
  usageCount: number
  rating: {
    average: number
    count: number
    breakdown: {
      5: number
      4: number
      3: number
      2: number
      1: number
    }
  }
  tags: string[]
  language: string
  industry?: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
}

export interface VideoPlan {
  id: string
  projectId?: number
  title: string
  description?: string
  type: PlanType
  status: PlanStatus
  priority: PlanPriority
  
  // Content structure
  sections: PlanSection[]
  templateId?: string
  templateName?: string
  
  // Versioning
  currentVersion: number
  versions: PlanVersion[]
  
  // Collaboration
  collaborators: PlanCollaborator[]
  shareSettings: {
    isPublic: boolean
    allowComments: boolean
    allowDownload: boolean
    allowCopy: boolean
    passwordProtected: boolean
    password?: string
    expiresAt?: string
    shareLinkId?: string
  }
  
  // Metadata
  createdBy: number
  createdAt: string
  updatedBy: number
  updatedAt: string
  publishedAt?: string
  completedAt?: string
  approvedBy?: number
  approvedAt?: string
  
  // Analytics
  analytics: {
    views: number
    uniqueViews: number
    comments: number
    collaborators: number
    versions: number
    averageSessionTime: number
    lastViewedAt?: string
    popularSections: {
      sectionId: string
      viewCount: number
      timeSpent: number
    }[]
  }
  
  // Production connection
  productionInfo?: {
    videoId?: string
    productionStartDate?: string
    productionEndDate?: string
    budget?: {
      estimated: number
      actual?: number
      currency: string
    }
    team?: {
      director?: string
      producer?: string
      cinematographer?: string
      editor?: string
      other?: Record<string, string>
    }
    equipment?: string[]
    locations?: string[]
    schedule?: {
      preProduction: string
      production: string
      postProduction: string
      delivery: string
    }
  }
  
  // Export and integration
  exports: {
    id: string
    format: 'pdf' | 'docx' | 'markdown' | 'json'
    exportedBy: number
    exportedAt: string
    downloadUrl: string
    expiresAt: string
    settings: {
      includeSections: string[]
      includeComments: boolean
      includeAttachments: boolean
      includeVersionHistory: boolean
    }
  }[]
  
  // Settings
  settings: {
    autoSave: boolean
    autoSaveInterval: number // in seconds
    notifications: {
      email: boolean
      browser: boolean
      slack?: string
    }
    privacy: {
      showLastEditor: boolean
      showViewHistory: boolean
      allowSearch: boolean
    }
  }
  
  // Tags and categorization
  tags: string[]
  customFields: Record<string, any>
  
  // AI assistance
  aiSuggestions?: {
    contentSuggestions: {
      sectionId: string
      suggestions: string[]
      confidence: number
      appliedAt?: string
    }[]
    templateRecommendations: {
      templateId: string
      templateName: string
      matchScore: number
      reasons: string[]
    }[]
    completionScore: {
      overall: number
      bySections: Record<string, number>
      missingElements: string[]
      recommendations: string[]
    }
  }
}

export interface PlanFilters {
  projectId?: number
  createdBy?: number
  status?: PlanStatus[]
  type?: PlanType[]
  priority?: PlanPriority[]
  collaborators?: number[]
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
  search?: string
  templateId?: string
  hasComments?: boolean
  isShared?: boolean
}

export interface PlanSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status' | 'type'
  direction: 'asc' | 'desc'
}

export interface PlanListResponse {
  plans: VideoPlan[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  filters?: PlanFilters
  sort?: PlanSortOptions
}

export interface PlanStats {
  totalPlans: number
  plansByStatus: Record<PlanStatus, number>
  plansByType: Record<PlanType, number>
  plansByPriority: Record<PlanPriority, number>
  
  collaborationStats: {
    totalCollaborators: number
    averageCollaboratorsPerPlan: number
    totalComments: number
    averageCommentsPerPlan: number
  }
  
  productivityStats: {
    plansCreatedThisWeek: number
    plansCompletedThisWeek: number
    averageCompletionTime: number // in hours
    mostUsedTemplates: {
      templateId: string
      templateName: string
      usageCount: number
    }[]
    mostActivePlans: {
      planId: string
      planTitle: string
      activityScore: number
    }[]
  }
  
  timeRange: {
    from: string
    to: string
  }
}

// Real-time Events for WebSocket
export interface PlanEvent {
  type: 'plan_created' | 'plan_updated' | 'plan_deleted' | 'section_updated' | 
        'comment_added' | 'comment_resolved' | 'collaborator_joined' | 
        'version_created' | 'plan_approved' | 'plan_exported'
  planId: string
  userId: number
  data: Partial<VideoPlan>
  timestamp: string
  metadata?: Record<string, any>
}

// API Request/Response Types
export interface CreatePlanRequest {
  projectId?: number
  title: string
  description?: string
  type: PlanType
  templateId?: string
  priority?: PlanPriority
  collaborators?: {
    userId: number
    role: CollaboratorRole
  }[]
  tags?: string[]
  customFields?: Record<string, any>
}

export interface UpdatePlanRequest {
  title?: string
  description?: string
  status?: PlanStatus
  priority?: PlanPriority
  sections?: Partial<PlanSection>[]
  shareSettings?: Partial<VideoPlan['shareSettings']>
  tags?: string[]
  customFields?: Record<string, any>
}

export interface CreateTemplateRequest {
  name: string
  description: string
  type: PlanType
  category: string
  sections: Omit<PlanSection, 'id' | 'content' | 'comments'>[]
  isPublic: boolean
  tags: string[]
  language: string
  industry?: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
}

// Validation Rules
export interface PlanValidationRule {
  field: keyof VideoPlan | keyof CreatePlanRequest
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  message: string
  value?: any
  validator?: (value: any, plan: Partial<VideoPlan>) => boolean
}

export const PLAN_VALIDATION_RULES: PlanValidationRule[] = [
  {
    field: 'title',
    type: 'required',
    message: '기획서 제목은 필수입니다'
  },
  {
    field: 'title',
    type: 'minLength',
    value: 2,
    message: '제목은 최소 2글자 이상이어야 합니다'
  },
  {
    field: 'title',
    type: 'maxLength',
    value: 100,
    message: '제목은 100글자를 초과할 수 없습니다'
  },
  {
    field: 'type',
    type: 'required',
    message: '기획서 타입을 선택해주세요'
  }
]

// Constants
export const PLAN_DEFAULTS = {
  STATUS: 'draft' as PlanStatus,
  TYPE: 'content' as PlanType,
  PRIORITY: 'normal' as PlanPriority,
  PAGE_SIZE: 20,
  AUTO_SAVE_INTERVAL: 30, // seconds
  MAX_COLLABORATORS: 50,
  MAX_VERSIONS: 100,
  MAX_SECTIONS: 50,
  MAX_ATTACHMENTS_PER_SECTION: 10,
  SETTINGS: {
    autoSave: true,
    autoSaveInterval: 30,
    notifications: {
      email: true,
      browser: true
    },
    privacy: {
      showLastEditor: true,
      showViewHistory: false,
      allowSearch: true
    }
  }
} as const

export const PLAN_LIMITS = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_SECTION_CONTENT_LENGTH: 50000,
  MAX_COMMENT_LENGTH: 2000,
  MAX_TAGS: 20,
  MAX_ATTACHMENTS: 100,
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MIN_TITLE_LENGTH: 2,
  MIN_SECTIONS: 1
} as const

export const SECTION_TEMPLATES: Record<SectionType, {
  title: string
  placeholder: string
  isRequired: boolean
  order: number
  description: string
}> = {
  concept: {
    title: '컨셉',
    placeholder: '영상의 핵심 컨셉과 메시지를 작성하세요...',
    isRequired: true,
    order: 1,
    description: '영상의 전반적인 컨셉과 핵심 메시지를 정의합니다'
  },
  target: {
    title: '타겟 분석',
    placeholder: '타겟 오디언스와 페르소나를 분석하세요...',
    isRequired: true,
    order: 2,
    description: '타겟 오디언스의 특성과 니즈를 분석합니다'
  },
  story: {
    title: '스토리/시나리오',
    placeholder: '영상의 스토리라인과 시나리오를 작성하세요...',
    isRequired: true,
    order: 3,
    description: '영상의 전체 스토리와 흐름을 구성합니다'
  },
  storyboard: {
    title: '스토리보드',
    placeholder: '장면별 구성과 연출 계획을 작성하세요...',
    isRequired: false,
    order: 4,
    description: '시각적 구성과 장면 전환을 계획합니다'
  },
  production: {
    title: '제작 계획',
    placeholder: '제작 방식과 워크플로우를 계획하세요...',
    isRequired: false,
    order: 5,
    description: '제작 방식과 전체 워크플로우를 계획합니다'
  },
  budget: {
    title: '예산',
    placeholder: '제작 예산과 비용 구성을 작성하세요...',
    isRequired: false,
    order: 6,
    description: '제작에 필요한 예산과 비용을 계획합니다'
  },
  schedule: {
    title: '스케줄',
    placeholder: '제작 일정과 마일스톤을 계획하세요...',
    isRequired: false,
    order: 7,
    description: '제작 일정과 주요 마일스톤을 관리합니다'
  },
  team: {
    title: '팀 구성',
    placeholder: '제작팀 구성과 역할을 정의하세요...',
    isRequired: false,
    order: 8,
    description: '제작에 참여할 팀원과 역할을 정의합니다'
  },
  equipment: {
    title: '장비 목록',
    placeholder: '필요한 촬영 장비와 도구를 나열하세요...',
    isRequired: false,
    order: 9,
    description: '촬영과 제작에 필요한 장비를 계획합니다'
  },
  location: {
    title: '촬영 장소',
    placeholder: '촬영 장소와 세팅 정보를 작성하세요...',
    isRequired: false,
    order: 10,
    description: '촬영 장소와 환경을 계획합니다'
  },
  reference: {
    title: '레퍼런스',
    placeholder: '참고 자료와 영감을 얻은 콘텐츠를 추가하세요...',
    isRequired: false,
    order: 11,
    description: '참고할 만한 자료와 레퍼런스를 수집합니다'
  },
  notes: {
    title: '기타 메모',
    placeholder: '추가적인 메모와 아이디어를 작성하세요...',
    isRequired: false,
    order: 12,
    description: '기타 메모와 아이디어를 기록합니다'
  },
  custom: {
    title: '사용자 정의',
    placeholder: '사용자 정의 섹션 내용을 작성하세요...',
    isRequired: false,
    order: 99,
    description: '필요에 따라 추가한 사용자 정의 섹션입니다'
  }
} as const

export const TEMPLATE_CATEGORIES = [
  '광고/마케팅',
  '교육/튜토리얼',
  '기업 홍보',
  '엔터테인먼트',
  '뉴스/다큐멘터리',
  '이벤트',
  '소셜미디어',
  '기타'
] as const

export const PLAN_INDUSTRIES = [
  '테크/IT',
  '헬스케어',
  '교육',
  '금융',
  '리테일',
  'F&B',
  '여행/관광',
  '패션/뷰티',
  '게임/엔터',
  '부동산',
  '제조업',
  '기타'
] as const