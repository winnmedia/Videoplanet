'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/shared/ui/Button/Button'
import { Tooltip } from './components/Tooltip'
import { 
  UploadIcon, 
  ReplaceIcon, 
  FeedbackIcon, 
  ScreenshotIcon, 
  ShareIcon,
  PlayIcon,
  PauseIcon 
} from './icons'
import type { VideoPlayerProps, VideoTimestamp } from '../model/types'
import styles from './EnhancedVideoPlayer.module.scss'

export const EnhancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onVideoUpload,
  onVideoReplace,
  onTimestampFeedback,
  onScreenshot,
  onShare,
  projectId,
  isEditable = false,
  showEnhancedControls = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)

  // TODO(human): 비디오 시간 추적 및 포맷팅 로직을 여기에 구현하세요
  // 1. 비디오 현재 시간을 추적하는 상태 관리 로직
  // 2. 타임스탬프를 포맷팅하는 함수 (M:SS 또는 H:MM:SS 형식)
  // 3. 스크린샷 캡처 로직 (canvas 사용)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      if (videoUrl) {
        await onVideoReplace(file)
      } else {
        await onVideoUpload(file)
      }
    } catch (error) {
      console.error('Video upload failed:', error)
    } finally {
      setIsUploading(false)
      setShowReplaceConfirm(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/feedback/public/${projectId}`
    const shareData = {
      url: shareUrl,
      timestamp: currentTime,
      title: 'VideoPlanet 피드백',
      text: `${formatTimestamp(currentTime)}에서 피드백을 확인하세요`
    }
    onShare(shareData)
  }

  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoUrl])

  return (
    <div className={styles.playerContainer}>
      {/* Project Info Section - 상단으로 이동 */}
      <div className={styles.projectInfo}>
        <h2 className={styles.projectTitle}>프로젝트 정보</h2>
        {/* 프로젝트 정보는 부모 컴포넌트에서 전달받아 표시 */}
      </div>

      {/* Video Player */}
      <div className={styles.videoWrapper}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className={styles.video}
              controls={false}
              onClick={handlePlayPause}
            />
            
            {/* Overlay Controls */}
            {showEnhancedControls && (
              <div className={styles.overlayControls}>
                <Tooltip content={`현재 시점에 피드백 추가 (${formatTimestamp(currentTime)})`}>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => onTimestampFeedback(currentTime)}
                    icon={<FeedbackIcon size={20} />}
                    aria-label="현재 시점에 피드백 추가"
                  />
                </Tooltip>
                
                <Tooltip content="스크린샷 캡처">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      // 스크린샷 로직은 TODO(human)에서 구현
                    }}
                    icon={<ScreenshotIcon size={20} />}
                    aria-label="스크린샷 캡처"
                  />
                </Tooltip>
                
                <Tooltip content="영상 공유">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={handleShare}
                    icon={<ShareIcon size={20} />}
                    aria-label="영상 공유"
                  />
                </Tooltip>
              </div>
            )}
            
            {/* Play/Pause Button */}
            <button
              className={styles.playButton}
              onClick={handlePlayPause}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? <PauseIcon size={48} color="white" /> : <PlayIcon size={48} color="white" />}
            </button>
          </>
        ) : (
          <div className={styles.uploadZone}>
            <UploadIcon size={48} color="#9ca3af" />
            <p>영상을 업로드하세요</p>
            <Button
              variant="primary"
              size="medium"
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
            >
              영상 선택
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {videoUrl && isEditable && (
        <div className={styles.bottomControls}>
          {showReplaceConfirm ? (
            <div className={styles.confirmReplace}>
              <span>영상을 교체하시겠습니까?</span>
              <Button
                variant="danger"
                size="small"
                onClick={() => fileInputRef.current?.click()}
              >
                교체
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowReplaceConfirm(false)}
              >
                취소
              </Button>
            </div>
          ) : (
            <Tooltip content="영상 교체">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowReplaceConfirm(true)}
                icon={<ReplaceIcon size={20} />}
                aria-label="영상 교체"
              >
                영상 교체
              </Button>
            </Tooltip>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Hidden Canvas for Screenshot */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  )
}