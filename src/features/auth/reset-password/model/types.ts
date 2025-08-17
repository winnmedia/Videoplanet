// 비밀번호 재설정 관련 타입
export interface PasswordResetData {
  email: string
  password: string
  auth_number: string
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
export interface ResetPasswordState {
  loading: boolean
  error: string | null
  emailVerified: boolean
  resetStep: 'email' | 'verification' | 'new-password' | 'completed'
  email: string
}

// 컴포넌트 Props 타입
export interface ResetPasswordFormProps {
  onSubmit: (data: PasswordResetData) => void
  loading?: boolean
  error?: string | null
}

export interface EmailInputProps {
  onSubmit: (email: string) => void
  loading?: boolean
  error?: string | null
}

export interface VerificationCodeProps {
  email: string
  onVerificationComplete: (authNumber: string) => void
  onResendCode: () => void
  loading?: boolean
  error?: string | null
}

export interface NewPasswordFormProps {
  email: string
  authNumber: string
  onSubmit: (password: string) => void
  loading?: boolean
  error?: string | null
}

// 인증 컨텍스트 타입
export interface ResetPasswordContextType {
  resetState: ResetPasswordState
  sendVerificationCode: (email: string) => Promise<void>
  verifyCode: (email: string, authNumber: string) => Promise<void>
  resetPassword: (data: PasswordResetData) => Promise<void>
  clearError: () => void
  resetFlow: () => void
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

// 비밀번호 정책 타입
export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}