/**
 * 오프라인 상태 관리 및 충돌 해결 시스템
 * 
 * 네트워크 연결 상태 모니터링, 오프라인 데이터 저장,
 * 온라인 복구 시 스마트 동기화, 충돌 감지 및 해결을 담당
 */

import { EventEmitter } from 'events'
import { 
  BaseRealTimeEvent, 
  DashboardSnapshot,
  RealTimeEventType 
} from '@/shared/types/realtime.types'
import { EnhancedFeedback } from '@/entities/feedback/model/enhanced-feedback.types'
import { Invitation } from '@/entities/invitation/model/types'
import { VideoPlan } from '@/entities/planning/model/types'

// ===========================================
// Offline Storage Types
// ===========================================

export interface OfflineEntry<T = any> {
  id: string
  type: 'event' | 'data' | 'mutation'
  data: T
  timestamp: number
  version: string
  retryCount: number
  maxRetries: number
  priority: 'high' | 'normal' | 'low'
  dependencies?: string[] // Other entries this depends on
  metadata?: {
    userId?: number
    projectId?: number
    videoId?: string
    optimistic?: boolean
    source: 'user_action' | 'auto_save' | 'background_sync'
  }
}

export interface ConflictData {
  id: string
  entityType: 'feedback' | 'invitation' | 'plan' | 'project'
  entityId: string
  localVersion: any
  serverVersion: any
  conflictFields: string[]
  detectedAt: number
  resolvedAt?: number
  resolution?: {
    strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual'
    result: any
    resolvedBy: 'system' | 'user'
    reason?: string
  }
}

export interface OfflineConfig {
  maxStorageSize: number // bytes
  maxEntries: number
  retryBackoffMs: number
  maxRetryBackoffMs: number
  syncBatchSize: number
  conflictResolutionTimeout: number // ms
  persistenceName: string
  compressionEnabled: boolean
}

// ===========================================
// Network Status Monitor
// ===========================================

class NetworkMonitor extends EventEmitter {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private lastOnlineTime: number = Date.now()
  private connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'excellent'
  private pingInterval: NodeJS.Timeout | null = null
  
  constructor() {
    super()
    this.setupEventListeners()
    this.startConnectionMonitoring()
  }
  
  private setupEventListeners(): void {
    // SSR 환경에서는 window 객체가 없으므로 체크
    if (typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      this.isOnline = true
      this.lastOnlineTime = Date.now()
      this.emit('online')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.emit('offline')
    })
    
    // Visibility API로 탭 활성화 감지
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.emit('tabActive')
      }
    })
  }
  
  private startConnectionMonitoring(): void {
    this.pingInterval = setInterval(async () => {
      if (this.isOnline) {
        try {
          const quality = await this.checkConnectionQuality()
          if (quality !== this.connectionQuality) {
            this.connectionQuality = quality
            this.emit('qualityChange', quality)
          }
        } catch (error) {
          // Ping 실패 시 오프라인으로 간주
          if (this.isOnline) {
            this.isOnline = false
            this.emit('offline')
          }
        }
      }
    }, 30000) // 30초마다 체크
  }
  
  private async checkConnectionQuality(): Promise<'excellent' | 'good' | 'poor' | 'offline'> {
    try {
      const start = Date.now()
      
      // 작은 이미지로 연결 테스트 (CORS 회피)
      const img = new Image()
      const promise = new Promise<number>((resolve, reject) => {
        img.onload = () => resolve(Date.now() - start)
        img.onerror = () => reject(new Error('Network test failed'))
        setTimeout(() => reject(new Error('Timeout')), 5000)
      })
      
      img.src = `${window.location.origin}/favicon.ico?t=${Date.now()}`
      
      const latency = await promise
      
      if (latency < 100) return 'excellent'
      if (latency < 300) return 'good'
      if (latency < 1000) return 'poor'
      return 'offline'
      
    } catch (error) {
      return 'offline'
    }
  }
  
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      quality: this.connectionQuality,
      offlineDuration: this.isOnline ? 0 : Date.now() - this.lastOnlineTime
    }
  }
  
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
  }
}

// ===========================================
// Offline Storage Manager
// ===========================================

class OfflineStorage {
  private dbName: string
  private db: IDBDatabase | null = null
  private isSupported: boolean
  
  constructor(dbName: string) {
    this.dbName = dbName
    this.isSupported = typeof window !== 'undefined' && 'indexedDB' in window
  }
  
  async init(): Promise<void> {
    if (!this.isSupported) return
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Offline entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' })
          entriesStore.createIndex('timestamp', 'timestamp')
          entriesStore.createIndex('type', 'type')
          entriesStore.createIndex('priority', 'priority')
        }
        
        // Conflicts store
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' })
          conflictsStore.createIndex('entityType', 'entityType')
          conflictsStore.createIndex('detectedAt', 'detectedAt')
        }
      }
    })
  }
  
  async store<T>(entry: OfflineEntry<T>): Promise<void> {
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite')
      const store = transaction.objectStore('entries')
      const request = store.put(entry)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async getAll(): Promise<OfflineEntry[]> {
    if (!this.db) return []
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly')
      const store = transaction.objectStore('entries')
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
  
  async remove(id: string): Promise<void> {
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite')
      const store = transaction.objectStore('entries')
      const request = store.delete(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async storeConflict(conflict: ConflictData): Promise<void> {
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conflicts'], 'readwrite')
      const store = transaction.objectStore('conflicts')
      const request = store.put(conflict)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async getConflicts(): Promise<ConflictData[]> {
    if (!this.db) return []
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conflicts'], 'readonly')
      const store = transaction.objectStore('conflicts')
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
  
  async removeConflict(id: string): Promise<void> {
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conflicts'], 'readwrite')
      const store = transaction.objectStore('conflicts')
      const request = store.delete(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  
  async clear(): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['entries', 'conflicts'], 'readwrite')
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('entries').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('conflicts').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    ])
  }
}

// ===========================================
// Conflict Resolution Engine
// ===========================================

class ConflictResolver {
  
  static detectConflicts<T>(
    localData: T, 
    serverData: T,
    entityType: string
  ): string[] {
    const conflicts: string[] = []
    
    if (typeof localData !== 'object' || typeof serverData !== 'object') {
      return []
    }
    
    const localObj = localData as Record<string, any>
    const serverObj = serverData as Record<string, any>
    
    // 타임스탬프 기반 충돌 감지
    if (localObj.updatedAt && serverObj.updatedAt) {
      const localTime = new Date(localObj.updatedAt).getTime()
      const serverTime = new Date(serverObj.updatedAt).getTime()
      
      if (Math.abs(localTime - serverTime) < 1000) {
        // 1초 이내 동시 수정은 충돌로 간주하지 않음
        return []
      }
    }
    
    // 필드별 충돌 확인
    const fieldsToCheck = this.getFieldsToCheck(entityType)
    
    for (const field of fieldsToCheck) {
      if (localObj[field] !== serverObj[field]) {
        conflicts.push(field)
      }
    }
    
    return conflicts
  }
  
  static resolveConflict<T>(
    conflict: ConflictData,
    strategy: ConflictData['resolution']['strategy']
  ): T {
    switch (strategy) {
      case 'server_wins':
        return conflict.serverVersion
        
      case 'client_wins':
        return conflict.localVersion
        
      case 'merge':
        return this.mergeVersions(
          conflict.localVersion,
          conflict.serverVersion,
          conflict.entityType
        )
        
      default:
        // Manual resolution - return server version as fallback
        return conflict.serverVersion
    }
  }
  
  private static getFieldsToCheck(entityType: string): string[] {
    switch (entityType) {
      case 'feedback':
        return ['title', 'content', 'status', 'severity', 'assignedTo', 'tags']
        
      case 'invitation':
        return ['status', 'role', 'permissions', 'expiresAt']
        
      case 'plan':
        return ['title', 'description', 'status', 'priority', 'sections']
        
      default:
        return ['title', 'content', 'status']
    }
  }
  
  private static mergeVersions<T>(
    localVersion: T,
    serverVersion: T,
    entityType: string
  ): T {
    const local = localVersion as Record<string, any>
    const server = serverVersion as Record<string, any>
    const merged = { ...server } // Start with server version
    
    // 엔티티 타입별 스마트 병합
    switch (entityType) {
      case 'feedback':
        // 피드백의 경우 내용과 상태는 클라이언트 우선
        if (local.content !== server.content) {
          merged.content = local.content
        }
        if (local.status && local.status !== server.status) {
          merged.status = local.status
        }
        // 태그는 합집합
        if (local.tags && server.tags) {
          merged.tags = Array.from(new Set([...local.tags, ...server.tags]))
        }
        break
        
      case 'invitation':
        // 초대는 최신 상태 우선
        if (local.updatedAt && server.updatedAt) {
          const localTime = new Date(local.updatedAt).getTime()
          const serverTime = new Date(server.updatedAt).getTime()
          
          if (localTime > serverTime) {
            merged.status = local.status
            merged.respondedAt = local.respondedAt
          }
        }
        break
        
      case 'plan':
        // 기획서는 섹션별 개별 병합
        if (local.sections && server.sections) {
          merged.sections = this.mergePlanSections(local.sections, server.sections)
        }
        break
    }
    
    // 공통 필드 처리
    merged.version = Math.max(local.version || 0, server.version || 0) + 1
    merged.updatedAt = new Date().toISOString()
    
    return merged as T
  }
  
  private static mergePlanSections(localSections: any[], serverSections: any[]): any[] {
    const merged = [...serverSections]
    const serverIds = new Set(serverSections.map(s => s.id))
    
    // 로컬에만 있는 섹션 추가
    for (const localSection of localSections) {
      if (!serverIds.has(localSection.id)) {
        merged.push(localSection)
      } else {
        // 동일한 섹션이 있는 경우 내용 병합
        const serverSection = merged.find(s => s.id === localSection.id)
        if (serverSection && localSection.content !== serverSection.content) {
          // 내용이 다른 경우 더 긴 버전 선택
          if (localSection.content.length > serverSection.content.length) {
            serverSection.content = localSection.content
            serverSection.updatedBy = localSection.updatedBy
            serverSection.updatedAt = localSection.updatedAt
          }
        }
      }
    }
    
    return merged
  }
}

// ===========================================
// Offline Manager Main Class
// ===========================================

export class OfflineManager extends EventEmitter {
  private networkMonitor: NetworkMonitor
  private storage: OfflineStorage
  private config: OfflineConfig
  private isInitialized = false
  private syncInProgress = false
  private pendingEntries: OfflineEntry[] = []
  private conflicts: ConflictData[] = []
  private syncQueue: Map<string, OfflineEntry> = new Map()
  
  constructor(config: Partial<OfflineConfig> = {}) {
    super()
    
    this.config = {
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      retryBackoffMs: 1000,
      maxRetryBackoffMs: 30000,
      syncBatchSize: 20,
      conflictResolutionTimeout: 30000, // 30초
      persistenceName: 'videoplanet_offline',
      compressionEnabled: true,
      ...config
    }
    
    this.networkMonitor = new NetworkMonitor()
    this.storage = new OfflineStorage(this.config.persistenceName)
    
    this.setupEventHandlers()
  }
  
  async init(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      await this.storage.init()
      await this.loadPersistedData()
      this.isInitialized = true
      
      this.emit('initialized')
      
      // 온라인 상태라면 즉시 동기화
      if (this.networkMonitor.getStatus().isOnline) {
        await this.syncPendingEntries()
      }
      
    } catch (error) {
      console.error('Failed to initialize offline manager:', error)
      throw error
    }
  }
  
  private setupEventHandlers(): void {
    this.networkMonitor.on('online', async () => {
      this.emit('networkOnline')
      await this.syncPendingEntries()
    })
    
    this.networkMonitor.on('offline', () => {
      this.emit('networkOffline')
    })
    
    this.networkMonitor.on('qualityChange', (quality) => {
      this.emit('connectionQualityChange', quality)
    })
  }
  
  private async loadPersistedData(): Promise<void> {
    try {
      this.pendingEntries = await this.storage.getAll()
      this.conflicts = await this.storage.getConflicts()
      
      // 만료된 엔트리 정리
      await this.cleanupExpiredEntries()
      
    } catch (error) {
      console.error('Failed to load persisted data:', error)
    }
  }
  
  // ===========================================
  // Public API - Data Operations
  // ===========================================
  
  async storeOfflineEntry<T>(
    type: OfflineEntry['type'],
    data: T,
    options: {
      priority?: OfflineEntry['priority']
      maxRetries?: number
      metadata?: OfflineEntry['metadata']
    } = {}
  ): Promise<string> {
    const entry: OfflineEntry<T> = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      version: '1.0.0',
      retryCount: 0,
      maxRetries: options.maxRetries ?? 3,
      priority: options.priority ?? 'normal',
      metadata: options.metadata
    }
    
    // 메모리에 추가
    this.pendingEntries.push(entry)
    this.syncQueue.set(entry.id, entry)
    
    // IndexedDB에 저장
    await this.storage.store(entry)
    
    this.emit('entryStored', entry)
    
    // 온라인 상태라면 즉시 동기화 시도
    if (this.networkMonitor.getStatus().isOnline && !this.syncInProgress) {
      this.debouncedSync()
    }
    
    return entry.id
  }
  
  async createOptimisticUpdate<T>(
    entityType: 'feedback' | 'invitation' | 'plan',
    entityId: string,
    data: T,
    originalData?: T
  ): Promise<string> {
    const entryId = await this.storeOfflineEntry('mutation', {
      entityType,
      entityId,
      operation: 'update',
      data,
      originalData
    }, {
      priority: 'high',
      metadata: {
        optimistic: true,
        source: 'user_action'
      }
    })
    
    this.emit('optimisticUpdate', { entityType, entityId, data })
    
    return entryId
  }
  
  async handleRealTimeEvent(event: BaseRealTimeEvent): Promise<void> {
    // 오프라인 상태에서는 이벤트를 저장
    if (!this.networkMonitor.getStatus().isOnline) {
      await this.storeOfflineEntry('event', event, {
        priority: 'normal',
        metadata: {
          source: 'background_sync',
          projectId: event.projectId,
          userId: event.userId
        }
      })
      return
    }
    
    // 온라인 상태에서는 충돌 검사
    await this.checkForConflicts(event)
  }
  
  private async checkForConflicts(event: BaseRealTimeEvent): Promise<void> {
    // 현재 진행중인 낙관적 업데이트와 충돌 확인
    const relevantEntries = this.pendingEntries.filter(entry => 
      entry.metadata?.optimistic && this.isRelatedEvent(entry, event)
    )
    
    for (const entry of relevantEntries) {
      const conflicts = ConflictResolver.detectConflicts(
        entry.data,
        event,
        entry.metadata?.entityType || 'unknown'
      )
      
      if (conflicts.length > 0) {
        await this.createConflict(entry, event, conflicts)
      }
    }
  }
  
  private isRelatedEvent(entry: OfflineEntry, event: BaseRealTimeEvent): boolean {
    const entryData = entry.data as any
    
    // 프로젝트 ID 확인
    if (entry.metadata?.projectId && event.projectId) {
      if (entry.metadata.projectId !== event.projectId) {
        return false
      }
    }
    
    // 엔티티 ID 확인
    if (entryData.entityId && event.type.includes(':')) {
      const eventEntityId = this.extractEntityIdFromEvent(event)
      return entryData.entityId === eventEntityId
    }
    
    return false
  }
  
  private extractEntityIdFromEvent(event: BaseRealTimeEvent): string | null {
    // 이벤트 데이터에서 엔티티 ID 추출
    const eventData = event as any
    
    if (eventData.feedbackId) return eventData.feedbackId
    if (eventData.invitationId) return eventData.invitationId
    if (eventData.planId) return eventData.planId
    
    return null
  }
  
  private async createConflict(
    localEntry: OfflineEntry,
    serverEvent: BaseRealTimeEvent,
    conflictFields: string[]
  ): Promise<void> {
    const conflict: ConflictData = {
      id: this.generateId(),
      entityType: localEntry.metadata?.entityType || 'unknown',
      entityId: (localEntry.data as any).entityId,
      localVersion: localEntry.data,
      serverVersion: serverEvent,
      conflictFields,
      detectedAt: Date.now()
    }
    
    this.conflicts.push(conflict)
    await this.storage.storeConflict(conflict)
    
    this.emit('conflictDetected', conflict)
    
    // 자동 해결 시도
    setTimeout(() => {
      this.attemptAutoResolution(conflict)
    }, 1000)
  }
  
  private async attemptAutoResolution(conflict: ConflictData): Promise<void> {
    let strategy: ConflictData['resolution']['strategy']
    
    // 자동 해결 전략 결정
    if (conflict.conflictFields.length === 1 && 
        conflict.conflictFields[0] === 'updatedAt') {
      // 타임스탬프만 다른 경우 서버 우선
      strategy = 'server_wins'
    } else if (conflict.entityType === 'feedback' && 
               conflict.conflictFields.every(f => ['tags', 'metadata'].includes(f))) {
      // 피드백의 부가 정보는 병합
      strategy = 'merge'
    } else {
      // 복잡한 충돌은 수동 해결
      return
    }
    
    await this.resolveConflict(conflict.id, strategy)
  }
  
  async resolveConflict(
    conflictId: string,
    strategy: ConflictData['resolution']['strategy'],
    customResolution?: any
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) return
    
    try {
      let resolution: any
      
      if (strategy === 'manual' && customResolution) {
        resolution = customResolution
      } else {
        resolution = ConflictResolver.resolveConflict(conflict, strategy)
      }
      
      // 충돌 해결 결과 저장
      conflict.resolution = {
        strategy,
        result: resolution,
        resolvedBy: strategy === 'manual' ? 'user' : 'system'
      }
      conflict.resolvedAt = Date.now()
      
      await this.storage.storeConflict(conflict)
      
      // 해결된 데이터로 업데이트
      await this.applyResolution(conflict, resolution)
      
      this.emit('conflictResolved', conflict)
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      this.emit('conflictResolutionFailed', { conflict, error })
    }
  }
  
  private async applyResolution(conflict: ConflictData, resolution: any): Promise<void> {
    // 해결된 데이터를 서버에 동기화
    const entryId = await this.storeOfflineEntry('mutation', {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      operation: 'conflict_resolution',
      data: resolution,
      conflictId: conflict.id
    }, {
      priority: 'high',
      metadata: {
        source: 'user_action'
      }
    })
    
    // 충돌 목록에서 제거
    this.conflicts = this.conflicts.filter(c => c.id !== conflict.id)
    await this.storage.removeConflict(conflict.id)
  }
  
  // ===========================================
  // Synchronization
  // ===========================================
  
  private debouncedSync = this.debounce(() => {
    this.syncPendingEntries()
  }, 1000)
  
  async syncPendingEntries(): Promise<void> {
    if (this.syncInProgress || !this.networkMonitor.getStatus().isOnline) {
      return
    }
    
    if (this.pendingEntries.length === 0) {
      return
    }
    
    this.syncInProgress = true
    this.emit('syncStarted')
    
    try {
      // 우선순위별로 정렬
      const sortedEntries = this.pendingEntries.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      
      // 배치 단위로 동기화
      for (let i = 0; i < sortedEntries.length; i += this.config.syncBatchSize) {
        const batch = sortedEntries.slice(i, i + this.config.syncBatchSize)
        await this.syncBatch(batch)
      }
      
      this.emit('syncCompleted')
      
    } catch (error) {
      console.error('Sync failed:', error)
      this.emit('syncFailed', error)
    } finally {
      this.syncInProgress = false
    }
  }
  
  private async syncBatch(entries: OfflineEntry[]): Promise<void> {
    const syncPromises = entries.map(entry => this.syncEntry(entry))
    const results = await Promise.allSettled(syncPromises)
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.removeSyncedEntry(entries[index])
      } else {
        this.handleSyncFailure(entries[index], result.reason)
      }
    })
  }
  
  private async syncEntry(entry: OfflineEntry): Promise<void> {
    try {
      // 실제 API 호출 (시뮬레이션)
      await this.mockApiCall(entry)
      
      this.emit('entrySynced', entry)
      
    } catch (error) {
      entry.retryCount++
      throw error
    }
  }
  
  private async mockApiCall(entry: OfflineEntry): Promise<void> {
    // 실제 구현에서는 여기서 API를 호출
    // 현재는 시뮬레이션
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.9) { // 10% 확률로 실패
          reject(new Error('Simulated API failure'))
        } else {
          resolve()
        }
      }, 100 + Math.random() * 500) // 100-600ms 딜레이
    })
  }
  
  private removeSyncedEntry(entry: OfflineEntry): void {
    this.pendingEntries = this.pendingEntries.filter(e => e.id !== entry.id)
    this.syncQueue.delete(entry.id)
    this.storage.remove(entry.id)
  }
  
  private async handleSyncFailure(entry: OfflineEntry, error: any): Promise<void> {
    if (entry.retryCount >= entry.maxRetries) {
      // 최대 재시도 횟수 초과
      this.emit('entryFailed', { entry, error })
      this.removeSyncedEntry(entry)
      return
    }
    
    // 백오프 전략으로 재시도 스케줄링
    const backoffMs = Math.min(
      this.config.retryBackoffMs * Math.pow(2, entry.retryCount),
      this.config.maxRetryBackoffMs
    )
    
    setTimeout(() => {
      if (this.networkMonitor.getStatus().isOnline) {
        this.syncEntry(entry)
      }
    }, backoffMs)
    
    // 저장소 업데이트
    await this.storage.store(entry)
  }
  
  // ===========================================
  // Utility Methods
  // ===========================================
  
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7일
    
    const validEntries = this.pendingEntries.filter(entry => 
      (now - entry.timestamp) < maxAge
    )
    
    if (validEntries.length !== this.pendingEntries.length) {
      this.pendingEntries = validEntries
      
      // IndexedDB 정리 (실제로는 개별 삭제 필요)
      await this.storage.clear()
      
      for (const entry of validEntries) {
        await this.storage.store(entry)
      }
    }
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
  
  // ===========================================
  // Public Status and Control Methods
  // ===========================================
  
  getStatus() {
    return {
      network: this.networkMonitor.getStatus(),
      sync: {
        inProgress: this.syncInProgress,
        pendingEntries: this.pendingEntries.length,
        conflicts: this.conflicts.length
      },
      storage: {
        entries: this.pendingEntries.length,
        totalSize: this.pendingEntries.reduce((sum, entry) => 
          sum + JSON.stringify(entry).length * 2, 0
        )
      }
    }
  }
  
  getPendingEntries(): OfflineEntry[] {
    return [...this.pendingEntries]
  }
  
  getConflicts(): ConflictData[] {
    return [...this.conflicts]
  }
  
  async clearAllData(): Promise<void> {
    this.pendingEntries = []
    this.conflicts = []
    this.syncQueue.clear()
    await this.storage.clear()
    this.emit('dataCleared')
  }
  
  async forcSync(): Promise<void> {
    if (this.networkMonitor.getStatus().isOnline) {
      await this.syncPendingEntries()
    }
  }
  
  destroy(): void {
    this.networkMonitor.destroy()
    this.removeAllListeners()
  }
}

// ===========================================
// Singleton Instance
// ===========================================

export const offlineManager = new OfflineManager({
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 50000,
  syncBatchSize: 50,
  persistenceName: 'videoplanet_offline_v1'
})