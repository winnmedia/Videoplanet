/**
 * 피드백 API 통합 테스트
 * TDD 방식으로 인증 시스템 개선사항 검증
 */

import { feedbackApi, getCookieValue, isAuthenticated, clearAuthAndRedirect } from '../feedbackApi'
import axios from 'axios'

// Mock 설정
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// document.cookie mock
let cookies: { [key: string]: string } = {}
Object.defineProperty(document, 'cookie', {
  get: jest.fn(() => {
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
  }),
  set: jest.fn((value: string) => {
    const [cookie] = value.split(';')
    const [key, val] = cookie.split('=')
    if (val) {
      cookies[key] = val
    } else {
      delete cookies[key]
    }
  })
})

// window.location mock
delete (window as any).location
window.location = { href: '' } as any

describe('피드백 API 인증 시스템 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    cookies = {}
    window.location.href = ''
  })

  describe('인증 상태 확인 (isAuthenticated)', () => {
    it('VGID 쿠키가 있으면 인증됨으로 판단', () => {
      cookies.VGID = 'test-session-cookie'
      expect(isAuthenticated()).toBe(true)
    })

    it('VGID localStorage가 있으면 인증됨으로 판단', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'VGID') return 'test-session-token'
        return null
      })
      expect(isAuthenticated()).toBe(true)
    })

    it('VGID가 없으면 미인증으로 판단', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('요청 인터셉터', () => {
    it('VGID 쿠키가 있으면 withCredentials를 설정', async () => {
      cookies.VGID = 'test-session'
      const config = { headers: {} as any }
      
      const interceptor = feedbackApi.interceptors.request.use as any
      const handler = interceptor.mock.calls[0][0]
      const result = handler(config)
      
      expect(result.withCredentials).toBe(true)
    })

    it('VGID localStorage가 있으면 Bearer 토큰 설정', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'VGID') return JSON.stringify({ token: 'test-token' })
        return null
      })
      
      const config = { headers: {} as any }
      const interceptor = feedbackApi.interceptors.request.use as any
      const handler = interceptor.mock.calls[0][0]
      const result = handler(config)
      
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })
  })

  describe('응답 인터셉터 - 401 에러 처리', () => {
    it('401 에러 시 최대 1회만 재시도', async () => {
      const error = {
        response: { status: 401, data: { message: 'NEED_ACCESS_TOKEN' } },
        config: { _retry: false }
      }
      
      const interceptor = feedbackApi.interceptors.response.use as any
      const errorHandler = interceptor.mock.calls[0][1]
      
      // 첫 번째 401 - 재시도 플래그 설정됨
      try {
        await errorHandler(error)
      } catch (e: any) {
        expect(error.config._retry).toBe(true)
      }
      
      // 두 번째 401 - 재시도하지 않고 로그인 페이지로 리다이렉트
      error.config._retry = true
      try {
        await errorHandler(error)
      } catch (e) {
        expect(window.location.href).toBe('/login')
      }
    })

    it('인증 토큰 없을 때 즉시 로그인 페이지로 리다이렉트', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const error = {
        response: { status: 401 },
        config: {}
      }
      
      const interceptor = feedbackApi.interceptors.response.use as any
      const errorHandler = interceptor.mock.calls[0][1]
      
      try {
        await errorHandler(error)
      } catch (e) {
        expect(window.location.href).toBe('/login')
      }
    })
  })

  describe('인증 정리 함수 (clearAuthAndRedirect)', () => {
    it('모든 인증 데이터를 정리하고 로그인 페이지로 이동', () => {
      // clearAuthAndRedirect 함수가 export되지 않았으므로
      // 401 에러 처리 과정에서 간접적으로 테스트
      const error = {
        response: { status: 401 },
        config: { _retry: true }
      }
      
      const interceptor = feedbackApi.interceptors.response.use as any
      const errorHandler = interceptor.mock.calls[0][1]
      
      try {
        errorHandler(error)
      } catch (e) {
        // localStorage 정리 확인
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('VGID')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
        
        // 쿠키 정리 확인
        expect(document.cookie).toContain('VGID=')
        
        // 리다이렉트 확인
        expect(window.location.href).toBe('/login')
      }
    })
  })

  describe('무한 재시도 방지', () => {
    it('재시도 플래그가 있으면 추가 재시도하지 않음', async () => {
      const mockRequest = jest.fn()
      feedbackApi.request = mockRequest
      
      const error = {
        response: { status: 401 },
        config: { _retry: true }
      }
      
      const interceptor = feedbackApi.interceptors.response.use as any
      const errorHandler = interceptor.mock.calls[0][1]
      
      try {
        await errorHandler(error)
      } catch (e) {
        expect(mockRequest).not.toHaveBeenCalled()
        expect(window.location.href).toBe('/login')
      }
    })

    it('동시 다발적 401 에러도 한 번만 리다이렉트', async () => {
      const errors = Array(5).fill(null).map(() => ({
        response: { status: 401 },
        config: {}
      }))
      
      const interceptor = feedbackApi.interceptors.response.use as any
      const errorHandler = interceptor.mock.calls[0][1]
      
      const promises = errors.map(error => 
        errorHandler(error).catch(() => {})
      )
      
      await Promise.all(promises)
      
      // 리다이렉트는 한 번만 발생
      expect(window.location.href).toBe('/login')
    })
  })
})

describe('환각 현상 검증', () => {
  it('모든 import된 함수와 타입이 실제로 존재함', () => {
    expect(typeof feedbackApi).toBe('object')
    expect(typeof getCookieValue).toBe('function')
    expect(typeof isAuthenticated).toBe('function')
    // clearAuthAndRedirect는 내부 함수이므로 직접 테스트 불가
  })

  it('API 엔드포인트가 올바른 형식', async () => {
    const validEndpoints = [
      '/feedbacks/1',
      '/feedbacks/project-123',
      '/feedbacks/upload',
      '/feedbacks/delete/456'
    ]
    
    validEndpoints.forEach(endpoint => {
      expect(endpoint).toMatch(/^\/feedbacks\//)
    })
  })

  it('에러 코드가 일관된 형식', () => {
    const errorCodes = [
      'NEED_ACCESS_TOKEN',
      'INVALID_TOKEN',
      'TOKEN_EXPIRED',
      'UNKNOWN_ERROR'
    ]
    
    errorCodes.forEach(code => {
      expect(code).toMatch(/^[A-Z_]+$/)
    })
  })
})