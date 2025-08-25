import React from 'react';
import { LoadingSkeletonProps, ResponsiveSize } from './types';
import styles from './styles.module.scss';

const getResponsiveStyle = (size: string | ResponsiveSize | undefined): React.CSSProperties => {
  if (!size) return {};
  
  if (typeof size === 'string') {
    return { width: size, height: size };
  }
  
  // For responsive sizes, we'll use CSS custom properties
  return {
    '--size-mobile': size.mobile,
    '--size-tablet': size.tablet,
    '--size-desktop': size.desktop,
  } as React.CSSProperties;
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  variant = 'rectangle',
  animation = 'pulse',
  lines = 1,
  rows = 3,
  columns = 3,
  count = 3,
  className = '',
  ariaLabel = 'Loading content',
  borderRadius = '4px',
  backgroundColor,
  highlightColor,
}) => {
  const isResponsive = typeof width === 'object' || typeof height === 'object';
  
  const baseStyle: React.CSSProperties = {
    ...(typeof width === 'string' ? { width } : {}),
    ...(typeof height === 'string' ? { height } : {}),
    ...(isResponsive ? getResponsiveStyle(width as ResponsiveSize) : {}),
    borderRadius,
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(highlightColor ? { '--highlight-color': highlightColor } as React.CSSProperties : {}),
  };

  const skeletonClasses = [
    styles.skeleton,
    styles[`skeleton--${variant}`],
    animation !== 'none' && styles[`skeleton--${animation}`],
    isResponsive && styles['skeleton--responsive'],
    className,
  ].filter(Boolean).join(' ');

  // Text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            role="status"
            aria-label={ariaLabel}
            aria-busy="true"
            aria-live="polite"
            className={skeletonClasses}
            style={{
              ...baseStyle,
              width: index === lines - 1 ? '80%' : width,
            }}
          />
        ))}
      </>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div 
        className={`${styles['skeleton-card']} ${className}`}
        data-testid="skeleton-card"
      >
        <div className={styles['skeleton__card-header']}>
          <div 
            className={`${styles.skeleton} ${styles['skeleton--circle']} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
            style={{ width: '40px', height: '40px' }}
            role="status"
            aria-label="Loading avatar"
          />
          <div className={styles['skeleton__card-header-text']}>
            <div 
              className={`${styles.skeleton} ${styles['skeleton__card-title']} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
              style={{ width: '60%', height: '16px' }}
              role="status"
              aria-label="Loading title"
            />
            <div 
              className={`${styles.skeleton} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
              style={{ width: '40%', height: '14px', marginTop: '4px' }}
              role="status"
              aria-label="Loading subtitle"
            />
          </div>
        </div>
        <div 
          className={`${styles.skeleton} ${styles['skeleton__card-content']} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
          style={{ width: '100%', height: '100px', marginTop: '12px' }}
          role="status"
          aria-label="Loading content"
        />
      </div>
    );
  }

  // Table variant
  if (variant === 'table') {
    return (
      <div 
        className={`${styles['skeleton-table']} ${className}`}
        data-testid="skeleton-table"
      >
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles['skeleton__table-row']}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`${styles.skeleton} ${styles['skeleton__table-cell']} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
                style={{ 
                  width: `${100 / columns}%`, 
                  height: '40px',
                  margin: '4px',
                }}
                role="status"
                aria-label={`Loading cell ${rowIndex + 1}-${colIndex + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <div className={`${styles['skeleton-list']} ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index} 
            className={styles['skeleton__list-item']}
            data-testid="skeleton-list-item"
          >
            <div 
              className={`${styles.skeleton} ${styles['skeleton--circle']} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
              style={{ width: '32px', height: '32px' }}
              role="status"
              aria-label="Loading icon"
            />
            <div className={styles['skeleton__list-content']}>
              <div 
                className={`${styles.skeleton} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
                style={{ width: '70%', height: '16px' }}
                role="status"
                aria-label="Loading list title"
              />
              <div 
                className={`${styles.skeleton} ${animation !== 'none' && styles[`skeleton--${animation}`]}`}
                style={{ width: '50%', height: '14px', marginTop: '4px' }}
                role="status"
                aria-label="Loading list description"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default rectangle/circle variant
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      aria-live="polite"
      className={skeletonClasses}
      style={baseStyle}
    />
  );
};