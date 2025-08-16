// =============================================================================
// VideoPlayer Component - VideoPlanet 비디오 플레이어 컴포넌트
// =============================================================================

'use client';

import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import { VideoPlayerProps, VideoPlayerEvents } from '../types';

interface EnhancedVideoPlayerProps extends VideoPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadStart?: () => void;
  onError?: (error: Error) => void;
  seekTime?: number; // 외부에서 특정 시간으로 이동
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

/**
 * 향상된 비디오 플레이어 컴포넌트
 * 피드백 타임스탬프와 연동되는 기능 제공
 */
const VideoPlayer: React.FC<EnhancedVideoPlayerProps> = memo(({
  url,
  SetVideoLoad,
  onTimeUpdate,
  onSeek,
  onPlay,
  onPause,
  onLoadStart,
  onError,
  seekTime,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // 비디오 로드 시 처리
  useEffect(() => {
    if (videoRef.current && url) {
      videoRef.current.load();
    }
  }, [url]);

  // 외부에서 특정 시간으로 이동
  useEffect(() => {
    if (videoRef.current && typeof seekTime === 'number' && seekTime >= 0) {
      videoRef.current.currentTime = seekTime;
      onSeek?.(seekTime);
    }
  }, [seekTime, onSeek]);

  // 시간 업데이트 핸들러
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  // 메타데이터 로드 완료
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // 비디오 로드 완료
  const handleLoadedData = useCallback(() => {
    SetVideoLoad(false);
    setError(null);
  }, [SetVideoLoad]);

  // 비디오 로드 시작
  const handleLoadStart = useCallback(() => {
    SetVideoLoad(true);
    onLoadStart?.();
  }, [SetVideoLoad, onLoadStart]);

  // 재생 상태 변경
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  // 에러 핸들링
  const handleError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = event.target as HTMLVideoElement;
    const errorMessage = target.error 
      ? `비디오 로드 오류 (코드: ${target.error.code})`
      : '알 수 없는 비디오 오류';
    
    setError(errorMessage);
    SetVideoLoad(false);
    
    const errorObj = new Error(errorMessage);
    onError?.(errorObj);
    
    console.error('Video error:', target.error);
  }, [SetVideoLoad, onError]);

  // 볼륨 변경
  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
    }
  }, []);

  // 시간을 MM:SS 형식으로 포맷
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }, []);

  // 프로그레스 바 클릭 핸들러
  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    onSeek?.(newTime);
  }, [duration, onSeek]);

  // 키보드 단축키 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!videoRef.current) return;
    
    switch (event.key) {
      case ' ': // 스페이스바: 재생/일시정지
        event.preventDefault();
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        break;
        
      case 'ArrowLeft': // 왼쪽 화살표: 5초 뒤로
        event.preventDefault();
        videoRef.current.currentTime = Math.max(0, currentTime - 5);
        break;
        
      case 'ArrowRight': // 오른쪽 화살표: 5초 앞으로
        event.preventDefault();
        videoRef.current.currentTime = Math.min(duration, currentTime + 5);
        break;
        
      case 'ArrowUp': // 위쪽 화살표: 볼륨 증가
        event.preventDefault();
        videoRef.current.volume = Math.min(1, volume + 0.1);
        break;
        
      case 'ArrowDown': // 아래쪽 화살표: 볼륨 감소
        event.preventDefault();
        videoRef.current.volume = Math.max(0, volume - 0.1);
        break;
    }
  }, [isPlaying, currentTime, duration, volume]);

  if (error) {
    return (
      <div className={`video-error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`video-player-container ${className}`}>
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        controlsList="nodownload"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onLoadStart={handleLoadStart}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onVolumeChange={handleVolumeChange}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="피드백 비디오 플레이어"
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
        <source src={url} type="video/quicktime" />
        <source src={url} type="video/ogg" />
        <source src={url} type="video/x-msvideo" />
        <source src={url} type="video/x-mplayer2" />
        <track kind="captions" src="" srcLang="ko" label="한국어" />
        
        <div className="video-fallback">
          <p>이 브라우저는 비디오 재생을 지원하지 않습니다.</p>
          <a href={url} download>비디오 다운로드</a>
        </div>
      </video>

      {/* 커스텀 컨트롤 (필요시) */}
      {!controls && (
        <div className="custom-controls">
          <div className="progress-container" onClick={handleProgressClick}>
            <div className="progress-bar">
              <div 
                className="progress-filled"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          <div className="control-buttons">
            <button
              className="play-pause-btn"
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                }
              }}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {/* 접근성을 위한 정보 */}
      <div className="sr-only" aria-live="polite">
        현재 재생 시간: {formatTime(currentTime)}
        {seekTime !== undefined && `${formatTime(seekTime)}로 이동했습니다.`}
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;