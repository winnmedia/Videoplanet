'use client'

import { memo } from 'react'
import { Project } from '../types'
import styles from '../EnhancedSideBar.module.scss'

// ============================================
// SubMenu Component
// 단일 책임: 서브메뉴 렌더링 및 관리
// ============================================

interface SubMenuProps {
  isOpen: boolean
  title: string
  tab: string
  projects: Project[]
  currentPath: string
  onClose: () => void
  onNavigate: (path: string) => void
  onAddProject?: () => void
}

export const SubMenu = memo(function SubMenu({
  isOpen,
  title,
  tab,
  projects,
  currentPath,
  onClose,
  onNavigate,
  onAddProject
}: SubMenuProps) {
  const renderProjectList = () => {
    if (projects.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>등록된<br />프로젝트가 없습니다</p>
          <button
            onClick={() => onNavigate('/projects/create')}
            className={styles.ctaButton}
            aria-label="새 프로젝트 생성"
          >
            프로젝트 등록
          </button>
        </div>
      )
    }

    return (
      <nav className={styles.submenuNav} aria-label={`${title} 목록`}>
        <ul role="list">
          {projects.map((project) => (
            <li key={project.id} role="listitem">
              <button
                onClick={() => {
                  const path = tab === 'project' 
                    ? `/projects/${project.id}`
                    : `/feedback/${project.id}`
                  onNavigate(path)
                }}
                className={currentPath.includes(`/${project.id}`) ? styles.active : ''}
                aria-current={currentPath.includes(`/${project.id}`) ? 'page' : undefined}
              >
                <div className={styles.submenuIcon} aria-hidden="true"></div>
                <span>{project.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  const renderVideoPlanningMenu = () => (
    <>
      <nav className={styles.submenuNav} aria-label="영상 기획 메뉴">
        <ul role="list">
          <li role="listitem">
            <button
              onClick={() => onNavigate('/video-planning/ai')}
              className={currentPath === '/video-planning/ai' ? styles.active : ''}
              aria-current={currentPath === '/video-planning/ai' ? 'page' : undefined}
            >
              <div className={styles.submenuIcon} aria-hidden="true"></div>
              <span>AI 기획</span>
            </button>
          </li>
          <li role="listitem">
            <button
              onClick={() => onNavigate('/video-planning/history')}
              className={currentPath === '/video-planning/history' ? styles.active : ''}
              aria-current={currentPath === '/video-planning/history' ? 'page' : undefined}
            >
              <div className={styles.submenuIcon} aria-hidden="true"></div>
              <span>기획서 관리</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className={styles.emptyState}>
        <p>AI 영상 기획으로<br />빠르게 시작하세요</p>
        <button
          onClick={() => onNavigate('/video-planning/ai')}
          className={styles.ctaButton}
          aria-label="AI 기획 시작하기"
        >
          AI 기획 시작
        </button>
      </div>
    </>
  )

  return (
    <aside 
      className={`${styles.submenu} ${isOpen ? styles.active : ''}`}
      role="complementary"
      aria-label={`${title} 서브메뉴`}
      aria-hidden={!isOpen}
    >
      <div className={styles.submenuHeader}>
        <h2 className={styles.submenuTitle} id="submenu-title">
          {title}
        </h2>
        <div className={styles.submenuActions}>
          {tab === 'project' && projects.length > 0 && (
            <button
              onClick={onAddProject || (() => onNavigate('/projects/create'))}
              className={styles.addButton}
              aria-label="프로젝트 추가"
              title="새 프로젝트 추가"
            >
              +
            </button>
          )}
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="서브메뉴 닫기"
            title="닫기"
          >
            ×
          </button>
        </div>
      </div>

      {tab === 'video-planning' 
        ? renderVideoPlanningMenu()
        : renderProjectList()
      }
    </aside>
  )
})

SubMenu.displayName = 'SubMenu'