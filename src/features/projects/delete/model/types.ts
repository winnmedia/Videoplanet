// 프로젝트 삭제 관련 타입

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  result: T
  error?: string
}

/**
 * 프로젝트 삭제 상태
 */
export interface DeleteProjectState {
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * 삭제 확인 모달 Props
 */
export interface DeleteConfirmationProps {
  projectName: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

/**
 * 파일 삭제 상태
 */
export interface DeleteFileState {
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * 메모 삭제 상태
 */
export interface DeleteMemoState {
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * 삭제 작업 타입
 */
export type DeleteType = 'project' | 'file' | 'memo'

/**
 * 삭제 작업 결과
 */
export interface DeleteResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * 훅 반환 타입
 */
export interface UseDeleteProjectReturn {
  deleteState: DeleteProjectState
  deleteProject: (projectId: string | number) => Promise<DeleteResult>
  clearError: () => void
}

export interface UseDeleteFileReturn {
  deleteState: DeleteFileState
  deleteFile: (fileId: number) => Promise<DeleteResult>
  clearError: () => void
}

export interface UseDeleteMemoReturn {
  deleteState: DeleteMemoState
  deleteMemo: (memoId: number) => Promise<DeleteResult>
  clearError: () => void
}

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string
  code?: string
  status: number
  details?: any
}