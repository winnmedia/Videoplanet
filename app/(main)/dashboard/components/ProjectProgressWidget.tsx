'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface ProjectData {
  total: number
  active: number
  completed: number
  pending: number
}

interface ProjectProgressWidgetProps {
  data?: ProjectData | undefined
  isLoading?: boolean
  error?: string | null
}

export default function ProjectProgressWidget({ 
  data, 
  isLoading = false, 
  error 
}: ProjectProgressWidgetProps) {
  const router = useRouter()
  const [animatedData, setAnimatedData] = useState<ProjectData>({ total: 0, active: 0, completed: 0, pending: 0 })

  // 숫자 애니메이션 효과
  useEffect(() => {
    if (data && !isLoading) {
      const duration = 1000
      const steps = 30
      const stepTime = duration / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps

        setAnimatedData({
          total: Math.round(data.total * progress),
          active: Math.round(data.active * progress),
          completed: Math.round(data.completed * progress),
          pending: Math.round(data.pending * progress)
        })

        if (currentStep >= steps) {
          clearInterval(timer)
          setAnimatedData(data)
        }
      }, stepTime)

      return () => clearInterval(timer)
    }
  }, [data, isLoading])

  const handleWidgetClick = () => {
    router.push('/projects')
  }

  if (error) {
    return (
      <div className="widget-container widget-error" onClick={handleWidgetClick}>
        <div className="widget-header">
          <h3>프로젝트 진행현황</h3>
          <div className="widget-icon">[프로젝트]</div>
        </div>
        <div className="error-message">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="widget-container project-progress-widget" onClick={handleWidgetClick}>
      <div className="widget-header">
        <h3>프로젝트 진행현황</h3>
        <div className="widget-icon">[프로젝트]</div>
      </div>
      
      <div className="widget-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
          </div>
        ) : (
          <div className="progress-stats">
            <div className="stat-item primary">
              <div className="stat-label">전체 프로젝트</div>
              <div className="stat-value">{animatedData.total}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">진행중</div>
              <div className="stat-value">{animatedData.active}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">완료</div>
              <div className="stat-value">{animatedData.completed}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">대기중</div>
              <div className="stat-value">{animatedData.pending}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="widget-footer">
        <span>클릭하여 프로젝트 관리로 이동</span>
      </div>
    </div>
  )
}