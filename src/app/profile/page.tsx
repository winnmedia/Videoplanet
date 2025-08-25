'use client';

import { useState } from 'react';
import { AppLayout } from '@/shared/ui/AppLayout';
import { Button } from '@/shared/ui/Button/Button';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import styles from './Profile.module.scss';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  bio: string;
  company: string;
  position: string;
  phone: string;
  joinedAt: string;
  lastLogin: string;
  projects: number;
  feedbacks: number;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: '김영상',
    email: 'kim@videoplanet.com',
    role: 'Video Producer',
    avatar: '/images/avatar-placeholder.png',
    bio: '10년 경력의 영상 프로듀서입니다. 브랜드 홍보 영상과 제품 소개 영상을 주로 제작합니다.',
    company: '비디오플래닛',
    position: '시니어 프로듀서',
    phone: '010-1234-5678',
    joinedAt: '2024-01-15',
    lastLogin: '2025-08-24T06:00:00Z',
    projects: 24,
    feedbacks: 156,
  });

  const handleSave = () => {
    // API 호출하여 프로필 저장
    setIsEditing(false);
    console.log('프로필 저장:', profile);
  };

  const handleCancel = () => {
    // 원래 데이터로 복원
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 사용자 정보 (실제로는 Context나 API에서 가져와야 함)
  const user = {
    name: profile.name,
    email: profile.email,
  };

  return (
    <ErrorBoundary>
      <AppLayout user={user}>
        <div className={styles.profilePage}>
        <div className={styles.header}>
          <h1>프로필</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="primary">
              프로필 수정
            </Button>
          ) : (
            <div className={styles.actions}>
              <Button onClick={handleCancel} variant="secondary">
                취소
              </Button>
              <Button onClick={handleSave} variant="primary">
                저장
              </Button>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <img src={profile.avatar} alt={profile.name} className={styles.avatar} />
              {isEditing && (
                <Button size="sm" variant="secondary">
                  사진 변경
                </Button>
              )}
            </div>

            <div className={styles.infoSection}>
              <div className={styles.formGroup}>
                <label>이름</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <p>{profile.name}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <p>{profile.email}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>역할</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  />
                ) : (
                  <p>{profile.role}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>회사</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                ) : (
                  <p>{profile.company}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>직책</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                ) : (
                  <p>{profile.position}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>전화번호</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <p>{profile.phone}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>소개</label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                  />
                ) : (
                  <p>{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.statsCard}>
            <h2>활동 통계</h2>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.projects}</span>
                <span className={styles.statLabel}>프로젝트</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.feedbacks}</span>
                <span className={styles.statLabel}>피드백</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {new Date(profile.joinedAt).toLocaleDateString('ko-KR')}
                </span>
                <span className={styles.statLabel}>가입일</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {new Date(profile.lastLogin).toLocaleDateString('ko-KR')}
                </span>
                <span className={styles.statLabel}>마지막 로그인</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
    </ErrorBoundary>
  );
}