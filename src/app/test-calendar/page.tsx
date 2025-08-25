'use client'

import { useEffect } from 'react'
import styles from '../planning/Planning.module.scss'

export default function TestCalendarPage() {
  useEffect(() => {
    // 로그인 상태 설정
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }))
  }, [])

  return (
    <div className={styles.planningWrapper}>
      <div className={styles.title}>테스트 캘린더 페이지</div>
      <div className={`${styles.content} ${styles.calendar}`}>
        <h2>CSS 모듈 클래스 테스트</h2>
        <div>
          <p>planningWrapper 클래스: {styles.planningWrapper || 'undefined'}</p>
          <p>title 클래스: {styles.title || 'undefined'}</p>
          <p>content 클래스: {styles.content || 'undefined'}</p>
          <p>calendar 클래스: {styles.calendar || 'undefined'}</p>
          <p>calendarBox 클래스: {styles.calendarBox || 'undefined'}</p>
        </div>
        
        <div className={styles.calendarBox}>
          <div className={styles.weekHeader}>
            <div className={styles.weekDay}>일</div>
            <div className={styles.weekDay}>월</div>
            <div className={styles.weekDay}>화</div>
            <div className={styles.weekDay}>수</div>
            <div className={styles.weekDay}>목</div>
            <div className={styles.weekDay}>금</div>
            <div className={styles.weekDay}>토</div>
          </div>
          
          <div className={styles.calendarGrid}>
            <div className={styles.week}>
              <div className={styles.day}>
                <div className={styles.dayNumber}>1</div>
              </div>
              <div className={styles.day}>
                <div className={styles.dayNumber}>2</div>
              </div>
              <div className={`${styles.day} ${styles.today}`}>
                <div className={styles.dayNumber}>3</div>
              </div>
              <div className={styles.day}>
                <div className={styles.dayNumber}>4</div>
              </div>
              <div className={styles.day}>
                <div className={styles.dayNumber}>5</div>
              </div>
              <div className={styles.day}>
                <div className={styles.dayNumber}>6</div>
              </div>
              <div className={styles.day}>
                <div className={styles.dayNumber}>7</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}