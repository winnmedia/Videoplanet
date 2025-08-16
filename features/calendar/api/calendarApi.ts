/**
 * Calendar API Functions
 * VideoPlanet 프로젝트의 캘린더 관련 API 함수들
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ProjectListResponse,
  ProjectSchedule,
  CalendarMemo,
  MemoResponse,
  MemoInput,
  PhaseUpdateResponse,
  PhaseFormData,
  CalendarApiError,
  ProjectPhase,
} from '../types';

// ========================
// Axios 인스턴스 설정
// ========================

const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터 - 인증 토큰 추가
  instance.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터 - 토큰 갱신 처리
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const refreshResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/token/refresh/`,
              { refresh: refreshToken }
            );

            const newAccessToken = refreshResponse.data.access;
            localStorage.setItem('access_token', newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // 리프레시 실패 시 로그인 페이지로 리디렉션
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createApiInstance();

// ========================
// 에러 처리 유틸리티
// ========================

const handleApiError = (error: any): CalendarApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'API 오류가 발생했습니다.',
      status: error.response.status,
      field: error.response.data?.field,
    };
  } else if (error.request) {
    return {
      message: '네트워크 오류가 발생했습니다.',
      status: 0,
    };
  } else {
    return {
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      status: -1,
    };
  }
};

// ========================
// 타입 가드 함수
// ========================

const isValidProjectSchedule = (project: any): project is ProjectSchedule => {
  return (
    typeof project === 'object' &&
    project !== null &&
    typeof project.id === 'number' &&
    typeof project.name === 'string' &&
    typeof project.color === 'string' &&
    project.phases &&
    typeof project.phases === 'object'
  );
};

const isValidCalendarMemo = (memo: any): memo is CalendarMemo => {
  return (
    typeof memo === 'object' &&
    memo !== null &&
    typeof memo.id === 'number' &&
    typeof memo.memo === 'string' &&
    memo.date
  );
};

// ========================
// 프로젝트 관련 API
// ========================

/**
 * 프로젝트 목록 조회
 */
export const getProjectList = async (): Promise<ProjectSchedule[]> => {
  try {
    const response: AxiosResponse<ProjectListResponse> = await api.get('/projects/project_list');
    
    if (response.data.success && response.data.projects) {
      return response.data.projects.filter(isValidProjectSchedule);
    }
    
    return [];
  } catch (error) {
    console.error('프로젝트 목록 조회 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 특정 프로젝트 상세 조회
 */
export const getProject = async (projectId: number): Promise<ProjectSchedule> => {
  try {
    const response: AxiosResponse<{ project: ProjectSchedule; success: boolean }> = 
      await api.get(`/projects/detail/${projectId}`);
    
    if (response.data.success && isValidProjectSchedule(response.data.project)) {
      return response.data.project;
    }
    
    throw new Error('유효하지 않은 프로젝트 데이터입니다.');
  } catch (error) {
    console.error('프로젝트 조회 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 프로젝트 단계 일정 업데이트
 */
export const updateProjectPhase = async (data: PhaseFormData): Promise<ProjectPhase> => {
  try {
    const { projectId, phaseKey, startDate, endDate } = data;
    
    const payload = {
      [phaseKey]: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      },
    };

    const response: AxiosResponse<PhaseUpdateResponse> = await api.post(
      `/projects/date_update/${projectId}`,
      payload
    );
    
    if (response.data.success && response.data.phase) {
      return response.data.phase;
    }
    
    throw new Error('프로젝트 단계 업데이트에 실패했습니다.');
  } catch (error) {
    console.error('프로젝트 단계 업데이트 실패:', error);
    throw handleApiError(error);
  }
};

// ========================
// 메모 관련 API
// ========================

/**
 * 프로젝트 메모 작성
 */
export const createProjectMemo = async (data: MemoInput, projectId: number): Promise<CalendarMemo> => {
  try {
    const response: AxiosResponse<MemoResponse> = await api.post(
      `/projects/memo/${projectId}`,
      data
    );
    
    if (response.data.success && isValidCalendarMemo(response.data.memo)) {
      return response.data.memo;
    }
    
    throw new Error('메모 작성에 실패했습니다.');
  } catch (error) {
    console.error('프로젝트 메모 작성 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 프로젝트 메모 삭제
 */
export const deleteProjectMemo = async (memoId: number, projectId: number): Promise<void> => {
  try {
    const response = await api.delete(`/projects/memo/${projectId}`, {
      data: { memo_id: memoId },
    });
    
    if (!response.data.success) {
      throw new Error('메모 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('프로젝트 메모 삭제 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 사용자 메모 작성
 */
export const createUserMemo = async (data: MemoInput): Promise<CalendarMemo> => {
  try {
    const response: AxiosResponse<MemoResponse> = await api.post('/auth/user_memo', data);
    
    if (response.data.success && isValidCalendarMemo(response.data.memo)) {
      return response.data.memo;
    }
    
    throw new Error('사용자 메모 작성에 실패했습니다.');
  } catch (error) {
    console.error('사용자 메모 작성 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 사용자 메모 삭제
 */
export const deleteUserMemo = async (memoId: number): Promise<void> => {
  try {
    const response = await api.delete(`/auth/user_memo/${memoId}`);
    
    if (!response.data.success) {
      throw new Error('사용자 메모 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('사용자 메모 삭제 실패:', error);
    throw handleApiError(error);
  }
};

/**
 * 사용자 메모 목록 조회
 */
export const getUserMemos = async (): Promise<CalendarMemo[]> => {
  try {
    const response: AxiosResponse<{ memos: CalendarMemo[]; success: boolean }> = 
      await api.get('/auth/user_memos');
    
    if (response.data.success && response.data.memos) {
      return response.data.memos.filter(isValidCalendarMemo);
    }
    
    return [];
  } catch (error) {
    console.error('사용자 메모 목록 조회 실패:', error);
    throw handleApiError(error);
  }
};

// ========================
// 통계 관련 API
// ========================

/**
 * 월별 프로젝트 통계 조회
 */
export const getMonthlyProjectStats = async (year: number, month: number) => {
  try {
    const response = await api.get(`/projects/monthly_stats`, {
      params: { year, month },
    });
    
    return response.data;
  } catch (error) {
    console.error('월별 프로젝트 통계 조회 실패:', error);
    throw handleApiError(error);
  }
};

// ========================
// 유틸리티 함수
// ========================

/**
 * 날짜 형식 변환 (Date → YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * API 응답 날짜 변환 (string → Date)
 */
export const parseApiDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * 프로젝트 데이터 정규화
 */
export const normalizeProjectData = (project: any): ProjectSchedule => {
  return {
    ...project,
    firstDate: parseApiDate(project.first_date),
    endDate: parseApiDate(project.end_date),
    phases: {
      basic_plan: {
        ...project.basic_plan,
        startDate: project.basic_plan.start_date ? parseApiDate(project.basic_plan.start_date) : null,
        endDate: project.basic_plan.end_date ? parseApiDate(project.basic_plan.end_date) : null,
      },
      story_board: {
        ...project.story_board,
        startDate: project.story_board.start_date ? parseApiDate(project.story_board.start_date) : null,
        endDate: project.story_board.end_date ? parseApiDate(project.story_board.end_date) : null,
      },
      filming: {
        ...project.filming,
        startDate: project.filming.start_date ? parseApiDate(project.filming.start_date) : null,
        endDate: project.filming.end_date ? parseApiDate(project.filming.end_date) : null,
      },
      video_edit: {
        ...project.video_edit,
        startDate: project.video_edit.start_date ? parseApiDate(project.video_edit.start_date) : null,
        endDate: project.video_edit.end_date ? parseApiDate(project.video_edit.end_date) : null,
      },
      post_work: {
        ...project.post_work,
        startDate: project.post_work.start_date ? parseApiDate(project.post_work.start_date) : null,
        endDate: project.post_work.end_date ? parseApiDate(project.post_work.end_date) : null,
      },
      video_preview: {
        ...project.video_preview,
        startDate: project.video_preview.start_date ? parseApiDate(project.video_preview.start_date) : null,
        endDate: project.video_preview.end_date ? parseApiDate(project.video_preview.end_date) : null,
      },
      confirmation: {
        ...project.confirmation,
        startDate: project.confirmation.start_date ? parseApiDate(project.confirmation.start_date) : null,
        endDate: project.confirmation.end_date ? parseApiDate(project.confirmation.end_date) : null,
      },
      video_delivery: {
        ...project.video_delivery,
        startDate: project.video_delivery.start_date ? parseApiDate(project.video_delivery.start_date) : null,
        endDate: project.video_delivery.end_date ? parseApiDate(project.video_delivery.end_date) : null,
      },
    },
    memo: project.memo.map((memo: any) => ({
      ...memo,
      date: parseApiDate(memo.date),
      createdAt: parseApiDate(memo.created_at),
      updatedAt: parseApiDate(memo.updated_at),
    })),
  };
};

/**
 * 메모 데이터 정규화
 */
export const normalizeMemoData = (memo: any): CalendarMemo => {
  return {
    ...memo,
    date: parseApiDate(memo.date),
    createdAt: parseApiDate(memo.created_at),
    updatedAt: parseApiDate(memo.updated_at),
    isUserMemo: !memo.projectId,
  };
};

// ========================
// 에러 처리 및 리트라이 로직
// ========================

/**
 * 재시도가 가능한 API 호출
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        break;
      }
      
      // 재시도 가능한 에러인지 확인
      const apiError = handleApiError(error);
      if (apiError.status >= 400 && apiError.status < 500) {
        // 클라이언트 에러는 재시도하지 않음
        break;
      }
      
      // 지연 후 재시도
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError;
};

// ========================
// WebSocket 연결 (실시간 업데이트용)
// ========================

export const createCalendarWebSocket = (onMessage: (data: any) => void) => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/calendar/';
  const token = localStorage.getItem('access_token');
  
  const ws = new WebSocket(`${wsUrl}?token=${token}`);
  
  ws.onopen = () => {
    console.log('Calendar WebSocket 연결 성공');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket 메시지 파싱 오류:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('Calendar WebSocket 오류:', error);
  };
  
  ws.onclose = () => {
    console.log('Calendar WebSocket 연결 종료');
  };
  
  return ws;
};

// Default export
const calendarApi = {
  // Projects
  getProjectList,
  getProject,
  updateProjectPhase,
  
  // Memos
  createProjectMemo,
  deleteProjectMemo,
  createUserMemo,
  deleteUserMemo,
  getUserMemos,
  
  // Stats
  getMonthlyProjectStats,
  
  // Utils
  formatDateForApi,
  parseApiDate,
  normalizeProjectData,
  normalizeMemoData,
  withRetry,
  createCalendarWebSocket,
};

export default calendarApi;