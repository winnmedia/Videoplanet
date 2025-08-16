/**
 * 인증 관련 유틸리티 함수들
 * VideoPlanet (VRidge) 프로젝트
 */

// 세션 체크 함수 (기존 코드와 호환성 유지)
export const checkSession = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const vgid = window.localStorage.getItem('VGID');
    return !!vgid;
  } catch (error) {
    console.error('Session check failed:', error);
    return false;
  }
};

// 토큰 가져오기
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem('VGID');
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

// 토큰 설정
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem('VGID', token);
  } catch (error) {
    console.error('Failed to set token:', error);
  }
};

// 토큰 제거 (로그아웃)
export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem('VGID');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

// 사용자 정보 로컬 저장소에서 가져오기
export const getUserFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userStr = window.localStorage.getItem('USER_INFO');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user from storage:', error);
    return null;
  }
};

// 사용자 정보 로컬 저장소에 저장
export const setUserToStorage = (user: any): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem('USER_INFO', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to set user to storage:', error);
  }
};

// 사용자 정보 로컬 저장소에서 제거
export const removeUserFromStorage = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem('USER_INFO');
  } catch (error) {
    console.error('Failed to remove user from storage:', error);
  }
};