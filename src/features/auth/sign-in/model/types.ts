// 로그인 관련 타입
export interface LoginCredentials {
  email: string
  password: string
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

// Redux 상태 타입
export interface SignInState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// 토큰 관련 타입
export interface TokenData {
  access: string
  refresh: string
  expires_in?: number
  token_type?: string
}

// 컴포넌트 Props 타입
export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void
  loading?: boolean
  error?: string | null
  initialEmail?: string
}

// 인증 컨텍스트 타입
export interface SignInContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  refreshUserData: () => Promise<void>
}

// 라우터 관련 타입
export interface AuthRedirectParams {
  returnTo?: string
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