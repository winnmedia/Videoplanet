/**
 * 알림 타입 정의
 */

// 알림 우선순위
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// 알림 카테고리
export enum NotificationCategory {
  FEEDBACK = 'feedback',
  PROJECT = 'project',
  COMMENT = 'comment',
  MENTION = 'mention',
  SYSTEM = 'system',
  COLLABORATION = 'collaboration',
}

// 알림 액션 타입
export enum NotificationActionType {
  VIEW = 'view',
  REPLY = 'reply',
  APPROVE = 'approve',
  REJECT = 'reject',
  DISMISS = 'dismiss',
}

// 알림 액션
export interface NotificationAction {
  type: NotificationActionType;
  label: string;
  url?: string;
  callback?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// 알림 메타데이터
export interface NotificationMetadata {
  projectId?: string;
  feedbackId?: string;
  commentId?: string;
  userId?: string;
  videoTimestamp?: number;
  [key: string]: any;
}

// 기본 알림 인터페이스
export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
  expiresAt?: Date;
  groupId?: string;
  sound?: boolean;
  vibrate?: boolean;
}

// 알림 필터
export interface NotificationFilter {
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// 알림 통계
export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
}

// 알림 설정
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}