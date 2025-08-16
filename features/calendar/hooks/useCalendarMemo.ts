/**
 * useCalendarMemo Hook
 * 캘린더 메모 관리를 위한 커스텀 훅
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CalendarMemo,
  UseCalendarMemoReturn,
  MemoFormData,
  MemoFormErrors,
  MemoInput,
} from '../types';
import calendarApi from '../api/calendarApi';

export const useCalendarMemo = (): UseCalendarMemoReturn => {
  const dispatch = useDispatch();
  const { user_memos, project_list } = useSelector((state: any) => state.ProjectStore);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================
  // 계산된 값들
  // ========================
  
  const memos: CalendarMemo[] = useMemo(() => {
    const userMemos = (user_memos || []).map((memo: any) => ({
      id: memo.id,
      memo: memo.memo,
      date: new Date(memo.date),
      userId: memo.user_id,
      userName: memo.user_name || '익명',
      isUserMemo: true,
      createdAt: new Date(memo.created_at || memo.date),
      updatedAt: new Date(memo.updated_at || memo.date),
    }));

    const projectMemos: CalendarMemo[] = [];
    
    (project_list || []).forEach((project: any) => {
      if (project.memo && project.memo.length > 0) {
        project.memo.forEach((memo: any) => {
          projectMemos.push({
            id: memo.id,
            memo: memo.memo,
            date: new Date(memo.date),
            projectId: project.id,
            userId: memo.user_id || 0,
            userName: memo.user_name || project.owner?.name || '프로젝트 메모',
            isUserMemo: false,
            createdAt: new Date(memo.created_at || memo.date),
            updatedAt: new Date(memo.updated_at || memo.date),
          });
        });
      }
    });

    return [...userMemos, ...projectMemos].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [user_memos, project_list]);

  const userMemos = useMemo(() => {
    return memos.filter(memo => memo.isUserMemo);
  }, [memos]);

  // ========================
  // 유효성 검사
  // ========================
  
  const validateMemoForm = useCallback((data: MemoFormData): MemoFormErrors => {
    const errors: MemoFormErrors = {};

    if (!data.memo || data.memo.trim().length === 0) {
      errors.memo = '메모 내용을 입력해주세요.';
    } else if (data.memo.length > 500) {
      errors.memo = '메모는 500자 이내로 작성해주세요.';
    }

    if (!data.date) {
      errors.date = '날짜를 선택해주세요.';
    } else {
      // 너무 과거나 미래 날짜 체크 (선택사항)
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const oneYearLater = new Date();
      oneYearLater.setFullYear(today.getFullYear() + 1);

      if (data.date < oneYearAgo) {
        errors.date = '1년 이전의 날짜는 선택할 수 없습니다.';
      } else if (data.date > oneYearLater) {
        errors.date = '1년 이후의 날짜는 선택할 수 없습니다.';
      }
    }

    return errors;
  }, []);

  // ========================
  // CRUD 함수들
  // ========================
  
  const createMemo = useCallback(async (data: MemoFormData): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);

      // 유효성 검사
      const errors = validateMemoForm(data);
      if (Object.keys(errors).length > 0) {
        throw new Error(errors.memo || errors.date || '입력값을 확인해주세요.');
      }

      if (data.projectId) {
        // 프로젝트 메모 생성
        const memoData: MemoInput = {
          memo: data.memo.trim(),
          date: calendarApi.formatDateForApi(data.date),
          projectId: data.projectId,
        };
        await calendarApi.createProjectMemo(memoData, data.projectId);
      } else {
        // 사용자 메모 생성
        const memoData = {
          memo: data.memo.trim(),
          date: calendarApi.formatDateForApi(data.date),
        };
        await calendarApi.createUserMemo(memoData);
      }

      // Redux 상태 업데이트를 위한 데이터 새로고침 요청
      // 실제 구현에서는 dispatch를 통해 처리
      
    } catch (err: any) {
      const errorMessage = err.message || '메모 작성에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [validateMemoForm]);

  const updateMemo = useCallback(async (id: number, data: Partial<MemoFormData>): Promise<void> => {
    try {
      setIsUpdating(true);
      setError(null);

      const memo = memos.find(m => m.id === id);
      if (!memo) {
        throw new Error('수정할 메모를 찾을 수 없습니다.');
      }

      // API가 메모 업데이트를 직접 지원하지 않으므로 삭제 후 재생성
      if (memo.isUserMemo) {
        await calendarApi.deleteUserMemo(id);
      } else {
        await calendarApi.deleteProjectMemo(id, memo.projectId!);
      }

      // 새 데이터로 메모 재생성
      if (data.memo && data.memo.trim().length > 0) {
        if (memo.projectId) {
          const newMemoData: MemoFormData = {
            memo: data.memo,
            date: data.date || memo.date,
            projectId: memo.projectId,
          };
          await createMemo(newMemoData);
        } else {
          const newMemoData = {
            memo: data.memo,
            date: data.date || memo.date,
          };
          await createMemo(newMemoData as MemoFormData);
        }
      }

    } catch (err: any) {
      const errorMessage = err.message || '메모 수정에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [memos, createMemo]);

  const deleteMemo = useCallback(async (id: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      const memo = memos.find(m => m.id === id);
      if (!memo) {
        throw new Error('삭제할 메모를 찾을 수 없습니다.');
      }

      if (memo.isUserMemo) {
        await calendarApi.deleteUserMemo(id);
      } else {
        await calendarApi.deleteProjectMemo(id, memo.projectId!);
      }

      // Redux 상태 업데이트를 위한 데이터 새로고침 요청
      
    } catch (err: any) {
      const errorMessage = err.message || '메모 삭제에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [memos]);

  // ========================
  // 유틸리티 함수들
  // ========================
  
  const getMemosByDate = useCallback((date: Date): CalendarMemo[] => {
    const targetDate = calendarApi.formatDateForApi(date);
    return memos.filter(memo => 
      calendarApi.formatDateForApi(memo.date) === targetDate
    );
  }, [memos]);

  const getMemosByProject = useCallback((projectId: number): CalendarMemo[] => {
    return memos.filter(memo => memo.projectId === projectId);
  }, [memos]);

  const getUserMemosByDate = useCallback((date: Date): CalendarMemo[] => {
    const targetDate = calendarApi.formatDateForApi(date);
    return userMemos.filter(memo => 
      calendarApi.formatDateForApi(memo.date) === targetDate
    );
  }, [userMemos]);

  const getProjectMemosByDate = useCallback((date: Date, projectId?: number): CalendarMemo[] => {
    const targetDate = calendarApi.formatDateForApi(date);
    let projectMemos = memos.filter(memo => 
      !memo.isUserMemo && calendarApi.formatDateForApi(memo.date) === targetDate
    );

    if (projectId) {
      projectMemos = projectMemos.filter(memo => memo.projectId === projectId);
    }

    return projectMemos;
  }, [memos]);

  const getMemoStats = useCallback(() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return {
      total: memos.length,
      userMemos: userMemos.length,
      projectMemos: memos.filter(memo => !memo.isUserMemo).length,
      thisMonth: memos.filter(memo => 
        memo.date >= thisMonth && memo.date < nextMonth
      ).length,
      today: memos.filter(memo =>
        memo.date.toDateString() === today.toDateString()
      ).length,
    };
  }, [memos, userMemos]);

  const canEditMemo = useCallback((memoId: number, userId?: number): boolean => {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return false;

    // 사용자 메모는 본인만 수정 가능
    if (memo.isUserMemo) {
      return userId ? memo.userId === userId : false;
    }

    // 프로젝트 메모는 프로젝트 관리자나 메모 작성자만 수정 가능
    // 현재는 단순하게 true 반환 (실제로는 권한 체크 필요)
    return true;
  }, [memos]);

  const canDeleteMemo = useCallback((memoId: number, userId?: number): boolean => {
    // 편집 권한과 동일
    return canEditMemo(memoId, userId);
  }, [canEditMemo]);

  const searchMemos = useCallback((query: string): CalendarMemo[] => {
    if (!query || query.trim().length === 0) {
      return memos;
    }

    const searchTerm = query.toLowerCase().trim();
    return memos.filter(memo =>
      memo.memo.toLowerCase().includes(searchTerm) ||
      memo.userName.toLowerCase().includes(searchTerm)
    );
  }, [memos]);

  const getMemosInRange = useCallback((startDate: Date, endDate: Date): CalendarMemo[] => {
    return memos.filter(memo =>
      memo.date >= startDate && memo.date <= endDate
    );
  }, [memos]);

  // ========================
  // 에러 관리
  // ========================
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ========================
  // 일괄 작업
  // ========================
  
  const deleteMemosBulk = useCallback(async (memoIds: number[]): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      const results = await Promise.allSettled(
        memoIds.map(id => deleteMemo(id))
      );

      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`${failed.length}개의 메모 삭제에 실패했습니다.`);
      }

    } catch (err: any) {
      const errorMessage = err.message || '메모 일괄 삭제에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteMemo]);

  const exportMemos = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'csv') {
      const headers = ['ID', '내용', '날짜', '작성자', '타입', '생성일'];
      const rows = memos.map(memo => [
        memo.id.toString(),
        `"${memo.memo.replace(/"/g, '""')}"`, // CSV에서 따옴표 이스케이프
        calendarApi.formatDateForApi(memo.date),
        memo.userName,
        memo.isUserMemo ? '개인 메모' : '프로젝트 메모',
        memo.createdAt.toISOString(),
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      return JSON.stringify(memos, null, 2);
    }
  }, [memos]);

  // ========================
  // 반환 값
  // ========================
  
  return {
    memos,
    userMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // 유틸리티 함수들
    getMemosByDate,
    getMemosByProject,
    getUserMemosByDate,
    getProjectMemosByDate,
    getMemoStats,
    canEditMemo,
    canDeleteMemo,
    searchMemos,
    getMemosInRange,
    
    // 일괄 작업
    deleteMemosBulk,
    exportMemos,
    
    // 유효성 검사
    validateMemoForm,
    
    // 에러 관리
    clearError,
  };
};

export default useCalendarMemo;