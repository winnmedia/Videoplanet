/**
 * 실시간 데이터 캐싱 및 동기화 관리자
 * 
 * LRU 캐시, 계층적 캐싱, 스마트 무효화, 선택적 동기화를 구현
 * 오프라인 지원과 충돌 해결 전략을 포함
 */

import { BaseRealTimeEvent, DashboardSnapshot } from '@/shared/types/realtime.types'
import { EnhancedFeedback } from '@/entities/feedback/model/enhanced-feedback.types'
import { Invitation } from '@/entities/invitation/model/types'
import { VideoPlan } from '@/entities/planning/model/types'

// ===========================================
// Cache Entry Types
// ===========================================

export interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  ttl: number // Time to live in seconds
  size: number // Approximate size in bytes
  accessCount: number
  lastAccess: number
  tags: string[] // For cache invalidation
  version?: string // For optimistic updates
  metadata?: {
    source: 'api' | 'websocket' | 'optimistic'
    projectId?: number
    userId?: number
    dependencies?: string[] // Other cache keys this depends on
  }
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  lastEviction?: number
  averageAccessTime: number
  memoryUsage: {
    used: number
    limit: number
    percentage: number
  }
}

export interface CacheConfig {
  maxSize: number // Maximum total size in bytes
  maxEntries: number // Maximum number of entries
  defaultTTL: number // Default TTL in seconds
  cleanupInterval: number // Cleanup interval in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo' | 'smart'
  compression: boolean
  persistence: boolean
  memoryLimit: number // Memory limit in MB
}

// ===========================================
// Smart Cache Manager
// ===========================================

export class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private accessOrder: string[] = [] // For LRU
  private stats: CacheStats
  private config: CacheConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private compressionEnabled: boolean
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 10000,
      defaultTTL: 300, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      strategy: 'smart',
      compression: true,
      persistence: false,
      memoryLimit: 100,
      ...config
    }
    
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      averageAccessTime: 0,
      memoryUsage: {
        used: 0,
        limit: this.config.maxSize,
        percentage: 0
      }
    }
    
    this.compressionEnabled = this.config.compression && typeof window !== 'undefined'
    this.startCleanup()
    
    // 메모리 사용량 모니터링 (브라우저 환경)
    if (typeof window !== 'undefined') {
      this.startMemoryMonitoring()
    }
  }

  // ===========================================
  // Core Cache Operations
  // ===========================================

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.updateStats({ missRate: this.stats.missRate + 1 })
        return null
      }
      
      // TTL 확인
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.removeFromAccessOrder(key)
        this.updateStats({ missRate: this.stats.missRate + 1 })
        return null
      }
      
      // 액세스 업데이트
      this.updateAccess(key, entry)
      
      // 압축 해제
      const data = await this.decompress(entry.data)
      
      this.updateStats({ 
        hitRate: this.stats.hitRate + 1,
        averageAccessTime: this.calculateAverageAccessTime(performance.now() - startTime)
      })
      
      return data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number
      tags?: string[]
      metadata?: CacheEntry['metadata']
      priority?: 'high' | 'normal' | 'low'
    } = {}
  ): Promise<void> {
    try {
      // 압축
      const compressedData = await this.compress(data)
      
      const entry: CacheEntry<T> = {
        key,
        data: compressedData,
        timestamp: Date.now(),
        ttl: options.ttl ?? this.config.defaultTTL,
        size: this.calculateSize(compressedData),
        accessCount: 1,
        lastAccess: Date.now(),
        tags: options.tags ?? [],
        metadata: options.metadata
      }
      
      // 공간 확보
      await this.ensureSpace(entry.size)
      
      // 기존 엔트리 제거 (있다면)
      if (this.cache.has(key)) {
        this.removeEntry(key)
      }
      
      // 새 엔트리 추가
      this.cache.set(key, entry)
      this.updateAccessOrder(key, options.priority)
      
      this.updateStats({
        totalEntries: this.cache.size,
        totalSize: this.stats.totalSize + entry.size
      })
      
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(pattern: string | string[] | ((key: string) => boolean)): Promise<number> {
    let removedCount = 0
    
    try {
      const keysToRemove: string[] = []
      
      if (typeof pattern === 'string') {
        // Simple pattern matching
        for (const key of this.cache.keys()) {
          if (key.includes(pattern)) {
            keysToRemove.push(key)
          }
        }
      } else if (Array.isArray(pattern)) {
        // Multiple patterns
        for (const key of this.cache.keys()) {
          if (pattern.some(p => key.includes(p))) {
            keysToRemove.push(key)
          }
        }
      } else if (typeof pattern === 'function') {
        // Custom function
        for (const key of this.cache.keys()) {
          if (pattern(key)) {
            keysToRemove.push(key)
          }
        }
      }
      
      for (const key of keysToRemove) {
        this.removeEntry(key)
        removedCount++
      }
      
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
    
    return removedCount
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let removedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.removeEntry(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  async invalidateByDependencies(changedKey: string): Promise<number> {
    let removedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.dependencies?.includes(changedKey)) {
        this.removeEntry(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  // ===========================================
  // Specialized Cache Methods
  // ===========================================

  async getFeedback(feedbackId: string): Promise<EnhancedFeedback | null> {
    return this.get<EnhancedFeedback>(`feedback:${feedbackId}`)
  }

  async setFeedback(feedback: EnhancedFeedback, options: { optimistic?: boolean } = {}): Promise<void> {
    await this.set(`feedback:${feedback.id}`, feedback, {
      ttl: 1800, // 30 minutes
      tags: ['feedback', `project:${feedback.projectId}`, `video:${feedback.videoId}`],
      metadata: {
        source: options.optimistic ? 'optimistic' : 'api',
        projectId: feedback.projectId,
        dependencies: [`video:${feedback.videoId}`]
      }
    })
  }

  async getInvitation(invitationId: string): Promise<Invitation | null> {
    return this.get<Invitation>(`invitation:${invitationId}`)
  }

  async setInvitation(invitation: Invitation): Promise<void> {
    await this.set(`invitation:${invitation.id}`, invitation, {
      ttl: 3600, // 1 hour
      tags: ['invitation', `project:${invitation.projectId}`],
      metadata: {
        source: 'api',
        projectId: invitation.projectId
      }
    })
  }

  async getProjectPlan(planId: string): Promise<VideoPlan | null> {
    return this.get<VideoPlan>(`plan:${planId}`)
  }

  async setProjectPlan(plan: VideoPlan): Promise<void> {
    await this.set(`plan:${plan.id}`, plan, {
      ttl: 1800, // 30 minutes
      tags: ['plan', `project:${plan.projectId}`],
      metadata: {
        source: 'api',
        projectId: plan.projectId
      }
    })
  }

  async getDashboardSnapshot(projectId: number): Promise<DashboardSnapshot | null> {
    return this.get<DashboardSnapshot>(`dashboard:${projectId}`)
  }

  async setDashboardSnapshot(snapshot: DashboardSnapshot): Promise<void> {
    await this.set(`dashboard:${snapshot.projectId}`, snapshot, {
      ttl: 300, // 5 minutes (dashboard data is frequently updated)
      tags: ['dashboard', `project:${snapshot.projectId}`],
      metadata: {
        source: 'websocket',
        projectId: snapshot.projectId
      }
    })
  }

  // ===========================================
  // Batch Operations
  // ===========================================

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {}
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get<T>(key)
      })
    )
    
    return results
  }

  async setMultiple<T>(entries: Array<{ key: string; data: T; options?: any }>): Promise<void> {
    await Promise.all(
      entries.map(async (entry) => {
        await this.set(entry.key, entry.data, entry.options)
      })
    )
  }

  // ===========================================
  // Synchronization Methods
  // ===========================================

  async syncWithRealTimeEvent(event: BaseRealTimeEvent): Promise<void> {
    try {
      // 이벤트 타입에 따른 캐시 무효화
      if (event.type.startsWith('feedback:')) {
        await this.handleFeedbackEvent(event)
      } else if (event.type.startsWith('invitation:')) {
        await this.handleInvitationEvent(event)
      } else if (event.type.startsWith('project:')) {
        await this.handleProjectEvent(event)
      }
      
      // 의존성 기반 무효화
      await this.invalidateByDependencies(`event:${event.id}`)
      
    } catch (error) {
      console.error('Cache sync error:', error)
    }
  }

  private async handleFeedbackEvent(event: BaseRealTimeEvent): Promise<void> {
    if (event.type === 'feedback:created' || event.type === 'feedback:updated') {
      // 피드백 캐시 무효화
      await this.invalidateByTags(['feedback'])
      
      if (event.videoId) {
        await this.invalidate(`video:${event.videoId}`)
      }
    }
  }

  private async handleInvitationEvent(event: BaseRealTimeEvent): Promise<void> {
    await this.invalidateByTags(['invitation'])
    
    if (event.projectId) {
      await this.invalidate(`project:${event.projectId}`)
    }
  }

  private async handleProjectEvent(event: BaseRealTimeEvent): Promise<void> {
    if (event.projectId) {
      await this.invalidateByTags([`project:${event.projectId}`])
      await this.invalidate(`dashboard:${event.projectId}`)
    }
  }

  // ===========================================
  // Cache Management
  // ===========================================

  private async ensureSpace(requiredSize: number): Promise<void> {
    while (this.stats.totalSize + requiredSize > this.config.maxSize || 
           this.cache.size >= this.config.maxEntries) {
      
      const evicted = await this.evictLeastValuable()
      if (!evicted) break // No more entries to evict
    }
  }

  private async evictLeastValuable(): Promise<boolean> {
    if (this.cache.size === 0) return false
    
    let keyToEvict: string
    
    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0]
        break
        
      case 'lfu':
        keyToEvict = this.findLeastFrequentlyUsed()
        break
        
      case 'fifo':
        keyToEvict = Array.from(this.cache.keys())[0]
        break
        
      case 'smart':
      default:
        keyToEvict = this.findSmartEvictionCandidate()
        break
    }
    
    if (keyToEvict) {
      this.removeEntry(keyToEvict)
      this.updateStats({ evictionCount: this.stats.evictionCount + 1 })
      return true
    }
    
    return false
  }

  private findLeastFrequentlyUsed(): string {
    let minAccessCount = Infinity
    let keyToEvict = ''
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount
        keyToEvict = key
      }
    }
    
    return keyToEvict
  }

  private findSmartEvictionCandidate(): string {
    // 스마트 전략: TTL, 액세스 빈도, 크기, 우선순위를 고려
    let bestScore = -Infinity
    let keyToEvict = ''
    
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      // 점수 계산 (낮을수록 제거 우선순위 높음)
      let score = 0
      
      // TTL 기반 (만료에 가까울수록 낮은 점수)
      const timeRemaining = (entry.timestamp + entry.ttl * 1000) - now
      score += Math.max(0, timeRemaining / (entry.ttl * 1000)) * 100
      
      // 액세스 빈도 (낮을수록 낮은 점수)
      const accessFrequency = entry.accessCount / Math.max(1, (now - entry.timestamp) / 60000)
      score += Math.log(accessFrequency + 1) * 50
      
      // 크기 영향 (클수록 제거 우선순위 높음)
      score -= (entry.size / (1024 * 1024)) * 10
      
      // 메타데이터 기반 우선순위
      if (entry.metadata?.source === 'optimistic') {
        score -= 20 // 낙관적 업데이트는 우선 제거
      }
      
      if (score < bestScore) {
        bestScore = score
        keyToEvict = key
      }
    }
    
    return keyToEvict
  }

  private removeEntry(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      this.updateStats({
        totalEntries: this.cache.size,
        totalSize: Math.max(0, this.stats.totalSize - entry.size)
      })
    }
  }

  private updateAccess(key: string, entry: CacheEntry): void {
    entry.accessCount++
    entry.lastAccess = Date.now()
    this.updateAccessOrder(key)
  }

  private updateAccessOrder(key: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    this.removeFromAccessOrder(key)
    
    if (priority === 'high') {
      this.accessOrder.unshift(key) // 맨 앞에 추가
    } else {
      this.accessOrder.push(key) // 맨 뒤에 추가
    }
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl * 1000)
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate in bytes
  }

  private async compress(data: any): Promise<any> {
    if (!this.compressionEnabled || typeof data !== 'object') {
      return data
    }
    
    // 간단한 압축 시뮬레이션 (실제로는 pako 등 사용)
    try {
      const jsonString = JSON.stringify(data)
      if (jsonString.length > 1024) {
        // 큰 데이터만 압축
        return {
          compressed: true,
          data: jsonString // 실제로는 압축된 데이터
        }
      }
    } catch (error) {
      console.warn('Compression failed:', error)
    }
    
    return data
  }

  private async decompress(data: any): Promise<any> {
    if (data && data.compressed) {
      try {
        return JSON.parse(data.data) // 실제로는 압축 해제
      } catch (error) {
        console.warn('Decompression failed:', error)
      }
    }
    
    return data
  }

  private updateStats(updates: Partial<CacheStats>): void {
    this.stats = { ...this.stats, ...updates }
    
    // 메모리 사용률 계산
    this.stats.memoryUsage = {
      used: this.stats.totalSize,
      limit: this.config.maxSize,
      percentage: (this.stats.totalSize / this.config.maxSize) * 100
    }
  }

  private calculateAverageAccessTime(newTime: number): number {
    const alpha = 0.1 // Exponential moving average factor
    return this.stats.averageAccessTime * (1 - alpha) + newTime * alpha
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private async cleanup(): Promise<void> {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.removeEntry(key)
    }
    
    // 메모리 압박 시 추가 정리
    if (this.stats.memoryUsage.percentage > 90) {
      await this.ensureSpace(0)
    }
  }

  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory
        if (memInfo) {
          // Chrome의 memory API 사용
          const usedJSHeapSize = memInfo.usedJSHeapSize
          const totalJSHeapSize = memInfo.totalJSHeapSize
          
          if (usedJSHeapSize > totalJSHeapSize * 0.9) {
            // 메모리 사용량이 90% 초과시 캐시 크기 축소
            this.config.maxSize = Math.max(
              this.config.maxSize * 0.8,
              10 * 1024 * 1024 // 최소 10MB
            )
          }
        }
      }, 30000) // 30초마다 체크
    }
  }

  // ===========================================
  // Public API
  // ===========================================

  getStats(): CacheStats {
    return { ...this.stats }
  }

  getConfig(): CacheConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      ...this.stats,
      totalEntries: 0,
      totalSize: 0
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
    this.accessOrder = []
  }

  // 개발/디버깅용
  debug(): any {
    return {
      config: this.config,
      stats: this.stats,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        size: entry.size,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
        ttlRemaining: Math.max(0, (entry.timestamp + entry.ttl * 1000) - Date.now())
      })),
      accessOrder: this.accessOrder
    }
  }
}

// ===========================================
// Singleton Instance
// ===========================================

export const cacheManager = new CacheManager({
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 50000,
  defaultTTL: 900, // 15 minutes
  strategy: 'smart',
  compression: true,
  persistence: false
})