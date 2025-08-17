export interface SidebarState {
  isSubmenuOpen: boolean;
  activeTab: string;
  sortedProjects: Project[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface SidebarProps {
  tab?: string;
  onMenu?: boolean;
  projects?: Project[];
  user?: User;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onTabChange?: (tab: string) => void;
  collapsed?: boolean;
  showProjects?: boolean;
  className?: string;
  'data-testid'?: string;
}

export type NavigationTabType = 'dashboard' | 'project' | 'feedback' | 'calendar' | 'planning';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  tabName?: NavigationTabType;
  hasSubmenu?: boolean;
  badge?: number;
}

export interface SidebarConfig {
  collapsed: boolean;
  showProjects: boolean;
  autoCollapse: boolean;
  animation: boolean;
}