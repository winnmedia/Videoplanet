/**
 * 프로젝트 목록 표시 컴포넌트 (Swiper 기반)
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, useMemo } from 'react';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility

// Swiper 컴포넌트 및 모듈
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/css'; // Temporarily disabled for build compatibility
// import 'swiper/css/navigation'; // Temporarily disabled for build compatibility
// import 'swiper/css/pagination'; // Temporarily disabled for build compatibility
// import 'swiper/css/scrollbar'; // Temporarily disabled for build compatibility

import type { ProjectListProps, Project, ProjectDatePhase } from '../types';

/**
 * 프로젝트 단계별 제목 정보
 */
const PHASE_TITLES = {
  basic_plan: ['기초기획안', '작성'],
  story_board: ['스토리보드', '작성'],
  filming: ['촬영', '(계획/진행)'],
  video_edit: ['비디오 편집'],
  post_work: ['후반 작업'],
  video_preview: ['비디오 시사', '(피드백)'],
  confirmation: ['최종 컨펌'],
  video_delivery: ['영상 납품'],
};

/**
 * 단일 프로젝트 슬라이드 컴포넌트
 */
interface ProjectSlideProps {
  project: Project;
  phase: keyof typeof PHASE_TITLES;
  onProjectClick?: (project: Project) => void;
}

const ProjectSlide: React.FC<ProjectSlideProps> = memo(({ 
  project, 
  phase,
  onProjectClick,
}) => {
  const phaseData = project[phase] as ProjectDatePhase;

  const handleClick = () => {
    onProjectClick?.(project);
  };

  return (
    <SwiperSlide>
      <div 
        className="inner03"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        aria-label={`${project.name} 프로젝트`}
      >
        <div className="name">{project.name}</div>
        {phaseData?.start_date && phaseData?.end_date ? (
          <div className="day">
            <span>
              {moment(phaseData.start_date).format('YYYY.MM.DD.dd')}
            </span>
            <span>
              ~ {moment(phaseData.end_date).format('YYYY.MM.DD.dd')}
            </span>
          </div>
        ) : (
          <span className="no-date">날짜를 입력해주세요.</span>
        )}
      </div>
    </SwiperSlide>
  );
});

ProjectSlide.displayName = 'ProjectSlide';

/**
 * 단계별 프로젝트 섹션 컴포넌트
 */
interface ProjectPhaseProps {
  phase: keyof typeof PHASE_TITLES;
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

const ProjectPhase: React.FC<ProjectPhaseProps> = memo(({ 
  phase, 
  projects,
  onProjectClick,
}) => {
  // 해당 단계의 프로젝트들을 날짜순으로 정렬 및 필터링
  const sortedProjects = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    
    return projects
      .filter(project => {
        const phaseData = project[phase] as ProjectDatePhase;
        
        // 종료 날짜가 없거나 오늘 이후인 프로젝트만 표시
        if (!phaseData?.end_date) return true;
        
        const endDate = new Date(phaseData.end_date).setHours(0, 0, 0, 0);
        return endDate >= today;
      })
      .sort((a, b) => {
        const aPhase = a[phase] as ProjectDatePhase;
        const bPhase = b[phase] as ProjectDatePhase;
        
        const aEndDate = aPhase?.end_date ? new Date(aPhase.end_date) : new Date('9999-12-31');
        const bEndDate = bPhase?.end_date ? new Date(bPhase.end_date) : new Date('9999-12-31');
        
        return aEndDate.getTime() - bEndDate.getTime();
      });
  }, [projects, phase]);

  const titles = PHASE_TITLES[phase];

  if (sortedProjects.length === 0) {
    return null;
  }

  return (
    <div className="process flex space_between align_center">
      <div className="s_title">
        {titles.map((title, index) => (
          <React.Fragment key={index}>
            {title}
            {index < titles.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>

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
          },
          768: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 4,
          },
          1200: {
            slidesPerView: 5,
          },
        }}
        className={`project-phase-swiper phase-${phase}`}
      >
        {sortedProjects.map((project) => (
          <ProjectSlide
            key={`${phase}-${project.id}`}
            project={project}
            phase={phase}
            {...(onProjectClick && { onProjectClick })}
          />
        ))}
      </Swiper>
    </div>
  );
});

ProjectPhase.displayName = 'ProjectPhase';

/**
 * 프로젝트 목록 표시 컴포넌트
 */
const ProjectList: React.FC<ProjectListProps> = ({
  project_list,
  onProjectClick,
  showAllPhases = true,
}) => {
  const phases: (keyof typeof PHASE_TITLES)[] = [
    'basic_plan',
    'story_board',
    'filming',
    'video_edit',
    'post_work',
    'video_preview',
    'confirmation',
    'video_delivery',
  ];

  // 프로젝트 목록이 비어있는 경우
  if (!project_list || project_list.length === 0) {
    return (
      <div className="list_box mt100">
        <div className="empty-state">
          <p>표시할 프로젝트가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list_box mt100">
      {phases.map((phase) => (
        <ProjectPhase
          key={phase}
          phase={phase}
          projects={project_list}
          {...(onProjectClick && { onProjectClick })}
        />
      ))}
    </div>
  );
};

ProjectList.displayName = 'ProjectList';

export default memo(ProjectList);