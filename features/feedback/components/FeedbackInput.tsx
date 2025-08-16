// =============================================================================
// FeedbackInput Component - VideoPlanet 피드백 등록 컴포넌트
// =============================================================================

'use client';

import React, { memo } from 'react';
import { useFeedbackForm } from '../hooks';
import { FeedbackInputProps } from '../types';

/**
 * 피드백 등록 폼 컴포넌트
 * 익명/일반 선택, 타임스탬프, 내용 입력을 제공
 */
const FeedbackInput: React.FC<FeedbackInputProps> = memo(({ 
  project_id, 
  refetch,
  onSubmit,
}) => {
  const {
    values,
    errors,
    isValid,
    isSubmitting,
    handleChange,
    handleSubmit,
    getFieldError,
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

  // 라디오 버튼 변경 핸들러
  const handleSecretChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === 'true';
    handleChange('secret', value);
  };

  // 키보드 이벤트 핸들러 (Enter 키로 제출)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="form">
      {/* 익명/일반 선택 */}
      <div className="flex align_center">
        <div>
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
        <div>
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
      
      {/* 에러 메시지 - 익명 여부 */}
      {getFieldError('secret') && (
        <div className="error-message mt10" role="alert">
          {getFieldError('secret')}
        </div>
      )}

      {/* 구간 입력 (타임스탬프) */}
      <div className="input-group mt20">
        <input
          type="text"
          name="section"
          value={section}
          placeholder="구간 입력 (예: 05:30)"
          onChange={(e) => handleChange('section', e.target.value)}
          onKeyDown={handleKeyDown}
          className={`ty01 ${getFieldError('section') ? 'error' : ''}`}
          maxLength={10}
          aria-label="피드백 구간 타임스탬프"
          aria-describedby={getFieldError('section') ? 'section-error' : undefined}
        />
        
        {/* 에러 메시지 - 구간 */}
        {getFieldError('section') && (
          <div id="section-error" className="error-message mt5" role="alert">
            {getFieldError('section')}
          </div>
        )}
      </div>

      {/* 내용 입력 */}
      <div className="input-group mt20">
        <input
          type="text"
          name="contents"
          value={contents}
          placeholder="내용 입력"
          onChange={(e) => handleChange('contents', e.target.value)}
          onKeyDown={handleKeyDown}
          className={`ty01 ${getFieldError('contents') ? 'error' : ''}`}
          maxLength={1000}
          aria-label="피드백 내용"
          aria-describedby={getFieldError('contents') ? 'contents-error' : undefined}
        />
        
        {/* 에러 메시지 - 내용 */}
        {getFieldError('contents') && (
          <div id="contents-error" className="error-message mt5" role="alert">
            {getFieldError('contents')}
          </div>
        )}
      </div>

      {/* 전체 에러 메시지 */}
      {errors.general && (
        <div className="error-message mt20" role="alert">
          {errors.general}
        </div>
      )}

      {/* 제출 버튼 */}
      <button 
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`submit mt40 ${isSubmitting ? 'loading' : ''}`}
        aria-label="피드백 등록"
      >
        {isSubmitting ? '등록 중...' : '피드백 등록'}
      </button>

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {isSubmitting && '피드백을 등록하고 있습니다. 잠시만 기다려주세요.'}
      </div>
    </div>
  );
});

FeedbackInput.displayName = 'FeedbackInput';

export default FeedbackInput;