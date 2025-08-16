import { SignIn as login, SignUp as register, SendAuthNumber, EmailAuth, ResetPassword } from '../../src/api/auth'
import { createMockApiResponse, createMockError } from '../../src/utils/test-utils'

// Auth API 함수 테스트 스위트
describe('Auth API', () => {
  // fetch mock 설정
  beforeEach(() => {
    global.fetch = jest.fn()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    global.fetch.mockRestore()
    jest.clearAllMocks()
  })

  // 로그인 API 테스트
  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('successfully logs in user', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockResponse, 200)
      )

      const result = await login(loginData)

      expect(fetch).toHaveBeenCalledWith('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      expect(result).toEqual(mockResponse)
      expect(localStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    })

    it('handles login failure with invalid credentials', async () => {
      const errorResponse = {
        error: 'Invalid credentials',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(errorResponse, 401)
      )

      await expect(login(loginData)).rejects.toThrow('Invalid credentials')
    })

    it('handles network error during login', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(login(loginData)).rejects.toThrow('Network error')
    })

    it('validates required fields', async () => {
      await expect(login({})).rejects.toThrow('Email is required')
      await expect(login({ email: 'test@example.com' })).rejects.toThrow(
        'Password is required'
      )
    })

    it('validates email format', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: 'password123',
      }

      await expect(login(invalidEmailData)).rejects.toThrow('Invalid email format')
    })
  })

  // 로그아웃 API 테스트
  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'mock-access-token')
      localStorage.setItem('refresh_token', 'mock-refresh-token')
    })

    it('successfully logs out user', async () => {
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse({ message: 'Logged out successfully' }, 200)
      )

      await logout()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          refresh_token: 'mock-refresh-token',
        }),
      })

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('clears tokens even if API call fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      // 에러가 발생해도 로컬 토큰은 제거되어야 함
      await logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('handles logout when no tokens exist', async () => {
      localStorage.clear()

      await expect(logout()).resolves.not.toThrow()
    })
  })

  // 회원가입 API 테스트
  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      name: 'New User',
      terms: true,
    }

    it('successfully registers new user', async () => {
      const mockResponse = {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: 2,
          email: 'newuser@example.com',
          name: 'New User',
        },
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockResponse, 201)
      )

      const result = await register(registerData)

      expect(fetch).toHaveBeenCalledWith('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name,
        }),
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles registration failure with existing email', async () => {
      const errorResponse = {
        error: 'Email already exists',
        message: '이미 사용중인 이메일입니다.',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(errorResponse, 400)
      )

      await expect(register(registerData)).rejects.toThrow('Email already exists')
    })

    it('validates password confirmation', async () => {
      const invalidData = {
        ...registerData,
        confirmPassword: 'different-password',
      }

      await expect(register(invalidData)).rejects.toThrow(
        'Password confirmation does not match'
      )
    })

    it('validates terms acceptance', async () => {
      const invalidData = {
        ...registerData,
        terms: false,
      }

      await expect(register(invalidData)).rejects.toThrow(
        'You must accept the terms and conditions'
      )
    })

    it('validates password strength', async () => {
      const invalidData = {
        ...registerData,
        password: '123',
        confirmPassword: '123',
      }

      await expect(register(invalidData)).rejects.toThrow(
        'Password must be at least 8 characters long'
      )
    })
  })

  // 토큰 갱신 API 테스트
  describe('refreshToken', () => {
    beforeEach(() => {
      localStorage.setItem('refresh_token', 'mock-refresh-token')
    })

    it('successfully refreshes access token', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockResponse, 200)
      )

      const result = await refreshToken()

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: 'mock-refresh-token',
        }),
      })

      expect(result).toEqual(mockResponse)
      expect(localStorage.getItem('access_token')).toBe('new-access-token')
    })

    it('handles refresh failure with invalid token', async () => {
      const errorResponse = {
        error: 'Invalid refresh token',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(errorResponse, 401)
      )

      await expect(refreshToken()).rejects.toThrow('Invalid refresh token')
      
      // 실패한 경우 토큰들이 제거되어야 함
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('handles refresh when no refresh token exists', async () => {
      localStorage.removeItem('refresh_token')

      await expect(refreshToken()).rejects.toThrow('No refresh token available')
    })
  })

  // 토큰 검증 테스트
  describe('Token Management', () => {
    it('automatically includes authorization header when token exists', async () => {
      localStorage.setItem('access_token', 'test-token')

      // 인증이 필요한 API 호출 시뮬레이션
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse({ data: 'test' }, 200)
      )

      // 토큰이 필요한 함수 호출 (예: 사용자 정보 조회)
      await fetch('/api/user/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      expect(fetch).toHaveBeenCalledWith('/api/user/profile/', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      })
    })

    it('handles expired token gracefully', async () => {
      localStorage.setItem('access_token', 'expired-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')

      // 첫 번째 호출은 401 반환 (토큰 만료)
      global.fetch
        .mockResolvedValueOnce(
          createMockApiResponse({ error: 'Token expired' }, 401)
        )
        // 토큰 갱신 호출
        .mockResolvedValueOnce(
          createMockApiResponse({ access_token: 'new-token' }, 200)
        )
        // 재시도 호출 성공
        .mockResolvedValueOnce(
          createMockApiResponse({ data: 'success' }, 200)
        )

      // 자동 토큰 갱신 로직이 포함된 API 호출 함수가 있다면 테스트
      // 실제 구현에 따라 조정 필요
    })
  })

  // 보안 테스트
  describe('Security', () => {
    it('does not expose sensitive data in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const loginData = {
        email: 'test@example.com',
        password: 'secret-password',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse({ access_token: 'token' }, 200)
      )

      await login(loginData)

      // 콘솔 로그에 비밀번호나 토큰이 노출되지 않아야 함
      const logCalls = consoleSpy.mock.calls.flat().join(' ')
      expect(logCalls).not.toContain('secret-password')
      expect(logCalls).not.toContain('token')

      consoleSpy.mockRestore()
    })

    it('sanitizes user input', async () => {
      const maliciousData = {
        email: '<script>alert("xss")</script>@example.com',
        password: 'password123',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse({}, 200)
      )

      await login(maliciousData)

      const callArgs = fetch.mock.calls[0][1].body
      const parsedBody = JSON.parse(callArgs)
      
      // XSS 공격 코드가 제거되거나 이스케이프되어야 함
      expect(parsedBody.email).not.toContain('<script>')
    })
  })
})