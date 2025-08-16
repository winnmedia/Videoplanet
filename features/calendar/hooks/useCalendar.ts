/**
 * useCalendar Hook
 * 캘린더의 메인 로직과 상태 관리를 담당하는 커스텀 훅
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility

import {
  CalendarViewType,
  CalendarState,
  CalendarNavigation,
  CalendarModal,
  CalendarStats,
  CalendarEventHandlers,
  UseCalendarReturn,
  MonthData,
  WeekData,
  CalendarDate,
  DateInfo,
  ProjectSchedule,
  CalendarMemo,
  CalendarEvent,
  ProjectPhase,
  DragEventData,
  MemoFormData,
  PhaseFormData,
  DEFAULT_CALENDAR_STATE,
} from '../types';

import calendarApi from '../api/calendarApi';

// ========================
// 유틸리티 함수
// ========================

const createDateInfo = (date: Date, currentMonth: number): DateInfo => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const dateNum = date.getDate();
  const day = date.getDay();
  const today = new Date();
  
  return {
    year,
    month,
    date: dateNum,
    day,
    isToday: date.toDateString() === today.toDateString(),
    isCurrentMonth: month === currentMonth,
    isWeekend: day === 0 || day === 6,
  };
};

const generateMonthDates = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const lastDate = lastDay.getDate();
  
  const dates: Date[] = [];
  
  // 이전 달 날짜
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLastDate = new Date(prevYear, prevMonth + 1, 0).getDate();
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    dates.push(new Date(prevYear, prevMonth, prevLastDate - i));
  }
  
  // 현재 달 날짜
  for (let date = 1; date <= lastDate; date++) {
    dates.push(new Date(year, month, date));
  }
  
  // 다음 달 날짜
  const totalCells = 42; // 6주 × 7일
  const remainingCells = totalCells - dates.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let date = 1; date <= remainingCells; date++) {
    dates.push(new Date(nextYear, nextMonth, date));
  }
  
  return dates;
};

const generateWeekDates = (year: number, month: number, weekIndex: number): Date[] => {
  const monthDates = generateMonthDates(year, month);
  const startIndex = weekIndex * 7;
  return monthDates.slice(startIndex, startIndex + 7);
};

const generateDayDate = (year: number, month: number, dayIndex: number): Date => {
  const monthDates = generateMonthDates(year, month);
  return monthDates[dayIndex] || new Date(year, month, 1);
};

// ========================
// 메인 훅
// ========================

export const useCalendar = (initialView: CalendarViewType = '월'): UseCalendarReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  // Redux에서 프로젝트 데이터 가져오기
  const { project_list, this_month_project, next_month_project, user_memos } = useSelector(
    (state: any) => state.ProjectStore
  );
  
  // ========================
  // 상태 관리
  // ========================
  
  const [state, setState] = useState<CalendarState>({
    ...DEFAULT_CALENDAR_STATE,
    currentView: initialView,
  });
  
  const [navigation, setNavigation] = useState<CalendarNavigation>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    week: 0,
    day: new Date().getDate() - 1,
    weekIndex: 0,
    navigatePrev: () => {},
    navigateNext: () => {},
  });
  
  const [modal, setModal] = useState<CalendarModal>({
    isVisible: false,
    type: null,
    data: null,
  });
  
  const [dragContext, setDragContext] = useState({
    isDragging: false,
    draggedEvent: null as CalendarEvent | null,
    draggedPhase: null as ProjectPhase | null,
    dropTarget: null as Date | null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================
  // 계산된 값들
  // ========================
  
  const currentProjects = useMemo(() => {
    return project_list?.filter((project: any) => {
      const projectEndMonth = new Date(project.end_date).getMonth();
      const projectStartMonth = new Date(project.first_date).getMonth();
      return projectEndMonth === navigation.month || projectStartMonth === navigation.month;
    }) || [];
  }, [project_list, navigation.month]);
  
  const filteredProjects = useMemo(() => {
    if (state.selectedProjectIds.length === 0) {
      return currentProjects;
    }
    return currentProjects.filter((project: any) => 
      state.selectedProjectIds.includes(project.id)
    );
  }, [currentProjects, state.selectedProjectIds]);
  
  const viewData = useMemo(() => {
    const { year, month, weekIndex, day } = navigation;
    
    switch (state.currentView) {
      case '월': {
        const dates = generateMonthDates(year, month);
        const weeks: WeekData[] = [];
        
        for (let i = 0; i < dates.length; i += 7) {
          const weekDates = dates.slice(i, i + 7).map(date => ({
            date,
            dateInfo: createDateInfo(date, month),
            events: [], // 이벤트는 별도 로직에서 처리
            memos: [], // 메모는 별도 로직에서 처리
          }));
          
          weeks.push({
            dates: weekDates,
            weekIndex: i / 7,
          });
        }
        
        return weeks;
      }
      
      case '주': {
        const dates = generateWeekDates(year, month, weekIndex);
        return dates.map(date => ({
          date,
          dateInfo: createDateInfo(date, month),
          events: [],
          memos: [],
        }));
      }
      
      case '일': {
        const date = generateDayDate(year, month, day);
        return [{
          date,
          dateInfo: createDateInfo(date, month),
          events: [],
          memos: [],
        }];
      }
      
      default:
        return [];
    }
  }, [state.currentView, navigation]);
  
  const stats: CalendarStats = useMemo(() => {
    return {
      totalProjects: project_list?.length || 0,
      thisMonthProjects: this_month_project?.length || 0,
      nextMonthProjects: next_month_project?.length || 0,
      activeProjects: project_list?.filter((p: any) => p.isActive)?.length || 0,
      completedProjects: project_list?.filter((p: any) => !p.isActive)?.length || 0,
      overdueProjects: 0, // 별도 계산 필요
    };
  }, [project_list, this_month_project, next_month_project]);

  // ========================
  // 이벤트 핸들러
  // ========================
  
  const handleViewChange = useCallback((view: CalendarViewType) => {
    setState(prev => ({ ...prev, currentView: view }));
    
    // URL 파라미터 업데이트
    const params = new URLSearchParams(searchParams?.toString());
    params.set('view', view);
    router.push(`/calendar?${params.toString()}`);
  }, [router, searchParams]);
  
  const handleDateChange = useCallback((date: Date) => {
    setNavigation(prev => ({
      ...prev,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate() - 1,
    }));
    
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);
  
  const handleProjectFilter = useCallback((projectIds: number[]) => {
    if (projectIds.includes(-1)) { // '전체' 선택
      setState(prev => ({ ...prev, selectedProjectIds: [] }));
    } else {
      setState(prev => ({ ...prev, selectedProjectIds: projectIds }));
    }
  }, []);
  
  const handleMemoCreate = useCallback(async (data: MemoFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (data.projectId) {
        const memoData = {
          memo: data.memo,
          date: calendarApi.formatDateForApi(data.date),
          projectId: data.projectId,
        };
        await calendarApi.createProjectMemo(memoData, data.projectId);
      } else {
        const memoData = {
          memo: data.memo,
          date: calendarApi.formatDateForApi(data.date),
        };
        await calendarApi.createUserMemo(memoData);
      }
      
      // 데이터 새로고침
      await refetch();
      
      // 모달 닫기
      setModal({ isVisible: false, type: null, data: null });
    } catch (err: any) {
      setError(err.message || '메모 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleMemoUpdate = useCallback(async (id: number, data: Partial<MemoFormData>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API에서 메모 업데이트 지원하지 않으므로 삭제 후 재생성
      const memo = user_memos?.find((m: any) => m.id === id);
      if (memo) {
        if (memo.isUserMemo) {
          await calendarApi.deleteUserMemo(id);
        } else {
          await calendarApi.deleteProjectMemo(id, memo.projectId);
        }
        
        if (data.memo) {
          await handleMemoCreate({
            memo: data.memo,
            date: data.date || memo.date,
            projectId: memo.projectId,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || '메모 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user_memos, handleMemoCreate]);
  
  const handleMemoDelete = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const memo = user_memos?.find((m: any) => m.id === id);
      if (memo) {
        if (memo.isUserMemo) {
          await calendarApi.deleteUserMemo(id);
        } else {
          await calendarApi.deleteProjectMemo(id, memo.projectId);
        }
        
        await refetch();
        setModal({ isVisible: false, type: null, data: null });
      }
    } catch (err: any) {
      setError(err.message || '메모 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user_memos]);
  
  const handlePhaseUpdate = useCallback(async (data: PhaseFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await calendarApi.updateProjectPhase(data);
      await refetch();
      
      setModal({ isVisible: false, type: null, data: null });
    } catch (err: any) {
      setError(err.message || '프로젝트 단계 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleDateClick = useCallback((date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
    
    // 메모 작성 모달 열기
    setModal({
      isVisible: true,
      type: 'memo',
      data: {
        date,
        isUserMemo: true, // 기본적으로 사용자 메모
      },
    });
  }, []);
  
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.type === 'memo') {
      setModal({
        isVisible: true,
        type: 'memo',
        data: {
          date: event.startDate,
          existingMemo: event,
        },
      });
    }
  }, []);
  
  const handleDragStart = useCallback((event: CalendarEvent | ProjectPhase) => {
    if ('type' in event && 'title' in event) {
      // It's a CalendarEvent
      setDragContext({
        isDragging: true,
        draggedEvent: event as CalendarEvent,
        draggedPhase: null,
        dropTarget: null,
      });
    } else {
      // It's a ProjectPhase
      setDragContext({
        isDragging: true,
        draggedEvent: null,
        draggedPhase: event as ProjectPhase,
        dropTarget: null,
      });
    }
  }, []);
  
  const handleDragEnd = useCallback(async (data: DragEventData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (data.eventType === 'phase' && data.phaseKey) {
        await calendarApi.updateProjectPhase({
          projectId: data.projectId!,
          phaseKey: data.phaseKey,
          startDate: data.targetDate,
          endDate: data.targetDate, // 임시로 같은 날짜 사용
        });
        
        await refetch();
      }
    } catch (err: any) {
      setError(err.message || '드래그 앤 드롭 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setDragContext({
        isDragging: false,
        draggedEvent: null,
        draggedPhase: null,
        dropTarget: null,
      });
    }
  }, []);
  
  // ========================
  // 네비게이션 함수
  // ========================
  
  const navigatePrev = useCallback(() => {
    setNavigation(prev => {
      const { currentView } = state;
      
      switch (currentView) {
        case '월': {
          const newMonth = prev.month === 0 ? 11 : prev.month - 1;
          const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
          return { ...prev, year: newYear, month: newMonth, weekIndex: 0, day: 0 };
        }
        
        case '주': {
          if (prev.weekIndex === 0) {
            const newMonth = prev.month === 0 ? 11 : prev.month - 1;
            const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
            const dates = generateMonthDates(newYear, newMonth);
            const lastWeekIndex = Math.ceil(dates.length / 7) - 1;
            return { ...prev, year: newYear, month: newMonth, weekIndex: lastWeekIndex };
          } else {
            return { ...prev, weekIndex: prev.weekIndex - 1 };
          }
        }
        
        case '일': {
          if (prev.day === 0) {
            const newMonth = prev.month === 0 ? 11 : prev.month - 1;
            const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
            const dates = generateMonthDates(newYear, newMonth);
            return { ...prev, year: newYear, month: newMonth, day: dates.length - 1 };
          } else {
            return { ...prev, day: prev.day - 1 };
          }
        }
        
        default:
          return prev;
      }
    });
  }, [state.currentView]);
  
  const navigateNext = useCallback(() => {
    setNavigation(prev => {
      const { currentView } = state;
      
      switch (currentView) {
        case '월': {
          const newMonth = prev.month === 11 ? 0 : prev.month + 1;
          const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
          return { ...prev, year: newYear, month: newMonth, weekIndex: 0, day: 0 };
        }
        
        case '주': {
          const dates = generateMonthDates(prev.year, prev.month);
          const maxWeekIndex = Math.ceil(dates.length / 7) - 1;
          
          if (prev.weekIndex === maxWeekIndex) {
            const newMonth = prev.month === 11 ? 0 : prev.month + 1;
            const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
            return { ...prev, year: newYear, month: newMonth, weekIndex: 0 };
          } else {
            return { ...prev, weekIndex: prev.weekIndex + 1 };
          }
        }
        
        case '일': {
          const dates = generateMonthDates(prev.year, prev.month);
          
          if (prev.day === dates.length - 1) {
            const newMonth = prev.month === 11 ? 0 : prev.month + 1;
            const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
            return { ...prev, year: newYear, month: newMonth, day: 0 };
          } else {
            return { ...prev, day: prev.day + 1 };
          }
        }
        
        default:
          return prev;
      }
    });
  }, [state.currentView]);
  
  // ========================
  // 데이터 페칭
  // ========================
  
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Redux를 통한 데이터 새로고침
      // 실제 구현에서는 refetchProject 함수 호출
      // dispatch(refetchProject());
      
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  // ========================
  // 초기화 및 URL 파라미터 처리
  // ========================
  
  useEffect(() => {
    const view = searchParams?.get('view') as CalendarViewType;
    if (view && ['월', '주', '일'].includes(view)) {
      setState(prev => ({ ...prev, currentView: view }));
    }
  }, [searchParams]);
  
  // ========================
  // 이벤트 핸들러 객체
  // ========================
  
  const handlers: CalendarEventHandlers = {
    onViewChange: handleViewChange,
    onDateChange: handleDateChange,
    onProjectFilter: handleProjectFilter,
    onMemoCreate: handleMemoCreate,
    onMemoUpdate: handleMemoUpdate,
    onMemoDelete: handleMemoDelete,
    onPhaseUpdate: handlePhaseUpdate,
    onDateClick: handleDateClick,
    onEventClick: handleEventClick,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  };
  
  // ========================
  // 반환 값
  // ========================
  
  return {
    state: {
      ...state,
      projects: currentProjects,
      filteredProjects,
      userMemos: user_memos || [],
      viewData,
    },
    handlers,
    navigation: {
      ...navigation,
      navigatePrev,
      navigateNext,
    },
    modal,
    stats,
    isLoading,
    error,
    refetch,
    setModal,
  };
};

export default useCalendar;