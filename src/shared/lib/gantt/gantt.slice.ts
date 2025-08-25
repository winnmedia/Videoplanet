/**
 * GanttChart Redux slice
 * 프로젝트 진행 상황 관리를 위한 상태
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ProjectInfo, PhaseProgress, ProjectPhase, ProgressStatus } from '../../ui/GanttChart.types'

/**
 * 간트차트 상태 인터페이스
 */
interface GanttState {
  /** 프로젝트별 간트차트 데이터 */
  projects: Record<string, ProjectInfo>
  /** 현재 선택된 프로젝트 ID */
  currentProjectId: string | null
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 마지막 업데이트 시간 */
  lastUpdated: number | null
}

/**
 * 초기 상태
 */
const initialState: GanttState = {
  projects: {},
  currentProjectId: null,
  isLoading: false,
  error: null,
  lastUpdated: null
}

/**
 * 단계 진행률 업데이트 액션 페이로드
 */
interface UpdatePhaseProgressPayload {
  projectId: string
  phase: ProjectPhase
  progress: number
}

/**
 * 단계 상태 업데이트 액션 페이로드
 */
interface UpdatePhaseStatusPayload {
  projectId: string
  phase: ProjectPhase
  status: ProgressStatus
}

/**
 * 단계 메모 설정 액션 페이로드
 */
interface SetPhaseNotesPayload {
  projectId: string
  phase: ProjectPhase
  notes: string
}

/**
 * 단계 정보 업데이트 액션 페이로드
 */
interface UpdatePhasePayload {
  projectId: string
  phase: ProjectPhase
  updates: Partial<PhaseProgress>
}

/**
 * 전체 진행률 계산 헬퍼 함수
 */
const calculateTotalProgress = (phases: PhaseProgress[]): number => {
  if (phases.length === 0) return 0
  
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0)
  return Math.round(totalProgress / phases.length)
}

/**
 * 프로젝트 상태 계산 헬퍼 함수
 */
const calculateProjectStatus = (phases: PhaseProgress[]): ProgressStatus => {
  const hasDelayed = phases.some(phase => phase.status === 'delayed')
  if (hasDelayed) return 'delayed'
  
  const allCompleted = phases.every(phase => phase.status === 'completed')
  if (allCompleted) return 'completed'
  
  const hasInProgress = phases.some(phase => phase.status === 'in_progress')
  if (hasInProgress) return 'in_progress'
  
  return 'pending'
}

/**
 * 간트차트 slice
 */
const ganttSlice = createSlice({
  name: 'gantt',
  initialState,
  reducers: {
    /**
     * 프로젝트 설정
     */
    setProject: (state, action: PayloadAction<ProjectInfo>) => {
      const project = action.payload
      state.projects[project.id] = project
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 여러 프로젝트 설정
     */
    setProjects: (state, action: PayloadAction<ProjectInfo[]>) => {
      const projects = action.payload
      projects.forEach(project => {
        state.projects[project.id] = project
      })
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 현재 프로젝트 설정
     */
    setCurrentProjectId: (state, action: PayloadAction<string | null>) => {
      state.currentProjectId = action.payload
    },

    /**
     * 프로젝트 제거
     */
    removeProject: (state, action: PayloadAction<string>) => {
      const projectId = action.payload
      delete state.projects[projectId]
      
      if (state.currentProjectId === projectId) {
        state.currentProjectId = null
      }
      
      state.lastUpdated = Date.now()
    },

    /**
     * 단계 진행률 업데이트
     */
    updatePhaseProgress: (state, action: PayloadAction<UpdatePhaseProgressPayload>) => {
      const { projectId, phase, progress } = action.payload
      const project = state.projects[projectId]
      
      if (!project) {
        state.error = `프로젝트를 찾을 수 없습니다: ${projectId}`
        return
      }

      const phaseIndex = project.phases.findIndex(p => p.phase === phase)
      if (phaseIndex === -1) {
        state.error = `단계를 찾을 수 없습니다: ${phase}`
        return
      }

      // 진행률 업데이트
      project.phases[phaseIndex].progress = Math.max(0, Math.min(100, progress))
      
      // 진행률에 따른 상태 자동 업데이트
      if (progress === 100) {
        project.phases[phaseIndex].status = 'completed'
        project.phases[phaseIndex].actualEndDate = new Date()
      } else if (progress > 0) {
        if (project.phases[phaseIndex].status === 'pending') {
          project.phases[phaseIndex].status = 'in_progress'
          project.phases[phaseIndex].actualStartDate = new Date()
        }
      }

      // 전체 진행률 재계산
      project.totalProgress = calculateTotalProgress(project.phases)
      project.status = calculateProjectStatus(project.phases)
      project.updatedAt = new Date()
      
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 단계 상태 업데이트
     */
    updatePhaseStatus: (state, action: PayloadAction<UpdatePhaseStatusPayload>) => {
      const { projectId, phase, status } = action.payload
      const project = state.projects[projectId]
      
      if (!project) {
        state.error = `프로젝트를 찾을 수 없습니다: ${projectId}`
        return
      }

      const phaseIndex = project.phases.findIndex(p => p.phase === phase)
      if (phaseIndex === -1) {
        state.error = `단계를 찾을 수 없습니다: ${phase}`
        return
      }

      const phaseData = project.phases[phaseIndex]
      const oldStatus = phaseData.status
      phaseData.status = status

      // 상태 변경에 따른 날짜 업데이트
      if (status === 'in_progress' && oldStatus === 'pending') {
        phaseData.actualStartDate = new Date()
      } else if (status === 'completed' && oldStatus !== 'completed') {
        phaseData.actualEndDate = new Date()
        phaseData.progress = 100
      } else if (status === 'pending') {
        phaseData.actualStartDate = undefined
        phaseData.actualEndDate = undefined
        if (phaseData.progress > 0) {
          phaseData.progress = 0
        }
      }

      // 전체 진행률 및 상태 재계산
      project.totalProgress = calculateTotalProgress(project.phases)
      project.status = calculateProjectStatus(project.phases)
      project.updatedAt = new Date()
      
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 단계 메모 설정
     */
    setPhaseNotes: (state, action: PayloadAction<SetPhaseNotesPayload>) => {
      const { projectId, phase, notes } = action.payload
      const project = state.projects[projectId]
      
      if (!project) {
        state.error = `프로젝트를 찾을 수 없습니다: ${projectId}`
        return
      }

      const phaseIndex = project.phases.findIndex(p => p.phase === phase)
      if (phaseIndex === -1) {
        state.error = `단계를 찾을 수 없습니다: ${phase}`
        return
      }

      project.phases[phaseIndex].notes = notes
      project.updatedAt = new Date()
      
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 단계 정보 업데이트 (일반적인 업데이트)
     */
    updatePhase: (state, action: PayloadAction<UpdatePhasePayload>) => {
      const { projectId, phase, updates } = action.payload
      const project = state.projects[projectId]
      
      if (!project) {
        state.error = `프로젝트를 찾을 수 없습니다: ${projectId}`
        return
      }

      const phaseIndex = project.phases.findIndex(p => p.phase === phase)
      if (phaseIndex === -1) {
        state.error = `단계를 찾을 수 없습니다: ${phase}`
        return
      }

      // 단계 정보 업데이트
      Object.assign(project.phases[phaseIndex], updates)

      // 진행률이나 상태가 변경된 경우 전체 계산 업데이트
      if ('progress' in updates || 'status' in updates) {
        project.totalProgress = calculateTotalProgress(project.phases)
        project.status = calculateProjectStatus(project.phases)
      }

      project.updatedAt = new Date()
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 프로젝트 정보 업데이트
     */
    updateProject: (state, action: PayloadAction<{ 
      projectId: string
      updates: Partial<Omit<ProjectInfo, 'phases'>>
    }>) => {
      const { projectId, updates } = action.payload
      const project = state.projects[projectId]
      
      if (!project) {
        state.error = `프로젝트를 찾을 수 없습니다: ${projectId}`
        return
      }

      Object.assign(project, updates, { updatedAt: new Date() })
      state.error = null
      state.lastUpdated = Date.now()
    },

    /**
     * 로딩 상태 설정
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    /**
     * 에러 설정
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    /**
     * 에러 클리어
     */
    clearError: (state) => {
      state.error = null
    },

    /**
     * 상태 초기화
     */
    reset: () => initialState
  }
})

// 액션 export
export const {
  setProject,
  setProjects,
  setCurrentProjectId,
  removeProject,
  updatePhaseProgress,
  updatePhaseStatus,
  setPhaseNotes,
  updatePhase,
  updateProject,
  setLoading,
  setError,
  clearError,
  reset
} = ganttSlice.actions

// 리듀서 export
export const ganttReducer = ganttSlice.reducer

// 타입 export
export type { GanttState }