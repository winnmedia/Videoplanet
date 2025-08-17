'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './ProjectStatsWidget.module.scss';
import { ProjectStatsData, ProjectStatsWidgetProps } from '../model';

export default function ProjectStatsWidget({ 
  data, 
  isLoading = false, 
  error,
  className = '',
  onNavigate
}: ProjectStatsWidgetProps) {
  const router = useRouter();
  const [animatedData, setAnimatedData] = useState<ProjectStatsData>({ 
    total: 0, 
    active: 0, 
    completed: 0, 
    pending: 0 
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
          active: Math.round(data.active * progress),
          completed: Math.round(data.completed * progress),
          pending: Math.round(data.pending * progress)
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

  const widgetClasses = [
    styles.widget,
    styles['widget--project-stats'],
    error ? styles['widget--error'] : '',
    className,
  ].filter(Boolean).join(' ');

  if (error) {
    return (
      <div className={widgetClasses} onClick={handleWidgetClick}>
        <div className={styles.widget__header}>
          <h3 className={styles.widget__title}>프로젝트 진행현황</h3>
          <div className={styles.widget__icon}>📊</div>
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
        <h3 className={styles.widget__title}>프로젝트 진행현황</h3>
        <div className={styles.widget__icon}>📊</div>
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
            <div className={[styles.stat, styles['stat--primary']].join(' ')}>
              <div className={styles.stat__label}>전체 프로젝트</div>
              <div className={styles.stat__value}>{animatedData.total}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>진행중</div>
              <div className={styles.stat__value}>{animatedData.active}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>완료</div>
              <div className={styles.stat__value}>{animatedData.completed}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>대기중</div>
              <div className={styles.stat__value}>{animatedData.pending}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.widget__footer}>
        <span>클릭하여 프로젝트 관리로 이동</span>
      </div>
    </div>
  );
}