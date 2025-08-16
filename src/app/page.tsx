'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { refetchProject } from '../utils/util'

export default function HomePage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    refetchProject(dispatch, router)
  }, [dispatch, router])

  useEffect(() => {
    // 홈페이지에서 대시보드로 리다이렉트
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div>
      {/* Next.js App Router가 라우팅을 처리합니다 */}
    </div>
  )
}