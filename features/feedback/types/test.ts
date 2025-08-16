// =============================================================================
// Feedback Test Types - Jest-specific types for testing
// =============================================================================

import type { ChatMessage, FeedbackProject, Feedback } from './index';

// Test-only Mock WebSocket interface (uses jest types)
export interface MockWebSocket {
  readyState: number;
  send: jest.Mock;
  close: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

// Test utilities interface
export interface FeedbackTestUtils {
  createMockProject: (overrides?: Partial<FeedbackProject>) => FeedbackProject;
  createMockFeedback: (overrides?: Partial<Feedback>) => Feedback;
  createMockChatMessage: (overrides?: Partial<ChatMessage>) => ChatMessage;
  createMockWebSocket: () => MockWebSocket;
}

// Mock factory functions for tests
export const createMockWebSocket = (): MockWebSocket => ({
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

export const createMockProject = (overrides: Partial<FeedbackProject> = {}): FeedbackProject => ({
  id: 1,
  title: 'Test Project',
  description: 'Test Description',
  manager: 'test@example.com',
  consumer: 'consumer@example.com',
  owner_email: 'test@example.com',
  owner_nickname: 'Test User',
  member_list: [],
  feedback: [],
  files: '',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  ...overrides,
});

export const createMockFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
  id: 1,
  email: 'test@example.com',
  nickname: 'Test User',
  rating: 'basic',
  section: '00:30',
  text: 'Test feedback',
  contents: 'Test feedback',
  title: 'Test Title',
  secret: false,
  security: false,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  ...overrides,
});

export const createMockChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 1,
  email: 'test@example.com',
  nickname: 'Test User',
  rating: 'basic',
  message: 'Test message',
  timestamp: new Date().toISOString(),
  created: new Date().toISOString(),
  ...overrides,
});