/**
 * 통합 API 클라이언트
 * 모든 API 호출을 위한 중앙화된 Axios 인스턴스
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, validateEnvironment, isValidUrl } from '@/lib/config';

/**
 * 토큰 파싱 유틸리티
 * localStorage의 VGID 토큰을 다양한 형식에서 추출
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const vgidData = localStorage.getItem('VGID');
  if (!vgidData) return null;
  
  try {
    // JSON 형식 시도
    const parsed = JSON.parse(vgidData);
    // 다양한 필드명 체크 (우선순위: access > token > access_token)
    return parsed.access || parsed.token || parsed.access_token || null;
  } catch {
    // JSON 파싱 실패시 문자열 그대로 반환
    return vgidData;
  }
}

/**
 * API 클라이언트 초기화 및 검증
 */
const initializeApiClient = () => {
  // 환경변수 검증
  try {
    validateEnvironment();
  } catch (error) {
    console.error('[API Client] Environment validation failed:', error);
    throw error;
  }

  // API_BASE_URL 유효성 검사
  if (!isValidUrl(API_BASE_URL)) {
    const error = new Error(`Invalid API_BASE_URL: ${API_BASE_URL}`);
    console.error('[API Client] URL validation failed:', error);
    throw error;
  }

  // 상대 경로로 해석되는 것을 방지하기 위한 추가 검증
  if (!API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
    const error = new Error(`API_BASE_URL must include protocol: ${API_BASE_URL}`);
    console.error('[API Client] Protocol missing:', error);
    throw error;
  }

  // 잘못된 도메인 패턴 검사 (www.vlanet.net 같은 상대 경로 문제)
  if (API_BASE_URL.includes('www.vlanet.net') || API_BASE_URL.includes('///')) {
    const error = new Error(`API_BASE_URL contains invalid pattern: ${API_BASE_URL}`);
    console.error('[API Client] Invalid URL pattern detected:', error);
    throw error;
  }

  // Railway 도메인 검증 (추가 보안)
  if (!API_BASE_URL.includes('railway.app') && !API_BASE_URL.includes('localhost')) {
    console.warn('[API Client] Warning: API_BASE_URL does not contain expected railway.app domain:', API_BASE_URL);
  }

  // 최종 URL 테스트
  try {
    const testUrl = new URL('/test', API_BASE_URL);
    console.log('[API Client] URL construction test passed:', testUrl.href);
  } catch (error) {
    const urlError = new Error(`Failed to construct URL with baseURL: ${API_BASE_URL}`);
    console.error('[API Client] URL construction test failed:', urlError);
    throw urlError;
  }

  console.log(`[API Client] Initialized with baseURL: ${API_BASE_URL}`);
  
  return axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // 쿠키 포함
    timeout: 30000, // 30초 타임아웃
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * 메인 API 클라이언트 인스턴스
 */
export const apiClient: AxiosInstance = initializeApiClient();

/**
 * 요청 인터셉터 - 토큰 자동 첨부
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 토큰 자동 첨부
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 디버그 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 에러 처리 및 자동 리다이렉트
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공 응답 처리
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // 에러 응답 처리
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // 토큰 제거
        localStorage.removeItem('VGID');
        localStorage.removeItem('access_token');
        
        // 로그인 페이지로 리다이렉트
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }
    
    // 500 Internal Server Error
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 재시도 로직이 포함된 API 클라이언트
 * 네트워크 오류 시 지수 백오프로 재시도
 */
export const apiClientWithRetry = axios.create({
  ...apiClient.defaults,
});

// 재시도 인터셉터 추가
let retryCount = 0;
const MAX_RETRY = 3;
const RETRY_DELAY = 1000; // 1초

apiClientWithRetry.interceptors.response.use(
  (response) => {
    retryCount = 0; // 성공시 카운트 리셋
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // 네트워크 오류 또는 5xx 에러시 재시도
    if (
      retryCount < MAX_RETRY &&
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' ||
       (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      retryCount++;
      
      // 지수 백오프 딜레이
      const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
      console.log(`[API Retry] Attempt ${retryCount}/${MAX_RETRY} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 토큰 재설정
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return apiClientWithRetry(config);
    }
    
    retryCount = 0;
    return Promise.reject(error);
  }
);

/**
 * API 헬퍼 함수들
 */
export const api = {
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config),
};

/**
 * 파일 업로드용 API 클라이언트
 */
export const fileApiClient = axios.create({
  baseURL: API_BASE_URL, // 이미 검증된 URL 사용
  withCredentials: true,
  timeout: 300000, // 5분 (대용량 파일 고려)
});

// 파일 업로드 인터셉터 (토큰 추가)
fileApiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;