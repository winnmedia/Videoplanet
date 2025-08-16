// =============================================================================
// Feedback Page - VideoPlanet 피드백 시스템 메인 페이지
// =============================================================================

'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build

// 기존 컴포넌트
import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import useTab from '@/hooks/useTab';

// 피드백 시스템 컴포넌트 및 훅
import {
  FeedbackInput,
  FeedbackMessage,
  FeedbackManage,
  FeedbackMore,
  VideoPlayer,
} from '@/features/feedback/components';
import { useFeedback } from '@/features/feedback/hooks';
import type { FeedbackPageProps, ChatMessage } from '@/features/feedback/types';

// SCSS 스타일 (별도 파일로 분리 예정)
// import './Feedback.scss'; // Temporarily disabled for build

interface ProjectStoreState {
  user?: string;
}

interface RootState {
  ProjectStore: ProjectStoreState;
}

/**
 * 피드백 시스템 메인 페이지
 * 비디오 플레이어, 실시간 채팅, 피드백 관리 통합
 */
export default function FeedbackPage({ params }: FeedbackPageProps) {
  const router = useRouter();
  const { projectId } = params;
  const { user } = useSelector((state: RootState) => state.ProjectStore);
  
  // 비디오 상태
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  // 피드백 훅 사용
  const {
    currentProject,
    feedbacks,
    loading,
    error,
    createFeedback,
    deleteFeedback,
    uploadVideo,
    deleteVideo,
    refetch,
    permissions,
    currentUser,
  } = useFeedback(projectId);

  // 현재 사용자 정보 (채팅용)
  const chatUser = useMemo(() => {
    if (!currentProject || !user) return null;
    
    if (currentProject.owner_email === user) {
      return {
        email: currentProject.owner_email,
        nickname: currentProject.owner_nickname,
        rating: 'manager' as const,
      };
    }
    
    const member = currentProject.member_list.find(m => m.email === user);
    return member ? {
      email: member.email,
      nickname: member.nickname,
      rating: member.rating,
    } : null;
  }, [currentProject, user]);

  // 사용자 등급 표시 함수
  const getRatingText = useCallback((rating: string) => {
    return rating === 'manager' ? '관리자' : '일반';
  }, []);

  // 파일 업로드 핸들러
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadVideo(file);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      // input 초기화
      event.target.value = '';
    }
  }, [uploadVideo]);

  // 파일 삭제 핸들러
  const handleDeleteFile = useCallback(async () => {
    try {
      await deleteVideo();
    } catch (error) {
      console.error('File delete error:', error);
    }
  }, [deleteVideo]);

  // URL 복사 핸들러
  const handleCopyFileUrl = useCallback((url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다.');
      }).catch(() => {
        // Fallback
        fallbackCopyTextToClipboard(url);
      });
    } else {
      fallbackCopyTextToClipboard(url);
    }
  }, []);

  // Fallback 복사 함수
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('링크가 복사되었습니다.');
    } catch (err) {
      console.error('Unable to copy:', err);
      alert('링크 복사에 실패했습니다.');
    }
    
    document.body.removeChild(textArea);
  };

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

  // 채팅 메시지 처리
  const handleChatMessage = useCallback((message: ChatMessage) => {
    // 필요시 추가 처리 로직
    console.log('New chat message:', message);
  }, []);

  // 탭 컨텐츠 정의
  const tabContent = useMemo(() => [
    {
      tab: '코멘트',
      content: currentProject && chatUser && (
        <FeedbackMessage
          projectId={projectId}
          currentUser={chatUser}
          onMessage={handleChatMessage}
        />
      ),
    },
    {
      tab: '피드백 등록',
      content: (
        <FeedbackInput
          project_id={projectId}
          refetch={refetch}
          onSubmit={createFeedback}
        />
      ),
    },
    {
      tab: '피드백 관리',
      content: currentProject && user && (
        <FeedbackManage
          currentProject={currentProject}
          currentUser={user}
          onDeleteFeedback={deleteFeedback}
          loading={loading}
        />
      ),
    },
    {
      tab: '멤버',
      content: currentProject && (
        <div className="member">
          <ul>
            <li className="admin">
              <div className="img" />
              <div className="txt">
                {currentProject.owner_nickname}(관리자)
                <span>{currentProject.owner_email}</span>
              </div>
            </li>
            {currentProject.member_list.map((member, index) => (
              <li
                key={`${member.email}-${index}`}
                className={member.rating === 'manager' ? 'admin' : 'basic'}
              >
                <div className="img" />
                <div className="txt">
                  {member.nickname}({getRatingText(member.rating)})
                  <span>{member.email}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      tab: '프로젝트 정보',
      content: currentProject && (
        <div className="info">
          <dl className="flex align_center">
            <dt>담당자</dt>
            <dd>{currentProject.manager}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>고객사</dt>
            <dd>{currentProject.consumer}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>프로젝트 생성</dt>
            <dd>{moment(currentProject.created).format('YYYY.MM.DD.dd')}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>최종 업데이트</dt>
            <dd>{moment(currentProject.updated).format('YYYY.MM.DD.dd')}</dd>
          </dl>
          <dl>
            <dt>프로젝트 세부 설명</dt>
            <dd className="mt10">{currentProject.description}</dd>
          </dl>
          {permissions.canEditProject && (
            <button
              className="project_btn"
              onClick={() => router.push(`/projects/${projectId}/edit`)}
            >
              프로젝트 관리
            </button>
          )}
        </div>
      ),
    },
  ], [
    currentProject,
    chatUser,
    projectId,
    handleChatMessage,
    refetch,
    createFeedback,
    user,
    deleteFeedback,
    loading,
    getRatingText,
    permissions.canEditProject,
    router,
  ]);

  const tabResult = useTab(0, tabContent);
  const { currentItem, changeItem } = tabResult || { currentItem: null, changeItem: () => {} };

  // 로딩 상태
  if (loading && !currentProject) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="feedback" on_menu={false} />
          <main>
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>프로젝트를 불러오는 중...</p>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="feedback" on_menu={false} />
          <main>
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h2>오류가 발생했습니다</h2>
              <p>{error}</p>
              <button onClick={() => refetch()} className="retry-button">
                다시 시도
              </button>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  // 프로젝트를 찾을 수 없는 경우
  if (!currentProject) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="feedback" on_menu={false} />
          <main>
            <div className="not-found-container">
              <div className="not-found-icon">📂</div>
              <h2>프로젝트를 찾을 수 없습니다</h2>
              <p>요청하신 프로젝트가 존재하지 않거나 접근 권한이 없습니다.</p>
              <button onClick={() => router.push('/projects')} className="back-button">
                프로젝트 목록으로 돌아가기
              </button>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
      <div className="cms_wrap">
        <SideBar tab="feedback" on_menu={false} />
        <main>
          <div className="content feedback flex space_between">
            {/* 비디오 영역 */}
            <div className="videobox">
              <div
                ref={videoPlayerRef}
                className={
                  currentProject.files ? 'video_inner active' : 'video_inner'
                }
              >
                {currentProject.files ? (
                  <VideoPlayer
                    url={currentProject.files}
                    SetVideoLoad={setVideoLoading}
                    seekTime={seekTime || 0}
                    onSeek={() => setSeekTime(undefined)}
                    className="feedback-video"
                  />
                ) : (
                  // 비디오가 없는 경우 업로드 버튼 (관리자만)
                  permissions.canUploadVideo && (
                    <div className="upload_btn_wrap">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="video_upload"
                        id="video-upload"
                        name="files"
                      />
                      <label htmlFor="video-upload" className="video_upload_label">
                        <div>영상 추가</div>
                      </label>
                    </div>
                  )
                )}

                {/* 로딩 인디케이터 */}
                {videoLoading && (
                  <div className="loading">
                    <div className="animation" />
                  </div>
                )}
              </div>

              {/* 기타 컨트롤 */}
              <div className="etc_box">
                <div className="flex space_between align_center">
                  <button
                    onClick={() =>
                      router.push('/feedback/all', {
                        // Next.js에서는 state 전달 방식이 다름
                      })
                    }
                    className="all"
                  >
                    피드백 전체 보기
                  </button>

                  {permissions.canUploadVideo && currentProject.files && (
                    <div className="good">
                      <div className="change_btn_wrap">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          name="files"
                          className="video_upload"
                          id="video-change"
                        />
                        <label htmlFor="video-change" className="video_upload_label">
                          <div>교체</div>
                        </label>
                      </div>
                      <div className="change_btn_wrap">
                        <div className="video_upload_label">
                          <div onClick={handleDeleteFile} className="delete">
                            삭제
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentProject.files && (
                    <div
                      onClick={() => handleCopyFileUrl(currentProject.files!)}
                      className="share"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCopyFileUrl(currentProject.files!);
                        }
                      }}
                    >
                      공유
                    </div>
                  )}
                </div>

                {/* 피드백 목록 */}
                <div className="list">
                  <FeedbackMore
                    currentProject={currentProject}
                    onTimestampClick={handleTimestampClick}
                  />
                </div>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="sidebox">
              <div className="b_title">
                <div className="s_title">{currentItem.tab}</div>
              </div>
              <div className="top_box">
                <ul className="tab_menu">
                  {tabContent.map((section, index) => (
                    <li
                      className={currentItem.tab === section.tab ? 'active' : ''}
                      key={index}
                      onClick={() => changeItem(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          changeItem(index);
                        }
                      }}
                    >
                      {section.tab}
                    </li>
                  ))}
                </ul>
                <div className="edit" />
              </div>
              <div className="tab_content">{currentItem.content}</div>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  );
}