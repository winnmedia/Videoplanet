import { apiClient, apiClientWithRetry } from '@/lib/api/client'
import { Project, ProjectListResponse, ProjectDetailResponse, ProjectSearchOptions, ProjectStatistics } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('List projects API configuration error:', error)
}

export const listProjectApi = {
  /**
   * 프로젝트 목록 조회
   */
  fetchProjectList: async (options?: ProjectSearchOptions): Promise<Project[]> => {
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
    
    const response = await apiClientWithRetry.get<ProjectListResponse>(url);
    return response.data.result;
  },

  /**
   * 프로젝트 상세 조회
   */
  fetchProject: async (projectId: string | number): Promise<Project> => {
    const response = await apiClient.get<ProjectDetailResponse>(`/projects/detail/${projectId}`);
    return response.data.result;
  },

  /**
   * 프로젝트 통계 조회
   */
  fetchProjectStatistics: async (): Promise<ProjectStatistics> => {
    const response = await apiClient.get<{success: boolean, message: string, result: ProjectStatistics}>('/projects/statistics');
    return response.data.result;
  }
}

// 타입 가드 함수
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
}

// 에러 처리 유틸리티
export const handleListProjectError = (error: any) => {
  if (error?.response?.status === 401) {
    return '로그인이 필요합니다.'
  }
  
  if (error?.response?.status === 403) {
    return '프로젝트 목록을 볼 권한이 없습니다.'
  }
  
  if (error?.response?.status === 404) {
    return '프로젝트를 찾을 수 없습니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '프로젝트 목록을 불러오는 중 오류가 발생했습니다.'
  
  return message
}