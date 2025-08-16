'use client';

import React from 'react';
import styles from './NavItem.module.scss';
import { Badge } from '../../atoms';
import { BaseComponentProps, SidebarTabName } from '../../../types/layout';

export interface NavItemProps extends BaseComponentProps {
  /** 메뉴 아이템 ID */
  id: string;
  /** 메뉴 라벨 */
  label: string;
  /** 아이콘 파일명 */
  icon: string;
  /** 활성 상태 */
  isActive?: boolean;
  /** 배지 숫자 */
  badge?: number;
  /** 서브메뉴 존재 여부 */
  hasSubmenu?: boolean;
  /** 탭 이름 */
  tabName?: SidebarTabName;
  /** 클릭 핸들러 */
  onClick?: (id: string, tabName?: SidebarTabName) => void;
  /** 비활성화 상태 */
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon,
  isActive = false,
  badge,
  hasSubmenu = false,
  tabName,
  onClick,
  disabled = false,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  // 아이콘 경로 생성
  const getIconPath = (iconName: string, isActive: boolean): string => {
    const basePath = '/images/Cms/';
    if (isActive) {
      // 활성 상태에서는 _w (white) 버전 사용
      return `${basePath}${iconName.replace('_b.svg', '_w.svg')}`;
    }
    return `${basePath}${iconName}`;
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(id, tabName);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  const navItemClasses = [
    styles.navItem,
    isActive ? styles['navItem--active'] : '',
    hasSubmenu ? styles['navItem--hasSubmenu'] : '',
    disabled ? styles['navItem--disabled'] : '',
    className,
  ].filter(Boolean).join(' ');

  const iconPath = getIconPath(icon, isActive);

  return (
    <li
      className={navItemClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label}${hasSubmenu ? ' 메뉴' : ''}`}
      aria-disabled={disabled}
      data-testid={testId}
      {...props}
    >
      <div className={styles.navItem__content}>
        <div className={styles.navItem__icon}>
          <img
            src={iconPath}
            alt=""
            aria-hidden="true"
            className={styles.navItem__iconImage}
          />
        </div>
        
        <span className={styles.navItem__label}>
          {label}
        </span>

        {badge !== undefined && badge > 0 && (
          <Badge
            content={badge}
            size="sm"
            variant="default"
            className={styles.navItem__badge || ''}
          />
        )}

        {hasSubmenu && (
          <span className={styles.navItem__arrow} aria-hidden="true">
            ▶
          </span>
        )}
      </div>
    </li>
  );
};

export default NavItem;