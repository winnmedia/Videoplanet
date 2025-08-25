// AI 영상 기획 도메인 타입 정의

export interface StoryMetadata {
  title: string
  oneLiner: string
  toneAndManner: string[]
  genre: string[]
  target: string
  duration: string
  format: string
  tempo: 'fast' | 'normal' | 'slow'
  developmentMethod: 'hook-immersion-twist-bait' | 'classic-story' | 'inductive' | 'deductive' | 'documentary' | 'pixar-story'
  developmentIntensity: 'as-is' | 'moderate' | 'rich'
}

export interface StoryStage {
  id: string
  type: 'intro' | 'rising' | 'climax' | 'resolution'
  title: string
  summary: string
  content: string
  objective: string
  durationHint: string
  isEdited: boolean
  originalContent?: string
}

export interface ShotBreakdown {
  id: string
  stageId: string
  shotNumber: number
  title: string
  description: string
  shotType: string
  cameraMovement: string
  composition: string
  duration: number
  dialogue: string
  subtitle: string
  transition: string
  isEdited: boolean
  storyboardImage?: StoryboardImage
  insertShots: InsertShot[]
}

export interface StoryboardImage {
  id: string
  shotId: string
  imageUrl: string
  prompt: string
  style: string
  version: number
  generatedAt: string
  isActive: boolean
}

export interface InsertShot {
  id: string
  shotId: string
  purpose: 'information' | 'rhythm' | 'relationship' | 'detail'
  description: string
  cutDescription: string
  framing: string
  order: number
}

export interface VideoPlan {
  id: string
  projectId?: string
  userId: string
  metadata: StoryMetadata
  stages: StoryStage[]
  shots: ShotBreakdown[]
  status: 'draft' | 'story-generated' | 'shots-generated' | 'completed'
  createdAt: string
  updatedAt: string
  autoSavedAt: string
  version: number
}

export interface AIGenerationRequest {
  id: string
  planId: string
  type: 'story-stages' | 'shot-breakdown' | 'insert-shots' | 'storyboard-image'
  input: any
  output?: any
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
  retryCount: number
  createdAt: string
  completedAt?: string
}

export interface ExportRequest {
  id: string
  planId: string
  format: 'pdf' | 'json'
  status: 'pending' | 'processing' | 'success' | 'error'
  fileUrl?: string
  error?: string
  createdAt: string
  completedAt?: string
}

// Redux 상태 타입
export interface VideoPlanningState {
  currentPlan: VideoPlan | null
  plans: VideoPlan[]
  currentStep: number
  aiGenerations: Record<string, AIGenerationRequest>
  exports: Record<string, ExportRequest>
  isLoading: boolean
  error: string | null
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

// API 응답 타입
export interface GenerateStoryStagesResponse {
  stages: Omit<StoryStage, 'id' | 'isEdited' | 'originalContent'>[]
}

export interface GenerateShotBreakdownResponse {
  shots: Omit<ShotBreakdown, 'id' | 'isEdited' | 'storyboardImage' | 'insertShots'>[]
}

export interface GenerateInsertShotsResponse {
  insertShots: Omit<InsertShot, 'id' | 'shotId'>[]
}

export interface GenerateStoryboardResponse {
  image: {
    url: string
    prompt: string
    version: number
  }
}

export interface ExportPDFResponse {
  fileUrl: string
  fileName: string
}

// ======================
// AI 기획서 생성 관련 타입
// ======================

export interface AIGenerationPlanRequest {
  // 기본 정보
  concept: string
  purpose: string
  target: string
  duration: string
  budget?: string
  
  // 스타일 정보
  style: string[]
  tone: string[]
  keyMessages: string[]
  
  // 추가 정보
  requirements?: string
  preferences?: string
  
  // 메타데이터
  userId?: string
  projectId?: string
}

export interface ExecutiveSummary {
  title: string
  tagline: string
  objective: string
  targetAudience: string
  keyValue: string
}

export interface ConceptDevelopment {
  coreMessage: string
  narrativeApproach: string
  emotionalTone: string
  visualStyle: string
  brandAlignment: string
}

export interface ContentSection {
  name: string
  duration: string
  purpose: string
  keyContent: string
  visualElements: string[]
}

export interface ContentStructure {
  duration: string
  format: string
  sections: ContentSection[]
}

export interface ProductionPhase {
  timeline: string
  requirements: string[]
  stakeholders: string[]
}

export interface ProductionPlan {
  preProduction: ProductionPhase & {
    requirements: string[]
    stakeholders: string[]
  }
  production: {
    shootingDays: string
    locations: string[]
    equipment: string[]
    crew: string[]
  }
  postProduction: {
    editingTime: string
    specialEffects: string[]
    musicAndSound: string
    colorGrading: string
  }
}

export interface BudgetBreakdown {
  preProduction: string
  production: string
  postProduction: string
  contingency: string
}

export interface BudgetEstimate {
  totalBudget: string
  breakdown: BudgetBreakdown
}

export interface Deliverables {
  primaryVideo: string
  additionalAssets: string[]
  formats: string[]
  timeline: string
}

export interface SuccessMetrics {
  quantitative: string[]
  qualitative: string[]
  kpis: string[]
}

export interface RiskAssessment {
  potentialRisks: string[]
  mitigationStrategies: string[]
}

export interface VideoPlanContent {
  id: string
  executiveSummary: ExecutiveSummary
  conceptDevelopment: ConceptDevelopment
  contentStructure: ContentStructure
  productionPlan: ProductionPlan
  budgetEstimate: BudgetEstimate
  deliverables: Deliverables
  successMetrics: SuccessMetrics
  riskAssessment: RiskAssessment
  createdAt: string
  version: number
}

export interface AIGenerationPlanResponse {
  planContent: VideoPlanContent
  generationTime: number
  tokensUsed: number
  cached: boolean
}

// ======================
// 기획서 관리 타입
// ======================

export interface VideoPlanning {
  id: string
  userId: string
  projectId?: string
  
  // 기본 정보
  title: string
  description: string
  planType: 'ai-generated' | 'manual' | 'hybrid'
  status: 'draft' | 'in-review' | 'approved' | 'published' | 'archived'
  
  // AI 생성 콘텐츠
  originalRequest?: AIGenerationPlanRequest
  generatedContent?: VideoPlanContent
  
  // 사용자 편집 콘텐츠
  editedContent?: Partial<VideoPlanContent>
  editHistory: PlanEditHistory[]
  
  // 협업 정보
  collaborators: PlanCollaborator[]
  comments: PlanComment[]
  
  // 버전 관리
  version: number
  parentPlanId?: string
  
  // 메타데이터
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  lastEditedAt: string
  
  // 내보내기 이력
  exports: PlanExportHistory[]
}

export interface PlanEditHistory {
  id: string
  userId: string
  editType: 'content' | 'structure' | 'metadata'
  section: string
  previousValue: any
  newValue: any
  changeReason?: string
  timestamp: string
}

export interface PlanCollaborator {
  userId: string
  userName: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  invitedBy: string
  invitedAt: string
  lastActiveAt?: string
  permissions: string[]
}

export interface PlanComment {
  id: string
  userId: string
  userName: string
  content: string
  section?: string
  replyToId?: string
  isResolved: boolean
  createdAt: string
  updatedAt?: string
}

export interface PlanExportHistory {
  id: string
  format: 'pdf' | 'docx' | 'json' | 'html'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileUrl?: string
  downloadCount: number
  createdAt: string
  expiresAt?: string
}

// ======================
// Redux 상태 확장
// ======================

export interface VideoPlanningExtendedState extends VideoPlanningState {
  // 기획서 목록
  allPlans: VideoPlanning[]
  currentPlanning: VideoPlanning | null
  
  // 필터링 및 검색
  filters: {
    status: string[]
    planType: string[]
    tags: string[]
    dateRange: {
      start: string | null
      end: string | null
    }
  }
  searchQuery: string
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'status'
  sortOrder: 'asc' | 'desc'
  
  // 페이지네이션
  pagination: {
    page: number
    limit: number
    total: number
  }
  
  // AI 생성 상태
  aiGeneration: {
    isGenerating: boolean
    progress: number
    currentStep: string
    error: string | null
  }
  
  // 협업 상태
  collaboration: {
    activeCollaborators: PlanCollaborator[]
    realtimeComments: PlanComment[]
    pendingInvitations: string[]
  }
  
  // 내보내기 상태
  exports: {
    pending: PlanExportHistory[]
    processing: PlanExportHistory[]
    completed: PlanExportHistory[]
  }
}

// ======================
// API 공통 타입
// ======================

export interface APIResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ======================
// 유틸리티 타입
// ======================

export type PlanStatus = VideoPlanning['status']
export type PlanType = VideoPlanning['planType']
export type CollaboratorRole = PlanCollaborator['role']
export type ExportFormat = PlanExportHistory['format']