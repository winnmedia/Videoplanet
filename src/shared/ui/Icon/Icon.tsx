import React, { forwardRef, useEffect, useState, useMemo, useCallback } from 'react';
import classNames from 'classnames';
import { iconMap } from './iconMap';
import styles from './Icon.module.scss';

// Types
export type IconSize = 'xs' | 'sm' | 'small' | 'md' | 'medium' | 'lg' | 'large' | 'xl' | number;
export type IconName = keyof typeof iconMap;
export type IconType = IconName | string; // Extended for backward compatibility
export type IconVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Main props
  name?: IconName | string;
  type?: IconType; // Alias for name (backward compatibility)
  size?: IconSize;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // Styling
  variant?: IconVariant;
  darkMode?: boolean;
  
  // Animation
  spin?: boolean;
  pulse?: boolean;
  animate?: boolean;
  animation?: 'spin' | 'pulse' | 'shake' | 'bounce' | string;
  animationType?: 'spin' | 'pulse' | 'bounce';
  
  // Accessibility
  decorative?: boolean;
  ariaLabel?: string;
  ariaHidden?: boolean;
  
  // Transform
  rotate?: 0 | 90 | 180 | 270;
  flip?: boolean;
  
  // Rendering
  sprite?: boolean;
  spriteUrl?: string;
  title?: string;
  viewBox?: string;
  fillRule?: 'nonzero' | 'evenodd';
}

// Size mappings - extended for backward compatibility
const sizeMap: Record<string, number> = {
  xs: 16,
  sm: 20,
  small: 16, // backward compatibility
  md: 24,
  medium: 24, // backward compatibility
  lg: 32,
  large: 32, // backward compatibility
  xl: 40,
};

// Variant color mappings
const variantColorMap: Record<IconVariant, string> = {
  primary: 'var(--color-primary, #1631F8)',
  secondary: 'var(--color-secondary, #6c757d)',
  success: 'var(--color-success, #28a745)',
  warning: 'var(--color-warning, #ffc107)',
  error: 'var(--color-error, #dc3545)',
  info: 'var(--color-info, #17a2b8)',
  neutral: 'currentColor',
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      // Main props
      name,
      type, // Alias for name
      size = 'medium',
      color,
      strokeColor,
      strokeWidth,
      
      // Styling
      variant = 'neutral',
      darkMode,
      
      // Animation
      spin = false,
      pulse = false,
      animate = false,
      animation,
      animationType = 'spin',
      
      // Accessibility
      decorative = false,
      ariaLabel,
      ariaHidden,
      
      // Transform
      rotate = 0,
      flip = false,
      
      // Rendering
      sprite = false,
      spriteUrl = '/icons/sprite.svg',
      title,
      viewBox = '0 0 24 24',
      fillRule = 'evenodd',
      
      className,
      style,
      onClick,
      tabIndex,
      ...rest
    },
    ref
  ) => {
    // Normalize icon name (support both 'name' and 'type' props)
    const iconName = name || type;
    
    // System dark mode detection
    const [systemDarkMode, setSystemDarkMode] = useState(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDarkMode(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    const isDarkMode = darkMode !== undefined ? darkMode : systemDarkMode;
    
    // Calculate icon size
    const iconSize = useMemo(() => {
      if (typeof size === 'number') return size;
      return sizeMap[size] || 24;
    }, [size]);
    
    // Calculate icon color
    const iconColor = useMemo(() => {
      if (color) return color;
      if (variant !== 'neutral') return variantColorMap[variant];
      return 'currentColor';
    }, [color, variant]);
    
    const isOutlineIcon = typeof iconName === 'string' && iconName.includes('outline');
    
    // Transform styles
    const transformStyle = useMemo(() => {
      const transforms: string[] = [];
      
      if (rotate !== 0) {
        transforms.push(`rotate(${rotate}deg)`);
      }
      
      if (flip) {
        transforms.push('scaleX(-1)');
      }
      
      return transforms.length > 0 ? transforms.join(' ') : undefined;
    }, [rotate, flip]);
    
    // Accessibility checks - only warn for interactive icons
    useEffect(() => {
      // Warn if non-decorative icon lacks aria-label
      const finalAriaLabel = ariaLabel || rest['aria-label'];
      const finalAriaHidden = ariaHidden !== undefined ? ariaHidden : decorative;
      const isInteractive = onClick || rest.onClick || rest.role === 'button';
      
      if (isInteractive && !finalAriaHidden && !finalAriaLabel && !title && process.env.NODE_ENV === 'development') {
        console.warn(
          `Interactive Icon "${iconName}" should have aria-label for accessibility`
        );
      }
    }, [decorative, iconName, ariaLabel, ariaHidden, rest, title, onClick]);

    // Handle unknown icon
    const IconComponent = iconName ? iconMap[iconName as IconName] : null;
    if (iconName && !IconComponent && process.env.NODE_ENV === 'development') {
      console.error(`Icon "${iconName}" not found in icon map`);
    }

    // Determine active animation
    const activeAnimation = animation || (animate ? animationType : null) || 
                           (spin ? 'spin' : null) || (pulse ? 'pulse' : null);
    
    const classes = classNames(
      styles.icon,
      'icon',
      {
        [styles['icon--spin']]: activeAnimation === 'spin',
        [styles['icon--pulse']]: activeAnimation === 'pulse',
        [styles['icon--shake']]: activeAnimation === 'shake',
        [styles['icon--bounce']]: activeAnimation === 'bounce',
        [styles['icon--clickable']]: !!onClick,
        [styles['icon--dark']]: isDarkMode,
        [styles['icon--responsive']]: typeof size === 'object',
        [styles['icon--fallback']]: !IconComponent,
      },
      activeAnimation && styles[`icon--${activeAnimation}`],
      className
    );

    // Determine aria attributes
    const finalAriaLabel = ariaLabel || rest['aria-label'];
    const finalAriaHidden = ariaHidden !== undefined ? ariaHidden : decorative;
    
    const svgProps = {
      ref,
      className: classes,
      width: iconSize,
      height: iconSize,
      fill: isOutlineIcon ? 'none' : iconColor,
      stroke: strokeColor || (isOutlineIcon ? iconColor : undefined),
      strokeWidth: strokeWidth || (isOutlineIcon ? 2 : undefined),
      viewBox,
      preserveAspectRatio: 'xMidYMid meet',
      'aria-hidden': finalAriaHidden ? 'true' : undefined,
      role: onClick ? 'button' : (finalAriaHidden ? undefined : 'img'),
      'aria-label': finalAriaLabel,
      focusable: onClick || tabIndex !== undefined ? 'true' : 'false',
      tabIndex: onClick ? (tabIndex !== undefined ? tabIndex : 0) : tabIndex,
      style: {
        ...style,
        transform: transformStyle,
        color: iconColor,
      },
      onClick,
      onKeyDown: onClick ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as any);
        }
      } : undefined,
      ...rest,
    };

    // Sprite mode for performance
    if (sprite) {
      return (
        <svg {...svgProps}>
          {title && <title>{title}</title>}
          <use href={`${spriteUrl}#${iconName}`} />
        </svg>
      );
    }

    // Fallback for unknown icons
    if (!IconComponent) {
      return (
        <svg {...svgProps}>
          {title && <title>{title}</title>}
          {/* Question mark as fallback */}
          <path
            d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"
            fill={iconColor}
            fillRule={fillRule}
          />
        </svg>
      );
    }

    // Render the icon
    return (
      <svg {...svgProps}>
        {title && <title>{title}</title>}
        {IconComponent({ size: iconSize })}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

// Export additional components for backward compatibility
export const LoadingIcon: React.FC<Omit<IconProps, 'name' | 'animate' | 'animation'>> = (props) => {
  return (
    <Icon
      {...props}
      name="spinner"
      animate
      animation="spin"
      ariaLabel={props.ariaLabel || 'Loading'}
    />
  );
};

LoadingIcon.displayName = 'LoadingIcon';

export const SpriteIcon: React.FC<IconProps> = (props) => {
  return <Icon {...props} sprite />;
};

SpriteIcon.displayName = 'SpriteIcon';