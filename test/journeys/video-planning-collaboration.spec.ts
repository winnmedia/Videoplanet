import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * VideoPlanet 영상 기획 협업 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 기획자가 새 프로젝트 생성
 * 2. PLAN 아이콘으로 기획 모드 진입
 * 3. 스토리보드 초안 작성
 * 4. 디자이너 초대 및 권한 부여
 * 5. 실시간 댓글로 피드백 교환
 * 6. 버전 관리로 수정사항 추적
 * 7. 최종 승인 프로세스 완료
 */

test.describe('영상 기획 협업 시나리오', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
      permissions: ['notifications', 'clipboard-read', 'clipboard-write'],
    });
    page = await context.newPage();
    
    // 기획자 로그인 모킹
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-planner-token');
      localStorage.setItem('user_role', 'planner');
      localStorage.setItem('user_id', 'planner-001');
      localStorage.setItem('user_name', '김기획');
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('기획자와 디자이너가 협업하여 영상 기획을 완성하는 시나리오', async () => {
    // 1. 메인 페이지에서 새 프로젝트 생성
    await page.goto('/');
    
    // 새 프로젝트 버튼 클릭
    await page.click('[data-testid="new-project-button"]');
    
    // 프로젝트 생성 폼 작성
    const projectModal = page.locator('[data-testid="project-creation-modal"]');
    await expect(projectModal).toBeVisible();
    
    await page.fill('[data-testid="project-title"]', '브랜드 홍보 영상 프로젝트');
    await page.fill('[data-testid="project-description"]', '신제품 런칭을 위한 3분 홍보 영상');
    await page.selectOption('[data-testid="project-category"]', 'marketing');
    await page.fill('[data-testid="project-deadline"]', '2025-09-30');
    
    await page.click('[data-testid="create-project"]');
    
    // 프로젝트 생성 완료 확인
    await expect(page.locator('[data-testid="project-created-message"]')).toContainText('프로젝트가 생성되었습니다');

    // 2. PLAN 아이콘으로 기획 모드 진입
    const planButton = page.locator('[data-testid="plan-mode-button"]');
    await expect(planButton).toBeVisible();
    await expect(planButton).toHaveAttribute('aria-label', /기획 모드/);
    
    await planButton.click();
    
    // 기획 모드 진입 확인
    await expect(page.locator('[data-testid="planning-workspace"]')).toBeVisible();
    await expect(page).toHaveURL(/.*\/planning$/);

    // PLAN 아이콘의 활성화 상태 확인
    await expect(planButton).toHaveClass(/active|selected/);

    // 3. 스토리보드 초안 작성
    const storyboardSection = page.locator('[data-testid="storyboard-editor"]');
    await expect(storyboardSection).toBeVisible();

    // 첫 번째 씬 추가
    await page.click('[data-testid="add-scene-button"]');
    
    const firstScene = page.locator('[data-testid="scene-1"]');
    await expect(firstScene).toBeVisible();

    // 씬 내용 작성
    await page.fill('[data-testid="scene-1-title"]', '오프닝: 제품 소개');
    await page.fill('[data-testid="scene-1-description"]', '제품의 핵심 기능을 강조하는 오프닝 시퀀스');
    await page.fill('[data-testid="scene-1-duration"]', '30');

    // 두 번째 씬 추가
    await page.click('[data-testid="add-scene-button"]');
    
    const secondScene = page.locator('[data-testid="scene-2"]');
    await expect(secondScene).toBeVisible();

    await page.fill('[data-testid="scene-2-title"]', '메인: 사용자 스토리');
    await page.fill('[data-testid="scene-2-description"]', '실제 사용자가 제품을 사용하는 모습');
    await page.fill('[data-testid="scene-2-duration"]', '120');

    // 임시 저장
    await page.click('[data-testid="save-draft"]');
    await expect(page.locator('[data-testid="save-confirmation"]')).toContainText('저장되었습니다');

    // 4. 디자이너 초대 및 권한 부여
    await page.click('[data-testid="collaborate-button"]');
    
    const collaborateModal = page.locator('[data-testid="collaboration-modal"]');
    await expect(collaborateModal).toBeVisible();

    // 협업자 초대
    await page.fill('[data-testid="collaborator-email"]', 'designer@example.com');
    await page.selectOption('[data-testid="collaborator-role"]', 'designer');
    await page.check('[data-testid="permission-edit"]');
    await page.check('[data-testid="permission-comment"]');
    
    await page.click('[data-testid="send-collaboration-invite"]');
    
    // 초대 성공 확인
    await expect(page.locator('[data-testid="invite-sent-message"]')).toContainText('초대를 발송했습니다');
    
    // 협업자 목록에 추가 확인
    const collaboratorList = page.locator('[data-testid="collaborator-list"]');
    await expect(collaboratorList.locator('[data-testid="collaborator-designer@example.com"]')).toContainText('디자이너');

    await page.click('[data-testid="close-collaboration-modal"]');

    // 5. 실시간 댓글로 피드백 교환 시뮬레이션
    // 디자이너의 댓글 시뮬레이션
    await page.evaluate(() => {
      const commentEvent = new CustomEvent('websocket:comment', {
        detail: {
          id: 'comment-001',
          sceneId: 'scene-1',
          author: '박디자이너',
          content: '오프닝 시퀀스에 로고 애니메이션을 추가하면 어떨까요?',
          timestamp: new Date().toISOString(),
          type: 'suggestion'
        }
      });
      window.dispatchEvent(commentEvent);
    });

    // 댓글 알림 확인
    const commentNotification = page.locator('[data-testid="comment-notification"]');
    await expect(commentNotification).toBeVisible({ timeout: 3000 });
    await expect(commentNotification).toContainText('새 댓글');

    // 댓글 섹션 확인
    const commentSection = page.locator('[data-testid="scene-1-comments"]');
    await expect(commentSection).toBeVisible();

    // 새 댓글이 표시되는지 확인
    const newComment = commentSection.locator('[data-testid="comment-001"]');
    await expect(newComment).toContainText('로고 애니메이션을 추가하면');
    await expect(newComment).toContainText('박디자이너');

    // 기획자 답변 작성
    await page.fill('[data-testid="scene-1-reply-input"]', '좋은 아이디어네요! 3초 정도의 로고 애니메이션을 추가하겠습니다.');
    await page.click('[data-testid="scene-1-reply-submit"]');

    // 답글 전송 확인
    await expect(commentSection.locator('[data-testid*="reply"]')).toContainText('3초 정도의 로고 애니메이션');

    // 6. 버전 관리로 수정사항 추적
    // 스토리보드 수정
    await page.fill('[data-testid="scene-1-description"]', '제품의 핵심 기능을 강조하는 오프닝 시퀀스 + 3초 로고 애니메이션');
    await page.fill('[data-testid="scene-1-duration"]', '33'); // 시간 변경

    // 버전 저장
    await page.click('[data-testid="save-version"]');
    
    const versionModal = page.locator('[data-testid="version-save-modal"]');
    await expect(versionModal).toBeVisible();

    await page.fill('[data-testid="version-name"]', 'v1.1 - 로고 애니메이션 추가');
    await page.fill('[data-testid="version-description"]', '디자이너 피드백 반영하여 오프닝에 로고 애니메이션 추가');
    
    await page.click('[data-testid="confirm-save-version"]');

    // 버전 저장 성공 확인
    await expect(page.locator('[data-testid="version-saved-message"]')).toContainText('새 버전이 저장되었습니다');

    // 버전 히스토리 확인
    await page.click('[data-testid="version-history-button"]');
    
    const versionHistory = page.locator('[data-testid="version-history"]');
    await expect(versionHistory).toBeVisible();
    await expect(versionHistory.locator('[data-testid="version-v1.1"]')).toContainText('로고 애니메이션 추가');
    await expect(versionHistory.locator('[data-testid="version-v1.0"]')).toContainText('초기 버전');

    // 버전 비교 기능 테스트
    await page.click('[data-testid="compare-versions"]');
    await expect(page.locator('[data-testid="version-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-highlight"]')).toContainText('로고 애니메이션');

    await page.click('[data-testid="close-version-history"]');

    // 7. 최종 승인 프로세스 완료
    // 승인 요청
    await page.click('[data-testid="request-approval"]');
    
    const approvalModal = page.locator('[data-testid="approval-request-modal"]');
    await expect(approvalModal).toBeVisible();

    // 승인자 선택
    await page.selectOption('[data-testid="approver-select"]', 'manager@example.com');
    await page.fill('[data-testid="approval-message"]', '로고 애니메이션이 추가된 스토리보드 승인 요청드립니다.');
    
    await page.click('[data-testid="send-approval-request"]');

    // 승인 요청 전송 확인
    await expect(page.locator('[data-testid="approval-sent-message"]')).toContainText('승인 요청이 전송되었습니다');

    // 프로젝트 상태 변경 확인
    const projectStatus = page.locator('[data-testid="project-status"]');
    await expect(projectStatus).toContainText('승인 대기');
    await expect(projectStatus).toHaveClass(/pending-approval/);

    // 승인 상태 추적 섹션 확인
    const approvalTracker = page.locator('[data-testid="approval-tracker"]');
    await expect(approvalTracker).toBeVisible();
    await expect(approvalTracker.locator('[data-testid="approval-step-request"]')).toHaveClass(/completed/);
    await expect(approvalTracker.locator('[data-testid="approval-step-review"]')).toHaveClass(/pending/);

    // 승인 완료 시뮬레이션 (실제로는 매니저가 승인)
    await page.evaluate(() => {
      const approvalEvent = new CustomEvent('websocket:approval', {
        detail: {
          projectId: 'project-001',
          status: 'approved',
          approver: '이매니저',
          message: '스토리보드 검토 완료했습니다. 승인합니다.',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(approvalEvent);
    });

    // 승인 알림 확인
    const approvalNotification = page.locator('[data-testid="approval-notification"]');
    await expect(approvalNotification).toBeVisible({ timeout: 3000 });
    await expect(approvalNotification).toContainText('승인되었습니다');

    // 프로젝트 상태 업데이트 확인
    await expect(projectStatus).toContainText('승인됨');
    await expect(projectStatus).toHaveClass(/approved/);

    // 다음 단계 버튼 활성화 확인
    const nextStepButton = page.locator('[data-testid="proceed-to-production"]');
    await expect(nextStepButton).toBeEnabled();
    await expect(nextStepButton).toContainText('제작 단계로');
  });

  test('PLAN 아이콘의 접근성 및 사용성 확인', async () => {
    await page.goto('/');
    
    // 새 프로젝트 생성 (간소화)
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-title"]', '접근성 테스트 프로젝트');
    await page.click('[data-testid="create-project"]');

    const planButton = page.locator('[data-testid="plan-mode-button"]');
    
    // 접근성 속성 확인
    await expect(planButton).toHaveAttribute('role', 'button');
    await expect(planButton).toHaveAttribute('aria-label', /기획/);
    const tabIndex = await planButton.getAttribute('tabindex');
    expect(parseInt(tabIndex) >= 0).toBeTruthy();

    // 키보드 접근성
    await planButton.focus();
    await expect(planButton).toBeFocused();
    
    // Enter 키로 활성화
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="planning-workspace"]')).toBeVisible();

    // 스페이스바로도 활성화 확인 (토글)
    await page.keyboard.press('Space');
    
    // 아이콘 호버 효과 확인
    await planButton.hover();
    const hoverColor = await planButton.evaluate((el) => {
      return window.getComputedStyle(el, ':hover').color;
    });
    expect(hoverColor).not.toBe('rgba(0, 0, 0, 0)');

    // 툴팁 표시 확인
    await expect(page.locator('[data-testid="plan-button-tooltip"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-button-tooltip"]')).toContainText('기획 모드');
  });

  test('다중 사용자 실시간 협업 시나리오', async () => {
    await page.goto('/');
    
    // 프로젝트 생성
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-title"]', '실시간 협업 테스트');
    await page.click('[data-testid="create-project"]');
    
    // 기획 모드 진입
    await page.click('[data-testid="plan-mode-button"]');

    // 다른 사용자의 접속 시뮬레이션
    await page.evaluate(() => {
      const userJoinEvent = new CustomEvent('websocket:user-join', {
        detail: {
          userId: 'user-002',
          userName: '이디자이너',
          role: 'designer',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(userJoinEvent);
    });

    // 사용자 목록에 새 사용자 표시 확인
    const activeUsers = page.locator('[data-testid="active-users"]');
    await expect(activeUsers.locator('[data-testid="user-user-002"]')).toContainText('이디자이너');

    // 동시 편집 시뮬레이션
    await page.evaluate(() => {
      const editEvent = new CustomEvent('websocket:concurrent-edit', {
        detail: {
          sceneId: 'scene-1',
          field: 'title',
          value: '수정된 제목',
          editor: '이디자이너',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(editEvent);
    });

    // 충돌 알림 확인
    const conflictNotification = page.locator('[data-testid="edit-conflict-notification"]');
    await expect(conflictNotification).toBeVisible();
    await expect(conflictNotification).toContainText('다른 사용자가 편집 중입니다');

    // 충돌 해결 UI 확인
    const conflictResolution = page.locator('[data-testid="conflict-resolution"]');
    await expect(conflictResolution).toBeVisible();
    
    // 변경사항 수락
    await page.click('[data-testid="accept-changes"]');
    
    // 필드 값이 업데이트되었는지 확인
    await expect(page.locator('[data-testid="scene-1-title"]')).toHaveValue('수정된 제목');
  });

  test('모바일 환경에서의 영상 기획 사용성', async () => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // 프로젝트 생성
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-title"]', '모바일 테스트');
    await page.click('[data-testid="create-project"]');

    // 모바일에서 PLAN 버튼 확인
    const planButton = page.locator('[data-testid="plan-mode-button"]');
    await expect(planButton).toBeVisible();
    
    // 터치 대상 크기 확인 (최소 44px)
    const buttonSize = await planButton.boundingBox();
    expect(buttonSize.width).toBeGreaterThanOrEqual(44);
    expect(buttonSize.height).toBeGreaterThanOrEqual(44);

    // 모바일 기획 모드 진입
    await planButton.click();
    
    // 모바일 최적화된 레이아웃 확인
    const mobileWorkspace = page.locator('[data-testid="mobile-planning-workspace"]');
    await expect(mobileWorkspace).toBeVisible();

    // 스와이프 네비게이션 시뮬레이션
    await page.touchscreen.tap(200, 400);
    await page.touchscreen.tap(200, 200); // 위로 스와이프

    // 컨텍스트 메뉴 (길게 터치) 시뮬레이션
    await page.locator('[data-testid="scene-1"]').tap({ timeout: 1000 });
    
    // 모바일 컨텍스트 메뉴 확인
    await expect(page.locator('[data-testid="mobile-context-menu"]')).toBeVisible();
  });
});