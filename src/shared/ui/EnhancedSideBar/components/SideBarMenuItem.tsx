'use client'

import { memo } from 'react'
import { MenuItem } from '../types'
import styles from '../EnhancedSideBar.module.scss'

// ============================================
// SideBar Menu Item Component
// 단일 책임: 메뉴 아이템 렌더링
// ============================================

interface SideBarMenuItemProps {
  item: MenuItem
  isActive: boolean
  onClick: () => void
}

export const SideBarMenuItem = memo(function SideBarMenuItem({
  item,
  isActive,
  onClick
}: SideBarMenuItemProps) {
  return (
    <li role="listitem">
      <button
        className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
        onClick={onClick}
        aria-label={item.ariaLabel || item.label}
        aria-current={isActive ? 'page' : undefined}
        data-testid={`menu-item-${item.id}`}
      >
        {item.icon && (
          <span className={styles.icon} aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
        {item.badge !== undefined && (
          <span 
            className={styles.badge}
            aria-label={`${item.badge}개`}
          >
            {item.badge}
          </span>
        )}
      </button>
    </li>
  )
})

// 메모이제이션 조건: item의 id와 label, isActive가 변경될 때만 리렌더링
SideBarMenuItem.displayName = 'SideBarMenuItem'