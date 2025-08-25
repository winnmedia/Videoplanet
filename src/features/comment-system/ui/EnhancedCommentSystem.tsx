'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/shared/ui/Button/Button'
import { Icon, IconType } from '@/shared/ui/Icon/Icon'
import styles from './EnhancedCommentSystem.module.scss'

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

interface CommentSystemProps {
  comments: Comment[]
  onAddComment: (content: string, timestamp?: number) => void
  onAddReply: (parentId: number, content: string) => void
  onReaction: (commentId: number, reaction: 'like' | 'dislike' | 'question') => void
  currentUser: {
    name: string
    email: string
    isAdmin: boolean
  }
  videoTimestamp?: number
  isGuestMode?: boolean
  onSeekVideo?: (timestamp: number) => void
}

export function EnhancedCommentSystem({
  comments,
  onAddComment,
  onAddReply,
  onReaction,
  currentUser,
  videoTimestamp,
  isGuestMode = false,
  onSeekVideo
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
  const [includeTimestamp, setIncludeTimestamp] = useState(false)

  // 비디오 타임스탬프가 있으면 자동으로 포함
  useEffect(() => {
    if (videoTimestamp !== undefined && videoTimestamp > 0) {
      setIncludeTimestamp(true)
    }
  }, [videoTimestamp])

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSubmitComment = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    onAddComment(newComment, includeTimestamp ? videoTimestamp : undefined)
    setNewComment('')
    setIncludeTimestamp(false)
  }, [newComment, onAddComment, videoTimestamp, includeTimestamp])

  const handleSubmitReply = useCallback((parentId: number) => {
    if (!replyContent.trim()) return

    onAddReply(parentId, replyContent)
    setReplyContent('')
    setReplyingTo(null)
  }, [replyContent, onAddReply])

  const handleReaction = useCallback((commentId: number, reaction: 'like' | 'dislike' | 'question') => {
    onReaction(commentId, reaction)
  }, [onReaction])

  const toggleExpanded = useCallback((commentId: number) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedComments(newExpanded)
  }, [expandedComments])

  const handleTimestampClick = (timestamp: number) => {
    if (onSeekVideo) {
      onSeekVideo(timestamp)
    }
  }

  const renderComment = (comment: Comment, level = 0) => (
    <div key={comment.id} className={`${styles.comment} ${level > 0 ? styles.reply : ''}`}>
      <div className={styles.commentHeader}>
        <div className={styles.authorInfo}>
          <div className={`${styles.avatar} ${comment.isAdmin ? styles.admin : styles.basic} ${isGuestMode ? styles.guest : ''}`}>
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.authorDetails}>
            <div className={styles.authorName}>
              {comment.userName}
              {comment.isAdmin && <span className={styles.adminBadge}>관리자</span>}
              {isGuestMode && !comment.isAdmin && <span className={styles.guestBadge}>게스트</span>}
            </div>
            <div className={styles.timestamp}>
              {comment.timestamp}
              {comment.videoTimestamp !== undefined && (
                <button
                  className={styles.videoTime}
                  onClick={() => handleTimestampClick(comment.videoTimestamp!)}
                  title="클릭하여 해당 시점으로 이동"
                >
                  <Icon type={IconType.PIN} size="xs" className={styles.timeIcon} ariaLabel="타임스탬프" />
                  <span>{formatTime(comment.videoTimestamp)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.commentContent}>
        {comment.content}
      </div>

      <div className={styles.commentActions}>
        <div className={styles.reactions}>
          <button
            className={`${styles.reactionButton} ${
              comment.userReaction === 'like' ? styles.active : ''
            }`}
            onClick={() => handleReaction(comment.id, 'like')}
            aria-label="좋아요"
            title="좋아요"
          >
            <Icon 
              type={IconType.THUMB_UP} 
              size="sm" 
              className={styles.reactionIcon}
              ariaLabel="좋아요 아이콘"
              variant={comment.userReaction === 'like' ? 'primary' : 'neutral'}
            />
            <span className={styles.reactionCount}>{comment.reactions.like || 0}</span>
          </button>
          <button
            className={`${styles.reactionButton} ${
              comment.userReaction === 'dislike' ? styles.active : ''
            }`}
            onClick={() => handleReaction(comment.id, 'dislike')}
            aria-label="싫어요"
            title="싫어요"
          >
            <Icon 
              type={IconType.THUMB_DOWN} 
              size="sm" 
              className={styles.reactionIcon}
              ariaLabel="싫어요 아이콘"
              variant={comment.userReaction === 'dislike' ? 'error' : 'neutral'}
            />
            <span className={styles.reactionCount}>{comment.reactions.dislike || 0}</span>
          </button>
          <button
            className={`${styles.reactionButton} ${
              comment.userReaction === 'question' ? styles.active : ''
            }`}
            onClick={() => handleReaction(comment.id, 'question')}
            aria-label="질문있어요"
            title="질문있어요"
          >
            <Icon 
              type={IconType.QUESTION} 
              size="sm" 
              className={styles.reactionIcon}
              ariaLabel="질문 아이콘"
              variant={comment.userReaction === 'question' ? 'warning' : 'neutral'}
            />
            <span className={styles.reactionCount}>{comment.reactions.question || 0}</span>
          </button>
        </div>

        {level < 2 && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className={styles.replyButton}
          >
            답글 달기
          </Button>
        )}

        {comment.replies.length > 0 && (
          <button
            className={styles.expandButton}
            onClick={() => toggleExpanded(comment.id)}
          >
            <Icon 
              type={expandedComments.has(comment.id) ? IconType.CHEVRON_DOWN : IconType.CHEVRON_RIGHT} 
              size="xs" 
              className={styles.expandIcon}
              ariaLabel={expandedComments.has(comment.id) ? '접기' : '펼치기'}
            />
            답글 {comment.replies.length}개 {expandedComments.has(comment.id) ? '숨기기' : '보기'}
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className={styles.replyForm}>
          <div className={styles.replyInputGroup}>
            <div className={`${styles.avatar} ${styles.small}`}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`${comment.userName}님에게 답글을 작성하세요...`}
              className={styles.replyTextarea}
              rows={2}
            />
          </div>
          <div className={styles.replyActions}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setReplyingTo(null)
                setReplyContent('')
              }}
            >
              취소
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => handleSubmitReply(comment.id)}
              disabled={!replyContent.trim()}
            >
              답글 작성
            </Button>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && expandedComments.has(comment.id) && (
        <div className={styles.replies}>
          {comment.replies.map(reply => renderComment(reply, level + 1))}
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.commentSystem}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          💬 코멘트 
          <span className={styles.count}>({comments.length})</span>
        </h3>
      </div>

      <div className={styles.commentForm}>
        <form onSubmit={handleSubmitComment}>
          <div className={styles.inputGroup}>
            <div className={`${styles.avatar} ${currentUser.isAdmin ? styles.admin : styles.basic} ${isGuestMode ? styles.guest : ''}`}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.inputWrapper}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={videoTimestamp !== undefined ? 
                  `현재 ${formatTime(videoTimestamp)} 시점에 코멘트를 작성하세요...` : 
                  "코멘트를 작성하세요..."
                }
                className={styles.textarea}
                rows={3}
              />
              {videoTimestamp !== undefined && videoTimestamp > 0 && (
                <div className={styles.timestampInfo}>
                  <label className={styles.timestampCheckbox}>
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    />
                    <span>현재 시점 포함 ({formatTime(videoTimestamp)})</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className={styles.formActions}>
            <span className={styles.hint}>
              {isGuestMode ? '게스트로 코멘트를 작성합니다' : ''}
            </span>
            <Button
              type="submit"
              variant="primary"
              size="medium"
              disabled={!newComment.trim()}
            >
              코멘트 작성
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>아직 코멘트가 없습니다.</p>
            <p>첫 번째 코멘트를 작성해보세요!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}