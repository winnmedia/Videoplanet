/**
 * GanttChart 라이브러리 공개 API
 */

// Redux slice
export { 
  ganttReducer,
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
} from './gantt.slice'

// 훅들
export {
  useGanttChart,
  useGanttChartManager,
  useProjectStats,
  useGanttRealtime,
  useGanttChanges
} from './useGanttChart'

// 타입들
export type { GanttState } from './gantt.slice'