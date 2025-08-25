/**
 * useIcon 훅
 * 아이콘 관련 유틸리티 함수들을 제공
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { IconType, IconVariant, IconSize, IconSizeMap, IconVariantColorMap } from './types';
import { hasIcon, getIconData } from './icon-registry';

interface UseIconOptions {
  type?: IconType | string;
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
  /** 아이콘 데이터 */
  iconData: ReturnType<typeof getIconData>;
  /** 아이콘 타입 변경 */
  setType: (type: IconType | string) => void;
  /** 크기 변경 */
  setSize: (size: IconSize) => void;
  /** 변형 변경 */
  setVariant: (variant: IconVariant) => void;
  /** 애니메이션 토글 */
  toggleAnimation: () => void;
}

/**
 * 아이콘 관련 상태와 유틸리티를 제공하는 훅
 */
export const useIcon = (options: UseIconOptions = {}): UseIconReturn => {
  const {
    type: initialType,
    size: initialSize = 'md',
    variant: initialVariant = 'neutral',
    darkMode,
    animate: initialAnimate = false,
  } = options;

  // 상태 관리
  const [type, setType] = useState(initialType);
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
    return type ? hasIcon(type) : false;
  }, [type]);

  // 아이콘 데이터
  const iconData = useMemo(() => {
    return type ? getIconData(type) : null;
  }, [type]);

  // 계산된 크기
  const computedSize = useMemo(() => {
    if (typeof size === 'number') return size;
    return IconSizeMap[size];
  }, [size]);

  // 계산된 색상
  const computedColor = useMemo(() => {
    if (variant === 'neutral') return 'currentColor';
    return IconVariantColorMap[variant];
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
    iconData,
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
        if (hasIcon(icon)) {
          // 아이콘 데이터를 미리 가져와 캐싱
          const data = getIconData(icon);
          if (data) {
            setLoadedIcons(prev => new Set([...prev, icon]));
          }
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
  const [results, setResults] = useState<IconType[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const matchedIcons = Object.values(IconType).filter(iconType => {
      return iconType.toLowerCase().includes(searchQuery);
    });

    setResults(matchedIcons);
  }, [query]);

  return results;
};

/**
 * 아이콘 카테고리 필터 훅
 */
export const useIconCategory = (category?: string) => {
  const [icons, setIcons] = useState<IconType[]>([]);

  useEffect(() => {
    if (!category) {
      setIcons(Object.values(IconType));
      return;
    }

    // 카테고리별 아이콘 분류 (간단한 예시)
    const categoryMap: Record<string, IconType[]> = {
      navigation: [
        IconType.ARROW_UP,
        IconType.ARROW_DOWN,
        IconType.ARROW_LEFT,
        IconType.ARROW_RIGHT,
        IconType.CHEVRON_UP,
        IconType.CHEVRON_DOWN,
        IconType.CHEVRON_LEFT,
        IconType.CHEVRON_RIGHT,
        IconType.MENU,
        IconType.CLOSE,
        IconType.HOME,
        IconType.BACK,
      ],
      action: [
        IconType.ADD,
        IconType.EDIT,
        IconType.DELETE,
        IconType.SAVE,
        IconType.COPY,
        IconType.SEARCH,
        IconType.FILTER,
        IconType.DOWNLOAD,
        IconType.UPLOAD,
        IconType.SHARE,
      ],
      media: [
        IconType.PLAY,
        IconType.PAUSE,
        IconType.STOP,
        IconType.CAMERA,
        IconType.VIDEO,
      ],
      status: [
        IconType.CHECK,
        IconType.CHECK_CIRCLE,
        IconType.ERROR_CIRCLE,
        IconType.WARNING,
        IconType.INFO,
        IconType.HELP,
        IconType.STAR,
        IconType.HEART,
        IconType.THUMB_UP,
        IconType.THUMB_DOWN,
      ],
      // ... 더 많은 카테고리
    };

    setIcons(categoryMap[category.toLowerCase()] || []);
  }, [category]);

  return icons;
};