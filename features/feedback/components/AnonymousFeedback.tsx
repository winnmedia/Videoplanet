// =============================================================================
// AnonymousFeedback Component - 익명 피드백 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { feedbackApi } from '../api/feedbackApi';
import type { FeedbackInputData, Feedback } from '../types';

interface AnonymousFeedbackProps {
  projectId: string;
  shareId: string;
  currentVideoTime?: number;
  onTimestampClick?: (timestamp: string) => void;
  onFeedbackSubmitted?: () => void;
  allowAnonymous?: boolean;
  allowNickname?: boolean;
}

interface AnonymousFeedbackData {
  nickname?: string;
  section: string; // 타임스탬프
  contents: string; // 피드백 내용
  isAnonymous: boolean;
}

interface SubmittedFeedback extends Feedback {
  isAnonymous: boolean;
  userNickname?: string;
}

/**
 * 익명 피드백 컴포넌트
 * 공개 링크를 통해 접근하는 사용자들이 익명으로 피드백을 남길 수 있는 컴포넌트
 */
const AnonymousFeedback: React.FC<AnonymousFeedbackProps> = memo(({
  projectId,
  shareId,
  currentVideoTime = 0,
  onTimestampClick,
  onFeedbackSubmitted,
  allowAnonymous = true,
  allowNickname = true,
}) => {
  // 폼 상태
  const [formData, setFormData] = useState<AnonymousFeedbackData>({
    nickname: '',
    section: '',
    contents: '',
    isAnonymous: true,
  });

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<AnonymousFeedbackData>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<SubmittedFeedback[]>([]);
  const [isAutoCapturing, setIsAutoCapturing] = useState<boolean>(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState<boolean>(false);

  const sectionInputRef = useRef<HTMLInputElement>(null);
  const contentsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 제출된 피드백 목록 가져오기
  const fetchSubmittedFeedbacks = useCallback(async () => {
    try {
      // 실제 구현시에는 공개 피드백 목록 API 호출
      // const response = await feedbackApi.getPublicFeedbacks(shareId);
      
      // 시뮬레이션 데이터
      const mockFeedbacks: SubmittedFeedback[] = [
        {
          id: 1,
          email: 'anonymous@example.com',
          nickname: '익명 사용자 1',
          rating: 'basic' as const,
          section: '02:15',
          text: '이 부분의 음향이 조금 작은 것 같아요.',
          contents: '이 부분의 음향이 조금 작은 것 같아요.',
          created: new Date(Date.now() - 60000).toISOString(),
          isAnonymous: true,
        },
        {
          id: 2,
          email: 'reviewer@example.com',
          nickname: '검토자A',
          rating: 'basic' as const,
          section: '05:42',
          text: '전환 효과가 매우 자연스럽네요! 좋습니다.',
          contents: '전환 효과가 매우 자연스럽네요! 좋습니다.',
          created: new Date(Date.now() - 120000).toISOString(),
          isAnonymous: false,
          userNickname: '검토자A',
        },
      ];

      setSubmittedFeedbacks(mockFeedbacks);
    } catch (error) {
      console.error('Failed to fetch submitted feedbacks:', error);
    }
  }, [shareId]);

  useEffect(() => {
    fetchSubmittedFeedbacks();
  }, [fetchSubmittedFeedbacks]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = useCallback((
    field: keyof AnonymousFeedbackData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 메시지 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // 성공 메시지 초기화
    if (successMessage) {
      setSuccessMessage('');
    }
  }, [errors, successMessage]);

  // 현재 비디오 시간을 타임스탬프로 설정
  const handleCurrentTimeCapture = useCallback(() => {
    if (currentVideoTime >= 0) {
      const timestamp = formatTimeFromSeconds(currentVideoTime);
      handleInputChange('section', timestamp);
      setIsAutoCapturing(true);
      
      // 1초 후 자동 캡처 상태 해제
      setTimeout(() => setIsAutoCapturing(false), 1000);
    }
  }, [currentVideoTime, handleInputChange]);

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

  // 타임스탬프 검증
  const validateTimestamp = useCallback((timestamp: string): boolean => {
    if (!timestamp.trim()) return false;
    
    const timeRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;
    const match = timestamp.match(timeRegex);
    
    if (!match) return false;
    
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    
    return minutes < 60 && seconds < 60;
  }, []);

  // 폼 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<AnonymousFeedbackData> = {};

    // 닉네임 검증 (익명이 아닌 경우)
    if (!formData.isAnonymous && allowNickname) {
      if (!formData.nickname?.trim()) {
        newErrors.nickname = '닉네임을 입력해주세요.';
      } else if (formData.nickname.length < 2) {
        newErrors.nickname = '닉네임은 2자 이상 입력해주세요.';
      } else if (formData.nickname.length > 20) {
        newErrors.nickname = '닉네임은 20자 이하로 입력해주세요.';
      }
    }

    // 타임스탬프 검증
    if (!formData.section.trim()) {
      newErrors.section = '시점을 입력해주세요.';
    } else if (!validateTimestamp(formData.section)) {
      newErrors.section = '올바른 시간 형식이 아닙니다. (예: 05:30, 01:23:45)';
    }

    // 내용 검증
    if (!formData.contents.trim()) {
      newErrors.contents = '피드백 내용을 입력해주세요.';
    } else if (formData.contents.length < 10) {
      newErrors.contents = '피드백 내용은 10자 이상 입력해주세요.';
    } else if (formData.contents.length > 1000) {
      newErrors.contents = '피드백 내용은 1000자 이하로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, allowNickname, validateTimestamp]);

  // 피드백 제출
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      // 첫 번째 에러 필드로 포커스 이동
      if (errors.nickname && contentsTextareaRef.current) {
        contentsTextareaRef.current.focus();
      } else if (errors.section && sectionInputRef.current) {
        sectionInputRef.current.focus();
      } else if (errors.contents && contentsTextareaRef.current) {
        contentsTextareaRef.current.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      // 익명 피드백 데이터 구성
      const feedbackData: FeedbackInputData = {
        secret: formData.isAnonymous,
        section: formData.section,
        contents: formData.contents,
      };

      // 실제 구현시에는 익명 피드백 전용 API 호출
      // await feedbackApi.submitAnonymousFeedback(shareId, feedbackData, formData.nickname);

      // 시뮬레이션: 성공 처리
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 성공 메시지 표시
      setSuccessMessage(
        formData.isAnonymous 
          ? '익명 피드백이 성공적으로 등록되었습니다!' 
          : '피드백이 성공적으로 등록되었습니다!'
      );

      // 폼 초기화
      setFormData({
        nickname: '',
        section: '',
        contents: '',
        isAnonymous: formData.isAnonymous, // 익명 설정은 유지
      });

      // 제출된 피드백 목록 새로고침
      fetchSubmittedFeedbacks();

      // 성공 콜백 호출
      onFeedbackSubmitted?.();

      // 3초 후 성공 메시지 자동 삭제
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      setErrors({
        contents: error instanceof Error ? error.message : '피드백 등록 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, shareId, fetchSubmittedFeedbacks, onFeedbackSubmitted, errors]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // 타임스탬프 클릭 핸들러
  const handleTimestampClickInternal = useCallback((timestamp: string) => {
    if (onTimestampClick) {
      onTimestampClick(timestamp);
    }
  }, [onTimestampClick]);

  return (
    <div className="anonymous-feedback">
      {/* 피드백 등록 폼 */}
      <div className="feedback-form">
        {/* 익명/닉네임 선택 */}
        {allowAnonymous && allowNickname && (
          <div className="form-section">
            <div className="identity-options">
              <label className="option-item">
                <input
                  type="radio"
                  name="identity"
                  value="anonymous"
                  checked={formData.isAnonymous}
                  onChange={() => handleInputChange('isAnonymous', true)}
                />
                <span className="option-label">익명으로 작성</span>
              </label>
              <label className="option-item">
                <input
                  type="radio"
                  name="identity"
                  value="nickname"
                  checked={!formData.isAnonymous}
                  onChange={() => handleInputChange('isAnonymous', false)}
                />
                <span className="option-label">닉네임 사용</span>
              </label>
            </div>
          </div>
        )}

        {/* 닉네임 입력 (닉네임 사용 선택시) */}
        {!formData.isAnonymous && allowNickname && (
          <div className="form-section">
            <div className="input-group">
              <label htmlFor="nickname-input" className="input-label">
                닉네임 <span className="required">*</span>
              </label>
              <input
                id="nickname-input"
                type="text"
                value={formData.nickname}
                placeholder="피드백에 표시될 닉네임을 입력하세요"
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                onKeyDown={handleKeyDown}
                className={`form-input ${errors.nickname ? 'error' : ''}`}
                maxLength={20}
                aria-describedby={errors.nickname ? 'nickname-error' : 'nickname-help'}
              />
              <div id="nickname-help" className="help-text">
                2-20자 사이로 입력해주세요.
              </div>
              {errors.nickname && (
                <div id="nickname-error" className="error-message" role="alert">
                  {errors.nickname}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 타임스탬프 입력 */}
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="timestamp-input" className="input-label">
              시점 <span className="required">*</span>
            </label>
            <div className="timestamp-input-container">
              <input
                ref={sectionInputRef}
                id="timestamp-input"
                type="text"
                value={formData.section}
                placeholder="예: 05:30"
                onChange={(e) => handleInputChange('section', e.target.value)}
                onKeyDown={handleKeyDown}
                className={`form-input timestamp-input ${errors.section ? 'error' : ''} ${isAutoCapturing ? 'capturing' : ''}`}
                maxLength={10}
                aria-describedby={errors.section ? 'timestamp-error' : 'timestamp-help'}
              />
              <button
                type="button"
                onClick={handleCurrentTimeCapture}
                className={`capture-btn ${isAutoCapturing ? 'capturing' : ''}`}
                disabled={currentVideoTime <= 0}
                aria-label="현재 재생 시간 캡처"
                title="현재 재생 중인 시간을 캡처합니다"
              >
                {isAutoCapturing ? '[CAPTURE]' : '[TIME]'}
              </button>
            </div>
            <div id="timestamp-help" className="help-text">
              MM:SS 또는 HH:MM:SS 형식으로 입력하세요.
            </div>
            {errors.section && (
              <div id="timestamp-error" className="error-message" role="alert">
                {errors.section}
              </div>
            )}
          </div>
        </div>

        {/* 피드백 내용 입력 */}
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="contents-input" className="input-label">
              피드백 내용 <span className="required">*</span>
            </label>
            <textarea
              ref={contentsTextareaRef}
              id="contents-input"
              value={formData.contents}
              placeholder="피드백 내용을 자세히 입력해주세요..."
              onChange={(e) => handleInputChange('contents', e.target.value)}
              onKeyDown={handleKeyDown}
              className={`form-textarea ${errors.contents ? 'error' : ''}`}
              rows={4}
              maxLength={1000}
              aria-describedby={errors.contents ? 'contents-error' : 'contents-help'}
            />
            <div className="textarea-footer">
              <div id="contents-help" className="character-count">
                {formData.contents.length}/1000
              </div>
            </div>
            {errors.contents && (
              <div id="contents-error" className="error-message" role="alert">
                {errors.contents}
              </div>
            )}
          </div>
        </div>

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="success-message" role="alert">
            <span className="success-icon">[SUCCESS]</span>
            {successMessage}
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="form-actions">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
          <div className="submit-help">
            Ctrl+Enter로 빠르게 등록할 수 있습니다.
          </div>
        </div>
      </div>

      {/* 제출된 피드백 목록 */}
      <div className="submitted-feedbacks">
        <div className="section-header">
          <h3>등록된 피드백</h3>
          <button
            onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
            className="toggle-btn"
            aria-label={showAllFeedbacks ? '피드백 목록 숨기기' : '피드백 목록 모두 보기'}
          >
            {showAllFeedbacks ? '숨기기' : `모두 보기 (${submittedFeedbacks.length})`}
          </button>
        </div>

        {showAllFeedbacks && (
          <div className="feedback-list">
            {submittedFeedbacks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">[CHAT]</div>
                <p>아직 등록된 피드백이 없습니다.</p>
                <p>첫 번째 피드백을 남겨보세요!</p>
              </div>
            ) : (
              submittedFeedbacks.map((feedback) => (
                <div key={feedback.id} className="feedback-item">
                  <div className="feedback-header">
                    <div className="feedback-author">
                      {feedback.isAnonymous ? (
                        <span className="anonymous-badge">익명</span>
                      ) : (
                        <span className="nickname-badge">{feedback.userNickname || feedback.nickname}</span>
                      )}
                    </div>
                    <div className="feedback-timestamp">
                      <button
                        onClick={() => handleTimestampClickInternal(feedback.section)}
                        className="timestamp-btn"
                        aria-label={`${feedback.section} 시점으로 이동`}
                      >
                        {feedback.section}
                      </button>
                    </div>
                    <div className="feedback-time">
                      {new Date(feedback.created).toLocaleString()}
                    </div>
                  </div>
                  <div className="feedback-content">
                    {feedback.contents}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {isSubmitting && '피드백을 등록하고 있습니다. 잠시만 기다려주세요.'}
        {isAutoCapturing && '현재 재생 시간을 캡처했습니다.'}
        {successMessage && successMessage}
      </div>
    </div>
  );
});

AnonymousFeedback.displayName = 'AnonymousFeedback';

export default AnonymousFeedback;