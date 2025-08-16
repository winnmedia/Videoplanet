'use client';

import './PageTemplate.scss';
import cx from 'classnames';
import { useNavigate } from '../../utils/navigation-adapter';

import logo from 'src/assets/images/Common/b_logo.svg';
import profile from 'src/assets/images/Cms/profie_sample.png';
import Header from './Header';
import LoginIntro from './LoginIntro';
import { useEffect } from 'react';
import { checkSession } from 'src/utils/util';
import { useSelector } from 'react-redux';

// TypeScript 타입 정의
interface HeaderItem {
  type: 'img' | 'string';
  className?: string;
  src?: string;
  text?: string;
  onClick?: () => void;
  alt?: string;
}

interface User {
  id?: string | number;
  name?: string;
  email?: string;
}

interface ProjectStoreState {
  nickname?: string;
  user?: User;
}

interface RootState {
  ProjectStore: ProjectStoreState;
}

interface PageTemplateProps {
  leftItems?: HeaderItem[];
  rightItems?: HeaderItem[];
  header?: boolean;
  footer?: boolean;
  navigation?: boolean;
  children?: React.ReactNode;
  auth?: boolean;
  props?: Record<string, any>;
  noLogin?: boolean;
}

export default function PageTemplate({
  // 초기값 지정
  leftItems,
  rightItems = [],
  header = true,
  footer = false,
  navigation = true,
  children,
  auth,
  props,
  noLogin,
}: PageTemplateProps) {
  const navigate = useNavigate();
  const { nickname, user } = useSelector((s: RootState) => s.ProjectStore);

  useEffect(() => {
    if (!noLogin) {
      const session = checkSession();
      if (!session) {
        navigate('/Login', { replace: true });
      }
    }
  }, [noLogin, navigate]);

  // leftItems 기본값 설정
  const defaultLeftItems: HeaderItem[] = leftItems || [
    {
      type: 'img',
      src: logo,
      className: 'logo',
    },
  ];

  // rightItems 동적 설정
  const finalRightItems: HeaderItem[] = nickname
    ? [
        {
          type: 'string',
          className: 'nick',
          text: nickname.substr(0, 1),
        },
        {
          type: 'string',
          className: 'mail',
          text: user ? (typeof user === 'string' ? user : user.name || user.email || '') : nickname,
        },
      ]
    : rightItems;

  return (
    <div className={cx('PageTemplate', { auth: auth })}>
      {auth ? (
        <>
          <LoginIntro />
          {children}
        </>
      ) : (
        <>
          {header && (
            <Header leftItems={defaultLeftItems} rightItems={finalRightItems} />
          )}
          {children}
        </>
      )}
    </div>
  );
}
