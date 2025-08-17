'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import './MainSidebar.scss'

interface MainSidebarProps {
  isOpen?: boolean
}

interface Project {
  id: string
  name: string
  status: string
}

export default function MainSidebar({ isOpen = true }: MainSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(!isOpen)

  // TODO: 실제 프로젝트 데이터를 API에서 가져와야 함
  const projects: Project[] = []

  const menuItems = [
    { 
      id: 'home', 
      label: '홈', 
      path: '/dashboard', 
      icon: '홈' 
    },
    { 
      id: 'planning', 
      label: '영상 기획', 
      path: '/planning', 
      icon: '기획',
      description: 'AI 기반 영상 기획서 작성'
    },
    { 
      id: 'calendar', 
      label: '전체 일정', 
      path: '/calendar', 
      icon: '캘린더' 
    },
    { 
      id: 'project', 
      label: '프로젝트 관리', 
      icon: '프로젝트', 
      hasSubmenu: true,
      submenuItems: [
        { id: 'project-list', label: '프로젝트 목록', path: '/projects' },
        { id: 'project-create', label: '새 프로젝트', path: '/projects/create' }
      ]
    },
    { 
      id: 'feedback', 
      label: '영상 피드백', 
      icon: '피드백', 
      hasSubmenu: true,
      submenuItems: projects.map(p => ({
        id: `feedback-${p.id}`,
        label: p.name,
        path: `/feedback/${p.id}`
      }))
    }
  ]

  const handleMenuClick = (item: any) => {
    if (item.hasSubmenu) {
      // 서브메뉴 토글
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id)
    } else if (item.path) {
      // 페이지 이동
      router.push(item.path)
      setActiveSubmenu(null)
    }
  }

  const handleSubmenuClick = (subItem: any) => {
    router.push(subItem.path)
  }

  const handleLogout = () => {
    try {
      window.localStorage.removeItem('VGID')
      document.cookie = 'VGID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      router.replace('/login')
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
    }
  }

  // 현재 경로에 따라 활성 메뉴 설정
  useEffect(() => {
    if (pathname?.startsWith('/projects')) {
      setActiveSubmenu('project')
    } else if (pathname?.startsWith('/feedback')) {
      setActiveSubmenu('feedback')
    }
  }, [pathname])

  return (
    <>
      <aside className={`main-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2 onClick={() => router.push('/dashboard')}>Planet</h2>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleMenuClick(item)
                  }}
                  className={`nav-link ${pathname === item.path ? 'active' : ''} ${
                    item.hasSubmenu && activeSubmenu === item.id ? 'expanded' : ''
                  }`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.hasSubmenu && (
                    <span className="nav-arrow">
                      {activeSubmenu === item.id ? '▼' : '▶'}
                    </span>
                  )}
                </a>

                {/* 서브메뉴 */}
                {item.hasSubmenu && activeSubmenu === item.id && item.submenuItems && (
                  <ul className="submenu">
                    {item.submenuItems.map((subItem) => (
                      <li key={subItem.id} className="submenu-item">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSubmenuClick(subItem)
                          }}
                          className={`submenu-link ${
                            pathname === subItem.path ? 'active' : ''
                          }`}
                        >
                          {subItem.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>

        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </aside>

      {/* 서브메뉴 패널 (프로젝트 목록 표시용) */}
      {activeSubmenu === 'project' && !isCollapsed && (
        <div className="submenu-panel">
          <div className="panel-header">
            <h3>프로젝트 목록</h3>
            <button 
              onClick={() => router.push('/projects/create')}
              className="create-btn"
            >
              + 새 프로젝트
            </button>
          </div>
          
          <div className="project-list">
            {projects.length > 0 ? (
              projects.map(project => (
                <div 
                  key={project.id} 
                  className="project-item"
                  onClick={() => router.push(`/projects/${project.id}/view`)}
                >
                  <div className={`project-status ${project.status}`} />
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <span className="project-meta">
                      {project.status === 'active' && '진행 중'}
                      {project.status === 'completed' && '완료'}
                      {project.status === 'pending' && '대기 중'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>프로젝트가 없습니다</p>
                <button 
                  onClick={() => router.push('/projects/create')}
                  className="create-first-btn"
                >
                  첫 프로젝트 만들기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 피드백 패널 */}
      {activeSubmenu === 'feedback' && !isCollapsed && (
        <div className="submenu-panel">
          <div className="panel-header">
            <h3>영상 피드백</h3>
          </div>
          
          <div className="project-list">
            {projects.length > 0 ? (
              projects.map(project => (
                <div 
                  key={project.id} 
                  className="project-item"
                  onClick={() => router.push(`/feedback/${project.id}`)}
                >
                  <div className={`project-status ${project.status}`} />
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <span className="project-meta">피드백 관리</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>프로젝트가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}