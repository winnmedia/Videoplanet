/**
 * 프로젝트 관리 API 로직
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

import axios, { AxiosResponse } from 'axios';
import type {
  Project,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectCreateResponse,
  FileUploadResponse,
  ApiResponse,
  ApiError,
  ProjectSearchOptions,
  ProjectStatistics,
  MemberRating,
  ProjectFile,
  ProjectMemo,
} from '../types';

// ===== API 기본 설정 =====

import { API_BASE_URL, validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Projects API configuration error:', error)
}

/**
 * Axios 인스턴스 생성 (인증 포함)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터 - 인증 토큰 자동 추가
 */
apiClient.interceptors.request.use(
  (config) => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터 - 에러 처리 및 토큰 갱신
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 로직 (구현 필요)
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // 토큰 갱신 API 호출 후 재시도
          // await refreshAccessToken();
          // return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패시 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ===== API 에러 처리 유틸리티 =====

/**
 * API 에러를 표준 형식으로 변환
 */
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'API 요청 중 오류가 발생했습니다.',
      code: error.response.data?.code,
      status: error.response.status,
      details: error.response.data,
    };
  } else if (error.request) {
    return {
      message: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
      status: 0,
    };
  } else {
    return {
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      status: -1,
    };
  }
};

/**
 * API 응답 래퍼 함수
 */
const apiWrapper = async <T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await apiCall();
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API 요청이 실패했습니다.');
    }
    
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===== 프로젝트 CRUD API =====

/**
 * 프로젝트 목록 조회
 */
export const fetchProjectList = async (options?: ProjectSearchOptions): Promise<Project[]> => {
  return apiWrapper(async () => {
    const params = new URLSearchParams();
    
    if (options?.query) params.append('search', options.query);
    if (options?.status) params.append('status', options.status);
    if (options?.manager) params.append('manager', options.manager);
    if (options?.consumer) params.append('consumer', options.consumer);
    if (options?.sortBy) params.append('sort_by', options.sortBy);
    if (options?.sortOrder) params.append('sort_order', options.sortOrder);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/projects/project_list?${queryString}` : '/projects/project_list';
    
    return apiClient.get<ProjectListResponse>(url);
  });
};

/**
 * 프로젝트 상세 조회
 */
export const fetchProject = async (projectId: string | number): Promise<Project> => {
  return apiWrapper(() => 
    apiClient.get<ProjectDetailResponse>(`/projects/detail/${projectId}`)
  );
};

/**
 * 프로젝트 생성
 */
export const createProject = async (formData: FormData): Promise<{ id: number }> => {
  return apiWrapper(() =>
    apiClient.post<ProjectCreateResponse>('/projects/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
};

/**
 * 프로젝트 업데이트
 */
export const updateProject = async (
  projectId: string | number,
  formData: FormData
): Promise<Project> => {
  return apiWrapper(() =>
    apiClient.post<ProjectDetailResponse>(`/projects/detail/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
};

/**
 * 프로젝트 삭제
 */
export const deleteProject = async (projectId: string | number): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/detail/${projectId}`)
  );
};

// ===== 프로젝트 멤버 관리 API =====

/**
 * 프로젝트 멤버 초대
 */
export const inviteProjectMember = async (
  projectId: string | number,
  email: string
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<void>>(`/projects/invite_project/${projectId}`, { email })
  );
};

/**
 * 프로젝트 초대 취소
 */
export const cancelProjectInvitation = async (
  projectId: string | number,
  invitationId: number
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/invite_project/${projectId}`, {
      data: { invitation_id: invitationId }
    })
  );
};

/**
 * 프로젝트 초대 수락
 */
export const acceptProjectInvitation = async (
  uid: string,
  token: string
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.get<ApiResponse<void>>(`/projects/invite/${uid}/${token}`)
  );
};

/**
 * 멤버 권한 변경
 */
export const updateMemberRating = async (
  projectId: string | number,
  memberId: number,
  rating: MemberRating
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<void>>(`/projects/member/${projectId}/${memberId}`, { rating })
  );
};

// ===== 파일 관리 API =====

/**
 * 프로젝트 파일 삭제
 */
export const deleteProjectFile = async (fileId: number): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/file/delete/${fileId}`)
  );
};

/**
 * 파일 업로드
 */
export const uploadProjectFiles = async (
  projectId: string | number,
  files: File[]
): Promise<ProjectFile[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('project_id', projectId.toString());

  return apiWrapper(() =>
    apiClient.post<ApiResponse<ProjectFile[]>>(`/projects/upload/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
};

// ===== 프로젝트 메모 API =====

/**
 * 프로젝트 메모 작성
 */
export const createProjectMemo = async (
  projectId: string | number,
  content: string,
  date?: string
): Promise<ProjectMemo> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<ProjectMemo>>(`/projects/memo/${projectId}`, {
      content,
      date,
    })
  );
};

/**
 * 프로젝트 메모 삭제
 */
export const deleteProjectMemo = async (
  memoId: number
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/memo/${memoId}`)
  );
};

// ===== 프로젝트 일정 관리 API =====

/**
 * 프로젝트 날짜 업데이트
 */
export const updateProjectDates = async (
  projectId: string | number,
  dateData: Record<string, { start_date: string | null; end_date: string | null }>
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<void>>(`/projects/date_update/${projectId}`, dateData)
  );
};

// ===== 프로젝트 통계 API =====

/**
 * 프로젝트 통계 조회
 */
export const fetchProjectStatistics = async (): Promise<ProjectStatistics> => {
  return apiWrapper(() =>
    apiClient.get<ApiResponse<ProjectStatistics>>('/projects/statistics')
  );
};

// ===== 샘플 파일 API =====

/**
 * 샘플 파일 목록 조회
 */
export const fetchSampleFiles = async (): Promise<ProjectFile[]> => {
  return apiWrapper(() =>
    apiClient.get<ApiResponse<ProjectFile[]>>('/projects/sample_files')
  );
};

// ===== 유틸리티 함수 =====

/**
 * 파일 이름 추출
 */
export const extractFileName = (filePath: string): string => {
  return filePath.split('/').pop()?.split('\\').pop() || 'Unknown File';
};

/**
 * 파일 다운로드
 */
export const downloadFile = (fileUrl: string, fileName?: string): void => {
  if (!fileUrl) return;
  
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName || extractFileName(fileUrl);
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * FormData 생성 헬퍼
 */
export const createProjectFormData = (
  inputs: Record<string, any>,
  process: any[],
  files: File[],
  members?: any[]
): FormData => {
  const formData = new FormData();
  
  formData.append('inputs', JSON.stringify(inputs));
  formData.append('process', JSON.stringify(process));
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  if (members) {
    formData.append('members', JSON.stringify(members));
  }
  
  return formData;
};

// ===== 타입 가드 함수 =====

/**
 * Project 타입 가드
 */
export const isProject = (data: any): data is Project => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    Array.isArray(data.files) &&
    Array.isArray(data.member_list)
  );
};

/**
 * ApiError 타입 가드
 */
export const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string' &&
    typeof error.status === 'number'
  );
};

// ===== 기본 내보내기 =====

/**
 * 모든 프로젝트 API를 포함하는 객체
 */
const projectsApi = {
  // CRUD
  fetchProjectList,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  
  // 멤버 관리
  inviteProjectMember,
  cancelProjectInvitation,
  acceptProjectInvitation,
  updateMemberRating,
  
  // 파일 관리
  deleteProjectFile,
  uploadProjectFiles,
  
  // 메모 관리
  createProjectMemo,
  deleteProjectMemo,
  
  // 일정 관리
  updateProjectDates,
  
  // 통계
  fetchProjectStatistics,
  fetchSampleFiles,
  
  // 유틸리티
  extractFileName,
  downloadFile,
  createProjectFormData,
  handleApiError,
  
  // 타입 가드
  isProject,
  isApiError,
};

export default projectsApi;

// Named export로도 제공 (import 호환성을 위해)
export { projectsApi };