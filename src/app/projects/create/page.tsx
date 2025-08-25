'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/shared/ui/AppLayout'
import styles from '../Projects.module.scss'

export default function ProjectCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    members: [] as string[],
    files: [] as File[]
  })

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

        // Set projects list for sidebar
        setProjects([
          { id: 1, name: '브랜드 홍보영상 제작', status: 'active' },
          { id: 2, name: '제품 소개 동영상', status: 'review' },
          { id: 3, name: 'SNS 콘텐츠 시리즈', status: 'planning' }
        ])

      } catch (error) {
        console.error('Page loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate new project ID
      const newProjectId = Math.floor(Math.random() * 1000) + 4
      
      alert('프로젝트가 성공적으로 생성되었습니다!')
      router.push(`/projects/${newProjectId}`)
      
    } catch (error) {
      console.error('Project creation error:', error)
      alert('프로젝트 생성 중 오류가 발생했습니다.')
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AppLayout user={user}>
      <div className={styles.projectWrapper}>
          <div className={`${styles.content} ${styles.project} ${styles.edit}`}>
            <div className={styles.title}>
              <span onClick={() => router.back()}></span>
              새 프로젝트 만들기
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.group}>
                <div className={styles.part}>
                  <div className={styles.sTitle}>기본 정보</div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="name">프로젝트 이름</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="프로젝트 이름을 입력하세요"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="description">프로젝트 설명</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder="프로젝트에 대한 설명을 입력하세요"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className={styles.part}>
                  <div className={styles.sTitle}>일정 설정</div>
                  
                  <div className={styles.dateGroup}>
                    <div className={styles.formGroup}>
                      <label htmlFor="startDate">시작일</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="endDate">마감일</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.part}>
                  <div className={styles.sTitle}>파일 업로드</div>
                  
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="files"
                      multiple
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                    />
                    <label htmlFor="files" className={styles.fileLabel}>
                      파일 선택
                    </label>
                  </div>

                  {formData.files.length > 0 && (
                    <div className={styles.fileList}>
                      {formData.files.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                          <span className={styles.fileName}>{file.name}</span>
                          <span className={styles.fileSize}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className={styles.removeBtn}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.btnWrap}>
                <button 
                  type="button"
                  className={`${styles.submit} ${styles.cancel}`}
                  onClick={() => router.back()}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className={styles.submit}
                >
                  프로젝트 생성
                </button>
              </div>
            </form>
          </div>
      </div>
    </AppLayout>
  )
}