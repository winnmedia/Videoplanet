// =============================================================================
// useFeedback Hook - VideoPlanet 피드백 시스템 메인 훅
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  FeedbackProject,
  Feedback,
  FeedbackInputData,
  PermissionCheck,
  FeedbackError,
  UseFeedbackReturn,
} from '../types';
import {
  getFeedbackProject,
  createFeedback,
  deleteFeedback,
  uploadFeedbackVideo,
  deleteFeedbackVideo,
  getUserPermissions,
  translateErrorMessage,
} from '../api/feedbackApi';

interface ProjectStoreState {
  user?: string;
}

interface RootState {
  ProjectStore: ProjectStoreState;
}

/**
 * 피드백 시스템 메인 훅
 * 프로젝트 데이터, 피드백 CRUD, 파일 업로드, 권한 관리를 담당
 */
export function useFeedback(projectId: string): UseFeedbackReturn {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.ProjectStore);
  
  // 상태 관리
  const [currentProject, setCurrentProject] = useState<FeedbackProject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  // 피드백 목록 (프로젝트에서 추출)
  const feedbacks = useMemo(() => {
    return currentProject?.feedback || [];
  }, [currentProject]);

  // 권한 확인
  const permissions = useMemo<PermissionCheck>(() => {
    if (!currentProject || !user) {
      return {
        canManageFeedback: false,
        canDeleteFeedback: false,
        canUploadVideo: false,
        canDeleteVideo: false,
        canEditProject: false,
        role: 'basic',
      };
    }

    const userPermissions = getUserPermissions(currentProject, user);
    const isOwner = userPermissions.isOwner;
    const isManager = userPermissions.isManager;

    return {
      canManageFeedback: isManager,
      canDeleteFeedback: isManager,
      canUploadVideo: isManager,
      canDeleteVideo: isManager,
      canEditProject: isManager,
      role: isOwner ? 'owner' : isManager ? 'manager' : 'basic',
    };
  }, [currentProject, user]);

  // 에러 처리 헬퍼
  const handleError = useCallback((error: any) => {
    console.error('Feedback error:', error);
    const message = error instanceof Error ? translateErrorMessage(error as FeedbackError) : '알 수 없는 오류가 발생했습니다.';
    setError(message);
    
    // 401 NEED_ACCESS_TOKEN 에러 처리
    if (error?.status === 401 || error?.code === 'NEED_ACCESS_TOKEN') {
      console.warn('Authentication failed in useFeedback, redirecting to login');
      // feedbackApi에서 이미 리다이렉트 처리를 하므로 여기서는 로깅만
      return;
    }
  }, []);

  // 성공 메시지 처리
  const handleSuccess = useCallback((message: string) => {
    setError(null);
    if (window.alert) {
      window.alert(message);
    }
  }, []);

  // 프로젝트 데이터 조회
  const fetchProject = useCallback(async (id?: string): Promise<void> => {
    const targetId = id || projectId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const project = await getFeedbackProject(targetId);
      setCurrentProject(project);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId, handleError]);

  // 피드백 생성
  const handleCreateFeedback = useCallback(async (data: FeedbackInputData): Promise<void> => {
    if (!projectId) {
      throw new Error('프로젝트 ID가 필요합니다.');
    }

    setLoading(true);
    setError(null);

    try {
      await createFeedback(data, projectId);
      handleSuccess('피드백이 등록되었습니다.');
      
      // 프로젝트 데이터 새로고침
      await fetchProject();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProject, handleError, handleSuccess]);

  // 피드백 삭제
  const handleDeleteFeedback = useCallback(async (feedbackId: number): Promise<void> => {
    if (!permissions.canDeleteFeedback) {
      throw new Error('피드백을 삭제할 권한이 없습니다.');
    }

    if (!window.confirm('정말로 이 피드백을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteFeedback(feedbackId);
      handleSuccess('피드백이 삭제되었습니다.');
      
      // 프로젝트 데이터 새로고침
      await fetchProject();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [permissions.canDeleteFeedback, fetchProject, handleError, handleSuccess]);

  // 비디오 업로드
  const handleUploadVideo = useCallback(async (file: File): Promise<void> => {
    if (!permissions.canUploadVideo) {
      throw new Error('비디오를 업로드할 권한이 없습니다.');
    }

    if (!projectId) {
      throw new Error('프로젝트 ID가 필요합니다.');
    }

    if (!window.confirm('파일을 업로드 하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await uploadFeedbackVideo(file, projectId, (progressEvent) => {
        // 업로드 진행률 처리 (필요시 상태로 관리)
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${progress}%`);
      });
      
      handleSuccess('파일이 업로드되었습니다.');
      
      // 프로젝트 데이터 새로고침
      await fetchProject();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [permissions.canUploadVideo, projectId, fetchProject, handleError, handleSuccess]);

  // 비디오 삭제
  const handleDeleteVideo = useCallback(async (): Promise<void> => {
    if (!permissions.canDeleteVideo) {
      throw new Error('비디오를 삭제할 권한이 없습니다.');
    }

    if (!projectId) {
      throw new Error('프로젝트 ID가 필요합니다.');
    }

    if (!window.confirm('파일을 삭제 하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteFeedbackVideo(projectId);
      handleSuccess('파일이 삭제되었습니다.');
      
      // 프로젝트 데이터 새로고침
      await fetchProject();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [permissions.canDeleteVideo, projectId, fetchProject, handleError, handleSuccess]);

  // 수동 새로고침
  const refetch = useCallback(() => {
    setTrigger(Date.now());
  }, []);

  // 현재 사용자 정보
  const currentUser = useMemo(() => {
    if (!currentProject || !user) {
      return null;
    }

    if (currentProject.owner_email === user) {
      return {
        email: currentProject.owner_email,
        nickname: currentProject.owner_nickname,
        rating: 'manager' as const,
      };
    }

    const member = currentProject.member_list.find(m => m.email === user);
    if (member) {
      return {
        email: member.email,
        nickname: member.nickname,
        rating: member.rating,
      };
    }

    return null;
  }, [currentProject, user]);

  // 초기 데이터 로드 및 trigger 변경 시 새로고침
  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, trigger, fetchProject]);

  return {
    // 상태
    currentProject,
    feedbacks,
    loading,
    error,
    
    // 액션
    fetchProject,
    createFeedback: handleCreateFeedback,
    deleteFeedback: handleDeleteFeedback,
    uploadVideo: handleUploadVideo,
    deleteVideo: handleDeleteVideo,
    refetch,
    
    // 권한
    permissions,
    
    // 추가 유틸리티
    currentUser,
  };
}

export default useFeedback;