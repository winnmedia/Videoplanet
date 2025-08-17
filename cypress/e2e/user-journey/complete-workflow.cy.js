/**
 * 핵심 사용자 여정 E2E 테스트
 * 로그인 → 프로젝트 생성 → 피드백 수집 → 분석
 */

describe('핵심 사용자 여정: 완전한 워크플로우', () => {
  beforeEach(() => {
    // 테스트 데이터 초기화
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // API 모킹 설정
    cy.intercept('POST', '/api/auth/login', { 
      fixture: 'auth/login-success.json' 
    }).as('loginRequest');
    
    cy.intercept('GET', '/api/projects', { 
      fixture: 'projects/empty-projects.json' 
    }).as('getProjects');
    
    cy.intercept('POST', '/api/projects', { 
      fixture: 'projects/create-project-success.json' 
    }).as('createProject');
    
    cy.intercept('GET', '/api/feedback/*', { 
      fixture: 'feedback/empty-feedback.json' 
    }).as('getFeedback');
    
    cy.intercept('POST', '/api/feedback', { 
      fixture: 'feedback/create-feedback-success.json' 
    }).as('createFeedback');
  });

  it('사용자가 로그인부터 피드백 분석까지 전체 플로우를 완료할 수 있어야 한다', () => {
    // 1단계: 로그인
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
    
    // 로그인 정보 입력
    cy.get('[data-testid="email-input"]')
      .type('test@videoplanet.com');
    cy.get('[data-testid="password-input"]')
      .type('testpassword123');
    
    // 로그인 버튼 클릭
    cy.get('[data-testid="login-button"]')
      .click();
    
    cy.wait('@loginRequest');
    
    // 대시보드로 리디렉션 확인
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-profile"]').should('be.visible');
    
    // 2단계: 프로젝트 생성
    cy.get('[data-testid="create-project-button"]')
      .click();
    
    // 프로젝트 생성 모달 확인
    cy.get('[data-testid="project-creation-modal"]').should('be.visible');
    
    // 프로젝트 정보 입력
    cy.get('[data-testid="project-name-input"]')
      .type('테스트 비디오 프로젝트');
    cy.get('[data-testid="project-description-input"]')
      .type('E2E 테스트를 위한 샘플 프로젝트입니다.');
    cy.get('[data-testid="project-type-select"]')
      .select('video-production');
    
    // 프로젝트 생성 확인
    cy.get('[data-testid="confirm-create-project"]')
      .click();
    
    cy.wait('@createProject');
    
    // 프로젝트 상세 페이지로 이동 확인
    cy.url().should('match', /\/projects\/[a-z0-9-]+\/view/);
    cy.get('[data-testid="project-title"]')
      .should('contain', '테스트 비디오 프로젝트');
    
    // 3단계: 피드백 수집 설정
    cy.get('[data-testid="feedback-settings-tab"]')
      .click();
    
    // 피드백 링크 생성
    cy.get('[data-testid="generate-feedback-link"]')
      .click();
    
    cy.get('[data-testid="feedback-link"]')
      .should('be.visible')
      .and('contain', 'http');
    
    // 피드백 수집 활성화
    cy.get('[data-testid="enable-feedback-collection"]')
      .click();
    
    cy.get('[data-testid="feedback-status"]')
      .should('contain', '활성');
    
    // 4단계: 피드백 시뮬레이션 (새 탭에서)
    cy.get('[data-testid="feedback-link"]')
      .invoke('text')
      .then((feedbackUrl) => {
        // 피드백 페이지 방문
        cy.visit(feedbackUrl);
        
        // 익명 피드백 작성
        cy.get('[data-testid="anonymous-feedback-form"]')
          .should('be.visible');
        
        cy.get('[data-testid="feedback-content"]')
          .type('이 비디오는 매우 좋습니다. 음질과 화질 모두 뛰어나네요.');
        
        cy.get('[data-testid="feedback-rating"]')
          .click();
        cy.get('[data-testid="rating-5"]')
          .click();
        
        cy.get('[data-testid="submit-feedback"]')
          .click();
        
        cy.wait('@createFeedback');
        
        // 피드백 제출 성공 메시지 확인
        cy.get('[data-testid="feedback-success-message"]')
          .should('be.visible')
          .and('contain', '피드백이 성공적으로 제출되었습니다');
      });
    
    // 5단계: 프로젝트로 돌아가서 피드백 분석
    cy.go('back');
    
    // 피드백 탭으로 이동
    cy.get('[data-testid="feedback-analysis-tab"]')
      .click();
    
    // 피드백 목록 확인
    cy.get('[data-testid="feedback-list"]')
      .should('be.visible');
    
    cy.get('[data-testid="feedback-item"]')
      .should('have.length.at.least', 1);
    
    // 피드백 통계 확인
    cy.get('[data-testid="feedback-stats"]')
      .should('be.visible');
    
    cy.get('[data-testid="average-rating"]')
      .should('contain', '5.0');
    
    cy.get('[data-testid="total-feedback-count"]')
      .should('contain', '1');
    
    // 피드백 상세 보기
    cy.get('[data-testid="feedback-item"]')
      .first()
      .click();
    
    cy.get('[data-testid="feedback-detail-modal"]')
      .should('be.visible');
    
    cy.get('[data-testid="feedback-detail-content"]')
      .should('contain', '이 비디오는 매우 좋습니다');
    
    // 6단계: 분석 및 인사이트
    cy.get('[data-testid="close-feedback-detail"]')
      .click();
    
    cy.get('[data-testid="analytics-tab"]')
      .click();
    
    // 분석 차트 확인
    cy.get('[data-testid="feedback-chart"]')
      .should('be.visible');
    
    cy.get('[data-testid="sentiment-analysis"]')
      .should('be.visible')
      .and('contain', '긍정');
    
    // 키워드 분석 확인
    cy.get('[data-testid="keyword-analysis"]')
      .should('be.visible');
    
    // 액션 아이템 확인
    cy.get('[data-testid="action-items"]')
      .should('be.visible');
  });

  it('오류 상황에서도 사용자 경험이 유지되어야 한다', () => {
    // API 에러 시나리오 모킹
    cy.intercept('POST', '/api/projects', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('createProjectError');
    
    // 로그인
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('testpassword123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@loginRequest');
    
    // 프로젝트 생성 시도
    cy.get('[data-testid="create-project-button"]').click();
    cy.get('[data-testid="project-name-input"]').type('에러 테스트');
    cy.get('[data-testid="confirm-create-project"]').click();
    
    cy.wait('@createProjectError');
    
    // 에러 메시지 확인
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', '프로젝트 생성 중 오류가 발생했습니다');
    
    // 재시도 버튼 확인
    cy.get('[data-testid="retry-button"]')
      .should('be.visible')
      .and('be.enabled');
    
    // 사용자가 여전히 대시보드에 있는지 확인
    cy.url().should('include', '/dashboard');
  });

  it('모바일 환경에서도 전체 워크플로우가 작동해야 한다', () => {
    // 모바일 뷰포트 설정
    cy.viewport('iphone-6');
    
    // 로그인
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('testpassword123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@loginRequest');
    
    // 모바일 대시보드 확인
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    
    // 햄버거 메뉴 열기
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-navigation"]').should('be.visible');
    
    // 프로젝트 생성 (모바일)
    cy.get('[data-testid="mobile-create-project"]').click();
    
    // 모바일 프로젝트 생성 폼 확인
    cy.get('[data-testid="mobile-project-form"]').should('be.visible');
    
    cy.get('[data-testid="project-name-input"]').type('모바일 테스트');
    cy.get('[data-testid="confirm-create-project"]').click();
    
    cy.wait('@createProject');
    
    // 모바일에서 프로젝트 뷰 확인
    cy.get('[data-testid="mobile-project-view"]').should('be.visible');
  });

  it('성능 메트릭이 허용 가능한 범위 내에 있어야 한다', () => {
    // 성능 측정을 위한 커스텀 명령어
    cy.visit('/login', {
      onBeforeLoad: (win) => {
        win.performance.mark('loginPageStart');
      }
    });
    
    cy.window().then((win) => {
      win.performance.mark('loginPageEnd');
      win.performance.measure('loginPageLoad', 'loginPageStart', 'loginPageEnd');
      
      const measures = win.performance.getEntriesByType('measure');
      const loginLoad = measures.find(m => m.name === 'loginPageLoad');
      
      // 로그인 페이지 로드 시간이 3초 이내여야 함
      expect(loginLoad.duration).to.be.lessThan(3000);
    });
    
    // 로그인 후 대시보드 로드 성능 측정
    cy.get('[data-testid="email-input"]').type('test@videoplanet.com');
    cy.get('[data-testid="password-input"]').type('testpassword123');
    
    cy.window().then((win) => {
      win.performance.mark('loginSubmitStart');
    });
    
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@loginRequest');
    
    cy.window().then((win) => {
      win.performance.mark('dashboardLoadEnd');
      win.performance.measure('loginToDashboard', 'loginSubmitStart', 'dashboardLoadEnd');
      
      const measures = win.performance.getEntriesByType('measure');
      const loginToDashboard = measures.find(m => m.name === 'loginToDashboard');
      
      // 로그인 후 대시보드 이동이 2초 이내여야 함
      expect(loginToDashboard.duration).to.be.lessThan(2000);
    });
  });
});