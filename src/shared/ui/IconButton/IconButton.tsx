import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import cn from 'classnames';
import { Icon, LoadingIcon } from '../Icon';
import { IconButtonProps, RippleEffect } from './types';
import styles from './IconButton.module.scss';

const DefaultSpinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <LoadingIcon size={size} className={cn(styles.spinner, 'spinner')} />
);

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      size = 'medium',
      variant = 'primary',
      loading = false,
      tooltip,
      tooltipPosition = 'top',
      ripple = true,
      className,
      active = false,
      loadingIcon,
      minTouchSize = 44,
      darkMode,
      disabled,
      onClick,
      style,
      'aria-label': ariaLabel,
      ...restProps
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);
    const [showTooltip, setShowTooltip] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
    const combinedRef = ref || buttonRef;

    // Detect system dark mode preference
    const [systemDarkMode, setSystemDarkMode] = useState(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDarkMode(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const isDarkMode = darkMode !== undefined ? darkMode : systemDarkMode;
    const isDisabled = disabled || loading;

    // Handle ripple effect
    const handleRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || isDisabled) return;

      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rippleId = `ripple-${Date.now()}`;

      setRipples(prev => [...prev, { id: rippleId, x, y }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 600);
    }, [ripple, isDisabled]);

    // Handle click event
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      handleRipple(event);
      onClick?.(event);
    }, [isDisabled, handleRipple, onClick]);

    // Handle keyboard events for accessibility
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      // Trigger click on Enter or Space key
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as any);
      }
    }, [isDisabled, onClick]);

    // Handle tooltip
    const handleMouseEnter = useCallback(() => {
      if (disabled || !tooltip) return;
      
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 100);
    }, [disabled, tooltip]);

    const handleMouseLeave = useCallback(() => {
      clearTimeout(tooltipTimeoutRef.current);
      setShowTooltip(false);
    }, []);

    const handleFocus = useCallback(() => {
      if (disabled || !tooltip) return;
      setShowTooltip(true);
    }, [disabled, tooltip]);

    const handleBlur = useCallback(() => {
      setShowTooltip(false);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }
      };
    }, []);

    const buttonClasses = cn(
      styles.iconButton,
      'iconButton',
      styles[`iconButton--${size}`],
      `iconButton--${size}`,
      styles[`iconButton--${variant}`],
      `iconButton--${variant}`,
      {
        [styles['iconButton--active']]: active,
        'iconButton--active': active,
        [styles['iconButton--disabled']]: isDisabled,
        'iconButton--disabled': isDisabled,
        [styles['iconButton--dark']]: isDarkMode,
        'iconButton--dark': isDarkMode,
      },
      className
    );

    const buttonStyle = {
      ...style,
      minWidth: `${minTouchSize}px`,
      minHeight: `${minTouchSize}px`,
    };

    return (
      <>
        <button
          ref={combinedRef as React.Ref<HTMLButtonElement>}
          className={buttonClasses}
          style={buttonStyle}
          disabled={isDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={ariaLabel}
          aria-busy={loading}
          {...restProps}
        >
          <span className={styles.iconWrapper}>
            {loading ? (loadingIcon || <DefaultSpinner size={size === 'small' ? 14 : size === 'large' ? 20 : 16} />) : icon}
          </span>
          
          {/* Ripple effects */}
          {ripples.map(({ id, x, y }) => (
            <span
              key={id}
              className={cn(styles.ripple, 'ripple')}
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
            />
          ))}
        </button>

        {/* Tooltip */}
        {showTooltip && tooltip && (
          <div
            role="tooltip"
            className={cn(
              styles.tooltip,
              'tooltip',
              styles[`tooltip--${tooltipPosition}`],
              `tooltip--${tooltipPosition}`,
              {
                [styles['tooltip--dark']]: isDarkMode,
              }
            )}
          >
            {tooltip}
          </div>
        )}
      </>
    );
  }
);

IconButton.displayName = 'IconButton';