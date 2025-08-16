'use client';

import React from 'react';
import classNames from 'classnames';
import styles from './Icon.module.scss';

export interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | string;
  spin?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  title?: string;
}

// 아이콘 매핑 (실제 프로젝트에서 사용하는 아이콘들)
const iconMap: Record<string, string> = {
  home: '🏠',
  user: '👤',
  settings: '⚙️',
  search: '🔍',
  close: '✕',
  check: '✓',
  plus: '+',
  minus: '-',
  edit: '✏️',
  delete: '🗑️',
  calendar: '📅',
  clock: '🕐',
  star: '⭐',
  heart: '❤️',
  download: '⬇️',
  upload: '⬆️',
  file: '📄',
  folder: '📁',
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  play: '▶️',
  pause: '⏸️',
  stop: '⏹️',
  forward: '⏩',
  backward: '⏪',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  spinner: '⟳',
  menu: '☰',
  dots: '⋯',
  arrow_up: '↑',
  arrow_down: '↓',
  arrow_left: '←',
  arrow_right: '→',
  refresh: '🔄',
  lock: '🔒',
  unlock: '🔓',
  eye: '👁️',
  eye_off: '👁️‍🗨️',
  mail: '✉️',
  phone: '📞',
  location: '📍',
  share: '🔗',
  copy: '📋',
  print: '🖨️',
  save: '💾',
  bell: '🔔',
  bell_off: '🔕',
  message: '💬',
  send: '📤',
  filter: '🔽',
  sort: '↕️',
  grid: '⚏',
  list: '☰',
  chart: '📊',
  help: '❓',
  logout: '🚪',
  login: '🔑',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color,
  spin = false,
  onClick,
  className = '',
  style = {},
  ariaLabel,
  title,
}) => {
  const isClickable = !!onClick;
  const isColorPreset = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(color || '');
  
  const iconClasses = classNames(
    styles.icon,
    styles[`icon--${size}`],
    styles[`icon--${name}`],
    {
      [styles[`icon--${color}` as keyof typeof styles] || '']: isColorPreset && color,
      [styles['icon--spin'] || '']: spin,
      [styles['icon--clickable'] || '']: isClickable,
    },
    className
  );

  const iconStyle: React.CSSProperties = {
    ...style,
    ...(color && !isColorPreset ? { color } : {}),
  };

  const iconContent = iconMap[name] || '?';

  return (
    <span
      className={iconClasses}
      style={iconStyle}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? 'false' : 'true'}
      title={title}
      data-testid="icon"
    >
      {iconContent}
    </span>
  );
};