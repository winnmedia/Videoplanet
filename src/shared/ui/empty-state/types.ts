import { ReactNode } from 'react';

export type EmptyStateSize = 'small' | 'medium' | 'large';
export type EmptyStateVariant = 'default' | 'compact' | 'card';
export type EmptyStateAlign = 'left' | 'center' | 'right';
export type EmptyStateIconType = 'inbox' | 'search' | 'folder' | 'data' | 'users' | 'error' | 'success';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: ReactNode;
}

export interface EmptyStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon component */
  icon?: ReactNode;
  /** Predefined icon type */
  iconType?: EmptyStateIconType;
  /** Image URL */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Single action button */
  action?: EmptyStateAction;
  /** Multiple action buttons */
  actions?: EmptyStateAction[];
  /** Size variant */
  size?: EmptyStateSize;
  /** Layout variant */
  variant?: EmptyStateVariant;
  /** Content alignment */
  align?: EmptyStateAlign;
  /** Additional CSS classes */
  className?: string;
  /** Custom content to render */
  children?: ReactNode;
  /** Hide icon/image */
  hideIcon?: boolean;
  /** Custom background color */
  backgroundColor?: string;
}