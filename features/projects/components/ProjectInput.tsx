/**
 * 프로젝트 기본 정보 입력 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo } from 'react';
import type { ProjectInputProps } from '../types';

/**
 * 프로젝트 기본 정보 입력 컴포넌트
 */
const ProjectInput: React.FC<ProjectInputProps> = ({
  inputs,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const { name, manager, consumer, description } = inputs;

  return (
    <>
      {/* 프로젝트 이름 */}
      <div className="part">
        <div className="s_title">프로젝트 이름</div>
        <input
          type="text"
          name="name"
          placeholder="프로젝트 이름"
          className={`ty01 mt10 ${errors.name ? 'error' : ''}`}
          value={name}
          onChange={onChange}
          maxLength={50}
          disabled={disabled}
          aria-label="프로젝트 이름"
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <div id="name-error" className="error-message" role="alert">
            {errors.name}
          </div>
        )}
      </div>

      {/* 담당자 */}
      <div className="part">
        <div className="s_title">담당자</div>
        <input
          type="text"
          name="manager"
          placeholder="담당자"
          className={`ty01 mt10 ${errors.manager ? 'error' : ''}`}
          value={manager}
          onChange={onChange}
          maxLength={50}
          disabled={disabled}
          aria-label="담당자"
          aria-describedby={errors.manager ? 'manager-error' : undefined}
          aria-invalid={!!errors.manager}
        />
        {errors.manager && (
          <div id="manager-error" className="error-message" role="alert">
            {errors.manager}
          </div>
        )}
      </div>

      {/* 고객사 */}
      <div className="part">
        <div className="s_title">고객사</div>
        <input
          type="text"
          name="consumer"
          placeholder="고객사"
          className={`ty01 mt10 ${errors.consumer ? 'error' : ''}`}
          value={consumer}
          onChange={onChange}
          maxLength={50}
          disabled={disabled}
          aria-label="고객사"
          aria-describedby={errors.consumer ? 'consumer-error' : undefined}
          aria-invalid={!!errors.consumer}
        />
        {errors.consumer && (
          <div id="consumer-error" className="error-message" role="alert">
            {errors.consumer}
          </div>
        )}
      </div>

      {/* 프로젝트 세부 설명 */}
      <div className="part">
        <div className="s_title">프로젝트 세부 설명(100자)</div>
        <textarea
          name="description"
          className={`mt10 ${errors.description ? 'error' : ''}`}
          cols={30}
          rows={10}
          placeholder="프로젝트 세부 설명"
          value={description}
          maxLength={100}
          onChange={onChange}
          disabled={disabled}
          aria-label="프로젝트 세부 설명"
          aria-describedby={errors.description ? 'description-error' : undefined}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <div id="description-error" className="error-message" role="alert">
            {errors.description}
          </div>
        )}
        <div className="char-count">
          {description.length}/100
        </div>
      </div>
    </>
  );
};

ProjectInput.displayName = 'ProjectInput';

export default memo(ProjectInput);