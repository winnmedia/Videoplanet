export type SkeletonVariant = 
  | 'text' 
  | 'circle' 
  | 'rectangle' 
  | 'card' 
  | 'table' 
  | 'list';

export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface ResponsiveSize {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

export interface LoadingSkeletonProps {
  /** Width of the skeleton */
  width?: string | ResponsiveSize;
  /** Height of the skeleton */
  height?: string | ResponsiveSize;
  /** Variant of the skeleton */
  variant?: SkeletonVariant;
  /** Animation type */
  animation?: SkeletonAnimation;
  /** Number of lines for text variant */
  lines?: number;
  /** Number of rows for table variant */
  rows?: number;
  /** Number of columns for table variant */
  columns?: number;
  /** Number of items for list variant */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom aria-label for accessibility */
  ariaLabel?: string;
  /** Border radius */
  borderRadius?: string;
  /** Background color */
  backgroundColor?: string;
  /** Highlight color for animation */
  highlightColor?: string;
}

export interface SkeletonCardProps extends Omit<LoadingSkeletonProps, 'variant'> {
  showAvatar?: boolean;
  showTitle?: boolean;
  showContent?: boolean;
  showActions?: boolean;
}

export interface SkeletonTableProps extends Omit<LoadingSkeletonProps, 'variant'> {
  showHeader?: boolean;
  headerHeight?: string;
  cellPadding?: string;
}

export interface SkeletonListProps extends Omit<LoadingSkeletonProps, 'variant'> {
  showIcon?: boolean;
  showDescription?: boolean;
  itemSpacing?: string;
}