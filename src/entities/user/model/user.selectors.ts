/**
 * User Entity - Redux Selectors
 */

import { createSelector } from '@reduxjs/toolkit';
import type { UserState } from './user.slice';

// Base selector
const selectUserState = (state: { user: UserState }) => state.user;

// Memoized selectors
export const selectCurrentUser = createSelector(
  selectUserState,
  (userState) => userState.currentUser
);

export const selectIsAuthenticated = createSelector(
  selectUserState,
  (userState) => userState.isAuthenticated
);

export const selectUserLoading = createSelector(
  selectUserState,
  (userState) => userState.isLoading
);

export const selectUserError = createSelector(
  selectUserState,
  (userState) => userState.error
);

export const selectUserRole = createSelector(
  selectCurrentUser,
  (user) => user?.role ?? 'guest'
);

export const selectIsAdmin = createSelector(
  selectUserRole,
  (role) => role === 'admin'
);