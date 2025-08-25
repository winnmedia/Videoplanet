import React from 'react';
import { EmptyStateProps, EmptyStateIconType } from './types';
import styles from './styles.module.scss';

const IconComponents: Record<EmptyStateIconType, React.FC<{ className?: string }>> = {
  inbox: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No inbox items">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  search: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No search results">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  folder: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No folder items">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  data: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No data available">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No users found">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  error: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Error state">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Success state">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description,
  icon,
  iconType = 'inbox',
  image,
  imageAlt,
  action,
  actions = [],
  size = 'medium',
  variant = 'default',
  align = 'center',
  className = '',
  children,
  hideIcon = false,
  backgroundColor,
}) => {
  const allActions = action ? [action] : actions;
  const IconComponent = IconComponents[iconType];
  
  const containerClasses = [
    styles['empty-state'],
    styles[`empty-state--${size}`],
    styles[`empty-state--${variant}`],
    styles[`empty-state--${align}`],
    className,
  ].filter(Boolean).join(' ');

  const containerStyle: React.CSSProperties = backgroundColor 
    ? { backgroundColor } 
    : {};

  return (
    <div 
      role="status"
      aria-label={`Empty state: ${title}`}
      aria-live="polite"
      className={containerClasses}
      style={containerStyle}
    >
      {!hideIcon && (
        <>
          {image ? (
            <img 
              src={image} 
              alt={imageAlt || 'Empty state illustration'}
              className={styles['empty-state__image']}
            />
          ) : icon ? (
            <div className={styles['empty-state__icon']}>
              {icon}
            </div>
          ) : (
            <div className={styles['empty-state__icon']}>
              <IconComponent className={styles['empty-state__icon-svg']} />
            </div>
          )}
        </>
      )}
      
      <h3 className={styles['empty-state__title']}>
        {title}
      </h3>
      
      {description && (
        <p className={styles['empty-state__description']}>
          {description}
        </p>
      )}
      
      {children && (
        <div className={styles['empty-state__content']}>
          {children}
        </div>
      )}
      
      {allActions.length > 0 && (
        <div className={styles['empty-state__actions']}>
          {allActions.map((actionItem, index) => (
            <button
              key={index}
              onClick={actionItem.onClick}
              disabled={actionItem.disabled}
              className={[
                styles['empty-state__button'],
                styles[`empty-state__button--${actionItem.variant || 'primary'}`],
              ].join(' ')}
              aria-label={actionItem.label}
            >
              {actionItem.icon && (
                <span className={styles['empty-state__button-icon']}>
                  {actionItem.icon}
                </span>
              )}
              {actionItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};