// E2E 테스트 - 레이아웃 시스템
// VideoPlanet (VRidge) 통합 레이아웃 컴포넌트 테스트

describe('레이아웃 시스템 E2E 테스트', () => {
  beforeEach(() => {
    // 로그인 상태 설정
    cy.window().then((win) => {
      win.localStorage.setItem('VGID', 'test-token');
      win.localStorage.setItem('USER_INFO', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        nickname: 'TestUser'
      }));
    });

    // 프로젝트 API 모킹
    cy.intercept('GET', '/api/projects', {
      fixture: 'projects.json'
    }).as('getProjects');

    cy.visit('/dashboard');
    cy.wait('@getProjects');
  });

  describe('전체 레이아웃 렌더링', () => {
    it('기본 레이아웃 요소들이 모두 표시된다', () => {
      // Header 확인
      cy.get('[role="banner"]').should('be.visible');
      cy.get('[data-testid="logo"]').should('be.visible');
      cy.get('[data-testid="user-profile"]').should('be.visible');

      // Sidebar 확인
      cy.get('[role="navigation"][aria-label="주 네비게이션"]').should('be.visible');
      cy.get('[role="menubar"]').should('be.visible');

      // Main content 확인
      cy.get('[role="main"]').should('be.visible');

      // 로그아웃 버튼 확인
      cy.contains('로그아웃').should('be.visible');
    });

    it('네비게이션 메뉴가 올바르게 표시된다', () => {
      const menuItems = ['홈', '전체 일정', '프로젝트 관리', '영상 피드백', '콘텐츠'];
      
      menuItems.forEach(item => {
        cy.contains(item).should('be.visible');
      });

      // 프로젝트 수 배지 확인
      cy.get('[data-testid="nav-item-projects"]')
        .find('[data-testid="badge"]')
        .should('be.visible')
        .and('contain.text', '3'); // fixture의 프로젝트 수
    });
  });

  describe('네비게이션 동작', () => {
    it('홈 메뉴 클릭 시 올바른 페이지로 이동한다', () => {
      cy.contains('홈').click();
      cy.url().should('include', '/CmsHome');
    });

    it('전체 일정 메뉴 클릭 시 달력 페이지로 이동한다', () => {
      cy.contains('전체 일정').click();
      cy.url().should('include', '/Calendar');
    });

    it('콘텐츠 메뉴 클릭 시 이러닝 페이지로 이동한다', () => {
      cy.contains('콘텐츠').click();
      cy.url().should('include', '/Elearning');
    });

    it('로고 클릭 시 홈으로 이동한다', () => {
      cy.get('[data-testid="logo"]').click();
      cy.url().should('include', '/CmsHome');
    });
  });

  describe('서브메뉴 동작', () => {
    it('프로젝트 관리 메뉴 클릭 시 서브메뉴가 열린다', () => {
      cy.contains('프로젝트 관리').click();
      
      // 서브메뉴 확인
      cy.get('[role="dialog"][aria-label="프로젝트 관리 서브메뉴"]')
        .should('be.visible');
      
      // 서브메뉴 제목 확인
      cy.contains('프로젝트 관리').should('be.visible');
      
      // 프로젝트 목록 확인
      cy.contains('Test Project 1').should('be.visible');
      cy.contains('Test Project 2').should('be.visible');
      
      // 프로젝트 생성 버튼 확인
      cy.get('[data-testid="submenu-create-project"]').should('be.visible');
      
      // 닫기 버튼 확인
      cy.get('[data-testid="submenu-close"]').should('be.visible');
    });

    it('영상 피드백 메뉴 클릭 시 서브메뉴가 열린다', () => {
      cy.contains('영상 피드백').click();
      
      // 서브메뉴 확인
      cy.get('[role="dialog"][aria-label="영상 피드백 서브메뉴"]')
        .should('be.visible');
      
      // 서브메뉴 제목 확인
      cy.contains('영상 피드백').should('be.visible');
      
      // 프로젝트 목록 확인 (피드백용)
      cy.contains('Test Project 1').should('be.visible');
    });

    it('서브메뉴에서 프로젝트 클릭 시 해당 페이지로 이동한다', () => {
      // 프로젝트 관리 서브메뉴 열기
      cy.contains('프로젝트 관리').click();
      
      // 프로젝트 클릭
      cy.contains('Test Project 1').click();
      cy.url().should('include', '/projects/1/view');
    });

    it('서브메뉴에서 피드백 프로젝트 클릭 시 피드백 페이지로 이동한다', () => {
      // 영상 피드백 서브메뉴 열기
      cy.contains('영상 피드백').click();
      
      // 프로젝트 클릭
      cy.contains('Test Project 1').click();
      cy.url().should('include', '/feedback/1');
    });

    it('서브메뉴 닫기 버튼이 동작한다', () => {
      // 서브메뉴 열기
      cy.contains('프로젝트 관리').click();
      cy.get('[role="dialog"]').should('be.visible');
      
      // 닫기 버튼 클릭
      cy.get('[data-testid="submenu-close"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('프로젝트 생성 버튼이 동작한다', () => {
      // 서브메뉴 열기
      cy.contains('프로젝트 관리').click();
      
      // 프로젝트 생성 버튼 클릭
      cy.get('[data-testid="submenu-create-project"]').click();
      cy.url().should('include', '/projects/create');
    });
  });

  describe('프로젝트가 없는 경우', () => {
    beforeEach(() => {
      // 빈 프로젝트 목록으로 모킹
      cy.intercept('GET', '/api/projects', { body: [] }).as('getEmptyProjects');
      cy.reload();
      cy.wait('@getEmptyProjects');
    });

    it('빈 상태 메시지가 표시된다', () => {
      cy.contains('프로젝트 관리').click();
      
      cy.contains('등록된').should('be.visible');
      cy.contains('프로젝트가 없습니다').should('be.visible');
    });

    it('첫 프로젝트 등록 버튼이 동작한다', () => {
      cy.contains('프로젝트 관리').click();
      
      cy.contains('프로젝트 등록').click();
      cy.url().should('include', '/projects/create');
    });
  });

  describe('사용자 프로필 동작', () => {
    it('사용자 정보가 올바르게 표시된다', () => {
      cy.get('[data-testid="user-profile"]').should('be.visible');
      cy.contains('TestUser').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
    });

    it('사용자 아바타가 표시된다', () => {
      cy.get('[data-testid="user-avatar"]').should('be.visible');
      cy.get('[data-testid="user-avatar"]')
        .should('contain.text', 'T'); // TestUser의 이니셜
    });
  });

  describe('로그아웃 기능', () => {
    it('로그아웃 버튼 클릭 시 로그인 페이지로 이동한다', () => {
      cy.contains('로그아웃').click();
      
      // 로컬 스토리지가 비워졌는지 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('VGID')).to.be.null;
      });
      
      // 로그인 페이지로 리디렉션 확인
      cy.url().should('include', '/login');
    });
  });

  describe('반응형 동작', () => {
    it('모바일에서 레이아웃이 올바르게 조정된다', () => {
      cy.viewport('iphone-x');
      
      // 헤더는 여전히 표시
      cy.get('[role="banner"]').should('be.visible');
      
      // 사이드바는 축소되거나 숨겨짐
      cy.get('[role="navigation"]').should('have.class', 'sidebar--collapsed');
    });

    it('태블릿에서 레이아웃이 올바르게 조정된다', () => {
      cy.viewport('ipad-2');
      
      cy.get('[role="banner"]').should('be.visible');
      cy.get('[role="navigation"]').should('be.visible');
      cy.get('[role="main"]').should('be.visible');
    });
  });

  describe('키보드 접근성', () => {
    it('Tab 키로 네비게이션이 가능하다', () => {
      // 첫 번째 포커스 가능한 요소로 이동
      cy.get('body').tab();
      
      // 로고에 포커스
      cy.focused().should('have.attr', 'data-testid', 'logo');
      
      // 다음 요소로 이동
      cy.focused().tab();
      
      // 홈 메뉴에 포커스
      cy.focused().should('contain.text', '홈');
    });

    it('Enter 키로 메뉴 활성화가 가능하다', () => {
      // 홈 메뉴에 포커스
      cy.contains('홈').focus();
      
      // Enter 키로 활성화
      cy.focused().type('{enter}');
      
      cy.url().should('include', '/CmsHome');
    });

    it('Space 키로 메뉴 활성화가 가능하다', () => {
      // 전체 일정 메뉴에 포커스
      cy.contains('전체 일정').focus();
      
      // Space 키로 활성화
      cy.focused().type(' ');
      
      cy.url().should('include', '/Calendar');
    });

    it('Escape 키로 서브메뉴를 닫을 수 있다', () => {
      // 서브메뉴 열기
      cy.contains('프로젝트 관리').click();
      cy.get('[role="dialog"]').should('be.visible');
      
      // Escape 키로 닫기
      cy.get('body').type('{esc}');
      cy.get('[role="dialog"]').should('not.exist');
    });
  });

  describe('로딩 상태', () => {
    it('프로젝트 로딩 중 스켈레톤이 표시된다', () => {
      // 느린 응답 모킹
      cy.intercept('GET', '/api/projects', { 
        delay: 2000,
        fixture: 'projects.json' 
      }).as('getSlowProjects');
      
      cy.reload();
      
      // 로딩 상태 확인
      cy.get('[data-testid="sidebar-skeleton"]').should('be.visible');
      
      cy.wait('@getSlowProjects');
      
      // 로딩 완료 후 프로젝트 표시
      cy.contains('프로젝트 관리').click();
      cy.contains('Test Project 1').should('be.visible');
    });
  });

  describe('에러 처리', () => {
    it('프로젝트 로딩 실패 시 에러 메시지가 표시된다', () => {
      // API 에러 모킹
      cy.intercept('GET', '/api/projects', { 
        statusCode: 500,
        body: { error: 'Server Error' }
      }).as('getProjectsError');
      
      cy.reload();
      cy.wait('@getProjectsError');
      
      // 에러 상태 확인
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('프로젝트를 불러올 수 없습니다').should('be.visible');
    });

    it('네트워크 에러 시 재시도 버튼이 표시된다', () => {
      // 네트워크 에러 모킹
      cy.intercept('GET', '/api/projects', { forceNetworkError: true }).as('getNetworkError');
      
      cy.reload();
      cy.wait('@getNetworkError');
      
      // 재시도 버튼 확인
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // 재시도 동작 확인
      cy.intercept('GET', '/api/projects', { fixture: 'projects.json' }).as('getProjectsRetry');
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@getProjectsRetry');
      
      // 정상 로딩 확인
      cy.contains('프로젝트 관리').should('be.visible');
    });
  });

  describe('성능 테스트', () => {
    it('페이지 로딩 시간이 적절하다', () => {
      const startTime = performance.now();
      
      cy.visit('/dashboard');
      cy.wait('@getProjects');
      
      cy.then(() => {
        const loadTime = performance.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3초 이내
      });
    });

    it('서브메뉴 전환이 부드럽다', () => {
      // 애니메이션 시간 측정
      cy.contains('프로젝트 관리').click();
      
      cy.get('[role="dialog"]')
        .should('be.visible')
        .and('have.css', 'transition-duration', '0.5s');
    });
  });

  describe('브라우저 호환성', () => {
    it('Chrome에서 모든 기능이 동작한다', () => {
      // Chrome 특정 테스트
      cy.contains('프로젝트 관리').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    // 추가 브라우저 테스트는 CI/CD에서 수행
  });
});

// 통합 워크플로우 테스트
describe('전체 레이아웃 워크플로우', () => {
  beforeEach(() => {
    // 로그인 상태 설정
    cy.window().then((win) => {
      win.localStorage.setItem('VGID', 'test-token');
    });

    cy.intercept('GET', '/api/projects', { fixture: 'projects.json' }).as('getProjects');
    cy.visit('/dashboard');
    cy.wait('@getProjects');
  });

  it('완전한 네비게이션 플로우가 동작한다', () => {
    // 1. 홈에서 시작
    cy.contains('홈').click();
    cy.url().should('include', '/CmsHome');

    // 2. 프로젝트 관리로 이동
    cy.contains('프로젝트 관리').click();
    cy.get('[role="dialog"]').should('be.visible');

    // 3. 특정 프로젝트 선택
    cy.contains('Test Project 1').click();
    cy.url().should('include', '/projects/1/view');

    // 4. 피드백으로 이동
    cy.contains('영상 피드백').click();
    cy.contains('Test Project 1').click();
    cy.url().should('include', '/feedback/1');

    // 5. 달력으로 이동
    cy.contains('전체 일정').click();
    cy.url().should('include', '/Calendar');

    // 6. 로그아웃
    cy.contains('로그아웃').click();
    cy.url().should('include', '/login');
  });

  it('프로젝트 생성부터 피드백까지 전체 플로우', () => {
    // 1. 새 프로젝트 생성
    cy.contains('프로젝트 관리').click();
    cy.get('[data-testid="submenu-create-project"]').click();
    cy.url().should('include', '/projects/create');

    // 2. 프로젝트 생성 (실제로는 form 작성)
    // cy.get('[data-testid="project-form"]').within(() => {
    //   cy.get('input[name="name"]').type('New Test Project');
    //   cy.get('button[type="submit"]').click();
    // });

    // 3. 생성된 프로젝트 확인 (목록에서)
    cy.contains('프로젝트 관리').click();
    cy.contains('New Test Project').should('be.visible');

    // 4. 해당 프로젝트 피드백 페이지로 이동
    cy.contains('영상 피드백').click();
    cy.contains('New Test Project').click();
    cy.url().should('include', '/feedback/');
  });
});