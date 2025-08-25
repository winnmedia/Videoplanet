import { User } from '../model/auth.slice'

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  agreeToMarketing?: boolean
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

interface ApiError {
  message: string
  field?: string
  code?: string
}

class AuthAPIError extends Error {
  constructor(public status: number, public data: ApiError) {
    super(data.message)
    this.name = 'AuthAPIError'
  }
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add auth token if available (for authenticated requests)
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('accessToken') 
    : null
    
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'An error occurred' 
      }))
      throw new AuthAPIError(response.status, errorData)
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof AuthAPIError) {
      throw error
    }
    
    // Network or other errors
    throw new Error('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  }
}

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })
      
      // Store access token for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('isAuthenticated', 'true')
      }
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 400:
            throw new Error('잘못된 요청입니다. 입력 정보를 확인해주세요.')
          case 401:
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
          case 403:
            throw new Error('이메일 인증이 필요합니다.')
          case 429:
            throw new Error('너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async register(data: RegisterData): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          marketing_consent: data.agreeToMarketing,
        }),
      })
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 400:
            if (error.data.field === 'email') {
              throw new Error('이미 사용 중인 이메일입니다.')
            }
            throw new Error('입력 정보를 확인해주세요.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async socialLogin(provider: 'google' | 'kakao' | 'naver', token: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>(`/auth/social/${provider}`, {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      
      // Store access token for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('isAuthenticated', 'true')
      }
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 400:
            throw new Error('소셜 로그인 토큰이 유효하지 않습니다.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 404:
            throw new Error('등록되지 않은 이메일입니다.')
          case 429:
            throw new Error('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          token, 
          password: newPassword 
        }),
      })
      
      // Store access token for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('isAuthenticated', 'true')
      }
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 400:
            throw new Error('비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 400:
            throw new Error('이메일 인증 링크가 만료되었거나 유효하지 않습니다.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 429:
            throw new Error('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      
      // Update access token
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken)
      }
      
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 401:
            throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  },

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      
      // Clear stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('isAuthenticated')
      }
      
      return response
    } catch (error) {
      // Even if logout API fails, we should clear local tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('isAuthenticated')
      }
      
      console.error('Logout API error:', error)
      return { message: 'Logged out locally' }
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiRequest<User>('/auth/me')
      return response
    } catch (error) {
      if (error instanceof AuthAPIError) {
        switch (error.status) {
          case 401:
            throw new Error('인증이 필요합니다.')
          case 500:
            throw new Error('서버 오류가 발생했습니다.')
          default:
            throw new Error(error.message)
        }
      }
      throw error
    }
  }
}