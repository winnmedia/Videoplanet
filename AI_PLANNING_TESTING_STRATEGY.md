# AI 영상 기획 시스템 종합 테스트 전략

> **작성자**: Grace (QA Lead) - Quality-First AI Testing Framework  
> **작성일**: 2025-08-22  
> **버전**: 1.0  
> **기반**: INSTRUCTION.md 요구사항 및 기존 VideoPlanet 테스트 인프라

## 📋 목차

1. [전략 개요](#1-전략-개요)
2. [핵심 테스트 도메인](#2-핵심-테스트-도메인)
3. [테스트 피라미드 구조](#3-테스트-피라미드-구조)
4. [Mock 전략 상세](#4-mock-전략-상세)
5. [E2E 시나리오](#5-e2e-시나리오)
6. [품질 메트릭 및 DoD](#6-품질-메트릭-및-dod)
7. [CI/CD 파이프라인](#7-cicd-파이프라인)
8. [실행 가이드](#8-실행-가이드)
9. [성공 지표](#9-성공-지표)

---

## 1. 전략 개요

### 1.1 목표

INSTRUCTION.md에 정의된 AI 영상 기획 시스템의 **완전한 사용자 여정**을 안정적으로 테스트할 수 있는 종합 테스트 전략을 구축합니다.

**핵심 워크플로우**: 
```
사용자 입력 → 4단계 생성 → 편집/검토 → 12숏트 분해 → 콘티 생성 → PDF 다운로드
```

### 1.2 기본 원칙

- **TDD 방식**: 테스트 우선 개발로 요구사항 검증
- **Mock 기반 AI 시뮬레이션**: 실제 AI API 없이 안정적 테스트 환경
- **DoD 기반 품질 관리**: 8개 핵심 기준을 통한 자동 품질 검증
- **기존 인프라 활용**: VideoPlanet의 Playwright + Vitest 환경 확장

### 1.3 테스트 범위

| 테스트 범위 | 포함 기능 | 테스트 수 |
|-------------|-----------|-----------|
| **1단계 위저드** | 스토리 입력, 메타데이터 설정, 검증 | 4개 |
| **2단계 위저드** | 4단계 생성, 인라인 편집, 되돌리기 | 3개 |
| **3단계 위저드** | 12숏트 분해, 콘티 생성, 인서트샷 | 5개 |
| **AI 인터랙션** | LLM/Google API 호출, 에러 처리 | 10개 |
| **PDF 생성** | JSON→PDF 변환, 여백 0 레이아웃 | 4개 |
| **성능/접근성** | Core Web Vitals, WCAG 2.1 AA | 4개 |
| **전체 통합** | E2E 워크플로우, 크로스브라우저 | 4개 |
| **총계** | | **48개** |

---

## 2. 핵심 테스트 도메인

### 2.1 3단계 위저드 워크플로우

#### 1단계: 스토리 입력
- **필수 입력 검증**: 제목, 한줄스토리, 메타데이터
- **복합 선택 UI**: 톤앤매너(멀티), 장르, 전개방식
- **실시간 검증**: 입력 완성도에 따른 버튼 활성화

#### 2단계: 4단계 검토/수정  
- **AI 생성 결과**: 기승전결 4단계 자동 구성
- **인라인 편집**: 각 단계별 제목/내용 수정 가능
- **상태 관리**: 편집 이력, 되돌리기, 초기화

#### 3단계: 12숏트 분해·편집
- **자동 분해**: 4단계 → 12개 숏트 (각 단계당 3개)
- **콘티 생성**: Google Images API 연동, 버전 관리
- **인서트샷**: 각 숏별 3개 추천 (목적 중복 방지)

### 2.2 AI 인터랙션 테스트

#### LLM API 호출 시뮬레이션
```typescript
// 성공/실패/타임아웃 시나리오
const mockLLM = new MockLLMService({
  failureRate: 0.05,    // 5% 실패율
  latencyMs: 2000,      // 2초 응답 시간
  tokenLimit: 8000      // 토큰 제한
});
```

#### Google Images API 모킹
```typescript
// 콘티 이미지 생성 시뮬레이션
const mockGoogle = new MockGoogleImagesAPI({
  dailyQuotaLimit: 200, // 일일 할당량
  style: "storyboard pencil sketch, rough, monochrome"
});
```

#### PDF 생성 테스트
```typescript
// 여백 0 레이아웃 검증
const pdfValidator = PDFQualityValidator.validatePDFQuality({
  format: 'A4',
  orientation: 'landscape', 
  margins: { top: 0, right: 0, bottom: 0, left: 0 }
});
```

---

## 3. 테스트 피라미드 구조

### 3.1 분포 비율

```
        E2E (10%)
      ─────────────
     /             \
    /               \
   / Integration     \
  /    (20%)         \
 /                    \
/                      \
────────────────────────
       Unit (70%)
```

### 3.2 계층별 세부사항

#### Unit Tests (70% - 34개)
- **Planning Entity**: 스토리 메타데이터 검증, 4단계 생성 규칙
- **Feature Components**: 위저드 전환, 인라인 편집, Mock API 처리
- **Pure Functions**: 길이 계산, 카메라 워크 할당, 검증 로직

#### Integration Tests (20% - 10개)
- **AI-UI 통합**: LLM 호출 → Redux 저장 → UI 업데이트
- **상태 관리**: 자동저장, 복구, 에러 전파
- **API 통합**: 실제 네트워크 레이어와 Mock 서비스 연동

#### E2E Tests (10% - 4개)
- **전체 워크플로우**: 입력부터 PDF 다운로드까지
- **크로스브라우저**: Chrome/Firefox/Safari 호환성
- **성능 검증**: Core Web Vitals 임계값
- **접근성**: WCAG 2.1 AA 수준 준수

---

## 4. Mock 전략 상세

### 4.1 LLM 서비스 Mock

```typescript
class MockLLMService {
  // 4단계 생성 시뮬레이션
  async generateFourStages(metadata: StoryMetadata): Promise<LLMResponse<StoryStage[]>>
  
  // 12숏트 분해 시뮬레이션  
  async generateTwelveShots(stages: StoryStage[]): Promise<LLMResponse<ShotDetails[]>>
  
  // 인서트샷 추천
  async generateInsertShots(shot: ShotDetails): Promise<LLMResponse<InsertShot[]>>
}
```

**주요 기능**:
- ✅ 실패율/지연시간/토큰 제한 설정 가능
- ✅ 전개 방식/강도에 따른 차별화된 응답
- ✅ 용어 일관성 유지 (톤앤매너, 키워드 반복 사용)
- ✅ 현실적인 응답 시간 (2-15초) 시뮬레이션

### 4.2 Google Images API Mock

```typescript
class MockGoogleImagesAPI {
  // 콘티 이미지 생성
  async generateContiImage(request: GoogleImageGenerationRequest)
  
  // 프롬프트 자동 생성  
  generateContiPrompt(shotDescription: string): string
  
  // 버전 관리
  async regenerateContiImage(originalRequest, version): Promise<Response>
}
```

**주요 기능**:
- ✅ "storyboard pencil sketch, rough, monochrome" 스타일 강제
- ✅ 쿼터 제한 및 에러 처리 시뮬레이션
- ✅ 버전별 이미지 관리 (S01-conti-v1.png 형태)
- ✅ Base64 데이터 URL 기반 Mock 이미지 제공

### 4.3 PDF 생성 Mock

```typescript
class MockPDFGenerator {
  // 기획안 PDF 생성
  async generatePlanningPDF(request: PDFGenerationRequest)
  
  // 여백 0 레이아웃 검증
  validateZeroMarginLayout(template: PDFTemplate): boolean
  
  // 페이지 구성: 표지 → 4단계 → 12숏트 카드
  private generatePages(request): PDFPage[]
}
```

**주요 기능**:
- ✅ A4 가로, 여백 0 레이아웃 강제
- ✅ 표지→4단계→12숏트 순서 보장
- ✅ 콘티 이미지 임베딩 시뮬레이션
- ✅ 파일 크기/생성시간 현실적 시뮬레이션

---

## 5. E2E 시나리오

### 5.1 메인 시나리오: 완전한 워크플로우

```gherkin
Scenario: AI 영상 기획 시스템 완전한 사용자 여정
  Given 사용자가 AI 기획 페이지에 접속했을 때
  When 1단계에서 모든 필수 정보를 입력하고
  And "생성" 버튼을 클릭하면
  Then 4단계 스토리가 기승전결 순으로 생성된다
  
  When 2단계에서 첫 번째 단계를 편집하고
  And "숏 생성" 버튼을 클릭하면  
  Then 정확히 12개의 숏트가 생성된다
  
  When 3단계에서 첫 번째 숏의 콘티를 생성하고
  And "기획안 다운로드" 버튼을 클릭하면
  Then 여백 0 PDF 파일이 다운로드된다
```

### 5.2 에러 시나리오

```typescript
test('LLM API 실패 시 재시도 및 에러 처리', async ({ page }) => {
  // Mock을 100% 실패 모드로 설정
  mockLLM.setFailureRate(1.0);
  
  // 기본 입력 후 생성 시도
  await fillBasicStoryData(page);
  await page.click('[data-testid="generate-button"]');
  
  // 재시도 UI 확인 (최대 3회)
  await expect(page.locator('[data-testid="retry-count"]')).toContainText('1/3');
});
```

### 5.3 성능 시나리오

```typescript  
test('전체 워크플로우 5분 이내 완료', async ({ page }) => {
  const startTime = Date.now();
  
  await completeFullWorkflow(page);
  
  const totalTime = Date.now() - startTime;
  expect(totalTime).toBeLessThan(300000); // 5분
});
```

---

## 6. 품질 메트릭 및 DoD

### 6.1 DoD (Definition of Done) 8개 기준

| ID | 기준 | 카테고리 | 우선순위 | 검증 방법 |
|----|------|----------|----------|-----------|
| DOD-001 | 4단계 스토리 생성 품질 | AI Quality | Critical | 전개방식/강도 반영 검증 |
| DOD-002 | 단계별 편집 기능 | Functional | Critical | 인라인 편집, 되돌리기 |
| DOD-003 | 12개 숏트 정확 생성 | Functional | Critical | 정확한 개수, ID 연속성 |
| DOD-004 | 콘티 생성/재생성/다운로드 | Functional | High | Google API 연동 |
| DOD-005 | 인서트샷 3개 중복 방지 | AI Quality | Medium | 목적별 분류, 중복 확인 |
| DOD-006 | PDF 여백 0 생성 | Functional | High | 레이아웃, 페이지 순서 |
| DOD-007 | LLM 연속 일관성 | AI Quality | High | 용어/톤앤매너 일관성 |
| DOD-008 | 전체 워크플로우 성능 | Performance | High | 5분 이내 완료 |

### 6.2 품질 게이트 실행

```typescript
// 자동 품질 검증
const report = await DoQualityGate.runQualityGate({
  metadata: storyMetadata,
  stages: fourStages, 
  shots: twelveShots,
  workflowTimeMs: totalTime
});

// 결과: PASSED | WARNING | FAILED
console.log(`품질 게이트 결과: ${report.overallStatus} (${report.overallScore}/100)`);
```

### 6.3 성공 기준

- **Critical 기준**: 100% 통과 필수 (실패 시 배포 차단)
- **High 기준**: 90% 이상 통과 권장
- **Medium 기준**: 80% 이상 통과 권장
- **전체 점수**: 70점 이상 합격

---

## 7. CI/CD 파이프라인

### 7.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/ai-planning-tests.yml
name: 'AI Planning System Tests'

on:
  push: [main, develop, feature/ai-planning*]
  pull_request: [main, develop]
  schedule: [cron: '0 2 * * *'] # 매일 새벽 2시

jobs:
  unit-integration-tests:  # 병렬 실행
  e2e-tests:              # 브라우저 환경 
  performance-tests:      # Core Web Vitals
  quality-gate:           # DoD 검증
  test-summary:           # 결과 종합
```

### 7.2 실행 조건

| 트리거 | Unit | Integration | E2E | Performance | Quality Gate |
|--------|------|-------------|-----|-------------|--------------|
| **PR** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Push main** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Scheduled** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manual** | 설정 가능 | 설정 가능 | 설정 가능 | 설정 가능 | 설정 가능 |

### 7.3 품질 게이트 통합

- **Critical 실패**: 전체 워크플로우 실패 → PR 차단
- **High/Medium 실패**: 경고 표시 → PR 병합 가능, 수정 권장  
- **성능 임계값 초과**: 성능 팀 알림, 최적화 권장

---

## 8. 실행 가이드

### 8.1 로컬 개발 환경

```bash
# AI 기획 시스템 테스트 전체 실행
npm run test:ai-planning

# 계층별 개별 실행  
npm run test:ai-planning:unit        # Unit 테스트
npm run test:ai-planning:integration # Integration 테스트
npm run test:ai-planning:e2e        # E2E 테스트

# 품질 검증
npm run test:ai-planning:quality    # DoD 품질 게이트
npm run test:ai-planning:coverage   # 커버리지 리포트

# 개발 모드 (watch)
npm run ai-planning:dev             # Unit 테스트 watch 모드
```

### 8.2 Mock 서비스 설정

```typescript
// 개발 환경에서 Mock 비율 조정
const mockLLM = new MockLLMService({
  failureRate: 0.1,    // 10% 실패율로 에러 케이스 테스트
  latencyMs: 1000,     // 1초로 단축하여 빠른 피드백
});

// 프로덕션 환경 시뮬레이션
const mockGoogle = new MockGoogleImagesAPI({
  failureRate: 0.05,   // 5% 실패율 (현실적)
  latencyMs: 3000,     // 3초 (Google API 평균)
  quotaLimit: 1000     // 하루 1000회 제한
});
```

### 8.3 디버깅 가이드

```bash
# E2E 테스트 UI 모드로 실행 (디버깅용)
npm run test:ai-planning:e2e -- --ui

# 특정 테스트만 실행
npm run test:ai-planning:e2e -- --grep "완전한 워크플로우"

# Mock 서비스 로그 활성화
DEBUG=mock:* npm run test:ai-planning

# 커버리지와 함께 실행
npm run test:ai-planning:coverage -- --reporter=html
```

---

## 9. 성공 지표

### 9.1 테스트 품질 지표

| 지표 | 목표 | 현재 상태 |
|------|------|-----------|
| **테스트 커버리지** | Unit 90%+ | 🎯 목표 설정 |
| **테스트 실행 시간** | 전체 5분 이내 | 🎯 목표 설정 |  
| **E2E 안정성** | 95%+ 성공률 | 🎯 목표 설정 |
| **DoD 통과율** | Critical 100% | 🎯 목표 설정 |

### 9.2 AI 품질 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **4단계 생성 품질** | 90점 이상 | 전개방식/강도 반영도 |
| **12숏트 정확성** | 100% | 개수, 분배, 필수 필드 |
| **콘티 생성 성공률** | 95% 이상 | Google API Mock 기준 |
| **LLM 응답 일관성** | 85점 이상 | 용어/톤앤매너 분석 |

### 9.3 사용자 경험 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **전체 워크플로우 시간** | 3분 이내 | E2E 테스트 측정 |
| **에러 복구 시간** | 10초 이내 | Mock 실패 시나리오 |
| **접근성 점수** | WCAG 2.1 AA | Playwright axe 검증 |
| **모바일 호환성** | 100% | 반응형 테스트 |

---

## 10. 결론 및 다음 단계

### 10.1 구축 완료 사항

✅ **Mock 시스템**: LLM, Google Images, PDF 생성 완전 시뮬레이션  
✅ **테스트 매트릭스**: 48개 테스트 케이스 (Unit 34 + Integration 10 + E2E 4)  
✅ **품질 게이트**: DoD 8개 기준 자동 검증 시스템  
✅ **CI/CD 파이프라인**: GitHub Actions 완전 자동화  
✅ **실행 환경**: NPM 스크립트 및 개발자 도구 완비  

### 10.2 즉시 활용 가능

현재 구축된 테스트 인프라는 **실제 AI API 없이도** 완전한 테스트가 가능합니다:

```bash
# 지금 바로 실행 가능한 명령어들
npm run test:ai-planning:quality     # DoD 품질 검증 
npm run test:ai-planning:mock        # Mock 서비스 테스트
npm run ai-planning:dev              # 개발 모드 테스트
```

### 10.3 향후 확장 계획

🔄 **실제 API 연동**: Mock → 실제 LLM/Google API 단계적 전환  
📊 **성능 모니터링**: 실시간 품질 대시보드 구축  
🧪 **A/B 테스트**: AI 프롬프트 최적화 실험 환경  
🤖 **AI 품질 자동 개선**: 테스트 결과 기반 프롬프트 튜닝  

---

**📝 문서 업데이트**: 2025-08-22  
**👥 검토자**: VideoPlanet 개발팀  
**🔄 다음 리뷰**: 실제 AI API 연동 시점  
**📞 문의**: Grace (QA Lead) - Quality-First AI Testing Framework
