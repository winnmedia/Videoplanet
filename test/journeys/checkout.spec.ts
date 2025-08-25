import { test, expect, Page } from '@playwright/test';

/**
 * 🎬 브이래닛 사용자 여정 테스트 
 * "영상 협업의 신세계" - 통합 영상 제작 플랫폼
 * 
 * 🎯 핵심 비즈니스 가치:
 * - n가지 툴 → 1개 플랫폼 통합
 * - 전문적 영상 제작 워크플로우
 * - 실시간 협업 & 피드백
 * - AI 기반 기획서 자동 생성
 * 
 * 📊 주요 사용자 페르소나:
 * 1. 영상 제작사 CEO (프로젝트 총괄)
 * 2. 영상 기획자 (스토리보드, AI 기획)
 * 3. 영상 편집자 (피드백 수집, 수정)
 * 4. 클라이언트 (피드백 제공, 승인)
 * 5. 외주 협력사 (제한적 접근)
 */

test.describe('VideoPlanet – Core User Journeys', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Console error tracking
    errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Navigate to home
    await page.goto('/');
  });

  test.afterEach(async () => {
    // Assert no console errors
    expect(errors, 'No unhandled errors in console').toHaveLength(0);
  });

  test('@core Project Creation Journey', async ({ page }) => {
    // Step 1: Login
    await page.getByRole('link', { name: /로그인|login/i }).click();
    await expect(page).toHaveURL(/login/);

    // Verify all interactive elements are functional
    const loginButtons = await page.getByRole('button').all();
    for (const btn of loginButtons) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }

    // Fill login form
    await page.getByPlaceholder(/이메일|email/i).fill('ceo@winnmedia.co.kr');
    await page.getByPlaceholder(/비밀번호|password/i).fill('dnlsdos213$');
    
    // Progress checkpoint: Remember me checkbox
    const rememberMe = page.locator('input[type="checkbox"]').first();
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
      // Verify state persistence
      await expect(rememberMe).toBeChecked();
    }

    await page.getByRole('button', { name: /로그인|sign in/i }).click();
    
    // Step 2: Navigate to Dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Verify dashboard widgets load
    await expect(page.locator('[class*="widget"]').first()).toBeVisible({ timeout: 5000 });

    // Step 3: Create New Project
    await page.getByRole('link', { name: /프로젝트|projects/i }).click();
    await expect(page).toHaveURL(/projects/);

    await page.getByRole('button', { name: /새 프로젝트|new project|프로젝트 생성/i }).click();
    await expect(page).toHaveURL(/projects\/create/);

    // Fill project details
    const projectName = `Test Project ${Date.now()}`;
    await page.getByPlaceholder(/프로젝트명|project name/i).fill(projectName);
    await page.getByPlaceholder(/설명|description/i).fill('Automated test project description');

    // Set dates if available
    const startDate = page.locator('input[type="date"]').first();
    if (await startDate.isVisible()) {
      await startDate.fill('2025-01-01');
    }

    // Progress checkpoint: Form data persistence
    const formData = await page.getByPlaceholder(/프로젝트명|project name/i).inputValue();
    expect(formData).toBe(projectName);

    // Submit project
    await page.getByRole('button', { name: /생성|create|저장|save/i }).click();

    // Verify success feedback
    const successMessage = page.locator('[role="alert"], [class*="success"], [class*="toast"]');
    if (await successMessage.isVisible({ timeout: 3000 })) {
      await expect(successMessage).toContainText(/성공|success|완료|completed/i);
    }

    // Verify navigation to project view or list
    await expect(page).toHaveURL(/projects/);
  });

  test('@core Feedback Submission Journey', async ({ page }) => {
    // Quick login helper
    await loginUser(page);
    
    // Navigate to projects
    await page.getByRole('link', { name: /프로젝트|projects/i }).click();
    await expect(page).toHaveURL(/projects/);

    // Select first project with feedback option
    const projectCard = page.locator('[class*="project"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      
      // Look for feedback button
      const feedbackBtn = page.getByRole('button', { name: /피드백|feedback/i });
      if (await feedbackBtn.isVisible()) {
        await feedbackBtn.click();
        await expect(page).toHaveURL(/feedback/);

        // Submit feedback
        const feedbackInput = page.locator('textarea, [contenteditable="true"]').first();
        if (await feedbackInput.isVisible()) {
          await feedbackInput.fill('This is an automated test feedback for UX verification.');
          
          // Check for rating/score elements
          const ratingStars = page.locator('[class*="rating"], [class*="star"]');
          if (await ratingStars.first().isVisible()) {
            await ratingStars.nth(3).click(); // 4-star rating
          }

          // Submit feedback
          await page.getByRole('button', { name: /제출|submit|전송|send/i }).click();

          // Verify submission success
          await expect(page.locator('[role="alert"], [class*="success"]')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('@core Video Feedback System Journey', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to projects and select one with video
    await page.goto('/projects');
    const projectWithVideo = page.locator('[class*="project"]').first();
    await projectWithVideo.click();
    
    // Navigate to feedback section
    await page.getByRole('button', { name: /피드백|feedback/i }).click();
    await expect(page).toHaveURL(/feedback/);
    
    // Test 1: Video Player Controls
    const videoPlayer = page.locator('video, [class*="player"]').first();
    if (await videoPlayer.isVisible()) {
      // Play/Pause functionality
      const playButton = page.getByRole('button', { name: /play|재생/i });
      await playButton.click();
      await page.waitForTimeout(1000);
      
      // Screenshot feature
      const screenshotBtn = page.getByRole('button', { name: /스크린샷|screenshot|capture/i });
      if (await screenshotBtn.isVisible()) {
        await screenshotBtn.click();
        
        // Verify screenshot captured
        const screenshotPreview = page.locator('[class*="screenshot"], [class*="capture"]');
        await expect(screenshotPreview).toBeVisible({ timeout: 3000 });
      }
      
      // Timeline navigation
      const timeline = page.locator('[class*="timeline"], [role="slider"]').first();
      if (await timeline.isVisible()) {
        // Click at specific timestamp
        await timeline.click({ position: { x: 100, y: 10 } });
        
        // Get current timestamp
        const timestamp = await page.locator('[class*="time"], [class*="timestamp"]').first().textContent();
        expect(timestamp).toBeTruthy();
      }
    }
    
    // Test 2: Timeline-based Feedback with Emotions
    const feedbackArea = page.locator('textarea, [contenteditable="true"]').first();
    await feedbackArea.fill('0:15 - 화면 전환이 너무 빠릅니다');
    
    // Emotion selection
    const emotionButtons = page.locator('[class*="emotion"], [class*="reaction"]');
    if (await emotionButtons.first().isVisible()) {
      // Select happy emotion
      await emotionButtons.filter({ hasText: /😊|좋아요|good/i }).click();
    }
    
    // Add timestamp tag
    const timestampBtn = page.getByRole('button', { name: /타임스탬프|timestamp|현재 시간/i });
    if (await timestampBtn.isVisible()) {
      await timestampBtn.click();
    }
    
    // Submit feedback
    await page.getByRole('button', { name: /제출|submit|전송/i }).click();
    
    // Test 3: Comment/Reply Feature
    const existingFeedback = page.locator('[class*="feedback-item"]').first();
    if (await existingFeedback.isVisible()) {
      // Click reply/comment button
      const replyBtn = existingFeedback.getByRole('button', { name: /댓글|reply|답글/i });
      await replyBtn.click();
      
      // Write reply
      const replyInput = page.locator('[class*="reply"] textarea').first();
      await replyInput.fill('동의합니다. 전환 효과를 부드럽게 해주세요.');
      await page.getByRole('button', { name: /답글 달기|post reply/i }).click();
    }
    
    // Test 4: Share Link Generation
    const shareBtn = page.getByRole('button', { name: /공유|share/i });
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      
      // Get share link
      const shareLinkInput = page.locator('input[readonly]').filter({ hasText: /http/i });
      const shareLink = await shareLinkInput.inputValue();
      expect(shareLink).toContain('feedback/public/');
      
      // Copy button test
      const copyBtn = page.getByRole('button', { name: /복사|copy/i });
      await copyBtn.click();
      
      // Verify copy success
      const copySuccess = page.locator('[class*="success"], [role="status"]');
      await expect(copySuccess).toContainText(/복사됨|copied/i);
    }
    
    // Test 5: Anonymous Feedback Access
    await page.context().clearCookies();
    await page.goto('/feedback/public/test-share-id');
    
    // Should allow anonymous feedback
    const anonymousFeedback = page.locator('textarea').first();
    if (await anonymousFeedback.isVisible()) {
      await anonymousFeedback.fill('익명 피드백: 색감이 너무 어둡습니다');
      
      // Anonymous user name input
      const nameInput = page.getByPlaceholder(/이름|name|닉네임/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('익명 리뷰어');
      }
      
      await page.getByRole('button', { name: /제출|submit/i }).click();
    }
  });

  test('@core Authentication System Journey', async ({ page }) => {
    // Test 1: Login with valid credentials
    await page.goto('/login');
    
    // Check login form elements
    const emailInput = page.getByPlaceholder(/이메일|email/i);
    const passwordInput = page.getByPlaceholder(/비밀번호|password/i);
    const rememberCheckbox = page.locator('input[type="checkbox"]').first();
    const loginButton = page.getByRole('button', { name: /로그인|sign in/i });
    
    // Verify all elements are present and functional
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    // Test 2: Invalid credentials
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // Should show error message
    const errorMessage = page.locator('[class*="error"], [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/존재하지 않는|invalid|incorrect|잘못된/i);
    
    // Test 3: Valid login with remember me
    await emailInput.clear();
    await passwordInput.clear();
    await emailInput.fill('ceo@winnmedia.co.kr');
    await passwordInput.fill('dnlsdos213$');
    await rememberCheckbox.check();
    await loginButton.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Test 4: Session persistence after reload
    await page.reload();
    await expect(page).toHaveURL(/dashboard/);
    
    // User should still be logged in
    const userProfile = page.locator('[class*="user"], [class*="profile"]').first();
    await expect(userProfile).toBeVisible();
    
    // Test 5: Logout functionality
    const logoutBtn = page.getByRole('button', { name: /로그아웃|logout|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/login|home|\//);
    }
  });

  test('@core Password Reset Journey', async ({ page }) => {
    await page.goto('/login');
    
    // Find and click password reset link
    const resetLink = page.getByRole('link', { name: /비밀번호 찾기|forgot password|reset password/i });
    await resetLink.click();
    
    await expect(page).toHaveURL(/reset-password/);
    
    // Test email verification step
    const emailInput = page.getByPlaceholder(/이메일|email/i);
    await emailInput.fill('ceo@winnmedia.co.kr');
    
    const sendButton = page.getByRole('button', { name: /인증|send|발송/i });
    await sendButton.click();
    
    // Should show success message or next step
    const successMsg = page.locator('[class*="success"], [role="status"]').first();
    await expect(successMsg).toBeVisible({ timeout: 5000 });
    
    // Check if verification code input appears
    const codeInput = page.getByPlaceholder(/인증번호|verification|code/i);
    if (await codeInput.isVisible({ timeout: 3000 })) {
      // In test environment, might use a fixed code
      await codeInput.fill('123456');
      
      const verifyButton = page.getByRole('button', { name: /확인|verify|다음/i });
      await verifyButton.click();
      
      // New password fields should appear
      const newPasswordInput = page.getByPlaceholder(/새 비밀번호|new password/i).first();
      const confirmPasswordInput = page.getByPlaceholder(/비밀번호 확인|confirm password/i);
      
      await expect(newPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
    }
  });

  test('@core Signup Journey with Email Verification', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill signup form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.getByPlaceholder(/이름|name/i).fill('Test User');
    await page.getByPlaceholder(/이메일|email/i).fill(testEmail);
    await page.getByPlaceholder(/비밀번호|password/i).first().fill('TestPass123!');
    await page.getByPlaceholder(/비밀번호 확인|confirm password/i).fill('TestPass123!');
    
    // Check terms and conditions if present
    const termsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /약관|terms/i });
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Submit signup
    const signupButton = page.getByRole('button', { name: /가입|sign up|register/i });
    await signupButton.click();
    
    // Check for email verification message
    const verificationMsg = page.locator('[class*="verification"], [class*="email"]');
    if (await verificationMsg.isVisible({ timeout: 5000 })) {
      await expect(verificationMsg).toContainText(/이메일|email|인증|verification/i);
    }
  });

  test('@core Dashboard Widgets and Notifications', async ({ page }) => {
    await loginUser(page);
    await page.goto('/dashboard');
    
    // Test 1: Feedback Widget
    const feedbackWidget = page.locator('[class*="feedback"][class*="widget"]').first();
    if (await feedbackWidget.isVisible()) {
      // Check for new feedback count
      const newFeedbackCount = feedbackWidget.locator('[class*="count"], [class*="badge"]');
      const count = await newFeedbackCount.textContent();
      console.log(`New feedback count: ${count}`);
      
      // Check recent feedback list
      const recentFeedbacks = feedbackWidget.locator('[class*="item"], [class*="feedback-entry"]');
      if (await recentFeedbacks.first().isVisible()) {
        // Click to view details
        await recentFeedbacks.first().click();
        
        // Should navigate to feedback detail
        await expect(page).toHaveURL(/feedback/);
        await page.goBack();
      }
    }
    
    // Test 2: Invitation Widget (Sent/Received/Accepted/Rejected)
    const invitationWidget = page.locator('[class*="invitation"][class*="widget"], [class*="invite"][class*="widget"]').first();
    if (await invitationWidget.isVisible()) {
      // Check invitation tabs
      const sentTab = invitationWidget.locator('[role="tab"]').filter({ hasText: /보낸|sent/i });
      const receivedTab = invitationWidget.locator('[role="tab"]').filter({ hasText: /받은|received/i });
      const acceptedTab = invitationWidget.locator('[role="tab"]').filter({ hasText: /수락|accepted/i });
      const rejectedTab = invitationWidget.locator('[role="tab"]').filter({ hasText: /거절|rejected/i });
      
      // Test sent invitations
      if (await sentTab.isVisible()) {
        await sentTab.click();
        const sentList = invitationWidget.locator('[class*="list"] [class*="item"]');
        console.log(`Sent invitations: ${await sentList.count()}`);
      }
      
      // Test received invitations
      if (await receivedTab.isVisible()) {
        await receivedTab.click();
        const receivedList = invitationWidget.locator('[class*="list"] [class*="item"]');
        const firstInvite = receivedList.first();
        
        if (await firstInvite.isVisible()) {
          // Check for accept/reject buttons
          const acceptBtn = firstInvite.getByRole('button', { name: /수락|accept/i });
          const rejectBtn = firstInvite.getByRole('button', { name: /거절|reject/i });
          
          await expect(acceptBtn).toBeVisible();
          await expect(rejectBtn).toBeVisible();
        }
      }
      
      // Check accepted count
      if (await acceptedTab.isVisible()) {
        await acceptedTab.click();
        const acceptedBadge = acceptedTab.locator('[class*="badge"], [class*="count"]');
        if (await acceptedBadge.isVisible()) {
          console.log(`Accepted invitations: ${await acceptedBadge.textContent()}`);
        }
      }
    }
    
    // Test 3: Project Progress Widget
    const progressWidget = page.locator('[class*="progress"][class*="widget"]').first();
    if (await progressWidget.isVisible()) {
      const progressBars = progressWidget.locator('[role="progressbar"], [class*="progress-bar"]');
      
      for (const bar of await progressBars.all()) {
        const progress = await bar.getAttribute('aria-valuenow') || await bar.getAttribute('data-progress');
        expect(progress).toBeTruthy();
      }
    }
    
    // Test 4: Activity Feed
    const activityFeed = page.locator('[class*="activity"], [class*="timeline"]').first();
    if (await activityFeed.isVisible()) {
      const activities = activityFeed.locator('[class*="activity-item"]');
      
      // Check if activities are sorted by time (most recent first)
      const firstActivity = activities.first();
      const timestamp = await firstActivity.locator('[class*="time"], [class*="date"]').textContent();
      expect(timestamp).toBeTruthy();
    }
  });

  test('@core Gantt Chart and Timeline Management', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to project with timeline
    await page.goto('/projects');
    const project = page.locator('[class*="project"]').first();
    await project.click();
    
    // Look for Gantt chart or timeline view
    const ganttBtn = page.getByRole('button', { name: /간트|gantt|일정|timeline|schedule/i });
    if (await ganttBtn.isVisible()) {
      await ganttBtn.click();
      
      // Wait for Gantt chart to load
      const ganttChart = page.locator('[class*="gantt"], [class*="timeline-chart"]').first();
      await expect(ganttChart).toBeVisible({ timeout: 5000 });
      
      // Test 1: Task bars
      const taskBars = ganttChart.locator('[class*="task"], [class*="bar"]');
      if (await taskBars.first().isVisible()) {
        // Verify task has start and end dates
        const firstTask = taskBars.first();
        const taskTitle = await firstTask.getAttribute('title') || await firstTask.textContent();
        expect(taskTitle).toBeTruthy();
        
        // Test drag to reschedule
        const box = await firstTask.boundingBox();
        if (box) {
          await firstTask.hover();
          await page.mouse.down();
          await page.mouse.move(box.x + 100, box.y);
          await page.mouse.up();
          
          // Check for update confirmation
          const updateMsg = page.locator('[role="alert"], [class*="update"]');
          if (await updateMsg.isVisible({ timeout: 2000 })) {
            await expect(updateMsg).toContainText(/업데이트|updated|변경/i);
          }
        }
      }
      
      // Test 2: Milestones
      const milestones = ganttChart.locator('[class*="milestone"]');
      if (await milestones.first().isVisible()) {
        await milestones.first().hover();
        
        // Tooltip should appear
        const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 2000 });
      }
      
      // Test 3: Dependencies
      const dependencies = ganttChart.locator('[class*="dependency"], [class*="arrow"]');
      console.log(`Dependencies found: ${await dependencies.count()}`);
      
      // Test 4: Timeline zoom
      const zoomIn = page.getByRole('button', { name: /zoom in|확대|\+/i });
      const zoomOut = page.getByRole('button', { name: /zoom out|축소|\-/i });
      
      if (await zoomIn.isVisible() && await zoomOut.isVisible()) {
        await zoomIn.click();
        await page.waitForTimeout(500);
        await zoomOut.click();
      }
      
      // Test 5: Export timeline
      const exportBtn = page.getByRole('button', { name: /내보내기|export|download/i });
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        
        // Check export options
        const pdfOption = page.getByRole('menuitem', { name: /pdf/i });
        const excelOption = page.getByRole('menuitem', { name: /excel|엑셀/i });
        
        if (await pdfOption.isVisible()) {
          await expect(pdfOption).toBeEnabled();
        }
        if (await excelOption.isVisible()) {
          await expect(excelOption).toBeEnabled();
        }
      }
    }
  });

  test('@core Guest Feedback without Login', async ({ page }) => {
    // Clear all cookies to ensure guest state
    await page.context().clearCookies();
    
    // Direct access to public feedback link
    await page.goto('/feedback/public/sample-project-id');
    
    // Test 1: Guest can view video
    const videoPlayer = page.locator('video, [class*="player"]').first();
    if (await videoPlayer.isVisible()) {
      // Guest should be able to play video
      const playBtn = page.getByRole('button', { name: /play|재생/i });
      await expect(playBtn).toBeEnabled();
    }
    
    // Test 2: Guest feedback form
    const guestNameInput = page.getByPlaceholder(/이름|name|게스트/i);
    const guestEmailInput = page.getByPlaceholder(/이메일|email/i);
    const feedbackTextarea = page.locator('textarea').first();
    
    // Fill guest information
    if (await guestNameInput.isVisible()) {
      await guestNameInput.fill('게스트 사용자');
    }
    
    if (await guestEmailInput.isVisible()) {
      await guestEmailInput.fill('guest@example.com');
    }
    
    // Test 3: Timestamp-based feedback as guest
    await feedbackTextarea.fill('1:23 - 이 부분의 자막이 잘 안 보입니다');
    
    // Test 4: Emotion selection for guest
    const emotions = page.locator('[class*="emotion"], [class*="reaction"]');
    if (await emotions.first().isVisible()) {
      await emotions.filter({ hasText: /🤔|의문|confused/i }).click();
    }
    
    // Test 5: Screenshot as guest
    const screenshotBtn = page.getByRole('button', { name: /스크린샷|screenshot/i });
    if (await screenshotBtn.isVisible()) {
      await screenshotBtn.click();
      
      // Verify screenshot preview
      const preview = page.locator('[class*="screenshot-preview"]');
      await expect(preview).toBeVisible({ timeout: 3000 });
      
      // Attach to feedback
      const attachBtn = page.getByRole('button', { name: /첨부|attach/i });
      if (await attachBtn.isVisible()) {
        await attachBtn.click();
      }
    }
    
    // Submit guest feedback
    const submitBtn = page.getByRole('button', { name: /제출|submit|피드백 보내기/i });
    await submitBtn.click();
    
    // Test 6: Verify guest feedback submission
    const successMsg = page.locator('[role="alert"], [class*="success"]');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
    await expect(successMsg).toContainText(/감사|thank|제출됨|submitted/i);
    
    // Test 7: Guest should see their feedback in the list
    const feedbackList = page.locator('[class*="feedback-list"]');
    const latestFeedback = feedbackList.locator('[class*="feedback-item"]').first();
    
    if (await latestFeedback.isVisible()) {
      const authorName = latestFeedback.locator('[class*="author"], [class*="name"]');
      await expect(authorName).toContainText(/게스트|guest/i);
    }
    
    // Test 8: Guest limitations
    // Guest should NOT be able to:
    const editBtn = page.getByRole('button', { name: /수정|edit/i });
    const deleteBtn = page.getByRole('button', { name: /삭제|delete/i });
    
    // These buttons should either not exist or be disabled for guest
    if (await editBtn.isVisible()) {
      await expect(editBtn).toBeDisabled();
    }
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeDisabled();
    }
  });

  test('@secondary Planning Tools Journey', async ({ page }) => {
    await loginUser(page);

    // Navigate to planning section
    await page.getByRole('link', { name: /기획|planning/i }).click();
    await expect(page).toHaveURL(/planning/);

    // Check all interactive elements
    const planningButtons = await page.getByRole('button').all();
    let nonFunctionalButtons = 0;
    
    for (const btn of planningButtons) {
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      
      if (isVisible && !isEnabled) {
        nonFunctionalButtons++;
        console.log(`Non-functional button found: ${await btn.textContent()}`);
      }
    }
    
    expect(nonFunctionalButtons, 'All buttons should be functional').toBe(0);

    // Test story development if available
    const storyTab = page.locator('[role="tab"], [class*="tab"]').filter({ hasText: /스토리|story/i });
    if (await storyTab.isVisible()) {
      await storyTab.click();
      
      // Fill story details
      const storyInput = page.locator('textarea, input[type="text"]').first();
      if (await storyInput.isVisible()) {
        await storyInput.fill('Test story content for journey validation');
        
        // Progress checkpoint: Verify data persistence
        await page.reload();
        const currentValue = await storyInput.inputValue();
        
        // Data should persist or show a warning about unsaved changes
        if (currentValue !== 'Test story content for journey validation') {
          const unsavedWarning = page.locator('[class*="unsaved"], [class*="warning"]');
          await expect(unsavedWarning).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('@ux UX Friction Detection', async ({ page }) => {
    await loginUser(page);
    
    const frictionPoints: string[] = [];
    
    // Check for loading states
    await page.goto('/projects');
    
    // Detect slow loading (>3s without progress indicator)
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"]');
    const contentLoaded = page.locator('[class*="project"], [class*="content"]').first();
    
    const startTime = Date.now();
    await contentLoaded.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 3000 && !await loadingIndicator.isVisible()) {
      frictionPoints.push(`Slow load (${loadTime}ms) without progress indicator`);
    }

    // Check for unclear CTAs
    const buttons = await page.getByRole('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.length < 2) {
        frictionPoints.push(`Unclear button label: "${text}"`);
      }
    }

    // Check for form validation feedback
    await page.goto('/projects/create');
    const submitBtn = page.getByRole('button', { name: /생성|create|저장|save/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Should show validation errors
      const errorMessages = page.locator('[class*="error"], [role="alert"]');
      if (!await errorMessages.first().isVisible({ timeout: 2000 })) {
        frictionPoints.push('No validation feedback on empty form submission');
      }
    }

    // Report friction points
    console.log('UX Friction Points Found:', frictionPoints);
    expect(frictionPoints.length, 'Minimal UX friction').toBeLessThanOrEqual(2);
  });

  test('@regression State Persistence Verification', async ({ page }) => {
    await loginUser(page);
    
    // Test 1: Project form state persistence
    await page.goto('/projects/create');
    
    const projectData = {
      name: `Persistence Test ${Date.now()}`,
      description: 'Testing state persistence across navigation'
    };
    
    await page.getByPlaceholder(/프로젝트명|project name/i).fill(projectData.name);
    await page.getByPlaceholder(/설명|description/i).fill(projectData.description);
    
    // Navigate away and back
    await page.goBack();
    await page.goForward();
    
    // Check if form data persists or warning appears
    const nameField = page.getByPlaceholder(/프로젝트명|project name/i);
    const currentName = await nameField.inputValue();
    
    if (currentName !== projectData.name) {
      // Should show unsaved changes warning
      const warning = page.locator('[class*="unsaved"], [class*="warning"], [role="alert"]');
      await expect(warning).toBeVisible({ timeout: 3000 });
    } else {
      // Data persisted successfully
      expect(currentName).toBe(projectData.name);
    }

    // Test 2: Dashboard state after refresh
    await page.goto('/dashboard');
    await page.reload();
    
    // Widgets should reload without errors
    await expect(page.locator('[class*="widget"]').first()).toBeVisible({ timeout: 5000 });
    
    // User session should persist
    const userMenu = page.locator('[class*="user"], [class*="profile"]').first();
    await expect(userMenu).toBeVisible();
  });

  // ==========================================
  // 🚀 개선된 사용자 여정 시나리오 (Business-Focused)
  // ==========================================

  test('@business CEO 종합 프로젝트 관리 여정', async ({ page }) => {
    /**
     * 🎯 시나리오: 영상 제작사 CEO의 하루
     * - 오전 출근 → 대시보드 현황 확인
     * - 클라이언트 피드백 처리 
     * - 신규 프로젝트 AI 기획서 생성
     * - 팀원 업무 배정 및 진행률 모니터링
     */
    
    await loginUser(page);
    
    // Step 1: 대시보드에서 전체 현황 파악
    await page.goto('/dashboard');
    
    // 피드백 알림 우선 확인
    const feedbackWidget = page.locator('[class*="feedback"][class*="widget"]').first();
    if (await feedbackWidget.isVisible()) {
      const urgentFeedbacks = feedbackWidget.locator('[class*="urgent"], [class*="high"]');
      if (await urgentFeedbacks.first().isVisible()) {
        // 긴급 피드백 우선 처리
        await urgentFeedbacks.first().click();
        await expect(page).toHaveURL(/feedback/);
        
        // 빠른 응답 후 대시보드 복귀
        await page.goBack();
      }
    }
    
    // Step 2: 신규 프로젝트를 위한 AI 기획서 생성
    await page.getByRole('link', { name: /영상 기획|video.planning/i }).click();
    
    // AI 기획 선택
    const aiPlanningBtn = page.getByRole('button', { name: /AI 기획/i });
    if (await aiPlanningBtn.isVisible()) {
      await aiPlanningBtn.click();
      await expect(page).toHaveURL(/video-planning\/ai/);
      
      // CEO가 자주 사용하는 프로젝트 타입으로 빠른 생성
      await page.getByPlaceholder(/제목|title/i).fill('Q1 브랜드 리뉴얼 영상');
      await page.getByPlaceholder(/컨셉|concept/i).fill('혁신적이고 젊은 브랜드 이미지로 리포지셔닝');
      await page.getByPlaceholder(/목적|purpose/i).fill('브랜드 인지도 20% 증가 및 20-30대 신규 고객 유치');
      
      // 생성 버튼 클릭
      const generateBtn = page.getByRole('button', { name: /생성|generate/i });
      await generateBtn.click();
      
      // AI 생성 완료 대기 (실제 환경에서는 더 오래 걸림)
      const resultSection = page.locator('[class*="result"], [class*="plan-content"]');
      await expect(resultSection).toBeVisible({ timeout: 15000 });
    }
    
    // Step 3: 생성된 기획서 팀에 공유
    const shareBtn = page.getByRole('button', { name: /공유|share/i });
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      
      // 팀원들에게 알림
      const teamNotification = page.locator('[class*="team-share"], [class*="notification"]');
      if (await teamNotification.isVisible()) {
        await expect(teamNotification).toContainText(/팀원|team|알림|notification/i);
      }
    }
    
    // Step 4: 프로젝트 관리로 이동하여 일정 조정
    await page.goto('/projects');
    
    // 진행 중인 프로젝트 간트차트 확인
    const activeProject = page.locator('[class*="project"][class*="active"]').first();
    if (await activeProject.isVisible()) {
      await activeProject.click();
      
      // 간트차트에서 일정 지연 프로젝트 식별
      const ganttSection = page.locator('[class*="gantt"], [class*="timeline"]');
      if (await ganttSection.isVisible()) {
        const delayedTasks = ganttSection.locator('[class*="delayed"], [class*="overdue"]');
        console.log(`지연된 작업: ${await delayedTasks.count()}개`);
        
        // 지연 작업이 있다면 팀원에게 알림
        if (await delayedTasks.first().isVisible()) {
          const alertBtn = page.getByRole('button', { name: /알림|alert|notify/i });
          if (await alertBtn.isVisible()) {
            await alertBtn.click();
          }
        }
      }
    }
  });

  test('@business 기획자 AI 협업 완전 여정', async ({ page }) => {
    /**
     * 🎯 시나리오: 영상 기획자의 AI 협업 워크플로우
     * - AI 기초 기획서 생성
     * - 수동으로 세부 조정 및 개선
     * - 동료와 실시간 검토
     * - 클라이언트 승인 요청
     */
    
    await loginUser(page);
    
    // Step 1: 영상 기획 메뉴 진입
    await page.goto('/video-planning');
    
    // 모드 선택 화면 확인
    const modeSelection = page.locator('[class*="mode-selection"], [class*="planning-options"]');
    await expect(modeSelection).toBeVisible({ timeout: 5000 });
    
    // AI 기획 선택
    await page.getByRole('button', { name: /AI 기획/i }).click();
    await expect(page).toHaveURL(/video-planning\/ai/);
    
    // Step 2: 상세 기획 정보 입력 (기획자 전문성 활용)
    const planningForm = {
      title: '스타트업 시리즈 A 투자 유치 영상',
      genre: '홍보영상',
      duration: '90',
      budget: '500-1000만원',
      targetAudience: '투자자',
      concept: '혁신적인 기술과 명확한 비즈니스 모델을 바탕으로 한 신뢰할 수 있는 스타트업 이미지',
      purpose: '시리즈 A 라운드에서 20억 투자 유치, 투자자들의 신뢰와 확신 획득',
      tone: '전문적이면서 혁신적인'
    };
    
    // 폼 입력
    for (const [field, value] of Object.entries(planningForm)) {
      const input = page.locator(`[name="${field}"], [placeholder*="${field}"]`).first();
      if (await input.isVisible()) {
        if (input.getAttribute('type') === 'select' || input.tagName === 'SELECT') {
          await input.selectOption(value);
        } else {
          await input.fill(value);
        }
      }
    }
    
    // Step 3: AI 기획서 생성 및 실시간 모니터링
    const generateBtn = page.getByRole('button', { name: /생성|generate/i });
    await generateBtn.click();
    
    // 생성 진행률 모니터링
    const progressSection = page.locator('[class*="generating"], [class*="progress"]');
    if (await progressSection.isVisible()) {
      // 각 단계별 완료 확인
      const steps = ['스토리 구조 분석', '4단계 스토리 생성', '12개 숏트 분해', '최종 검토'];
      
      for (const step of steps) {
        const stepElement = page.locator('[class*="step"]').filter({ hasText: step });
        if (await stepElement.isVisible()) {
          await expect(stepElement).toHaveClass(/completed/, { timeout: 10000 });
        }
      }
    }
    
    // Step 4: 생성된 기획서 전문적 검토 및 수정
    const planContent = page.locator('[class*="plan-content"], [class*="result"]');
    await expect(planContent).toBeVisible({ timeout: 15000 });
    
    // 스토리 단계별 검토
    const storyStages = page.locator('[class*="story-stage"]');
    const stageCount = await storyStages.count();
    expect(stageCount, '4단계 스토리 구조 확인').toBe(4);
    
    // 숏트 분해 검토
    const shotBreakdown = page.locator('[class*="shot-card"]');
    const shotCount = await shotBreakdown.count();
    expect(shotCount, '12개 숏트 분해 확인').toBe(12);
    
    // Step 5: 기획서 편집 및 개선
    const editBtn = page.getByRole('button', { name: /편집|edit/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // 첫 번째 스토리 단계 세부 수정
      const firstStage = storyStages.first();
      const editArea = firstStage.locator('textarea, [contenteditable]');
      if (await editArea.isVisible()) {
        await editArea.click();
        await editArea.fill('투자자의 첫 3초 내 관심을 사로잡는 강력한 오프닝. 회사의 혁신성과 시장 기회를 한눈에 보여주는 임팩트 있는 시작.');
        
        // 자동 저장 확인
        const autoSaveIndicator = page.locator('[class*="auto-save"], [class*="saving"]');
        if (await autoSaveIndicator.isVisible({ timeout: 2000 })) {
          await expect(autoSaveIndicator).toContainText(/저장|saved|saving/i);
        }
      }
    }
    
    // Step 6: PDF 기획서 생성 및 다운로드
    const downloadBtn = page.getByRole('button', { name: /PDF|다운로드|download/i });
    if (await downloadBtn.isVisible()) {
      await downloadBtn.click();
      
      // 다운로드 완료 확인
      const downloadComplete = page.locator('[class*="download-complete"], [role="alert"]');
      await expect(downloadComplete).toBeVisible({ timeout: 10000 });
    }
  });

  test('@business 클라이언트 피드백 완전 여정', async ({ page }) => {
    /**
     * 🎯 시나리오: 클라이언트의 영상 검토 및 피드백 여정
     * - 공유 링크로 접근 (로그인 불필요)
     * - 영상 시청 및 구간별 피드백
     * - 수정 요청사항 상세 전달
     * - 최종 승인 또는 재수정 요청
     */
    
    // Step 1: 공유 링크를 통한 익명 접근
    await page.context().clearCookies();
    await page.goto('/feedback/public/client-review-session');
    
    // 클라이언트용 인터페이스 확인
    const clientInterface = page.locator('[class*="client"], [class*="public-feedback"]');
    await expect(clientInterface).toBeVisible({ timeout: 5000 });
    
    // Step 2: 영상 시청 및 이해
    const videoPlayer = page.locator('video, [class*="player"]').first();
    if (await videoPlayer.isVisible()) {
      // 영상 재생
      const playBtn = page.getByRole('button', { name: /play|재생/i });
      await playBtn.click();
      await page.waitForTimeout(3000); // 3초 시청
      
      // 일시정지 후 피드백 작성 준비
      const pauseBtn = page.getByRole('button', { name: /pause|일시정지/i });
      await pauseBtn.click();
    }
    
    // Step 3: 구간별 상세 피드백 작성
    const feedbackScenarios = [
      {
        timestamp: '0:15',
        feedback: '오프닝이 너무 길어요. 우리 회사 로고가 더 빨리 나왔으면 좋겠습니다.',
        emotion: '🤔',
        priority: 'high'
      },
      {
        timestamp: '0:45',
        feedback: '이 부분 배경 음악이 너무 커서 내레이션이 잘 안 들려요.',
        emotion: '😕',
        priority: 'medium'
      },
      {
        timestamp: '1:30',
        feedback: '여기 제품 소개 부분이 정말 마음에 듭니다! 이런 느낌으로 가면 좋을 것 같아요.',
        emotion: '😊',
        priority: 'positive'
      }
    ];
    
    for (const scenario of feedbackScenarios) {
      // 타임스탬프 이동
      const timeInput = page.getByPlaceholder(/시간|time|timestamp/i);
      if (await timeInput.isVisible()) {
        await timeInput.fill(scenario.timestamp);
      }
      
      // 피드백 내용 작성
      const feedbackTextarea = page.locator('textarea').first();
      await feedbackTextarea.fill(`${scenario.timestamp} - ${scenario.feedback}`);
      
      // 감정 선택
      const emotionBtn = page.locator('[class*="emotion"]').filter({ hasText: scenario.emotion });
      if (await emotionBtn.isVisible()) {
        await emotionBtn.click();
      }
      
      // 우선순위 설정
      if (scenario.priority === 'high') {
        const highPriorityBtn = page.getByRole('button', { name: /중요|urgent|high/i });
        if (await highPriorityBtn.isVisible()) {
          await highPriorityBtn.click();
        }
      }
      
      // 피드백 제출
      const submitBtn = page.getByRole('button', { name: /제출|submit|피드백 보내기/i });
      await submitBtn.click();
      
      // 제출 완료 확인
      const successMsg = page.locator('[role="alert"], [class*="success"]');
      await expect(successMsg).toBeVisible({ timeout: 3000 });
      
      // 다음 피드백을 위해 폼 초기화 대기
      await page.waitForTimeout(1000);
    }
    
    // Step 4: 스크린샷을 활용한 시각적 피드백
    const screenshotBtn = page.getByRole('button', { name: /스크린샷|screenshot|캡처/i });
    if (await screenshotBtn.isVisible()) {
      await screenshotBtn.click();
      
      // 스크린샷 편집 (만약 편집 기능이 있다면)
      const editScreenshot = page.locator('[class*="screenshot-edit"]');
      if (await editScreenshot.isVisible({ timeout: 3000 })) {
        // 화살표나 텍스트 추가 등의 편집
        const addArrowBtn = page.getByRole('button', { name: /화살표|arrow/i });
        if (await addArrowBtn.isVisible()) {
          await addArrowBtn.click();
          // 화면 클릭하여 화살표 위치 지정
          await page.locator('[class*="screenshot-canvas"]').click({ position: { x: 200, y: 150 } });
        }
      }
      
      // 스크린샷과 함께 피드백 제출
      await feedbackTextarea.fill('로고 위치가 너무 구석에 있습니다. 스크린샷에 표시한 중앙 위치로 옮겨주세요.');
      await submitBtn.click();
    }
    
    // Step 5: 전체 영상에 대한 종합 의견
    const overallFeedback = page.locator('[class*="overall"], [class*="summary"]');
    if (await overallFeedback.isVisible()) {
      const summaryTextarea = overallFeedback.locator('textarea');
      await summaryTextarea.fill(`
전체적으로 영상의 품질과 메시지 전달력은 우수합니다. 
다만 다음 3가지 수정사항을 반영해주시면 더욱 완성도 높은 영상이 될 것 같습니다:

1. 오프닝 길이 단축 (현재 15초 → 8초로)
2. 배경 음악 볼륨 조정 (내레이션 대비 -20%)  
3. 회사 로고 위치 중앙으로 이동

수정된 버전을 확인한 후 최종 승인 드리겠습니다.
감사합니다.
      `);
      
      // 종합 의견 제출
      const submitOverallBtn = overallFeedback.getByRole('button', { name: /제출|submit/i });
      await submitOverallBtn.click();
    }
    
    // Step 6: 클라이언트 정보 입력 (익명이지만 연락처는 필요)
    const clientInfo = page.locator('[class*="client-info"]');
    if (await clientInfo.isVisible()) {
      await clientInfo.getByPlaceholder(/이름|name/i).fill('김클라이언트');
      await clientInfo.getByPlaceholder(/회사|company/i).fill('ABC 마케팅');
      await clientInfo.getByPlaceholder(/이메일|email/i).fill('client@abc-marketing.co.kr');
      await clientInfo.getByPlaceholder(/연락처|phone/i).fill('010-1234-5678');
    }
    
    // 최종 제출
    const finalSubmitBtn = page.getByRole('button', { name: /최종 제출|final submit/i });
    await finalSubmitBtn.click();
    
    // 제출 완료 및 감사 메시지 확인
    const thankYouMsg = page.locator('[class*="thank-you"], [class*="completion"]');
    await expect(thankYouMsg).toBeVisible({ timeout: 5000 });
    await expect(thankYouMsg).toContainText(/감사|thank|완료|completed/i);
  });

  test('@business 편집자 실시간 협업 여정', async ({ page }) => {
    /**
     * 🎯 시나리오: 편집자의 실시간 피드백 반영 및 협업
     * - 피드백 알림 수신 → 즉시 확인
     * - 편집 중 실시간 클라이언트 피드백 수신
     * - 수정사항 실시간 반영 및 진행상황 공유
     * - 버전 관리 및 최종 승인 프로세스
     */
    
    await loginUser(page);
    
    // Step 1: 대시보드에서 새 피드백 알림 확인
    await page.goto('/dashboard');
    
    // 실시간 알림 시뮬레이션 (WebSocket 연결 테스트)
    const realtimeNotification = page.locator('[class*="realtime"], [class*="live-notification"]');
    if (await realtimeNotification.isVisible({ timeout: 3000 })) {
      // 긴급 피드백 알림 클릭
      const urgentAlert = realtimeNotification.filter({ hasText: /긴급|urgent|즉시/i });
      if (await urgentAlert.isVisible()) {
        await urgentAlert.click();
      }
    }
    
    // Step 2: 피드백 상세 페이지로 이동
    await page.goto('/feedback/1'); // 실제 피드백 ID
    
    // 타임라인 기반 피드백 리스트 확인
    const feedbackList = page.locator('[class*="feedback-timeline"]');
    const feedbackItems = feedbackList.locator('[class*="feedback-item"]');
    
    // 각 피드백에 대한 편집자 응답
    const itemCount = await feedbackItems.count();
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = feedbackItems.nth(i);
      
      // 피드백 읽기
      const timestamp = await item.locator('[class*="timestamp"]').textContent();
      const content = await item.locator('[class*="content"]').textContent();
      
      // 편집자 응답 작성
      const replyBtn = item.getByRole('button', { name: /답글|reply/i });
      if (await replyBtn.isVisible()) {
        await replyBtn.click();
        
        const replyInput = item.locator('[class*="reply-input"] textarea');
        await replyInput.fill(`${timestamp} 구간 확인했습니다. 지금 바로 수정하겠습니다. 약 10분 후 업데이트된 버전을 확인해보세요.`);
        
        const submitReply = item.getByRole('button', { name: /답글 달기|submit reply/i });
        await submitReply.click();
      }
    }
    
    // Step 3: 편집 툴 연동 (시뮬레이션)
    const editingToolBtn = page.getByRole('button', { name: /편집 툴|editing tool|premier|final cut/i });
    if (await editingToolBtn.isVisible()) {
      await editingToolBtn.click();
      
      // 편집 툴 연동 상태 확인
      const toolStatus = page.locator('[class*="tool-status"], [class*="integration"]');
      await expect(toolStatus).toBeVisible({ timeout: 5000 });
      await expect(toolStatus).toContainText(/연결됨|connected|활성|active/i);
    }
    
    // Step 4: 실시간 진행상황 업데이트
    const progressUpdate = page.locator('[class*="progress-update"], [class*="status-update"]');
    if (await progressUpdate.isVisible()) {
      // 진행률 업데이트
      const progressSlider = progressUpdate.locator('[role="slider"], input[type="range"]');
      if (await progressSlider.isVisible()) {
        await progressSlider.fill('75'); // 75% 완료로 업데이트
      }
      
      // 상태 메시지 입력
      const statusMessage = progressUpdate.locator('textarea, input[type="text"]');
      if (await statusMessage.isVisible()) {
        await statusMessage.fill('클라이언트 피드백 반영 중 - 오프닝 구간 재편집 완료, 배경음악 볼륨 조정 중');
      }
      
      const updateBtn = progressUpdate.getByRole('button', { name: /업데이트|update/i });
      await updateBtn.click();
    }
    
    // Step 5: 수정된 버전 업로드 및 알림
    const versionUpload = page.locator('[class*="version-upload"], [class*="new-version"]');
    if (await versionUpload.isVisible()) {
      // 파일 업로드 시뮬레이션
      const fileInput = versionUpload.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // 실제 환경에서는 파일 업로드
        // await fileInput.setInputFiles('path/to/updated-video.mp4');
        
        // 업로드 완료 시뮬레이션
        const uploadComplete = page.locator('[class*="upload-complete"]');
        await expect(uploadComplete).toBeVisible({ timeout: 10000 });
      }
      
      // 클라이언트에게 알림 전송
      const notifyClientBtn = versionUpload.getByRole('button', { name: /클라이언트 알림|notify client/i });
      if (await notifyClientBtn.isVisible()) {
        await notifyClientBtn.click();
        
        // 알림 메시지 작성
        const notificationMessage = page.locator('[class*="notification-message"] textarea');
        await notificationMessage.fill('요청하신 수정사항이 반영된 새 버전이 업로드되었습니다. 확인 후 피드백 부탁드립니다.');
        
        const sendNotificationBtn = page.getByRole('button', { name: /알림 전송|send notification/i });
        await sendNotificationBtn.click();
      }
    }
  });

  test('@business 팀 리더 성과 분석 여정', async ({ page }) => {
    /**
     * 🎯 시나리오: 팀 리더의 주간/월간 성과 분석
     * - 대시보드 KPI 확인
     * - 팀원별 생산성 분석
     * - 클라이언트 만족도 트렌드
     * - 프로젝트 수익성 리포트
     */
    
    await loginUser(page);
    
    // Step 1: 성과 대시보드 접근
    await page.goto('/dashboard');
    
    // Analytics 위젯이나 탭 찾기
    const analyticsSection = page.locator('[class*="analytics"], [class*="performance"], [class*="kpi"]');
    if (!await analyticsSection.isVisible()) {
      // 메뉴에서 분석 섹션 찾기
      const analyticsMenu = page.getByRole('link', { name: /분석|analytics|리포트|report/i });
      if (await analyticsMenu.isVisible()) {
        await analyticsMenu.click();
      }
    }
    
    // Step 2: 주요 KPI 확인
    const kpiMetrics = [
      'total-projects', 'completed-projects', 'client-satisfaction', 
      'average-feedback-time', 'revenue-this-month', 'team-productivity'
    ];
    
    for (const metric of kpiMetrics) {
      const kpiElement = page.locator(`[data-metric="${metric}"], [class*="${metric}"]`);
      if (await kpiElement.isVisible()) {
        const value = await kpiElement.textContent();
        console.log(`${metric}: ${value}`);
        
        // KPI가 목표 범위 내인지 확인
        const status = await kpiElement.locator('[class*="status"], [class*="trend"]').getAttribute('class');
        expect(status).toContain(/good|positive|up|green/i);
      }
    }
    
    // Step 3: 팀원별 성과 분석
    const teamPerformanceSection = page.locator('[class*="team-performance"]');
    if (await teamPerformanceSection.isVisible()) {
      const teamMembers = teamPerformanceSection.locator('[class*="member"], [class*="employee"]');
      const memberCount = await teamMembers.count();
      
      // 각 팀원의 주요 지표 확인
      for (let i = 0; i < Math.min(memberCount, 5); i++) {
        const member = teamMembers.nth(i);
        const name = await member.locator('[class*="name"]').textContent();
        const completedTasks = await member.locator('[class*="completed"]').textContent();
        const clientRating = await member.locator('[class*="rating"]').textContent();
        
        console.log(`팀원 ${name}: 완료 작업 ${completedTasks}, 클라이언트 평점 ${clientRating}`);
        
        // 성과가 기준치 이하인 팀원이 있다면 알림
        const performanceStatus = await member.locator('[class*="performance-status"]').getAttribute('class');
        if (performanceStatus?.includes('low') || performanceStatus?.includes('red')) {
          const supportBtn = member.getByRole('button', { name: /지원|support|1:1 미팅/i });
          if (await supportBtn.isVisible()) {
            await supportBtn.click();
            
            // 지원 메시지 작성
            const supportMessage = page.locator('[class*="support-message"] textarea');
            await supportMessage.fill('최근 업무량이 많으셨나요? 필요한 지원이 있다면 언제든 말씀해주세요. 1:1 미팅도 가능합니다.');
            
            const sendSupportBtn = page.getByRole('button', { name: /메시지 전송|send message/i });
            await sendSupportBtn.click();
          }
        }
      }
    }
    
    // Step 4: 클라이언트 만족도 트렌드 분석
    const satisfactionChart = page.locator('[class*="satisfaction-chart"], [class*="client-rating"]');
    if (await satisfactionChart.isVisible()) {
      // 차트의 트렌드 확인 (상승/하락)
      const trendIndicator = satisfactionChart.locator('[class*="trend"], [class*="direction"]');
      const trendDirection = await trendIndicator.getAttribute('class');
      
      if (trendDirection?.includes('down') || trendDirection?.includes('negative')) {
        // 만족도가 하락 중이면 액션 플랜 수립
        const actionPlanBtn = page.getByRole('button', { name: /액션 플랜|action plan|개선책/i });
        if (await actionPlanBtn.isVisible()) {
          await actionPlanBtn.click();
          
          const improvementPlan = page.locator('[class*="improvement-plan"] textarea');
          await improvementPlan.fill(`
클라이언트 만족도 개선 액션 플랜:
1. 피드백 응답 시간 24시간 내로 단축
2. 주간 진행 상황 리포트 자동 발송
3. 클라이언트 전담 매니저 배정
4. 품질 체크리스트 강화
5. 월 1회 클라이언트 만족도 조사 실시
          `);
          
          const savePlanBtn = page.getByRole('button', { name: /계획 저장|save plan/i });
          await savePlanBtn.click();
        }
      }
    }
    
    // Step 5: 프로젝트 수익성 분석
    const revenueSection = page.locator('[class*="revenue"], [class*="profit"], [class*="financial"]');
    if (await revenueSection.isVisible()) {
      // 월별 매출 트렌드 확인
      const monthlyRevenue = revenueSection.locator('[class*="monthly-revenue"]');
      const currentMonth = await monthlyRevenue.textContent();
      
      // 프로젝트별 수익률 확인
      const projectProfitability = revenueSection.locator('[class*="project-profit"]');
      const profitableProjects = projectProfitability.locator('[class*="profitable"]');
      const unprofitableProjects = projectProfitability.locator('[class*="loss"], [class*="unprofitable"]');
      
      const profitableCount = await profitableProjects.count();
      const unprofitableCount = await unprofitableProjects.count();
      
      console.log(`수익성 분석 - 수익 프로젝트: ${profitableCount}개, 손실 프로젝트: ${unprofitableCount}개`);
      
      // 손실 프로젝트가 많다면 경고
      if (unprofitableCount > profitableCount * 0.3) {
        const alertBtn = page.getByRole('button', { name: /경고|warning|주의/i });
        if (await alertBtn.isVisible()) {
          await expect(alertBtn).toBeVisible();
          console.log('⚠️ 손실 프로젝트 비율이 높습니다. 가격 정책 재검토 필요');
        }
      }
    }
    
    // Step 6: 종합 리포트 생성 및 공유
    const generateReportBtn = page.getByRole('button', { name: /리포트 생성|generate report|보고서/i });
    if (await generateReportBtn.isVisible()) {
      await generateReportBtn.click();
      
      // 리포트 옵션 선택
      const reportOptions = {
        period: '월간',
        include: ['KPI', '팀성과', '클라이언트만족도', '수익성'],
        format: 'PDF',
        recipients: ['CEO', '영업팀장', '재무담당자']
      };
      
      // 리포트 설정
      const periodSelect = page.locator('[name="period"], select').first();
      if (await periodSelect.isVisible()) {
        await periodSelect.selectOption(reportOptions.period);
      }
      
      // 포함 항목 체크박스
      for (const item of reportOptions.include) {
        const checkbox = page.getByRole('checkbox', { name: new RegExp(item, 'i') });
        if (await checkbox.isVisible()) {
          await checkbox.check();
        }
      }
      
      // 리포트 생성
      const createReportBtn = page.getByRole('button', { name: /생성|create|generate/i });
      await createReportBtn.click();
      
      // 생성 완료 대기
      const reportReady = page.locator('[class*="report-ready"], [role="alert"]');
      await expect(reportReady).toBeVisible({ timeout: 15000 });
      await expect(reportReady).toContainText(/완료|ready|생성됨/i);
    }
  });
});

// Helper function for login
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder(/이메일|email/i).fill('ceo@winnmedia.co.kr');
  await page.getByPlaceholder(/비밀번호|password/i).fill('dnlsdos213$');
  await page.getByRole('button', { name: /로그인|sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}
