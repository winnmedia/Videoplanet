'use client';

import React from 'react';
import Image from 'next/image';
import styles from './Logo.module.scss';
import { BaseComponentProps } from '../../../types/layout';

export interface LogoProps extends BaseComponentProps {
  /** 로고 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 로고 변형 (색상) */
  variant?: 'primary' | 'white' | 'black';
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 링크 URL (Next.js Link 사용) */
  href?: string;
  /** 로고 이미지 경로 */
  src?: string;
  /** 대체 텍스트 */
  alt?: string;
  /** 우선순위 로딩 */
  priority?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'primary',
  onClick,
  href,
  src,
  alt = 'Planet 로고',
  priority = false,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  // 기본 로고 경로 설정
  const getLogoSrc = (): string => {
    if (src) return src;

    switch (variant) {
      case 'white':
        return '/images/Common/w_logo.svg';
      case 'black':
        return '/images/Common/b_logo.svg';
      case 'primary':
      default:
        return '/images/Common/vlanet-logo.svg';
    }
  };

  // 로고 크기 설정
  const getLogoDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 80, height: 40 };
      case 'lg':
        return { width: 160, height: 80 };
      case 'md':
      default:
        return { width: 120, height: 60 };
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (onClick) {
      event.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const logoClasses = [
    styles.logo,
    styles[`logo--${size}`],
    styles[`logo--${variant}`],
    onClick || href ? styles['logo--clickable'] : '',
    className,
  ].filter(Boolean).join(' ');

  const dimensions = getLogoDimensions();
  const logoSrc = getLogoSrc();

  const logoElement = (
    <div
      className={logoClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${alt} 클릭` : undefined}
      data-testid={testId}
      {...props}
    >
      <Image
        src={logoSrc}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className={styles.logo__image}
        draggable={false}
      />
    </div>
  );

  // href가 있는 경우 Next.js Link로 감싸기
  if (href && !onClick) {
    const Link = require('next/link').default;
    return (
      <Link href={href} className={styles.logo__link}>
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;