'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface InvitationData {
  total: number
  pending: number
  accepted: number
  rejected: number
}

interface InvitationStatusWidgetProps {
  data?: InvitationData | undefined
  isLoading?: boolean
  error?: string | null
}

export default function InvitationStatusWidget({ 
  data, 
  isLoading = false, 
  error 
}: InvitationStatusWidgetProps) {
  const router = useRouter()
  const [animatedData, setAnimatedData] = useState<InvitationData>({ 
    total: 0, 
    pending: 0, 
    accepted: 0, 
    rejected: 0 
  })

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
          pending: Math.round(data.pending * progress),
          accepted: Math.round(data.accepted * progress),
          rejected: Math.round(data.rejected * progress)
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

  const getAcceptanceRate = () => {
    if (!data || data.total === 0) return 0
    return Math.round((data.accepted / data.total) * 100)
  }

  if (error) {
    return (
      <div className="widget-container widget-error" onClick={handleWidgetClick}>
        <div className="widget-header">
          <h3>프로젝트 초대 현황</h3>
          <div className="widget-icon">[USERS]</div>
        </div>
        <div className="error-message">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="widget-container invitation-status-widget" onClick={handleWidgetClick}>
      <div className="widget-header">
        <h3>프로젝트 초대 현황</h3>
        <div className="widget-icon">[USERS]</div>
      </div>
      
      <div className="widget-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-item large"></div>
            <div className="skeleton-grid">
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          </div>
        ) : (
          <div className="invitation-stats">
            <div className="main-stat">
              <div className="acceptance-rate">
                <span className="rate-value">{getAcceptanceRate()}%</span>
                <span className="rate-label">수락률</span>
              </div>
            </div>
            
            <div className="sub-stats">
              <div className="stat-item pending">
                <div className="stat-label">대기중</div>
                <div className="stat-value">{animatedData.pending}</div>
              </div>
              <div className="stat-item accepted">
                <div className="stat-label">수락</div>
                <div className="stat-value">{animatedData.accepted}</div>
              </div>
              <div className="stat-item rejected">
                <div className="stat-label">거절</div>
                <div className="stat-value">{animatedData.rejected}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="widget-footer">
        <span>클릭하여 초대 관리로 이동</span>
      </div>
    </div>
  )
}