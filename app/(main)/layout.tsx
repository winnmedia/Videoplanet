'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import MainSidebar from './components/MainSidebar'
import './dashboard/CmsHome.scss'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarTab, setSidebarTab] = useState('')

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check both localStorage and cookie for session
        const sessionData = window.localStorage.getItem('VGID')
        const cookieSession = document.cookie
          .split('; ')
          .find(row => row.startsWith('VGID='))
          ?.split('=')[1]
        
        if (!sessionData && !cookieSession) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('인증 체크 중 오류:', error)
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [router, pathname])

  // Handle logout
  const handleLogout = () => {
    try {
      // Clear both localStorage and cookies
      window.localStorage.removeItem('VGID')
      document.cookie = 'VGID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      router.replace('/login')
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner" aria-label="로딩 중"></div>
        <p>인증 확인 중...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Dashboard page has its own layout
  if (pathname === '/dashboard') {
    return <>{children}</>
  }

  // All other pages use the common sidebar
  return (
    <>
      <MainSidebar />
      <div className={`with-sidebar`}>
        {children}
      </div>
    </>
  )
}