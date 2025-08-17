export type {
  HeaderItem,
  User,
  HeaderProps,
  HeaderConfig,
  HeaderTheme,
  HeaderItemConfig,
} from './types';

import type { HeaderConfig, HeaderItem, User, HeaderTheme, HeaderProps } from './types';

// 기본 헤더 설정값
export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  fixed: false,
  shadow: true,
  transparent: false,
  sticky: false,
};

// 헤더 테마 설정
export const HEADER_THEMES: Record<HeaderTheme, Partial<HeaderProps>> = {
  light: {
    className: 'header--light',
    showShadow: true,
  },
  dark: {
    className: 'header--dark',
    showShadow: false,
  },
  transparent: {
    className: 'header--transparent',
    showShadow: false,
  },
};

// 반응형 브레이크포인트
export const HEADER_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;