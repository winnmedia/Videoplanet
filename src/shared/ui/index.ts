// Export all shared UI components
export { Button } from './Button/Button'
export { Input, inputVariants } from './Input'
export { Checkbox, checkboxVariants } from './Checkbox'
export { 
  LoadingSpinner, 
  LoadingOverlay, 
  PageLoading, 
  SectionLoading, 
  InlineLoading,
  spinnerVariants 
} from './LoadingSpinner'
export { 
  ErrorBoundary, 
  DefaultErrorFallback, 
  withErrorBoundary, 
  useErrorHandler 
} from './ErrorBoundary'
export { GanttChart } from './GanttChart'
export { PageTemplate } from './PageTemplate'

// Export types
export type { ButtonProps } from './Button/Button'
export type { InputProps } from './Input'
export type { CheckboxProps } from './Checkbox'
export type { 
  LoadingSpinnerProps, 
  LoadingOverlayProps 
} from './LoadingSpinner'
export type { 
  ErrorBoundaryProps, 
  ErrorFallbackProps 
} from './ErrorBoundary'
export type {
  GanttChartProps,
  ProjectInfo,
  PhaseProgress,
  ProjectPhase,
  ProgressStatus,
  GanttMode,
  GanttVariant,
  GanttTheme,
  GanttConfig
} from './GanttChart.types'

// PageTemplate types
export type { PageTemplateProps } from './PageTemplate'

// New UI Components - Loading
export { LoadingSkeleton } from './loading-skeleton';
export type { LoadingSkeletonProps, SkeletonVariant, SkeletonAnimation } from './loading-skeleton/types';

// New UI Components - Error handling
export { ErrorBoundary as ErrorBoundaryV2 } from './error-boundary';
export type { ErrorBoundaryProps as ErrorBoundaryV2Props, ErrorFallbackProps as ErrorFallbackV2Props } from './error-boundary/types';

// New UI Components - Empty state
export { EmptyState } from './empty-state';
export type { EmptyStateProps, EmptyStateSize, EmptyStateVariant } from './empty-state/types';

// New UI Components - Form feedback
export { FormFeedback } from './form-feedback';
export type { FormFeedbackProps, FormFeedbackType } from './form-feedback/types';

// New UI Components - Toast notification
export { ToastProvider, useToast, Toast } from './toast-notification';
export type { ToastOptions, ToastPosition, ToastType } from './toast-notification/types';

// Icon Components
export {
  Icon,
  LoadingIcon,
  SpriteIcon,
  useIcon,
  useIconPreloader,
  useIconSearch,
  useIconCategory,
  hasIcon,
  getIconNames,
  iconMap
} from './Icon';
export type {
  IconProps,
  IconSize,
  IconName,
  IconType,
  IconVariant
} from './Icon';

// IconButton Component
export { IconButton } from './IconButton';
export type {
  IconButtonProps,
  IconButtonSize,
  IconButtonVariant,
  RippleEffect
} from './IconButton/types';