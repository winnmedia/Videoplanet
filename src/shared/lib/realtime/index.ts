/**
 * VideoPlanet 실시간 데이터 파이프라인 - 통합 Export
 * 
 * 모든 실시간 기능을 하나의 편리한 인터페이스로 제공
 * 외부에서는 이 파일을 통해서만 실시간 기능에 접근
 */

// ===========================================
// 타입 정의
// ===========================================
export type {
  // 기본 타입들
  RealTimeEventType,
  BaseRealTimeEvent,
  WebSocketMessage,
  DashboardSnapshot,
  SubscriptionChannel,
  SubscriptionConfig,
  RealTimeConfig,
  
  // 이벤트별 타입들
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  InvitationSentEvent,
  InvitationStatusEvent,
  ProjectProgressEvent,
  ProjectGanttStage,
  
  // WebSocket 메시지 타입들
  WebSocketAuthMessage,
  WebSocketSubscribeMessage,
  WebSocketEventMessage,
} from './realtime.types'

// ===========================================
// 검증 및 파싱
// ===========================================
export {
  // 스키마들
  BaseRealTimeEventSchema,
  WebSocketMessageSchema,
  EnhancedFeedbackSchema,
  InvitationSchema,
  DashboardSnapshotSchema,
  
  // 검증 클래스
  SchemaValidator,
  ValidationError,
  
  // 파서 함수들
  parseRealTimeEvent,
  parseWebSocketMessage,
  parseFeedback,
  parseInvitation,
  parseDashboardSnapshot,
  
  // 타입 가드들
  isValidRealTimeEvent,
  isFeedbackEvent,
  isInvitationEvent,
  isProjectEvent,
  
  // 검증된 타입들
  type ValidatedRealTimeEvent,
  type ValidatedWebSocketMessage,
  type ValidatedFeedback,
  type ValidatedInvitation,
  type ValidatedDashboardSnapshot,
} from './validation'

// ===========================================
// 상태 관리 (Redux)
// ===========================================
export {
  // Slice reducer
  default as realTimeReducer,
  
  // Actions
  connectRealTime,
  subscribeToChannels,
  syncOfflineEvents,
  updateConnectionState,
  setAuthenticated,
  receiveEvent,
  handleFeedbackEvent,
  handleInvitationEvent,
  handleProjectEvent,
  updateDashboardSnapshot,
  addSubscription,
  removeSubscription,
  markEventsAsRead,
  setOnlineStatus,
  addOfflineEvent,
  clearOfflineEvents,
  addConflict,
  resolveConflict,
  updatePerformanceMetrics,
  addOptimisticUpdate,
  removeOptimisticUpdate,
  updateDashboardSettings,
  resetRealTimeState,
  injectTestEvent,
  
  // Selectors
  selectConnectionState,
  selectIsConnected,
  selectIsAuthenticated,
  selectRecentEvents,
  selectEventsByType,
  selectUnreadCount,
  selectDashboardSnapshot,
  selectActiveSubscriptions,
  selectSubscribedChannels,
  selectOfflineStatus,
  selectPendingConflicts,
  selectPerformanceMetrics,
  selectFeedbackState,
  selectInvitationState,
  selectTimelineState,
  
  // State type
  type RealTimeState,
} from './realtime.slice'

// ===========================================
// WebSocket 관리
// ===========================================
export {
  WebSocketManager,
  type ConnectionState,
  type MessageQueue,
} from './websocket-manager'

// ===========================================
// 캐싱 시스템
// ===========================================
export {
  CacheManager,
  cacheManager,
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
} from './cache-manager'

// ===========================================
// 오프라인 관리
// ===========================================
export {
  OfflineManager,
  offlineManager,
  type OfflineEntry,
  type ConflictData,
  type OfflineConfig,
} from './offline-manager'

// ===========================================
// 성능 최적화
// ===========================================
export {
  // Pagination
  PaginationManager,
  type PaginationConfig,
  type PaginationState,
  
  // Debouncing & Throttling
  DebouncedFunction,
  debounce,
  throttle,
  
  // Batch Processing
  BatchProcessor,
  type BatchConfig,
  
  // Request Deduplication
  RequestDeduplicator,
  requestDeduplicator,
  
  // Virtual Scrolling
  VirtualScrollManager,
  type VirtualScrollConfig,
  
  // Performance Monitoring
  PerformanceMonitor,
  performanceMonitor,
} from './performance-optimizer'

// ===========================================
// 에러 핸들링
// ===========================================
export {
  // 에러 타입들
  ErrorSeverity,
  ErrorCategory,
  RecoveryStrategy,
  type ClassifiedError,
  type ErrorContext,
  
  // 에러 분류
  ErrorClassifier,
  
  // Circuit Breaker
  CircuitBreaker,
  CircuitState,
  type CircuitBreakerConfig,
  
  // 재시도 관리
  RetryManager,
  type RetryConfig,
  
  // 복구 관리
  RecoveryManager,
  
  // 상태 모니터링
  HealthMonitor,
  type HealthCheck,
  type HealthStatus,
  
  // 메인 에러 핸들러
  RealTimeErrorHandler,
  realTimeErrorHandler,
} from './error-handler'

// ===========================================
// React Hooks
// ===========================================
export {
  // 메인 Hook
  useRealTime,
  type UseRealTimeOptions,
  type UseRealTimeReturn,
  
  // 특화 Hooks
  useFeedbackRealTime,
  useInvitationRealTime,
  useProjectTimelineRealTime,
  useDashboardRealTime,
} from './useRealTime'

// ===========================================
// 유틸리티 함수들
// ===========================================

/**
 * 실시간 데이터 파이프라인 전체 초기화
 */
export async function initializeRealTimePipeline(config: {
  cacheConfig?: Partial<Parameters<typeof CacheManager>[0]>
  offlineConfig?: Partial<Parameters<typeof OfflineManager>[0]>
  enableHealthMonitoring?: boolean
  enablePerformanceMonitoring?: boolean
}) {
  const {
    cacheConfig = {},
    offlineConfig = {},
    enableHealthMonitoring = true,
    enablePerformanceMonitoring = true
  } = config
  
  try {
    // 오프라인 매니저 초기화
    await offlineManager.init()
    
    // 에러 핸들러 상태 모니터링 시작
    if (enableHealthMonitoring) {
      realTimeErrorHandler.startHealthMonitoring(30000) // 30초 간격
    }
    
    // 성능 모니터링 임계값 설정
    if (enablePerformanceMonitoring) {
      performanceMonitor.setThreshold('realtime_event_process', 50)
      performanceMonitor.setThreshold('websocket_connection', 5000)
      performanceMonitor.setThreshold('cache_operation', 10)
      performanceMonitor.setThreshold('offline_sync', 1000)
    }
    
    console.log('✅ VideoPlanet Real-time Pipeline initialized successfully')
    
    return {
      success: true,
      cacheManager,
      offlineManager,
      errorHandler: realTimeErrorHandler,
      performanceMonitor
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Real-time Pipeline:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown initialization error'
    }
  }
}

/**
 * 실시간 데이터 파이프라인 정리
 */
export function cleanupRealTimePipeline() {
  try {
    // WebSocket 연결 종료는 각 컴포넌트에서 처리
    
    // 에러 핸들러 정리
    realTimeErrorHandler.stopHealthMonitoring()
    realTimeErrorHandler.clearHistory()
    
    // 캐시 정리
    cacheManager.destroy()
    
    // 오프라인 매니저 정리
    offlineManager.destroy()
    
    // 성능 모니터링 정리
    performanceMonitor.clear()
    
    // 검증 통계 정리
    SchemaValidator.resetStats()
    SchemaValidator.clearCache()
    
    console.log('✅ Real-time Pipeline cleaned up successfully')
    
  } catch (error) {
    console.error('❌ Error during pipeline cleanup:', error)
  }
}

/**
 * 실시간 시스템 상태 조회
 */
export function getRealTimeSystemStatus() {
  return {
    timestamp: new Date().toISOString(),
    
    // 연결 상태
    websocket: {
      // WebSocket 매니저는 Hook 내부에서 관리되므로 직접 접근 불가
      // 상태는 Redux store에서 가져와야 함
    },
    
    // 캐시 상태
    cache: cacheManager.getStats(),
    
    // 오프라인 상태
    offline: offlineManager.getStatus(),
    
    // 에러 상태
    errors: realTimeErrorHandler.getErrorStats(),
    
    // 성능 상태
    performance: performanceMonitor.getAllStats(),
    
    // 검증 상태
    validation: SchemaValidator.getValidationStats(),
    
    // 메모리 사용량 (브라우저 지원 시)
    memory: typeof window !== 'undefined' && 'memory' in performance 
      ? (performance as any).memory 
      : null
  }
}

/**
 * 디버깅 정보 생성 (개발 환경 전용)
 */
export function generateDebugReport() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Debug report is only available in development mode')
    return null
  }
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // 시스템 상태
    system: getRealTimeSystemStatus(),
    
    // 브라우저 정보
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      platform: navigator.platform
    },
    
    // 지원 기능
    features: {
      webSocket: typeof WebSocket !== 'undefined',
      indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
      localStorage: typeof window !== 'undefined' && 'localStorage' in window,
      serviceWorker: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      webWorker: typeof Worker !== 'undefined'
    },
    
    // 캐시 세부 정보
    cacheDebug: cacheManager.debug(),
    
    // 에러 히스토리 (최근 10개)
    recentErrors: realTimeErrorHandler.getErrorHistory().slice(0, 10)
  }
}

// ===========================================
// 기본 설정 상수
// ===========================================
export const DEFAULT_REALTIME_CONFIG = {
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    connectionTimeout: 10000
  },
  performance: {
    batchSize: 50,
    flushInterval: 1000,
    maxBufferSize: 1000,
    compressionEnabled: true,
    priorityQueue: true
  },
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 100 * 1024 * 1024, // 100MB
    strategy: 'smart' as const
  },
  offline: {
    enabled: true,
    maxOfflineEvents: 500,
    syncStrategy: 'smart' as const,
    conflictResolution: 'server_wins' as const
  }
} as const

// ===========================================
// 개발 환경 전용 글로벌 노출을 위한 import
// ===========================================
import { cacheManager } from './cache-manager'
import { offlineManager } from './offline-manager'
import { realTimeErrorHandler } from './error-handler'
import { performanceMonitor } from './performance-optimizer'
import { SchemaValidator } from './validation'

// ===========================================
// 개발 환경 전용 글로벌 노출
// ===========================================
if (process.env.NODE_ENV === 'development') {
  (globalThis as any).videoplanetRealTime = {
    // 매니저들
    cacheManager,
    offlineManager,
    realTimeErrorHandler,
    performanceMonitor,
    
    // 유틸리티
    generateDebugReport,
    getRealTimeSystemStatus,
    
    // 검증
    SchemaValidator,
    
    // 테스트용 이벤트 생성기
    createTestEvent: (type: RealTimeEventType, data: any = {}) => ({
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      userId: 1,
      sessionId: 'test_session',
      version: '1.0.0',
      ...data
    }),
    
    // 성능 테스트
    performanceTest: {
      eventProcessing: async (eventCount = 1000) => {
        const events = Array.from({ length: eventCount }, (_, i) => ({
          id: `perf_test_${i}`,
          type: 'feedback:created' as const,
          timestamp: new Date().toISOString(),
          userId: 1,
          sessionId: 'perf_test',
          version: '1.0.0'
        }))
        
        const startTime = performance.now()
        
        for (const event of events) {
          SchemaValidator.validateRealTimeEvent(event)
        }
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        console.log(`Performance Test Results:`)
        console.log(`- Events processed: ${eventCount}`)
        console.log(`- Total time: ${duration.toFixed(2)}ms`)
        console.log(`- Average per event: ${(duration / eventCount).toFixed(2)}ms`)
        console.log(`- Events per second: ${(eventCount / (duration / 1000)).toFixed(0)}`)
        
        return {
          eventCount,
          totalTime: duration,
          averagePerEvent: duration / eventCount,
          eventsPerSecond: eventCount / (duration / 1000)
        }
      }
    }
  }
}

// ===========================================
// 타입 안전성을 위한 재export
// ===========================================
export type { AppDispatch, RootState } from '@/shared/lib/store'