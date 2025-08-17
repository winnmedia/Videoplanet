// 회원가입 관련 타입
export interface SignupData {
  email: string
  password: string
  password2: string
  name: string
  phone: string
  company: string
  agreeTerms: boolean
  agreePrivacy: boolean
}

// API 응답 타입
export interface AuthResponse {
  access: string
  refresh: string
  user: User
  vridge_session?: any // 기존 시스템 호환성
}

export interface User {
  id: number
  email: string
  name: string
  company: string
  phone: string
  is_admin: boolean
  created_at: string
  updated_at?: string
  profile_image?: string
  is_active?: boolean
  last_login?: string
}

// 이메일 인증 관련 타입
export interface EmailAuthData {
  email: string
  auth_number: string
}

export interface SendAuthNumberData {
  email: string
}

// Redux 상태 타입
export interface SignUpState {
  loading: boolean
  error: string | null
  emailVerified: boolean
  authStep: 'email' | 'verification' | 'signup' | 'completed'
}

// 컴포넌트 Props 타입
export interface SignupFormProps {
  onSubmit: (data: SignupData) => void
  loading?: boolean
  error?: string | null
}

export interface EmailVerificationProps {
  email: string
  onVerificationComplete: () => void
  onResendCode: () => void
  loading?: boolean
  error?: string | null
}

// 인증 컨텍스트 타입
export interface SignUpContextType {
  signUpState: SignUpState
  signup: (data: SignupData) => Promise<void>
  sendVerificationCode: (email: string) => Promise<void>
  verifyEmail: (email: string, authNumber: string) => Promise<void>
  clearError: () => void
  resetSignUp: () => void
}

// API 에러 타입
export interface ApiError {
  message: string
  detail?: string
  code?: string | number
  field_errors?: Record<string, string[]>
}

// 폼 검증 타입
export interface FormValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: FormValidationError[]
}

// 약관 동의 타입
export interface TermsAgreement {
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeMarketing?: boolean
}