/**
 * Real-Time Notification System Tests
 * 
 * Tests live notification features including:
 * - Live updates for new feedback
 * - User presence indicators
 * - Typing indicators for comments
 * - Status change notifications
 * - System-wide announcements
 */

import { test, expect } from '@playwright/test';
import { WebSocketTestOrchestrator } from './websocket-test-utils';

let orchestrator: WebSocketTestOrchestrator;

test.describe('Real-Time Notification System', () => {
  test.beforeAll(async () => {
    orchestrator = new WebSocketTestOrchestrator({
      serverPort: 8083, // Different port to avoid conflicts
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

  test('@notifications Live Updates for New Feedback', async () => {
    const feedbackId = 1;
    
    // Create feedback submitter and multiple subscribers
    const submitter = orchestrator.createClient('feedback_submitter', feedbackId);
    const subscriber1 = orchestrator.createClient('subscriber_1', feedbackId);
    const subscriber2 = orchestrator.createClient('subscriber_2', feedbackId);

    await Promise.all([
      submitter.connect(),
      subscriber1.connect(),
      subscriber2.connect()
    ]);

    // Set up notification listeners
    const subscriber1Notifications: any[] = [];
    const subscriber2Notifications: any[] = [];

    subscriber1.onMessage(msg => {
      if (msg.type === 'feedback_update') {
        subscriber1Notifications.push(msg);
      }
    });

    subscriber2.onMessage(msg => {
      if (msg.type === 'feedback_update') {
        subscriber2Notifications.push(msg);
      }
    });

    // Submit new feedback
    await submitter.sendMessage({
      type: 'feedback_update',
      message: 'New feedback: The opening sequence needs better pacing',
      metadata: {
        feedbackType: 'pacing',
        timestamp: '0:15',
        priority: 'high',
        category: 'editing'
      }
    });

    // Wait for notifications to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify all subscribers received the live update
    expect(subscriber1Notifications).toHaveLength(1);
    expect(subscriber2Notifications).toHaveLength(1);

    const notification1 = subscriber1Notifications[0];
    const notification2 = subscriber2Notifications[0];

    expect(notification1.message).toContain('The opening sequence needs better pacing');
    expect(notification1.metadata?.feedbackType).toBe('pacing');
    expect(notification1.metadata?.priority).toBe('high');

    expect(notification2.message).toContain('The opening sequence needs better pacing');
    expect(notification2.metadata?.category).toBe('editing');

    await Promise.all([
      submitter.disconnect(),
      subscriber1.disconnect(),
      subscriber2.disconnect()
    ]);
  });

  test('@notifications User Presence and Status Updates', async () => {
    const feedbackId = 2;
    
    const user1 = orchestrator.createClient('presence_monitor', feedbackId);
    await user1.connect();

    // Monitor presence updates
    const presenceUpdates: any[] = [];
    user1.onMessage(msg => {
      if (msg.type === 'user_presence') {
        presenceUpdates.push(msg);
      }
    });

    // User 2 joins
    const user2 = orchestrator.createClient('joining_user', feedbackId);
    await user2.connect();

    // Wait for presence notification
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify join notification
    expect(presenceUpdates).toHaveLength(1);
    const joinNotification = presenceUpdates[0];
    expect(joinNotification.userId).toBe('joining_user');
    expect(joinNotification.metadata?.action).toBe('joined');

    // User 3 joins
    const user3 = orchestrator.createClient('another_user', feedbackId);
    await user3.connect();

    await new Promise(resolve => setTimeout(resolve, 300));

    // Should now have 2 presence updates
    expect(presenceUpdates).toHaveLength(2);

    // User 2 leaves
    await user2.disconnect();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify leave notification
    expect(presenceUpdates).toHaveLength(3);
    const leaveNotification = presenceUpdates[2];
    expect(leaveNotification.userId).toBe('joining_user');
    expect(leaveNotification.metadata?.action).toBe('left');

    await Promise.all([user1.disconnect(), user3.disconnect()]);
  });

  test('@notifications Typing Indicators for Comments', async () => {
    const feedbackId = 3;
    
    const typist = orchestrator.createClient('typing_user', feedbackId);
    const observer = orchestrator.createClient('observing_user', feedbackId);

    await Promise.all([typist.connect(), observer.connect()]);

    // Monitor typing indicators
    const typingIndicators: any[] = [];
    observer.onMessage(msg => {
      if (msg.type === 'typing_indicator') {
        typingIndicators.push(msg);
      }
    });

    // Start typing
    await typist.sendMessage({
      type: 'typing_indicator',
      metadata: { 
        isTyping: true,
        commentId: 'comment_123',
        inputField: 'feedback_textarea'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify typing start notification
    expect(typingIndicators).toHaveLength(1);
    expect(typingIndicators[0].userId).toBe('typing_user');
    expect(typingIndicators[0].metadata?.isTyping).toBe(true);
    expect(typingIndicators[0].metadata?.commentId).toBe('comment_123');

    // Continue typing (heartbeat)
    await typist.sendMessage({
      type: 'typing_indicator',
      metadata: { 
        isTyping: true,
        commentId: 'comment_123',
        inputField: 'feedback_textarea'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Stop typing
    await typist.sendMessage({
      type: 'typing_indicator',
      metadata: { 
        isTyping: false,
        commentId: 'comment_123',
        inputField: 'feedback_textarea'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify typing stop notification
    expect(typingIndicators.length).toBeGreaterThanOrEqual(2);
    const stopTypingIndicator = typingIndicators.find(indicator => 
      indicator.metadata?.isTyping === false
    );
    expect(stopTypingIndicator).toBeDefined();

    await Promise.all([typist.disconnect(), observer.disconnect()]);
  });

  test('@notifications Multi-User Typing Indicators', async () => {
    const feedbackId = 4;
    
    const observer = orchestrator.createClient('typing_observer', feedbackId);
    const typist1 = orchestrator.createClient('typist_1', feedbackId);
    const typist2 = orchestrator.createClient('typist_2', feedbackId);
    const typist3 = orchestrator.createClient('typist_3', feedbackId);

    await Promise.all([
      observer.connect(),
      typist1.connect(),
      typist2.connect(),
      typist3.connect()
    ]);

    // Track typing states
    const typingStates = new Map<string, boolean>();
    observer.onMessage(msg => {
      if (msg.type === 'typing_indicator') {
        typingStates.set(msg.userId!, msg.metadata?.isTyping || false);
      }
    });

    // All users start typing at different times
    await typist1.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: true }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await typist2.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: true }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await typist3.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: true }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify all three are typing
    expect(typingStates.get('typist_1')).toBe(true);
    expect(typingStates.get('typist_2')).toBe(true);
    expect(typingStates.get('typist_3')).toBe(true);

    // First user stops typing
    await typist1.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: false }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify state changes
    expect(typingStates.get('typist_1')).toBe(false);
    expect(typingStates.get('typist_2')).toBe(true);
    expect(typingStates.get('typist_3')).toBe(true);

    await Promise.all([
      observer.disconnect(),
      typist1.disconnect(),
      typist2.disconnect(),
      typist3.disconnect()
    ]);
  });

  test('@notifications Status Change Notifications', async () => {
    const feedbackId = 5;
    
    const admin = orchestrator.createClient('project_admin', feedbackId);
    const teamMember1 = orchestrator.createClient('team_member_1', feedbackId);
    const teamMember2 = orchestrator.createClient('team_member_2', feedbackId);

    await Promise.all([
      admin.connect(),
      teamMember1.connect(),
      teamMember2.connect()
    ]);

    // Track status change notifications
    const statusNotifications: any[] = [];
    const messageHandler = (msg: any) => {
      if (msg.type === 'feedback_update' && msg.metadata?.statusChange) {
        statusNotifications.push(msg);
      }
    };

    teamMember1.onMessage(messageHandler);
    teamMember2.onMessage(messageHandler);

    // Admin changes project status
    await admin.sendMessage({
      type: 'feedback_update',
      message: 'Project status changed to: Under Review',
      metadata: {
        statusChange: true,
        oldStatus: 'in_progress',
        newStatus: 'under_review',
        changedBy: 'project_admin',
        timestamp: Date.now()
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Both team members should receive status change notification
    expect(statusNotifications).toHaveLength(2); // One for each team member

    const notification = statusNotifications[0];
    expect(notification.message).toContain('Under Review');
    expect(notification.metadata?.statusChange).toBe(true);
    expect(notification.metadata?.oldStatus).toBe('in_progress');
    expect(notification.metadata?.newStatus).toBe('under_review');

    // Test another status change
    await admin.sendMessage({
      type: 'feedback_update',
      message: 'Project approved and moved to production',
      metadata: {
        statusChange: true,
        oldStatus: 'under_review',
        newStatus: 'approved',
        changedBy: 'project_admin'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    expect(statusNotifications).toHaveLength(4); // Two more notifications

    await Promise.all([
      admin.disconnect(),
      teamMember1.disconnect(),
      teamMember2.disconnect()
    ]);
  });

  test('@notifications Notification Priority and Filtering', async () => {
    const feedbackId = 6;
    
    const sender = orchestrator.createClient('notification_sender', feedbackId);
    const highPriorityReceiver = orchestrator.createClient('high_priority_user', feedbackId);
    const normalReceiver = orchestrator.createClient('normal_user', feedbackId);

    await Promise.all([
      sender.connect(),
      highPriorityReceiver.connect(),
      normalReceiver.connect()
    ]);

    // Track notifications by priority
    const highPriorityNotifications: any[] = [];
    const normalNotifications: any[] = [];

    highPriorityReceiver.onMessage(msg => {
      if (msg.type === 'feedback_update') {
        highPriorityNotifications.push(msg);
      }
    });

    normalReceiver.onMessage(msg => {
      if (msg.type === 'feedback_update') {
        normalNotifications.push(msg);
      }
    });

    // Send notifications with different priorities
    const notifications = [
      {
        type: 'feedback_update',
        message: 'Critical issue found in final cut',
        metadata: { priority: 'critical', urgent: true }
      },
      {
        type: 'feedback_update',
        message: 'Minor color correction suggestion',
        metadata: { priority: 'low', urgent: false }
      },
      {
        type: 'feedback_update',
        message: 'Important deadline reminder',
        metadata: { priority: 'high', urgent: true }
      },
      {
        type: 'feedback_update',
        message: 'Regular progress update',
        metadata: { priority: 'normal', urgent: false }
      }
    ];

    for (const notification of notifications) {
      await sender.sendMessage(notification);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Both receivers should get all notifications
    expect(highPriorityNotifications).toHaveLength(4);
    expect(normalNotifications).toHaveLength(4);

    // Check priority metadata is preserved
    const criticalNotification = highPriorityNotifications.find(n => 
      n.metadata?.priority === 'critical'
    );
    expect(criticalNotification).toBeDefined();
    expect(criticalNotification.metadata?.urgent).toBe(true);

    const lowPriorityNotification = normalNotifications.find(n => 
      n.metadata?.priority === 'low'
    );
    expect(lowPriorityNotification).toBeDefined();
    expect(lowPriorityNotification.metadata?.urgent).toBe(false);

    await Promise.all([
      sender.disconnect(),
      highPriorityReceiver.disconnect(),
      normalReceiver.disconnect()
    ]);
  });

  test('@notifications System-Wide Announcements', async () => {
    const feedbackId = 7;
    
    // Create multiple users across different feedback sessions
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const user = orchestrator.createClient(`system_user_${i}`, feedbackId);
      users.push(user);
      await user.connect();
    }

    // System admin (could be external system)
    const systemAdmin = orchestrator.createClient('system_admin', feedbackId);
    await systemAdmin.connect();

    // Track system announcements
    const systemAnnouncements: any[] = [];
    users.forEach(user => {
      user.onMessage(msg => {
        if (msg.type === 'chat_message' && msg.metadata?.systemAnnouncement) {
          systemAnnouncements.push({ userId: user.userId, message: msg });
        }
      });
    });

    // Send system-wide announcement
    await systemAdmin.sendMessage({
      type: 'chat_message',
      message: 'System maintenance scheduled for tonight at 2 AM UTC',
      metadata: {
        systemAnnouncement: true,
        category: 'maintenance',
        severity: 'info',
        broadcastTo: 'all_users'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // All users should receive the system announcement
    expect(systemAnnouncements).toHaveLength(5);

    systemAnnouncements.forEach(announcement => {
      expect(announcement.message.message).toContain('System maintenance');
      expect(announcement.message.metadata?.systemAnnouncement).toBe(true);
      expect(announcement.message.metadata?.category).toBe('maintenance');
    });

    // Send urgent system announcement
    await systemAdmin.sendMessage({
      type: 'chat_message',
      message: 'URGENT: Security update applied, please refresh your browsers',
      metadata: {
        systemAnnouncement: true,
        category: 'security',
        severity: 'urgent',
        broadcastTo: 'all_users',
        requiresAcknowledgment: true
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Should now have 10 announcements (5 users x 2 announcements)
    expect(systemAnnouncements).toHaveLength(10);

    const urgentAnnouncements = systemAnnouncements.filter(a => 
      a.message.metadata?.severity === 'urgent'
    );
    expect(urgentAnnouncements).toHaveLength(5);

    await Promise.all([
      systemAdmin.disconnect(),
      ...users.map(user => user.disconnect())
    ]);
  });

  test('@notifications Notification Rate Limiting and Throttling', async () => {
    const feedbackId = 8;
    
    const spammer = orchestrator.createClient('notification_spammer', feedbackId);
    const receiver = orchestrator.createClient('rate_limited_receiver', feedbackId);

    await Promise.all([spammer.connect(), receiver.connect()]);

    // Track all received notifications
    const receivedNotifications: any[] = [];
    receiver.onMessage(msg => {
      if (msg.type === 'feedback_update') {
        receivedNotifications.push({
          timestamp: Date.now(),
          message: msg
        });
      }
    });

    // Send rapid-fire notifications
    const startTime = Date.now();
    const rapidNotifications = [];
    
    for (let i = 1; i <= 20; i++) {
      rapidNotifications.push(
        spammer.sendMessage({
          type: 'feedback_update',
          message: `Rapid notification ${i}`,
          metadata: { sequence: i }
        })
      );
    }

    await Promise.all(rapidNotifications);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate notification rate
    const endTime = Date.now();
    const duration = endTime - startTime;
    const notificationRate = receivedNotifications.length / (duration / 1000);

    console.log(`Notification rate test:`);
    console.log(`- Sent: 20 notifications`);
    console.log(`- Received: ${receivedNotifications.length} notifications`);
    console.log(`- Duration: ${duration}ms`);
    console.log(`- Rate: ${notificationRate.toFixed(2)} notifications/second`);

    // Most notifications should be received (allowing for some processing delay)
    expect(receivedNotifications.length).toBeGreaterThan(15);
    expect(receivedNotifications.length).toBeLessThanOrEqual(20);

    // Verify sequence integrity
    const sequences = receivedNotifications.map(n => n.message.metadata?.sequence);
    sequences.sort((a, b) => a - b);
    
    // Should not have gaps in sequence (no lost notifications)
    for (let i = 0; i < sequences.length - 1; i++) {
      expect(sequences[i + 1] - sequences[i]).toBeLessThanOrEqual(1);
    }

    await Promise.all([spammer.disconnect(), receiver.disconnect()]);
  });

  test('@notifications Cross-Room Notification Isolation', async () => {
    // Create users in different feedback rooms
    const room1User = orchestrator.createClient('room1_user', 100);
    const room2User = orchestrator.createClient('room2_user', 200);
    const room3User = orchestrator.createClient('room3_user', 300);

    await Promise.all([
      room1User.connect(),
      room2User.connect(),
      room3User.connect()
    ]);

    // Track notifications per user
    const room1Notifications: any[] = [];
    const room2Notifications: any[] = [];
    const room3Notifications: any[] = [];

    room1User.onMessage(msg => room1Notifications.push(msg));
    room2User.onMessage(msg => room2Notifications.push(msg));
    room3User.onMessage(msg => room3Notifications.push(msg));

    // Each user sends notifications in their room
    await room1User.sendMessage({
      type: 'feedback_update',
      message: 'Room 1 specific notification'
    });

    await room2User.sendMessage({
      type: 'feedback_update',
      message: 'Room 2 specific notification'
    });

    await room3User.sendMessage({
      type: 'feedback_update',
      message: 'Room 3 specific notification'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify notification isolation
    const room1FeedbackUpdates = room1Notifications.filter(n => 
      n.type === 'feedback_update'
    );
    const room2FeedbackUpdates = room2Notifications.filter(n => 
      n.type === 'feedback_update'
    );
    const room3FeedbackUpdates = room3Notifications.filter(n => 
      n.type === 'feedback_update'
    );

    // Each room should only receive their own notifications
    expect(room1FeedbackUpdates).toHaveLength(1);
    expect(room1FeedbackUpdates[0].message).toContain('Room 1 specific');

    expect(room2FeedbackUpdates).toHaveLength(1);
    expect(room2FeedbackUpdates[0].message).toContain('Room 2 specific');

    expect(room3FeedbackUpdates).toHaveLength(1);
    expect(room3FeedbackUpdates[0].message).toContain('Room 3 specific');

    // Verify no cross-contamination
    expect(room1Notifications.some(n => n.message?.includes('Room 2'))).toBe(false);
    expect(room1Notifications.some(n => n.message?.includes('Room 3'))).toBe(false);
    expect(room2Notifications.some(n => n.message?.includes('Room 1'))).toBe(false);
    expect(room2Notifications.some(n => n.message?.includes('Room 3'))).toBe(false);
    expect(room3Notifications.some(n => n.message?.includes('Room 1'))).toBe(false);
    expect(room3Notifications.some(n => n.message?.includes('Room 2'))).toBe(false);

    await Promise.all([
      room1User.disconnect(),
      room2User.disconnect(),
      room3User.disconnect()
    ]);
  });
});