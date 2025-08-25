'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/shared/ui/AppLayout'
import styles from '../Projects.module.scss'

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // Load user data
        const userData = localStorage.getItem('user')
        if (userData) {
          setUser(JSON.parse(userData))
        }

        // Simulate project data loading
        const projectId = params.id
        const mockProject = {
          id: projectId,
          name: `프로젝트 ${projectId}`,
          description: '브랜드 홍보영상 제작 프로젝트입니다.',
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2024-02-28',
          progress: 75,
          members: [
            { id: 1, name: '김영상', email: 'kim@example.com', role: 'admin' },
            { id: 2, name: '이디자인', email: 'lee@example.com', role: 'designer' },
            { id: 3, name: '박편집', email: 'park@example.com', role: 'editor' }
          ],
          files: [
            { id: 1, name: '스크립트_v1.pdf', size: '2.5MB', type: 'document' },
            { id: 2, name: '시안_디자인.png', size: '1.8MB', type: 'image' },
            { id: 3, name: '음악_배경.mp3', size: '5.2MB', type: 'audio' }
          ]
        }

        setProject(mockProject)

        // Set projects list for sidebar
        setProjects([
          { id: 1, name: '브랜드 홍보영상 제작', status: 'active' },
          { id: 2, name: '제품 소개 동영상', status: 'review' },
          { id: 3, name: 'SNS 콘텐츠 시리즈', status: 'planning' }
        ])

      } catch (error) {
        console.error('Project loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [params.id, router])


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <AppLayout user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">프로젝트를 찾을 수 없습니다</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <div className={styles.projectWrapper}>
          <div className={`${styles.content} ${styles.project}`}>
            <div className={styles.title}>
              <span onClick={() => router.back()}></span>
              {project.name}
            </div>

            {/* Project Info Panel */}
            <div className={styles.infoWrap}>
              <div className={styles.nameBox}>
                <button className={styles.toggleBtn}>
                  프로젝트 정보
                </button>
                <div className={styles.sTitle}>{project.name}</div>
              </div>
              
              <div className={styles.box}>
                <div className={styles.inner}>
                  <div className={styles.explanation}>
                    <div className={styles.ssTitle}>
                      <span>프로젝트 설명</span>
                    </div>
                    <p>{project.description}</p>
                  </div>

                  <div className={styles.member}>
                    <div className={styles.ssTitle}>
                      <span>팀 멤버</span>
                    </div>
                    <ul>
                      {project.members.map((member: any) => (
                        <li key={member.id} className={member.role === 'admin' ? styles.admin : styles.basic}>
                          <div className={styles.img}>
                            <img src="/images/Cms/profie_sample.png" alt={member.name} />
                          </div>
                          <div className={styles.txt}>
                            {member.name}
                            <span>{member.email}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.info}>
                    <div className={styles.ssTitle}>
                      <span>프로젝트 정보</span>
                    </div>
                    <dl>
                      <dt>시작일</dt>
                      <dd>{project.startDate}</dd>
                    </dl>
                    <dl>
                      <dt>마감일</dt>
                      <dd>{project.endDate}</dd>
                    </dl>
                    <dl>
                      <dt>진행률</dt>
                      <dd>{project.progress}%</dd>
                    </dl>
                    <dl>
                      <dt>상태</dt>
                      <dd>{project.status === 'active' ? '진행중' : project.status}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Files */}
            <div className={styles.part}>
              <div className={styles.sTitle}>프로젝트 파일</div>
              <div className={styles.fileList}>
                {project.files.map((file: any) => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{file.size}</div>
                    <div className={styles.fileActions}>
                      <button className={styles.downloadBtn}>다운로드</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.btnWrap}>
              <button 
                className={styles.submit}
                onClick={() => router.push(`/projects/${project.id}/edit`)}
              >
                프로젝트 수정
              </button>
              <button 
                className={styles.submit}
                onClick={() => router.push(`/feedback/${project.id}`)}
              >
                피드백 보기
              </button>
            </div>
          </div>
      </div>
    </AppLayout>
  )
}