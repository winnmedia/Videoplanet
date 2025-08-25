'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/shared/ui/AppLayout'
import styles from './Planning.module.scss'

interface Project {
  id: number
  name: string
  status: string
  color: string
  first_date: string
  end_date: string
}

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  
  // Calendar state
  const [dateType, setDateType] = useState<'월' | '주' | '일'>('월')
  const [projectFilter, setProjectFilter] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('전체')
  const [day, setDay] = useState(new Date().getDate() - 1)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [weekIndex, setWeekIndex] = useState(0)
  const [totalDate, setTotalDate] = useState<any>([])

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // Load user data
        const userData = localStorage.getItem('user')
        if (userData) {
          setUser(JSON.parse(userData))
        }

        // Mock project data
        const mockProjects: Project[] = [
          { 
            id: 1, 
            name: '브랜드 홍보영상 제작', 
            status: 'active',
            color: '#1631F8',
            first_date: '2024-01-15',
            end_date: '2024-02-28'
          },
          { 
            id: 2, 
            name: '제품 소개 동영상', 
            status: 'review',
            color: '#28a745',
            first_date: '2024-02-01',
            end_date: '2024-03-15'
          },
          { 
            id: 3, 
            name: 'SNS 콘텐츠 시리즈', 
            status: 'planning',
            color: '#ffc107',
            first_date: '2024-02-10',
            end_date: '2024-04-30'
          }
        ]

        setProjects(mockProjects)

      } catch (error) {
        console.error('Planning page loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Current month projects filter
  const currentProjectList = useMemo(() => {
    return projects.filter((project) => {
      const endMonth = new Date(project.end_date).getMonth()
      const startMonth = new Date(project.first_date).getMonth()
      return endMonth === month || startMonth === month
    })
  }, [month, projects])

  // Project filter change
  useEffect(() => {
    if (selectedProject === '전체') {
      setProjectFilter(currentProjectList)
    } else {
      const result = currentProjectList.filter((project) => project.name === selectedProject)
      setProjectFilter(result)
    }
  }, [selectedProject, currentProjectList])

  // Date calculation function
  const changeDate = (type: '월' | '주' | '일') => {
    // Previous month dates
    let prevLastDate = new Date(year, month, 0).getDate()
    let prevLastDay = new Date(year, month, 0).getDay()
    
    // Current month dates
    const thisLastDay = new Date(year, month + 1, 0).getDay()
    const thisLastDate = new Date(year, month + 1, 0).getDate()

    // Previous month dates array
    let PVLD = []
    if (prevLastDay !== 6) {
      let preMonth = month - 1
      let preYear = year
      if (preMonth < 0) {
        --preYear
        preMonth = 11
      }
      for (let i = 0; i < prevLastDay + 1; i++) {
        PVLD.unshift(new Date(preYear, preMonth, prevLastDate - i))
      }
    }

    // Next month dates array
    let TLD = []
    let nextMonth = month + 1
    let nextYear = year
    if (nextMonth > 11) {
      ++nextYear
      nextMonth = 0
    }
    for (let i = 1; i < 7 - thisLastDay; i++) {
      if (i === 0) {
        return TLD
      }
      TLD.push(new Date(nextYear, nextMonth, i))
    }

    // Current month dates array
    let TD = []
    for (let i = 1; i < thisLastDate + 1; i++) {
      TD.push(new Date(year, month, i))
    }

    let result
    if (type === '일') {
      result = TD
      setTotalDate(result)
      return result
    } else {
      result = PVLD.concat(TD, TLD)
      const dividedList = []
      
      for (let i = 0; i < result.length; i += 7) {
        const sublist = result.slice(i, i + 7)
        dividedList.push(sublist)
      }
      
      setTotalDate(dividedList)
      return dividedList
    }
  }

  // Month navigation
  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      let preMonth = month - 1
      let preYear = year
      if (preMonth < 0) {
        --preYear
        preMonth = 11
      }
      setMonth(preMonth)
      if (preYear !== year) {
        setYear(preYear)
      }
    } else {
      let nextMonth = month + 1
      let nextYear = year
      if (nextMonth > 11) {
        ++nextYear
        nextMonth = 0
      }
      setMonth(nextMonth)
      if (nextYear !== year) {
        setYear(nextYear)
      }
    }
  }

  // Initialize calendar
  useEffect(() => {
    changeDate(dateType)
  }, [dateType, month, year])


  // Calendar rendering functions
  const renderCalendarGrid = () => {
    if (dateType === '월') {
      return totalDate.map((week: Date[], weekIdx: number) => (
        <div key={weekIdx} className={styles.week}>
          {week.map((date: Date, dayIdx: number) => (
            <div 
              key={dayIdx} 
              className={`${styles.day} ${date.getMonth() !== month ? styles.otherMonth : ''} ${
                date.toDateString() === new Date().toDateString() ? styles.today : ''
              }`}
            >
              <div className={styles.dayNumber}>{date.getDate()}</div>
              <div className={styles.events}>
                {renderDayEvents(date)}
              </div>
            </div>
          ))}
        </div>
      ))
    }
    return null
  }

  const renderDayEvents = (date: Date) => {
    return projectFilter.map((project) => {
      const startDate = new Date(project.first_date)
      const endDate = new Date(project.end_date)
      
      if (date >= startDate && date <= endDate) {
        const isStart = date.toDateString() === startDate.toDateString()
        const isEnd = date.toDateString() === endDate.toDateString()
        
        return (
          <div
            key={project.id}
            className={`${styles.event} ${isStart ? styles.start : ''} ${isEnd ? styles.end : ''}`}
            style={{ backgroundColor: project.color }}
            title={project.name}
          >
            {isStart && <span className={styles.eventName}>{project.name}</span>}
          </div>
        )
      }
      return null
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AppLayout user={user}>
      <div className={styles.planningWrapper}>
          <div className={styles.title}>전체 일정</div>
          <div className={`${styles.content} ${styles.calendar}`}>
            <div className={`${styles.filter} ${styles.flex} ${styles.spaceBetween} ${styles.alignCenter}`}>
              {/* Calendar Header */}
              <div className={`${styles.date} ${styles.flex} ${styles.spaceBetween} ${styles.alignCenter}`}>
                <div className={styles.currentDate}>
                  {year}.{month + 1 < 10 ? `0${month + 1}` : month + 1}
                </div>
                <div className={styles.move}>
                  <span 
                    onClick={() => changeMonth('prev')}
                    className={styles.prev}
                  ></span>
                  <span 
                    onClick={() => changeMonth('next')}
                    className={styles.next}
                  ></span>
                </div>
              </div>

              {/* Filters */}
              <div className={styles.type}>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className={styles.projectSelect}
                >
                  <option value="전체">전체</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value as '월' | '주' | '일')}
                  className={styles.dateSelect}
                >
                  <option value="월">월</option>
                  <option value="주">주</option>
                  <option value="일">일</option>
                </select>
              </div>
            </div>

            {/* Calendar Body */}
            <div className={dateType === '일' ? `${styles.calendarBox} ${styles.day}` : styles.calendarBox}>
              {/* Week headers */}
              <div className={styles.weekHeader}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <div key={idx} className={styles.weekDay}>{day}</div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className={styles.calendarGrid}>
                {renderCalendarGrid()}
              </div>
            </div>

            {/* Project List Marks */}
            <div className={styles.listMark}>
              <ul>
                {currentProjectList.map((project) => (
                  <li key={project.id}>
                    <span style={{ backgroundColor: project.color }}></span>
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Calendar Total Stats */}
            <div className={styles.calendarTotal}>
              <div className={styles.totalItem}>
                <div className={styles.totalLabel}>이번 달 프로젝트</div>
                <div className={styles.totalValue}>{currentProjectList.length}개</div>
              </div>
              <div className={styles.totalItem}>
                <div className={styles.totalLabel}>전체 프로젝트</div>
                <div className={styles.totalValue}>{projects.length}개</div>
              </div>
              <div className={styles.totalItem}>
                <div className={styles.totalLabel}>진행 중</div>
                <div className={styles.totalValue}>{projects.filter(p => p.status === 'active').length}개</div>
              </div>
            </div>

            {/* Project List */}
            <div className={styles.projectList}>
              <div className={styles.projectListTitle}>프로젝트 목록</div>
              <div className={styles.projectItems}>
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className={styles.projectItem}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div 
                      className={styles.projectColor} 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <div className={styles.projectInfo}>
                      <div className={styles.projectName}>{project.name}</div>
                      <div className={styles.projectDate}>
                        {project.first_date} ~ {project.end_date}
                      </div>
                    </div>
                    <div className={`${styles.projectStatus} ${styles[project.status]}`}>
                      {project.status === 'active' ? '진행중' : 
                       project.status === 'review' ? '검토중' : '기획중'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </AppLayout>
  )
}