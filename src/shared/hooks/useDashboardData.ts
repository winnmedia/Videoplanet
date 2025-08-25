/**
 * Custom Hook for Dashboard Data Management
 * Handles API fetching and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '@/shared/services/api.service';
import { useWebSocket } from '@/shared/services/websocket-native.service';

export interface FeedbackNotification {
  id: string;
  type: 'new_feedback' | 'reply' | 'mention';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  projectName: string;
  author: string;
}

export interface ProjectNotification {
  id: string;
  type: 'invitation' | 'deadline' | 'status_change';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  projectName: string;
  actionRequired?: boolean;
}

export interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: 'on_track' | 'delayed' | 'completed';
  dueDate: Date;
  phase: 'planning' | 'shooting' | 'editing' | 'review';
}

export interface ProjectStats {
  inProgress: number;
  completed: number;
  thisMonth: number;
}

export interface DashboardData {
  feedbackNotifications: FeedbackNotification[];
  projectNotifications: ProjectNotification[];
  projectProgress: ProjectProgress[];
  projectStats: ProjectStats;
  isLoading: boolean;
  error: string | null;
}

interface DashboardDataOptions {
  autoRefreshInterval?: number;
  enableCache?: boolean;
  pageSize?: number;
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const {
    autoRefreshInterval = 30000,
    enableCache = true,
    pageSize = 20,
  } = options;
  const [data, setData] = useState<DashboardData>({
    feedbackNotifications: [],
    projectNotifications: [],
    projectProgress: [],
    projectStats: {
      inProgress: 0,
      completed: 0,
      thisMonth: 0,
    },
    isLoading: true,
    error: null,
  });

  const [currentPage, setCurrentPage] = useState({
    feedback: 1,
    project: 1,
    progress: 1,
  });

  const [hasMore, setHasMore] = useState({
    feedback: true,
    project: true,
    progress: true,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { send } = useWebSocket();

  // 데이터 로드 함수
  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // 성능 최적화: 중요한 데이터 먼저 로드
      const statsPromise = apiService.getDashboardStats();
      
      // 페이지네이션을 적용하여 데이터 가져오기
      const [feedbackRes, projectRes, progressRes, statsRes] = await Promise.allSettled([
        apiService.getFeedbackNotifications({ page: currentPage.feedback, limit: pageSize }),
        apiService.getProjectNotifications({ page: currentPage.project, limit: pageSize }),
        apiService.getProjectProgress({ page: currentPage.progress, limit: pageSize }),
        statsPromise,
      ]);

      const newData: Partial<DashboardData> = {};

      // 피드백 알림 처리
      if (feedbackRes.status === 'fulfilled') {
        const feedbackData = feedbackRes.value?.data;
        newData.feedbackNotifications = Array.isArray(feedbackData) 
          ? feedbackData.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            })) 
          : [];
      }

      // 프로젝트 알림 처리
      if (projectRes.status === 'fulfilled') {
        const projectData = projectRes.value?.data;
        newData.projectNotifications = Array.isArray(projectData)
          ? projectData.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            }))
          : [];
      }

      // 프로젝트 진행상황 처리
      if (progressRes.status === 'fulfilled') {
        const progressData = progressRes.value?.data;
        newData.projectProgress = Array.isArray(progressData)
          ? progressData.map((item: any) => ({
              ...item,
              dueDate: new Date(item.dueDate),
            }))
          : [];
      }

      // 통계 처리
      if (statsRes.status === 'fulfilled') {
        newData.projectStats = statsRes.value.data || {
          inProgress: 0,
          completed: 0,
          thisMonth: 0,
        };
      }

      // 에러 확인
      const hasError = [feedbackRes, projectRes, progressRes, statsRes].some(
        res => res.status === 'rejected'
      );

      setData(prev => ({
        ...prev,
        ...newData,
        isLoading: false,
        error: hasError ? '일부 데이터를 불러오는데 실패했습니다' : null,
      }));

    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: '대시보드 데이터를 불러올 수 없습니다',
      }));
    }
  }, [currentPage, pageSize]);

  // 초기 데이터 로드 및 자동 새로고침 설정
  useEffect(() => {
    loadDashboardData();

    // 자동 새로고침 설정
    if (autoRefreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        loadDashboardData();
      }, autoRefreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshInterval, loadDashboardData]);

  // 페이지네이션 함수
  const loadMoreFeedback = useCallback(async () => {
    if (!hasMore.feedback) return;
    
    const nextPage = currentPage.feedback + 1;
    try {
      const response = await apiService.getFeedbackNotifications({ 
        page: nextPage, 
        limit: pageSize 
      });
      
      if (response.data && response.data.length > 0) {
        setData(prev => ({
          ...prev,
          feedbackNotifications: [...prev.feedbackNotifications, ...response.data],
        }));
        setCurrentPage(prev => ({ ...prev, feedback: nextPage }));
      } else {
        setHasMore(prev => ({ ...prev, feedback: false }));
      }
    } catch (error) {
      console.error('Failed to load more feedback notifications:', error);
    }
  }, [currentPage.feedback, hasMore.feedback, pageSize]);

  const loadMoreProjects = useCallback(async () => {
    if (!hasMore.project) return;
    
    const nextPage = currentPage.project + 1;
    try {
      const response = await apiService.getProjectNotifications({ 
        page: nextPage, 
        limit: pageSize 
      });
      
      if (response.data && response.data.length > 0) {
        setData(prev => ({
          ...prev,
          projectNotifications: [...prev.projectNotifications, ...response.data],
        }));
        setCurrentPage(prev => ({ ...prev, project: nextPage }));
      } else {
        setHasMore(prev => ({ ...prev, project: false }));
      }
    } catch (error) {
      console.error('Failed to load more project notifications:', error);
    }
  }, [currentPage.project, hasMore.project, pageSize]);

  // WebSocket 이벤트 리스너 설정
  useWebSocket('feedback:new', (notification: FeedbackNotification) => {
    setData(prev => ({
      ...prev,
      feedbackNotifications: [notification, ...prev.feedbackNotifications],
    }));
  });

  useWebSocket('feedback:reply', (notification: FeedbackNotification) => {
    setData(prev => ({
      ...prev,
      feedbackNotifications: [notification, ...prev.feedbackNotifications],
    }));
  });

  useWebSocket('feedback:mention', (notification: FeedbackNotification) => {
    setData(prev => ({
      ...prev,
      feedbackNotifications: [notification, ...prev.feedbackNotifications],
    }));
  });

  useWebSocket('project:invitation', (notification: ProjectNotification) => {
    setData(prev => ({
      ...prev,
      projectNotifications: [notification, ...prev.projectNotifications],
    }));
  });

  useWebSocket('project:deadline', (notification: ProjectNotification) => {
    setData(prev => ({
      ...prev,
      projectNotifications: [notification, ...prev.projectNotifications],
    }));
  });

  useWebSocket('project:status', (notification: ProjectNotification) => {
    setData(prev => ({
      ...prev,
      projectNotifications: [notification, ...prev.projectNotifications],
    }));
  });

  useWebSocket('project:progress_update', (progress: ProjectProgress) => {
    setData(prev => ({
      ...prev,
      projectProgress: prev.projectProgress.map(p => 
        p.id === progress.id ? { ...p, ...progress } : p
      ),
    }));
  });

  useWebSocket('stats:update', (stats: ProjectStats) => {
    setData(prev => ({
      ...prev,
      projectStats: stats,
    }));
  });

  const markAsRead = useCallback(async (id: string, type: 'feedback' | 'project') => {
    try {
      // 낙관적 업데이트
      if (type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prev.feedbackNotifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      } else {
        setData(prev => ({
          ...prev,
          projectNotifications: prev.projectNotifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      }

      // API 호출
      await apiService.markAsRead(id);
      
      // WebSocket으로도 알림
      send('notification:mark_read', { notificationId: id, type });

    } catch (error) {
      console.error('Failed to mark as read:', error);
      
      // 실패시 롤백
      if (type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prev.feedbackNotifications.map(n =>
            n.id === id ? { ...n, isRead: false } : n
          ),
        }));
      } else {
        setData(prev => ({
          ...prev,
          projectNotifications: prev.projectNotifications.map(n =>
            n.id === id ? { ...n, isRead: false } : n
          ),
        }));
      }
      
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록
    }
  }, [send]);

  const markAllAsRead = useCallback(async (type?: 'feedback' | 'project') => {
    // 이전 상태 백업
    const prevFeedback = data.feedbackNotifications;
    const prevProject = data.projectNotifications;

    try {
      // 낙관적 업데이트
      if (!type || type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prev.feedbackNotifications.map(n => ({ ...n, isRead: true })),
        }));
      }
      if (!type || type === 'project') {
        setData(prev => ({
          ...prev,
          projectNotifications: prev.projectNotifications.map(n => ({ ...n, isRead: true })),
        }));
      }

      // API 호출
      await apiService.markAllAsRead(type);
      
      // WebSocket으로도 알림
      send('notification:mark_all_read', { type });

    } catch (error) {
      console.error('Failed to mark all as read:', error);
      
      // 실패시 롤백
      if (!type || type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prevFeedback,
        }));
      }
      if (!type || type === 'project') {
        setData(prev => ({
          ...prev,
          projectNotifications: prevProject,
        }));
      }
      
      throw error;
    }
  }, [data.feedbackNotifications, data.projectNotifications, send]);

  const deleteNotification = useCallback(async (id: string, type: 'feedback' | 'project') => {
    // 이전 상태 백업
    const prevNotifications = type === 'feedback' 
      ? data.feedbackNotifications
      : data.projectNotifications;

    try {
      // 낙관적 업데이트
      if (type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prev.feedbackNotifications.filter(n => n.id !== id),
        }));
      } else {
        setData(prev => ({
          ...prev,
          projectNotifications: prev.projectNotifications.filter(n => n.id !== id),
        }));
      }

      // API 호출
      await apiService.deleteNotification(id);
      
      // WebSocket으로도 알림
      send('notification:delete', { notificationId: id, type });

    } catch (error) {
      console.error('Failed to delete notification:', error);
      
      // 실패시 롤백
      if (type === 'feedback') {
        setData(prev => ({
          ...prev,
          feedbackNotifications: prevNotifications as FeedbackNotification[],
        }));
      } else {
        setData(prev => ({
          ...prev,
          projectNotifications: prevNotifications as ProjectNotification[],
        }));
      }
      
      throw error;
    }
  }, [data.feedbackNotifications, data.projectNotifications, send]);

  const refresh = useCallback(() => {
    // 페이지 초기화
    setCurrentPage({ feedback: 1, project: 1, progress: 1 });
    setHasMore({ feedback: true, project: true, progress: true });
    
    // 캐시 무효화 후 데이터 다시 로드
    if (enableCache) {
      apiService.clearCache();
    }
    
    loadDashboardData();
  }, [loadDashboardData, enableCache]);

  return {
    ...data,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMoreFeedback,
    loadMoreProjects,
    hasMore,
    cacheStats: enableCache ? apiService.getCacheStats() : null,
  };
}