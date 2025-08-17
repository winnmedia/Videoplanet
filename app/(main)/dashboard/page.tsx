'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import moment from 'moment'

// moment 한국어 로케일 설정
moment.locale('ko')
import Sidebar from './components/Sidebar'
import ProjectProgressWidget from './components/ProjectProgressWidget'
import InvitationStatusWidget from './components/InvitationStatusWidget'
import FeedbackStatusWidget from './components/FeedbackStatusWidget'
import { useProjectProgress, useInvitationStatus, useFeedbackStatus } from '../../../features/dashboard/hooks/useDashboard'
import './CmsHome.scss'

export default function DashboardPage() {
  const navigate = useRouter()
  const [time, setTime] = useState('')
  const [date, setDate] = useState(new Date())
  const [side, setSide] = useState({ tab: '', onMenu: false })
  const { tab, onMenu } = side
  const intervalRef = useRef<NodeJS.Timeout>()

  // 대시보드 위젯 데이터 훅들
  const projectProgress = useProjectProgress()
  const invitationStatus = useInvitationStatus()
  const feedbackStatus = useFeedbackStatus()

  // Redux에서 프로젝트 데이터 가져오기 (실제 API 호출 필요)
  const projectList: Array<{ id: number; name: string; status: string }> = []
  
  const thisMonthProject = projectList.filter(p => p.status === 'active')
  const nextMonthProject = projectList.filter(p => p.status === 'pending')

  // 시계 업데이트
  useEffect(() => {
    moment.locale('ko')
    
    const updateTime = () => {
      const now = new Date()
      setTime(moment(now).format('HH:mm:ss'))
      setDate(now)
    }

    updateTime() // 초기 시간 설정
    intervalRef.current = setInterval(updateTime, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleMenuClick = (menuType: string) => {
    if (menuType === 'calendar') {
      navigate.push('/calendar')
    } else if (menuType === 'project' || menuType === 'feedback') {
      if (tab === menuType) {
        setSide({ tab: '', onMenu: false })
      } else {
        setSide({ tab: menuType, onMenu: true })
      }
    }
  }

  return (
    <div className="cms_wrap">
      <Sidebar 
        tab={tab} 
        onMenu={onMenu}
        onTabChange={(newTab) => setSide({ tab: newTab, onMenu: newTab !== '' })}
      />

      <main>
        <div className="content home">
          {/* 대형 디지털 시계 */}
          <div className="today">
            <div className="clock">{time}</div>
            <small>{moment(date).format('YYYY.MM.DD.dd')}</small>
          </div>

          {/* 4개 메뉴 아이콘 */}
          <div className="menu_box">
            <ul>
              <li
                className="menu_calendar"
                onClick={() => handleMenuClick('calendar')}
              >
                <div className="img">캘린더</div>
                <span>전체 일정</span>
              </li>
              <li
                className="menu_project"
                onClick={() => handleMenuClick('project')}
              >
                <div className="img">프로젝트</div>
                <span>프로젝트 관리</span>
              </li>
              <li
                className="menu_feedback"
                onClick={() => handleMenuClick('feedback')}
              >
                <div className="img">피드백</div>
                <span>영상 피드백</span>
              </li>
            </ul>
          </div>

          {/* 대시보드 위젯들 */}
          <div className="widgets-container">
            <ProjectProgressWidget 
              data={projectProgress.data}
              isLoading={projectProgress.isLoading}
              error={projectProgress.error}
            />
            <InvitationStatusWidget
              data={invitationStatus.data}
              isLoading={invitationStatus.isLoading}
              error={invitationStatus.error}
            />
            <FeedbackStatusWidget
              data={feedbackStatus.data}
              isLoading={feedbackStatus.isLoading}
              error={feedbackStatus.error}
            />
          </div>

          {/* 기존 프로젝트 진행사항 (호환성 유지) */}
          <div className="part legacy-section">
            <div className="s_title">프로젝트 진행사항 (기존)</div>
            <ul className="schedule">
              <li>
                <div className="label">
                  전체<br />
                  프로젝트
                </div>
                <span>{projectList.length}</span>
              </li>
              <li>
                <div className="label">
                  이번 달<br />
                  프로젝트
                </div>
                <span>{thisMonthProject.length}</span>
              </li>
              <li>
                <div className="label">
                  다음 달<br />
                  프로젝트
                </div>
                <span>{nextMonthProject.length}</span>
              </li>
              <li>
                <div className="label">
                  완료된<br />
                  프로젝트
                </div>
                <span>{projectList.filter(p => p.status === 'completed').length}</span>
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  )
}