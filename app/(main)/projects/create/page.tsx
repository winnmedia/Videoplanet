/**
 * 프로젝트 생성 페이지
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 * 경로: /projects/create
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import { 
  ProjectInput, 
  ProcessDate 
} from '@/features/projects/components';
import { 
  useProjectForm, 
  useFileUpload 
} from '@/features/projects/hooks/useProjects';
import { projectsApi } from '@/features/projects/api/projectsApi';

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
 * 프로젝트 생성 페이지 컴포넌트
 */
export default function ProjectCreatePage() {
  const router = useRouter();
  const { sample_files } = useSelector((state: RootState) => state.ProjectStore);
  
  // 폼 관리 훅
  const {
    inputs,
    process,
    validation,
    isSubmitting,
    onChange,
    setProcess,
    handleSubmit,
  } = useProjectForm();

  // 파일 업로드 훅
  const {
    files,
    onFileChange,
    onFileDelete,
  } = useFileUpload();

  // 폼 제출 핸들러
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      await handleSubmit('create');
    } catch (error) {
      // 에러는 useProjectForm에서 처리
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    const hasChanges = inputs.name || inputs.description || inputs.manager || inputs.consumer || files.length > 0;
    
    if (hasChanges) {
      const confirmCancel = window.confirm('작성중인 내용이 있습니다. 정말 취소하시겠습니까?');
      if (!confirmCancel) return;
    }
    
    router.push('/Calendar');
  };

  // 샘플 파일 다운로드 핸들러
  const handleSampleDownload = (fileUrl: string, fileName: string) => {
    projectsApi.downloadFile(fileUrl, fileName);
  };

  return (
    <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
      <div className="cms_wrap">
        <SideBar tab="projects" on_menu={false} />
        <main className="project edit">
          <div className="title">프로젝트 등록</div>
          
          <form onSubmit={handleFormSubmit} className="content">
            {/* 기본 정보 입력 */}
            <div className="group grid">
              <ProjectInput 
                inputs={inputs}
                onChange={onChange}
                errors={validation.errors}
                disabled={isSubmitting}
              />
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

            {/* 파일 관련 */}
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

              {/* 파일 등록 */}
              <div className="part file">
                <div className="s_title">파일 등록</div>
                
                {/* 파일 업로드 버튼 */}
                <ul className="upload">
                  <li>
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

                {/* 선택된 파일 목록 */}
                {files.length > 0 && (
                  <ul className="sample">
                    {files.map((file, index) => (
                      <li key={index} className="uploaded-file">
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
                  </ul>
                )}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="btn_wrap">
              <button 
                type="submit"
                className="submit"
                disabled={isSubmitting || !validation.isValid}
              >
                {isSubmitting ? '등록 중...' : '등록'}
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