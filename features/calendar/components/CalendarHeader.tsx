/**
 * CalendarHeader Component
 * 캘린더 헤더 - 날짜 네비게이션 및 뷰 타입 선택
 */

'use client';

import React, { memo } from 'react';
import { Select, Space } from 'antd';
import { CalendarHeaderProps, CalendarViewType, CALENDAR_VIEWS } from '../types';

const { Option } = Select;

interface ExtendedCalendarHeaderProps extends CalendarHeaderProps {
  projects: Array<{ id: number; name: string }>;
  selectedProjectIds: number[];
  onProjectFilter: (projectIds: number[]) => void;
}

const CalendarHeader: React.FC<ExtendedCalendarHeaderProps> = ({
  currentDate,
  currentView,
  navigation,
  onNavigate,
  onViewChange,
  onDateChange,
  projects = [],
  selectedProjectIds = [],
  onProjectFilter,
}) => {
  // ========================
  // 이벤트 핸들러
  // ========================

  const handlePrevious = () => {
    onNavigate('prev');
  };

  const handleNext = () => {
    onNavigate('next');
  };

  const handleViewChange = (view: CalendarViewType) => {
    onViewChange(view);
  };

  const handleProjectChange = (value: string | number) => {
    if (value === '전체' || value === -1) {
      onProjectFilter([]);
    } else {
      const projectId = typeof value === 'string' ? parseInt(value) : value;
      const currentIds = [...selectedProjectIds];
      
      if (currentIds.includes(projectId)) {
        // 이미 선택된 프로젝트면 제거
        onProjectFilter(currentIds.filter(id => id !== projectId));
      } else {
        // 새로운 프로젝트 추가
        onProjectFilter([...currentIds, projectId]);
      }
    }
  };

  // ========================
  // 날짜 포맷팅
  // ========================

  const formatCurrentDate = () => {
    const year = navigation.year;
    const month = navigation.month + 1;
    return `${year}.${month.toString().padStart(2, '0')}`;
  };

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

  // ========================
  // 렌더링
  // ========================

  return (
    <div className="filter flex space_between align_center">
      <div className="date flex space_between align_center">
        {formatCurrentDate()}
        <div className="move">
          <span
            onClick={handlePrevious}
            className="prev"
            role="button"
            tabIndex={0}
            aria-label="이전"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePrevious();
              }
            }}
          />
          <span
            onClick={handleNext}
            className="next"
            role="button"
            tabIndex={0}
            aria-label="다음"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        </div>
      </div>

      <div className="type">
        <Space wrap>
          {/* 프로젝트 필터 */}
          <Select
            placeholder="프로젝트 선택"
            className="project-filter-select"
            style={{ width: 140 }}
            value={getSelectedProjectName()}
            onChange={handleProjectChange}
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          >
            <Option value="전체">전체</Option>
            {projects.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>

          {/* 뷰 타입 선택 */}
          <Select
            value={currentView}
            style={{ width: 140 }}
            onChange={handleViewChange}
            options={CALENDAR_VIEWS.map((view) => ({
              label: view,
              value: view,
            }))}
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          />
        </Space>
      </div>
    </div>
  );
};

export default memo(CalendarHeader);