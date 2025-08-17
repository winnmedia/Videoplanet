'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import moment from 'moment'

// moment 한국어 로케일 설정
moment.locale('ko')
import './Calendar.scss'

interface Project {
  id: string
  name: string
  first_date: string
  end_date: string
  phase: number
  color?: string
}

export default function CalendarPage() {
  const router = useRouter()
  
  // 날짜 관련 상태
  const [dateType, setDateType] = useState<'월' | '주' | '일'>('월')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [day, setDay] = useState(new Date().getDate())
  const [totalDate, setTotalDate] = useState<Date[]>([])
  
  // TODO: 실제 프로젝트 데이터를 API에서 가져와야 함
  const projectList: Project[] = []

  const [projectFilter, setProjectFilter] = useState<Project[]>(projectList)
  const [selectedProject, setSelectedProject] = useState<string>('전체')

  // 달력 날짜 생성
  useEffect(() => {
    generateCalendarDates()
  }, [year, month, dateType])

  const generateCalendarDates = () => {
    const dates: Date[] = []
    
    if (dateType === '월') {
      // 이번 달의 첫날과 마지막날
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // 첫 주의 이전 달 날짜들
      const firstDayOfWeek = firstDay.getDay()
      if (firstDayOfWeek !== 0) {
        for (let i = firstDayOfWeek; i > 0; i--) {
          const prevDate = new Date(year, month, 1 - i)
          dates.push(prevDate)
        }
      }
      
      // 이번 달의 모든 날짜
      for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push(new Date(year, month, i))
      }
      
      // 마지막 주의 다음 달 날짜들
      const lastDayOfWeek = lastDay.getDay()
      if (lastDayOfWeek !== 6) {
        for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
          dates.push(new Date(year, month + 1, i))
        }
      }
    } else if (dateType === '주') {
      // 주간 뷰: 현재 주의 7일
      const currentDate = new Date(year, month, day)
      const currentDayOfWeek = currentDate.getDay()
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek)
      
      for (let i = 0; i < 7; i++) {
        const weekDate = new Date(startOfWeek)
        weekDate.setDate(startOfWeek.getDate() + i)
        dates.push(weekDate)
      }
    } else {
      // 일간 뷰: 현재 날짜만
      dates.push(new Date(year, month, day))
    }
    
    setTotalDate(dates)
  }

  // 날짜 네비게이션
  const navigateDate = (direction: 'prev' | 'next') => {
    if (dateType === '월') {
      if (direction === 'prev') {
        if (month === 0) {
          setMonth(11)
          setYear(year - 1)
        } else {
          setMonth(month - 1)
        }
      } else {
        if (month === 11) {
          setMonth(0)
          setYear(year + 1)
        } else {
          setMonth(month + 1)
        }
      }
    } else if (dateType === '주') {
      const newDate = new Date(year, month, day)
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7))
      setYear(newDate.getFullYear())
      setMonth(newDate.getMonth())
      setDay(newDate.getDate())
    } else {
      const newDate = new Date(year, month, day)
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1))
      setYear(newDate.getFullYear())
      setMonth(newDate.getMonth())
      setDay(newDate.getDate())
    }
  }

  // 프로젝트 필터링
  const handleProjectFilter = (projectName: string) => {
    if (projectName === '전체') {
      setProjectFilter(projectList)
    } else {
      setProjectFilter(projectList.filter(p => p.name === projectName))
    }
    setSelectedProject(projectName)
  }

  // 현재 달의 프로젝트들
  const currentMonthProjects = useMemo(() => {
    return projectFilter.filter(project => {
      const startDate = new Date(project.first_date)
      const endDate = new Date(project.end_date)
      const currentMonthStart = new Date(year, month, 1)
      const currentMonthEnd = new Date(year, month + 1, 0)
      
      return (startDate <= currentMonthEnd && endDate >= currentMonthStart)
    })
  }, [projectFilter, year, month])

  // 프로젝트가 특정 날짜에 활성화되어 있는지 체크
  const isProjectActiveOnDate = (project: Project, date: Date) => {
    const projectStart = new Date(project.first_date)
    const projectEnd = new Date(project.end_date)
    return date >= projectStart && date <= projectEnd
  }

  return (
    <main style={{ padding: '30px' }}>
      <div className="calendar-page">
      {/* 캘린더 헤더 */}
      <div className="calendar-header">
        <div className="header-left">
          <div className="date-navigation">
            <h2>{year}년 {month + 1}월</h2>
            <div className="nav-buttons">
              <button onClick={() => navigateDate('prev')}>◀</button>
              <button onClick={() => navigateDate('next')}>▶</button>
            </div>
          </div>
          
          <div className="date-type-selector">
            {(['월', '주', '일'] as const).map(type => (
              <button
                key={type}
                className={dateType === type ? 'active' : ''}
                onClick={() => setDateType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="header-right">
          <select
            value={selectedProject}
            onChange={(e) => handleProjectFilter(e.target.value)}
            className="project-filter"
          >
            <option value="전체">전체 프로젝트</option>
            {projectList.map(project => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 캘린더 본문 */}
      <div className="calendar-body">
        {dateType === '월' && (
          <>
            <div className="calendar-weekdays">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="calendar-grid">
              {totalDate.map((date, index) => (
                <div
                  key={index}
                  className={`calendar-cell ${
                    date.getMonth() !== month ? 'other-month' : ''
                  } ${
                    date.toDateString() === new Date().toDateString() ? 'today' : ''
                  }`}
                >
                  <div className="date-number">{date.getDate()}</div>
                  
                  <div className="project-indicators">
                    {currentMonthProjects.map(project => {
                      if (isProjectActiveOnDate(project, date)) {
                        return (
                          <div
                            key={project.id}
                            className="project-bar"
                            style={{
                              backgroundColor: project.color || '#1631F8',
                              opacity: 0.8
                            }}
                            title={project.name}
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {dateType === '주' && (
          <div className="week-view">
            <div className="week-grid">
              {totalDate.map((date, index) => (
                <div key={index} className="week-column">
                  <div className="week-header">
                    <div className="week-day">
                      {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                    </div>
                    <div className={`week-date ${
                      date.toDateString() === new Date().toDateString() ? 'today' : ''
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                  
                  <div className="week-content">
                    {currentMonthProjects.map(project => {
                      if (isProjectActiveOnDate(project, date)) {
                        return (
                          <div
                            key={project.id}
                            className="week-project"
                            style={{ backgroundColor: project.color || '#1631F8' }}
                          >
                            {project.name}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {dateType === '일' && totalDate.length > 0 && totalDate[0] && (
          <div className="day-view">
            <h3>{moment(totalDate[0] as Date).format('YYYY년 MM월 DD일 dddd')}</h3>
            
            <div className="day-projects">
              {currentMonthProjects.map(project => {
                if (isProjectActiveOnDate(project, totalDate[0] as Date)) {
                  return (
                    <div
                      key={project.id}
                      className="day-project-card"
                      style={{ borderLeftColor: project.color || '#1631F8' }}
                    >
                      <h4>{project.name}</h4>
                      <p>시작: {project.first_date}</p>
                      <p>종료: {project.end_date}</p>
                      <p>단계: {project.phase}</p>
                    </div>
                  )
                }
                return null
              })}
              
              {totalDate[0] && currentMonthProjects.filter(p => 
                isProjectActiveOnDate(p, totalDate[0] as Date)
              ).length === 0 && (
                <p className="no-projects">이 날짜에 진행 중인 프로젝트가 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 프로젝트 리스트 */}
      <div className="project-list-section">
        <h3>프로젝트 목록</h3>
        <div className="project-list">
          {currentMonthProjects.map(project => (
            <div
              key={project.id}
              className="project-item"
              onClick={() => router.push(`/projects/${project.id}/view`)}
            >
              <div
                className="project-color"
                style={{ backgroundColor: project.color || '#1631F8' }}
              />
              <div className="project-info">
                <h4>{project.name}</h4>
                <p>{project.first_date} ~ {project.end_date}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="calendar-stats">
          <div className="stat-item">
            <span className="stat-label">전체 프로젝트</span>
            <span className="stat-value">{projectList.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">이번 달 프로젝트</span>
            <span className="stat-value">{currentMonthProjects.length}</span>
          </div>
        </div>
      </div>
    </div>
    </main>
  )
}