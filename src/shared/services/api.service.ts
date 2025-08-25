/**
 * API Service for Dashboard
 * Handles all HTTP requests to backend with comprehensive error handling,
 * caching, compression, and performance optimization
 */

import { cacheManager, createCacheKey, CACHE_TTL, CacheInvalidator } from '@/shared/lib/cache/cacheManager';

// Use Next.js API routes for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL === 'http://localhost:8000' 
  ? '/api'  // Use Next.js API routes
  : (process.env.NEXT_PUBLIC_API_URL || '/api');

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  invalidatePattern?: string;
  compress?: boolean;
  cache?: RequestCache; // Use standard RequestCache type
}

interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: string;
  };
}

class ApiService {
  private retryCount = 3;
  private retryDelay = 1000;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private compressionThreshold = 1024; // 1KB

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    retries = this.retryCount
  ): Promise<ApiResponse<T>> {
    // 캐시 처리
    const cacheKey = options.cacheKey || createCacheKey(endpoint, options.body ? JSON.parse(options.body as string) : undefined);
    const useCache = options.useCache !== false && options.method === 'GET';
    
    if (useCache) {
      const cachedData = cacheManager.get<T>(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          message: 'Cached response',
        };
      }
    }

    // 중복 요청 방지 (Request Deduplication)
    const requestKey = `${options.method || 'GET'}-${cacheKey}`;
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const requestPromise = this.performRequest<T>(endpoint, options, retries, cacheKey, useCache);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  private async performRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retries = this.retryCount,
    cacheKey: string,
    useCache: boolean
  ): Promise<ApiResponse<T>> {
    // 토큰 확인 및 검증
    const token = this.getAuthToken();
    
    // 요청 구성
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br', // 압축 지원
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // ETag 지원 (조건부 요청)
    if (useCache) {
      const etag = cacheManager.getETag(cacheKey);
      if (etag) {
        config.headers = {
          ...config.headers,
          'If-None-Match': etag,
        };
      }
    }

    // 요청 바디 검증 (POST, PUT, PATCH)
    if (options.body && typeof options.body === 'string') {
      try {
        JSON.parse(options.body);
      } catch (e) {
        throw new ApiError(400, 'Invalid JSON in request body');
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // 401 Unauthorized - 토큰 만료
      if (response.status === 401) {
        this.clearAuthToken();
        // 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Authentication required');
      }

      // 403 Forbidden - 권한 부족
      if (response.status === 403) {
        throw new ApiError(403, 'Permission denied');
      }

      // 404 Not Found
      if (response.status === 404) {
        throw new ApiError(404, `Resource not found: ${endpoint}`);
      }

      // 400 Bad Request
      if (response.status === 400) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(400, 'Bad request', errorData);
      }

      // 429 Too Many Requests - Rate limiting
      if (response.status === 429) {
        if (retries > 0) {
          await this.sleep(this.retryDelay * (this.retryCount - retries + 1));
          return this.request(endpoint, options, retries - 1);
        }
        throw new ApiError(429, 'Too many requests');
      }

      // 500+ Server Errors - 재시도
      if (response.status >= 500) {
        if (retries > 0) {
          await this.sleep(this.retryDelay);
          return this.request(endpoint, options, retries - 1);
        }
        throw new ApiError(response.status, 'Server error');
      }
      
      // 304 Not Modified - 캐시 사용
      if (response.status === 304 && useCache) {
        const cachedData = cacheManager.get<T>(cacheKey);
        if (cachedData) {
          return {
            data: cachedData,
            status: 304,
            message: 'Not modified',
          };
        }
      }
      
      // 성공적인 응답
      if (response.ok) {
        const data = await this.parseResponse<T>(response);
        
        // 캐시 저장
        if (useCache) {
          const ttl = options.cacheTTL || CACHE_TTL.MEDIUM;
          const etag = response.headers.get('etag');
          cacheManager.set(cacheKey, data, { ttl, etag: etag || undefined });
        }
        
        // 관련 캐시 무효화
        if (options.invalidatePattern && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
          CacheInvalidator.invalidateRelated(options.invalidatePattern);
        }
        
        return {
          data,
          status: response.status,
        };
      }
      
      // 기타 오류
      throw new ApiError(response.status, response.statusText);
      
    } catch (error) {
      // 네트워크 오류
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (retries > 0) {
          await this.sleep(this.retryDelay);
          return this.request(endpoint, options, retries - 1);
        }
        throw new ApiError(0, 'Network error - please check your connection');
      }
      
      // ApiError는 그대로 전달
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 기타 예상치 못한 오류
      console.error('Unexpected API error:', error);
      throw new ApiError(0, 'Unexpected error occurred');
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new ApiError(500, 'Invalid JSON response from server');
      }
    }
    
    // JSON이 아닌 경우 텍스트로 반환
    const text = await response.text();
    return text as unknown as T;
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (e) {
      return null;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('auth_token');
    
    // 토큰 유효성 기본 검사
    if (token && token.split('.').length !== 3) {
      console.warn('Invalid token format');
      this.clearAuthToken();
      return null;
    }
    
    return token;
  }

  private clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.setItem('isAuthenticated', 'false');
    }
  }

  // 페이지네이션 헬퍼
  private buildPaginationQuery(params?: PaginationParams): string {
    if (!params) return '';
    
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.cursor) query.append('cursor', params.cursor);
    
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Notification APIs with validation and caching
  async getFeedbackNotifications(pagination?: PaginationParams) {
    const endpoint = `/notifications/feedback/${this.buildPaginationQuery(pagination)}`;
    try {
      return await this.request(endpoint, {
        useCache: true,
        cacheTTL: CACHE_TTL.SHORT, // 30초 캐시
      });
    } catch (error) {
      // 실패시 빈 배열 반환
      console.error('Failed to fetch feedback notifications:', error);
      return { data: [], status: 200 };
    }
  }

  async getProjectNotifications(pagination?: PaginationParams) {
    const endpoint = `/notifications/project/${this.buildPaginationQuery(pagination)}`;
    try {
      return await this.request(endpoint, {
        useCache: true,
        cacheTTL: CACHE_TTL.SHORT,
      });
    } catch (error) {
      console.error('Failed to fetch project notifications:', error);
      return { data: [], status: 200 };
    }
  }

  async markAsRead(notificationId: string) {
    if (!notificationId) {
      throw new ApiError(400, 'Notification ID is required');
    }
    
    return this.request(`/notifications/${encodeURIComponent(notificationId)}/read/`, {
      method: 'POST',
      invalidatePattern: '*/notifications/*', // 알림 캐시 무효화
    });
  }

  async markAllAsRead(type?: 'feedback' | 'project') {
    const validTypes = ['feedback', 'project'];
    if (type && !validTypes.includes(type)) {
      throw new ApiError(400, 'Invalid notification type');
    }
    
    return this.request('/notifications/mark-all-read/', {
      method: 'POST',
      body: JSON.stringify({ type }),
      invalidatePattern: '*/notifications/*',
    });
  }

  // Dashboard APIs with fallbacks and caching
  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats/', {
        useCache: true,
        cacheTTL: CACHE_TTL.MEDIUM, // 5분 캐시
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // 기본값 반환
      return {
        data: {
          inProgress: 0,
          completed: 0,
          thisMonth: 0,
        },
        status: 200,
      };
    }
  }

  async getProjectProgress(pagination?: PaginationParams) {
    const endpoint = `/dashboard/progress/${this.buildPaginationQuery(pagination)}`;
    try {
      return await this.request(endpoint, {
        useCache: true,
        cacheTTL: CACHE_TTL.MEDIUM,
      });
    } catch (error) {
      console.error('Failed to fetch project progress:', error);
      return { data: [], status: 200 };
    }
  }

  async getDashboardSummary() {
    try {
      return await this.request('/dashboard/summary/', {
        useCache: true,
        cacheTTL: CACHE_TTL.LONG, // 30분 캐시
      });
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      return { data: null, status: 200 };
    }
  }

  // Delete notification with validation
  async deleteNotification(notificationId: string) {
    if (!notificationId) {
      throw new ApiError(400, 'Notification ID is required');
    }
    
    return this.request(`/notifications/${encodeURIComponent(notificationId)}/`, {
      method: 'DELETE',
      invalidatePattern: '*/notifications/*',
    });
  }

  // Health check endpoint
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 캐시 관리 메서드
  clearCache(): void {
    cacheManager.clear();
  }

  getCacheStats() {
    return cacheManager.getStats();
  }

  // 캐시 워밍 - 미리 데이터 로드
  async warmCache(): Promise<void> {
    const endpoints = [
      '/dashboard/stats/',
      '/dashboard/progress/',
      '/notifications/feedback/',
      '/notifications/project/',
    ];

    await Promise.all(
      endpoints.map(endpoint => 
        this.request(endpoint, { useCache: true }).catch(() => {})
      )
    );
  }

  // 배치 요청 처리
  async batch<T>(requests: Array<{ endpoint: string; options?: RequestOptions }>): Promise<ApiResponse<T>[]> {
    return Promise.all(
      requests.map(({ endpoint, options }) => 
        this.request<T>(endpoint, options)
      )
    );
  }
}

export const apiService = new ApiService();
export default apiService;