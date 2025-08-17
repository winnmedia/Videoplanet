/**
 * User Model Public API
 */

export {
  userSlice,
  setUser,
  clearUser,
  setLoading,
  setError,
} from './user.slice';

export type { User, UserState } from './user.slice';

export {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserLoading,
  selectUserError,
  selectUserRole,
  selectIsAdmin,
} from './user.selectors';