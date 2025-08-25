/**
 * Button Component Migration Helper
 * 
 * This module provides utilities to help migrate from different Button component versions
 * to the standard Button component (version 3).
 * 
 * @module ButtonMigration
 */

import type { ButtonProps } from './Button';

/**
 * Maps legacy variant names to standard variant names
 */
export const variantMap: Record<string, ButtonProps['variant']> = {
  // Standard variants (no change needed)
  'primary': 'primary',
  'secondary': 'secondary',
  'tertiary': 'tertiary',
  'danger': 'danger',
  'ghost': 'ghost',
  'success': 'success',
  
  // Legacy variants mappings
  'default': 'primary',
  'destructive': 'danger',
  'outline': 'tertiary',
  'link': 'ghost',
  'gradient': 'primary', // Gradient is treated as primary
  'social': 'secondary', // Social buttons map to secondary
};

/**
 * Maps legacy size names to standard size names
 */
export const sizeMap: Record<string, ButtonProps['size']> = {
  // Standard sizes (no change needed)
  'small': 'small',
  'medium': 'medium',
  'large': 'large',
  
  // Legacy size mappings
  'sm': 'small',
  'default': 'medium',
  'lg': 'large',
  'icon': 'medium', // Icon-only size maps to medium
  'full': 'large', // Full size maps to large
};

/**
 * Transforms legacy Button props to standard Button props
 * 
 * @param props - Legacy button properties
 * @returns Transformed properties compatible with standard Button
 * 
 * @example
 * ```tsx
 * // Before (legacy)
 * <Button variant="default" size="sm" />
 * 
 * // After (using migration helper)
 * <Button {...migrateButtonProps({ variant: "default", size: "sm" })} />
 * // Results in: <Button variant="primary" size="small" />
 * ```
 */
export function migrateButtonProps(props: Record<string, any>): ButtonProps {
  const {
    variant,
    size,
    leftIcon,
    rightIcon,
    ariaLabel,
    ariaDescribedBy,
    ariaLive,
    ...rest
  } = props;

  const migratedProps: ButtonProps = {
    ...rest,
  };

  // Map variant
  if (variant) {
    migratedProps.variant = variantMap[variant] || variant;
  }

  // Map size
  if (size) {
    migratedProps.size = sizeMap[size] || size;
  }

  // Handle icon props
  if (leftIcon) {
    // Convert React node to string if it's an icon name
    if (typeof leftIcon === 'string') {
      migratedProps.icon = leftIcon;
      migratedProps.iconPosition = 'left';
    }
  }

  if (rightIcon) {
    // Convert React node to string if it's an icon name
    if (typeof rightIcon === 'string') {
      migratedProps.icon = rightIcon;
      migratedProps.iconPosition = 'right';
    }
  }

  // Map aria props (maintaining compatibility with different naming conventions)
  if (ariaLabel || props['aria-label']) {
    migratedProps['aria-label'] = ariaLabel || props['aria-label'];
  }

  if (ariaDescribedBy || props['aria-describedby']) {
    migratedProps['aria-describedby'] = ariaDescribedBy || props['aria-describedby'];
  }

  if (ariaLive || props['aria-live']) {
    migratedProps['aria-live'] = ariaLive || props['aria-live'];
  }

  // Handle special cases
  if (props.fullWidth === true || size === 'full') {
    migratedProps.fullWidth = true;
  }

  // Ensure ripple is enabled by default (as per version 3 improvements)
  if (migratedProps.ripple === undefined) {
    migratedProps.ripple = true;
  }

  return migratedProps;
}

/**
 * Helper function to check if a component is using legacy Button props
 * 
 * @param props - Button properties to check
 * @returns True if using legacy props that need migration
 */
export function needsMigration(props: Record<string, any>): boolean {
  const legacyVariants = ['default', 'destructive', 'outline', 'link', 'gradient', 'social'];
  const legacySizes = ['sm', 'default', 'lg', 'icon', 'full'];
  
  return (
    legacyVariants.includes(props.variant) ||
    legacySizes.includes(props.size) ||
    props.leftIcon !== undefined ||
    props.rightIcon !== undefined ||
    props.ariaLabel !== undefined ||
    props.ariaDescribedBy !== undefined ||
    props.ariaLive !== undefined
  );
}

/**
 * Console warning helper for development environment
 * 
 * @param componentName - Name of the component using legacy props
 * @param props - Legacy props being used
 */
export function warnLegacyUsage(componentName: string, props: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development' && needsMigration(props)) {
    console.warn(
      `[Button Migration] Component "${componentName}" is using legacy Button props. ` +
      `Consider updating to use the standard Button API. ` +
      `Use migrateButtonProps() helper for automatic migration.`
    );
  }
}

/**
 * Migration guide documentation
 * 
 * ## Quick Migration Guide
 * 
 * ### Import changes:
 * ```tsx
 * // Old imports (all still work but redirect to standard Button)
 * import Button from '@/shared/ui/button/Button'
 * import { Button } from '@/shared/ui/Button'
 * 
 * // Recommended import
 * import { Button } from '@/shared/ui/Button/Button'
 * ```
 * 
 * ### Variant changes:
 * - `default` → `primary`
 * - `destructive` → `danger`
 * - `outline` → `tertiary`
 * - `link` → `ghost`
 * - `gradient` → `primary`
 * - `social` → `secondary`
 * 
 * ### Size changes:
 * - `sm` → `small`
 * - `default` → `medium`
 * - `lg` → `large`
 * - `icon` → `medium` with `iconOnly={true}`
 * - `full` → `large` with `fullWidth={true}`
 * 
 * ### Prop changes:
 * - `leftIcon={<Icon />}` → `icon="icon-name" iconPosition="left"`
 * - `rightIcon={<Icon />}` → `icon="icon-name" iconPosition="right"`
 * - `ariaLabel` → `aria-label`
 * - `ariaDescribedBy` → `aria-describedby`
 * - `ariaLive` → `aria-live`
 * 
 * ### New features in standard Button:
 * - Ripple effect enabled by default
 * - Success variant available
 * - Async onClick support
 * - Built-in tooltip support
 * - Link button support (href prop)
 */
export const MIGRATION_GUIDE = `
See migration.ts for detailed migration guide and helper functions.
Use migrateButtonProps() for automatic prop transformation.
`;