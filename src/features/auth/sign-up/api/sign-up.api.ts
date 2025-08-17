import { apiClient } from '@/lib/api/client'
import { SignupData, AuthResponse, EmailAuthData, SendAuthNumberData } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Sign-up API configuration error:', error)
}

export const signUpApi = {
  /**
   * 이메일 회원가입
   */
  signUp: (data: SignupData) => {
    return apiClient.post<AuthResponse>(`/users/signup`, data)
  },

  /**
   * 이메일 인증번호 보내기 (회원가입용)
   */
  sendAuthNumber: (data: SendAuthNumberData) => {
    return apiClient.post(`/users/send_authnumber/signup`, data)
  },

  /**
   * 이메일 인증번호 확인 (회원가입용)
   */
  verifyEmail: (data: EmailAuthData) => {
    return apiClient.post(`/users/signup_emailauth/signup`, data)
  }
}

// 에러 처리 유틸리티
export const handleSignUpError = (error: any) => {
  if (error?.response?.status === 409) {
    return '이미 가입된 이메일입니다.'
  }
  
  if (error?.response?.status === 400) {
    const data = error?.response?.data
    if (data?.email) {
      return '유효하지 않은 이메일 형식입니다.'
    }
    if (data?.password) {
      return '비밀번호가 조건에 맞지 않습니다.'
    }
    if (data?.phone) {
      return '유효하지 않은 전화번호입니다.'
    }
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '회원가입 중 오류가 발생했습니다.'
  
  return message
}