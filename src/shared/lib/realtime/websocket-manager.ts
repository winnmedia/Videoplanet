/**
 * WebSocket 연결 관리자
 * 
 * 실시간 데이터 파이프라인의 핵심 WebSocket 연결을 관리하며
 * 연결 안정성, 재연결, 메시지 큐잉, 배치 처리를 담당
 */

import { EventEmitter } from 'events'
import { 
  RealTimeEventType,
  BaseRealTimeEvent,
  WebSocketMessage,
  WebSocketAuthMessage,
  WebSocketSubscribeMessage,
  WebSocketEventMessage,
  SubscriptionChannel,
  SubscriptionConfig,
  RealTimeConfig,
  DEFAULT_REALTIME_CONFIG
} from '@/shared/types/realtime.types'

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  lastConnected?: Date
  reconnectAttempts: number
  latency?: number
  messagesSent: number
  messagesReceived: number
  bytesTransferred: number
}

export interface MessageQueue {
  pending: WebSocketMessage[]
  failed: WebSocketMessage[]
  acknowledged: Set<string>
  maxSize: number
  priorityQueue: boolean
}

export class WebSocketManager extends EventEmitter {
  private socket: WebSocket | null = null
  private config: RealTimeConfig
  private connectionState: ConnectionState
  private messageQueue: MessageQueue
  private subscriptions = new Map<string, SubscriptionConfig>()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private messageBuffer: WebSocketMessage[] = []
  private flushTimeout: NodeJS.Timeout | null = null
  
  constructor(config: Partial<RealTimeConfig> = {}) {
    super()
    this.config = { ...DEFAULT_REALTIME_CONFIG, ...config }
    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0
    }
    this.messageQueue = {
      pending: [],
      failed: [],
      acknowledged: new Set(),
      maxSize: this.config.performance.maxBufferSize,
      priorityQueue: this.config.performance.priorityQueue
    }
  }

  /**
   * WebSocket 연결 시작
   */
  async connect(token: string, userId: number): Promise<void> {
    if (this.connectionState.status === 'connected') {
      return Promise.resolve()
    }

    this.connectionState.status = 'connecting'
    this.emit('connectionStateChange', this.connectionState)

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.websocket.url)
        
        const connectionTimeout = setTimeout(() => {
          this.socket?.close()
          this.handleConnectionError(new Error('Connection timeout'))
          reject(new Error('Connection timeout'))
        }, this.config.websocket.connectionTimeout)

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout)
          this.connectionState.status = 'connected'
          this.connectionState.lastConnected = new Date()
          this.connectionState.reconnectAttempts = 0
          
          // 인증 메시지 전송
          this.authenticate(token, userId)
          
          // 하트비트 시작
          this.startHeartbeat()
          
          // 대기 중인 메시지 전송
          this.processPendingMessages()
          
          this.emit('connected')
          this.emit('connectionStateChange', this.connectionState)
          resolve()
        }

        this.socket.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout)
          this.handleConnectionError(error)
          if (this.connectionState.status === 'connecting') {
            reject(error)
          }
        }

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout)
          this.handleConnectionClose(event)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 연결 종료
   */
  disconnect(): void {
    this.clearHeartbeat()
    this.clearReconnectTimeout()
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }
    
    this.connectionState.status = 'disconnected'
    this.emit('disconnected')
    this.emit('connectionStateChange', this.connectionState)
  }

  /**
   * 채널 구독
   */
  subscribe(channels: SubscriptionChannel[], config?: Partial<SubscriptionConfig>): string {
    const subscriptionId = this.generateId()
    const subscriptionConfig: SubscriptionConfig = {
      channels,
      priority: 'normal',
      maxEventsPerSecond: 100,
      bufferSize: 1000,
      ...config
    }

    this.subscriptions.set(subscriptionId, subscriptionConfig)

    const message: WebSocketSubscribeMessage = {
      id: this.generateId(),
      type: 'subscribe',
      timestamp: new Date().toISOString(),
      data: {
        channels,
        filters: {
          eventTypes: config?.eventTypes,
          priority: config?.priority
        }
      },
      requiresAck: true
    }

    this.sendMessage(message)
    return subscriptionId
  }

  /**
   * 구독 해제
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId)

    const message: WebSocketMessage = {
      id: this.generateId(),
      type: 'unsubscribe',
      timestamp: new Date().toISOString(),
      data: { subscriptionId }
    }

    this.sendMessage(message)
  }

  /**
   * 이벤트 발행 (서버로 전송)
   */
  publishEvent(event: BaseRealTimeEvent): void {
    const message: WebSocketEventMessage = {
      id: this.generateId(),
      type: 'event',
      timestamp: new Date().toISOString(),
      data: event,
      requiresAck: true
    }

    this.sendMessage(message)
  }

  /**
   * 연결 상태 조회
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * 구독 목록 조회
   */
  getSubscriptions(): Map<string, SubscriptionConfig> {
    return new Map(this.subscriptions)
  }

  // ===========================================
  // Private Methods
  // ===========================================

  private authenticate(token: string, userId: number): void {
    const authMessage: WebSocketAuthMessage = {
      id: this.generateId(),
      type: 'auth',
      timestamp: new Date().toISOString(),
      data: {
        token,
        userId,
        sessionId: this.generateSessionId(),
        capabilities: ['read', 'write', 'subscribe']
      }
    }

    this.sendMessage(authMessage, true) // 인증은 우선 전송
  }

  private sendMessage(message: WebSocketMessage, priority = false): void {
    if (this.connectionState.status !== 'connected' || !this.socket) {
      // 오프라인 상태에서는 큐에 저장
      if (priority) {
        this.messageQueue.pending.unshift(message)
      } else {
        this.messageQueue.pending.push(message)
      }
      this.trimMessageQueue()
      return
    }

    // 성능 최적화: 배치 처리
    if (this.config.performance.batchSize > 1 && !priority) {
      this.messageBuffer.push(message)
      
      if (this.messageBuffer.length >= this.config.performance.batchSize) {
        this.flushMessageBuffer()
      } else if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => {
          this.flushMessageBuffer()
        }, this.config.performance.flushInterval)
      }
    } else {
      this.sendSingleMessage(message)
    }
  }

  private sendSingleMessage(message: WebSocketMessage): void {
    if (!this.socket || this.connectionState.status !== 'connected') return

    try {
      const messageStr = JSON.stringify(message)
      this.socket.send(messageStr)
      
      this.connectionState.messagesSent++
      this.connectionState.bytesTransferred += messageStr.length
      
      // ACK 필요한 메시지는 대기열에 추가
      if (message.requiresAck) {
        this.messageQueue.pending.push(message)
        
        // 타임아웃 설정
        setTimeout(() => {
          if (!this.messageQueue.acknowledged.has(message.id)) {
            this.handleMessageTimeout(message)
          }
        }, 5000)
      }

      this.emit('messageSent', message)
    } catch (error) {
      this.handleMessageError(message, error)
    }
  }

  private flushMessageBuffer(): void {
    if (this.messageBuffer.length === 0) return

    const batchMessage: WebSocketMessage = {
      id: this.generateId(),
      type: 'event',
      timestamp: new Date().toISOString(),
      data: {
        type: 'batch',
        messages: this.messageBuffer
      }
    }

    this.sendSingleMessage(batchMessage)
    this.messageBuffer = []

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      this.connectionState.messagesReceived++
      this.connectionState.bytesTransferred += event.data.length

      // 레이턴시 계산
      if (message.type === 'heartbeat' && message.replyTo) {
        const sentTime = this.extractTimestampFromId(message.replyTo)
        if (sentTime) {
          this.connectionState.latency = Date.now() - sentTime
        }
      }

      // ACK 처리
      if (message.type === 'ack') {
        this.handleAcknowledgment(message)
        return
      }

      // 이벤트 메시지 처리
      if (message.type === 'event') {
        this.handleEventMessage(message as WebSocketEventMessage)
      }

      this.emit('messageReceived', message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      this.emit('messageError', error)
    }
  }

  private handleEventMessage(message: WebSocketEventMessage): void {
    const event = message.data
    
    // 구독 필터링
    const relevantSubscriptions = Array.from(this.subscriptions.entries()).filter(
      ([_, config]) => this.isEventRelevant(event, config)
    )

    if (relevantSubscriptions.length > 0) {
      this.emit('realTimeEvent', event)
      this.emit(`event:${event.type}`, event)
    }
  }

  private isEventRelevant(event: BaseRealTimeEvent, config: SubscriptionConfig): boolean {
    // 채널 확인
    const eventChannels = this.extractEventChannels(event)
    const hasMatchingChannel = config.channels.some(channel => 
      eventChannels.includes(channel) || channel === 'global'
    )

    if (!hasMatchingChannel) return false

    // 이벤트 타입 필터
    if (config.eventTypes && !config.eventTypes.includes(event.type)) {
      return false
    }

    return true
  }

  private extractEventChannels(event: BaseRealTimeEvent): string[] {
    const channels: string[] = []
    
    if (event.projectId) {
      channels.push(`project:${event.projectId}`)
    }
    
    if (event.videoId) {
      channels.push(`video:${event.videoId}`)
    }
    
    channels.push(`user:${event.userId}`)
    
    return channels
  }

  private handleConnectionError(error: Event | Error): void {
    console.error('WebSocket connection error:', error)
    this.connectionState.status = 'error'
    this.emit('connectionError', error)
    this.emit('connectionStateChange', this.connectionState)
    
    // 자동 재연결
    this.scheduleReconnect()
  }

  private handleConnectionClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason)
    this.clearHeartbeat()
    this.connectionState.status = 'disconnected'
    this.emit('connectionClosed', event)
    this.emit('connectionStateChange', this.connectionState)
    
    // 정상적인 종료가 아닌 경우 재연결
    if (event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.websocket.maxReconnectAttempts) {
      this.emit('reconnectFailed')
      return
    }

    this.connectionState.status = 'reconnecting'
    this.connectionState.reconnectAttempts++
    this.emit('connectionStateChange', this.connectionState)

    const delay = this.calculateReconnectDelay()
    
    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnecting', this.connectionState.reconnectAttempts)
      // 재연결 시도 (토큰과 유저 정보는 외부에서 제공)
      this.emit('reconnectAttempt')
    }, delay)
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.config.websocket.reconnectInterval
    const backoffMultiplier = Math.min(Math.pow(2, this.connectionState.reconnectAttempts - 1), 30)
    const jitter = Math.random() * 1000
    
    return baseDelay * backoffMultiplier + jitter
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeatMessage: WebSocketMessage = {
        id: this.generateId(),
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        data: { timestamp: Date.now() }
      }
      
      this.sendMessage(heartbeatMessage)
    }, this.config.websocket.heartbeatInterval)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private processPendingMessages(): void {
    const messages = [...this.messageQueue.pending]
    this.messageQueue.pending = []

    messages.forEach(message => {
      this.sendMessage(message)
    })
  }

  private handleAcknowledgment(message: WebSocketMessage): void {
    if (message.replyTo) {
      this.messageQueue.acknowledged.add(message.replyTo)
      
      // 대기열에서 제거
      this.messageQueue.pending = this.messageQueue.pending.filter(
        msg => msg.id !== message.replyTo
      )
    }
  }

  private handleMessageTimeout(message: WebSocketMessage): void {
    console.warn('Message timeout:', message.id)
    
    // 대기열에서 실패 목록으로 이동
    this.messageQueue.pending = this.messageQueue.pending.filter(
      msg => msg.id !== message.id
    )
    this.messageQueue.failed.push(message)
    
    this.emit('messageTimeout', message)
  }

  private handleMessageError(message: WebSocketMessage, error: any): void {
    console.error('Message send error:', error)
    this.messageQueue.failed.push(message)
    this.emit('messageError', { message, error })
  }

  private trimMessageQueue(): void {
    if (this.messageQueue.pending.length > this.messageQueue.maxSize) {
      const excess = this.messageQueue.pending.length - this.messageQueue.maxSize
      this.messageQueue.pending.splice(0, excess)
    }

    if (this.messageQueue.failed.length > 100) {
      this.messageQueue.failed.splice(0, this.messageQueue.failed.length - 100)
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
  }

  private extractTimestampFromId(id: string): number | null {
    const parts = id.split('-')
    const timestamp = parseInt(parts[0])
    return isNaN(timestamp) ? null : timestamp
  }

  // ===========================================
  // 메트릭스 및 모니터링
  // ===========================================

  getMetrics() {
    return {
      connection: this.connectionState,
      queue: {
        pending: this.messageQueue.pending.length,
        failed: this.messageQueue.failed.length,
        acknowledged: this.messageQueue.acknowledged.size
      },
      subscriptions: this.subscriptions.size,
      buffer: this.messageBuffer.length
    }
  }

  clearFailedMessages(): void {
    this.messageQueue.failed = []
  }

  retryFailedMessages(): void {
    const failed = [...this.messageQueue.failed]
    this.messageQueue.failed = []
    
    failed.forEach(message => {
      this.sendMessage(message)
    })
  }
}