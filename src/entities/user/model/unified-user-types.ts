/* 통합 User 타입 정의 - 모든 중복 제거 */

export interface User {
  id: string; // 통일: string 타입으로 표준화
  email: string;
  username: string; // 통일: username으로 표준화 (name, displayName 대신)
  loginMethod: 'email' | 'google' | 'kakao' | 'naver';
  isEmailVerified: boolean;
  
  // 프로필 정보
  profileImage?: string;
  bio?: string;
  
  // 권한 및 상태
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'pending';
  
  // 타임스탬프 (통일: ISO string 형식)
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// 인증 관련 타입
export interface AuthUser extends Pick<User, 'id' | 'email' | 'username' | 'role'> {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// 사용자 생성 요청 타입
export interface CreateUserRequest {
  email: string;
  password?: string; // 소셜 로그인시 선택적
  username: string;
  loginMethod: User['loginMethod'];
}

// 사용자 업데이트 요청 타입
export interface UpdateUserRequest extends Partial<Pick<User, 'username' | 'profileImage' | 'bio'>> {
  id: string;
}

// 사용자 조회 필터
export interface UserFilter {
  role?: User['role'];
  status?: User['status'];
  loginMethod?: User['loginMethod'];
  search?: string; // username, email 검색
}

// 사용자 목록 응답
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 로그인 응답
export interface LoginResponse {
  user: AuthUser;
  message: string;
}

// 타입 가드
export const isValidUser = (obj: any): obj is User => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.username === 'string' &&
    ['email', 'google', 'kakao', 'naver'].includes(obj.loginMethod) &&
    typeof obj.isEmailVerified === 'boolean' &&
    ['user', 'admin', 'moderator'].includes(obj.role) &&
    ['active', 'suspended', 'pending'].includes(obj.status)
  );
};

// 유틸리티 함수
export const getUserDisplayName = (user: User): string => {
  return user.username || user.email.split('@')[0];
};

export const isUserActive = (user: User): boolean => {
  return user.status === 'active' && user.isEmailVerified;
};

export const canUserAccessFeature = (user: User, feature: 'admin' | 'moderation'): boolean => {
  if (feature === 'admin') return user.role === 'admin';
  if (feature === 'moderation') return ['admin', 'moderator'].includes(user.role);
  return false;
};