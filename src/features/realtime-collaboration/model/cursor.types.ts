/**
 * 협업 커서 타입 정의
 */

// 커서 위치
export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  timestamp: number;
}

// 텍스트 선택 영역
export interface TextSelection {
  start: number;
  end: number;
  elementId: string;
  text?: string;
}

// 사용자 커서 상태
export interface UserCursor {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  position: CursorPosition;
  selection?: TextSelection;
  isActive: boolean;
  isTyping: boolean;
  lastActivity: Date;
}

// 협업 세션
export interface CollaborationSession {
  id: string;
  projectId?: string;
  feedbackId?: string;
  documentId?: string;
  users: UserCursor[];
  createdAt: Date;
  updatedAt: Date;
}

// 커서 이벤트 타입
export enum CursorEventType {
  MOVE = 'cursor.move',
  SELECT = 'cursor.select',
  CLICK = 'cursor.click',
  TYPING_START = 'cursor.typing.start',
  TYPING_STOP = 'cursor.typing.stop',
  USER_JOIN = 'cursor.user.join',
  USER_LEAVE = 'cursor.user.leave',
  USER_IDLE = 'cursor.user.idle',
  USER_ACTIVE = 'cursor.user.active',
}

// 커서 이벤트
export interface CursorEvent {
  type: CursorEventType;
  userId: string;
  data?: any;
  timestamp: number;
}