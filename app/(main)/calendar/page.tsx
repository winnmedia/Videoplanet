'use client'

/**
 * Calendar Page
 * 캘린더 메인 페이지 - Next.js 14 App Router
 */

'use client';

import React, { Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, Space } from 'antd';

import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import {
  CalendarHeader,
  CalendarBody,
  CalendarStats,
  ProjectList,
} from '@/features/calendar/components';
import { useCalendar, useProjectSchedule } from '@/features/calendar/hooks';
import type { CalendarViewType } from '@/features/calendar/types';
import { DEFAULT_CALENDAR_SETTINGS } from '@/features/calendar/types';
import { refetchProject } from '@/utils/util';

// import './Calendar.scss'; // Temporarily disabled for build

// ========================
// 로딩 컴포넌트
// ========================

const CalendarSkeleton = () => (
  <div className="calendar-skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-body" />
    <div className="skeleton-stats" />
  </div>
);

// ========================
// 메인 캘린더 페이지 컴포넌트
// ========================

const CalendarPageContent: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  
  // Redux에서 데이터 가져오기
  const { project_list, this_month_project, next_month_project, user_memos } = useSelector(
    (state: any) => state.ProjectStore
  );
  
  // URL에서 초기 뷰 타입 가져오기
  const initialView = (searchParams?.get('view') as CalendarViewType) || '월';
  
  // 커스텀 훅들
  const {
    state,
    handlers,
    navigation,
    modal,
    stats,
    isLoading,
    error,
    refetch,
  } = useCalendar(initialView);

  const {
    projects,
    filteredProjects,
    selectedProjectIds,
    filterProjects,
  } = useProjectSchedule();

  // ========================
  // 이펙트
  // ========================

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    refetchProject(dispatch, router);
  }, [dispatch, router]);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const view = searchParams?.get('view') as CalendarViewType;
    if (view && ['월', '주', '일'].includes(view)) {
      handlers.onViewChange(view);
    }
  }, [searchParams, handlers]);

  // ========================
  // 이벤트 핸들러
  // ========================

  const handleRefetch = () => {
    refetchProject(dispatch, router);
  };

  const handleProjectFilter = (value: string | number) => {
    if (value === '전체' || value === -1) {
      filterProjects([]);
    } else {
      const projectId = typeof value === 'string' ? parseInt(value) : value;
      filterProjects([projectId]);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      navigation.navigatePrev();
    } else {
      navigation.navigateNext();
    }
  };

  // ========================
  // 렌더링 헬퍼
  // ========================

  const getSelectedProjectName = () => {
    if (selectedProjectIds.length === 0) {
      return '전체';
    } else if (selectedProjectIds.length === 1) {
      const project = projects.find(p => p.id === selectedProjectIds[0]);
      return project?.name || '전체';
    } else {
      return `${selectedProjectIds.length}개 선택됨`;
    }
  };

  const currentProjects = filteredProjects.length > 0 ? filteredProjects : projects;

  // ========================
  // 에러 처리
  // ========================

  if (error) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="calendar" on_menu={false} />
          <main>
            <div className="title">전체 일정</div>
            <div className="content calendar">
              <div className="error-message">
                <h3>오류가 발생했습니다</h3>
                <p>{error}</p>
                <button onClick={handleRefetch} className="btn-retry">
                  다시 시도
                </button>
              </div>
            </div>
          </main>
        </div>
      </PageTemplate>
    );
  }

  // ========================
  // 메인 렌더링
  // ========================

  return (
    <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
      <div className="cms_wrap">
        <SideBar tab="calendar" on_menu={false} />
        <main>
          <div className="title">전체 일정</div>
          
          <div className="content calendar">
            {/* 헤더 - 네비게이션 및 필터 */}
            <div className="filter flex space_between align_center">
              {/* 날짜 네비게이션 */}
              <div className="date flex space_between align_center">
                {navigation.year}.{String(navigation.month + 1).padStart(2, '0')}
                <div className="move">
                  <span
                    onClick={() => handleNavigate('prev')}
                    className="prev"
                    role="button"
                    tabIndex={0}
                    aria-label="이전"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNavigate('prev');
                      }
                    }}
                  />
                  <span
                    onClick={() => handleNavigate('next')}
                    className="next"
                    role="button"
                    tabIndex={0}
                    aria-label="다음"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNavigate('next');
                      }
                    }}
                  />
                </div>
              </div>

              {/* 필터 및 뷰 선택 */}
              <div className="type">
                <Space wrap>
                  {/* 프로젝트 필터 */}
                  <Select
                    placeholder="프로젝트 선택"
                    className="project-filter-select"
                    style={{ width: 140 }}
                    value={getSelectedProjectName()}
                    onChange={handleProjectFilter}
                    getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
                  >
                    <Select.Option value="전체">전체</Select.Option>
                    {projects.map((project) => (
                      <Select.Option key={project.id} value={project.id}>
                        {project.name}
                      </Select.Option>
                    ))}
                  </Select>

                  {/* 뷰 타입 선택 */}
                  <Select
                    value={state.currentView}
                    style={{ width: 140 }}
                    onChange={handlers.onViewChange}
                    options={['월', '주', '일'].map((view) => ({
                      label: view,
                      value: view,
                    }))}
                    getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
                  />
                </Space>
              </div>
            </div>

            {/* 캘린더 본체 */}
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <CalendarBody
                viewData={state.viewData}
                currentView={state.currentView}
                navigation={navigation}
                projects={currentProjects}
                userMemos={state.userMemos}
                isAdmin={true} // 실제로는 권한 체크 로직 필요
                onEventClick={handlers.onEventClick}
                onDateClick={handlers.onDateClick}
                onRefetch={handleRefetch}
              />
            )}

            {/* 프로젝트 색상 범례 */}
            <div className="list_mark">
              <ul>
                {currentProjects.map((project, index) => (
                  <li key={project.id || index}>
                    <span style={{ background: project.color }} />
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* 통계 섹션 */}
            <CalendarStats
              stats={{
                totalProjects: project_list?.length || 0,
                thisMonthProjects: this_month_project?.length || 0,
                nextMonthProjects: next_month_project?.length || 0,
                activeProjects: stats.activeProjects,
                completedProjects: stats.completedProjects,
                overdueProjects: stats.overdueProjects,
              }}
            />

            {/* 프로젝트 단계별 목록 */}
            <ProjectList projects={currentProjects} />
          </div>
        </main>
      </div>
    </PageTemplate>
  );
};

// ========================
// Suspense로 래핑된 메인 컴포넌트
// ========================

const CalendarPage: React.FC = () => {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  );
};

export default CalendarPage;