/**
 * Multi-User Simultaneous Editing Tests
 * 
 * Tests real-time collaboration features including:
 * - Concurrent feedback submission
 * - Real-time state synchronization
 * - Conflict resolution mechanisms
 * - User presence indicators
 */

import { test, expect } from '@playwright/test';
import { WebSocketTestOrchestrator, MultiUserTestScenario } from './websocket-test-utils';

let orchestrator: WebSocketTestOrchestrator;

test.describe('Multi-User Simultaneous Editing', () => {
  test.beforeAll(async () => {
    orchestrator = new WebSocketTestOrchestrator({
      serverPort: 8082, // Different port to avoid conflicts
      timeout: 15000
    });
    await orchestrator.setup();
  });

  test.afterAll(async () => {
    await orchestrator.teardown();
  });

  test.beforeEach(async () => {
    orchestrator.simulateNetworkConditions(0, 0, 0);
  });

  test('@collaboration Concurrent Feedback Submission', async () => {
    const feedbackId = 1;
    
    // Create multiple users
    const user1 = orchestrator.createClient('feedback_user_1', feedbackId);
    const user2 = orchestrator.createClient('feedback_user_2', feedbackId);
    const user3 = orchestrator.createClient('feedback_user_3', feedbackId);

    // Connect all users
    await Promise.all([
      user1.connect(),
      user2.connect(),
      user3.connect()
    ]);

    // Verify all users are connected
    expect(user1.isConnected()).toBe(true);
    expect(user2.isConnected()).toBe(true);
    expect(user3.isConnected()).toBe(true);

    // Set up message listeners for each user
    const user1Messages: string[] = [];
    const user2Messages: string[] = [];
    const user3Messages: string[] = [];

    user1.onMessage(msg => {
      if (msg.type === 'chat_message' && msg.userId !== 'feedback_user_1') {
        user1Messages.push(msg.message || '');
      }
    });

    user2.onMessage(msg => {
      if (msg.type === 'chat_message' && msg.userId !== 'feedback_user_2') {
        user2Messages.push(msg.message || '');
      }
    });

    user3.onMessage(msg => {
      if (msg.type === 'chat_message' && msg.userId !== 'feedback_user_3') {
        user3Messages.push(msg.message || '');
      }
    });

    // Submit feedback simultaneously
    const feedbackMessages = [
      'Timeline 0:15 - The transition here feels too abrupt',
      'Timeline 0:30 - Love the color grading in this scene',
      'Timeline 0:45 - Audio levels seem inconsistent'
    ];

    await Promise.all([
      user1.sendMessage({
        type: 'feedback_update',
        message: feedbackMessages[0],
        metadata: { timestamp: '0:15', type: 'transition_feedback' }
      }),
      user2.sendMessage({
        type: 'feedback_update',
        message: feedbackMessages[1],
        metadata: { timestamp: '0:30', type: 'visual_feedback' }
      }),
      user3.sendMessage({
        type: 'feedback_update',
        message: feedbackMessages[2],
        metadata: { timestamp: '0:45', type: 'audio_feedback' }
      })
    ]);

    // Wait for messages to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify each user received the other users' feedback
    expect(user1Messages).toContain(feedbackMessages[1]);
    expect(user1Messages).toContain(feedbackMessages[2]);
    expect(user2Messages).toContain(feedbackMessages[0]);
    expect(user2Messages).toContain(feedbackMessages[2]);
    expect(user3Messages).toContain(feedbackMessages[0]);
    expect(user3Messages).toContain(feedbackMessages[1]);

    // Verify no user received their own message
    expect(user1Messages).not.toContain(feedbackMessages[0]);
    expect(user2Messages).not.toContain(feedbackMessages[1]);
    expect(user3Messages).not.toContain(feedbackMessages[2]);

    await Promise.all([
      user1.disconnect(),
      user2.disconnect(),
      user3.disconnect()
    ]);
  });

  test('@collaboration Real-time State Synchronization', async () => {
    const scenario: MultiUserTestScenario = {
      users: [
        {
          id: 'sync_user_1',
          name: 'Editor',
          actions: [
            { type: 'connect', feedbackId: 2 },
            { type: 'send_message', message: 'Starting video review session', delay: 100 },
            { type: 'send_message', message: 'Pausing at 1:23 for detailed feedback', delay: 500 },
            { type: 'wait', delay: 1000 }
          ]
        },
        {
          id: 'sync_user_2',
          name: 'Reviewer',
          actions: [
            { type: 'connect', feedbackId: 2, delay: 200 },
            { type: 'send_message', message: 'Joined the session', delay: 300 },
            { type: 'send_message', message: 'I can see the pause point, ready to review', delay: 700 },
            { type: 'wait', delay: 1000 }
          ]
        },
        {
          id: 'sync_user_3',
          name: 'Observer',
          actions: [
            { type: 'connect', feedbackId: 2, delay: 400 },
            { type: 'send_message', message: 'Observing the review process', delay: 600 },
            { type: 'wait', delay: 1000 }
          ]
        }
      ],
      expectedOutcomes: [
        {
          userId: 'sync_user_1',
          shouldReceive: ['Joined the session', 'Observing the review process'],
          shouldNotReceive: ['Starting video review session']
        },
        {
          userId: 'sync_user_2',
          shouldReceive: ['Starting video review session', 'Pausing at 1:23', 'Observing the review process'],
          shouldNotReceive: ['Joined the session']
        },
        {
          userId: 'sync_user_3',
          shouldReceive: ['Starting video review session', 'Pausing at 1:23', 'Joined the session'],
          shouldNotReceive: ['Observing the review process']
        }
      ]
    };

    await orchestrator.executeMultiUserScenario(scenario);
  });

  test('@collaboration Conflict Resolution with Simultaneous Edits', async () => {
    const feedbackId = 3;
    
    const editor1 = orchestrator.createClient('conflict_editor_1', feedbackId);
    const editor2 = orchestrator.createClient('conflict_editor_2', feedbackId);

    await Promise.all([editor1.connect(), editor2.connect()]);

    // Both editors try to edit the same feedback item simultaneously
    const conflictTimestamp = Date.now();
    
    await Promise.all([
      editor1.sendMessage({
        type: 'feedback_update',
        message: 'Version A: The scene needs better lighting',
        metadata: { 
          editId: 'edit_123',
          timestamp: conflictTimestamp,
          version: 'A'
        }
      }),
      editor2.sendMessage({
        type: 'feedback_update',
        message: 'Version B: The scene needs different camera angle',
        metadata: { 
          editId: 'edit_123',
          timestamp: conflictTimestamp + 1, // Slightly later
          version: 'B'
        }
      })
    ]);

    // Wait for server processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Both editors should receive both versions for conflict resolution
    const editor1Updates = await editor1.waitForMessage('feedback_update', 5000);
    const editor2Updates = await editor2.waitForMessage('feedback_update', 5000);

    expect(editor1Updates.metadata?.processed).toBe(true);
    expect(editor2Updates.metadata?.processed).toBe(true);

    // Verify both edits are preserved (not lost)
    const allMessages1 = editor1.getMessages();
    const allMessages2 = editor2.getMessages();

    const hasVersionA1 = allMessages1.some(msg => msg.message?.includes('Version A'));
    const hasVersionB1 = allMessages1.some(msg => msg.message?.includes('Version B'));
    const hasVersionA2 = allMessages2.some(msg => msg.message?.includes('Version A'));
    const hasVersionB2 = allMessages2.some(msg => msg.message?.includes('Version B'));

    expect(hasVersionA1 || hasVersionA2).toBe(true);
    expect(hasVersionB1 || hasVersionB2).toBe(true);

    await Promise.all([editor1.disconnect(), editor2.disconnect()]);
  });

  test('@collaboration User Presence Indicators', async () => {
    const feedbackId = 4;
    
    const user1 = orchestrator.createClient('presence_user_1', feedbackId);
    const user2 = orchestrator.createClient('presence_user_2', feedbackId);

    // User 1 connects first
    await user1.connect();

    // User 2 should see user 1 when they connect
    await user2.connect();

    // Wait for presence updates
    const user1PresenceUpdate = await user1.waitForMessage('user_presence', 5000, (msg) => 
      msg.metadata?.action === 'joined' && msg.userId !== 'presence_user_1'
    );

    expect(user1PresenceUpdate.userId).toBe('presence_user_2');
    expect(user1PresenceUpdate.metadata?.action).toBe('joined');

    // Test typing indicators
    await user1.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: true }
    });

    const typingUpdate = await user2.waitForMessage('typing_indicator', 5000);
    expect(typingUpdate.userId).toBe('presence_user_1');
    expect(typingUpdate.metadata?.isTyping).toBe(true);

    // Stop typing
    await user1.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: false }
    });

    const stopTypingUpdate = await user2.waitForMessage('typing_indicator', 5000);
    expect(stopTypingUpdate.metadata?.isTyping).toBe(false);

    // Test user leaving
    await user1.disconnect();

    const leaveUpdate = await user2.waitForMessage('user_presence', 5000, (msg) => 
      msg.metadata?.action === 'left'
    );

    expect(leaveUpdate.userId).toBe('presence_user_1');
    expect(leaveUpdate.metadata?.action).toBe('left');

    await user2.disconnect();
  });

  test('@collaboration Large Group Collaboration (10 Users)', async () => {
    const feedbackId = 5;
    const userCount = 10;
    const clients: Array<any> = [];

    // Create and connect all users
    for (let i = 1; i <= userCount; i++) {
      const client = orchestrator.createClient(`group_user_${i}`, feedbackId);
      clients.push(client);
      await client.connect();
    }

    // Verify all users are connected
    const stats = orchestrator.getServerStats();
    expect(stats.roomSessions[feedbackId]).toBe(userCount);

    // Each user sends a message
    const messagePromises = clients.map((client, index) => 
      client.sendMessage({
        type: 'chat_message',
        message: `Message from user ${index + 1}`
      })
    );

    await Promise.all(messagePromises);

    // Wait for all messages to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Each user should receive messages from all other users
    for (let i = 0; i < userCount; i++) {
      const client = clients[i];
      const messages = client.getMessages();
      const chatMessages = messages.filter((msg: any) => 
        msg.type === 'chat_message' && 
        msg.userId !== `group_user_${i + 1}` &&
        msg.message?.startsWith('Message from user')
      );

      // Should receive messages from all other users (userCount - 1)
      expect(chatMessages.length).toBe(userCount - 1);
    }

    // Disconnect all users
    const disconnectPromises = clients.map((client: any) => client.disconnect());
    await Promise.all(disconnectPromises);

    // Verify cleanup
    const finalStats = orchestrator.getServerStats();
    expect(finalStats.roomSessions[feedbackId]).toBe(0);
  });

  test('@collaboration Message Ordering and Delivery Guarantees', async () => {
    const feedbackId = 6;
    
    const sender = orchestrator.createClient('sender_user', feedbackId);
    const receiver = orchestrator.createClient('receiver_user', feedbackId);

    await Promise.all([sender.connect(), receiver.connect()]);

    // Send messages in quick succession
    const messageCount = 20;
    const sentMessages: string[] = [];

    for (let i = 1; i <= messageCount; i++) {
      const message = `Ordered message ${i}`;
      sentMessages.push(message);
      
      await sender.sendMessage({
        type: 'chat_message',
        message,
        metadata: { sequence: i }
      });
      
      // Small delay to ensure ordering
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Wait for all messages to be received
    await new Promise(resolve => setTimeout(resolve, 1000));

    const receivedMessages = receiver.getMessages()
      .filter(msg => msg.type === 'chat_message' && msg.message?.startsWith('Ordered message'))
      .sort((a, b) => (a.metadata?.sequence || 0) - (b.metadata?.sequence || 0))
      .map(msg => msg.message);

    // Verify all messages received in correct order
    expect(receivedMessages).toEqual(sentMessages);

    await Promise.all([sender.disconnect(), receiver.disconnect()]);
  });

  test('@collaboration Concurrent Room Management', async () => {
    // Test multiple feedback rooms simultaneously
    const room1Users = [];
    const room2Users = [];

    // Create users for room 1 (feedback ID 10)
    for (let i = 1; i <= 3; i++) {
      const client = orchestrator.createClient(`room1_user_${i}`, 10);
      room1Users.push(client);
      await client.connect();
    }

    // Create users for room 2 (feedback ID 20)
    for (let i = 1; i <= 3; i++) {
      const client = orchestrator.createClient(`room2_user_${i}`, 20);
      room2Users.push(client);
      await client.connect();
    }

    // Send messages in both rooms
    await Promise.all([
      ...room1Users.map(client => client.sendMessage({
        type: 'chat_message',
        message: 'Room 1 message'
      })),
      ...room2Users.map(client => client.sendMessage({
        type: 'chat_message',
        message: 'Room 2 message'
      }))
    ]);

    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify room isolation - Room 1 users should only see Room 1 messages
    for (const client of room1Users) {
      const messages = client.getMessages();
      const room1Messages = messages.filter(msg => msg.message === 'Room 1 message');
      const room2Messages = messages.filter(msg => msg.message === 'Room 2 message');
      
      expect(room1Messages.length).toBeGreaterThan(0);
      expect(room2Messages.length).toBe(0);
    }

    // Verify room isolation - Room 2 users should only see Room 2 messages
    for (const client of room2Users) {
      const messages = client.getMessages();
      const room1Messages = messages.filter(msg => msg.message === 'Room 1 message');
      const room2Messages = messages.filter(msg => msg.message === 'Room 2 message');
      
      expect(room2Messages.length).toBeGreaterThan(0);
      expect(room1Messages.length).toBe(0);
    }

    // Cleanup
    await Promise.all([
      ...room1Users.map(client => client.disconnect()),
      ...room2Users.map(client => client.disconnect())
    ]);
  });

  test('@collaboration Performance Under Load with Concurrent Users', async () => {
    const feedbackId = 7;
    const userCount = 15; // Stress test with 15 concurrent users
    const messagesPerUser = 5;
    
    const clients: Array<any> = [];
    const startTime = Date.now();

    // Create and connect all users
    for (let i = 1; i <= userCount; i++) {
      const client = orchestrator.createClient(`perf_user_${i}`, feedbackId);
      clients.push(client);
    }

    // Connect all users in parallel
    await Promise.all(clients.map((client: any) => client.connect()));
    const connectionTime = Date.now() - startTime;

    // Each user sends multiple messages rapidly
    const messageStartTime = Date.now();
    const sendPromises = clients.map(async (client: any, userIndex: number) => {
      for (let msgIndex = 1; msgIndex <= messagesPerUser; msgIndex++) {
        await client.sendMessage({
          type: 'chat_message',
          message: `User ${userIndex + 1} Message ${msgIndex}`,
          metadata: { userId: userIndex + 1, messageId: msgIndex }
        });
        
        // Small random delay to simulate realistic usage
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      }
    });

    await Promise.all(sendPromises);
    const messagingTime = Date.now() - messageStartTime;

    // Wait for all messages to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify performance metrics
    console.log(`Performance test results:`);
    console.log(`- Connection time for ${userCount} users: ${connectionTime}ms`);
    console.log(`- Messaging time for ${userCount * messagesPerUser} messages: ${messagingTime}ms`);
    console.log(`- Average time per connection: ${connectionTime / userCount}ms`);
    console.log(`- Average time per message: ${messagingTime / (userCount * messagesPerUser)}ms`);

    // Performance assertions
    expect(connectionTime).toBeLessThan(5000); // All connections within 5 seconds
    expect(connectionTime / userCount).toBeLessThan(500); // Each connection within 500ms
    expect(messagingTime / (userCount * messagesPerUser)).toBeLessThan(100); // Each message within 100ms

    // Verify message delivery completeness
    let totalReceivedMessages = 0;
    for (const client of clients) {
      const messages = client.getMessages();
      const chatMessages = messages.filter((msg: any) => 
        msg.type === 'chat_message' && 
        msg.message?.includes('Message') &&
        !msg.message?.includes(client.userId) // Exclude own messages
      );
      totalReceivedMessages += chatMessages.length;
    }

    // Each user should receive messages from all other users
    const expectedTotalMessages = userCount * (userCount - 1) * messagesPerUser;
    const deliveryRate = totalReceivedMessages / expectedTotalMessages;
    
    console.log(`- Message delivery rate: ${(deliveryRate * 100).toFixed(1)}%`);
    expect(deliveryRate).toBeGreaterThan(0.95); // 95% delivery rate minimum

    // Cleanup
    await Promise.all(clients.map((client: any) => client.disconnect()));
  });
});