# React Router → Next.js Router 마이그레이션 TDD 액션플랜

## 📅 개요
- **목표**: React Router를 Next.js App Router로 100% 전환
- **기간**: 5-6일 (병렬 작업 시 3-4일)
- **방법론**: TDD (Test-Driven Development)
- **원칙**: UI/UX 100% 유지, 점진적 마이그레이션

## 🎯 Phase 1: 테스트 기반 설계 (Day 1)

### 1.1 라우팅 테스트 스펙 작성
```typescript
// __tests__/routing/navigation.test.tsx
describe('Navigation System', () => {
  describe('Page Navigation', () => {
    it('should navigate to login page')
    it('should navigate to dashboard after login')
    it('should handle protected routes')
    it('should preserve query parameters')
  })
  
  describe('Dynamic Routes', () => {
    it('should handle project ID in URL')
    it('should handle feedback project ID')
    it('should handle 404 for invalid routes')
  })
  
  describe('URL Parameters', () => {
    it('should extract project ID from URL')
    it('should handle search parameters')
    it('should maintain state during navigation')
  })
})
```

### 1.2 컴포넌트 테스트 스펙
```typescript
// __tests__/components/navigation/
- Header.test.tsx
- SideBar.test.tsx
- Navigation.test.tsx
```

## 🔧 Phase 2: 코어 마이그레이션 (Day 2-3)

### 2.1 라우터 구조 전환
**작업 순서:**
1. ✅ App Router 구조 완성
2. ✅ Layout 시스템 구축
3. ✅ Middleware 설정
4. ✅ 동적 라우트 처리

**파일 구조:**
```
app/
├── layout.tsx                 # 루트 레이아웃
├── (public)/                  # 공개 페이지 그룹
│   ├── layout.tsx
│   ├── page.tsx               # 홈
│   ├── privacy/page.tsx
│   └── terms/page.tsx
├── (auth)/                    # 인증 페이지 그룹
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── reset-password/page.tsx
│   └── email-check/[token]/page.tsx
└── (dashboard)/               # 대시보드 (보호된 라우트)
    ├── layout.tsx
    ├── page.tsx               # 대시보드 홈
    ├── calendar/page.tsx
    ├── projects/
    │   ├── page.tsx           # 프로젝트 목록
    │   ├── create/page.tsx
    │   └── [id]/
    │       ├── page.tsx       # 프로젝트 상세
    │       └── edit/page.tsx
    └── feedback/
        ├── page.tsx           # 피드백 목록
        └── [projectId]/page.tsx
```

### 2.2 Hook 마이그레이션 매핑
```typescript
// utils/navigation-adapter.ts
import { useRouter as useNextRouter } from 'next/navigation'
import { useParams as useNextParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'

// React Router → Next.js 호환성 레이어
export const useNavigate = () => {
  const router = useNextRouter()
  return (path: string) => router.push(path)
}

export const useParams = useNextParams
export const useLocation = () => {
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  return {
    pathname,
    search: searchParams.toString(),
    state: null
  }
}
```

## 📝 Phase 3: 컴포넌트 마이그레이션 (Day 3-4)

### 3.1 우선순위별 작업 목록

#### 🔴 높음 (Critical) - 즉시 작업
| 컴포넌트 | 현재 상태 | 작업 내용 | 예상 시간 |
|---------|----------|----------|-----------|
| AppRoute.js | React Router Routes | Next.js App Router로 전환 | 4h |
| Header.jsx | Link, useNavigate | Next.js Link로 전환 | 2h |
| SideBar.jsx | useNavigate, useLocation | Next.js hooks로 전환 | 2h |
| Login.jsx | useNavigate, useSearchParams | 인증 플로우 재구성 | 3h |
| ProjectView.jsx | useParams, useNavigate | 동적 라우트 처리 | 2h |

#### 🟡 중간 (Medium) - 단계적 작업
| 컴포넌트 | 현재 상태 | 작업 내용 | 예상 시간 |
|---------|----------|----------|-----------|
| Calendar.jsx | useNavigate, useParams | 날짜 네비게이션 전환 | 2h |
| Feedback.jsx | useParams | 프로젝트 ID 처리 | 2h |
| ProjectCreate.jsx | useNavigate | 폼 제출 후 리다이렉트 | 1h |
| ProjectEdit.jsx | useParams, useNavigate | 수정 플로우 전환 | 2h |

#### 🟢 낮음 (Low) - 후순위 작업
| 컴포넌트 | 현재 상태 | 작업 내용 | 예상 시간 |
|---------|----------|----------|-----------|
| Home.jsx | useNavigate | 정적 페이지 전환 | 1h |
| Privacy.jsx | useNavigate | 정적 페이지 전환 | 30m |
| Terms.jsx | useNavigate | 정적 페이지 전환 | 30m |

### 3.2 마이그레이션 패턴

#### Before (React Router)
```jsx
// src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }
  
  return (
    <header>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/projects">Projects</Link>
      <button onClick={handleLogout}>Logout</button>
    </header>
  )
}
```

#### After (Next.js)
```tsx
// components/organisms/Header/Header.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Header = () => {
  const router = useRouter()
  
  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }
  
  return (
    <header>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/projects">Projects</Link>
      <button onClick={handleLogout}>Logout</button>
    </header>
  )
}
```

## 🧪 Phase 4: 테스트 및 검증 (Day 5)

### 4.1 단위 테스트
- [ ] Navigation hooks 테스트
- [ ] Route protection 테스트
- [ ] Dynamic routing 테스트
- [ ] Query parameter 처리 테스트

### 4.2 통합 테스트
- [ ] 전체 네비게이션 플로우
- [ ] 인증 플로우
- [ ] 프로젝트 CRUD 플로우
- [ ] 피드백 시스템 플로우

### 4.3 E2E 테스트
```typescript
// cypress/e2e/navigation.cy.ts
describe('Navigation Flow', () => {
  it('should complete login and navigate to dashboard', () => {
    cy.visit('/login')
    cy.get('[data-testid="email"]').type('test@example.com')
    cy.get('[data-testid="password"]').type('password')
    cy.get('[data-testid="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

## 🚀 Phase 5: 배포 및 마무리 (Day 6)

### 5.1 최종 체크리스트
- [ ] React Router 의존성 제거
- [ ] 모든 import 경로 업데이트
- [ ] 빌드 에러 해결
- [ ] SSR/SSG 최적화
- [ ] 성능 테스트
- [ ] 프로덕션 배포

### 5.2 롤백 계획
- Git 브랜치 전략 사용
- 기능별 feature flag 구현
- 점진적 배포 (Canary deployment)

## 📊 성공 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| 빌드 성공률 | 100% | `npm run build` 성공 |
| 테스트 통과율 | 100% | Jest, Cypress 전체 통과 |
| SSR 에러 | 0개 | 콘솔 에러 없음 |
| 라우팅 성능 | <100ms | 페이지 전환 시간 |
| UI/UX 일치도 | 100% | 스크린샷 비교 |

## 🔧 도구 및 리소스

### 필수 패키지
```json
{
  "dependencies": {
    "next": "^14.2.31",
    "@types/node": "^20.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "cypress": "^13.0.0"
  }
}
```

### 제거할 패키지
```json
{
  "react-router-dom": "제거",
  "react-router": "제거",
  "@types/react-router-dom": "제거"
}
```

## 🎯 예상 결과

### 개선 사항
1. **SSR 완벽 지원**: 초기 로딩 속도 50% 개선
2. **SEO 최적화**: 검색 엔진 크롤링 가능
3. **코드 분할**: 자동 코드 스플리팅
4. **이미지 최적화**: Next.js Image 컴포넌트 활용
5. **빌드 크기 감소**: ~20% 번들 사이즈 감소

### 유지 사항
1. **UI/UX**: 100% 동일한 사용자 경험
2. **기능**: 모든 기능 정상 작동
3. **데이터 플로우**: Redux 상태 관리 유지

---

**작성일**: 2025-08-16
**버전**: 1.0.0
**작성자**: Claude Code Assistant