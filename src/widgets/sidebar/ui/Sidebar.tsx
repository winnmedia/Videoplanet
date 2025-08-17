'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';
import { NavItem } from '../../../../components/molecules';
import Submenu from '../../../../components/organisms/Submenu/Submenu';
import { SidebarProps, SidebarState, Project } from '../../../../types/layout';
import { DEFAULT_NAVIGATION_ITEMS, ROUTES } from '../../../../types/layout';

const Sidebar: React.FC<SidebarProps> = ({
  tab,
  onMenu = false,
  projects = [],
  user,
  onNavigate,
  onLogout,
  onTabChange,
  collapsed = false,
  showProjects = true,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // 컴포넌트 상태
  const [state, setState] = useState<SidebarState>({
    isSubmenuOpen: false,
    activeTab: '',
    sortedProjects: [],
  });

  // 프로젝트 정렬 (이름순)
  const sortedProjects = useMemo(() => {
    if (!projects.length) return [];
    
    const sorted = [...projects].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    return sorted;
  }, [projects]);

  // 상태 업데이트
  useEffect(() => {
    setState(prev => ({
      ...prev,
      sortedProjects,
      isSubmenuOpen: onMenu,
      activeTab: tab || '',
    }));
  }, [sortedProjects, onMenu, tab]);

  // 활성 상태 확인
  const isActiveItem = (itemPath?: string, tabName?: string): boolean => {
    if (!itemPath && tabName) {
      // 서브메뉴가 있는 아이템의 경우
      if (tabName === 'project') {
        return pathname?.includes('/projects') || (state.isSubmenuOpen && state.activeTab === 'project');
      }
      if (tabName === 'feedback') {
        return pathname?.includes('/feedback') || (state.isSubmenuOpen && state.activeTab === 'feedback');
      }
    }
    
    if (itemPath) {
      return pathname === itemPath && !state.isSubmenuOpen;
    }
    
    return false;
  };

  // 네비게이션 핸들러
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  // 메뉴 아이템 클릭 핸들러
  const handleMenuClick = (id: string, tabName?: string) => {
    if (!tabName) return;

    // 탭 변경 알림
    if (onTabChange) {
      onTabChange(tabName as any);
    }

    // 서브메뉴가 있는 아이템 처리
    if (tabName === 'project' || tabName === 'feedback') {
      const newSubmenuState = !(state.isSubmenuOpen && state.activeTab === tabName);
      
      setState(prev => ({
        ...prev,
        isSubmenuOpen: newSubmenuState,
        activeTab: newSubmenuState ? tabName : '',
      }));
      
      return;
    }

    // 일반 네비게이션
    const item = DEFAULT_NAVIGATION_ITEMS.find(item => item.id === id);
    if (item?.path) {
      setState(prev => ({ ...prev, isSubmenuOpen: false, activeTab: '' }));
      handleNavigation(item.path);
    }
  };

  // 서브메뉴 닫기
  const handleSubmenuClose = () => {
    setState(prev => ({
      ...prev,
      isSubmenuOpen: false,
      activeTab: '',
    }));
  };

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (projectId: string, tabName: string) => {
    const targetPath = tabName === 'project' 
      ? ROUTES.PROJECT_VIEW(projectId)
      : ROUTES.FEEDBACK(projectId);
    
    setState(prev => ({ ...prev, isSubmenuOpen: false, activeTab: '' }));
    handleNavigation(targetPath);
  };

  // 프로젝트 생성 핸들러
  const handleCreateProject = () => {
    setState(prev => ({ ...prev, isSubmenuOpen: false, activeTab: '' }));
    handleNavigation(ROUTES.PROJECT_CREATE);
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
      router.push(ROUTES.LOGIN);
    }
  };

  // 키보드 네비게이션
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles['sidebar--collapsed'] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <aside
        className={sidebarClasses}
        role="navigation"
        aria-label="주 네비게이션"
        data-testid={testId}
        {...props}
      >
        <nav className={styles.sidebar__nav}>
          <ul className={styles.sidebar__list} role="menubar">
            {DEFAULT_NAVIGATION_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                isActive={isActiveItem(item.path, item.tabName)}
                {...(item.id === 'projects' && projects.length > 0 && { badge: projects.length })}
                {...(item.hasSubmenu && { hasSubmenu: item.hasSubmenu })}
                {...(item.tabName && { tabName: item.tabName })}
                onClick={handleMenuClick}
              />
            ))}
          </ul>
        </nav>

        {/* 로그아웃 버튼 */}
        <button
          type="button"
          className={styles.sidebar__logout}
          onClick={handleLogout}
          onKeyDown={(e) => handleKeyDown(e, handleLogout)}
          aria-label="로그아웃"
        >
          로그아웃
        </button>
      </aside>

      {/* 서브메뉴 */}
      {showProjects && (
        <Submenu
          isOpen={state.isSubmenuOpen}
          tabName={state.activeTab as any}
          projects={state.sortedProjects}
          onClose={handleSubmenuClose}
          onCreateProject={handleCreateProject}
          onProjectClick={handleProjectClick}
        />
      )}
    </>
  );
};

// 디스플레이 네임 설정
Sidebar.displayName = 'Sidebar';

export default Sidebar;