'use client';

import cx from 'classnames';
import { Link } from '../../utils/navigation-adapter';
import { useNavigate } from '../../utils/navigation-adapter';
import './Header.scss';

// 라우트 상수
const ROUTES = {
  HOME: '/dashboard',
  LOGIN: '/login',
} as const;

// TypeScript 타입 정의
interface HeaderItem {
  type: 'img' | 'string';
  className?: string;
  src?: string;
  text?: string;
  onClick?: () => void;
  alt?: string;
}

interface HeaderProps {
  leftItems?: HeaderItem[];
  rightItems?: HeaderItem[];
  children?: React.ReactNode;
  props?: Record<string, any>;
}

export default function Header({
  // 초기값 지정
  leftItems = [],
  rightItems = [],
  children,
  props,
}: HeaderProps) {
  const navigate = useNavigate();

  const left = makeHtml(leftItems, navigate);
  const right = makeHtml(rightItems, navigate);

  return (
    <div className="Header">
      <div>{left}</div>
      <div className="profile">{right}</div>
    </div>
  );
}

// type에 따라서 헤더의 html을 만들어주는 함수
function makeHtml(items: HeaderItem[] = [], navigate: (path: string) => void) {
  return items.map((item, i) => {
    if (item.type === 'img') {
      const button = (
        <div key={i} className={item.className}>
          <img
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(ROUTES.HOME)}
            alt={item.alt || `img_${i}`}
            src={item.src}
          />
        </div>
      );
      return button;
    } else if (item.type === 'string') {
      const element = (
        <div key={i} className={item.className}>
          {item.text}
        </div>
      );
      return element;
    }
    return null;
  });
}
