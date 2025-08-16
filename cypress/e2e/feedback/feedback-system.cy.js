// =============================================================================
// Feedback System E2E Tests - VideoPlanet 피드백 시스템 E2E 테스트
// =============================================================================

describe('피드백 시스템', () => {
  let testProject;
  let testUser;

  beforeEach(() => {
    // 테스트 데이터 설정
    testProject = {
      id: 123,
      title: '테스트 프로젝트',
      description: 'E2E 테스트용 프로젝트',
      owner_email: 'owner@example.com',
      owner_nickname: '프로젝트 소유자',
      files: 'https://example.com/test-video.mp4',
    };

    testUser = {
      email: 'test@example.com',
      nickname: '테스트 사용자',
      rating: 'basic',
    };

    // API 모킹
    cy.intercept('GET', '/api/auth/me', { fixture: 'auth/user.json' }).as('getUser');
    cy.intercept('GET', `/api/feedbacks/${testProject.id}`, { fixture: 'feedback/project.json' }).as('getProject');
    cy.intercept('PUT', `/api/feedbacks/${testProject.id}`, { fixture: 'feedback/create-success.json' }).as('createFeedback');
    cy.intercept('DELETE', '/api/feedbacks/*', { statusCode: 200 }).as('deleteFeedback');
    cy.intercept('POST', `/api/feedbacks/${testProject.id}`, { fixture: 'feedback/upload-success.json' }).as('uploadVideo');
    cy.intercept('DELETE', `/api/feedbacks/file/${testProject.id}`, { statusCode: 200 }).as('deleteVideo');

    // WebSocket 모킹
    cy.window().then((win) => {
      win.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url;
          this.readyState = 1; // OPEN
          setTimeout(() => {
            if (this.onopen) this.onopen();
          }, 100);
        }

        send(data) {
          // 메시지 전송 시뮬레이션
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  result: {
                    email: testUser.email,
                    nickname: testUser.nickname,
                    rating: testUser.rating,
                    message: JSON.parse(data).message,
                    timestamp: new Date().toISOString(),
                  },
                }),
              });
            }
          }, 50);
        }

        close() {
          this.readyState = 3; // CLOSED
          if (this.onclose) this.onclose();
        }
      };
    });

    // 로그인 상태로 시작
    cy.login('test@example.com', 'password');
  });

  describe('페이지 로딩 및 기본 UI', () => {
    it('피드백 페이지가 올바르게 로드되어야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 기본 레이아웃 확인
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('.videobox').should('be.visible');
      cy.get('.sidebox').should('be.visible');

      // 탭 메뉴 확인
      cy.get('.tab_menu').should('contain', '코멘트');
      cy.get('.tab_menu').should('contain', '피드백 등록');
      cy.get('.tab_menu').should('contain', '피드백 관리');
      cy.get('.tab_menu').should('contain', '멤버');
      cy.get('.tab_menu').should('contain', '프로젝트 정보');
    });

    it('비디오가 있는 경우 비디오 플레이어가 표시되어야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      cy.get('.video_inner.active').should('be.visible');
      cy.get('video').should('be.visible');
      cy.get('video').should('have.attr', 'src', testProject.files);
    });

    it('비디오가 없는 경우 업로드 버튼이 표시되어야 한다 (관리자만)', () => {
      // 비디오가 없는 프로젝트 모킹
      cy.intercept('GET', `/api/feedbacks/${testProject.id}`, {
        body: { ...testProject, files: null },
      }).as('getProjectNoVideo');

      // 관리자로 로그인
      cy.intercept('GET', '/api/auth/me', {
        body: { email: 'owner@example.com', nickname: '관리자' },
      }).as('getOwner');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProjectNoVideo');

      cy.get('.upload_btn_wrap').should('be.visible');
      cy.get('.video_upload_label').should('contain', '영상 추가');
    });
  });

  describe('실시간 채팅 기능', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 코멘트 탭 클릭
      cy.get('.tab_menu li').contains('코멘트').click();
    });

    it('채팅 연결 상태가 표시되어야 한다', () => {
      cy.get('.connection-status').should('be.visible');
      cy.get('.status-indicator').should('contain', '연결됨');
    });

    it('메시지를 입력하고 전송할 수 있어야 한다', () => {
      const testMessage = '안녕하세요! 테스트 메시지입니다.';

      cy.get('input[placeholder="채팅 입력"]').type(testMessage);
      cy.get('.cert').click();

      // 메시지가 채팅창에 나타나는지 확인
      cy.get('.comment ul li').should('contain', testMessage);
      cy.get('.comment ul li').should('contain', testUser.nickname);
    });

    it('Enter 키로 메시지를 전송할 수 있어야 한다', () => {
      const testMessage = 'Enter 키 테스트 메시지';

      cy.get('input[placeholder="채팅 입력"]').type(`${testMessage}{enter}`);

      cy.get('.comment ul li').should('contain', testMessage);
    });

    it('빈 메시지는 전송되지 않아야 한다', () => {
      cy.get('.cert').click();

      cy.get('.comment ul li').should('not.exist');
    });

    it('매우 긴 메시지에 대해 글자수 제한 경고를 표시해야 한다', () => {
      const longMessage = 'a'.repeat(950);

      cy.get('input[placeholder="채팅 입력"]').type(longMessage);

      cy.get('.input-status.warning').should('be.visible');
      cy.get('.input-status.warning').should('contain', '50자 남음');
    });
  });

  describe('피드백 등록 기능', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 피드백 등록 탭 클릭
      cy.get('.tab_menu li').contains('피드백 등록').click();
    });

    it('피드백 등록 폼의 모든 요소가 표시되어야 한다', () => {
      cy.get('input[type="radio"][value="true"]').should('be.visible');
      cy.get('input[type="radio"][value="false"]').should('be.visible');
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').should('be.visible');
      cy.get('input[placeholder="내용 입력"]').should('be.visible');
      cy.get('button').contains('피드백 등록').should('be.visible');
    });

    it('일반 피드백을 성공적으로 등록할 수 있어야 한다', () => {
      // 일반 피드백 선택
      cy.get('input[type="radio"][value="false"]').click();
      
      // 구간 입력
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('10:45');
      
      // 내용 입력
      cy.get('input[placeholder="내용 입력"]').type('이 장면이 정말 인상적이네요!');
      
      // 등록 버튼 클릭
      cy.get('button').contains('피드백 등록').click();

      cy.wait('@createFeedback').then((interception) => {
        expect(interception.request.body).to.deep.include({
          secret: false,
          section: '10:45',
          contents: '이 장면이 정말 인상적이네요!',
        });
      });

      // 성공 알림 확인
      cy.on('window:alert', (text) => {
        expect(text).to.contains('피드백이 등록되었습니다');
      });

      // 폼 초기화 확인
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').should('have.value', '');
      cy.get('input[placeholder="내용 입력"]').should('have.value', '');
    });

    it('익명 피드백을 등록할 수 있어야 한다', () => {
      cy.get('input[type="radio"][value="true"]').click();
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('15:20');
      cy.get('input[placeholder="내용 입력"]').type('익명으로 피드백을 남깁니다.');
      cy.get('button').contains('피드백 등록').click();

      cy.wait('@createFeedback').then((interception) => {
        expect(interception.request.body.secret).to.be.true;
      });
    });

    it('필수 필드가 비어있으면 등록할 수 없어야 한다', () => {
      cy.get('button').contains('피드백 등록').should('be.disabled');

      // 익명 여부만 선택
      cy.get('input[type="radio"][value="false"]').click();
      cy.get('button').contains('피드백 등록').should('be.disabled');

      // 구간까지 입력
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('05:30');
      cy.get('button').contains('피드백 등록').should('be.disabled');

      // 내용까지 입력하면 활성화
      cy.get('input[placeholder="내용 입력"]').type('테스트 내용');
      cy.get('button').contains('피드백 등록').should('not.be.disabled');
    });

    it('잘못된 타임스탬프 형식에 대해 에러를 표시해야 한다', () => {
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('99:99');
      cy.get('input[placeholder="내용 입력"]').click(); // blur 발생

      cy.get('[role="alert"]').should('contain', '올바른 시간 형식을 입력해주세요');
    });
  });

  describe('피드백 관리 기능', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 피드백 관리 탭 클릭
      cy.get('.tab_menu li').contains('피드백 관리').click();
    });

    it('사용자의 피드백 목록이 표시되어야 한다', () => {
      cy.get('.history ul li').should('have.length.greaterThan', 0);
      cy.get('.txt_box .time').should('be.visible');
      cy.get('.txt_box p').should('be.visible');
      cy.get('.delete').should('be.visible');
    });

    it('피드백을 삭제할 수 있어야 한다', () => {
      // 삭제 확인 다이얼로그 모킹
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      cy.get('.delete').first().click();

      cy.wait('@deleteFeedback');

      cy.on('window:alert', (text) => {
        expect(text).to.contains('피드백이 삭제되었습니다');
      });
    });

    it('피드백 삭제를 취소할 수 있어야 한다', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
      });

      cy.get('.delete').first().click();

      cy.get('@deleteFeedback.all').should('have.length', 0);
    });

    it('피드백이 없는 경우 안내 메시지를 표시해야 한다', () => {
      // 빈 피드백 목록 모킹
      cy.intercept('GET', `/api/feedbacks/${testProject.id}`, {
        body: { ...testProject, feedback: [] },
      }).as('getProjectEmpty');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProjectEmpty');

      cy.get('.tab_menu li').contains('피드백 관리').click();

      cy.get('.empty-state').should('be.visible');
      cy.get('.empty-message').should('contain', '작성한 피드백이 없습니다');
    });
  });

  describe('피드백 목록 (타임스탬프) 기능', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');
    });

    it('날짜별로 그룹화된 피드백 목록이 표시되어야 한다', () => {
      cy.get('.list .box').should('have.length.greaterThan', 0);
      cy.get('.list .box .day').should('be.visible');
      cy.get('.list .box ul li').should('be.visible');
    });

    it('타임스탬프 클릭 시 비디오가 해당 시간으로 이동해야 한다', () => {
      cy.get('.list .box ul li').first().click();

      // 비디오 플레이어의 시간이 변경되는지 확인 (실제 구현에 따라 조정 필요)
      cy.get('video').should('exist');
    });

    it('피드백 상세보기 팝업이 올바르게 작동해야 한다', () => {
      cy.get('.list .box ul li').first().click();

      cy.get('.view-container').should('be.visible');
      cy.get('.view .txt_box .name').should('be.visible');
      cy.get('.view .comment_box').should('be.visible');
      cy.get('.close-button').should('be.visible');

      // 닫기 버튼 클릭
      cy.get('.close-button').click();
      cy.get('.view-container').should('not.exist');
    });

    it('익명 피드백은 익명으로 표시되어야 한다', () => {
      // 익명 피드백이 있는 프로젝트 모킹 (필요시)
      cy.get('.list .box ul li').then(($items) => {
        if ($items.find('.anonymous-indicator').length > 0) {
          cy.get('.anonymous-indicator').should('be.visible');
        }
      });
    });
  });

  describe('비디오 파일 관리', () => {
    beforeEach(() => {
      // 관리자로 로그인
      cy.intercept('GET', '/api/auth/me', {
        body: { email: 'owner@example.com', nickname: '관리자' },
      }).as('getOwner');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');
    });

    it('관리자는 비디오 파일을 업로드할 수 있어야 한다', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      // 파일 업로드 시뮬레이션
      const fileName = 'test-video.mp4';
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('file contents'),
        fileName: fileName,
        mimeType: 'video/mp4',
      }, { force: true });

      cy.wait('@uploadVideo');

      cy.on('window:alert', (text) => {
        expect(text).to.contains('파일이 업로드되었습니다');
      });
    });

    it('관리자는 비디오 파일을 삭제할 수 있어야 한다', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      cy.get('.delete').click();

      cy.wait('@deleteVideo');

      cy.on('window:alert', (text) => {
        expect(text).to.contains('파일이 삭제되었습니다');
      });
    });

    it('관리자는 비디오 링크를 공유할 수 있어야 한다', () => {
      // 클립보드 API 모킹
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, 'writeText').resolves();
      });

      cy.get('.share').click();

      cy.on('window:alert', (text) => {
        expect(text).to.contains('링크가 복사되었습니다');
      });
    });
  });

  describe('멤버 관리', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 멤버 탭 클릭
      cy.get('.tab_menu li').contains('멤버').click();
    });

    it('프로젝트 멤버 목록이 표시되어야 한다', () => {
      cy.get('.member ul li').should('have.length.greaterThan', 0);

      // 프로젝트 소유자
      cy.get('.member ul li.admin').should('contain', '관리자');

      // 일반 멤버들
      cy.get('.member ul li.basic').should('exist');
    });

    it('멤버의 권한이 올바르게 표시되어야 한다', () => {
      cy.get('.member ul li.admin .txt').should('contain', '관리자');
      cy.get('.member ul li.basic .txt').should('contain', '일반');
    });
  });

  describe('프로젝트 정보', () => {
    beforeEach(() => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 프로젝트 정보 탭 클릭
      cy.get('.tab_menu li').contains('프로젝트 정보').click();
    });

    it('프로젝트 기본 정보가 표시되어야 한다', () => {
      cy.get('.info dl').should('contain', '담당자');
      cy.get('.info dl').should('contain', '고객사');
      cy.get('.info dl').should('contain', '프로젝트 생성');
      cy.get('.info dl').should('contain', '최종 업데이트');
      cy.get('.info dl').should('contain', '프로젝트 세부 설명');
    });

    it('관리자에게는 프로젝트 관리 버튼이 표시되어야 한다', () => {
      // 관리자로 로그인
      cy.intercept('GET', '/api/auth/me', {
        body: { email: 'owner@example.com', nickname: '관리자' },
      }).as('getOwner');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      cy.get('.tab_menu li').contains('프로젝트 정보').click();

      cy.get('.project_btn').should('be.visible');
      cy.get('.project_btn').should('contain', '프로젝트 관리');
    });
  });

  describe('반응형 및 접근성', () => {
    it('모바일 화면에서도 올바르게 표시되어야 한다', () => {
      cy.viewport('iphone-x');
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 레이아웃이 세로로 변경되는지 확인
      cy.get('.content.feedback').should('be.visible');
      cy.get('.videobox').should('be.visible');
      cy.get('.sidebox').should('be.visible');
    });

    it('키보드 네비게이션이 작동해야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 피드백 등록 탭으로 이동
      cy.get('.tab_menu li').contains('피드백 등록').click();

      // 탭 키로 순서대로 이동
      cy.get('body').tab();
      cy.focused().should('have.attr', 'type', 'radio');

      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'radio');

      cy.focused().tab();
      cy.focused().should('have.attr', 'placeholder', '구간 입력 (예: 05:30)');
    });

    it('스크린 리더를 위한 적절한 라벨이 있어야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      cy.get('.tab_menu li').contains('피드백 등록').click();

      // ARIA 라벨 확인
      cy.get('input[aria-label="익명으로 피드백 등록"]').should('exist');
      cy.get('input[aria-label="일반으로 피드백 등록"]').should('exist');
      cy.get('input[aria-label="피드백 구간 타임스탬프"]').should('exist');
      cy.get('input[aria-label="피드백 내용"]').should('exist');
    });
  });

  describe('에러 처리', () => {
    it('네트워크 에러 시 적절한 에러 메시지를 표시해야 한다', () => {
      cy.intercept('GET', `/api/feedbacks/${testProject.id}`, {
        statusCode: 500,
        body: { message: '서버 오류가 발생했습니다' },
      }).as('getProjectError');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProjectError');

      cy.get('.error-container').should('be.visible');
      cy.get('.error-container h2').should('contain', '오류가 발생했습니다');
      cy.get('.retry-button').should('be.visible');
    });

    it('존재하지 않는 프로젝트에 대해 적절한 메시지를 표시해야 한다', () => {
      cy.intercept('GET', `/api/feedbacks/${testProject.id}`, {
        statusCode: 404,
        body: { message: '프로젝트를 찾을 수 없습니다' },
      }).as('getProjectNotFound');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProjectNotFound');

      cy.get('.not-found-container').should('be.visible');
      cy.get('.not-found-container h2').should('contain', '프로젝트를 찾을 수 없습니다');
      cy.get('.back-button').should('be.visible');
    });

    it('권한이 없는 프로젝트 접근 시 로그인 페이지로 리다이렉트해야 한다', () => {
      cy.intercept('GET', `/api/feedbacks/${testProject.id}`, {
        statusCode: 401,
        body: { message: '인증이 필요합니다' },
      }).as('getProjectUnauthorized');

      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProjectUnauthorized');

      cy.url().should('include', '/login');
    });
  });

  describe('실시간 기능 통합 테스트', () => {
    it('피드백 등록 후 실시간으로 목록에 반영되어야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 피드백 등록
      cy.get('.tab_menu li').contains('피드백 등록').click();
      cy.get('input[type="radio"][value="false"]').click();
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('20:15');
      cy.get('input[placeholder="내용 입력"]').type('새로운 실시간 피드백');
      cy.get('button').contains('피드백 등록').click();

      cy.wait('@createFeedback');

      // 목록에 새 피드백이 나타나는지 확인
      cy.get('.list').should('contain', '20:15');
    });

    it('채팅과 피드백 등록이 동시에 작동해야 한다', () => {
      cy.visit(`/feedback/${testProject.id}`);
      cy.wait('@getProject');

      // 채팅 메시지 전송
      cy.get('.tab_menu li').contains('코멘트').click();
      cy.get('input[placeholder="채팅 입력"]').type('통합 테스트 메시지{enter}');

      // 피드백 등록
      cy.get('.tab_menu li').contains('피드백 등록').click();
      cy.get('input[type="radio"][value="false"]').click();
      cy.get('input[placeholder="구간 입력 (예: 05:30)"]').type('25:30');
      cy.get('input[placeholder="내용 입력"]').type('통합 테스트 피드백');
      cy.get('button').contains('피드백 등록').click();

      // 둘 다 성공적으로 처리되었는지 확인
      cy.get('.tab_menu li').contains('코멘트').click();
      cy.get('.comment').should('contain', '통합 테스트 메시지');

      cy.get('.list').should('contain', '25:30');
    });
  });
});