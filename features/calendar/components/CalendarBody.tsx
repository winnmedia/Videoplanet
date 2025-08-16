/**
 * CalendarBody Component
 * 캘린더 본체 - 월/주/일 뷰에 따라 다른 레이아웃 렌더링
 */

'use client';

import React, { memo } from 'react';
import CalendarDate from './CalendarDate';
import { CalendarBodyProps, WeekData, CalendarDate as CalendarDateType } from '../types';

const CalendarBody: React.FC<CalendarBodyProps> = ({
  viewData,
  currentView,
  navigation,
  projects,
  userMemos,
  isAdmin,
  onEventClick,
  onDateClick,
  onRefetch,
}) => {
  // ========================
  // 렌더링 헬퍼
  // ========================

  const renderMonthView = (weeks: WeekData[]) => {
    return weeks.map((week, weekIndex) => {
      if (!Array.isArray(week.dates)) return null;
      
      return (
        <CalendarDate
          key={weekIndex}
          index={weekIndex}
          week={week.dates.map(dateObj => dateObj.date)}
          month={navigation.month}
          year={navigation.year}
          type={currentView}
          current_project={undefined} // 월 뷰에서는 특정 프로젝트 없음
          project_list={projects}
          user_memos={userMemos}
          is_admin={isAdmin}
          refetch={onRefetch}
        />
      );
    });
  };

  const renderWeekView = (dates: CalendarDateType[]) => {
    if (!Array.isArray(dates)) return null;
    
    return (
      <CalendarDate
        index={0}
        week={dates.map(dateObj => dateObj.date)}
        month={navigation.month}
        year={navigation.year}
        type={currentView}
        current_project={undefined}
        project_list={projects}
        user_memos={userMemos}
        is_admin={isAdmin}
        refetch={onRefetch}
      />
    );
  };

  const renderDayView = (dates: CalendarDateType[]) => {
    if (!Array.isArray(dates) || dates.length === 0) return null;
    
    return (
      <CalendarDate
        index={0}
        month={navigation.month}
        year={navigation.year}
        type={currentView}
        day={dates[0]?.date || new Date()}
        current_project={undefined}
        project_list={projects}
        user_memos={userMemos}
        is_admin={isAdmin}
        refetch={onRefetch}
      />
    );
  };

  // ========================
  // 메인 렌더링
  // ========================

  const renderCalendarContent = () => {
    switch (currentView) {
      case '월':
        return renderMonthView(viewData as WeekData[]);
        
      case '주':
        return renderWeekView(viewData as CalendarDateType[]);
        
      case '일':
        return renderDayView(viewData as CalendarDateType[]);
        
      default:
        return null;
    }
  };

  const containerClassName = currentView === '일' ? 'calendar_box day' : 'calendar_box';

  return (
    <div className={containerClassName} role="main" aria-label="캘린더 본체">
      {renderCalendarContent()}
    </div>
  );
};

export default memo(CalendarBody);