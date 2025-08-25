import { ReactNode } from 'react';

export type FormFeedbackType = 'success' | 'error' | 'warning' | 'info';
export type FormFeedbackVariant = 'inline' | 'block' | 'floating';
export type FormFeedbackSize = 'small' | 'medium' | 'large';

export interface FormFeedbackProps {
  /** Feedback type determines color and icon */
  type: FormFeedbackType;
  /** Single message to display */
  message?: string;
  /** Multiple messages to display as list */
  messages?: string[];
  /** Title for the feedback (useful for multiple messages) */
  title?: string;
  /** Custom icon component */
  icon?: ReactNode;
  /** Show default icon */
  showIcon?: boolean;
  /** Field name for field-level feedback */
  fieldName?: string;
  /** Display variant */
  variant?: FormFeedbackVariant;
  /** Size variant */
  size?: FormFeedbackSize;
  /** Enable dismiss button */
  onDismiss?: () => void;
  /** Auto-dismiss after duration (ms) */
  autoDismiss?: boolean;
  /** Duration before auto-dismiss (default: 5000ms) */
  dismissDuration?: number;
  /** Enable enter animation */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}