/**
 * 환경변수 설정 (FSD shared 레이어)
 * lib/config.ts에서 마이그레이션
 */

export {
  normalizeUrl,
  API_BASE_URL,
  SOCKET_URL,
  APP_URL,
  isDevelopment,
  isProduction,
  validateEnvironment,
  createApiUrl,
  createSocketUrl,
  isValidUrl,
  getEnvironmentInfo,
  default as config
} from '../../../lib/config';