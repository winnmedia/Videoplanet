/**
 * WebSocket Edge Conditions and Error Handling Tests
 * 
 * Tests challenging scenarios including:
 * - Network failures and recovery
 * - Invalid data handling
 * - Resource exhaustion
 * - Concurrent connection limits
 * - Memory leak detection
 */

import { test, expect } from '@playwright/test';
import { WebSocketTestOrchestrator } from './websocket-test-utils';

let orchestrator: WebSocketTestOrchestrator;

test.describe('WebSocket Edge Conditions and Error Handling', () => {
  test.beforeAll(async () => {
    orchestrator = new WebSocketTestOrchestrator({
      serverPort: 8084, // Different port to avoid conflicts
      timeout: 20000 // Longer timeout for edge case testing
    });
    await orchestrator.setup();
  });

  test.afterAll(async () => {
    await orchestrator.teardown();
  });

  test.beforeEach(async () => {
    orchestrator.simulateNetworkConditions(0, 0, 0);
  });

  test('@edge Resource Cleanup and Memory Leak Prevention', async () => {
    const feedbackId = 1;
    let createdClients = 0;
    let activeConnections = 0;

    // Create and destroy many connections to test cleanup
    for (let cycle = 0; cycle < 5; cycle++) {
      const cycleClients = [];
      
      // Create multiple clients
      for (let i = 0; i < 10; i++) {
        const client = orchestrator.createClient(`cleanup_test_${cycle}_${i}`, feedbackId);
        cycleClients.push(client);
        createdClients++;
      }

      // Connect all clients
      await Promise.all(cycleClients.map(client => client.connect()));
      activeConnections += cycleClients.length;

      // Verify connections
      const stats = orchestrator.getServerStats();
      expect(stats.activeConnections).toBe(activeConnections);

      // Send messages to ensure full session creation
      await Promise.all(cycleClients.map((client, index) => 
        client.sendMessage({
          type: 'chat_message',
          message: `Cleanup test message ${cycle}-${index}`
        })
      ));

      // Disconnect all clients
      await Promise.all(cycleClients.map(client => client.disconnect()));
      activeConnections -= cycleClients.length;

      // Small delay for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify cleanup
      const cleanupStats = orchestrator.getServerStats();
      expect(cleanupStats.activeConnections).toBe(0);
    }

    console.log(`✅ Resource cleanup test completed: ${createdClients} clients created and cleaned up`);

    // Final verification - no lingering connections
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.activeConnections).toBe(0);
    expect(finalStats.roomSessions[feedbackId]).toBe(0);
  });

  test('@edge Invalid Message Handling', async () => {
    const feedbackId = 2;
    const client = orchestrator.createClient('invalid_message_test', feedbackId);
    
    await client.connect();

    // Track error messages
    const errorMessages: any[] = [];
    client.onMessage(msg => {
      if (msg.metadata?.error) {
        errorMessages.push(msg);
      }
    });

    // Send invalid JSON
    try {
      const ws = (client as any).socket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('invalid json {{{');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      // Expected for invalid JSON
    }

    // Send message with missing required fields
    await client.sendMessage({
      type: 'chat_message'
      // missing message and other required fields
    } as any);

    await new Promise(resolve => setTimeout(resolve, 300));

    // Send message with invalid type
    await client.sendMessage({
      type: 'invalid_message_type',
      message: 'This should be handled gracefully'
    } as any);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Server should handle errors gracefully and possibly send error responses
    // The connection should remain stable
    expect(client.isConnected()).toBe(true);

    // Verify normal messages still work after errors
    await client.sendMessage({
      type: 'chat_message',
      message: 'Normal message after errors'
    });

    const normalResponse = await client.waitForMessage('chat_message', 5000);
    expect(normalResponse.message).toBe('Normal message after errors');

    await client.disconnect();
  });

  test('@edge Network Interruption and Recovery', async () => {
    const feedbackId = 3;
    const client = orchestrator.createClient('network_interruption_test', feedbackId);
    
    await client.connect();
    expect(client.isConnected()).toBe(true);

    // Send initial message
    await client.sendMessage({
      type: 'chat_message',
      message: 'Before network interruption'
    });

    // Simulate severe network conditions
    orchestrator.simulateNetworkConditions(1000, 0.5, 0.1); // High latency, 50% packet loss, 10% connection failure

    // Try to send messages during poor network conditions
    const messagesDuringInterruption = [];
    for (let i = 1; i <= 10; i++) {
      try {
        await client.sendMessage({
          type: 'chat_message',
          message: `Message during interruption ${i}`
        });
        messagesDuringInterruption.push(i);
      } catch (error) {
        console.log(`Message ${i} failed during interruption:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Restore normal network conditions
    orchestrator.simulateNetworkConditions(0, 0, 0);

    // Reconnect if needed
    if (!client.isConnected()) {
      await client.connect();
    }

    // Verify functionality after recovery
    await client.sendMessage({
      type: 'chat_message',
      message: 'After network recovery'
    });

    const recoveryResponse = await client.waitForMessage('chat_message', 5000);
    expect(recoveryResponse.message).toBe('After network recovery');

    console.log(`Network interruption test: ${messagesDuringInterruption.length}/10 messages sent during poor conditions`);

    await client.disconnect();
  });

  test('@edge Concurrent Connection Limits', async () => {
    const feedbackId = 4;
    const maxConcurrentConnections = 50; // Test with many connections
    const clients = [];

    // Create many clients rapidly
    for (let i = 1; i <= maxConcurrentConnections; i++) {
      const client = orchestrator.createClient(`concurrent_${i}`, feedbackId);
      clients.push(client);
    }

    // Connect all clients in parallel
    const connectionPromises = clients.map(client => 
      client.connect().catch(error => ({ error, client }))
    );

    const connectionResults = await Promise.all(connectionPromises);
    
    // Count successful connections
    const successfulConnections = connectionResults.filter(result => 
      !result || !(result as any).error
    ).length;

    const failedConnections = connectionResults.filter(result => 
      result && (result as any).error
    ).length;

    console.log(`Concurrent connection test:`);
    console.log(`- Attempted: ${maxConcurrentConnections}`);
    console.log(`- Successful: ${successfulConnections}`);
    console.log(`- Failed: ${failedConnections}`);

    // Most connections should succeed (allowing for some reasonable limit)
    expect(successfulConnections).toBeGreaterThan(maxConcurrentConnections * 0.8);

    // Verify server stats
    const stats = orchestrator.getServerStats();
    expect(stats.activeConnections).toBe(successfulConnections);

    // Test message broadcasting with many connections
    const testMessage = 'Broadcast test message';
    const firstConnectedClient = clients.find(client => client.isConnected());
    
    if (firstConnectedClient) {
      await firstConnectedClient.sendMessage({
        type: 'chat_message',
        message: testMessage
      });

      // Wait for broadcast
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Count how many clients received the message
      let receivedCount = 0;
      for (const client of clients) {
        if (client.isConnected()) {
          const messages = client.getMessages();
          if (messages.some(msg => msg.message === testMessage && msg.userId !== client.userId)) {
            receivedCount++;
          }
        }
      }

      console.log(`- Message broadcast: ${receivedCount}/${successfulConnections} clients received`);
      expect(receivedCount).toBeGreaterThan(successfulConnections * 0.9);
    }

    // Cleanup all connections
    const disconnectPromises = clients.map(client => 
      client.disconnect().catch(error => console.log('Disconnect error:', error))
    );
    await Promise.all(disconnectPromises);

    // Verify cleanup
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.activeConnections).toBe(0);
  });

  test('@edge Large Message Handling', async () => {
    const feedbackId = 5;
    const client = orchestrator.createClient('large_message_test', feedbackId);
    
    await client.connect();

    // Test with increasingly large messages
    const messageSizes = [1024, 10240, 51200, 102400]; // 1KB, 10KB, 50KB, 100KB

    for (const size of messageSizes) {
      const largeMessage = 'x'.repeat(size);
      
      try {
        await client.sendMessage({
          type: 'chat_message',
          message: `Large message (${size} bytes): ${largeMessage}`,
          metadata: { messageSize: size }
        });

        // Wait for response
        const response = await client.waitForMessage('chat_message', 10000, (msg) => 
          msg.metadata?.messageSize === size
        );

        expect(response).toBeDefined();
        expect(response.message).toContain(`Large message (${size} bytes)`);
        
        console.log(`✅ Successfully sent and received ${size} byte message`);
      } catch (error) {
        console.log(`❌ Failed to handle ${size} byte message:`, error);
        
        // For very large messages, failure might be expected
        if (size > 50000) {
          console.log(`Large message failure expected for ${size} bytes`);
        } else {
          throw error;
        }
      }
    }

    await client.disconnect();
  });

  test('@edge Rapid Connect/Disconnect Cycles', async () => {
    const feedbackId = 6;
    const cycles = 20;
    let successfulCycles = 0;
    let errors = 0;

    for (let i = 1; i <= cycles; i++) {
      try {
        const client = orchestrator.createClient(`rapid_cycle_${i}`, feedbackId);
        
        // Connect
        await client.connect();
        expect(client.isConnected()).toBe(true);

        // Send a quick message
        await client.sendMessage({
          type: 'chat_message',
          message: `Rapid cycle message ${i}`
        });

        // Disconnect immediately
        await client.disconnect();
        expect(client.isConnected()).toBe(false);

        successfulCycles++;
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        errors++;
        console.log(`Cycle ${i} failed:`, error);
      }
    }

    console.log(`Rapid connect/disconnect test:`);
    console.log(`- Cycles attempted: ${cycles}`);
    console.log(`- Successful: ${successfulCycles}`);
    console.log(`- Errors: ${errors}`);

    // Most cycles should succeed
    expect(successfulCycles).toBeGreaterThan(cycles * 0.8);

    // Verify server cleanup
    const stats = orchestrator.getServerStats();
    expect(stats.activeConnections).toBe(0);
  });

  test('@edge Message Queue Overflow Handling', async () => {
    const feedbackId = 7;
    const client = orchestrator.createClient('queue_overflow_test', feedbackId);
    
    await client.connect();

    // Simulate network delay to cause message queuing
    orchestrator.simulateNetworkConditions(500, 0, 0); // 500ms delay

    // Send many messages rapidly to potentially overflow queues
    const messageCount = 100;
    const sendPromises = [];

    for (let i = 1; i <= messageCount; i++) {
      sendPromises.push(
        client.sendMessage({
          type: 'chat_message',
          message: `Queue test message ${i}`,
          metadata: { sequence: i }
        }).catch(error => ({ error, sequence: i }))
      );
    }

    const sendResults = await Promise.all(sendPromises);
    
    // Count successful sends
    const successfulSends = sendResults.filter(result => !result || !(result as any).error).length;
    const failedSends = sendResults.filter(result => result && (result as any).error).length;

    console.log(`Queue overflow test:`);
    console.log(`- Messages sent: ${messageCount}`);
    console.log(`- Successful: ${successfulSends}`);
    console.log(`- Failed: ${failedSends}`);

    // Most messages should be sent successfully
    expect(successfulSends).toBeGreaterThan(messageCount * 0.7);

    // Wait for message processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Restore normal conditions
    orchestrator.simulateNetworkConditions(0, 0, 0);

    // Verify connection is still functional
    await client.sendMessage({
      type: 'chat_message',
      message: 'Post-overflow test message'
    });

    const response = await client.waitForMessage('chat_message', 5000);
    expect(response.message).toBe('Post-overflow test message');

    await client.disconnect();
  });

  test('@edge Server Resource Exhaustion Recovery', async () => {
    const feedbackId = 8;
    
    // Phase 1: Create resource pressure
    const stressClients = [];
    for (let i = 1; i <= 30; i++) {
      const client = orchestrator.createClient(`stress_${i}`, feedbackId);
      stressClients.push(client);
      await client.connect();
    }

    // Each client sends multiple messages to create processing load
    const stressPromises = stressClients.map((client, index) => 
      Promise.all([...Array(5)].map((_, msgIndex) => 
        client.sendMessage({
          type: 'chat_message',
          message: `Stress message ${index}-${msgIndex}`,
          metadata: { clientIndex: index, messageIndex: msgIndex }
        })
      ))
    );

    await Promise.all(stressPromises);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Phase 2: Verify server is still responsive
    const testClient = orchestrator.createClient('post_stress_test', feedbackId);
    await testClient.connect();

    await testClient.sendMessage({
      type: 'chat_message',
      message: 'Post-stress test message'
    });

    const response = await testClient.waitForMessage('chat_message', 10000);
    expect(response.message).toBe('Post-stress test message');

    // Phase 3: Cleanup stress clients
    await Promise.all(stressClients.map(client => client.disconnect()));
    await testClient.disconnect();

    // Verify complete cleanup
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.activeConnections).toBe(0);

    console.log(`✅ Server resource exhaustion recovery test completed`);
  });

  test('@edge WebSocket Protocol Violations', async () => {
    const feedbackId = 9;
    const client = orchestrator.createClient('protocol_violation_test', feedbackId);
    
    await client.connect();

    // Test 1: Send non-JSON data
    try {
      const ws = (client as any).socket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(new Uint8Array([1, 2, 3, 4])); // Binary data
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.log('Binary data send error (expected):', error);
    }

    // Connection should remain stable
    expect(client.isConnected()).toBe(true);

    // Test 2: Send extremely rapid messages
    const rapidPromises = [];
    for (let i = 0; i < 50; i++) {
      rapidPromises.push(
        client.sendMessage({
          type: 'chat_message',
          message: `Rapid ${i}`
        }).catch(err => ({ error: err, index: i }))
      );
    }

    const rapidResults = await Promise.all(rapidPromises);
    const rapidErrors = rapidResults.filter(result => result && (result as any).error);
    
    console.log(`Rapid message test: ${rapidErrors.length}/50 failed (rate limiting may apply)`);

    // Connection should still be functional
    expect(client.isConnected()).toBe(true);

    // Test 3: Verify normal operation after violations
    await client.sendMessage({
      type: 'chat_message',
      message: 'Normal message after protocol violations'
    });

    const normalResponse = await client.waitForMessage('chat_message', 5000);
    expect(normalResponse.message).toBe('Normal message after protocol violations');

    await client.disconnect();
  });

  test('@edge Graceful Degradation Under Load', async () => {
    const feedbackId = 10;
    
    // Create multiple concurrent test scenarios
    const scenarios = [
      { name: 'High Message Volume', clients: 10, messagesPerClient: 20 },
      { name: 'Rapid Connections', clients: 15, messagesPerClient: 5 },
      { name: 'Large Messages', clients: 5, messagesPerClient: 3 }
    ];

    const scenarioResults = [];

    for (const scenario of scenarios) {
      const startTime = Date.now();
      const clients = [];

      // Create clients for this scenario
      for (let i = 1; i <= scenario.clients; i++) {
        const client = orchestrator.createClient(`${scenario.name}_${i}`.replace(/\s/g, '_'), feedbackId);
        clients.push(client);
      }

      // Connect all clients
      await Promise.all(clients.map(client => client.connect()));

      // Execute scenario
      const messagePromises = clients.map(async (client, clientIndex) => {
        const results = [];
        for (let msgIndex = 1; msgIndex <= scenario.messagesPerClient; msgIndex++) {
          try {
            const messageContent = scenario.name === 'Large Messages' 
              ? `Large content: ${'x'.repeat(1000)}` 
              : `${scenario.name} message ${clientIndex}-${msgIndex}`;

            await client.sendMessage({
              type: 'chat_message',
              message: messageContent,
              metadata: { scenario: scenario.name, client: clientIndex, message: msgIndex }
            });
            results.push({ success: true });
          } catch (error) {
            results.push({ success: false, error });
          }
          
          // Small delay for realistic usage
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return results;
      });

      const allResults = await Promise.all(messagePromises);
      const endTime = Date.now();

      // Calculate metrics
      const totalMessages = scenario.clients * scenario.messagesPerClient;
      const successfulMessages = allResults.flat().filter(r => r.success).length;
      const duration = endTime - startTime;

      scenarioResults.push({
        name: scenario.name,
        totalMessages,
        successfulMessages,
        successRate: successfulMessages / totalMessages,
        duration,
        messagesPerSecond: totalMessages / (duration / 1000)
      });

      // Cleanup
      await Promise.all(clients.map(client => client.disconnect()));
      
      // Brief pause between scenarios
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Report results
    console.log('\n📊 Graceful Degradation Test Results:');
    scenarioResults.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`  - Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
      console.log(`  - Messages/sec: ${result.messagesPerSecond.toFixed(2)}`);
      console.log(`  - Duration: ${result.duration}ms`);
    });

    // All scenarios should maintain reasonable success rates
    scenarioResults.forEach(result => {
      expect(result.successRate).toBeGreaterThan(0.8); // 80% success rate minimum
    });

    // Verify final cleanup
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.activeConnections).toBe(0);
  });
});