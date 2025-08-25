/**
 * GanttChart 컴포넌트 사용 예제
 * 이 파일은 개발 및 테스트 용도로만 사용됩니다.
 */

import React, { useState } from 'react'
import { GanttChart } from './GanttChart'
import type { ProjectInfo, ProjectPhase, ProgressStatus } from './GanttChart.types'

// 샘플 프로젝트 데이터
const createSampleProject = (): ProjectInfo => {
  const baseDate = new Date('2025-01-01')
  
  return {
    id: 'sample-project-1',
    title: 'VideoPlanet 홍보 영상 제작',
    description: '새로운 기능을 소개하는 홍보 영상 제작 프로젝트입니다.',
    totalProgress: 65,
    status: 'in_progress',
    createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    phases: [
      {
        phase: 'PLAN',
        title: '기획',
        description: '프로젝트 기획 및 스토리보드 작성',
        status: 'completed',
        progress: 100,
        startDate: new Date(baseDate),
        endDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(baseDate),
        actualEndDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        assignee: { id: 'user1', name: '김기획' },
        notes: '스토리보드 완료, 클라이언트 승인 완료'
      },
      {
        phase: 'SHOOT',
        title: '촬영',
        description: '메인 영상 촬영 및 추가 컷 확보',
        status: 'in_progress',
        progress: 75,
        startDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        assignee: { id: 'user2', name: '이촬영' },
        notes: '메인 신 촬영 완료, B-roll 진행 중'
      },
      {
        phase: 'EDIT',
        title: '편집',
        description: '영상 편집 및 후반 작업',
        status: 'pending',
        progress: 0,
        startDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
        assignee: { id: 'user3', name: '박편집' },
        notes: '편집 프로그램 및 소스 준비 완료'
      }
    ]
  }
}

export const GanttChartExample: React.FC = () => {
  const [project, setProject] = useState<ProjectInfo>(createSampleProject())
  const [mode, setMode] = useState<'dashboard' | 'compact'>('dashboard')
  const [readonly, setReadonly] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)

  const handlePhaseClick = (phase: ProjectPhase) => {
    console.log('Phase clicked:', phase)
    alert(`${phase} 단계를 클릭했습니다!`)
  }

  const handleProgressUpdate = (phase: ProjectPhase, progress: number) => {
    console.log('Progress update:', phase, progress)
    
    setProject(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.phase === phase ? { ...p, progress } : p
      ),
      updatedAt: new Date()
    }))
    
    // 전체 진행률 재계산
    const updatedPhases = project.phases.map(p => 
      p.phase === phase ? { ...p, progress } : p
    )
    const totalProgress = Math.round(
      updatedPhases.reduce((sum, p) => sum + p.progress, 0) / updatedPhases.length
    )
    
    setProject(prev => ({
      ...prev,
      totalProgress,
      phases: updatedPhases
    }))
  }

  const resetProject = () => {
    setProject(createSampleProject())
  }

  const updatePhaseStatus = (phase: ProjectPhase, status: ProgressStatus) => {
    setProject(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.phase === phase ? { ...p, status } : p
      ),
      updatedAt: new Date()
    }))
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>GanttChart 컴포넌트 예제</h1>
      
      {/* 컨트롤 패널 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        <h3>컨트롤 패널</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <label>
            <input 
              type="radio" 
              value="dashboard" 
              checked={mode === 'dashboard'}
              onChange={(e) => setMode(e.target.value as 'dashboard')}
            />
            대시보드 모드
          </label>
          <label>
            <input 
              type="radio" 
              value="compact" 
              checked={mode === 'compact'}
              onChange={(e) => setMode(e.target.value as 'compact')}
            />
            컴팩트 모드
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={readonly}
              onChange={(e) => setReadonly(e.target.checked)}
            />
            읽기 전용
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
            />
            상세 정보 표시
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showTimeline}
              onChange={(e) => setShowTimeline(e.target.checked)}
            />
            타임라인 표시
          </label>
          <button onClick={resetProject} style={{ padding: '5px 10px' }}>
            리셋
          </button>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <h4>단계 상태 변경</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {project.phases.map(phase => (
              <div key={phase.phase} style={{ 
                padding: '10px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                <strong>{phase.title}</strong>
                <div>
                  {(['completed', 'in_progress', 'pending', 'delayed'] as ProgressStatus[]).map(status => (
                    <label key={status} style={{ display: 'block', marginTop: '5px' }}>
                      <input 
                        type="radio" 
                        value={status} 
                        checked={phase.status === status}
                        onChange={() => updatePhaseStatus(phase.phase, status)}
                      />
                      {status === 'completed' ? '완료' :
                       status === 'in_progress' ? '진행중' :
                       status === 'pending' ? '대기' : '지연'}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 간트차트 */}
      <GanttChart
        project={project}
        mode={mode}
        readonly={readonly}
        showDetails={showDetails}
        showTimeline={showTimeline}
        showTooltip={true}
        onPhaseClick={handlePhaseClick}
        onProgressUpdate={handleProgressUpdate}
      />

      {/* 프로젝트 정보 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        <h3>현재 프로젝트 상태</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(project, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default GanttChartExample