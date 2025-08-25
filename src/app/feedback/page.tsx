'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GanttChart } from '@/shared/ui/GanttChart'
import type { ProjectInfo, PhaseProgress } from '@/shared/ui/GanttChart.types'
import { Button } from '@/shared/ui/Button/Button'
import { Icon } from '@/shared/ui/Icon/Icon'

export default function FeedbackPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // Simulate feedback data loading
        setFeedbacks([
          {
            id: 1,
            projectTitle: '브랜드 홍보영상 제작',
            projectId: 1,
            content: '전체적인 영상의 톤앤매너가 브랜드와 잘 맞습니다. 다만 2분 30초 부분의 텍스트가 너무 빠르게 지나가는 것 같아요.',
            author: '김프로듀서',
            status: 'pending',
            priority: 'high',
            timestamp: '03:25',
            createdAt: '2024-02-10 14:30',
            section: 'video'
          },
          {
            id: 2,
            projectTitle: '제품 소개 동영상',
            projectId: 2,
            content: '색감 보정이 필요해 보입니다. 제품의 실제 색상과 다소 차이가 있는 것 같습니다.',
            author: '이디렉터',
            status: 'resolved',
            priority: 'medium',
            timestamp: '01:45',
            createdAt: '2024-02-09 16:20',
            section: 'color'
          },
          {
            id: 3,
            projectTitle: 'SNS 콘텐츠 시리즈',
            projectId: 3,
            content: '오프닝 음악이 타겟 고객층에게 어필할 수 있을지 의문입니다. 좀 더 젊은 느낌의 음악으로 교체해보면 어떨까요?',
            author: '박기획자',
            status: 'in_progress',
            priority: 'low',
            timestamp: '00:15',
            createdAt: '2024-02-08 11:15',
            section: 'audio'
          },
          {
            id: 4,
            projectTitle: '브랜드 홍보영상 제작',
            projectId: 1,
            content: '마지막 CTA 부분의 버튼 크기를 키우고 더 눈에 띄게 만들어주세요.',
            author: '최마케터',
            status: 'pending',
            priority: 'high',
            timestamp: '04:50',
            createdAt: '2024-02-07 09:45',
            section: 'graphics'
          },
          {
            id: 5,
            projectTitle: '제품 소개 동영상',
            projectId: 2,
            content: '자막의 폰트 크기가 모바일에서 보기에 작은 것 같습니다. 가독성을 높여주세요.',
            author: '한UX디자이너',
            status: 'pending',
            priority: 'medium',
            timestamp: '02:10',
            createdAt: '2024-02-06 15:30',
            section: 'typography'
          }
        ])

        // 현재 피드백 중인 프로젝트의 간트차트 데이터 생성
        setCurrentProject(createFeedbackProjectData())

      } catch (error) {
        console.error('Feedback loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // 피드백 페이지에서 보여줄 현재 진행 중인 프로젝트 데이터
  const createFeedbackProjectData = (): ProjectInfo => {
    const baseDate = new Date()
    
    return {
      id: 'feedback-project-001',
      title: '브랜드 홍보영상 제작',
      description: '현재 피드백 수집 중인 메인 프로젝트',
      totalProgress: 75,
      status: 'in_progress',
      createdAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      phases: [
        {
          phase: 'PLAN',
          title: '기획',
          description: '콘셉트 기획 및 스토리보드 완료',
          status: 'completed',
          progress: 100,
          startDate: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000),
          endDate: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000),
          assignee: { id: 'user1', name: '김기획' },
          notes: '클라이언트 최종 승인 완료'
        },
        {
          phase: 'SHOOT',
          title: '촬영',
          description: '메인 촬영 완료, 후보정 단계',
          status: 'completed',
          progress: 100,
          startDate: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000),
          endDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          assignee: { id: 'user2', name: '박촬영' },
          notes: '모든 씬 촬영 완료'
        },
        {
          phase: 'EDIT',
          title: '편집',
          description: '1차 편집 완료, 피드백 반영 중',
          status: 'in_progress',
          progress: 75,
          startDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          assignee: { id: 'user3', name: '이편집' },
          notes: '1차 편집본 완성, 피드백 수집 및 반영 진행 중'
        }
      ] as PhaseProgress[]
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'in_progress':
        return '진행중'
      case 'resolved':
        return '완료'
      default:
        return '알수없음'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return '없음'
    }
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'video':
        return 'video'
      case 'audio':
        return 'volume-up'
      case 'graphics':
        return 'camera'
      case 'typography':
        return 'document'
      case 'color':
        return 'settings'
      default:
        return 'comment'
    }
  }

  const filteredFeedbacks = feedbacks.filter(feedback => {
    return filter === 'all' || feedback.status === filter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img 
                  src="/images/Common/b_logo.svg" 
                  alt="브이래닛 로고" 
                  className="h-8 w-auto"
                />
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 px-1 pt-1 pb-4 text-sm font-medium">
                  대시보드
                </Link>
                <Link href="/projects" className="text-gray-500 hover:text-gray-700 px-1 pt-1 pb-4 text-sm font-medium">
                  프로젝트
                </Link>
                <Link href="/feedback" className="text-blue-600 border-b-2 border-blue-600 px-1 pt-1 pb-4 text-sm font-medium">
                  피드백
                </Link>
                <Link href="/planning" className="text-gray-500 hover:text-gray-700 px-1 pt-1 pb-4 text-sm font-medium">
                  기획
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link 
                href="/dashboard" 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium mr-4"
              >
                대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 py-6 sm:px-0 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">피드백</h1>
            <p className="mt-2 text-gray-600">프로젝트에 대한 피드백을 확인하고 관리하세요</p>
          </div>
          <Button
            variant="primary"
            size="medium"
            icon="add"
            onClick={() => console.log('Add new feedback')}
            aria-label="새 피드백 추가"
          >
            새 피드백 추가
          </Button>
        </div>

        {/* Video Player Section */}
        <div className="mb-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">비디오 미리보기</h2>
            <p className="text-sm text-gray-500 mt-1">피드백이 적용된 영상을 확인하세요</p>
          </div>
          <div className="p-6">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <Icon name="video" size="large" className="mx-auto mb-4 text-gray-400" decorative />
                <p className="text-gray-500 mb-4">비디오 플레이어 영역</p>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="secondary"
                    size="medium"
                    icon="play"
                    iconOnly
                    aria-label="재생"
                    onClick={() => console.log('Play video')}
                  />
                  <Button
                    variant="secondary"
                    size="medium"
                    icon="pause"
                    iconOnly
                    aria-label="일시정지"
                    onClick={() => console.log('Pause video')}
                  />
                  <Button
                    variant="secondary"
                    size="medium"
                    icon="stop"
                    iconOnly
                    aria-label="정지"
                    onClick={() => console.log('Stop video')}
                  />
                  <Button
                    variant="secondary"
                    size="medium"
                    icon="rewind"
                    iconOnly
                    aria-label="되감기"
                    onClick={() => console.log('Rewind video')}
                  />
                  <Button
                    variant="secondary"
                    size="medium"
                    icon="fast-forward"
                    iconOnly
                    aria-label="빨리감기"
                    onClick={() => console.log('Fast forward video')}
                  />
                  <Button
                    variant="ghost"
                    size="medium"
                    icon="volume-up"
                    iconOnly
                    aria-label="볼륨 조절"
                    onClick={() => console.log('Volume control')}
                  />
                  <Button
                    variant="ghost"
                    size="medium"
                    icon="fullscreen"
                    iconOnly
                    aria-label="전체화면"
                    onClick={() => console.log('Fullscreen')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Timeline Header */}
        {currentProject && (
          <div className="mb-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">프로젝트 진행 상황</h2>
                  <p className="text-sm text-gray-500 mt-1">현재 피드백 수집 중인 프로젝트</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    편집 단계
                  </span>
                  <span className="text-2xl font-bold text-gray-900">{currentProject.totalProgress}%</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <GanttChart
                project={currentProject}
                mode="compact"
                showDetails={false}
                showTimeline={true}
                readonly={true}
                showTooltip={true}
                onPhaseClick={(phase) => {
                  console.log('Phase navigation:', phase)
                  // 필요 시 해당 단계 상세 페이지로 이동
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <Icon name="clock" size="small" color="white" decorative />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">대기중인 피드백</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {feedbacks.filter(f => f.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <Icon name="settings" size="small" color="white" decorative />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">진행중인 피드백</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {feedbacks.filter(f => f.status === 'in_progress').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <Icon name="check" size="small" color="white" decorative />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">완료된 피드백</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {feedbacks.filter(f => f.status === 'resolved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex space-x-4">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="medium"
                aria-label="모든 피드백 보기"
              >
                전체
              </Button>
              <Button
                onClick={() => setFilter('pending')}
                variant={filter === 'pending' ? 'primary' : 'ghost'}
                size="medium"
                aria-label="대기중인 피드백 보기"
              >
                대기중
              </Button>
              <Button
                onClick={() => setFilter('in_progress')}
                variant={filter === 'in_progress' ? 'primary' : 'ghost'}
                size="medium"
                aria-label="진행중인 피드백 보기"
              >
                진행중
              </Button>
              <Button
                onClick={() => setFilter('resolved')}
                variant={filter === 'resolved' ? 'primary' : 'ghost'}
                size="medium"
                aria-label="완료된 피드백 보기"
              >
                완료
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredFeedbacks.map((feedback) => (
              <li key={feedback.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          <Link href={`/projects/${feedback.projectId}`} className="hover:underline">
                            {feedback.projectTitle}
                          </Link>
                        </p>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                            {getStatusText(feedback.status)}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                            {getPriorityText(feedback.priority)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Icon 
                              name={getSectionIcon(feedback.section)} 
                              size="small" 
                              decorative 
                              aria-label={`${feedback.section} 섹션`}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-2">
                            {feedback.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                              <span>작성자: {feedback.author}</span>
                              <span>시간: {feedback.timestamp}</span>
                              <span>작성일: {feedback.createdAt}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="small"
                                icon="reply"
                                iconOnly
                                aria-label="답변하기"
                                onClick={() => console.log('Reply to feedback', feedback.id)}
                              />
                              <Button
                                variant="ghost"
                                size="small"
                                icon="edit"
                                iconOnly
                                aria-label="수정하기"
                                onClick={() => console.log('Edit feedback', feedback.id)}
                              />
                              <Button
                                variant="ghost"
                                size="small"
                                icon={feedback.status === 'resolved' ? 'check' : 'clock'}
                                iconOnly
                                aria-label={feedback.status === 'resolved' ? '완료됨' : '상태 변경'}
                                onClick={() => console.log('Change status', feedback.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-12">
            <Icon name="comment" size="large" className="mx-auto text-gray-400" decorative />
            <h3 className="mt-2 text-sm font-medium text-gray-900">피드백이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">선택한 상태의 피드백이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  )
}