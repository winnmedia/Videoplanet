/**
 * TDD: 인증 시스템 통합 테스트
 * 시나리오: 로그인 → 토큰 저장 → API 호출 → 로그아웃
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import LoginPage from '../../app/(auth)/login/page';
import { authApi } from '../../features/auth/api/authApi';
import { feedbackApi } from '../../features/feedback/api/feedbackApi';

// Mock 설정
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('../../features/auth/api/authApi');
jest.mock('../../features/feedback/api/feedbackApi');

describe('인증 시스템 통합 테스트 (TDD)', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    
    // localStorage 초기화
    localStorage.clear();
    
    // 쿠키 초기화
    document.cookie = 'vridge_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  describe('시나리오 1: 성공적인 로그인 플로우', () => {
    it('1. 로그인 폼이 올바르게 렌더링되어야 함', () => {
      render(
        <Provider store={store}>
          <LoginPage />
        </Provider>
      );

      expect(screen.getByPlaceholderText(/이메일/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/비밀번호/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
    });

    it('2. 유효한 자격증명으로 로그인 시 토큰이 저장되어야 함', async () => {
      const mockToken = 'valid-jwt-token';
      const mockUser = { 
        id: 1, 
        email: 'test@example.com', 
        name: '테스트 사용자' 
      };

      (authApi.signIn as jest.Mock).mockResolvedValue({
        access_token: mockToken,
        user: mockUser,
      });

      render(
        <Provider store={store}>
          <LoginPage />
        </Provider>
      );

      const emailInput = screen.getByPlaceholderText(/이메일/i);
      const passwordInput = screen.getByPlaceholderText(/비밀번호/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(document.cookie).toContain('vridge_session');
      });
    });

    it('3. 토큰이 있을 때 API 호출이 성공해야 함', async () => {
      const mockToken = 'valid-jwt-token';
      localStorage.setItem('token', mockToken);
      document.cookie = `vridge_session=${mockToken}; path=/`;

      const mockProject = {
        id: 1,
        name: '테스트 프로젝트',
        feedbacks: [],
      };

      (feedbackApi.getFeedbackProject as jest.Mock).mockResolvedValue(mockProject);

      const result = await feedbackApi.getFeedbackProject(1);

      expect(result).toEqual(mockProject);
      expect(feedbackApi.getFeedbackProject).toHaveBeenCalledWith(1);
    });
  });

  describe('시나리오 2: 인증 실패 처리', () => {
    it('1. 잘못된 자격증명으로 로그인 시 에러 메시지가 표시되어야 함', async () => {
      (authApi.signIn as jest.Mock).mockRejectedValue(
        new Error('이메일 또는 비밀번호가 올바르지 않습니다')
      );

      render(
        <Provider store={store}>
          <LoginPage />
        </Provider>
      );

      const emailInput = screen.getByPlaceholderText(/이메일/i);
      const passwordInput = screen.getByPlaceholderText(/비밀번호/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/i)).toBeInTheDocument();
      });
    });

    it('2. 토큰 없이 API 호출 시 로그인 페이지로 리다이렉트되어야 함', async () => {
      const mockRouter = { push: jest.fn() };
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

      (feedbackApi.getFeedbackProject as jest.Mock).mockRejectedValue(
        new Error('NEED_ACCESS_TOKEN')
      );

      try {
        await feedbackApi.getFeedbackProject(1);
      } catch (error) {
        expect(error.message).toBe('NEED_ACCESS_TOKEN');
      }

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('3. 401 오류 시 토큰이 삭제되고 재로그인이 요구되어야 함', async () => {
      localStorage.setItem('token', 'expired-token');
      document.cookie = 'vridge_session=expired-token; path=/';

      (feedbackApi.getFeedbackProject as jest.Mock).mockRejectedValue({
        response: { status: 401 }
      });

      try {
        await feedbackApi.getFeedbackProject(1);
      } catch (error) {
        expect(localStorage.getItem('token')).toBeNull();
        expect(document.cookie).not.toContain('vridge_session');
      }
    });
  });

  describe('시나리오 3: 토큰 갱신 및 로그아웃', () => {
    it('1. 토큰 만료 시 자동 갱신이 시도되어야 함', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      
      localStorage.setItem('token', oldToken);
      localStorage.setItem('refreshToken', 'refresh-token');

      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        access_token: newToken,
      });

      // 첫 번째 호출은 401 에러, 두 번째 호출은 성공
      (feedbackApi.getFeedbackProject as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce({ id: 1, name: '프로젝트' });

      await feedbackApi.getFeedbackProject(1);

      expect(authApi.refreshToken).toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBe(newToken);
    });

    it('2. 로그아웃 시 모든 인증 정보가 제거되어야 함', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, name: '사용자' }));
      document.cookie = 'vridge_session=test-token; path=/';

      (authApi.logout as jest.Mock).mockResolvedValue(undefined);

      await authApi.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(document.cookie).not.toContain('vridge_session');
    });
  });

  describe('시나리오 4: 동시 다중 API 호출', () => {
    it('1. 여러 API 호출이 동시에 실패해도 한 번만 토큰 갱신해야 함', async () => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        access_token: 'new-token',
      });

      const apiCalls = [
        feedbackApi.getFeedbackProject(1),
        feedbackApi.getFeedbackProject(2),
        feedbackApi.getFeedbackProject(3),
      ];

      (feedbackApi.getFeedbackProject as jest.Mock)
        .mockRejectedValue({ response: { status: 401 } });

      await Promise.allSettled(apiCalls);

      // refreshToken은 한 번만 호출되어야 함
      expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('2. 토큰 갱신 중 다른 API 호출은 대기해야 함', async () => {
      const refreshPromise = new Promise(resolve => 
        setTimeout(() => resolve({ access_token: 'new-token' }), 100)
      );

      (authApi.refreshToken as jest.Mock).mockReturnValue(refreshPromise);

      const startTime = Date.now();
      
      await Promise.all([
        feedbackApi.getFeedbackProject(1),
        feedbackApi.getFeedbackProject(2),
      ]);

      const endTime = Date.now();
      
      // 모든 호출이 거의 동시에 완료되어야 함 (100ms 정도)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});