// ==========================================================================
// Layout Component Types - VideoPlanet (VRidge) 2025
// ==========================================================================

import { ReactNode, MouseEventHandler } from 'react';

// ====== Common Types ======
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  isActive?: boolean;
  badge?: number | string;
  onClick?: MouseEventHandler<HTMLElement>;
}

// ====== User Types ======
export interface User {
  id: string;
  email: string;
  nickname: string;
  name?: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'user';
}

export interface UserProfile {
  nickname: string;
  email: string;
  initials: string;
}

// ====== Project Types (for navigation) ======
export interface Project {
  id: string;
  name: string;
  created: string;
  status: 'active' | 'completed' | 'paused';
  color?: string;
}

// ====== Header Component Types ======
export interface HeaderItem {
  type: 'img' | 'string' | 'component';
  src?: string;
  text?: string;
  className?: string;
  alt?: string;
  component?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
}

export interface HeaderProps extends BaseComponentProps {
  leftItems?: HeaderItem[];
  rightItems?: HeaderItem[];
  isFixed?: boolean;
  showShadow?: boolean;
  onLogoClick?: MouseEventHandler<HTMLElement>;
}

// ====== Sidebar Component Types ======
export type SidebarTabName = 'project' | 'feedback' | 'home' | 'calendar' | 'elearning';

export interface SidebarMenuItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  tabName?: SidebarTabName;
  hasSubmenu?: boolean;
  badge?: number;
  onClick?: MouseEventHandler<HTMLElement>;
}

export interface SidebarProps extends BaseComponentProps {
  tab?: SidebarTabName;
  onMenu?: boolean;
  projects?: Project[];
  user?: User;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onTabChange?: (tab: SidebarTabName) => void;
  collapsed?: boolean;
  showProjects?: boolean;
}

export interface SidebarState {
  isSubmenuOpen: boolean;
  activeTab: SidebarTabName | '';
  sortedProjects: Project[];
}

// ====== Submenu Component Types ======
export interface SubmenuProps extends BaseComponentProps {
  isOpen: boolean;
  tabName: SidebarTabName;
  projects: Project[];
  onClose: () => void;
  onCreateProject?: () => void;
  onProjectClick: (projectId: string, tabName: SidebarTabName) => void;
}

// ====== Layout Component Types ======
export interface LayoutProps extends BaseComponentProps {
  header?: boolean;
  footer?: boolean;
  sidebar?: boolean;
  navigation?: boolean;
  auth?: boolean;
  noLogin?: boolean;
  leftItems?: HeaderItem[];
  rightItems?: HeaderItem[];
  user?: User;
  projects?: Project[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export interface PageLayoutProps extends LayoutProps {
  title?: string;
  description?: string;
  showBreadcrumb?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: ReactNode;
  loading?: boolean;
  error?: string | null;
}

export interface AuthLayoutProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  backgroundImage?: string;
  socialLogin?: boolean;
}

// ====== Breadcrumb Types ======
export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

// ====== Navigation Types ======
export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  isLoading: boolean;
}

export interface NavigationContext {
  currentPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
  isActive: (path: string) => boolean;
}

// ====== Layout Context Types ======
export interface LayoutContextValue {
  user: User | null;
  projects: Project[];
  sidebarCollapsed: boolean;
  currentPath: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateUser: (user: User) => void;
  updateProjects: (projects: Project[]) => void;
  logout: () => void;
}

// ====== Responsive Types ======
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
}

// ====== Theme Types ======
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  borderRadius: 'sm' | 'md' | 'lg';
  animation: boolean;
}

// ====== Accessibility Types ======
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  role?: string;
  tabIndex?: number;
}

// ====== Animation Types ======
export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

// ====== Loading States ======
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  skeleton?: boolean;
}

// ====== Error States ======
export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  retry?: () => void;
}

// ====== Form Types (for authentication) ======
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  agreeToTerms: boolean;
}

// ====== API Response Types ======
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ====== Event Handler Types ======
export type ClickHandler = MouseEventHandler<HTMLElement>;
export type InputChangeHandler = (value: string) => void;
export type FormSubmitHandler = (data: any) => void | Promise<void>;

// ====== Component State Types ======
export interface ComponentState {
  isVisible: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isActive: boolean;
}

// ====== Utility Types ======
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Position = 'top' | 'right' | 'bottom' | 'left';
export type Alignment = 'start' | 'center' | 'end';

// ====== Redux/State Types ======
export interface AppState {
  user: User | null;
  projects: Project[];
  ui: {
    sidebarCollapsed: boolean;
    theme: ThemeConfig;
    notifications: Notification[];
  };
  navigation: NavigationState;
}

export interface Notification {
  id: string;
  type: Variant;
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  variant?: Variant;
}

// ====== Testing Types ======
export interface TestProps {
  testId?: string;
  debug?: boolean;
}

export interface MockData {
  users: User[];
  projects: Project[];
  navigationItems: NavigationItem[];
}

// ====== Default Values ======
export const DEFAULT_USER: User = {
  id: '',
  email: '',
  nickname: '',
  role: 'user',
};

export const DEFAULT_NAVIGATION_ITEMS: SidebarMenuItem[] = [
  { id: 'home', label: '홈', path: '/CmsHome', icon: 'h_l_b.svg', tabName: 'home' },
  { id: 'calendar', label: '전체 일정', path: '/Calendar', icon: 'c_l_b.svg', tabName: 'calendar' },
  { id: 'projects', label: '프로젝트 관리', icon: 'p_l_b.svg', tabName: 'project', hasSubmenu: true },
  { id: 'feedback', label: '영상 피드백', icon: 'f_l_b.svg', tabName: 'feedback', hasSubmenu: true },
  { id: 'elearning', label: '콘텐츠', path: '/Elearning', icon: 'oc_l_b.svg', tabName: 'elearning' },
];

// ====== Type Guards ======
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
};

export const isProject = (obj: any): obj is Project => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isValidTabName = (tab: string): tab is SidebarTabName => {
  return ['project', 'feedback', 'home', 'calendar', 'elearning'].includes(tab);
};

// ====== Constants ======
export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: 80,
  SIDEBAR_WIDTH: 300,
  SUBMENU_WIDTH: 330,
  MOBILE_BREAKPOINT: 768,
  ANIMATION_DURATION: 300,
} as const;

export const ROUTES = {
  HOME: '/CmsHome',
  LOGIN: '/login',
  CALENDAR: '/Calendar',
  PROJECTS: '/projects',
  PROJECT_CREATE: '/projects/create',
  PROJECT_VIEW: (id: string) => `/projects/${id}/view`,
  PROJECT_EDIT: (id: string) => `/projects/${id}/edit`,
  FEEDBACK: (id: string) => `/feedback/${id}`,
  ELEARNING: '/Elearning',
} as const;