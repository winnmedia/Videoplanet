import { apiClient } from '@/lib/api/client'
import { LoginCredentials, SignupData, AuthResponse, User } from '../types'
import { API_BASE_URL, validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Auth API configuration error:', error)
}

export const authApi = {
  /**
   * 이메일 로그인
   */
  signIn: (data: LoginCredentials) => {
    return apiClient.post(`/users/login`, data)
  },

  /**
   * 이메일 회원가입
   */
  signUp: (data: SignupData) => {
    return apiClient.post(`/users/signup`, data)
  },

  /**
   * 이메일 인증번호 보내기
   * @param data - 이메일 정보
   * @param types - 인증 타입 ('signup' | 'password_reset')
   */
  sendAuthNumber: (data: { email: string }, types: 'signup' | 'password_reset') => {
    return apiClient.post(`/users/send_authnumber/${types}`, data)
  },

  /**
   * 이메일 인증번호 확인
   * @param data - 인증번호 정보
   * @param types - 인증 타입 ('signup' | 'password_reset')
   */
  verifyEmail: (data: { email: string; auth_number: string }, types: 'signup' | 'password_reset') => {
    return apiClient.post(`/users/signup_emailauth/${types}`, data)
  },

  /**
   * 비밀번호 재설정
   */
  resetPassword: (data: { email: string; password: string; auth_number: string }) => {
    return apiClient.post(`/users/password_reset`, data)
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
  },

  /**
   * 사용자 프로필 조회
   */
  getUserProfile: () => {
    return apiClient.get(`/users/profile/`)
  },

  /**
   * 사용자 프로필 업데이트
   */
  updateUserProfile: (data: Partial<User>) => {
    return apiClient.patch(`/users/profile/`, data)
  },

  /**
   * 비밀번호 변경
   */
  changePassword: (data: {
    current_password: string
    new_password: string
    new_password2: string
  }) => {
    return apiClient.post(`/users/change-password/`, data)
  },

  /**
   * 이메일 초대 확인 (프로젝트 초대 등)
   */
  verifyInvitation: (uid: string, token: string) => {
    return apiClient.get(`/users/verify-invitation/${uid}/${token}/`)
  },

  /**
   * 초대 수락
   */
  acceptInvitation: (uid: string, token: string) => {
    return apiClient.post(`/users/accept-invitation/`, { uid, token })
  },

  /**
   * 사용자 메모 작성
   */
  writeUserMemo: (data: { content: string; project_id?: number }) => {
    return apiClient.post(`/users/memo`, data)
  },

  /**
   * 사용자 멤모 삭제
   */
  deleteUserMemo: (id: number) => {
    return apiClient.delete(`/users/memo/${id}`)
  },

  /**
   * 사용자 멤모 목록 조회
   */
  getUserMemos: () => {
    return apiClient.get(`/users/memo`)
  },

  /**
   * 계정 삭제
   */
  deleteAccount: (password: string) => {
    return apiClient.delete(`/users/account/`, { data: { password } })
  }
}

// 타입 가드 함수들
export const isAuthResponse = (response: any): response is AuthResponse => {
  return response && 
         typeof response.access === 'string' &&
         typeof response.refresh === 'string' &&
         response.user &&
         typeof response.user.id === 'number'
}

// 에러 처리 유틸리티
export const handleAuthError = (error: any) => {
  // 401 에러는 apiClient 인터셉터에서 처리되므로 중복 제거
  if (error?.response?.status === 403) {
    // 권한 없음
    const message = '접근 권한이 없습니다.'
    console.error('Access denied:', error.response.data)
    return message
  }
  
  if (error?.response?.status >= 500) {
    // 서버 에러
    const message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    console.error('Server error:', error.response.data)
    return message
  }
  
  // 일반적인 에러 처리
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '알 수 없는 오류가 발생했습니다.'
  
  return message
}

// API 인터셉터 설정 (기본적으로 apiClient에 이미 설정되어 있음)
export const setupAuthInterceptors = () => {
  console.log('Auth interceptors are already configured in apiClient')
  // apiClient에서 이미 인터셉터가 설정되어 있으므로 추가 설정 불필요
  // - Request interceptor: 토큰 자동 첨부
  // - Response interceptor: 401 에러 시 자동 리다이렉트
}
