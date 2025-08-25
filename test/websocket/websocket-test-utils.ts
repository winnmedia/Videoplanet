/**
 * WebSocket Testing Utilities
 * 
 * Provides helper functions and classes for WebSocket testing scenarios.
 * Includes connection management, message validation, and test orchestration.
 */

import { Page, expect } from '@playwright/test';
import { MockWebSocketServer, MockWebSocketMessage } from './websocket-mock-server';

export interface WebSocketTestConfig {
  serverPort: number;
  frontendPort: number;
  timeout: number;
  maxRetries: number;
  heartbeatInterval: number;
}

export interface WebSocketConnectionTest {
  userId: string;
  feedbackId: number;
  expectedMessages: string[];
  receivedMessages: string[];
  isConnected: boolean;
  connectionTime: number;
  lastActivity: number;
}

export interface MultiUserTestScenario {
  users: Array<{
    id: string;
    name: string;
    actions: Array<{
      type: 'connect' | 'send_message' | 'disconnect' | 'wait';
      delay?: number;
      message?: string;
      feedbackId?: number;
    }>;
  }>;
  expectedOutcomes: Array<{
    userId: string;
    shouldReceive: string[];
    shouldNotReceive?: string[];
  }>;
}

export class WebSocketTestClient {
  private socket: WebSocket | null = null;
  private messages: MockWebSocketMessage[] = [];
  private connectionPromise: Promise<void> | null = null;
  private messageHandlers: Map<string, (message: MockWebSocketMessage) => void> = new Map();

  constructor(
    private url: string,
    private feedbackId: number,
    private userId: string = `test_user_${Date.now()}`
  ) {}

  /**
   * Connect to WebSocket server
   */
  async connect(timeout = 5000): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const wsUrl = `${this.url}/ws/chat/${this.feedbackId}/`;
      this.socket = new WebSocket(wsUrl);

      const timeoutId = setTimeout(() => {
        reject(new Error(`WebSocket connection timeout after ${timeout}ms`));
      }, timeout);

      this.socket.onopen = () => {
        clearTimeout(timeoutId);
        console.log(`✅ WebSocket connected: ${this.userId}`);
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message = data.result as MockWebSocketMessage;
          this.messages.push(message);
          
          // Call registered handlers
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log(`❌ WebSocket disconnected: ${this.userId}`);
      };
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      
      // Wait for close event
      return new Promise(resolve => {
        const checkClosed = () => {
          if (this.socket?.readyState === WebSocket.CLOSED) {
            resolve();
          } else {
            setTimeout(checkClosed, 10);
          }
        };
        checkClosed();
      });
    }
  }

  /**
   * Send message to WebSocket server
   */
  async sendMessage(message: Partial<MockWebSocketMessage>): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const fullMessage: MockWebSocketMessage = {
      type: 'chat_message',
      feedbackId: this.feedbackId,
      userId: this.userId,
      timestamp: Date.now(),
      ...message
    };

    this.socket.send(JSON.stringify(fullMessage));
  }

  /**
   * Wait for specific message type
   */
  async waitForMessage(
    type: string, 
    timeout = 5000,
    filter?: (message: MockWebSocketMessage) => boolean
  ): Promise<MockWebSocketMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      const handler = (message: MockWebSocketMessage) => {
        if (message.type === type && (!filter || filter(message))) {
          clearTimeout(timeoutId);
          this.messageHandlers.delete('waitForMessage');
          resolve(message);
        }
      };

      this.messageHandlers.set('waitForMessage', handler);

      // Check existing messages first
      const existingMessage = this.messages.find(msg => 
        msg.type === type && (!filter || filter(msg))
      );
      if (existingMessage) {
        clearTimeout(timeoutId);
        this.messageHandlers.delete('waitForMessage');
        resolve(existingMessage);
      }
    });
  }

  /**
   * Get all received messages
   */
  getMessages(): MockWebSocketMessage[] {
    return [...this.messages];
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Register message handler
   */
  onMessage(handler: (message: MockWebSocketMessage) => void): void {
    const handlerId = `handler_${Date.now()}_${Math.random()}`;
    this.messageHandlers.set(handlerId, handler);
  }
}

export class WebSocketTestOrchestrator {
  private clients: Map<string, WebSocketTestClient> = new Map();
  private server: MockWebSocketServer;
  private config: WebSocketTestConfig;

  constructor(config: Partial<WebSocketTestConfig> = {}) {
    this.config = {
      serverPort: 8081,
      frontendPort: 3000,
      timeout: 10000,
      maxRetries: 3,
      heartbeatInterval: 5000,
      ...config
    };

    this.server = new MockWebSocketServer(this.config.serverPort);
  }

  /**
   * Start test environment
   */
  async setup(): Promise<void> {
    await this.server.start();
    console.log('🚀 WebSocket test environment ready');
  }

  /**
   * Cleanup test environment
   */
  async teardown(): Promise<void> {
    // Disconnect all clients
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.disconnect().catch(err => console.error('Error disconnecting client:', err))
    );
    await Promise.all(disconnectPromises);

    this.clients.clear();
    await this.server.stop();
    console.log('🧹 WebSocket test environment cleaned up');
  }

  /**
   * Create test client
   */
  createClient(userId: string, feedbackId: number): WebSocketTestClient {
    const client = new WebSocketTestClient(
      `ws://localhost:${this.config.serverPort}`,
      feedbackId,
      userId
    );
    this.clients.set(userId, client);
    return client;
  }

  /**
   * Get test client
   */
  getClient(userId: string): WebSocketTestClient | undefined {
    return this.clients.get(userId);
  }

  /**
   * Execute multi-user test scenario
   */
  async executeMultiUserScenario(scenario: MultiUserTestScenario): Promise<void> {
    console.log('🎭 Executing multi-user test scenario...');

    // Create all required clients
    for (const user of scenario.users) {
      this.createClient(user.id, 1); // Default feedback ID
    }

    // Execute user actions in parallel
    const userActionPromises = scenario.users.map(async (user) => {
      const client = this.getClient(user.id)!;
      
      for (const action of user.actions) {
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        switch (action.type) {
          case 'connect':
            await client.connect();
            break;
          case 'send_message':
            await client.sendMessage({
              type: 'chat_message',
              message: action.message || `Message from ${user.name}`,
              feedbackId: action.feedbackId || 1
            });
            break;
          case 'disconnect':
            await client.disconnect();
            break;
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, action.delay || 1000));
            break;
        }
      }
    });

    await Promise.all(userActionPromises);

    // Verify expected outcomes
    for (const outcome of scenario.expectedOutcomes) {
      const client = this.getClient(outcome.userId);
      if (!client) continue;

      const messages = client.getMessages();
      
      for (const expectedMessage of outcome.shouldReceive) {
        const found = messages.some(msg => 
          msg.message?.includes(expectedMessage) || 
          msg.type.includes(expectedMessage)
        );
        if (!found) {
          throw new Error(`User ${outcome.userId} should have received message containing: ${expectedMessage}`);
        }
      }

      if (outcome.shouldNotReceive) {
        for (const forbiddenMessage of outcome.shouldNotReceive) {
          const found = messages.some(msg => 
            msg.message?.includes(forbiddenMessage) || 
            msg.type.includes(forbiddenMessage)
          );
          if (found) {
            throw new Error(`User ${outcome.userId} should NOT have received message containing: ${forbiddenMessage}`);
          }
        }
      }
    }

    console.log('✅ Multi-user scenario completed successfully');
  }

  /**
   * Test connection stability
   */
  async testConnectionStability(
    userId: string, 
    feedbackId: number, 
    duration: number = 30000
  ): Promise<{ 
    successful: boolean;
    reconnects: number;
    totalMessages: number;
    errors: string[];
  }> {
    const client = this.createClient(userId, feedbackId);
    const errors: string[] = [];
    let reconnects = 0;
    let totalMessages = 0;

    const startTime = Date.now();
    
    try {
      await client.connect();
      
      // Send periodic messages
      const messageInterval = setInterval(async () => {
        if (client.isConnected()) {
          try {
            await client.sendMessage({
              type: 'connection_test',
              message: `Stability test message ${totalMessages + 1}`
            });
            totalMessages++;
          } catch (error) {
            errors.push(`Message send error: ${error}`);
          }
        }
      }, 1000);

      // Monitor connection
      const monitorInterval = setInterval(() => {
        if (!client.isConnected() && Date.now() - startTime < duration) {
          reconnects++;
          client.connect().catch(err => {
            errors.push(`Reconnection error: ${err}`);
          });
        }
      }, 500);

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration));

      clearInterval(messageInterval);
      clearInterval(monitorInterval);

      return {
        successful: errors.length === 0,
        reconnects,
        totalMessages,
        errors
      };
    } catch (error) {
      errors.push(`Connection stability test error: ${error}`);
      return {
        successful: false,
        reconnects,
        totalMessages,
        errors
      };
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Simulate network conditions
   */
  simulateNetworkConditions(latency: number, packetLoss: number, connectionFailure = 0): void {
    this.server.setNetworkConditions(latency, packetLoss, connectionFailure);
  }

  /**
   * Get server statistics
   */
  getServerStats(): {
    activeConnections: number;
    roomSessions: Record<number, number>;
  } {
    const activeConnections = this.server.getActiveSessionsCount();
    const roomSessions: Record<number, number> = {};

    // Get sessions for common feedback IDs
    for (let i = 1; i <= 5; i++) {
      roomSessions[i] = this.server.getRoomSessions(i).length;
    }

    return {
      activeConnections,
      roomSessions
    };
  }
}

/**
 * Playwright WebSocket helpers
 */
export class PlaywrightWebSocketHelpers {
  constructor(private page: Page) {}

  /**
   * Inject WebSocket test client into page
   */
  async injectTestClient(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as any).wsTestClient = {
        connections: new Map(),
        
        connect: (feedbackId: number, userId?: string) => {
          const url = `ws://localhost:8081/ws/chat/${feedbackId}/`;
          const ws = new WebSocket(url);
          const connectionId = userId || `user_${Date.now()}`;
          
          return new Promise((resolve, reject) => {
            ws.onopen = () => {
              (window as any).wsTestClient.connections.set(connectionId, ws);
              resolve(connectionId);
            };
            ws.onerror = reject;
          });
        },
        
        send: (connectionId: string, message: any) => {
          const ws = (window as any).wsTestClient.connections.get(connectionId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        },
        
        disconnect: (connectionId: string) => {
          const ws = (window as any).wsTestClient.connections.get(connectionId);
          if (ws) {
            ws.close();
            (window as any).wsTestClient.connections.delete(connectionId);
          }
        },
        
        getMessages: (connectionId: string) => {
          const ws = (window as any).wsTestClient.connections.get(connectionId);
          return ws ? ws.messages || [] : [];
        }
      };
    });
  }

  /**
   * Wait for WebSocket connection in page
   */
  async waitForWebSocketConnection(timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => (window as any).wsTestClient?.connections?.size > 0,
      { timeout }
    );
  }

  /**
   * Verify real-time message delivery
   */
  async verifyRealTimeMessage(
    senderConnectionId: string,
    receiverConnectionId: string,
    message: string,
    timeout = 5000
  ): Promise<void> {
    // Send message from sender
    await this.page.evaluate(
      ({ connectionId, msg }) => {
        (window as any).wsTestClient.send(connectionId, {
          type: 'chat_message',
          message: msg,
          timestamp: Date.now()
        });
      },
      { connectionId: senderConnectionId, msg: message }
    );

    // Wait for message to be received by receiver
    await expect(async () => {
      const messages = await this.page.evaluate(
        (connectionId) => (window as any).wsTestClient.getMessages(connectionId),
        receiverConnectionId
      );
      
      const messageFound = messages.some((m: any) => 
        m.result?.message === message
      );
      
      expect(messageFound).toBe(true);
    }).toPass({ timeout });
  }
}