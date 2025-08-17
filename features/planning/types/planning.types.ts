// ==========================================================================
// Planning Types - VideoPlanet AI 영상 기획 모듈
// ==========================================================================

// ====== 기본 프로젝트 타입 ======
export interface PlanningProject {
  id?: string
  title: string
  genre: string
  target_audience: string
  tone_manner: string
  duration: string
  budget: string
  purpose: string
  story_structure: string
  development_level: string
  story_content?: string
  shots?: Shot[]
  storyboard?: Storyboard
  created_at?: string
  updated_at?: string
  user_id?: string
  status?: ProjectStatus
}

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

// ====== 장르 및 설정 타입 ======
export type GenreType = 
  | 'drama' 
  | 'documentary' 
  | 'commercial' 
  | 'music_video' 
  | 'educational' 
  | 'corporate' 
  | 'event' 
  | 'social'

export type AudienceType = 
  | 'teens' 
  | 'twenties' 
  | 'thirties' 
  | 'forties' 
  | 'fifties_plus' 
  | 'general' 
  | 'business' 
  | 'professionals'

export type ToneType = 
  | 'bright' 
  | 'serious' 
  | 'funny' 
  | 'emotional' 
  | 'energetic' 
  | 'calm' 
  | 'mysterious' 
  | 'trendy'

export type DurationType = 
  | '30sec' 
  | '1min' 
  | '3min' 
  | '5min' 
  | '10min' 
  | '30min' 
  | 'custom'

export type BudgetType = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'unlimited'

export type PurposeType = 
  | 'branding' 
  | 'education' 
  | 'entertainment' 
  | 'information' 
  | 'promotion' 
  | 'recruitment' 
  | 'portfolio' 
  | 'documentation'

// ====== 스토리 구조 타입 ======
export type StoryStructureType = 
  | 'deductive' 
  | 'inductive' 
  | 'conflict_resolution' 
  | 'hero_journey'

export type DevelopmentLevelType = 
  | 'simple' 
  | 'normal' 
  | 'detailed'

export interface StorySettings {
  genre: GenreType
  target_audience: AudienceType
  tone_manner: ToneType
  duration: DurationType
  budget: BudgetType
  purpose: PurposeType
}

export interface StoryDevelopment {
  story_structure: StoryStructureType
  development_level: DevelopmentLevelType
  story_content: string
  generated_at: string
  ai_model_used?: string
}

// ====== 숏 분할 타입 ======
export interface Shot {
  id: string
  sequence: number
  type: ShotType
  duration: string
  description: string
  camera_angle: CameraAngleType
  camera_movement: CameraMovementType
  audio: string
  props: string[]
  location: string
  lighting: LightingType
  notes: string
  timing_start?: string
  timing_end?: string
}

export type ShotType = 
  | 'establishing' 
  | 'wide' 
  | 'medium' 
  | 'close_up' 
  | 'extreme_close_up' 
  | 'over_shoulder' 
  | 'bird_eye' 
  | 'low_angle' 
  | 'high_angle' 
  | 'insert'

export type CameraAngleType = 
  | 'eye_level' 
  | 'low_angle' 
  | 'high_angle' 
  | 'bird_eye' 
  | 'worm_eye'

export type CameraMovementType = 
  | 'static' 
  | 'pan' 
  | 'tilt' 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'dolly_in' 
  | 'dolly_out' 
  | 'tracking' 
  | 'handheld' 
  | 'crane'

export type LightingType = 
  | 'natural' 
  | 'soft' 
  | 'hard' 
  | 'back_light' 
  | 'side_light' 
  | 'top_light' 
  | 'dramatic' 
  | 'flat'

// ====== 콘티보드 타입 ======
export interface Storyboard {
  id: string
  title: string
  frames: StoryboardFrame[]
  style: StoryboardStyleType
  created_at: string
  ai_generated: boolean
  total_duration?: string
}

export interface StoryboardFrame {
  id: string
  shotId: string
  sequence: number
  thumbnail: string
  description: string
  technical_notes: string
  timing: string
  duration: string
  ai_generated_image?: string
  manual_annotations?: string[]
}

export type StoryboardStyleType = 
  | 'realistic' 
  | 'cartoon' 
  | 'minimalist' 
  | 'detailed' 
  | 'sketch' 
  | 'wireframe'

// ====== PDF 출력 타입 ======
export interface PDFExportOptions {
  template: PDFTemplateType
  includeStoryboard: boolean
  includeShotDetails: boolean
  includeTimeline: boolean
  includeBudgetInfo: boolean
  includeContactInfo: boolean
  includeRevisionHistory: boolean
  watermark: boolean
  colorMode: 'color' | 'grayscale'
  pageSize: 'A4' | 'Letter'
  orientation: 'portrait' | 'landscape'
}

export type PDFTemplateType = 
  | 'complete' 
  | 'presentation' 
  | 'production' 
  | 'client'

export interface PDFExportResult {
  success: boolean
  fileName: string
  fileSize?: number
  downloadUrl?: string
  error?: string
}

// ====== AI 서비스 타입 ======
export interface AIGenerationRequest {
  type: 'story' | 'shots' | 'storyboard'
  input: PlanningProject
  options?: AIGenerationOptions
}

export interface AIGenerationOptions {
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro' | 'claude-3'
  temperature?: number
  max_tokens?: number
  style_preferences?: string[]
  custom_instructions?: string
}

export interface AIGenerationResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model_used?: string
  generation_time?: number
}

export interface StoryGenerationResponse extends AIGenerationResponse<StoryDevelopment> {}
export interface ShotGenerationResponse extends AIGenerationResponse<Shot[]> {}
export interface StoryboardGenerationResponse extends AIGenerationResponse<Storyboard> {}

// ====== API 응답 타입 ======
export interface PlanningApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface SaveProjectRequest {
  project: Partial<PlanningProject>
  auto_save?: boolean
}

export interface SaveProjectResponse extends PlanningApiResponse<PlanningProject> {}

export interface LoadProjectResponse extends PlanningApiResponse<PlanningProject[]> {}

// ====== 훅 상태 타입 ======
export interface PlanningState {
  currentProject: PlanningProject | null
  savedProjects: PlanningProject[]
  isLoading: boolean
  isGenerating: boolean
  currentStep: number
  completedSteps: number[]
  errors: Record<string, string>
  lastSaved?: string
}

export interface PlanningActions {
  createProject: (title: string) => void
  loadProject: (projectId: string) => Promise<void>
  saveProject: (project: Partial<PlanningProject>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  generateStory: (project: PlanningProject) => Promise<StoryDevelopment>
  generateShots: (project: PlanningProject) => Promise<Shot[]>
  generateStoryboard: (project: PlanningProject, style: StoryboardStyleType) => Promise<Storyboard>
  exportToPDF: (project: PlanningProject, options: PDFExportOptions) => Promise<PDFExportResult>
  setCurrentStep: (step: number) => void
  markStepCompleted: (step: number) => void
  clearErrors: () => void
  reset: () => void
}

// ====== 유틸리티 타입 ======
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: string[]
}

export interface ProjectStatistics {
  totalProjects: number
  completedProjects: number
  totalShots: number
  totalFrames: number
  avgProjectDuration: string
  mostUsedGenre: GenreType
  mostUsedTone: ToneType
}

// ====== 컴포넌트 Props 타입 ======
export interface PlanningWizardProps {
  initialProject?: PlanningProject | null
  onSave: (project: PlanningProject) => void
  onLoadingChange: (loading: boolean) => void
}

export interface StorySettingsProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
}

export interface StoryDevelopmentProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

export interface ShotBreakdownProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

export interface ContiGeneratorProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
  onLoadingChange: (loading: boolean) => void
}

export interface PDFExporterProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
}

// ====== 설정 및 상수 타입 ======
export interface PlanningConfig {
  aiService: {
    defaultModel: string
    apiEndpoint: string
    timeout: number
    retryAttempts: number
  }
  export: {
    defaultTemplate: PDFTemplateType
    maxFileSize: number
    supportedFormats: string[]
  }
  storage: {
    autoSaveInterval: number
    maxStoredProjects: number
    compressionLevel: number
  }
}

// ====== 이벤트 타입 ======
export type PlanningEventType = 
  | 'project_created'
  | 'project_saved'
  | 'project_loaded'
  | 'project_deleted'
  | 'story_generated'
  | 'shots_generated'
  | 'storyboard_generated'
  | 'pdf_exported'
  | 'step_completed'
  | 'error_occurred'

export interface PlanningEvent {
  type: PlanningEventType
  timestamp: string
  projectId?: string
  data?: any
  error?: string
}