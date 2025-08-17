/**
 * 신규 사용자 온보딩 E2E 테스트
 * 게스트 → 회원가입 → 온보딩 → 첫 프로젝트
 */

describe('신규 사용자 온보딩 여정', () => {
  beforeEach(() => {
    // 테스트 환경 초기화
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // API 모킹 설정
    cy.intercept('POST', '/api/auth/register', { 
      fixture: 'auth/register-success.json' 
    }).as('registerRequest');
    
    cy.intercept('POST', '/api/auth/verify-email', { 
      fixture: 'auth/verify-email-success.json' 
    }).as('verifyEmailRequest');
    
    cy.intercept('GET', '/api/onboarding/steps', { 
      fixture: 'onboarding/onboarding-steps.json' 
    }).as('getOnboardingSteps');
    
    cy.intercept('POST', '/api/onboarding/complete', { 
      fixture: 'onboarding/complete-onboarding.json' 
    }).as('completeOnboarding');
    
    cy.intercept('POST', '/api/projects/guided', { 
      fixture: 'projects/guided-project-creation.json' 
    }).as('createGuidedProject');
  });

  it('게스트 사용자가 회원가입부터 첫 프로젝트 생성까지 완료할 수 있어야 한다', () => {
    // 1단계: 랜딩 페이지 방문 (게스트 상태)
    cy.visit('/');
    
    // 랜딩 페이지 요소 확인
    cy.get('[data-testid="hero-section"]').should('be.visible');
    cy.get('[data-testid="features-section"]').should('be.visible');
    cy.get('[data-testid="cta-signup"]').should('be.visible');
    
    // 회원가입 CTA 클릭
    cy.get('[data-testid="cta-signup"]').click();
    
    // 회원가입 페이지로 이동 확인
    cy.url().should('include', '/signup');
    
    // 2단계: 회원가입
    cy.get('[data-testid="signup-form"]').should('be.visible');
    
    // 회원가입 정보 입력
    cy.get('[data-testid="fullname-input"]')
      .type('홍길동');
    cy.get('[data-testid="email-input"]')
      .type('newuser@videoplanet.com');
    cy.get('[data-testid="password-input"]')
      .type('newPassword123!');
    cy.get('[data-testid="password-confirm-input"]')
      .type('newPassword123!');
    
    // 이용약관 동의
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="privacy-checkbox"]').check();
    
    // 회원가입 버튼 클릭
    cy.get('[data-testid="signup-button"]').click();
    
    cy.wait('@registerRequest');
    
    // 이메일 인증 안내 페이지 확인
    cy.url().should('include', '/verify-email');
    cy.get('[data-testid="email-verification-notice"]')
      .should('be.visible')
      .and('contain', 'newuser@videoplanet.com');
    
    // 3단계: 이메일 인증 시뮬레이션
    // 실제로는 이메일 링크를 클릭하지만, 테스트에서는 직접 인증 API 호출
    cy.get('[data-testid="resend-verification"]').should('be.visible');
    
    // 인증 토큰으로 직접 인증 완료 시뮬레이션
    cy.request({
      method: 'POST',
      url: '/api/auth/verify-email',
      body: { token: 'test-verification-token' }
    }).then(() => {
      // 인증 완료 후 온보딩 페이지로 이동
      cy.visit('/onboarding');
    });
    
    // 4단계: 온보딩 프로세스
    cy.get('[data-testid="onboarding-container"]').should('be.visible');
    cy.get('[data-testid="onboarding-progress"]').should('be.visible');
    
    // 온보딩 1단계: 환영 메시지
    cy.get('[data-testid="welcome-step"]').should('be.visible');
    cy.get('[data-testid="user-name"]').should('contain', '홍길동');
    cy.get('[data-testid="next-step-button"]').click();
    
    // 온보딩 2단계: 사용 목적 선택
    cy.get('[data-testid="purpose-step"]').should('be.visible');
    cy.get('[data-testid="purpose-video-production"]').click();
    cy.get('[data-testid="next-step-button"]').click();
    
    // 온보딩 3단계: 팀 규모 선택
    cy.get('[data-testid="team-size-step"]').should('be.visible');
    cy.get('[data-testid="team-size-small"]').click(); // 1-5명
    cy.get('[data-testid="next-step-button"]').click();
    
    // 온보딩 4단계: 관심 기능 선택
    cy.get('[data-testid="features-step"]').should('be.visible');
    cy.get('[data-testid="feature-feedback"]').check();
    cy.get('[data-testid="feature-planning"]').check();
    cy.get('[data-testid="feature-analytics"]').check();
    cy.get('[data-testid="next-step-button"]').click();
    
    // 온보딩 5단계: 알림 설정
    cy.get('[data-testid="notifications-step"]').should('be.visible');
    cy.get('[data-testid="email-notifications"]').check();
    cy.get('[data-testid="push-notifications"]').check();
    cy.get('[data-testid="complete-onboarding-button"]').click();
    
    cy.wait('@completeOnboarding');
    
    // 5단계: 가이드된 첫 프로젝트 생성
    cy.url().should('include', '/onboarding/first-project');
    cy.get('[data-testid="guided-project-creation"]').should('be.visible');
    
    // 튜토리얼 시작
    cy.get('[data-testid="start-tutorial"]').click();
    
    // 프로젝트 기본 정보 입력 (가이드 포함)
    cy.get('[data-testid="tutorial-overlay"]').should('be.visible');
    cy.get('[data-testid="tutorial-next"]').click();
    
    cy.get('[data-testid="project-name-input"]')
      .type('나의 첫 번째 비디오 프로젝트');
    
    cy.get('[data-testid="tutorial-next"]').click();
    
    // 프로젝트 템플릿 선택
    cy.get('[data-testid="template-selection"]').should('be.visible');
    cy.get('[data-testid="template-basic-video"]').click();
    
    cy.get('[data-testid="tutorial-next"]').click();
    
    // 팀 멤버 초대 (선택사항)
    cy.get('[data-testid="team-invitation-step"]').should('be.visible');
    cy.get('[data-testid="skip-team-invitation"]').click();
    
    cy.get('[data-testid="tutorial-next"]').click();
    
    // 프로젝트 생성 완료
    cy.get('[data-testid="create-first-project"]').click();
    
    cy.wait('@createGuidedProject');
    
    // 6단계: 성공적인 온보딩 완료 확인
    cy.url().should('match', /\/projects\/[a-z0-9-]+\/view/);
    
    // 온보딩 완료 축하 모달
    cy.get('[data-testid="onboarding-success-modal"]').should('be.visible');
    cy.get('[data-testid="success-message"]')
      .should('contain', '환영합니다');
    
    // 다음 단계 안내
    cy.get('[data-testid="next-steps-guide"]').should('be.visible');
    cy.get('[data-testid="close-success-modal"]').click();
    
    // 프로젝트 대시보드 확인
    cy.get('[data-testid="project-title"]')
      .should('contain', '나의 첫 번째 비디오 프로젝트');
    
    cy.get('[data-testid="project-status"]')
      .should('contain', '활성');
    
    // 온보딩 헬프 버튼 확인
    cy.get('[data-testid="onboarding-help"]').should('be.visible');
  });

  it('온보딩 중 중간에 나가도 진행 상황이 저장되어야 한다', () => {
    // 회원가입 완료까지
    cy.visit('/signup');
    cy.get('[data-testid="fullname-input"]').type('이중도');
    cy.get('[data-testid="email-input"]').type('partial@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('password123!');
    cy.get('[data-testid="password-confirm-input"]').type('password123!');
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="privacy-checkbox"]').check();
    cy.get('[data-testid="signup-button"]').click();
    
    cy.wait('@registerRequest');
    
    // 온보딩 시작
    cy.visit('/onboarding');
    
    // 1-2단계까지만 완료
    cy.get('[data-testid="next-step-button"]').click(); // 환영
    cy.get('[data-testid="purpose-video-production"]').click();
    cy.get('[data-testid="next-step-button"]').click(); // 목적
    
    // 진행 중 페이지 이탈
    cy.visit('/dashboard');
    
    // 온보딩 미완료 알림 확인
    cy.get('[data-testid="incomplete-onboarding-banner"]')
      .should('be.visible')
      .and('contain', '온보딩을 완료해주세요');
    
    // 온보딩 재개
    cy.get('[data-testid="continue-onboarding"]').click();
    
    // 이전 진행 상황이 유지되는지 확인
    cy.url().should('include', '/onboarding');
    cy.get('[data-testid="onboarding-progress"]')
      .should('contain', '40%'); // 2/5 단계 완료
    
    // 현재 위치가 3단계인지 확인
    cy.get('[data-testid="team-size-step"]').should('be.visible');
  });

  it('모바일에서도 온보딩 프로세스가 원활해야 한다', () => {
    cy.viewport('iphone-6');
    
    // 모바일 랜딩 페이지
    cy.visit('/');
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-cta-signup"]').click();
    
    // 모바일 회원가입
    cy.get('[data-testid="mobile-signup-form"]').should('be.visible');
    cy.get('[data-testid="fullname-input"]').type('모바일사용자');
    cy.get('[data-testid="email-input"]').type('mobile@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('mobilePass123!');
    cy.get('[data-testid="password-confirm-input"]').type('mobilePass123!');
    
    // 모바일에서 약관 동의
    cy.get('[data-testid="terms-checkbox"]').check({ force: true });
    cy.get('[data-testid="privacy-checkbox"]').check({ force: true });
    
    cy.get('[data-testid="signup-button"]').click();
    cy.wait('@registerRequest');
    
    // 모바일 온보딩
    cy.visit('/onboarding');
    cy.get('[data-testid="mobile-onboarding"]').should('be.visible');
    
    // 스와이프 제스처 대신 버튼 네비게이션 확인
    cy.get('[data-testid="mobile-next-button"]').should('be.visible');
    cy.get('[data-testid="mobile-progress-dots"]').should('be.visible');
    
    // 모바일 온보딩 완료
    cy.get('[data-testid="mobile-next-button"]').click(); // 환영
    cy.get('[data-testid="purpose-video-production"]').click();
    cy.get('[data-testid="mobile-next-button"]').click(); // 목적
    cy.get('[data-testid="team-size-small"]').click();
    cy.get('[data-testid="mobile-next-button"]').click(); // 팀 규모
    cy.get('[data-testid="feature-feedback"]').check();
    cy.get('[data-testid="mobile-next-button"]').click(); // 기능
    cy.get('[data-testid="email-notifications"]').check();
    cy.get('[data-testid="complete-onboarding-button"]').click();
    
    cy.wait('@completeOnboarding');
    
    // 모바일 첫 프로젝트 생성
    cy.get('[data-testid="mobile-project-creation"]').should('be.visible');
  });

  it('접근성 지원이 적절히 구현되어야 한다', () => {
    // 키보드 네비게이션 테스트
    cy.visit('/signup');
    
    // Tab 키로 폼 요소 이동
    cy.get('[data-testid="fullname-input"]').focus();
    cy.get('[data-testid="fullname-input"]').tab();
    cy.focused().should('have.attr', 'data-testid', 'email-input');
    
    // 폼 작성
    cy.get('[data-testid="fullname-input"]').type('접근성테스트');
    cy.get('[data-testid="email-input"]').type('accessibility@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('accessPass123!');
    cy.get('[data-testid="password-confirm-input"]').type('accessPass123!');
    
    // Enter 키로 체크박스 활성화
    cy.get('[data-testid="terms-checkbox"]').focus().type('{enter}');
    cy.get('[data-testid="privacy-checkbox"]').focus().type('{enter}');
    
    // Enter 키로 회원가입
    cy.get('[data-testid="signup-button"]').focus().type('{enter}');
    cy.wait('@registerRequest');
    
    // 온보딩에서 키보드 네비게이션
    cy.visit('/onboarding');
    
    // ARIA 레이블 확인
    cy.get('[data-testid="onboarding-container"]')
      .should('have.attr', 'role', 'main');
    cy.get('[data-testid="onboarding-progress"]')
      .should('have.attr', 'aria-label')
      .and('contain', '진행');
    
    // 키보드로 온보딩 네비게이션
    cy.get('[data-testid="next-step-button"]').focus().type('{enter}');
    cy.get('[data-testid="purpose-video-production"]').focus().type('{space}');
    cy.get('[data-testid="next-step-button"]').focus().type('{enter}');
    
    // 스크린 리더를 위한 설명 텍스트 확인
    cy.get('[data-testid="step-description"]')
      .should('have.attr', 'id')
      .and('match', /step-description-\d+/);
  });

  it('온보딩 중 에러 상황을 적절히 처리해야 한다', () => {
    // 네트워크 에러 시나리오
    cy.intercept('POST', '/api/onboarding/complete', {
      statusCode: 500,
      body: { error: 'Server Error' }
    }).as('onboardingError');
    
    // 온보딩 진행
    cy.visit('/signup');
    cy.get('[data-testid="fullname-input"]').type('에러테스트');
    cy.get('[data-testid="email-input"]').type('error@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('errorPass123!');
    cy.get('[data-testid="password-confirm-input"]').type('errorPass123!');
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="privacy-checkbox"]').check();
    cy.get('[data-testid="signup-button"]').click();
    
    cy.wait('@registerRequest');
    
    // 온보딩 완료 시 에러 발생
    cy.visit('/onboarding');
    cy.get('[data-testid="next-step-button"]').click();
    cy.get('[data-testid="purpose-video-production"]').click();
    cy.get('[data-testid="next-step-button"]').click();
    cy.get('[data-testid="team-size-small"]').click();
    cy.get('[data-testid="next-step-button"]').click();
    cy.get('[data-testid="feature-feedback"]').check();
    cy.get('[data-testid="next-step-button"]').click();
    cy.get('[data-testid="email-notifications"]').check();
    cy.get('[data-testid="complete-onboarding-button"]').click();
    
    cy.wait('@onboardingError');
    
    // 에러 처리 확인
    cy.get('[data-testid="onboarding-error"]')
      .should('be.visible')
      .and('contain', '온보딩 완료 중 오류가 발생했습니다');
    
    // 재시도 버튼 확인
    cy.get('[data-testid="retry-onboarding"]')
      .should('be.visible')
      .and('be.enabled');
    
    // 사용자 데이터가 유지되는지 확인
    cy.get('[data-testid="feature-feedback"]')
      .should('be.checked');
  });
});