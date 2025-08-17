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
  home: '[HOME]',
  user: '[USER]',
  settings: '[SETTINGS]',
  search: '[SEARCH]',
  close: '[CLOSE]',
  check: '[CHECK]',
  plus: '[PLUS]',
  minus: '[MINUS]',
  edit: '[EDIT]',
  delete: '[DELETE]',
  calendar: '[CALENDAR]',
  clock: '[CLOCK]',
  star: '[STAR]',
  heart: '[HEART]',
  download: '[DOWNLOAD]',
  upload: '[UPLOAD]',
  file: '[FILE]',
  folder: '[FOLDER]',
  image: '[IMAGE]',
  video: '[VIDEO]',
  audio: '[AUDIO]',
  play: '[PLAY]',
  pause: '[PAUSE]',
  stop: '[STOP]',
  forward: '[FORWARD]',
  backward: '[BACKWARD]',
  info: '[INFO]',
  warning: '[WARNING]',
  error: '[ERROR]',
  success: '[SUCCESS]',
  spinner: '[LOADING]',
  menu: '[MENU]',
  dots: '[MORE]',
  arrow_up: '[UP]',
  arrow_down: '[DOWN]',
  arrow_left: '[LEFT]',
  arrow_right: '[RIGHT]',
  refresh: '[REFRESH]',
  lock: '[LOCK]',
  unlock: '[UNLOCK]',
  eye: '[SHOW]',
  eye_off: '[HIDE]',
  mail: '[MAIL]',
  phone: '[PHONE]',
  location: '[LOCATION]',
  share: '[SHARE]',
  copy: '[COPY]',
  print: '[PRINT]',
  save: '[SAVE]',
  bell: '[BELL]',
  bell_off: '[BELL_OFF]',
  message: '[MESSAGE]',
  send: '[SEND]',
  filter: '[FILTER]',
  sort: '[SORT]',
  grid: '[GRID]',
  list: '[LIST]',
  chart: '[CHART]',
  help: '[HELP]',
  logout: '[LOGOUT]',
  login: '[LOGIN]',
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