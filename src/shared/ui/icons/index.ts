/**
 * 호환성 래퍼 - 기존 import 경로 유지
 * 실제 구현은 /src/shared/ui/Icon으로 이동
 */

// Re-export from new location
export {
  Icon,
  LoadingIcon,
  SpriteIcon,
  type IconProps,
  type IconSize,
  type IconName,
  type IconType,
  type IconVariant,
  useIcon,
  useIconPreloader,
  useIconSearch,
  useIconCategory,
  hasIcon,
  getIconNames,
  iconMap,
} from '../Icon';

// Legacy exports for backward compatibility
import { Icon as IconComponent } from '../Icon';
import type { IconProps as NewIconProps } from '../Icon';

// Type aliases for backward compatibility
export type IconData = {
  viewBox: string;
  paths?: Array<{ d: string; fill?: string; stroke?: string; strokeWidth?: number; }>;
  circles?: Array<{ cx: number; cy: number; r: number; fill?: string; stroke?: string; }>;
  rects?: Array<{ x: number; y: number; width: number; height: number; rx?: number; fill?: string; stroke?: string; }>;
  polygons?: Array<{ points: string; fill?: string; stroke?: string; }>;
};

export type IconMap = Record<string, IconData>;
export type SpriteIconProps = NewIconProps & { spriteUrl?: string; };
export type IconMetadata = {
  type: string;
  name: string;
  category: string;
  keywords: string[];
  description?: string;
};

// Enum exports for backward compatibility
export enum IconType {
  // Navigation
  ARROW_UP = 'arrow-up',
  ARROW_DOWN = 'arrow-down',
  ARROW_LEFT = 'arrow-left',
  ARROW_RIGHT = 'arrow-right',
  CHEVRON_UP = 'chevron-up',
  CHEVRON_DOWN = 'chevron-down',
  CHEVRON_LEFT = 'chevron-left',
  CHEVRON_RIGHT = 'chevron-right',
  MENU = 'menu',
  CLOSE = 'close',
  HOME = 'home',
  BACK = 'back',
  
  // Actions
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  SAVE = 'save',
  COPY = 'copy',
  SEARCH = 'search',
  FILTER = 'filter',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SHARE = 'share',
  
  // Media
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  CAMERA = 'camera',
  VIDEO = 'video',
  
  // Status
  CHECK = 'check',
  CHECK_CIRCLE = 'check-circle',
  ERROR_CIRCLE = 'error-circle',
  WARNING = 'warning',
  INFO = 'info',
  HELP = 'help',
  STAR = 'star',
  HEART = 'heart',
  THUMB_UP = 'thumb-up',
  THUMB_DOWN = 'thumb-down',
  
  // Other
  USER = 'user',
  SETTINGS = 'settings',
  SPINNER = 'spinner',
  LOADING = 'loading',
}

export enum IconCategory {
  NAVIGATION = 'navigation',
  ACTION = 'action',
  MEDIA = 'media',
  STATUS = 'status',
  USER = 'user',
  COMMUNICATION = 'communication',
  FILE = 'file',
  BUSINESS = 'business',
  UI = 'ui',
  PROJECT = 'project',
  MISC = 'misc',
}

// Size and color mappings for backward compatibility
export const IconSizeMap = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

export const IconVariantColorMap = {
  primary: 'var(--color-primary, #1631F8)',
  secondary: 'var(--color-secondary, #6c757d)',
  success: 'var(--color-success, #28a745)',
  warning: 'var(--color-warning, #ffc107)',
  error: 'var(--color-error, #dc3545)',
  info: 'var(--color-info, #17a2b8)',
  neutral: 'currentColor',
};

// Legacy utility functions
export const iconRegistry = {}; // Empty for backward compatibility
export const getIconData = (name: string) => null; // Stub for backward compatibility

// Default export for backward compatibility
export default IconComponent;