// =============================================================================
// FeedbackMore Component - VideoPlanet 피드백 목록 및 상세보기 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility
import { Feedback, FeedbackProject, GroupedFeedback } from '../types';

interface FeedbackMoreProps {
  currentProject: FeedbackProject;
  onTimestampClick?: (timestamp: string) => void;
}

/**
 * 피드백 목록 및 상세보기 컴포넌트
 * 날짜별로 그룹화된 피드백을 표시하고 클릭 시 상세 내용 표시
 */
const FeedbackMore: React.FC<FeedbackMoreProps> = memo(({
  currentProject,
  onTimestampClick,
}) => {
  const [openPopup, setOpenPopup] = useState<Feedback | null>(null);

  // 날짜별로 피드백 그룹화
  const groupedFeedbacks = useMemo<GroupedFeedback[]>(() => {
    if (!currentProject?.feedback) {
      return [];
    }

    const groupedObjects: Record<string, Feedback[]> = {};
    
    currentProject.feedback.forEach((feedback) => {
      const createdDate = moment(feedback.created).format('YYYY.MM.DD.dd');
      if (groupedObjects[createdDate]) {
        groupedObjects[createdDate].push(feedback);
      } else {
        groupedObjects[createdDate] = [feedback];
      }
    });

    // 날짜순 정렬 (최신순)
    return Object.entries(groupedObjects)
      .map(([date, feedbacks]) => ({
        date,
        feedbacks: feedbacks.sort((a, b) => 
          new Date(b.created).getTime() - new Date(a.created).getTime()
        ),
      }))
      .sort((a, b) => moment(b.date, 'YYYY.MM.DD.dd').valueOf() - moment(a.date, 'YYYY.MM.DD.dd').valueOf());
  }, [currentProject?.feedback]);

  // 팝업 열기
  const handleItemClick = useCallback((feedback: Feedback) => {
    setOpenPopup(feedback);
    
    // 타임스탬프 클릭 콜백 호출 (비디오 플레이어 연동)
    if (onTimestampClick) {
      onTimestampClick(feedback.section);
    }
  }, [onTimestampClick]);

  // 팝업 닫기
  const handleClosePopup = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenPopup(null);
  }, []);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: React.KeyboardEvent, feedback: Feedback) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(feedback);
    }
  }, [handleItemClick]);

  // 팝업 키보드 이벤트 처리
  const handlePopupKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpenPopup(null);
    }
  }, []);

  // 시간 포맷팅
  const formatTimestamp = useCallback((timestamp: string) => {
    if (/^\d{1,2}:\d{2}$/.test(timestamp)) {
      return timestamp;
    }
    
    const numbers = timestamp.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    
    return timestamp;
  }, []);

  // 사용자 등급 텍스트
  const getRatingText = useCallback((rating: string) => {
    return rating === 'manager' ? '관리자' : '일반';
  }, []);

  if (groupedFeedbacks.length === 0) {
    return (
      <div className="feedback-empty">
        <div className="empty-state">
          <div className="empty-icon" />
          <p>등록된 피드백이 없습니다.</p>
          <small>첫 번째 피드백을 등록해보세요.</small>
        </div>
      </div>
    );
  }

  return (
    <>
      {groupedFeedbacks.map((group, groupIndex) => (
        <div key={group.date} className="box">
          <div className="day">{group.date}</div>
          <ul>
            {group.feedbacks.map((feedback, feedbackIndex) => (
              <li
                key={`${feedback.id}-${feedbackIndex}`}
                className={`feedback-timestamp ${
                  openPopup && openPopup.id === feedback.id ? 'on' : ''
                }`}
                onClick={() => handleItemClick(feedback)}
                onKeyDown={(e) => handleKeyDown(e, feedback)}
                tabIndex={0}
                role="button"
                aria-label={`피드백: ${formatTimestamp(feedback.section)} - ${feedback.nickname}`}
                aria-expanded={openPopup?.id === feedback.id}
              >
                <span className="timestamp-text">
                  {formatTimestamp(feedback.section)}
                </span>
                
                {/* 익명 표시 */}
                {(feedback.secret || feedback.security) && (
                  <span className="anonymous-indicator" aria-label="익명">
                    🔒
                  </span>
                )}

                {/* 상세보기 팝업 */}
                {openPopup && openPopup.id === feedback.id && (
                  <div 
                    className="view-container"
                    onKeyDown={handlePopupKeyDown}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`feedback-title-${feedback.id}`}
                    aria-describedby={`feedback-content-${feedback.id}`}
                  >
                    <div className="view">
                      <div>
                        <div className="txt_box">
                          {openPopup.security || openPopup.secret ? (
                            <>
                              <span className="name" id={`feedback-title-${feedback.id}`}>
                                익명
                              </span>
                              <span className="timestamp">
                                {formatTimestamp(openPopup.section)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="name" id={`feedback-title-${feedback.id}`}>
                                {openPopup.nickname}
                                <small className={getRatingText(openPopup.rating) === '관리자' ? 'admin' : 'basic'}>
                                  ({getRatingText(openPopup.rating)})
                                </small>
                              </span>
                              <span className="email">{openPopup.email}</span>
                              <span className="timestamp">
                                {formatTimestamp(openPopup.section)}
                              </span>
                            </>
                          )}
                        </div>
                        <div 
                          className="comment_box"
                          id={`feedback-content-${feedback.id}`}
                        >
                          {openPopup.text || openPopup.contents}
                        </div>
                        
                        {/* 작성 시간 */}
                        <div className="feedback-meta">
                          <small className="created-time">
                            {moment(openPopup.created).format('YYYY년 MM월 DD일 HH:mm')}
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="close-button"
                      onClick={handleClosePopup}
                      aria-label="피드백 상세보기 닫기"
                      autoFocus
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* 전체 통계 */}
      <div className="feedback-summary">
        <div className="summary-item">
          <span className="summary-label">총 피드백</span>
          <span className="summary-value">
            {groupedFeedbacks.reduce((total, group) => total + group.feedbacks.length, 0)}개
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">활동 일수</span>
          <span className="summary-value">{groupedFeedbacks.length}일</span>
        </div>
      </div>

      {/* 접근성을 위한 안내 */}
      <div className="sr-only" aria-live="polite">
        {openPopup && `${openPopup.nickname}의 피드백이 열렸습니다. ESC 키를 눌러 닫을 수 있습니다.`}
      </div>
    </>
  );
});

FeedbackMore.displayName = 'FeedbackMore';

export default FeedbackMore;