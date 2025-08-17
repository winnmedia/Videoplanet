/**
 * 환경변수 설정 파일
 * VideoPlanet 프로젝트 - 통합 API 설정
 */

// API 기본 URL 설정 (우선순위: NEXT_PUBLIC > REACT_APP > 기본값)
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 
  process.env.REACT_APP_BACKEND_API_URL || 
  'https://videoplanet-backend.railway.app'

// WebSocket URL 설정
export const SOCKET_URL = 
  process.env.NEXT_PUBLIC_SOCKET_URI || 
  process.env.REACT_APP_SOCKET_URI || 
  'wss://videoplanet-backend.railway.app'

// 프론트엔드 앱 URL
export const APP_URL = 
  process.env.NEXT_PUBLIC_APP_URL || 
  'https://videoplanet.vercel.app'

// 환경 변수 검증 및 로깅
if (typeof window === 'undefined') {
  // 서버 사이드에서만 로깅
  console.log('Environment Configuration:')
  console.log('- API_BASE_URL:', API_BASE_URL)
  console.log('- SOCKET_URL:', SOCKET_URL)
  console.log('- APP_URL:', APP_URL)
  console.log('- NODE_ENV:', process.env.NODE_ENV)
} else {
  // 클라이언트 사이드에서 환경변수 확인
  console.log('Client Environment Check:')
  console.log('- API_BASE_URL configured:', API_BASE_URL)
  
  if (API_BASE_URL.includes('localhost')) {
    console.warn('⚠️ Using localhost API URL in production environment')
  }
}

// 환경변수 검증 함수
export const validateEnvironment = () => {
  const errors = []
  
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    errors.push('API_BASE_URL is not configured')
  }
  
  if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
    errors.push('Production environment should not use localhost API')
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors)
    throw new Error(`Environment configuration invalid: ${errors.join(', ')}`)
  }
  
  return true
}

// 개발 환경 여부 확인
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// API 엔드포인트 생성 헬퍼
export const createApiUrl = (path: string): string => {
  // path가 '/'로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

// WebSocket URL 생성 헬퍼
export const createSocketUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${SOCKET_URL}${normalizedPath}`
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
}