/**
 * 프로젝트 관리 API 로직
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

import { AxiosResponse } from 'axios';
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
  ProjectInvitation,
} from '../types';

// ===== API 클라이언트 Import =====
import { apiClient, apiClientWithRetry, fileApiClient } from '@/lib/api/client';
import { errorHandler, ErrorType } from '@/lib/error-handling/errorHandler';

// ===== API 에러 처리 유틸리티 =====

/**
 * API 에러를 표준 형식으로 변환 (통합 에러 핸들러 사용)
 */
const handleApiError = (error: any): ApiError => {
  let errorType: ErrorType;
  
  // HTTP 상태 코드에 따른 에러 타입 결정
  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorType = ErrorType.AUTH_EXPIRED;
        break;
      case 403:
        errorType = ErrorType.PERMISSION_DENIED;
        break;
      case 404:
        errorType = ErrorType.PROJECT_NOT_FOUND;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = ErrorType.NETWORK_SERVER_ERROR;
        break;
      default:
        errorType = ErrorType.UNKNOWN_ERROR;
    }
  } else if (error.request) {
    errorType = ErrorType.NETWORK_OFFLINE;
  } else {
    errorType = ErrorType.UNKNOWN_ERROR;
  }
  
  // 통합 에러 핸들러로 에러 생성
  const appError = errorHandler.createError(errorType, {
    context: {
      originalError: error,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    },
    customMessage: error.response?.data?.message
  });
  
  // 에러 처리
  errorHandler.handleError(appError);
  
  // 기존 ApiError 형식으로 반환 (하위 호환성)
  return {
    message: appError.userMessage,
    code: error.response?.data?.code,
    status: error.response?.status || 0,
    details: error.response?.data,
  };
};

// retryWithBackoff 대신 apiClientWithRetry 사용
// (이미 /lib/api/client.ts에서 구현됨)

/**
 * API 응답 래퍼 함수 (통합 에러 핸들링 포함)
 */
const apiWrapper = async <T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>,
  useRetry: boolean = false
): Promise<T> => {
  try {
    const client = useRetry ? apiClientWithRetry : apiClient;
    const response = await apiCall();
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API 요청이 실패했습니다.');
    }
    
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 재시도를 위한 API 래퍼 함수
 */
const apiWrapperWithRetry = async <T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  return apiWrapper(apiCall, true);
};

// ===== 프로젝트 CRUD API =====

/**
 * 프로젝트 목록 조회
 */
const fetchProjectList = async (options?: ProjectSearchOptions): Promise<Project[]> => {
  return apiWrapperWithRetry(async () => {
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
    const url = queryString ? `/projects?${queryString}` : '/projects';
    
    return apiClientWithRetry.get<ProjectListResponse>(url);
  });
};

/**
 * 프로젝트 상세 조회
 */
const fetchProject = async (projectId: string | number): Promise<Project> => {
  return apiWrapper(() => 
    apiClient.get<ProjectDetailResponse>(`/projects/detail/${projectId}`)
  );
};

/**
 * 프로젝트 생성
 */
const createProject = async (formData: FormData): Promise<{ id: number }> => {
  return apiWrapper(() =>
    fileApiClient.post<ProjectCreateResponse>('/projects/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
};

/**
 * 프로젝트 업데이트
 */
const updateProject = async (
  projectId: string | number,
  formData: FormData
): Promise<Project> => {
  return apiWrapper(() =>
    fileApiClient.post<ProjectDetailResponse>(`/projects/detail/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
};

/**
 * 프로젝트 삭제
 */
const deleteProject = async (projectId: string | number): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/detail/${projectId}`)
  );
};

// ===== 프로젝트 멤버 관리 API =====

/**
 * 프로젝트 멤버 초대 (단일)
 */
const inviteProjectMember = async (
  projectId: string | number,
  email: string
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<void>>(`/projects/invite_project/${projectId}`, { email })
  );
};

/**
 * 프로젝트 멤버 대량 초대
 */
const inviteMultipleMembers = async (
  projectId: string | number,
  emails: string[]
): Promise<{ 
  successful: string[]; 
  failed: Array<{ email: string; error: string }> 
}> => {
  const results = {
    successful: [] as string[],
    failed: [] as Array<{ email: string; error: string }>
  };

  // 병렬 처리로 모든 초대 전송
  const promises = emails.map(async (email) => {
    try {
      await inviteProjectMember(projectId, email);
      results.successful.push(email);
    } catch (error) {
      const errorMessage = isApiError(error) ? error.message : '초대 실패';
      results.failed.push({ email, error: errorMessage });
    }
  });

  await Promise.allSettled(promises);
  return results;
};

/**
 * 프로젝트 초대 취소
 */
const cancelProjectInvitation = async (
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
const acceptProjectInvitation = async (
  uid: string,
  token: string
): Promise<void> => {
  return apiWrapperWithRetry(() =>
    apiClientWithRetry.get<ApiResponse<void>>(`/projects/invite/${uid}/${token}`)
  );
};

/**
 * 초대 재발송
 */
const resendProjectInvitation = async (
  projectId: string | number,
  invitationId: number
): Promise<void> => {
  return apiWrapper(() =>
    apiClient.post<ApiResponse<void>>(`/projects/invite_project/${projectId}/resend`, { 
      invitation_id: invitationId 
    })
  );
};

/**
 * 초대 상태 조회
 */
const getInvitationStatus = async (
  projectId: string | number
): Promise<ProjectInvitation[]> => {
  return apiWrapperWithRetry(() =>
    apiClientWithRetry.get<ApiResponse<ProjectInvitation[]>>(`/projects/invite_project/${projectId}/status`)
  );
};

/**
 * 멤버 권한 변경
 */
const updateMemberRating = async (
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
const deleteProjectFile = async (fileId: number): Promise<void> => {
  return apiWrapper(() =>
    apiClient.delete<ApiResponse<void>>(`/projects/file/delete/${fileId}`)
  );
};

/**
 * 파일 업로드
 */
const uploadProjectFiles = async (
  projectId: string | number,
  files: File[]
): Promise<ProjectFile[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('project_id', projectId.toString());

  return apiWrapper(() =>
    fileApiClient.post<ApiResponse<ProjectFile[]>>(`/projects/upload/${projectId}`, formData, {
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
const createProjectMemo = async (
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
const deleteProjectMemo = async (
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
const updateProjectDates = async (
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
const fetchProjectStatistics = async (): Promise<ProjectStatistics> => {
  return apiWrapper(() =>
    apiClient.get<ApiResponse<ProjectStatistics>>('/projects/statistics')
  );
};

// ===== 샘플 파일 API =====

/**
 * 샘플 파일 목록 조회
 */
const fetchSampleFiles = async (): Promise<ProjectFile[]> => {
  return apiWrapper(() =>
    apiClient.get<ApiResponse<ProjectFile[]>>('/projects/sample_files')
  );
};

// ===== 유틸리티 함수 =====

/**
 * 파일 이름 추출
 */
const extractFileName = (filePath: string): string => {
  return filePath.split('/').pop()?.split('\\').pop() || 'Unknown File';
};

/**
 * 파일 다운로드
 */
const downloadFile = (fileUrl: string, fileName?: string): void => {
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
const createProjectFormData = (
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
const isProject = (data: any): data is Project => {
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
const isApiError = (error: any): error is ApiError => {
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
  inviteMultipleMembers,
  cancelProjectInvitation,
  acceptProjectInvitation,
  resendProjectInvitation,
  getInvitationStatus,
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

// ===== Named Exports =====
export {
  // CRUD
  fetchProjectList,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  
  // 멤버 관리
  inviteProjectMember,
  inviteMultipleMembers,
  cancelProjectInvitation,
  acceptProjectInvitation,
  resendProjectInvitation,
  getInvitationStatus,
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