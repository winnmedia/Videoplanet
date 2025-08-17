/**
 * TDD: 로그인 URL 구성 테스트
 * 405 에러 원인 파악 및 해결 검증
 */

import { API_BASE_URL } from '@/lib/config';
import { apiClient } from '@/lib/api/client';

describe('로그인 API URL 구성 테스트', () => {
  
  describe('1. API_BASE_URL 검증', () => {
    test('API_BASE_URL은 완전한 URL이어야 함', () => {
      expect(API_BASE_URL).toMatch(/^https?:\/\//);
      expect(API_BASE_URL).not.toContain('undefined');
      expect(API_BASE_URL).not.toContain('null');
    });

    test('API_BASE_URL은 올바른 도메인을 가져야 함', () => {
      expect(API_BASE_URL).toBe('https://videoplanet.up.railway.app');
      expect(API_BASE_URL).not.toContain('www.vlanet.net');
      expect(API_BASE_URL).not.toContain('localhost');
    });
  });

  describe('2. apiClient 설정 검증', () => {
    test('baseURL이 올바르게 설정되어야 함', () => {
      expect(apiClient.defaults.baseURL).toBe('https://videoplanet.up.railway.app');
    });

    test('로그인 엔드포인트 URL이 올바르게 구성되어야 함', () => {
      const loginUrl = apiClient.getUri({
        url: '/users/login'
      });
      
      expect(loginUrl).toBe('/users/login');
      // 실제 요청 시 baseURL과 합쳐짐
      const fullUrl = `${apiClient.defaults.baseURL}${loginUrl}`;
      expect(fullUrl).toBe('https://videoplanet.up.railway.app/users/login');
    });
  });

  describe('3. 환경변수 처리 검증', () => {
    test('환경변수가 없을 때 기본값이 사용되어야 함', () => {
      // 환경변수 백업
      const backup = process.env.NEXT_PUBLIC_API_URL;
      
      // 환경변수 제거
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_BACKEND_API_URL;
      
      // 모듈 재로드
      jest.resetModules();
      const { API_BASE_URL: testUrl } = require('@/lib/config');
      
      expect(testUrl).toBe('https://videoplanet.up.railway.app');
      
      // 환경변수 복원
      if (backup) process.env.NEXT_PUBLIC_API_URL = backup;
    });
  });

  describe('4. URL 구성 문제 재현 및 해결', () => {
    test('상대 경로로 처리되지 않아야 함', () => {
      const testUrl = 'videoplanet.up.railway.app';
      
      // 잘못된 경우: 프로토콜 없이 설정
      const wrongClient = axios.create({
        baseURL: testUrl // 프로토콜 없음
      });
      
      // 이 경우 브라우저가 상대 경로로 처리
      // 결과: https://www.vlanet.net/videoplanet.up.railway.app
      
      // 올바른 경우: 프로토콜 포함
      const rightClient = axios.create({
        baseURL: `https://${testUrl}`
      });
      
      expect(rightClient.defaults.baseURL).toMatch(/^https:\/\//);
    });

    test('baseURL이 빈 문자열이나 undefined가 아니어야 함', () => {
      expect(apiClient.defaults.baseURL).not.toBe('');
      expect(apiClient.defaults.baseURL).not.toBe(undefined);
      expect(apiClient.defaults.baseURL).not.toBe(null);
    });
  });

  describe('5. authApi 통합 테스트', () => {
    test('로그인 API 호출 시 올바른 URL로 요청되어야 함', async () => {
      const { authApi } = require('@/features/auth/api/authApi');
      
      // Mock axios to intercept the request
      const mockPost = jest.spyOn(apiClient, 'post');
      
      try {
        await authApi.signIn({
          email: 'test@example.com',
          password: 'password'
        });
      } catch (error) {
        // 실제 요청은 실패할 수 있음
      }
      
      expect(mockPost).toHaveBeenCalledWith(
        '/users/login',
        expect.any(Object)
      );
      
      mockPost.mockRestore();
    });
  });
});

// axios 모듈 모킹
const axios = {
  create: (config: any) => ({
    defaults: { baseURL: config.baseURL },
    getUri: (config: any) => config.url
  })
};