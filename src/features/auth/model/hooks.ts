import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import type { RootState } from '@/shared/lib/store'
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  registerStart,
  registerSuccess,
  registerFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  clearError 
} from './auth.slice'
import { authAPI } from '../api/auth.api'

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  agreeToMarketing?: boolean
}

export function useAuth() {
  return useSelector((state: RootState) => state.auth)
}

export function useAuthActions() {
  const dispatch = useDispatch()
  const authState = useSelector((state: RootState) => state.auth)

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch(loginStart())
      
      const response = await authAPI.login(credentials)
      
      dispatch(loginSuccess({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        method: 'email',
        user: response.user
      }))
      
      // Store tokens if remember me is checked
      if (credentials.rememberMe) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.'
      dispatch(loginFailure(message))
      throw error
    }
  }, [dispatch])

  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch(registerStart())
      
      const response = await authAPI.register(data)
      
      dispatch(registerSuccess())
      
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
      dispatch(registerFailure(message))
      throw error
    }
  }, [dispatch])

  const socialLogin = useCallback(async (provider: 'google' | 'kakao' | 'naver', token: string) => {
    try {
      dispatch(loginStart())
      
      const response = await authAPI.socialLogin(provider, token)
      
      dispatch(loginSuccess({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        method: provider,
        user: response.user
      }))
      
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.'
      dispatch(loginFailure(message))
      throw error
    }
  }, [dispatch])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      dispatch(forgotPasswordStart())
      
      const response = await authAPI.forgotPassword(email)
      
      dispatch(forgotPasswordSuccess())
      
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 재설정 요청에 실패했습니다.'
      dispatch(forgotPasswordFailure(message))
      throw error
    }
  }, [dispatch])

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      dispatch(loginStart()) // Reuse login loading state
      
      const response = await authAPI.resetPassword(token, newPassword)
      
      dispatch(loginSuccess({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        method: 'email',
        user: response.user
      }))
      
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.'
      dispatch(loginFailure(message))
      throw error
    }
  }, [dispatch])

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authAPI.verifyEmail(token)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  const resendVerificationEmail = useCallback(async (email: string) => {
    try {
      const response = await authAPI.resendVerificationEmail(email)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call logout API if refresh token exists
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage and dispatch logout action
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('isAuthenticated')
      dispatch(logoutAction())
    }
  }, [dispatch])

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await authAPI.refreshToken(refreshToken)
      
      dispatch(loginSuccess({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        method: authState.loginMethod || 'email',
        user: response.user
      }))
      
      return response
    } catch (error) {
      // If refresh fails, logout user
      logout()
      throw error
    }
  }, [dispatch, authState.loginMethod, logout])

  const clearAuthError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return {
    login,
    register,
    socialLogin,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    logout,
    refreshAccessToken,
    clearError: clearAuthError,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loginMethod: authState.loginMethod
  }
}