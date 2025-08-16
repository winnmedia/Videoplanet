'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import styles from './PageLayout.module.scss';
import Header, { createUserProfileItems, createLogoItem } from '../../organisms/Header/Header';
import Sidebar from '../../organisms/Sidebar/Sidebar';
import { PageLayoutProps, User, Project } from '../../../types/layout';
import { checkSession } from '../../../lib/utils/auth';

const PageLayout: React.FC<PageLayoutProps> = ({
  header = true,
  footer = false,
  sidebar = true,
  navigation = true,
  auth = false,
  noLogin = false,
  leftItems,
  rightItems,
  user,
  projects = [],
  currentPath,
  onNavigate,
  onLogout,
  title,
  description,
  showBreadcrumb = false,
  breadcrumbItems = [],
  actions,
  loading = false,
  error = null,
  className = '',
  'data-testid': testId,
  children,
  ...props
}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Redux state (기존 코드 호환성)
  const reduxState = useSelector((s: any) => s.ProjectStore || {});
  const { 
    nickname, 
    user: reduxUser, 
    project_list = [] 
  } = reduxState;

  // 로컬 상태
  const [sidebarState, setSidebarState] = useState({
    activeTab: '',
    isSubmenuOpen: false,
  });

  // 실제 사용할 데이터 결정 (props 우선, 없으면 Redux)
  const finalUser: User | null = user || (nickname && reduxUser ? {
    id: reduxUser.id || '',
    email: reduxUser.email || reduxUser,
    nickname: nickname,
    name: reduxUser.name,
  } : null);

  const finalProjects: Project[] = projects.length > 0 ? projects : project_list.map((p: any) => ({
    id: p.id,
    name: p.name,
    created: p.created,
    status: p.status || 'active',
  }));

  const finalPath = currentPath || pathname;

  // 인증 체크
  useEffect(() => {
    if (!noLogin && !auth) {
      const session = checkSession();
      if (!session) {
        router.replace('/login');
      }
    }
  }, [noLogin, auth, router]);

  // 브라우저 뷰포트 높이 설정 (모바일 대응)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  // 현재 경로 분석하여 사이드바 상태 결정
  useEffect(() => {
    if (finalPath?.includes('/projects')) {
      setSidebarState(prev => ({ ...prev, activeTab: 'project' }));
    } else if (finalPath?.includes('/feedback')) {
      setSidebarState(prev => ({ ...prev, activeTab: 'feedback' }));
    } else {
      setSidebarState(prev => ({ ...prev, activeTab: '', isSubmenuOpen: false }));
    }
  }, [finalPath]);

  // 헤더 아이템 생성
  const createHeaderItems = () => {
    const defaultRightItems = finalUser ? createUserProfileItems(finalUser) : [];
    
    return {
      left: leftItems || [createLogoItem()],
      right: rightItems || defaultRightItems,
    };
  };

  // 네비게이션 핸들러
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // 기본 로그아웃 로직
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('VGID');
      }
      router.push('/login');
    }
  };

  // 사이드바 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setSidebarState(prev => ({
      ...prev,
      activeTab: tab,
      isSubmenuOpen: true,
    }));
  };

  // 레이아웃 클래스 생성
  const layoutClasses = [
    styles.pageLayout,
    auth ? styles['pageLayout--auth'] : '',
    !sidebar ? styles['pageLayout--noSidebar'] : '',
    !header ? styles['pageLayout--noHeader'] : '',
    loading ? styles['pageLayout--loading'] : '',
    className,
  ].filter(Boolean).join(' ');

  const headerItems = createHeaderItems();

  // Auth 레이아웃 (로그인/회원가입 페이지)
  if (auth) {
    return (
      <div className={`${layoutClasses} ${styles['pageLayout--auth']}`} data-testid={testId}>
        {/* Auth 레이아웃은 별도 컴포넌트로 처리할 수도 있음 */}
        <div className={styles.pageLayout__authContent}>
          {children}
        </div>
      </div>
    );
  }

  // 메인 레이아웃
  return (
    <div className={layoutClasses} data-testid={testId} {...props}>
      {/* 헤더 */}
      {header && (
        <Header
          leftItems={headerItems.left}
          rightItems={headerItems.right}
          className={styles.pageLayout__header || ''}
        />
      )}

      <div className={styles.pageLayout__body}>
        {/* 사이드바 */}
        {sidebar && navigation && finalUser && (
          <Sidebar
            tab={sidebarState.activeTab as any}
            onMenu={sidebarState.isSubmenuOpen}
            projects={finalProjects}
            user={finalUser}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            onTabChange={handleTabChange}
            className={styles.pageLayout__sidebar || ''}
          />
        )}

        {/* 메인 콘텐츠 */}
        <main className={styles.pageLayout__main}>
          {/* 페이지 헤더 */}
          {(title || description || showBreadcrumb || actions) && (
            <div className={styles.pageLayout__pageHeader}>
              {/* 브레드크럼 */}
              {showBreadcrumb && breadcrumbItems.length > 0 && (
                <nav className={styles.pageLayout__breadcrumb} aria-label="페이지 경로">
                  <ol className={styles.pageLayout__breadcrumbList}>
                    {breadcrumbItems.map((item, index) => (
                      <li 
                        key={index}
                        className={`${styles.pageLayout__breadcrumbItem} ${
                          item.isActive ? styles['pageLayout__breadcrumbItem--active'] : ''
                        }`}
                      >
                        {item.path ? (
                          <button
                            onClick={() => handleNavigation(item.path!)}
                            className={styles.pageLayout__breadcrumbLink}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* 제목과 설명 */}
              {(title || description) && (
                <div className={styles.pageLayout__titleSection}>
                  {title && <h1 className={styles.pageLayout__title}>{title}</h1>}
                  {description && <p className={styles.pageLayout__description}>{description}</p>}
                </div>
              )}

              {/* 액션 버튼 */}
              {actions && (
                <div className={styles.pageLayout__actions}>
                  {actions}
                </div>
              )}
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className={styles.pageLayout__error} role="alert">
              <p>{typeof error === 'string' ? error : '오류가 발생했습니다.'}</p>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading ? (
            <div className={styles.pageLayout__loading} aria-label="로딩 중">
              <div className={styles.pageLayout__spinner} />
              <p>로딩 중...</p>
            </div>
          ) : (
            /* 실제 콘텐츠 */
            <div className={styles.pageLayout__content}>
              {children}
            </div>
          )}
        </main>
      </div>

      {/* 푸터 (필요시) */}
      {footer && (
        <footer className={styles.pageLayout__footer}>
          {/* 푸터 콘텐츠 */}
        </footer>
      )}
    </div>
  );
};

PageLayout.displayName = 'PageLayout';

export default PageLayout;