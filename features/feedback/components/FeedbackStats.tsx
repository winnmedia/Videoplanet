// =============================================================================
// FeedbackStats Component - 피드백 통계 표시 컴포넌트
// =============================================================================

'use client';

import React, { memo, useMemo, useState } from 'react';
import type { Feedback, ProjectMember } from '../types';

interface FeedbackStatsProps {
  feedbacks: Feedback[];
  members?: ProjectMember[];
  videoDuration?: number; // 초 단위
  className?: string;
  compactMode?: boolean;
  showDetailedStats?: boolean;
}

interface StatsData {
  total: number;
  anonymous: number;
  withTimestamp: number;
  averageLength: number;
  feedbackDensity: number; // 분당 피드백 수
  topContributors: { name: string; count: number; percentage: number }[];
  timeDistribution: { period: string; count: number; percentage: number }[];
  recentActivity: { period: string; count: number }[];
}

/**
 * 피드백 통계 표시 컴포넌트
 * - 전체 피드백 수
 * - 익명/일반 비율
 * - 타임스탬프 포함 비율
 * - 평균 글자 수
 * - 시간대별 분포
 * - 주요 기여자
 * - 최근 활동
 */
const FeedbackStats: React.FC<FeedbackStatsProps> = memo(({
  feedbacks,
  members = [],
  videoDuration = 3600,
  className = '',
  compactMode = false,
  showDetailedStats = true,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  // 통계 데이터 계산
  const stats = useMemo<StatsData>(() => {
    const total = feedbacks.length;
    
    if (total === 0) {
      return {
        total: 0,
        anonymous: 0,
        withTimestamp: 0,
        averageLength: 0,
        feedbackDensity: 0,
        topContributors: [],
        timeDistribution: [],
        recentActivity: [],
      };
    }

    // 기본 통계
    const anonymous = feedbacks.filter(f => f.secret).length;
    const withTimestamp = feedbacks.filter(f => f.section && f.section.trim()).length;
    const totalCharacters = feedbacks.reduce((sum, f) => sum + f.contents.length, 0);
    const averageLength = Math.round(totalCharacters / total);
    const feedbackDensity = (total / (videoDuration / 60)); // 분당 피드백 수

    // 기여자 통계
    const contributorMap = new Map<string, number>();
    feedbacks.forEach(feedback => {
      const key = feedback.secret ? '익명' : feedback.nickname;
      contributorMap.set(key, (contributorMap.get(key) || 0) + 1);
    });

    const topContributors = Array.from(contributorMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 시간대별 분포 (비디오 시간 기준)
    const timeSlots = 6; // 6개 구간으로 나누기
    const slotDuration = videoDuration / timeSlots;
    const timeDistribution = Array.from({ length: timeSlots }, (_, index) => {
      const start = index * slotDuration;
      const end = (index + 1) * slotDuration;
      
      const count = feedbacks.filter(feedback => {
        if (!feedback.section) return false;
        
        const time = parseTimestamp(feedback.section);
        return time >= start && time < end;
      }).length;

      const startTime = formatTime(start);
      const endTime = formatTime(end);
      
      return {
        period: `${startTime}-${endTime}`,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    // 최근 활동 (실제 작성 시간 기준)
    const now = new Date();
    const recentActivity = [];

    // 선택된 기간에 따른 활동 분석
    const periods = selectedPeriod === 'day' ? 24 : selectedPeriod === 'week' ? 7 : 30;
    const unitMs = selectedPeriod === 'day' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 시간 또는 일
    
    for (let i = 0; i < periods; i++) {
      const periodStart = new Date(now.getTime() - (i + 1) * unitMs);
      const periodEnd = new Date(now.getTime() - i * unitMs);
      
      const count = feedbacks.filter(feedback => {
        const createdDate = new Date(feedback.created);
        return createdDate >= periodStart && createdDate < periodEnd;
      }).length;

      let periodLabel: string;
      if (selectedPeriod === 'day') {
        periodLabel = `${periodStart.getHours()}시`;
      } else if (selectedPeriod === 'week') {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        periodLabel = dayNames[periodStart.getDay()] || '일';
      } else {
        periodLabel = `${periodStart.getMonth() + 1}/${periodStart.getDate()}`;
      }

      recentActivity.unshift({ period: periodLabel, count });
    }

    return {
      total,
      anonymous,
      withTimestamp,
      averageLength,
      feedbackDensity,
      topContributors,
      timeDistribution,
      recentActivity,
    };
  }, [feedbacks, videoDuration, selectedPeriod]);

  // 타임스탬프를 초로 변환
  const parseTimestamp = (timestamp: string): number => {
    if (!timestamp) return 0;
    
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    } else if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    return 0;
  };

  // 초를 시간 형식으로 변환
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  };

  // 백분율 바 컴포넌트
  const PercentageBar: React.FC<{ 
    value: number; 
    max: number; 
    color?: string; 
    label?: string;
  }> = ({ value, max, color = '#1631F8', label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    
    return (
      <div className="percentage-bar">
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
        {label && <span className="bar-label">{label}</span>}
      </div>
    );
  };

  if (compactMode) {
    return (
      <div className={`feedback-stats compact ${className}`}>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">총 피드백</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.anonymous}</span>
            <span className="stat-label">익명</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.withTimestamp}</span>
            <span className="stat-label">시점 포함</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.averageLength}</span>
            <span className="stat-label">평균 글자</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`feedback-stats ${className}`}>
      {/* 기본 통계 카드들 */}
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">[통계]</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">총 피드백</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">[사용자]</div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.anonymous}
              <span className="stat-percentage">
                ({stats.total > 0 ? Math.round((stats.anonymous / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="stat-label">익명 피드백</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">[시간]</div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.withTimestamp}
              <span className="stat-percentage">
                ({stats.total > 0 ? Math.round((stats.withTimestamp / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="stat-label">시점 포함</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">[텍스트]</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageLength}</div>
            <div className="stat-label">평균 글자 수</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">[차트]</div>
          <div className="stat-content">
            <div className="stat-value">{stats.feedbackDensity.toFixed(1)}</div>
            <div className="stat-label">분당 피드백</div>
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      {showDetailedStats && stats.total > 0 && (
        <div className="stats-detailed">
          {/* 주요 기여자 */}
          {stats.topContributors.length > 0 && (
            <div className="stats-section">
              <h3 className="section-title">주요 기여자</h3>
              <div className="contributors-list">
                {stats.topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="contributor-item">
                    <div className="contributor-rank">#{index + 1}</div>
                    <div className="contributor-info">
                      <span className="contributor-name">{contributor.name}</span>
                      <div className="contributor-stats">
                        <span className="contributor-count">{contributor.count}개</span>
                        <span className="contributor-percentage">({contributor.percentage}%)</span>
                      </div>
                    </div>
                    <PercentageBar
                      value={contributor.count}
                      max={stats.topContributors[0]?.count || 1}
                      color={index === 0 ? '#1631F8' : '#6c757d'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시간대별 분포 */}
          {stats.timeDistribution.some(t => t.count > 0) && (
            <div className="stats-section">
              <h3 className="section-title">비디오 시간대별 분포</h3>
              <div className="time-distribution">
                {stats.timeDistribution.map((period, index) => (
                  <div key={index} className="time-period">
                    <div className="period-header">
                      <span className="period-label">{period.period}</span>
                      <span className="period-count">{period.count}개</span>
                    </div>
                    <PercentageBar
                      value={period.count}
                      max={Math.max(...stats.timeDistribution.map(t => t.count), 1)}
                      color={period.count > 0 ? '#28a745' : '#e9ecef'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최근 활동 */}
          <div className="stats-section">
            <div className="section-header">
              <h3 className="section-title">최근 활동</h3>
              <div className="period-selector">
                {(['day', 'week', 'month'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                    aria-label={`${period === 'day' ? '시간별' : period === 'week' ? '요일별' : '일별'} 활동 보기`}
                  >
                    {period === 'day' ? '24시간' : period === 'week' ? '7일' : '30일'}
                  </button>
                ))}
              </div>
            </div>
            <div className="activity-chart">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="activity-bar">
                  <div className="activity-label">{activity.period}</div>
                  <div className="activity-value">
                    <div
                      className="activity-fill"
                      style={{
                        height: `${Math.max(4, (activity.count / Math.max(...stats.recentActivity.map(a => a.count), 1)) * 100)}%`,
                      }}
                    />
                    {activity.count > 0 && (
                      <span className="activity-count">{activity.count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 요약 인사이트 */}
          <div className="stats-section">
            <h3 className="section-title">인사이트</h3>
            <div className="insights">
              {stats.anonymous / stats.total > 0.5 && (
                <div className="insight-item">
                  <span className="insight-icon">[분석]</span>
                  <span className="insight-text">
                    익명 피드백이 {Math.round((stats.anonymous / stats.total) * 100)}%를 차지합니다.
                  </span>
                </div>
              )}
              
              {stats.withTimestamp / stats.total < 0.3 && (
                <div className="insight-item">
                  <span className="insight-icon">[시간]</span>
                  <span className="insight-text">
                    시점이 포함된 피드백이 적습니다. 구체적인 시점 정보를 추가해보세요.
                  </span>
                </div>
              )}
              
              {stats.feedbackDensity > 1 && (
                <div className="insight-item">
                  <span className="insight-icon">[인기]</span>
                  <span className="insight-text">
                    분당 {stats.feedbackDensity.toFixed(1)}개의 높은 피드백 밀도를 보입니다!
                  </span>
                </div>
              )}
              
              {stats.averageLength > 100 && (
                <div className="insight-item">
                  <span className="insight-icon">[문서]</span>
                  <span className="insight-text">
                    평균 {stats.averageLength}자의 상세한 피드백을 받고 있습니다.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 데이터가 없을 때 */}
      {stats.total === 0 && (
        <div className="empty-stats">
          <div className="empty-icon">[데이터 없음]</div>
          <h3>아직 피드백이 없습니다</h3>
          <p>첫 번째 피드백을 남겨보세요!</p>
        </div>
      )}

      {/* 접근성을 위한 숨김 텍스트 */}
      <div className="sr-only" aria-live="polite">
        총 {stats.total}개의 피드백 중 {stats.anonymous}개가 익명, {stats.withTimestamp}개가 시점 포함
      </div>
    </div>
  );
});

FeedbackStats.displayName = 'FeedbackStats';

export default FeedbackStats;