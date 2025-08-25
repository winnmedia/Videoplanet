import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { nanoid } from '@reduxjs/toolkit'
import type {
  VideoPlan,
  VideoPlanningState,
  StoryMetadata,
  StoryStage,
  ShotBreakdown,
  AIGenerationRequest,
  ExportRequest,
  GenerateStoryStagesResponse,
  GenerateShotBreakdownResponse,
  GenerateInsertShotsResponse,
  GenerateStoryboardResponse
} from './types'

// 비동기 액션들
export const generateStoryStages = createAsyncThunk(
  'videoPlanning/generateStoryStages',
  async (metadata: StoryMetadata) => {
    const response = await fetch('/api/ai/generate-story-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate story stages')
    }
    
    const data: GenerateStoryStagesResponse = await response.json()
    return data
  }
)

export const generateShotBreakdown = createAsyncThunk(
  'videoPlanning/generateShotBreakdown',
  async (planId: string, { getState }) => {
    const state = getState() as { videoPlanning: VideoPlanningState }
    const plan = state.videoPlanning.currentPlan
    
    if (!plan) {
      throw new Error('No current plan found')
    }
    
    const response = await fetch('/api/ai/generate-shots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        stages: plan.stages,
        metadata: plan.metadata
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate shot breakdown')
    }
    
    const data: GenerateShotBreakdownResponse = await response.json()
    return data
  }
)

export const generateStoryboard = createAsyncThunk(
  'videoPlanning/generateStoryboard',
  async ({ shotId, prompt }: { shotId: string; prompt: string }) => {
    const response = await fetch('/api/storyboard/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shotId, prompt })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate storyboard')
    }
    
    const data: GenerateStoryboardResponse = await response.json()
    return { shotId, ...data }
  }
)

export const exportPDF = createAsyncThunk(
  'videoPlanning/exportPDF',
  async (planId: string, { getState }) => {
    const state = getState() as { videoPlanning: VideoPlanningState }
    const plan = state.videoPlanning.currentPlan
    
    if (!plan) {
      throw new Error('No current plan found')
    }
    
    const response = await fetch('/api/planning/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, plan })
    })
    
    if (!response.ok) {
      throw new Error('Failed to export PDF')
    }
    
    const data = await response.json()
    return data
  }
)

// 자동 저장
export const autosavePlan = createAsyncThunk(
  'videoPlanning/autosavePlan',
  async (_, { getState }) => {
    const state = getState() as { videoPlanning: VideoPlanningState }
    const plan = state.videoPlanning.currentPlan
    
    if (!plan) return
    
    const response = await fetch(`/api/plans/${plan.id}/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    })
    
    if (!response.ok) {
      throw new Error('Failed to autosave plan')
    }
    
    return { savedAt: new Date().toISOString() }
  }
)

const initialState: VideoPlanningState = {
  currentPlan: null,
  plans: [],
  currentStep: 1,
  aiGenerations: {},
  exports: {},
  isLoading: false,
  error: null,
  autosaveStatus: 'idle'
}

const videoPlanningSlice = createSlice({
  name: 'videoPlanning',
  initialState,
  reducers: {
    // 기획안 생성 및 관리
    createNewPlan: (state, action: PayloadAction<{ userId: string; projectId?: string }>) => {
      const newPlan: VideoPlan = {
        id: nanoid(),
        projectId: action.payload.projectId,
        userId: action.payload.userId,
        metadata: {
          title: '',
          oneLiner: '',
          toneAndManner: [],
          genre: [],
          target: '',
          duration: '',
          format: '',
          tempo: 'normal',
          developmentMethod: 'classic-story',
          developmentIntensity: 'moderate'
        },
        stages: [],
        shots: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        autoSavedAt: new Date().toISOString(),
        version: 1
      }
      
      state.currentPlan = newPlan
      state.currentStep = 1
      state.error = null
    },
    
    loadPlan: (state, action: PayloadAction<VideoPlan>) => {
      state.currentPlan = action.payload
      // 상태에 따라 현재 단계 설정
      switch (action.payload.status) {
        case 'draft':
          state.currentStep = 1
          break
        case 'story-generated':
          state.currentStep = 2
          break
        case 'shots-generated':
        case 'completed':
          state.currentStep = 3
          break
        default:
          state.currentStep = 1
      }
    },
    
    updateMetadata: (state, action: PayloadAction<Partial<StoryMetadata>>) => {
      if (state.currentPlan) {
        state.currentPlan.metadata = {
          ...state.currentPlan.metadata,
          ...action.payload
        }
        state.currentPlan.updatedAt = new Date().toISOString()
        state.autosaveStatus = 'idle' // 자동저장 트리거
      }
    },
    
    updateStage: (state, action: PayloadAction<{ stageId: string; updates: Partial<StoryStage> }>) => {
      if (state.currentPlan) {
        const stageIndex = state.currentPlan.stages.findIndex(
          stage => stage.id === action.payload.stageId
        )
        
        if (stageIndex !== -1) {
          state.currentPlan.stages[stageIndex] = {
            ...state.currentPlan.stages[stageIndex],
            ...action.payload.updates,
            isEdited: true
          }
          state.currentPlan.updatedAt = new Date().toISOString()
          state.autosaveStatus = 'idle'
        }
      }
    },
    
    resetStage: (state, action: PayloadAction<string>) => {
      if (state.currentPlan) {
        const stageIndex = state.currentPlan.stages.findIndex(
          stage => stage.id === action.payload
        )
        
        if (stageIndex !== -1) {
          const stage = state.currentPlan.stages[stageIndex]
          if (stage.originalContent) {
            stage.content = stage.originalContent
            stage.isEdited = false
          }
          state.currentPlan.updatedAt = new Date().toISOString()
        }
      }
    },
    
    updateShot: (state, action: PayloadAction<{ shotId: string; updates: Partial<ShotBreakdown> }>) => {
      if (state.currentPlan) {
        const shotIndex = state.currentPlan.shots.findIndex(
          shot => shot.id === action.payload.shotId
        )
        
        if (shotIndex !== -1) {
          state.currentPlan.shots[shotIndex] = {
            ...state.currentPlan.shots[shotIndex],
            ...action.payload.updates,
            isEdited: true
          }
          state.currentPlan.updatedAt = new Date().toISOString()
          state.autosaveStatus = 'idle'
        }
      }
    },
    
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },
    
    clearError: (state) => {
      state.error = null
    }
  },
  
  extraReducers: (builder) => {
    // 4단계 스토리 생성
    builder
      .addCase(generateStoryStages.pending, (state) => {
        state.isLoading = true
        state.error = null
        
        const requestId = nanoid()
        state.aiGenerations[requestId] = {
          id: requestId,
          planId: state.currentPlan?.id || '',
          type: 'story-stages',
          input: state.currentPlan?.metadata,
          status: 'processing',
          retryCount: 0,
          createdAt: new Date().toISOString()
        }
      })
      .addCase(generateStoryStages.fulfilled, (state, action) => {
        state.isLoading = false
        
        if (state.currentPlan) {
          // AI가 생성한 4단계를 추가
          state.currentPlan.stages = action.payload.stages.map((stage, index) => ({
            ...stage,
            id: nanoid(),
            type: ['intro', 'rising', 'climax', 'resolution'][index] as any,
            isEdited: false,
            originalContent: stage.content
          }))
          
          state.currentPlan.status = 'story-generated'
          state.currentPlan.updatedAt = new Date().toISOString()
          state.currentStep = 2
        }
      })
      .addCase(generateStoryStages.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to generate story stages'
      })
    
    // 12개 숏트 생성
    builder
      .addCase(generateShotBreakdown.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(generateShotBreakdown.fulfilled, (state, action) => {
        state.isLoading = false
        
        if (state.currentPlan) {
          // AI가 생성한 12개 숏트를 추가
          state.currentPlan.shots = action.payload.shots.map((shot, index) => ({
            ...shot,
            id: nanoid(),
            shotNumber: index + 1,
            isEdited: false,
            insertShots: []
          }))
          
          state.currentPlan.status = 'shots-generated'
          state.currentPlan.updatedAt = new Date().toISOString()
          state.currentStep = 3
        }
      })
      .addCase(generateShotBreakdown.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to generate shot breakdown'
      })
    
    // 콘티 생성
    builder
      .addCase(generateStoryboard.fulfilled, (state, action) => {
        if (state.currentPlan) {
          const shotIndex = state.currentPlan.shots.findIndex(
            shot => shot.id === action.payload.shotId
          )
          
          if (shotIndex !== -1) {
            const shot = state.currentPlan.shots[shotIndex]
            if (!shot.storyboardImage) {
              shot.storyboardImage = {
                id: nanoid(),
                shotId: action.payload.shotId,
                imageUrl: action.payload.image.url,
                prompt: action.payload.image.prompt,
                style: 'storyboard pencil sketch',
                version: 1,
                generatedAt: new Date().toISOString(),
                isActive: true
              }
            } else {
              shot.storyboardImage.imageUrl = action.payload.image.url
              shot.storyboardImage.version += 1
              shot.storyboardImage.generatedAt = new Date().toISOString()
            }
          }
        }
      })
    
    // 자동 저장
    builder
      .addCase(autosavePlan.pending, (state) => {
        state.autosaveStatus = 'saving'
      })
      .addCase(autosavePlan.fulfilled, (state, action) => {
        state.autosaveStatus = 'saved'
        if (state.currentPlan && action.payload) {
          state.currentPlan.autoSavedAt = action.payload.savedAt
        }
      })
      .addCase(autosavePlan.rejected, (state) => {
        state.autosaveStatus = 'error'
      })
  }
})

export const {
  createNewPlan,
  loadPlan,
  updateMetadata,
  updateStage,
  resetStage,
  updateShot,
  setCurrentStep,
  clearError
} = videoPlanningSlice.actions

export default videoPlanningSlice.reducer