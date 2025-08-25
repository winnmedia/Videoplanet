/**
 * Enhanced Video Player 아이콘 컴포넌트
 * SVG 아이콘을 React 컴포넌트로 제공
 */

import React from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

export const UploadIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M7 10L12 5L17 10M12 5V18" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M5 19H19" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const ReplaceIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M4 12V9C4 6.79086 5.79086 5 8 5H16C18.2091 5 20 6.79086 20 9V12M16 10L12 14L8 10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 14V21" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const FeedbackIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5115 20 9.09625 19.6863 7.80822 19.1164L3 20L4.30455 16.0774C3.47607 14.8952 3 13.4995 3 12C3 7.582 7.03 4 12 4C16.97 4 21 7.582 21 12Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

export const ScreenshotIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <rect 
      x="3" 
      y="6" 
      width="18" 
      height="12" 
      rx="2" 
      stroke={color} 
      strokeWidth="2"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      stroke={color} 
      strokeWidth="2"
    />
    <path 
      d="M7 3H9M15 3H17M7 21H9M15 21H17" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const ShareIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path 
      d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path 
      d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path 
      d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const PlayIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M5 3L19 12L5 21V3Z" 
      fill={color}
    />
  </svg>
)

export const PauseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <rect x="6" y="4" width="4" height="16" fill={color} />
    <rect x="14" y="4" width="4" height="16" fill={color} />
  </svg>
)