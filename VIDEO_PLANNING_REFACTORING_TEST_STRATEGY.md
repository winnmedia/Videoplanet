# 영상 기획 메뉴 리팩토링 종합 테스트 전략

> **작성자**: Grace (QA Lead) - Quality Guardian Through Development Pipeline  
> **작성일**: 2025-08-23  
> **기반**: 기존 AI 기획 시스템 테스트 인프라 + 리팩토링 요구사항  
> **품질 목표**: 커버리지 85%, 뮤테이션 스코어 78%, 안정성 95%+

## 📋 목차

1. [리팩토링 개요 및 테스트 전략](#1-리팩토링-개요-및-테스트-전략)
2. [기존 테스트 코드 분석 및 평가](#2-기존-테스트-코드-분석-및-평가)
3. [AI기획/기획서 관리 기능 테스트 매트릭스](#3-ai기획기획서-관리-기능-테스트-매트릭스)
4. [제거 기능 테스트 정리 방안](#4-제거-기능-테스트-정리-방안)
5. [TDD 기반 개발 테스트 우선순위](#5-tdd-기반-개발-테스트-우선순위)
6. [E2E 테스트 시나리오 업데이트](#6-e2e-테스트-시나리오-업데이트)
7. [성능 테스트 요구사항](#7-성능-테스트-요구사항)
8. [접근성 테스트 체크리스트](#8-접근성-테스트-체크리스트)
9. [실행 계획 및 품질 게이트](#9-실행-계획-및-품질-게이트)

---

## 1. 리팩토링 개요 및 테스트 전략

### 1.1 리팩토링 목표

기존 복잡한 영상 기획 시스템을 **AI 중심의 단순화된 워크플로우**로 전환:

```
기존: [모드 선택] → [수동/AI 기획] → [템플릿 기반 작성] → [협업] → [승인]
신규: [AI 기획 입력] → [4단계 생성] → [12숏트 분해] → [콘티 생성] → [PDF 다운로드]
```

### 1.2 테스트 전략 핵심 원칙

1. **기존 Mock 시스템 재활용**: 검증된 LLM/Google API Mock 인프라 유지
2. **점진적 테스트 전환**: 기존 테스트 → 리팩토링 테스트 → 통합 검증
3. **TDD 방식 적용**: 테스트 먼저 작성 → 구현 → 리팩토링 → 재검증
4. **품질 게이트 강화**: DoD 기준을 리팩토링에 맞게 조정

### 1.3 테스트 범위 매핑

| 기능 영역 | 기존 테스트 | 새 테스트 | 전환 방식 |
|-----------|-------------|-----------|----------|
| **AI 기획 워크플로우** | 48개 케이스 | 32개 케이스 | 기존 Mock 재사용 + 단순화 |
| **UI/UX 개선** | 협업 중심 | AI 위저드 중심 | 새로 작성 |
| **성능/접근성** | 기존 유지 | 강화된 기준 | 기준 업데이트 |
| **제거 기능** | 15개 케이스 | 0개 | 정리/아카이브 |

---

## 2. 기존 테스트 코드 분석 및 평가

### 2.1 현재 테스트 자산 현황

#### ✅ 유지할 테스트 (재사용 가능)
```typescript
// 1. Mock 시스템 (100% 재사용)
- test/ai-planning/mock-llm-service.ts       (LLM API 시뮬레이션)
- test/ai-planning/mock-google-images-api.ts (Google Images Mock)
- test/ai-planning/mock-pdf-generator.ts     (PDF 생성 Mock)

// 2. Core 워크플로우 테스트 (80% 재사용)
- AI 4단계 생성 테스트
- 12숏트 분해 테스트  
- 콘티 생성/재생성 테스트
- PDF 다운로드 테스트

// 3. 성능/접근성 테스트 (90% 재사용)
- Core Web Vitals 검증
- WCAG 2.1 AA 준수 테스트
- 키보드 내비게이션 테스트
```

#### 🔄 수정할 테스트 (리팩토링 필요)
```typescript
// 1. UI 테스트 (워크플로우 변경)
- 3단계 위저드로 단순화
- 모드 선택 UI 제거
- 수동 기획 워크플로우 제거

// 2. E2E 시나리오 (사용자 여정 변경)
- 협업 중심 → AI 중심 시나리오
- 승인 프로세스 간소화
- 모바일 UX 최적화
```

#### ❌ 제거할 테스트
```typescript
// 1. 모드 선택 관련 테스트 (12개)
- test/planning-modes/*.spec.ts

// 2. 수동 기획 워크플로우 테스트 (8개)  
- test/manual-planning/*.spec.ts

// 3. 복잡한 템플릿 시스템 테스트 (6개)
- test/template-management/*.spec.ts
```

### 2.2 테스트 품질 평가

| 평가 기준 | 현재 상태 | 목표 상태 | 개선 방안 |
|-----------|-----------|-----------|----------|
| **커버리지** | 78% | 85% | 새 AI 기능 테스트 추가 |
| **뮤테이션 스코어** | 72% | 78% | Edge case 테스트 강화 |
| **실행 시간** | 12분 | 8분 | 불필요한 테스트 제거 |
| **안정성** | 92% | 95% | Flaky test 정리 |

---

## 3. AI기획/기획서 관리 기능 테스트 매트릭스

### 3.1 새로운 테스트 피라미드 구조

```
        E2E (10% - 3개)
      ─────────────────
     /                 \
    /  Integration      \
   /    (25% - 8개)      \
  /                       \
 /                         \
/                           \
───────────────────────────────
      Unit (65% - 21개)
```

### 3.2 Unit Tests (21개) - AI 기획 Core Logic

#### A. 1단계 위저드 (5개 테스트)
```typescript
// test/ai-planning/unit/step1-input.spec.ts
describe('1단계 위저드 입력 검증', () => {
  test('필수 입력 필드 검증', () => {
    // 제목, 한줄스토리, 분량, 포맷 필수 입력 확인
  });
  
  test('톤앤매너 멀티 선택 (최대 3개)', () => {
    // 선택/해제/최대 개수 제한 로직
  });
  
  test('전개 방식별 파라미터 생성', () => {
    // 훅-몰입-반전-떡밥, 클래식, 귀납법, 다큐멘터리 방식
  });
  
  test('전개 강도별 콘텐츠 길이 계산', () => {
    // 그대로(1x), 적당히(1.2x), 풍부하게(1.5x)
  });
  
  test('실시간 입력 완성도 검증', () => {
    // 진행 버튼 활성화/비활성화 로직
  });
});
```

#### B. 2단계 위저드 (6개 테스트)
```typescript
// test/ai-planning/unit/step2-stages.spec.ts
describe('2단계 4단계 생성 및 편집', () => {
  test('LLM 응답 JSON 파싱 및 검증', () => {
    // StoryStage[] 타입 검증, 필수 필드 확인
  });
  
  test('기승전결 4단계 비율 계산', () => {
    // 기(25%), 승(35%), 전(25%), 결(15%)
  });
  
  test('인라인 편집 상태 관리', () => {
    // 편집 모드, 임시 저장, 되돌리기, 초기화
  });
  
  test('단계별 시간 힌트 계산', () => {
    // 총 분량 기반 각 단계별 권장 시간
  });
  
  test('AI 생성 품질 검증', () => {
    // 전개방식/강도 반영도, 톤앤매너 일관성
  });
  
  test('편집 이력 및 버전 관리', () => {
    // 변경사항 추적, 스냅샷 생성
  });
});
```

#### C. 3단계 위저드 (8개 테스트)
```typescript  
// test/ai-planning/unit/step3-shots.spec.ts
describe('3단계 12숏트 분해 및 콘티 생성', () => {
  test('4단계 → 12숏트 분배 알고리즘', () => {
    // 각 단계당 3개씩, ID 자동 증가, 순서 보존
  });
  
  test('템포별 숏트 길이 계산', () => {
    // 빠르게(4-6초), 보통(6-8초), 느리게(8-12초)
  });
  
  test('카메라 워크 자동 할당', () => {
    // 템포/구도별 적절한 카메라 무브먼트
  });
  
  test('Google Images 프롬프트 생성', () => {
    // "storyboard pencil sketch" 스타일 강제
  });
  
  test('콘티 이미지 버전 관리', () => {
    // S01-conti-v1.png 형태, 재생성 시 버전 증가
  });
  
  test('인서트샷 3개 중복 방지', () => {
    // 정보보강, 리듬조절, 관계강조 각 1개씩
  });
  
  test('프레이밍 자동 할당', () => {
    // Close-up, Medium, Two Shot 등 적절한 분배
  });
  
  test('콘티 이미지 품질 검증', () => {
    // 이미지 URL 유효성, 압축률, 해상도 확인
  });
});
```

#### D. PDF 생성 및 에러 처리 (2개 테스트)
```typescript
// test/ai-planning/unit/pdf-export.spec.ts  
describe('PDF 기획안 생성', () => {
  test('JSON → PDF 변환 로직', () => {
    // 메타데이터→표지, 4단계→개요, 12숏트→카드형
  });
  
  test('여백 0 레이아웃 검증', () => {
    // A4 가로, 여백 0, 최소 폰트 크기 확보
  });
});
```

### 3.3 Integration Tests (8개) - 시스템 통합

#### A. AI-UI 통합 (4개)
```typescript
// test/ai-planning/integration/ai-ui-flow.spec.ts
describe('AI-UI 통합 플로우', () => {
  test('LLM API → Redux Store → UI 업데이트', () => {
    // 전체 데이터 플로우 검증
  });
  
  test('Google API → 이미지 표시 → 다운로드', () => {
    // 콘티 생성 전체 플로우
  });
  
  test('실시간 검증 시스템', () => {
    // 입력 중 검증, 에러 메시지, 진행 상태
  });
  
  test('자동저장 및 복구 시스템', () => {
    // 단계 전환 시 저장, 페이지 새로고침 복구
  });
});
```

#### B. 에러 처리 및 성능 (4개)
```typescript
// test/ai-planning/integration/error-performance.spec.ts
describe('에러 처리 및 성능 최적화', () => {
  test('API 에러 통합 처리', () => {
    // LLM/Google API 에러 → 재시도 → UI 피드백
  });
  
  test('대용량 데이터 처리', () => {
    // 12개 숏트 동시 생성, 메모리 사용량
  });
  
  test('캐싱 시스템', () => {
    // API 응답 캐싱, 히트율 최적화
  });
  
  test('보안 검증', () => {
    // API 키 보안, 악성 입력 필터링
  });
});
```

### 3.4 E2E Tests (3개) - 사용자 여정

```typescript
// test/ai-planning/e2e/complete-workflow.spec.ts
describe('AI 영상 기획 완전한 사용자 여정', () => {
  test('입력→생성→편집→다운로드 전체 워크플로우', () => {
    // 3분 이내 완전한 기획안 생성 달성
  });
  
  test('크로스브라우저 호환성', () => {
    // Chrome/Firefox/Safari 동일한 UX
  });
  
  test('모바일 반응형 테스트', () => {
    // 터치 UX, 스와이프 네비게이션
  });
});
```

---

## 4. 제거 기능 테스트 정리 방안

### 4.1 제거 대상 기능 및 테스트

#### A. 모드 선택 시스템
```bash
# 아카이브할 테스트 파일들
test/planning-modes/
├── mode-selection.spec.ts          # 수동/AI 모드 선택
├── mode-switching.spec.ts          # 모드 전환 로직  
├── mode-permissions.spec.ts        # 모드별 권한 관리
└── mode-ui-states.spec.ts         # 모드별 UI 상태

# 정리 방안
1. 아카이브 디렉토리로 이동: test/archived/planning-modes/
2. 실행에서 제외: jest.config.js에서 경로 exclude
3. 문서화: REMOVED_FEATURES.md에 제거 이유와 시점 기록
```

#### B. 수동 기획 워크플로우
```bash
# 아카이브할 테스트 파일들  
test/manual-planning/
├── template-selection.spec.ts      # 템플릿 선택
├── manual-editing.spec.ts          # 수동 편집 기능
├── collaboration-workflow.spec.ts   # 협업 워크플로우
└── approval-process.spec.ts        # 승인 프로세스

# 의존성 정리
1. Mock 데이터: test/fixtures/manual-planning/ → archived/
2. Helper 함수: test/utils/manual-planning-utils.ts → 제거
3. 테스트 설정: test-setup.ts에서 관련 설정 정리
```

### 4.2 안전한 제거 프로세스

```bash
# 1단계: 테스트 실행 확인 (제거 전)
npm run test:planning -- --verbose
npm run test:coverage -- --threshold-check

# 2단계: 아카이브 디렉토리 생성
mkdir -p test/archived/{planning-modes,manual-planning,templates}

# 3단계: 점진적 이동 (Git 히스토리 보존)
git mv test/planning-modes/ test/archived/
git mv test/manual-planning/ test/archived/

# 4단계: 설정 파일 업데이트
# jest.config.js에서 archived 경로 exclude
# package.json 스크립트에서 관련 명령어 정리

# 5단계: 최종 확인
npm run test:planning  # 남은 테스트만 실행 확인
npm run build         # 빌드 에러 없음 확인
```

### 4.3 제거 기능 문서화

```markdown
# test/archived/REMOVAL_LOG.md

## 제거된 기능 및 테스트 목록 (2025-08-23)

### 1. 모드 선택 시스템
- **제거 이유**: AI 중심 워크플로우로 단순화
- **영향 범위**: planning-modes/ (12개 테스트)
- **대체 방안**: AI 기획으로 통합

### 2. 수동 기획 워크플로우  
- **제거 이유**: 사용률 저조, 복잡성 증가
- **영향 범위**: manual-planning/ (8개 테스트)
- **대체 방안**: AI 생성 후 편집으로 대체

### 3. 복잡한 템플릿 시스템
- **제거 이유**: AI가 자동 생성하므로 불필요
- **영향 범위**: template-management/ (6개 테스트)  
- **대체 방안**: AI 프롬프트 기반 생성
```

---

## 5. TDD 기반 개발 테스트 우선순위

### 5.1 TDD 개발 순서

#### Phase 1: Core AI 워크플로우 (1주)
```typescript
// 우선순위 1: 필수 기능 테스트 먼저 작성
1. 입력 검증 로직 테스트 (RED)
2. AI API 호출 Mock 테스트 (RED)  
3. 응답 파싱 테스트 (RED)
4. 최소 구현 (GREEN)
5. 리팩토링 (REFACTOR)
```

#### Phase 2: UI 통합 테스트 (1주)
```typescript
// 우선순위 2: 사용자 인터랙션
1. 위저드 전환 테스트 (RED)
2. 실시간 검증 테스트 (RED)
3. 로딩 상태 테스트 (RED)  
4. UI 컴포넌트 구현 (GREEN)
5. UX 개선 (REFACTOR)
```

#### Phase 3: 고급 기능 (1주)
```typescript
// 우선순위 3: 콘티 생성, PDF 다운로드
1. 이미지 생성 테스트 (RED)
2. PDF 변환 테스트 (RED)
3. 에러 처리 테스트 (RED)
4. 고급 기능 구현 (GREEN)
5. 성능 최적화 (REFACTOR)
```

### 5.2 TDD 테스트 작성 가이드

```typescript
// TDD 테스트 템플릿
describe('[Feature] - TDD Red-Green-Refactor', () => {
  // RED: 실패하는 테스트 먼저 작성
  test('should fail initially - business logic not implemented', () => {
    const result = newFeatureFunction(input);
    expect(result).toEqual(expectedOutput); // 실패!
  });
  
  // GREEN: 최소한의 구현으로 테스트 통과
  test('should pass with minimal implementation', () => {
    // 최소 구현 후 통과 확인
  });
  
  // REFACTOR: 코드 개선 (테스트는 그대로)
  test('should maintain behavior after refactoring', () => {
    // 리팩토링 후에도 동일한 결과
  });
});
```

### 5.3 TDD 품질 체크포인트

| 단계 | 체크포인트 | 기준 | 도구 |
|------|------------|------|------|
| **RED** | 테스트 실패 확인 | 100% 실패 | Jest |
| **GREEN** | 최소 구현 완료 | 테스트 통과 | Jest + Coverage |
| **REFACTOR** | 코드 품질 개선 | 복잡도 < 10 | ESLint + SonarQube |
| **COMMIT** | 변경사항 검증 | 모든 테스트 통과 | CI Pipeline |

---

## 6. E2E 테스트 시나리오 업데이트

### 6.1 새로운 주요 사용자 여정

#### A. AI 중심 기획 시나리오 (핵심)
```gherkin
Feature: AI 영상 기획 완전한 워크플로우
  As a 영상 기획자
  I want to AI로 빠르게 기획안을 생성하고
  So that 3분 이내에 완전한 기획서를 얻을 수 있다

Scenario: 성공적인 AI 기획안 생성
  Given 사용자가 AI 기획 페이지에 접속했을 때
  When 1단계에서 "브랜드 홍보 영상", "혁신적인 제품 소개" 입력하고
  And 톤앤매너 "전문적", "친근함" 선택하고
  And 분량 "60초", 포맷 "세로형" 선택하고
  And "생성" 버튼을 클릭하면
  Then 4단계 스토리가 "기승전결" 순으로 생성된다
  
  When 2단계에서 첫 번째 단계를 "더 임팩트 있는 오프닝"으로 편집하고
  And "12숏트 생성" 버튼을 클릭하면
  Then 정확히 12개 숏트가 각 단계별로 3개씩 생성된다
  
  When 3단계에서 첫 3개 숏트의 콘티를 생성하고
  And "기획안 PDF 다운로드" 버튼을 클릭하면
  Then 여백 0 레이아웃의 PDF 파일이 다운로드된다
  And 전체 프로세스가 3분 이내에 완료된다
```

#### B. 모바일 최적화 시나리오
```gherkin
Scenario: 모바일에서 AI 기획 작업
  Given 사용자가 모바일 디바이스를 사용하고
  When AI 기획 페이지에 접속하면
  Then 터치 친화적인 UI가 표시된다
  
  When 3단계 위저드를 터치로 진행하면
  Then 각 단계가 스와이프 네비게이션으로 전환된다
  And 터치 대상 크기가 최소 44px 이상이다
  And 세로 스크롤로 모든 콘텐츠에 접근 가능하다
```

#### C. 에러 복구 시나리오  
```gherkin
Scenario: AI API 실패 시 사용자 경험
  Given AI 기획 진행 중 LLM API가 실패했을 때
  When 재시도 알림이 표시되면
  Then 사용자는 "재시도" 또는 "임시저장" 선택 가능하다
  And 재시도 횟수가 "2/3" 형태로 표시된다
  
  When 최종 실패 후에는
  Then 부분 완성 데이터가 자동 저장되고
  And 고객 지원팀 연결 옵션이 제공된다
```

### 6.2 E2E 테스트 구현

```typescript
// test/e2e/ai-planning-complete-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI 영상 기획 리팩토링 E2E', () => {
  test('완전한 AI 기획 워크플로우 - 3분 이내 완성', async ({ page }) => {
    const startTime = Date.now();
    
    // 1단계: 스토리 입력
    await page.goto('/ai-planning');
    await page.fill('[data-testid="story-title"]', '브랜드 홍보 영상');
    await page.fill('[data-testid="story-oneliner"]', '혁신적인 제품의 놀라운 기능을 소개하는 임팩트 있는 영상');
    
    // 톤앤매너 멀티 선택
    await page.click('[data-testid="tone-professional"]');
    await page.click('[data-testid="tone-friendly"]');
    
    // 메타데이터 설정
    await page.selectOption('[data-testid="duration"]', '60');
    await page.selectOption('[data-testid="format"]', 'vertical');
    await page.selectOption('[data-testid="development-method"]', 'hook-immersion');
    
    await page.click('[data-testid="generate-stages"]');
    
    // 2단계: 4단계 검토 (Mock 응답 대기)
    await page.waitForSelector('[data-testid="stage-cards"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="stage-card"]')).toHaveCount(4);
    
    // 첫 번째 단계 편집
    await page.click('[data-testid="stage-1-edit"]');
    await page.fill('[data-testid="stage-1-title"]', '더 임팩트 있는 오프닝');
    await page.click('[data-testid="stage-1-save"]');
    
    await page.click('[data-testid="generate-shots"]');
    
    // 3단계: 12숏트 생성 및 콘티
    await page.waitForSelector('[data-testid="shot-cards"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="shot-card"]')).toHaveCount(12);
    
    // 첫 3개 숏트의 콘티 생성
    for (let i = 0; i < 3; i++) {
      await page.click(`[data-testid="shot-${i+1}-generate-conti"]`);
      await page.waitForSelector(`[data-testid="shot-${i+1}-conti-image"]`, { timeout: 8000 });
    }
    
    // PDF 다운로드
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-pdf"]');
    const download = await downloadPromise;
    
    const totalTime = Date.now() - startTime;
    
    // 성능 검증
    expect(totalTime).toBeLessThan(180000); // 3분 이내
    expect(download.suggestedFilename()).toMatch(/.*기획안.*\.pdf$/);
  });
  
  test('모바일 반응형 AI 기획 테스트', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/ai-planning');
    
    // 터치 친화적 UI 확인
    const inputField = page.locator('[data-testid="story-title"]');
    const fieldSize = await inputField.boundingBox();
    expect(fieldSize.height).toBeGreaterThanOrEqual(44); // iOS 권장 최소 크기
    
    // 스와이프 네비게이션 테스트
    await page.touchscreen.tap(200, 400);
    await page.touchscreen.tap(350, 400); // 우측 스와이프
    
    // 다음 단계로 전환되는지 확인
    await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2/3');
  });
});
```

### 6.3 성능 기준선 설정

| 메트릭 | 기존 기준 | 새 기준 | 측정 방법 |
|--------|-----------|---------|----------|
| **전체 워크플로우** | 5분 | 3분 | E2E 측정 |
| **1단계 입력 완료** | 30초 | 15초 | 타임스탬프 |
| **AI 4단계 생성** | 10초 | 8초 | LLM Mock 응답 |
| **12숏트 생성** | 15초 | 12초 | 병렬 처리 |
| **콘티 3개 생성** | 20초 | 15초 | Google API Mock |
| **PDF 다운로드** | 8초 | 6초 | 서버 렌더링 |

---

## 7. 성능 테스트 요구사항 (Core Web Vitals)

### 7.1 업데이트된 성능 기준

#### A. Core Web Vitals 강화
```typescript
// test/performance/core-web-vitals-enhanced.spec.ts
describe('AI 기획 시스템 성능 기준', () => {
  test('LCP (Largest Contentful Paint) < 2.0초', async ({ page }) => {
    const metrics = await measureWebVitals(page);
    expect(metrics.LCP).toBeLessThan(2000); // 기존 2.5초 → 2.0초
  });
  
  test('FID (First Input Delay) < 80ms', async ({ page }) => {
    const metrics = await measureWebVitals(page);  
    expect(metrics.FID).toBeLessThan(80); // 기존 100ms → 80ms
  });
  
  test('CLS (Cumulative Layout Shift) < 0.08', async ({ page }) => {
    const metrics = await measureWebVitals(page);
    expect(metrics.CLS).toBeLessThan(0.08); // 기존 0.1 → 0.08
  });
  
  test('AI API 응답 시간 < 8초', async ({ page }) => {
    const startTime = Date.now();
    await triggerAIGeneration(page);
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(8000); // 기존 10초 → 8초
  });
});
```

#### B. 사용자 체감 성능
```typescript
// test/performance/user-experience-metrics.spec.ts
describe('사용자 체감 성능', () => {
  test('위저드 단계 전환 < 200ms', async ({ page }) => {
    const transitionTime = await measureStepTransition(page);
    expect(transitionTime).toBeLessThan(200);
  });
  
  test('인라인 편집 반응 < 50ms', async ({ page }) => {
    const editResponseTime = await measureEditResponse(page);
    expect(editResponseTime).toBeLessThan(50);
  });
  
  test('스크롤 성능 60fps 유지', async ({ page }) => {
    const frameRate = await measureScrollPerformance(page);
    expect(frameRate).toBeGreaterThanOrEqual(55); // 60fps 목표, 55fps 허용
  });
  
  test('메모리 사용량 < 150MB', async ({ page }) => {
    const memoryUsage = await measureMemoryUsage(page);
    expect(memoryUsage).toBeLessThan(150 * 1024 * 1024); // 150MB
  });
});
```

### 7.2 성능 모니터링 자동화

```typescript
// test/performance/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  async startMonitoring(page: Page) {
    // Real User Monitoring 시뮬레이션
    await page.addInitScript(() => {
      // Web Vitals 수집
      window.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            window.__LCP = entry.startTime;
          }
        });
      });
      window.performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }
  
  async measureAIWorkflow(page: Page): Promise<WorkflowMetrics> {
    const metrics: WorkflowMetrics = {
      stepTransitions: [],
      aiResponses: [],
      memoryUsage: [],
      userInteractions: []
    };
    
    // 단계별 성능 측정
    for (let step = 1; step <= 3; step++) {
      const stepStart = Date.now();
      await this.waitForStepComplete(page, step);
      const stepDuration = Date.now() - stepStart;
      
      metrics.stepTransitions.push({
        step,
        duration: stepDuration,
        timestamp: new Date().toISOString()
      });
    }
    
    return metrics;
  }
  
  async generateReport(): Promise<PerformanceReport> {
    return {
      overallScore: this.calculatePerformanceScore(),
      recommendations: this.generateRecommendations(),
      trendAnalysis: this.analyzeTrends(),
      alerts: this.checkThresholds()
    };
  }
}
```

### 7.3 성능 회귀 방지

```yaml
# .github/workflows/performance-regression.yml
name: Performance Regression Test
on:
  pull_request:
    paths: ['src/app/ai-planning/**', 'src/features/planning/**']

jobs:
  performance-check:
    runs-on: ubuntu-latest
    steps:
      - name: Performance Baseline
        run: |
          npm run test:performance:baseline
          npm run lighthouse -- --budget-path=lighthouse-budget.json
      
      - name: Compare with Previous
        run: |
          npm run test:performance:compare
          # 10% 이상 성능 저하 시 PR 차단
          if [ "$PERFORMANCE_REGRESSION" -gt 10 ]; then
            echo "Performance regression detected: ${PERFORMANCE_REGRESSION}%"
            exit 1
          fi
```

---

## 8. 접근성 테스트 체크리스트 업데이트

### 8.1 WCAG 2.1 AA 준수 강화

#### A. 키보드 접근성 (Level AA)
```typescript
// test/accessibility/keyboard-navigation.spec.ts
describe('AI 기획 키보드 접근성', () => {
  test('Tab 순서로 모든 인터랙티브 요소 접근', async ({ page }) => {
    await page.goto('/ai-planning');
    
    const interactiveElements = [
      '[data-testid="story-title"]',
      '[data-testid="story-oneliner"]', 
      '[data-testid="tone-professional"]',
      '[data-testid="tone-friendly"]',
      '[data-testid="generate-stages"]'
    ];
    
    for (let i = 0; i < interactiveElements.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe(interactiveElements[i].replace('[data-testid="', '').replace('"]', ''));
    }
  });
  
  test('Enter/Space로 버튼 활성화', async ({ page }) => {
    await page.goto('/ai-planning');
    await page.focus('[data-testid="generate-stages"]');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });
  
  test('Esc로 모달 닫기', async ({ page }) => {
    await page.goto('/ai-planning');
    await page.click('[data-testid="help-button"]');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
  });
});
```

#### B. 스크린 리더 호환성
```typescript
// test/accessibility/screen-reader.spec.ts
describe('스크린 리더 호환성', () => {
  test('ARIA 레이블 적절히 설정', async ({ page }) => {
    await page.goto('/ai-planning');
    
    // 필수 입력 필드
    await expect(page.locator('[data-testid="story-title"]')).toHaveAttribute('aria-label', '영상 제목 (필수)');
    await expect(page.locator('[data-testid="story-oneliner"]')).toHaveAttribute('aria-label', '한 줄 스토리 (필수)');
    
    // 진행 상태
    const progressBar = page.locator('[data-testid="wizard-progress"]');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '3');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressBar).toHaveAttribute('aria-label', '3단계 중 1단계 진행 중');
    
    // 생성 버튼
    const generateBtn = page.locator('[data-testid="generate-stages"]');
    await expect(generateBtn).toHaveAttribute('aria-describedby', 'generate-help-text');
    await expect(page.locator('#generate-help-text')).toContainText('AI가 입력한 정보를 바탕으로 4단계 스토리를 생성합니다');
  });
  
  test('동적 콘텐츠 안내', async ({ page }) => {
    await page.goto('/ai-planning');
    
    // AI 생성 시작 안내
    await page.click('[data-testid="generate-stages"]');
    const liveRegion = page.locator('[data-testid="live-announcements"]');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await expect(liveRegion).toContainText('AI가 4단계 스토리를 생성하고 있습니다');
    
    // 생성 완료 안내  
    await page.waitForSelector('[data-testid="stage-cards"]');
    await expect(liveRegion).toContainText('4단계 스토리 생성이 완료되었습니다');
  });
  
  test('에러 메시지 접근성', async ({ page }) => {
    await page.goto('/ai-planning');
    
    // 필수 필드 에러
    await page.click('[data-testid="generate-stages"]'); // 제목 없이 진행
    
    const errorMessage = page.locator('[data-testid="title-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toContainText('영상 제목을 입력해주세요');
    
    // 에러 필드 포커스
    const titleField = page.locator('[data-testid="story-title"]');
    await expect(titleField).toHaveAttribute('aria-invalid', 'true');
    await expect(titleField).toHaveAttribute('aria-describedby', 'title-error');
  });
});
```

#### C. 색상 및 시각적 접근성
```typescript
// test/accessibility/visual-accessibility.spec.ts
describe('시각적 접근성', () => {
  test('색상 대비 4.5:1 이상', async ({ page }) => {
    await page.goto('/ai-planning');
    
    // 주요 텍스트 대비 확인
    const titleField = page.locator('[data-testid="story-title"]');
    const computedStyles = await titleField.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    const contrastRatio = calculateContrastRatio(computedStyles.color, computedStyles.backgroundColor);
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
  
  test('고대비 모드 지원', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/ai-planning');
    
    // 핵심 UI 요소들이 여전히 보이는지 확인
    await expect(page.locator('[data-testid="generate-stages"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    
    // 텍스트 가독성 확인
    const buttonText = page.locator('[data-testid="generate-stages"]');
    const isVisible = await buttonText.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.opacity !== '0' && styles.visibility !== 'hidden';
    });
    expect(isVisible).toBe(true);
  });
  
  test('애니메이션 줄이기 모드', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/ai-planning');
    
    // 애니메이션 비활성화 확인
    await page.click('[data-testid="generate-stages"]');
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    
    const animationDuration = await loadingSpinner.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration;
    });
    expect(animationDuration).toBe('0s'); // 애니메이션 없음
  });
});
```

### 8.2 접근성 자동 검증

```typescript
// test/accessibility/axe-automation.spec.ts
import { injectAxe, checkA11y } from 'axe-playwright';

describe('자동 접근성 검증', () => {
  test('전체 페이지 WCAG 2.1 AA 검증', async ({ page }) => {
    await page.goto('/ai-planning');
    await injectAxe(page);
    
    // 접근성 규칙 설정
    await checkA11y(page, null, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
  
  test('동적 콘텐츠 접근성 검증', async ({ page }) => {
    await page.goto('/ai-planning');
    await injectAxe(page);
    
    // AI 생성 후 검증
    await page.fill('[data-testid="story-title"]', '테스트 영상');
    await page.click('[data-testid="generate-stages"]');
    await page.waitForSelector('[data-testid="stage-cards"]');
    
    // 새로 생성된 콘텐츠 접근성 확인
    await checkA11y(page, '[data-testid="stage-cards"]', {
      axeOptions: {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true }
        }
      }
    });
  });
});
```

### 8.3 접근성 개선 모니터링

```typescript
// test/accessibility/accessibility-monitor.ts
export class AccessibilityMonitor {
  private violations: A11yViolation[] = [];
  
  async runFullAudit(page: Page): Promise<AccessibilityReport> {
    const report: AccessibilityReport = {
      overallScore: 0,
      violations: [],
      improvements: [],
      wcagLevel: 'AA'
    };
    
    // 자동 검사 실행
    await injectAxe(page);
    const results = await page.evaluate(() => axe.run());
    
    report.violations = results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      nodes: violation.nodes.length
    }));
    
    // 점수 계산 (100점 만점)
    const criticalViolations = report.violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = report.violations.filter(v => v.impact === 'serious').length;
    
    report.overallScore = Math.max(0, 100 - (criticalViolations * 20) - (seriousViolations * 10));
    
    return report;
  }
  
  generateImprovements(violations: A11yViolation[]): AccessibilityImprovement[] {
    return violations.map(violation => {
      switch (violation.id) {
        case 'color-contrast':
          return {
            priority: 'high',
            action: 'Increase color contrast to at least 4.5:1',
            code: 'Update CSS color values'
          };
        case 'aria-labels':
          return {
            priority: 'medium',
            action: 'Add descriptive aria-label attributes',
            code: 'aria-label="Description of element purpose"'
          };
        default:
          return {
            priority: 'low',
            action: `Fix ${violation.id}`,
            code: violation.help
          };
      }
    });
  }
}
```

---

## 9. 실행 계획 및 품질 게이트

### 9.1 테스트 실행 단계별 계획

#### Phase 1: 기존 테스트 정리 (1주)
```bash
# 1일차: 제거할 테스트 아카이빙
git mv test/planning-modes/ test/archived/
git mv test/manual-planning/ test/archived/
git mv test/templates/ test/archived/

# 2일차: Mock 시스템 검증
npm run test:mocks:verify
npm run test:ai-planning:unit -- --coverage

# 3일차: 기존 E2E 테스트 실행 상태 확인
npm run test:e2e:video-planning
npm run test:e2e:ai-planning -- --reporter=html

# 4-5일차: 테스트 설정 및 CI 파이프라인 업데이트
```

#### Phase 2: 새로운 테스트 구현 (2주)  
```bash
# 1주차: Unit + Integration Tests
Day 1-2: AI 워크플로우 Unit 테스트 (21개)
Day 3-4: UI 통합 테스트 (8개)
Day 5:   Mock 서비스 업데이트

# 2주차: E2E + 성능 + 접근성
Day 1-2: E2E 시나리오 구현 (3개)
Day 3:   성능 테스트 구현
Day 4:   접근성 테스트 강화
Day 5:   통합 검증 및 리포트
```

#### Phase 3: 품질 게이트 통합 (1주)
```bash
# CI/CD 파이프라인 업데이트
Day 1-2: GitHub Actions 워크플로우 업데이트
Day 3:   품질 게이트 기준 적용
Day 4:   성능 회귀 방지 시스템
Day 5:   문서화 및 팀 교육
```

### 9.2 품질 게이트 기준

#### A. Code Quality Gates
```yaml
# quality-gates.yml
quality_standards:
  unit_tests:
    coverage: 85%           # 기존 78% → 85%
    mutation_score: 78%     # 목표 유지
    max_execution_time: 120s # 2분 이내
    
  integration_tests:  
    coverage: 75%
    max_execution_time: 300s # 5분 이내
    
  e2e_tests:
    success_rate: 95%       # 안정성 목표
    max_execution_time: 480s # 8분 이내
    
  performance:
    lcp: 2000ms            # < 2초
    fid: 80ms              # < 80ms  
    cls: 0.08              # < 0.08
    workflow_time: 180s     # < 3분
    
  accessibility:
    wcag_level: AA
    axe_score: 90          # 90점 이상
    contrast_ratio: 4.5    # 4.5:1 이상
```

#### B. DoD (Definition of Done) 업데이트
```typescript
// test/quality-gates/dod-validator.ts
export class DoDValidator {
  private readonly criteria = [
    {
      id: 'DOD-001',
      name: 'AI 4단계 생성 품질',
      category: 'AI Quality',
      priority: 'Critical',
      validator: (result: AIGenerationResult) => {
        return result.stages.length === 4 && 
               result.coherenceScore >= 0.85 &&
               result.toneConsistency >= 0.8;
      }
    },
    {
      id: 'DOD-002', 
      name: '12개 숏트 정확 생성',
      category: 'Functional',
      priority: 'Critical',
      validator: (result: ShotGenerationResult) => {
        return result.shots.length === 12 &&
               result.shots.every((shot, idx) => shot.id === idx + 1) &&
               this.validateShotDistribution(result.shots);
      }
    },
    {
      id: 'DOD-003',
      name: '3분 이내 완전한 워크플로우',
      category: 'Performance', 
      priority: 'High',
      validator: (metrics: WorkflowMetrics) => {
        return metrics.totalTime < 180000 &&
               metrics.stepTransitions.every(t => t.duration < 30000);
      }
    }
    // ... 총 8개 기준
  ];
  
  async validateRelease(testResults: TestResults): Promise<DoDReport> {
    const report: DoDReport = {
      overallStatus: 'PENDING',
      overallScore: 0,
      criteriaResults: [],
      blockers: [],
      warnings: []
    };
    
    for (const criterion of this.criteria) {
      const result = await this.runCriterion(criterion, testResults);
      report.criteriaResults.push(result);
      
      if (!result.passed && criterion.priority === 'Critical') {
        report.blockers.push(criterion.name);
      }
    }
    
    const passedCriteria = report.criteriaResults.filter(r => r.passed).length;
    report.overallScore = (passedCriteria / this.criteria.length) * 100;
    
    // 배포 가능 여부 결정
    const criticalPassed = report.criteriaResults
      .filter(r => r.criterion.priority === 'Critical')
      .every(r => r.passed);
      
    if (criticalPassed && report.overallScore >= 70) {
      report.overallStatus = 'PASSED';
    } else if (report.blockers.length > 0) {
      report.overallStatus = 'FAILED';  
    } else {
      report.overallStatus = 'WARNING';
    }
    
    return report;
  }
}
```

### 9.3 CI/CD 파이프라인 통합

```yaml
# .github/workflows/video-planning-refactoring.yml
name: 'Video Planning Refactoring Tests'

on:
  push:
    branches: [main, develop, feature/video-planning-refactoring]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # 매일 새벽 2시 전체 테스트

jobs:
  unit-integration-tests:
    name: 'Unit & Integration Tests'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Unit Tests
        run: |
          npm run test:ai-planning:unit -- --coverage --verbose
          npm run test:coverage:threshold
          
      - name: Run Integration Tests
        run: npm run test:ai-planning:integration
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          
  e2e-tests:
    name: 'E2E Tests'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E Tests
        run: npm run test:ai-planning:e2e
        
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-results
          path: test-results/
          
  performance-tests:
    name: 'Performance & Accessibility'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Performance Tests
        run: |
          npm run test:performance:core-web-vitals
          npm run test:accessibility:wcag-aa
          
      - name: Generate Lighthouse Report
        run: |
          npm run lighthouse:ci
          
  quality-gate:
    name: 'Quality Gate'
    needs: [unit-integration-tests, e2e-tests, performance-tests]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download test artifacts
        uses: actions/download-artifact@v3
        
      - name: Run DoD Validation
        run: |
          npm run test:quality-gate:validate
          
      - name: Generate Quality Report
        run: |
          npm run test:report:generate
          
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('test-reports/quality-summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### 9.4 성공 지표 및 모니터링

#### A. 일일 품질 메트릭
```typescript
// test/monitoring/daily-metrics.ts
export class DailyQualityMetrics {
  async collectMetrics(): Promise<QualityDashboard> {
    return {
      testExecution: {
        totalTests: await this.countTests(),
        passRate: await this.calculatePassRate(),
        executionTime: await this.measureExecutionTime(),
        flakeRate: await this.calculateFlakeRate()
      },
      codeQuality: {
        coverage: await this.getCoverageData(),
        mutationScore: await this.getMutationScore(),
        techDebt: await this.analyzeTechDebt(),
        duplicatedCode: await this.findDuplications()
      },
      performance: {
        coreWebVitals: await this.measureWebVitals(),
        workflowTime: await this.measureWorkflowPerformance(),
        memoryUsage: await this.analyzeMemoryUsage(),
        errorRate: await this.calculateErrorRate()
      },
      accessibility: {
        wcagScore: await this.auditAccessibility(),
        keyboardNav: await this.testKeyboardNavigation(),
        screenReader: await this.testScreenReader(),
        contrastRatio: await this.checkContrast()
      }
    };
  }
}
```

#### B. 주간 품질 리포트
```markdown
# 주간 품질 리포트 템플릿

## 📊 테스트 실행 현황
- **전체 테스트**: 32개 (Unit 21 + Integration 8 + E2E 3)
- **성공률**: 96.8% (목표: 95%+) ✅
- **실행 시간**: 7분 23초 (목표: 8분 이내) ✅
- **Flaky Rate**: 0.8% (목표: 1% 이하) ✅

## 🎯 품질 게이트 현황
- **커버리지**: 87.2% (목표: 85%+) ✅
- **뮤테이션 스코어**: 79.1% (목표: 78%+) ✅
- **Core Web Vitals**: LCP 1.8s, FID 65ms, CLS 0.06 ✅
- **접근성 점수**: 92점 (목표: 90+) ✅

## 📈 개선 트렌드
- 지난 주 대비 커버리지 +2.1%
- E2E 테스트 안정성 향상 (92% → 96%)
- 워크플로우 완료 시간 단축 (3분 12초 → 2분 58초)

## 🚨 주의사항
- Google API Mock 가끔 타임아웃 (재현율 3%)
- 모바일 테스트에서 간헐적 레이아웃 시프트 발생

## 🎯 다음 주 목표
- 뮤테이션 스코어 80% 달성
- 모바일 CLS 0.05 이하로 개선
- E2E 테스트 실행 시간 6분 이내로 단축
```

---

## 📝 결론 및 다음 단계

### 구축 완료 사항

✅ **기존 테스트 분석**: 48개 → 32개 테스트로 효율화  
✅ **Mock 시스템 재활용**: 검증된 LLM/Google API Mock 인프라 유지  
✅ **새로운 테스트 매트릭스**: Unit 21개 + Integration 8개 + E2E 3개  
✅ **TDD 개발 가이드**: Red-Green-Refactor 3단계 프로세스  
✅ **품질 게이트 강화**: DoD 8개 기준 + CI/CD 자동화  
✅ **성능/접근성 기준**: Core Web Vitals + WCAG 2.1 AA 강화  

### 즉시 실행 가능한 명령어

```bash
# 전체 테스트 실행
npm run test:ai-planning:refactoring

# 단계별 실행  
npm run test:ai-planning:unit        # Unit 테스트
npm run test:ai-planning:integration # Integration 테스트
npm run test:ai-planning:e2e        # E2E 테스트

# 품질 검증
npm run test:quality-gate:validate  # DoD 기준 검증
npm run test:coverage:enhanced      # 커버리지 85% 달성 확인
npm run test:performance:vitals     # Core Web Vitals 검증
```

### 향후 발전 계획

🔄 **Phase 1 (1개월)**: 리팩토링 테스트 완전 구현  
📊 **Phase 2 (2개월)**: 실제 사용자 피드백 기반 테스트 개선  
🤖 **Phase 3 (3개월)**: AI 품질 자동 개선 시스템 도입  
🎯 **장기 목표**: 품질 점수 95점 달성, 완전 자동화된 배포 파이프라인  

---

**📅 문서 업데이트**: 2025-08-23  
**👥 검토 대상**: VideoPlanet 개발팀 전체  
**🔄 다음 리뷰**: 리팩토링 완료 시점  
**📞 문의**: Grace (QA Lead) - Quality Guardian Through Development Pipeline