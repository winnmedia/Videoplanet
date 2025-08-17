import { useState, useEffect } from 'react'

export interface DashboardData {
  projectProgress: {
    total: number
    active: number
    completed: number
    pending: number
  }
  invitationStatus: {
    total: number
    pending: number
    accepted: number
    rejected: number
  }
  feedbackStatus: {
    total: number
    unread: number
    replied: number
    pending: number
    thisWeek: number
  }
}

export interface UseDashboardReturn {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// 실제 API 호출 함수 (구현 필요)
const fetchDashboardData = (): Promise<DashboardData> => {
  return new Promise((resolve, reject) => {
    // TODO: 실제 API 엔드포인트로 데이터 호출
    // 현재는 빈 데이터 반환
    resolve({
      projectProgress: {
        total: 0,
        active: 0,
        completed: 0,
        pending: 0
      },
      invitationStatus: {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0
      },
      feedbackStatus: {
        total: 0,
        unread: 0,
        replied: 0,
        pending: 0,
        thisWeek: 0
      }
    })
  })
}

export const useDashboard = (): UseDashboardReturn => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const dashboardData = await fetchDashboardData()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      console.error('Dashboard data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch
  }
}

// 개별 위젯용 훅들
export const useProjectProgress = () => {
  const { data, isLoading, error, refetch } = useDashboard()
  
  return {
    data: data?.projectProgress,
    isLoading,
    error,
    refetch
  }
}

export const useInvitationStatus = () => {
  const { data, isLoading, error, refetch } = useDashboard()
  
  return {
    data: data?.invitationStatus,
    isLoading,
    error,
    refetch
  }
}

export const useFeedbackStatus = () => {
  const { data, isLoading, error, refetch } = useDashboard()
  
  return {
    data: data?.feedbackStatus,
    isLoading,
    error,
    refetch
  }
}