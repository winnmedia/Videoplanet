'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import './MinimalFeedbackInterface.scss'

interface Feedback {
  id: string
  timecode: string
  content: string
  status: 'pending' | 'resolved' | 'in-progress'
  createdAt: Date
  author: string
}

interface MinimalFeedbackInterfaceProps {
  projectId: string
  videoUrl: string
  initialFeedbacks?: Feedback[]
}

export default function MinimalFeedbackInterface({
  projectId,
  videoUrl,
  initialFeedbacks = []
}: MinimalFeedbackInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isAddingFeedback, setIsAddingFeedback] = useState(false)
  const [newFeedbackContent, setNewFeedbackContent] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 시간 포맷팅 (00:00 형식)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 비디오 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // 비디오 메타데이터 로드
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // 피드백 클릭 - 해당 시간으로 이동
  const handleFeedbackClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    
    // 타임코드 파싱 (MM:SS 형식)
    const [mins, secs] = feedback.timecode.split(':').map(Number)
    const timeInSeconds = (mins || 0) * 60 + (secs || 0)
    
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds
      videoRef.current.pause()
    }
  }

  // 피드백 추가
  const handleAddFeedback = () => {
    if (!newFeedbackContent.trim()) return

    const newFeedback: Feedback = {
      id: Date.now().toString(),
      timecode: formatTime(currentTime),
      content: newFeedbackContent,
      status: 'pending',
      createdAt: new Date(),
      author: '현재 사용자'
    }

    setFeedbacks([...feedbacks, newFeedback])
    setNewFeedbackContent('')
    setIsAddingFeedback(false)
  }

  // 피드백 상태 변경
  const handleStatusChange = (feedbackId: string, status: Feedback['status']) => {
    setFeedbacks(feedbacks.map(f => 
      f.id === feedbackId ? { ...f, status } : f
    ))
  }

  // 키보드 단축키 (접근성)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isAddingFeedback) {
        e.preventDefault()
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play()
          } else {
            videoRef.current.pause()
          }
        }
      }
      // ESC로 피드백 추가 취소
      if (e.key === 'Escape' && isAddingFeedback) {
        setIsAddingFeedback(false)
        setNewFeedbackContent('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddingFeedback])

  return (
    <div className="minimal-feedback-interface">
      {/* 비디오 플레이어 섹션 */}
      <section className="video-section" aria-label="비디오 플레이어">
        <video
          ref={videoRef}
          className="video-player"
          src={videoUrl}
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          aria-label="프로젝트 비디오"
        >
          <track kind="captions" />
        </video>
        
        <div className="video-controls">
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </section>

      {/* 피드백 리스트 섹션 */}
      <section className="feedback-section" aria-label="타임코드 피드백">
        <h2 className="section-title">타임코드 피드백</h2>
        
        <div className="feedback-list-container">
          <ul className="feedback-list" role="list">
            {feedbacks
              .sort((a, b) => a.timecode.localeCompare(b.timecode))
              .map((feedback) => (
                <li key={feedback.id} className="feedback-item">
                  <button
                    className={`feedback-button ${
                      selectedFeedback?.id === feedback.id ? 'feedback-button--selected' : ''
                    } feedback-button--${feedback.status}`}
                    onClick={() => handleFeedbackClick(feedback)}
                    aria-label={`${feedback.timecode} - ${feedback.content}`}
                  >
                    <span className="feedback-timecode">{feedback.timecode}</span>
                    <span className="feedback-content">{feedback.content}</span>
                    
                    <select
                      className="feedback-status"
                      value={feedback.status}
                      onChange={(e) => handleStatusChange(feedback.id, e.target.value as Feedback['status'])}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="상태 변경"
                    >
                      <option value="pending">대기</option>
                      <option value="in-progress">진행중</option>
                      <option value="resolved">완료</option>
                    </select>
                  </button>
                </li>
              ))}
          </ul>
          
          {feedbacks.length === 0 && (
            <p className="empty-state">아직 피드백이 없습니다</p>
          )}
        </div>

        {/* 피드백 추가 폼 */}
        {isAddingFeedback ? (
          <form 
            className="feedback-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleAddFeedback()
            }}
          >
            <div className="form-header">
              <span className="form-timecode">{formatTime(currentTime)}</span>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setIsAddingFeedback(false)
                  setNewFeedbackContent('')
                }}
                aria-label="취소"
              >
                취소
              </button>
            </div>
            
            <textarea
              className="feedback-input"
              value={newFeedbackContent}
              onChange={(e) => setNewFeedbackContent(e.target.value)}
              placeholder="피드백 내용을 입력하세요"
              autoFocus
              rows={3}
              aria-label="피드백 내용"
            />
            
            <button
              type="submit"
              className="btn-submit"
              disabled={!newFeedbackContent.trim()}
              aria-label="피드백 저장"
            >
              저장
            </button>
          </form>
        ) : (
          <button
            className="btn-add-feedback"
            onClick={() => setIsAddingFeedback(true)}
            aria-label="현재 시간에 피드백 추가"
          >
            피드백 추가
          </button>
        )}
      </section>
    </div>
  )
}