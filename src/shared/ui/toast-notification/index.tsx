import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ToastProps, ToastOptions, ToastContextValue, ToastProviderProps, ToastType } from './types';
import styles from './styles.module.scss';

// Toast Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Icon components for each type
const IconComponents: Record<ToastType, React.FC<{ className?: string }>> = {
  success: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

// Individual Toast Component
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  showProgress = false,
  icon,
  action,
  onDismiss,
  persistent = false,
}) => {
  const [progress, setProgress] = useState(100);
  const progressInterval = useRef<NodeJS.Timeout>();
  const dismissTimeout = useRef<NodeJS.Timeout>();
  const IconComponent = IconComponents[type];
  
  useEffect(() => {
    if (!persistent && duration > 0) {
      // Set up auto-dismiss
      dismissTimeout.current = setTimeout(() => {
        onDismiss(id);
      }, duration);
      
      // Set up progress bar
      if (showProgress) {
        const interval = 100;
        const decrement = (interval / duration) * 100;
        
        progressInterval.current = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - decrement;
            if (newProgress <= 0) {
              return 0;
            }
            return newProgress;
          });
        }, interval);
      }
    }
    
    return () => {
      if (dismissTimeout.current) {
        clearTimeout(dismissTimeout.current);
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [id, duration, persistent, showProgress, onDismiss]);
  
  const toastClasses = [
    styles.toast,
    styles[`toast--${type}`],
    styles['toast--enter'],
  ].join(' ');
  
  const role = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? 'assertive' : 'polite';
  
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={toastClasses}
    >
      <div className={styles.toast__content}>
        <div className={styles.toast__icon}>
          {icon || <IconComponent className={styles['toast__icon-svg']} />}
        </div>
        
        <div className={styles.toast__text}>
          {title && (
            <div className={styles.toast__title}>
              {title}
            </div>
          )}
          <div className={styles.toast__message}>
            {message}
          </div>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={styles.toast__action}
            >
              {action.label}
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className={styles.toast__close}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {showProgress && !persistent && (
        <div 
          className={styles.toast__progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={progress}
        >
          <div 
            className={styles['toast__progress-bar']}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
  containerClassName = '',
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  const showToast = useCallback((options: ToastOptions): string => {
    const id = options.id || generateId();
    const newToast: ToastProps = {
      ...options,
      id,
      duration: options.duration ?? defaultDuration,
      onDismiss: (toastId: string) => dismissToast(toastId),
    };
    
    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
    
    return id;
  }, [defaultDuration, maxToasts]);
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  const updateToast = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, ...options, id } as ToastProps
        : toast
    ));
  }, []);
  
  const contextValue: ToastContextValue = {
    toasts,
    showToast,
    dismissToast,
    dismissAllToasts,
    updateToast,
  };
  
  const containerClasses = [
    styles['toast-container'],
    styles[`toast-container--${position}`],
    containerClassName,
  ].filter(Boolean).join(' ');
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div 
        className={containerClasses}
        data-testid="toast-container"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};