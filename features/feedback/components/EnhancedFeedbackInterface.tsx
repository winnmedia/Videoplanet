// =============================================================================
// EnhancedFeedbackInterface Component - 강화된 통합 피드백 인터페이스
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  EnhancedFeedbackInput,
  VideoScreenshot,
  FeedbackTimeline,
  FeedbackFilter,
  FeedbackStats,
} from './';
import type { Feedback, FeedbackInputData } from '../types';

interface EnhancedFeedbackInterfaceProps {
  projectId: string;
  feedbacks: Feedback[];
  videoElement?: HTMLVideoElement | null;
  videoDuration?: number;
  currentVideoTime?: number;
  onFeedbackSubmit: (data: FeedbackInputData & { screenshot?: string }) => Promise<void>;
  onTimestampClick?: (timestamp: string) => void;
  onTimeJump?: (time: number) => void;
  className?: string;
  enableScreenshot?: boolean;
  enableTimeline?: boolean;
  enableFilters?: boolean;
  enableStats?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  component: React.ReactNode;
  disabled?: boolean;
}

/**
 * 강화된 통합 피드백 인터페이스
 * - 탭 기반 인터페이스로 모든 기능 통합
 * - 피드백 입력, 스크린샷, 타임라인, 필터, 통계
 * - 반응형 디자인 및 접근성 지원
 */
const EnhancedFeedbackInterface: React.FC<EnhancedFeedbackInterfaceProps> = memo(({
  projectId,
  feedbacks,
  videoElement,
  videoDuration = 3600,
  currentVideoTime = 0,
  onFeedbackSubmit,
  onTimestampClick,
  onTimeJump,
  className = '',
  enableScreenshot = true,
  enableTimeline = true,
  enableFilters = true,
  enableStats = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('feedback');
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>(feedbacks);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  const interfaceRef = useRef<HTMLDivElement>(null);

  // 스크린샷 캡처 콜백
  const handleScreenshotTaken = useCallback((screenshot: string, timestamp: string) => {
    setScreenshotData(screenshot);
    setActiveTab('feedback'); // 피드백 입력 탭으로 이동
  }, []);

  // 피드백 제출 (스크린샷 포함)
  const handleFeedbackSubmit = useCallback(async (data: FeedbackInputData) => {
    const enhancedData = {
      ...data,
      ...(screenshotData && { screenshot: screenshotData }),
    };
    
    await onFeedbackSubmit(enhancedData);
    
    // 스크린샷 데이터 초기화
    setScreenshotData(null);
  }, [onFeedbackSubmit, screenshotData]);

  // 필터링된 피드백 업데이트
  const handleFilterChange = useCallback((filtered: Feedback[]) => {
    setFilteredFeedbacks(filtered);
  }, []);

  // 반응형 컴팩트 모드 감지
  useEffect(() => {
    const checkCompactMode = () => {
      setIsCompactMode(window.innerWidth < 768);
    };

    checkCompactMode();
    window.addEventListener('resize', checkCompactMode);
    
    return () => window.removeEventListener('resize', checkCompactMode);
  }, []);

  // 탭 구성
  const tabs: TabConfig[] = [
    {
      id: 'feedback',
      label: '피드백 등록',
      icon: '입력',
      component: (
        <EnhancedFeedbackInput
          project_id={projectId}
          refetch={() => {}} // 실제 구현시 refetch 함수 전달
          onSubmit={handleFeedbackSubmit}
          currentVideoTime={currentVideoTime}
          onTimestampClick={onTimestampClick || (() => {})}
          enableAutoTimestamp={true}
          showTimelinePreview={true}
          videoPlayerRef={videoElement ? { current: videoElement } : { current: null }}
        />
      ),
    },
    {
      id: 'screenshot',
      label: '스크린샷',
      icon: '캡처',
      component: (
        <VideoScreenshot
          videoElement={videoElement || null}
          currentTime={currentVideoTime}
          onScreenshotTaken={handleScreenshotTaken}
        />
      ),
      disabled: !enableScreenshot || !videoElement,
    },
    {
      id: 'timeline',
      label: '타임라인',
      icon: '타임라인',
      component: (
        <FeedbackTimeline
          feedbacks={filteredFeedbacks}
          videoDuration={videoDuration}
          currentTime={currentVideoTime}
          onTimestampClick={onTimestampClick || (() => {})}
          onTimeJump={onTimeJump || (() => {})}
          showTimeTooltip={true}
          compactMode={isCompactMode}
        />
      ),
      disabled: !enableTimeline,
    },
    {
      id: 'filter',
      label: '필터',
      icon: '필터',
      component: (
        <FeedbackFilter
          feedbacks={feedbacks}
          onFilterChange={handleFilterChange}
          showAdvancedFilters={!isCompactMode}
        />
      ),
      disabled: !enableFilters,
    },
    {
      id: 'stats',
      label: '통계',
      icon: '통계',
      component: (
        <FeedbackStats
          feedbacks={filteredFeedbacks}
          videoDuration={videoDuration}
          compactMode={isCompactMode}
          showDetailedStats={!isCompactMode}
        />
      ),
      disabled: !enableStats,
    },
  ].filter(tab => !tab.disabled);

  // 활성 탭 컴포넌트 가져오기
  const activeTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

  // 키보드 네비게이션
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.altKey && event.key >= '1' && event.key <= '5') {
      event.preventDefault();
      const tabIndex = parseInt(event.key) - 1;
      if (tabs[tabIndex] && !tabs[tabIndex].disabled) {
        setActiveTab(tabs[tabIndex].id);
      }
    }
  }, [tabs]);

  return (
    <div 
      ref={interfaceRef}
      className={`enhanced-feedback-interface ${isCompactMode ? 'compact' : ''} ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 인터페이스 헤더 */}
      <div className="interface-header">
        <div className="header-info">
          <h2 className="interface-title">피드백 시스템</h2>
          <div className="feedback-summary">
            <span className="feedback-count">
              총 {feedbacks.length}개
            </span>
            {filteredFeedbacks.length !== feedbacks.length && (
              <span className="filtered-count">
                (필터링된 {filteredFeedbacks.length}개)
              </span>
            )}
          </div>
        </div>
        
        {/* 컴팩트 모드 토글 */}
        <div className="header-controls">
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className={`compact-toggle ${isCompactMode ? 'active' : ''}`}
            aria-label={`${isCompactMode ? '확장' : '컴팩트'} 모드 전환`}
            title={`${isCompactMode ? '확장' : '컴팩트'} 모드로 전환`}
          >
            {isCompactMode ? '확장' : '컴팩트'}
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <div className="tab-list" role="tablist" aria-label="피드백 기능 탭">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              title={`${tab.label} (Alt+${index + 1})`}
            >
              <span className="tab-icon">{tab.icon}</span>
              {!isCompactMode && <span className="tab-label">{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* 탭 인디케이터 */}
        <div className="tab-indicator-container">
          <div
            className="tab-indicator"
            style={{
              transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%)`,
              width: `${100 / tabs.length}%`,
            }}
          />
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        <div
          id={`tab-panel-${activeTab}`}
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {/* 스크린샷 미리보기 (피드백 탭에서만) */}
          {activeTab === 'feedback' && screenshotData && (
            <div className="screenshot-preview">
              <div className="preview-header">
                <span className="preview-label">첨부된 스크린샷:</span>
                <button
                  onClick={() => setScreenshotData(null)}
                  className="remove-screenshot"
                  aria-label="스크린샷 제거"
                >
                  제거
                </button>
              </div>
              <div className="preview-image">
                <img src={screenshotData} alt="첨부할 스크린샷" />
              </div>
            </div>
          )}

          {/* 활성 탭 컴포넌트 렌더링 */}
          {activeTabComponent}
        </div>
      </div>

      {/* 하단 상태 바 */}
      <div className="interface-footer">
        <div className="status-info">
          <span className="current-time">
            현재 시간: {Math.floor(currentVideoTime / 60)}:{(currentVideoTime % 60).toFixed(0).padStart(2, '0')}
          </span>
          {videoDuration > 0 && (
            <span className="progress">
              ({((currentVideoTime / videoDuration) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
        
        <div className="shortcuts-hint">
          <span className="hint-text">
            Alt+1~5: 탭 전환 | 
            {activeTab === 'feedback' && ' Ctrl+T: 현재 시간 캡처 |'}
            {activeTab === 'screenshot' && ' 스페이스: 캡처 |'}
            ESC: 닫기
          </span>
        </div>
      </div>

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        현재 {tabs.find(tab => tab.id === activeTab)?.label} 탭이 활성화되어 있습니다.
        {screenshotData && ' 스크린샷이 첨부되어 있습니다.'}
      </div>
    </div>
  );
});

EnhancedFeedbackInterface.displayName = 'EnhancedFeedbackInterface';

export default EnhancedFeedbackInterface;