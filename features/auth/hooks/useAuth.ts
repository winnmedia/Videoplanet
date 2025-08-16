import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { 
  LoginCredentials, 
  SignupData, 
  AuthResponse, 
  User, 
  EmailVerificationParams 
} from '../types'
import { authApi, handleAuthError } from '../api/authApi'
import { checkSession, refetchProject } from '@/utils/util'

// Redux 액션 타입들 (추후 store/authSlice.ts에서 정의)
export const AUTH_ACTIONS = {
  LOGIN_START: 'auth/loginStart',
  LOGIN_SUCCESS: 'auth/loginSuccess',
  LOGIN_FAILURE: 'auth/loginFailure',
  LOGOUT: 'auth/logout',
  SET_USER: 'auth/setUser',
  CLEAR_ERROR: 'auth/clearError'
} as const

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (data: { current_password: string; new_password: string; new_password2: string }) => Promise<void>
  clearError: () => void
  checkAuthStatus: () => boolean
  refreshUserData: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch()
  const router = useRouter()
  
  // Redux state에서 인증 정보 가져오기 - memoized selector 사용
  const authState = useSelector((state: any) => state.auth) || {}
  
  // 로컬 상태
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(authState.user || null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  /**
   * 에러 상태 클리어
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 로컬 스토리지에서 토큰 가져오기
   */
  const getStoredToken = useCallback(() => {
    try {
      const stored = localStorage.getItem('VGID')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Token parsing error:', error)
      return null
    }
  }, [])

  /**
   * 토큰을 로컬 스토리지에 저장
   */
  const storeToken = useCallback((tokenData: any) => {
    try {
      localStorage.setItem('VGID', JSON.stringify(tokenData))
    } catch (error) {
      console.error('Token storage error:', error)
    }
  }, [])

  /**
   * 인증 상태 확인
   */
  const checkAuthStatus = useCallback(() => {
    const session = checkSession()
    setIsAuthenticated(!!session)
    return !!session
  }, [])

  /**
   * 사용자 정보 새로고침
   */
  const refreshUserData = useCallback(async () => {
    try {
      if (!checkAuthStatus()) return
      
      const response = await authApi.getUserProfile()
      setUser(response.data)
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data })
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      const errorMessage = handleAuthError(error)
      if (errorMessage) {
        setError(errorMessage)
      }
    }
  }, [dispatch, checkAuthStatus])

  /**
   * 로그인
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      setError(null)
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_START })
      
      const response = await authApi.signIn(credentials)
      const sessionData = response.data.vridge_session
      
      // 토큰 저장
      storeToken(sessionData)
      
      // 사용자 정보 설정
      if (response.data.user) {
        setUser(response.data.user)
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data.user })
      }
      
      setIsAuthenticated(true)
      
      // 프로젝트 정보 새로고침
      await refetchProject(dispatch, router)
      
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '로그인에 실패했습니다.')
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage })
      throw error
    } finally {
      setLoading(false)
    }
  }, [dispatch, router, storeToken])

  /**
   * 로그아웃
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      
      const token = getStoredToken()
      if (token?.refresh) {
        try {
          await authApi.signOut(token.refresh)
        } catch (error) {
          console.warn('Logout API call failed:', error)
        }
      }
      
      // 토큰 제거
      localStorage.removeItem('VGID')
      
      // 상태 초기화
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      
      // 로그인 페이지로 리다이렉트
      router.push('/login')
      
    } catch (error) {
      console.error('Logout error:', error)
      setError('로그아웃 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [dispatch, router, getStoredToken])

  /**
   * 회원가입
   */
  const signup = useCallback(async (data: SignupData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authApi.signUp(data)
      
      // 회원가입 성공 후 이메일 인증 페이지로 이동하거나 자동 로그인
      if (response.data.vridge_session) {
        storeToken(response.data.vridge_session)
        setUser(response.data.user)
        setIsAuthenticated(true)
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data.user })
      }
      
    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '회원가입에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [dispatch, storeToken])

  /**
   * 프로필 업데이트
   */
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authApi.updateUserProfile(data)
      setUser(response.data)
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data })
      
    } catch (error) {
      console.error('Profile update error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '프로필 업데이트에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  /**
   * 비밀번호 변경
   */
  const changePassword = useCallback(async (data: {
    current_password: string
    new_password: string
    new_password2: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      await authApi.changePassword(data)
      
    } catch (error) {
      console.error('Password change error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '비밀번호 변경에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 초기 인증 상태 확인 (컴포넌트 마운트 시)
   */
  useEffect(() => {
    const initAuth = async () => {
      const hasSession = checkAuthStatus()
      if (hasSession) {
        try {
          await refreshUserData()
        } catch (error) {
          console.warn('Failed to load user data on init:', error)
          // 토큰이 유효하지 않을 경우 로그아웃 처리
          localStorage.removeItem('VGID')
          setIsAuthenticated(false)
        }
      }
    }

    initAuth()
  }, [checkAuthStatus, refreshUserData])

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    signup,
    updateProfile,
    changePassword,
    clearError,
    checkAuthStatus,
    refreshUserData
  }
}

/**
 * 초대 링크 관련 훅
 */
export const useInvitation = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const verifyInvitation = useCallback(async (params: EmailVerificationParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authApi.verifyInvitation(params.uid, params.token)
      return response.data
      
    } catch (error) {
      console.error('Invitation verification error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '초대 링크 확인에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  const acceptInvitation = useCallback(async (params: EmailVerificationParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authApi.acceptInvitation(params.uid, params.token)
      return response.data
      
    } catch (error) {
      console.error('Invitation acceptance error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '초대 수락에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  return {
    loading,
    error,
    verifyInvitation,
    acceptInvitation,
    clearError: () => setError(null)
  }
}

/**
 * 비밀번호 재설정 관련 훅
 */
export const usePasswordReset = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const sendResetEmail = useCallback(async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await authApi.sendAuthNumber({ email }, 'password_reset')
      
    } catch (error) {
      console.error('Password reset email error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '비밀번호 재설정 이메일 전송에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  const verifyResetCode = useCallback(async (email: string, authNumber: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await authApi.verifyEmail({ email, auth_number: authNumber }, 'password_reset')
      
    } catch (error) {
      console.error('Password reset verification error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '인증번호 확인에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  const resetPassword = useCallback(async (data: {
    email: string
    password: string
    auth_number: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      await authApi.resetPassword(data)
      
    } catch (error) {
      console.error('Password reset error:', error)
      const errorMessage = handleAuthError(error)
      setError(errorMessage || '비밀번호 재설정에 실패했습니다.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  return {
    loading,
    error,
    sendResetEmail,
    verifyResetCode,
    resetPassword,
    clearError: () => setError(null)
  }
}