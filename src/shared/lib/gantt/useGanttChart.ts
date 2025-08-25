/**
 * GanttChart 훅
 * Redux 상태와 간트차트 컴포넌트를 연결하는 커스텀 훅
 */

import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import type { 
  UseGanttChart, 
  ProjectInfo, 
  ProjectPhase, 
  ProgressStatus,
  GanttActions 
} from '../../ui/GanttChart.types'
import {
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
  clearError
} from './gantt.slice'

/**
 * 간트차트 데이터와 액션을 제공하는 훅
 */
export const useGanttChart = (projectId?: string): UseGanttChart => {
  const dispatch = useDispatch()
  
  // Redux 상태 선택
  const ganttState = useSelector((state: RootState) => state.gantt)
  const { projects, currentProjectId, isLoading, error } = ganttState

  // 현재 프로젝트 결정
  const activeProjectId = projectId || currentProjectId
  
  // 현재 프로젝트 데이터
  const project = useMemo(() => {
    return activeProjectId ? projects[activeProjectId] || null : null
  }, [projects, activeProjectId])

  // 액션 함수들
  const actions: GanttActions = useMemo(() => ({
    updatePhaseProgress: (projectId: string, phase: ProjectPhase, progress: number) => {
      dispatch(updatePhaseProgress({ projectId, phase, progress }))
    },
    
    updatePhaseStatus: (projectId: string, phase: ProjectPhase, status: ProgressStatus) => {
      dispatch(updatePhaseStatus({ projectId, phase, status }))
    },
    
    setPhaseNotes: (projectId: string, phase: ProjectPhase, notes: string) => {
      dispatch(setPhaseNotes({ projectId, phase, notes }))
    }
  }), [dispatch])

  return {
    project,
    isLoading,
    error,
    actions
  }
}

/**
 * 간트차트 관리를 위한 확장된 훅
 */
export const useGanttChartManager = () => {
  const dispatch = useDispatch()
  const ganttState = useSelector((state: RootState) => state.gantt)
  
  const manager = useMemo(() => ({
    // 상태 조회
    getAllProjects: () => Object.values(ganttState.projects),
    getProject: (id: string) => ganttState.projects[id] || null,
    getCurrentProject: () => ganttState.currentProjectId ? ganttState.projects[ganttState.currentProjectId] : null,
    isLoading: ganttState.isLoading,
    error: ganttState.error,
    lastUpdated: ganttState.lastUpdated,
    
    // 프로젝트 관리
    setProject: (project: ProjectInfo) => dispatch(setProject(project)),
    setProjects: (projects: ProjectInfo[]) => dispatch(setProjects(projects)),
    setCurrentProjectId: (id: string | null) => dispatch(setCurrentProjectId(id)),
    removeProject: (id: string) => dispatch(removeProject(id)),
    
    // 프로젝트 업데이트
    updateProject: (projectId: string, updates: Partial<Omit<ProjectInfo, 'phases'>>) => {
      dispatch(updateProject({ projectId, updates }))
    },
    
    // 단계 관리
    updatePhase: (projectId: string, phase: ProjectPhase, updates: Parameters<typeof updatePhase>[0]['payload']['updates']) => {
      dispatch(updatePhase({ projectId, phase, updates }))
    },
    
    // 상태 관리
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setError: (error: string | null) => dispatch(setError(error)),
    clearError: () => dispatch(clearError()),
    
    // 유틸리티
    hasProject: (id: string) => id in ganttState.projects,
    getProjectCount: () => Object.keys(ganttState.projects).length
  }), [dispatch, ganttState])

  return manager
}

/**
 * 특정 프로젝트의 진행률 통계를 계산하는 훅
 */
export const useProjectStats = (projectId: string) => {
  const project = useSelector((state: RootState) => 
    projectId ? state.gantt.projects[projectId] || null : null
  )
  
  const stats = useMemo(() => {
    if (!project) {
      return {
        totalPhases: 0,
        completedPhases: 0,
        inProgressPhases: 0,
        pendingPhases: 0,
        delayedPhases: 0,
        completionRate: 0,
        averageProgress: 0,
        isOnSchedule: true,
        timeRemaining: 0
      }
    }

    const { phases } = project
    const totalPhases = phases.length
    
    const completedPhases = phases.filter(p => p.status === 'completed').length
    const inProgressPhases = phases.filter(p => p.status === 'in_progress').length
    const pendingPhases = phases.filter(p => p.status === 'pending').length
    const delayedPhases = phases.filter(p => p.status === 'delayed').length
    
    const completionRate = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0
    const averageProgress = phases.reduce((sum, phase) => sum + phase.progress, 0) / totalPhases
    
    const isOnSchedule = delayedPhases === 0
    
    // 남은 시간 계산 (가장 늦은 종료일까지)
    const now = new Date()
    const latestEndDate = phases.reduce((latest, phase) => {
      return phase.endDate > latest ? phase.endDate : latest
    }, new Date(0))
    const timeRemaining = Math.max(0, latestEndDate.getTime() - now.getTime())

    return {
      totalPhases,
      completedPhases,
      inProgressPhases,
      pendingPhases,
      delayedPhases,
      completionRate,
      averageProgress,
      isOnSchedule,
      timeRemaining
    }
  }, [project])

  return stats
}

/**
 * 간트차트 실시간 업데이트를 위한 훅
 */
export const useGanttRealtime = (projectId: string, enablePolling = false, intervalMs = 30000) => {
  const { project, isLoading, error, actions } = useGanttChart(projectId)
  const manager = useGanttChartManager()
  
  // 폴링을 위한 자동 새로고침 (옵션)
  const startPolling = useCallback(() => {
    if (!enablePolling) return null
    
    const interval = setInterval(async () => {
      if (!projectId) return
      
      try {
        // 실제 구현에서는 API 호출
        // const updatedProject = await fetchProjectData(projectId)
        // manager.setProject(updatedProject)
      } catch (error) {
        console.error('Failed to update project data:', error)
      }
    }, intervalMs)
    
    return () => clearInterval(interval)
  }, [projectId, enablePolling, intervalMs, manager])
  
  // 수동 새로고침
  const refresh = useCallback(async () => {
    if (!projectId) return
    
    manager.setLoading(true)
    try {
      // 실제 구현에서는 API 호출
      // const updatedProject = await fetchProjectData(projectId)
      // manager.setProject(updatedProject)
      manager.clearError()
    } catch (error) {
      manager.setError(error instanceof Error ? error.message : '데이터를 불러올 수 없습니다')
    } finally {
      manager.setLoading(false)
    }
  }, [projectId, manager])

  return {
    project,
    isLoading,
    error,
    actions,
    refresh,
    startPolling
  }
}

/**
 * 간트차트의 변경사항을 추적하는 훅
 */
export const useGanttChanges = (projectId: string) => {
  const project = useSelector((state: RootState) => 
    projectId ? state.gantt.projects[projectId] || null : null
  )
  const lastUpdated = useSelector((state: RootState) => state.gantt.lastUpdated)
  
  const hasChanges = useMemo(() => {
    if (!project || !lastUpdated) return false
    
    const projectUpdated = project.updatedAt.getTime()
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    
    return projectUpdated > fiveMinutesAgo
  }, [project, lastUpdated])
  
  const changesSummary = useMemo(() => {
    if (!project) return null
    
    return {
      projectId: project.id,
      lastModified: project.updatedAt,
      totalProgress: project.totalProgress,
      status: project.status,
      phaseStatuses: project.phases.map(phase => ({
        phase: phase.phase,
        status: phase.status,
        progress: phase.progress
      }))
    }
  }, [project])
  
  return {
    hasChanges,
    changesSummary,
    lastUpdated
  }
}

export default useGanttChart