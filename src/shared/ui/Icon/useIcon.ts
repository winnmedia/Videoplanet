/**
 * useIcon 훅
 * 아이콘 관련 유틸리티 함수들을 제공
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { IconType, IconName, IconVariant, IconSize } from './Icon';
import { iconMap } from './iconMap';

interface UseIconOptions {
  type?: IconType;
  name?: IconName | string;
  size?: IconSize;
  variant?: IconVariant;
  darkMode?: boolean;
  animate?: boolean;
}

interface UseIconReturn {
  /** 아이콘 존재 여부 */
  exists: boolean;
  /** 계산된 크기 */
  computedSize: number;
  /** 계산된 색상 */
  computedColor: string;
  /** 시스템 다크모드 여부 */
  systemDarkMode: boolean;
  /** 최종 다크모드 여부 */
  isDarkMode: boolean;
  /** 아이콘 데이터 존재 여부 */
  hasIcon: boolean;
  /** 아이콘 타입 변경 */
  setType: (type: IconType) => void;
  /** 크기 변경 */
  setSize: (size: IconSize) => void;
  /** 변형 변경 */
  setVariant: (variant: IconVariant) => void;
  /** 애니메이션 토글 */
  toggleAnimation: () => void;
}

// Size mappings
const sizeMap: Record<string, number> = {
  xs: 16,
  sm: 20,
  small: 16,
  md: 24,
  medium: 24,
  lg: 32,
  large: 32,
  xl: 40,
};

// Variant color mappings
const variantColorMap: Record<IconVariant, string> = {
  primary: 'var(--color-primary, #1631F8)',
  secondary: 'var(--color-secondary, #6c757d)',
  success: 'var(--color-success, #28a745)',
  warning: 'var(--color-warning, #ffc107)',
  error: 'var(--color-error, #dc3545)',
  info: 'var(--color-info, #17a2b8)',
  neutral: 'currentColor',
};

/**
 * 아이콘 관련 상태와 유틸리티를 제공하는 훅
 */
export const useIcon = (options: UseIconOptions = {}): UseIconReturn => {
  const {
    type: initialType,
    name: initialName,
    size: initialSize = 'md',
    variant: initialVariant = 'neutral',
    darkMode,
    animate: initialAnimate = false,
  } = options;

  // 상태 관리
  const [type, setType] = useState(initialType || initialName);
  const [size, setSize] = useState(initialSize);
  const [variant, setVariant] = useState(initialVariant);
  const [animate, setAnimate] = useState(initialAnimate);
  const [systemDarkMode, setSystemDarkMode] = useState(false);

  // 시스템 다크모드 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 다크모드 최종 결정
  const isDarkMode = useMemo(() => {
    return darkMode !== undefined ? darkMode : systemDarkMode;
  }, [darkMode, systemDarkMode]);

  // 아이콘 존재 여부
  const exists = useMemo(() => {
    return type ? !!iconMap[type as IconName] : false;
  }, [type]);

  // 계산된 크기
  const computedSize = useMemo(() => {
    if (typeof size === 'number') return size;
    return sizeMap[size] || 24;
  }, [size]);

  // 계산된 색상
  const computedColor = useMemo(() => {
    if (variant === 'neutral') return 'currentColor';
    return variantColorMap[variant];
  }, [variant]);

  // 애니메이션 토글
  const toggleAnimation = useCallback(() => {
    setAnimate(prev => !prev);
  }, []);

  return {
    exists,
    computedSize,
    computedColor,
    systemDarkMode,
    isDarkMode,
    hasIcon: exists,
    setType,
    setSize,
    setVariant,
    toggleAnimation,
  };
};

/**
 * 아이콘 프리로더 훅
 * 특정 아이콘들을 미리 로드하여 성능 최적화
 */
export const useIconPreloader = (icons: (IconType | string)[]) => {
  const [loaded, setLoaded] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Set<IconType | string>>(new Set());

  useEffect(() => {
    const preloadIcons = async () => {
      const loadPromises = icons.map(async (icon) => {
        if (iconMap[icon as IconName]) {
          setLoadedIcons(prev => new Set([...prev, icon]));
        }
      });

      await Promise.all(loadPromises);
      setLoaded(true);
    };

    preloadIcons();
  }, [icons]);

  return { loaded, loadedIcons };
};

/**
 * 아이콘 검색 훅
 * 키워드로 아이콘을 검색
 */
export const useIconSearch = (query: string = '') => {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const matchedIcons = Object.keys(iconMap).filter(iconName => {
      return iconName.toLowerCase().includes(searchQuery);
    });

    setResults(matchedIcons);
  }, [query]);

  return results;
};

/**
 * 아이콘 카테고리 필터 훅
 */
export const useIconCategory = (category?: string) => {
  const [icons, setIcons] = useState<string[]>([]);

  useEffect(() => {
    if (!category) {
      setIcons(Object.keys(iconMap));
      return;
    }

    // 카테고리별 아이콘 분류 (간단한 예시)
    const categoryMap: Record<string, string[]> = {
      navigation: [
        'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
        'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
        'menu', 'close', 'home', 'back',
      ],
      action: [
        'add', 'edit', 'delete', 'save', 'copy',
        'search', 'filter', 'download', 'upload', 'share',
      ],
      media: [
        'play', 'pause', 'stop', 'camera', 'video',
        'fast-forward', 'rewind', 'record',
      ],
      status: [
        'check', 'error', 'warning', 'info', 'help',
        'star', 'heart', 'like', 'dislike',
      ],
      communication: [
        'comment', 'reply', 'send', 'notification', 'bell',
        'share', 'link',
      ],
    };

    setIcons(categoryMap[category.toLowerCase()] || []);
  }, [category]);

  return icons;
};

// Helper functions
export const hasIcon = (name: string): boolean => {
  return !!iconMap[name as IconName];
};

export const getIconNames = (): string[] => {
  return Object.keys(iconMap);
};