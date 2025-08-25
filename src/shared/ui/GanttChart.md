# GanttChart 컴포넌트 사용 가이드

VideoPlanet 프로젝트의 3단계 진행 상황(기획 → 촬영 → 편집)을 시각화하는 간트차트 컴포넌트입니다.

## 📋 목차

1. [설치 및 설정](#설치-및-설정)
2. [기본 사용법](#기본-사용법)
3. [Redux 연동](#redux-연동)
4. [Props API](#props-api)
5. [스타일 커스터마이징](#스타일-커스터마이징)
6. [접근성](#접근성)
7. [예제 모음](#예제-모음)
8. [문제 해결](#문제-해결)

## 설치 및 설정

### 1. 컴포넌트 임포트

```typescript
import { GanttChart } from '@/shared/ui'
import type { ProjectInfo, GanttChartProps } from '@/shared/ui'
```

### 2. Redux 설정 (선택사항)

Redux를 사용하는 경우 store에 gantt reducer를 추가하세요.

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { ganttReducer } from '@/shared/lib/gantt'

export const store = configureStore({
  reducer: {
    gantt: ganttReducer,
    // ... 다른 리듀서들
  }
})

export type RootState = ReturnType<typeof store.getState>
```

## 기본 사용법

### 최소 구현

```typescript
import React from 'react'
import { GanttChart } from '@/shared/ui'

const MyComponent: React.FC = () => {
  const projectData: ProjectInfo = {
    id: 'project-1',
    title: '홍보 영상 제작',
    description: '회사 홍보 영상 제작 프로젝트',
    totalProgress: 65,
    status: 'in_progress',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    phases: [
      {
        phase: 'PLAN',
        title: '기획',
        status: 'completed',
        progress: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        assignee: { id: 'user1', name: '김기획' }
      },
      {
        phase: 'SHOOT',
        title: '촬영',
        status: 'in_progress',
        progress: 60,
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
  }

  return (
    <GanttChart 
      project={projectData}
      onPhaseClick={(phase) => console.log('Phase clicked:', phase)}
    />
  )
}
```

### 대시보드 전체 뷰

```typescript
<GanttChart
  project={projectData}
  mode="dashboard"
  showDetails={true}
  showTimeline={true}
  showTooltip={true}
  onPhaseClick={handlePhaseClick}
  onProgressUpdate={handleProgressUpdate}
/>
```

### 피드백 페이지 컴팩트 뷰

```typescript
<GanttChart
  project={projectData}
  mode="compact"
  showDetails={false}
  showTimeline={false}
  readonly={true}
/>
```

## Redux 연동

### 1. 훅 사용

```typescript
import { useGanttChart } from '@/shared/lib/gantt'

const ProjectDashboard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { project, isLoading, error, actions } = useGanttChart(projectId)

  const handleProgressUpdate = (phase: ProjectPhase, progress: number) => {
    actions.updatePhaseProgress(projectId, phase, progress)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!project) return <div>Project not found</div>

  return (
    <GanttChart
      project={project}
      onProgressUpdate={handleProgressUpdate}
    />
  )
}
```

### 2. 매니저 훅 사용

```typescript
import { useGanttChartManager } from '@/shared/lib/gantt'

const ProjectManager: React.FC = () => {
  const manager = useGanttChartManager()

  const loadProject = async (projectId: string) => {
    manager.setLoading(true)
    try {
      const projectData = await fetchProjectData(projectId)
      manager.setProject(projectData)
    } catch (error) {
      manager.setError('Failed to load project')
    } finally {
      manager.setLoading(false)
    }
  }

  return (
    <div>
      {manager.getAllProjects().map(project => (
        <GanttChart key={project.id} project={project} />
      ))}
    </div>
  )
}
```

### 3. 실시간 업데이트

```typescript
import { useGanttRealtime } from '@/shared/lib/gantt'

const LiveGanttChart: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { project, refresh, startPolling } = useGanttRealtime(
    projectId, 
    true, // 폴링 활성화
    30000 // 30초마다 업데이트
  )

  useEffect(() => {
    const stopPolling = startPolling()
    return stopPolling
  }, [startPolling])

  return (
    <div>
      <button onClick={refresh}>새로고침</button>
      {project && <GanttChart project={project} />}
    </div>
  )
}
```

## Props API

### GanttChartProps

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `project` | `ProjectInfo` | **필수** | 프로젝트 데이터 |
| `mode` | `'dashboard' \| 'compact'` | `'dashboard'` | 표시 모드 |
| `className` | `string` | - | 커스텀 CSS 클래스 |
| `style` | `React.CSSProperties` | - | 인라인 스타일 |
| `onPhaseClick` | `(phase: ProjectPhase) => void` | - | 단계 클릭 핸들러 |
| `onProgressUpdate` | `(phase: ProjectPhase, progress: number) => void` | - | 진행률 업데이트 핸들러 |
| `isLoading` | `boolean` | `false` | 로딩 상태 |
| `error` | `string \| null` | `null` | 에러 메시지 |
| `readonly` | `boolean` | `false` | 읽기 전용 모드 |
| `showTooltip` | `boolean` | `true` | 툴팁 표시 |
| `showDetails` | `boolean` | `true` | 상세 정보 표시 |
| `showTimeline` | `boolean` | `false` | 타임라인 표시 |
| `renderPhaseIcon` | `(phase: ProjectPhase, status: ProgressStatus) => ReactNode` | - | 커스텀 아이콘 렌더러 |
| `renderProgressLabel` | `(progress: number) => ReactNode` | - | 커스텀 진행률 라벨 렌더러 |

### ProjectInfo 타입

```typescript
interface ProjectInfo {
  id: string                    // 프로젝트 ID
  title: string                 // 프로젝트 명
  description?: string          // 프로젝트 설명
  totalProgress: number         // 전체 진행률 (0-100)
  status: ProgressStatus        // 프로젝트 상태
  createdAt: Date              // 생성일
  updatedAt: Date              // 수정일
  phases: PhaseProgress[]       // 단계별 정보
}
```

### PhaseProgress 타입

```typescript
interface PhaseProgress {
  phase: ProjectPhase           // 단계 ('PLAN' | 'SHOOT' | 'EDIT')
  title: string                 // 단계명
  description?: string          // 단계 설명
  status: ProgressStatus        // 진행 상태
  progress: number              // 진행률 (0-100)
  startDate: Date              // 시작 날짜
  endDate: Date                // 종료 날짜
  actualStartDate?: Date       // 실제 시작 날짜
  actualEndDate?: Date         // 실제 종료 날짜
  assignee?: {                 // 담당자
    id: string
    name: string
    avatar?: string
  }
  notes?: string               // 메모
}
```

## 스타일 커스터마이징

### 1. CSS 변수 오버라이드

```css
.custom-gantt {
  --gantt-completed-color: #22c55e;
  --gantt-in-progress-color: #3b82f6;
  --gantt-pending-color: #f59e0b;
  --gantt-delayed-color: #ef4444;
  --gantt-background: #f8fafc;
  --gantt-border: #e2e8f0;
}
```

### 2. SCSS 변수 사용

```scss
@import '~/src/app/styles/variables.css';

.my-gantt {
  .gantt-chart {
    border-radius: var(--border-radius-xl);
    box-shadow: var(--shadow-2xl);
  }
  
  .phase-item {
    &.completed {
      background: linear-gradient(135deg, var(--color-success) 0%, #22c55e 100%);
    }
  }
}
```

### 3. 커스텀 테마

```typescript
import { GanttChart } from '@/shared/ui'
import { DEFAULT_GANTT_THEME } from '@/shared/ui/GanttChart.types'

const darkTheme = {
  ...DEFAULT_GANTT_THEME,
  background: '#1f2937',
  text: '#f9fafb',
  border: '#374151'
}

const CustomThemedGantt: React.FC = () => {
  return (
    <div style={{ backgroundColor: darkTheme.background }}>
      <GanttChart 
        project={projectData}
        style={{
          backgroundColor: darkTheme.background,
          color: darkTheme.text,
          borderColor: darkTheme.border
        }}
      />
    </div>
  )
}
```

## 접근성

### 키보드 내비게이션

- `Tab`: 간트차트 진입/탈출
- `Arrow Left/Right`: 단계간 이동
- `Enter/Space`: 단계 선택
- `Escape`: 포커스 해제

### ARIA 속성

```typescript
// 자동으로 추가되는 ARIA 속성들
<div role="region" aria-label="프로젝트 진행 간트차트">
  <div role="button" aria-label="기획 단계, 완료됨, 진행률 100%">
    {/* 단계 내용 */}
  </div>
</div>
```

### 스크린 리더 지원

```typescript
// 커스텀 ARIA 라벨 제공
<GanttChart
  project={projectData}
  renderPhaseIcon={(phase, status) => (
    <div aria-label={`${phase} 단계 아이콘`}>
      {/* 아이콘 */}
    </div>
  )}
/>
```

## 예제 모음

### 1. 실시간 WebSocket 연동

```typescript
import { useEffect } from 'react'
import { useGanttChartManager } from '@/shared/lib/gantt'

const RealtimeGanttChart: React.FC<{ projectId: string }> = ({ projectId }) => {
  const manager = useGanttChartManager()
  const project = manager.getProject(projectId)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost/project/${projectId}`)
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      if (update.type === 'PHASE_PROGRESS') {
        manager.updatePhase(projectId, update.phase, {
          progress: update.progress,
          status: update.status
        })
      }
    }

    return () => ws.close()
  }, [projectId, manager])

  return project ? <GanttChart project={project} /> : null
}
```

### 2. 애니메이션 효과

```typescript
import { useState, useTransition } from 'react'

const AnimatedGanttChart: React.FC = () => {
  const [project, setProject] = useState(initialProject)
  const [isPending, startTransition] = useTransition()

  const updateProgress = (phase: ProjectPhase, progress: number) => {
    startTransition(() => {
      setProject(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.phase === phase ? { ...p, progress } : p
        )
      }))
    })
  }

  return (
    <GanttChart
      project={project}
      isLoading={isPending}
      onProgressUpdate={updateProgress}
    />
  )
}
```

### 3. 다중 프로젝트 비교

```typescript
const ProjectComparison: React.FC<{ projectIds: string[] }> = ({ projectIds }) => {
  const manager = useGanttChartManager()
  
  return (
    <div className="grid gap-4">
      {projectIds.map(id => {
        const project = manager.getProject(id)
        return project ? (
          <GanttChart 
            key={id}
            project={project}
            mode="compact"
            readonly={true}
          />
        ) : null
      })}
    </div>
  )
}
```

### 4. 모바일 최적화

```typescript
import { useMediaQuery } from '@/shared/lib/hooks'

const ResponsiveGanttChart: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  return (
    <GanttChart
      project={projectData}
      mode={isMobile ? 'compact' : 'dashboard'}
      showDetails={!isMobile}
      showTimeline={!isMobile}
    />
  )
}
```

## 문제 해결

### Q: 진행률이 업데이트되지 않아요.

A: Redux 상태가 올바르게 연결되었는지 확인하세요.

```typescript
// store에 gantt reducer가 추가되어 있는지 확인
const store = configureStore({
  reducer: {
    gantt: ganttReducer, // ← 이 부분이 있는지 확인
  }
})

// Provider로 감싸져 있는지 확인
<Provider store={store}>
  <App />
</Provider>
```

### Q: 스타일이 제대로 적용되지 않아요.

A: SCSS 모듈이 올바르게 임포트되었는지 확인하세요.

```typescript
// 컴포넌트 내부에서
import styles from './GanttChart.module.scss' // ← .module.scss 확인

// CSS 변수가 정의되어 있는지 확인
:root {
  --gantt-completed-color: #28a745;
  /* ... */
}
```

### Q: 툴팁이 화면 밖으로 나가요.

A: 툴팁 위치를 조정하거나 커스텀 렌더러를 사용하세요.

```typescript
// 툴팁 위치 계산 로직
const showTooltip = useCallback((content: string, event: React.MouseEvent) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = Math.min(event.clientX, window.innerWidth - 300)
  const y = Math.max(event.clientY - 100, 10)
  
  setTooltip({ visible: true, content, x, y })
}, [])
```

### Q: 접근성 검사에서 오류가 나요.

A: ARIA 레이블과 역할이 올바른지 확인하세요.

```typescript
// 올바른 ARIA 속성 사용
<GanttChart
  project={projectData}
  // 커스텀 ARIA 레이블 제공 시
  renderPhaseIcon={(phase, status) => (
    <div 
      role="img"
      aria-label={`${phase} 단계 아이콘, 상태: ${status}`}
    >
      {icon}
    </div>
  )}
/>
```

### Q: 성능이 느려요.

A: React.memo를 사용하거나 불필요한 리렌더링을 최적화하세요.

```typescript
import { memo } from 'react'

const OptimizedGanttChart = memo(GanttChart, (prevProps, nextProps) => {
  return (
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.mode === nextProps.mode &&
    prevProps.readonly === nextProps.readonly
  )
})
```

---

## 📞 지원

문제가 지속되거나 추가 기능이 필요한 경우:

1. GitHub Issues에 버그 리포트 또는 기능 요청 등록
2. 프로젝트 문서의 FAQ 섹션 확인
3. 개발팀에 직접 문의

**마지막 업데이트**: 2025-08-22  
**버전**: 1.0.0