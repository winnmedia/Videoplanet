/**
 * Calendar System E2E Tests
 * 캘린더 시스템 전반에 대한 종단간 테스트
 */

describe('Calendar System E2E Tests', () => {
  // ========================
  // 테스트 설정
  // ========================
  
  beforeEach(() => {
    // 테스트 데이터 설정
    cy.intercept('GET', '/api/projects/project_list', {
      fixture: 'calendar/projects.json'
    }).as('getProjects');
    
    cy.intercept('GET', '/api/auth/user_memos', {
      fixture: 'calendar/user-memos.json'
    }).as('getUserMemos');
    
    cy.intercept('POST', '/api/projects/memo/*', {
      statusCode: 200,
      body: { success: true, memo: { id: 1, memo: 'Test memo', date: '2024-01-15' } }
    }).as('createProjectMemo');
    
    cy.intercept('POST', '/api/auth/user_memo', {
      statusCode: 200,
      body: { success: true, memo: { id: 1, memo: 'Test user memo', date: '2024-01-15' } }
    }).as('createUserMemo');
    
    // 로그인 상태 설정
    cy.window().then((win) => {
      win.localStorage.setItem('access_token', 'mock-access-token');
      win.localStorage.setItem('refresh_token', 'mock-refresh-token');
    });
  });

  // ========================
  // 기본 네비게이션 테스트
  // ========================

  describe('Basic Navigation and Layout', () => {
    it('should display calendar page with all components', () => {
      cy.visit('/calendar');
      cy.wait(['@getProjects', '@getUserMemos']);
      
      // 기본 레이아웃 요소들 확인
      cy.get('[data-testid="page-template"]').should('be.visible');
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('.title').should('contain.text', '전체 일정');
      
      // 캘린더 컴포넌트들 확인
      cy.get('.filter').should('be.visible');
      cy.get('.calendar_box').should('be.visible');
      cy.get('.list_mark').should('be.visible');
      cy.get('.part').should('be.visible');
      cy.get('.list_box').should('be.visible');
    });

    it('should navigate between months using arrow buttons', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 현재 월 확인
      cy.get('.date').invoke('text').then((currentMonth) => {
        // 다음 달로 이동
        cy.get('.next').click();
        cy.get('.date').invoke('text').should('not.equal', currentMonth);
        
        // 이전 달로 이동
        cy.get('.prev').click();
        cy.get('.date').invoke('text').should('equal', currentMonth);
      });
    });

    it('should change view types (월/주/일)', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 주 뷰로 변경
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('주').click();
      cy.url().should('include', 'view=주');
      
      // 일 뷰로 변경
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('일').click();
      cy.url().should('include', 'view=일');
      
      // 월 뷰로 복귀
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('월').click();
      cy.url().should('include', 'view=월');
    });
  });

  // ========================
  // 프로젝트 필터링 테스트
  // ========================

  describe('Project Filtering', () => {
    it('should filter projects by selection', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 필터 드롭다운 열기
      cy.get('.ant-select').first().click();
      
      // 특정 프로젝트 선택
      cy.get('.ant-select-item').contains('Test Project 1').click();
      
      // 선택된 프로젝트만 표시되는지 확인
      cy.get('.list_mark li').should('have.length.lessThan', 5);
      
      // 전체 프로젝트로 복귀
      cy.get('.ant-select').first().click();
      cy.get('.ant-select-item').contains('전체').click();
    });

    it('should show project color legends', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 색상 범례 확인
      cy.get('.list_mark ul li').should('have.length.greaterThan', 0);
      cy.get('.list_mark ul li span').should('have.attr', 'style');
    });
  });

  // ========================
  // 메모 기능 테스트
  // ========================

  describe('Memo Functionality', () => {
    it('should create a new memo on date click', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 특정 날짜 클릭
      cy.get('.calendar_box .td .week > div').first().find('p').click();
      
      // 메모 입력 모달 확인
      cy.get('.ant-modal').should('be.visible');
      cy.get('.day').should('be.visible');
      cy.get('textarea[name="textarea"]').should('be.visible');
      
      // 메모 입력
      const memoText = '테스트 메모입니다.';
      cy.get('textarea[name="textarea"]').type(memoText);
      
      // 등록 버튼 클릭
      cy.get('.submit').click();
      cy.wait('@createUserMemo');
      
      // 모달 닫힘 확인
      cy.get('.ant-modal').should('not.exist');
    });

    it('should display existing memos', () => {
      cy.visit('/calendar');
      cy.wait(['@getProjects', '@getUserMemos']);
      
      // 메모가 있는 날짜 확인
      cy.get('.memo').should('exist');
      cy.get('.memo').first().should('be.visible');
    });

    it('should view and delete existing memo', () => {
      cy.visit('/calendar');
      cy.wait(['@getProjects', '@getUserMemos']);
      
      // 기존 메모 클릭
      cy.get('.memo').first().click();
      
      // 메모 상세 모달 확인
      cy.get('.ant-modal').should('be.visible');
      cy.get('.memo_txt').should('be.visible');
      
      // 삭제 버튼이 있는지 확인 (권한에 따라)
      cy.get('.submit').should('contain.text', '삭제');
      
      // 닫기 버튼으로 모달 닫기
      cy.get('.cancel').click();
      cy.get('.ant-modal').should('not.exist');
    });

    it('should validate memo input', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 날짜 클릭하여 메모 모달 열기
      cy.get('.calendar_box .td .week > div').first().find('p').click();
      
      // 빈 내용으로 등록 시도
      cy.get('.submit').click();
      
      // 경고 메시지 확인 (실제로는 alert 대신 더 나은 UI로 구현해야 함)
      cy.on('window:alert', (str) => {
        expect(str).to.equal('메모를 작성해주세요.');
      });
    });
  });

  // ========================
  // 프로젝트 단계 관리 테스트
  // ========================

  describe('Project Phase Management', () => {
    it('should display project phases on calendar', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 단계 바 확인
      cy.get('.calendar_box .td .week > div span').should('have.class', 'first');
      cy.get('.calendar_box .td .week > div span').should('have.class', 'second');
    });

    it('should show phase tooltip on hover', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 단계 바에 마우스 오버
      cy.get('.first').first().trigger('mouseover');
      
      // 툴팁 표시 확인
      cy.get('.Modal').should('be.visible').and('contain.text', '기초기획안');
      
      // 마우스 아웃으로 툴팁 숨김
      cy.get('.first').first().trigger('mouseout');
      cy.get('.Modal').should('not.exist');
    });

    it('should open date update modal on phase click (admin only)', () => {
      // 관리자 권한 설정
      cy.window().then((win) => {
        win.localStorage.setItem('user_role', 'admin');
      });
      
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 단계 바 클릭
      cy.get('.first').first().click();
      
      // 날짜 업데이트 모달 확인
      cy.get('.ant-modal').should('be.visible');
      cy.get('.selec_wrap').should('be.visible');
      cy.get('input[placeholder="시작 날짜"]').should('be.visible');
      cy.get('input[placeholder="종료 날짜"]').should('be.visible');
      
      // 모달 닫기
      cy.get('.cancel').click();
    });
  });

  // ========================
  // 통계 및 프로젝트 목록 테스트
  // ========================

  describe('Statistics and Project List', () => {
    it('should display project statistics', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 통계 카드 확인
      cy.get('.part ul.schedule li').should('have.length', 4);
      cy.get('.part ul.schedule li').first().should('contain.text', '전체');
      cy.get('.part ul.schedule li').eq(1).should('contain.text', '이번 달');
      cy.get('.part ul.schedule li').eq(2).should('contain.text', '다음 달');
      
      // 숫자 표시 확인
      cy.get('.part ul.schedule li span').each(($el) => {
        cy.wrap($el).invoke('text').should('match', /^\d+$/);
      });
    });

    it('should display project phase lists with Swiper', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 프로젝트 단계별 목록 확인
      cy.get('.list_box .process').should('have.length', 8); // 8개 단계
      
      // 각 단계의 제목 확인
      const phases = [
        '기초기획안',
        '스토리보드',
        '촬영',
        '비디오 편집',
        '후반 작업',
        '비디오 시사',
        '최종 컨펌',
        '영상 납품'
      ];
      
      phases.forEach((phase, index) => {
        cy.get('.list_box .process').eq(index)
          .find('.s_title').should('contain.text', phase);
      });
      
      // Swiper 기능 확인
      cy.get('.swiper').should('exist');
      cy.get('.swiper-slide').should('have.length.greaterThan', 0);
    });

    it('should navigate through project phases using Swiper', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // Swiper 네비게이션 버튼 확인 및 사용
      cy.get('.swiper-button-next').first().should('be.visible');
      cy.get('.swiper-button-prev').first().should('be.visible');
      
      // 다음 슬라이드로 이동
      cy.get('.swiper-button-next').first().click();
      
      // 이전 슬라이드로 이동
      cy.get('.swiper-button-prev').first().click();
    });
  });

  // ========================
  // 반응형 디자인 테스트
  // ========================

  describe('Responsive Design', () => {
    it('should adapt layout for tablet screens', () => {
      cy.viewport(768, 1024);
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 태블릿에서도 주요 요소들이 표시되는지 확인
      cy.get('.title').should('be.visible');
      cy.get('.calendar_box').should('be.visible');
      
      // 모바일에서는 필터가 세로로 배치되는지 확인
      cy.get('.filter').should('exist');
    });

    it('should work on mobile screens', () => {
      cy.viewport(375, 667);
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 모바일에서 기본 기능이 작동하는지 확인
      cy.get('.calendar_box').should('be.visible');
      cy.get('.calendar_box .td .week > div').should('have.length.greaterThan', 0);
      
      // 터치 이벤트 시뮬레이션
      cy.get('.calendar_box .td .week > div').first().click();
    });
  });

  // ========================
  // 접근성 테스트
  // ========================

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 키보드로 네비게이션 버튼에 접근
      cy.get('body').tab();
      cy.focused().should('exist');
      
      // Enter/Space 키로 버튼 활성화
      cy.focused().type('{enter}');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // ARIA 라벨 확인
      cy.get('[aria-label="이전"]').should('exist');
      cy.get('[aria-label="다음"]').should('exist');
      cy.get('[role="main"]').should('exist');
    });

    it('should work with screen readers', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 스크린 리더용 텍스트 확인
      cy.get('.sr-only').should('exist');
      
      // 의미 있는 헤딩 구조 확인
      cy.get('h1, h2, h3').should('exist');
    });
  });

  // ========================
  // 성능 및 로딩 테스트
  // ========================

  describe('Performance and Loading', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/calendar');
      cy.wait(['@getProjects', '@getUserMemos']);
      
      cy.get('.calendar_box').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3초 이내 로딩
      });
    });

    it('should show loading states appropriately', () => {
      // 느린 네트워크 시뮬레이션
      cy.intercept('GET', '/api/projects/project_list', {
        delay: 2000,
        fixture: 'calendar/projects.json'
      }).as('getProjectsSlow');
      
      cy.visit('/calendar');
      
      // 로딩 상태 확인
      cy.get('[data-testid="calendar-skeleton"]').should('be.visible');
      
      cy.wait('@getProjectsSlow');
      
      // 로딩 완료 후 스켈레톤 숨김
      cy.get('[data-testid="calendar-skeleton"]').should('not.exist');
      cy.get('.calendar_box').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      // API 에러 시뮬레이션
      cy.intercept('GET', '/api/projects/project_list', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getProjectsError');
      
      cy.visit('/calendar');
      cy.wait('@getProjectsError');
      
      // 에러 메시지 표시 확인
      cy.get('.error-message').should('be.visible');
      cy.get('.error-message h3').should('contain.text', '오류가 발생했습니다');
      
      // 재시도 버튼 확인
      cy.get('.btn-retry').should('be.visible').and('contain.text', '다시 시도');
    });
  });

  // ========================
  // 데이터 지속성 테스트
  // ========================

  describe('Data Persistence', () => {
    it('should remember view type in URL', () => {
      cy.visit('/calendar?view=주');
      cy.wait('@getProjects');
      
      // URL 파라미터에 따른 뷰 타입 설정 확인
      cy.get('.ant-select').last().should('contain.text', '주');
      
      // 페이지 새로고침 후에도 유지되는지 확인
      cy.reload();
      cy.wait('@getProjects');
      cy.get('.ant-select').last().should('contain.text', '주');
    });

    it('should maintain filter state during navigation', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 특정 프로젝트 필터 선택
      cy.get('.ant-select').first().click();
      cy.get('.ant-select-item').contains('Test Project 1').click();
      
      // 다른 월로 이동
      cy.get('.next').click();
      
      // 필터 상태가 유지되는지 확인
      cy.get('.ant-select').first().should('contain.text', 'Test Project 1');
    });
  });

  // ========================
  // 통합 워크플로우 테스트
  // ========================

  describe('Complete User Workflows', () => {
    it('should complete project phase management workflow', () => {
      // 관리자로 로그인
      cy.window().then((win) => {
        win.localStorage.setItem('user_role', 'admin');
      });
      
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 1. 프로젝트 단계 확인
      cy.get('.first').should('be.visible');
      
      // 2. 단계 클릭하여 날짜 수정 모달 열기
      cy.get('.first').first().click();
      cy.get('.ant-modal').should('be.visible');
      
      // 3. 날짜 변경
      cy.get('input[placeholder="시작 날짜"]').clear().type('2024-01-20');
      cy.get('input[placeholder="종료 날짜"]').clear().type('2024-01-25');
      
      // 4. 변경 저장
      cy.intercept('POST', '/api/projects/date_update/*', {
        statusCode: 200,
        body: { success: true }
      }).as('updatePhaseDate');
      
      cy.get('.submit').click();
      cy.wait('@updatePhaseDate');
      
      // 5. 모달 닫힘 확인
      cy.get('.ant-modal').should('not.exist');
    });

    it('should complete memo management workflow', () => {
      cy.visit('/calendar');
      cy.wait(['@getProjects', '@getUserMemos']);
      
      // 1. 새 메모 생성
      cy.get('.calendar_box .td .week > div').eq(5).find('p').click();
      cy.get('textarea[name="textarea"]').type('새로운 테스트 메모');
      cy.get('.submit').click();
      cy.wait('@createUserMemo');
      
      // 2. 생성된 메모 확인 (실제로는 페이지 새로고침이나 상태 업데이트 필요)
      cy.reload();
      cy.wait(['@getProjects', '@getUserMemos']);
      
      // 3. 메모 클릭하여 상세 보기
      cy.get('.memo').first().click();
      cy.get('.memo_txt').should('be.visible');
      
      // 4. 메모 삭제
      cy.intercept('DELETE', '/api/auth/user_memo/*', {
        statusCode: 200,
        body: { success: true }
      }).as('deleteUserMemo');
      
      cy.get('.submit').click();
      cy.wait('@deleteUserMemo');
      
      // 5. 모달 닫힘 확인
      cy.get('.ant-modal').should('not.exist');
    });

    it('should complete view switching and navigation workflow', () => {
      cy.visit('/calendar');
      cy.wait('@getProjects');
      
      // 1. 월 뷰에서 시작
      cy.get('.ant-select').last().should('contain.text', '월');
      
      // 2. 주 뷰로 변경
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('주').click();
      cy.url().should('include', 'view=주');
      
      // 3. 다음 주로 이동
      cy.get('.next').click();
      
      // 4. 일 뷰로 변경
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('일').click();
      cy.url().should('include', 'view=일');
      
      // 5. 다음 날로 이동
      cy.get('.next').click();
      
      // 6. 월 뷰로 복귀
      cy.get('.ant-select').last().click();
      cy.get('.ant-select-item').contains('월').click();
      cy.url().should('include', 'view=월');
      
      // 7. 현재 월로 복귀
      cy.get('.prev').click();
    });
  });
});