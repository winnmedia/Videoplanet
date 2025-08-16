'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './Submenu.module.scss';
import { SubmenuProps } from '../../../types/layout';
import { ROUTES } from '../../../types/layout';

const Submenu: React.FC<SubmenuProps> = ({
  isOpen,
  tabName,
  projects,
  onClose,
  onCreateProject,
  onProjectClick,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const router = useRouter();

  // 제목 텍스트 생성
  const getSubmenuTitle = (tabName: string): string => {
    switch (tabName) {
      case 'feedback':
        return '영상 피드백';
      case 'project':
        return '프로젝트 관리';
      default:
        return '';
    }
  };

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (projectId: string) => {
    onProjectClick(projectId, tabName);
  };

  // 프로젝트 생성 핸들러
  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      router.push(ROUTES.PROJECT_CREATE);
    }
  };

  // 키보드 네비게이션 핸들러
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const submenuClasses = [
    styles.submenu,
    isOpen ? styles['submenu--active'] : '',
    className,
  ].filter(Boolean).join(' ');

  const title = getSubmenuTitle(tabName);

  return (
    <div
      className={submenuClasses}
      role="dialog"
      aria-label={`${title} 서브메뉴`}
      aria-hidden={!isOpen}
      data-testid={testId}
      {...props}
    >
      {/* 헤더 영역 */}
      <div className={styles.submenu__header}>
        <h2 className={styles.submenu__title}>{title}</h2>
        
        <div className={styles.submenu__actions}>
          {/* 프로젝트 추가 버튼 (프로젝트 관리 탭에서만) */}
          {tabName === 'project' && projects.length > 0 && (
            <button
              type="button"
              className={styles.submenu__actionButton}
              onClick={handleCreateProject}
              onKeyDown={(e) => handleKeyDown(e, handleCreateProject)}
              aria-label="새 프로젝트 생성"
              data-testid="submenu-create-project"
            >
              <span className={styles.submenu__actionIcon} aria-hidden="true">
                +
              </span>
            </button>
          )}

          {/* 닫기 버튼 */}
          <button
            type="button"
            className={styles.submenu__actionButton}
            onClick={onClose}
            onKeyDown={(e) => handleKeyDown(e, onClose)}
            aria-label="서브메뉴 닫기"
            data-testid="submenu-close"
          >
            <span className={styles.submenu__actionIcon} aria-hidden="true">
              ×
            </span>
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className={styles.submenu__content}>
        {projects.length > 0 ? (
          <nav className={styles.submenu__nav} role="navigation" aria-label="프로젝트 목록">
            <ul className={styles.submenu__list}>
              {projects.map((project) => (
                <li
                  key={project.id}
                  className={styles.submenu__item}
                  onClick={() => handleProjectClick(project.id)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleProjectClick(project.id))}
                  role="menuitem"
                  tabIndex={0}
                  aria-label={`${project.name} ${tabName === 'project' ? '프로젝트 보기' : '피드백 보기'}`}
                >
                  <span className={styles.submenu__itemText} title={project.name}>
                    {project.name}
                  </span>
                  {project.status && (
                    <span 
                      className={`${styles.submenu__itemStatus} ${styles[`submenu__itemStatus--${project.status}`]}`}
                      aria-label={`상태: ${project.status}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className={styles.submenu__empty}>
            <div className={styles.submenu__emptyContent}>
              <p className={styles.submenu__emptyText}>
                등록된 <br />
                프로젝트가 없습니다
              </p>
              
              {tabName === 'project' && (
                <button
                  type="button"
                  className={styles.submenu__emptyButton}
                  onClick={handleCreateProject}
                  onKeyDown={(e) => handleKeyDown(e, handleCreateProject)}
                  aria-label="첫 번째 프로젝트 생성"
                >
                  프로젝트 등록
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Submenu;