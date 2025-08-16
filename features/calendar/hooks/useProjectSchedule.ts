/**
 * useProjectSchedule Hook
 * 프로젝트 스케줄 관리를 위한 커스텀 훅
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ProjectSchedule,
  ProjectPhase,
  UseProjectScheduleReturn,
  PhaseFormData,
  PROJECT_PHASES,
  ProjectPhaseKey,
} from '../types';
import calendarApi from '../api/calendarApi';

export const useProjectSchedule = (): UseProjectScheduleReturn => {
  const dispatch = useDispatch();
  const { project_list } = useSelector((state: any) => state.ProjectStore);
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================
  // 계산된 값들
  // ========================
  
  const projects: ProjectSchedule[] = useMemo(() => {
    return project_list?.map((project: any) => ({
      ...project,
      firstDate: new Date(project.first_date),
      endDate: new Date(project.end_date),
      phases: {
        basic_plan: {
          id: `${project.id}-basic_plan`,
          name: PROJECT_PHASES.basic_plan.name,
          key: 'basic_plan',
          startDate: project.basic_plan?.start_date ? new Date(project.basic_plan.start_date) : null,
          endDate: project.basic_plan?.end_date ? new Date(project.basic_plan.end_date) : null,
          color: PROJECT_PHASES.basic_plan.color,
          order: PROJECT_PHASES.basic_plan.order,
        },
        story_board: {
          id: `${project.id}-story_board`,
          name: PROJECT_PHASES.story_board.name,
          key: 'story_board',
          startDate: project.story_board?.start_date ? new Date(project.story_board.start_date) : null,
          endDate: project.story_board?.end_date ? new Date(project.story_board.end_date) : null,
          color: PROJECT_PHASES.story_board.color,
          order: PROJECT_PHASES.story_board.order,
        },
        filming: {
          id: `${project.id}-filming`,
          name: PROJECT_PHASES.filming.name,
          key: 'filming',
          startDate: project.filming?.start_date ? new Date(project.filming.start_date) : null,
          endDate: project.filming?.end_date ? new Date(project.filming.end_date) : null,
          color: PROJECT_PHASES.filming.color,
          order: PROJECT_PHASES.filming.order,
        },
        video_edit: {
          id: `${project.id}-video_edit`,
          name: PROJECT_PHASES.video_edit.name,
          key: 'video_edit',
          startDate: project.video_edit?.start_date ? new Date(project.video_edit.start_date) : null,
          endDate: project.video_edit?.end_date ? new Date(project.video_edit.end_date) : null,
          color: PROJECT_PHASES.video_edit.color,
          order: PROJECT_PHASES.video_edit.order,
        },
        post_work: {
          id: `${project.id}-post_work`,
          name: PROJECT_PHASES.post_work.name,
          key: 'post_work',
          startDate: project.post_work?.start_date ? new Date(project.post_work.start_date) : null,
          endDate: project.post_work?.end_date ? new Date(project.post_work.end_date) : null,
          color: PROJECT_PHASES.post_work.color,
          order: PROJECT_PHASES.post_work.order,
        },
        video_preview: {
          id: `${project.id}-video_preview`,
          name: PROJECT_PHASES.video_preview.name,
          key: 'video_preview',
          startDate: project.video_preview?.start_date ? new Date(project.video_preview.start_date) : null,
          endDate: project.video_preview?.end_date ? new Date(project.video_preview.end_date) : null,
          color: PROJECT_PHASES.video_preview.color,
          order: PROJECT_PHASES.video_preview.order,
        },
        confirmation: {
          id: `${project.id}-confirmation`,
          name: PROJECT_PHASES.confirmation.name,
          key: 'confirmation',
          startDate: project.confirmation?.start_date ? new Date(project.confirmation.start_date) : null,
          endDate: project.confirmation?.end_date ? new Date(project.confirmation.end_date) : null,
          color: PROJECT_PHASES.confirmation.color,
          order: PROJECT_PHASES.confirmation.order,
        },
        video_delivery: {
          id: `${project.id}-video_delivery`,
          name: PROJECT_PHASES.video_delivery.name,
          key: 'video_delivery',
          startDate: project.video_delivery?.start_date ? new Date(project.video_delivery.start_date) : null,
          endDate: project.video_delivery?.end_date ? new Date(project.video_delivery.end_date) : null,
          color: PROJECT_PHASES.video_delivery.color,
          order: PROJECT_PHASES.video_delivery.order,
        },
      },
      memo: project.memo?.map((memo: any) => ({
        ...memo,
        date: new Date(memo.date),
        createdAt: new Date(memo.created_at),
        updatedAt: new Date(memo.updated_at),
        isUserMemo: false,
      })) || [],
      isActive: true, // 기본값
      owner: project.owner || { id: 0, name: '', email: '' },
      members: project.members || [],
    })) || [];
  }, [project_list]);

  const filteredProjects = useMemo(() => {
    if (selectedProjectIds.length === 0) {
      return projects;
    }
    return projects.filter(project => selectedProjectIds.includes(project.id));
  }, [projects, selectedProjectIds]);

  // ========================
  // 핸들러 함수들
  // ========================
  
  const filterProjects = useCallback((projectIds: number[]) => {
    setSelectedProjectIds(projectIds);
  }, []);

  const updatePhase = useCallback(async (data: PhaseFormData) => {
    try {
      setIsUpdating(true);
      setError(null);

      await calendarApi.updateProjectPhase(data);
      
      // Redux 상태 업데이트를 위해 프로젝트 데이터 다시 불러오기
      // 실제 구현에서는 dispatch를 통해 상태 업데이트
      
    } catch (err: any) {
      setError(err.message || '프로젝트 단계 업데이트에 실패했습니다.');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // ========================
  // 유틸리티 함수들
  // ========================
  
  const getProjectPhase = useCallback((projectId: number, phaseKey: ProjectPhaseKey): ProjectPhase | null => {
    const project = projects.find(p => p.id === projectId);
    return project?.phases[phaseKey] || null;
  }, [projects]);

  const getProjectProgress = useCallback((projectId: number): number => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;

    const phases = Object.values(project.phases);
    const completedPhases = phases.filter(phase => 
      phase.startDate && phase.endDate && new Date() > phase.endDate
    );
    
    return (completedPhases.length / phases.length) * 100;
  }, [projects]);

  const getProjectsByPhase = useCallback((phaseKey: ProjectPhaseKey) => {
    return projects.map(project => ({
      project,
      phase: project.phases[phaseKey],
    })).filter(({ phase }) => phase.startDate && phase.endDate);
  }, [projects]);

  const getUpcomingDeadlines = useCallback((days: number = 7) => {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + days);

    const deadlines: Array<{
      project: ProjectSchedule;
      phase: ProjectPhase;
      daysLeft: number;
    }> = [];

    projects.forEach(project => {
      Object.values(project.phases).forEach(phase => {
        if (phase.endDate && phase.endDate >= now && phase.endDate <= targetDate) {
          const daysLeft = Math.ceil((phase.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          deadlines.push({ project, phase, daysLeft });
        }
      });
    });

    return deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [projects]);

  const getOverdueProjects = useCallback(() => {
    const now = new Date();
    
    const overdueItems: Array<{
      project: ProjectSchedule;
      phase: ProjectPhase;
      daysOverdue: number;
    }> = [];

    projects.forEach(project => {
      Object.values(project.phases).forEach(phase => {
        if (phase.endDate && phase.endDate < now) {
          const daysOverdue = Math.ceil((now.getTime() - phase.endDate.getTime()) / (1000 * 60 * 60 * 24));
          overdueItems.push({ project, phase, daysOverdue });
        }
      });
    });

    return overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [projects]);

  const isPhaseEditable = useCallback((projectId: number, phaseKey: ProjectPhaseKey): boolean => {
    // 프로젝트 소유자나 관리자인지 확인하는 로직
    // 현재는 단순하게 true 반환
    return true;
  }, []);

  const getPhaseValidationErrors = useCallback((data: PhaseFormData): string[] => {
    const errors: string[] = [];
    
    if (!data.startDate) {
      errors.push('시작 날짜를 선택해주세요.');
    }
    
    if (!data.endDate) {
      errors.push('종료 날짜를 선택해주세요.');
    }
    
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      errors.push('종료 날짜는 시작 날짜보다 늦어야 합니다.');
    }
    
    // 과거 날짜 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (data.startDate && data.startDate < today) {
      errors.push('시작 날짜는 오늘 이후여야 합니다.');
    }
    
    return errors;
  }, []);

  // ========================
  // 드래그 앤 드롭 관련
  // ========================
  
  const canDropPhase = useCallback((
    phaseKey: ProjectPhaseKey, 
    targetDate: Date, 
    projectId: number
  ): boolean => {
    // 드롭 가능 여부 체크 로직
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    
    // 프로젝트 전체 기간 내에 있는지 확인
    if (targetDate < project.firstDate || targetDate > project.endDate) {
      return false;
    }
    
    // 편집 권한이 있는지 확인
    if (!isPhaseEditable(projectId, phaseKey)) {
      return false;
    }
    
    return true;
  }, [projects, isPhaseEditable]);

  const movePhase = useCallback(async (
    phaseKey: ProjectPhaseKey,
    targetDate: Date,
    projectId: number,
    duration?: number // 기존 기간 유지하려면 전달
  ) => {
    try {
      setIsUpdating(true);
      setError(null);

      const project = projects.find(p => p.id === projectId);
      const currentPhase = project?.phases[phaseKey];
      
      if (!currentPhase) {
        throw new Error('프로젝트 단계를 찾을 수 없습니다.');
      }

      let endDate = targetDate;
      
      // 기존 기간 유지
      if (duration && duration > 0) {
        endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + duration);
      }

      await updatePhase({
        projectId,
        phaseKey,
        startDate: targetDate,
        endDate,
      });

    } catch (err: any) {
      setError(err.message || '프로젝트 단계 이동에 실패했습니다.');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [projects, updatePhase]);

  // ========================
  // 에러 초기화
  // ========================
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ========================
  // 반환 값
  // ========================
  
  return {
    projects,
    filteredProjects,
    selectedProjectIds,
    filterProjects,
    updatePhase,
    isUpdating,
    error,
    
    // 유틸리티 함수들
    getProjectPhase,
    getProjectProgress,
    getProjectsByPhase,
    getUpcomingDeadlines,
    getOverdueProjects,
    isPhaseEditable,
    getPhaseValidationErrors,
    
    // 드래그 앤 드롭
    canDropPhase,
    movePhase,
    
    // 에러 관리
    clearError,
  };
};

export default useProjectSchedule;