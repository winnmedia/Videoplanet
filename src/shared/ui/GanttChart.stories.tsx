/**
 * GanttChart Storybook 스토리
 * 다양한 상태의 간트차트 시연
 */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { GanttChart } from './GanttChart'
import type { ProjectInfo, PhaseProgress } from './GanttChart.types'

// Mock 데이터 생성 헬퍼
const createMockProject = (overrides?: Partial<ProjectInfo>): ProjectInfo => {
  const baseDate = new Date('2025-01-01')
  
  const phases: PhaseProgress[] = [
    {
      phase: 'PLAN',
      title: '기획',
      description: '프로젝트 기획 및 스토리보드 작성',
      status: 'completed',
      progress: 100,
      startDate: new Date(baseDate.getTime()),
      endDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(baseDate.getTime()),
      actualEndDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user1', name: '김기획', avatar: '👤' },
      notes: '스토리보드 완료, 클라이언트 승인 받음'
    },
    {
      phase: 'SHOOT',
      title: '촬영',
      description: '메인 영상 촬영 및 추가 컷 확보',
      status: 'in_progress',
      progress: 65,
      startDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user2', name: '이촬영', avatar: '🎥' },
      notes: '메인 신 촬영 완료, B-roll 추가 촬영 필요'
    },
    {
      phase: 'EDIT',
      title: '편집',
      description: '영상 편집 및 후반 작업',
      status: 'pending',
      progress: 0,
      startDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
      assignee: { id: 'user3', name: '박편집', avatar: '✂️' },
      notes: '편집 툴 준비 완료'
    }
  ]

  return {
    id: 'project-1',
    title: 'VideoPlanet 홍보 영상',
    description: 'VideoPlanet 플랫폼 소개 및 기능 시연 영상',
    totalProgress: 55,
    status: 'in_progress',
    createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    phases,
    ...overrides
  }
}

const meta: Meta<typeof GanttChart> = {
  title: 'Components/GanttChart',
  component: GanttChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
VideoPlanet 프로젝트의 3단계 진행 상황을 시각화하는 간트차트 컴포넌트입니다.

## 주요 기능
- 3단계 프로젝트 진행 상황 (PLAN → SHOOT → EDIT)
- 실시간 진행률 업데이트
- 상태별 색상 구분 (완료/진행/대기/지연)
- 반응형 디자인 (대시보드/컴팩트 모드)
- 접근성 지원 (키보드 내비게이션, ARIA)
- Redux 상태 연동
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['dashboard', 'compact'],
      description: '표시 모드'
    },
    readonly: {
      control: 'boolean',
      description: '읽기 전용 모드'
    },
    showDetails: {
      control: 'boolean',
      description: '상세 정보 표시'
    },
    showTimeline: {
      control: 'boolean',
      description: '타임라인 표시'
    },
    showTooltip: {
      control: 'boolean',
      description: '툴팁 표시'
    },
    isLoading: {
      control: 'boolean',
      description: '로딩 상태'
    },
    error: {
      control: 'text',
      description: '에러 메시지'
    },
    onPhaseClick: { action: 'phase-clicked' },
    onProgressUpdate: { action: 'progress-updated' }
  }
}

export default meta
type Story = StoryObj<typeof GanttChart>

// 기본 스토리
export const Default: Story = {
  args: {
    project: createMockProject(),
    mode: 'dashboard',
    readonly: false,
    showDetails: true,
    showTimeline: false,
    showTooltip: true,
    onPhaseClick: action('onPhaseClick'),
    onProgressUpdate: action('onProgressUpdate')
  }
}

// 컴팩트 모드
export const Compact: Story = {
  args: {
    ...Default.args,
    mode: 'compact',
    showDetails: false
  },
  parameters: {
    docs: {
      description: {
        story: '피드백 페이지나 작은 공간에서 사용하는 컴팩트 모드입니다.'
      }
    }
  }
}

// 완료된 프로젝트
export const Completed: Story = {
  args: {
    ...Default.args,
    project: createMockProject({
      title: '완료된 프로젝트',
      status: 'completed',
      totalProgress: 100,
      phases: [
        {
          phase: 'PLAN',
          title: '기획',
          status: 'completed',
          progress: 100,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-07'),
          actualStartDate: new Date('2025-01-01'),
          actualEndDate: new Date('2025-01-06'),
          assignee: { id: 'user1', name: '김기획' }
        },
        {
          phase: 'SHOOT',
          title: '촬영',
          status: 'completed',
          progress: 100,
          startDate: new Date('2025-01-07'),
          endDate: new Date('2025-01-14'),
          actualStartDate: new Date('2025-01-07'),
          actualEndDate: new Date('2025-01-13'),
          assignee: { id: 'user2', name: '이촬영' }
        },
        {
          phase: 'EDIT',
          title: '편집',
          status: 'completed',
          progress: 100,
          startDate: new Date('2025-01-14'),
          endDate: new Date('2025-01-21'),
          actualStartDate: new Date('2025-01-14'),
          actualEndDate: new Date('2025-01-20'),
          assignee: { id: 'user3', name: '박편집' }
        }
      ]
    })
  },
  parameters: {
    docs: {
      description: {
        story: '모든 단계가 완료된 프로젝트의 간트차트입니다.'
      }
    }
  }
}

// 지연된 프로젝트
export const Delayed: Story = {
  args: {
    ...Default.args,
    project: createMockProject({
      title: '지연된 프로젝트',
      status: 'delayed',
      totalProgress: 30,
      phases: [
        {
          phase: 'PLAN',
          title: '기획',
          status: 'delayed',
          progress: 90,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-07'),
          actualStartDate: new Date('2025-01-01'),
          assignee: { id: 'user1', name: '김기획' },
          notes: '클라이언트 피드백 지연으로 인한 일정 연기'
        },
        {
          phase: 'SHOOT',
          title: '촬영',
          status: 'pending',
          progress: 0,
          startDate: new Date('2025-01-07'),
          endDate: new Date('2025-01-14'),
          assignee: { id: 'user2', name: '이촬영' }
        },
        {
          phase: 'EDIT',
          title: '편집',
          status: 'pending',
          progress: 0,
          startDate: new Date('2025-01-14'),
          endDate: new Date('2025-01-21'),
          assignee: { id: 'user3', name: '박편집' }
        }
      ]
    })
  },
  parameters: {
    docs: {
      description: {
        story: '일정이 지연된 프로젝트의 간트차트입니다. 지연 상태는 빨간색으로 표시됩니다.'
      }
    }
  }
}

// 타임라인 표시
export const WithTimeline: Story = {
  args: {
    ...Default.args,
    showTimeline: true,
    showDetails: true
  },
  parameters: {
    docs: {
      description: {
        story: '각 단계의 시작/종료 날짜가 표시되는 타임라인 모드입니다.'
      }
    }
  }
}

// 읽기 전용 모드
export const ReadOnly: Story = {
  args: {
    ...Default.args,
    readonly: true
  },
  parameters: {
    docs: {
      description: {
        story: '진행률 수정이 불가능한 읽기 전용 모드입니다.'
      }
    }
  }
}

// 로딩 상태
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true
  },
  parameters: {
    docs: {
      description: {
        story: '데이터를 불러오는 중인 로딩 상태입니다.'
      }
    }
  }
}

// 에러 상태
export const Error: Story = {
  args: {
    ...Default.args,
    error: '프로젝트 데이터를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.'
  },
  parameters: {
    docs: {
      description: {
        story: '에러가 발생한 상태의 간트차트입니다.'
      }
    }
  }
}

// 커스텀 아이콘
export const CustomIcons: Story = {
  args: {
    ...Default.args,
    renderPhaseIcon: (phase, status) => {
      const icons = {
        PLAN: '📋',
        SHOOT: '🎬',
        EDIT: '✨'
      }
      const statusColors = {
        completed: '#28a745',
        in_progress: '#1631F8',
        pending: '#ffc107',
        delayed: '#dc3545'
      }
      return (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}
        >
          {icons[phase]}
        </div>
      )
    }
  },
  parameters: {
    docs: {
      description: {
        story: '커스텀 아이콘 렌더러를 사용한 간트차트입니다.'
      }
    }
  }
}

// 커스텀 진행률 라벨
export const CustomProgressLabels: Story = {
  args: {
    ...Default.args,
    renderProgressLabel: (progress) => (
      <div style={{
        padding: '4px 8px',
        backgroundColor: progress === 100 ? '#28a745' : progress > 0 ? '#1631F8' : '#ffc107',
        color: 'white',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {progress}% {progress === 100 ? '완료' : progress > 0 ? '진행중' : '대기'}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '커스텀 진행률 라벨 렌더러를 사용한 간트차트입니다.'
      }
    }
  }
}

// 모바일 시뮬레이션
export const Mobile: Story = {
  args: {
    ...Default.args,
    mode: 'compact',
    showDetails: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: '모바일 환경에서의 간트차트입니다. 자동으로 컴팩트 모드로 전환됩니다.'
      }
    }
  }
}

// 인터랙션 테스트
export const Interactive: Story = {
  args: {
    ...Default.args,
    onPhaseClick: action('Phase clicked'),
    onProgressUpdate: action('Progress updated')
  },
  parameters: {
    docs: {
      description: {
        story: '클릭과 진행률 업데이트가 가능한 인터랙티브 간트차트입니다. Actions 탭에서 이벤트를 확인할 수 있습니다.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // 추가적인 인터랙션 테스트가 필요한 경우 여기에 작성
  }
}