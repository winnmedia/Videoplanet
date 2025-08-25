/**
 * 통합 아이콘 시스템 타입 정의
 * Tree-shakeable 구조와 접근성 지원
 */

import { CSSProperties } from 'react';

/**
 * 아이콘 크기 프리셋
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

/**
 * 아이콘 variant (색상 테마)
 */
export type IconVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral';

/**
 * 아이콘 타입 enum
 */
export enum IconType {
  // Navigation
  ARROW_UP = 'arrow-up',
  ARROW_DOWN = 'arrow-down',
  ARROW_LEFT = 'arrow-left',
  ARROW_RIGHT = 'arrow-right',
  CHEVRON_UP = 'chevron-up',
  CHEVRON_DOWN = 'chevron-down',
  CHEVRON_LEFT = 'chevron-left',
  CHEVRON_RIGHT = 'chevron-right',
  MENU = 'menu',
  CLOSE = 'close',
  HOME = 'home',
  BACK = 'back',
  
  // Actions
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  SAVE = 'save',
  COPY = 'copy',
  PASTE = 'paste',
  CUT = 'cut',
  SEARCH = 'search',
  FILTER = 'filter',
  SORT = 'sort',
  REFRESH = 'refresh',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SHARE = 'share',
  PRINT = 'print',
  
  // Media
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  RECORD = 'record',
  FAST_FORWARD = 'fast-forward',
  REWIND = 'rewind',
  VOLUME_UP = 'volume-up',
  VOLUME_DOWN = 'volume-down',
  VOLUME_MUTE = 'volume-mute',
  FULLSCREEN = 'fullscreen',
  FULLSCREEN_EXIT = 'fullscreen-exit',
  CAMERA = 'camera',
  VIDEO = 'video',
  IMAGE = 'image',
  MICROPHONE = 'microphone',
  
  // Status
  CHECK = 'check',
  CHECK_CIRCLE = 'check-circle',
  ERROR_CIRCLE = 'error-circle',
  WARNING = 'warning',
  INFO = 'info',
  HELP = 'help',
  QUESTION = 'question',
  EXCLAMATION = 'exclamation',
  STAR = 'star',
  STAR_FILLED = 'star-filled',
  HEART = 'heart',
  HEART_FILLED = 'heart-filled',
  THUMB_UP = 'thumb-up',
  THUMB_DOWN = 'thumb-down',
  
  // User & Social
  USER = 'user',
  USERS = 'users',
  USER_ADD = 'user-add',
  USER_REMOVE = 'user-remove',
  PROFILE = 'profile',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  KEY = 'key',
  SHIELD = 'shield',
  
  // Communication
  MAIL = 'mail',
  MAIL_OPEN = 'mail-open',
  SEND = 'send',
  INBOX = 'inbox',
  CHAT = 'chat',
  COMMENT = 'comment',
  NOTIFICATION = 'notification',
  BELL = 'bell',
  
  // File & Folder
  FILE = 'file',
  FILE_ADD = 'file-add',
  FILE_REMOVE = 'file-remove',
  FOLDER = 'folder',
  FOLDER_OPEN = 'folder-open',
  FOLDER_ADD = 'folder-add',
  DOCUMENT = 'document',
  PDF = 'pdf',
  ZIP = 'zip',
  
  // Business & Data
  CALENDAR = 'calendar',
  CLOCK = 'clock',
  TIME = 'time',
  CHART = 'chart',
  GRAPH = 'graph',
  ANALYTICS = 'analytics',
  DASHBOARD = 'dashboard',
  BRIEFCASE = 'briefcase',
  MONEY = 'money',
  CREDIT_CARD = 'credit-card',
  
  // UI Elements
  SETTINGS = 'settings',
  GEAR = 'gear',
  TOOL = 'tool',
  GRID = 'grid',
  LIST = 'list',
  LAYOUT = 'layout',
  SIDEBAR = 'sidebar',
  EXPAND = 'expand',
  COLLAPSE = 'collapse',
  MORE_HORIZONTAL = 'more-horizontal',
  MORE_VERTICAL = 'more-vertical',
  DRAG = 'drag',
  PIN = 'pin',
  UNPIN = 'unpin',
  
  // Project Specific
  PROJECT = 'project',
  PLANNING = 'planning',
  FEEDBACK = 'feedback',
  STORYBOARD = 'storyboard',
  TIMELINE = 'timeline',
  MILESTONE = 'milestone',
  TASK = 'task',
  SUBTASK = 'subtask',
  PROGRESS = 'progress',
  COMPLETE = 'complete',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  
  // Miscellaneous
  LINK = 'link',
  EXTERNAL_LINK = 'external-link',
  ATTACHMENT = 'attachment',
  TAG = 'tag',
  BOOKMARK = 'bookmark',
  FLAG = 'flag',
  GLOBE = 'globe',
  MAP = 'map',
  LOCATION = 'location',
  WIFI = 'wifi',
  BATTERY = 'battery',
  CLOUD = 'cloud',
  CLOUD_UPLOAD = 'cloud-upload',
  CLOUD_DOWNLOAD = 'cloud-download',
  SYNC = 'sync',
  LOADING = 'loading',
  SPINNER = 'spinner',
}

/**
 * 아이콘 컴포넌트 기본 props
 */
export interface IconProps {
  /** 아이콘 타입 */
  type?: IconType | string;
  /** 아이콘 크기 */
  size?: IconSize;
  /** 아이콘 색상 */
  color?: string;
  /** 아이콘 변형 (테마 색상) */
  variant?: IconVariant;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 인라인 스타일 */
  style?: CSSProperties;
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** 접근성 숨김 처리 */
  ariaHidden?: boolean;
  /** 제목 툴팁 */
  title?: string;
  /** 회전 각도 */
  rotate?: 0 | 90 | 180 | 270;
  /** 좌우 반전 */
  flip?: boolean;
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 애니메이션 타입 */
  animationType?: 'spin' | 'pulse' | 'bounce';
  /** 클릭 이벤트 핸들러 */
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  /** 다크모드 활성화 */
  darkMode?: boolean;
  /** 아이콘 스트로크 너비 */
  strokeWidth?: number;
  /** 아이콘 채우기 규칙 */
  fillRule?: 'nonzero' | 'evenodd';
  /** viewBox 커스터마이징 */
  viewBox?: string;
}

/**
 * SVG 아이콘 데이터 구조
 */
export interface IconData {
  viewBox: string;
  paths: Array<{
    d: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    fillRule?: 'nonzero' | 'evenodd';
  }>;
  circles?: Array<{
    cx: number;
    cy: number;
    r: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }>;
  rects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number;
    ry?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }>;
  polygons?: Array<{
    points: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }>;
}

/**
 * 아이콘 매핑 타입
 */
export type IconMap = Record<IconType | string, IconData>;

/**
 * 아이콘 크기 매핑
 */
export const IconSizeMap: Record<Exclude<IconSize, number>, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

/**
 * 아이콘 색상 변형 매핑
 */
export const IconVariantColorMap: Record<IconVariant, string> = {
  primary: 'var(--color-primary, #1631F8)',
  secondary: 'var(--color-secondary, #6c757d)',
  success: 'var(--color-success, #28a745)',
  warning: 'var(--color-warning, #ffc107)',
  error: 'var(--color-error, #dc3545)',
  info: 'var(--color-info, #17a2b8)',
  neutral: 'var(--color-neutral, currentColor)',
};

/**
 * 스프라이트 아이콘 props
 */
export interface SpriteIconProps extends Omit<IconProps, 'type'> {
  /** 스프라이트 내 아이콘 ID */
  id: string;
  /** 스프라이트 URL */
  spriteUrl?: string;
}

/**
 * 아이콘 카테고리
 */
export enum IconCategory {
  NAVIGATION = 'navigation',
  ACTION = 'action',
  MEDIA = 'media',
  STATUS = 'status',
  USER = 'user',
  COMMUNICATION = 'communication',
  FILE = 'file',
  BUSINESS = 'business',
  UI = 'ui',
  PROJECT = 'project',
  MISC = 'misc',
}

/**
 * 아이콘 메타데이터
 */
export interface IconMetadata {
  type: IconType;
  name: string;
  category: IconCategory;
  keywords: string[];
  description?: string;
}