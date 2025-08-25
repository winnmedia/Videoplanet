import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name: string
  profileImage?: string
  isEmailVerified: boolean
  createdAt: string
}

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  loginMethod: 'email' | 'google' | 'kakao' | 'naver' | null
  user: User | null
  isLoading: boolean
  error: string | null
  isRegistering: boolean
  isForgotPassword: boolean
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  loginMethod: null,
  user: null,
  isLoading: false,
  error: null,
  isRegistering: false,
  isForgotPassword: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ 
      accessToken: string; 
      refreshToken: string; 
      method: 'email' | 'google' | 'kakao' | 'naver';
      user: User 
    }>) => {
      state.isAuthenticated = true
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.loginMethod = action.payload.method
      state.user = action.payload.user
      state.isLoading = false
      state.error = null
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.accessToken = null
      state.refreshToken = null
      state.loginMethod = null
      state.user = null
      state.isLoading = false
      state.error = action.payload
    },
    registerStart: (state) => {
      state.isRegistering = true
      state.error = null
    },
    registerSuccess: (state) => {
      state.isRegistering = false
      state.error = null
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isRegistering = false
      state.error = action.payload
    },
    forgotPasswordStart: (state) => {
      state.isForgotPassword = true
      state.error = null
    },
    forgotPasswordSuccess: (state) => {
      state.isForgotPassword = false
      state.error = null
    },
    forgotPasswordFailure: (state, action: PayloadAction<string>) => {
      state.isForgotPassword = false
      state.error = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.accessToken = null
      state.refreshToken = null
      state.loginMethod = null
      state.user = null
      state.isLoading = false
      state.error = null
    },
    refreshToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  logout, 
  refreshToken,
  updateUser,
  clearError 
} = authSlice.actions

export const authReducer = authSlice.reducer
export type { User }