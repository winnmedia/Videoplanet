'use client';

import React from 'react';
import Link from 'next/link';
import styles from './MenuItem.module.scss';
import { BaseComponentProps } from '../../../types/layout';

export interface MenuItemProps extends BaseComponentProps {
  /** 아이콘 파일명 */
  icon?: string;
  /** 메뉴 라벨 */
  label: string;
  /** 서브 라벨 */
  sublabel?: string;
  /** 활성 상태 */
  active?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 링크 URL */
  href?: string;
  /** 외부 링크 여부 */
  external?: boolean;
  /** 오른쪽 액션 버튼/아이콘 */
  rightAction?: React.ReactNode;
  /** 접근성 라벨 */
  'aria-label'?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  sublabel,
  active = false,
  disabled = false,
  onClick,
  href,
  external = false,
  rightAction,
  className = '',
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}) => {
  // 아이콘 경로 생성
  const getIconPath = (iconName?: string): string => {
    if (!iconName) return '';
    const basePath = '/images/Cms/';
    return `${basePath}${iconName}`;
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  const menuItemClasses = [
    styles.menuItem,
    active ? styles['menuItem--active'] : '',
    disabled ? styles['menuItem--disabled'] : '',
    className,
  ].filter(Boolean).join(' ');

  const iconPath = getIconPath(icon);

  // 콘텐츠 렌더링
  const renderContent = () => (
    <div className={styles.menuItem__content}>
      {icon && (
        <div className={styles.menuItem__icon}>
          <img
            src={iconPath}
            alt=""
            aria-hidden="true"
            className={styles.menuItem__iconImage}
          />
        </div>
      )}
      
      <div className={styles.menuItem__text}>
        <span className={styles.menuItem__label}>
          {label}
        </span>
        {sublabel && (
          <span className={styles.menuItem__sublabel}>
            {sublabel}
          </span>
        )}
      </div>

      {rightAction && (
        <div 
          className={styles.menuItem__action}
          onClick={(e) => e.stopPropagation()}
        >
          {rightAction}
        </div>
      )}
    </div>
  );

  // href가 있으면 Link로 렌더링
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={menuItemClasses}
          aria-label={ariaLabel || label}
          aria-disabled={disabled}
          aria-current={active ? 'page' : undefined}
          data-testid={testId}
          {...props}
        >
          {renderContent()}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={menuItemClasses}
        aria-label={ariaLabel || label}
        aria-disabled={disabled}
        aria-current={active ? 'page' : undefined}
        data-testid={testId}
        {...props}
      >
        {renderContent()}
      </Link>
    );
  }

  // 일반 버튼으로 렌더링
  return (
    <div
      className={menuItemClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || label}
      aria-disabled={disabled}
      aria-current={active ? 'page' : undefined}
      data-testid={testId}
      {...props}
    >
      {renderContent()}
    </div>
  );
};

export default MenuItem;