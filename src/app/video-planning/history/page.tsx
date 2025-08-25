'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './HistoryPage.module.scss'

interface PlanningHistory {
  id: string
  title: string
  genre: string
  duration: string
  status: 'draft' | 'completed' | 'in-progress'
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [histories, setHistories] = useState<PlanningHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed' | 'in-progress'>('all')

  useEffect(() => {
    // 시뮬레이션 데이터 로드
    const mockHistories: PlanningHistory[] = [
      {
        id: '1',
        title: '브이래닛 브랜드 홍보영상',
        genre: '홍보영상',
        duration: '60초',
        status: 'completed',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2', 
        title: '영상 협업 플랫폼 소개',
        genre: '제품소개',
        duration: '90초',
        status: 'in-progress',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-22T16:45:00Z'
      },
      {
        id: '3',
        title: '사용자 가이드 튜토리얼',
        genre: '교육영상',
        duration: '3분',
        status: 'draft',
        createdAt: '2024-01-25T08:30:00Z',
        updatedAt: '2024-01-25T08:30:00Z'
      }
    ]

    setTimeout(() => {
      setHistories(mockHistories)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredHistories = histories.filter(history => {
    const matchesSearch = history.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         history.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || history.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745'
      case 'in-progress': return '#1631F8'
      case 'draft': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in-progress': return '진행중'
      case 'draft': return '초안'
      default: return '알 수 없음'
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className={styles.historyPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>기획서 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.historyPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>기획서 관리</h2>
          <p className={styles.subtitle}>
            생성한 영상 기획서를 관리하고 편집할 수 있습니다.
          </p>
          
          <div className={styles.actions}>
            <button 
              className={styles.newButton}
              onClick={() => router.push('/video-planning/ai')}
            >
              + 새 기획서 만들기
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="제목이나 장르로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.statusFilter}>
            <label>상태 필터:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">전체</option>
              <option value="completed">완료</option>
              <option value="in-progress">진행중</option>
              <option value="draft">초안</option>
            </select>
          </div>
        </div>

        {filteredHistories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>기획서가 없습니다</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? '검색 조건에 맞는 기획서가 없습니다.' 
                : 'AI 기획 기능을 사용하여 첫 번째 기획서를 만들어보세요!'
              }
            </p>
            <button 
              className={styles.createButton}
              onClick={() => router.push('/video-planning/ai')}
            >
              기획서 만들기
            </button>
          </div>
        ) : (
          <div className={styles.historyGrid}>
            {filteredHistories.map((history) => (
              <div key={history.id} className={styles.historyCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.title}>{history.title}</h3>
                  <div 
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(history.status) }}
                  >
                    {getStatusText(history.status)}
                  </div>
                </div>
                
                <div className={styles.cardInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>장르:</span>
                    <span>{history.genre}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>길이:</span>
                    <span>{history.duration}</span>
                  </div>
                </div>

                <div className={styles.cardDates}>
                  <div className={styles.dateItem}>
                    <span className={styles.label}>생성:</span>
                    <span>{formatDate(history.createdAt)}</span>
                  </div>
                  <div className={styles.dateItem}>
                    <span className={styles.label}>수정:</span>
                    <span>{formatDate(history.updatedAt)}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.editButton}
                    onClick={() => alert(`"${history.title}" 편집 기능은 개발 중입니다.`)}
                  >
                    편집
                  </button>
                  <button 
                    className={styles.viewButton}
                    onClick={() => alert(`"${history.title}" 미리보기 기능은 개발 중입니다.`)}
                  >
                    미리보기
                  </button>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => alert(`"${history.title}" PDF 다운로드 기능은 개발 중입니다.`)}
                  >
                    PDF
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => {
                      if (confirm(`"${history.title}"를 삭제하시겠습니까?`)) {
                        setHistories(prev => prev.filter(h => h.id !== history.id))
                      }
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.summary}>
          <p>총 {filteredHistories.length}개의 기획서가 있습니다.</p>
        </div>
      </div>
    </div>
  )
}