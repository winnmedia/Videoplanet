/**
 * 통합 아이콘 컴포넌트
 * Tree-shakeable SVG 아이콘 시스템
 */

import React, { forwardRef, useMemo, useEffect, useState } from 'react';
import cn from 'classnames';
import { 
  IconProps, 
  IconSizeMap, 
  IconVariantColorMap,
  IconType 
} from './types';
import { iconRegistry } from './icon-registry';
import styles from './Icon.module.scss';

/**
 * 메인 Icon 컴포넌트
 * 모든 아이콘을 통합 관리하는 컴포넌트
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      type,
      size = 'md',
      color,
      variant = 'neutral',
      className,
      style,
      ariaLabel,
      ariaHidden = !ariaLabel,
      title,
      rotate = 0,
      flip = false,
      animate = false,
      animationType = 'spin',
      onClick,
      darkMode,
      strokeWidth = 2,
      fillRule = 'evenodd',
      viewBox,
      ...restProps
    },
    ref
  ) => {
    // 시스템 다크모드 감지
    const [systemDarkMode, setSystemDarkMode] = useState(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDarkMode(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const isDarkMode = darkMode !== undefined ? darkMode : systemDarkMode;

    // 아이콘 크기 계산
    const iconSize = useMemo(() => {
      if (typeof size === 'number') return size;
      return IconSizeMap[size];
    }, [size]);

    // 아이콘 색상 계산
    const iconColor = useMemo(() => {
      if (color) return color;
      if (variant !== 'neutral') return IconVariantColorMap[variant];
      return 'currentColor';
    }, [color, variant]);

    // 아이콘 데이터 가져오기
    const iconData = useMemo(() => {
      if (!type) return null;
      return iconRegistry[type as IconType] || iconRegistry[type];
    }, [type]);

    // 변환 스타일 계산
    const transformStyle = useMemo(() => {
      const transforms: string[] = [];
      
      if (rotate !== 0) {
        transforms.push(`rotate(${rotate}deg)`);
      }
      
      if (flip) {
        transforms.push('scaleX(-1)');
      }
      
      return transforms.length > 0 ? transforms.join(' ') : undefined;
    }, [rotate, flip]);

    // 클래스 이름 조합
    const iconClasses = cn(
      styles.icon,
      'icon',
      {
        [styles[`icon--${animationType}`]]: animate,
        [`icon--${animationType}`]: animate,
        [styles['icon--clickable']]: !!onClick,
        'icon--clickable': !!onClick,
        [styles['icon--dark']]: isDarkMode,
        'icon--dark': isDarkMode,
      },
      className
    );

    // 스타일 조합
    const iconStyle = {
      width: iconSize,
      height: iconSize,
      color: iconColor,
      transform: transformStyle,
      ...style,
    };

    // 아이콘 데이터가 없으면 placeholder 반환
    if (!iconData) {
      return (
        <svg
          ref={ref}
          className={iconClasses}
          style={iconStyle}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={ariaLabel || 'Missing icon'}
          aria-hidden={ariaHidden}
          {...restProps}
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray="3 3"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
          >
            ?
          </text>
        </svg>
      );
    }

    return (
      <svg
        ref={ref}
        className={iconClasses}
        style={iconStyle}
        viewBox={viewBox || iconData.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={onClick ? 'button' : 'img'}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e as any);
                }
              }
            : undefined
        }
        {...restProps}
      >
        {title && <title>{title}</title>}
        
        {/* Paths */}
        {iconData.paths?.map((path, index) => (
          <path
            key={`path-${index}`}
            d={path.d}
            fill={path.fill || 'none'}
            stroke={path.stroke || iconColor}
            strokeWidth={path.strokeWidth || strokeWidth}
            strokeLinecap={path.strokeLinecap || 'round'}
            strokeLinejoin={path.strokeLinejoin || 'round'}
            fillRule={path.fillRule || fillRule}
          />
        ))}
        
        {/* Circles */}
        {iconData.circles?.map((circle, index) => (
          <circle
            key={`circle-${index}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill={circle.fill || 'none'}
            stroke={circle.stroke || iconColor}
            strokeWidth={circle.strokeWidth || strokeWidth}
          />
        ))}
        
        {/* Rectangles */}
        {iconData.rects?.map((rect, index) => (
          <rect
            key={`rect-${index}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={rect.rx}
            ry={rect.ry}
            fill={rect.fill || 'none'}
            stroke={rect.stroke || iconColor}
            strokeWidth={rect.strokeWidth || strokeWidth}
          />
        ))}
        
        {/* Polygons */}
        {iconData.polygons?.map((polygon, index) => (
          <polygon
            key={`polygon-${index}`}
            points={polygon.points}
            fill={polygon.fill || 'none'}
            stroke={polygon.stroke || iconColor}
            strokeWidth={polygon.strokeWidth || strokeWidth}
          />
        ))}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

/**
 * 스프라이트 기반 Icon 컴포넌트
 * 외부 SVG 스프라이트 파일 참조용
 */
export const SpriteIcon: React.FC<IconProps & { spriteUrl?: string }> = ({
  type,
  size = 'md',
  color,
  variant = 'neutral',
  className,
  style,
  ariaLabel,
  ariaHidden = !ariaLabel,
  title,
  rotate = 0,
  flip = false,
  animate = false,
  animationType = 'spin',
  onClick,
  darkMode,
  spriteUrl = '/icons/sprite.svg',
  ...restProps
}) => {
  const iconSize = typeof size === 'number' ? size : IconSizeMap[size];
  const iconColor = color || (variant !== 'neutral' ? IconVariantColorMap[variant] : 'currentColor');
  
  const transformStyle = useMemo(() => {
    const transforms: string[] = [];
    
    if (rotate !== 0) {
      transforms.push(`rotate(${rotate}deg)`);
    }
    
    if (flip) {
      transforms.push('scaleX(-1)');
    }
    
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  }, [rotate, flip]);
  
  const iconClasses = cn(
    styles.icon,
    'icon',
    {
      [styles[`icon--${animationType}`]]: animate,
      [`icon--${animationType}`]: animate,
      [styles['icon--clickable']]: !!onClick,
      'icon--clickable': !!onClick,
      [styles['icon--dark']]: darkMode,
      'icon--dark': darkMode,
    },
    className
  );
  
  const iconStyle = {
    width: iconSize,
    height: iconSize,
    color: iconColor,
    transform: transformStyle,
    ...style,
  };
  
  return (
    <svg
      className={iconClasses}
      style={iconStyle}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as any);
              }
            }
          : undefined
      }
      {...restProps}
    >
      {title && <title>{title}</title>}
      <use href={`${spriteUrl}#${type}`} />
    </svg>
  );
};

SpriteIcon.displayName = 'SpriteIcon';

/**
 * 로딩 스피너 아이콘
 */
export const LoadingIcon: React.FC<Omit<IconProps, 'type' | 'animate' | 'animationType'>> = (props) => {
  return (
    <Icon
      {...props}
      type={IconType.SPINNER}
      animate
      animationType="spin"
      ariaLabel={props.ariaLabel || 'Loading'}
    />
  );
};

LoadingIcon.displayName = 'LoadingIcon';