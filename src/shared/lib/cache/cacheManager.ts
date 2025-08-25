/**
 * Cache Manager for API Response Caching
 * Implements LRU (Least Recently Used) cache with TTL support
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
}

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_ENTRIES = 100;
  private currentSize = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(
    private options: CacheOptions = {}
  ) {
    // 주기적으로 만료된 캐시 정리
    setInterval(() => this.cleanup(), 60000); // 1분마다
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    // LRU: 최근 사용한 항목을 맨 뒤로 이동
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.hitCount++;
    return entry.data as T;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, options?: { ttl?: number; etag?: string }): void {
    const ttl = options?.ttl || this.options.ttl || this.DEFAULT_TTL;
    const size = this.calculateSize(data);
    
    // 기존 항목이 있으면 크기 계산에서 제외
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.currentSize -= existingEntry.size;
    }

    // 크기 제한 확인
    const maxSize = this.options.maxSize || this.MAX_SIZE;
    if (this.currentSize + size > maxSize) {
      this.evictLRU(size);
    }

    // 항목 수 제한 확인
    const maxEntries = this.options.maxEntries || this.MAX_ENTRIES;
    if (this.cache.size >= maxEntries && !existingEntry) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      etag: options?.etag,
      size,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * 캐시에서 항목 삭제
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * 패턴과 일치하는 모든 캐시 항목 삭제
   */
  deletePattern(pattern: string | RegExp): number {
    let deleted = 0;
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*')) 
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        if (this.delete(key)) {
          deleted++;
        }
      }
    }
    return deleted;
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 캐시 통계 반환
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      entries: this.cache.size,
      size: this.currentSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      sizeInMB: (this.currentSize / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * ETag 기반 조건부 요청 지원
   */
  getETag(key: string): string | undefined {
    const entry = this.cache.get(key);
    return entry?.etag;
  }

  /**
   * 캐시 키가 존재하는지 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 캐시 데이터의 나이 확인 (밀리초)
   */
  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  /**
   * 캐시 워밍 - 미리 데이터 로드
   */
  async warm(
    keys: string[], 
    fetcher: (key: string) => Promise<any>
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher(key);
          this.set(key, data);
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error);
        }
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * 만료된 캐시 항목 정리
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
      }
    }
  }

  /**
   * LRU 정책에 따라 캐시 항목 제거
   */
  private evictLRU(requiredSize: number): void {
    const maxSize = this.options.maxSize || this.MAX_SIZE;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.currentSize + requiredSize <= maxSize) {
        break;
      }
      this.delete(key);
    }
  }

  /**
   * 데이터 크기 계산 (대략적)
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 고려
    } catch {
      return 1024; // 기본값 1KB
    }
  }
}

// 싱글톤 인스턴스
export const cacheManager = new CacheManager({
  ttl: 5 * 60 * 1000, // 5분
  maxSize: 10 * 1024 * 1024, // 10MB
  maxEntries: 100,
});

// 캐시 키 생성 헬퍼
export function createCacheKey(
  endpoint: string, 
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
    
  return `${endpoint}?${sortedParams}`;
}

// 캐시 TTL 프리셋
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30초 - 실시간성이 중요한 데이터
  MEDIUM: 5 * 60 * 1000, // 5분 - 일반적인 데이터
  LONG: 30 * 60 * 1000, // 30분 - 변경이 적은 데이터
  HOUR: 60 * 60 * 1000, // 1시간 - 정적 데이터
  DAY: 24 * 60 * 60 * 1000, // 1일 - 거의 변하지 않는 데이터
};

// 캐시 무효화 전략
export class CacheInvalidator {
  /**
   * 연관된 캐시 무효화
   */
  static invalidateRelated(pattern: string): void {
    cacheManager.deletePattern(pattern);
  }

  /**
   * 프로젝트 관련 캐시 무효화
   */
  static invalidateProject(projectId: string): void {
    cacheManager.deletePattern(`*/projects/${projectId}/*`);
    cacheManager.deletePattern(`*/dashboard/*`); // 대시보드 통계도 갱신
  }

  /**
   * 알림 관련 캐시 무효화
   */
  static invalidateNotifications(type?: 'feedback' | 'project'): void {
    if (type) {
      cacheManager.deletePattern(`*/notifications/${type}/*`);
    } else {
      cacheManager.deletePattern(`*/notifications/*`);
    }
  }

  /**
   * 사용자 관련 캐시 무효화
   */
  static invalidateUser(userId: string): void {
    cacheManager.deletePattern(`*/users/${userId}/*`);
  }
}

export default cacheManager;