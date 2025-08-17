'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import './Planning.scss'

// Lazy loading으로 메인 위자드 컴포넌트 분할
const PlanningWizard = lazy(() => import('./components/PlanningWizard'))

// 로딩 컴포넌트
const PlanningLoading = () => (
  <div className="planning-loading">
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h3>AI 영상 기획 도구 로딩 중...</h3>
      <p>잠시만 기다려주세요</p>
    </div>
  </div>
)

interface PlanningProject {
  id?: string
  title: string
  genre: string
  target_audience: string
  tone_manner: string
  duration: string
  budget: string
  purpose: string
  story_structure: string
  development_level: string
  shots?: any[]
  storyboard?: any
  created_at?: string
  updated_at?: string
}

export default function PlanningPage() {
  const searchParams = useSearchParams()
  const isDemoMode = searchParams.get('demo') === 'true'
  const [currentProject, setCurrentProject] = useState<PlanningProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [savedProjects, setSavedProjects] = useState<PlanningProject[]>([])

  // 페이지 로드 시 저장된 프로젝트들 불러오기
  useEffect(() => {
    const storageKey = isDemoMode ? 'demo_planning_projects' : 'planning_projects'
    const storage = isDemoMode ? sessionStorage : localStorage
    
    const saved = storage.getItem(storageKey)
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved))
      } catch (error) {
        console.error('저장된 프로젝트 불러오기 실패:', error)
      }
    }
    
    // 데모 모드일 때 샘플 프로젝트 로드
    if (isDemoMode && !saved) {
      const sampleProject: PlanningProject = {
        id: 'demo-sample-1',
        title: '브랜드 홍보 영상 [데모]',
        genre: '홍보영상',
        target_audience: '20-30대 직장인',
        tone_manner: '친근하고 전문적인',
        duration: '3분',
        budget: '중간 규모',
        purpose: '브랜드 인지도 향상',
        story_structure: '3막 구조',
        development_level: '초급',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setSavedProjects([sampleProject])
      sessionStorage.setItem('demo_planning_projects', JSON.stringify([sampleProject]))
    }
  }, [isDemoMode])

  const handleProjectSave = (project: PlanningProject) => {
    const updatedProject = {
      ...project,
      id: project.id || Date.now().toString(),
      title: isDemoMode && !project.title.includes('[데모]') ? project.title + ' [데모]' : project.title,
      updated_at: new Date().toISOString()
    }

    setCurrentProject(updatedProject)
    
    // 스토리지에 저장 (데모 모드: sessionStorage, 일반 모드: localStorage)
    const storageKey = isDemoMode ? 'demo_planning_projects' : 'planning_projects'
    const storage = isDemoMode ? sessionStorage : localStorage
    
    const existingIndex = savedProjects.findIndex(p => p.id === updatedProject.id)
    let newProjects: PlanningProject[]
    
    if (existingIndex >= 0) {
      newProjects = [...savedProjects]
      newProjects[existingIndex] = updatedProject
    } else {
      newProjects = [...savedProjects, updatedProject]
    }
    
    setSavedProjects(newProjects)
    storage.setItem(storageKey, JSON.stringify(newProjects))
  }

  const handleNewProject = () => {
    setCurrentProject(null)
  }

  const handleLoadProject = (project: PlanningProject) => {
    setCurrentProject(project)
  }

  const handleDeleteProject = (projectId: string) => {
    const newProjects = savedProjects.filter(p => p.id !== projectId)
    setSavedProjects(newProjects)
    
    const storageKey = isDemoMode ? 'demo_planning_projects' : 'planning_projects'
    const storage = isDemoMode ? sessionStorage : localStorage
    storage.setItem(storageKey, JSON.stringify(newProjects))
    
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
    }
  }

  return (
    <div className="planning-page">
      {/* 데모 모드 배너 */}
      {isDemoMode && (
        <div className="demo-mode-banner">
          <div className="demo-banner-content">
            <span className="demo-icon">🎯</span>
            <div className="demo-text">
              <strong>데모 모드</strong>
              <p>실제 기능을 체험해보세요. 데이터는 브라우저 세션에만 임시 저장됩니다.</p>
            </div>
            <a href="/login" className="demo-login-link">정식 이용하기</a>
          </div>
        </div>
      )}
      
      <div className="planning-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">기획</span>
            AI 영상 기획
          </h1>
          <p className="page-description">
            AI의 도움으로 전문적인 영상 기획서를 단계별로 작성해보세요
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="new-project-btn"
            onClick={handleNewProject}
            disabled={isLoading}
          >
            <span>새기획</span>
            새 기획 시작
          </button>
        </div>
      </div>

      {/* 저장된 프로젝트 목록 */}
      {savedProjects.length > 0 && (
        <div className="saved-projects">
          <h2 className="section-title">저장된 기획서</h2>
          <div className="projects-grid">
            {savedProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3 className="project-title">{project.title || '제목 없음'}</h3>
                  <div className="project-actions">
                    <button
                      className="load-btn"
                      onClick={() => handleLoadProject(project)}
                      title="프로젝트 불러오기"
                    >
                      불러오기
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProject(project.id!)}
                      title="프로젝트 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="project-meta">
                  <span className="genre">{project.genre}</span>
                  <span className="duration">{project.duration}</span>
                  <span className="purpose">{project.purpose}</span>
                </div>
                {project.updated_at && (
                  <div className="project-date">
                    {new Date(project.updated_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기획 마법사 */}
      <div className="planning-wizard-container">
        <Suspense fallback={<PlanningLoading />}>
          <PlanningWizard
            initialProject={currentProject}
            onSave={handleProjectSave}
            onLoadingChange={setIsLoading}
          />
        </Suspense>
      </div>
    </div>
  )
}