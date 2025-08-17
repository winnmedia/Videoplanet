// Public API for sidebar widget
export { default as Sidebar } from './ui/Sidebar';

// Types and models
export type {
  SidebarProps,
  SidebarState,
  Project,
  User,
  NavigationTabType,
  NavigationItem,
  SidebarConfig,
} from './model';

// Constants and configs
export {
  DEFAULT_SIDEBAR_CONFIG,
  NAV_ITEM_IDS,
  SIDEBAR_ROUTES,
} from './model';