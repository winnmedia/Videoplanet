'use client';

import React from 'react';
import styles from './Badge.module.scss';
import { BaseComponentProps, Variant } from '../../../types/layout';

export interface BadgeProps extends BaseComponentProps {
  /** 배지 내용 (숫자 또는 텍스트) */
  content: string | number;
  /** 배지 변형 */
  variant?: Variant | 'default';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 원형 모양 */
  circular?: boolean;
  /** 최대 표시 숫자 (초과 시 99+) */
  max?: number;
  /** 빈 배지 숨기기 */
  hideEmpty?: boolean;
  /** 점 형태의 배지 */
  dot?: boolean;
  /** 접근성 라벨 */
  'aria-label'?: string;
}

const Badge: React.FC<BadgeProps> = ({
  content,
  variant = 'default',
  size = 'md',
  circular = false,
  max = 99,
  hideEmpty = true,
  dot = false,
  className = '',
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}) => {
  // 내용 처리
  const getDisplayContent = (): string => {
    if (dot) return '';
    
    if (typeof content === 'number') {
      if (content === 0 && hideEmpty) return '';
      if (content > max) return `${max}+`;
      return content.toString();
    }
    
    if (typeof content === 'string') {
      if (content === '' && hideEmpty) return '';
      return content;
    }
    
    return '';
  };

  const displayContent = getDisplayContent();
  
  // 빈 배지이고 숨기기 옵션이 켜져있으면 null 반환
  if (displayContent === '' && hideEmpty && !dot) {
    return null;
  }

  const badgeClasses = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    circular ? styles['badge--circular'] : '',
    dot ? styles['badge--dot'] : '',
    className,
  ].filter(Boolean).join(' ');

  // 접근성 라벨 생성
  const getAccessibilityLabel = (): string => {
    if (ariaLabel) return ariaLabel;
    
    if (dot) return '새로운 알림';
    
    if (typeof content === 'number') {
      if (content === 0) return '알림 없음';
      if (content === 1) return '1개의 알림';
      if (content > max) return `${max}개 이상의 알림`;
      return `${content}개의 알림`;
    }
    
    return displayContent || '배지';
  };

  return (
    <span
      className={badgeClasses}
      aria-label={getAccessibilityLabel()}
      data-testid={testId}
      {...props}
    >
      {!dot && (
        <span className={styles.badge__content} aria-hidden="true">
          {displayContent}
        </span>
      )}
    </span>
  );
};

export default Badge;