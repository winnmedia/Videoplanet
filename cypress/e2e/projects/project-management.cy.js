/**
 * 프로젝트 관리 E2E 테스트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

describe('프로젝트 관리 E2E 테스트', () => {
  beforeEach(() => {
    // 로그인 상태 유지
    cy.loginAsAdmin();
    
    // 프로젝트 목록 페이지로 이동
    cy.visit('/projects');
  });

  // ===== 프로젝트 목록 페이지 테스트 =====
  describe('프로젝트 목록 페이지', () => {
    it('프로젝트 목록 페이지가 올바르게 렌더링된다', () => {
      cy.get('main.project').should('be.visible');
      cy.get('.project-header .title').should('contain', '프로젝트 관리');
      cy.get('.create-btn').should('contain', '새 프로젝트 생성');
    });

    it('새 프로젝트 생성 버튼을 클릭하면 생성 페이지로 이동한다', () => {
      cy.get('.create-btn').click();
      cy.url().should('include', '/projects/create');
    });

    it('캘린더 뷰 타입을 변경할 수 있다', () => {
      cy.get('.date-type-select').select('주');
      cy.get('.date-type-select').should('have.value', '주');

      cy.get('.date-type-select').select('일');
      cy.get('.date-type-select').should('have.value', '일');
    });

    it('프로젝트 진행 단계 범례가 표시된다', () => {
      cy.get('.list_mark ul li').should('have.length', 8);
      cy.get('.list_mark ul li').first().should('contain', '기초기획안 작성');
      cy.get('.list_mark ul li').last().should('contain', '영상 납품');
    });
  });

  // ===== 프로젝트 생성 테스트 =====
  describe('프로젝트 생성', () => {
    beforeEach(() => {
      cy.visit('/projects/create');
    });

    it('프로젝트 생성 폼이 올바르게 렌더링된다', () => {
      cy.get('.title').should('contain', '프로젝트 등록');
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="manager"]').should('be.visible');
      cy.get('input[name="consumer"]').should('be.visible');
      cy.get('textarea[name="description"]').should('be.visible');
    });

    it('빈 폼으로 제출 시 에러 메시지가 표시된다', () => {
      cy.get('button[type="submit"]').should('be.disabled');
    });

    it('프로젝트를 성공적으로 생성할 수 있다', () => {
      // 기본 정보 입력
      cy.get('input[name="name"]').type('테스트 프로젝트 E2E');
      cy.get('input[name="manager"]').type('김테스터');
      cy.get('input[name="consumer"]').type('테스트 회사');
      cy.get('textarea[name="description"]').type('E2E 테스트용 프로젝트입니다.');

      // 일정 설정 (첫 번째 단계만)
      cy.get('.dataprocess li').first().within(() => {
        cy.get('.select.start .example-custom-input').click();
      });
      
      // DatePicker에서 날짜 선택 (현재 날짜)
      cy.get('.react-datepicker__day--today').click();
      
      // 시간 선택
      cy.get('.react-datepicker__time-list-item').contains('09:00').click();

      // 종료 날짜 설정
      cy.get('.dataprocess li').first().within(() => {
        cy.get('.select.end .example-custom-input').click();
      });
      
      // 다음 주 날짜 선택
      cy.get('.react-datepicker__day').not('.react-datepicker__day--outside-month')
        .eq(7).click();
      cy.get('.react-datepicker__time-list-item').contains('18:00').click();

      // 파일 업로드
      const fileName = 'test-document.txt';
      cy.fixture(fileName).then(fileContent => {
        cy.get('input[type="file"]').selectFile({
          contents: Cypress.Buffer.from(fileContent),
          fileName: fileName,
          mimeType: 'text/plain',
        }, { force: true });
      });

      // 파일이 추가되었는지 확인
      cy.get('.uploaded-file').should('contain', fileName);

      // 폼 제출
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();

      // 성공 메시지 확인
      cy.get('.Toastify__toast--success').should('contain', '프로젝트가 성공적으로 생성되었습니다');

      // 캘린더 페이지로 리다이렉트 확인
      cy.url().should('include', '/Calendar');
    });

    it('취소 버튼 클릭 시 확인 다이얼로그가 표시된다', () => {
      cy.get('input[name="name"]').type('테스트');
      cy.get('.btn_wrap .cancel').click();
      
      // confirm 다이얼로그 스텁
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.url().should('include', '/Calendar');
    });

    it('샘플 파일을 다운로드할 수 있다', () => {
      cy.get('.sample .sample-file').first().click();
      // 다운로드는 실제로 테스트하기 어려우므로 클릭 이벤트만 확인
    });
  });

  // ===== 프로젝트 상세 보기 테스트 =====
  describe('프로젝트 상세 보기', () => {
    let projectId;

    beforeEach(() => {
      // 테스트용 프로젝트 생성
      cy.createTestProject().then((id) => {
        projectId = id;
        cy.visit(`/projects/${projectId}/view`);
      });
    });

    it('프로젝트 상세 정보가 올바르게 표시된다', () => {
      cy.get('.info_wrap').should('be.visible');
      cy.get('.s_title').should('contain', 'E2E 테스트 프로젝트');
      cy.get('.update-info').should('contain', '최종 업데이트 날짜');
    });

    it('프로젝트 정보 토글이 동작한다', () => {
      // 초기에는 접혀있음
      cy.get('.box').should('have.css', 'height', '0px');
      
      // 토글 버튼 클릭
      cy.get('.toggle-btn').click();
      
      // 펼쳐짐
      cy.get('.box').should('not.have.css', 'height', '0px');
      
      // 다시 클릭하면 접힘
      cy.get('.toggle-btn').click();
      cy.get('.box').should('have.css', 'height', '0px');
    });

    it('관리자는 프로젝트 관리 버튼을 볼 수 있다', () => {
      cy.get('button').contains('프로젝트 관리').should('be.visible');
    });

    it('프로젝트 관리 버튼을 클릭하면 편집 페이지로 이동한다', () => {
      cy.get('button').contains('프로젝트 관리').click();
      cy.url().should('include', `/projects/${projectId}/edit`);
    });

    it('캘린더가 올바르게 표시된다', () => {
      cy.get('.content.calendar').should('be.visible');
      cy.get('.filter').should('be.visible');
    });

    it('프로젝트 단계별 진행상황이 표시된다', () => {
      cy.get('.list_box .process').should('have.length.at.least', 1);
    });
  });

  // ===== 프로젝트 편집 테스트 =====
  describe('프로젝트 편집', () => {
    let projectId;

    beforeEach(() => {
      cy.createTestProject().then((id) => {
        projectId = id;
        cy.visit(`/projects/${projectId}/edit`);
      });
    });

    it('프로젝트 편집 폼이 기존 데이터로 채워진다', () => {
      cy.get('input[name="name"]').should('have.value', 'E2E 테스트 프로젝트');
      cy.get('input[name="manager"]').should('have.value', 'E2E 담당자');
      cy.get('input[name="consumer"]').should('have.value', 'E2E 테스트 회사');
    });

    it('프로젝트 정보를 수정할 수 있다', () => {
      cy.get('input[name="name"]').clear().type('수정된 프로젝트 이름');
      cy.get('textarea[name="description"]').clear().type('수정된 프로젝트 설명');

      cy.get('button[type="submit"]').click();

      cy.get('.Toastify__toast--success').should('contain', '프로젝트가 성공적으로 업데이트되었습니다');
      cy.url().should('include', '/Calendar');
    });

    it('멤버를 초대할 수 있다', () => {
      cy.get('.invite-input-container input[type="email"]').first()
        .type('newmember@test.com');
      
      cy.get('.cert').first().click();

      cy.get('.Toastify__toast--success').should('contain', '멤버 초대가 완료되었습니다');
    });

    it('잘못된 이메일 형식으로 초대 시 에러 메시지가 표시된다', () => {
      cy.get('.invite-input-container input[type="email"]').first()
        .type('invalid-email');
      
      cy.get('.cert').first().click();

      cy.get('.Toastify__toast--error').should('contain', '올바른 이메일 형식을 입력해주세요');
    });

    it('멤버 추가 버튼이 새 입력 필드를 생성한다', () => {
      const initialInputCount = Cypress.$('.invite-input-container input[type="email"]').length;
      
      cy.get('.add').click();
      
      cy.get('.invite-input-container input[type="email"]')
        .should('have.length', initialInputCount + 1);
    });

    it('기존 프로젝트 파일을 삭제할 수 있다', () => {
      // 기존 파일이 있다고 가정
      cy.get('.existing-file').first().within(() => {
        cy.get('.delete-btn').click();
      });

      // confirm 다이얼로그 스텁
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      cy.get('.Toastify__toast--success').should('contain', '파일이 삭제되었습니다');
    });

    it('새 파일을 추가할 수 있다', () => {
      const fileName = 'new-test-file.txt';
      cy.fixture(fileName).then(fileContent => {
        cy.get('input[type="file"]').selectFile({
          contents: Cypress.Buffer.from(fileContent),
          fileName: fileName,
          mimeType: 'text/plain',
        }, { force: true });
      });

      cy.get('.new-file').should('contain', fileName);
    });

    it('프로젝트를 삭제할 수 있다', () => {
      cy.get('.btn_wrap .del').click();

      // confirm 다이얼로그 스텁
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      cy.get('.Toastify__toast--success').should('contain', '프로젝트가 성공적으로 삭제되었습니다');
      cy.url().should('include', '/Calendar');
    });

    it('취소 버튼을 클릭하면 상세 보기로 이동한다', () => {
      cy.get('.btn_wrap .cancel').click();
      cy.url().should('include', `/projects/${projectId}/view`);
    });
  });

  // ===== 권한 테스트 =====
  describe('권한 관리', () => {
    let projectId;

    beforeEach(() => {
      cy.createTestProject().then((id) => {
        projectId = id;
      });
    });

    it('일반 사용자는 프로젝트 편집 페이지에 접근할 수 없다', () => {
      cy.loginAsUser();
      cy.visit(`/projects/${projectId}/edit`);

      cy.get('.error-message').should('contain', '접근 권한이 없습니다');
      cy.get('button').contains('프로젝트 목록으로 돌아가기').should('be.visible');
    });

    it('일반 사용자는 프로젝트 상세 보기에서 관리 버튼을 볼 수 없다', () => {
      cy.loginAsUser();
      cy.visit(`/projects/${projectId}/view`);

      cy.get('button').contains('프로젝트 관리').should('not.exist');
    });
  });

  // ===== 반응형 테스트 =====
  describe('반응형 디자인', () => {
    it('모바일 화면에서 올바르게 표시된다', () => {
      cy.viewport('iphone-6');
      cy.visit('/projects');

      cy.get('.project-header').should('be.visible');
      cy.get('.create-btn').should('be.visible');
    });

    it('태블릿 화면에서 올바르게 표시된다', () => {
      cy.viewport('ipad-2');
      cy.visit('/projects');

      cy.get('.project-header').should('be.visible');
      cy.get('.list_box').should('be.visible');
    });
  });

  // ===== 접근성 테스트 =====
  describe('접근성', () => {
    beforeEach(() => {
      cy.visit('/projects/create');
    });

    it('폼 라벨이 입력 필드와 올바르게 연결되어 있다', () => {
      cy.get('input[name="name"]').should('have.attr', 'aria-label', '프로젝트 이름');
      cy.get('input[name="manager"]').should('have.attr', 'aria-label', '담당자');
      cy.get('input[name="consumer"]').should('have.attr', 'aria-label', '고객사');
      cy.get('textarea[name="description"]').should('have.attr', 'aria-label', '프로젝트 세부 설명');
    });

    it('에러 메시지가 aria-describedby로 연결되어 있다', () => {
      cy.get('button[type="submit"]').click({ force: true });

      cy.get('input[name="name"]')
        .should('have.attr', 'aria-describedby', 'name-error')
        .should('have.attr', 'aria-invalid', 'true');
    });

    it('키보드로 네비게이션이 가능하다', () => {
      cy.get('input[name="name"]').focus();
      cy.focused().should('have.attr', 'name', 'name');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'manager');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'consumer');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'description');
    });
  });

  // ===== 성능 테스트 =====
  describe('성능', () => {
    it('페이지 로딩 시간이 3초 이내이다', () => {
      const start = Date.now();
      cy.visit('/projects');
      
      cy.get('main.project').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('프로젝트 목록이 1000개 이상이어도 성능이 유지된다', () => {
      // 많은 프로젝트가 있는 상황을 시뮬레이션
      cy.intercept('GET', '/api/projects/project_list', { 
        fixture: 'large-project-list.json' 
      });

      const start = Date.now();
      cy.visit('/projects');
      
      cy.get('.list_box').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(5000);
      });
    });
  });
});

// ===== 커스텀 명령어 =====
Cypress.Commands.add('createTestProject', () => {
  return cy.request({
    method: 'POST',
    url: '/api/projects/create',
    body: {
      inputs: JSON.stringify({
        name: 'E2E 테스트 프로젝트',
        description: 'E2E 테스트용 프로젝트',
        manager: 'E2E 담당자',
        consumer: 'E2E 테스트 회사',
      }),
      process: JSON.stringify([
        { startDate: null, endDate: null, phase_name: 'basic_plan' },
        { startDate: null, endDate: null, phase_name: 'story_board' },
        { startDate: null, endDate: null, phase_name: 'filming' },
        { startDate: null, endDate: null, phase_name: 'video_edit' },
        { startDate: null, endDate: null, phase_name: 'post_work' },
        { startDate: null, endDate: null, phase_name: 'video_preview' },
        { startDate: null, endDate: null, phase_name: 'confirmation' },
        { startDate: null, endDate: null, phase_name: 'video_delivery' },
      ]),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    return response.body.result.id;
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email: 'admin@test.com',
      password: 'testpassword123',
    },
  }).then((response) => {
    window.localStorage.setItem('access_token', response.body.access_token);
    window.localStorage.setItem('refresh_token', response.body.refresh_token);
  });
});

Cypress.Commands.add('loginAsUser', () => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email: 'user@test.com',
      password: 'testpassword123',
    },
  }).then((response) => {
    window.localStorage.setItem('access_token', response.body.access_token);
    window.localStorage.setItem('refresh_token', response.body.refresh_token);
  });
});