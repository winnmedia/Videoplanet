/**
 * 프로젝트 상세 보기 페이지
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 * 경로: /projects/[id]/view
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Select } from 'antd';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build

import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import CalendarHeader from '@/tasks/Calendar/CalendarHeader';
import CalendarBody from '@/tasks/Calendar/CalendarBody';
import { ProjectInfo, ProjectList } from '@/features/projects/components';
import { 
  useProjects, 
  useProjectPermissions 
} from '@/features/projects/hooks/useProjects';
import type { 
  Project, 
  CalendarViewType 
} from '@/features/projects/types';

// Redux 타입 (임시)
interface RootState {
  ProjectStore: {
    user: string;
  };
}

/**
 * 프로젝트 상세 보기 페이지 컴포넌트
 */
export default function ProjectViewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const { user } = useSelector((state: RootState) => state.ProjectStore);
  const { currentProject, loading, fetchProject } = useProjects();
  
  // 권한 관리
  const permissions = useProjectPermissions(currentProject);

  // 캘린더 상태
  const [dateType, setDateType] = useState<CalendarViewType>('월');
  const [day, setDay] = useState(new Date().getDate() - 1);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekIndex, setWeekIndex] = useState(0);
  const [totalDate, setTotalDate] = useState<Date[] | Date[][]>([]);

  const dateList: CalendarViewType[] = ['월', '주', '일'];

  // 프로젝트 새로고침 핸들러
  const refetch = async () => {
    if (projectId) {
      await fetchProject(projectId);
    }
  };

  // 날짜 변경 함수 (기존 로직 유지)
  const changeDate = (type: CalendarViewType) => {
    // 이전 날짜
    const prevLastDate = new Date(year, month, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDay();

    // 다음 날짜
    const thisLastDay = new Date(year, month + 1, 0).getDay();
    const thisLastDate = new Date(year, month + 1, 0).getDate();

    // 이전 날짜 만들기
    let prevDates: Date[] = [];
    if (prevLastDay !== 6) {
      let preMonth = month - 1;
      let preYear = year;
      if (preMonth < 0) {
        preYear--;
        preMonth = 11;
      }
      for (let i = 0; i < prevLastDay + 1; i++) {
        prevDates.unshift(new Date(preYear, preMonth, prevLastDate - i));
      }
    }

    // 다음 날짜 만들기
    let nextDates: Date[] = [];
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextYear++;
      nextMonth = 0;
    }
    for (let i = 1; i < 7 - thisLastDay; i++) {
      if (i === 0) break;
      nextDates.push(new Date(nextYear, nextMonth, i));
    }

    // 현재 날짜
    const currentDates: Date[] = [];
    for (let i = 1; i < thisLastDate + 1; i++) {
      currentDates.push(new Date(year, month, i));
    }

    let result: Date[] | Date[][];

    if (type === '일') {
      result = currentDates;
      setTotalDate(result);
      return result;
    } else {
      const allDates = [...prevDates, ...currentDates, ...nextDates];
      const dividedList: Date[][] = [];

      for (let i = 0; i < allDates.length; i += 7) {
        const sublist = allDates.slice(i, i + 7);
        dividedList.push(sublist);
      }

      result = dividedList;
      setTotalDate(result);
      return result;
    }
  };

  // 날짜 타입 변경 핸들러
  const handleDateTypeChange = (val: CalendarViewType) => {
    setDateType(val);
    changeDate(val);
  };

  // 프로젝트 편집 핸들러
  const handleEditProject = () => {
    router.push(`/projects/${projectId}/edit`);
  };

  // 컴포넌트 마운트시 프로젝트 로드
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId).catch(() => {
        router.push('/Calendar');
      });
    }
  }, [projectId]);

  // 날짜 관련 상태 변경시 캘린더 업데이트
  useEffect(() => {
    changeDate(dateType);
  }, [year, month, dateType]);

  // 로딩 상태
  if (loading || !currentProject) {
    return (
      <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
        <div className="cms_wrap">
          <SideBar tab="projects" on_menu={false} />
          <main className="project">
            <div className="loading-spinner">
              <div className="spinner" />
              <p>프로젝트를 불러오는 중...</p>
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
        <main className="project">
          {/* 프로젝트 정보 */}
          <ProjectInfo
            current_project={currentProject}
            isAdmin={permissions.isAdmin}
            {...(permissions.canEdit && { onEdit: handleEditProject })}
          />

          {/* 캘린더 및 일정 관리 */}
          <div className="content calendar">
            {/* 캘린더 헤더 및 필터 */}
            <div className="filter flex space_between align_center">
              <CalendarHeader
                totalDate={totalDate}
                year={year}
                month={month}
                setMonth={setMonth}
                setYear={setYear}
                week_index={weekIndex}
                set_week_index={setWeekIndex}
                type={dateType}
                changeDate={changeDate}
                day={day}
                setDay={setDay}
              />
              
              <div className="type flex align_center">
                <Select
                  defaultValue={dateType}
                  style={{ width: 140 }}
                  value={dateType}
                  onChange={handleDateTypeChange}
                  options={dateList.map((option) => ({
                    label: option,
                    value: option,
                  }))}
                />
                
                {permissions.isAdmin && (
                  <button
                    onClick={handleEditProject}
                    className="submit"
                    type="button"
                  >
                    프로젝트 관리
                  </button>
                )}
              </div>
            </div>

            {/* 캘린더 바디 */}
            {totalDate.length > 0 && (
              <CalendarBody
                totalDate={totalDate}
                month={month}
                year={year}
                week_index={weekIndex}
                type={dateType}
                day={day}
                current_project={currentProject}
                project_list={[currentProject]}
                user_memos={[]}
                is_admin={permissions.isAdmin}
                refetch={refetch}
              />
            )}

            {/* 프로젝트 진행 단계 범례 */}
            <div className="list_mark">
              <ul>
                <li>
                  <span className="first"></span>
                  기초기획안 작성
                </li>
                <li>
                  <span className="second"></span>
                  스토리보드 작성
                </li>
                <li>
                  <span className="third"></span>
                  촬영 (계획/진행)
                </li>
                <li>
                  <span className="fourth"></span>
                  비디오 편집
                </li>
                <li>
                  <span className="fifth"></span>
                  후반 작업
                </li>
                <li>
                  <span className="sixth"></span>
                  비디오 시사 (피드백)
                </li>
                <li>
                  <span className="seven"></span>
                  최종 컨펌
                </li>
                <li>
                  <span className="eighth"></span>
                  영상 납품
                </li>
              </ul>
            </div>

            {/* 현재 프로젝트 단계별 진행상황 */}
            <ProjectList
              project_list={[currentProject]}
              showAllPhases={true}
            />
          </div>
        </main>
      </div>
    </PageTemplate>
  );
}