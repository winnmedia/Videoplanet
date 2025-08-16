// 프로젝트 관리 E2E 테스트
describe('Project Management', () => {
  beforeEach(() => {
    // 테스트 데이터 초기화
    cy.task('resetDb')
    
    // 테스트 사용자 로그인
    cy.loginWithAPI()
    
    // 테스트 프로젝트 데이터 생성
    cy.task('createTestData', {
      projects: [
        {
          id: 1,
          title: 'Test Project 1',
          description: 'First test project',
          status: 'active',
          created_at: '2023-01-01',
        },
        {
          id: 2,
          title: 'Test Project 2',
          description: 'Second test project',
          status: 'completed',
          created_at: '2023-01-02',
        },
      ],
    })
  })

  describe('Project Creation', () => {
    it('creates a new project successfully', () => {
      cy.visit('/project/create')
      
      // 프로젝트 생성 폼 확인
      cy.get('[data-testid="project-create-form"]').should('be.visible')
      
      // 프로젝트 정보 입력
      cy.get('[data-testid="project-title"]').type('New Test Project')
      cy.get('[data-testid="project-description"]').type('This is a test project description')
      
      // 프로젝트 설정
      cy.get('[data-testid="project-color"]').click()
      cy.get('[data-testid="color-blue"]').click()
      
      // 기본 계획 설정
      cy.get('[data-testid="start-date"]').type('2023-12-01')
      cy.get('[data-testid="end-date"]').type('2023-12-31')
      
      // 팀 멤버 초대
      cy.get('[data-testid="invite-email"]').type('member@videoplanet.com')
      cy.get('[data-testid="add-member"]').click()
      
      cy.get('[data-testid="member-list"]')
        .should('contain', 'member@videoplanet.com')
      
      // 프로젝트 생성
      cy.get('[data-testid="create-button"]').click()
      
      // 성공 메시지 확인
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '프로젝트가 생성되었습니다')
      
      // 프로젝트 상세 페이지로 이동 확인
      cy.url().should('include', '/project/view/')
      cy.get('[data-testid="project-title"]').should('contain', 'New Test Project')
    })

    it('validates required fields', () => {
      cy.visit('/project/create')
      
      // 빈 폼으로 제출 시도
      cy.get('[data-testid="create-button"]').click()
      
      // 유효성 검사 에러 확인
      cy.get('[data-testid="title-error"]')
        .should('be.visible')
        .and('contain', '프로젝트 제목을 입력해주세요')
      
      cy.get('[data-testid="description-error"]')
        .should('be.visible')
        .and('contain', '프로젝트 설명을 입력해주세요')
    })

    it('handles duplicate project names', () => {
      cy.visit('/project/create')
      
      // 기존 프로젝트와 같은 이름으로 생성 시도
      cy.get('[data-testid="project-title"]').type('Test Project 1')
      cy.get('[data-testid="project-description"]').type('Duplicate project')
      cy.get('[data-testid="create-button"]').click()
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '이미 존재하는 프로젝트 이름입니다')
    })

    it('supports file upload for project assets', () => {
      cy.visit('/project/create')
      
      cy.fillForm({
        'project-title': 'Project with Files',
        'project-description': 'Project description',
      })
      
      // 파일 업로드
      cy.get('[data-testid="file-upload"]').should('be.visible')
      cy.uploadFile('[data-testid="file-upload"]', 'test-image.png')
      
      // 업로드된 파일 확인
      cy.get('[data-testid="uploaded-files"]')
        .should('contain', 'test-image.png')
      
      cy.get('[data-testid="create-button"]').click()
      
      cy.url().should('include', '/project/view/')
    })
  })

  describe('Project List and Search', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
    })

    it('displays project list correctly', () => {
      cy.get('[data-testid="project-list"]').should('be.visible')
      cy.get('[data-testid="project-card"]').should('have.length', 2)
      
      // 첫 번째 프로젝트 확인
      cy.get('[data-testid="project-card"]').first().within(() => {
        cy.get('[data-testid="project-title"]').should('contain', 'Test Project 1')
        cy.get('[data-testid="project-status"]').should('contain', 'active')
      })
    })

    it('filters projects by status', () => {
      // 진행중 프로젝트만 필터링
      cy.get('[data-testid="status-filter"]').select('active')
      
      cy.get('[data-testid="project-card"]').should('have.length', 1)
      cy.get('[data-testid="project-card"]').first()
        .should('contain', 'Test Project 1')
    })

    it('searches projects by title', () => {
      cy.get('[data-testid="search-input"]').type('Test Project 1')
      
      cy.get('[data-testid="project-card"]').should('have.length', 1)
      cy.get('[data-testid="project-card"]').first()
        .should('contain', 'Test Project 1')
    })

    it('sorts projects by different criteria', () => {
      // 날짜별 정렬
      cy.get('[data-testid="sort-dropdown"]').select('created_at')
      
      cy.get('[data-testid="project-card"]').first()
        .should('contain', 'Test Project 2') // 더 최근 프로젝트
      
      // 이름순 정렬
      cy.get('[data-testid="sort-dropdown"]').select('title')
      
      cy.get('[data-testid="project-card"]').first()
        .should('contain', 'Test Project 1') // 알파벳 순
    })

    it('shows empty state when no projects match search', () => {
      cy.get('[data-testid="search-input"]').type('Nonexistent Project')
      
      cy.get('[data-testid="empty-state"]')
        .should('be.visible')
        .and('contain', '검색 결과가 없습니다')
    })
  })

  describe('Project Details and Editing', () => {
    it('displays project details correctly', () => {
      cy.visit('/project/view/1')
      
      cy.get('[data-testid="project-header"]').should('be.visible')
      cy.get('[data-testid="project-title"]').should('contain', 'Test Project 1')
      cy.get('[data-testid="project-description"]').should('contain', 'First test project')
      
      // 프로젝트 메뉴 확인
      cy.get('[data-testid="project-nav"]').should('be.visible')
      cy.get('[data-testid="nav-overview"]').should('be.visible')
      cy.get('[data-testid="nav-feedback"]').should('be.visible')
      cy.get('[data-testid="nav-members"]').should('be.visible')
    })

    it('edits project information', () => {
      cy.visit('/project/edit/1')
      
      // 기존 정보 확인
      cy.get('[data-testid="project-title"]').should('have.value', 'Test Project 1')
      
      // 정보 수정
      cy.get('[data-testid="project-title"]').clear().type('Updated Project Title')
      cy.get('[data-testid="project-description"]').clear().type('Updated description')
      
      // 저장
      cy.get('[data-testid="save-button"]').click()
      
      // 성공 메시지 확인
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '프로젝트가 수정되었습니다')
      
      // 변경사항 확인
      cy.visit('/project/view/1')
      cy.get('[data-testid="project-title"]').should('contain', 'Updated Project Title')
    })

    it('manages project members', () => {
      cy.visit('/project/view/1')
      cy.get('[data-testid="nav-members"]').click()
      
      // 멤버 목록 확인
      cy.get('[data-testid="member-list"]').should('be.visible')
      
      // 새 멤버 초대
      cy.get('[data-testid="invite-member"]').click()
      cy.get('[data-testid="member-email"]').type('newmember@videoplanet.com')
      cy.get('[data-testid="member-role"]').select('viewer')
      cy.get('[data-testid="send-invite"]').click()
      
      // 초대 성공 확인
      cy.get('[data-testid="success-message"]')
        .should('contain', '초대가 발송되었습니다')
      
      // 멤버 목록에 추가 확인
      cy.get('[data-testid="pending-invites"]')
        .should('contain', 'newmember@videoplanet.com')
    })

    it('deletes project with confirmation', () => {
      cy.visit('/project/view/1')
      
      // 삭제 버튼 클릭
      cy.get('[data-testid="project-menu"]').click()
      cy.get('[data-testid="delete-project"]').click()
      
      // 확인 모달
      cy.get('[data-testid="delete-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-delete"]').type('Test Project 1') // 프로젝트 이름 확인
      cy.get('[data-testid="delete-confirm-button"]').click()
      
      // 삭제 성공 확인
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="success-message"]')
        .should('contain', '프로젝트가 삭제되었습니다')
      
      // 프로젝트 목록에서 제거 확인
      cy.get('[data-testid="project-list"]')
        .should('not.contain', 'Test Project 1')
    })
  })

  describe('Project Status Management', () => {
    it('changes project status', () => {
      cy.visit('/project/view/1')
      
      // 현재 상태 확인
      cy.get('[data-testid="project-status"]').should('contain', 'active')
      
      // 상태 변경
      cy.get('[data-testid="status-dropdown"]').click()
      cy.get('[data-testid="status-completed"]').click()
      
      // 확인 모달
      cy.get('[data-testid="status-change-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-status-change"]').click()
      
      // 상태 변경 확인
      cy.get('[data-testid="project-status"]').should('contain', 'completed')
      cy.get('[data-testid="success-message"]')
        .should('contain', '프로젝트 상태가 변경되었습니다')
    })

    it('tracks project progress', () => {
      cy.visit('/project/view/1')
      
      // 진행률 확인
      cy.get('[data-testid="progress-bar"]').should('be.visible')
      cy.get('[data-testid="progress-percentage"]').should('contain', '%')
      
      // 마일스톤 추가
      cy.get('[data-testid="add-milestone"]').click()
      cy.get('[data-testid="milestone-title"]').type('Design Complete')
      cy.get('[data-testid="milestone-date"]').type('2023-12-15')
      cy.get('[data-testid="save-milestone"]').click()
      
      // 마일스톤 목록 확인
      cy.get('[data-testid="milestone-list"]')
        .should('contain', 'Design Complete')
    })
  })

  describe('Project Templates', () => {
    it('creates project from template', () => {
      cy.visit('/project/create')
      
      // 템플릿 선택
      cy.get('[data-testid="use-template"]').click()
      cy.get('[data-testid="template-list"]').should('be.visible')
      cy.get('[data-testid="template-video-production"]').click()
      
      // 템플릿 내용이 자동으로 채워지는지 확인
      cy.get('[data-testid="project-title"]').should('not.be.empty')
      cy.get('[data-testid="project-description"]').should('not.be.empty')
      
      // 필요한 부분만 수정
      cy.get('[data-testid="project-title"]').clear().type('My Video Project')
      
      cy.get('[data-testid="create-button"]').click()
      
      cy.url().should('include', '/project/view/')
    })
  })

  describe('Bulk Operations', () => {
    it('performs bulk actions on projects', () => {
      cy.visit('/dashboard')
      
      // 다중 선택 모드 활성화
      cy.get('[data-testid="bulk-select"]').click()
      
      // 프로젝트 선택
      cy.get('[data-testid="project-checkbox"]').first().check()
      cy.get('[data-testid="project-checkbox"]').last().check()
      
      // 벌크 액션 확인
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
      cy.get('[data-testid="selected-count"]').should('contain', '2')
      
      // 상태 일괄 변경
      cy.get('[data-testid="bulk-status-change"]').click()
      cy.get('[data-testid="bulk-status-completed"]').click()
      cy.get('[data-testid="confirm-bulk-action"]').click()
      
      // 변경 확인
      cy.get('[data-testid="success-message"]')
        .should('contain', '2개 프로젝트의 상태가 변경되었습니다')
    })
  })

  describe('Project Analytics', () => {
    it('displays project analytics', () => {
      cy.visit('/project/view/1')
      cy.get('[data-testid="nav-analytics"]').click()
      
      // 분석 데이터 확인
      cy.get('[data-testid="analytics-overview"]').should('be.visible')
      cy.get('[data-testid="feedback-count"]').should('be.visible')
      cy.get('[data-testid="member-activity"]').should('be.visible')
      cy.get('[data-testid="progress-chart"]').should('be.visible')
      
      // 기간 필터
      cy.get('[data-testid="date-range"]').select('last-30-days')
      cy.get('[data-testid="apply-filter"]').click()
      
      // 데이터 업데이트 확인
      cy.get('[data-testid="analytics-overview"]').should('be.visible')
    })
  })

  describe('Mobile Responsive', () => {
    it('works correctly on mobile devices', () => {
      cy.setMobileViewport()
      
      cy.visit('/dashboard')
      
      // 모바일 프로젝트 목록 확인
      cy.get('[data-testid="project-list"]').should('be.visible')
      cy.get('[data-testid="mobile-project-card"]').should('be.visible')
      
      // 모바일 메뉴 확인
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
      
      // 프로젝트 생성 (모바일)
      cy.get('[data-testid="mobile-create-button"]').click()
      cy.url().should('include', '/project/create')
      
      // 모바일 폼 확인
      cy.get('[data-testid="mobile-form"]').should('be.visible')
    })
  })

  describe('Performance', () => {
    it('loads project list efficiently', () => {
      // 많은 프로젝트가 있을 때의 성능 테스트
      cy.task('createTestData', {
        projects: Array.from({ length: 50 }, (_, i) => ({
          id: i + 10,
          title: `Performance Test Project ${i + 1}`,
          description: `Description ${i + 1}`,
          status: 'active',
        })),
      })
      
      cy.visit('/dashboard')
      
      // 페이지 로딩 시간 확인 (3초 이내)
      cy.get('[data-testid="project-list"]', { timeout: 3000 }).should('be.visible')
      
      // 가상 스크롤링 확인 (모든 프로젝트가 DOM에 있지 않아야 함)
      cy.get('[data-testid="project-card"]').should('have.length.lessThan', 50)
      
      // 무한 스크롤 테스트
      cy.scrollToBottom()
      cy.get('[data-testid="loading-more"]').should('be.visible')
    })
  })
})