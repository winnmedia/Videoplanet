/**
 * 실시간 데이터 상태 관리 Slice
 * 
 * WebSocket 연결 상태, 실시간 이벤트, 구독 관리를 위한 Redux Toolkit 슬라이스
 * FSD 아키텍처의 shared/lib 레이어에서 전역 실시간 상태를 관리
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { 
  BaseRealTimeEvent, 
  ConnectionState, 
  SubscriptionChannel,
  SubscriptionConfig,
  DashboardSnapshot,
  FeedbackCreatedEvent,
  InvitationSentEvent,
  ProjectProgressEvent,
  RealTimeEventType
} from '@/shared/types/realtime.types'

// ===========================================
// State Interface
// ===========================================

export interface RealTimeState {
  // 연결 상태
  connection: ConnectionState & {
    isAuthenticated: boolean
    userId?: number
    sessionId?: string
  }
  
  // 구독 관리
  subscriptions: {
    active: Record<string, SubscriptionConfig>
    channels: SubscriptionChannel[]
    eventCounts: Record<RealTimeEventType, number>
  }
  
  // 이벤트 스트림 (최근 이벤트들을 메모리에 유지)
  events: {
    recent: BaseRealTimeEvent[]
    maxSize: number
    byType: Record<string, BaseRealTimeEvent[]>
    unread: number
  }
  
  // 대시보드 실시간 데이터
  dashboard: {
    snapshots: Record<number, DashboardSnapshot> // projectId -> snapshot
    lastUpdate: string
    autoRefresh: boolean
    refreshInterval: number
  }
  
  // 피드백 실시간 상태
  feedback: {
    activeVideo?: string
    newFeedback: number
    pendingSync: string[] // feedback IDs
    optimisticUpdates: Record<string, any>
  }
  
  // 초대 실시간 상태
  invitations: {
    pending: string[] // invitation IDs
    recentActivity: InvitationSentEvent[]
    deliveryStatus: Record<string, 'sending' | 'delivered' | 'failed'>
  }
  
  // 프로젝트 일정 실시간 상태
  timeline: {
    activeProjects: number[]
    progressUpdates: Record<number, ProjectProgressEvent>
    notifications: {
      deadlines: Array<{
        projectId: number
        stage: string
        daysRemaining: number
        notifiedAt: string
      }>
      milestones: Array<{
        projectId: number
        milestone: string
        completedAt: string
      }>
    }
  }
  
  // 오프라인 지원
  offline: {
    isOnline: boolean
    lastOnline?: string
    pendingEvents: BaseRealTimeEvent[]
    syncInProgress: boolean
    conflictQueue: Array<{
      eventId: string
      localVersion: any
      serverVersion: any
      strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual'
    }>
  }
  
  // 성능 메트릭스
  performance: {
    latency: number
    messageRate: number // messages per second
    errorRate: number
    lastMetricUpdate: string
    bufferSize: number
    droppedMessages: number
  }
}

const initialState: RealTimeState = {
  connection: {
    status: 'disconnected',
    reconnectAttempts: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0,
    isAuthenticated: false
  },
  subscriptions: {
    active: {},
    channels: [],
    eventCounts: {} as Record<RealTimeEventType, number>
  },
  events: {
    recent: [],
    maxSize: 500,
    byType: {},
    unread: 0
  },
  dashboard: {
    snapshots: {},
    lastUpdate: '',
    autoRefresh: true,
    refreshInterval: 30000
  },
  feedback: {
    newFeedback: 0,
    pendingSync: [],
    optimisticUpdates: {}
  },
  invitations: {
    pending: [],
    recentActivity: [],
    deliveryStatus: {}
  },
  timeline: {
    activeProjects: [],
    progressUpdates: {},
    notifications: {
      deadlines: [],
      milestones: []
    }
  },
  offline: {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingEvents: [],
    syncInProgress: false,
    conflictQueue: []
  },
  performance: {
    latency: 0,
    messageRate: 0,
    errorRate: 0,
    lastMetricUpdate: new Date().toISOString(),
    bufferSize: 0,
    droppedMessages: 0
  }
}

// ===========================================
// Async Thunks
// ===========================================

export const connectRealTime = createAsyncThunk(
  'realtime/connect',
  async (params: { token: string; userId: number }, { rejectWithValue }) => {
    try {
      // WebSocketManager는 hook에서 처리
      return { userId: params.userId, timestamp: new Date().toISOString() }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Connection failed')
    }
  }
)

export const subscribeToChannels = createAsyncThunk(
  'realtime/subscribe',
  async (config: { channels: SubscriptionChannel[]; options?: Partial<SubscriptionConfig> }) => {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      subscriptionId,
      config: {
        channels: config.channels,
        priority: 'normal',
        ...config.options
      } as SubscriptionConfig
    }
  }
)

export const syncOfflineEvents = createAsyncThunk(
  'realtime/syncOffline',
  async (_, { getState, dispatch }) => {
    const state = (getState() as { realtime: RealTimeState }).realtime
    const pendingEvents = state.offline.pendingEvents
    
    if (pendingEvents.length === 0) {
      return { syncedCount: 0 }
    }

    try {
      // 여기서 실제 API 호출로 서버와 동기화
      // 현재는 시뮬레이션
      
      const syncResults = pendingEvents.map(event => ({
        eventId: event.id,
        success: true,
        serverTimestamp: new Date().toISOString()
      }))

      return { 
        syncedCount: syncResults.filter(r => r.success).length,
        results: syncResults
      }
    } catch (error) {
      throw error
    }
  }
)

// ===========================================
// Slice Definition  
// ===========================================

const realTimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    // 연결 상태 업데이트
    updateConnectionState: (state, action: PayloadAction<Partial<ConnectionState>>) => {
      state.connection = { ...state.connection, ...action.payload }
    },

    // 인증 상태 업데이트
    setAuthenticated: (state, action: PayloadAction<{ userId: number; sessionId: string }>) => {
      state.connection.isAuthenticated = true
      state.connection.userId = action.payload.userId
      state.connection.sessionId = action.payload.sessionId
    },

    // 실시간 이벤트 수신
    receiveEvent: (state, action: PayloadAction<BaseRealTimeEvent>) => {
      const event = action.payload
      
      // 최근 이벤트 목록에 추가
      state.events.recent.unshift(event)
      if (state.events.recent.length > state.events.maxSize) {
        state.events.recent.pop()
      }
      
      // 타입별 분류
      if (!state.events.byType[event.type]) {
        state.events.byType[event.type] = []
      }
      state.events.byType[event.type].unshift(event)
      if (state.events.byType[event.type].length > 100) {
        state.events.byType[event.type].pop()
      }
      
      // 이벤트 카운터 업데이트
      if (!state.subscriptions.eventCounts[event.type]) {
        state.subscriptions.eventCounts[event.type] = 0
      }
      state.subscriptions.eventCounts[event.type]++
      
      // 읽지 않은 이벤트 수 증가
      state.events.unread++
    },

    // 특정 타입 이벤트 처리
    handleFeedbackEvent: (state, action: PayloadAction<FeedbackCreatedEvent>) => {
      const event = action.payload
      state.feedback.newFeedback++
      
      if (event.data.feedback.videoId) {
        state.feedback.activeVideo = event.data.feedback.videoId
      }

      // 낙관적 업데이트
      state.feedback.optimisticUpdates[event.data.feedback.id] = {
        status: 'pending',
        timestamp: event.timestamp
      }
    },

    handleInvitationEvent: (state, action: PayloadAction<InvitationSentEvent>) => {
      const event = action.payload
      state.invitations.recentActivity.unshift(event)
      if (state.invitations.recentActivity.length > 50) {
        state.invitations.recentActivity.pop()
      }
      
      state.invitations.deliveryStatus[event.data.invitation.id] = 'sending'
    },

    handleProjectEvent: (state, action: PayloadAction<ProjectProgressEvent>) => {
      const event = action.payload
      state.timeline.progressUpdates[event.data.projectId] = event
      
      if (!state.timeline.activeProjects.includes(event.data.projectId)) {
        state.timeline.activeProjects.push(event.data.projectId)
      }

      // 알림 처리
      if (event.data.notifications.milestoneCompleted) {
        state.timeline.notifications.milestones.push({
          projectId: event.data.projectId,
          milestone: event.data.notifications.milestoneCompleted,
          completedAt: event.timestamp
        })
      }

      if (event.data.notifications.deadlineApproaching) {
        state.timeline.notifications.deadlines.push({
          projectId: event.data.projectId,
          stage: event.data.notifications.deadlineApproaching.stage,
          daysRemaining: event.data.notifications.deadlineApproaching.daysRemaining,
          notifiedAt: event.timestamp
        })
      }
    },

    // 대시보드 스냅샷 업데이트
    updateDashboardSnapshot: (state, action: PayloadAction<DashboardSnapshot>) => {
      const snapshot = action.payload
      state.dashboard.snapshots[snapshot.projectId] = snapshot
      state.dashboard.lastUpdate = snapshot.timestamp
    },

    // 구독 관리
    addSubscription: (state, action: PayloadAction<{ id: string; config: SubscriptionConfig }>) => {
      state.subscriptions.active[action.payload.id] = action.payload.config
      
      // 채널 목록 업데이트
      action.payload.config.channels.forEach(channel => {
        if (!state.subscriptions.channels.includes(channel)) {
          state.subscriptions.channels.push(channel)
        }
      })
    },

    removeSubscription: (state, action: PayloadAction<string>) => {
      delete state.subscriptions.active[action.payload]
      
      // 채널 목록 재계산
      const activeChannels = new Set<SubscriptionChannel>()
      Object.values(state.subscriptions.active).forEach(config => {
        config.channels.forEach(channel => activeChannels.add(channel))
      })
      state.subscriptions.channels = Array.from(activeChannels)
    },

    // 읽지 않은 이벤트 초기화
    markEventsAsRead: (state) => {
      state.events.unread = 0
    },

    // 오프라인 상태 관리
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      const wasOffline = !state.offline.isOnline
      state.offline.isOnline = action.payload
      
      if (wasOffline && action.payload) {
        // 온라인 상태로 복귀
        state.offline.lastOnline = new Date().toISOString()
      }
    },

    addOfflineEvent: (state, action: PayloadAction<BaseRealTimeEvent>) => {
      state.offline.pendingEvents.push(action.payload)
      
      // 오프라인 이벤트 큐 크기 제한
      if (state.offline.pendingEvents.length > 1000) {
        state.offline.pendingEvents.shift()
      }
    },

    clearOfflineEvents: (state) => {
      state.offline.pendingEvents = []
    },

    addConflict: (state, action: PayloadAction<{
      eventId: string
      localVersion: any
      serverVersion: any
      strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual'
    }>) => {
      state.offline.conflictQueue.push(action.payload)
    },

    resolveConflict: (state, action: PayloadAction<string>) => {
      state.offline.conflictQueue = state.offline.conflictQueue.filter(
        conflict => conflict.eventId !== action.payload
      )
    },

    // 성능 메트릭스 업데이트
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<RealTimeState['performance']>>) => {
      state.performance = { 
        ...state.performance, 
        ...action.payload,
        lastMetricUpdate: new Date().toISOString()
      }
    },

    // 낙관적 업데이트
    addOptimisticUpdate: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.feedback.optimisticUpdates[action.payload.id] = {
        ...action.payload.data,
        optimistic: true,
        timestamp: new Date().toISOString()
      }
    },

    removeOptimisticUpdate: (state, action: PayloadAction<string>) => {
      delete state.feedback.optimisticUpdates[action.payload]
    },

    // 설정 업데이트
    updateDashboardSettings: (state, action: PayloadAction<{
      autoRefresh?: boolean
      refreshInterval?: number
    }>) => {
      state.dashboard = { ...state.dashboard, ...action.payload }
    },

    // 상태 초기화
    resetRealTimeState: () => initialState,

    // 개발/디버깅용
    injectTestEvent: (state, action: PayloadAction<BaseRealTimeEvent>) => {
      // 개발 환경에서만 사용
      if (process.env.NODE_ENV === 'development') {
        state.events.recent.unshift(action.payload)
        state.events.unread++
      }
    }
  },

  extraReducers: (builder) => {
    builder
      // 연결 관련
      .addCase(connectRealTime.pending, (state) => {
        state.connection.status = 'connecting'
      })
      .addCase(connectRealTime.fulfilled, (state, action) => {
        state.connection.status = 'connected'
        state.connection.userId = action.payload.userId
        state.connection.lastConnected = new Date(action.payload.timestamp)
        state.connection.reconnectAttempts = 0
      })
      .addCase(connectRealTime.rejected, (state, action) => {
        state.connection.status = 'error'
      })

      // 구독 관련
      .addCase(subscribeToChannels.fulfilled, (state, action) => {
        state.subscriptions.active[action.payload.subscriptionId] = action.payload.config
        
        action.payload.config.channels.forEach(channel => {
          if (!state.subscriptions.channels.includes(channel)) {
            state.subscriptions.channels.push(channel)
          }
        })
      })

      // 오프라인 동기화
      .addCase(syncOfflineEvents.pending, (state) => {
        state.offline.syncInProgress = true
      })
      .addCase(syncOfflineEvents.fulfilled, (state, action) => {
        state.offline.syncInProgress = false
        state.offline.pendingEvents = []
      })
      .addCase(syncOfflineEvents.rejected, (state, action) => {
        state.offline.syncInProgress = false
      })
  }
})

// ===========================================
// Actions Export
// ===========================================

export const {
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
  injectTestEvent
} = realTimeSlice.actions

// ===========================================
// Selectors
// ===========================================

export const selectConnectionState = (state: { realtime: RealTimeState }) => 
  state.realtime.connection

export const selectIsConnected = (state: { realtime: RealTimeState }) => 
  state.realtime.connection.status === 'connected'

export const selectIsAuthenticated = (state: { realtime: RealTimeState }) => 
  state.realtime.connection.isAuthenticated

export const selectRecentEvents = (state: { realtime: RealTimeState }) => 
  state.realtime.events.recent

export const selectEventsByType = (eventType: RealTimeEventType) => 
  (state: { realtime: RealTimeState }) => 
    state.realtime.events.byType[eventType] || []

export const selectUnreadCount = (state: { realtime: RealTimeState }) => 
  state.realtime.events.unread

export const selectDashboardSnapshot = (projectId: number) => 
  (state: { realtime: RealTimeState }) => 
    state.realtime.dashboard.snapshots[projectId]

export const selectActiveSubscriptions = (state: { realtime: RealTimeState }) => 
  state.realtime.subscriptions.active

export const selectSubscribedChannels = (state: { realtime: RealTimeState }) => 
  state.realtime.subscriptions.channels

export const selectOfflineStatus = (state: { realtime: RealTimeState }) => 
  state.realtime.offline

export const selectPendingConflicts = (state: { realtime: RealTimeState }) => 
  state.realtime.offline.conflictQueue

export const selectPerformanceMetrics = (state: { realtime: RealTimeState }) => 
  state.realtime.performance

export const selectFeedbackState = (state: { realtime: RealTimeState }) => 
  state.realtime.feedback

export const selectInvitationState = (state: { realtime: RealTimeState }) => 
  state.realtime.invitations

export const selectTimelineState = (state: { realtime: RealTimeState }) => 
  state.realtime.timeline

export { realTimeSlice }
export default realTimeSlice.reducer