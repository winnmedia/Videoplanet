import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonSize = 'small' | 'medium' | 'large';
export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /**
   * Icon element to display
   */
  icon: ReactNode;
  
  /**
   * Button size - affects touch target and visual size
   * @default 'medium'
   */
  size?: IconButtonSize;
  
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: IconButtonVariant;
  
  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Tooltip text for the button
   */
  tooltip?: string;
  
  /**
   * Tooltip position
   * @default 'top'
   */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Whether to show ripple effect on click
   * @default true
   */
  ripple?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the button is in active/pressed state
   * @default false
   */
  active?: boolean;
  
  /**
   * Custom loading spinner element
   */
  loadingIcon?: ReactNode;
  
  /**
   * Minimum touch target size in pixels
   * @default 44
   */
  minTouchSize?: number;
  
  /**
   * Dark mode override
   */
  darkMode?: boolean;
}

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
}