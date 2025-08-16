'use client';

import './SideBar.scss';
import cx from 'classnames';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from '../../utils/navigation-adapter';
import { useSelector } from 'react-redux';
import { checkSession } from 'src/utils/util';

// TypeScript 타입 정의
interface Project {
  id: string | number;
  name: string;
  created?: string;
}

interface User {
  id?: string | number;
  name?: string;
  email?: string;
}

interface ProjectStoreState {
  project_list: Project[];
  user?: User;
}

interface RootState {
  ProjectStore: ProjectStoreState;
}

interface SideBarProps {
  tab?: string;
  on_menu?: boolean;
}

type TabName = 'project' | 'feedback' | '';

export default function SideBar({ tab, on_menu }: SideBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname || '';
  const { project_list, user } = useSelector((s: RootState) => s.ProjectStore);
  const [SubMenu, SetSubMenu] = useState<boolean>(false);
  const [tab_name, set_tab_name] = useState<TabName>('');
  const [SortProject, SetSortProject] = useState<Project[]>([]);

  useEffect(() => {
    if (project_list) {
      const projects = [...project_list];
      projects.sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });
      // projects.sort((a, b) => {
      //   return new Date(b.created) - new Date(a.created)
      // })
      SetSortProject(projects);
    }
  }, [project_list]);

  useEffect(() => {
    if (on_menu === true) {
      SetSubMenu(true);
    } else {
      SetSubMenu(false);
    }
    set_tab_name(tab as TabName || '');
  }, [on_menu, tab]);

  const handleLogout = () => {
    if (checkSession()) {
      window.localStorage.removeItem('VGID');
    }
    navigate('/login', { replace: true });
  };

  const handleMenuClick = (newTabName: TabName) => {
    if (tab_name === 'feedback' && newTabName === 'project') {
      SetSubMenu(true);
    } else if (tab_name === 'project' && newTabName === 'feedback') {
      SetSubMenu(true);
    } else {
      SetSubMenu(!SubMenu);
    }
    set_tab_name(newTabName);
  };

  const handleProjectNavigation = (item: Project) => {
    if (tab_name === 'project') {
      navigate(`/ProjectView/${item.id}`);
    } else {
      navigate(`/Feedback/${item.id}`);
    }
  };

  return (
    <>
      <aside className="SideBar">
        <nav>
          <ul>
            <li
              className={cx({ active: path === '/CmsHome' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/CmsHome');
              }}
            >
              홈
            </li>
            <li
              className={cx({ active: path === '/Calendar' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/Calendar');
              }}
            >
              전체 일정
            </li>
            <li
              className={cx('menu_project', {
                active:
                  path.includes('/ProjectView') ||
                  (SubMenu && tab_name === 'project'),
              })}
              onClick={() => handleMenuClick('project')}
            >
              프로젝트 관리
              <span>{project_list?.length || 0}</span>
            </li>
            <li
              className={cx({
                active:
                  path.includes('/Feedback') ||
                  (SubMenu && tab_name === 'feedback'),
              })}
              onClick={() => handleMenuClick('feedback')}
            >
              영상 피드백
            </li>
            <li
              className={cx({ active: path === '/Elearning' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/Elearning');
              }}
            >
              콘텐츠
            </li>
          </ul>
        </nav>
        <div className="logout" onClick={handleLogout}>
          로그아웃
        </div>
      </aside>

      <div className={SubMenu ? 'Submenu active' : 'Submenu'}>
        <div className="etc">
          <div className="ss_title">
            {tab_name === 'feedback' ? '영상 피드백' : '프로젝트 관리'}
          </div>
          <ul>
            {tab_name === 'project' && SortProject.length > 0 && (
              <li onClick={() => navigate('/ProjectCreate')} className="plus">
                +
              </li>
            )}
            <li onClick={() => SetSubMenu(false)} className="close">
              x
            </li>
          </ul>
        </div>
        {/* 2차메뉴 있을때 */}
        <nav>
          <ul>
            {SortProject.map((item, index) => (
              <li
                onClick={() => handleProjectNavigation(item)}
                key={index}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </nav>
        {/* 2차메뉴 없을때 */}
        {SortProject.length === 0 && (
          <div className="empty">
            등록된 <br />
            프로젝트가 없습니다
            <button
              onClick={() => navigate('/ProjectCreate')}
              className="submit"
            >
              프로젝트 등록
            </button>
          </div>
        )}
      </div>
    </>
  );
}

React.memo(SideBar);
