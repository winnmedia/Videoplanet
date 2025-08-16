'use client';

import React from 'react';
import styles from './UserProfile.module.scss';
import { Avatar } from '../../atoms';
import { BaseComponentProps, User } from '../../../types/layout';

export interface UserProfileProps extends BaseComponentProps {
  /** 사용자 정보 */
  user: User;
  /** 프로필 클릭 핸들러 */
  onProfileClick?: () => void;
  /** 아바타 크기 */
  avatarSize?: 'sm' | 'md' | 'lg';
  /** 세로 레이아웃 */
  vertical?: boolean;
  /** 이메일 표시 여부 */
  showEmail?: boolean;
  /** 이름 대신 닉네임 우선 표시 */
  preferNickname?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onProfileClick,
  avatarSize = 'md',
  vertical = false,
  showEmail = true,
  preferNickname = true,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  // 표시할 이름 결정
  const getDisplayName = (): string => {
    if (preferNickname && user.nickname) {
      return user.nickname;
    }
    return user.name || user.nickname || user.email?.split('@')[0] || 'Unknown';
  };

  // 표시할 이메일/서브텍스트 결정
  const getSubText = (): string => {
    if (showEmail) {
      return user.email;
    }
    if (!preferNickname && user.nickname) {
      return user.nickname;
    }
    return '';
  };

  const profileClasses = [
    styles.userProfile,
    vertical ? styles['userProfile--vertical'] : styles['userProfile--horizontal'],
    onProfileClick ? styles['userProfile--clickable'] : '',
    className,
  ].filter(Boolean).join(' ');

  const displayName = getDisplayName();
  const subText = getSubText();

  const handleClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onProfileClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onProfileClick();
    }
  };

  return (
    <div
      className={profileClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onProfileClick ? 'button' : undefined}
      tabIndex={onProfileClick ? 0 : undefined}
      aria-label={onProfileClick ? `${displayName} 프로필 메뉴 열기` : undefined}
      data-testid={testId}
      {...props}
    >
      <Avatar
        name={displayName}
        {...(user.avatar && { src: user.avatar })}
        size={avatarSize}
        {...(onProfileClick && { onClick: onProfileClick })}
      />
      
      <div className={styles.userProfile__info}>
        <div className={styles.userProfile__name} title={displayName}>
          {displayName}
        </div>
        
        {subText && (
          <div className={styles.userProfile__email} title={subText}>
            {subText}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;