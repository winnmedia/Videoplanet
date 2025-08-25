'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button/Button'
import { Icon } from '@/shared/ui/Icon/Icon'
import { AppLayout } from '@/shared/ui/AppLayout'
import styles from './page.module.scss'

interface Project {
  id: number
  title: string
  description: string
  status: 'active' | 'review' | 'planning' | 'completed'
  progress: number
  dueDate: string
  members: number
  feedbackCount: number
  createdAt: string
  client: string
  budget: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // Simulate project data loading
        setProjects([
          {
            id: 1,
            title: '브랜드 홍보영상 제작',
            description: '새로운 브랜드 런칭을 위한 홍보영상 제작 프로젝트',
            status: 'active',
            progress: 75,
            dueDate: '2024-02-15',
            members: 4,
            feedbackCount: 3,
            createdAt: '2024-01-15',
            client: 'ABC 기업',
            budget: '500만원'
          },
          {
            id: 2,
            title: '제품 소개 동영상',
            description: '신제품 출시를 위한 소개 동영상 제작',
            status: 'review',
            progress: 90,
            dueDate: '2024-02-20',
            members: 3,
            feedbackCount: 7,
            createdAt: '2024-01-10',
            client: 'XYZ 회사',
            budget: '300만원'
          },
          {
            id: 3,
            title: 'SNS 콘텐츠 시리즈',
            description: '소셜미디어용 콘텐츠 시리즈 제작',
            status: 'planning',
            progress: 25,
            dueDate: '2024-03-01',
            members: 5,
            feedbackCount: 1,
            createdAt: '2024-01-25',
            client: '스타트업 D',
            budget: '800만원'
          },
          {
            id: 4,
            title: '교육용 영상 콘텐츠',
            description: '온라인 교육을 위한 영상 콘텐츠 제작',
            status: 'completed',
            progress: 100,
            dueDate: '2024-01-31',
            members: 3,
            feedbackCount: 5,
            createdAt: '2024-01-01',
            client: '교육기관 E',
            budget: '1000만원'
          },
          {
            id: 5,
            title: '이벤트 하이라이트 영상',
            description: '기업 이벤트 하이라이트 영상 편집',
            status: 'active',
            progress: 60,
            dueDate: '2024-02-25',
            members: 2,
            feedbackCount: 2,
            createdAt: '2024-01-20',
            client: '이벤트 회사 F',
            budget: '200만원'
          }
        ])

      } catch (error) {
        console.error('Projects loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const getStatusClass = (status: string) => {
    return `${styles.projectCard__status} ${styles[`projectCard__status--${status}`]}`
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'review':
        return '검토중'
      case 'planning':
        return '기획중'
      case 'completed':
        return '완료'
      default:
        return '알수없음'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <div className={styles.loading__spinner} aria-hidden="true"></div>
        <span className="sr-only">프로젝트를 불러오는 중...</span>
      </div>
    )
  }

  // TODO(human): AppLayout 래핑 구현
  // 기존의 독립적인 navigation과 레이아웃을 AppLayout 컴포넌트로 통합
  // user 정보와 authentication 상태를 AppLayout에 전달하여 일관된 UX 제공
  
  return (
    <AppLayout 
      user={{ 
        name: 'User', 
        email: 'user@example.com' 
      }}
      showSidebar={true}
      showHeader={true}
    >
      <div className={styles.projectsContent}>

      {/* Main Content */}
      <main className={styles.main} role="main" aria-label="프로젝트 목록">
        {/* Page Header */}
        <div className={styles.header}>
          <div className={styles.header__content}>
            <div>
              <h1 className={styles.header__title}>프로젝트</h1>
              <p className={styles.header__description}>모든 영상 프로젝트를 관리하세요</p>
            </div>
            <Button
              href="/projects/new"
              variant="primary"
              size="medium"
              icon="add"
              iconPosition="left"
              aria-label="새 프로젝트 만들기"
            >
              새 프로젝트 만들기
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={styles.filters} role="region" aria-label="필터 및 검색">
          <div className={styles.filters__container}>
            <div className={styles.filters__content}>
              <div className={styles.filters__buttons} role="group" aria-label="프로젝트 상태 필터">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'ghost'}
                  size="medium"
                  aria-pressed={filter === 'all'}
                  aria-label="모든 프로젝트 보기"
                  data-testid="filter-all"
                >
                  전체
                </Button>
                <Button
                  onClick={() => setFilter('active')}
                  variant={filter === 'active' ? 'primary' : 'ghost'}
                  size="medium"
                  aria-pressed={filter === 'active'}
                  aria-label="진행중인 프로젝트 보기"
                  data-testid="filter-active"
                >
                  진행중
                </Button>
                <Button
                  onClick={() => setFilter('review')}
                  variant={filter === 'review' ? 'primary' : 'ghost'}
                  size="medium"
                  aria-pressed={filter === 'review'}
                  aria-label="검토중인 프로젝트 보기"
                  data-testid="filter-review"
                >
                  검토중
                </Button>
                <Button
                  onClick={() => setFilter('planning')}
                  variant={filter === 'planning' ? 'primary' : 'ghost'}
                  size="medium"
                  aria-pressed={filter === 'planning'}
                  aria-label="기획중인 프로젝트 보기"
                  data-testid="filter-planning"
                >
                  기획중
                </Button>
                <Button
                  onClick={() => setFilter('completed')}
                  variant={filter === 'completed' ? 'primary' : 'ghost'}
                  size="medium"
                  aria-pressed={filter === 'completed'}
                  aria-label="완료된 프로젝트 보기"
                  data-testid="filter-completed"
                >
                  완료
                </Button>
              </div>
              <div className={styles.filters__search}>
                <div className={styles.filters__searchIcon}>
                  <Icon 
                    name="search" 
                    size="small" 
                    color="#9ca3af"
                    decorative
                    data-testid="icon-search"
                  />
                </div>
                <input
                  type="search"
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.filters__searchInput}
                  aria-label="프로젝트 검색"
                  role="searchbox"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={styles.projectGrid} role="list" aria-label="프로젝트 목록">
          {filteredProjects.map((project) => (
            <article 
              key={project.id} 
              className={styles.projectCard} 
              role="listitem" 
              tabIndex={0} 
              aria-label={`${project.title} 프로젝트`}
            >
              <div className={styles.projectCard__content}>
                <div className={styles.projectCard__header}>
                  <span className={getStatusClass(project.status)}>
                    {getStatusText(project.status)}
                  </span>
                  <span className={styles.projectCard__date}>{project.createdAt}</span>
                </div>
                
                <h3 className={styles.projectCard__title}>
                  <Link href={`/projects/${project.id}`}>
                    {project.title}
                  </Link>
                </h3>
                
                <p className={styles.projectCard__description}>
                  {project.description}
                </p>

                <div className={styles.projectCard__progress}>
                  <div className={styles.projectCard__progressHeader}>
                    <span>진행률</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className={styles.projectCard__progressBar}>
                    <div 
                      className={styles.projectCard__progressFill}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className={styles.projectCard__details}>
                  <div className={styles.projectCard__detailItem}>
                    <Icon 
                      name="user" 
                      size={16} 
                      className="flex-shrink-0 mr-2 text-gray-400"
                      decorative
                      data-testid="icon-user"
                    />
                    <span>{project.client}</span>
                  </div>
                  <div className={styles.projectCard__detailItem}>
                    <Icon 
                      name="calendar" 
                      size={16} 
                      className="flex-shrink-0 mr-2 text-gray-400"
                      decorative
                      data-testid="icon-calendar"
                    />
                    <span>마감일: {project.dueDate}</span>
                  </div>
                  <div className={styles.projectCard__detailItem}>
                    <Icon 
                      name="analytics" 
                      size={16} 
                      className="flex-shrink-0 mr-2 text-gray-400"
                      decorative
                      data-testid="icon-analytics"
                    />
                    <span>{project.budget}</span>
                  </div>
                </div>

                <div className={styles.projectCard__footer}>
                  <div className={styles.projectCard__meta}>
                    <div className={styles.projectCard__metaItem}>
                      <Icon 
                        name="user" 
                        size={16} 
                        className="text-gray-400"
                        decorative
                      />
                      <span>{project.members}명</span>
                    </div>
                    <div className={styles.projectCard__metaItem}>
                      <Icon 
                        name="comment" 
                        size={16} 
                        className="text-gray-400"
                        decorative
                      />
                      <span>{project.feedbackCount}개</span>
                    </div>
                  </div>
                  <Button
                    href={`/projects/${project.id}`}
                    variant="tertiary"
                    size="small"
                    icon="chevron-right"
                    iconPosition="right"
                    aria-label={`${project.title} 프로젝트 상세보기`}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className={styles.emptyState} role="status" aria-live="polite">
            <Icon 
              name="folder" 
              size="large" 
              className={styles.emptyState__icon}
              color="#9ca3af"
              decorative
              data-testid="icon-folder"
            />
            <h3 className={styles.emptyState__title}>프로젝트가 없습니다</h3>
            <p className={styles.emptyState__description}>검색 조건을 변경하거나 새 프로젝트를 만들어보세요.</p>
            <div className={styles.emptyState__action}>
              <Button
                href="/projects/new"
                variant="primary"
                size="medium"
                icon="add"
                iconPosition="left"
                aria-label="새 프로젝트 만들기"
              >
                새 프로젝트 만들기
              </Button>
            </div>
          </div>
        )}
      </main>
      </div>
    </AppLayout>
  )
}