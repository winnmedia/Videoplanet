import { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Unique identifier for the toast */
  id?: string;
  /** Toast type determines color and icon */
  type: ToastType;
  /** Toast title (optional) */
  title?: string;
  /** Toast message */
  message: string;
  /** Duration in milliseconds before auto-dismiss (default: 5000) */
  duration?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom icon */
  icon?: ReactNode;
  /** Action button */
  action?: ToastAction;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Prevent auto-dismiss */
  persistent?: boolean;
}

export interface ToastProps extends ToastOptions {
  id: string;
  onDismiss: (id: string) => void;
}

export interface ToastContextValue {
  toasts: ToastProps[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
}

export interface ToastProviderProps {
  /** Children components */
  children: ReactNode;
  /** Position of toast container */
  position?: ToastPosition;
  /** Maximum number of toasts to show */
  maxToasts?: number;
  /** Default duration for all toasts */
  defaultDuration?: number;
  /** Custom container className */
  containerClassName?: string;
}