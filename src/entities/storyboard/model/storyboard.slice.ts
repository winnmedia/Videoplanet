/**
 * 스토리보드 Redux Toolkit Slice
 * AI 영상 기획 시스템 상태 관리
 */

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/shared/lib/store'
import type {
  StoryboardProject,
  StorySection,
  Shot,
  InsertShot,
  ContiImage,
  LLMGenerationRequest,
  ImageGenerationRequest,
  PDFGenerationRequest,
  ProjectStatus,
  StoryStage,
  PartialStorySection,
  PartialShot,
  ProjectSummary
} from './types'

// ============================
// 1. 초기 상태 인터페이스
// ============================

interface StoryboardState {
  // 현재 프로젝트
  currentProject: StoryboardProject | null
  
  // 프로젝트 목록
  projects: ProjectSummary[]
  
  // UI 상태
  isLoading: boolean
  currentStep: 1 | 2 | 3
  selectedShotId: string | null
  
  // 생성 상태
  isGenerating: {
    fourStage: boolean
    twelveShots: boolean
    contiImage: boolean
    insertShots: boolean
    pdf: boolean
  }
  
  // 에러 상태
  error: string | null
  generationErrors: {
    [shotId: string]: string
  }
  
  // 편집 상태
  editHistory: {
    [projectId: string]: {
      sections: StorySection[]
      shots: Shot[]
      timestamp: Date
    }[]
  }
  
  // 캐시
  generationCache: {
    [hash: string]: any
  }
}

// 초기 상태
const initialState: StoryboardState = {
  currentProject: null,
  projects: [],
  isLoading: false,
  currentStep: 1,
  selectedShotId: null,
  isGenerating: {
    fourStage: false,
    twelveShots: false,
    contiImage: false,
    insertShots: false,
    pdf: false
  },
  error: null,
  generationErrors: {},
  editHistory: {},
  generationCache: {}
}

// ============================
// 2. 비동기 액션들 (Thunks)
// ============================

/** 4단계 스토리 생성 */
export const generateFourStageStory = createAsyncThunk(
  'storyboard/generateFourStageStory',
  async (request: LLMGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, type: '4-stage' })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

/** 12개 숏트 생성 */
export const generateTwelveShots = createAsyncThunk(
  'storyboard/generateTwelveShots',
  async (request: LLMGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/ai/generate-shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, type: '12-shots' })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

/** 콘티 이미지 생성 */
export const generateContiImage = createAsyncThunk(
  'storyboard/generateContiImage',
  async (request: ImageGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { shotId: request.shotId, ...data }
    } catch (error) {
      return rejectWithValue({
        shotId: request.shotId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/** 인서트 샷 생성 */
export const generateInsertShots = createAsyncThunk(
  'storyboard/generateInsertShots',
  async (request: LLMGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/ai/generate-inserts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, type: 'insert-shots' })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { shotId: request.targetShotId!, ...data }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

/** PDF 생성 */
export const generatePDF = createAsyncThunk(
  'storyboard/generatePDF',
  async (request: PDFGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

/** 프로젝트 저장 */
export const saveProject = createAsyncThunk(
  'storyboard/saveProject',
  async (project: StoryboardProject, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/projects', {
        method: project.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

/** 프로젝트 불러오기 */
export const loadProject = createAsyncThunk(
  'storyboard/loadProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error')
    }
  }
)

// ============================
// 3. Slice 정의
// ============================

const storyboardSlice = createSlice({
  name: 'storyboard',
  initialState,
  reducers: {
    // 프로젝트 관리
    createNewProject: (state, action: PayloadAction<Partial<StoryboardProject>>) => {
      const newProject: StoryboardProject = {
        id: `project_${Date.now()}`,
        title: action.payload.title || '',
        storyline: action.payload.storyline || '',
        tones: action.payload.tones || [],
        genres: action.payload.genres || [],
        target: action.payload.target || '',
        duration: action.payload.duration || 60,
        format: action.payload.format || 'horizontal',
        tempo: action.payload.tempo || 'normal',
        narrativeStyle: action.payload.narrativeStyle || 'classic-four-act',
        developmentIntensity: action.payload.developmentIntensity || 'moderate',
        storySection: [],
        shots: [],
        status: 'draft',
        currentStep: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        generationHistory: []
      }
      
      state.currentProject = newProject
      state.currentStep = 1
      state.error = null
    },
    
    // 단계 관리
    setCurrentStep: (state, action: PayloadAction<1 | 2 | 3>) => {
      state.currentStep = action.payload
      if (state.currentProject) {
        state.currentProject.currentStep = action.payload
      }
    },
    
    // 4단계 스토리 편집
    updateStorySection: (state, action: PayloadAction<PartialStorySection>) => {
      if (!state.currentProject) return
      
      const sectionIndex = state.currentProject.storySection.findIndex(
        section => section.id === action.payload.id
      )
      
      if (sectionIndex !== -1) {
        const section = state.currentProject.storySection[sectionIndex]
        
        // 편집 이력 저장
        if (!section.originalContent) {
          section.originalContent = { ...section }
        }
        
        // 업데이트
        state.currentProject.storySection[sectionIndex] = {
          ...section,
          ...action.payload,
          isEdited: true,
          editedAt: new Date()
        }
        
        state.currentProject.updatedAt = new Date()
      }
    },
    
    // 스토리 섹션 초기화 (되돌리기)
    resetStorySection: (state, action: PayloadAction<string>) => {
      if (!state.currentProject) return
      
      const sectionIndex = state.currentProject.storySection.findIndex(
        section => section.id === action.payload
      )
      
      if (sectionIndex !== -1) {
        const section = state.currentProject.storySection[sectionIndex]
        if (section.originalContent) {
          state.currentProject.storySection[sectionIndex] = {
            ...section.originalContent,
            isEdited: false,
            editedAt: undefined
          }
        }
      }
    },
    
    // 12개 숏트 편집
    updateShot: (state, action: PayloadAction<PartialShot>) => {
      if (!state.currentProject) return
      
      const shotIndex = state.currentProject.shots.findIndex(
        shot => shot.id === action.payload.id
      )
      
      if (shotIndex !== -1) {
        const shot = state.currentProject.shots[shotIndex]
        
        // 편집 이력 저장
        if (!shot.originalContent) {
          shot.originalContent = { ...shot }
        }
        
        // 업데이트
        state.currentProject.shots[shotIndex] = {
          ...shot,
          ...action.payload,
          isEdited: true,
          editedAt: new Date()
        }
        
        state.currentProject.updatedAt = new Date()
      }
    },
    
    // 샷 초기화 (되돌리기)
    resetShot: (state, action: PayloadAction<string>) => {
      if (!state.currentProject) return
      
      const shotIndex = state.currentProject.shots.findIndex(
        shot => shot.id === action.payload
      )
      
      if (shotIndex !== -1) {
        const shot = state.currentProject.shots[shotIndex]
        if (shot.originalContent) {
          state.currentProject.shots[shotIndex] = {
            ...shot.originalContent,
            isEdited: false,
            editedAt: undefined
          }
        }
      }
    },
    
    // 선택된 샷 관리
    setSelectedShot: (state, action: PayloadAction<string | null>) => {
      state.selectedShotId = action.payload
    },
    
    // 콘티 이미지 업데이트
    updateContiImage: (state, action: PayloadAction<{
      shotId: string
      contiImage: ContiImage
    }>) => {
      if (!state.currentProject) return
      
      const shotIndex = state.currentProject.shots.findIndex(
        shot => shot.id === action.payload.shotId
      )
      
      if (shotIndex !== -1) {
        state.currentProject.shots[shotIndex].contiImage = action.payload.contiImage
        state.currentProject.updatedAt = new Date()
      }
    },
    
    // 인서트 샷 업데이트
    updateInsertShots: (state, action: PayloadAction<{
      shotId: string
      insertShots: InsertShot[]
    }>) => {
      if (!state.currentProject) return
      
      const shotIndex = state.currentProject.shots.findIndex(
        shot => shot.id === action.payload.shotId
      )
      
      if (shotIndex !== -1) {
        state.currentProject.shots[shotIndex].insertShots = action.payload.insertShots
        state.currentProject.updatedAt = new Date()
      }
    },
    
    // 프로젝트 상태 업데이트
    updateProjectStatus: (state, action: PayloadAction<ProjectStatus>) => {
      if (state.currentProject) {
        state.currentProject.status = action.payload
        state.currentProject.updatedAt = new Date()
      }
    },
    
    // 에러 관리
    clearError: (state) => {
      state.error = null
    },
    
    clearGenerationError: (state, action: PayloadAction<string>) => {
      delete state.generationErrors[action.payload]
    },
    
    // 캐시 관리
    addToCache: (state, action: PayloadAction<{
      hash: string
      data: any
    }>) => {
      state.generationCache[action.payload.hash] = action.payload.data
    },
    
    clearCache: (state) => {
      state.generationCache = {}
    }
  },
  
  // ============================
  // 4. 비동기 액션 리듀서들
  // ============================
  extraReducers: (builder) => {
    // 4단계 스토리 생성
    builder
      .addCase(generateFourStageStory.pending, (state) => {
        state.isGenerating.fourStage = true
        state.error = null
      })
      .addCase(generateFourStageStory.fulfilled, (state, action) => {
        state.isGenerating.fourStage = false
        if (state.currentProject) {
          state.currentProject.storySection = action.payload.generatedContent as StorySection[]
          state.currentProject.generationHistory.push({
            step: 1,
            prompt: action.payload.prompt,
            response: action.payload.generatedContent,
            generatedAt: new Date()
          })
          state.currentProject.updatedAt = new Date()
          state.currentStep = 2
          state.currentProject.currentStep = 2
        }
      })
      .addCase(generateFourStageStory.rejected, (state, action) => {
        state.isGenerating.fourStage = false
        state.error = action.payload as string
      })
    
    // 12개 숏트 생성
    builder
      .addCase(generateTwelveShots.pending, (state) => {
        state.isGenerating.twelveShots = true
        state.error = null
      })
      .addCase(generateTwelveShots.fulfilled, (state, action) => {
        state.isGenerating.twelveShots = false
        if (state.currentProject) {
          state.currentProject.shots = action.payload.generatedContent as Shot[]
          state.currentProject.generationHistory.push({
            step: 2,
            prompt: action.payload.prompt,
            response: action.payload.generatedContent,
            generatedAt: new Date()
          })
          state.currentProject.updatedAt = new Date()
          state.currentStep = 3
          state.currentProject.currentStep = 3
        }
      })
      .addCase(generateTwelveShots.rejected, (state, action) => {
        state.isGenerating.twelveShots = false
        state.error = action.payload as string
      })
    
    // 콘티 이미지 생성
    builder
      .addCase(generateContiImage.pending, (state) => {
        state.isGenerating.contiImage = true
      })
      .addCase(generateContiImage.fulfilled, (state, action) => {
        state.isGenerating.contiImage = false
        if (state.currentProject) {
          const shotIndex = state.currentProject.shots.findIndex(
            shot => shot.id === action.payload.shotId
          )
          if (shotIndex !== -1) {
            state.currentProject.shots[shotIndex].contiImage = {
              id: action.payload.imageId,
              url: action.payload.url,
              filename: action.payload.filename,
              version: action.payload.version,
              prompt: action.payload.prompt,
              style: 'storyboard pencil sketch, rough, monochrome',
              generatedAt: action.payload.generatedAt,
              isDownloaded: false
            }
          }
        }
        // 성공 시 에러 제거
        delete state.generationErrors[action.payload.shotId]
      })
      .addCase(generateContiImage.rejected, (state, action) => {
        state.isGenerating.contiImage = false
        const payload = action.payload as { shotId: string; error: string }
        state.generationErrors[payload.shotId] = payload.error
      })
    
    // 인서트 샷 생성
    builder
      .addCase(generateInsertShots.pending, (state) => {
        state.isGenerating.insertShots = true
      })
      .addCase(generateInsertShots.fulfilled, (state, action) => {
        state.isGenerating.insertShots = false
        if (state.currentProject) {
          const shotIndex = state.currentProject.shots.findIndex(
            shot => shot.id === action.payload.shotId
          )
          if (shotIndex !== -1) {
            state.currentProject.shots[shotIndex].insertShots = action.payload.generatedContent as InsertShot[]
          }
        }
      })
      .addCase(generateInsertShots.rejected, (state, action) => {
        state.isGenerating.insertShots = false
        state.error = action.payload as string
      })
    
    // PDF 생성
    builder
      .addCase(generatePDF.pending, (state) => {
        state.isGenerating.pdf = true
        state.error = null
      })
      .addCase(generatePDF.fulfilled, (state, action) => {
        state.isGenerating.pdf = false
        // PDF 생성 성공 - 다운로드 링크는 컴포넌트에서 처리
      })
      .addCase(generatePDF.rejected, (state, action) => {
        state.isGenerating.pdf = false
        state.error = action.payload as string
      })
    
    // 프로젝트 저장
    builder
      .addCase(saveProject.fulfilled, (state, action) => {
        state.currentProject = action.payload
        // 프로젝트 목록 업데이트
        const existingIndex = state.projects.findIndex(p => p.id === action.payload.id)
        const summary: ProjectSummary = {
          id: action.payload.id,
          title: action.payload.title,
          status: action.payload.status,
          updatedAt: action.payload.updatedAt,
          currentStep: action.payload.currentStep
        }
        
        if (existingIndex !== -1) {
          state.projects[existingIndex] = summary
        } else {
          state.projects.unshift(summary)
        }
      })
    
    // 프로젝트 불러오기
    builder
      .addCase(loadProject.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loadProject.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProject = action.payload
        state.currentStep = action.payload.currentStep
      })
      .addCase(loadProject.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

// ============================
// 5. 선택자들 (Selectors)
// ============================

// 기본 선택자들
export const selectCurrentProject = (state: RootState) => state.storyboard.currentProject
export const selectCurrentStep = (state: RootState) => state.storyboard.currentStep
export const selectIsLoading = (state: RootState) => state.storyboard.isLoading
export const selectError = (state: RootState) => state.storyboard.error
export const selectIsGenerating = (state: RootState) => state.storyboard.isGenerating
export const selectSelectedShotId = (state: RootState) => state.storyboard.selectedShotId

// 메모이제이션된 복합 선택자들
export const selectStorySections = createSelector(
  [selectCurrentProject],
  (project) => project?.storySection || []
)

export const selectShots = createSelector(
  [selectCurrentProject],
  (project) => project?.shots || []
)

export const selectShotsByStage = createSelector(
  [selectShots],
  (shots): Record<StoryStage, Shot[]> => {
    return shots.reduce((acc, shot) => {
      if (!acc[shot.storyStage]) {
        acc[shot.storyStage] = []
      }
      acc[shot.storyStage].push(shot)
      return acc
    }, {} as Record<StoryStage, Shot[]>)
  }
)

export const selectSelectedShot = createSelector(
  [selectShots, selectSelectedShotId],
  (shots, selectedId) => selectedId ? shots.find(shot => shot.id === selectedId) : null
)

export const selectProjectProgress = createSelector(
  [selectCurrentProject],
  (project) => {
    if (!project) return { total: 0, completed: 0, percentage: 0 }
    
    const storyCompleted = project.storySection.length === 4 ? 1 : 0
    const shotsCompleted = project.shots.length === 12 ? 1 : 0
    const contiCompleted = project.shots.filter(shot => shot.contiImage).length
    
    const total = 14 // 4개 스토리 + 12개 샷
    const completed = storyCompleted + shotsCompleted + (contiCompleted / 12)
    
    return {
      total,
      completed: Math.round(completed * 100) / 100,
      percentage: Math.round((completed / total) * 100)
    }
  }
)

export const selectGenerationErrors = createSelector(
  [(state: RootState) => state.storyboard.generationErrors],
  (errors) => errors
)

// ============================
// 6. 액션 및 리듀서 내보내기
// ============================

export const {
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
  clearCache
} = storyboardSlice.actions

export default storyboardSlice.reducer