/**
 * Project Entity Public API
 */

// Model
export {
  projectSlice,
  setProjects,
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  setFilters,
  setLoading,
  setError,
} from './model/project.slice';

export type { Project, ProjectState } from './model/project.slice';

// API
export { projectApi } from './api/project.api';
export type { CreateProjectRequest, UpdateProjectRequest } from './api/project.api';