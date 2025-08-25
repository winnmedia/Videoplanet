/**
 * GanttChart 컴포넌트
 * VideoPlanet 프로젝트 3단계 진행 상황 간트차트
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import classNames from 'classnames'
import { Icon, IconType } from '@/shared/ui/Icon/Icon'
import { 
  GanttChartProps, 
  ProjectPhase, 
  ProgressStatus, 
  PhaseProgress,
  GanttMode 
} from './GanttChart.types'
import { LoadingSpinner } from './LoadingSpinner'
import styles from './GanttChart.module.scss'

/**
 * 상태별 CSS 클래스 매핑
 */
const statusClassMap: Record<ProgressStatus, string> = {
  completed: styles.completed,
  in_progress: styles.inProgress,
  pending: styles.pending,
  delayed: styles.delayed
}

/**
 * 단계별 기본 아이콘
 */
const defaultPhaseIcons: Record<ProjectPhase, string> = {
  PLAN: '📋',
  SHOOT: '🎥',
  EDIT: '✂️'
}

/**
 * 날짜 포맷팅 유틸리티
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 키보드 이벤트 핸들러
 */
const useKeyboardNavigation = (
  phases: PhaseProgress[],
  onPhaseClick?: (phase: ProjectPhase) => void
) => {
  const [focusedPhaseIndex, setFocusedPhaseIndex] = useState<number>(0)
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        setFocusedPhaseIndex(prev => 
          prev < phases.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowLeft':
        event.preventDefault()
        setFocusedPhaseIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (onPhaseClick) {
          onPhaseClick(phases[focusedPhaseIndex].phase)
        }
        break
    }
  }, [phases, focusedPhaseIndex, onPhaseClick])

  useEffect(() => {
    const currentRef = phaseRefs.current[focusedPhaseIndex]
    if (currentRef) {
      currentRef.focus()
    }
  }, [focusedPhaseIndex])

  return { handleKeyDown, phaseRefs }
}

/**
 * 반응형 뷰포트 감지 훅
 */
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)

    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  return { isMobile }
}

/**
 * 툴팁 훅
 */
const useTooltip = () => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    content: string
    x: number
    y: number
  }>({
    visible: false,
    content: '',
    x: 0,
    y: 0
  })

  const showTooltip = useCallback((content: string, event: React.MouseEvent) => {
    setTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  return { tooltip, showTooltip, hideTooltip }
}

/**
 * 단일 단계 컴포넌트
 */
const PhaseItem: React.FC<{
  phase: PhaseProgress
  index: number
  mode: GanttMode
  showDetails: boolean
  showTimeline: boolean
  showTooltip: boolean
  readonly: boolean
  onPhaseClick?: (phase: ProjectPhase) => void
  onProgressUpdate?: (phase: ProjectPhase, progress: number) => void
  renderPhaseIcon?: (phase: ProjectPhase, status: ProgressStatus) => React.ReactNode
  phaseRef: (el: HTMLDivElement | null) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: () => void
}> = ({ 
  phase, 
  index,
  mode,
  showDetails,
  showTimeline,
  showTooltip,
  readonly,
  onPhaseClick,
  onProgressUpdate,
  renderPhaseIcon,
  phaseRef,
  onKeyDown,
  onMouseEnter,
  onMouseLeave
}) => {
  const handleClick = useCallback(() => {
    if (onPhaseClick) {
      onPhaseClick(phase.phase)
    }
  }, [onPhaseClick, phase.phase])

  const handleProgressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(event.target.value)
    if (onProgressUpdate && !readonly) {
      onProgressUpdate(phase.phase, newProgress)
    }
  }, [onProgressUpdate, phase.phase, readonly])

  const handleProgressBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const newProgress = Number(event.target.value)
    if (onProgressUpdate && !readonly && newProgress !== phase.progress) {
      onProgressUpdate(phase.phase, newProgress)
    }
  }, [onProgressUpdate, phase.phase, readonly, phase.progress])

  return (
    <div
      ref={phaseRef}
      className={classNames(
        styles.phaseItem,
        statusClassMap[phase.status],
        {
          [styles.compact]: mode === 'compact',
          [styles.clickable]: !!onPhaseClick
        }
      )}
      data-testid={`phase-${phase.phase}`}
      role="button"
      tabIndex={0}
      aria-label={`${phase.title} 단계, ${
        phase.status === 'completed' ? '완료됨' :
        phase.status === 'in_progress' ? '진행중' :
        phase.status === 'delayed' ? '지연됨' : '대기중'
      }, 진행률 ${phase.progress}%`}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      onMouseEnter={showTooltip ? onMouseEnter : undefined}
      onMouseLeave={showTooltip ? onMouseLeave : undefined}
    >
      {/* 단계 헤더 */}
      <div className={styles.phaseHeader}>
        <div className={styles.phaseIcon}>
          {renderPhaseIcon ? 
            renderPhaseIcon(phase.phase, phase.status) : 
            defaultPhaseIcons[phase.phase]
          }
        </div>
        <div className={styles.phaseInfo}>
          <h3 className={styles.phaseTitle}>{phase.title}</h3>
          {showDetails && phase.description && (
            <p className={styles.phaseDescription}>{phase.description}</p>
          )}
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${phase.progress}%` }}
          />
        </div>
        <div className={styles.progressInfo}>
          {readonly ? (
            <span className={styles.progressLabel}>{phase.progress}%</span>
          ) : (
            <input
              type="number"
              min="0"
              max="100"
              value={phase.progress}
              onChange={handleProgressChange}
              onBlur={handleProgressBlur}
              disabled={readonly}
              className={styles.progressInput}
              aria-label={`${phase.title} 진행률`}
            />
          )}
        </div>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className={styles.phaseDetails}>
          {phase.assignee && (
            <div className={styles.assignee}>
              <span className={styles.assigneeLabel}>담당자:</span>
              <span className={styles.assigneeName}>{phase.assignee.name}</span>
            </div>
          )}
          {showTimeline && (
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <span className={styles.timelineLabel}>시작:</span>
                <span className={styles.timelineDate}>{formatDate(phase.startDate)}</span>
              </div>
              <div className={styles.timelineItem}>
                <span className={styles.timelineLabel}>종료:</span>
                <span className={styles.timelineDate}>{formatDate(phase.endDate)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 툴팁 컴포넌트
 */
const Tooltip: React.FC<{
  visible: boolean
  content: string
  x: number
  y: number
}> = ({ visible, content, x, y }) => {
  if (!visible) return null

  return (
    <div
      className={styles.tooltip}
      role="tooltip"
      style={{
        left: x,
        top: y - 10
      }}
    >
      {content}
    </div>
  )
}

/**
 * 메인 GanttChart 컴포넌트
 */
export const GanttChart: React.FC<GanttChartProps> = ({
  project,
  mode = 'dashboard',
  className,
  style,
  onPhaseClick,
  onProgressUpdate,
  isLoading = false,
  error = null,
  readonly = false,
  showTooltip = true,
  showDetails = true,
  showTimeline = false,
  renderPhaseIcon,
  renderProgressLabel
}) => {
  const { isMobile } = useResponsive()
  const { tooltip, showTooltip: showTooltipFn, hideTooltip } = useTooltip()
  const { handleKeyDown, phaseRefs } = useKeyboardNavigation(project.phases, onPhaseClick)

  // 툴팁 컨텐츠 생성
  const createTooltipContent = useCallback((phase: PhaseProgress) => {
    const lines = [
      phase.description || phase.title,
      `담당자: ${phase.assignee?.name || '미지정'}`,
      `진행률: ${phase.progress}%`,
      `기간: ${formatDate(phase.startDate)} ~ ${formatDate(phase.endDate)}`
    ]
    return lines.join('\\n')
  }, [])

  const handlePhaseMouseEnter = useCallback((phase: PhaseProgress) => (event: React.MouseEvent) => {
    if (showTooltip) {
      showTooltipFn(createTooltipContent(phase), event)
    }
  }, [showTooltip, showTooltipFn, createTooltipContent])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={classNames(styles.ganttChart, styles.loading, className)}>
        <div data-testid="loading-spinner">
          <LoadingSpinner size="lg" />
        </div>
        <p>프로젝트 정보를 불러오는 중...</p>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className={classNames(styles.ganttChart, styles.error, className)} role="alert">
        <div className={styles.errorIcon}>
          <Icon type="warning" size="lg" variant="warning" ariaLabel="경고" />
        </div>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div
      className={classNames(
        styles.ganttChart,
        {
          [styles.compact]: mode === 'compact',
          [styles.dashboard]: mode === 'dashboard',
          [styles.mobile]: isMobile,
          [styles.readonly]: readonly
        },
        className
      )}
      style={style}
      data-testid="gantt-chart"
      role="region"
      aria-label="프로젝트 진행 간트차트"
    >
      {/* 프로젝트 헤더 */}
      <div className={styles.projectHeader}>
        <h2 className={styles.projectTitle}>{project.title}</h2>
        {showDetails && project.description && (
          <p className={styles.projectDescription}>{project.description}</p>
        )}
        <div className={styles.totalProgress} data-testid="total-progress" aria-label={`전체 진행률 ${project.totalProgress}%`}>
          <span className={styles.totalProgressLabel}>전체 진행률</span>
          {renderProgressLabel ? 
            renderProgressLabel(project.totalProgress) :
            <span className={styles.totalProgressValue}>{project.totalProgress}%</span>
          }
        </div>
      </div>

      {/* 단계 목록 */}
      <div className={styles.phasesList} role="list">
        {project.phases.map((phase, index) => (
          <div key={phase.phase} role="listitem">
            <PhaseItem
              phase={phase}
              index={index}
              mode={mode}
              showDetails={showDetails}
              showTimeline={showTimeline}
              showTooltip={showTooltip}
              readonly={readonly}
              onPhaseClick={onPhaseClick}
              onProgressUpdate={onProgressUpdate}
              renderPhaseIcon={renderPhaseIcon}
              phaseRef={(el) => { phaseRefs.current[index] = el }}
              onKeyDown={handleKeyDown}
              onMouseEnter={handlePhaseMouseEnter(phase)}
              onMouseLeave={hideTooltip}
            />
          </div>
        ))}
      </div>

      {/* 툴팁 */}
      <Tooltip 
        visible={tooltip.visible}
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
      />
    </div>
  )
}

// 기본값 설정
GanttChart.displayName = 'GanttChart'

export default GanttChart