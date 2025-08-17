// Public API for header widget
export { default as Header } from './ui/Header';
export { createUserProfileItems, createLogoItem } from './ui/Header';

// Types and models
export type {
  HeaderProps,
  HeaderItem,
  User,
  HeaderConfig,
  HeaderTheme,
  HeaderItemConfig,
} from './model';

// Constants and configs
export {
  DEFAULT_HEADER_CONFIG,
  HEADER_THEMES,
  HEADER_BREAKPOINTS,
} from './model';