// =============================================================================
// Public Feedback Page - 공개 피드백 페이지 (익명 사용자용)
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnonymousFeedback } from '@/features/feedback/components';
import { VideoPlayer } from '@/features/feedback/components';
import { feedbackApi } from '@/features/feedback/api/feedbackApi';
import type { FeedbackProject, ChatMessage } from '@/features/feedback/types';
import './PublicFeedback.scss';

interface SharedProject {
  id: number;
  title: string;
  description: string;
  files?: string; // 비디오 파일 URL
  shareSettings: {
    allowAnonymous: boolean;
    allowNickname: boolean;
    expiresAt?: string;
    viewLimit?: number;
    currentViews: number;
  };
}

interface PublicFeedbackPageProps {
  params: {
    shareId: string;
  };
}

/**
 * 공개 피드백 페이지
 * 공유 링크를 통해 접근하는 익명 사용자용 페이지
 */
export default function PublicFeedbackPage({ params }: PublicFeedbackPageProps) {
  const router = useRouter();
  const { shareId } = params;
  
  // 상태 관리
  const [sharedProject, setSharedProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [viewLimitReached, setViewLimitReached] = useState<boolean>(false);

  const videoPlayerRef = useRef<HTMLDivElement>(null);

  // 공유 프로젝트 정보 가져오기
  const fetchSharedProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 공유 ID로 프로젝트 정보 가져오기 (시뮬레이션)
      // 실제로는 API에서 공유 링크 유효성과 프로젝트 정보를 가져옴
      const response = await fetchSharedProjectData(shareId);
      
      if (!response.success) {
        throw new Error(response.message || '프로젝트를 찾을 수 없습니다.');
      }

      const project = response.data;

      // 만료 시간 확인
      if (project.shareSettings.expiresAt) {
        const expireDate = new Date(project.shareSettings.expiresAt);
        if (expireDate < new Date()) {
          setIsExpired(true);
          setError('공유 링크가 만료되었습니다.');
          return;
        }
      }

      // 조회수 제한 확인
      if (project.shareSettings.viewLimit && 
          project.shareSettings.currentViews >= project.shareSettings.viewLimit) {
        setViewLimitReached(true);
        setError('조회수 제한에 도달했습니다.');
        return;
      }

      setSharedProject(project);

      // 조회수 증가 (실제 구현시)
      // await incrementViewCount(shareId);

    } catch (err) {
      console.error('Shared project fetch error:', err);
      setError(err instanceof Error ? err.message : '프로젝트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  // 공유 프로젝트 데이터 가져오기 (실제 API 호출)
  const fetchSharedProjectData = async (shareId: string) => {
    // TODO: 실제 API 구현 시 feedbackApi.getSharedProject(shareId) 호출
    return new Promise<{success: boolean; data: SharedProject; message?: string}>((resolve) => {
      // 현재는 빈 데이터 반환
      resolve({
        success: false,
        message: '공유 프로젝트 API가 구현되지 않았습니다.',
        data: {} as SharedProject
      });
    });
  };

  // 컴포넌트 마운트시 프로젝트 정보 가져오기
  useEffect(() => {
    fetchSharedProject();
  }, [fetchSharedProject]);

  // 비디오 시간 업데이트 핸들러
  const handleVideoTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);

  // 타임스탬프 클릭 시 비디오 시간 이동
  const handleTimestampClick = useCallback((timestamp: string) => {
    // MM:SS 형식을 초로 변환
    const parts = timestamp.split(':').map(Number);
    let seconds = 0;
    
    if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    setSeekTime(seconds);
    
    // 비디오 플레이어로 스크롤
    if (videoPlayerRef.current) {
      videoPlayerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 피드백 제출 성공 핸들러
  const handleFeedbackSubmitted = useCallback(() => {
    // 필요시 추가 처리 (예: 성공 메시지 표시)
    console.log('Anonymous feedback submitted successfully');
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <main className="public-feedback-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>프로젝트를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error || isExpired || viewLimitReached) {
    return (
      <main className="public-feedback-page">
        <div className="error-container">
          <div className="error-icon">
            {isExpired ? '[시간]' : viewLimitReached ? '[인원]' : '[오류]'}
          </div>
          <h2>
            {isExpired ? '링크가 만료되었습니다' : 
             viewLimitReached ? '조회수 제한 도달' : 
             '오류가 발생했습니다'}
          </h2>
          <p>{error}</p>
          {!isExpired && !viewLimitReached && (
            <button onClick={fetchSharedProject} className="retry-button">
              다시 시도
            </button>
          )}
        </div>
      </main>
    );
  }

  // 프로젝트를 찾을 수 없는 경우
  if (!sharedProject) {
    return (
      <main className="public-feedback-page">
        <div className="not-found-container">
          <div className="not-found-icon">[링크]</div>
          <h2>공유 링크를 찾을 수 없습니다</h2>
          <p>요청하신 공유 링크가 존재하지 않거나 더 이상 유효하지 않습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="public-feedback-page">
      {/* 헤더 */}
      <header className="public-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="project-title">{sharedProject.title}</h1>
            <p className="project-description">{sharedProject.description}</p>
          </div>
          <div className="header-right">
            <div className="share-info">
              <div className="share-item">
                <span className="share-label">조회수:</span>
                <span className="share-value">
                  {sharedProject.shareSettings.currentViews}
                  {sharedProject.shareSettings.viewLimit && 
                    ` / ${sharedProject.shareSettings.viewLimit}`}
                </span>
              </div>
              {sharedProject.shareSettings.expiresAt && (
                <div className="share-item">
                  <span className="share-label">만료일:</span>
                  <span className="share-value">
                    {new Date(sharedProject.shareSettings.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="content-wrapper">
        {/* 비디오 영역 */}
        <div className="video-section">
          <div
            ref={videoPlayerRef}
            className={sharedProject.files ? 'video-container active' : 'video-container'}
          >
            {sharedProject.files ? (
              <VideoPlayer
                url={sharedProject.files}
                SetVideoLoad={setVideoLoading}
                seekTime={seekTime || 0}
                onSeek={() => setSeekTime(undefined)}
                onTimeUpdate={handleVideoTimeUpdate}
                className="public-video"
              />
            ) : (
              <div className="no-video-container">
                <div className="no-video-content">
                  <div className="no-video-icon">[비디오]</div>
                  <p>아직 비디오가 업로드되지 않았습니다.</p>
                </div>
              </div>
            )}

            {/* 로딩 인디케이터 */}
            {videoLoading && (
              <div className="video-loading">
                <div className="loading-animation" />
              </div>
            )}
          </div>
        </div>

        {/* 피드백 영역 */}
        <div className="feedback-section">
          <div className="feedback-header">
            <h2>피드백 남기기</h2>
            <div className="feedback-options">
              {sharedProject.shareSettings.allowAnonymous && (
                <span className="option-tag">익명 가능</span>
              )}
              {sharedProject.shareSettings.allowNickname && (
                <span className="option-tag">닉네임 사용 가능</span>
              )}
            </div>
          </div>

          <AnonymousFeedback
            projectId={sharedProject.id.toString()}
            shareId={shareId}
            currentVideoTime={currentVideoTime}
            onTimestampClick={handleTimestampClick}
            onFeedbackSubmitted={handleFeedbackSubmitted}
            allowAnonymous={sharedProject.shareSettings.allowAnonymous}
            allowNickname={sharedProject.shareSettings.allowNickname}
          />
        </div>
      </div>

      {/* 공개 페이지 푸터 */}
      <footer className="public-footer">
        <div className="footer-content">
          <p>
            Powered by <strong>Planet</strong> - 
            <a href="/" target="_blank" rel="noopener noreferrer">
              영상 피드백 협업 플랫폼
            </a>
          </p>
          <div className="footer-links">
            <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a>
          </div>
        </div>
      </footer>
    </main>
  );
}