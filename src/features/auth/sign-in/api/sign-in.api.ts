import { apiClient } from '@/lib/api/client'
import { LoginCredentials, AuthResponse } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Sign-in API configuration error:', error)
}

export const signInApi = {
  /**
   * 이메일 로그인
   */
  signIn: (data: LoginCredentials) => {
    return apiClient.post<AuthResponse>(`/users/login`, data)
  },

  /**
   * 토큰 갱신
   */
  refreshToken: (refreshToken: string) => {
    return apiClient.post(`/auth/token/refresh/`, { refresh: refreshToken })
  },

  /**
   * 로그아웃
   */
  signOut: (refreshToken: string) => {
    return apiClient.post(`/auth/logout/`, { refresh: refreshToken })
  }
}

// 타입 가드 함수
export const isAuthResponse = (response: any): response is AuthResponse => {
  return response && 
         typeof response.access === 'string' &&
         typeof response.refresh === 'string' &&
         response.user &&
         typeof response.user.id === 'number'
}

// 에러 처리 유틸리티
export const handleSignInError = (error: any) => {
  if (error?.response?.status === 401) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  
  if (error?.response?.status === 403) {
    return '계정이 비활성화되었습니다. 관리자에게 문의하세요.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '로그인 중 오류가 발생했습니다.'
  
  return message
}