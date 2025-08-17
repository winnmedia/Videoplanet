export type {
  FeedbackStatsData,
  FeedbackStatsWidgetProps,
  FeedbackStatus,
  FeedbackStatsConfig,
} from './types';

import type { FeedbackStatsData, FeedbackStatus, FeedbackStatsConfig } from './types';

// 기본 설정값
export const DEFAULT_FEEDBACK_STATS_CONFIG: FeedbackStatsConfig = {
  animationDuration: 1000,
  refreshInterval: 15000, // 15초
  enableAnimation: true,
  showResponseRate: true,
};

// 피드백 상태 정의
export const FEEDBACK_STATUSES: Record<string, FeedbackStatus> = {
  unread: {
    id: 'unread',
    name: '미확인',
    count: 0,
    color: '#ffc107',
    icon: '🔔',
  },
  pending: {
    id: 'pending',
    name: '답변대기',
    count: 0,
    color: '#17a2b8',
    icon: '⏰',
  },
  replied: {
    id: 'replied',
    name: '답변완료',
    count: 0,
    color: '#28a745',
    icon: '✅',
  },
  total: {
    id: 'total',
    name: '전체',
    count: 0,
    color: '#6c757d',
    icon: '💬',
  },
};

// 유틸리티 함수
export const calculateResponseRate = (data: FeedbackStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.replied / data.total) * 100);
};

export const calculatePendingRate = (data: FeedbackStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round(((data.pending + data.unread) / data.total) * 100);
};

export const getUrgentFeedbacks = (data: FeedbackStatsData): number => {
  return data.unread + data.pending;
};