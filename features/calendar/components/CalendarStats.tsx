/**
 * CalendarStats Component
 * 캘린더 통계 정보 표시
 */

'use client';

import React, { memo } from 'react';
import { CalendarStatsProps, CalendarStats as CalendarStatsType } from '../types';

const CalendarStats: React.FC<CalendarStatsProps> = ({
  stats,
  className = '',
}) => {
  return (
    <div className={`part mt100 ${className}`}>
      <ul className="schedule">
        <li>
          전체 <br />
          프로젝트 <span>{stats.totalProjects}</span>
        </li>
        <li>
          이번 달 <br />
          프로젝트 <span>{stats.thisMonthProjects}</span>
        </li>
        <li>
          다음 달 <br />
          프로젝트 <span>{stats.nextMonthProjects}</span>
        </li>
        <li>
          진행 중 <br />
          프로젝트 <span>{stats.activeProjects}</span>
        </li>
      </ul>
    </div>
  );
};

export default memo(CalendarStats);