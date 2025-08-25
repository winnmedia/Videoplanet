/**
 * 아이콘 레지스트리
 * 모든 SVG 아이콘 데이터를 중앙 관리
 */

import { IconType, IconData, IconMap } from './types';

/**
 * 아이콘 데이터 매핑
 * Tree-shakeable 구조로 필요한 아이콘만 번들에 포함
 */
export const iconRegistry: IconMap = {
  // Navigation Icons
  [IconType.ARROW_UP]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 19V5M5 12l7-7 7 7' }
    ]
  },
  [IconType.ARROW_DOWN]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 5v14M19 12l-7 7-7-7' }
    ]
  },
  [IconType.ARROW_LEFT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M19 12H5M12 19l-7-7 7-7' }
    ]
  },
  [IconType.ARROW_RIGHT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M5 12h14M12 5l7 7-7 7' }
    ]
  },
  [IconType.CHEVRON_UP]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 15l-6-6-6 6' }
    ]
  },
  [IconType.CHEVRON_DOWN]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 9l6 6 6-6' }
    ]
  },
  [IconType.CHEVRON_LEFT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M15 18l-6-6 6-6' }
    ]
  },
  [IconType.CHEVRON_RIGHT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M9 18l6-6-6-6' }
    ]
  },
  [IconType.MENU]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 12h18M3 6h18M3 18h18' }
    ]
  },
  [IconType.CLOSE]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 6L6 18M6 6l12 12' }
    ]
  },
  [IconType.HOME]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
      { d: 'M9 22V12h6v10' }
    ]
  },
  [IconType.BACK]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M19 12H5M12 19l-7-7 7-7' }
    ]
  },
  
  // Action Icons
  [IconType.ADD]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 5v14M5 12h14' }
    ]
  },
  [IconType.EDIT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' },
      { d: 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' }
    ]
  },
  [IconType.DELETE]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z' }
    ]
  },
  [IconType.SAVE]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z' },
      { d: 'M17 21v-8H7v8M7 3v5h8' }
    ]
  },
  [IconType.COPY]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 }
    ],
    paths: [
      { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' }
    ]
  },
  [IconType.SEARCH]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 11, cy: 11, r: 8 }
    ],
    paths: [
      { d: 'M21 21l-4.35-4.35' }
    ]
  },
  [IconType.FILTER]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z' }
    ]
  },
  [IconType.DOWNLOAD]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' }
    ]
  },
  [IconType.UPLOAD]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' }
    ]
  },
  [IconType.SHARE]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 18, cy: 5, r: 3 },
      { cx: 6, cy: 12, r: 3 },
      { cx: 18, cy: 19, r: 3 }
    ],
    paths: [
      { d: 'M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98' }
    ]
  },
  
  // Media Icons
  [IconType.PLAY]: {
    viewBox: '0 0 24 24',
    polygons: [
      { points: '5 3 19 12 5 21 5 3', fill: 'currentColor' }
    ]
  },
  [IconType.PAUSE]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 6, y: 4, width: 4, height: 16, fill: 'currentColor' },
      { x: 14, y: 4, width: 4, height: 16, fill: 'currentColor' }
    ]
  },
  [IconType.STOP]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 5, y: 5, width: 14, height: 14, rx: 2, fill: 'currentColor' }
    ]
  },
  [IconType.CAMERA]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z' }
    ],
    circles: [
      { cx: 12, cy: 13, r: 4 }
    ]
  },
  [IconType.VIDEO]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M23 7l-7 5 7 5V7z' }
    ],
    rects: [
      { x: 1, y: 5, width: 15, height: 14, rx: 2 }
    ]
  },
  
  // Status Icons
  [IconType.CHECK]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20 6L9 17l-5-5' }
    ]
  },
  [IconType.CHECK_CIRCLE]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M9 12l2 2 4-4' }
    ]
  },
  [IconType.ERROR_CIRCLE]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M15 9l-6 6M9 9l6 6' }
    ]
  },
  [IconType.WARNING]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
      { d: 'M12 9v4M12 17h.01' }
    ]
  },
  [IconType.INFO]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M12 16v-4M12 8h.01' }
    ]
  },
  [IconType.HELP]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01' }
    ]
  },
  [IconType.STAR]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
    ]
  },
  [IconType.STAR_FILLED]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', fill: 'currentColor' }
    ]
  },
  [IconType.HEART]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' }
    ]
  },
  [IconType.HEART_FILLED]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z', fill: 'currentColor' }
    ]
  },
  [IconType.THUMB_UP]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3' }
    ]
  },
  [IconType.THUMB_DOWN]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17' }
    ]
  },
  
  // User & Social Icons
  [IconType.USER]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' }
    ],
    circles: [
      { cx: 12, cy: 7, r: 4 }
    ]
  },
  [IconType.USERS]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
      { d: 'M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
    ],
    circles: [
      { cx: 9, cy: 7, r: 4 }
    ]
  },
  [IconType.LOCK]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 }
    ],
    paths: [
      { d: 'M7 11V7a5 5 0 0110 0v4' }
    ]
  },
  [IconType.UNLOCK]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 }
    ],
    paths: [
      { d: 'M7 11V7a5 5 0 019.9-1' }
    ]
  },
  
  // Communication Icons
  [IconType.MAIL]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
      { d: 'M22 6l-10 7L2 6' }
    ]
  },
  [IconType.SEND]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' }
    ]
  },
  [IconType.CHAT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' }
    ]
  },
  [IconType.COMMENT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' }
    ]
  },
  [IconType.BELL]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0' }
    ]
  },
  
  // File & Folder Icons
  [IconType.FILE]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z' },
      { d: 'M13 2v7h7' }
    ]
  },
  [IconType.FOLDER]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' }
    ]
  },
  [IconType.FOLDER_OPEN]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' },
      { d: 'M2 10h20' }
    ]
  },
  
  // Business & Data Icons
  [IconType.CALENDAR]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }
    ],
    paths: [
      { d: 'M16 2v4M8 2v4M3 10h18' }
    ]
  },
  [IconType.CLOCK]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M12 6v6l4 2' }
    ]
  },
  [IconType.CHART]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 20V10M12 20V4M6 20v-6' }
    ]
  },
  [IconType.DASHBOARD]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 3, width: 7, height: 7 },
      { x: 14, y: 3, width: 7, height: 7 },
      { x: 14, y: 14, width: 7, height: 7 },
      { x: 3, y: 14, width: 7, height: 7 }
    ]
  },
  
  // UI Elements Icons
  [IconType.SETTINGS]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 3 }
    ],
    paths: [
      { d: 'M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' }
    ]
  },
  [IconType.GRID]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 3, width: 7, height: 7 },
      { x: 14, y: 3, width: 7, height: 7 },
      { x: 14, y: 14, width: 7, height: 7 },
      { x: 3, y: 14, width: 7, height: 7 }
    ]
  },
  [IconType.LIST]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }
    ]
  },
  [IconType.MORE_HORIZONTAL]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 1, fill: 'currentColor' },
      { cx: 19, cy: 12, r: 1, fill: 'currentColor' },
      { cx: 5, cy: 12, r: 1, fill: 'currentColor' }
    ]
  },
  [IconType.MORE_VERTICAL]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 1, fill: 'currentColor' },
      { cx: 12, cy: 5, r: 1, fill: 'currentColor' },
      { cx: 12, cy: 19, r: 1, fill: 'currentColor' }
    ]
  },
  [IconType.PIN]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48' }
    ]
  },
  
  // Project Specific Icons
  [IconType.PROJECT]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 3h18v18H3zM3 9h18M9 21V9' }
    ]
  },
  [IconType.PLANNING]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
      { d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8' }
    ]
  },
  [IconType.FEEDBACK]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
      { d: 'M8 12h.01M12 12h.01M16 12h.01' }
    ]
  },
  [IconType.STORYBOARD]: {
    viewBox: '0 0 24 24',
    rects: [
      { x: 3, y: 3, width: 7, height: 5 },
      { x: 14, y: 3, width: 7, height: 5 },
      { x: 3, y: 11, width: 7, height: 5 },
      { x: 14, y: 11, width: 7, height: 5 },
      { x: 3, y: 19, width: 7, height: 2 },
      { x: 14, y: 19, width: 7, height: 2 }
    ]
  },
  [IconType.TIMELINE]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 2v20M2 12h20' }
    ],
    circles: [
      { cx: 12, cy: 6, r: 2, fill: 'currentColor' },
      { cx: 12, cy: 12, r: 2, fill: 'currentColor' },
      { cx: 12, cy: 18, r: 2, fill: 'currentColor' }
    ]
  },
  
  // Miscellaneous Icons
  [IconType.LINK]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71' },
      { d: 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' }
    ]
  },
  [IconType.EXTERNAL_LINK]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3' }
    ]
  },
  [IconType.GLOBE]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10 }
    ],
    paths: [
      { d: 'M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' }
    ]
  },
  [IconType.CLOUD]: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z' }
    ]
  },
  [IconType.LOADING]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10, strokeWidth: 3, stroke: 'currentColor', strokeOpacity: 0.25 }
    ],
    paths: [
      { 
        d: 'M12 2a10 10 0 010 20', 
        stroke: 'currentColor',
        strokeWidth: 3,
        strokeLinecap: 'round'
      }
    ]
  },
  [IconType.SPINNER]: {
    viewBox: '0 0 24 24',
    circles: [
      { cx: 12, cy: 12, r: 10, strokeWidth: 3, stroke: 'currentColor', strokeOpacity: 0.25 }
    ],
    paths: [
      { 
        d: 'M12 2a10 10 0 010 20', 
        stroke: 'currentColor',
        strokeWidth: 3,
        strokeLinecap: 'round'
      }
    ]
  }
};

/**
 * 아이콘 존재 여부 체크
 */
export const hasIcon = (type: IconType | string): boolean => {
  return type in iconRegistry;
};

/**
 * 아이콘 데이터 가져오기
 */
export const getIconData = (type: IconType | string): IconData | null => {
  return iconRegistry[type] || null;
};