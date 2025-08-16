import { renderHook, act, waitFor } from '@testing-library/react'
import { useAxios } from '../../src/hooks/useAxios'
import { createMockApiResponse } from '../../src/utils/test-utils'

// useAxios 커스텀 훅 테스트 스위트
describe('useAxios Hook', () => {
  // Mock fetch 설정
  beforeEach(() => {
    global.fetch = jest.fn()
    jest.clearAllMocks()
  })

  afterEach(() => {
    global.fetch.mockRestore()
  })

  // 기본 기능 테스트
  describe('Basic Functionality', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useAxios('/api/test'))

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.execute).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })

    it('executes GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test Data' }
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockData, 200)
      )

      const { result } = renderHook(() => useAxios('/api/test'))

      act(() => {
        result.current.execute()
      })

      // 로딩 상태 확인
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()

      // 요청 완료 대기
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('handles POST request with data', async () => {
      const requestData = { name: 'New Item', description: 'Test description' }
      const responseData = { id: 2, ...requestData }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(responseData, 201)
      )

      const { result } = renderHook(() => 
        useAxios('/api/test', {
          method: 'POST',
          data: requestData,
        })
      )

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(responseData)
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
    })
  })

  // 에러 처리 테스트
  describe('Error Handling', () => {
    it('handles HTTP error responses', async () => {
      const errorResponse = {
        error: 'Not Found',
        message: 'Resource not found',
      }

      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(errorResponse, 404)
      )

      const { result } = renderHook(() => useAxios('/api/nonexistent'))

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toEqual(
        expect.objectContaining({
          status: 404,
          message: expect.stringContaining('Not Found'),
        })
      )
    })

    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAxios('/api/test'))

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('Network error'),
        })
      )
    })

    it('handles timeout errors', async () => {
      // 타임아웃 시뮬레이션
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 6000))
      )

      const { result } = renderHook(() => 
        useAxios('/api/test', { timeout: 5000 })
      )

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 6000 })

      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('timeout'),
        })
      )
    })
  })

  // 인증 처리 테스트
  describe('Authentication', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('includes authorization header when token exists', async () => {
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse({ data: 'test' }, 200)
      )

      const { result } = renderHook(() => useAxios('/api/protected'))

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(fetch).toHaveBeenCalledWith('/api/protected', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      })
    })

    it('handles token refresh on 401 error', async () => {
      localStorage.setItem('refresh_token', 'refresh-token')

      // 첫 번째 요청: 401 에러
      global.fetch
        .mockResolvedValueOnce(
          createMockApiResponse({ error: 'Token expired' }, 401)
        )
        // 토큰 갱신 요청
        .mockResolvedValueOnce(
          createMockApiResponse({ access_token: 'new-token' }, 200)
        )
        // 재시도 요청 성공
        .mockResolvedValueOnce(
          createMockApiResponse({ data: 'success' }, 200)
        )

      const { result } = renderHook(() => 
        useAxios('/api/protected', { autoRefreshToken: true })
      )

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ data: 'success' })
      expect(localStorage.getItem('access_token')).toBe('new-token')
    })
  })

  // 캐싱 테스트
  describe('Caching', () => {
    it('returns cached data on subsequent calls', async () => {
      const mockData = { id: 1, name: 'Test Data' }
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockData, 200)
      )

      const { result } = renderHook(() => 
        useAxios('/api/test', { cache: true })
      )

      // 첫 번째 요청
      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(fetch).toHaveBeenCalledTimes(1)

      // 두 번째 요청 (캐시된 데이터 사용)
      act(() => {
        result.current.execute()
      })

      // fetch가 다시 호출되지 않아야 함
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(result.current.data).toEqual(mockData)
    })

    it('invalidates cache when specified', async () => {
      const mockData1 = { id: 1, name: 'First Data' }
      const mockData2 = { id: 1, name: 'Updated Data' }

      global.fetch
        .mockResolvedValueOnce(createMockApiResponse(mockData1, 200))
        .mockResolvedValueOnce(createMockApiResponse(mockData2, 200))

      const { result } = renderHook(() => 
        useAxios('/api/test', { cache: true })
      )

      // 첫 번째 요청
      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
      })

      // 캐시 무효화 후 재요청
      act(() => {
        result.current.execute({ invalidateCache: true })
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
      })

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  // 상태 리셋 테스트
  describe('State Reset', () => {
    it('resets state correctly', async () => {
      const mockData = { id: 1, name: 'Test Data' }
      global.fetch.mockResolvedValueOnce(
        createMockApiResponse(mockData, 200)
      )

      const { result } = renderHook(() => useAxios('/api/test'))

      // 요청 실행
      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      // 상태 리셋
      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })

  // 동시 요청 처리 테스트
  describe('Concurrent Requests', () => {
    it('cancels previous request when new one is made', async () => {
      const { result } = renderHook(() => useAxios('/api/test'))

      // 첫 번째 요청 시작
      act(() => {
        result.current.execute()
      })

      expect(result.current.loading).toBe(true)

      // 두 번째 요청 시작 (첫 번째 요청 취소되어야 함)
      act(() => {
        result.current.execute()
      })

      expect(result.current.loading).toBe(true)

      // AbortController가 사용되었는지 확인
      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  // 재시도 로직 테스트
  describe('Retry Logic', () => {
    it('retries failed requests', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockApiResponse({ data: 'success' }, 200))

      const { result } = renderHook(() => 
        useAxios('/api/test', { retries: 2, retryDelay: 100 })
      )

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      expect(result.current.data).toEqual({ data: 'success' })
      expect(fetch).toHaveBeenCalledTimes(3) // 최초 + 2회 재시도
    })

    it('stops retrying after max attempts', async () => {
      global.fetch.mockRejectedValue(new Error('Persistent error'))

      const { result } = renderHook(() => 
        useAxios('/api/test', { retries: 2, retryDelay: 100 })
      )

      act(() => {
        result.current.execute()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      expect(result.current.error).toBeTruthy()
      expect(fetch).toHaveBeenCalledTimes(3) // 최초 + 2회 재시도
    })
  })
})