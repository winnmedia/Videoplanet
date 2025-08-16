// =============================================================================
// FeedbackManage Component - VideoPlanet 피드백 관리 컴포넌트
// =============================================================================

'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Feedback, FeedbackProject } from '../types';

interface FeedbackManageProps {
  currentProject: FeedbackProject;
  currentUser: string | null;
  onDeleteFeedback: (feedbackId: number) => Promise<void>;
  loading?: boolean;
}

/**
 * 사용자의 피드백 관리 컴포넌트
 * 본인이 작성한 피드백만 보여주고 삭제할 수 있음
 */
const FeedbackManage: React.FC<FeedbackManageProps> = memo(({
  currentProject,
  currentUser,
  onDeleteFeedback,
  loading = false,
}) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // 현재 사용자의 피드백만 필터링
  const userFeedbacks = useMemo<Feedback[]>(() => {
    if (!currentProject?.feedback || !currentUser) {
      return [];
    }
    
    return currentProject.feedback.filter((feedback) => feedback.email === currentUser);
  }, [currentProject?.feedback, currentUser]);

  // 피드백 삭제 핸들러
  const handleDeleteFeedback = useCallback(async (feedbackId: number) => {
    if (deletingIds.has(feedbackId)) {
      return; // 이미 삭제 중인 경우 중복 실행 방지
    }

    try {
      setDeletingIds(prev => new Set(prev).add(feedbackId));
      await onDeleteFeedback(feedbackId);
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      // 에러 시 상태 롤백
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedbackId);
        return newSet;
      });
    } finally {
      // 성공/실패와 관계없이 삭제 상태 제거
      setTimeout(() => {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(feedbackId);
          return newSet;
        });
      }, 1000);
    }
  }, [onDeleteFeedback, deletingIds]);

  // 시간 포맷팅 함수
  const formatTimestamp = useCallback((timestamp: string) => {
    // 이미 MM:SS 형식인 경우 그대로 반환
    if (/^\d{1,2}:\d{2}$/.test(timestamp)) {
      return timestamp;
    }
    
    // 숫자만 있는 경우 MM:SS 형식으로 변환
    const numbers = timestamp.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    
    return timestamp;
  }, []);

  if (loading) {
    return (
      <div className="history loading">
        <div className="loading-indicator">
          <div className="spinner" />
          <span>피드백을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="history">
      <ul>
        {userFeedbacks.length > 0 ? (
          userFeedbacks.map((feedback) => {
            const isDeleting = deletingIds.has(feedback.id);
            
            return (
              <li 
                key={feedback.id} 
                className={`feedback-item ${isDeleting ? 'deleting' : ''}`}
              >
                <div className="flex align_center space_between">
                  <div className="txt_box">
                    <div className="time">
                      {formatTimestamp(feedback.section)}
                    </div>
                    <p className="feedback-content">
                      {feedback.text || feedback.contents}
                    </p>
                    
                    {/* 작성 시간 */}
                    <div className="metadata">
                      <small className="created-date">
                        {new Date(feedback.created).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                      
                      {/* 익명 여부 표시 */}
                      {(feedback.secret || feedback.security) && (
                        <span className="anonymous-badge">
                          익명
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteFeedback(feedback.id)}
                    disabled={isDeleting}
                    className={`delete ${isDeleting ? 'loading' : ''}`}
                    aria-label={`피드백 삭제: ${formatTimestamp(feedback.section)}`}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-small" />
                        삭제 중...
                      </>
                    ) : (
                      '삭제'
                    )}
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li className="empty-state">
            <div className="flex mt50 justify_center flex_column align_center">
              <div className="empty-icon" />
              <p className="empty-message">작성한 피드백이 없습니다.</p>
              <small className="empty-description">
                피드백 등록 탭에서 새로운 피드백을 작성해보세요.
              </small>
            </div>
          </li>
        )}
      </ul>
      
      {/* 통계 정보 */}
      {userFeedbacks.length > 0 && (
        <div className="feedback-stats">
          <div className="stats-item">
            <span className="stats-label">총 피드백</span>
            <span className="stats-value">{userFeedbacks.length}개</span>
          </div>
        </div>
      )}
      
      {/* 접근성을 위한 상태 안내 */}
      <div className="sr-only" aria-live="polite">
        {Array.from(deletingIds).length > 0 && 
          `${Array.from(deletingIds).length}개의 피드백을 삭제하고 있습니다.`
        }
      </div>
    </div>
  );
});

FeedbackManage.displayName = 'FeedbackManage';

export default FeedbackManage;