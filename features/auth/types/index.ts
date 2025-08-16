// 로그인 관련 타입
export interface LoginCredentials {
  email: string
  password: string
}

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

// Redux 상태 타입
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// 이메일 인증 관련 타입
export interface EmailVerificationParams {
  uid: string
  token: string
}

export interface EmailAuthData {
  email: string
  auth_number: string
}

export interface SendAuthNumberData {
  email: string
}

// 비밀번호 관련 타입
export interface PasswordResetData {
  email: string
  password: string
  auth_number: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  new_password2: string
}

// 프로필 업데이트 타입
export interface UpdateProfileData {
  name?: string
  phone?: string
  company?: string
  profile_image?: File | string
}

// 사용자 메모 타입
export interface UserMemo {
  id: number
  content: string
  project_id?: number
  created_at: string
  updated_at: string
}

export interface CreateMemoData {
  content: string
  project_id?: number
}

// API 에러 타입
export interface ApiError {
  message: string
  detail?: string
  code?: string | number
  field_errors?: Record<string, string[]>
}

// 토큰 관련 타입
export interface TokenData {
  access: string
  refresh: string
  expires_in?: number
  token_type?: string
}

// 초대 관련 타입
export interface InvitationData {
  project_id: number
  project_name: string
  inviter_name: string
  inviter_email: string
  role: 'admin' | 'member' | 'viewer'
  expires_at: string
}

export interface AcceptInvitationData {
  uid: string
  token: string
  accept?: boolean
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

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  changePassword: (data: ChangePasswordData) => Promise<void>
  clearError: () => void
  refreshUserData: () => Promise<void>
}

// 컴포넌트 Props 타입들
export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void
  loading?: boolean
  error?: string | null
  initialEmail?: string
}

export interface SignupFormProps {
  onSubmit: (data: SignupData) => void
  loading?: boolean
  error?: string | null
}

export interface ProfileFormProps {
  user: User
  onSubmit: (data: UpdateProfileData) => void
  loading?: boolean
  error?: string | null
}

// 라우터 관련 타입
export interface AuthRedirectParams {
  returnTo?: string
  uid?: string
  token?: string
}

// 소셜 로그인 타입
export type SocialProvider = 'google' | 'kakao' | 'naver' | 'github'

export interface SocialAuthData {
  provider: SocialProvider
  access_token: string
  id_token?: string
}