/**
 * WebSocket Mock Server for Testing
 * 
 * Provides a controlled WebSocket environment for testing real-time collaboration features.
 * Supports multi-user simulation, connection stability testing, and message reliability.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import http from 'http';

export interface MockWebSocketMessage {
  type: 'chat_message' | 'user_presence' | 'typing_indicator' | 'feedback_update' | 'connection_test';
  feedbackId: number;
  userId: string;
  username?: string;
  message?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface MockUserSession {
  id: string;
  username: string;
  feedbackId: number;
  socket: WebSocket;
  lastActivity: number;
  isTyping: boolean;
}

export class MockWebSocketServer extends EventEmitter {
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number;
  private sessions: Map<string, MockUserSession> = new Map();
  private feedbackRooms: Map<number, Set<string>> = new Map();
  private isStarted = false;

  // Network simulation parameters
  private networkLatency = 0; // ms
  private packetLossRate = 0; // 0-1
  private connectionFailureRate = 0; // 0-1

  constructor(port = 8081) {
    super();
    this.port = port;
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocketHandlers();
  }

  /**
   * Start the mock WebSocket server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isStarted) {
        resolve();
        return;
      }

      this.server.listen(this.port, () => {
        this.isStarted = true;
        console.log(`🔌 Mock WebSocket Server started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the mock WebSocket server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isStarted) {
        resolve();
        return;
      }

      // Close all active connections
      this.sessions.forEach((session) => {
        if (session.socket.readyState === WebSocket.OPEN) {
          session.socket.close();
        }
      });

      this.wss.close(() => {
        this.server.close(() => {
          this.isStarted = false;
          this.sessions.clear();
          this.feedbackRooms.clear();
          console.log('🔌 Mock WebSocket Server stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const feedbackId = parseInt(url.pathname.split('/').pop() || '0');
      
      if (!feedbackId) {
        ws.close(1008, 'Invalid feedback ID');
        return;
      }

      // Simulate connection failure for testing
      if (Math.random() < this.connectionFailureRate) {
        ws.close(1011, 'Simulated connection failure');
        return;
      }

      const sessionId = this.generateSessionId();
      const session: MockUserSession = {
        id: sessionId,
        username: `TestUser_${sessionId.slice(-4)}`,
        feedbackId,
        socket: ws,
        lastActivity: Date.now(),
        isTyping: false
      };

      this.sessions.set(sessionId, session);
      this.addToFeedbackRoom(feedbackId, sessionId);

      console.log(`✅ WebSocket connected: ${sessionId} to feedback ${feedbackId}`);
      this.emit('user_connected', session);

      // Send presence update to room
      this.broadcastToRoom(feedbackId, {
        type: 'user_presence',
        feedbackId,
        userId: sessionId,
        username: session.username,
        timestamp: Date.now(),
        metadata: { action: 'joined' }
      }, sessionId);

      ws.on('message', (data) => this.handleMessage(sessionId, data));
      ws.on('close', () => this.handleDisconnection(sessionId));
      ws.on('error', (error) => this.handleError(sessionId, error));

      // Setup heartbeat
      this.setupHeartbeat(sessionId);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(sessionId: string, data: Buffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Simulate network latency
      if (this.networkLatency > 0) {
        await new Promise(resolve => setTimeout(resolve, this.networkLatency));
      }

      // Simulate packet loss
      if (Math.random() < this.packetLossRate) {
        console.log(`📦 Packet dropped for session ${sessionId}`);
        return;
      }

      const message = JSON.parse(data.toString()) as MockWebSocketMessage;
      message.timestamp = Date.now();
      message.userId = sessionId;
      message.username = session.username;

      session.lastActivity = Date.now();
      
      console.log(`📨 Message received from ${sessionId}:`, message.type);
      this.emit('message_received', sessionId, message);

      // Handle different message types
      switch (message.type) {
        case 'chat_message':
          this.handleChatMessage(session, message);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(session, message);
          break;
        case 'feedback_update':
          this.handleFeedbackUpdate(session, message);
          break;
        case 'connection_test':
          this.handleConnectionTest(session, message);
          break;
        default:
          console.log(`❓ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`❌ Error handling message from ${sessionId}:`, error);
      this.sendToSession(sessionId, {
        type: 'chat_message',
        feedbackId: session.feedbackId,
        userId: 'system',
        message: 'Error processing message',
        timestamp: Date.now(),
        metadata: { error: true }
      });
    }
  }

  /**
   * Handle chat messages
   */
  private handleChatMessage(session: MockUserSession, message: MockWebSocketMessage): void {
    // Broadcast to all users in the same feedback room
    this.broadcastToRoom(session.feedbackId, {
      ...message,
      type: 'chat_message'
    });
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(session: MockUserSession, message: MockWebSocketMessage): void {
    session.isTyping = message.metadata?.isTyping || false;
    
    // Broadcast typing indicator to other users in room
    this.broadcastToRoom(session.feedbackId, {
      type: 'typing_indicator',
      feedbackId: session.feedbackId,
      userId: session.id,
      username: session.username,
      timestamp: Date.now(),
      metadata: { isTyping: session.isTyping }
    }, session.id);
  }

  /**
   * Handle feedback updates
   */
  private handleFeedbackUpdate(session: MockUserSession, message: MockWebSocketMessage): void {
    // Simulate processing delay
    setTimeout(() => {
      this.broadcastToRoom(session.feedbackId, {
        ...message,
        type: 'feedback_update',
        metadata: { 
          ...message.metadata,
          processed: true,
          processedAt: Date.now()
        }
      });
    }, 100);
  }

  /**
   * Handle connection test (ping/pong)
   */
  private handleConnectionTest(session: MockUserSession, message: MockWebSocketMessage): void {
    this.sendToSession(session.id, {
      type: 'connection_test',
      feedbackId: session.feedbackId,
      userId: session.id,
      timestamp: Date.now(),
      metadata: { 
        type: 'pong',
        originalTimestamp: message.timestamp
      }
    });
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`❌ WebSocket disconnected: ${sessionId}`);
    this.emit('user_disconnected', session);

    // Notify room about user leaving
    this.broadcastToRoom(session.feedbackId, {
      type: 'user_presence',
      feedbackId: session.feedbackId,
      userId: sessionId,
      username: session.username,
      timestamp: Date.now(),
      metadata: { action: 'left' }
    }, sessionId);

    this.removeFromFeedbackRoom(session.feedbackId, sessionId);
    this.sessions.delete(sessionId);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(sessionId: string, error: Error): void {
    console.error(`❌ WebSocket error for ${sessionId}:`, error);
    this.emit('connection_error', sessionId, error);
  }

  /**
   * Setup heartbeat mechanism
   */
  private setupHeartbeat(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const heartbeatInterval = setInterval(() => {
      if (!this.sessions.has(sessionId)) {
        clearInterval(heartbeatInterval);
        return;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - session.lastActivity;

      // Close connection if no activity for 30 seconds
      if (timeSinceLastActivity > 30000) {
        console.log(`💔 Closing inactive connection: ${sessionId}`);
        session.socket.close(1000, 'Connection timeout');
        clearInterval(heartbeatInterval);
        return;
      }

      // Send ping every 10 seconds
      if (timeSinceLastActivity > 10000) {
        this.sendToSession(sessionId, {
          type: 'connection_test',
          feedbackId: session.feedbackId,
          userId: 'system',
          timestamp: now,
          metadata: { type: 'ping' }
        });
      }
    }, 5000);
  }

  /**
   * Broadcast message to all users in a feedback room
   */
  private broadcastToRoom(feedbackId: number, message: MockWebSocketMessage, excludeUserId?: string): void {
    const roomUsers = this.feedbackRooms.get(feedbackId);
    if (!roomUsers) return;

    roomUsers.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToSession(userId, message);
      }
    });
  }

  /**
   * Send message to specific session
   */
  private sendToSession(sessionId: string, message: MockWebSocketMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.socket.readyState !== WebSocket.OPEN) return;

    try {
      session.socket.send(JSON.stringify({ result: message }));
    } catch (error) {
      console.error(`❌ Error sending message to ${sessionId}:`, error);
    }
  }

  /**
   * Add user to feedback room
   */
  private addToFeedbackRoom(feedbackId: number, userId: string): void {
    if (!this.feedbackRooms.has(feedbackId)) {
      this.feedbackRooms.set(feedbackId, new Set());
    }
    this.feedbackRooms.get(feedbackId)!.add(userId);
  }

  /**
   * Remove user from feedback room
   */
  private removeFromFeedbackRoom(feedbackId: number, userId: string): void {
    const room = this.feedbackRooms.get(feedbackId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.feedbackRooms.delete(feedbackId);
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simulation controls for testing

  /**
   * Simulate network conditions
   */
  setNetworkConditions(latency: number, packetLoss: number, connectionFailure: number = 0): void {
    this.networkLatency = Math.max(0, latency);
    this.packetLossRate = Math.max(0, Math.min(1, packetLoss));
    this.connectionFailureRate = Math.max(0, Math.min(1, connectionFailure));
    console.log(`🌐 Network conditions: ${latency}ms latency, ${packetLoss * 100}% packet loss, ${connectionFailure * 100}% connection failure`);
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get sessions in feedback room
   */
  getRoomSessions(feedbackId: number): MockUserSession[] {
    const roomUsers = this.feedbackRooms.get(feedbackId);
    if (!roomUsers) return [];

    return Array.from(roomUsers)
      .map(userId => this.sessions.get(userId))
      .filter(session => session !== undefined) as MockUserSession[];
  }

  /**
   * Force disconnect session (for testing)
   */
  forceDisconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.socket.readyState === WebSocket.OPEN) {
      session.socket.close(1011, 'Forced disconnect for testing');
    }
  }

  /**
   * Send test message to specific session
   */
  sendTestMessage(sessionId: string, message: Partial<MockWebSocketMessage>): void {
    this.sendToSession(sessionId, {
      type: 'chat_message',
      feedbackId: 1,
      userId: 'system',
      timestamp: Date.now(),
      ...message
    } as MockWebSocketMessage);
  }
}