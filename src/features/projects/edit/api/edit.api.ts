import { fileApiClient, apiClient } from '@/lib/api/client'
import { Project, ProjectDetailResponse } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Edit project API configuration error:', error)
}

export const editProjectApi = {
  /**
   * 프로젝트 업데이트
   */
  updateProject: async (
    projectId: string | number,
    formData: FormData
  ): Promise<Project> => {
    const response = await fileApiClient.post<ProjectDetailResponse>(`/projects/detail/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.result;
  },

  /**
   * 프로젝트 날짜 업데이트
   */
  updateProjectDates: async (
    projectId: string | number,
    dateData: Record<string, { start_date: string | null; end_date: string | null }>
  ): Promise<void> => {
    await apiClient.post<{success: boolean, message: string, result: void}>(`/projects/date_update/${projectId}`, dateData);
  },

  /**
   * FormData 생성 헬퍼 (업데이트용)
   */
  createUpdateFormData: (
    inputs: Record<string, any>,
    process: any[],
    files?: File[],
    members?: any[]
  ): FormData => {
    const formData = new FormData();
    
    formData.append('inputs', JSON.stringify(inputs));
    formData.append('process', JSON.stringify(process));
    
    if (files) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    if (members) {
      formData.append('members', JSON.stringify(members));
    }
    
    return formData;
  }
}

// 에러 처리 유틸리티
export const handleEditProjectError = (error: any) => {
  if (error?.response?.status === 404) {
    return '프로젝트를 찾을 수 없습니다.'
  }
  
  if (error?.response?.status === 403) {
    return '프로젝트를 수정할 권한이 없습니다.'
  }
  
  if (error?.response?.status === 400) {
    const data = error?.response?.data
    if (data?.name) {
      return '프로젝트 이름이 유효하지 않습니다.'
    }
    if (data?.description) {
      return '프로젝트 설명이 유효하지 않습니다.'
    }
    if (data?.files) {
      return '업로드된 파일에 문제가 있습니다.'
    }
  }
  
  if (error?.response?.status === 413) {
    return '파일 크기가 너무 큽니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '프로젝트 수정 중 오류가 발생했습니다.'
  
  return message
}