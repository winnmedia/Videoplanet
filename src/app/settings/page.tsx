'use client';

import { useState } from 'react';
import { AppLayout } from '@/shared/ui/AppLayout';
import { Button } from '@/shared/ui/Button/Button';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import styles from './Settings.module.scss';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    feedback: boolean;
    projectUpdates: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    autoplay: boolean;
    videoQuality: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: false,
      feedback: true,
      projectUpdates: true,
      weeklyReport: false,
    },
    privacy: {
      profilePublic: false,
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      language: 'ko',
      timezone: 'Asia/Seoul',
      autoplay: true,
      videoQuality: 'auto',
    },
  });

  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'preferences'>('notifications');

  const handleToggle = (category: keyof Settings, field: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field],
      },
    }));
  };

  const handleChange = (category: keyof Settings, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    // API 호출하여 설정 저장
    console.log('설정 저장:', settings);
    alert('설정이 저장되었습니다.');
  };

  // 사용자 정보 (실제로는 Context나 API에서 가져와야 함)
  const user = {
    name: '김영상',
    email: 'kim@videoplanet.com',
  };

  return (
    <ErrorBoundary>
      <AppLayout user={user}>
        <div className={styles.settingsPage}>
        <div className={styles.header}>
          <h1>설정</h1>
          <Button onClick={handleSave} variant="primary">
            설정 저장
          </Button>
        </div>

        <div className={styles.content}>
          <div className={styles.tabs}>
            <button
              className={activeTab === 'notifications' ? styles.active : ''}
              onClick={() => setActiveTab('notifications')}
            >
              알림 설정
            </button>
            <button
              className={activeTab === 'privacy' ? styles.active : ''}
              onClick={() => setActiveTab('privacy')}
            >
              개인정보 보호
            </button>
            <button
              className={activeTab === 'preferences' ? styles.active : ''}
              onClick={() => setActiveTab('preferences')}
            >
              환경 설정
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'notifications' && (
              <div className={styles.section}>
                <h2>알림 설정</h2>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>이메일 알림</h3>
                    <p>중요한 업데이트를 이메일로 받습니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={() => handleToggle('notifications', 'email')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>푸시 알림</h3>
                    <p>브라우저 푸시 알림을 받습니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={() => handleToggle('notifications', 'push')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>피드백 알림</h3>
                    <p>새로운 피드백이 등록되면 알려줍니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.feedback}
                      onChange={() => handleToggle('notifications', 'feedback')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>프로젝트 업데이트</h3>
                    <p>프로젝트 상태 변경 시 알려줍니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.projectUpdates}
                      onChange={() => handleToggle('notifications', 'projectUpdates')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>주간 리포트</h3>
                    <p>매주 프로젝트 진행 상황을 요약해서 받습니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.weeklyReport}
                      onChange={() => handleToggle('notifications', 'weeklyReport')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className={styles.section}>
                <h2>개인정보 보호</h2>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>공개 프로필</h3>
                    <p>다른 사용자가 내 프로필을 볼 수 있습니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.profilePublic}
                      onChange={() => handleToggle('privacy', 'profilePublic')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>이메일 공개</h3>
                    <p>프로필에 이메일 주소를 표시합니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={() => handleToggle('privacy', 'showEmail')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>전화번호 공개</h3>
                    <p>프로필에 전화번호를 표시합니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={() => handleToggle('privacy', 'showPhone')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className={styles.section}>
                <h2>환경 설정</h2>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>언어</h3>
                    <p>인터페이스 언어를 선택합니다.</p>
                  </div>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handleChange('preferences', 'language', e.target.value)}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>시간대</h3>
                    <p>알림과 일정의 시간대를 설정합니다.</p>
                  </div>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => handleChange('preferences', 'timezone', e.target.value)}
                  >
                    <option value="Asia/Seoul">서울 (GMT+9)</option>
                    <option value="Asia/Tokyo">도쿄 (GMT+9)</option>
                    <option value="America/New_York">뉴욕 (GMT-5)</option>
                    <option value="Europe/London">런던 (GMT+0)</option>
                  </select>
                </div>


                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>비디오 자동 재생</h3>
                    <p>피드백 페이지에서 비디오를 자동으로 재생합니다.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.preferences.autoplay}
                      onChange={() => handleToggle('preferences', 'autoplay')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3>비디오 품질</h3>
                    <p>기본 비디오 재생 품질을 설정합니다.</p>
                  </div>
                  <select
                    value={settings.preferences.videoQuality}
                    onChange={(e) => handleChange('preferences', 'videoQuality', e.target.value)}
                  >
                    <option value="auto">자동</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
    </ErrorBoundary>
  );
}