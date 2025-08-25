/**
 * Icon 컴포넌트 통합 진입점
 * Tree-shakeable exports
 */

// Main components
export { Icon, LoadingIcon, SpriteIcon } from './Icon';

// Types
export type {
  IconProps,
  IconSize,
  IconName,
  IconType,
  IconVariant,
} from './Icon';

// Hooks
export {
  useIcon,
  useIconPreloader,
  useIconSearch,
  useIconCategory,
  hasIcon,
  getIconNames,
} from './useIcon';

// Icon map for direct access
export { iconMap } from './iconMap';