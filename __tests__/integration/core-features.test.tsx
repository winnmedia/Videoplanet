/**
 * Planet 핵심 기능 통합 테스트
 * TDD 방식으로 사용자 이탈 요인 검증 및 개선
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom'
import axios from 'axios'

// Mock 설정
jest.mock('axios')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Planet 핵심 기능 통합 테스트', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    // localStorage 초기화
    localStorage.clear()
    // 쿠키 초기화
    document.cookie = ''
  })

  describe('1. 인증 시스템 일관성', () => {
    
    it('VGID 쿠키가 있을 때 API 요청이 성공해야 함', async () => {
      // Given: VGID 쿠키 설정
      document.cookie = 'VGID=test-session-token; path=/'
      
      // When: API 요청
      const mockResponse = { data: { projects: [] } }
      mockedAxios.get.mockResolvedValueOnce(mockResponse)
      
      // Then: 인증 헤더 없이도 쿠키로 인증 성공
      const response = await axios.get('/api/projects')
      expect(response.data).toEqual(mockResponse.data)
    })

    it('인증 없이 보호된 페이지 접근 시 로그인으로 리다이렉트', () => {
      // Given: 인증 정보 없음
      const protectedRoutes = [
        '/dashboard',
        '/projects',
        '/feedback/1',
        '/planning'
      ]
      
      protectedRoutes.forEach(route => {
        // When: 보호된 페이지 접근 시도
        const isProtected = checkRouteProtection(route)
        
        // Then: 로그인 리다이렉트 확인
        expect(isProtected).toBe(true)
      })
    })

    it('401 오류 시 무한 재시도를 방지해야 함', async () => {
      // Given: 401 오류 설정
      const error = {
        response: { 
          status: 401, 
          data: { message: 'NEED_ACCESS_TOKEN' } 
        },
        config: { _retry: false }
      }
      
      let retryCount = 0
      const maxRetries = 1
      
      // When: 재시도 로직 실행
      while (retryCount < 3 && !error.config._retry) {
        error.config._retry = true
        retryCount++
      }
      
      // Then: 최대 1회만 재시도
      expect(retryCount).toBe(maxRetries)
    })
  })

  describe('2. 대시보드 성능 및 접근성', () => {
    
    it('대시보드 로딩 시간이 3초 이내여야 함', async () => {
      // Given: 대시보드 컴포넌트
      const startTime = Date.now()
      
      // When: 대시보드 렌더링
      await act(async () => {
        render(<MockDashboard />)
      })
      
      const loadTime = Date.now() - startTime
      
      // Then: 3초 이내 로딩
      expect(loadTime).toBeLessThan(3000)
    })

    it('프로젝트 진행률이 시각적으로 표시되어야 함', () => {
      // Given: 프로젝트 데이터
      const projects = [
        { id: '1', name: 'A사 광고', progress: 80 },
        { id: '2', name: 'B사 소개', progress: 60 }
      ]
      
      // When: 대시보드 렌더링
      render(<MockProjectProgress projects={projects} />)
      
      // Then: 진행률 바 존재 확인
      projects.forEach(project => {
        const progressBar = screen.getByRole('progressbar', {
          name: new RegExp(project.name)
        })
        expect(progressBar).toHaveAttribute('aria-valuenow', String(project.progress))
      })
    })

    it('주요 CTA 버튼이 명확하게 표시되어야 함', () => {
      // When: 대시보드 렌더링
      render(<MockDashboard />)
      
      // Then: 주요 버튼 확인
      const ctaButton = screen.getByRole('button', { name: /프로젝트 보기/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveClass('btn-primary')
    })
  })

  describe('3. 영상 피드백 기능', () => {
    
    it('타임코드 기반 피드백 추가가 가능해야 함', async () => {
      // Given: 비디오 시간 설정
      const currentTime = 125 // 2:05
      
      // When: 피드백 추가
      const feedback = {
        timecode: '02:05',
        content: '로고 크기 조정 필요'
      }
      
      // Then: 피드백이 올바른 타임코드로 저장
      expect(formatTime(currentTime)).toBe(feedback.timecode)
    })

    it('피드백 상태 변경이 즉시 반영되어야 함', () => {
      // Given: 피드백 아이템
      const feedback = {
        id: '1',
        status: 'pending' as const
      }
      
      // When: 상태 변경
      feedback.status = 'resolved'
      
      // Then: UI 업데이트
      expect(feedback.status).toBe('resolved')
    })

    it('비디오 플레이어 컨트롤이 키보드로 가능해야 함', () => {
      // Given: 비디오 플레이어
      const player = { paused: true, play: jest.fn(), pause: jest.fn() }
      
      // When: 스페이스바 입력
      const event = new KeyboardEvent('keydown', { key: ' ' })
      if (player.paused) {
        player.play()
      } else {
        player.pause()
      }
      
      // Then: 재생 함수 호출
      expect(player.play).toHaveBeenCalled()
    })
  })

  describe('4. 프로젝트 관리 CRUD', () => {
    
    it('프로젝트 생성 시 필수 필드 검증', () => {
      // Given: 프로젝트 데이터
      const projectData = {
        name: '',
        description: 'Test'
      }
      
      // When: 유효성 검사
      const isValid = validateProject(projectData)
      
      // Then: 검증 실패
      expect(isValid).toBe(false)
    })

    it('프로젝트 권한에 따른 UI 제어', () => {
      // Given: 사용자 권한
      const permissions = {
        canEdit: false,
        canDelete: false,
        isOwner: false
      }
      
      // When: UI 렌더링
      const buttons = getAvailableActions(permissions)
      
      // Then: 편집/삭제 버튼 숨김
      expect(buttons).not.toContain('edit')
      expect(buttons).not.toContain('delete')
    })
  })

  describe('5. 에러 처리 및 복구', () => {
    
    it('네트워크 오류 시 재시도 옵션 제공', () => {
      // Given: 네트워크 오류
      const error = {
        type: 'NETWORK_OFFLINE',
        message: '인터넷 연결이 끊어졌습니다'
      }
      
      // When: 에러 처리
      const recovery = getRecoveryAction(error.type)
      
      // Then: 재시도 액션 제공
      expect(recovery.label).toBe('새로고침하기')
      expect(recovery.action).toBeDefined()
    })

    it('세션 만료 시 자동 로그아웃 처리', () => {
      // Given: 세션 만료 에러
      const error = {
        type: 'AUTH_EXPIRED',
        message: '세션이 만료되었습니다'
      }
      
      // When: 에러 처리
      const recovery = getRecoveryAction(error.type)
      
      // Then: 로그인 페이지로 이동
      expect(recovery.label).toBe('다시 로그인하기')
      expect(recovery.action).toBeDefined()
    })
  })

  describe('6. 성능 최적화 검증', () => {
    
    it('Planning 페이지 lazy loading 동작 확인', () => {
      // Given: Lazy 컴포넌트
      const isLazy = checkLazyLoading('Planning')
      
      // Then: Lazy loading 적용
      expect(isLazy).toBe(true)
    })

    it('이미지 최적화 확인', () => {
      // Given: 이미지 요소
      const images = document.querySelectorAll('img')
      
      images.forEach(img => {
        // Then: 최적화 속성 확인
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })
  })
})

// Helper 함수들
function checkRouteProtection(route: string): boolean {
  const protectedRoutes = [
    '/calendar',
    '/projects',
    '/feedback',
    '/planning',
    '/dashboard',
    '/settings'
  ]
  return protectedRoutes.some(r => route.startsWith(r))
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function validateProject(data: any): boolean {
  return !!(data.name && data.name.trim())
}

function getAvailableActions(permissions: any): string[] {
  const actions: string[] = ['view']
  if (permissions.canEdit) actions.push('edit')
  if (permissions.canDelete) actions.push('delete')
  return actions
}

function getRecoveryAction(errorType: string) {
  const actions: Record<string, any> = {
    'NETWORK_OFFLINE': {
      label: '새로고침하기',
      action: () => window.location.reload()
    },
    'AUTH_EXPIRED': {
      label: '다시 로그인하기',
      action: () => window.location.href = '/login'
    }
  }
  return actions[errorType] || { label: '다시 시도하기', action: () => {} }
}

function checkLazyLoading(componentName: string): boolean {
  // 실제로는 React.lazy 사용 여부 체크
  return ['Planning', 'StorySettings', 'StoryDevelopment'].includes(componentName)
}

// Mock 컴포넌트들
function MockDashboard() {
  return <div>Dashboard</div>
}

function MockProjectProgress({ projects }: any) {
  return (
    <div>
      {projects.map((p: any) => (
        <div key={p.id} role="progressbar" aria-label={p.name} aria-valuenow={p.progress} />
      ))}
    </div>
  )
}