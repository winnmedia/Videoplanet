/**
 * useProjects 훅 단위 테스트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useProjects, useProjectForm } from '@/features/projects/hooks/useProjects';
import * as projectsApi from '@/features/projects/api/projectsApi';
import type { Project, ProjectInputData, ProjectDateRange } from '@/features/projects/types';

// ===== 모킹 =====
jest.mock('next/navigation');
jest.mock('react-redux');
jest.mock('react-toastify');
jest.mock('@/features/projects/api/projectsApi');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockDispatch = jest.fn();
const mockSelector = jest.fn();

// ===== 모의 데이터 =====
const mockProject: Project = {
  id: 1,
  name: '테스트 프로젝트',
  description: '테스트 설명',
  manager: '김담당',
  consumer: '테스트 회사',
  owner_email: 'owner@test.com',
  owner_nickname: '프로젝트 소유자',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  files: [],
  member_list: [],
  pending_list: [],
  basic_plan: { id: 1, start_date: null, end_date: null },
  story_board: { id: 2, start_date: null, end_date: null },
  filming: { id: 3, start_date: null, end_date: null },
  video_edit: { id: 4, start_date: null, end_date: null },
  post_work: { id: 5, start_date: null, end_date: null },
  video_preview: { id: 6, start_date: null, end_date: null },
  confirmation: { id: 7, start_date: null, end_date: null },
  video_delivery: { id: 8, start_date: null, end_date: null },
};

const mockProjects: Project[] = [mockProject];

// ===== 테스트 설정 =====
beforeEach(() => {
  jest.clearAllMocks();
  
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useSelector as jest.Mock).mockReturnValue({
    project_list: mockProjects,
    sample_files: [],
    user: 'test@test.com',
  });

  (toast.success as jest.Mock).mockImplementation(() => {});
  (toast.error as jest.Mock).mockImplementation(() => {});
});

// ===== useProjects 훅 테스트 =====
describe('useProjects', () => {
  describe('프로젝트 목록 조회', () => {
    test('fetchProjects가 성공적으로 프로젝트 목록을 가져온다', async () => {
      (projectsApi.fetchProjectList as jest.Mock).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_PROJECT_LIST',
        payload: mockProjects,
      });
    });

    test('fetchProjects 실패 시 에러가 처리된다', async () => {
      const errorMessage = '프로젝트 목록을 불러오는데 실패했습니다.';
      (projectsApi.fetchProjectList as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('프로젝트 상세 조회', () => {
    test('fetchProject가 성공적으로 프로젝트를 가져온다', async () => {
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.fetchProject(1);
      });

      expect(result.current.currentProject).toEqual(mockProject);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('fetchProject 실패 시 에러가 처리된다', async () => {
      const errorMessage = '프로젝트를 불러오는데 실패했습니다.';
      (projectsApi.fetchProject as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        try {
          await result.current.fetchProject(1);
        } catch (error) {
          // 에러가 던져지는 것이 예상됨
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('프로젝트 생성', () => {
    test('createProject가 성공적으로 프로젝트를 생성한다', async () => {
      const formData = new FormData();
      const createResponse = { id: 2 };
      
      (projectsApi.createProject as jest.Mock).mockResolvedValue(createResponse);
      (projectsApi.fetchProjectList as jest.Mock).mockResolvedValue([...mockProjects, { ...mockProject, id: 2 }]);
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue({ ...mockProject, id: 2 });

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.createProject(formData);
      });

      expect(projectsApi.createProject).toHaveBeenCalledWith(formData);
      expect(toast.success).toHaveBeenCalledWith('프로젝트가 성공적으로 생성되었습니다.');
      expect(mockRouter.push).toHaveBeenCalledWith('/Calendar');
    });

    test('createProject 실패 시 에러가 처리된다', async () => {
      const formData = new FormData();
      const errorMessage = '프로젝트 생성에 실패했습니다.';
      
      (projectsApi.createProject as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        try {
          await result.current.createProject(formData);
        } catch (error) {
          // 에러가 던져지는 것이 예상됨
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('프로젝트 업데이트', () => {
    test('updateProject가 성공적으로 프로젝트를 업데이트한다', async () => {
      const formData = new FormData();
      const updatedProject = { ...mockProject, name: '업데이트된 프로젝트' };
      
      (projectsApi.updateProject as jest.Mock).mockResolvedValue(updatedProject);
      (projectsApi.fetchProjectList as jest.Mock).mockResolvedValue([updatedProject]);

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.updateProject(1, formData);
      });

      expect(result.current.currentProject).toEqual(updatedProject);
      expect(toast.success).toHaveBeenCalledWith('프로젝트가 성공적으로 업데이트되었습니다.');
      expect(mockRouter.push).toHaveBeenCalledWith('/Calendar');
    });
  });

  describe('프로젝트 삭제', () => {
    test('deleteProject가 성공적으로 프로젝트를 삭제한다', async () => {
      // confirm 모킹
      window.confirm = jest.fn(() => true);
      
      (projectsApi.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectsApi.fetchProjectList as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useProjects());
      
      // 현재 프로젝트 설정
      await act(async () => {
        (result.current as any).currentProject = mockProject;
      });

      await act(async () => {
        await result.current.deleteProject(1);
      });

      expect(projectsApi.deleteProject).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('프로젝트가 성공적으로 삭제되었습니다.');
      expect(mockRouter.push).toHaveBeenCalledWith('/Calendar');
    });

    test('deleteProject에서 confirm을 취소하면 삭제되지 않는다', async () => {
      window.confirm = jest.fn(() => false);

      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.deleteProject(1);
      });

      expect(projectsApi.deleteProject).not.toHaveBeenCalled();
    });
  });

  describe('멤버 관리', () => {
    test('inviteMember가 성공적으로 멤버를 초대한다', async () => {
      (projectsApi.inviteProjectMember as jest.Mock).mockResolvedValue(undefined);
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjects());
      
      // 현재 프로젝트 설정
      await act(async () => {
        (result.current as any).currentProject = mockProject;
      });

      await act(async () => {
        await result.current.inviteMember(1, 'test@example.com');
      });

      expect(projectsApi.inviteProjectMember).toHaveBeenCalledWith(1, 'test@example.com');
      expect(toast.success).toHaveBeenCalledWith('멤버 초대가 완료되었습니다.');
    });

    test('updateMemberRating이 성공적으로 멤버 권한을 변경한다', async () => {
      (projectsApi.updateMemberRating as jest.Mock).mockResolvedValue(undefined);
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjects());
      
      // 현재 프로젝트 설정
      await act(async () => {
        (result.current as any).currentProject = mockProject;
      });

      await act(async () => {
        await result.current.updateMemberRating(1, 123, 'manager');
      });

      expect(projectsApi.updateMemberRating).toHaveBeenCalledWith(1, 123, 'manager');
      expect(toast.success).toHaveBeenCalledWith('멤버 권한이 변경되었습니다.');
    });
  });

  describe('파일 관리', () => {
    test('deleteFile이 성공적으로 파일을 삭제한다', async () => {
      window.confirm = jest.fn(() => true);
      
      (projectsApi.deleteProjectFile as jest.Mock).mockResolvedValue(undefined);
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjects());
      
      // 현재 프로젝트 설정
      await act(async () => {
        (result.current as any).currentProject = mockProject;
      });

      await act(async () => {
        await result.current.deleteFile(1);
      });

      expect(projectsApi.deleteProjectFile).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('파일이 삭제되었습니다.');
    });
  });

  describe('유틸리티 함수', () => {
    test('clearError가 에러를 초기화한다', () => {
      const { result } = renderHook(() => useProjects());

      act(() => {
        (result.current as any).error = '테스트 에러';
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    test('refetch가 프로젝트 목록과 현재 프로젝트를 새로고침한다', async () => {
      (projectsApi.fetchProjectList as jest.Mock).mockResolvedValue(mockProjects);
      (projectsApi.fetchProject as jest.Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjects());
      
      // 현재 프로젝트 설정
      await act(async () => {
        (result.current as any).currentProject = mockProject;
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(projectsApi.fetchProjectList).toHaveBeenCalled();
      expect(projectsApi.fetchProject).toHaveBeenCalledWith(mockProject.id);
    });
  });
});

// ===== useProjectForm 훅 테스트 =====
describe('useProjectForm', () => {
  describe('폼 초기화', () => {
    test('빈 폼으로 초기화된다', () => {
      const { result } = renderHook(() => useProjectForm());

      expect(result.current.inputs).toEqual({
        name: '',
        description: '',
        manager: '',
        consumer: '',
      });
      expect(result.current.process).toHaveLength(8);
      expect(result.current.files).toEqual([]);
      expect(result.current.validation.isValid).toBe(false);
    });

    test('초기 프로젝트 데이터로 폼이 초기화된다', () => {
      const { result } = renderHook(() => useProjectForm(mockProject));

      expect(result.current.inputs.name).toBe('테스트 프로젝트');
      expect(result.current.inputs.description).toBe('테스트 설명');
      expect(result.current.inputs.manager).toBe('김담당');
      expect(result.current.inputs.consumer).toBe('테스트 회사');
    });
  });

  describe('입력 처리', () => {
    test('onChange가 올바르게 입력을 처리한다', () => {
      const { result } = renderHook(() => useProjectForm());

      act(() => {
        result.current.onChange({
          target: { name: 'name', value: '새 프로젝트' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.inputs.name).toBe('새 프로젝트');
    });

    test('파일 추가가 올바르게 동작한다', () => {
      const { result } = renderHook(() => useProjectForm());

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.onFileChange(mockEvent);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0]).toBe(mockFile);
    });

    test('파일 삭제가 올바르게 동작한다', () => {
      const { result } = renderHook(() => useProjectForm());

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      act(() => {
        (result.current as any).files = [mockFile];
        result.current.onFileDelete(0);
      });

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('폼 검증', () => {
    test('빈 폼은 유효하지 않다', () => {
      const { result } = renderHook(() => useProjectForm());

      act(() => {
        const validation = result.current.validateForm();
        expect(validation.isValid).toBe(false);
        expect(validation.errors.name).toBeTruthy();
        expect(validation.errors.description).toBeTruthy();
        expect(validation.errors.manager).toBeTruthy();
        expect(validation.errors.consumer).toBeTruthy();
      });
    });

    test('모든 필드가 채워진 폼은 유효하다', () => {
      const { result } = renderHook(() => useProjectForm());

      act(() => {
        (result.current as any).inputs = {
          name: '테스트 프로젝트',
          description: '테스트 설명',
          manager: '김담당',
          consumer: '테스트 회사',
        };
        
        const validation = result.current.validateForm();
        expect(validation.isValid).toBe(true);
        expect(Object.keys(validation.errors)).toHaveLength(0);
      });
    });

    test('최대 길이 초과 시 에러가 발생한다', () => {
      const { result } = renderHook(() => useProjectForm());

      act(() => {
        (result.current as any).inputs = {
          name: 'a'.repeat(51), // 50자 초과
          description: 'a'.repeat(101), // 100자 초과
          manager: 'a'.repeat(51), // 50자 초과
          consumer: 'a'.repeat(51), // 50자 초과
        };
        
        const validation = result.current.validateForm();
        expect(validation.isValid).toBe(false);
        expect(validation.errors.name).toContain('50자 이내');
        expect(validation.errors.description).toContain('100자 이내');
        expect(validation.errors.manager).toContain('50자 이내');
        expect(validation.errors.consumer).toContain('50자 이내');
      });
    });
  });

  describe('폼 리셋', () => {
    test('resetForm이 폼을 초기 상태로 리셋한다', () => {
      const { result } = renderHook(() => useProjectForm());

      act(() => {
        // 폼에 데이터 입력
        (result.current as any).inputs = {
          name: '테스트',
          description: '설명',
          manager: '담당자',
          consumer: '고객사',
        };
        (result.current as any).files = [new File(['test'], 'test.txt')];

        // 리셋
        result.current.resetForm();
      });

      expect(result.current.inputs).toEqual({
        name: '',
        description: '',
        manager: '',
        consumer: '',
      });
      expect(result.current.files).toEqual([]);
      expect(result.current.validation.isValid).toBe(false);
    });
  });
});