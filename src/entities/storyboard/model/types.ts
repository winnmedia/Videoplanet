/**
 * 스토리보드 시스템 타입 정의
 * AI 영상 기획 시스템의 핵심 도메인 모델
 */

// ============================
// 1. 기본 메타데이터 타입들
// ============================

/** 톤앤매너 옵션 */
export type ToneOption = 
  | 'formal'        // 격식있는
  | 'casual'        // 친근한
  | 'professional'  // 전문적인
  | 'emotional'     // 감성적인
  | 'humorous'      // 유머러스한
  | 'serious'       // 진지한
  | 'energetic'     // 활기찬
  | 'calm'          // 차분한

/** 장르 옵션 */
export type GenreOption = 
  | 'commercial'    // 광고
  | 'documentary'   // 다큐멘터리
  | 'tutorial'      // 튜토리얼
  | 'entertainment' // 엔터테인먼트
  | 'news'          // 뉴스
  | 'corporate'     // 기업홍보
  | 'education'     // 교육
  | 'lifestyle'     // 라이프스타일

/** 비디오 포맷 */
export type VideoFormat = 
  | 'vertical'      // 세로형 (9:16)
  | 'horizontal'    // 가로형 (16:9)
  | 'square'        // 정사각형 (1:1)

/** 템포 설정 */
export type TempoOption = 
  | 'fast'          // 빠르게 (4-6초)
  | 'normal'        // 보통 (6-8초)
  | 'slow'          // 느리게 (8-12초)

/** 전개 방식 */
export type NarrativeStyle = 
  | 'hook-immersion-twist-cliffhanger'  // 훅-몰입-반전-떡밥
  | 'classic-four-act'                  // 클래식 기승전결
  | 'inductive'                         // 귀납법
  | 'deductive'                         // 연역법
  | 'documentary-interview'             // 다큐(인터뷰식)
  | 'pixar-storytelling'               // 픽사스토리

/** 전개 강도 */
export type DevelopmentIntensity = 
  | 'minimal'       // 그대로 (간결, 수식 최소)
  | 'moderate'      // 적당히 (균형 잡힌 묘사)
  | 'rich'          // 풍부하게 (감정·환경 묘사 확대)

// ============================
// 2. 4단계 스토리 구조 (기승전결)
// ============================

/** 스토리의 4단계 */
export type StoryStage = 'opening' | 'development' | 'climax' | 'resolution'

/** 각 단계의 내용 */
export interface StorySection {
  id: string
  stage: StoryStage
  title: string
  summary: string           // 요약
  content: string          // 본문
  objective: string        // 목표
  lengthHint: string      // 길이 힌트 (예: "20-25초")
  keyPoints: string[]     // 키포인트
  isEdited: boolean       // 사용자가 편집했는지
  originalContent?: string // 원본 AI 생성 내용 (되돌리기용)
  editedAt?: Date
}

// ============================
// 3. 12개 숏트 구조
// ============================

/** 샷 타입 */
export type ShotType = 
  | 'extreme-wide'      // 익스트림 와이드
  | 'wide'              // 와이드
  | 'medium-wide'       // 미디엄 와이드
  | 'medium'            // 미디엄
  | 'medium-close'      // 미디엄 클로즈
  | 'close-up'          // 클로즈업
  | 'extreme-close-up'  // 익스트림 클로즈업

/** 카메라 움직임 */
export type CameraMovement = 
  | 'static'            // 고정
  | 'pan-left'          // 팬 레프트
  | 'pan-right'         // 팬 라이트
  | 'tilt-up'           // 틸트 업
  | 'tilt-down'         // 틸트 다운
  | 'zoom-in'           // 줌인
  | 'zoom-out'          // 줌아웃
  | 'dolly-in'          // 돌리 인
  | 'dolly-out'         // 돌리 아웃
  | 'tracking'          // 트래킹

/** 구도/앵글 */
export type CameraAngle = 
  | 'eye-level'         // 아이레벨
  | 'high-angle'        // 하이앵글
  | 'low-angle'         // 로우앵글
  | 'bird-eye'          // 버드아이
  | 'worm-eye'          // 웜아이

/** 전환 효과 */
export type Transition = 
  | 'cut'               // 컷
  | 'fade-in'           // 페이드인
  | 'fade-out'          // 페이드아웃
  | 'dissolve'          // 디졸브
  | 'wipe'              // 와이프
  | 'slide'             // 슬라이드

/** 인서트 샷 정보 */
export interface InsertShot {
  id: string
  purpose: 'information' | 'rhythm' | 'detail' | 'relationship' // 목적
  description: string     // 컷 설명
  framing: string        // 프레이밍 설명
  duration: number       // 길이 (초)
}

/** 콘티 이미지 정보 */
export interface ContiImage {
  id: string
  url: string
  filename: string
  version: number        // 재생성 버전
  prompt: string         // 생성에 사용된 프롬프트
  style: string         // 스타일 정보
  generatedAt: Date
  isDownloaded: boolean
}

/** 개별 숏트 정보 */
export interface Shot {
  id: string
  shotNumber: number     // 1-12
  storyStage: StoryStage // 어느 단계에 속하는지
  
  // 콘텐츠
  title: string
  description: string    // 서술
  dialogue?: string      // 대사
  subtitle?: string      // 자막
  voiceOver?: string     // 보이스오버
  
  // 기술적 정보
  shotType: ShotType
  cameraMovement: CameraMovement
  cameraAngle: CameraAngle
  duration: number       // 길이 (초)
  transition: Transition
  
  // 시각적 요소
  contiImage?: ContiImage   // 콘티 이미지
  insertShots: InsertShot[] // 인서트 샷 (최대 3개)
  
  // 메타데이터
  isEdited: boolean
  originalContent?: Partial<Shot> // 원본 내용 (되돌리기용)
  editedAt?: Date
}

// ============================
// 4. 전체 스토리보드 구조
// ============================

/** 프로젝트 상태 */
export type ProjectStatus = 
  | 'draft'             // 초안
  | 'in-progress'       // 진행중
  | 'review'            // 검토중
  | 'completed'         // 완료
  | 'archived'          // 보관

/** 스토리보드 프로젝트 */
export interface StoryboardProject {
  id: string
  
  // 기본 정보
  title: string
  storyline: string      // 한 줄 스토리
  
  // 메타데이터
  tones: ToneOption[]    // 톤앤매너 (복수 선택 가능)
  genres: GenreOption[]  // 장르
  target: string         // 타겟 (자유 입력)
  duration: number       // 분량 (초)
  format: VideoFormat   // 포맷
  tempo: TempoOption    // 템포
  narrativeStyle: NarrativeStyle      // 전개 방식
  developmentIntensity: DevelopmentIntensity // 전개 강도
  
  // 구조
  storySection: StorySection[]        // 4단계 (기승전결)
  shots: Shot[]                       // 12개 숏트
  
  // 상태
  status: ProjectStatus
  currentStep: 1 | 2 | 3             // 현재 단계 (1: 입력, 2: 4단계, 3: 12숏트)
  
  // 메타데이터
  createdAt: Date
  updatedAt: Date
  version: number        // 자동 저장 버전
  tags: string[]         // 태그
  
  // AI 생성 이력
  generationHistory: {
    step: number
    prompt: string
    response: any
    generatedAt: Date
  }[]
}

// ============================
// 5. AI 생성 관련 타입들
// ============================

/** LLM 생성 요청 */
export interface LLMGenerationRequest {
  type: '4-stage' | '12-shots' | 'insert-shots'
  
  // 기본 입력
  title: string
  storyline: string
  
  // 메타데이터
  tones: ToneOption[]
  genres: GenreOption[]
  target: string
  duration: number
  format: VideoFormat
  tempo: TempoOption
  narrativeStyle: NarrativeStyle
  developmentIntensity: DevelopmentIntensity
  
  // 컨텍스트 (기존 생성물)
  existingStorySections?: StorySection[]
  existingShots?: Shot[]
  targetShotId?: string  // 인서트 샷 생성 시
}

/** Google 이미지 생성 요청 */
export interface ImageGenerationRequest {
  shotId: string
  prompt: string
  style: string          // "storyboard pencil sketch, rough, monochrome"
  negativePrompt: string // 제외할 요소들
  isRegeneration?: boolean
  previousVersion?: number
}

/** PDF 생성 요청 */
export interface PDFGenerationRequest {
  project: StoryboardProject
  includeContiImages: boolean
  layoutStyle: 'compact' | 'detailed'
  pageMargin: number     // 0 for no margin
}

// ============================
// 6. API 응답 타입들
// ============================

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LLMGenerationResponse {
  generatedContent: StorySection[] | Shot[] | InsertShot[]
  prompt: string
  tokensUsed: number
  generationTime: number
}

export interface ImageGenerationResponse {
  imageId: string
  url: string
  filename: string
  version: number
  prompt: string
  generatedAt: Date
}

export interface PDFGenerationResponse {
  pdfUrl: string
  filename: string
  fileSize: number
  pageCount: number
  generatedAt: Date
}

// ============================
// 7. 유틸리티 타입들
// ============================

/** 검증 규칙 */
export interface ValidationRules {
  title: {
    required: true
    minLength: 2
    maxLength: 100
  }
  storyline: {
    required: true
    minLength: 10
    maxLength: 500
  }
  duration: {
    required: true
    min: 15
    max: 300
  }
  // ... 기타 필드별 검증 규칙
}

/** 상수 정의 */
export const STORYBOARD_CONSTANTS = {
  MAX_SHOTS: 12,
  MAX_INSERTS_PER_SHOT: 3,
  DEFAULT_SHOT_DURATION: {
    fast: 5,      // 4-6초
    normal: 7,    // 6-8초
    slow: 10      // 8-12초
  },
  STAGE_DISTRIBUTION: {
    opening: 3,     // 1-3번 숏
    development: 3, // 4-6번 숏
    climax: 3,      // 7-9번 숏
    resolution: 3   // 10-12번 숏
  },
  PDF_CONFIG: {
    PAGE_SIZE: 'A4',
    ORIENTATION: 'landscape',
    MARGIN: 0
  }
} as const

/** 에러 타입들 */
export class StoryboardError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'StoryboardError'
  }
}

export class LLMGenerationError extends StoryboardError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_GENERATION_ERROR', details)
  }
}

export class ImageGenerationError extends StoryboardError {
  constructor(message: string, details?: any) {
    super(message, 'IMAGE_GENERATION_ERROR', details)
  }
}

export class PDFGenerationError extends StoryboardError {
  constructor(message: string, details?: any) {
    super(message, 'PDF_GENERATION_ERROR', details)
  }
}

// ============================
// 8. 헬퍼 타입들
// ============================

/** 부분 업데이트용 타입 */
export type PartialStorySection = Partial<StorySection> & Pick<StorySection, 'id'>
export type PartialShot = Partial<Shot> & Pick<Shot, 'id'>

/** 선택자용 타입 */
export type ShotsByStage = Record<StoryStage, Shot[]>
export type ProjectSummary = Pick<StoryboardProject, 'id' | 'title' | 'status' | 'updatedAt' | 'currentStep'>

/** Form 데이터 타입 */
export interface StoryboardFormData {
  title: string
  storyline: string
  tones: ToneOption[]
  genres: GenreOption[]
  target: string
  duration: number
  format: VideoFormat
  tempo: TempoOption
  narrativeStyle: NarrativeStyle
  developmentIntensity: DevelopmentIntensity
}