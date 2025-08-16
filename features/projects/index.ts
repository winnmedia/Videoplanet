/**
 * 프로젝트 관리 모듈 메인 인덱스 파일
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

// ===== 타입 내보내기 =====
export type * from './types';

// ===== API 내보내기 =====
export { default as projectsApi } from './api/projectsApi';
export * from './api/projectsApi';

// ===== 훅 내보내기 =====
export * from './hooks/useProjects';

// ===== 컴포넌트 내보내기 =====
export * from './components';

// ===== 기본 내보내기 =====
import type defaultExport from './types';
export type { defaultExport as default };