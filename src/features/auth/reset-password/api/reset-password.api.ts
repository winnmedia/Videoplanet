import { apiClient } from '@/lib/api/client'
import { PasswordResetData, EmailAuthData, SendAuthNumberData } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Reset password API configuration error:', error)
}

export const resetPasswordApi = {
  /**
   * 이메일 인증번호 보내기 (비밀번호 재설정용)
   */
  sendAuthNumber: (data: SendAuthNumberData) => {
    return apiClient.post(`/users/send_authnumber/password_reset`, data)
  },

  /**
   * 이메일 인증번호 확인 (비밀번호 재설정용)
   */
  verifyEmail: (data: EmailAuthData) => {
    return apiClient.post(`/users/signup_emailauth/password_reset`, data)
  },

  /**
   * 비밀번호 재설정
   */
  resetPassword: (data: PasswordResetData) => {
    return apiClient.post(`/users/password_reset`, data)
  }
}

// 에러 처리 유틸리티
export const handleResetPasswordError = (error: any) => {
  if (error?.response?.status === 404) {
    return '등록되지 않은 이메일입니다.'
  }
  
  if (error?.response?.status === 400) {
    const data = error?.response?.data
    if (data?.auth_number) {
      return '인증번호가 올바르지 않습니다.'
    }
    if (data?.password) {
      return '비밀번호가 조건에 맞지 않습니다.'
    }
    if (data?.email) {
      return '유효하지 않은 이메일 형식입니다.'
    }
  }
  
  if (error?.response?.status === 410) {
    return '인증번호가 만료되었습니다. 다시 요청해주세요.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '비밀번호 재설정 중 오류가 발생했습니다.'
  
  return message
}