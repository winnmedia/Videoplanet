/**
 * 프로젝트 진행 상황 시각화 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { Project, ProjectDatePhase } from '../types';

interface ProjectProgressProps {
  project: Project;
  showTimeline?: boolean;
  compact?: boolean;
}

// 프로젝트 단계 정보
const PROJECT_PHASES = [
  { key: 'basic_plan', text: '기초기획안 작성', color: '#1631F8' },
  { key: 'story_board', text: '스토리보드 작성', color: '#28a745' },
  { key: 'filming', text: '촬영 (계획/진행)', color: '#17a2b8' },
  { key: 'video_edit', text: '비디오 편집', color: '#ffc107' },
  { key: 'post_work', text: '후반 작업', color: '#fd7e14' },
  { key: 'video_preview', text: '비디오 시사 (피드백)', color: '#6f42c1' },
  { key: 'confirmation', text: '최종 컨펌', color: '#e83e8c' },
  { key: 'video_delivery', text: '영상 납품', color: '#20c997' },
];

// 단계 상태 계산
const getPhaseStatus = (phase: ProjectDatePhase): 'pending' | 'active' | 'completed' | 'overdue' => {
  const now = new Date();
  const startDate = phase.start_date ? new Date(phase.start_date) : null;
  const endDate = phase.end_date ? new Date(phase.end_date) : null;

  if (!startDate) return 'pending';
  
  if (now < startDate) return 'pending';
  
  if (!endDate) {
    return now >= startDate ? 'active' : 'pending';
  }
  
  if (now >= startDate && now <= endDate) return 'active';
  if (now > endDate) return 'overdue';
  
  return 'completed';
};

// 전체 프로젝트 진행률 계산
const calculateProjectProgress = (project: Project): number => {
  const phases = PROJECT_PHASES;
  let completedPhases = 0;
  let totalPhases = phases.length;

  phases.forEach(({ key }) => {
    const phaseData = project[key as keyof Project] as ProjectDatePhase;
    const status = getPhaseStatus(phaseData);
    
    if (status === 'completed') {
      completedPhases += 1;
    } else if (status === 'active') {
      completedPhases += 0.5; // 진행중인 단계는 50%로 계산
    }
  });

  return Math.round((completedPhases / totalPhases) * 100);
};

// 단계별 남은 시간 계산
const getTimeRemaining = (phase: ProjectDatePhase): string => {
  if (!phase.end_date) return '';
  
  const now = new Date();
  const endDate = new Date(phase.end_date);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}일 지연`;
  if (diffDays === 0) return '오늘 마감';
  if (diffDays === 1) return '내일 마감';
  if (diffDays <= 7) return `${diffDays}일 남음`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 남음`;
  
  return `${Math.ceil(diffDays / 30)}개월 남음`;
};

// 프로젝트 상태 메시지 생성
const getProjectStatusMessage = (project: Project): { message: string; type: 'success' | 'warning' | 'error' | 'info' } => {
  const progress = calculateProjectProgress(project);
  const phases = PROJECT_PHASES;
  
  // 지연된 단계 확인
  const delayedPhases = phases.filter(({ key }) => {
    const phaseData = project[key as keyof Project] as ProjectDatePhase;
    return getPhaseStatus(phaseData) === 'overdue';
  });

  // 진행중인 단계 확인
  const activePhases = phases.filter(({ key }) => {
    const phaseData = project[key as keyof Project] as ProjectDatePhase;
    return getPhaseStatus(phaseData) === 'active';
  });

  if (delayedPhases.length > 0) {
    return {
      message: `${delayedPhases.length}개 단계가 지연되고 있습니다. 일정 조정이 필요합니다.`,
      type: 'error'
    };
  }

  if (progress === 100) {
    return {
      message: '모든 단계가 완료되었습니다. 프로젝트가 성공적으로 마무리되었습니다!',
      type: 'success'
    };
  }

  if (activePhases.length > 0) {
    const currentPhase = activePhases[0];
    if (currentPhase) {
      return {
        message: `현재 "${currentPhase.text}" 단계가 진행중입니다. (전체 진행률: ${progress}%)`,
        type: 'info'
      };
    }
  }

  if (progress === 0) {
    return {
      message: '프로젝트가 아직 시작되지 않았습니다. 일정을 확인해주세요.',
      type: 'warning'
    };
  }

  return {
    message: `프로젝트가 순조롭게 진행되고 있습니다. (진행률: ${progress}%)`,
    type: 'info'
  };
};

/**
 * 프로젝트 진행 상황 컴포넌트
 */
const ProjectProgress: React.FC<ProjectProgressProps> = memo(({
  project,
  showTimeline = true,
  compact = false
}) => {
  // 진행률 및 상태 계산
  const progressData = useMemo(() => ({
    percentage: calculateProjectProgress(project),
    statusMessage: getProjectStatusMessage(project),
    phases: PROJECT_PHASES.map(({ key, text, color }) => {
      const phaseData = project[key as keyof Project] as ProjectDatePhase;
      const status = getPhaseStatus(phaseData);
      const timeRemaining = getTimeRemaining(phaseData);
      
      return {
        key,
        text,
        color,
        status,
        timeRemaining,
        startDate: phaseData.start_date,
        endDate: phaseData.end_date,
      };
    })
  }), [project]);

  if (compact) {
    return (
      <div className="project-progress compact">
        <div className="progress-header">
          <h4>진행 상황</h4>
          <span className="progress-percentage">{progressData.percentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${progressData.percentage}%`,
              backgroundColor: progressData.statusMessage.type === 'error' ? '#dc3545' : '#1631F8'
            }} 
          />
        </div>
        <div className={`status-message ${progressData.statusMessage.type}`}>
          {progressData.statusMessage.message}
        </div>
      </div>
    );
  }

  return (
    <div className="project-progress detailed">
      {/* 전체 진행률 */}
      <div className="progress-overview">
        <div className="progress-header">
          <h3>프로젝트 진행 상황</h3>
          <div className="progress-stats">
            <span className="progress-percentage">{progressData.percentage}%</span>
            <span className="completed-phases">
              {progressData.phases.filter(p => p.status === 'completed').length}/{progressData.phases.length} 완료
            </span>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progressData.percentage}%`,
                backgroundColor: progressData.statusMessage.type === 'error' ? '#dc3545' : '#1631F8'
              }} 
            />
          </div>
          <div className="progress-labels">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className={`status-message ${progressData.statusMessage.type}`}>
          <div className="status-icon">
            {progressData.statusMessage.type === 'success' && '[완료]'}
            {progressData.statusMessage.type === 'warning' && '[경고]'}
            {progressData.statusMessage.type === 'error' && '[오류]'}
            {progressData.statusMessage.type === 'info' && '[정보]'}
          </div>
          <span>{progressData.statusMessage.message}</span>
        </div>
      </div>

      {/* 타임라인 */}
      {showTimeline && (
        <div className="progress-timeline">
          <h4>단계별 진행 상황</h4>
          <div className="timeline-container">
            {progressData.phases.map((phase, index) => (
              <div key={phase.key} className={`timeline-item ${phase.status}`}>
                <div className="timeline-marker">
                  <div 
                    className="timeline-dot" 
                    style={{ backgroundColor: phase.color }}
                  />
                  {index < progressData.phases.length - 1 && (
                    <div className="timeline-line" />
                  )}
                </div>
                
                <div className="timeline-content">
                  <div className="phase-header">
                    <h5>{phase.text}</h5>
                    <span className={`phase-status ${phase.status}`}>
                      {phase.status === 'pending' && '대기중'}
                      {phase.status === 'active' && '진행중'}
                      {phase.status === 'completed' && '완료'}
                      {phase.status === 'overdue' && '지연'}
                    </span>
                  </div>
                  
                  <div className="phase-details">
                    {phase.startDate && (
                      <div className="phase-date">
                        <span className="date-label">시작:</span>
                        <span className="date-value">
                          {new Date(phase.startDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    
                    {phase.endDate && (
                      <div className="phase-date">
                        <span className="date-label">종료:</span>
                        <span className="date-value">
                          {new Date(phase.endDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    
                    {phase.timeRemaining && (
                      <div className={`time-remaining ${phase.status}`}>
                        {phase.timeRemaining}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다음 마일스톤 */}
      <div className="next-milestones">
        <h4>다음 마일스톤</h4>
        {(() => {
          const upcomingPhases = progressData.phases.filter(p => 
            p.status === 'pending' || p.status === 'active'
          ).slice(0, 3);

          if (upcomingPhases.length === 0) {
            return <p>모든 단계가 완료되었습니다.</p>;
          }

          return (
            <div className="milestone-list">
              {upcomingPhases.map((phase) => (
                <div key={phase.key} className="milestone-item">
                  <div 
                    className="milestone-indicator" 
                    style={{ backgroundColor: phase.color }}
                  />
                  <div className="milestone-info">
                    <span className="milestone-name">{phase.text}</span>
                    {phase.startDate && (
                      <span className="milestone-date">
                        {new Date(phase.startDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
});

ProjectProgress.displayName = 'ProjectProgress';

export default ProjectProgress;