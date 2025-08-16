'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.scss';
import { Logo } from '../../atoms';
import { UserProfile } from '../../molecules';
import { HeaderProps, HeaderItem, User } from '../../../types/layout';
import { ROUTES } from '../../../types/layout';

const Header: React.FC<HeaderProps> = ({
  leftItems = [],
  rightItems = [],
  isFixed = false,
  showShadow = true,
  onLogoClick,
  className = '',
  'data-testid': testId,
  children,
  ...props
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // 기본 좌측 아이템 (로고)
  const defaultLeftItems: HeaderItem[] = [
    {
      type: 'component',
      component: (
        <Logo
          size="md"
          onClick={() => onLogoClick ? onLogoClick({} as any) : router.push(ROUTES.HOME)}
          priority={true}
        />
      ),
      className: 'logo',
    }
  ];

  // 헤더 아이템 렌더링 함수
  const renderHeaderItems = (items: HeaderItem[]): React.ReactNode[] => {
    return items.map((item, index) => {
      const key = `header-item-${index}`;
      
      switch (item.type) {
        case 'img':
          return (
            <div key={key} className={item.className || ''}>
              <img
                src={item.src}
                alt={item.alt || `헤더 이미지 ${index + 1}`}
                onClick={item.onClick}
                style={{ cursor: item.onClick ? 'pointer' : 'default' }}
              />
            </div>
          );

        case 'string':
          return (
            <div
              key={key}
              className={item.className || ''}
              onClick={item.onClick}
              style={{ cursor: item.onClick ? 'pointer' : 'default' }}
            >
              {item.text}
            </div>
          );

        case 'component':
          return (
            <div key={key} className={item.className || ''}>
              {item.component}
            </div>
          );

        default:
          return null;
      }
    });
  };

  // 사용자 프로필을 렌더링하는 함수
  const renderUserProfile = (user: User): React.ReactNode => {
    const profileItems: HeaderItem[] = [
      {
        type: 'component',
        component: (
          <UserProfile
            user={user}
            avatarSize="md"
            showEmail={true}
            preferNickname={true}
            onProfileClick={() => {
              // 프로필 메뉴 열기 로직
              console.log('프로필 메뉴 열기');
            }}
          />
        ),
        className: 'profile',
      }
    ];

    return renderHeaderItems(profileItems);
  };

  // 실제 렌더링할 아이템들 결정
  const finalLeftItems = leftItems.length > 0 ? leftItems : defaultLeftItems;
  const finalRightItems = rightItems;

  const headerClasses = [
    styles.header,
    isFixed ? styles['header--fixed'] : '',
    showShadow ? styles['header--shadow'] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <header
      className={headerClasses}
      role="banner"
      data-testid={testId}
      {...props}
    >
      <div className={styles.header__container}>
        {/* 좌측 영역 */}
        <div className={styles.header__left}>
          {renderHeaderItems(finalLeftItems)}
        </div>

        {/* 중앙 영역 (필요 시 사용) */}
        {children && (
          <div className={styles.header__center}>
            {children}
          </div>
        )}

        {/* 우측 영역 */}
        <div className={styles.header__right}>
          {renderHeaderItems(finalRightItems)}
        </div>
      </div>
    </header>
  );
};

// Header 컴포넌트의 정적 메서드들
Header.displayName = 'Header';

// 기본 사용자 프로필을 생성하는 헬퍼 함수
export const createUserProfileItems = (user: User): HeaderItem[] => [
  {
    type: 'component',
    component: (
      <UserProfile
        user={user}
        avatarSize="md"
        showEmail={true}
        preferNickname={true}
      />
    ),
    className: 'profile',
  }
];

// 기본 로고 아이템을 생성하는 헬퍼 함수  
export const createLogoItem = (onClick?: () => void): HeaderItem => ({
  type: 'component',
  component: <Logo size="md" {...(onClick && { onClick })} priority={true} />,
  className: 'logo',
});

export default Header;