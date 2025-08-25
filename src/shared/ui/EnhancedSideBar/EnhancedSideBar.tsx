'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { EnhancedSideBarProps, MenuItem, BreadcrumbItem } from './types'
import styles from './EnhancedSideBar.module.scss'

export function EnhancedSideBar({
  tab,
  isOpen: isOpenProp = false,
  projects = [],
  onMenuClick,
  onClose,
  searchable = false,
  searchPlaceholder = '메뉴 검색...',
  breadcrumbs = [],
  customMenuItems,
  onLogout,
  ariaLabel = '메인 네비게이션',
}: EnhancedSideBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [tabName, setTabName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(isOpenProp)
  const [userClosedSubmenu, setUserClosedSubmenu] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const firstFocusableRef = useRef<HTMLElement>(null)
  const lastFocusableRef = useRef<HTMLElement>(null)

  // 기본 메뉴 아이템
  const defaultMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: '홈',
      path: '/dashboard',
      ariaLabel: '홈으로 이동',
    },
    {
      id: 'planning',
      label: '전체 일정',
      path: '/planning',
      ariaLabel: '전체 일정 페이지로 이동',
    },
    {
      id: 'project',
      label: '프로젝트 관리',
      badge: projects.length,
      ariaLabel: `프로젝트 관리 (${projects.length}개)`,
    },
    {
      id: 'video-planning',
      label: '영상 기획',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="m2 2 7.586 7.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      ariaLabel: '영상 기획 메뉴 열기',
    },
    {
      id: 'feedback',
      label: '영상 피드백',
      ariaLabel: '영상 피드백 메뉴 열기',
    },
  ]

  const menuItems = customMenuItems || defaultMenuItems

  // 모바일 감지 (SSR 안전)
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 외부 prop 변경 시 상태 업데이트
  useEffect(() => {
    setSidebarOpen(isOpenProp)
  }, [isOpenProp])

  // 서브메뉴 상태 관리 - 사용자 의도 존중
  useEffect(() => {
    console.log('서브메뉴 상태 업데이트:', { isOpenProp, tab, subMenuOpen, tabName, userClosedSubmenu })
    
    // 탭 변경 시에만 상태 업데이트
    if (tab && tab !== tabName) {
      setTabName(tab)
      setUserClosedSubmenu(false)  // 새 탭으로 변경 시 닫힘 상태 초기화
      if (isOpenProp !== undefined) {
        setSubMenuOpen(isOpenProp)
      }
    }
    // 같은 탭에서 isOpenProp 변경 시, 사용자가 닫지 않았을 때만 반영
    else if (tab === tabName && isOpenProp !== undefined && !userClosedSubmenu) {
      setSubMenuOpen(isOpenProp)
    }
  }, [isOpenProp, tab, tabName, userClosedSubmenu])

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (subMenuOpen) {
          setSubMenuOpen(false)
          onClose?.()
        } else if (isMobile && sidebarOpen) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [subMenuOpen, sidebarOpen, isMobile, onClose])

  // 포커스 트랩
  useEffect(() => {
    if (!sidebarOpen || !isMobile) return

    const sidebar = sidebarRef.current
    if (!sidebar) return

    const focusableElements = sidebar.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (firstElement) {
      firstFocusableRef.current = firstElement
      firstElement.focus()
    }
    if (lastElement) {
      lastFocusableRef.current = lastElement
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    sidebar.addEventListener('keydown', handleTabKey)
    return () => sidebar.removeEventListener('keydown', handleTabKey)
  }, [sidebarOpen, isMobile])

  const handleMenuClick = (menuType: string) => {
    if (tabName === menuType && subMenuOpen) {
      setSubMenuOpen(false)
      setUserClosedSubmenu(true)
      onClose?.()
    } else {
      setTabName(menuType)
      setSubMenuOpen(true)
      setUserClosedSubmenu(false)
      onMenuClick?.(menuType)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    onLogout?.()
    router.push('/login')
  }

  const handleNavigate = (path: string) => {
    setSubMenuOpen(false)
    router.push(path)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const isActive = (path?: string) => {
    return path && pathname === path && !subMenuOpen
  }

  const isVideoPlanningActive = () => {
    return pathname.startsWith('/video-planning')
  }

  // 검색 필터링
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleMobileMenu = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // 디버깅: 렌더링 시마다 상태 확인
  useEffect(() => {
    console.log('🔄 EnhancedSideBar 상태 변경 감지:', { 
      subMenuOpen, 
      tabName, 
      projects: projects.length,
      pathname 
    })
  }, [subMenuOpen, tabName])

  console.log('🎨 EnhancedSideBar 렌더링:', { 
    subMenuOpen, 
    tabName, 
    projects: projects.length,
    pathname 
  })

  return (
    <>
      {/* 모바일 햄버거 메뉴 */}
      {isMobile && (
        <button
          className={styles.hamburger}
          onClick={toggleMobileMenu}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-controls="sidebar-nav"
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      )}

      {/* 모바일 오버레이 */}
      {isMobile && sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          data-testid="sidebar-overlay"
        />
      )}

      {/* 메인 사이드바 */}
      <aside
        ref={sidebarRef}
        id="sidebar-nav"
        className={`${styles.sideBar} ${sidebarOpen ? styles.open : ''}`}
        aria-label={ariaLabel}
        role="navigation"
        data-open={sidebarOpen}
      >
        {/* 브레드크럼 */}
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumbs} aria-label="브레드크럼">
            <ol>
              {breadcrumbs.map((item, index) => (
                <li
                  key={index}
                  aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                >
                  {item.path && index < breadcrumbs.length - 1 ? (
                    <a
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault()
                        handleNavigate(item.path!)
                      }}
                      role="link"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className={styles.separator} aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* 검색바 */}
        {searchable && (
          <div className={styles.searchBar}>
            <input
              type="search"
              role="searchbox"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="메뉴 검색"
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearButton}
                aria-label="검색어 지우기"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* 메뉴 아이템 */}
        <nav className={styles.navigation}>
          <ul role="list">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <li key={item.id} role="listitem">
                  <button
                    className={`${styles.menuItem} ${
                      (item.path && isActive(item.path)) ||
                      (item.id === 'video-planning' && isVideoPlanningActive()) ||
                      (subMenuOpen && tabName === item.id)
                        ? styles.active
                        : ''
                    }`}
                    onClick={() => {
                      if (item.path) {
                        handleNavigate(item.path)
                      } else {
                        handleMenuClick(item.id)
                      }
                    }}
                    aria-label={item.ariaLabel || item.label}
                    aria-current={
                      (item.path && isActive(item.path)) ||
                      (item.id === 'video-planning' && isVideoPlanningActive())
                        ? 'page'
                        : undefined
                    }
                  >
                    {item.icon && <span className={styles.icon}>{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span 
                        className={styles.badge}
                        aria-label={`프로젝트 ${item.badge}개`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))
            ) : (
              <li className={styles.noResults}>검색 결과가 없습니다</li>
            )}
          </ul>
        </nav>

        {/* 로그아웃 버튼 */}
        <button 
          className={styles.logout} 
          onClick={handleLogout}
          aria-label="로그아웃"
        >
          로그아웃
        </button>
      </aside>

      {/* 서브메뉴 */}
      <div 
        className={`${styles.submenu} ${subMenuOpen ? styles.active : ''}`}
        role="complementary"
        aria-label="서브메뉴"
        aria-hidden={!subMenuOpen}
        data-testid="submenu"
        data-open={subMenuOpen}
        data-tab={tabName}
      >
        <div className={styles.submenuHeader}>
          <h2 className={styles.submenuTitle}>
            {tabName === 'feedback' ? '영상 피드백' : 
             tabName === 'video-planning' ? '영상 기획' : '프로젝트 관리'}
          </h2>
          <div className={styles.submenuActions}>
            {tabName === 'project' && projects.length > 0 && (
              <button
                onClick={() => handleNavigate('/projects/create')}
                className={styles.addButton}
                aria-label="프로젝트 추가"
              >
                +
              </button>
            )}
            <button
              onClick={() => {
                setSubMenuOpen(false)
                setUserClosedSubmenu(true)  // 사용자가 명시적으로 닫음 표시
                onClose?.()
              }}
              className={styles.closeButton}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        <nav className={styles.submenuNav}>
          <ul>
            {tabName === 'video-planning' ? (
              <>
                <li>
                  <button
                    onClick={() => handleNavigate('/video-planning/ai')}
                    className={pathname === '/video-planning/ai' ? styles.active : ''}
                  >
                    <span className={styles.submenuIcon}></span>
                    AI 기획
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('/video-planning/history')}
                    className={pathname === '/video-planning/history' ? styles.active : ''}
                  >
                    <span className={styles.submenuIcon}></span>
                    기획서 관리
                  </button>
                </li>
              </>
            ) : (
              projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => {
                      if (tabName === 'project') {
                        handleNavigate(`/projects/${project.id}`)
                      } else {
                        handleNavigate(`/feedback/${project.id}`)
                      }
                    }}
                  >
                    <span className={styles.submenuIcon}></span>
                    {project.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </nav>

        {/* 빈 상태 메시지 */}
        {tabName === 'video-planning' ? (
          <div className={styles.emptyState}>
            <p>AI 영상 기획으로<br />빠르게 시작하세요</p>
            <button
              onClick={() => handleNavigate('/video-planning/ai')}
              className={styles.ctaButton}
            >
              AI 기획 시작
            </button>
          </div>
        ) : (
          projects.length === 0 && (
            <div className={styles.emptyState}>
              <p>등록된<br />프로젝트가 없습니다</p>
              <button
                onClick={() => handleNavigate('/projects/create')}
                className={styles.ctaButton}
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