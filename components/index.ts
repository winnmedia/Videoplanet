// Atomic Design System - VideoPlanet (VRidge)
// 모든 컴포넌트의 중앙 집중식 export

// ====== Atoms (최소 단위 컴포넌트) ======
export * from './atoms';

// ====== Molecules (Atoms 조합) ======
export * from './molecules';

// ====== Organisms (복잡한 UI 컴포넌트) ======
export * from './organisms';

// ====== Templates (페이지 레이아웃) ======
export * from './templates';

// ====== 타입 정의 ======
export type {
  // 기본 타입들
  BaseComponentProps,
  User,
  Project,
  NavigationItem,
  
  // Header 관련
  HeaderProps,
  HeaderItem,
  
  // Sidebar 관련
  SidebarProps,
  SidebarTabName,
  SidebarMenuItem,
  SubmenuProps,
  
  // Layout 관련
  LayoutProps,
  PageLayoutProps,
  AuthLayoutProps,
  
  // 유틸리티 타입들
  Variant,
  Size,
  Position,
  Alignment,
} from '../types/layout';