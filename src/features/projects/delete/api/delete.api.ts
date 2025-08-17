import { apiClient } from '@/lib/api/client'
import { ApiResponse } from '../model/types'
import { validateEnvironment } from '@/lib/config'

// 환경변수 검증
try {
  validateEnvironment()
} catch (error) {
  console.error('Delete project API configuration error:', error)
}

export const deleteProjectApi = {
  /**
   * 프로젝트 삭제
   */
  deleteProject: async (projectId: string | number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/projects/detail/${projectId}`);
  },

  /**
   * 프로젝트 파일 삭제
   */
  deleteProjectFile: async (fileId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/projects/file/delete/${fileId}`);
  },

  /**
   * 프로젝트 메모 삭제
   */
  deleteProjectMemo: async (memoId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/projects/memo/${memoId}`);
  }
}

// 에러 처리 유틸리티
export const handleDeleteProjectError = (error: any) => {
  if (error?.response?.status === 404) {
    return '삭제할 프로젝트를 찾을 수 없습니다.'
  }
  
  if (error?.response?.status === 403) {
    return '프로젝트를 삭제할 권한이 없습니다.'
  }
  
  if (error?.response?.status === 409) {
    return '진행 중인 프로젝트는 삭제할 수 없습니다.'
  }
  
  if (error?.response?.status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
  
  const message = error?.response?.data?.message || 
                 error?.response?.data?.detail ||
                 error?.response?.data?.non_field_errors?.[0] ||
                 '프로젝트 삭제 중 오류가 발생했습니다.'
  
  return message
}