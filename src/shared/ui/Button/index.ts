/**
 * Button Component Exports
 * 
 * This is the main entry point for the Button component.
 * All Button-related exports should come from this file.
 */

// Main Button component and types
export { Button, type ButtonProps } from './Button';

// Migration utilities for backward compatibility
export {
  migrateButtonProps,
  needsMigration,
  warnLegacyUsage,
  variantMap,
  sizeMap,
  MIGRATION_GUIDE
} from './migration';

// Default export for convenience
export { Button as default } from './Button';