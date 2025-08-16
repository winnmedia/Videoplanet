/**
 * ProjectList Component
 * 프로젝트 단계별 목록 표시 (Swiper 기반)
 */

'use client';

import React, { memo } from 'react';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/css'; // Temporarily disabled for build compatibility
// import 'swiper/css/navigation'; // Temporarily disabled for build compatibility  
// import 'swiper/css/pagination'; // Temporarily disabled for build compatibility

import { ProjectListProps, ProjectSchedule, PROJECT_PHASES } from '../types';

interface ProjectPhaseListProps {
  title: string;
  projects: ProjectSchedule[];
  phaseKey: keyof ProjectSchedule['phases'];
}

// ========================
// 개별 프로젝트 단계 리스트 컴포넌트
// ========================

const ProjectPhaseList: React.FC<ProjectPhaseListProps> = ({
  title,
  projects,
  phaseKey,
}) => {
  // 해당 단계의 종료 날짜로 정렬
  const sortedProjects = projects
    .filter(project => {
      const phase = project.phases[phaseKey];
      // 종료 날짜가 없거나, 종료 날짜가 오늘 이후인 프로젝트만 표시
      return !phase.endDate || 
        (phase.endDate && phase.endDate.getTime() >= new Date().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => {
      const aEndDate = a.phases[phaseKey].endDate;
      const bEndDate = b.phases[phaseKey].endDate;
      
      if (!aEndDate && !bEndDate) return 0;
      if (!aEndDate) return 1;
      if (!bEndDate) return -1;
      
      return aEndDate.getTime() - bEndDate.getTime();
    });

  return (
    <div className="process flex space_between align_center">
      <div className="s_title" dangerouslySetInnerHTML={{ __html: title }} />
      
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        spaceBetween={0}
        slidesPerView={5}
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        navigation
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 10,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 15,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
          1200: {
            slidesPerView: 5,
            spaceBetween: 0,
          },
        }}
      >
        {sortedProjects.map((project) => {
          const phase = project.phases[phaseKey];
          
          return (
            <SwiperSlide key={project.id}>
              <div className="inner03">
                <div className="name" title={project.name}>
                  {project.name}
                </div>
                
                {phase.startDate && phase.endDate ? (
                  <div className="day">
                    <span>
                      {moment(phase.startDate).format('YYYY.MM.DD.dd')}
                    </span>
                    <span>
                      ~ {moment(phase.endDate).format('YYYY.MM.DD.dd')}
                    </span>
                  </div>
                ) : (
                  <span className="no-date">날짜를 입력해주세요.</span>
                )}
                
                {/* 프로젝트 색상 표시 */}
                <div 
                  className="project-color-indicator"
                  style={{ backgroundColor: project.color }}
                />
              </div>
            </SwiperSlide>
          );
        })}
        
        {/* 프로젝트가 없을 때 표시 */}
        {sortedProjects.length === 0 && (
          <SwiperSlide>
            <div className="inner03 no-projects">
              <div className="name">진행 중인 프로젝트가 없습니다.</div>
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
};

// ========================
// 메인 ProjectList 컴포넌트
// ========================

const ProjectList: React.FC<ProjectListProps> = ({
  projects = [],
  className = '',
}) => {
  // 프로젝트 단계 설정
  const projectPhases = [
    {
      key: 'basic_plan' as const,
      title: '기초기획안 <br />작성',
    },
    {
      key: 'story_board' as const,
      title: '스토리보드 <br />작성',
    },
    {
      key: 'filming' as const,
      title: '촬영 <br />(계획/진행)',
    },
    {
      key: 'video_edit' as const,
      title: '비디오 편집',
    },
    {
      key: 'post_work' as const,
      title: '후반 작업',
    },
    {
      key: 'video_preview' as const,
      title: '비디오 시사 <br />(피드백)',
    },
    {
      key: 'confirmation' as const,
      title: '최종 컨펌',
    },
    {
      key: 'video_delivery' as const,
      title: '영상 납품',
    },
  ];

  return (
    <div className={`list_box mt100 ${className}`}>
      {projectPhases.map((phase) => (
        <ProjectPhaseList
          key={phase.key}
          title={phase.title}
          projects={projects}
          phaseKey={phase.key}
        />
      ))}
    </div>
  );
};

export default memo(ProjectList);