/**
 * Entities Layer Public API
 * 모든 도메인 엔티티를 export
 */

// User entity
export {
  userSlice,
  setUser,
  clearUser,
  setLoading as setUserLoading,
  setError as setUserError,
  type User,
  type UserState,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserLoading,
  selectUserError,
  selectUserRole,
  selectIsAdmin,
  userApi,
  type LoginRequest,
  type LoginResponse,
  type SignupRequest,
} from './user';

// Project entity
export {
  projectSlice,
  setProjects,
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  setFilters,
  setLoading as setProjectLoading,
  setError as setProjectError,
  type Project,
  type ProjectState,
  projectApi,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from './project';

// export * from './feedback'; // 추후 추가