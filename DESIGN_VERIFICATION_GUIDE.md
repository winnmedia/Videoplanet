# 🎨 VideoPlanet UX/UI 디자인 자동 검증 시스템

MCP Playwright를 활용한 포괄적인 디자인 품질 보증 시스템입니다.

## 📋 개요

이 시스템은 VideoPlanet 프로젝트의 디자인 일관성과 품질을 자동으로 검증합니다. 

### 🔍 검증 범위

1. **디자인 토큰 일관성** - 브랜드 색상, 간격, 타이포그래피
2. **반응형 디자인** - 뷰포트별 적응성, 모바일 최적화  
3. **접근성 표준** - WCAG 2.1 AA 준수
4. **성능 영향** - Core Web Vitals, 애니메이션 최적화
5. **UI 일관성** - 크로스 페이지 컴포넌트 통일성

## 🚀 시작하기

### 1. 개발 서버 실행

```bash
# 디자인 검증 전용 포트로 실행
npm run dev -- -p 3001
```

### 2. 전체 디자인 검증 실행

```bash
# 모든 디자인 검증 테스트 실행
npm run test:design

# 특정 카테고리만 실행
npm run test:design:tokens        # 디자인 토큰 검증
npm run test:design:responsive    # 반응형 디자인 검증  
npm run test:design:accessibility # 접근성 검증
npm run test:design:performance   # 성능 영향 측정
npm run test:design:consistency   # UI 일관성 검증
```

### 3. 결과 리포트 확인

```bash
# HTML 리포트 열기
npm run test:design:report
```

## 📊 리포트 구조

### 자동 생성되는 파일들

```
test-results/design-verification-report/
├── index.html                           # 메인 HTML 리포트
├── design-verification-summary.json     # 종합 결과 요약
├── brand-color-verification.json        # 브랜드 색상 검증 결과
├── spacing-typography-verification.json # 간격/타이포그래피 결과
├── responsive-design-verification.json  # 반응형 디자인 결과
├── wcag-compliance-verification.json    # 접근성 검증 결과
├── performance-impact-verification.json # 성능 영향 측정 결과
└── ui-consistency-verification.json     # UI 일관성 검증 결과
```

### 성능 지표 의미

| 지표 | 기준값 | 의미 |
|------|--------|------|
| 브랜드 색상 준수율 | 90% 이상 | design-tokens.scss 색상 사용률 |
| 간격 토큰 사용률 | 85% 이상 | 정의된 spacing 토큰 활용도 |
| 반응형 적응률 | 95% 이상 | 뷰포트별 올바른 레이아웃 적응 |
| WCAG AA 준수율 | 90% 이상 | 접근성 표준 충족도 |
| Core Web Vitals | LCP<2.5s, CLS<0.1 | 성능 기준 달성 |
| UI 일관성 점수 | 80% 이상 | 페이지간 컴포넌트 통일성 |

## 🔧 맞춤 설정

### 검증 기준 조정

`test/design-verification/utils/design-token-helpers.ts`에서 브랜드 색상과 토큰 정의를 수정할 수 있습니다.

```typescript
export const BRAND_COLORS = {
  primary: '#1631f8',      // 주요 브랜드 색상
  success: '#28a745',      // 성공 상태
  error: '#dc3545',        // 오류 상태
  // ... 추가 색상
};

export const SPACING_TOKENS = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  // ... 추가 간격
};
```

### 성능 임계값 변경

`test/design-verification/performance-impact/design-performance.spec.ts`에서 성능 기준을 조정할 수 있습니다.

```typescript
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,        // Largest Contentful Paint (ms)
  FID: 100,         // First Input Delay (ms)
  CLS: 0.1,         // Cumulative Layout Shift
  // ... 추가 임계값
};
```

## 🎯 테스트 작성 가이드

### 새로운 디자인 검증 테스트 추가

1. 적절한 카테고리 디렉토리 선택:
   ```
   test/design-verification/
   ├── design-tokens/      # 브랜드 색상, 간격, 폰트
   ├── responsive-design/  # 반응형, 모바일 최적화
   ├── accessibility/      # WCAG, 접근성
   ├── performance-impact/ # 성능 측정
   └── ui-consistency/     # UI 일관성
   ```

2. 테스트 파일 생성:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { createVerificationResult } from '../utils/design-token-helpers';

   test.describe('새로운 검증 카테고리', () => {
     test('구체적인 검증 항목', async ({ page }) => {
       await page.goto('/dashboard');
       
       // 검증 로직 구현
       const result = await page.evaluate(() => {
         // DOM 분석 및 스타일 검증
         return { valid: true, actualValue: 'success' };
       });

       // 결과 기록
       verificationResults.push(createVerificationResult(
         '테스트 이름',
         'selector',
         'property',
         result,
         '기대값'
       ));

       expect(result.valid).toBe(true);
     });
   });
   ```

### 유틸리티 함수 활용

시스템에서 제공하는 헬퍼 함수들을 적극 활용하세요:

```typescript
import { 
  verifyBrandColor,           // 브랜드 색상 검증
  verifySpacingToken,         // 간격 토큰 검증
  verifyFontSizeToken,        // 폰트 크기 토큰 검증
  verifyAccessibilityAttributes, // 접근성 속성 검증
  getComputedStyleProperty,   // CSS 속성 값 추출
  isElementVisuallyVisible    // 요소 가시성 확인
} from '../utils/design-token-helpers';
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 개발 서버 연결 실패
```
❌ 개발 서버에 연결할 수 없습니다
```
**해결책**: `npm run dev -- -p 3001`로 서버 실행 확인

#### 2. 디자인 토큰 파일 없음
```
⚠️ 디자인 토큰 파일을 찾을 수 없습니다
```
**해결책**: `src/shared/styles/design-tokens.scss` 파일 존재 확인

#### 3. 색상 대비율 계산 오류
```
분석 실패: Cannot read property of undefined
```
**해결책**: CSS 색상 형식 확인 (rgb, hex, hsl 지원)

#### 4. 테스트 타임아웃
```
Test timeout of 30000ms exceeded
```
**해결책**: `playwright-design-verification.config.ts`에서 타임아웃 증가

### 디버깅 팁

1. **헤드리스 모드 비활성화**: 개발 중에는 브라우저를 직접 보면서 디버깅
   ```typescript
   // playwright-design-verification.config.ts
   headless: false  // 또는 !isDevelopment
   ```

2. **스크린샷 활용**: 실패 지점의 시각적 확인
   ```typescript
   await page.screenshot({ path: 'debug-screenshot.png' });
   ```

3. **Console 로그 확인**: 브라우저 콘솔 메시지 모니터링
   ```typescript
   page.on('console', msg => console.log('Browser:', msg.text()));
   ```

## 🚀 CI/CD 통합

### GitHub Actions 예시

```yaml
name: Design Verification
on: [push, pull_request]

jobs:
  design-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Start development server
        run: npm run dev -- -p 3001 &
        
      - name: Run design verification
        run: npm run test:design
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: design-verification-report
          path: test-results/design-verification-report/
```

### 품질 게이트 설정

프로젝트의 품질 게이트에 디자인 검증을 포함:

```json
{
  "designQualityGates": {
    "brandConsistency": 85,
    "responsiveDesign": 90,
    "accessibility": 80,
    "performance": 85,
    "uiConsistency": 75
  }
}
```

## 📚 추가 자료

- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals 최적화](https://web.dev/vitals/)
- [Playwright 테스트 작성법](https://playwright.dev/docs/writing-tests)
- [CSS 디자인 토큰 베스트 프랙티스](https://css-tricks.com/what-are-design-tokens/)

## 🤝 기여하기

새로운 검증 항목이나 개선 사항이 있다면:

1. 이슈 생성으로 아이디어 공유
2. 테스트 케이스 추가
3. 문서 업데이트
4. Pull Request 생성

---

**Made with ❤️ for VideoPlanet Design System**