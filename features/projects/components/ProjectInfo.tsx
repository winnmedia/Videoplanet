/**
 * 프로젝트 상세 정보 표시 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility
import { projectsApi } from '../api/projectsApi';
import downIcon from '@/assets/images/Cms/down_icon.svg';
import type { ProjectInfoProps } from '../types';

/**
 * 프로젝트 상세 정보 표시 컴포넌트
 */
const ProjectInfo: React.FC<ProjectInfoProps> = memo(({ 
  current_project, 
  isAdmin = false, 
  onEdit 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // 콘텐츠 높이 계산
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, current_project]);

  // 박스 토글 핸들러
  const toggleBox = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 키보드 접근성 핸들러
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBox();
    }
  }, [toggleBox]);

  // 파일 다운로드 핸들러
  const handleFileDownload = useCallback((fileUrl: string, fileName: string) => {
    projectsApi.downloadFile(fileUrl, fileName);
  }, []);

  // 박스 스타일
  const boxStyle: React.CSSProperties = {
    height: isExpanded ? `${contentHeight}px` : '0',
    overflow: 'hidden',
    transition: 'height 0.3s ease-in-out',
  };

  return (
    <div className="info_wrap">
      {/* 프로젝트 이름 및 토글 헤더 */}
      <div className="name_box flex align_center space_between">
        <div className="flex align_center start">
          <button
            type="button"
            className={`toggle-btn ${isExpanded ? 'on' : ''}`}
            onClick={toggleBox}
            onKeyPress={handleKeyPress}
            aria-expanded={isExpanded}
            aria-controls="project-details"
            aria-label={`프로젝트 상세 정보 ${isExpanded ? '닫기' : '열기'}`}
          >
            <span className="sr-only">
              {isExpanded ? '상세 정보 닫기' : '상세 정보 열기'}
            </span>
            <span className="toggle-icon" aria-hidden="true">
              {isExpanded ? '−' : '+'}
            </span>
          </button>
          <h1 className="s_title">{current_project.name}</h1>
        </div>
        
        <div className="update-info">
          최종 업데이트 날짜 |{' '}
          <time dateTime={current_project.updated}>
            {moment(current_project.updated).format('YYYY.MM.DD')}
          </time>
        </div>
      </div>

      {/* 프로젝트 상세 정보 */}
      <div
        id="project-details"
        className="box"
        style={boxStyle}
        role="region"
        aria-labelledby="project-name"
      >
        <div ref={contentRef} className="inner">
          {/* 프로젝트 설명 */}
          <section className="explanation">
            <div className="ss_title">
              <span>프로젝트 설명</span>
            </div>
            <p>{current_project.description}</p>
          </section>

          {/* 멤버 정보 */}
          <section className="member">
            <div className="ss_title">
              <span>멤버</span>
            </div>
            <ul>
              {/* 프로젝트 소유자 */}
              <li className="admin">
                <div className="img" aria-hidden="true"></div>
                <div className="txt">
                  <strong>{current_project.owner_nickname}</strong>
                  <span className="role">(관리자)</span>
                  <span className="email">{current_project.owner_email}</span>
                </div>
              </li>

              {/* 프로젝트 멤버들 */}
              {current_project.member_list.map((member) => (
                <li
                  key={member.id}
                  className={member.rating === 'manager' ? 'admin' : 'basic'}
                >
                  <div className="img" aria-hidden="true"></div>
                  <div className="txt">
                    <strong>{member.nickname}</strong>
                    <span className="role">
                      ({member.rating === 'manager' ? '관리자' : '일반'})
                    </span>
                    <span className="email">{member.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 프로젝트 정보 */}
          <section className="info">
            <div className="ss_title">
              <span>프로젝트 정보</span>
            </div>
            
            <dl className="info-list">
              <div className="info-item">
                <dt>작업자</dt>
                <dd>{current_project.manager}</dd>
              </div>
              
              <div className="info-item">
                <dt>고객사</dt>
                <dd>{current_project.consumer}</dd>
              </div>
              
              <div className="info-item">
                <dt>
                  프로젝트
                  <br />
                  생성일
                </dt>
                <dd>
                  <time dateTime={current_project.created}>
                    {moment(current_project.created).format('YYYY.MM.DD')}
                  </time>
                </dd>
              </div>
              
              <div className="info-item">
                <dt>등록 파일</dt>
                <dd>
                  {current_project.files.length === 0 ? (
                    <span className="no-files">등록된 파일이 없습니다.</span>
                  ) : (
                    <div className="files-list">
                      {current_project.files.map((file) => {
                        const fileName = projectsApi.extractFileName(file.file_name);
                        
                        return (
                          <button
                            key={file.id}
                            type="button"
                            className="file-download"
                            onClick={() => handleFileDownload(file.files, fileName)}
                            aria-label={`${fileName} 다운로드`}
                          >
                            <span className="file-name">{fileName}</span>
                            <i className="download-icon" aria-hidden="true">
                              <Image
                                src={downIcon}
                                alt=""
                                width={16}
                                height={16}
                              />
                            </i>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* 편집 버튼 (관리자만 표시) */}
          {isAdmin && onEdit && (
            <div className="action-buttons">
              <button
                type="button"
                className="submit"
                onClick={onEdit}
                aria-label="프로젝트 편집"
              >
                프로젝트 편집
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProjectInfo.displayName = 'ProjectInfo';

export default ProjectInfo;