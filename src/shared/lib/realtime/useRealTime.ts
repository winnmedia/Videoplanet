/**
 * 실시간 데이터 파이프라인 통합 React Hook
 * 
 * WebSocket 연결, 상태 관리, 캐싱, 오프라인 처리, 에러 핸들링을
 * 하나의 편리한 Hook으로 통합하여 제공
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  BaseRealTimeEvent,
  RealTimeEventType,
  SubscriptionChannel,
  SubscriptionConfig,
  DashboardSnapshot,
  WebSocketMessage 
} from '@/shared/types/realtime.types'
import { WebSocketManager } from './websocket-manager'
import { 
  realTimeSlice,
  selectConnectionState,
  selectIsConnected,
  selectRecentEvents,
  selectEventsByType,
  selectDashboardSnapshot,
  selectOfflineStatus,
  connectRealTime,
  subscribeToChannels,
  receiveEvent,
  updateConnectionState,
  setOnlineStatus,
  addOfflineEvent,
  updateDashboardSnapshot
} from './realtime.slice'
import { cacheManager } from './cache-manager'
import { offlineManager } from './offline-manager'
import { realTimeErrorHandler } from './error-handler'
import { SchemaValidator } from './validation'
import { performanceMonitor } from './performance-optimizer'
import type { AppDispatch, RootState } from '@/shared/lib/store'

// ===========================================
// Hook Options & Return Types
// ===========================================

export interface UseRealTimeOptions {
  // 연결 설정
  autoConnect?: boolean
  reconnectOnMount?: boolean
  
  // 구독 설정
  channels?: SubscriptionChannel[]
  eventTypes?: RealTimeEventType[]
  
  // 성능 설정
  enableCaching?: boolean
  enableOffline?: boolean
  batchUpdates?: boolean
  debounceMs?: number
  
  // 에러 핸들링
  onError?: (error: Error) => void
  onConnectionLost?: () => void
  onReconnected?: () => void
  
  // 데이터 핸들링
  onEvent?: (event: BaseRealTimeEvent) => void
  onFeedbackEvent?: (event: BaseRealTimeEvent) => void
  onInvitationEvent?: (event: BaseRealTimeEvent) => void
  onProjectEvent?: (event: BaseRealTimeEvent) => void
}

export interface UseRealTimeReturn {
  // 연결 상태
  isConnected: boolean
  connectionState: ReturnType<typeof selectConnectionState>
  isOnline: boolean
  
  // 데이터
  recentEvents: BaseRealTimeEvent[]
  unreadCount: number
  
  // 액션
  connect: (token: string, userId: number) => Promise<void>
  disconnect: () => void
  subscribe: (channels: SubscriptionChannel[], config?: Partial<SubscriptionConfig>) => string
  unsubscribe: (subscriptionId: string) => void
  publishEvent: (event: BaseRealTimeEvent) => Promise<void>
  markEventsAsRead: () => void
  
  // 유틸리티
  getEventsByType: (eventType: RealTimeEventType) => BaseRealTimeEvent[]
  getDashboardSnapshot: (projectId: number) => DashboardSnapshot | null
  clearCache: () => Promise<void>
  forceSync: () => Promise<void>
  
  // 메트릭스
  getConnectionMetrics: () => any
  getPerformanceStats: () => any
}

// ===========================================
// Main Hook Implementation
// ===========================================

export function useRealTime(options: UseRealTimeOptions = {}): UseRealTimeReturn {
  const {
    autoConnect = true,
    reconnectOnMount = true,
    channels = [],
    eventTypes,
    enableCaching = true,
    enableOffline = true,
    batchUpdates = true,
    debounceMs = 100,
    onError,
    onConnectionLost,
    onReconnected,
    onEvent,
    onFeedbackEvent,
    onInvitationEvent,
    onProjectEvent
  } = options
  
  const dispatch = useDispatch<AppDispatch>()
  const connectionState = useSelector(selectConnectionState)
  const isConnected = useSelector(selectIsConnected)
  const recentEvents = useSelector(selectRecentEvents)
  const offlineStatus = useSelector(selectOfflineStatus)
  
  // WebSocket 매니저 인스턴스
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const subscriptionsRef = useRef<Map<string, SubscriptionConfig>>(new Map())
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Performance monitoring
  const performanceRef = useRef({
    eventCount: 0,
    lastEventTime: Date.now(),
    connectionTime: 0
  })
  
  // ===========================================
  // WebSocket Manager 초기화
  // ===========================================
  
  const initializeWebSocketManager = useCallback(() => {
    if (wsManagerRef.current) {
      return wsManagerRef.current
    }
    
    const wsManager = new WebSocketManager({
      websocket: {
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
        heartbeatInterval: 30000,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        connectionTimeout: 10000
      },
      performance: {
        batchSize: batchUpdates ? 50 : 1,
        flushInterval: debounceMs,
        maxBufferSize: 1000,
        compressionEnabled: true,
        priorityQueue: true
      },
      cache: {
        enabled: enableCaching,
        ttl: 300,
        maxSize: 10000,
        strategy: 'lru'
      },
      offline: {
        enabled: enableOffline,
        maxOfflineEvents: 500,
        syncStrategy: 'smart',
        conflictResolution: 'server_wins'
      }
    })
    
    // 이벤트 리스너 설정
    setupWebSocketEventListeners(wsManager)
    
    wsManagerRef.current = wsManager
    return wsManager
  }, [batchUpdates, debounceMs, enableCaching, enableOffline])
  
  // ===========================================
  // WebSocket 이벤트 리스너
  // ===========================================
  
  const setupWebSocketEventListeners = useCallback((wsManager: WebSocketManager) => {
    // 연결 상태 변경
    wsManager.on('connectionStateChange', (state) => {
      dispatch(updateConnectionState(state))
      
      if (state.status === 'connected' && connectionState.status !== 'connected') {
        performanceRef.current.connectionTime = Date.now()
        onReconnected?.()
      } else if (state.status === 'disconnected' && connectionState.status === 'connected') {
        onConnectionLost?.()
      }
    })
    
    // 실시간 이벤트 수신
    wsManager.on('realTimeEvent', async (event: BaseRealTimeEvent) => {
      const endMeasure = performanceMonitor.startMeasure('realtime_event_process')
      
      try {
        // 데이터 검증
        const validatedEvent = SchemaValidator.validateRealTimeEvent(event)
        
        // Redux 상태 업데이트
        dispatch(receiveEvent(validatedEvent))
        
        // 캐싱 (활성화된 경우)
        if (enableCaching) {
          await cacheManager.syncWithRealTimeEvent(validatedEvent)
        }
        
        // 오프라인 처리 (필요한 경우)
        if (!offlineStatus.isOnline) {
          await offlineManager.handleRealTimeEvent(validatedEvent)
        }
        
        // 성능 메트릭스 업데이트
        performanceRef.current.eventCount++
        performanceRef.current.lastEventTime = Date.now()
        setUnreadCount(prev => prev + 1)
        
        // 이벤트 타입별 콜백 호출
        onEvent?.(validatedEvent)
        
        if (validatedEvent.type.startsWith('feedback:')) {
          onFeedbackEvent?.(validatedEvent)
        } else if (validatedEvent.type.startsWith('invitation:')) {
          onInvitationEvent?.(validatedEvent)
        } else if (validatedEvent.type.startsWith('project:')) {
          onProjectEvent?.(validatedEvent)
        }
        
      } catch (error) {
        console.error('Failed to process real-time event:', error)
        onError?.(error instanceof Error ? error : new Error('Unknown event processing error'))
        
        await realTimeErrorHandler.handleError(
          error instanceof Error ? error : new Error('Event processing failed'),
          { 
            operation: 'realtime_event_processing',
            metadata: { event: event.type }
          }
        )
      } finally {
        endMeasure()
      }
    })
    
    // 에러 이벤트
    wsManager.on('connectionError', (error) => {
      onError?.(error instanceof Error ? error : new Error('Connection error'))
      
      realTimeErrorHandler.handleError(
        error instanceof Error ? error : new Error('WebSocket connection error'),
        { operation: 'websocket_connection' }
      )
    })
    
    // 메시지 에러
    wsManager.on('messageError', ({ message, error }) => {
      console.error('WebSocket message error:', error)
      onError?.(error instanceof Error ? error : new Error('Message error'))
    })
    
    // 재연결 시도
    wsManager.on('reconnectAttempt', () => {
      console.log('Attempting to reconnect...')
    })
    
    // 재연결 실패
    wsManager.on('reconnectFailed', () => {
      console.error('Failed to reconnect after maximum attempts')
      onError?.(new Error('Failed to reconnect to WebSocket server'))
    })
    
  }, [dispatch, connectionState.status, enableCaching, offlineStatus.isOnline, onEvent, onFeedbackEvent, onInvitationEvent, onProjectEvent, onReconnected, onConnectionLost, onError])
  
  // ===========================================
  // 공개 API 함수들
  // ===========================================
  
  const connect = useCallback(async (token: string, userId: number) => {
    try {
      const wsManager = initializeWebSocketManager()
      
      await wsManager.connect(token, userId)
      await dispatch(connectRealTime({ token, userId })).unwrap()
      
      // 초기 채널 구독
      if (channels.length > 0) {
        const subscriptionId = wsManager.subscribe(channels, {
          eventTypes,
          priority: 'normal'
        })
        
        subscriptionsRef.current.set(subscriptionId, {
          channels,
          eventTypes,
          priority: 'normal'
        })
      }
      
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }, [initializeWebSocketManager, dispatch, channels, eventTypes])
  
  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect()
      wsManagerRef.current = null
    }
    
    subscriptionsRef.current.clear()
    setUnreadCount(0)
  }, [])
  
  const subscribe = useCallback((
    subscriptionChannels: SubscriptionChannel[], 
    config?: Partial<SubscriptionConfig>
  ) => {
    if (!wsManagerRef.current) {
      throw new Error('WebSocket not connected')
    }
    
    const subscriptionId = wsManagerRef.current.subscribe(subscriptionChannels, config)
    const fullConfig: SubscriptionConfig = {
      channels: subscriptionChannels,
      eventTypes,
      priority: 'normal',
      ...config
    }
    
    subscriptionsRef.current.set(subscriptionId, fullConfig)
    
    dispatch(subscribeToChannels({
      channels: subscriptionChannels,
      options: config
    }))
    
    return subscriptionId
  }, [dispatch, eventTypes])
  
  const unsubscribe = useCallback((subscriptionId: string) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.unsubscribe(subscriptionId)
    }
    
    subscriptionsRef.current.delete(subscriptionId)
  }, [])
  
  const publishEvent = useCallback(async (event: BaseRealTimeEvent) => {
    if (!wsManagerRef.current) {
      throw new Error('WebSocket not connected')
    }
    
    try {
      // 데이터 검증
      const validatedEvent = SchemaValidator.validateRealTimeEvent(event)
      
      // 오프라인 상태 확인
      if (!offlineStatus.isOnline) {
        await offlineManager.storeOfflineEntry('event', validatedEvent, {
          priority: 'normal',
          metadata: {
            source: 'user_action',
            projectId: validatedEvent.projectId,
            userId: validatedEvent.userId
          }
        })
        return
      }
      
      // 이벤트 발행
      wsManagerRef.current.publishEvent(validatedEvent)
      
    } catch (error) {
      console.error('Failed to publish event:', error)
      
      await realTimeErrorHandler.handleError(
        error instanceof Error ? error : new Error('Event publish failed'),
        { 
          operation: 'publish_event',
          metadata: { eventType: event.type }
        }
      )
      
      throw error
    }
  }, [offlineStatus.isOnline])
  
  const markEventsAsRead = useCallback(() => {
    dispatch(realTimeSlice.actions.markEventsAsRead())
    setUnreadCount(0)
  }, [dispatch])
  
  const getEventsByType = useCallback((eventType: RealTimeEventType) => {
    return useSelector((state: RootState) => selectEventsByType(eventType)(state))
  }, [])
  
  const getDashboardSnapshot = useCallback((projectId: number) => {
    return useSelector((state: RootState) => selectDashboardSnapshot(projectId)(state))
  }, [])
  
  const clearCache = useCallback(async () => {
    if (enableCaching) {
      await cacheManager.clear()
    }
  }, [enableCaching])
  
  const forceSync = useCallback(async () => {
    if (enableOffline) {
      await offlineManager.forcSync()
    }
  }, [enableOffline])
  
  const getConnectionMetrics = useCallback(() => {
    return wsManagerRef.current?.getMetrics() || null
  }, [])
  
  const getPerformanceStats = useCallback(() => {
    return {
      websocket: wsManagerRef.current?.getMetrics(),
      events: performanceRef.current,
      validation: SchemaValidator.getValidationStats(),
      performance: performanceMonitor.getAllStats(),
      cache: enableCaching ? cacheManager.getStats() : null,
      offline: enableOffline ? offlineManager.getStatus() : null
    }
  }, [enableCaching, enableOffline])
  
  // ===========================================
  // 생명주기 관리
  // ===========================================
  
  // 컴포넌트 마운트
  useEffect(() => {
    // 오프라인 매니저 초기화
    if (enableOffline) {
      offlineManager.init().catch(console.error)
    }
    
    // 에러 핸들러 이벤트 리스너
    const handleFallbackRequested = ({ type }: { type: 'cache' | 'offline' }) => {
      if (type === 'cache' && enableCaching) {
        // 캐시 fallback 로직
      } else if (type === 'offline' && enableOffline) {
        // 오프라인 fallback 로직
      }
    }
    
    realTimeErrorHandler.on('fallbackRequested', handleFallbackRequested)
    
    return () => {
      realTimeErrorHandler.off('fallbackRequested', handleFallbackRequested)
    }
  }, [enableOffline, enableCaching])
  
  // 온라인/오프라인 상태 모니터링
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true))
      
      // 재연결 시도
      if (reconnectOnMount && wsManagerRef.current) {
        // 재연결 로직은 WebSocketManager가 자동 처리
      }
      
      // 오프라인 데이터 동기화
      if (enableOffline) {
        offlineManager.forcSync().catch(console.error)
      }
    }
    
    const handleOffline = () => {
      dispatch(setOnlineStatus(false))
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // 초기 상태 설정
    dispatch(setOnlineStatus(navigator.onLine))
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch, reconnectOnMount, enableOffline])
  
  // 컴포넌트 언마운트
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])
  
  // 자동 연결
  useEffect(() => {
    // 실제 환경에서는 토큰과 사용자 ID를 안전하게 가져와야 함
    const token = localStorage.getItem('authToken')
    const userIdStr = localStorage.getItem('userId')
    
    if (autoConnect && token && userIdStr && !isConnected) {
      const userId = parseInt(userIdStr, 10)
      if (!isNaN(userId)) {
        connect(token, userId).catch(console.error)
      }
    }
  }, [autoConnect, isConnected, connect])
  
  // ===========================================
  // Return Object
  // ===========================================
  
  return {
    // 상태
    isConnected,
    connectionState,
    isOnline: offlineStatus.isOnline,
    recentEvents,
    unreadCount,
    
    // 액션
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publishEvent,
    markEventsAsRead,
    
    // 유틸리티
    getEventsByType,
    getDashboardSnapshot,
    clearCache,
    forceSync,
    getConnectionMetrics,
    getPerformanceStats
  }
}

// ===========================================
// 특화된 Hook들
// ===========================================

/**
 * 피드백 실시간 데이터만 처리하는 특화 Hook
 */
export function useFeedbackRealTime(projectId?: number, videoId?: string) {
  const channels: SubscriptionChannel[] = []
  
  if (projectId) {
    channels.push(`project:${projectId}`)
  }
  if (videoId) {
    channels.push(`video:${videoId}`)
  }
  
  return useRealTime({
    channels,
    eventTypes: [
      'feedback:created',
      'feedback:updated',
      'feedback:deleted',
      'feedback:reply:added',
      'feedback:reaction:added',
      'feedback:status:changed'
    ],
    batchUpdates: true,
    debounceMs: 50 // 빠른 업데이트 필요
  })
}

/**
 * 초대 관리 실시간 데이터 Hook
 */
export function useInvitationRealTime(projectId?: number) {
  return useRealTime({
    channels: projectId ? [`project:${projectId}`] : [],
    eventTypes: [
      'invitation:sent',
      'invitation:viewed',
      'invitation:accepted',
      'invitation:declined',
      'invitation:expired'
    ],
    batchUpdates: false, // 초대는 즉시 반영 필요
    debounceMs: 0
  })
}

/**
 * 프로젝트 일정 실시간 데이터 Hook
 */
export function useProjectTimelineRealTime(projectIds?: number[]) {
  const channels: SubscriptionChannel[] = []
  
  if (projectIds) {
    channels.push(...projectIds.map(id => `project:${id}` as const))
  }
  
  return useRealTime({
    channels,
    eventTypes: [
      'project:status:changed',
      'project:milestone:completed',
      'project:timeline:updated',
      'project:progress:updated'
    ],
    batchUpdates: true,
    debounceMs: 200 // 일정 업데이트는 약간의 지연 허용
  })
}

/**
 * 대시보드 실시간 데이터 Hook
 */
export function useDashboardRealTime(projectId: number) {
  const realTime = useRealTime({
    channels: [`dashboard:${projectId}`, `project:${projectId}`],
    eventTypes: [
      'feedback:created',
      'invitation:sent',
      'invitation:accepted',
      'project:progress:updated'
    ],
    enableCaching: true,
    batchUpdates: true,
    debounceMs: 1000 // 대시보드는 1초 지연 허용
  })
  
  const dashboardSnapshot = realTime.getDashboardSnapshot(projectId)
  
  return {
    ...realTime,
    dashboardSnapshot,
    refreshDashboard: () => {
      // 대시보드 새로고침 로직
      realTime.publishEvent({
        id: `refresh_${Date.now()}`,
        type: 'system:sync:required',
        timestamp: new Date().toISOString(),
        userId: 0, // 시스템 요청
        projectId,
        sessionId: 'system',
        version: '1.0.0',
        metadata: { source: 'dashboard_refresh' }
      })
    }
  }
}