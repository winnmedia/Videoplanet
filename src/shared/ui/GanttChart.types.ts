/**
 * GanttChart 컴포넌트 타입 정의
 * VideoPlanet 프로젝트 3단계 진행 상황 시각화
 */

import { ReactNode } from 'react'

/**
 * 프로젝트 단계 타입
 */
export type ProjectPhase = 'PLAN' | 'SHOOT' | 'EDIT'

/**
 * 진행 상태 타입
 */
export type ProgressStatus = 'completed' | 'in_progress' | 'pending' | 'delayed'

/**
 * 간트차트 모드 타입
 */
export type GanttMode = 'dashboard' | 'compact'

/**
 * 단계별 진행 정보
 */
export interface PhaseProgress {
  /** 단계 식별자 */
  phase: ProjectPhase
  /** 단계명 (한국어) */
  title: string
  /** 단계 설명 */
  description?: string
  /** 진행 상태 */
  status: ProgressStatus
  /** 진행률 (0-100) */
  progress: number
  /** 시작 날짜 */
  startDate: Date
  /** 종료 날짜 */
  endDate: Date
  /** 실제 시작 날짜 (optional) */
  actualStartDate?: Date
  /** 실제 종료 날짜 (optional) */
  actualEndDate?: Date
  /** 담당자 정보 */
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  /** 단계별 메모 */
  notes?: string
}

/**
 * 프로젝트 정보
 */
export interface ProjectInfo {
  /** 프로젝트 ID */
  id: string
  /** 프로젝트 명 */
  title: string
  /** 프로젝트 설명 */
  description?: string
  /** 전체 진행률 (0-100) */
  totalProgress: number
  /** 프로젝트 상태 */
  status: ProgressStatus
  /** 생성 날짜 */
  createdAt: Date
  /** 수정 날짜 */
  updatedAt: Date
  /** 단계별 진행 정보 */
  phases: PhaseProgress[]
}

/**
 * 간트차트 컴포넌트 Props
 */
export interface GanttChartProps {
  /** 프로젝트 정보 */
  project: ProjectInfo
  /** 표시 모드 */
  mode?: GanttMode
  /** 클래스명 */
  className?: string
  /** 커스텀 스타일 */
  style?: React.CSSProperties
  /** 단계 클릭 이벤트 핸들러 */
  onPhaseClick?: (phase: ProjectPhase) => void
  /** 진행률 업데이트 이벤트 핸들러 */
  onProgressUpdate?: (phase: ProjectPhase, progress: number) => void
  /** 로딩 상태 */
  isLoading?: boolean
  /** 에러 상태 */
  error?: string | null
  /** 읽기 전용 모드 */
  readonly?: boolean
  /** 도구 설명 표시 여부 */
  showTooltip?: boolean
  /** 세부 정보 표시 여부 */
  showDetails?: boolean
  /** 타임라인 표시 여부 */
  showTimeline?: boolean
  /** 커스텀 아이콘 렌더러 */
  renderPhaseIcon?: (phase: ProjectPhase, status: ProgressStatus) => ReactNode
  /** 커스텀 진행률 라벨 렌더러 */
  renderProgressLabel?: (progress: number) => ReactNode
}

/**
 * 간트차트 스타일 variants
 */
export type GanttVariant = 'default' | 'minimal' | 'detailed'

/**
 * 간트차트 색상 테마
 */
export interface GanttTheme {
  completed: string
  inProgress: string
  pending: string
  delayed: string
  background: string
  text: string
  border: string
}

/**
 * 간트차트 설정
 */
export interface GanttConfig {
  /** 테마 */
  theme: GanttTheme
  /** 애니메이션 활성화 */
  enableAnimation: boolean
  /** 접근성 모드 */
  accessibilityMode: boolean
  /** 반응형 브레이크포인트 */
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
}

/**
 * Redux 상태와 연동을 위한 액션 타입
 */
export interface GanttActions {
  updatePhaseProgress: (projectId: string, phase: ProjectPhase, progress: number) => void
  updatePhaseStatus: (projectId: string, phase: ProjectPhase, status: ProgressStatus) => void
  setPhaseNotes: (projectId: string, phase: ProjectPhase, notes: string) => void
}

/**
 * 간트차트 훅 반환 타입
 */
export interface UseGanttChart {
  /** 프로젝트 데이터 */
  project: ProjectInfo | null
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 상태 */
  error: string | null
  /** 액션 함수들 */
  actions: GanttActions
}

/**
 * 기본 테마 상수
 */
export const DEFAULT_GANTT_THEME: GanttTheme = {
  completed: '#28a745',
  inProgress: '#1631F8',
  pending: '#ffc107',
  delayed: '#dc3545',
  background: '#ffffff',
  text: '#333333',
  border: '#e9ecef'
}

/**
 * 기본 설정 상수
 */
export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  theme: DEFAULT_GANTT_THEME,
  enableAnimation: true,
  accessibilityMode: false,
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  }
}