'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './MinimalDashboard.scss'

interface DashboardStats {
  inProgress: number
  pendingFeedback: number
  dueToday: number
}

interface ProjectProgress {
  id: string
  name: string
  progress: number
  daysLeft: number
}

export default function MinimalDashboard() {
  const router = useRouter()
  
  // 상태 관리
  const [stats, setStats] = useState<DashboardStats>({
    inProgress: 3,
    pendingFeedback: 7,
    dueToday: 2
  })
  
  const [projects, setProjects] = useState<ProjectProgress[]>([
    { id: '1', name: 'A사 광고 영상', progress: 80, daysLeft: 3 },
    { id: '2', name: 'B사 제품 소개', progress: 60, daysLeft: 7 },
    { id: '3', name: 'C사 브랜드 필름', progress: 30, daysLeft: 14 }
  ])

  // 프로젝트 보기 (Fitts 법칙: 큰 터치 영역)
  const handleViewProjects = () => {
    router.push('/projects')
  }

  // 프로젝트 상세 보기
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}/view`)
  }

  return (
    <div className="minimal-dashboard">
      {/* 헤더 (위계: 최상위) */}
      <header className="dashboard-header">
        <h1 className="logo">Planet</h1>
        <div className="user-info">
          <span className="user-name">김영희 PM</span>
        </div>
      </header>

      <main className="dashboard-content">
        {/* 오늘의 현황 (핵심 정보) */}
        <section className="stats-section" role="region" aria-label="오늘의 현황">
          <h2 className="section-title">오늘의 현황</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <dt className="stat-label">진행 중</dt>
              <dd className="stat-value">{stats.inProgress}건</dd>
            </div>
            
            <div className="stat-card">
              <dt className="stat-label">피드백 대기</dt>
              <dd className="stat-value stat-value--warning">{stats.pendingFeedback}건</dd>
            </div>
            
            <div className="stat-card">
              <dt className="stat-label">금일 마감</dt>
              <dd className="stat-value stat-value--urgent">{stats.dueToday}건</dd>
            </div>
          </div>
        </section>

        {/* 프로젝트 진행률 (시각적 피드백) */}
        <section className="progress-section" role="region" aria-label="프로젝트 진행률">
          <h2 className="section-title">프로젝트 진행률</h2>
          
          <ul className="project-list" role="list">
            {projects.map((project) => (
              <li key={project.id} className="project-item">
                <button
                  className="project-button"
                  onClick={() => handleProjectClick(project.id)}
                  aria-label={`${project.name} 상세 보기`}
                >
                  <div className="project-info">
                    <h3 className="project-name">{project.name}</h3>
                    <div className="project-meta">
                      <span className="project-progress-text">{project.progress}%</span>
                      <span className={`project-deadline ${project.daysLeft <= 3 ? 'project-deadline--urgent' : ''}`}>
                        D-{project.daysLeft}
                      </span>
                    </div>
                  </div>
                  
                  <div className="progress-bar" role="progressbar" 
                       aria-valuenow={project.progress} 
                       aria-valuemin={0} 
                       aria-valuemax={100}>
                    <div className="progress-fill" 
                         style={{ width: `${project.progress}%` }}></div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 주요 액션 (단일 CTA) */}
        <div className="action-section">
          <button 
            className="btn-primary"
            onClick={handleViewProjects}
            aria-label="모든 프로젝트 보기"
          >
            프로젝트 보기
          </button>
        </div>
      </main>
    </div>
  )
}