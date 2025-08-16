'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import './Dashboard.scss'

export default function Dashboard() {
  const router = useRouter()
  const intervalId = useRef<NodeJS.Timeout | null>(null)
  const [time, setTime] = useState('')

  // 시간 포맷팅 함수
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    }).replace(/\./g, '.').replace(/ /g, '.')
  }

  // 실시간 시간 업데이트
  useEffect(() => {
    // 초기 시간 설정
    setTime(formatTime(new Date()))
    
    // 1초마다 시간 업데이트
    intervalId.current = setInterval(() => {
      const currentTime = formatTime(new Date())
      setTime(currentTime)
    }, 1000)

    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
    }
  }, [])

  // 네비게이션 핸들러
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const currentDate = new Date()

  return (
    <div className="cms_wrap">
      <main id="main-content">
        <div className="content home">
          {/* 실시간 시계 섹션 */}
          <div className="today">
            <div className="clock" aria-live="polite" aria-label={`현재 시간 ${time}`}>
              {time}
            </div>
            <small aria-label={`오늘 날짜 ${formatDate(currentDate)}`}>
              {formatDate(currentDate)}
            </small>
          </div>

          {/* 메뉴 박스 */}
          <div className="menu_box">
            <ul role="list">
              <li
                className="menu_calendar"
                onClick={() => handleNavigation('/calendar')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation('/calendar')
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="전체 일정 보기"
              >
                <div className="img" aria-hidden="true"></div>
                <span>전체 일정</span>
              </li>
              <li
                className="menu_project"
                onClick={() => handleNavigation('/projects')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation('/projects')
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="프로젝트 관리"
              >
                <div className="img" aria-hidden="true"></div>
                <span>프로젝트 관리</span>
              </li>
              <li
                className="menu_feedback"
                onClick={() => handleNavigation('/feedback')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation('/feedback')
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="영상 피드백"
              >
                <div className="img" aria-hidden="true"></div>
                <span>영상 피드백</span>
              </li>
              <li
                className="menu_elearning"
                onClick={() => handleNavigation('/elearning')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation('/elearning')
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="온라인 강의"
              >
                <div className="img" aria-hidden="true"></div>
                <span>온라인 강의</span>
              </li>
            </ul>
          </div>

          {/* 프로젝트 진행사항 */}
          <div className="part">
            <div className="s_title">프로젝트 진행사항</div>
            <ul className="schedule" role="list">
              <li aria-label="전체 프로젝트 0개">
                전체 <br />
                프로젝트 <span>0</span>
              </li>
              <li aria-label="이번 달 프로젝트 0개">
                이번 달 <br />
                프로젝트 <span>0</span>
              </li>
              <li aria-label="다음 달 프로젝트 0개">
                다음 달 <br />
                프로젝트 <span>0</span>
              </li>
            </ul>
          </div>

          {/* 온라인 클래스 섹션 */}
          <div className="part db">
            <div className="s_title">
              Online Class 
              <span 
                aria-label="온라인 클래스 더보기"
                role="button"
                tabIndex={0}
                onClick={() => handleNavigation('/elearning')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation('/elearning')
                  }
                }}
              ></span>
            </div>
            <ul className="oc" role="list">
              <li aria-label="처음부터 배우는 파이널컷 프로 강의, 강사: 영상 디자이너 김영상">
                처음부터 배우는 <br />
                파이널컷 프로
                <span>영상 디자이너 김영상</span>
              </li>
              <li aria-label="처음부터 배우는 파이널컷 프로 강의, 강사: 영상 디자이너 김영상">
                처음부터 배우는 <br />
                파이널컷 프로
                <span>영상 디자이너 김영상</span>
              </li>
              <li aria-label="처음부터 배우는 파이널컷 프로 강의, 강사: 영상 디자이너 김영상">
                처음부터 배우는 <br />
                파이널컷 프로
                <span>영상 디자이너 김영상</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}