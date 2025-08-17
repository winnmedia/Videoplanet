// =============================================================================
// FeedbackTimeline Component - 피드백 타임라인 시각화 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Feedback } from '../types';

interface FeedbackTimelineProps {
  feedbacks: Feedback[];
  videoDuration?: number; // 비디오 총 길이 (초)
  currentTime?: number; // 현재 재생 시간 (초)
  onTimestampClick?: (timestamp: string) => void; // 타임스탬프 클릭 이벤트
  onTimeJump?: (time: number) => void; // 특정 시간으로 이동
  className?: string;
  showTimeTooltip?: boolean; // 시간 툴팁 표시 여부
  compactMode?: boolean; // 컴팩트 모드
}

interface TimelineMarker {
  id: number;
  timestamp: string;
  timeInSeconds: number;
  feedbacks: Feedback[];
  density: number; // 해당 시점의 피드백 밀도
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: {
    timestamp: string;
    feedbacks: Feedback[];
  } | null;
}

/**
 * 피드백 타임라인 시각화 컴포넌트
 * - 시간대별 피드백 밀도 시각화
 * - 클릭으로 특정 시점 이동
 * - 호버로 피드백 미리보기
 * - 현재 재생 시간 표시
 */
const FeedbackTimeline: React.FC<FeedbackTimelineProps> = memo(({
  feedbacks,
  videoDuration = 3600, // 기본 1시간
  currentTime = 0,
  onTimestampClick,
  onTimeJump,
  className = '',
  showTimeTooltip = true,
  compactMode = false,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 타임스탬프를 초로 변환하는 함수
  const parseTimestamp = useCallback((timestamp: string): number => {
    if (!timestamp) return 0;

    const parts = timestamp.split(':').map(Number);
    let seconds = 0;

    if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
      // MM:SS 형식
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
      // HH:MM:SS 형식
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return seconds;
  }, []);

  // 초를 타임스탬프로 변환하는 함수
  const formatTimestamp = useCallback((seconds: number): string => {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }, []);

  // 타임라인 마커 데이터 생성
  const timelineMarkers = useMemo(() => {
    const markers: TimelineMarker[] = [];
    const feedbacksByTime = new Map<number, Feedback[]>();

    // 피드백을 시간별로 그룹화
    feedbacks.forEach(feedback => {
      const timeInSeconds = parseTimestamp(feedback.section);
      if (timeInSeconds >= 0 && timeInSeconds <= videoDuration) {
        if (!feedbacksByTime.has(timeInSeconds)) {
          feedbacksByTime.set(timeInSeconds, []);
        }
        feedbacksByTime.get(timeInSeconds)!.push(feedback);
      }
    });

    // 마커 생성
    feedbacksByTime.forEach((feedbackList, timeInSeconds) => {
      markers.push({
        id: timeInSeconds,
        timestamp: formatTimestamp(timeInSeconds),
        timeInSeconds,
        feedbacks: feedbackList,
        density: feedbackList.length,
      });
    });

    return markers.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
  }, [feedbacks, videoDuration, parseTimestamp, formatTimestamp]);

  // 최대 피드백 밀도 계산
  const maxDensity = useMemo(() => {
    return Math.max(...timelineMarkers.map(marker => marker.density), 1);
  }, [timelineMarkers]);

  // 시간 구간별 피드백 밀도 히트맵 데이터 생성
  const heatmapData = useMemo(() => {
    const segments = compactMode ? 50 : 100; // 구간 수
    const segmentDuration = videoDuration / segments;
    const heatmap: number[] = new Array(segments).fill(0);

    timelineMarkers.forEach(marker => {
      const segmentIndex = Math.floor(marker.timeInSeconds / segmentDuration);
      if (segmentIndex >= 0 && segmentIndex < segments) {
        heatmap[segmentIndex] = (heatmap[segmentIndex] || 0) + marker.density;
      }
    });

    const maxSegmentDensity = Math.max(...heatmap, 1);
    return heatmap.map(density => density / maxSegmentDensity);
  }, [timelineMarkers, videoDuration, compactMode]);

  // 마우스 위치에서 시간 계산
  const getTimeFromMousePosition = useCallback((event: React.MouseEvent<HTMLDivElement>): number => {
    if (!timelineRef.current) return 0;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    return percentage * videoDuration;
  }, [videoDuration]);

  // 클릭 이벤트 핸들러
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const time = getTimeFromMousePosition(event);
    const timestamp = formatTimestamp(time);
    
    if (onTimestampClick) {
      onTimestampClick(timestamp);
    }
    
    if (onTimeJump) {
      onTimeJump(time);
    }
  }, [getTimeFromMousePosition, formatTimestamp, onTimestampClick, onTimeJump]);

  // 마우스 호버 이벤트 핸들러
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!showTimeTooltip || isDragging) return;

    const time = getTimeFromMousePosition(event);
    setHoveredTime(time);

    // 해당 시간대의 피드백 찾기 (±5초 범위)
    const toleranceSeconds = 5;
    const nearbyFeedbacks = timelineMarkers.filter(marker => 
      Math.abs(marker.timeInSeconds - time) <= toleranceSeconds
    );

    if (nearbyFeedbacks.length > 0) {
      const allFeedbacks = nearbyFeedbacks.flatMap(marker => marker.feedbacks);
      
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        content: {
          timestamp: formatTimestamp(time),
          feedbacks: allFeedbacks,
        },
      });
    } else {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        content: {
          timestamp: formatTimestamp(time),
          feedbacks: [],
        },
      });
    }
  }, [getTimeFromMousePosition, formatTimestamp, showTimeTooltip, isDragging, timelineMarkers]);

  // 마우스 떠났을 때
  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredTime(null);
  }, []);

  // 마커 클릭 이벤트 핸들러
  const handleMarkerClick = useCallback((marker: TimelineMarker, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onTimestampClick) {
      onTimestampClick(marker.timestamp);
    }
    
    if (onTimeJump) {
      onTimeJump(marker.timeInSeconds);
    }
  }, [onTimestampClick, onTimeJump]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!timelineRef.current) return;

    let newTime = currentTime;
    const step = videoDuration * 0.01; // 1% 단위로 이동

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newTime = Math.max(0, currentTime - step);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newTime = Math.min(videoDuration, currentTime + step);
        break;
      case 'Home':
        event.preventDefault();
        newTime = 0;
        break;
      case 'End':
        event.preventDefault();
        newTime = videoDuration;
        break;
      default:
        return;
    }

    if (onTimeJump) {
      onTimeJump(newTime);
    }
  }, [currentTime, videoDuration, onTimeJump]);

  // 툴팁 위치 조정
  useEffect(() => {
    if (tooltip.visible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = tooltip.x;
      let adjustedY = tooltip.y - tooltipRect.height - 10;

      // 오른쪽 경계 체크
      if (adjustedX + tooltipRect.width > viewportWidth) {
        adjustedX = viewportWidth - tooltipRect.width - 10;
      }

      // 왼쪽 경계 체크
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // 상단 경계 체크
      if (adjustedY < 10) {
        adjustedY = tooltip.y + 20;
      }

      if (adjustedX !== tooltip.x || adjustedY !== tooltip.y) {
        setTooltip(prev => ({ ...prev, x: adjustedX, y: adjustedY }));
      }
    }
  }, [tooltip]);

  const currentTimePercentage = (currentTime / videoDuration) * 100;

  return (
    <div className={`feedback-timeline ${compactMode ? 'compact' : ''} ${className}`}>
      {/* 타임라인 헤더 */}
      <div className="timeline-header">
        <div className="timeline-info">
          <span className="timeline-title">피드백 타임라인</span>
          <span className="timeline-stats">
            {timelineMarkers.length}개 마커, 총 {feedbacks.length}개 피드백
          </span>
        </div>
        <div className="timeline-controls">
          <span className="current-time">{formatTimestamp(currentTime)}</span>
          <span className="total-time">/ {formatTimestamp(videoDuration)}</span>
        </div>
      </div>

      {/* 메인 타임라인 */}
      <div
        ref={timelineRef}
        className="timeline-container"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="피드백 타임라인"
        aria-valuemin={0}
        aria-valuemax={videoDuration}
        aria-valuenow={currentTime}
        aria-valuetext={`현재 시간: ${formatTimestamp(currentTime)}`}
      >
        {/* 히트맵 배경 */}
        <div className="timeline-heatmap">
          {heatmapData.map((density, index) => (
            <div
              key={index}
              className="heatmap-segment"
              style={{
                opacity: Math.max(0.1, density),
                background: `rgba(22, 49, 248, ${density})`,
              }}
            />
          ))}
        </div>

        {/* 타임라인 트랙 */}
        <div className="timeline-track">
          {/* 현재 재생 위치 */}
          <div
            className="current-time-indicator"
            style={{ left: `${currentTimePercentage}%` }}
          >
            <div className="indicator-line" />
            <div className="indicator-handle" />
          </div>

          {/* 호버 시간 표시 */}
          {hoveredTime !== null && (
            <div
              className="hover-time-indicator"
              style={{ left: `${(hoveredTime / videoDuration) * 100}%` }}
            />
          )}

          {/* 피드백 마커들 */}
          {timelineMarkers.map(marker => {
            const leftPercentage = (marker.timeInSeconds / videoDuration) * 100;
            const markerSize = compactMode 
              ? Math.min(8 + marker.density * 2, 16)
              : Math.min(12 + marker.density * 3, 24);

            return (
              <div
                key={marker.id}
                className={`timeline-marker density-${Math.min(marker.density, 5)}`}
                style={{
                  left: `${leftPercentage}%`,
                  width: `${markerSize}px`,
                  height: `${markerSize}px`,
                }}
                onClick={(e) => handleMarkerClick(marker, e)}
                title={`${marker.timestamp} - ${marker.density}개 피드백`}
                role="button"
                tabIndex={0}
                aria-label={`${marker.timestamp} 시점으로 이동, ${marker.density}개 피드백`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMarkerClick(marker, e as any);
                  }
                }}
              >
                <span className="marker-count">{marker.density}</span>
              </div>
            );
          })}
        </div>

        {/* 시간 눈금 */}
        <div className="timeline-scale">
          {Array.from({ length: compactMode ? 6 : 11 }, (_, index) => {
            const time = (videoDuration / (compactMode ? 5 : 10)) * index;
            const leftPercentage = (time / videoDuration) * 100;
            
            return (
              <div
                key={index}
                className="scale-mark"
                style={{ left: `${leftPercentage}%` }}
              >
                <div className="scale-tick" />
                <span className="scale-label">{formatTimestamp(time)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 툴팁 */}
      {tooltip.visible && tooltip.content && (
        <div
          ref={tooltipRef}
          className="timeline-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            zIndex: 1000,
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-time">{tooltip.content.timestamp}</span>
          </div>
          <div className="tooltip-content">
            {tooltip.content.feedbacks.length > 0 ? (
              <div className="feedback-preview">
                <div className="feedback-count">
                  {tooltip.content.feedbacks.length}개 피드백
                </div>
                {tooltip.content.feedbacks.slice(0, 3).map((feedback, index) => (
                  <div key={feedback.id} className="feedback-item">
                    <span className="feedback-author">
                      {feedback.secret ? '익명' : feedback.nickname}
                    </span>
                    <span className="feedback-text">
                      {feedback.contents.length > 50 
                        ? `${feedback.contents.substring(0, 50)}...`
                        : feedback.contents}
                    </span>
                  </div>
                ))}
                {tooltip.content.feedbacks.length > 3 && (
                  <div className="more-feedback">
                    +{tooltip.content.feedbacks.length - 3}개 더
                  </div>
                )}
              </div>
            ) : (
              <div className="no-feedback">
                이 시점에 피드백이 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {hoveredTime !== null && `마우스 위치: ${formatTimestamp(hoveredTime)}`}
      </div>
    </div>
  );
});

FeedbackTimeline.displayName = 'FeedbackTimeline';

export default FeedbackTimeline;