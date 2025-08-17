export type {
  InvitationStatsData,
  InvitationStatsWidgetProps,
  InvitationStatus,
  InvitationStatsConfig,
} from './types';

import type { InvitationStatsData, InvitationStatus, InvitationStatsConfig } from './types';

// 기본 설정값
export const DEFAULT_INVITATION_STATS_CONFIG: InvitationStatsConfig = {
  animationDuration: 1000,
  refreshInterval: 60000, // 1분
  enableAnimation: true,
  showAcceptanceRate: true,
};

// 초대 상태 정의
export const INVITATION_STATUSES: Record<string, InvitationStatus> = {
  pending: {
    id: 'pending',
    name: '대기중',
    count: 0,
    color: '#ffc107',
    icon: '⏳',
  },
  accepted: {
    id: 'accepted',
    name: '수락',
    count: 0,
    color: '#28a745',
    icon: '✅',
  },
  rejected: {
    id: 'rejected',
    name: '거절',
    count: 0,
    color: '#dc3545',
    icon: '❌',
  },
  total: {
    id: 'total',
    name: '전체',
    count: 0,
    color: '#6c757d',
    icon: '👥',
  },
};

// 유틸리티 함수
export const calculateAcceptanceRate = (data: InvitationStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.accepted / data.total) * 100);
};

export const calculateRejectionRate = (data: InvitationStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.rejected / data.total) * 100);
};

export const calculatePendingRate = (data: InvitationStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.pending / data.total) * 100);
};