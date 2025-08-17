'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import './PlanningComponents.scss'

// Lazy loading으로 컴포넌트 분할
const StorySettings = lazy(() => import('./StorySettings'))
const StoryDevelopment = lazy(() => import('./StoryDevelopment'))
const ShotBreakdown = lazy(() => import('./ShotBreakdown'))
const ContiGenerator = lazy(() => import('./ContiGenerator'))
const PDFExporter = lazy(() => import('./PDFExporter'))

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="step-loading">
    <div className="loading-spinner"></div>
    <p>컴포넌트를 불러오는 중...</p>
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
  story_content?: string
  shots?: any[]
  storyboard?: any
  created_at?: string
  updated_at?: string
}

interface PlanningWizardProps {
  initialProject?: PlanningProject | null
  onSave: (project: PlanningProject) => void
  onLoadingChange: (loading: boolean) => void
}

const STEPS = [
  { id: 1, name: '기본 설정', icon: '[설정]', component: 'settings' },
  { id: 2, name: '스토리 개발', icon: '[스토리]', component: 'story' },
  { id: 3, name: '숏 분할', icon: '[영상]', component: 'shots' },
  { id: 4, name: '콘티 생성', icon: '[아트]', component: 'storyboard' },
  { id: 5, name: 'PDF 출력', icon: '[문서]', component: 'export' }
]

function PlanningWizard({ 
  initialProject, 
  onSave, 
  onLoadingChange 
}: PlanningWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [project, setProject] = useState<PlanningProject>({
    title: '',
    genre: '',
    target_audience: '',
    tone_manner: '',
    duration: '',
    budget: '',
    purpose: '',
    story_structure: '',
    development_level: '',
    story_content: '',
    shots: [],
    storyboard: null
  })
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isStepValid, setIsStepValid] = useState(false)

  // 초기 프로젝트 로드
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject)
      // 완료된 단계 계산
      const completed = []
      if (initialProject.genre && initialProject.target_audience) completed.push(1)
      if (initialProject.story_content) completed.push(2)
      if (initialProject.shots && initialProject.shots.length > 0) completed.push(3)
      if (initialProject.storyboard) completed.push(4)
      setCompletedSteps(completed)
      
      // 가장 마지막 완료 단계의 다음 단계로 이동
      if (completed.length > 0) {
        const lastCompleted = completed[completed.length - 1]
        if (lastCompleted !== undefined) {
          setCurrentStep(Math.min(lastCompleted + 1, 5))
        }
      }
    } else {
      // 새 프로젝트인 경우 초기화
      setProject({
        title: '',
        genre: '',
        target_audience: '',
        tone_manner: '',
        duration: '',
        budget: '',
        purpose: '',
        story_structure: '',
        development_level: '',
        story_content: '',
        shots: [],
        storyboard: null
      })
      setCompletedSteps([])
      setCurrentStep(1)
    }
  }, [initialProject])

  const updateProject = (updates: Partial<PlanningProject>) => {
    const updatedProject = { ...project, ...updates }
    setProject(updatedProject)
    onSave(updatedProject)
  }

  const handleStepComplete = (stepData: any) => {
    const updatedProject = { ...project, ...stepData }
    setProject(updatedProject)
    onSave(updatedProject)

    // 완료된 단계 추가
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }

    // 다음 단계로 이동 (마지막 단계가 아닌 경우)
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepNavigation = (stepNumber: number) => {
    // 이전 단계로만 이동 가능하거나, 완료된 단계로만 이동 가능
    if (stepNumber <= currentStep || completedSteps.includes(stepNumber - 1)) {
      setCurrentStep(stepNumber)
    }
  }

  const canNavigateToStep = (stepNumber: number) => {
    if (stepNumber === 1) return true
    if (stepNumber <= currentStep) return true
    if (completedSteps.includes(stepNumber - 1)) return true
    return false
  }

  const renderCurrentStep = () => {
    const stepComponent = (() => {
      switch (currentStep) {
        case 1:
          return (
            <StorySettings
              project={project}
              onComplete={handleStepComplete}
              onValidationChange={setIsStepValid}
            />
          )
        case 2:
          return (
            <StoryDevelopment
              project={project}
              onComplete={handleStepComplete}
              onValidationChange={setIsStepValid}
              onLoadingChange={onLoadingChange}
            />
          )
        case 3:
          return (
            <ShotBreakdown
              project={project}
              onComplete={handleStepComplete}
              onValidationChange={setIsStepValid}
              onLoadingChange={onLoadingChange}
            />
          )
        case 4:
          return (
            <ContiGenerator
              project={project}
              onComplete={handleStepComplete}
              onValidationChange={setIsStepValid}
              onLoadingChange={onLoadingChange}
            />
          )
        case 5:
          return (
            <PDFExporter
              project={project}
              onComplete={handleStepComplete}
              onValidationChange={setIsStepValid}
            />
          )
        default:
          return null
      }
    })()

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {stepComponent}
      </Suspense>
    )
  }

  return (
    <div className="planning-wizard">
      {/* 프로그레스 바 */}
      <div className="wizard-progress">
        <div className="progress-header">
          <h2 className="wizard-title">
            {project.title || '새 영상 기획서'}
          </h2>
          <div className="progress-stats">
            {completedSteps.length} / {STEPS.length} 단계 완료
          </div>
        </div>
        
        <div className="progress-steps">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = completedSteps.includes(step.id)
            const canNavigate = canNavigateToStep(step.id)
            
            return (
              <div
                key={step.id}
                className={`progress-step ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                } ${canNavigate ? 'navigable' : ''}`}
                onClick={() => canNavigate && handleStepNavigation(step.id)}
              >
                <div className="step-indicator">
                  <span className="step-icon">
                    {isCompleted ? '[완료]' : step.icon}
                  </span>
                  <span className="step-number">{step.id}</span>
                </div>
                <div className="step-info">
                  <div className="step-name">{step.name}</div>
                  <div className="step-status">
                    {isCompleted
                      ? '완료'
                      : isActive
                      ? '진행 중'
                      : '대기 중'}
                  </div>
                </div>
                
                {/* 연결선 */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`step-connector ${
                      completedSteps.includes(step.id) ? 'completed' : ''
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 현재 단계 컨텐츠 */}
      <div className="wizard-content">
        {renderCurrentStep()}
      </div>

      {/* 네비게이션 */}
      <div className="wizard-navigation">
        <button
          className="nav-btn prev-btn"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <span>←</span>
          이전 단계
        </button>
        
        <div className="nav-center">
          <span className="current-step-info">
            {STEPS[currentStep - 1]?.name} ({currentStep} / {STEPS.length})
          </span>
        </div>
        
        <button
          className="nav-btn next-btn"
          onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
          disabled={currentStep === STEPS.length || !completedSteps.includes(currentStep)}
        >
          다음 단계
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default PlanningWizard