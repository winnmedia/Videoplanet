'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './FeedbackStatsWidget.module.scss';
import { FeedbackStatsData, FeedbackStatsWidgetProps } from '../model';

export default function FeedbackStatsWidget({ 
  data, 
  isLoading = false, 
  error,
  className = '',
  onNavigate
}: FeedbackStatsWidgetProps) {
  const router = useRouter();
  const [animatedData, setAnimatedData] = useState<FeedbackStatsData>({ 
    total: 0, 
    unread: 0, 
    replied: 0, 
    pending: 0,
    thisWeek: 0
  });

  // 숫자 애니메이션 효과
  useEffect(() => {
    if (data && !isLoading) {
      const duration = 1000;
      const steps = 30;
      const stepTime = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setAnimatedData({
          total: Math.round(data.total * progress),
          unread: Math.round(data.unread * progress),
          replied: Math.round(data.replied * progress),
          pending: Math.round(data.pending * progress),
          thisWeek: Math.round(data.thisWeek * progress)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setAnimatedData(data);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [data, isLoading]);

  const handleWidgetClick = () => {
    if (onNavigate) {
      onNavigate('/feedback');
    } else {
      router.push('/feedback');
    }
  };

  const getResponseRate = () => {
    if (!data || data.total === 0) return 0;
    return Math.round((data.replied / data.total) * 100);
  };

  const widgetClasses = [
    styles.widget,
    styles['widget--feedback-stats'],
    error ? styles['widget--error'] : '',
    className,
  ].filter(Boolean).join(' ');

  if (error) {
    return (
      <div className={widgetClasses} onClick={handleWidgetClick}>
        <div className={styles.widget__header}>
          <h3 className={styles.widget__title}>피드백 현황</h3>
          <div className={styles.widget__icon}>💬</div>
        </div>
        <div className={styles.widget__error}>
          데이터를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className={widgetClasses} onClick={handleWidgetClick}>
      <div className={styles.widget__header}>
        <h3 className={styles.widget__title}>피드백 현황</h3>
        <div className={styles.widget__icon}>💬</div>
      </div>
      
      <div className={styles.widget__content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton}></div>
            <div className={styles.skeleton}></div>
            <div className={styles.skeleton}></div>
            <div className={styles.skeleton}></div>
          </div>
        ) : (
          <div className={styles.stats}>
            <div className={styles.highlight}>
              <div className={styles.highlight__value}>{animatedData.thisWeek}</div>
              <div className={styles.highlight__label}>이번 주 피드백</div>
            </div>
            
            <div className={styles.grid}>
              <div className={[styles.stat, styles['stat--unread']].join(' ')}>
                <div className={styles.stat__label}>미확인</div>
                <div className={styles.stat__value}>{animatedData.unread}</div>
              </div>
              <div className={[styles.stat, styles['stat--pending']].join(' ')}>
                <div className={styles.stat__label}>답변대기</div>
                <div className={styles.stat__value}>{animatedData.pending}</div>
              </div>
              <div className={[styles.stat, styles['stat--replied']].join(' ')}>
                <div className={styles.stat__label}>답변완료</div>
                <div className={styles.stat__value}>{animatedData.replied}</div>
              </div>
              <div className={[styles.stat, styles['stat--total']].join(' ')}>
                <div className={styles.stat__label}>전체</div>
                <div className={styles.stat__value}>{animatedData.total}</div>
              </div>
            </div>
            
            <div className={styles.progress}>
              <div className={styles.progress__bar}>
                <div 
                  className={styles.progress__fill} 
                  style={{ width: `${getResponseRate()}%` }}
                ></div>
              </div>
              <span className={styles.progress__text}>답변률 {getResponseRate()}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.widget__footer}>
        <span>클릭하여 피드백 관리로 이동</span>
      </div>
    </div>
  );
}