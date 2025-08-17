'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './InvitationStatsWidget.module.scss';
import { InvitationStatsData, InvitationStatsWidgetProps } from '../model';

export default function InvitationStatsWidget({ 
  data, 
  isLoading = false, 
  error,
  className = '',
  onNavigate
}: InvitationStatsWidgetProps) {
  const router = useRouter();
  const [animatedData, setAnimatedData] = useState<InvitationStatsData>({ 
    total: 0, 
    pending: 0, 
    accepted: 0, 
    rejected: 0 
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
          pending: Math.round(data.pending * progress),
          accepted: Math.round(data.accepted * progress),
          rejected: Math.round(data.rejected * progress)
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
      onNavigate('/projects');
    } else {
      router.push('/projects');
    }
  };

  const getAcceptanceRate = () => {
    if (!data || data.total === 0) return 0;
    return Math.round((data.accepted / data.total) * 100);
  };

  const widgetClasses = [
    styles.widget,
    styles['widget--invitation-stats'],
    error ? styles['widget--error'] : '',
    className,
  ].filter(Boolean).join(' ');

  if (error) {
    return (
      <div className={widgetClasses} onClick={handleWidgetClick}>
        <div className={styles.widget__header}>
          <h3 className={styles.widget__title}>초대 현황</h3>
          <div className={styles.widget__icon}>👥</div>
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
        <h3 className={styles.widget__title}>초대 현황</h3>
        <div className={styles.widget__icon}>👥</div>
      </div>
      
      <div className={styles.widget__content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton}></div>
            <div className={styles.skeleton}></div>
            <div className={styles.skeleton}></div>
          </div>
        ) : (
          <div className={styles.stats}>
            <div className={styles.highlight}>
              <div className={styles.highlight__value}>{getAcceptanceRate()}%</div>
              <div className={styles.highlight__label}>수락률</div>
            </div>
            
            <div className={styles.grid}>
              <div className={[styles.stat, styles['stat--pending']].join(' ')}>
                <div className={styles.stat__label}>대기중</div>
                <div className={styles.stat__value}>{animatedData.pending}</div>
              </div>
              <div className={[styles.stat, styles['stat--accepted']].join(' ')}>
                <div className={styles.stat__label}>수락</div>
                <div className={styles.stat__value}>{animatedData.accepted}</div>
              </div>
              <div className={[styles.stat, styles['stat--rejected']].join(' ')}>
                <div className={styles.stat__label}>거절</div>
                <div className={styles.stat__value}>{animatedData.rejected}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.widget__footer}>
        <span>클릭하여 초대 관리로 이동</span>
      </div>
    </div>
  );
}