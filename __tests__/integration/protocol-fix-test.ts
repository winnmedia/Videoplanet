/**
 * 프로토콜 누락 문제 해결 검증 테스트
 * 사용자 보고 문제: 'videoplanet.up.railway.app' → 'https://www.vlanet.net/videoplanet.up.railway.app'
 */

import { normalizeUrl, API_BASE_URL } from '@/lib/config';

describe('프로토콜 누락 문제 해결 검증', () => {
  
  describe('1. normalizeUrl 함수 개선 검증', () => {
    test('프로토콜 없는 URL에 자동으로 https:// 추가', () => {
      const input = 'videoplanet.up.railway.app';
      const result = normalizeUrl(input);
      
      expect(result).toBe('https://videoplanet.up.railway.app');
      expect(result.startsWith('https://')).toBe(true);
    });

    test('이미 프로토콜이 있는 경우 그대로 유지', () => {
      const input = 'https://videoplanet.up.railway.app';
      const result = normalizeUrl(input);
      
      expect(result).toBe('https://videoplanet.up.railway.app');
    });

    test('위험한 패턴 감지 및 차단', () => {
      const dangerousUrls = [
        'www.vlanet.net/videoplanet.up.railway.app',
        'videoplanet.up.railway.app///users',
        '///videoplanet.up.railway.app'
      ];

      dangerousUrls.forEach(url => {
        expect(() => normalizeUrl(url)).toThrow();
      });
    });

    test('빈 값이나 잘못된 값 처리', () => {
      const invalidInputs = ['', 'undefined', 'null', '   '];
      
      invalidInputs.forEach(input => {
        expect(() => normalizeUrl(input)).toThrow();
      });
    });

    test('트레일링 슬래시 제거', () => {
      const input = 'https://videoplanet.up.railway.app/';
      const result = normalizeUrl(input);
      
      expect(result).toBe('https://videoplanet.up.railway.app');
      expect(result.endsWith('/')).toBe(false);
    });
  });

  describe('2. URL 구성 문제 재현 및 해결', () => {
    test('상대 경로 문제 시뮬레이션', () => {
      // 문제 상황: 브라우저에서 프로토콜 없는 URL을 상대 경로로 처리
      const problematicUrl = 'videoplanet.up.railway.app';
      const currentDomain = 'https://www.vlanet.net';
      
      // 잘못된 결과 (브라우저에서 발생하는 문제)
      const wrongUrl = new URL(problematicUrl + '/users/login', currentDomain);
      expect(wrongUrl.href).toBe('https://www.vlanet.net/videoplanet.up.railway.app/users/login');
      
      // 올바른 결과 (normalizeUrl 적용 후)
      const fixedUrl = normalizeUrl(problematicUrl);
      const correctUrl = new URL('/users/login', fixedUrl);
      expect(correctUrl.href).toBe('https://videoplanet.up.railway.app/users/login');
    });

    test('Fetch API URL 구성 테스트', () => {
      const problematicApiUrl = 'videoplanet.up.railway.app';
      const fixedApiUrl = normalizeUrl(problematicApiUrl);
      
      // API 엔드포인트 구성
      const endpoint = '/users/login';
      const fullUrl = new URL(endpoint, fixedApiUrl);
      
      expect(fullUrl.href).toBe('https://videoplanet.up.railway.app/users/login');
      expect(fullUrl.origin).toBe('https://videoplanet.up.railway.app');
      expect(fullUrl.pathname).toBe('/users/login');
    });
  });

  describe('3. 현재 API_BASE_URL 설정 검증', () => {
    test('API_BASE_URL이 올바른 프로토콜을 포함해야 함', () => {
      expect(API_BASE_URL.startsWith('https://')).toBe(true);
      expect(API_BASE_URL).not.toContain('www.vlanet.net');
      expect(API_BASE_URL).toContain('railway.app');
    });

    test('API_BASE_URL로 정상적인 URL 구성 가능', () => {
      const testEndpoints = ['/users/login', '/projects', '/feedback/1'];
      
      testEndpoints.forEach(endpoint => {
        const fullUrl = new URL(endpoint, API_BASE_URL);
        expect(fullUrl.href.startsWith('https://videoplanet.up.railway.app')).toBe(true);
        expect(fullUrl.pathname).toBe(endpoint);
      });
    });

    test('실제 API 요청 URL 형식 검증', () => {
      const loginUrl = new URL('/users/login', API_BASE_URL);
      
      expect(loginUrl.href).toBe('https://videoplanet.up.railway.app/users/login');
      expect(loginUrl.protocol).toBe('https:');
      expect(loginUrl.hostname).toBe('videoplanet.up.railway.app');
    });
  });

  describe('4. 환경변수 우선순위 테스트', () => {
    test('환경변수 우선순위가 올바르게 작동해야 함', () => {
      // 실제 우선순위:
      // 1. NEXT_PUBLIC_API_URL
      // 2. NEXT_PUBLIC_BACKEND_API_URL
      // 3. REACT_APP_BACKEND_API_URL
      // 4. 기본값
      
      const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 
                         process.env.NEXT_PUBLIC_BACKEND_API_URL ||
                         process.env.REACT_APP_BACKEND_API_URL ||
                         'https://videoplanet.up.railway.app';
      
      expect(API_BASE_URL).toBe(normalizeUrl(expectedUrl));
    });
  });

  describe('5. 에러 상황 처리 검증', () => {
    test('위험한 환경변수 패턴 감지 시 에러 발생', () => {
      const dangerousUrls = [
        'www.vlanet.net/api',
        '///invalid-url'
      ];

      dangerousUrls.forEach(url => {
        expect(() => normalizeUrl(url)).toThrow();
      });
    });

    test('URL 검증 실패 시 명확한 에러 메시지', () => {
      try {
        normalizeUrl('www.vlanet.net/videoplanet.up.railway.app');
      } catch (error) {
        expect(error.message).toContain('Dangerous URL pattern detected');
        expect(error.message).toContain('relative path issues');
      }
    });
  });

  describe('6. 실제 사용 사례 검증', () => {
    test('로그인 API 호출 URL 구성', () => {
      const loginEndpoint = '/users/login';
      const fullUrl = new URL(loginEndpoint, API_BASE_URL);
      
      expect(fullUrl.href).toBe('https://videoplanet.up.railway.app/users/login');
    });

    test('프로젝트 API 호출 URL 구성', () => {
      const projectEndpoint = '/projects/project_list';
      const fullUrl = new URL(projectEndpoint, API_BASE_URL);
      
      expect(fullUrl.href).toBe('https://videoplanet.up.railway.app/projects/project_list');
    });

    test('피드백 API 호출 URL 구성', () => {
      const feedbackEndpoint = '/feedbacks/1';
      const fullUrl = new URL(feedbackEndpoint, API_BASE_URL);
      
      expect(fullUrl.href).toBe('https://videoplanet.up.railway.app/feedbacks/1');
    });
  });
});

describe('프로토콜 누락 문제 해결 통합 테스트', () => {
  test('전체 워크플로우 검증: 환경변수 → 정규화 → API 호출', () => {
    // 1. 환경변수에서 값 추출 (프로토콜 없을 수 있음)
    const rawApiUrl = 'videoplanet.up.railway.app';
    
    // 2. normalizeUrl로 정규화
    const normalizedUrl = normalizeUrl(rawApiUrl);
    expect(normalizedUrl).toBe('https://videoplanet.up.railway.app');
    
    // 3. API 엔드포인트 구성
    const endpoint = '/users/login';
    const fullUrl = new URL(endpoint, normalizedUrl);
    expect(fullUrl.href).toBe('https://videoplanet.up.railway.app/users/login');
    
    // 4. 상대 경로 문제가 발생하지 않음을 검증
    expect(fullUrl.href).not.toContain('www.vlanet.net');
    expect(fullUrl.href).not.toContain('www.vlanet.net');
  });

  test('다양한 입력 시나리오에서 일관된 결과', () => {
    const inputs = [
      'videoplanet.up.railway.app',
      'https://videoplanet.up.railway.app',
      'videoplanet.up.railway.app/',
      'https://videoplanet.up.railway.app/'
    ];

    const expectedOutput = 'https://videoplanet.up.railway.app';

    inputs.forEach(input => {
      const result = normalizeUrl(input);
      expect(result).toBe(expectedOutput);
    });
  });
});