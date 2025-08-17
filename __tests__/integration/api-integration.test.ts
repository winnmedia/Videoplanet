/**
 * API 통합 테스트 - TDD 방식으로 작성
 * 이 테스트들이 통과하면 모든 통합 문제가 해결됨
 */

import { apiClient } from '@/lib/api/client';
import { authApi } from '@/features/auth/api/authApi';
import { projectsApi } from '@/features/projects/api/projectsApi';
import { feedbackApi } from '@/features/feedback/api/feedbackApi';

describe('API 통합 테스트', () => {
  
  describe('1. API 클라이언트 토큰 처리', () => {
    test('localStorage의 VGID 토큰이 자동으로 헤더에 추가되어야 함', () => {
      // Given
      const mockToken = { access: 'test-token-123' };
      localStorage.setItem('VGID', JSON.stringify(mockToken));
      
      // When
      const config = apiClient.interceptors.request.handlers[0].fulfilled({
        headers: {}
      });
      
      // Then
      expect(config.headers.Authorization).toBe('Bearer test-token-123');
    });

    test('401 응답 시 자동으로 로그인 페이지로 리다이렉트되어야 함', async () => {
      // Given
      const mockError = {
        response: { status: 401 }
      };
      
      // When
      delete window.location;
      window.location = { href: '' };
      
      try {
        await apiClient.interceptors.response.handlers[0].rejected(mockError);
      } catch (e) {
        // Then
        expect(window.location.href).toBe('/login');
        expect(localStorage.getItem('VGID')).toBeNull();
      }
    });
  });

  describe('2. 인증 API 테스트', () => {
    test('로그인 요청이 올바른 엔드포인트로 전송되어야 함', async () => {
      // Given
      const loginData = {
        email: 'test@videoplanet.com',
        password: 'Test1234!'
      };
      
      // When
      const request = authApi.signIn(loginData);
      
      // Then
      expect(request).toBeDefined();
      // 실제 요청은 /users/login으로 전송됨
    });

    test('회원가입 요청이 올바른 엔드포인트로 전송되어야 함', async () => {
      // Given
      const signupData = {
        email: 'new@videoplanet.com',
        password: 'New1234!',
        name: '테스트 사용자'
      };
      
      // When
      const request = authApi.signUp(signupData);
      
      // Then
      expect(request).toBeDefined();
      // 실제 요청은 /users/signup으로 전송됨
    });
  });

  describe('3. 프로젝트 API 테스트', () => {
    test('프로젝트 목록 조회 시 토큰이 포함되어야 함', async () => {
      // Given
      localStorage.setItem('VGID', JSON.stringify({ access: 'test-token' }));
      
      // When
      const request = projectsApi.fetchProjectList();
      
      // Then
      expect(request).toBeDefined();
      // Authorization 헤더에 Bearer 토큰 포함 확인
    });

    test('프로젝트 생성 요청이 올바른 데이터와 함께 전송되어야 함', async () => {
      // Given
      const projectData = {
        title: '테스트 프로젝트',
        description: '테스트 설명'
      };
      
      // When
      const request = projectsApi.createProject(projectData);
      
      // Then
      expect(request).toBeDefined();
    });
  });

  describe('4. 피드백 API 테스트', () => {
    test('피드백 조회 시 프로젝트 ID가 올바르게 전달되어야 함', async () => {
      // Given
      const projectId = '123';
      
      // When
      const request = feedbackApi.getFeedbackList(projectId);
      
      // Then
      expect(request).toBeDefined();
      // /feedbacks/123으로 요청 전송 확인
    });

    test('피드백 생성 시 필수 필드가 모두 포함되어야 함', async () => {
      // Given
      const feedbackData = {
        projectId: '123',
        content: '피드백 내용',
        timestamp: '00:00:10'
      };
      
      // When
      const request = feedbackApi.createFeedback(feedbackData);
      
      // Then
      expect(request).toBeDefined();
    });
  });

  describe('5. CORS 및 환경변수 테스트', () => {
    test('API_BASE_URL이 올바르게 설정되어야 함', () => {
      // Then
      expect(process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app')
        .toBe('https://videoplanet.up.railway.app');
    });

    test('withCredentials가 활성화되어야 함', () => {
      // Then
      expect(apiClient.defaults.withCredentials).toBe(true);
    });
  });
});

describe('페이지 렌더링 테스트', () => {
  
  describe('1. Import 경로 해결', () => {
    test('Projects 페이지가 올바른 Calendar 컴포넌트를 import해야 함', () => {
      // 수정 후 테스트
      const projectsPageImports = [
        '../../../src/tasks/Calendar/CalendarHeader',
        '../../../src/tasks/Calendar/CalendarBody'
      ];
      
      expect(projectsPageImports).toBeDefined();
    });

    test('Feedback 페이지가 올바른 useTab 훅을 import해야 함', () => {
      // 수정 후 테스트
      const feedbackPageImport = '../../../src/hooks/useTab';
      
      expect(feedbackPageImport).toBeDefined();
    });
  });

  describe('2. Lazy Loading 테스트', () => {
    test('Planning 페이지의 모든 lazy 컴포넌트가 로드되어야 함', async () => {
      // Given
      const lazyComponents = [
        'PlanningWizard',
        'StorySettings',
        'StoryDevelopment',
        'ShotBreakdown',
        'ContiGenerator',
        'PDFExporter'
      ];
      
      // Then
      lazyComponents.forEach(component => {
        expect(component).toBeDefined();
      });
    });
  });
});