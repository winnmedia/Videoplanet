import React, { useEffect, useRef } from 'react';
import { FormFeedbackProps, FormFeedbackType } from './types';
import styles from './styles.module.scss';

const IconComponents: Record<FormFeedbackType, React.FC<{ className?: string }>> = {
  success: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-label="Success icon">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-label="Error icon">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-label="Warning icon">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-label="Info icon">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  type,
  message,
  messages = [],
  title,
  icon,
  showIcon = true,
  fieldName,
  variant = 'block',
  size = 'medium',
  onDismiss,
  autoDismiss = false,
  dismissDuration = 5000,
  animate = false,
  className = '',
  style,
}) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const IconComponent = IconComponents[type];
  const allMessages = message ? [message] : messages;
  
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, dismissDuration);
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [autoDismiss, dismissDuration, onDismiss]);
  
  const feedbackClasses = [
    styles['form-feedback'],
    styles[`form-feedback--${type}`],
    styles[`form-feedback--${variant}`],
    styles[`form-feedback--${size}`],
    animate && styles['form-feedback--animated'],
    className,
  ].filter(Boolean).join(' ');
  
  const role = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? 'assertive' : 'polite';
  const feedbackId = fieldName ? `${fieldName}-${type}` : undefined;
  
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      id={feedbackId}
      aria-describedby={fieldName}
      className={feedbackClasses}
      style={style}
    >
      <div className={styles['form-feedback__content']}>
        {showIcon && (
          <div className={styles['form-feedback__icon']}>
            {icon || <IconComponent className={styles['form-feedback__icon-svg']} />}
          </div>
        )}
        
        <div className={styles['form-feedback__text']}>
          {title && (
            <div className={styles['form-feedback__title']}>
              {title}
            </div>
          )}
          
          {allMessages.length === 1 ? (
            <div className={styles['form-feedback__message']}>
              {allMessages[0]}
            </div>
          ) : allMessages.length > 1 ? (
            <ul className={styles['form-feedback__list']}>
              {allMessages.map((msg, index) => (
                <li key={index} role="listitem">
                  {msg}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={styles['form-feedback__dismiss']}
            aria-label="Dismiss feedback"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};