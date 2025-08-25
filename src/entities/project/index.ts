export { projectReducer } from './model/project.slice'
export type { 
  Project, 
  ProjectSchedule, 
  SchedulePhase, 
  SchedulePhaseType, 
  SchedulePhaseStatus 
} from './model/project.slice'
export { 
  setProjects, 
  setCurrentProject, 
  addProject, 
  updateProject, 
  removeProject, 
  setLoading, 
  setError,
  setProjectSchedule,
  updatePhaseProgress,
  updatePhaseDates
} from './model/project.slice'