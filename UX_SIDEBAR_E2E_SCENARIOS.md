# VideoPlanet 서브메뉴 E2E 테스트 시나리오

## 개요

**문서 버전**: 1.0.0
**작성일**: 2025-08-24
**작성자**: Eleanor (UX Lead)
**프레임워크**: Playwright / Cypress
**커버리지 목표**: 100% 핵심 플로우

## 테스트 매트릭스

| 카테고리 | 시나리오 수 | 우선순위 | 자동화 상태 |
|---------|------------|---------|------------|
| 기본 네비게이션 | 8 | P0 | 준비 |
| 서브메뉴 인터랙션 | 10 | P0 | 준비 |
| 접근성 | 12 | P0 | 준비 |
| 모바일 반응형 | 8 | P1 | 준비 |
| 에러 처리 | 5 | P1 | 준비 |
| 성능 | 4 | P2 | 준비 |

## 1. 기본 네비게이션 시나리오

### Scenario 1.1: 메인 메뉴 네비게이션
```gherkin
Feature: 메인 메뉴 네비게이션
  As a 로그인된 사용자
  I want to 메인 메뉴를 통해 페이지 이동
  So that 원하는 기능에 빠르게 접근할 수 있다

  Background:
    Given 사용자가 로그인되어 있고
    And 대시보드 페이지에 있음

  Scenario: 홈 메뉴 클릭
    When "홈" 메뉴를 클릭
    Then 대시보드 페이지로 이동
    And "홈" 메뉴가 활성화 상태로 표시
    And URL이 "/dashboard"로 변경됨

  Scenario: 전체 일정 메뉴 클릭
    When "전체 일정" 메뉴를 클릭
    Then 일정 페이지로 이동
    And "전체 일정" 메뉴가 활성화 상태로 표시
    And URL이 "/planning"으로 변경됨

  Scenario: 프로젝트 관리 메뉴 클릭
    When "프로젝트 관리" 메뉴를 클릭
    Then 서브메뉴가 300ms 내에 슬라이드 인
    And 프로젝트 목록이 표시됨
    And 메뉴 옆 배지에 프로젝트 수가 표시됨
```

### Scenario 1.2: 활성 메뉴 표시
```gherkin
Feature: 활성 메뉴 자동 감지
  
  Scenario: URL 기반 메뉴 활성화
    Given 사용자가 "/projects/1" 페이지에 직접 접속
    When 페이지가 로드되면
    Then "프로젝트 관리" 메뉴가 활성화 상태
    And 프로젝트 서브메뉴가 자동으로 열림
    And 해당 프로젝트가 서브메뉴에서 하이라이트됨
```

## 2. 서브메뉴 인터랙션 시나리오

### Scenario 2.1: 서브메뉴 토글
```gherkin
Feature: 서브메뉴 토글 동작

  Scenario: 서브메뉴 열기
    Given 서브메뉴가 닫혀있는 상태
    When "프로젝트 관리" 메뉴를 클릭
    Then 서브메뉴가 오른쪽에서 슬라이드 인
    And 애니메이션이 0.5초 내에 완료
    And 서브메뉴 제목이 "프로젝트 관리"로 표시
    And 닫기 버튼(X)이 표시됨

  Scenario: 서브메뉴 닫기 - X 버튼
    Given 프로젝트 서브메뉴가 열려있는 상태
    When 서브메뉴의 X 버튼을 클릭
    Then 서브메뉴가 슬라이드 아웃
    And 메인 콘텐츠 영역이 확장됨

  Scenario: 서브메뉴 전환
    Given 프로젝트 서브메뉴가 열려있는 상태
    When "영상 피드백" 메뉴를 클릭
    Then 프로젝트 서브메뉴가 닫히고
    And 피드백 서브메뉴가 열림
    And 전환 애니메이션이 부드럽게 진행됨
```

### Scenario 2.2: 서브메뉴 내 네비게이션
```gherkin
Feature: 서브메뉴 항목 선택

  Scenario: 프로젝트 선택
    Given 프로젝트 서브메뉴가 열려있고
    And 3개의 프로젝트가 목록에 있음
    When 두 번째 프로젝트를 클릭
    Then 해당 프로젝트 페이지로 이동
    And URL이 "/projects/2"로 변경
    And 서브메뉴는 열린 상태 유지
    And 선택된 프로젝트가 하이라이트됨

  Scenario: 새 프로젝트 추가
    Given 프로젝트 서브메뉴가 열려있음
    When "+" 버튼을 클릭
    Then 프로젝트 생성 페이지로 이동
    And URL이 "/projects/create"로 변경
```

### Scenario 2.3: 빈 상태 처리
```gherkin
Feature: 빈 서브메뉴 상태

  Scenario: 프로젝트가 없을 때
    Given 등록된 프로젝트가 0개
    When "프로젝트 관리" 메뉴를 클릭
    Then 서브메뉴에 빈 상태 메시지 표시
    And "등록된 프로젝트가 없습니다" 텍스트 표시
    And "프로젝트 등록" CTA 버튼 표시
    
  Scenario: 빈 상태에서 CTA 클릭
    Given 프로젝트 빈 상태가 표시됨
    When "프로젝트 등록" 버튼 클릭
    Then 프로젝트 생성 페이지로 이동
```

## 3. 접근성 시나리오

### Scenario 3.1: 키보드 네비게이션
```gherkin
Feature: 키보드로 메뉴 탐색

  Background:
    Given 키보드만 사용하는 사용자

  Scenario: Tab 키로 메뉴 이동
    When Tab 키를 누름
    Then 첫 번째 메뉴 아이템("홈")에 포커스
    And 포커스 링이 명확하게 표시됨
    When Tab 키를 다시 누름
    Then 두 번째 메뉴 아이템("전체 일정")에 포커스 이동

  Scenario: 화살표 키로 메뉴 이동
    Given "홈" 메뉴에 포커스가 있음
    When 아래 화살표 키를 누름
    Then "전체 일정" 메뉴로 포커스 이동
    When 위 화살표 키를 누름
    Then "홈" 메뉴로 포커스 복귀

  Scenario: Enter 키로 메뉴 선택
    Given "프로젝트 관리" 메뉴에 포커스
    When Enter 키를 누름
    Then 서브메뉴가 열림
    And 포커스가 서브메뉴 첫 번째 항목으로 이동

  Scenario: Escape 키로 서브메뉴 닫기
    Given 서브메뉴가 열려있고
    And 서브메뉴 내 항목에 포커스
    When Escape 키를 누름
    Then 서브메뉴가 닫힘
    And 포커스가 원래 메뉴 항목으로 복귀

  Scenario: Space 키로 토글
    Given "프로젝트 관리" 메뉴에 포커스
    When Space 키를 누름
    Then 서브메뉴가 토글됨
```

### Scenario 3.2: 스크린 리더 지원
```gherkin
Feature: 스크린 리더 호환성

  Background:
    Given 스크린 리더(NVDA/JAWS)가 활성화됨

  Scenario: 메뉴 구조 안내
    When 사이드바 영역에 진입
    Then "주 메뉴, 5개 항목" 안내가 읽힘
    When "프로젝트 관리" 메뉴에 포커스
    Then "프로젝트 관리, 메뉴 항목, 서브메뉴 있음, 3개 프로젝트" 읽힘

  Scenario: 상태 변경 안내
    When "프로젝트 관리" 메뉴 선택
    Then "프로젝트 관리 서브메뉴 열림" 안내
    When 서브메뉴 닫기
    Then "서브메뉴 닫힘" 안내

  Scenario: 활성 페이지 안내
    Given "/dashboard" 페이지에 있음
    When 메뉴 영역 탐색
    Then "홈, 현재 페이지" 안내가 읽힘

  Scenario: 배지 정보 읽기
    When "프로젝트 관리" 메뉴에 포커스
    Then "프로젝트 관리, 3개" 읽힘
```

### Scenario 3.3: 포커스 관리
```gherkin
Feature: 포커스 트랩 및 복원

  Scenario: 서브메뉴 포커스 트랩
    Given 서브메뉴가 열려있음
    When Tab 키를 반복해서 누름
    Then 포커스가 서브메뉴 내에서만 순환
    And 메인 콘텐츠로 포커스가 이동하지 않음

  Scenario: 포커스 복원
    Given 서브메뉴에서 프로젝트 선택
    When 페이지 이동 후 브라우저 뒤로가기
    Then 포커스가 이전에 선택한 메뉴 항목으로 복원

  Scenario: 모달 포커스
    Given 로그아웃 확인 모달이 열림
    When Tab 키를 누름
    Then 포커스가 모달 내에서만 이동
    When 모달을 닫음
    Then 포커스가 로그아웃 버튼으로 복원
```

## 4. 모바일 반응형 시나리오

### Scenario 4.1: 모바일 메뉴 토글
```gherkin
Feature: 모바일 네비게이션

  Background:
    Given 화면 너비가 768px 이하

  Scenario: 햄버거 메뉴 표시
    When 페이지 로드
    Then 햄버거 메뉴 버튼이 상단 왼쪽에 표시
    And 사이드바는 화면 밖에 숨겨짐

  Scenario: 메뉴 열기
    When 햄버거 메뉴를 탭
    Then 사이드바가 왼쪽에서 슬라이드 인
    And 오버레이가 콘텐츠 위에 표시
    And 스크롤이 비활성화됨

  Scenario: 메뉴 닫기 - 오버레이
    Given 모바일 메뉴가 열려있음
    When 오버레이를 탭
    Then 사이드바가 슬라이드 아웃
    And 오버레이가 사라짐
    And 스크롤이 다시 활성화됨

  Scenario: 서브메뉴 전체화면
    Given 모바일 메뉴가 열려있음
    When "프로젝트 관리"를 탭
    Then 서브메뉴가 전체화면으로 표시
    And 뒤로가기 버튼이 표시됨
```

### Scenario 4.2: 터치 제스처
```gherkin
Feature: 터치 인터랙션

  Scenario: 스와이프로 메뉴 열기
    Given 모바일 화면
    When 왼쪽 가장자리에서 오른쪽으로 스와이프
    Then 사이드바가 열림

  Scenario: 스와이프로 메뉴 닫기
    Given 모바일 메뉴가 열려있음
    When 오른쪽에서 왼쪽으로 스와이프
    Then 사이드바가 닫힘

  Scenario: 긴 터치로 컨텍스트 메뉴
    Given 프로젝트 목록이 표시됨
    When 프로젝트 항목을 길게 누름
    Then 컨텍스트 메뉴가 표시됨
    And "편집", "삭제" 옵션이 표시됨
```

### Scenario 4.3: 반응형 레이아웃
```gherkin
Feature: 화면 크기별 레이아웃

  Scenario: 데스크톱 → 모바일 전환
    Given 데스크톱 화면(1920px)에서 시작
    When 브라우저 창을 768px로 축소
    Then 사이드바가 자동으로 숨겨짐
    And 햄버거 메뉴가 나타남
    And 레이아웃이 재구성됨

  Scenario: 모바일 → 데스크톱 전환
    Given 모바일 화면(375px)에서 시작
    When 브라우저 창을 1024px로 확대
    Then 햄버거 메뉴가 사라짐
    And 사이드바가 고정 위치에 표시
    And 서브메뉴가 원래 스타일로 복원
```

## 5. 에러 처리 시나리오

### Scenario 5.1: 네트워크 에러
```gherkin
Feature: 네트워크 장애 처리

  Scenario: 프로젝트 로딩 실패
    Given 네트워크가 불안정한 상태
    When "프로젝트 관리" 메뉴 클릭
    Then 로딩 스피너가 표시됨
    When 3초 후 타임아웃
    Then "프로젝트를 불러올 수 없습니다" 메시지 표시
    And "다시 시도" 버튼 표시

  Scenario: 재시도 성공
    Given 프로젝트 로딩 실패 상태
    When "다시 시도" 버튼 클릭
    And 네트워크가 정상 복구됨
    Then 프로젝트 목록이 성공적으로 로드됨
```

### Scenario 5.2: 권한 에러
```gherkin
Feature: 접근 권한 처리

  Scenario: 권한 없는 메뉴 접근
    Given 일반 사용자 권한
    When 관리자 전용 메뉴 클릭 시도
    Then "접근 권한이 없습니다" 토스트 표시
    And 메뉴가 비활성화 상태로 표시

  Scenario: 세션 만료
    Given 30분 이상 비활성 상태
    When 메뉴 클릭 시도
    Then "세션이 만료되었습니다" 알림
    And 로그인 페이지로 리다이렉트
```

## 6. 성능 시나리오

### Scenario 6.1: 로딩 성능
```gherkin
Feature: 빠른 응답성

  Scenario: 초기 렌더링
    When 페이지 최초 로드
    Then 사이드바가 100ms 내에 표시
    And 메뉴 항목이 순차적으로 페이드인

  Scenario: 서브메뉴 응답
    When 서브메뉴 토글
    Then 16ms 내에 애니메이션 시작
    And 300ms 내에 완료
    And 60fps 유지
```

### Scenario 6.2: 메모리 관리
```gherkin
Feature: 리소스 최적화

  Scenario: 장시간 사용
    Given 1시간 동안 연속 사용
    When 메모리 사용량 체크
    Then 초기 대비 10% 이내 증가
    And 메모리 누수 없음

  Scenario: 대량 데이터
    Given 100개 이상의 프로젝트
    When 프로젝트 서브메뉴 열기
    Then 가상 스크롤 적용
    And 뷰포트 내 항목만 렌더링
```

## 7. 통합 시나리오

### Scenario 7.1: 전체 워크플로우
```gherkin
Feature: End-to-End 사용자 여정

  Scenario: 신규 프로젝트 생성 플로우
    Given 로그인된 사용자
    When 대시보드에서 시작
    And "프로젝트 관리" 메뉴 클릭
    And 서브메뉴의 "+" 버튼 클릭
    And 프로젝트 정보 입력
    And "생성" 버튼 클릭
    Then 새 프로젝트가 서브메뉴에 추가됨
    And 프로젝트 수 배지가 업데이트됨
    And 생성된 프로젝트 페이지로 이동

  Scenario: 멀티태스킹 플로우
    Given 프로젝트 A를 작업 중
    When "영상 피드백" 메뉴로 전환
    And 피드백 확인 후
    And 브라우저 뒤로가기
    Then 이전 프로젝트 A 페이지로 복귀
    And 서브메뉴 상태가 유지됨
```

## 8. 테스트 자동화 코드

### Playwright 예제
```typescript
// tests/sidebar.spec.ts
import { test, expect } from '@playwright/test'

test.describe('SideBar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 및 대시보드 이동
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('메인 메뉴 네비게이션', async ({ page }) => {
    // 홈 메뉴 테스트
    const homeMenu = page.getByRole('menuitem', { name: '홈' })
    await expect(homeMenu).toHaveAttribute('aria-current', 'page')
    
    // 전체 일정으로 이동
    await page.getByRole('menuitem', { name: '전체 일정' }).click()
    await expect(page).toHaveURL('/planning')
    
    // 활성 상태 확인
    const planningMenu = page.getByRole('menuitem', { name: '전체 일정' })
    await expect(planningMenu).toHaveClass(/active/)
  })

  test('서브메뉴 토글', async ({ page }) => {
    const projectMenu = page.getByRole('menuitem', { name: '프로젝트 관리' })
    
    // 서브메뉴 열기
    await projectMenu.click()
    const submenu = page.getByRole('region', { name: '프로젝트 관리 서브메뉴' })
    await expect(submenu).toBeVisible()
    await expect(submenu).toHaveAttribute('aria-hidden', 'false')
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(500)
    
    // 서브메뉴 닫기
    await page.getByLabel('서브메뉴 닫기').click()
    await expect(submenu).toHaveAttribute('aria-hidden', 'true')
  })

  test('키보드 네비게이션', async ({ page }) => {
    // Tab 키로 첫 번째 메뉴로 이동
    await page.keyboard.press('Tab')
    const firstMenuItem = page.getByRole('menuitem').first()
    await expect(firstMenuItem).toBeFocused()
    
    // 화살표 키로 이동
    await page.keyboard.press('ArrowDown')
    const secondMenuItem = page.getByRole('menuitem').nth(1)
    await expect(secondMenuItem).toBeFocused()
    
    // Enter로 선택
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/planning')
  })

  test('모바일 반응형', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 햄버거 메뉴 확인
    const hamburger = page.getByLabel('메뉴 열기')
    await expect(hamburger).toBeVisible()
    
    // 메뉴 열기
    await hamburger.click()
    const sidebar = page.getByRole('navigation', { name: '주 메뉴' })
    await expect(sidebar).toBeVisible()
    
    // 오버레이 클릭으로 닫기
    await page.locator('.mobileOverlay').click()
    await expect(sidebar).not.toBeVisible()
  })

  test('접근성 검증', async ({ page }) => {
    // axe-core를 사용한 접근성 테스트
    const results = await page.evaluate(() => {
      return window.axe.run()
    })
    
    expect(results.violations).toHaveLength(0)
  })

  test('성능 측정', async ({ page }) => {
    // 성능 메트릭 수집
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd,
        loadComplete: navigation.loadEventEnd
      }
    })
    
    expect(metrics.domContentLoaded).toBeLessThan(1000)
    expect(metrics.loadComplete).toBeLessThan(2000)
  })
})
```

## 9. 테스트 실행 계획

### 9.1 자동화 전략
- **CI/CD 통합**: GitHub Actions에서 PR마다 실행
- **병렬 실행**: 테스트 시간 단축을 위한 병렬화
- **리포팅**: HTML 리포트 및 스크린샷 저장

### 9.2 테스트 환경
- **브라우저**: Chrome, Firefox, Safari, Edge
- **디바이스**: Desktop, Tablet, Mobile
- **스크린 리더**: NVDA, JAWS, VoiceOver

### 9.3 회귀 테스트
- **일일**: 핵심 시나리오 (P0)
- **주간**: 전체 시나리오
- **릴리즈**: 전체 + 수동 테스트

## 10. 성공 기준

### 10.1 커버리지
- 핵심 플로우: 100%
- 엣지 케이스: 80%
- 접근성: 100%

### 10.2 안정성
- 테스트 성공률: > 98%
- Flaky 테스트: < 2%
- 평균 실행 시간: < 10분

### 10.3 품질 게이트
- 모든 P0 테스트 통과
- 접근성 위반 0건
- 성능 기준 충족

---

**작성자**: Eleanor (UX Lead)
**검토**: QA Team
**승인**: Pending