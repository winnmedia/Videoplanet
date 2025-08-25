/**
 * 실시간 데이터 성능 최적화 유틸리티
 * 
 * Pagination, Debouncing, Batching, Virtual Scrolling,
 * Memory Management, Request Deduplication을 구현
 */

import { BaseRealTimeEvent } from '@/shared/types/realtime.types'

// ===========================================
// Pagination Manager
// ===========================================

export interface PaginationConfig<T> {
  pageSize: number
  prefetchPages: number
  cacheSize: number
  sortFunction?: (a: T, b: T) => number
  filterFunction?: (item: T) => boolean
  keyExtractor: (item: T) => string | number
}

export interface PaginationState<T> {
  items: T[]
  currentPage: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
  prefetchedPages: Set<number>
  lastUpdated: number
}

export class PaginationManager<T> {
  private config: PaginationConfig<T>
  private state: PaginationState<T>
  private cache = new Map<number, T[]>()
  private subscribers = new Set<(state: PaginationState<T>) => void>()
  
  constructor(config: PaginationConfig<T>) {
    this.config = config
    this.state = {
      items: [],
      currentPage: 1,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      isLoading: false,
      prefetchedPages: new Set(),
      lastUpdated: 0
    }
  }
  
  // 전체 데이터셋 업데이트
  updateDataset(allItems: T[]): void {
    let filteredItems = allItems
    
    // 필터 적용
    if (this.config.filterFunction) {
      filteredItems = allItems.filter(this.config.filterFunction)
    }
    
    // 정렬 적용
    if (this.config.sortFunction) {
      filteredItems.sort(this.config.sortFunction)
    }
    
    this.state.totalItems = filteredItems.length
    this.state.totalPages = Math.ceil(filteredItems.length / this.config.pageSize)
    
    // 캐시 재구성
    this.rebuildCache(filteredItems)
    
    // 현재 페이지 데이터 업데이트
    this.loadPage(this.state.currentPage, false)
    
    this.state.lastUpdated = Date.now()
    this.notifySubscribers()
  }
  
  // 단일 아이템 추가 (실시간 업데이트)
  addItem(item: T, position: 'start' | 'end' | 'sorted' = 'sorted'): void {
    // 필터 확인
    if (this.config.filterFunction && !this.config.filterFunction(item)) {
      return
    }
    
    // 기존 아이템 확인 (중복 방지)
    const key = this.config.keyExtractor(item)
    if (this.findItemInCache(key)) {
      this.updateItem(item)
      return
    }
    
    this.state.totalItems++
    this.state.totalPages = Math.ceil(this.state.totalItems / this.config.pageSize)
    
    // 캐시에 추가
    this.insertItemIntoCache(item, position)
    
    // 현재 페이지가 영향을 받는지 확인
    this.refreshCurrentPage()
    
    this.state.lastUpdated = Date.now()
    this.notifySubscribers()
  }
  
  // 단일 아이템 업데이트
  updateItem(updatedItem: T): void {
    const key = this.config.keyExtractor(updatedItem)
    const found = this.findItemInCache(key)
    
    if (found) {
      // 캐시에서 업데이트
      const page = found.page
      const pageItems = this.cache.get(page)
      if (pageItems) {
        const index = pageItems.findIndex(item => 
          this.config.keyExtractor(item) === key
        )
        if (index !== -1) {
          pageItems[index] = updatedItem
          
          // 정렬이 필요한 경우 재정렬
          if (this.config.sortFunction) {
            pageItems.sort(this.config.sortFunction)
          }
          
          this.refreshCurrentPage()
          this.state.lastUpdated = Date.now()
          this.notifySubscribers()
        }
      }
    }
  }
  
  // 단일 아이템 제거
  removeItem(itemKey: string | number): void {
    const found = this.findItemInCache(itemKey)
    
    if (found) {
      const page = found.page
      const pageItems = this.cache.get(page)
      if (pageItems) {
        const index = pageItems.findIndex(item => 
          this.config.keyExtractor(item) === itemKey
        )
        if (index !== -1) {
          pageItems.splice(index, 1)
          this.state.totalItems--
          this.state.totalPages = Math.ceil(this.state.totalItems / this.config.pageSize)
          
          this.refreshCurrentPage()
          this.state.lastUpdated = Date.now()
          this.notifySubscribers()
        }
      }
    }
  }
  
  // 페이지 로드
  async loadPage(page: number, updateCurrent = true): Promise<T[]> {
    if (page < 1 || page > this.state.totalPages) {
      return []
    }
    
    this.state.isLoading = true
    this.notifySubscribers()
    
    try {
      const pageItems = this.cache.get(page) || []
      
      if (updateCurrent) {
        this.state.currentPage = page
        this.state.items = pageItems
        this.state.hasNextPage = page < this.state.totalPages
        this.state.hasPreviousPage = page > 1
        
        // 프리페치
        this.prefetchAdjacentPages(page)
      }
      
      return pageItems
    } finally {
      this.state.isLoading = false
      this.notifySubscribers()
    }
  }
  
  // 다음 페이지
  async nextPage(): Promise<T[]> {
    if (this.state.hasNextPage) {
      return this.loadPage(this.state.currentPage + 1)
    }
    return this.state.items
  }
  
  // 이전 페이지
  async previousPage(): Promise<T[]> {
    if (this.state.hasPreviousPage) {
      return this.loadPage(this.state.currentPage - 1)
    }
    return this.state.items
  }
  
  // 구독/구독해제
  subscribe(callback: (state: PaginationState<T>) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  getState(): PaginationState<T> {
    return { ...this.state }
  }
  
  // Private Methods
  
  private rebuildCache(items: T[]): void {
    this.cache.clear()
    
    for (let i = 0; i < items.length; i += this.config.pageSize) {
      const page = Math.floor(i / this.config.pageSize) + 1
      const pageItems = items.slice(i, i + this.config.pageSize)
      this.cache.set(page, pageItems)
    }
  }
  
  private insertItemIntoCache(item: T, position: 'start' | 'end' | 'sorted'): void {
    if (this.cache.size === 0) {
      this.cache.set(1, [item])
      return
    }
    
    switch (position) {
      case 'start':
        this.insertAtStart(item)
        break
      case 'end':
        this.insertAtEnd(item)
        break
      case 'sorted':
        this.insertSorted(item)
        break
    }
  }
  
  private insertAtStart(item: T): void {
    const firstPage = this.cache.get(1) || []
    firstPage.unshift(item)
    
    // 페이지 크기 초과 시 재배치
    if (firstPage.length > this.config.pageSize) {
      this.redistributePages()
    }
  }
  
  private insertAtEnd(item: T): void {
    const lastPageNum = Math.max(...this.cache.keys())
    const lastPage = this.cache.get(lastPageNum) || []
    
    if (lastPage.length < this.config.pageSize) {
      lastPage.push(item)
    } else {
      // 새 페이지 생성
      this.cache.set(lastPageNum + 1, [item])
    }
  }
  
  private insertSorted(item: T): void {
    if (!this.config.sortFunction) {
      this.insertAtEnd(item)
      return
    }
    
    // 적절한 위치 찾기
    for (const [pageNum, pageItems] of this.cache.entries()) {
      const insertIndex = this.findInsertIndex(pageItems, item)
      
      if (insertIndex < pageItems.length) {
        pageItems.splice(insertIndex, 0, item)
        
        if (pageItems.length > this.config.pageSize) {
          this.redistributePages()
        }
        return
      }
    }
    
    // 맨 끝에 추가
    this.insertAtEnd(item)
  }
  
  private findInsertIndex(pageItems: T[], item: T): number {
    if (!this.config.sortFunction) return pageItems.length
    
    let left = 0
    let right = pageItems.length
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.config.sortFunction(pageItems[mid], item) < 0) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    return left
  }
  
  private redistributePages(): void {
    const allItems: T[] = []
    
    // 모든 아이템 수집
    for (const pageItems of this.cache.values()) {
      allItems.push(...pageItems)
    }
    
    // 캐시 재구성
    this.rebuildCache(allItems)
  }
  
  private findItemInCache(key: string | number): { page: number; index: number } | null {
    for (const [page, pageItems] of this.cache.entries()) {
      const index = pageItems.findIndex(item => 
        this.config.keyExtractor(item) === key
      )
      if (index !== -1) {
        return { page, index }
      }
    }
    return null
  }
  
  private refreshCurrentPage(): void {
    const currentPageItems = this.cache.get(this.state.currentPage) || []
    this.state.items = currentPageItems
  }
  
  private prefetchAdjacentPages(currentPage: number): void {
    const pagesToPrefetch = [
      currentPage - 1,
      currentPage + 1
    ].filter(page => 
      page >= 1 && 
      page <= this.state.totalPages && 
      !this.state.prefetchedPages.has(page)
    )
    
    pagesToPrefetch.forEach(page => {
      this.state.prefetchedPages.add(page)
      // 실제로는 백그라운드에서 로드
      setTimeout(() => {
        if (this.cache.has(page)) {
          // 이미 캐시에 있음
        }
      }, 100)
    })
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state))
  }
}

// ===========================================
// Debounce & Throttle Utilities
// ===========================================

export class DebouncedFunction<T extends (...args: any[]) => any> {
  private timeoutId: NodeJS.Timeout | null = null
  private lastCallTime = 0
  
  constructor(
    private func: T,
    private delay: number,
    private options: {
      leading?: boolean
      trailing?: boolean
      maxWait?: number
    } = {}
  ) {
    this.options = { trailing: true, ...options }
  }
  
  execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      const shouldCallLeading = this.options.leading && 
        (now - this.lastCallTime) >= this.delay
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }
      
      if (shouldCallLeading) {
        this.lastCallTime = now
        try {
          resolve(this.func(...args))
        } catch (error) {
          reject(error)
        }
        return
      }
      
      this.timeoutId = setTimeout(() => {
        this.lastCallTime = Date.now()
        
        if (this.options.trailing) {
          try {
            resolve(this.func(...args))
          } catch (error) {
            reject(error)
          }
        }
        
        this.timeoutId = null
      }, this.delay)
      
      // maxWait 처리
      if (this.options.maxWait && 
          (now - this.lastCallTime) >= this.options.maxWait) {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
          this.timeoutId = null
        }
        
        this.lastCallTime = now
        try {
          resolve(this.func(...args))
        } catch (error) {
          reject(error)
        }
      }
    })
  }
  
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
  
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
      // 즉시 실행은 별도 구현 필요
    }
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options?: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
  }
): DebouncedFunction<T> {
  return new DebouncedFunction(func, delay, options)
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  return new DebouncedFunction(func, delay, { leading: true, trailing: false })
}

// ===========================================
// Batch Processor
// ===========================================

export interface BatchConfig<T> {
  maxBatchSize: number
  maxWaitTime: number
  processor: (batch: T[]) => Promise<void>
  keyExtractor?: (item: T) => string
  priorityExtractor?: (item: T) => number // Higher = more priority
}

export class BatchProcessor<T> {
  private config: BatchConfig<T>
  private queue: T[] = []
  private processing = false
  private flushTimer: NodeJS.Timeout | null = null
  private dedupMap = new Map<string, T>()
  
  constructor(config: BatchConfig<T>) {
    this.config = config
  }
  
  add(item: T): void {
    // 중복 제거 (키 추출기가 있는 경우)
    if (this.config.keyExtractor) {
      const key = this.config.keyExtractor(item)
      this.dedupMap.set(key, item)
    } else {
      this.queue.push(item)
    }
    
    this.scheduleFlush()
    
    // 최대 배치 크기 도달 시 즉시 처리
    if (this.getQueueSize() >= this.config.maxBatchSize) {
      this.flush()
    }
  }
  
  async flush(): Promise<void> {
    if (this.processing || this.getQueueSize() === 0) {
      return
    }
    
    this.processing = true
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    
    try {
      const batch = this.createBatch()
      this.clearQueue()
      
      if (batch.length > 0) {
        await this.config.processor(batch)
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      this.processing = false
    }
  }
  
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.config.maxWaitTime)
  }
  
  private createBatch(): T[] {
    let items: T[]
    
    if (this.config.keyExtractor) {
      // 중복 제거된 항목들
      items = Array.from(this.dedupMap.values())
    } else {
      items = [...this.queue]
    }
    
    // 우선순위 정렬
    if (this.config.priorityExtractor) {
      items.sort((a, b) => 
        this.config.priorityExtractor!(b) - this.config.priorityExtractor!(a)
      )
    }
    
    // 배치 크기 제한
    return items.slice(0, this.config.maxBatchSize)
  }
  
  private clearQueue(): void {
    if (this.config.keyExtractor) {
      this.dedupMap.clear()
    } else {
      this.queue = []
    }
  }
  
  private getQueueSize(): number {
    return this.config.keyExtractor ? this.dedupMap.size : this.queue.length
  }
  
  getStats() {
    return {
      queueSize: this.getQueueSize(),
      processing: this.processing,
      hasScheduledFlush: this.flushTimer !== null
    }
  }
  
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.clearQueue()
  }
}

// ===========================================
// Request Deduplication
// ===========================================

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      ttl?: number // Cache TTL in milliseconds
      forceRefresh?: boolean
    } = {}
  ): Promise<T> {
    const { ttl = 5000, forceRefresh = false } = options
    
    // 캐시 확인
    if (!forceRefresh) {
      const cached = this.cache.get(key)
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        return cached.data
      }
    }
    
    // 진행 중인 요청 확인
    const pendingRequest = this.pendingRequests.get(key)
    if (pendingRequest) {
      return pendingRequest
    }
    
    // 새 요청 생성
    const request = requestFn()
      .then(data => {
        // 캐시에 저장
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        })
        
        return data
      })
      .finally(() => {
        // 진행 중인 요청에서 제거
        this.pendingRequests.delete(key)
      })
    
    this.pendingRequests.set(key, request)
    return request
  }
  
  invalidateCache(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear()
      return
    }
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clearPendingRequests(): void {
    this.pendingRequests.clear()
  }
  
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedItems: this.cache.size,
      cacheHitRate: this.calculateHitRate()
    }
  }
  
  private calculateHitRate(): number {
    // 실제 구현에서는 히트/미스 카운터 필요
    return 0
  }
}

// ===========================================
// Virtual Scrolling Helper
// ===========================================

export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan: number // Number of items to render outside viewport
  estimatedItemCount?: number
}

export class VirtualScrollManager {
  private config: VirtualScrollConfig
  private scrollTop = 0
  private itemCount = 0
  
  constructor(config: VirtualScrollConfig) {
    this.config = config
  }
  
  updateScroll(scrollTop: number): void {
    this.scrollTop = scrollTop
  }
  
  updateItemCount(count: number): void {
    this.itemCount = count
  }
  
  getVisibleRange(): { start: number; end: number; total: number } {
    const startIndex = Math.floor(this.scrollTop / this.config.itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(this.config.containerHeight / this.config.itemHeight),
      this.itemCount - 1
    )
    
    return {
      start: Math.max(0, startIndex - this.config.overscan),
      end: Math.min(this.itemCount - 1, endIndex + this.config.overscan),
      total: endIndex - startIndex + 1
    }
  }
  
  getScrollContainerStyle(): React.CSSProperties {
    return {
      height: this.itemCount * this.config.itemHeight,
      position: 'relative'
    }
  }
  
  getItemStyle(index: number): React.CSSProperties {
    return {
      position: 'absolute',
      top: index * this.config.itemHeight,
      left: 0,
      right: 0,
      height: this.config.itemHeight
    }
  }
}

// ===========================================
// Performance Monitor
// ===========================================

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private thresholds = new Map<string, number>()
  
  startMeasure(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.recordMetric(name, duration)
      
      const threshold = this.thresholds.get(name)
      if (threshold && duration > threshold) {
        console.warn(`Performance threshold exceeded: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
      }
      
      return duration
    }
  }
  
  setThreshold(name: string, thresholdMs: number): void {
    this.thresholds.set(name, thresholdMs)
  }
  
  recordMetric(name: string, value: number): void {
    const values = this.metrics.get(name) || []
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
    
    this.metrics.set(name, values)
  }
  
  getStats(name: string) {
    const values = this.metrics.get(name) || []
    
    if (values.length === 0) {
      return null
    }
    
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }
  
  getAllStats() {
    const result: Record<string, any> = {}
    
    for (const [name] of this.metrics.entries()) {
      result[name] = this.getStats(name)
    }
    
    return result
  }
  
  clear(): void {
    this.metrics.clear()
  }
}

// ===========================================
// Exports
// ===========================================

export const performanceMonitor = new PerformanceMonitor()
export const requestDeduplicator = new RequestDeduplicator()

// Set common thresholds
performanceMonitor.setThreshold('websocket_message_process', 50)
performanceMonitor.setThreshold('cache_operation', 10)
performanceMonitor.setThreshold('pagination_load', 100)
performanceMonitor.setThreshold('batch_process', 200)