'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Icon } from '../Icon/Icon';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  ripple?: boolean;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void | Promise<void>;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      href,
      target,
      rel,
      ripple = true,
      tooltip,
      tooltipPosition = 'top',
      children,
      className,
      onClick,
      type = 'button',
      style,
      ...rest
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(loading);
    const [showTooltip, setShowTooltip] = useState(false);
    const [rippleArray, setRippleArray] = useState<Array<{ x: number; y: number; size: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

    useEffect(() => {
      setIsLoading(loading);
    }, [loading]);

    useEffect(() => {
      // Warn if icon-only button lacks aria-label
      if (iconOnly && !rest['aria-label'] && process.env.NODE_ENV === 'development') {
        console.warn('Icon-only buttons must have an aria-label for accessibility');
      }
    }, [iconOnly, rest]);

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (disabled || isLoading) {
        event.preventDefault();
        return;
      }

      // Handle ripple effect
      if (ripple) {
        const button = buttonRef.current || event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const newRipple = { x, y, size };
        setRippleArray([...rippleArray, newRipple]);
        
        setTimeout(() => {
          setRippleArray(prev => prev.filter(r => r !== newRipple));
        }, 600);
      }

      // Handle async onClick
      if (onClick) {
        const result = onClick(event);
        if (result instanceof Promise) {
          setIsLoading(true);
          try {
            await result;
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    const handleMouseEnter = () => {
      if (tooltip) {
        setShowTooltip(true);
      }
    };

    const handleMouseLeave = () => {
      if (tooltip) {
        setShowTooltip(false);
      }
    };

    const classes = classNames(
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      {
        [styles['button--fullWidth']]: fullWidth,
        [styles['button--loading']]: isLoading,
        [styles['button--disabled']]: disabled,
        [styles['button--iconOnly']]: iconOnly,
        [styles['button--iconRight']]: iconPosition === 'right',
      },
      className
    );

    const buttonContent = (
      <>
        {isLoading && (
          <span className={styles.button__loader} data-testid="loading-spinner">
            <Icon name="spinner" spin size="small" decorative />
          </span>
        )}
        {icon && iconPosition === 'left' && !isLoading && (
          <Icon
            name={icon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            className={styles.button__icon}
            data-testid={`icon-${icon}`}
            decorative
          />
        )}
        {!iconOnly && children && (
          <span className={styles.button__text}>{children}</span>
        )}
        {icon && iconPosition === 'right' && !isLoading && (
          <Icon
            name={icon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            className={styles.button__icon}
            data-testid={`icon-${icon}`}
            decorative
          />
        )}
        {rippleArray.map((ripple, index) => (
          <span
            key={index}
            className={styles.button__ripple}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
        {showTooltip && tooltip && (
          <span
            role="tooltip"
            className={classNames(
              styles.button__tooltip,
              styles[`button__tooltip--${tooltipPosition}`]
            )}
          >
            {tooltip}
          </span>
        )}
      </>
    );

    const sharedProps = {
      className: classes,
      style,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'aria-busy': isLoading,
      'aria-disabled': disabled || isLoading,
      tabIndex: disabled ? -1 : 0,
      ...rest,
    };

    // Render as link if href is provided
    if (href) {
      return (
        <a
          {...sharedProps}
          href={href}
          target={target}
          rel={rel}
          ref={ref as React.Ref<HTMLAnchorElement>}
          role="link"
        >
          {buttonContent}
        </a>
      );
    }

    // Render as button
    return (
      <button
        {...sharedProps}
        type={type}
        disabled={disabled || isLoading}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';