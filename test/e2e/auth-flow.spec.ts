import { test, expect, Page, BrowserContext } from '@playwright/test';
import { testData } from './fixtures/test-data';
import { TestHelpers } from './helpers/test-helpers';

/**
 * VideoPlanet 인증 플로우 E2E 테스트
 * 
 * 테스트 커버리지:
 * - 로그인/로그아웃
 * - 회원가입
 * - 비밀번호 재설정
 * - 세션 관리
 * - 권한 기반 접근 제어
 */

test.describe('Authentication Flow', () => {
  let context: BrowserContext;
  let page: Page;
  let helpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
      storageState: undefined, // 인증 테스트는 깨끗한 상태에서 시작
    });
    page = await context.newPage();
    helpers = new TestHelpers(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('로그인 플로우', () => {
    test('유효한 자격증명으로 로그인 성공', async () => {
      await page.goto('/login');
      
      // 로그인 폼 확인
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // 자격증명 입력
      await page.fill('[data-testid="email-input"]', testData.users.admin.email);
      await page.fill('[data-testid="password-input"]', testData.users.admin.password);
      
      // 로그인 버튼 클릭
      await page.click('[data-testid="login-button"]');
      
      // 대시보드로 리다이렉트 확인
      await page.waitForURL('/dashboard');
      await expect(page).toHaveURL('/dashboard');
      
      // 사용자 정보 표시 확인
      await expect(page.locator('[data-testid="user-name"]')).toContainText(testData.users.admin.name);
      
      // 인증 토큰 저장 확인
      const localStorage = await page.evaluate(() => window.localStorage);
      expect(localStorage['auth_token']).toBeDefined();
    });

    test('잘못된 자격증명으로 로그인 실패', async () => {
      await page.goto('/login');
      
      // 잘못된 자격증명 입력
      await page.fill('[data-testid="email-input"]', 'wrong@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // 로그인 시도
      await page.click('[data-testid="login-button"]');
      
      // 에러 메시지 확인
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/이메일 또는 비밀번호가 올바르지 않습니다/);
      
      // 여전히 로그인 페이지에 있는지 확인
      await expect(page).toHaveURL('/login');
    });

    test('입력 유효성 검사', async () => {
      await page.goto('/login');
      
      // 빈 폼 제출 시도
      await page.click('[data-testid="login-button"]');
      
      // 유효성 검사 메시지 확인
      await expect(page.locator('[data-testid="email-error"]')).toContainText(/이메일을 입력해주세요/);
      await expect(page.locator('[data-testid="password-error"]')).toContainText(/비밀번호를 입력해주세요/);
      
      // 잘못된 이메일 형식
      await page.fill('[data-testid="email-input"]', 'notanemail');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText(/올바른 이메일 형식이 아닙니다/);
      
      // 짧은 비밀번호
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="password-error"]')).toContainText(/비밀번호는 최소 8자 이상이어야 합니다/);
    });

    test('Remember Me 기능', async () => {
      await page.goto('/login');
      
      // Remember Me 체크
      await page.check('[data-testid="remember-me"]');
      
      // 로그인
      await page.fill('[data-testid="email-input"]', testData.users.admin.email);
      await page.fill('[data-testid="password-input"]', testData.users.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // 세션 스토리지 확인
      const rememberToken = await page.evaluate(() => window.localStorage.getItem('remember_token'));
      expect(rememberToken).toBeDefined();
      
      // 브라우저 재시작 시뮬레이션
      await page.context().close();
      const newContext = await page.context().browser()?.newContext();
      const newPage = await newContext?.newPage();
      
      if (newPage) {
        await newPage.goto('/dashboard');
        // 자동 로그인 확인
        await expect(newPage).toHaveURL('/dashboard');
      }
    });
  });

  test.describe('로그아웃 플로우', () => {
    test.beforeEach(async () => {
      // 로그인 상태로 시작
      await helpers.login(testData.users.admin);
    });

    test('정상 로그아웃', async () => {
      await page.goto('/dashboard');
      
      // 사용자 메뉴 열기
      await page.click('[data-testid="user-menu"]');
      
      // 로그아웃 클릭
      await page.click('[data-testid="logout-button"]');
      
      // 로그인 페이지로 리다이렉트 확인
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
      
      // 로그아웃 메시지 확인
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/로그아웃되었습니다/);
      
      // 토큰 제거 확인
      const localStorage = await page.evaluate(() => window.localStorage);
      expect(localStorage['auth_token']).toBeUndefined();
      
      // 보호된 페이지 접근 시도
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
    });

    test('세션 만료 처리', async () => {
      await page.goto('/dashboard');
      
      // 세션 만료 시뮬레이션
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        // 만료된 토큰 설정
        localStorage.setItem('auth_token', 'expired-token');
      });
      
      // API 호출 트리거
      await page.click('[data-testid="refresh-button"]');
      
      // 로그인 페이지로 리다이렉트 확인
      await page.waitForURL('/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText(/세션이 만료되었습니다/);
    });
  });

  test.describe('회원가입 플로우', () => {
    test('신규 계정 생성', async () => {
      await page.goto('/signup');
      
      // 회원가입 폼 확인
      await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
      
      // 정보 입력
      const newUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Test1234!@#',
        company: 'Test Company'
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="password-confirm-input"]', newUser.password);
      await page.fill('[data-testid="company-input"]', newUser.company);
      
      // 약관 동의
      await page.check('[data-testid="terms-agree"]');
      await page.check('[data-testid="privacy-agree"]');
      
      // 회원가입 버튼 클릭
      await page.click('[data-testid="signup-button"]');
      
      // 이메일 인증 페이지로 이동 확인
      await page.waitForURL('/verify-email');
      await expect(page.locator('[data-testid="verification-message"]')).toContainText(/이메일을 확인해주세요/);
    });

    test('중복 이메일 검사', async () => {
      await page.goto('/signup');
      
      // 이미 존재하는 이메일 입력
      await page.fill('[data-testid="email-input"]', testData.users.admin.email);
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="password-input"]', 'Test1234!@#');
      await page.fill('[data-testid="password-confirm-input"]', 'Test1234!@#');
      
      // 회원가입 시도
      await page.click('[data-testid="signup-button"]');
      
      // 에러 메시지 확인
      await expect(page.locator('[data-testid="email-error"]')).toContainText(/이미 사용 중인 이메일입니다/);
    });

    test('비밀번호 강도 검증', async () => {
      await page.goto('/signup');
      
      // 약한 비밀번호 테스트
      const weakPasswords = [
        { pwd: '1234', msg: '비밀번호가 너무 짧습니다' },
        { pwd: 'password', msg: '숫자를 포함해야 합니다' },
        { pwd: '12345678', msg: '문자를 포함해야 합니다' },
        { pwd: 'password1', msg: '특수문자를 포함해야 합니다' }
      ];
      
      for (const { pwd, msg } of weakPasswords) {
        await page.fill('[data-testid="password-input"]', pwd);
        await page.click('[data-testid="signup-button"]');
        await expect(page.locator('[data-testid="password-strength"]')).toContainText(msg);
      }
      
      // 강한 비밀번호 테스트
      await page.fill('[data-testid="password-input"]', 'Strong1234!@#');
      await expect(page.locator('[data-testid="password-strength"]')).toContainText(/강함/);
    });
  });

  test.describe('비밀번호 재설정', () => {
    test('비밀번호 재설정 요청', async () => {
      await page.goto('/login');
      
      // 비밀번호 찾기 링크 클릭
      await page.click('[data-testid="forgot-password-link"]');
      
      // 비밀번호 재설정 페이지 확인
      await expect(page).toHaveURL('/reset-password');
      
      // 이메일 입력
      await page.fill('[data-testid="email-input"]', testData.users.admin.email);
      await page.click('[data-testid="reset-request-button"]');
      
      // 성공 메시지 확인
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/재설정 링크가 이메일로 전송되었습니다/);
    });

    test('비밀번호 재설정 완료', async () => {
      // 재설정 토큰이 포함된 URL로 직접 이동
      const resetToken = 'valid-reset-token';
      await page.goto(`/reset-password?token=${resetToken}`);
      
      // 새 비밀번호 입력
      const newPassword = 'NewPassword123!@#';
      await page.fill('[data-testid="new-password-input"]', newPassword);
      await page.fill('[data-testid="confirm-password-input"]', newPassword);
      
      // 재설정 버튼 클릭
      await page.click('[data-testid="reset-password-button"]');
      
      // 로그인 페이지로 리다이렉트 확인
      await page.waitForURL('/login');
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/비밀번호가 재설정되었습니다/);
      
      // 새 비밀번호로 로그인 테스트
      await page.fill('[data-testid="email-input"]', testData.users.admin.email);
      await page.fill('[data-testid="password-input"]', newPassword);
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('권한 기반 접근 제어', () => {
    test('관리자 권한 페이지 접근', async () => {
      // 관리자로 로그인
      await helpers.login(testData.users.admin);
      
      // 관리자 페이지 접근
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
    });

    test('일반 사용자 권한 제한', async () => {
      // 일반 사용자로 로그인
      await helpers.login(testData.users.member);
      
      // 관리자 페이지 접근 시도
      await page.goto('/admin');
      
      // 접근 거부 확인
      await expect(page).toHaveURL('/403');
      await expect(page.locator('[data-testid="access-denied"]')).toContainText(/접근 권한이 없습니다/);
    });

    test('게스트 사용자 제한', async () => {
      // 로그인하지 않은 상태
      await page.goto('/projects/create');
      
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL('/login?redirect=/projects/create');
      await expect(page.locator('[data-testid="login-required"]')).toContainText(/로그인이 필요합니다/);
    });
  });

  test.describe('보안 기능', () => {
    test('CSRF 토큰 검증', async () => {
      await helpers.login(testData.users.admin);
      await page.goto('/dashboard');
      
      // CSRF 토큰 확인
      const csrfToken = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content');
      });
      
      expect(csrfToken).toBeDefined();
      expect(csrfToken).toHaveLength(32); // 토큰 길이 확인
    });

    test('XSS 방어', async () => {
      await helpers.login(testData.users.admin);
      await page.goto('/profile');
      
      // XSS 시도
      const xssPayload = '<script>alert("XSS")</script>';
      await page.fill('[data-testid="bio-input"]', xssPayload);
      await page.click('[data-testid="save-profile"]');
      
      // 스크립트가 실행되지 않고 이스케이프되는지 확인
      const bioText = await page.locator('[data-testid="bio-display"]').innerText();
      expect(bioText).not.toContain('<script>');
      expect(bioText).toContain('&lt;script&gt;');
    });

    test('브루트포스 공격 방어', async () => {
      await page.goto('/login');
      
      // 여러 번 실패 시도
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', testData.users.admin.email);
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
      }
      
      // 계정 잠금 메시지 확인
      await expect(page.locator('[data-testid="account-locked"]')).toContainText(/너무 많은 시도/);
      
      // CAPTCHA 표시 확인
      await expect(page.locator('[data-testid="captcha"]')).toBeVisible();
    });
  });
});