export interface HeaderItem {
  type: 'img' | 'string' | 'component';
  src?: string;
  alt?: string;
  text?: string;
  component?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface HeaderProps {
  leftItems?: HeaderItem[];
  rightItems?: HeaderItem[];
  isFixed?: boolean;
  showShadow?: boolean;
  onLogoClick?: (event: React.MouseEvent) => void;
  className?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
}

export interface HeaderConfig {
  fixed: boolean;
  shadow: boolean;
  transparent: boolean;
  sticky: boolean;
}

export type HeaderTheme = 'light' | 'dark' | 'transparent';

export interface HeaderItemConfig {
  position: 'left' | 'center' | 'right';
  order: number;
  responsive: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}