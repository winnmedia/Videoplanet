/**
 * GanttChart 컴포넌트 테스트
 * TDD 방식으로 핵심 동작 검증
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GanttChart } from './GanttChart'
import type { ProjectInfo, PhaseProgress, GanttChartProps } from './GanttChart.types'

// Mock 데이터 생성
const createMockProject = (overrides?: Partial<ProjectInfo>): ProjectInfo => {
  const baseDate = new Date('2025-01-01')
  
  const phases: PhaseProgress[] = [
    {
      phase: 'PLAN',
      title: '기획',
      description: '프로젝트 기획 단계',
      status: 'completed',
      progress: 100,
      startDate: new Date(baseDate.getTime()),
      endDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(baseDate.getTime()),
      actualEndDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user1', name: '김기획' }
    },
    {
      phase: 'SHOOT',
      title: '촬영',
      description: '영상 촬영 단계',
      status: 'in_progress',
      progress: 60,
      startDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user2', name: '이촬영' }
    },
    {
      phase: 'EDIT',
      title: '편집',
      description: '영상 편집 단계',
      status: 'pending',
      progress: 0,
      startDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user3', name: '박편집' }
    }
  ]

  return {
    id: 'project-1',
    title: '테스트 프로젝트',
    description: '간트차트 테스트용 프로젝트',
    totalProgress: 53,
    status: 'in_progress',
    createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    phases,
    ...overrides
  }
}

const defaultProps: GanttChartProps = {
  project: createMockProject(),
  mode: 'dashboard'
}

// 테스트 유틸리티
const renderGanttChart = (props: Partial<GanttChartProps> = {}) => {
  return render(<GanttChart {...defaultProps} {...props} />)
}

describe('GanttChart', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('기본 렌더링', () => {
    it('프로젝트 제목을 표시한다', () => {
      renderGanttChart()
      expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument()
    })

    it('세 개의 프로젝트 단계(PLAN, SHOOT, EDIT)를 표시한다', () => {
      renderGanttChart()
      expect(screen.getByText('기획')).toBeInTheDocument()
      expect(screen.getByText('촬영')).toBeInTheDocument()
      expect(screen.getByText('편집')).toBeInTheDocument()
    })

    it('각 단계의 진행률을 표시한다', () => {
      renderGanttChart()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('60')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0')).toBeInTheDocument()
    })

    it('전체 진행률을 표시한다', () => {
      renderGanttChart()
      expect(screen.getByText('53%')).toBeInTheDocument()
    })
  })

  describe('상태별 시각화', () => {
    it('완료된 단계는 성공 색상으로 표시한다', () => {
      renderGanttChart()
      const completedPhase = screen.getByTestId('phase-PLAN')
      expect(completedPhase.className).toContain('completed')
    })

    it('진행중인 단계는 진행 색상으로 표시한다', () => {
      renderGanttChart()
      const inProgressPhase = screen.getByTestId('phase-SHOOT')
      expect(inProgressPhase.className).toContain('inProgress')
    })

    it('대기중인 단계는 대기 색상으로 표시한다', () => {
      renderGanttChart()
      const pendingPhase = screen.getByTestId('phase-EDIT')
      expect(pendingPhase.className).toContain('pending')
    })

    it('지연된 단계는 경고 색상으로 표시한다', () => {
      const delayedProject = createMockProject({
        phases: [
          {
            ...createMockProject().phases[0],
            status: 'delayed'
          },
          ...createMockProject().phases.slice(1)
        ]
      })
      renderGanttChart({ project: delayedProject })
      
      const delayedPhase = screen.getByTestId('phase-PLAN')
      expect(delayedPhase.className).toContain('delayed')
    })
  })

  describe('인터랙션', () => {
    it('단계 클릭 시 onPhaseClick 콜백을 호출한다', async () => {
      const onPhaseClick = vi.fn()
      renderGanttChart({ onPhaseClick })
      
      const planPhase = screen.getByTestId('phase-PLAN')
      await user.click(planPhase)
      
      expect(onPhaseClick).toHaveBeenCalledWith('PLAN')
    })

    it('진행률 업데이트 시 onProgressUpdate 콜백을 호출한다', async () => {
      const onProgressUpdate = vi.fn()
      renderGanttChart({ onProgressUpdate, readonly: false })
      
      // 진행률 입력 요소 찾기
      const progressInput = screen.getByLabelText('촬영 진행률')
      fireEvent.change(progressInput, { target: { value: '80' } })
      fireEvent.blur(progressInput)
      
      expect(onProgressUpdate).toHaveBeenCalledWith('SHOOT', 80)
    })

    it('읽기 전용 모드에서는 진행률 수정이 불가능하다', () => {
      renderGanttChart({ readonly: true })
      
      const progressInputs = screen.queryAllByRole('spinbutton')
      progressInputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })
  })

  describe('모드별 렌더링', () => {
    it('대시보드 모드에서는 상세 정보를 표시한다', () => {
      renderGanttChart({ mode: 'dashboard', showDetails: true })
      
      expect(screen.getByText('김기획')).toBeInTheDocument()
      expect(screen.getByText('이촬영')).toBeInTheDocument()
      expect(screen.getByText('박편집')).toBeInTheDocument()
    })

    it('컴팩트 모드에서는 핵심 정보만 표시한다', () => {
      renderGanttChart({ mode: 'compact' })
      
      const ganttContainer = screen.getByTestId('gantt-chart')
      expect(ganttContainer.className).toContain('compact')
    })
  })

  describe('타임라인 표시', () => {
    it('타임라인 표시가 활성화되면 날짜 정보를 표시한다', () => {
      renderGanttChart({ showTimeline: true })
      
      // ISO 날짜 형식이나 한국어 날짜 형식 확인
      expect(screen.getByText(/2025-01-01|1월 1일/)).toBeInTheDocument()
    })

    it('타임라인이 비활성화되면 날짜 정보를 표시하지 않는다', () => {
      renderGanttChart({ showTimeline: false })
      
      expect(screen.queryByText(/2025-01-01|1월 1일/)).not.toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('간트차트 전체에 적절한 ARIA 레이블을 가진다', () => {
      renderGanttChart()
      
      const ganttChart = screen.getByRole('region')
      expect(ganttChart).toHaveAttribute('aria-label', '프로젝트 진행 간트차트')
    })

    it('각 단계에 적절한 ARIA 정보를 제공한다', () => {
      renderGanttChart()
      
      const planPhase = screen.getByTestId('phase-PLAN')
      expect(planPhase).toHaveAttribute('aria-label', '기획 단계, 완료됨, 진행률 100%')
    })

    it('진행률 정보를 스크린 리더가 읽을 수 있다', () => {
      renderGanttChart()
      
      const progressInfo = screen.getByTestId('total-progress')
      expect(progressInfo).toHaveAttribute('aria-label', '전체 진행률 53%')
    })

    it('키보드로 단계간 탐색이 가능하다', async () => {
      renderGanttChart()
      
      const firstPhase = screen.getByTestId('phase-PLAN')
      firstPhase.focus()
      
      await user.keyboard('{ArrowRight}')
      expect(screen.getByTestId('phase-SHOOT')).toHaveFocus()
      
      await user.keyboard('{ArrowRight}')
      expect(screen.getByTestId('phase-EDIT')).toHaveFocus()
      
      await user.keyboard('{ArrowLeft}')
      expect(screen.getByTestId('phase-SHOOT')).toHaveFocus()
    })

    it('Enter 키로 단계를 선택할 수 있다', async () => {
      const onPhaseClick = vi.fn()
      renderGanttChart({ onPhaseClick })
      
      const planPhase = screen.getByTestId('phase-PLAN')
      planPhase.focus()
      await user.keyboard('{Enter}')
      
      expect(onPhaseClick).toHaveBeenCalledWith('PLAN')
    })
  })

  describe('에러 처리', () => {
    it('에러 상태일 때 에러 메시지를 표시한다', () => {
      renderGanttChart({ error: '프로젝트를 불러올 수 없습니다' })
      
      expect(screen.getByText('프로젝트를 불러올 수 없습니다')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('로딩 상태일 때 로딩 스피너를 표시한다', () => {
      renderGanttChart({ isLoading: true })
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 정보를 불러오는 중...')).toBeInTheDocument()
    })
  })

  describe('툴팁', () => {
    it('툴팁이 활성화되면 단계에 마우스 오버 시 상세 정보를 표시한다', async () => {
      renderGanttChart({ showTooltip: true })
      
      const shootPhase = screen.getByTestId('phase-SHOOT')
      await user.hover(shootPhase)
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
        // 툴팁 내용은 \\n으로 분리된 문자열로 표시됨
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip.textContent).toContain('영상 촬영 단계')
        expect(tooltip.textContent).toContain('담당자: 이촬영')
      })
    })

    it('마우스가 벗어나면 툴팁이 사라진다', async () => {
      renderGanttChart({ showTooltip: true })
      
      const shootPhase = screen.getByTestId('phase-SHOOT')
      await user.hover(shootPhase)
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
      
      await user.unhover(shootPhase)
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      })
    })
  })

  describe('반응형', () => {
    it('모바일 뷰포트에서는 컴팩트한 레이아웃을 사용한다', () => {
      // jsdom에서 viewport 크기 설정
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      })
      
      renderGanttChart()
      
      const ganttContainer = screen.getByTestId('gantt-chart')
      expect(ganttContainer.className).toContain('mobile')
    })
  })

  describe('커스텀 렌더러', () => {
    it('커스텀 단계 아이콘 렌더러를 사용할 수 있다', () => {
      const renderPhaseIcon = vi.fn((phase, status) => (
        <span data-testid={`custom-icon-${phase}`}>🎬</span>
      ))
      
      renderGanttChart({ renderPhaseIcon })
      
      expect(screen.getByTestId('custom-icon-PLAN')).toBeInTheDocument()
      expect(screen.getByTestId('custom-icon-SHOOT')).toBeInTheDocument()
      expect(screen.getByTestId('custom-icon-EDIT')).toBeInTheDocument()
      expect(renderPhaseIcon).toHaveBeenCalled()
    })

    it('커스텀 진행률 라벨 렌더러를 사용할 수 있다', () => {
      const renderProgressLabel = vi.fn((progress) => (
        <span data-testid="custom-progress">{progress}% 완료</span>
      ))
      
      renderGanttChart({ renderProgressLabel })
      
      expect(screen.getByText('53% 완료')).toBeInTheDocument() // 전체 진행률만 커스텀 렌더러 적용
      expect(renderProgressLabel).toHaveBeenCalled()
    })
  })
})