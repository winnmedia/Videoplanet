/**
 * Storyboard Entity Public API
 * FSD 아키텍처의 Entity 레이어 Public API
 */

// 타입 정의 exports
export type {
  // 기본 타입들
  ToneOption,
  GenreOption,
  VideoFormat,
  TempoOption,
  NarrativeStyle,
  DevelopmentIntensity,
  StoryStage,
  ProjectStatus,
  
  // 구조 타입들
  StorySection,
  Shot,
  InsertShot,
  ContiImage,
  StoryboardProject,
  
  // 요청/응답 타입들
  LLMGenerationRequest,
  ImageGenerationRequest,
  PDFGenerationRequest,
  APIResponse,
  LLMGenerationResponse,
  ImageGenerationResponse,
  PDFGenerationResponse,
  
  // 헬퍼 타입들
  PartialStorySection,
  PartialShot,
  ShotsByStage,
  ProjectSummary,
  StoryboardFormData,
  
  // 기술적 타입들
  ShotType,
  CameraMovement,
  CameraAngle,
  Transition,
  ValidationRules
} from './model/types'

// Redux slice exports
export {
  // 액션들
  createNewProject,
  setCurrentStep,
  updateStorySection,
  resetStorySection,
  updateShot,
  resetShot,
  setSelectedShot,
  updateContiImage,
  updateInsertShots,
  updateProjectStatus,
  clearError,
  clearGenerationError,
  addToCache,
  clearCache,
  
  // 비동기 액션들
  generateFourStageStory,
  generateTwelveShots,
  generateContiImage,
  generateInsertShots,
  generatePDF,
  saveProject,
  loadProject,
  
  // 선택자들
  selectCurrentProject,
  selectCurrentStep,
  selectIsLoading,
  selectError,
  selectIsGenerating,
  selectSelectedShotId,
  selectStorySections,
  selectShots,
  selectShotsByStage,
  selectSelectedShot,
  selectProjectProgress,
  selectGenerationErrors
} from './model/storyboard.slice'

// 상수들
export { STORYBOARD_CONSTANTS } from './model/types'

// 에러 클래스들
export {
  StoryboardError,
  LLMGenerationError,
  ImageGenerationError,
  PDFGenerationError
} from './model/types'