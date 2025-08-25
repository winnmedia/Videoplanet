'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/shared/ui/AppLayout'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { Button } from '@/shared/ui/Button/Button'
import { Icon } from '@/shared/ui/Icon/Icon'
import { useDashboardData } from '@/shared/hooks/useDashboardData'
import { useWebSocket, webSocketService } from '@/shared/services/websocket-native.service'
import { debounce, throttle } from '@/shared/utils/performance'
import { TestSubmenu } from './test-submenu'
import styles from './Dashboard.module.scss'

// 타입 정의
interface FeedbackNotification {
  id: string
  type: 'new_feedback' | 'reply' | 'mention'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
  projectName: string
  author: string
}

interface ProjectNotification {
  id: string
  type: 'invitation' | 'deadline' | 'status_change'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  projectName: string
  actionRequired?: boolean
}

interface ProjectProgress {
  id: string
  name: string
  progress: number
  status: 'on_track' | 'delayed' | 'completed'
  dueDate: Date
  phase: 'planning' | 'shooting' | 'editing' | 'review'
}

interface ProjectStats {
  inProgress: number
  completed: number
  thisMonth: number
}

type FilterType = 'all' | 'unread' | 'read'
type SortType = 'date' | 'priority'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const { isConnected } = useWebSocket()
  
  // 대시보드 데이터 Hook 사용
  const {
    feedbackNotifications,
    projectNotifications,
    projectProgress,
    projectStats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useDashboardData(30000) // 30초마다 자동 새로고침
  
  // 필터링 및 정렬 상태
  const [feedbackFilter, setFeedbackFilter] = useState<FilterType>('all')
  const [feedbackSort, setFeedbackSort] = useState<SortType>('date')
  const [projectFilter, setProjectFilter] = useState<FilterType>('all')
  const [projectSort, setProjectSort] = useState<SortType>('date')
  
  // 성능 최적화를 위한 debounced 함수
  const debouncedRefresh = useMemo(
    () => debounce(refresh, 500),
    [refresh]
  )

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        const userData = localStorage.getItem('user')
        if (userData) {
          setUser(JSON.parse(userData))
        } else {
          setUser({
            name: '사용자',
            email: 'user@example.com'
          })
        }

      } catch (error) {
        console.error('Auth check error:', error)
      }
    }

    checkAuth()
  }, [router])

  // 필터링된 알림 목록
  const filteredFeedbackNotifications = useMemo(() => {
    let filtered = [...feedbackNotifications]
    
    // 필터링
    if (feedbackFilter === 'unread') {
      filtered = filtered.filter(n => !n.isRead)
    } else if (feedbackFilter === 'read') {
      filtered = filtered.filter(n => n.isRead)
    }
    
    // 정렬
    if (feedbackSort === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    } else {
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }
    
    return filtered
  }, [feedbackNotifications, feedbackFilter, feedbackSort])
  
  const filteredProjectNotifications = useMemo(() => {
    let filtered = [...projectNotifications]
    
    // 필터링
    if (projectFilter === 'unread') {
      filtered = filtered.filter(n => !n.isRead)
    } else if (projectFilter === 'read') {
      filtered = filtered.filter(n => n.isRead)
    }
    
    // 정렬
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return filtered
  }, [projectNotifications, projectFilter, projectSort])
  
  // 핸들러 함수들
  const handleNotificationClick = useCallback((id: string, type: 'feedback' | 'project') => {
    // 읽음 처리
    markAsRead(id, type).catch(console.error)
    
    // 페이지 이동
    if (type === 'feedback') {
      router.push(`/feedback/${id}`)
    } else {
      router.push(`/projects/${id}`)
    }
  }, [router, markAsRead])

  const handleMarkAsRead = useCallback(async (id: string, type: 'feedback' | 'project') => {
    try {
      await markAsRead(id, type)
    } catch (error) {
      console.error('Failed to mark as read:', error)
      // 사용자에게 에러 표시 (Toast 등)
    }
  }, [markAsRead])

  const handleProjectClick = useCallback((projectId: string) => {
    router.push(`/projects/${projectId}`)
  }, [router])
  
  // 일괄 읽음 처리
  const handleMarkAllAsRead = useCallback(async (type: 'feedback' | 'project') => {
    try {
      await markAllAsRead(type)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      // 사용자에게 에러 표시
    }
  }, [markAllAsRead])
  
  // 알림 삭제
  const handleDeleteNotification = useCallback(async (id: string, type: 'feedback' | 'project') => {
    try {
      await deleteNotification(id, type)
    } catch (error) {
      console.error('Failed to delete notification:', error)
      // 사용자에게 에러 표시
    }
  }, [deleteNotification])

  const getPhaseLabel = (phase: ProjectProgress['phase']) => {
    const labels = {
      planning: '기획',
      shooting: '촬영',
      editing: '편집',
      review: '리뷰'
    }
    return labels[phase]
  }

  const getStatusColor = (status: ProjectProgress['status']) => {
    const colors = {
      on_track: '#28a745',
      delayed: '#dc3545',
      completed: '#6c757d'
    }
    return colors[status]
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff === 0) return '오늘'
    if (diff === 1) return '내일'
    if (diff === -1) return '어제'
    if (diff > 0) return `${diff}일 후`
    return `${Math.abs(diff)}일 전`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return `${Math.floor(diff / 86400)}일 전`
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Icon 
            name="spinner" 
            size="large" 
            spin 
            className={styles.loadingSpinner} 
            aria-label="데이터 로딩 중"
          />
          <p className={styles.loadingText}>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  // 에러 상태
  if (error && !isLoading) {
    return (
      <AppLayout user={user}>
        <div className={styles.errorContainer} data-testid="dashboard-error">
          <div className={styles.errorContent}>
            <Icon 
              name="error" 
              size={48} 
              className={styles.errorIcon}
              aria-hidden="true"
            />
            <h2 className={styles.errorTitle}>연결 오류</h2>
            <p className={styles.errorMessage}>{error}</p>
            <Button
              variant="primary"
              size="large"
              onClick={() => refresh()}
              loading={isLoading}
              icon="spinner"
              iconPosition="left"
              aria-label="데이터 다시 불러오기"
            >
              {isLoading ? '재시도 중...' : '다시 시도'}
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <ErrorBoundary>
      <AppLayout user={user}>
        <TestSubmenu />
        <div className={styles.dashboardContainer} data-testid="dashboard-container">
        <header className={styles.dashboardHeader} data-testid="dashboard-header">
          <h1 className={styles.dashboardTitle}>대시보드</h1>
          <div className={styles.headerInfo}>
            <span className={styles.userName} aria-label="현재 사용자">
              <Icon name="user" size={16} decorative />
              {user?.name || '사용자'}
            </span>
            <span className={styles.todayDate} aria-label="오늘 날짜">
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
          </div>
        </header>

        <main className={styles.dashboardMain} data-testid="dashboard-main">
          {/* 1. 피드백 알림 */}
          <section 
            className={`${styles.dashboardSection} ${styles.notificationSection}`}
            data-testid="feedback-notification-section"
            aria-label="피드백 알림 섹션"
            role="region">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Icon name="comment" size="small" className={styles.icon} decorative />
                피드백 알림
                {isConnected && (
                  <span className={styles.liveIndicator} title="실시간 연결됨">
                    <span className={styles.liveDot}></span>
                    LIVE
                  </span>
                )}
              </h2>
              <span className={styles.badge} data-testid="feedback-unread-count" aria-label="읽지 않은 피드백 알림 개수">
                {feedbackNotifications.filter(n => !n.isRead).length}
              </span>
            </div>
            
            {/* 필터 및 액션 버튼 */}
            <div className={styles.filterActions}>
              <div className={styles.filterGroup}>
                <Button
                  variant={feedbackFilter === 'all' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setFeedbackFilter('all')}
                  data-testid="filter-all-feedback"
                  aria-pressed={feedbackFilter === 'all'}
                  aria-label="모든 피드백 알림 보기"
                >
                  전체
                </Button>
                <Button
                  variant={feedbackFilter === 'unread' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setFeedbackFilter('unread')}
                  data-testid="filter-unread-feedback"
                  aria-pressed={feedbackFilter === 'unread'}
                  aria-label="읽지 않은 피드백 알림만 보기"
                >
                  읽지 않음
                </Button>
                <Button
                  variant={feedbackFilter === 'read' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setFeedbackFilter('read')}
                  data-testid="filter-read-feedback"
                  aria-pressed={feedbackFilter === 'read'}
                  aria-label="읽은 피드백 알림만 보기"
                >
                  읽음
                </Button>
              </div>
              
              <div className={styles.actionGroup}>
                <select 
                  className={styles.sortSelect}
                  value={feedbackSort}
                  onChange={(e) => setFeedbackSort(e.target.value as SortType)}
                  data-testid="sort-feedback"
                  aria-label="정렬 방식"
                >
                  <option value="date">날짜순</option>
                  <option value="priority">우선순위순</option>
                </select>
                
                {feedbackNotifications.some(n => !n.isRead) && (
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => handleMarkAllAsRead('feedback')}
                    data-testid="mark-all-read-feedback"
                    icon="check"
                    iconPosition="left"
                    aria-label="모든 피드백 알림을 읽음으로 표시"
                  >
                    모두 읽음
                  </Button>
                )}
              </div>
            </div>
            
            <div className={styles.notificationList} data-testid="feedback-notification-list" role="list">
              {filteredFeedbackNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`${styles.notificationItem} ${notification.isRead ? styles.read : ''}`}
                  data-testid={`feedback-notification-item-${notification.id}`}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${notification.projectName} 프로젝트의 ${notification.type === 'new_feedback' ? '새 피드백' : notification.type === 'reply' ? '답변' : '멘션'} 알림`}
                  onClick={() => handleNotificationClick(notification.id, 'feedback')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNotificationClick(notification.id, 'feedback')
                    }
                  }}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <span className={`${styles.notificationType} ${styles[notification.priority]}`}>
                        {notification.type === 'new_feedback' && '새 피드백'}
                        {notification.type === 'reply' && '답변'}
                        {notification.type === 'mention' && '멘션'}
                      </span>
                      <span className={styles.notificationTime}>
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <h3 className={styles.notificationTitle}>{notification.projectName}</h3>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <span className={styles.notificationAuthor}>{notification.author}</span>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="small"
                      iconOnly
                      icon="check"
                      className={styles.markAsRead}
                      data-testid={`mark-as-read-${notification.id}`}
                      aria-label={`${notification.projectName} 알림을 읽음으로 표시`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id, 'feedback')
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 2. 프로젝트 알림 */}
          <section 
            className={`${styles.dashboardSection} ${styles.notificationSection}`}
            data-testid="project-notification-section"
            aria-label="프로젝트 알림 섹션"
            role="region">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Icon name="notification" size="small" className={styles.icon} decorative />
                프로젝트 알림
                {isConnected && (
                  <span className={styles.liveIndicator} title="실시간 연결됨">
                    <span className={styles.liveDot}></span>
                    LIVE
                  </span>
                )}
              </h2>
              <span className={styles.badge} data-testid="project-unread-count" aria-label="읽지 않은 프로젝트 알림 개수">
                {projectNotifications.filter(n => !n.isRead).length}
              </span>
            </div>
            
            {/* 필터 및 액션 버튼 */}
            <div className={styles.filterActions}>
              <div className={styles.filterGroup}>
                <Button
                  variant={projectFilter === 'all' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setProjectFilter('all')}
                  data-testid="filter-all-project"
                  aria-pressed={projectFilter === 'all'}
                  aria-label="모든 프로젝트 알림 보기"
                >
                  전체
                </Button>
                <Button
                  variant={projectFilter === 'unread' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setProjectFilter('unread')}
                  data-testid="filter-unread-project"
                  aria-pressed={projectFilter === 'unread'}
                  aria-label="읽지 않은 프로젝트 알림만 보기"
                >
                  읽지 않음
                </Button>
                <Button
                  variant={projectFilter === 'read' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setProjectFilter('read')}
                  data-testid="filter-read-project"
                  aria-pressed={projectFilter === 'read'}
                  aria-label="읽은 프로젝트 알림만 보기"
                >
                  읽음
                </Button>
              </div>
              
              <div className={styles.actionGroup}>
                {projectNotifications.some(n => !n.isRead) && (
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => handleMarkAllAsRead('project')}
                    data-testid="mark-all-read-project"
                    icon="check"
                    iconPosition="left"
                    aria-label="모든 프로젝트 알림을 읽음으로 표시"
                  >
                    모두 읽음
                  </Button>
                )}
              </div>
            </div>
            
            <div className={styles.notificationList} data-testid="project-notification-list" role="list">
              {filteredProjectNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`${styles.notificationItem} ${notification.isRead ? styles.read : ''}`}
                  data-testid={`project-notification-item-${notification.id}`}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${notification.projectName} - ${notification.title}`}
                  onClick={() => handleNotificationClick(notification.id, 'project')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNotificationClick(notification.id, 'project')
                    }
                  }}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <span className={`${styles.notificationType} ${notification.actionRequired ? styles.actionRequired : ''}`}>
                        {notification.type === 'invitation' && '초대'}
                        {notification.type === 'deadline' && '마감'}
                        {notification.type === 'status_change' && '상태 변경'}
                      </span>
                      <span className={styles.notificationTime}>
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <h3 className={styles.notificationTitle}>{notification.title}</h3>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <span className={styles.projectName}>{notification.projectName}</span>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="small"
                      iconOnly
                      icon="check"
                      className={styles.markAsRead}
                      data-testid={`mark-as-read-${notification.id}`}
                      aria-label={`${notification.projectName} 알림을 읽음으로 표시`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id, 'project')
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. 프로젝트 일정 진행상황 */}
          <section 
            className={`${styles.dashboardSection} ${styles.progressSection}`}
            data-testid="project-progress-section"
            aria-label="프로젝트 일정 진행상황 셙션"
            role="region">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Icon name="task" size="small" className={styles.icon} decorative />
                프로젝트 일정 진행상황
              </h2>
            </div>
            
            <div className={styles.progressList} data-testid="progress-list" role="list">
              {projectProgress.map(project => (
                <div 
                  key={project.id}
                  className={styles.progressItem}
                  data-testid={`progress-item-${project.id}`}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${project.name} 프로젝트 - 진행률 ${project.progress}%`}
                  onClick={() => handleProjectClick(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleProjectClick(project.id)
                    }
                  }}
                >
                  <div className={styles.progressHeader}>
                    <h3 className={styles.projectName}>{project.name}</h3>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    >
                      {project.status === 'on_track' && '정상 진행'}
                      {project.status === 'delayed' && '지연'}
                      {project.status === 'completed' && '완료'}
                    </span>
                  </div>
                  
                  <div className={styles.progressInfo}>
                    <div className={styles.progressMeta}>
                      <span className={styles.phase}>
                        <Icon name="clock" size={14} decorative />
                        {getPhaseLabel(project.phase)}
                      </span>
                      <span className={styles.dueDate}>
                        <Icon name="calendar" size={14} decorative />
                        {formatDate(project.dueDate)}
                      </span>
                    </div>
                    
                    <div className={styles.progressBar}>
                      <div className={styles.progressTrack}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${project.progress}%`,
                            backgroundColor: getStatusColor(project.status)
                          }}
                        />
                      </div>
                      <span className={styles.progressPercent}>{project.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. 프로젝트 통계 */}
          <section 
            className={`${styles.dashboardSection} ${styles.statsSection}`}
            data-testid="project-stats-section"
            aria-label="프로젝트 통계 셙션"
            role="region">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Icon name="analytics" size="small" className={styles.icon} decorative />
                프로젝트 통계
              </h2>
            </div>
            
            <div className={styles.statsGrid} data-testid="stats-grid">
              <div className={styles.statCard} data-testid="stat-card-in-progress" tabIndex={0} aria-label="현재 진행 중 프로젝트">
                <div className={styles.statIcon}>
                  <Icon name="play" size="medium" decorative />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>현재 진행 중</span>
                  <span className={styles.statValue}>{projectStats.inProgress}</span>
                </div>
              </div>
              
              <div className={styles.statCard} data-testid="stat-card-completed" tabIndex={0} aria-label="완료된 프로젝트">
                <div className={styles.statIcon}>
                  <Icon name="task" size="medium" decorative />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>완료된 프로젝트</span>
                  <span className={styles.statValue}>{projectStats.completed}</span>
                </div>
              </div>
              
              <div className={styles.statCard} data-testid="stat-card-this-month" tabIndex={0} aria-label="이번 달 프로젝트">
                <div className={styles.statIcon}>
                  <Icon name="calendar" size="medium" decorative />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>이번 달 프로젝트</span>
                  <span className={styles.statValue}>{projectStats.thisMonth}</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      </AppLayout>
    </ErrorBoundary>
  )
}