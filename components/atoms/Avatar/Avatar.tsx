'use client';

import React from 'react';
import styles from './Avatar.module.scss';
import { BaseComponentProps } from '../../../types/layout';

export interface AvatarProps extends BaseComponentProps {
  /** 사용자 이름 (이니셜 생성용) */
  name: string;
  /** 아바타 이미지 URL */
  src?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 배경색 (이미지가 없을 때) */
  backgroundColor?: string;
  /** 텍스트 색상 */
  textColor?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 접근성 라벨 */
  alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  backgroundColor = '#516e8b',
  textColor = '#ffffff',
  onClick,
  alt,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  // 이름에서 이니셜 추출 (첫 글자)
  const getInitials = (name: string): string => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const avatarClasses = [
    styles.avatar,
    styles[`avatar--${size}`],
    onClick ? styles['avatar--clickable'] : '',
    className,
  ].filter(Boolean).join(' ');

  const avatarStyle = {
    backgroundColor: !src ? backgroundColor : undefined,
    color: textColor,
  };

  return (
    <div
      className={avatarClasses}
      style={avatarStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={alt || `${name}의 아바타`}
      data-testid={testId}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || `${name}의 프로필 사진`}
          className={styles.avatar__image}
          onError={(e) => {
            // 이미지 로드 실패 시 이니셜로 대체
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span className={styles.avatar__initial} aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};

export default Avatar;