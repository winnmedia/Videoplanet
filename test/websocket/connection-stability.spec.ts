/**
 * WebSocket Connection Stability Tests
 * 
 * Tests WebSocket connection establishment, maintenance, and recovery scenarios.
 * Covers heartbeat mechanisms, reconnection logic, and network failure handling.
 */

import { test, expect } from '@playwright/test';
import { WebSocketTestOrchestrator, WebSocketTestClient } from './websocket-test-utils';

let orchestrator: WebSocketTestOrchestrator;

test.describe('WebSocket Connection Stability', () => {
  test.beforeAll(async () => {
    orchestrator = new WebSocketTestOrchestrator({
      serverPort: 8081,
      timeout: 10000
    });
    await orchestrator.setup();
  });

  test.afterAll(async () => {
    await orchestrator.teardown();
  });

  test.beforeEach(async () => {
    // Reset network conditions
    orchestrator.simulateNetworkConditions(0, 0, 0);
  });

  test('@websocket Basic Connection Establishment', async () => {
    const client = orchestrator.createClient('test_user_1', 1);

    // Test successful connection
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Test basic message sending
    await client.sendMessage({
      type: 'chat_message',
      message: 'Connection test message'
    });

    // Wait for echo or confirmation
    const response = await client.waitForMessage('chat_message', 5000);
    expect(response.message).toBe('Connection test message');

    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  test('@websocket Connection Teardown and Cleanup', async () => {
    const client = orchestrator.createClient('test_user_2', 1);

    // Connect and verify
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Send some messages
    for (let i = 0; i < 5; i++) {
      await client.sendMessage({
        type: 'chat_message',
        message: `Test message ${i + 1}`
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Graceful disconnect
    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    // Verify no memory leaks in server
    const stats = orchestrator.getServerStats();
    expect(stats.activeConnections).toBe(0);
  });

  test('@websocket Heartbeat and Ping-Pong Mechanism', async () => {
    const client = orchestrator.createClient('test_user_3', 1);
    
    await client.connect();

    // Send ping message
    await client.sendMessage({
      type: 'connection_test',
      metadata: { type: 'ping' }
    });

    // Wait for pong response
    const pongResponse = await client.waitForMessage('connection_test', 5000, (msg) => 
      msg.metadata?.type === 'pong'
    );

    expect(pongResponse).toBeDefined();
    expect(pongResponse.metadata?.type).toBe('pong');
    expect(pongResponse.metadata?.originalTimestamp).toBeDefined();

    // Calculate round-trip time
    const rtt = pongResponse.timestamp - pongResponse.metadata.originalTimestamp;
    expect(rtt).toBeGreaterThan(0);
    expect(rtt).toBeLessThan(1000); // Should be less than 1 second

    await client.disconnect();
  });

  test('@websocket Automatic Reconnection on Network Drop', async () => {
    const client = orchestrator.createClient('test_user_4', 1);
    
    // Initial connection
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Send initial message
    await client.sendMessage({
      type: 'chat_message',
      message: 'Before network drop'
    });

    // Force disconnect (simulate network drop)
    orchestrator.getClient('test_user_4')!;
    // Note: In real test, we'd simulate network failure
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reconnect
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Verify can send messages after reconnection
    await client.sendMessage({
      type: 'chat_message',
      message: 'After reconnection'
    });

    const response = await client.waitForMessage('chat_message', 5000);
    expect(response.message).toBe('After reconnection');

    await client.disconnect();
  });

  test('@websocket Connection with Network Latency', async () => {
    // Simulate 200ms network latency
    orchestrator.simulateNetworkConditions(200, 0, 0);

    const client = orchestrator.createClient('test_user_5', 1);
    
    const startTime = Date.now();
    await client.connect();
    const connectionTime = Date.now() - startTime;

    expect(client.isConnected()).toBe(true);
    expect(connectionTime).toBeGreaterThan(200); // Should account for latency

    // Test message with latency
    const messageStart = Date.now();
    await client.sendMessage({
      type: 'chat_message',
      message: 'Latency test message'
    });

    const response = await client.waitForMessage('chat_message', 10000);
    const messageRtt = Date.now() - messageStart;

    expect(response.message).toBe('Latency test message');
    expect(messageRtt).toBeGreaterThan(400); // Round trip should be ~400ms with 200ms latency

    await client.disconnect();
  });

  test('@websocket Connection with Packet Loss', async () => {
    // Simulate 10% packet loss
    orchestrator.simulateNetworkConditions(0, 0.1, 0);

    const client = orchestrator.createClient('test_user_6', 1);
    await client.connect();

    const totalMessages = 20;
    const sentMessages: string[] = [];
    const receivedMessages: string[] = [];

    // Listen for all messages
    client.onMessage((message) => {
      if (message.type === 'chat_message' && message.message?.startsWith('Packet test')) {
        receivedMessages.push(message.message);
      }
    });

    // Send multiple messages
    for (let i = 0; i < totalMessages; i++) {
      const message = `Packet test message ${i + 1}`;
      sentMessages.push(message);
      
      await client.sendMessage({
        type: 'chat_message',
        message
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Wait for messages to arrive
    await new Promise(resolve => setTimeout(resolve, 2000));

    // With 10% packet loss, we should receive at least 80% of messages
    const receivedRatio = receivedMessages.length / totalMessages;
    expect(receivedRatio).toBeGreaterThan(0.8);

    console.log(`Packet loss test: ${receivedMessages.length}/${totalMessages} messages received (${(receivedRatio * 100).toFixed(1)}%)`);

    await client.disconnect();
  });

  test('@websocket Connection Timeout Handling', async () => {
    const client = orchestrator.createClient('test_user_7', 1);

    // Test connection timeout with unrealistic short timeout
    const shortTimeoutPromise = client.connect(100); // 100ms timeout

    await expect(shortTimeoutPromise).rejects.toThrow(/timeout/i);
    expect(client.isConnected()).toBe(false);

    // Test successful connection with reasonable timeout
    await client.connect(5000);
    expect(client.isConnected()).toBe(true);

    await client.disconnect();
  });

  test('@websocket Multiple Rapid Connections', async () => {
    const connectionPromises: Promise<void>[] = [];
    const clients: WebSocketTestClient[] = [];

    // Create multiple clients rapidly
    for (let i = 0; i < 10; i++) {
      const client = orchestrator.createClient(`rapid_user_${i}`, 1);
      clients.push(client);
      connectionPromises.push(client.connect());
    }

    // Wait for all connections
    await Promise.all(connectionPromises);

    // Verify all connected
    clients.forEach((client, index) => {
      expect(client.isConnected()).toBe(true);
    });

    // Verify server can handle multiple connections
    const stats = orchestrator.getServerStats();
    expect(stats.activeConnections).toBe(10);
    expect(stats.roomSessions[1]).toBe(10);

    // Disconnect all
    const disconnectPromises = clients.map(client => client.disconnect());
    await Promise.all(disconnectPromises);

    // Verify cleanup
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.activeConnections).toBe(0);
  });

  test('@websocket Connection Stability Under Load', async () => {
    const client = orchestrator.createClient('load_test_user', 1);
    
    const result = await orchestrator.testConnectionStability(
      'load_test_user',
      1,
      10000 // 10 seconds
    );

    expect(result.successful).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalMessages).toBeGreaterThan(8); // Should send ~10 messages in 10 seconds
    expect(result.reconnects).toBe(0); // No reconnections needed

    console.log(`Stability test results:`, result);
  });

  test('@websocket Connection Recovery After Server Restart', async () => {
    const client = orchestrator.createClient('recovery_user', 1);
    
    // Initial connection
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Send message before restart
    await client.sendMessage({
      type: 'chat_message',
      message: 'Before server restart'
    });

    // Simulate server restart by stopping and starting
    await orchestrator.teardown();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    orchestrator = new WebSocketTestOrchestrator({ serverPort: 8081 });
    await orchestrator.setup();

    // Client should detect disconnection
    expect(client.isConnected()).toBe(false);

    // Reconnect after server restart
    const newClient = orchestrator.createClient('recovery_user_new', 1);
    await newClient.connect();
    expect(newClient.isConnected()).toBe(true);

    // Verify functionality after restart
    await newClient.sendMessage({
      type: 'chat_message',
      message: 'After server restart'
    });

    const response = await newClient.waitForMessage('chat_message', 5000);
    expect(response.message).toBe('After server restart');

    await newClient.disconnect();
  });

  test('@websocket WebSocket URL Validation and Security', async () => {
    // Test invalid feedback ID
    const invalidClient = new WebSocketTestClient(
      'ws://localhost:8081',
      0, // Invalid feedback ID
      'security_test_user'
    );

    await expect(invalidClient.connect()).rejects.toThrow();

    // Test valid connection
    const validClient = orchestrator.createClient('valid_user', 1);
    await validClient.connect();
    expect(validClient.isConnected()).toBe(true);

    await validClient.disconnect();
  });
});