/**
 * Playwright WebSocket Integration Tests
 * 
 * Tests WebSocket functionality within the actual browser environment.
 * Covers end-to-end real-time collaboration scenarios with UI interactions.
 */

import { test, expect, Page } from '@playwright/test';
import { PlaywrightWebSocketHelpers, WebSocketTestOrchestrator } from './websocket-test-utils';

let orchestrator: WebSocketTestOrchestrator;
let wsHelpers: PlaywrightWebSocketHelpers;

test.describe('Playwright WebSocket Integration', () => {
  test.beforeAll(async () => {
    orchestrator = new WebSocketTestOrchestrator({
      serverPort: 8085,
      timeout: 15000
    });
    await orchestrator.setup();
  });

  test.afterAll(async () => {
    await orchestrator.teardown();
  });

  test.beforeEach(async ({ page }) => {
    wsHelpers = new PlaywrightWebSocketHelpers(page);
    await wsHelpers.injectTestClient();
    
    // Navigate to feedback page (assuming it exists)
    await page.goto('/');
  });

  test('@integration Real-time Feedback in Browser', async ({ page }) => {
    // Test real WebSocket functionality in browser context
    
    // Inject WebSocket connection code
    await page.evaluate(async () => {
      // Create WebSocket connection from browser
      const ws = new WebSocket('ws://localhost:8085/ws/chat/1/');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          (window as any).testWebSocket = ws;
          resolve('connected');
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    });

    // Verify connection established
    const isConnected = await page.evaluate(() => {
      return (window as any).testWebSocket?.readyState === WebSocket.OPEN;
    });
    expect(isConnected).toBe(true);

    // Send message from browser
    await page.evaluate(() => {
      const ws = (window as any).testWebSocket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_message',
          message: 'Hello from browser',
          feedbackId: 1,
          timestamp: Date.now()
        }));
      }
    });

    // Create server-side client to receive the message
    const serverClient = orchestrator.createClient('server_receiver', 1);
    await serverClient.connect();

    // Wait for message from browser
    const receivedMessage = await serverClient.waitForMessage('chat_message', 5000);
    expect(receivedMessage.message).toBe('Hello from browser');

    // Send response from server
    await serverClient.sendMessage({
      type: 'chat_message',
      message: 'Hello from server',
      feedbackId: 1
    });

    // Verify browser receives server message
    const browserReceivedMessage = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = (window as any).testWebSocket;
        ws.onmessage = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.result?.message === 'Hello from server') {
            resolve(data.result);
          }
        };
      });
    });

    expect(browserReceivedMessage).toBeTruthy();

    // Cleanup
    await serverClient.disconnect();
    await page.evaluate(() => {
      const ws = (window as any).testWebSocket;
      if (ws) ws.close();
    });
  });

  test('@integration Multi-User Video Feedback Session', async ({ page, browser }) => {
    // Simulate multi-user feedback session with multiple browser tabs
    
    // Create additional browser contexts for multi-user simulation
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    // Setup WebSocket helpers for all pages
    const wsHelpers2 = new PlaywrightWebSocketHelpers(page2);
    const wsHelpers3 = new PlaywrightWebSocketHelpers(page3);

    await Promise.all([
      wsHelpers2.injectTestClient(),
      wsHelpers3.injectTestClient(),
      page2.goto('/'),
      page3.goto('/')
    ]);

    // Connect all users to same feedback session
    const feedbackId = 2;
    
    await Promise.all([
      page.evaluate((id) => (window as any).wsTestClient.connect(id, 'user1'), feedbackId),
      page2.evaluate((id) => (window as any).wsTestClient.connect(id, 'user2'), feedbackId),
      page3.evaluate((id) => (window as any).wsTestClient.connect(id, 'user3'), feedbackId)
    ]);

    // Wait for all connections
    await Promise.all([
      wsHelpers.waitForWebSocketConnection(),
      wsHelpers2.waitForWebSocketConnection(),
      wsHelpers3.waitForWebSocketConnection()
    ]);

    // User 1 submits feedback
    await page.evaluate(() => {
      (window as any).wsTestClient.send('user1', {
        type: 'feedback_update',
        message: 'Timeline 0:30 - Great transition effect here!',
        metadata: { timestamp: '0:30', rating: 5 }
      });
    });

    // User 2 responds with typing indicator
    await page2.evaluate(() => {
      (window as any).wsTestClient.send('user2', {
        type: 'typing_indicator',
        metadata: { isTyping: true }
      });
    });

    // Verify real-time updates across all users
    const user1ReceivedTyping = await page.evaluate(() => {
      return new Promise((resolve) => {
        const messages = (window as any).wsTestClient.getMessages('user1') || [];
        const typingMessage = messages.find((m: any) => 
          m.result?.type === 'typing_indicator' && m.result?.metadata?.isTyping
        );
        if (typingMessage) {
          resolve(true);
        } else {
          // Set up listener for new messages
          setTimeout(() => resolve(false), 2000);
        }
      });
    });

    expect(user1ReceivedTyping).toBe(true);

    // User 2 submits their feedback
    await page2.evaluate(() => {
      (window as any).wsTestClient.send('user2', {
        type: 'typing_indicator',
        metadata: { isTyping: false }
      });
      
      (window as any).wsTestClient.send('user2', {
        type: 'feedback_update',
        message: 'I agree! The timing is perfect.',
        metadata: { replyTo: 'user1_feedback', rating: 5 }
      });
    });

    // User 3 adds a different perspective
    await page3.evaluate(() => {
      (window as any).wsTestClient.send('user3', {
        type: 'feedback_update',
        message: 'Timeline 0:35 - Audio could be slightly louder here',
        metadata: { timestamp: '0:35', category: 'audio', priority: 'medium' }
      });
    });

    // Wait for all messages to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify each user received others' messages
    const user1Messages = await page.evaluate(() => 
      (window as any).wsTestClient.getMessages('user1') || []
    );
    
    const user2Messages = await page2.evaluate(() => 
      (window as any).wsTestClient.getMessages('user2') || []
    );

    const user3Messages = await page3.evaluate(() => 
      (window as any).wsTestClient.getMessages('user3') || []
    );

    // User 1 should receive messages from User 2 and User 3
    const user1ReceivedFromUser2 = user1Messages.some((m: any) => 
      m.result?.message?.includes('I agree!')
    );
    const user1ReceivedFromUser3 = user1Messages.some((m: any) => 
      m.result?.message?.includes('Audio could be')
    );

    expect(user1ReceivedFromUser2).toBe(true);
    expect(user1ReceivedFromUser3).toBe(true);

    // Cleanup
    await Promise.all([
      page.evaluate(() => (window as any).wsTestClient.disconnect('user1')),
      page2.evaluate(() => (window as any).wsTestClient.disconnect('user2')),
      page3.evaluate(() => (window as any).wsTestClient.disconnect('user3'))
    ]);

    await context2.close();
    await context3.close();
  });

  test('@integration UI Form Integration with WebSocket', async ({ page }) => {
    // Test WebSocket integration with actual UI forms
    
    // Create a mock feedback form
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="feedback-form">
          <textarea id="feedback-input" placeholder="Enter your feedback..."></textarea>
          <button id="submit-feedback">Submit Feedback</button>
          <div id="typing-indicator" style="display: none;">Someone is typing...</div>
          <div id="feedback-list"></div>
        </div>
        
        <script>
          let ws;
          let isConnected = false;
          
          function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8085/ws/chat/3/');
            
            ws.onopen = () => {
              isConnected = true;
              console.log('WebSocket connected');
            };
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              handleWebSocketMessage(data.result);
            };
            
            ws.onclose = () => {
              isConnected = false;
              console.log('WebSocket disconnected');
            };
          }
          
          function handleWebSocketMessage(message) {
            if (message.type === 'chat_message') {
              addFeedbackToList(message.message, message.username || message.userId);
            } else if (message.type === 'typing_indicator') {
              const indicator = document.getElementById('typing-indicator');
              if (message.metadata?.isTyping) {
                indicator.style.display = 'block';
                indicator.textContent = (message.username || message.userId) + ' is typing...';
              } else {
                indicator.style.display = 'none';
              }
            }
          }
          
          function addFeedbackToList(message, author) {
            const feedbackList = document.getElementById('feedback-list');
            const feedbackItem = document.createElement('div');
            feedbackItem.innerHTML = '<strong>' + author + ':</strong> ' + message;
            feedbackList.appendChild(feedbackItem);
          }
          
          function sendMessage(message) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat_message',
                message: message,
                feedbackId: 3,
                timestamp: Date.now()
              }));
            }
          }
          
          function sendTypingIndicator(isTyping) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'typing_indicator',
                metadata: { isTyping: isTyping },
                feedbackId: 3,
                timestamp: Date.now()
              }));
            }
          }
          
          // Auto-connect
          connectWebSocket();
          
          // Setup form interactions
          document.getElementById('submit-feedback').addEventListener('click', () => {
            const input = document.getElementById('feedback-input');
            const message = input.value.trim();
            if (message) {
              sendMessage(message);
              input.value = '';
              sendTypingIndicator(false);
            }
          });
          
          let typingTimer;
          document.getElementById('feedback-input').addEventListener('input', (e) => {
            const hasText = e.target.value.length > 0;
            sendTypingIndicator(hasText);
            
            // Stop typing indicator after 3 seconds of no input
            clearTimeout(typingTimer);
            if (hasText) {
              typingTimer = setTimeout(() => {
                sendTypingIndicator(false);
              }, 3000);
            }
          });
          
          // Expose functions for testing
          window.testFunctions = {
            isConnected: () => isConnected,
            sendMessage,
            sendTypingIndicator
          };
        </script>
      </body>
      </html>
    `);

    // Wait for WebSocket connection
    await page.waitForFunction(() => window.testFunctions?.isConnected(), { timeout: 5000 });

    // Create server-side client to interact with the UI
    const serverClient = orchestrator.createClient('ui_tester', 3);
    await serverClient.connect();

    // Test typing indicator from UI
    await page.fill('#feedback-input', 'This is a test feedback');
    
    // Server should receive typing indicator
    const typingMessage = await serverClient.waitForMessage('typing_indicator', 3000);
    expect(typingMessage.metadata?.isTyping).toBe(true);

    // Submit feedback from UI
    await page.click('#submit-feedback');

    // Server should receive the feedback message
    const feedbackMessage = await serverClient.waitForMessage('chat_message', 3000);
    expect(feedbackMessage.message).toBe('This is a test feedback');

    // Send response from server
    await serverClient.sendMessage({
      type: 'chat_message',
      message: 'Thanks for the feedback!'
    });

    // Verify UI displays the response
    await expect(page.locator('#feedback-list')).toContainText('Thanks for the feedback!');

    // Test typing indicator from server
    await serverClient.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: true }
    });

    // UI should show typing indicator
    await expect(page.locator('#typing-indicator')).toBeVisible();

    // Stop typing
    await serverClient.sendMessage({
      type: 'typing_indicator',
      metadata: { isTyping: false }
    });

    // UI should hide typing indicator
    await expect(page.locator('#typing-indicator')).toBeHidden();

    await serverClient.disconnect();
  });

  test('@integration Connection Recovery in Browser', async ({ page }) => {
    // Test WebSocket reconnection behavior in browser
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="connection-status">Disconnected</div>
        <button id="reconnect-btn">Reconnect</button>
        <div id="message-log"></div>
        
        <script>
          let ws;
          let reconnectAttempts = 0;
          const maxReconnectAttempts = 5;
          
          function updateStatus(status) {
            document.getElementById('connection-status').textContent = status;
          }
          
          function logMessage(message) {
            const log = document.getElementById('message-log');
            const entry = document.createElement('div');
            entry.textContent = new Date().toLocaleTimeString() + ': ' + message;
            log.appendChild(entry);
          }
          
          function connect() {
            ws = new WebSocket('ws://localhost:8085/ws/chat/4/');
            
            ws.onopen = () => {
              updateStatus('Connected');
              logMessage('WebSocket connected');
              reconnectAttempts = 0;
            };
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              logMessage('Received: ' + JSON.stringify(data.result));
            };
            
            ws.onclose = (event) => {
              updateStatus('Disconnected');
              logMessage('WebSocket disconnected: ' + event.code);
              
              // Auto-reconnect
              if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                logMessage('Reconnect attempt ' + reconnectAttempts);
                setTimeout(connect, 1000);
              }
            };
            
            ws.onerror = (error) => {
              logMessage('WebSocket error: ' + error);
            };
          }
          
          document.getElementById('reconnect-btn').addEventListener('click', () => {
            reconnectAttempts = 0;
            connect();
          });
          
          // Auto-connect on load
          connect();
          
          // Expose for testing
          window.wsTest = {
            forceDisconnect: () => ws?.close(),
            sendMessage: (msg) => {
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'chat_message',
                  message: msg,
                  feedbackId: 4,
                  timestamp: Date.now()
                }));
              }
            },
            getStatus: () => document.getElementById('connection-status').textContent
          };
        </script>
      </body>
      </html>
    `);

    // Wait for initial connection
    await page.waitForFunction(() => window.wsTest?.getStatus() === 'Connected', { timeout: 5000 });

    // Create server client
    const serverClient = orchestrator.createClient('connection_tester', 4);
    await serverClient.connect();

    // Test message sending while connected
    await page.evaluate(() => window.wsTest.sendMessage('Test message before disconnect'));
    
    const initialMessage = await serverClient.waitForMessage('chat_message', 3000);
    expect(initialMessage.message).toBe('Test message before disconnect');

    // Force disconnect from browser
    await page.evaluate(() => window.wsTest.forceDisconnect());

    // Wait for disconnect to be detected
    await page.waitForFunction(() => window.wsTest?.getStatus() === 'Disconnected', { timeout: 3000 });

    // Browser should attempt to reconnect automatically
    await page.waitForFunction(() => window.wsTest?.getStatus() === 'Connected', { timeout: 10000 });

    // Test that connection works after reconnection
    await page.evaluate(() => window.wsTest.sendMessage('Test message after reconnect'));

    // Note: After reconnection, server client needs to be recreated as it's in a different session
    // For this test, we'll verify the message is logged in the browser
    await expect(page.locator('#message-log')).toContainText('Test message after reconnect');

    await serverClient.disconnect();
  });

  test('@integration Performance in Browser Environment', async ({ page }) => {
    // Test WebSocket performance characteristics in real browser
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="performance-results"></div>
        
        <script>
          async function performanceTest() {
            const results = {
              connectionTime: 0,
              messageRoundTripTimes: [],
              messagesPerSecond: 0,
              errors: []
            };
            
            // Test connection time
            const connectionStart = performance.now();
            const ws = new WebSocket('ws://localhost:8085/ws/chat/5/');
            
            await new Promise((resolve, reject) => {
              ws.onopen = () => {
                results.connectionTime = performance.now() - connectionStart;
                resolve(null);
              };
              ws.onerror = reject;
              setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            // Test message round-trip times
            const messageTests = 20;
            const messageTimes = [];
            
            for (let i = 0; i < messageTests; i++) {
              const messageStart = performance.now();
              const messageId = 'test_' + i + '_' + Date.now();
              
              const roundTripPromise = new Promise((resolve) => {
                const onMessage = (event) => {
                  const data = JSON.parse(event.data);
                  if (data.result?.metadata?.testId === messageId) {
                    ws.removeEventListener('message', onMessage);
                    resolve(performance.now() - messageStart);
                  }
                };
                ws.addEventListener('message', onMessage);
              });
              
              ws.send(JSON.stringify({
                type: 'chat_message',
                message: 'Performance test message ' + i,
                metadata: { testId: messageId },
                feedbackId: 5,
                timestamp: Date.now()
              }));
              
              try {
                const roundTripTime = await Promise.race([
                  roundTripPromise,
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Message timeout')), 3000))
                ]);
                messageTimes.push(roundTripTime);
              } catch (error) {
                results.errors.push('Message ' + i + ': ' + error.message);
              }
              
              // Small delay between messages
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            results.messageRoundTripTimes = messageTimes;
            
            // Test messages per second
            const burstStart = performance.now();
            const burstCount = 50;
            const burstPromises = [];
            
            for (let i = 0; i < burstCount; i++) {
              burstPromises.push(new Promise((resolve) => {
                ws.send(JSON.stringify({
                  type: 'chat_message',
                  message: 'Burst message ' + i,
                  feedbackId: 5,
                  timestamp: Date.now()
                }));
                resolve(null);
              }));
            }
            
            await Promise.all(burstPromises);
            const burstDuration = (performance.now() - burstStart) / 1000;
            results.messagesPerSecond = burstCount / burstDuration;
            
            ws.close();
            return results;
          }
          
          // Run test and expose results
          performanceTest().then(results => {
            window.performanceResults = results;
            
            // Display results
            const resultsDiv = document.getElementById('performance-results');
            resultsDiv.innerHTML = 
              '<h3>Performance Test Results</h3>' +
              '<p>Connection Time: ' + results.connectionTime.toFixed(2) + 'ms</p>' +
              '<p>Avg Round Trip: ' + (results.messageRoundTripTimes.reduce((a,b) => a+b, 0) / results.messageRoundTripTimes.length).toFixed(2) + 'ms</p>' +
              '<p>Messages/Second: ' + results.messagesPerSecond.toFixed(2) + '</p>' +
              '<p>Errors: ' + results.errors.length + '</p>';
          }).catch(error => {
            window.performanceError = error.message;
          });
        </script>
      </body>
      </html>
    `);

    // Create server client to echo messages back
    const echoClient = orchestrator.createClient('echo_server', 5);
    await echoClient.connect();
    
    // Echo back messages with same metadata
    echoClient.onMessage(async (msg) => {
      if (msg.type === 'chat_message' && msg.metadata?.testId) {
        await echoClient.sendMessage({
          type: 'chat_message',
          message: 'Echo: ' + msg.message,
          metadata: { testId: msg.metadata.testId }
        });
      }
    });

    // Wait for performance test to complete
    await page.waitForFunction(() => 
      window.performanceResults || window.performanceError, 
      { timeout: 30000 }
    );

    // Get results
    const results = await page.evaluate(() => window.performanceResults);
    const error = await page.evaluate(() => window.performanceError);

    if (error) {
      throw new Error('Performance test failed: ' + error);
    }

    expect(results).toBeDefined();
    
    // Verify performance metrics
    expect(results.connectionTime).toBeLessThan(2000); // Connection within 2 seconds
    expect(results.messageRoundTripTimes.length).toBeGreaterThan(15); // Most messages successful
    
    const avgRoundTrip = results.messageRoundTripTimes.reduce((a: number, b: number) => a + b, 0) / results.messageRoundTripTimes.length;
    expect(avgRoundTrip).toBeLessThan(500); // Average round trip under 500ms
    
    expect(results.messagesPerSecond).toBeGreaterThan(20); // At least 20 messages/second
    expect(results.errors.length).toBeLessThan(5); // Minimal errors

    console.log('Browser WebSocket Performance Results:', {
      connectionTime: results.connectionTime.toFixed(2) + 'ms',
      avgRoundTrip: avgRoundTrip.toFixed(2) + 'ms',
      messagesPerSecond: results.messagesPerSecond.toFixed(2),
      errorCount: results.errors.length
    });

    await echoClient.disconnect();
  });
});