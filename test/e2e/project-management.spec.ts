import { test, expect, Page, BrowserContext } from '@playwright/test';
import { testData } from './fixtures/test-data';
import { TestHelpers } from './helpers/test-helpers';

/**
 * VideoPlanet 프로젝트 관리 E2E 테스트
 * 
 * 테스트 커버리지:
 * - 프로젝트 생성/수정/삭제
 * - 프로젝트 설정 관리
 * - 팀원 초대 및 권한 관리
 * - 프로젝트 대시보드
 * - 파일 업로드 및 관리
 */

test.describe('Project Management Flow', () => {
  let context: BrowserContext;
  let page: Page;
  let helpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
    });
    page = await context.newPage();
    helpers = new TestHelpers(page);
    
    // 프로젝트 관리자로 로그인
    await helpers.login(testData.users.projectManager);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('프로젝트 생성', () => {
    test('새 프로젝트 생성 - 전체 플로우', async () => {
      await page.goto('/projects');
      
      // 프로젝트 생성 버튼 클릭
      await page.click('[data-testid="create-project-button"]');
      await expect(page).toHaveURL('/projects/create');
      
      // Step 1: 기본 정보 입력
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('1/3');
      
      const projectData = {
        name: `Test Project ${Date.now()}`,
        description: '이것은 E2E 테스트를 위한 프로젝트입니다.',
        category: 'marketing',
        deadline: '2025-12-31'
      };
      
      await page.fill('[data-testid="project-name"]', projectData.name);
      await page.fill('[data-testid="project-description"]', projectData.description);
      await page.selectOption('[data-testid="project-category"]', projectData.category);
      await page.fill('[data-testid="project-deadline"]', projectData.deadline);
      
      // 다음 단계로
      await page.click('[data-testid="next-step-button"]');
      
      // Step 2: 비디오 업로드
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2/3');
      
      // 파일 업로드 시뮬레이션
      const fileInput = page.locator('[data-testid="video-upload-input"]');
      await fileInput.setInputFiles('./test/fixtures/sample-video.mp4');
      
      // 업로드 진행률 확인
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });
      
      // 비디오 메타데이터 입력
      await page.fill('[data-testid="video-title"]', 'Sample Video');
      await page.fill('[data-testid="video-duration"]', '02:30');
      
      // 다음 단계로
      await page.click('[data-testid="next-step-button"]');
      
      // Step 3: 팀원 초대
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('3/3');
      
      // 팀원 이메일 추가
      const teamMembers = [
        { email: 'reviewer1@example.com', role: 'reviewer' },
        { email: 'editor1@example.com', role: 'editor' },
        { email: 'viewer1@example.com', role: 'viewer' }
      ];
      
      for (const member of teamMembers) {
        await page.fill('[data-testid="member-email"]', member.email);
        await page.selectOption('[data-testid="member-role"]', member.role);
        await page.click('[data-testid="add-member-button"]');
        
        // 추가된 멤버 확인
        await expect(page.locator(`[data-testid="member-list-item"][data-email="${member.email}"]`)).toBeVisible();
      }
      
      // 초대 메시지 작성
      await page.fill('[data-testid="invitation-message"]', '프로젝트에 참여해주세요!');
      
      // 프로젝트 생성 완료
      await page.click('[data-testid="create-project-submit"]');
      
      // 성공 메시지 및 리다이렉트 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/프로젝트가 생성되었습니다/);
      await page.waitForURL(/\/projects\/\d+/);
      
      // 생성된 프로젝트 페이지 확인
      await expect(page.locator('[data-testid="project-title"]')).toContainText(projectData.name);
      await expect(page.locator('[data-testid="project-status"]')).toContainText('진행중');
    });

    test('프로젝트 템플릿 사용', async () => {
      await page.goto('/projects/create');
      
      // 템플릿 선택 모달 열기
      await page.click('[data-testid="use-template-button"]');
      await expect(page.locator('[data-testid="template-modal"]')).toBeVisible();
      
      // 마케팅 템플릿 선택
      await page.click('[data-testid="template-marketing"]');
      
      // 템플릿이 적용된 필드 확인
      await expect(page.locator('[data-testid="project-category"]')).toHaveValue('marketing');
      await expect(page.locator('[data-testid="project-description"]')).not.toBeEmpty();
      
      // 템플릿 기반으로 수정
      await page.fill('[data-testid="project-name"]', 'Marketing Campaign 2025');
      
      // 빠른 생성 (나머지 단계 건너뛰기)
      await page.click('[data-testid="quick-create-button"]');
      
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/템플릿을 사용하여 프로젝트가 생성되었습니다/);
    });

    test('프로젝트 생성 유효성 검사', async () => {
      await page.goto('/projects/create');
      
      // 빈 폼 제출 시도
      await page.click('[data-testid="next-step-button"]');
      
      // 에러 메시지 확인
      await expect(page.locator('[data-testid="name-error"]')).toContainText(/프로젝트 이름을 입력해주세요/);
      await expect(page.locator('[data-testid="description-error"]')).toContainText(/프로젝트 설명을 입력해주세요/);
      
      // 중복된 프로젝트 이름
      await page.fill('[data-testid="project-name"]', testData.projects.existing.name);
      await page.click('[data-testid="next-step-button"]');
      
      await expect(page.locator('[data-testid="name-error"]')).toContainText(/이미 사용 중인 프로젝트 이름입니다/);
      
      // 잘못된 날짜 형식
      await page.fill('[data-testid="project-deadline"]', '2024-01-01'); // 과거 날짜
      await page.click('[data-testid="next-step-button"]');
      
      await expect(page.locator('[data-testid="deadline-error"]')).toContainText(/마감일은 오늘 이후여야 합니다/);
    });
  });

  test.describe('프로젝트 수정', () => {
    test('프로젝트 정보 수정', async () => {
      // 기존 프로젝트 페이지로 이동
      await page.goto(`/projects/${testData.projects.existing.id}`);
      
      // 편집 모드 진입
      await page.click('[data-testid="edit-project-button"]');
      await expect(page.locator('[data-testid="edit-mode-indicator"]')).toBeVisible();
      
      // 정보 수정
      await page.fill('[data-testid="project-name"]', 'Updated Project Name');
      await page.fill('[data-testid="project-description"]', 'Updated description');
      await page.selectOption('[data-testid="project-status"]', 'completed');
      
      // 변경사항 저장
      await page.click('[data-testid="save-changes-button"]');
      
      // 저장 확인 모달
      await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-save"]');
      
      // 성공 메시지 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/프로젝트가 수정되었습니다/);
      
      // 수정된 내용 확인
      await expect(page.locator('[data-testid="project-title"]')).toContainText('Updated Project Name');
      await expect(page.locator('[data-testid="project-status"]')).toContainText('완료');
    });

    test('비디오 교체', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}`);
      
      // 비디오 섹션으로 스크롤
      await page.locator('[data-testid="video-section"]').scrollIntoViewIfNeeded();
      
      // 비디오 교체 버튼 클릭
      await page.click('[data-testid="replace-video-button"]');
      
      // 교체 확인 모달
      await expect(page.locator('[data-testid="replace-video-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="warning-message"]')).toContainText(/기존 피드백이 삭제될 수 있습니다/);
      
      // 새 비디오 업로드
      const fileInput = page.locator('[data-testid="new-video-input"]');
      await fileInput.setInputFiles('./test/fixtures/new-sample-video.mp4');
      
      // 업로드 완료 대기
      await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });
      
      // 교체 확인
      await page.click('[data-testid="confirm-replace"]');
      
      // 성공 메시지 및 새 비디오 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/비디오가 교체되었습니다/);
      await expect(page.locator('[data-testid="video-player"]')).toHaveAttribute('src', /new-sample-video/);
    });
  });

  test.describe('팀원 관리', () => {
    test('팀원 초대 및 권한 변경', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}/team`);
      
      // 새 팀원 초대
      await page.click('[data-testid="invite-member-button"]');
      
      // 초대 폼 작성
      await page.fill('[data-testid="invite-email"]', 'newmember@example.com');
      await page.selectOption('[data-testid="invite-role"]', 'editor');
      await page.fill('[data-testid="invite-message"]', '프로젝트에 참여해주세요.');
      
      // 초대 발송
      await page.click('[data-testid="send-invite-button"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/초대가 발송되었습니다/);
      
      // 팀원 목록에 표시 확인 (대기 중 상태)
      const newMemberRow = page.locator('[data-testid="team-member-row"][data-email="newmember@example.com"]');
      await expect(newMemberRow).toBeVisible();
      await expect(newMemberRow.locator('[data-testid="member-status"]')).toContainText('초대 대기중');
      
      // 기존 팀원 권한 변경
      const existingMemberRow = page.locator('[data-testid="team-member-row"]').first();
      await existingMemberRow.locator('[data-testid="role-dropdown"]').selectOption('reviewer');
      
      // 변경사항 저장
      await page.click('[data-testid="save-team-changes"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/권한이 변경되었습니다/);
    });

    test('팀원 제거', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}/team`);
      
      // 제거할 팀원 선택
      const memberToRemove = page.locator('[data-testid="team-member-row"]').last();
      const memberEmail = await memberToRemove.getAttribute('data-email');
      
      // 제거 버튼 클릭
      await memberToRemove.locator('[data-testid="remove-member-button"]').click();
      
      // 확인 모달
      await expect(page.locator('[data-testid="remove-member-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="remove-warning"]')).toContainText(memberEmail || '');
      
      // 제거 확인
      await page.click('[data-testid="confirm-remove"]');
      
      // 성공 메시지 및 목록에서 제거 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/팀원이 제거되었습니다/);
      await expect(page.locator(`[data-email="${memberEmail}"]`)).not.toBeVisible();
    });

    test('일괄 초대', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}/team`);
      
      // 일괄 초대 모드 활성화
      await page.click('[data-testid="bulk-invite-button"]');
      
      // CSV 업로드 또는 텍스트 입력
      const bulkEmails = `
        user1@example.com,reviewer
        user2@example.com,editor
        user3@example.com,viewer
      `;
      
      await page.fill('[data-testid="bulk-invite-textarea"]', bulkEmails);
      
      // 미리보기 확인
      await page.click('[data-testid="preview-bulk-invite"]');
      await expect(page.locator('[data-testid="bulk-preview-table"] tr')).toHaveCount(4); // 헤더 + 3명
      
      // 일괄 발송
      await page.click('[data-testid="send-bulk-invites"]');
      
      // 진행 상태 표시
      await expect(page.locator('[data-testid="bulk-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-complete"]')).toBeVisible({ timeout: 10000 });
      
      // 결과 확인
      await expect(page.locator('[data-testid="bulk-result"]')).toContainText('3명 초대 완료');
    });
  });

  test.describe('프로젝트 대시보드', () => {
    test('프로젝트 통계 및 활동 확인', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}/dashboard`);
      
      // 주요 지표 확인
      const metrics = [
        '[data-testid="total-feedbacks"]',
        '[data-testid="resolved-feedbacks"]',
        '[data-testid="pending-feedbacks"]',
        '[data-testid="team-members"]',
        '[data-testid="completion-rate"]'
      ];
      
      for (const metric of metrics) {
        await expect(page.locator(metric)).toBeVisible();
        const value = await page.locator(metric).innerText();
        expect(value).toMatch(/\d+/); // 숫자 포함 확인
      }
      
      // 활동 타임라인 확인
      const activityTimeline = page.locator('[data-testid="activity-timeline"]');
      await expect(activityTimeline).toBeVisible();
      
      const activities = activityTimeline.locator('[data-testid="activity-item"]');
      await expect(activities.first()).toBeVisible();
      
      // 차트 렌더링 확인
      await expect(page.locator('[data-testid="feedback-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
      
      // 실시간 업데이트 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('project:update', {
          detail: { feedbacks: 10, resolved: 5 }
        }));
      });
      
      // 업데이트된 값 확인
      await expect(page.locator('[data-testid="total-feedbacks"]')).toContainText('10');
    });

    test('프로젝트 내보내기', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}`);
      
      // 내보내기 메뉴 열기
      await page.click('[data-testid="export-menu-button"]');
      
      // 내보내기 옵션 확인
      const exportOptions = [
        { format: 'pdf', testId: 'export-pdf' },
        { format: 'excel', testId: 'export-excel' },
        { format: 'json', testId: 'export-json' }
      ];
      
      for (const option of exportOptions) {
        await expect(page.locator(`[data-testid="${option.testId}"]`)).toBeVisible();
      }
      
      // PDF 내보내기 선택
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      
      // 다운로드 확인
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/project.*\.pdf/);
      
      // 성공 메시지
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/내보내기가 완료되었습니다/);
    });
  });

  test.describe('프로젝트 삭제', () => {
    test('프로젝트 삭제 플로우', async () => {
      await page.goto(`/projects/${testData.projects.toDelete.id}`);
      
      // 프로젝트 설정으로 이동
      await page.click('[data-testid="project-settings-button"]');
      await page.click('[data-testid="danger-zone-tab"]');
      
      // 삭제 버튼 클릭
      await page.click('[data-testid="delete-project-button"]');
      
      // 삭제 확인 모달
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-warning"]')).toContainText(/이 작업은 되돌릴 수 없습니다/);
      
      // 프로젝트 이름 입력하여 확인
      const projectName = testData.projects.toDelete.name;
      await page.fill('[data-testid="confirm-project-name"]', projectName);
      
      // 삭제 확인 버튼 활성화 확인
      const deleteButton = page.locator('[data-testid="confirm-delete-button"]');
      await expect(deleteButton).toBeEnabled();
      
      // 삭제 실행
      await deleteButton.click();
      
      // 로딩 상태 확인
      await expect(page.locator('[data-testid="deleting-spinner"]')).toBeVisible();
      
      // 프로젝트 목록으로 리다이렉트 확인
      await page.waitForURL('/projects');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/프로젝트가 삭제되었습니다/);
      
      // 삭제된 프로젝트가 목록에 없는지 확인
      await expect(page.locator(`[data-project-id="${testData.projects.toDelete.id}"]`)).not.toBeVisible();
    });

    test('프로젝트 아카이브', async () => {
      await page.goto(`/projects/${testData.projects.existing.id}/settings`);
      
      // 아카이브 옵션 선택
      await page.click('[data-testid="archive-project-button"]');
      
      // 아카이브 확인 모달
      await expect(page.locator('[data-testid="archive-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="archive-info"]')).toContainText(/아카이브된 프로젝트는 나중에 복원할 수 있습니다/);
      
      // 아카이브 실행
      await page.click('[data-testid="confirm-archive"]');
      
      // 성공 메시지
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/프로젝트가 아카이브되었습니다/);
      
      // 프로젝트 상태 확인
      await expect(page.locator('[data-testid="project-status"]')).toContainText('아카이브됨');
      
      // 아카이브된 프로젝트 목록에서 확인
      await page.goto('/projects?filter=archived');
      await expect(page.locator(`[data-project-id="${testData.projects.existing.id}"]`)).toBeVisible();
    });
  });
});