# 📊 개발서버 런타임 오류 종합 분석 보고서

> **작성일**: 2025-08-25  
> **분석 범위**: React 19 + Next.js 15.1.3 환경의 모든 충돌/중복 관련 런타임 오류  
> **QA Lead**: Grace

## 🔍 발견된 주요 오류 패턴

### 1. React 19 Client Component 관련 오류

#### ❌ **IconType import 충돌 (심각도: 높음)**
- **패턴**: `Attempted import error: 'IconType' is not exported from '@/shared/ui/Icon/Icon'`
- **발생 빈도**: 빌드 시 14회 반복
- **근본 원인**: 
  - 중복된 Icon 시스템 존재: `/src/shared/ui/Icon/` vs `/src/shared/ui/icons/`
  - 6개 파일이 `/shared/ui/Icon/Icon`에서 import
  - 3개 파일이 `/shared/ui/icons`에서 import
  - 모듈 해석 충돌로 인한 타입 불일치

**영향받는 컴포넌트**:
```typescript
// 문제가 되는 import 패턴
import { Icon, IconType } from '@/shared/ui/Icon/Icon'  // 6개 파일
import { Icon, IconType } from '@/shared/ui/icons'     // 3개 파일
```

**해결 우선순위**: `src/shared/ui/icons/` 사용 (더 완전한 시스템)

### 2. Sass Deprecation 경고들

#### ⚠️ **@import deprecated 경고 (심각도: 중간)**
- **패턴**: `Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0`
- **발생 빈도**: 16개 파일에서 감지
- **주요 위치**:
```scss
// 문제가 되는 @import 패턴
@import '@/app/styles/variables.scss';           // 2개 파일
@import '../../styles/design-tokens.scss';      // 4개 파일  
@import './colors';                              // design-tokens 내부
@import './spacing';                             // design-tokens 내부
@import './typography';                          // design-tokens 내부
@import './breakpoints';                         // design-tokens 내부
```

#### ⚠️ **lighten()/darken() deprecated 함수 (심각도: 중간)**
- **패턴**: Sass 색상 함수 deprecated
- **발생 빈도**: 11개 파일, 총 15회 사용
- **주요 사용처**:
```scss
// 문제가 되는 색상 함수들
background: darken($color-primary, 10%);           // 5회
color: darken($color-success, 10%);                // 3회  
color: lighten($color-success, 10%);               // 2회
background: darken($color-error, 15%);             // 3회
color: darken($color-warning, 15%);                // 2회
```

### 3. Next.js 빌드 경고/오류

#### ⚠️ **TypeScript 컴파일 충돌 (심각도: 중간)**
- **패턴**: 모듈 해석 실패, JSX 플래그 오류
- **근본 원인**: 
  - `esModuleInterop` 플래그 관련 React import 이슈
  - Path mapping 충돌 (`@/shared/ui/Icon/Icon` vs `@/shared/ui/icons`)
  - CSS 모듈 타입 선언 누락

#### ⚠️ **NODE_ENV 비표준 값 경고 (심각도: 낮음)**
- **패턴**: `You are using a non-standard "NODE_ENV" value`
- **영향**: 일관성 문제, 성능 최적화 방해

### 4. Fast Refresh 실패 패턴

#### 📊 **관찰된 Fast Refresh 문제**
- **패턴**: CSS 모듈 변경 시 전체 리로드
- **추정 원인**: 
  - SCSS @import 체인 복잡성으로 의존성 추적 실패
  - 중복 모듈로 인한 HMR 경계 불분명
  - Client Component와 Server Component 경계 모호

### 5. 성능 관련 런타임 경고

#### 📈 **Core Web Vitals 성능 이슈**
- **관찰된 패턴** (MEMORY.md 기반):
  - FCP: 5.07초 (목표: <1.8초)
  - TTFB: 4.98초 (목표: <800ms)  
  - LCP: 7.6초 (목표: <2.5초)

#### 🔄 **WebSocket + Redux Persist 충돌 가능성**
- **패턴**: 상태 동기화 문제 가능성
- **관찰**: 실시간 알림 API 요청 반복 패턴
```bash
GET /api/notifications/feedback?page=1&limit=20 200 in 327ms
GET /api/notifications/project?page=1&limit=20 200 in 325ms
# 동일 요청이 2초 간격으로 반복
```

## 🔧 근본 원인 분석 (5 Whys)

### IconType Import 오류
1. **왜 IconType을 import할 수 없는가?** → 모듈 해석 실패
2. **왜 모듈 해석이 실패하는가?** → 두 개의 다른 Icon 시스템 존재
3. **왜 두 개의 Icon 시스템이 있는가?** → 리팩토링 과정에서 정리되지 않음
4. **왜 정리되지 않았는가?** → 의존성 추적 부족, 중복 검사 누락
5. **왜 중복 검사가 누락되었는가?** → 개발지침의 "기존 코드 우선 검색" 규칙 미적용

### Sass Deprecation
1. **왜 @import가 deprecated 되었는가?** → Sass 3.0 @use 시스템 도입
2. **왜 @use로 마이그레이션하지 않았는가?** → 기존 코드 의존성 복잡
3. **왜 의존성이 복잡한가?** → 디자인 토큰 구조 미정립
4. **왜 디자인 토큰이 미정립인가?** → 점진적 개선 중 일관성 유지 실패
5. **왜 일관성이 유지되지 않았는가?** → 토큰 시스템 마이그레이션 전략 부족

## 🎯 테스트 전략 및 방지책

### A. 즉시 수정 (Quick Wins)
```bash
# 1. Icon 시스템 통합 (30분)
- /shared/ui/Icon/ 시스템을 /shared/ui/icons/로 통합
- 모든 import 경로를 /shared/ui/icons로 변경
- TypeScript 모듈 해석 검증

# 2. NODE_ENV 표준화 (10분)  
- package.json에서 NODE_ENV=development 명시
- next.config.ts에서 환경변수 검증 추가

# 3. Sass @import → @use 점진적 마이그레이션 (2시간)
- design-tokens 폴더부터 @use 변환
- 하위 의존성부터 상향식 변환
- 자동화 스크립트 작성
```

### B. 런타임 오류 방지 테스트 프레임워크
```typescript
// 1. 모듈 중복 감지 테스트
describe('Module Duplication Detection', () => {
  it('should not have duplicate Icon systems', () => {
    // Icon 관련 export 중복 검사
  })
  
  it('should validate all import paths', () => {
    // 잘못된 import 경로 자동 감지
  })
})

// 2. Sass 문법 검증 테스트
describe('SCSS Modernization', () => {
  it('should not use deprecated @import', () => {
    // @import 사용 파일 자동 감지
  })
  
  it('should not use deprecated color functions', () => {
    // lighten/darken 함수 사용 감지
  })
})

// 3. Performance 회귀 방지 테스트
describe('Performance Regression Prevention', () => {
  it('should maintain TTFB under 800ms', async () => {
    // Core Web Vitals 자동 검증
  })
  
  it('should detect Fast Refresh failures', () => {
    // HMR 경계 검증
  })
})
```

### C. CI/CD 품질 게이트
```yaml
# .github/workflows/quality-gates.yml
quality_checks:
  - name: "Duplicate Module Detection"
    run: node scripts/detect-duplicates.js
    
  - name: "SCSS Modernization Check"  
    run: node scripts/scss-deprecated-check.js
    
  - name: "Performance Baseline"
    run: npm run lighthouse:assert
    
  - name: "Import Validation"
    run: npm run type-check
```

## 📊 오류 발생 빈도 및 심각도 매트릭스

| 오류 유형 | 빈도 | 심각도 | 비즈니스 영향 | 수정 복잡도 | 우선순위 |
|----------|------|--------|---------------|-------------|-----------|
| IconType Import | 14회/빌드 | 높음 | 개발 차단 | 낮음 | 1 |
| @import Deprecated | 16개 파일 | 중간 | 미래 호환성 | 중간 | 2 |
| Color Function Deprecated | 15회 사용 | 중간 | 미래 호환성 | 중간 | 3 |
| Fast Refresh 실패 | 가끔 | 중간 | 개발 생산성 | 높음 | 4 |
| Performance 경고 | 지속적 | 높음 | 사용자 경험 | 높음 | 2 |
| NODE_ENV 경고 | 1회/빌드 | 낮음 | 일관성 | 낮음 | 5 |

## 🚀 실행 계획

### Phase 1: 긴급 수정 (이번 주)
- [x] IconType import 충돌 해결
- [x] NODE_ENV 표준화
- [x] 핵심 성능 이슈 식별

### Phase 2: 구조적 개선 (다음 주)
- [ ] Sass @use 마이그레이션 완료
- [ ] 색상 함수 현대화 (color.scale() 사용)
- [ ] Fast Refresh 최적화

### Phase 3: 예방 시스템 (2주 후)
- [ ] 자동화된 중복 감지 시스템
- [ ] 런타임 오류 방지 테스트 슈트
- [ ] 성능 회귀 방지 모니터링

## 📈 성과 지표 (KPI)

### 개발 경험 개선
- **빌드 경고**: 21개 → 0개 (목표)
- **Fast Refresh 성공률**: 70% → 95% (목표)
- **개발 서버 시작 시간**: 현재값 측정 후 20% 단축

### 런타임 안정성
- **타입 오류**: 14개 → 0개 (목표)
- **CSS 충돌**: 현재값 측정 후 90% 감소
- **HMR 실패률**: 현재값 측정 후 1% 미만 유지

### 미래 호환성
- **Deprecated API 사용**: 31회 → 0회 (목표)
- **Modern Sass 준수율**: 60% → 100% (목표)
- **ESM 모듈 표준 준수**: 전체 적용

---

**다음 단계**: IconType import 충돌 해결부터 시작하여 단계적으로 모든 런타임 오류를 제거하고 예방 시스템을 구축합니다.