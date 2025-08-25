# VideoPlanet E2E 테스트 자동화 문서

## 목차
1. [개요](#개요)
2. [테스트 아키텍처](#테스트-아키텍처)
3. [테스트 스위트](#테스트-스위트)
4. [실행 가이드](#실행-가이드)
5. [CI/CD 통합](#cicd-통합)
6. [테스트 작성 가이드](#테스트-작성-가이드)
7. [트러블슈팅](#트러블슈팅)
8. [성능 메트릭](#성능-메트릭)

## 개요

VideoPlanet E2E 테스트 자동화 시스템은 Playwright 기반으로 구축되어 있으며, 핵심 사용자 플로우, 접근성, 성능을 포괄적으로 검증합니다.

### 주요 특징
- ✅ **크로스 브라우저 테스팅**: Chromium, Firefox, WebKit 지원
- ✅ **병렬 실행**: 4개 샤드로 분할 실행 (CI 환경)
- ✅ **접근성 검증**: WCAG 2.1 Level AA 준수
- ✅ **성능 모니터링**: Lighthouse 통합
- ✅ **실시간 리포팅**: HTML, JSON, JUnit 포맷 지원
- ✅ **시각적 회귀 테스트**: 스크린샷 비교
- ✅ **Mock API 지원**: 백엔드 독립적 테스트

## 테스트 아키텍처

```
test/
├── e2e/                        # E2E 테스트 스위트
│   ├── auth-flow.spec.ts       # 인증 플로우
│   ├── project-management.spec.ts # 프로젝트 관리
│   ├── feedback-comment.spec.ts   # 피드백/코멘트
│   ├── accessibility/          # 접근성 테스트
│   │   └── wcag-compliance.spec.ts
│   ├── fixtures/               # 테스트 데이터
│   │   ├── test-data.ts       # 목업 데이터
│   │   └── sample-video.mp4   # 샘플 파일
│   └── helpers/                # 유틸리티
│       └── test-helpers.ts    # 헬퍼 함수
├── performance/                # 성능 테스트
├── journeys/                   # 사용자 여정 테스트
└── cross-browser/              # 브라우저 호환성
```

## 테스트 스위트

### 1. 인증 플로우 (`auth-flow.spec.ts`)

#### 테스트 커버리지
- ✅ 로그인/로그아웃
- ✅ 회원가입
- ✅ 비밀번호 재설정
- ✅ 세션 관리
- ✅ 권한 기반 접근 제어
- ✅ 보안 기능 (CSRF, XSS, 브루트포스 방어)

#### 주요 시나리오
```typescript
// 성공적인 로그인
test('유효한 자격증명으로 로그인 성공')

// 권한 검증
test('관리자 권한 페이지 접근')
test('일반 사용자 권한 제한')

// 보안 테스트
test('CSRF 토큰 검증')
test('XSS 방어')
```

### 2. 프로젝트 관리 (`project-management.spec.ts`)

#### 테스트 커버리지
- ✅ 프로젝트 CRUD 작업
- ✅ 비디오 업로드/교체
- ✅ 팀원 초대 및 권한 관리
- ✅ 프로젝트 대시보드
- ✅ 내보내기 기능

#### 주요 시나리오
```typescript
// 프로젝트 생성
test('새 프로젝트 생성 - 전체 플로우')

// 팀 관리
test('팀원 초대 및 권한 변경')
test('일괄 초대')

// 프로젝트 관리
test('프로젝트 정보 수정')
test('프로젝트 삭제 플로우')
```

### 3. 피드백 및 코멘트 (`feedback-comment.spec.ts`)

#### 테스트 커버리지
- ✅ 타임스탬프 기반 피드백
- ✅ 스크린샷 캡처 및 주석
- ✅ 코멘트 스레드
- ✅ 감정 반응
- ✅ 실시간 업데이트
- ✅ 필터링 및 검색

#### 주요 시나리오
```typescript
// 피드백 작성
test('타임스탬프 기반 피드백 작성')
test('스크린샷 캡처 및 주석 추가')

// 코멘트 시스템
test('코멘트 작성 및 스레드 답글')
test('감정 반응 추가')

// 실시간 기능
test('실시간 피드백 업데이트')
test('타이핑 인디케이터')
```

### 4. 접근성 테스트 (`wcag-compliance.spec.ts`)

#### WCAG 2.1 준수 항목
- ✅ **Level A**: 필수 접근성 요구사항
  - 대체 텍스트
  - 키보드 접근성
  - 페이지 언어
  - 이름, 역할, 값

- ✅ **Level AA**: 권장 접근성 요구사항
  - 색상 대비 (4.5:1)
  - 텍스트 크기 조정 (200%)
  - 포커스 표시
  - 리플로우

#### 테스트 영역
```typescript
// 키보드 네비게이션
test('Complete keyboard navigation flow')

// 스크린 리더
test('ARIA labels and roles')
test('Heading structure')

// 색상과 대비
test('Color independence')
test('High contrast mode')
```

## 실행 가이드

### 사전 요구사항
```bash
# Node.js 18+ 설치 확인
node --version

# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install --with-deps
```

### 로컬 실행

#### 1. 기본 실행
```bash
# 모든 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅)
npm run test:e2e:ui

# 특정 브라우저에서 실행
npx playwright test --project=firefox-desktop
```

#### 2. 테스트 스위트별 실행
```bash
# 인증 테스트만 실행
./scripts/run-e2e-tests.sh --suite auth

# 프로젝트 관리 테스트
./scripts/run-e2e-tests.sh --suite projects

# 피드백 시스템 테스트
./scripts/run-e2e-tests.sh --suite feedback

# 접근성 테스트
./scripts/run-e2e-tests.sh --suite accessibility
```

#### 3. 브라우저별 실행
```bash
# Chrome에서만 실행
./scripts/run-e2e-tests.sh --browser chromium

# Firefox에서만 실행
./scripts/run-e2e-tests.sh --browser firefox

# 모든 브라우저에서 실행
./scripts/run-e2e-tests.sh --browser all
```

#### 4. 디버깅 모드
```bash
# 헤드리스 모드 비활성화 (브라우저 UI 표시)
./scripts/run-e2e-tests.sh --headed

# 디버그 모드 (단계별 실행)
./scripts/run-e2e-tests.sh --debug

# 스크린샷 업데이트
./scripts/run-e2e-tests.sh --update-snapshots
```

### 성능 테스트
```bash
# Lighthouse 성능 테스트
npm run lighthouse:ci

# Core Web Vitals 테스트
npm run test:performance:core-vitals

# 부하 테스트
npm run test:load:k6
```

### 리포트 생성
```bash
# HTML 리포트 생성 및 열기
npx playwright show-report

# 커버리지 리포트
npm run test:coverage
```

## CI/CD 통합

### GitHub Actions 워크플로우

#### 자동 실행 트리거
- `main`, `develop` 브랜치 push
- Pull Request
- 매일 오전 2시 정기 실행
- 수동 실행 (workflow_dispatch)

#### 워크플로우 단계
1. **Setup**: 환경 설정 및 의존성 설치
2. **Lint & Type Check**: 코드 품질 검사
3. **E2E Tests**: 병렬 테스트 실행 (4개 샤드)
4. **Accessibility Tests**: WCAG 준수 검증
5. **Performance Tests**: Lighthouse 성능 측정
6. **Visual Regression**: 시각적 변경 감지
7. **Report Generation**: 통합 리포트 생성
8. **Notification**: Slack 알림 발송

#### 환경 변수 설정
```yaml
# .github/workflows/e2e-tests.yml
env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.10'
  BASE_URL: 'http://localhost:3000'
  API_URL: 'http://localhost:8000'
```

### 테스트 결과 아티팩트
- 테스트 리포트 (HTML, JSON)
- 실패 스크린샷
- 성능 메트릭
- 접근성 감사 결과

## 테스트 작성 가이드

### 1. 새 테스트 파일 생성
```typescript
// test/e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test';
import { testData } from './fixtures/test-data';
import { TestHelpers } from './helpers/test-helpers';

test.describe('New Feature Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testData.users.member);
  });

  test('should perform expected action', async ({ page }) => {
    // Arrange
    await page.goto('/feature-page');
    
    // Act
    await page.click('[data-testid="action-button"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### 2. 테스트 데이터 추가
```typescript
// test/e2e/fixtures/test-data.ts
export const testData = {
  // 기존 데이터...
  
  newFeature: {
    sampleData: {
      id: 'sample-1',
      name: 'Sample Item',
      value: 100
    }
  }
};
```

### 3. 헬퍼 함수 추가
```typescript
// test/e2e/helpers/test-helpers.ts
export class TestHelpers {
  // 기존 메서드...
  
  async performNewAction(data: any) {
    // 공통 작업 구현
  }
}
```

### 베스트 프랙티스

#### 1. 테스트 ID 사용
```html
<!-- 컴포넌트에 data-testid 추가 -->
<button data-testid="submit-button">Submit</button>
```

#### 2. 명시적 대기
```typescript
// ❌ 나쁜 예
await page.waitForTimeout(5000);

// ✅ 좋은 예
await page.waitForSelector('[data-testid="loaded"]');
await expect(page.locator('[data-testid="content"]')).toBeVisible();
```

#### 3. 테스트 격리
```typescript
test.describe('Feature Tests', () => {
  // 각 테스트는 독립적으로 실행 가능해야 함
  test.beforeEach(async ({ page }) => {
    // 초기 상태 설정
  });

  test.afterEach(async ({ page }) => {
    // 정리 작업
  });
});
```

## 트러블슈팅

### 일반적인 문제 해결

#### 1. 테스트 타임아웃
```typescript
// 개별 테스트 타임아웃 증가
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60초
  // 테스트 코드
});
```

#### 2. 플레이키 테스트
```typescript
// 재시도 설정
test.describe('Flaky Suite', () => {
  test.describe.configure({ retries: 2 });
  // 테스트들
});
```

#### 3. 네트워크 에러
```typescript
// Mock API 사용
await page.route('**/api/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' })
  });
});
```

#### 4. 요소 찾기 실패
```typescript
// 디버깅 도구 사용
await page.pause(); // 실행 일시정지
await page.screenshot({ path: 'debug.png' }); // 스크린샷
console.log(await page.content()); // HTML 출력
```

### 환경별 이슈

#### Docker 환경
```dockerfile
# Dockerfile 예시
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY . .
RUN npm ci
RUN npx playwright install
CMD ["npm", "run", "test:e2e"]
```

#### CI 환경
```yaml
# 메모리 부족 시
- name: Run tests
  run: |
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm run test:e2e
```

## 성능 메트릭

### Core Web Vitals 목표치
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8초
- **TTI (Time to Interactive)**: < 3.5초

### 테스트 실행 시간
- 단위 테스트: < 5분
- E2E 테스트 (단일 브라우저): < 10분
- E2E 테스트 (전체): < 30분
- 성능 테스트: < 5분

### 커버리지 목표
- 핵심 사용자 플로우: 100%
- 전체 기능: > 80%
- 접근성 (WCAG AA): 100%
- 크로스 브라우저: 3개 주요 브라우저

## 유지보수

### 정기 작업
- **일일**: CI 테스트 결과 확인
- **주간**: 플레이키 테스트 수정
- **월간**: 테스트 커버리지 리뷰
- **분기별**: 테스트 전략 업데이트

### 모니터링
- GitHub Actions 대시보드
- 테스트 결과 트렌드
- 성능 메트릭 추이
- 접근성 점수 변화

## 리소스

### 문서
- [Playwright 공식 문서](https://playwright.dev)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse 문서](https://developers.google.com/web/tools/lighthouse)

### 도구
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### 지원
- 이슈 트래커: GitHub Issues
- 팀 채널: #qa-automation
- 문서: Confluence/Wiki

---

**최종 업데이트**: 2025-08-24
**작성자**: Grace (QA Lead)
**버전**: 1.0.0