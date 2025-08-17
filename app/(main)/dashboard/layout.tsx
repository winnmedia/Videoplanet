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
    <>
      {children}
    </>
  )
}