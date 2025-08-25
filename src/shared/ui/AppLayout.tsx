'use client'

import { ReactNode, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from './Header'
import { EnhancedSideBar } from './EnhancedSideBar'
import styles from './AppLayout.module.scss'

export interface AppLayoutProps {
  children: ReactNode
  user?: {
    name: string
    email: string
  }
  showSidebar?: boolean
  showHeader?: boolean
}

export function AppLayout({ 
  children, 
  user, 
  showSidebar = true, 
  showHeader = true 
}: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [sidebarState, setSidebarState] = useState({
    tab: '',
    on_menu: false
  })

  useEffect(() => {
    // 현재 경로에 따라 초기 탭 설정
    if (pathname.includes('/feedback')) {
      setSidebarState({ tab: 'feedback', on_menu: true })
    } else if (pathname.includes('/projects')) {
      setSidebarState({ tab: 'project', on_menu: true })
    } else if (pathname.includes('/video-planning')) {
      setSidebarState({ tab: 'video-planning', on_menu: true })
    } else {
      setSidebarState({ tab: '', on_menu: false })
    }
  }, [pathname])

  useEffect(() => {
    // 프로젝트 목록 로드 (실제 구현에서는 API 호출)
    const loadProjects = async () => {
      try {
        // Mock data - 실제로는 API에서 가져와야 함
        const mockProjects = [
          { id: 1, name: '브랜드 홍보영상', status: 'active' },
          { id: 2, name: '제품 소개 영상', status: 'active' },
          { id: 3, name: '기업 소개 영상', status: 'completed' }
        ]
        setProjects(mockProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }

    if (user) {
      loadProjects()
    }
  }, [user])

  const handleMenuClick = (menuType: string) => {
    setSidebarState({
      tab: menuType,
      on_menu: true
    })
  }

  const handleCloseSubmenu = () => {
    setSidebarState({
      tab: '',
      on_menu: false
    })
  }

  return (
    <div className={`${styles.appLayout} ${sidebarState.on_menu ? 'has-open-submenu' : ''}`} data-testid="app-layout">
      {showHeader && <Header user={user} />}
      <div className={styles.layoutContent}>
        {showSidebar && (
          <EnhancedSideBar
            tab={sidebarState.tab}
            isOpen={sidebarState.on_menu}
            projects={projects}
            onMenuClick={handleMenuClick}
            onClose={handleCloseSubmenu}
          />
        )}
        <main className={`${styles.mainContent} ${sidebarState.on_menu ? styles.withSubmenu : ''}`} data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}