import { axiosOpts, axiosCredentials } from '@/utils/util'
import { LoginCredentials, SignupData, AuthResponse, User } from '../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.REACT_APP_BACKEND_API_URL

export const authApi = {
  /**
   * 이메일 로그인
   */
  signIn: (data: LoginCredentials) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/login`,
      data
    )
  },

  /**
   * 이메일 회원가입
   */
  signUp: (data: SignupData) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/signup`,
      data
    )
  },

  /**
   * 이메일 인증번호 보내기
   * @param data - 이메일 정보
   * @param types - 인증 타입 ('signup' | 'password_reset')
   */
  sendAuthNumber: (data: { email: string }, types: 'signup' | 'password_reset') => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/send_authnumber/${types}`,
      data
    )
  },

  /**
   * 이메일 인증번호 확인
   * @param data - 인증번호 정보
   * @param types - 인증 타입 ('signup' | 'password_reset')
   */
  verifyEmail: (data: { email: string; auth_number: string }, types: 'signup' | 'password_reset') => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/signup_emailauth/${types}`,
      data
    )
  },

  /**
   * 비밀번호 재설정
   */
  resetPassword: (data: { email: string; password: string; auth_number: string }) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/password_reset`,
      data
    )
  },

  /**
   * 토큰 갱신
   */
  refreshToken: (refreshToken: string) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/auth/token/refresh/`,
      { refresh: refreshToken }
    )
  },

  /**
   * 로그아웃
   */
  signOut: (refreshToken: string) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/auth/logout/`,
      { refresh: refreshToken }
    )
  },

  /**
   * 사용자 프로필 조회
   */
  getUserProfile: () => {
    return axiosCredentials(
      'get',
      `${API_BASE_URL}/users/profile/`
    )
  },

  /**
   * 사용자 프로필 업데이트
   */
  updateUserProfile: (data: Partial<User>) => {
    return axiosCredentials(
      'patch',
      `${API_BASE_URL}/users/profile/`,
      data
    )
  },

  /**
   * 비밀번호 변경
   */
  changePassword: (data: {
    current_password: string
    new_password: string
    new_password2: string
  }) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/change-password/`,
      data
    )
  },

  /**
   * 이메일 초대 확인 (프로젝트 초대 등)
   */
  verifyInvitation: (uid: string, token: string) => {
    return axiosCredentials(
      'get',
      `${API_BASE_URL}/users/verify-invitation/${uid}/${token}/`
    )
  },

  /**
   * 초대 수락
   */
  acceptInvitation: (uid: string, token: string) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/accept-invitation/`,
      { uid, token }
    )
  },

  /**
   * 사용자 메모 작성
   */
  writeUserMemo: (data: { content: string; project_id?: number }) => {
    return axiosCredentials(
      'post',
      `${API_BASE_URL}/users/memo`,
      data
    )
  },

  /**
   * 사용자 메모 삭제
   */
  deleteUserMemo: (id: number) => {
    return axiosCredentials(
      'delete',
      `${API_BASE_URL}/users/memo/${id}`
    )
  },

  /**
   * 사용자 메모 목록 조회
   */
  getUserMemos: () => {
    return axiosCredentials(
      'get',
      `${API_BASE_URL}/users/memo`
    )
  },

  /**
   * 계정 삭제
   */
  deleteAccount: (password: string) => {
    return axiosCredentials(
      'delete',
      `${API_BASE_URL}/users/account/`,
      { password }
    )
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
  if (error?.response?.status === 401) {
    // 토큰 만료 또는 인증 실패
    localStorage.removeItem('VGID')
    window.location.href = '/login'
    return
  }
  
  // 일반적인 에러 처리
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 '알 수 없는 오류가 발생했습니다.'
  
  return message
}

// API 응답 인터셉터 (필요시 사용)
export const setupAuthInterceptors = () => {
  // axiosCredentials가 함수이므로 인터셉터 설정을 건너뜀
  console.log('Auth interceptors setup skipped - axiosCredentials is a function wrapper')
  /*
  // Request interceptor - 토큰 자동 첨부
  axiosCredentials.interceptors?.request?.use(
    (config) => {
      const token = localStorage.getItem('VGID')
      if (token) {
        try {
          const parsedToken = JSON.parse(token)
          if (parsedToken?.access) {
            config.headers.Authorization = `Bearer ${parsedToken.access}`
          }
        } catch (error) {
          console.error('Token parsing error:', error)
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - 토큰 만료 처리
  axiosCredentials.interceptors?.response?.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        
        try {
          const token = localStorage.getItem('VGID')
          if (token) {
            const parsedToken = JSON.parse(token)
            if (parsedToken?.refresh) {
              const response = await authApi.refreshToken(parsedToken.refresh)
              const newTokens = response.data
              
              localStorage.setItem('VGID', JSON.stringify(newTokens))
              originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
              
              return axiosCredentials(originalRequest)
            }
          }
        } catch (refreshError) {
          localStorage.removeItem('VGID')
          window.location.href = '/login'
        }
      }
      
      return Promise.reject(error)
    }
  )
  */
}
