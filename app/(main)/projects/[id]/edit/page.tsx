/**
 * 프로젝트 편집 페이지
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 * 경로: /projects/[id]/edit
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import { 
  ProjectInput, 
  ProcessDate, 
  EmailInvitation 
} from '@/features/projects/components';
import { 
  useProjects, 
  useProjectForm, 
  useFileUpload,
  useProjectPermissions
} from '@/features/projects/hooks/useProjects';
import { projectsApi } from '@/features/projects/api/projectsApi';
import type { 
  MemberRating,
  ProjectMember 
} from '@/features/projects/types';

// Redux 타입 (임시)
interface RootState {
  ProjectStore: {
    sample_files: Array<{
      id: number;
      file_name: string;
      files: string;
    }>;
  };
}

/**
 * 프로젝트 편집 페이지 컴포넌트
 */
export default function ProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const { sample_files } = useSelector((state: RootState) => state.ProjectStore);
  const { 
    currentProject, 
    loading, 
    fetchProject, 
    deleteProject,
    updateMemberRating,
    deleteFile 
  } = useProjects();

  // 권한 확인
  const permissions = useProjectPermissions(currentProject);

  // 폼 관리 훅
  const {
    inputs,
    process,
    validation,
    isSubmitting,
    onChange,
    setProcess,
    handleSubmit,
  } = useProjectForm(currentProject);

  // 파일 업로드 훅
  const {
    files,
    onFileChange,
    onFileDelete,
  } = useFileUpload();

  // 권한 확인 및 리다이렉트
  useEffect(() => {
    if (currentProject && !permissions.canEdit) {
      toast.error('프로젝트 편집 권한이 없습니다.');
      router.push(`/projects/${projectId}/view`);
    }
  }, [currentProject, permissions.canEdit, projectId, router]);

  // 프로젝트 로드
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId).catch(() => {
        router.push('/Calendar');
      });
    }
  }, [projectId]);

  // 멤버 권한 변경 핸들러
  const handleMemberRatingChange = async (
    e: React.ChangeEvent<HTMLSelectElement>, 
    memberId: number
  ) => {
    const newRating = e.target.value as MemberRating;
    
    try {
      await updateMemberRating(projectId, memberId, newRating);
    } catch (error) {
      // 에러는 useProjects에서 처리
    }
  };

  // 프로젝트 파일 삭제 핸들러
  const handleProjectFileDelete = async (fileId: number, fileName: string) => {
    const confirmed = window.confirm(`'${fileName}' 파일을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteFile(fileId);
    } catch (error) {
      // 에러는 useProjects에서 처리
    }
  };

  // 폼 제출 핸들러
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      await handleSubmit('update', projectId);
    } catch (error) {
      // 에러는 useProjectForm에서 처리
    }
  };

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      // 에러는 useProjects에서 처리
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    router.push(`/projects/${projectId}/view`);
  };

  // 샘플 파일 다운로드 핸들러
  const handleSampleDownload = (fileUrl: string, fileName: string) => {
    projectsApi.downloadFile(fileUrl, fileName);
  };

  // 로딩 상태
  if (loading || !currentProject) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="projects" on_menu={false} />
          <main className="project edit">
            <div className="loading-spinner">
              <div className="spinner" />
              <p>프로젝트를 불러오는 중...</p>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  // 권한 없음
  if (!permissions.canEdit) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="projects" on_menu={false} />
          <main className="project edit">
            <div className="error-message">
              <h2>접근 권한이 없습니다</h2>
              <p>이 프로젝트를 편집할 권한이 없습니다.</p>
              <button onClick={() => router.push('/Calendar')} className="submit">
                프로젝트 목록으로 돌아가기
              </button>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
      <div className="cms_wrap">
        <SideBar tab="projects" on_menu={false} />
        <main className="project edit">
          <div className="title">프로젝트 편집</div>
          
          <form onSubmit={handleFormSubmit} className="content">
            {/* 기본 정보 편집 */}
            <div className="group grid">
              <ProjectInput 
                inputs={inputs}
                onChange={onChange}
                errors={validation.errors}
                disabled={isSubmitting}
              />
            </div>

            {/* 멤버 관리 */}
            <div className="group grid mt50">
              {/* 멤버 초대 */}
              <div className="part">
                <div className="s_title">멤버 초대</div>
                <EmailInvitation
                  project_id={projectId}
                  set_current_project={(project) => {
                    // currentProject 업데이트는 fetchProject를 통해 수행
                    if (project) fetchProject(projectId);
                  }}
                  pending_list={currentProject.pending_list}
                  disabled={isSubmitting}
                />
              </div>

              {/* 멤버 권한 관리 */}
              <div className="part authority">
                <div className="s_title">멤버 관리</div>
                <ul>
                  {currentProject.member_list.map((member: ProjectMember) => (
                    <li
                      key={member.id}
                      className="flex align_center space_between"
                    >
                      <span className="member-info">
                        <strong>{member.nickname}</strong>
                        <span className="email">({member.email})</span>
                      </span>
                      
                      <select
                        onChange={(e) => handleMemberRatingChange(e, member.id)}
                        name="rating"
                        value={member.rating}
                        disabled={isSubmitting}
                        aria-label={`${member.nickname} 권한 변경`}
                      >
                        <option value="manager">관리자</option>
                        <option value="normal">일반</option>
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 프로젝트 일정 */}
            <div className="group mt50">
              <div className="part day">
                <div className="s_title">프로젝트 일정</div>
                <ProcessDate 
                  process={process}
                  set_process={setProcess}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 파일 관리 */}
            <div className="group grid mt50">
              {/* 문서 양식 (샘플 파일) */}
              <div className="part file">
                <div className="s_title">문서 양식</div>
                <ul className="sample">
                  {sample_files.length === 0 ? (
                    <li className="no-files">등록된 샘플 파일이 없습니다.</li>
                  ) : (
                    <li>
                      {sample_files.map((file) => {
                        const fileName = projectsApi.extractFileName(file.file_name);
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => handleSampleDownload(file.files, fileName)}
                            className="sample-file"
                            aria-label={`${fileName} 샘플 파일 다운로드`}
                          >
                            {fileName}
                          </button>
                        );
                      })}
                    </li>
                  )}
                </ul>
              </div>

              {/* 파일 관리 */}
              <div className="part file">
                <div className="s_title">파일 등록</div>
                
                {/* 기존 프로젝트 파일 목록 */}
                <ul className="sample">
                  {currentProject.files.map((file) => {
                    const fileName = projectsApi.extractFileName(file.file_name);
                    return (
                      <li 
                        key={file.id} 
                        className="existing-file"
                      >
                        <button
                          type="button"
                          onClick={() => projectsApi.downloadFile(file.files, fileName)}
                          className="file-download"
                        >
                          {fileName}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleProjectFileDelete(file.id, fileName)}
                          disabled={isSubmitting}
                          className="delete-btn"
                          aria-label={`${fileName} 파일 삭제`}
                        >
                          삭제
                        </button>
                      </li>
                    );
                  })}

                  {/* 새로 추가된 파일 목록 */}
                  {files.map((file, index) => (
                    <li key={`new-${index}`} className="new-file">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => onFileDelete(index)}
                        disabled={isSubmitting}
                        className="delete-btn"
                        aria-label={`${file.name} 파일 삭제`}
                      >
                        삭제
                      </button>
                    </li>
                  ))}

                  {/* 파일 업로드 버튼 */}
                  <li className="upload_button">
                    <label htmlFor="file" className="file-upload-label">
                      <div className="btn-upload">파일 업로드</div>
                    </label>
                    <input
                      type="file"
                      name="file"
                      id="file"
                      onChange={onFileChange}
                      disabled={isSubmitting}
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      aria-label="파일 선택"
                    />
                  </li>
                </ul>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="btn_wrap">
              <button 
                type="submit"
                className="submit"
                disabled={isSubmitting || !validation.isValid}
              >
                {isSubmitting ? '수정 중...' : '수정'}
              </button>
              
              <button 
                type="button"
                onClick={handleDeleteProject}
                className="submit del"
                disabled={isSubmitting}
              >
                삭제
              </button>
              
              <button 
                type="button"
                onClick={handleCancel}
                className="submit cancel"
                disabled={isSubmitting}
              >
                취소
              </button>
            </div>
          </form>
        </main>
      </div>
    </PageTemplate>
  );
}