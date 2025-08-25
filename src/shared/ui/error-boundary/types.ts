import { ReactNode, ErrorInfo } from 'react';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

export interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Custom error message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details (stack trace) */
  showDetails?: boolean;
  /** Keys that trigger error reset when changed */
  resetKeys?: Array<string | number>;
  /** Custom class name for error container */
  className?: string;
  /** Enable error reporting to external service */
  enableReporting?: boolean;
  /** Custom error reporter function */
  errorReporter?: (error: Error, errorInfo: ErrorInfo) => void;
}