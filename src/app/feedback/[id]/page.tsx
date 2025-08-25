'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/shared/ui/AppLayout'
import { EnhancedVideoPlayer } from '@/widgets/video-player/ui/EnhancedVideoPlayer'
import { EnhancedCommentSystem } from '@/features/comment-system/ui/EnhancedCommentSystem'
import { MemberInvitation } from '@/features/member-invitation/ui/MemberInvitation'
import styles from '../Feedback.module.scss'

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

interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  sentAt: string
  role: 'viewer' | 'commenter' | 'editor' | 'admin'
  invitedBy: string
  lastSentAt?: string
  resendCount: number
}

export default function FeedbackDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState('comment')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)

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
          name: `프로젝트 ${projectId} 피드백`,
          description: '브랜드 홍보영상 제작 프로젝트의 피드백 시스템입니다.',
          video: '/videos/sample-video.mp4',
          members: [
            { id: 1, name: '김영상', email: 'kim@example.com', role: 'admin' },
            { id: 2, name: '이디자인', email: 'lee@example.com', role: 'designer' },
            { id: 3, name: '박편집', email: 'park@example.com', role: 'editor' }
          ]
        }

        setProject(mockProject)
        setVideoUrl(mockProject.video)

        // Mock enhanced comments with reactions and replies
        setComments([
          {
            id: 1,
            userName: '김영상',
            userEmail: 'kim@example.com',
            content: '전체적으로 좋은 영상입니다. 브랜드 톤앤매너가 잘 반영되었네요.',
            timestamp: '2024-01-20 14:30',
            isAdmin: true,
            videoTimestamp: 45,
            reactions: { like: 3, dislike: 0, question: 1 },
            userReaction: 'like',
            replies: [
              {
                id: 4,
                userName: '이디자인',
                userEmail: 'lee@example.com',
                content: '감사합니다! 피드백 반영하겠습니다.',
                timestamp: '2024-01-20 14:45',
                isAdmin: false,
                reactions: { like: 1, dislike: 0, question: 0 },
                replies: []
              }
            ]
          },
          {
            id: 2,
            userName: '이디자인',
            userEmail: 'lee@example.com',
            content: '색상 보정 부분에서 조금 더 따뜻한 톤으로 조정하면 어떨까요?',
            timestamp: '2024-01-20 15:45',
            isAdmin: false,
            videoTimestamp: 150,
            reactions: { like: 2, dislike: 0, question: 0 },
            replies: []
          },
          {
            id: 3,
            userName: '박편집',
            userEmail: 'park@example.com',
            content: '2분 30초 구간의 전환 효과를 부드럽게 수정하겠습니다.',
            timestamp: '2024-01-20 16:12',
            isAdmin: false,
            videoTimestamp: 150,
            reactions: { like: 1, dislike: 0, question: 1 },
            replies: []
          }
        ])

        // Mock invitations
        setInvitations([
          {
            id: '1',
            email: 'new.member@example.com',
            status: 'pending',
            sentAt: '2024-01-20 10:00',
            role: 'commenter',
            invitedBy: '김영상',
            resendCount: 0
          },
          {
            id: '2',
            email: 'designer@example.com',
            status: 'accepted',
            sentAt: '2024-01-19 14:30',
            role: 'editor',
            invitedBy: '김영상',
            resendCount: 1
          }
        ])

        // Set projects list for sidebar
        setProjects([
          { id: 1, name: '브랜드 홍보영상 제작', status: 'active' },
          { id: 2, name: '제품 소개 동영상', status: 'review' },
          { id: 3, name: 'SNS 콘텐츠 시리즈', status: 'planning' }
        ])

      } catch (error) {
        console.error('Feedback loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [params.id, router])

  // Enhanced video player handlers
  const handleVideoUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
  }

  const handleVideoReplace = (file: File) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
  }

  const handleTimestampFeedback = (timestamp: number) => {
    setCurrentVideoTime(timestamp)
    setActiveTab('comment')
    // TODO: Scroll to comment form or highlight timestamp
  }

  const handleScreenshot = () => {
    console.log('Screenshot taken at', currentVideoTime)
    // TODO: Implement screenshot functionality
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/feedback/${params.id}`
    navigator.clipboard.writeText(shareUrl)
    alert('공유 링크가 클립보드에 복사되었습니다!')
  }

  // Enhanced comment system handlers
  const handleAddComment = (content: string, timestamp?: number) => {
    const comment: Comment = {
      id: Date.now(),
      userName: user?.name || '사용자',
      userEmail: user?.email || 'user@example.com',
      content,
      timestamp: new Date().toLocaleString('ko-KR'),
      isAdmin: user?.role === 'admin' || false,
      videoTimestamp: timestamp,
      reactions: { like: 0, dislike: 0, question: 0 },
      replies: []
    }

    setComments(prev => [...prev, comment])
  }

  const handleAddReply = (parentId: number, content: string) => {
    const reply: Comment = {
      id: Date.now(),
      userName: user?.name || '사용자',
      userEmail: user?.email || 'user@example.com',
      content,
      timestamp: new Date().toLocaleString('ko-KR'),
      isAdmin: user?.role === 'admin' || false,
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

  // Member invitation handlers
  const handleSendInvitation = (email: string, role: string) => {
    const invitation: Invitation = {
      id: Date.now().toString(),
      email,
      status: 'pending',
      sentAt: new Date().toLocaleString('ko-KR'),
      role: role as any,
      invitedBy: user?.name || '관리자',
      resendCount: 0
    }

    setInvitations(prev => [...prev, invitation])
    console.log('Invitation sent:', invitation)
  }

  const handleResendInvitation = (invitationId: string) => {
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId 
        ? { 
            ...inv, 
            lastSentAt: new Date().toLocaleString('ko-KR'),
            resendCount: inv.resendCount + 1 
          }
        : inv
    ))
    console.log('Invitation resent:', invitationId)
  }

  const handleRevokeInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    console.log('Invitation revoked:', invitationId)
  }


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
      <div className={styles.feedbackWrapper}>
          <div className={`${styles.content} ${styles.feedback}`}>
            <div className={styles.title}>
              <span onClick={() => router.back()}></span>
              {project.name}
            </div>

            {/* Project Information Section */}
            <div className={styles.projectInfoSection}>
              <div className={styles.projectDetails}>
                <h2>프로젝트 정보</h2>
                <div className={styles.projectMeta}>
                  <div className={styles.projectName}>{project.name}</div>
                  <div className={styles.projectDescription}>{project.description}</div>
                  <div className={styles.projectStatus}>상태: 피드백 진행중</div>
                </div>
                <button 
                  className={styles.projectDetailBtn}
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  프로젝트 상세보기
                </button>
              </div>
            </div>

            <div className={styles.feedbackContainer}>
              {/* Enhanced Video Player */}
              <div className={styles.videoSection}>
                <EnhancedVideoPlayer
                  videoUrl={videoUrl}
                  onVideoUpload={handleVideoUpload}
                  onVideoReplace={handleVideoReplace}
                  onTimestampFeedback={handleTimestampFeedback}
                  onScreenshot={handleScreenshot}
                  onShare={handleShare}
                  className={styles.enhancedPlayer}
                />
              </div>

              {/* Sidebar with Enhanced Components */}
              <div className={styles.sidebox}>
                <div className={styles.sTitle}>피드백</div>

                <div className={styles.topBox}>
                  <ul className={styles.tabMenu}>
                    <li 
                      className={activeTab === 'comment' ? styles.active : ''}
                      onClick={() => setActiveTab('comment')}
                    >
                      코멘트
                    </li>
                    <li 
                      className={activeTab === 'info' ? styles.active : ''}
                      onClick={() => setActiveTab('info')}
                    >
                      정보
                    </li>
                    <li 
                      className={activeTab === 'member' ? styles.active : ''}
                      onClick={() => setActiveTab('member')}
                    >
                      멤버
                    </li>
                    <li 
                      className={activeTab === 'invite' ? styles.active : ''}
                      onClick={() => setActiveTab('invite')}
                    >
                      초대
                    </li>
                  </ul>
                </div>

                <div className={styles.tabContent}>
                  {activeTab === 'comment' && (
                    <div className={styles.commentSection}>
                      <EnhancedCommentSystem
                        comments={comments}
                        onAddComment={handleAddComment}
                        onAddReply={handleAddReply}
                        onReaction={handleReaction}
                        currentUser={{
                          name: user?.name || '사용자',
                          email: user?.email || 'user@example.com',
                          isAdmin: user?.role === 'admin' || false
                        }}
                        videoTimestamp={currentVideoTime}
                      />
                    </div>
                  )}

                  {activeTab === 'info' && (
                    <div className={styles.info}>
                      <dl>
                        <dt>프로젝트명</dt>
                        <dd>{project.name}</dd>
                      </dl>
                      <dl>
                        <dt>설명</dt>
                        <dd>{project.description}</dd>
                      </dl>
                      <dl>
                        <dt>상태</dt>
                        <dd>피드백 진행중</dd>
                      </dl>
                      <dl>
                        <dt>멤버 수</dt>
                        <dd>{project.members.length}명</dd>
                      </dl>
                      <dl>
                        <dt>생성일</dt>
                        <dd>2024-01-20</dd>
                      </dl>
                    </div>
                  )}

                  {activeTab === 'member' && (
                    <div className={styles.member}>
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
                  )}

                  {activeTab === 'invite' && (
                    <div className={styles.inviteSection}>
                      <MemberInvitation
                        invitations={invitations}
                        onSendInvitation={handleSendInvitation}
                        onResendInvitation={handleResendInvitation}
                        onRevokeInvitation={handleRevokeInvitation}
                        isLoading={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </AppLayout>
  )
}