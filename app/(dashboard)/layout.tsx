'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import './DashboardLayout.scss'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 간단한 인증 체크
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // localStorage에서 세션 체크
        const sessionData = window.localStorage.getItem('VGID')
        
        if (!sessionData) {
          // 인증되지 않은 경우 로그인 페이지로 리다이렉트
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

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" aria-label="로딩 중"></div>
        <p>인증 확인 중...</p>
      </div>
    )
  }

  // 인증되지 않은 경우 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null
  }

  // 로그아웃 핸들러
  const handleLogout = () => {
    try {
      // 로컬 스토리지에서 세션 정보 제거
      window.localStorage.removeItem('VGID')
      
      // 로그인 페이지로 리다이렉트
      router.replace('/login')
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
    }
  }

  return (
    <div className="dashboard-layout">
      {/* 간단한 헤더 */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo" onClick={() => router.push('/dashboard')}>
              <h1>VideoPlanet</h1>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-profile">
              <button
                onClick={() => router.push('/settings')}
                className="settings-btn"
                aria-label="설정"
              >
                ⚙️ 설정
              </button>
              <button
                onClick={handleLogout}
                className="logout-btn"
                aria-label="로그아웃"
              >
                🚪 로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <div className="dashboard-content">
        {children}
      </div>

      {/* 접근성을 위한 스킵 네비게이션 */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        onFocus={(e) => e.target.focus()}
      >
        메인 콘텐츠로 건너뛰기
      </a>
    </div>
  )
}