'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarProps {
  tab?: string
  onMenu?: boolean
  onTabChange?: (tab: string) => void
}

export default function Sidebar({ tab, onMenu, onTabChange }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  useEffect(() => {
    if (tab) {
      setActiveSubmenu(tab)
    }
  }, [tab])

  const menuItems = [
    { id: 'home', label: '홈', path: '/dashboard', icon: '[홈]' },
    { id: 'calendar', label: '전체 일정', path: '/calendar', icon: '[달력]' },
    { id: 'project', label: '프로젝트 관리', icon: '[프로젝트]', hasSubmenu: true },
    { id: 'feedback', label: '영상 피드백', icon: '[피드백]', hasSubmenu: true }
  ]

  const handleMenuClick = (item: any) => {
    if (item.hasSubmenu) {
      const newTab = activeSubmenu === item.id ? null : item.id
      setActiveSubmenu(newTab)
      if (onTabChange) {
        onTabChange(newTab || '')
      }
    } else if (item.path) {
      router.push(item.path)
    }
  }

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>Planet</h2>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick(item)
              }}
              className={pathname === item.path ? 'active' : ''}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.hasSubmenu && (
                <span style={{ marginLeft: 'auto' }}>
                  {activeSubmenu === item.id ? '▼' : '▶'}
                </span>
              )}
            </a>

            {item.hasSubmenu && activeSubmenu === item.id && (
              <ul className="submenu" style={{ paddingLeft: '20px', marginTop: '10px' }}>
                {item.id === 'project' && (
                  <>
                    <li style={{ marginBottom: '10px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push('/projects')
                        }}
                        style={{
                          display: 'block',
                          padding: '10px',
                          color: '#666',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.color = '#1631F8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#666'
                        }}
                      >
                        프로젝트 목록
                      </a>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push('/projects/create')
                        }}
                        style={{
                          display: 'block',
                          padding: '10px',
                          color: '#666',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.color = '#1631F8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#666'
                        }}
                      >
                        새 프로젝트
                      </a>
                    </li>
                  </>
                )}
                {item.id === 'feedback' && (
                  <>
                    <li style={{ marginBottom: '10px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push('/feedback')
                        }}
                        style={{
                          display: 'block',
                          padding: '10px',
                          color: '#666',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.color = '#1631F8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#666'
                        }}
                      >
                        피드백 목록
                      </a>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push('/feedback/create')
                        }}
                        style={{
                          display: 'block',
                          padding: '10px',
                          color: '#666',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.color = '#1631F8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#666'
                        }}
                      >
                        새 피드백
                      </a>
                    </li>
                  </>
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <button className="sidebar-toggle" onClick={handleToggle}>
        {isCollapsed ? '→' : '←'}
      </button>
    </aside>
  )
}