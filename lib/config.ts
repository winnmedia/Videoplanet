/**
 * 환경변수 설정 파일
 * VideoPlanet 프로젝트 - 통합 API 설정
 */

/**
 * URL 정규화 함수
 * - 프로토콜이 없는 URL에 자동으로 https:// 추가
 * - 중복 슬래시 제거
 * - 트레일링 슬래시 제거
 */
export const normalizeUrl = (url: string): string => {
  if (!url || url === 'undefined') {
    throw new Error('URL cannot be empty or undefined');
  }

  let normalizedUrl = url.trim();

  // 프로토콜이 없으면 https:// 추가
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // 중복 슬래시 제거 (프로토콜 부분은 제외)
  normalizedUrl = normalizedUrl.replace(/([^:]\/)\/+/g, '$1');

  // 트레일링 슬래시 제거
  normalizedUrl = normalizedUrl.replace(/\/$/, '');

  return normalizedUrl;
};

/**
 * 환경변수에서 API URL 추출 및 정규화
 */
const getRawApiUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||  // Vercel에 설정된 환경변수
    process.env.NEXT_PUBLIC_BACKEND_API_URL || 
    process.env.REACT_APP_BACKEND_API_URL || 
    'https://videoplanet.up.railway.app'
  );
};

// API 기본 URL 설정 (정규화 적용)
export const API_BASE_URL = normalizeUrl(getRawApiUrl());

/**
 * WebSocket URL 정규화 (wss:// 프로토콜 사용)
 */
const normalizeWebSocketUrl = (url: string): string => {
  if (!url || url === 'undefined') {
    throw new Error('WebSocket URL cannot be empty or undefined');
  }

  let normalizedUrl = url.trim();

  // HTTP 프로토콜을 WebSocket 프로토콜로 변환
  if (normalizedUrl.startsWith('https://')) {
    normalizedUrl = normalizedUrl.replace('https://', 'wss://');
  } else if (normalizedUrl.startsWith('http://')) {
    normalizedUrl = normalizedUrl.replace('http://', 'ws://');
  } else if (!normalizedUrl.startsWith('ws://') && !normalizedUrl.startsWith('wss://')) {
    // 프로토콜이 없으면 wss:// 추가
    normalizedUrl = `wss://${normalizedUrl}`;
  }

  // 중복 슬래시 제거 및 트레일링 슬래시 제거
  normalizedUrl = normalizedUrl.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '');

  return normalizedUrl;
};

/**
 * 환경변수에서 WebSocket URL 추출 및 정규화
 */
const getRawSocketUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_WS_URL ||  // Vercel에 설정된 환경변수
    process.env.NEXT_PUBLIC_SOCKET_URI || 
    process.env.REACT_APP_SOCKET_URI || 
    'wss://videoplanet.up.railway.app'
  );
};

/**
 * 환경변수에서 APP URL 추출 및 정규화
 */
const getRawAppUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_APP ||  // Vercel에 설정된 환경변수
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ||  // Vercel에 설정된 환경변수
    'https://videoplanet.vercel.app'
  );
};

// WebSocket URL 설정 (정규화 적용)
export const SOCKET_URL = normalizeWebSocketUrl(getRawSocketUrl());

// 프론트엔드 앱 URL (정규화 적용)
export const APP_URL = normalizeUrl(getRawAppUrl());

// 환경 변수 검증 및 로깅
if (typeof window === 'undefined') {
  // 서버 사이드에서만 로깅
  console.log('Environment Configuration (Server-side):')
  console.log('- API_BASE_URL:', API_BASE_URL)
  console.log('- SOCKET_URL:', SOCKET_URL)
  console.log('- APP_URL:', APP_URL)
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- Raw API URL:', getRawApiUrl())
} else {
  // 클라이언트 사이드에서 환경변수 확인
  console.log('Environment Configuration (Client-side):')
  console.log('- API_BASE_URL configured:', API_BASE_URL)
  console.log('- SOCKET_URL configured:', SOCKET_URL)
  
  // 프로토콜 확인
  if (!API_BASE_URL.startsWith('https://') && !API_BASE_URL.startsWith('http://')) {
    console.error('[ERROR] API_BASE_URL is missing protocol:', API_BASE_URL)
  }
  
  if (API_BASE_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('[WARNING] Using localhost API URL in production environment')
  }
}

// 환경변수 검증 함수 (강화된 버전)
export const validateEnvironment = () => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // API_BASE_URL 검증
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    errors.push('API_BASE_URL is not configured')
  } else {
    // 프로토콜 검증
    if (!API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
      errors.push(`API_BASE_URL missing protocol: ${API_BASE_URL}`)
    }
    
    // 잘못된 URL 패턴 검증
    if (API_BASE_URL.includes('www.vlanet.net')) {
      errors.push(`API_BASE_URL contains invalid domain pattern: ${API_BASE_URL}`)
    }
    
    // 프로덕션 환경에서 localhost 사용 검증
    if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
      warnings.push('Production environment should not use localhost API')
    }
  }
  
  // SOCKET_URL 검증
  if (!SOCKET_URL || SOCKET_URL === 'undefined') {
    errors.push('SOCKET_URL is not configured')
  } else {
    if (!SOCKET_URL.startsWith('ws://') && !SOCKET_URL.startsWith('wss://')) {
      errors.push(`SOCKET_URL missing WebSocket protocol: ${SOCKET_URL}`)
    }
  }
  
  // APP_URL 검증
  if (!APP_URL || APP_URL === 'undefined') {
    errors.push('APP_URL is not configured')
  } else {
    if (!APP_URL.startsWith('http://') && !APP_URL.startsWith('https://')) {
      errors.push(`APP_URL missing protocol: ${APP_URL}`)
    }
  }
  
  // 경고 출력
  if (warnings.length > 0) {
    console.warn('Environment configuration warnings:', warnings)
  }
  
  // 에러 처리
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors)
    throw new Error(`Environment configuration invalid: ${errors.join(', ')}`)
  }
  
  console.log('✅ Environment validation passed')
  return true
}

// 개발 환경 여부 확인
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// API 엔드포인트 생성 헬퍼 (향상된 버전)
export const createApiUrl = (path: string): string => {
  if (!path) {
    throw new Error('API path cannot be empty')
  }
  
  // path가 '/'로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // 중복 슬래시 제거
  const fullUrl = `${API_BASE_URL}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1')
  
  return fullUrl
}

// WebSocket URL 생성 헬퍼 (향상된 버전)
export const createSocketUrl = (path: string): string => {
  if (!path) {
    throw new Error('WebSocket path cannot be empty')
  }
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // 중복 슬래시 제거
  const fullUrl = `${SOCKET_URL}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1')
  
  return fullUrl
}

/**
 * URL 유효성 검사 함수
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:', 'ws:', 'wss:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 현재 설정된 모든 URL 정보 반환
 */
export const getEnvironmentInfo = () => {
  return {
    API_BASE_URL,
    SOCKET_URL,
    APP_URL,
    isDevelopment,
    isProduction,
    raw: {
      api: getRawApiUrl(),
      socket: getRawSocketUrl(),
      app: getRawAppUrl(),
    },
    validation: {
      apiValid: isValidUrl(API_BASE_URL),
      socketValid: isValidUrl(SOCKET_URL),
      appValid: isValidUrl(APP_URL),
    }
  }
}

export default {
  API_BASE_URL,
  SOCKET_URL,
  APP_URL,
  isDevelopment,
  isProduction,
  validateEnvironment,
  createApiUrl,
  createSocketUrl,
  normalizeUrl,
  normalizeWebSocketUrl,
  isValidUrl,
  getEnvironmentInfo,
}