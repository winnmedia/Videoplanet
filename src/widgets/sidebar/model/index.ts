export type {
  SidebarState,
  Project,
  User,
  SidebarProps,
  NavigationTabType,
  NavigationItem,
  SidebarConfig,
} from './types';

import type { SidebarConfig, NavigationItem, User } from './types';

// 기본 설정값
export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  collapsed: false,
  showProjects: true,
  autoCollapse: false,
  animation: true,
};

// 네비게이션 아이템 ID 상수
export const NAV_ITEM_IDS = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  FEEDBACK: 'feedback',
  CALENDAR: 'calendar',
  PLANNING: 'planning',
} as const;

// 라우트 경로 상수
export const SIDEBAR_ROUTES = {
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_VIEW: (id: string) => `/projects/${id}/view`,
  PROJECT_CREATE: '/projects/create',
  FEEDBACK: (projectId: string) => `/feedback/${projectId}`,
  CALENDAR: '/calendar',
  PLANNING: '/planning',
  LOGIN: '/login',
  HOME: '/',
} as const;