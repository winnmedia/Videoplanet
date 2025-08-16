'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './Dashboard.scss'

interface Project {
  id: string
  name: string
  status: 'active' | 'completed' | 'pending'
  progress: number
  lastUpdate: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 사용자 정보 로드
    const loadUserData = () => {
      try {
        const sessionData = window.localStorage.getItem('VGID')
        if (sessionData) {
          const userData = JSON.parse(sessionData)
          setUserName(userData.name || userData.email || '사용자')
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }

    // 프로젝트 목록 로드 (임시 데이터)
    const loadProjects = () => {
      // 실제로는 API를 통해 데이터를 가져와야 함
      const sampleProjects: Project[] = [
        {
          id: '1',
          name: '샘플 프로젝트 1',
          status: 'active',
          progress: 65,
          lastUpdate: '2025-01-16'
        },
        {
          id: '2',
          name: '샘플 프로젝트 2',
          status: 'completed',
          progress: 100,
          lastUpdate: '2025-01-15'
        },
        {
          id: '3',
          name: '샘플 프로젝트 3',
          status: 'pending',
          progress: 0,
          lastUpdate: '2025-01-14'
        }
      ]
      setProjects(sampleProjects)
      setIsLoading(false)
    }

    loadUserData()
    loadProjects()
  }, [])

  const getStatusLabel = (status: Project['status']) => {
    const labels = {
      active: '진행 중',
      completed: '완료',
      pending: '대기 중'
    }
    return labels[status]
  }

  const getStatusClass = (status: Project['status']) => {
    return `status-${status}`
  }

  if (isLoading) {
    return (
      <div className="dashboard-page-loading">
        <div className="spinner"></div>
        <p>대시보드를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page" id="main-content">
      <div className="dashboard-container">
        {/* 환영 메시지 */}
        <section className="welcome-section">
          <h1>안녕하세요, {userName}님!</h1>
          <p>VideoPlanet 대시보드에 오신 것을 환영합니다.</p>
        </section>

        {/* 빠른 액션 버튼들 */}
        <section className="quick-actions">
          <h2>빠른 시작</h2>
          <div className="action-buttons">
            <button 
              onClick={() => router.push('/projects/create')}
              className="action-btn primary"
            >
              ➕ 새 프로젝트 만들기
            </button>
            <button 
              onClick={() => router.push('/projects')}
              className="action-btn"
            >
              📂 프로젝트 목록
            </button>
            <button 
              onClick={() => router.push('/calendar')}
              className="action-btn"
            >
              📅 캘린더 보기
            </button>
            <button 
              onClick={() => router.push('/feedback')}
              className="action-btn"
            >
              💬 피드백 관리
            </button>
          </div>
        </section>

        {/* 프로젝트 요약 */}
        <section className="projects-summary">
          <h2>최근 프로젝트</h2>
          {projects.length > 0 ? (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <span className={`project-status ${getStatusClass(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <div className="project-body">
                    <div className="progress-section">
                      <div className="progress-label">
                        <span>진행률</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="project-footer">
                      <span className="last-update">
                        마지막 업데이트: {project.lastUpdate}
                      </span>
                      <button 
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="view-btn"
                      >
                        자세히 보기 →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-projects">
              <p>아직 프로젝트가 없습니다.</p>
              <button 
                onClick={() => router.push('/projects/create')}
                className="create-btn"
              >
                첫 프로젝트 만들기
              </button>
            </div>
          )}
        </section>

        {/* 통계 섹션 */}
        <section className="stats-section">
          <h2>활동 통계</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">전체 프로젝트</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="stat-label">완료된 프로젝트</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-value">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="stat-label">진행 중</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-value">
                  {projects.filter(p => p.status === 'pending').length}
                </div>
                <div className="stat-label">대기 중</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}