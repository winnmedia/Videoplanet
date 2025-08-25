# VideoPlanet 테스트 케이스 매트릭스
## 핵심 기능별 상세 테스트 시나리오

---

## 1. 게스트 피드백 시스템

### 1.1 단위 테스트 (Unit Tests)

```typescript
describe('Guest Feedback Unit Tests', () => {
  // 입력 검증
  describe('Input Validation', () => {
    test('이메일 형식 검증 - 유효한 이메일', () => {
      expect(validateEmail('guest@example.com')).toBe(true);
    });
    
    test('이메일 형식 검증 - 잘못된 형식', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
    
    test('피드백 내용 최소 길이 검증', () => {
      expect(validateFeedbackLength('짧음')).toBe(false);
      expect(validateFeedbackLength('이것은 유효한 피드백입니다')).toBe(true);
    });
    
    test('XSS 공격 스크립트 필터링', () => {
      const malicious = '<script>alert("xss")</script>';
      expect(sanitizeFeedback(malicious)).not.toContain('<script>');
    });
  });
  
  // 타임스탬프 처리
  describe('Timestamp Processing', () => {
    test('타임스탬프 파싱 - MM:SS 형식', () => {
      expect(parseTimestamp('01:30')).toBe(90);
    });
    
    test('타임스탬프 파싱 - HH:MM:SS 형식', () => {
      expect(parseTimestamp('01:30:45')).toBe(5445);
    });
    
    test('타임스탬프 포맷팅', () => {
      expect(formatTimestamp(90)).toBe('1:30');
      expect(formatTimestamp(3661)).toBe('1:01:01');
    });
  });
  
  // 데이터 변환
  describe('Data Transformation', () => {
    test('게스트 피드백 DTO 생성', () => {
      const input = {
        name: '게스트',
        email: 'guest@example.com',
        content: '피드백 내용',
        timestamp: '01:30'
      };
      
      const dto = createGuestFeedbackDTO(input);
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('createdAt');
      expect(dto.isGuest).toBe(true);
    });
  });
});
```

### 1.2 통합 테스트 (Integration Tests)

```typescript
describe('Guest Feedback Integration Tests', () => {
  let mockServer: MockServer;
  
  beforeAll(() => {
    mockServer = setupMockServer();
  });
  
  describe('API Integration', () => {
    test('게스트 피드백 제출 - 성공', async () => {
      const feedback = {
        projectId: 'test-project',
        name: '테스트 게스트',
        email: 'test@example.com',
        content: '1:30 - 이 부분 수정 필요',
        emotion: 'confused'
      };
      
      const response = await submitGuestFeedback(feedback);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('feedbackId');
    });
    
    test('게스트 피드백 제출 - 프로젝트 없음', async () => {
      const feedback = {
        projectId: 'non-existent',
        name: '테스트',
        content: '피드백'
      };
      
      await expect(submitGuestFeedback(feedback))
        .rejects.toThrow('Project not found');
    });
    
    test('알림 전송 통합', async () => {
      const feedback = createTestFeedback();
      await submitGuestFeedback(feedback);
      
      // 알림이 전송되었는지 확인
      const notifications = await getNotifications();
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'NEW_GUEST_FEEDBACK',
          projectId: feedback.projectId
        })
      );
    });
  });
  
  describe('Database Integration', () => {
    test('피드백 저장 및 조회', async () => {
      const feedback = createTestFeedback();
      const saved = await saveFeedbackToDB(feedback);
      
      const retrieved = await getFeedbackById(saved.id);
      expect(retrieved).toEqual(saved);
    });
    
    test('프로젝트별 피드백 목록 조회', async () => {
      const projectId = 'test-project';
      await createMultipleFeedbacks(projectId, 5);
      
      const feedbacks = await getFeedbacksByProject(projectId);
      expect(feedbacks).toHaveLength(5);
      expect(feedbacks[0].createdAt).toBeAfter(feedbacks[4].createdAt);
    });
  });
});
```

### 1.3 E2E 테스트 (End-to-End Tests)

```typescript
test.describe('Guest Feedback E2E Journey', () => {
  test('완전한 게스트 피드백 여정', async ({ page }) => {
    // 1. 공유 링크로 접근
    await page.goto('/feedback/public/sample-project');
    await expect(page).toHaveTitle(/피드백/);
    
    // 2. 비디오 로드 확인
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', /\.mp4$/);
    
    // 3. 게스트 정보 입력
    await page.fill('[name="guestName"]', '김게스트');
    await page.fill('[name="guestEmail"]', 'guest@example.com');
    
    // 4. 비디오 특정 시점으로 이동
    await page.click('video');
    await page.waitForTimeout(3000);
    await page.click('[aria-label="Pause"]');
    
    // 5. 현재 타임스탬프 캡처
    const timestamp = await page.locator('.current-time').textContent();
    
    // 6. 피드백 작성
    const feedbackText = `${timestamp} - 이 장면의 전환이 너무 빠릅니다`;
    await page.fill('textarea[name="feedback"]', feedbackText);
    
    // 7. 감정 선택
    await page.click('[data-emotion="confused"]');
    
    // 8. 스크린샷 캡처
    await page.click('[aria-label="Screenshot"]');
    await expect(page.locator('.screenshot-preview')).toBeVisible();
    
    // 9. 피드백 제출
    await page.click('button[type="submit"]');
    
    // 10. 성공 메시지 확인
    await expect(page.locator('.success-message')).toContainText('감사합니다');
    
    // 11. 제출된 피드백이 목록에 표시되는지 확인
    await expect(page.locator('.feedback-list')).toContainText('김게스트');
    await expect(page.locator('.feedback-list')).toContainText(feedbackText);
  });
  
  test('게스트 권한 제한 확인', async ({ page }) => {
    await page.goto('/feedback/public/sample-project');
    
    // 수정/삭제 버튼이 없거나 비활성화되어 있어야 함
    const editButton = page.locator('[aria-label="Edit"]');
    const deleteButton = page.locator('[aria-label="Delete"]');
    
    if (await editButton.isVisible()) {
      await expect(editButton).toBeDisabled();
    }
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeDisabled();
    }
  });
});
```

---

## 2. AI 영상 기획 생성

### 2.1 단위 테스트

```typescript
describe('AI Planning Unit Tests', () => {
  describe('Input Processing', () => {
    test('기획 입력 데이터 검증', () => {
      const validInput = {
        title: '브랜드 홍보 영상',
        genre: 'promotional',
        duration: 90,
        concept: '혁신적인 브랜드 이미지'
      };
      
      expect(validatePlanningInput(validInput)).toBe(true);
    });
    
    test('필수 필드 누락 검증', () => {
      const invalidInput = {
        title: '제목만 있음'
      };
      
      const result = validatePlanningInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('concept is required');
    });
    
    test('프롬프트 생성', () => {
      const input = {
        title: 'Q1 마케팅 영상',
        concept: '젊은 감각',
        duration: 60
      };
      
      const prompt = generateAIPrompt(input);
      expect(prompt).toContain('Q1 마케팅 영상');
      expect(prompt).toContain('60초');
      expect(prompt).toContain('4단계 스토리');
    });
  });
  
  describe('Response Processing', () => {
    test('AI 응답 파싱 - 4단계 스토리', () => {
      const mockResponse = `
        1단계: 문제 제기
        2단계: 해결책 제시
        3단계: 혜택 강조
        4단계: 행동 유도
      `;
      
      const parsed = parseStoryStructure(mockResponse);
      expect(parsed.stages).toHaveLength(4);
      expect(parsed.stages[0].title).toBe('문제 제기');
    });
    
    test('AI 응답 파싱 - 12개 숏트', () => {
      const mockResponse = generateMockShotBreakdown();
      const shots = parseShotBreakdown(mockResponse);
      
      expect(shots).toHaveLength(12);
      shots.forEach(shot => {
        expect(shot).toHaveProperty('duration');
        expect(shot).toHaveProperty('description');
        expect(shot).toHaveProperty('cameraAngle');
      });
    });
    
    test('PDF 문서 생성 데이터 구조', () => {
      const planData = {
        title: '테스트 기획',
        storyStages: [...],
        shotBreakdown: [...],
        metadata: {...}
      };
      
      const pdfData = preparePDFData(planData);
      expect(pdfData).toHaveProperty('pages');
      expect(pdfData.pages[0]).toHaveProperty('header');
      expect(pdfData.pages[0]).toHaveProperty('content');
    });
  });
});
```

### 2.2 통합 테스트

```typescript
describe('AI Planning Integration Tests', () => {
  describe('AI API Integration', () => {
    test('OpenAI API 호출 및 응답 처리', async () => {
      const planRequest = {
        title: '테스트 영상',
        concept: '혁신적 접근',
        duration: 90
      };
      
      const response = await callAIAPI(planRequest);
      expect(response).toHaveProperty('content');
      expect(response.content).toContain('단계');
      expect(response.usage.total_tokens).toBeLessThan(4000);
    });
    
    test('AI 응답 실패 시 재시도', async () => {
      // 첫 번째 호출은 실패하도록 설정
      mockAIAPI.failNext();
      
      const response = await callAIAPIWithRetry(testRequest);
      expect(response).toBeDefined();
      expect(mockAIAPI.callCount).toBe(2); // 재시도 확인
    });
    
    test('기획서 저장 및 버전 관리', async () => {
      const planning = await generateAIPlan(testInput);
      const saved = await savePlanning(planning);
      
      expect(saved).toHaveProperty('id');
      expect(saved).toHaveProperty('version', 1);
      
      // 수정 후 새 버전 생성
      planning.title = '수정된 제목';
      const updated = await savePlanning(planning);
      expect(updated.version).toBe(2);
    });
  });
  
  describe('PDF Generation', () => {
    test('PDF 생성 및 다운로드 URL 생성', async () => {
      const planning = await generateTestPlanning();
      const pdfUrl = await generatePDF(planning);
      
      expect(pdfUrl).toMatch(/^https:\/\/.*\.pdf$/);
      
      // PDF 실제 다운로드 가능 확인
      const response = await fetch(pdfUrl);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
    });
  });
});
```

### 2.3 E2E 테스트

```typescript
test.describe('AI Planning E2E Journey', () => {
  test('완전한 AI 기획서 생성 여정', async ({ page }) => {
    // 1. 로그인
    await loginAsPlanner(page);
    
    // 2. AI 기획 페이지 이동
    await page.goto('/video-planning/ai');
    await expect(page).toHaveTitle(/AI 기획/);
    
    // 3. 기획 정보 입력
    await page.fill('[name="title"]', 'Q1 브랜드 캠페인 영상');
    await page.selectOption('[name="genre"]', 'promotional');
    await page.fill('[name="duration"]', '90');
    await page.fill('[name="targetAudience"]', '20-30대 직장인');
    await page.fill('[name="concept"]', '혁신적이고 젊은 브랜드 이미지');
    await page.fill('[name="purpose"]', '브랜드 인지도 향상 및 신규 고객 유치');
    
    // 4. AI 생성 시작
    await page.click('button:has-text("AI 기획서 생성")');
    
    // 5. 생성 진행 상황 모니터링
    const progressSteps = [
      '콘셉트 분석 중',
      '스토리 구조 생성 중',
      '숏트 분해 중',
      '최종 검토 중'
    ];
    
    for (const step of progressSteps) {
      await expect(page.locator('.progress-status')).toContainText(step);
      await page.waitForTimeout(2000); // 각 단계 대기
    }
    
    // 6. 생성 완료 확인
    await expect(page.locator('.generation-complete')).toBeVisible();
    
    // 7. 4단계 스토리 구조 확인
    const storyStages = page.locator('.story-stage');
    await expect(storyStages).toHaveCount(4);
    
    // 8. 12개 숏트 확인
    const shots = page.locator('.shot-card');
    await expect(shots).toHaveCount(12);
    
    // 9. 첫 번째 스토리 편집
    await storyStages.first().click();
    await page.click('button:has-text("편집")');
    
    const editArea = page.locator('.story-edit textarea');
    await editArea.clear();
    await editArea.fill('강력한 오프닝: 3초 내 시선 사로잡기');
    await page.click('button:has-text("저장")');
    
    // 10. 자동 저장 확인
    await expect(page.locator('.auto-save-indicator')).toContainText('저장됨');
    
    // 11. PDF 다운로드
    await page.click('button:has-text("PDF 다운로드")');
    
    // 다운로드 완료 확인
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // 12. 공유 링크 생성
    await page.click('button:has-text("공유")');
    const shareDialog = page.locator('.share-dialog');
    await expect(shareDialog).toBeVisible();
    
    const shareLink = await shareDialog.locator('input[readonly]').inputValue();
    expect(shareLink).toMatch(/^https:\/\/.*\/planning\/share\/.+$/);
  });
});
```

---

## 3. 비디오 피드백 시스템

### 3.1 단위 테스트

```typescript
describe('Video Feedback Unit Tests', () => {
  describe('Timeline Management', () => {
    test('타임라인 마커 생성', () => {
      const marker = createTimelineMarker({
        timestamp: 45.5,
        type: 'feedback',
        content: '컷 전환 필요'
      });
      
      expect(marker.position).toBe('0:45.5');
      expect(marker.id).toBeDefined();
    });
    
    test('타임라인 마커 정렬', () => {
      const markers = [
        { timestamp: 120 },
        { timestamp: 30 },
        { timestamp: 90 }
      ];
      
      const sorted = sortTimelineMarkers(markers);
      expect(sorted[0].timestamp).toBe(30);
      expect(sorted[2].timestamp).toBe(120);
    });
    
    test('겹치는 마커 그룹화', () => {
      const markers = [
        { timestamp: 30, id: '1' },
        { timestamp: 31, id: '2' },
        { timestamp: 35, id: '3' },
        { timestamp: 100, id: '4' }
      ];
      
      const groups = groupOverlappingMarkers(markers, 5);
      expect(groups).toHaveLength(2);
      expect(groups[0]).toHaveLength(3);
      expect(groups[1]).toHaveLength(1);
    });
  });
  
  describe('Screenshot Processing', () => {
    test('스크린샷 캡처 데이터 생성', () => {
      const video = {
        currentTime: 45.5,
        videoWidth: 1920,
        videoHeight: 1080
      };
      
      const screenshot = captureScreenshot(video);
      expect(screenshot.timestamp).toBe(45.5);
      expect(screenshot.dimensions).toEqual({ width: 1920, height: 1080 });
      expect(screenshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    });
    
    test('스크린샷 썸네일 생성', () => {
      const fullScreenshot = 'data:image/png;base64,LARGE_DATA';
      const thumbnail = generateThumbnail(fullScreenshot, 200, 150);
      
      expect(thumbnail).toMatch(/^data:image\/jpeg;base64,/);
      expect(thumbnail.length).toBeLessThan(fullScreenshot.length);
    });
  });
  
  describe('Emotion Analysis', () => {
    test('감정 이모지 매핑', () => {
      expect(getEmotionEmoji('happy')).toBe('😊');
      expect(getEmotionEmoji('confused')).toBe('🤔');
      expect(getEmotionEmoji('angry')).toBe('😠');
    });
    
    test('감정 통계 계산', () => {
      const feedbacks = [
        { emotion: 'happy' },
        { emotion: 'happy' },
        { emotion: 'confused' },
        { emotion: 'sad' }
      ];
      
      const stats = calculateEmotionStats(feedbacks);
      expect(stats.happy).toBe(50);
      expect(stats.confused).toBe(25);
      expect(stats.sad).toBe(25);
    });
  });
});
```

### 3.2 통합 테스트

```typescript
describe('Video Feedback Integration Tests', () => {
  describe('WebSocket Integration', () => {
    let ws: WebSocket;
    
    beforeEach(() => {
      ws = new WebSocket('ws://localhost:3000/feedback');
    });
    
    test('실시간 피드백 브로드캐스트', async () => {
      const feedback = {
        projectId: 'test-project',
        timestamp: 45.5,
        content: '실시간 피드백',
        userId: 'user-1'
      };
      
      // 다른 클라이언트 시뮬레이션
      const client2 = new WebSocket('ws://localhost:3000/feedback');
      const receivedPromise = new Promise(resolve => {
        client2.on('message', resolve);
      });
      
      // 피드백 전송
      ws.send(JSON.stringify({
        type: 'NEW_FEEDBACK',
        data: feedback
      }));
      
      // 다른 클라이언트가 받았는지 확인
      const received = await receivedPromise;
      expect(JSON.parse(received)).toEqual(
        expect.objectContaining({
          type: 'FEEDBACK_BROADCAST',
          data: expect.objectContaining(feedback)
        })
      );
    });
    
    test('동시 편집 충돌 해결', async () => {
      const feedback = { id: 'feedback-1', content: 'Original' };
      
      // 두 사용자가 동시에 수정
      const edit1 = updateFeedback(feedback.id, { content: 'Edit 1' });
      const edit2 = updateFeedback(feedback.id, { content: 'Edit 2' });
      
      const [result1, result2] = await Promise.all([edit1, edit2]);
      
      // 한 편집은 성공, 다른 하나는 충돌
      expect([result1.status, result2.status]).toContain('conflict');
      expect([result1.status, result2.status]).toContain('success');
    });
  });
  
  describe('Video Storage Integration', () => {
    test('비디오 업로드 및 처리', async () => {
      const videoFile = createTestVideoFile();
      const uploaded = await uploadVideo(videoFile);
      
      expect(uploaded).toHaveProperty('videoId');
      expect(uploaded).toHaveProperty('streamUrl');
      expect(uploaded).toHaveProperty('thumbnailUrl');
      
      // 트랜스코딩 완료 대기
      await waitForTranscoding(uploaded.videoId);
      
      const info = await getVideoInfo(uploaded.videoId);
      expect(info.status).toBe('ready');
      expect(info.formats).toContain('1080p');
      expect(info.formats).toContain('720p');
    });
  });
});
```

### 3.3 E2E 테스트

```typescript
test.describe('Video Feedback E2E Journey', () => {
  test('완전한 비디오 피드백 협업 여정', async ({ page, context }) => {
    // 1. 첫 번째 사용자 (편집자) 로그인
    await loginAsEditor(page);
    await page.goto('/projects/test-project/feedback');
    
    // 2. 비디오 로드 확인
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    // 3. 비디오 재생 및 특정 시점에서 일시정지
    await page.click('[aria-label="Play"]');
    await page.waitForTimeout(5000);
    await page.click('[aria-label="Pause"]');
    
    // 4. 현재 시간 기록
    const currentTime = await page.locator('.time-display').textContent();
    
    // 5. 스크린샷 캡처
    await page.click('[aria-label="Capture Screenshot"]');
    const screenshotPreview = page.locator('.screenshot-preview');
    await expect(screenshotPreview).toBeVisible();
    
    // 6. 스크린샷에 주석 추가
    await screenshotPreview.click({ position: { x: 100, y: 100 } });
    await page.click('[aria-label="Add Arrow"]');
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 150);
    await page.mouse.up();
    
    // 7. 피드백 작성
    const feedbackContent = `${currentTime} - 이 부분의 색 보정이 필요합니다. 스크린샷 참조`;
    await page.fill('textarea[name="feedback"]', feedbackContent);
    
    // 8. 감정 선택
    await page.click('[data-emotion="thinking"]');
    
    // 9. 우선순위 설정
    await page.selectOption('[name="priority"]', 'high');
    
    // 10. 피드백 제출
    await page.click('button:has-text("피드백 제출")');
    await expect(page.locator('.feedback-success')).toBeVisible();
    
    // 11. 두 번째 브라우저에서 클라이언트로 접속
    const page2 = await context.newPage();
    await page2.goto('/feedback/public/test-project');
    
    // 12. 실시간으로 새 피드백이 나타나는지 확인
    await expect(page2.locator('.feedback-item').last()).toContainText(feedbackContent);
    await expect(page2.locator('.feedback-item').last()).toContainText('방금 전');
    
    // 13. 클라이언트가 답글 작성
    const lastFeedback = page2.locator('.feedback-item').last();
    await lastFeedback.locator('[aria-label="Reply"]').click();
    await page2.fill('.reply-input', '확인했습니다. 색 보정 진행하겠습니다.');
    await page2.click('button:has-text("답글 달기")');
    
    // 14. 편집자 화면에서 실시간 답글 확인
    await expect(page.locator('.reply-notification')).toBeVisible();
    await expect(page.locator('.feedback-replies')).toContainText('색 보정 진행하겠습니다');
    
    // 15. 타임라인에 마커 표시 확인
    const timeline = page.locator('.video-timeline');
    const marker = timeline.locator('.feedback-marker').last();
    await expect(marker).toBeVisible();
    await expect(marker).toHaveAttribute('data-time', currentTime);
    
    // 16. 마커 클릭으로 해당 시점 이동
    await marker.click();
    const newTime = await page.locator('.time-display').textContent();
    expect(newTime).toBe(currentTime);
  });
});
```

---

## 4. 인증/인가 시스템

### 4.1 단위 테스트

```typescript
describe('Authentication Unit Tests', () => {
  describe('Password Security', () => {
    test('비밀번호 복잡도 검증', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('NoNumber!')).toBe(false);
      expect(validatePassword('noupperca$e1')).toBe(false);
      expect(validatePassword('ValidPass123!')).toBe(true);
    });
    
    test('비밀번호 해싱', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
    
    test('비밀번호 재사용 방지', async () => {
      const passwords = ['Pass1!', 'Pass2!', 'Pass3!'];
      const history = await createPasswordHistory(passwords);
      
      expect(isPasswordReused('Pass1!', history)).toBe(true);
      expect(isPasswordReused('NewPass!', history)).toBe(false);
    });
  });
  
  describe('Token Management', () => {
    test('JWT 토큰 생성', () => {
      const payload = { userId: '123', role: 'editor' };
      const token = generateJWT(payload);
      
      expect(token).toMatch(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
    
    test('JWT 토큰 검증', () => {
      const token = generateJWT({ userId: '123' });
      const decoded = verifyJWT(token);
      
      expect(decoded.userId).toBe('123');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
    
    test('토큰 만료 확인', () => {
      const expiredToken = generateJWT({ userId: '123' }, { expiresIn: '-1h' });
      
      expect(() => verifyJWT(expiredToken)).toThrow('Token expired');
    });
  });
  
  describe('Session Management', () => {
    test('세션 생성 및 저장', async () => {
      const session = createSession({
        userId: '123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      expect(session.id).toBeDefined();
      expect(session.expiresAt).toBeAfter(new Date());
    });
    
    test('세션 타임아웃', async () => {
      const session = createSession({ userId: '123' }, { ttl: 1 });
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const isValid = await validateSession(session.id);
      expect(isValid).toBe(false);
    });
  });
});
```

### 4.2 통합 테스트

```typescript
describe('Authentication Integration Tests', () => {
  describe('Login Flow', () => {
    test('성공적인 로그인', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'ValidPass123!'
      };
      
      const response = await login(credentials);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data.user).toHaveProperty('id');
    });
    
    test('잘못된 비밀번호로 로그인 실패', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };
      
      const response = await login(credentials);
      expect(response.status).toBe(401);
      expect(response.error).toBe('Invalid credentials');
    });
    
    test('계정 잠금 (5회 실패)', async () => {
      const email = 'lock-test@example.com';
      
      // 5회 실패 시도
      for (let i = 0; i < 5; i++) {
        await login({ email, password: 'wrong' });
      }
      
      // 6번째 시도는 계정 잠금으로 실패
      const response = await login({ email, password: 'correct' });
      expect(response.status).toBe(423);
      expect(response.error).toContain('locked');
    });
  });
  
  describe('OAuth Integration', () => {
    test('Google OAuth 로그인', async () => {
      const googleToken = 'mock-google-token';
      const response = await loginWithGoogle(googleToken);
      
      expect(response.status).toBe(200);
      expect(response.data.user).toHaveProperty('email');
      expect(response.data.user.provider).toBe('google');
    });
  });
  
  describe('Password Reset', () => {
    test('비밀번호 재설정 이메일 발송', async () => {
      const email = 'reset@example.com';
      const response = await requestPasswordReset(email);
      
      expect(response.status).toBe(200);
      
      // 이메일 발송 확인
      const sentEmails = await getTestEmails();
      expect(sentEmails).toContainEqual(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('비밀번호 재설정')
        })
      );
    });
    
    test('비밀번호 재설정 토큰 검증', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'NewSecure123!';
      
      const response = await resetPassword(resetToken, newPassword);
      expect(response.status).toBe(200);
      
      // 새 비밀번호로 로그인 확인
      const loginResponse = await login({
        email: 'reset@example.com',
        password: newPassword
      });
      expect(loginResponse.status).toBe(200);
    });
  });
});
```

### 4.3 E2E 테스트

```typescript
test.describe('Authentication E2E Journey', () => {
  test('완전한 회원가입 및 이메일 인증 flow', async ({ page }) => {
    // 1. 회원가입 페이지 이동
    await page.goto('/signup');
    
    // 2. 회원가입 폼 작성
    await page.fill('[name="name"]', '테스트 사용자');
    await page.fill('[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    
    // 3. 약관 동의
    await page.check('[name="termsAccepted"]');
    await page.check('[name="privacyAccepted"]');
    
    // 4. 회원가입 제출
    await page.click('button:has-text("회원가입")');
    
    // 5. 이메일 인증 안내 확인
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('.verification-message')).toContainText('이메일을 확인해주세요');
    
    // 6. 이메일 인증 시뮬레이션 (테스트 환경)
    const verificationLink = await getTestVerificationLink();
    await page.goto(verificationLink);
    
    // 7. 인증 완료 및 로그인 페이지 이동
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.success-message')).toContainText('인증이 완료되었습니다');
    
    // 8. 로그인
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("로그인")');
    
    // 9. 대시보드 진입 확인
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-name')).toContainText('테스트 사용자');
  });
  
  test('2단계 인증 (2FA) flow', async ({ page }) => {
    // 1. 2FA가 활성화된 계정으로 로그인 시도
    await page.goto('/login');
    await page.fill('[name="email"]', '2fa@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("로그인")');
    
    // 2. 2FA 코드 입력 페이지로 리디렉션
    await expect(page).toHaveURL('/auth/2fa');
    
    // 3. 잘못된 코드 입력
    await page.fill('[name="code"]', '000000');
    await page.click('button:has-text("확인")');
    await expect(page.locator('.error')).toContainText('잘못된 코드');
    
    // 4. 올바른 코드 입력
    const validCode = await getTest2FACode('2fa@example.com');
    await page.fill('[name="code"]', validCode);
    await page.click('button:has-text("확인")');
    
    // 5. 성공적인 로그인
    await expect(page).toHaveURL('/dashboard');
  });
});
```

---

## 5. 프로젝트 관리

### 5.1 단위 테스트

```typescript
describe('Project Management Unit Tests', () => {
  describe('Project Validation', () => {
    test('프로젝트 데이터 검증', () => {
      const validProject = {
        title: '신규 프로젝트',
        description: '프로젝트 설명',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        budget: 5000000
      };
      
      expect(validateProject(validProject)).toBe(true);
    });
    
    test('날짜 유효성 검증', () => {
      const invalidProject = {
        title: '프로젝트',
        startDate: '2025-03-31',
        endDate: '2025-01-01' // 종료일이 시작일보다 이전
      };
      
      const result = validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });
  });
  
  describe('Gantt Chart Logic', () => {
    test('작업 의존성 계산', () => {
      const tasks = [
        { id: '1', duration: 5, dependencies: [] },
        { id: '2', duration: 3, dependencies: ['1'] },
        { id: '3', duration: 2, dependencies: ['1', '2'] }
      ];
      
      const schedule = calculateSchedule(tasks);
      expect(schedule['1'].start).toBe(0);
      expect(schedule['2'].start).toBe(5);
      expect(schedule['3'].start).toBe(8);
    });
    
    test('Critical Path 계산', () => {
      const tasks = createTestTasks();
      const criticalPath = findCriticalPath(tasks);
      
      expect(criticalPath).toEqual(['task-1', 'task-3', 'task-5']);
      expect(getTotalDuration(criticalPath)).toBe(15);
    });
  });
});
```

---

## 6. 테스트 실행 명령어

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 특정 기능 테스트
npm run test:unit -- --grep "Guest Feedback"
npm run test:e2e -- --grep "AI Planning"

# 커버리지 포함
npm run test:coverage

# Watch 모드
npm run test:watch
```

---

## 7. 테스트 데이터 관리

### 7.1 Fixture 구조

```typescript
// fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin'
  },
  editor: {
    email: 'editor@test.com',
    password: 'Editor123!',
    role: 'editor'
  },
  client: {
    email: 'client@test.com',
    password: 'Client123!',
    role: 'client'
  }
};

// fixtures/projects.ts
export const testProjects = {
  active: {
    id: 'project-active',
    title: '진행 중인 프로젝트',
    status: 'active',
    progress: 65
  },
  completed: {
    id: 'project-completed',
    title: '완료된 프로젝트',
    status: 'completed',
    progress: 100
  }
};
```

### 7.2 Mock Service Worker 설정

```typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'correct') {
      return res(
        ctx.status(200),
        ctx.json({
          accessToken: 'mock-token',
          user: { id: '123', email }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),
  
  rest.post('/api/feedback', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'feedback-123',
        ...req.body,
        createdAt: new Date().toISOString()
      })
    );
  })
];
```

---

## 8. 테스트 Best Practices

### 8.1 테스트 작성 원칙

1. **AAA 패턴**: Arrange, Act, Assert
2. **단일 책임**: 하나의 테스트는 하나의 시나리오만
3. **명확한 네이밍**: 테스트가 무엇을 검증하는지 명확히
4. **독립성**: 테스트 간 의존성 없음
5. **결정론적**: 항상 같은 결과

### 8.2 E2E 테스트 팁

```typescript
// Page Object Pattern 사용
class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button:has-text("로그인")');
  }
  
  async expectError(message: string) {
    await expect(this.page.locator('.error')).toContainText(message);
  }
}

// 테스트에서 사용
test('로그인 실패', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('wrong@email.com', 'wrong');
  await loginPage.expectError('Invalid credentials');
});
```

---

**문서 버전**: 1.0  
**작성자**: Grace (QA Lead)  
**최종 수정일**: 2025-08-23