'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface FeedbackData {
  total: number
  unread: number
  replied: number
  pending: number
  thisWeek: number
}

interface FeedbackStatusWidgetProps {
  data?: FeedbackData | undefined
  isLoading?: boolean
  error?: string | null
}

export default function FeedbackStatusWidget({ 
  data, 
  isLoading = false, 
  error 
}: FeedbackStatusWidgetProps) {
  const router = useRouter()
  const [animatedData, setAnimatedData] = useState<FeedbackData>({ 
    total: 0, 
    unread: 0, 
    replied: 0, 
    pending: 0,
    thisWeek: 0
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
          unread: Math.round(data.unread * progress),
          replied: Math.round(data.replied * progress),
          pending: Math.round(data.pending * progress),
          thisWeek: Math.round(data.thisWeek * progress)
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
    router.push('/feedback')
  }

  const getResponseRate = () => {
    if (!data || data.total === 0) return 0
    return Math.round((data.replied / data.total) * 100)
  }

  if (error) {
    return (
      <div className="widget-container widget-error" onClick={handleWidgetClick}>
        <div className="widget-header">
          <h3>등록된 피드백 현황</h3>
          <div className="widget-icon">[피드백]</div>
        </div>
        <div className="error-message">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="widget-container feedback-status-widget" onClick={handleWidgetClick}>
      <div className="widget-header">
        <h3>등록된 피드백 현황</h3>
        <div className="widget-icon">[피드백]</div>
      </div>
      
      <div className="widget-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-item large"></div>
            <div className="skeleton-grid">
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          </div>
        ) : (
          <div className="feedback-stats">
            <div className="main-stat">
              <div className="weekly-highlight">
                <span className="week-value">{animatedData.thisWeek}</span>
                <span className="week-label">이번 주 피드백</span>
              </div>
            </div>
            
            <div className="sub-stats">
              <div className="stat-item unread">
                <div className="stat-label">미확인</div>
                <div className="stat-value">{animatedData.unread}</div>
              </div>
              <div className="stat-item pending">
                <div className="stat-label">답변대기</div>
                <div className="stat-value">{animatedData.pending}</div>
              </div>
              <div className="stat-item replied">
                <div className="stat-label">답변완료</div>
                <div className="stat-value">{animatedData.replied}</div>
              </div>
              <div className="stat-item total">
                <div className="stat-label">전체</div>
                <div className="stat-value">{animatedData.total}</div>
              </div>
            </div>
            
            <div className="response-rate">
              <div className="rate-bar">
                <div 
                  className="rate-fill" 
                  style={{ width: `${getResponseRate()}%` }}
                ></div>
              </div>
              <span className="rate-text">답변률 {getResponseRate()}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="widget-footer">
        <span>클릭하여 피드백 관리로 이동</span>
      </div>
    </div>
  )
}