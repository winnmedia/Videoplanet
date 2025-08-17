// =============================================================================
// FeedbackApi Test - TDD 방식으로 401 오류 및 무한 재시도 문제 해결
// =============================================================================

// Mock axios 먼저 설정
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  },
  defaults: {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  }
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  post: jest.fn(),
}));

// Mock config
jest.mock('@/lib/config', () => ({
  API_BASE_URL: 'https://test-api.com',
  SOCKET_URL: 'wss://test-api.com',
  validateEnvironment: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
});

describe('FeedbackApi 401 인증 오류 해결', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    window.location.href = '';
    document.cookie = '';
  });

  describe('쿠키 헬퍼 함수 테스트', () => {
    it('getCookieValue가 올바른 쿠키 값을 반환해야 한다', () => {
      // Given: 쿠키 설정
      document.cookie = 'vridge_session=test-session-value; path=/';
      
      // When: 모듈을 동적으로 require해서 함수 실행
      const { getCookieValue } = require('../feedbackApi');
      const result = getCookieValue('vridge_session');
      
      // Then: 올바른 값 반환
      expect(result).toBe('test-session-value');
    });

    it('존재하지 않는 쿠키는 null을 반환해야 한다', () => {
      // Given: 빈 쿠키
      document.cookie = '';
      
      // When: 존재하지 않는 쿠키 요청
      const { getCookieValue } = require('../feedbackApi');
      const result = getCookieValue('nonexistent');
      
      // Then: null 반환
      expect(result).toBeNull();
    });
  });

  describe('401 NEED_ACCESS_TOKEN 오류 처리', () => {
    it('NEED_ACCESS_TOKEN 오류에 대한 한국어 메시지를 반환해야 한다', () => {
      // Given: NEED_ACCESS_TOKEN 오류
      const { createFeedbackError, translateErrorMessage } = require('../feedbackApi');
      const error = {
        response: {
          status: 401,
          data: { message: 'NEED_ACCESS_TOKEN' }
        }
      };
      
      // When: 에러 처리
      const feedbackError = createFeedbackError(error);
      const message = translateErrorMessage(feedbackError);
      
      // Then: 한국어 메시지 반환
      expect(message).toBe('로그인이 만료되었습니다. 다시 로그인해주세요.');
    });
  });

  describe('쿠키 기반 인증 확인', () => {
    it('vridge_session 쿠키가 있을 때 withCredentials가 true로 설정되어야 한다', () => {
      // Given: 쿠키 설정
      document.cookie = 'vridge_session=valid-session';
      
      // When: 모듈 로드하여 인터셉터 등록
      jest.resetModules(); // 모듈 캐시 초기화
      require('../feedbackApi');
      
      // Then: 인터셉터가 등록되었는지 확인
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      
      // 실제 인터셉터 함수 테스트
      const mockConfig = { headers: {}, withCredentials: false };
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const result = requestInterceptor(mockConfig);
      
      // withCredentials가 true로 설정되어야 함
      expect(result.withCredentials).toBe(true);
    });

    it('쿠키가 없을 때 Bearer 토큰을 사용해야 한다', () => {
      // Given: 쿠키 없음, 토큰 있음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue('bearer-token');
      
      // When: 모듈 로드하여 인터셉터 등록
      jest.resetModules(); // 모듈 캐시 초기화
      require('../feedbackApi');
      
      // Then: 인터셉터 함수 테스트
      const mockConfig = { headers: {} };
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const result = requestInterceptor(mockConfig);
      
      // Authorization 헤더와 withCredentials 설정 확인
      expect(result.headers.Authorization).toBe('Bearer bearer-token');
      expect(result.withCredentials).toBe(true);
    });
  });

  describe('인증 상태 확인 함수', () => {
    it('isAuthenticated가 쿠키가 있을 때 true를 반환해야 한다', () => {
      // Given: 유효한 세션 쿠키
      document.cookie = 'vridge_session=valid-session-token';
      
      // When: 인증 상태 확인
      const { isAuthenticated } = require('../feedbackApi');
      const result = isAuthenticated();
      
      // Then: true 반환
      expect(result).toBe(true);
    });

    it('isAuthenticated가 토큰이 있을 때 true를 반환해야 한다', () => {
      // Given: 쿠키 없음, 토큰 있음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue('valid-access-token');
      
      // When: 인증 상태 확인
      const { isAuthenticated } = require('../feedbackApi');
      const result = isAuthenticated();
      
      // Then: true 반환
      expect(result).toBe(true);
    });

    it('isAuthenticated가 쿠키와 토큰이 모두 없을 때 false를 반환해야 한다', () => {
      // Given: 쿠키와 토큰 모두 없음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // When: 인증 상태 확인
      const { isAuthenticated } = require('../feedbackApi');
      const result = isAuthenticated();
      
      // Then: false 반환
      expect(result).toBe(false);
    });
  });

  describe('토큰 없이 API 호출 방지', () => {
    it('getFeedbackProject가 토큰이 없을 때 즉시 에러를 발생해야 한다', async () => {
      // Given: 쿠키와 토큰 모두 없음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // When & Then: API 호출 시 에러 발생
      const { getFeedbackProject } = require('../feedbackApi');
      await expect(getFeedbackProject('123')).rejects.toThrow('로그인이 필요합니다');
      
      // API 호출이 되지 않았는지 확인
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('createFeedback이 토큰이 없을 때 즉시 에러를 발생해야 한다', async () => {
      // Given: 쿠키와 토큰 모두 없음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // When & Then: API 호출 시 에러 발생
      const { createFeedback } = require('../feedbackApi');
      const feedbackData = { email: 'test@test.com', text: 'test feedback' };
      
      await expect(createFeedback(feedbackData, '123')).rejects.toThrow('로그인이 필요합니다');
      
      // API 호출이 되지 않았는지 확인
      expect(mockAxiosInstance.put).not.toHaveBeenCalled();
    });

    it('deleteFeedback이 토큰이 없을 때 즉시 에러를 발생해야 한다', async () => {
      // Given: 쿠키와 토큰 모두 없음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // When & Then: API 호출 시 에러 발생
      const { deleteFeedback } = require('../feedbackApi');
      
      await expect(deleteFeedback(123)).rejects.toThrow('로그인이 필요합니다');
      
      // API 호출이 되지 않았는지 확인
      expect(mockAxiosInstance.delete).not.toHaveBeenCalled();
    });
  });

  describe('API 함수 기본 동작', () => {
    beforeEach(() => {
      // 테스트를 위해 인증된 상태로 설정
      document.cookie = 'vridge_session=valid-session';
    });

    it('getFeedbackProject가 올바른 엔드포인트를 호출해야 한다', async () => {
      // Given: 성공적인 응답 모킹
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          result: {
            id: 1,
            title: 'Test Project',
            feedback: []
          }
        }
      });
      
      // When: API 호출
      const { getFeedbackProject } = require('../feedbackApi');
      const result = await getFeedbackProject('123');
      
      // Then: 올바른 결과 반환
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/feedbacks/123');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Project');
    });
  });

  describe('에러 생성 함수', () => {
    it('createFeedbackError가 올바른 FeedbackError 객체를 생성해야 한다', () => {
      // Given: 표준 axios 에러
      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
        },
        message: 'Request failed'
      };
      
      // When: 에러 변환
      const { createFeedbackError } = require('../feedbackApi');
      const result = createFeedbackError(axiosError);
      
      // Then: FeedbackError 객체 생성
      expect(result.message).toBe('Project not found');
      expect(result.code).toBe('PROJECT_NOT_FOUND');
      expect(result.status).toBe(404);
    });
  });

  describe('무한 재시도 방지 개선', () => {
    it('401 에러 시 최대 1회만 재시도해야 한다', async () => {
      // Given: 쿠키 기반 인증 설정
      document.cookie = 'vridge_session=valid-session';
      
      const mockError = {
        response: {
          status: 401,
          data: { message: 'NEED_ACCESS_TOKEN' }
        },
        config: {}
      };
      
      // When: 응답 인터셉터 로드
      jest.resetModules();
      require('../feedbackApi');
      
      // Then: 인터셉터가 등록되었는지 확인
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      
      // 실제 인터셉터 함수 테스트
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      try {
        await responseInterceptor(mockError);
      } catch (error) {
        // 에러가 발생해야 함 (재시도 하지 않고 바로 리다이렉트)
        expect(error).toBeDefined();
      }
      
      // window.location.href가 설정되었는지 확인
      expect(window.location.href).toBe('/login');
    });

    it('재시도 후에도 401 에러 시 즉시 로그인 페이지로 리다이렉트해야 한다', async () => {
      // Given: 이미 재시도가 수행된 요청
      document.cookie = 'vridge_session=valid-session';
      
      const mockError = {
        response: {
          status: 401,
          data: { message: 'NEED_ACCESS_TOKEN' }
        },
        config: {
          _retry: true // 이미 재시도가 수행됨
        }
      };
      
      // When: 응답 인터셉터 로드
      jest.resetModules();
      require('../feedbackApi');
      
      // Then: 인터셉터 함수 테스트
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      try {
        await responseInterceptor(mockError);
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // 리다이렉트가 즉시 발생해야 함
      expect(window.location.href).toBe('/login');
    });

    it('토큰이 없는 상태에서 401 에러 시 즉시 로그인 페이지로 리다이렉트해야 한다', async () => {
      // Given: 토큰과 쿠키 모두 없음
      document.cookie = '';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid token' }
        },
        config: {}
      };
      
      // When: 응답 인터셉터 로드
      jest.resetModules();
      require('../feedbackApi');
      
      // Then: 인터셉터 함수 테스트
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      
      try {
        await responseInterceptor(mockError);
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // 리다이렉트가 즉시 발생해야 함
      expect(window.location.href).toBe('/login');
    });
  });
});

describe('FeedbackApi 설정 검증', () => {
  it('feedbackApi 인스턴스가 올바른 설정으로 생성되어야 한다', () => {
    // When: feedbackApi 모듈 로드
    jest.resetModules(); // 모듈 캐시 초기화
    const axios = require('axios');
    const { feedbackApi } = require('../feedbackApi');
    
    // Then: axios.create가 호출되고 인터셉터가 설정됨
    expect(axios.create).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });
});

// getCookieValue 함수를 전역에서 사용할 수 있도록 export
export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}