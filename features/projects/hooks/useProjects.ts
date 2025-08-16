/**
 * 프로젝트 관리 커스텀 훅
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type {
  Project,
  UseProjectsReturn,
  MemberRating,
  ProjectSearchOptions,
  ProjectInputData,
  ProjectDateRange,
  UseProjectFormReturn,
  ProjectFormValidation,
  UseFileUploadReturn,
  FileUploadState,
  FileUploadStatus,
  ApiError,
} from '../types';
import projectsApi from '../api/projectsApi';

// ===== Redux 관련 타입 (임시) =====
interface RootState {
  ProjectStore: {
    project_list: Project[];
    sample_files: any[];
    user: string;
  };
}

// ===== 주요 프로젝트 관리 훅 =====

/**
 * 프로젝트 목록 및 CRUD 관리 훅
 */
export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const dispatch = useDispatch();
  const { project_list } = useSelector((state: RootState) => state.ProjectStore);

  // 프로젝트 목록 조회
  const fetchProjects = useCallback(async (options?: ProjectSearchOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await projectsApi.fetchProjectList(options);
      setProjects(data);
      
      // Redux 스토어 업데이트 (기존 패턴 유지)
      dispatch({ type: 'SET_PROJECT_LIST', payload: data });
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '프로젝트 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // 프로젝트 상세 조회
  const fetchProject = useCallback(async (id: string | number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await projectsApi.fetchProject(id);
      setCurrentProject(data);
      
      return data;
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '프로젝트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로젝트 생성
  const createProject = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await projectsApi.createProject(formData);
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      toast.success('프로젝트가 성공적으로 생성되었습니다.');
      router.push('/Calendar');
      
      // 생성된 프로젝트 정보 반환
      const newProject = await fetchProject(result.id);
      return newProject;
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '프로젝트 생성에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchProject, router]);

  // 프로젝트 업데이트
  const updateProject = useCallback(async (id: string | number, formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProject = await projectsApi.updateProject(id, formData);
      setCurrentProject(updatedProject);
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      toast.success('프로젝트가 성공적으로 업데이트되었습니다.');
      router.push('/Calendar');
      
      return updatedProject;
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '프로젝트 업데이트에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, router]);

  // 프로젝트 삭제
  const deleteProject = useCallback(async (id: string | number) => {
    const confirmed = window.confirm('프로젝트를 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      
      await projectsApi.deleteProject(id);
      
      // 현재 프로젝트가 삭제된 경우 초기화
      if (currentProject?.id === Number(id)) {
        setCurrentProject(null);
      }
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      toast.success('프로젝트가 성공적으로 삭제되었습니다.');
      router.push('/Calendar');
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '프로젝트 삭제에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProject, fetchProjects, router]);

  // 멤버 초대
  const inviteMember = useCallback(async (projectId: string | number, email: string) => {
    try {
      await projectsApi.inviteProjectMember(projectId, email);
      
      // 프로젝트 상세 정보 새로고침
      if (currentProject?.id === Number(projectId)) {
        await fetchProject(projectId);
      }
      
      toast.success('멤버 초대가 완료되었습니다.');
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '멤버 초대에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [currentProject, fetchProject]);

  // 멤버 권한 변경
  const updateMemberRating = useCallback(async (
    projectId: string | number,
    memberId: number,
    rating: MemberRating
  ) => {
    try {
      await projectsApi.updateMemberRating(projectId, memberId, rating);
      
      // 프로젝트 상세 정보 새로고침
      if (currentProject?.id === Number(projectId)) {
        await fetchProject(projectId);
      }
      
      toast.success('멤버 권한이 변경되었습니다.');
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '멤버 권한 변경에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [currentProject, fetchProject]);

  // 파일 삭제
  const deleteFile = useCallback(async (fileId: number) => {
    const confirmed = window.confirm('파일을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await projectsApi.deleteProjectFile(fileId);
      
      // 현재 프로젝트 새로고침
      if (currentProject) {
        await fetchProject(currentProject.id);
      }
      
      toast.success('파일이 삭제되었습니다.');
    } catch (err) {
      const errorMessage = projectsApi.isApiError(err) ? err.message : '파일 삭제에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [currentProject, fetchProject]);

  // 전체 새로고침
  const refetch = useCallback(async () => {
    await fetchProjects();
    if (currentProject) {
      await fetchProject(currentProject.id);
    }
  }, [fetchProjects, fetchProject, currentProject]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    inviteMember,
    updateMemberRating,
    deleteFile,
    refetch,
    clearError,
  };
};

// ===== 프로젝트 폼 관리 훅 =====

/**
 * 프로젝트 폼 상태 및 검증 관리 훅
 */
export const useProjectForm = (
  initialProject?: Project | null
): UseProjectFormReturn => {
  // 초기값 설정
  const getInitialInputs = (): ProjectInputData => ({
    name: initialProject?.name || '',
    description: initialProject?.description || '',
    manager: initialProject?.manager || '',
    consumer: initialProject?.consumer || '',
  });

  const getInitialDateRanges = (): ProjectDateRange[] => [
    { startDate: null, endDate: null, phase_name: 'basic_plan' },
    { startDate: null, endDate: null, phase_name: 'story_board' },
    { startDate: null, endDate: null, phase_name: 'filming' },
    { startDate: null, endDate: null, phase_name: 'video_edit' },
    { startDate: null, endDate: null, phase_name: 'post_work' },
    { startDate: null, endDate: null, phase_name: 'video_preview' },
    { startDate: null, endDate: null, phase_name: 'confirmation' },
    { startDate: null, endDate: null, phase_name: 'video_delivery' },
  ];

  // 상태 관리
  const [inputs, setInputs] = useState<ProjectInputData>(getInitialInputs);
  const [process, setProcess] = useState<ProjectDateRange[]>(getInitialDateRanges);
  const [files, setFiles] = useState<File[]>([]);
  const [validation, setValidation] = useState<ProjectFormValidation>({
    isValid: false,
    errors: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createProject, updateProject } = useProjects();

  // 입력값 변경 핸들러
  const onChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 검증
    validateForm();
  }, []);

  // 파일 변경 핸들러
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  // 파일 삭제 핸들러
  const onFileDelete = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 폼 검증
  const validateForm = useCallback((): ProjectFormValidation => {
    const errors: Partial<Record<keyof ProjectInputData, string>> = {};
    
    if (!inputs.name.trim()) {
      errors.name = '프로젝트 이름을 입력해주세요.';
    } else if (inputs.name.length > 50) {
      errors.name = '프로젝트 이름은 50자 이내로 입력해주세요.';
    }
    
    if (!inputs.description.trim()) {
      errors.description = '프로젝트 설명을 입력해주세요.';
    } else if (inputs.description.length > 100) {
      errors.description = '프로젝트 설명은 100자 이내로 입력해주세요.';
    }
    
    if (!inputs.manager.trim()) {
      errors.manager = '담당자를 입력해주세요.';
    } else if (inputs.manager.length > 50) {
      errors.manager = '담당자는 50자 이내로 입력해주세요.';
    }
    
    if (!inputs.consumer.trim()) {
      errors.consumer = '고객사를 입력해주세요.';
    } else if (inputs.consumer.length > 50) {
      errors.consumer = '고객사는 50자 이내로 입력해주세요.';
    }
    
    const result = {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
    
    setValidation(result);
    return result;
  }, [inputs]);

  // 폼 초기화
  const resetForm = useCallback(() => {
    setInputs(getInitialInputs());
    setProcess(getInitialDateRanges());
    setFiles([]);
    setValidation({ isValid: false, errors: {} });
  }, []);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (
    action: 'create' | 'update',
    projectId?: string | number
  ) => {
    const formValidation = validateForm();
    if (!formValidation.isValid) {
      toast.error('입력란을 모두 채워주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = projectsApi.createProjectFormData(
        inputs,
        process,
        files,
        initialProject?.member_list
      );

      if (action === 'create') {
        await createProject(formData);
      } else if (action === 'update' && projectId) {
        await updateProject(projectId, formData);
      }

      resetForm();
    } catch (error) {
      // 에러 처리는 useProjects에서 담당
    } finally {
      setIsSubmitting(false);
    }
  }, [inputs, process, files, initialProject, validateForm, createProject, updateProject, resetForm]);

  // 초기 프로젝트 데이터가 변경될 때 폼 업데이트
  useEffect(() => {
    if (initialProject) {
      setInputs({
        name: initialProject.name,
        description: initialProject.description,
        manager: initialProject.manager,
        consumer: initialProject.consumer,
      });

      // 프로젝트 일정 데이터 변환
      const phases = [
        'basic_plan', 'story_board', 'filming', 'video_edit',
        'post_work', 'video_preview', 'confirmation', 'video_delivery'
      ];

      const dateRanges = phases.map(phase => {
        const phaseData = initialProject[phase as keyof typeof initialProject] as any;
        return {
          startDate: phaseData?.start_date ? new Date(phaseData.start_date) : null,
          endDate: phaseData?.end_date ? new Date(phaseData.end_date) : null,
          phase_name: phase,
        };
      });

      setProcess(dateRanges);
    }
  }, [initialProject]);

  return {
    inputs,
    process,
    files,
    validation,
    isSubmitting,
    onChange,
    setProcess,
    onFileChange,
    onFileDelete,
    validateForm,
    resetForm,
    handleSubmit,
  };
};

// ===== 파일 업로드 관리 훅 =====

/**
 * 파일 업로드 상태 관리 훅
 */
export const useFileUpload = (): UseFileUploadReturn => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);

  // 파일 선택 핸들러
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // 업로드 상태 초기화
    const newStates = selectedFiles.map(file => ({
      file,
      status: 'pending' as FileUploadStatus,
      progress: 0,
    }));
    
    setUploadStates(prev => [...prev, ...newStates]);
  }, []);

  // 파일 삭제 핸들러
  const onFileDelete = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStates(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 파일 업로드 실행
  const uploadFiles = useCallback(async (projectId: string | number) => {
    if (files.length === 0) return [];

    try {
      // 업로드 상태 업데이트
      setUploadStates(prev => prev.map(state => ({
        ...state,
        status: 'uploading' as FileUploadStatus,
      })));

      const uploadedFiles = await projectsApi.uploadProjectFiles(projectId, files);
      
      // 성공 상태 업데이트
      setUploadStates(prev => prev.map(state => ({
        ...state,
        status: 'completed' as FileUploadStatus,
        progress: 100,
      })));

      return uploadedFiles;
    } catch (error) {
      // 에러 상태 업데이트
      setUploadStates(prev => prev.map(state => ({
        ...state,
        status: 'error' as FileUploadStatus,
        error: '업로드에 실패했습니다.',
      })));
      
      throw error;
    }
  }, [files]);

  // 파일 목록 초기화
  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadStates([]);
  }, []);

  return {
    files,
    uploadStates,
    onFileChange,
    onFileDelete,
    uploadFiles,
    clearFiles,
  };
};

// ===== 권한 확인 훅 =====

/**
 * 프로젝트 권한 확인 훅
 */
export const useProjectPermissions = (project: Project | null) => {
  const { user } = useSelector((state: RootState) => state.ProjectStore);

  const isAdmin = useCallback(() => {
    if (!project || !user) return false;

    return (
      user === project.owner_email ||
      project.member_list.some(
        member => member.email === user && member.rating === 'manager'
      )
    );
  }, [project, user]);

  const canEdit = useCallback(() => isAdmin(), [isAdmin]);
  const canDelete = useCallback(() => isAdmin(), [isAdmin]);
  const canInvite = useCallback(() => isAdmin(), [isAdmin]);
  const canManageMembers = useCallback(() => isAdmin(), [isAdmin]);

  return {
    isAdmin: isAdmin(),
    canEdit: canEdit(),
    canDelete: canDelete(),
    canInvite: canInvite(),
    canManageMembers: canManageMembers(),
  };
};