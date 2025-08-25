import { test, expect, Page, BrowserContext } from '@playwright/test';
import { testData } from './fixtures/test-data';
import { TestHelpers } from './helpers/test-helpers';

/**
 * VideoPlanet 피드백 및 코멘트 시스템 E2E 테스트
 * 
 * 테스트 커버리지:
 * - 비디오 피드백 작성
 * - 타임스탬프 기반 피드백
 * - 스크린샷 및 주석
 * - 코멘트 스레드
 * - 감정 반응
 * - 실시간 업데이트
 */

test.describe('Feedback and Comment System', () => {
  let context: BrowserContext;
  let page: Page;
  let helpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    page = await context.newPage();
    helpers = new TestHelpers(page);
    
    // 리뷰어로 로그인
    await helpers.login(testData.users.reviewer);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('비디오 피드백 작성', () => {
    test('타임스탬프 기반 피드백 작성', async () => {
      // 프로젝트 피드백 페이지로 이동
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 비디오 플레이어 로드 확인
      const videoPlayer = page.locator('[data-testid="video-player"]');
      await expect(videoPlayer).toBeVisible();
      
      // 비디오 재생
      await page.click('[data-testid="play-button"]');
      
      // 특정 시점으로 이동 (30초)
      await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.currentTime = 30;
      });
      
      // 현재 시점에 피드백 추가 버튼 클릭
      await page.click('[data-testid="add-feedback-at-current-time"]');
      
      // 피드백 폼 확인
      const feedbackModal = page.locator('[data-testid="feedback-modal"]');
      await expect(feedbackModal).toBeVisible();
      
      // 타임스탬프가 자동으로 설정되었는지 확인
      const timestampInput = feedbackModal.locator('[data-testid="timestamp-input"]');
      await expect(timestampInput).toHaveValue('00:30');
      
      // 피드백 내용 작성
      await feedbackModal.locator('[data-testid="feedback-title"]').fill('색상 보정 필요');
      await feedbackModal.locator('[data-testid="feedback-description"]').fill('이 장면의 색상이 너무 어둡습니다. 밝기를 조정해주세요.');
      
      // 우선순위 설정
      await feedbackModal.locator('[data-testid="priority-select"]').selectOption('high');
      
      // 카테고리 선택
      await feedbackModal.locator('[data-testid="category-select"]').selectOption('visual');
      
      // 피드백 제출
      await page.click('[data-testid="submit-feedback"]');
      
      // 성공 메시지 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/피드백이 추가되었습니다/);
      
      // 타임라인에 피드백 마커 표시 확인
      const timelineMarker = page.locator('[data-testid="timeline-marker"][data-time="30"]');
      await expect(timelineMarker).toBeVisible();
      await expect(timelineMarker).toHaveClass(/high-priority/);
      
      // 피드백 목록에 표시 확인
      const feedbackList = page.locator('[data-testid="feedback-list"]');
      const newFeedback = feedbackList.locator('[data-testid="feedback-item"]').first();
      await expect(newFeedback).toContainText('색상 보정 필요');
      await expect(newFeedback).toContainText('00:30');
    });

    test('스크린샷 캡처 및 주석 추가', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 비디오를 특정 시점으로 이동
      await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.currentTime = 45;
      });
      
      // 스크린샷 캡처 버튼 클릭
      await page.click('[data-testid="capture-screenshot"]');
      
      // 스크린샷 에디터 모달 확인
      const screenshotEditor = page.locator('[data-testid="screenshot-editor"]');
      await expect(screenshotEditor).toBeVisible();
      
      // 캔버스에 주석 그리기
      const canvas = screenshotEditor.locator('canvas');
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 300, y: 200 }
      });
      
      // 도구 선택 (화살표)
      await page.click('[data-testid="tool-arrow"]');
      await canvas.click({ position: { x: 400, y: 150 } });
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 400, y: 150 },
        targetPosition: { x: 500, y: 150 }
      });
      
      // 텍스트 추가
      await page.click('[data-testid="tool-text"]');
      await canvas.click({ position: { x: 200, y: 250 } });
      await page.keyboard.type('여기를 수정해주세요');
      
      // 색상 변경
      await page.click('[data-testid="color-red"]');
      
      // 다시 그리기
      await page.click('[data-testid="tool-rectangle"]');
      await canvas.click({ position: { x: 50, y: 50 } });
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 50, y: 50 },
        targetPosition: { x: 150, y: 100 }
      });
      
      // 스크린샷 저장
      await page.click('[data-testid="save-screenshot"]');
      
      // 피드백 내용 추가
      await page.fill('[data-testid="screenshot-feedback-title"]', '레이아웃 수정 요청');
      await page.fill('[data-testid="screenshot-feedback-description"]', '표시된 영역의 레이아웃을 수정해주세요.');
      
      // 피드백 제출
      await page.click('[data-testid="submit-screenshot-feedback"]');
      
      // 성공 확인
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/스크린샷 피드백이 추가되었습니다/);
      
      // 피드백 목록에서 스크린샷 확인
      const feedbackWithScreenshot = page.locator('[data-testid="feedback-item"][data-has-screenshot="true"]').first();
      await expect(feedbackWithScreenshot).toBeVisible();
      
      // 스크린샷 썸네일 클릭
      await feedbackWithScreenshot.locator('[data-testid="screenshot-thumbnail"]').click();
      
      // 스크린샷 뷰어 모달 확인
      await expect(page.locator('[data-testid="screenshot-viewer"]')).toBeVisible();
      await expect(page.locator('[data-testid="screenshot-viewer"] img')).toBeVisible();
    });

    test('피드백 일괄 작업', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 여러 피드백 선택
      const feedbackItems = page.locator('[data-testid="feedback-item"]');
      const itemCount = await feedbackItems.count();
      
      if (itemCount >= 3) {
        // 첫 3개 피드백 선택
        for (let i = 0; i < 3; i++) {
          await feedbackItems.nth(i).locator('[data-testid="feedback-checkbox"]').check();
        }
        
        // 일괄 작업 툴바 표시 확인
        const bulkToolbar = page.locator('[data-testid="bulk-action-toolbar"]');
        await expect(bulkToolbar).toBeVisible();
        await expect(bulkToolbar).toContainText('3개 선택됨');
        
        // 일괄 상태 변경
        await bulkToolbar.locator('[data-testid="bulk-status-select"]').selectOption('resolved');
        await bulkToolbar.locator('[data-testid="apply-bulk-action"]').click();
        
        // 확인 모달
        await expect(page.locator('[data-testid="bulk-action-confirm"]')).toBeVisible();
        await page.click('[data-testid="confirm-bulk-action"]');
        
        // 성공 메시지
        await expect(page.locator('[data-testid="success-toast"]')).toContainText(/3개의 피드백이 업데이트되었습니다/);
        
        // 상태 변경 확인
        for (let i = 0; i < 3; i++) {
          await expect(feedbackItems.nth(i).locator('[data-testid="feedback-status"]')).toContainText('해결됨');
        }
      }
    });
  });

  test.describe('코멘트 시스템', () => {
    test('코멘트 작성 및 스레드 답글', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 첫 번째 피드백 선택
      const firstFeedback = page.locator('[data-testid="feedback-item"]').first();
      await firstFeedback.click();
      
      // 피드백 상세 패널 확인
      const detailPanel = page.locator('[data-testid="feedback-detail-panel"]');
      await expect(detailPanel).toBeVisible();
      
      // 코멘트 작성
      const commentInput = detailPanel.locator('[data-testid="comment-input"]');
      await commentInput.fill('이 부분에 대해 추가 설명이 필요합니다.');
      
      // 멘션 추가
      await commentInput.type(' @');
      await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible();
      await page.click('[data-testid="mention-user"]').first();
      
      // 코멘트 제출
      await page.click('[data-testid="submit-comment"]');
      
      // 코멘트 표시 확인
      const newComment = detailPanel.locator('[data-testid="comment-item"]').first();
      await expect(newComment).toBeVisible();
      await expect(newComment).toContainText('이 부분에 대해 추가 설명이 필요합니다');
      
      // 답글 작성
      await newComment.locator('[data-testid="reply-button"]').click();
      
      const replyInput = newComment.locator('[data-testid="reply-input"]');
      await expect(replyInput).toBeVisible();
      await replyInput.fill('설명 추가했습니다. 확인 부탁드립니다.');
      await newComment.locator('[data-testid="submit-reply"]').click();
      
      // 답글 표시 확인
      const reply = newComment.locator('[data-testid="reply-item"]').first();
      await expect(reply).toBeVisible();
      await expect(reply).toContainText('설명 추가했습니다');
      
      // 스레드 카운트 확인
      await expect(newComment.locator('[data-testid="reply-count"]')).toContainText('1');
      
      // 스레드 접기/펼치기
      await newComment.locator('[data-testid="toggle-replies"]').click();
      await expect(reply).not.toBeVisible();
      
      await newComment.locator('[data-testid="toggle-replies"]').click();
      await expect(reply).toBeVisible();
    });

    test('감정 반응 추가', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 피드백 선택
      const feedback = page.locator('[data-testid="feedback-item"]').first();
      await feedback.click();
      
      // 코멘트 선택
      const comment = page.locator('[data-testid="comment-item"]').first();
      
      // 반응 버튼 확인
      const reactions = comment.locator('[data-testid="reaction-buttons"]');
      await expect(reactions).toBeVisible();
      
      // 좋아요 반응 추가
      const likeButton = reactions.locator('[data-testid="reaction-like"]');
      const likeCount = await likeButton.locator('[data-testid="reaction-count"]').innerText();
      const initialCount = parseInt(likeCount || '0');
      
      await likeButton.click();
      
      // 애니메이션 확인
      await expect(likeButton).toHaveClass(/reaction-active/);
      
      // 카운트 증가 확인
      await expect(likeButton.locator('[data-testid="reaction-count"]')).toContainText(String(initialCount + 1));
      
      // 다른 반응으로 변경
      const questionButton = reactions.locator('[data-testid="reaction-question"]');
      await questionButton.click();
      
      // 이전 반응 제거 및 새 반응 추가 확인
      await expect(likeButton).not.toHaveClass(/reaction-active/);
      await expect(questionButton).toHaveClass(/reaction-active/);
      
      // 반응 제거 (토글)
      await questionButton.click();
      await expect(questionButton).not.toHaveClass(/reaction-active/);
    });

    test('코멘트 편집 및 삭제', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 피드백 선택
      await page.locator('[data-testid="feedback-item"]').first().click();
      
      // 새 코멘트 작성
      await page.fill('[data-testid="comment-input"]', '수정 테스트용 코멘트');
      await page.click('[data-testid="submit-comment"]');
      
      // 작성한 코멘트 찾기
      const myComment = page.locator('[data-testid="comment-item"][data-is-mine="true"]').first();
      await expect(myComment).toBeVisible();
      
      // 편집 버튼 클릭
      await myComment.hover();
      await myComment.locator('[data-testid="edit-comment"]').click();
      
      // 편집 모드 확인
      const editInput = myComment.locator('[data-testid="edit-input"]');
      await expect(editInput).toBeVisible();
      await expect(editInput).toHaveValue('수정 테스트용 코멘트');
      
      // 내용 수정
      await editInput.clear();
      await editInput.fill('수정된 코멘트 내용입니다.');
      await myComment.locator('[data-testid="save-edit"]').click();
      
      // 수정 확인
      await expect(myComment).toContainText('수정된 코멘트 내용입니다');
      await expect(myComment).toContainText('(수정됨)');
      
      // 삭제 버튼 클릭
      await myComment.hover();
      await myComment.locator('[data-testid="delete-comment"]').click();
      
      // 삭제 확인 모달
      await expect(page.locator('[data-testid="delete-confirm-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete"]');
      
      // 삭제 확인
      await expect(myComment).not.toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(/코멘트가 삭제되었습니다/);
    });
  });

  test.describe('실시간 업데이트', () => {
    test('실시간 피드백 업데이트', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // WebSocket 연결 상태 확인
      await expect(page.locator('[data-testid="realtime-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="realtime-indicator"]')).toHaveClass(/connected/);
      
      // 다른 사용자의 피드백 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('feedback:new', {
          detail: {
            id: 'new-feedback-1',
            title: '다른 사용자의 피드백',
            timestamp: 60,
            user: { name: 'Other User', avatar: '/avatar.jpg' },
            createdAt: new Date().toISOString()
          }
        }));
      });
      
      // 새 피드백 알림 표시 확인
      await expect(page.locator('[data-testid="new-feedback-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-feedback-notification"]')).toContainText('새로운 피드백이 추가되었습니다');
      
      // 피드백 목록에 추가 확인
      await expect(page.locator('[data-testid="feedback-item"][data-id="new-feedback-1"]')).toBeVisible();
      
      // 타임라인 마커 추가 확인
      await expect(page.locator('[data-testid="timeline-marker"][data-time="60"]')).toBeVisible();
    });

    test('실시간 코멘트 업데이트', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 피드백 선택
      await page.locator('[data-testid="feedback-item"]').first().click();
      
      // 다른 사용자의 코멘트 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('comment:new', {
          detail: {
            id: 'new-comment-1',
            feedbackId: 'feedback-1',
            text: '실시간으로 추가된 코멘트',
            user: { name: 'Other User', avatar: '/avatar.jpg' },
            createdAt: new Date().toISOString()
          }
        }));
      });
      
      // 새 코멘트 표시 확인
      const newComment = page.locator('[data-testid="comment-item"][data-id="new-comment-1"]');
      await expect(newComment).toBeVisible();
      await expect(newComment).toContainText('실시간으로 추가된 코멘트');
      
      // 애니메이션 효과 확인
      await expect(newComment).toHaveClass(/new-comment-animation/);
      
      // 코멘트 카운트 업데이트 확인
      const commentCount = page.locator('[data-testid="comment-count"]');
      const currentCount = await commentCount.innerText();
      expect(parseInt(currentCount)).toBeGreaterThan(0);
    });

    test('타이핑 인디케이터', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 피드백 선택
      await page.locator('[data-testid="feedback-item"]').first().click();
      
      // 코멘트 입력 시작
      const commentInput = page.locator('[data-testid="comment-input"]');
      await commentInput.click();
      await commentInput.type('타이핑 중...');
      
      // 다른 사용자의 타이핑 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('user:typing', {
          detail: {
            user: { name: 'Other User', avatar: '/avatar.jpg' },
            feedbackId: 'feedback-1'
          }
        }));
      });
      
      // 타이핑 인디케이터 표시 확인
      await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="typing-indicator"]')).toContainText('Other User님이 입력 중...');
      
      // 타이핑 중지 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('user:stopped-typing', {
          detail: {
            user: { name: 'Other User' },
            feedbackId: 'feedback-1'
          }
        }));
      });
      
      // 타이핑 인디케이터 사라짐 확인
      await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
    });
  });

  test.describe('피드백 필터 및 검색', () => {
    test('피드백 필터링', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 필터 패널 열기
      await page.click('[data-testid="filter-button"]');
      const filterPanel = page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toBeVisible();
      
      // 우선순위 필터
      await filterPanel.locator('[data-testid="filter-priority-high"]').check();
      await page.click('[data-testid="apply-filters"]');
      
      // 필터 적용 확인
      const feedbackItems = page.locator('[data-testid="feedback-item"]');
      const count = await feedbackItems.count();
      
      for (let i = 0; i < count; i++) {
        await expect(feedbackItems.nth(i).locator('[data-testid="priority-badge"]')).toContainText('높음');
      }
      
      // 상태 필터 추가
      await page.click('[data-testid="filter-button"]');
      await filterPanel.locator('[data-testid="filter-status-pending"]').check();
      await page.click('[data-testid="apply-filters"]');
      
      // 복합 필터 적용 확인
      const filteredItems = page.locator('[data-testid="feedback-item"]');
      const filteredCount = await filteredItems.count();
      
      for (let i = 0; i < filteredCount; i++) {
        const item = filteredItems.nth(i);
        await expect(item.locator('[data-testid="priority-badge"]')).toContainText('높음');
        await expect(item.locator('[data-testid="status-badge"]')).toContainText('대기중');
      }
      
      // 필터 초기화
      await page.click('[data-testid="clear-filters"]');
      await expect(page.locator('[data-testid="feedback-item"]').first()).toBeVisible();
    });

    test('피드백 검색', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 검색어 입력
      const searchInput = page.locator('[data-testid="search-feedback"]');
      await searchInput.fill('색상');
      
      // 검색 실행
      await page.keyboard.press('Enter');
      
      // 검색 결과 확인
      const searchResults = page.locator('[data-testid="feedback-item"]');
      const resultCount = await searchResults.count();
      
      for (let i = 0; i < resultCount; i++) {
        const itemText = await searchResults.nth(i).innerText();
        expect(itemText.toLowerCase()).toContain('색상');
      }
      
      // 검색 결과 카운트 표시
      await expect(page.locator('[data-testid="search-result-count"]')).toContainText(`${resultCount}개의 결과`);
      
      // 검색어 하이라이트 확인
      await expect(page.locator('[data-testid="feedback-item"] mark').first()).toBeVisible();
      
      // 검색 초기화
      await page.click('[data-testid="clear-search"]');
      await expect(searchInput).toHaveValue('');
    });

    test('피드백 정렬', async () => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      // 정렬 옵션 선택
      const sortSelect = page.locator('[data-testid="sort-feedback"]');
      
      // 최신순 정렬
      await sortSelect.selectOption('newest');
      await page.waitForTimeout(500); // 정렬 애니메이션 대기
      
      // 날짜 확인
      const dates = await page.locator('[data-testid="feedback-date"]').allInnerTexts();
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
      
      // 우선순위순 정렬
      await sortSelect.selectOption('priority');
      await page.waitForTimeout(500);
      
      // 우선순위 확인
      const priorities = await page.locator('[data-testid="priority-badge"]').allInnerTexts();
      const priorityOrder = ['긴급', '높음', '중간', '낮음'];
      
      let lastPriorityIndex = 0;
      for (const priority of priorities) {
        const currentIndex = priorityOrder.indexOf(priority);
        expect(currentIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
        if (currentIndex > lastPriorityIndex) {
          lastPriorityIndex = currentIndex;
        }
      }
    });
  });
});