export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  password2: string
  nickname?: string
}

export interface User {
  id: number
  email: string
  nickname?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  date_joined?: string
  [key: string]: any
}

export interface AuthResponse {
  vridge_session: string
  user: User
  message?: string
}

export interface AuthError {
  message: string
  status?: number
  [key: string]: any
}

export interface EmailVerificationParams {
  uid: string
  token: string
}

export interface PasswordResetData {
  email: string
  auth_number?: string
  new_password?: string
  new_password2?: string
}