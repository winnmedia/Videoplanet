/**
 * 설정 페이지
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 * 경로: /settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import PageTemplate from '@/components/PageTemplate';
import SideBar from '@/components/SideBar';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Redux 타입 (임시)
interface RootState {
  ProjectStore: {
    user?: string;
  };
}

/**
 * 설정 페이지 컴포넌트
 */
export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.ProjectStore);
  const { logout } = useAuth();
  
  // 설정 상태
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'ko',
  });
  
  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState({
    email: user || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // 설정 변경 핸들러
  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // 사용자 정보 변경 핸들러
  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 비밀번호 변경 제출
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userInfo.newPassword !== userInfo.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (userInfo.newPassword.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      // 비밀번호 변경 API 호출 (구현 필요)
      // await authApi.changePassword({
      //   currentPassword: userInfo.currentPassword,
      //   newPassword: userInfo.newPassword,
      // });
      
      toast.success('비밀번호가 변경되었습니다.');
      setUserInfo(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast.error('비밀번호 변경에 실패했습니다.');
      console.error('Password change error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // 설정 저장 API 호출 (구현 필요)
      // await userApi.updateSettings(settings);
      
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.');
      console.error('Settings save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 계정 탈퇴
  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsLoading(true);
    try {
      // 계정 탈퇴 API 호출 (구현 필요)
      // await authApi.deleteAccount();
      
      toast.success('계정이 탈퇴되었습니다.');
      await logout();
      router.push('/');
    } catch (error) {
      toast.error('계정 탈퇴에 실패했습니다.');
      console.error('Account deletion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTemplate leftItems={[]} auth={false} props={{}} noLogin={false}>
      <div className="cms_wrap">
        <SideBar tab="settings" on_menu={false} />
        <main className="settings">
          <div className="title">설정</div>
          
          <div className="content">
            {/* 일반 설정 */}
            <section className="settings-section">
              <h2>일반 설정</h2>
              
              <div className="setting-item">
                <label className="flex space_between align_center">
                  <span>알림 허용</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="toggle-switch"
                  />
                </label>
              </div>
              
              <div className="setting-item">
                <label className="flex space_between align_center">
                  <span>이메일 업데이트 수신</span>
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(e) => handleSettingChange('emailUpdates', e.target.checked)}
                    className="toggle-switch"
                  />
                </label>
              </div>
              
              <div className="setting-item">
                <label className="flex space_between align_center">
                  <span>다크 모드</span>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    className="toggle-switch"
                  />
                </label>
              </div>
              
              <div className="setting-item">
                <label>
                  <span>언어</span>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="ty01"
                    style={{ width: '200px', marginTop: '10px' }}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
              
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="submit"
                style={{ width: '150px', marginTop: '20px' }}
              >
                {isLoading ? '저장 중...' : '설정 저장'}
              </button>
            </section>

            {/* 계정 설정 */}
            <section className="settings-section">
              <h2>계정 설정</h2>
              
              <div className="setting-item">
                <label>
                  <span>이메일</span>
                  <input
                    type="email"
                    value={userInfo.email}
                    readOnly
                    className="ty01"
                    style={{ marginTop: '10px', backgroundColor: '#f5f5f5' }}
                  />
                </label>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <h3>비밀번호 변경</h3>
                
                <div className="setting-item">
                  <label>
                    <span>현재 비밀번호</span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={userInfo.currentPassword}
                      onChange={handleUserInfoChange}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="ty01"
                      style={{ marginTop: '10px' }}
                    />
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <span>새 비밀번호</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={userInfo.newPassword}
                      onChange={handleUserInfoChange}
                      placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                      className="ty01"
                      style={{ marginTop: '10px' }}
                    />
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <span>비밀번호 확인</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={userInfo.confirmPassword}
                      onChange={handleUserInfoChange}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="ty01"
                      style={{ marginTop: '10px' }}
                    />
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || !userInfo.currentPassword || !userInfo.newPassword}
                  className="submit"
                  style={{ width: '150px', marginTop: '20px' }}
                >
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </section>

            {/* 위험 영역 */}
            <section className="settings-section danger-zone">
              <h2>위험 영역</h2>
              
              <div className="setting-item">
                <p style={{ color: '#dc3545', marginBottom: '10px' }}>
                  계정을 탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="submit"
                  style={{ 
                    width: '150px',
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545'
                  }}
                >
                  {isLoading ? '탈퇴 중...' : '계정 탈퇴'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageTemplate>
  );
}