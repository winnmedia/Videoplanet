'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './SideBar.module.scss'

interface SideBarProps {
  tab?: string
  onMenu?: boolean
  projects?: Array<{
    id: number
    name: string
    status: string
  }>
  onMenuClick?: (menuType: string) => void
  onClose?: () => void
}

export function SideBar({ tab, onMenu, projects = [], onMenuClick, onClose }: SideBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [tabName, setTabName] = useState('')

  useEffect(() => {
    if (onMenu === true) {
      setSubMenuOpen(true)
    } else {
      setSubMenuOpen(false)
    }
    setTabName(tab || '')
  }, [onMenu, tab])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isActive = (path: string) => {
    return pathname === path && !subMenuOpen
  }

  const isVideoPlanningActive = () => {
    return pathname.startsWith('/video-planning')
  }

  // TODO(human): 키보드 네비게이션 핸들러 구현
  // Enter 키: 메뉴 선택/실행
  // Escape 키: 서브메뉴 닫기
  // Tab 키: 다음 항목으로 이동
  
  return (
    <>
      <aside 
        className={styles.sideBar}
        role="navigation"
        aria-label="메인 메뉴"
      >
        <nav>
          <ul role="list">
            <li
              className={isActive('/dashboard') ? styles.active : ''}
              onClick={() => {
                setSubMenuOpen(false)
                router.push('/dashboard')
              }}
            >
              홈
            </li>
            <li
              className={isActive('/planning') ? styles.active : ''}
              onClick={() => {
                setSubMenuOpen(false)
                router.push('/planning')
              }}
            >
              전체 일정
            </li>
            <li
              className={`${styles.menuProject} ${
                pathname.includes('/projects') || (subMenuOpen && tabName === 'project')
                  ? styles.active
                  : ''
              }`}
              onClick={() => {
                if (tabName === 'feedback') {
                  setSubMenuOpen(true)
                } else {
                  setSubMenuOpen(!subMenuOpen)
                }
                setTabName('project')
                onMenuClick?.('project')
              }}
            >
              프로젝트 관리
              <span>{projects.length}</span>
            </li>
            <li
              className={
                isVideoPlanningActive() || (subMenuOpen && tabName === 'video-planning')
                  ? styles.active
                  : ''
              }
              onClick={() => {
                if (onMenuClick) {
                  onMenuClick('video-planning')
                  setSubMenuOpen(true)
                  setTabName('video-planning')
                } else {
                  router.push('/video-planning/ai')
                }
              }}
            >
              영상 기획
            </li>
            <li
              className={
                pathname.includes('/feedback') || (subMenuOpen && tabName === 'feedback')
                  ? styles.active
                  : ''
              }
              onClick={() => {
                if (tabName === 'project') {
                  setSubMenuOpen(true)
                } else {
                  setSubMenuOpen(!subMenuOpen)
                }
                setTabName('feedback')
                onMenuClick?.('feedback')
              }}
            >
              영상 피드백
            </li>
          </ul>
        </nav>
        <div className={styles.logout} onClick={handleLogout}>
          로그아웃
        </div>
      </aside>

      {/* Sub Menu */}
      <div className={subMenuOpen ? `${styles.submenu} ${styles.active}` : styles.submenu}>
        <div className={styles.etc}>
          <div className={styles.ssTitle}>
            {tabName === 'feedback' ? '영상 피드백' : '프로젝트 관리'}
          </div>
          <ul>
            {tabName === 'project' && projects.length > 0 && (
              <li
                onClick={() => router.push('/projects/create')}
                className={styles.plus}
              >
                +
              </li>
            )}
            <li
              onClick={() => {
                setSubMenuOpen(false)
                onClose?.()
              }}
              className={styles.close}
            >
              x
            </li>
          </ul>
        </div>

        {/* 2차메뉴 있을때 */}
        <nav>
          <ul>
            {tabName === 'video-planning' ? (
              <>
                <li
                  onClick={() => {
                    router.push('/video-planning/ai')
                  }}
                  className={pathname === '/video-planning/ai' ? styles.active : ''}
                >
                  AI 기획
                </li>
                <li
                  onClick={() => {
                    router.push('/video-planning/history')
                  }}
                  className={pathname === '/video-planning/history' ? styles.active : ''}
                >
                  기획서 관리
                </li>
              </>
            ) : (
              projects.map((item, index) => (
                <li
                  onClick={() => {
                    if (tabName === 'project') {
                      router.push(`/projects/${item.id}`)
                    } else {
                      router.push(`/feedback/${item.id}`)
                    }
                  }}
                  key={index}
                >
                  {item.name}
                </li>
              ))
            )}
          </ul>
        </nav>

        {/* 2차메뉴 없을때 */}
        {tabName === 'video-planning' ? (
          <div className={styles.empty}>
            AI 영상 기획으로 <br />
            빠르게 시작하세요
            <button
              onClick={() => router.push('/video-planning/ai')}
              className={styles.submit}
            >
              AI 기획 시작
            </button>
          </div>
        ) : (
          projects.length === 0 && (
            <div className={styles.empty}>
              등록된 <br />
              프로젝트가 없습니다
              <button
                onClick={() => router.push('/projects/create')}
                className={styles.submit}
              >
                프로젝트 등록
              </button>
            </div>
          )
        )}
      </div>
    </>
  )
}