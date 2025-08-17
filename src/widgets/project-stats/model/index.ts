export type {
  ProjectStatsData,
  ProjectStatsWidgetProps,
  ProjectStatus,
  ProjectStatsConfig,
} from './types';

import type { ProjectStatsData, ProjectStatus, ProjectStatsConfig } from './types';

// 기본 설정값
export const DEFAULT_PROJECT_STATS_CONFIG: ProjectStatsConfig = {
  animationDuration: 1000,
  refreshInterval: 30000, // 30초
  enableAnimation: true,
};

// 프로젝트 상태 정의
export const PROJECT_STATUSES: Record<string, ProjectStatus> = {
  active: {
    id: 'active',
    name: '진행중',
    count: 0,
    color: '#1631F8',
    icon: '▶️',
  },
  completed: {
    id: 'completed',
    name: '완료',
    count: 0,
    color: '#28a745',
    icon: '✅',
  },
  pending: {
    id: 'pending',
    name: '대기중',
    count: 0,
    color: '#ffc107',
    icon: '⏳',
  },
  total: {
    id: 'total',
    name: '전체',
    count: 0,
    color: '#6c757d',
    icon: '📊',
  },
};

// 유틸리티 함수
export const calculateCompletionRate = (data: ProjectStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.completed / data.total) * 100);
};

export const calculateActiveRate = (data: ProjectStatsData): number => {
  if (data.total === 0) return 0;
  return Math.round((data.active / data.total) * 100);
};