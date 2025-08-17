// =============================================================================
// EnhancedFeedbackInput Component - 강화된 시점 피드백 입력 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useFeedbackForm } from '../hooks';
import { FeedbackInputProps, ParsedTimestamp } from '../types';

interface EnhancedFeedbackInputProps extends FeedbackInputProps {
  currentVideoTime?: number; // 현재 비디오 재생 시간
  onTimestampClick?: (timestamp: string) => void; // 타임스탬프 클릭 시 비디오 시간 이동
  enableAutoTimestamp?: boolean; // 자동 타임스탬프 감지 활성화
  showTimelinePreview?: boolean; // 타임라인 미리보기 표시
  videoPlayerRef?: React.RefObject<HTMLVideoElement>; // 비디오 플레이어 참조
}

/**
 * 강화된 피드백 입력 컴포넌트
 * - 타임스탬프 자동 감지 및 검증
 * - 비디오 플레이어와 연동된 타임스탬프 버튼
 * - 시각적 타임라인 표시
 * - 현재 재생 시점 자동 캡처
 */
const EnhancedFeedbackInput: React.FC<EnhancedFeedbackInputProps> = memo(({ 
  project_id, 
  refetch,
  onSubmit,
  currentVideoTime = 0,
  onTimestampClick,
  enableAutoTimestamp = true,
  showTimelinePreview = true,
  videoPlayerRef,
}) => {
  const [isAutoCapturing, setIsAutoCapturing] = useState<boolean>(false);
  const [timestampSuggestions, setTimestampSuggestions] = useState<string[]>([]);
  const [showTimestampButtons, setShowTimestampButtons] = useState<boolean>(true);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    handleChange,
    handleSubmit,
    getFieldError,
    setValues,
  } = useFeedbackForm({
    onSubmit: async (data) => {
      if (onSubmit) {
        await onSubmit(data);
      }
      refetch();
    },
    validateOnChange: true,
  });

  const { secret, section, contents } = values;

  // 타임스탬프 파싱 함수
  const parseTimestamp = useCallback((timestamp: string): ParsedTimestamp => {
    if (!timestamp) {
      return { minutes: 0, seconds: 0, totalSeconds: 0, isValid: false };
    }

    // MM:SS 또는 HH:MM:SS 형식 지원
    const timeRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;
    const match = timestamp.match(timeRegex);

    if (!match) {
      return { minutes: 0, seconds: 0, totalSeconds: 0, isValid: false };
    }

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    if (minutes >= 60 || seconds >= 60) {
      return { minutes: 0, seconds: 0, totalSeconds: 0, isValid: false };
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    return {
      minutes: hours * 60 + minutes,
      seconds,
      totalSeconds,
      isValid: true,
    };
  }, []);

  // 초를 MM:SS 형식으로 변환
  const formatTimeFromSeconds = useCallback((totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds < 0) return '00:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, []);

  // 현재 비디오 시간을 타임스탬프로 설정
  const handleCurrentTimeCapture = useCallback(() => {
    if (currentVideoTime >= 0) {
      const timestamp = formatTimeFromSeconds(currentVideoTime);
      handleChange('section', timestamp);
      setIsAutoCapturing(true);
      
      // 1초 후 자동 캡처 상태 해제
      setTimeout(() => setIsAutoCapturing(false), 1000);
    }
  }, [currentVideoTime, formatTimeFromSeconds, handleChange]);

  // 타임스탬프 제안 생성 (현재 시간 기준 ±10초)
  const generateTimestampSuggestions = useCallback(() => {
    if (currentVideoTime <= 0) return [];

    const suggestions = [];
    const baseTime = Math.floor(currentVideoTime);
    
    // 현재 시간
    suggestions.push(formatTimeFromSeconds(baseTime));
    
    // 10초 전 (0초 이상일 때만)
    if (baseTime >= 10) {
      suggestions.push(formatTimeFromSeconds(baseTime - 10));
    }
    
    // 10초 후
    suggestions.push(formatTimeFromSeconds(baseTime + 10));

    return suggestions.filter((time, index, arr) => arr.indexOf(time) === index);
  }, [currentVideoTime, formatTimeFromSeconds]);

  // 타임스탬프 제안 업데이트
  useEffect(() => {
    if (enableAutoTimestamp && currentVideoTime > 0) {
      const suggestions = generateTimestampSuggestions();
      setTimestampSuggestions(suggestions);
    }
  }, [currentVideoTime, enableAutoTimestamp, generateTimestampSuggestions]);

  // 타임스탬프 검증
  const validateTimestamp = useCallback((timestamp: string): string | null => {
    if (!timestamp.trim()) {
      return '타임스탬프를 입력해주세요.';
    }

    const parsed = parseTimestamp(timestamp);
    if (!parsed.isValid) {
      return '올바른 형식이 아닙니다. (예: 05:30, 01:23:45)';
    }

    return null;
  }, [parseTimestamp]);

  // 타임스탬프 입력 실시간 검증
  const timestampError = useMemo(() => {
    if (!section) return null;
    return validateTimestamp(section);
  }, [section, validateTimestamp]);

  // 타임스탬프 제안 클릭 핸들러
  const handleTimestampSuggestionClick = useCallback((suggestion: string) => {
    handleChange('section', suggestion);
    if (sectionInputRef.current) {
      sectionInputRef.current.focus();
    }
  }, [handleChange]);

  // 타임스탬프로 비디오 이동
  const handleJumpToTimestamp = useCallback(() => {
    if (section && !timestampError && onTimestampClick) {
      onTimestampClick(section);
    }
  }, [section, timestampError, onTimestampClick]);

  // 라디오 버튼 변경 핸들러
  const handleSecretChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === 'true';
    handleChange('secret', value);
  }, [handleChange]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // 타임스탬프 입력 필드 키보드 이벤트
  const handleTimestampKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl/Cmd + T: 현재 시간 캡처
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      handleCurrentTimeCapture();
    }
    // Enter: 타임스탬프로 이동
    else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleJumpToTimestamp();
    }
  }, [handleCurrentTimeCapture, handleJumpToTimestamp]);

  // 타임라인 시각화 컴포넌트
  const TimelinePreview = useMemo(() => {
    if (!showTimelinePreview || !section) return null;

    const parsed = parseTimestamp(section);
    if (!parsed.isValid) return null;

    const totalDuration = Math.max(parsed.totalSeconds * 2, 300); // 최소 5분
    const position = (parsed.totalSeconds / totalDuration) * 100;

    return (
      <div className="timeline-preview">
        <div className="timeline-bar">
          <div className="timeline-track">
            <div 
              className="timeline-marker"
              style={{ left: `${Math.min(position, 100)}%` }}
            />
          </div>
        </div>
        <div className="timeline-info">
          <span className="timeline-time">{section}</span>
          {parsed.totalSeconds > 0 && (
            <span className="timeline-seconds">({parsed.totalSeconds}초)</span>
          )}
        </div>
      </div>
    );
  }, [showTimelinePreview, section, parseTimestamp]);

  return (
    <div className="enhanced-feedback-form">
      {/* 익명/일반 선택 */}
      <div className="form-section">
        <div className="radio-group">
          <div className="radio-item">
            <input
              type="radio"
              id="user_type_anonymous"
              name="secret"
              value="true"
              checked={secret === true || secret === 'true'}
              onChange={handleSecretChange}
              className="ty02"
              aria-label="익명으로 피드백 등록"
            />
            <label htmlFor="user_type_anonymous">익명</label>
          </div>
          <div className="radio-item">
            <input
              type="radio"
              id="user_type_normal"
              name="secret"
              value="false"
              checked={secret === false || secret === 'false'}
              onChange={handleSecretChange}
              className="ty02"
              aria-label="일반으로 피드백 등록"
            />
            <label htmlFor="user_type_normal">일반</label>
          </div>
        </div>
        
        {getFieldError('secret') && (
          <div className="error-message" role="alert">
            {getFieldError('secret')}
          </div>
        )}
      </div>

      {/* 타임스탬프 입력 */}
      <div className="form-section">
        <div className="timestamp-input-group">
          <div className="timestamp-input-container">
            <input
              ref={sectionInputRef}
              type="text"
              name="section"
              value={section}
              placeholder="시점 입력 (예: 05:30)"
              onChange={(e) => handleChange('section', e.target.value)}
              onKeyDown={handleTimestampKeyDown}
              className={`timestamp-input ${timestampError ? 'error' : ''} ${isAutoCapturing ? 'capturing' : ''}`}
              maxLength={10}
              aria-label="피드백 시점 타임스탬프"
              aria-describedby={timestampError ? 'timestamp-error' : 'timestamp-help'}
            />
            
            {/* 현재 시간 캡처 버튼 */}
            <button
              type="button"
              onClick={handleCurrentTimeCapture}
              className={`capture-time-btn ${isAutoCapturing ? 'capturing' : ''}`}
              disabled={currentVideoTime <= 0}
              aria-label="현재 재생 시간 캡처"
              title="현재 재생 중인 시간을 캡처합니다 (Ctrl+T)"
            >
              {isAutoCapturing ? '📍' : '⏰'}
            </button>

            {/* 타임스탬프로 이동 버튼 */}
            {section && !timestampError && onTimestampClick && (
              <button
                type="button"
                onClick={handleJumpToTimestamp}
                className="jump-to-time-btn"
                aria-label="입력한 시점으로 이동"
                title="입력한 시점으로 비디오를 이동합니다"
              >
                ⏯️
              </button>
            )}
          </div>

          {/* 타임스탬프 제안 버튼들 */}
          {showTimestampButtons && timestampSuggestions.length > 0 && (
            <div className="timestamp-suggestions">
              <span className="suggestions-label">빠른 선택:</span>
              {timestampSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTimestampSuggestionClick(suggestion)}
                  className={`suggestion-btn ${section === suggestion ? 'active' : ''}`}
                  aria-label={`${suggestion} 시점 선택`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* 타임라인 미리보기 */}
          {TimelinePreview}

          {/* 도움말 텍스트 */}
          {!timestampError && (
            <div id="timestamp-help" className="help-text">
              MM:SS 또는 HH:MM:SS 형식으로 입력하세요. Ctrl+T로 현재 시간을 캡처할 수 있습니다.
            </div>
          )}

          {/* 에러 메시지 */}
          {timestampError && (
            <div id="timestamp-error" className="error-message" role="alert">
              {timestampError}
            </div>
          )}
        </div>
      </div>

      {/* 피드백 내용 입력 */}
      <div className="form-section">
        <div className="content-input-group">
          <textarea
            name="contents"
            value={contents}
            placeholder="피드백 내용을 입력하세요..."
            onChange={(e) => handleChange('contents', e.target.value)}
            onKeyDown={handleKeyDown}
            className={`content-textarea ${getFieldError('contents') ? 'error' : ''}`}
            maxLength={1000}
            rows={4}
            aria-label="피드백 내용"
            aria-describedby={getFieldError('contents') ? 'contents-error' : 'contents-help'}
          />
          
          <div className="textarea-footer">
            <div id="contents-help" className="character-count">
              {contents.length}/1000
            </div>
          </div>

          {getFieldError('contents') && (
            <div id="contents-error" className="error-message" role="alert">
              {getFieldError('contents')}
            </div>
          )}
        </div>
      </div>

      {/* 전체 에러 메시지 */}
      {errors.general && (
        <div className="error-message" role="alert">
          {errors.general}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="form-actions">
        <button 
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting || !!timestampError}
          className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
          aria-label="피드백 등록"
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner" />
              등록 중...
            </>
          ) : (
            '피드백 등록'
          )}
        </button>
      </div>

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {isSubmitting && '피드백을 등록하고 있습니다. 잠시만 기다려주세요.'}
        {isAutoCapturing && '현재 재생 시간을 캡처했습니다.'}
      </div>
    </div>
  );
});

EnhancedFeedbackInput.displayName = 'EnhancedFeedbackInput';

export default EnhancedFeedbackInput;