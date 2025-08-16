// 인증 관련 E2E 테스트
describe('Authentication Flow', () => {
  beforeEach(() => {
    // 각 테스트 전에 데이터베이스 초기화 (옵션)
    cy.task('resetDb')
    
    // 테스트 사용자 데이터 생성
    cy.task('createTestData', {
      users: [
        {
          email: 'test@videoplanet.com',
          password: 'testpassword123',
          name: 'Test User',
        },
      ],
    })
  })

  describe('User Registration', () => {
    it('successfully registers a new user', () => {
      cy.visit('/signup')
      
      // 회원가입 폼 작성
      cy.get('[data-testid="signup-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').type('newuser@videoplanet.com')
      cy.get('[data-testid="password-input"]').type('newpassword123')
      cy.get('[data-testid="confirm-password-input"]').type('newpassword123')
      cy.get('[data-testid="name-input"]').type('New User')
      cy.get('[data-testid="terms-checkbox"]').check()
      
      // 폼 제출
      cy.get('[data-testid="signup-submit"]').click()
      
      // 성공 메시지 확인
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '회원가입이 완료되었습니다')
      
      // 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/login')
    })

    it('shows validation errors for invalid input', () => {
      cy.visit('/signup')
      
      // 잘못된 이메일 형식
      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="password-input"]').type('short')
      cy.get('[data-testid="signup-submit"]').click()
      
      // 에러 메시지 확인
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', '올바른 이메일 형식을 입력해주세요')
      
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', '비밀번호는 최소 8자 이상이어야 합니다')
    })

    it('prevents registration with existing email', () => {
      cy.visit('/signup')
      
      // 이미 존재하는 이메일로 가입 시도
      cy.get('[data-testid="email-input"]').type('test@videoplanet.com')
      cy.get('[data-testid="password-input"]').type('newpassword123')
      cy.get('[data-testid="confirm-password-input"]').type('newpassword123')
      cy.get('[data-testid="name-input"]').type('Test User')
      cy.get('[data-testid="terms-checkbox"]').check()
      cy.get('[data-testid="signup-submit"]').click()
      
      // 에러 메시지 확인
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '이미 사용중인 이메일입니다')
    })

    it('requires terms acceptance', () => {
      cy.visit('/signup')
      
      cy.fillForm({
        'email-input': 'newuser@videoplanet.com',
        'password-input': 'newpassword123',
        'confirm-password-input': 'newpassword123',
        'name-input': 'New User',
      })
      
      // 약관 동의 없이 제출
      cy.get('[data-testid="signup-submit"]').click()
      
      cy.get('[data-testid="terms-error"]')
        .should('be.visible')
        .and('contain', '이용약관에 동의해주세요')
    })
  })

  describe('User Login', () => {
    it('successfully logs in with valid credentials', () => {
      cy.visit('/login')
      
      // 로그인 폼 작성
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').type('test@videoplanet.com')
      cy.get('[data-testid="password-input"]').type('testpassword123')
      cy.get('[data-testid="login-submit"]').click()
      
      // 로그인 성공 확인
      cy.url().should('not.include', '/login')
      cy.get('[data-testid="user-profile"]').should('be.visible')
      cy.get('[data-testid="user-name"]').should('contain', 'Test User')
      
      // 로컬 스토리지에 토큰 저장 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.exist
      })
    })

    it('shows error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-testid="email-input"]').type('test@videoplanet.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-submit"]').click()
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '이메일 또는 비밀번호가 올바르지 않습니다')
    })

    it('validates required fields', () => {
      cy.visit('/login')
      
      // 빈 폼으로 제출
      cy.get('[data-testid="login-submit"]').click()
      
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', '이메일을 입력해주세요')
      
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', '비밀번호를 입력해주세요')
    })

    it('remembers user login state', () => {
      // 로그인
      cy.loginWithUI()
      
      // 페이지 새로고침
      cy.reload()
      
      // 로그인 상태 유지 확인
      cy.get('[data-testid="user-profile"]').should('be.visible')
      cy.url().should('not.include', '/login')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      // 각 테스트 전에 로그인
      cy.loginWithUI()
    })

    it('successfully logs out user', () => {
      // 사용자 메뉴 클릭
      cy.get('[data-testid="user-menu"]').click()
      
      // 로그아웃 버튼 클릭
      cy.get('[data-testid="logout-button"]').click()
      
      // 로그아웃 확인
      cy.url().should('include', '/login')
      cy.get('[data-testid="login-form"]').should('be.visible')
      
      // 토큰 제거 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null
        expect(win.localStorage.getItem('refresh_token')).to.be.null
      })
    })

    it('clears user data after logout', () => {
      cy.logout()
      
      // 사용자 관련 데이터가 제거되었는지 확인
      cy.visit('/')
      cy.get('[data-testid="user-profile"]').should('not.exist')
      cy.get('[data-testid="login-button"]').should('be.visible')
    })
  })

  describe('Password Reset', () => {
    it('sends password reset email', () => {
      cy.visit('/reset-password')
      
      cy.get('[data-testid="email-input"]').type('test@videoplanet.com')
      cy.get('[data-testid="reset-submit"]').click()
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '비밀번호 재설정 이메일을 발송했습니다')
    })

    it('shows error for non-existent email', () => {
      cy.visit('/reset-password')
      
      cy.get('[data-testid="email-input"]').type('nonexistent@videoplanet.com')
      cy.get('[data-testid="reset-submit"]').click()
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '등록되지 않은 이메일입니다')
    })
  })

  describe('Protected Routes', () => {
    it('redirects to login when accessing protected page without authentication', () => {
      cy.visit('/dashboard')
      
      cy.url().should('include', '/login')
      cy.get('[data-testid="login-form"]').should('be.visible')
    })

    it('allows access to protected pages when authenticated', () => {
      cy.loginWithUI()
      
      cy.visit('/dashboard')
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
    })

    it('maintains redirect after login', () => {
      // 보호된 페이지에 직접 접근
      cy.visit('/project/create')
      
      // 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/login')
      
      // 로그인
      cy.get('[data-testid="email-input"]').type('test@videoplanet.com')
      cy.get('[data-testid="password-input"]').type('testpassword123')
      cy.get('[data-testid="login-submit"]').click()
      
      // 원래 접근하려던 페이지로 리다이렉트 확인
      cy.url().should('include', '/project/create')
    })
  })

  describe('Session Management', () => {
    it('handles expired token gracefully', () => {
      cy.loginWithUI()
      
      // 만료된 토큰으로 설정
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', 'expired-token')
      })
      
      // API 호출이 필요한 페이지 방문
      cy.visit('/dashboard')
      
      // 자동 로그아웃 또는 토큰 갱신 확인
      cy.url().should('include', '/login')
    })

    it('refreshes token automatically', () => {
      cy.loginWithAPI()
      
      // 토큰이 곧 만료될 상황 시뮬레이션
      cy.intercept('GET', '/api/user/profile/', {
        statusCode: 401,
        body: { error: 'Token expired' },
      }).as('expiredToken')
      
      cy.intercept('POST', '/api/auth/refresh/', {
        statusCode: 200,
        body: { access_token: 'new-access-token' },
      }).as('refreshToken')
      
      cy.intercept('GET', '/api/user/profile/', {
        statusCode: 200,
        body: { name: 'Test User', email: 'test@videoplanet.com' },
      }).as('userProfile')
      
      cy.visit('/dashboard')
      
      // 토큰 갱신이 자동으로 이루어지는지 확인
      cy.wait('@expiredToken')
      cy.wait('@refreshToken')
      cy.wait('@userProfile')
      
      cy.get('[data-testid="user-profile"]').should('be.visible')
    })
  })

  describe('Mobile Responsive', () => {
    it('works correctly on mobile devices', () => {
      cy.setMobileViewport()
      
      cy.visit('/login')
      
      // 모바일에서도 로그인 폼이 제대로 표시되는지 확인
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').should('be.visible')
      
      // 모바일에서 로그인 테스트
      cy.loginWithUI()
      
      // 모바일 네비게이션 확인
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      cy.visit('/login')
      
      // Tab 키로 폼 요소 간 이동
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'email-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'password-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'login-submit')
    })

    it('has proper ARIA labels', () => {
      cy.visit('/login')
      
      cy.get('[data-testid="login-form"]')
        .should('have.attr', 'role', 'form')
        .should('have.attr', 'aria-label')
      
      cy.get('[data-testid="email-input"]')
        .should('have.attr', 'aria-label', '이메일')
      
      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'aria-label', '비밀번호')
    })
  })
})