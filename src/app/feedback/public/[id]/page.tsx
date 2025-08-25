'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EnhancedCommentSystem } from '@/features/comment-system/ui/EnhancedCommentSystem'
import { EnhancedVideoPlayer } from '@/widgets/video-player/ui/EnhancedVideoPlayer'
import styles from './PublicFeedback.module.scss'

interface Comment {
  id: number
  userName: string
  userEmail: string
  content: string
  timestamp: string
  isAdmin: boolean
  videoTimestamp?: number
  reactions: {
    like: number
    dislike: number
    question: number
  }
  userReaction?: 'like' | 'dislike' | 'question'
  replies: Comment[]
}

interface GuestInfo {
  name: string
  email: string
}

export default function PublicFeedbackPage() {
  const params = useParams()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({ name: '', email: '' })
  const [isGuestAuthenticated, setIsGuestAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPublicProject = async () => {
      try {
        const projectId = params.id
        
        // Mock public project data (실제로는 API에서 가져옴)
        if (projectId === 'test') {
          const mockProject = {
            id: projectId,
            name: '공개 피드백 테스트 프로젝트',
            description: '이 프로젝트는 게스트 사용자의 피드백 수집을 위한 공개 프로젝트입니다.',
            video: '/videos/sample-video.mp4',
            isPublic: true,
            allowGuestFeedback: true,
            createdBy: '프로젝트 관리자',
            createdAt: '2024-01-20'
          }
          
          setProject(mockProject)
          setVideoUrl(mockProject.video)
          
          // Mock existing comments
          setComments([
            {
              id: 1,
              userName: '익명 사용자 1',
              userEmail: 'guest1@example.com',
              content: '전체적으로 영상이 매우 좋습니다. 메시지 전달이 명확해요.',
              timestamp: '2024-01-20 14:30',
              isAdmin: false,
              videoTimestamp: 45,
              reactions: { like: 2, dislike: 0, question: 0 },
              replies: []
            },
            {
              id: 2,
              userName: '익명 사용자 2',
              userEmail: 'guest2@example.com',
              content: '음향 품질이 좋네요. 다만 배경음악이 조금 클 수 있어요.',
              timestamp: '2024-01-20 15:45',
              isAdmin: false,
              videoTimestamp: 120,
              reactions: { like: 1, dislike: 0, question: 1 },
              replies: []
            }
          ])
        } else {
          setError('프로젝트를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('Public project loading error:', error)
        setError('프로젝트를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicProject()
  }, [params.id])

  const handleGuestAuth = () => {
    if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
      alert('이름과 이메일을 모두 입력해주세요.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestInfo.email)) {
      alert('올바른 이메일 형식을 입력해주세요.')
      return
    }

    setIsGuestAuthenticated(true)
  }

  const handleAddComment = (content: string, timestamp?: number) => {
    if (!isGuestAuthenticated) {
      alert('피드백을 남기려면 먼저 게스트 정보를 입력해주세요.')
      return
    }

    const comment: Comment = {
      id: Date.now(),
      userName: guestInfo.name,
      userEmail: guestInfo.email,
      content,
      timestamp: new Date().toLocaleString('ko-KR'),
      isAdmin: false,
      videoTimestamp: timestamp,
      reactions: { like: 0, dislike: 0, question: 0 },
      replies: []
    }

    setComments(prev => [...prev, comment])
  }

  const handleAddReply = (parentId: number, content: string) => {
    if (!isGuestAuthenticated) {
      alert('답글을 작성하려면 먼저 게스트 정보를 입력해주세요.')
      return
    }

    const reply: Comment = {
      id: Date.now(),
      userName: guestInfo.name,
      userEmail: guestInfo.email,
      content,
      timestamp: new Date().toLocaleString('ko-KR'),
      isAdmin: false,
      reactions: { like: 0, dislike: 0, question: 0 },
      replies: []
    }

    setComments(prev => prev.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ))
  }

  const handleReaction = (commentId: number, reaction: 'like' | 'dislike' | 'question') => {
    if (!isGuestAuthenticated) {
      alert('반응을 남기려면 먼저 게스트 정보를 입력해주세요.')
      return
    }

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const newReactions = { ...comment.reactions }
        
        // Remove previous reaction if exists
        if (comment.userReaction) {
          newReactions[comment.userReaction] = Math.max(0, newReactions[comment.userReaction] - 1)
        }
        
        // Add new reaction or toggle off if same
        const newUserReaction = comment.userReaction === reaction ? undefined : reaction
        if (newUserReaction) {
          newReactions[newUserReaction] = newReactions[newUserReaction] + 1
        }
        
        return {
          ...comment,
          reactions: newReactions,
          userReaction: newUserReaction
        }
      }
      return comment
    }))
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>프로젝트를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1>오류 발생</h1>
          <p>{error || '프로젝트를 찾을 수 없습니다.'}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.publicFeedbackContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <img 
            src="/images/Common/b_logo.svg" 
            alt="브이래닛 로고" 
            className={styles.logo}
          />
          <div className={styles.projectInfo}>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <span className={styles.publicBadge}>공개 프로젝트</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Guest Authentication Section */}
        {!isGuestAuthenticated && (
          <div className={styles.guestAuth}>
            <div className={styles.authCard}>
              <h2>게스트 정보 입력</h2>
              <p>피드백을 남기시려면 간단한 정보를 입력해주세요.</p>
              
              <div className={styles.authForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="guestName">이름</label>
                  <input
                    id="guestName"
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="홍길동"
                    maxLength={50}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="guestEmail">이메일</label>
                  <input
                    id="guestEmail"
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="guest@example.com"
                  />
                </div>
                
                <button 
                  onClick={handleGuestAuth}
                  className={styles.authButton}
                  disabled={!guestInfo.name.trim() || !guestInfo.email.trim()}
                >
                  피드백 시작하기
                </button>
              </div>
              
              <div className={styles.authNote}>
                <p>* 입력하신 정보는 피드백 작성 목적으로만 사용되며, 별도로 저장되지 않습니다.</p>
                <p>* 이메일은 답변 알림을 위해 필요합니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* Authenticated Content */}
        {isGuestAuthenticated && (
          <div className={styles.contentArea}>
            {/* Video Section */}
            <div className={styles.videoSection}>
              <EnhancedVideoPlayer
                videoUrl={videoUrl}
                onTimestampFeedback={(timestamp) => {
                  setCurrentVideoTime(timestamp)
                  alert(`현재 시간 ${Math.floor(timestamp / 60)}분 ${Math.floor(timestamp % 60)}초에 피드백을 남기세요.`)
                }}
                onScreenshot={(timestamp, imageData) => {
                  console.log('스크린샷 캐처:', timestamp)
                }}
                onShare={() => {
                  const shareUrl = `${window.location.origin}/feedback/public/${params.id}`
                  navigator.clipboard.writeText(shareUrl)
                  alert('공유 링크가 클립보드에 복사되었습니다!')
                }}
                showEnhancedControls={false}
                className={styles.videoPlayer}
              />
              
              <div className={styles.videoInfo}>
                <h3>영상 피드백</h3>
                <p>영상을 시청하고 특정 시점에 대한 피드백을 남겨주세요.</p>
                <div className={styles.currentTime}>
                  현재 시간: {Math.floor(currentVideoTime / 60)}분 {Math.floor(currentVideoTime % 60)}초
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className={styles.commentsSection}>
              <div className={styles.commentsHeader}>
                <h3>피드백 ({comments.length})</h3>
                <div className={styles.userInfo}>
                  <span className={styles.guestBadge}>게스트</span>
                  <span>{guestInfo.name}</span>
                </div>
              </div>
              
              <EnhancedCommentSystem
                comments={comments}
                onAddComment={handleAddComment}
                onAddReply={handleAddReply}
                onReaction={handleReaction}
                currentUser={{
                  name: guestInfo.name,
                  email: guestInfo.email,
                  isAdmin: false
                }}
                videoTimestamp={currentVideoTime}
                isGuestMode={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>Powered by VideoPlanet - 영상 피드백 플랫폼</p>
          <div className={styles.footerLinks}>
            <a href="/privacy">개인정보처리방침</a>
            <a href="/terms">이용약관</a>
          </div>
        </div>
      </footer>
    </div>
  )
}