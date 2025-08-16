# 레거시 페이지 마이그레이션 액션플랜

## 📅 개요
- **목표**: src/pages 레거시 페이지를 Next.js App Router로 완전 전환
- **기간**: 2-3일 (병렬 작업)
- **방법론**: 점진적 마이그레이션, 기능별 그룹화
- **원칙**: UI/UX 100% 유지, 기능 동등성 보장

## 🎯 현황 분석

### 레거시 페이지 구조 (19개 파일)
```
src/pages/
├── User/ (4개)
│   ├── Login.jsx      → app/(auth)/login/page.tsx ✅ (완료)
│   ├── Signup.jsx     → app/(auth)/signup/page.tsx
│   ├── ResetPw.jsx    → app/(auth)/reset-password/page.tsx
│   └── EmailCheck.jsx → app/(auth)/email-check/[token]/page.tsx
├── Cms/ (8개)
│   ├── Calendar.jsx      → app/(dashboard)/calendar/page.tsx
│   ├── CmsHome.jsx       → app/(dashboard)/page.tsx
│   ├── Elearning.jsx     → app/(dashboard)/elearning/page.tsx
│   ├── Feedback.jsx      → app/(dashboard)/feedback/[projectId]/page.tsx
│   ├── FeedbackAll.jsx   → app/(dashboard)/feedback/page.tsx
│   ├── ProjectCreate.jsx → app/(dashboard)/projects/create/page.tsx
│   ├── ProjectEdit.jsx   → app/(dashboard)/projects/[id]/edit/page.tsx
│   └── ProjectView.jsx   → app/(dashboard)/projects/[id]/page.tsx
└── Root/ (3개)
    ├── Home.jsx     → app/page.tsx
    ├── Privacy.jsx  → app/privacy/page.tsx
    └── Terms.jsx    → app/terms/page.tsx
```

## 🔧 마이그레이션 전략

### Phase 1: 우선순위 분류 (Day 1)

#### 🔴 Critical (즉시 마이그레이션)
| 페이지 | 현재 위치 | 목표 위치 | 복잡도 | 시간 |
|--------|----------|----------|--------|------|
| Signup.jsx | src/pages/User | app/(auth)/signup | 중간 | 2h |
| CmsHome.jsx | src/pages/Cms | app/(dashboard) | 높음 | 3h |
| ProjectView.jsx | src/pages/Cms | app/(dashboard)/projects/[id] | 높음 | 3h |

#### 🟡 Medium (단계적 마이그레이션)
| 페이지 | 현재 위치 | 목표 위치 | 복잡도 | 시간 |
|--------|----------|----------|--------|------|
| Calendar.jsx | src/pages/Cms | app/(dashboard)/calendar | 높음 | 3h |
| Feedback.jsx | src/pages/Cms | app/(dashboard)/feedback/[projectId] | 중간 | 2h |
| ProjectCreate.jsx | src/pages/Cms | app/(dashboard)/projects/create | 중간 | 2h |
| ProjectEdit.jsx | src/pages/Cms | app/(dashboard)/projects/[id]/edit | 중간 | 2h |

#### 🟢 Low (후순위)
| 페이지 | 현재 위치 | 목표 위치 | 복잡도 | 시간 |
|--------|----------|----------|--------|------|
| ResetPw.jsx | src/pages/User | app/(auth)/reset-password | 낮음 | 1h |
| EmailCheck.jsx | src/pages/User | app/(auth)/email-check/[token] | 낮음 | 1h |
| Home.jsx | src/pages | app | 낮음 | 30m |
| Privacy.jsx | src/pages | app/privacy | 낮음 | 30m |
| Terms.jsx | src/pages | app/terms | 낮음 | 30m |

### Phase 2: 마이그레이션 패턴 (Day 1-2)

#### 기본 변환 패턴
```typescript
// Before (React Router)
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

// After (Next.js)
'use client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
```

#### 동적 라우트 처리
```typescript
// Before: /ProjectView/:id
// After: app/(dashboard)/projects/[id]/page.tsx

export default function ProjectViewPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // 구현
}
```

#### 레이아웃 구조
```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <SideBar />
        <main>{children}</main>
      </div>
    </div>
  )
}
```

### Phase 3: 병렬 작업 분배 (Day 2)

#### Team A: 인증 페이지
- [ ] Signup.jsx → TypeScript 전환
- [ ] ResetPw.jsx → TypeScript 전환
- [ ] EmailCheck.jsx → TypeScript 전환
- [ ] 인증 플로우 통합 테스트

#### Team B: 대시보드 페이지
- [ ] CmsHome.jsx → TypeScript 전환
- [ ] Calendar.jsx → TypeScript 전환
- [ ] Elearning.jsx → TypeScript 전환
- [ ] 대시보드 레이아웃 구성

#### Team C: 프로젝트 관리
- [ ] ProjectView.jsx → TypeScript 전환
- [ ] ProjectCreate.jsx → TypeScript 전환
- [ ] ProjectEdit.jsx → TypeScript 전환
- [ ] 프로젝트 CRUD 플로우 테스트

#### Team D: 피드백 & 정적 페이지
- [ ] Feedback.jsx → TypeScript 전환
- [ ] FeedbackAll.jsx → TypeScript 전환
- [ ] Home, Privacy, Terms → TypeScript 전환

### Phase 4: React Router 제거 (Day 2-3)

#### 의존성 정리
```bash
# 제거할 패키지
npm uninstall react-router-dom
npm uninstall @types/react-router-dom

# 확인
npm ls react-router
```

#### Import 변경 스크립트
```javascript
// scripts/migrate-imports.js
const replaceImports = {
  'react-router-dom': '@/utils/navigation-adapter',
  'useNavigate': 'useRouter',
  'Link': 'Link from next/link'
}
```

### Phase 5: 통합 테스트 (Day 3)

#### 테스트 체크리스트
- [ ] 모든 페이지 접근 가능 확인
- [ ] 동적 라우트 파라미터 전달 확인
- [ ] 인증 플로우 작동 확인
- [ ] 네비게이션 전환 확인
- [ ] SEO 메타 태그 확인
- [ ] 404 페이지 처리 확인

#### E2E 테스트 시나리오
```typescript
// cypress/e2e/migration.cy.ts
describe('Legacy Migration', () => {
  it('should navigate through all pages', () => {
    // 로그인 → 대시보드 → 프로젝트 → 피드백
  })
  
  it('should handle dynamic routes', () => {
    // /projects/123 접근 확인
  })
  
  it('should maintain authentication', () => {
    // 보호된 라우트 접근 테스트
  })
})
```

## 📊 성공 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| 페이지 마이그레이션 | 19/19 | 완료된 페이지 수 |
| TypeScript 적용 | 100% | .tsx 파일 비율 |
| 테스트 커버리지 | 80%+ | Jest coverage |
| 빌드 에러 | 0 | npm run build |
| React Router 의존성 | 0 | package.json 확인 |
| SSR 경고 | 0 | 빌드 로그 확인 |

## 🚀 Vercel 배포 준비

### 환경 변수 설정
```env
NEXT_PUBLIC_API_URL=https://api.videoplanet.com
NEXT_PUBLIC_WS_URL=wss://ws.videoplanet.com
```

### vercel.json 설정
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "app/api/*": {
      "maxDuration": 30
    }
  }
}
```

### 배포 스크립트
```bash
# 배포 전 체크리스트
npm run lint
npm run test
npm run build

# Vercel CLI 배포
vercel --prod
```

## 🔍 환각 현상 검증 계획

### 검증 항목
1. **파일 존재 여부**
   - 모든 마이그레이션된 파일 실제 존재 확인
   - import 경로 정확성 검증

2. **기능 동등성**
   - 레거시 페이지와 새 페이지 기능 비교
   - API 호출 정상 작동 확인

3. **UI/UX 일치도**
   - 스크린샷 비교 테스트
   - 스타일 일관성 확인

4. **성능 지표**
   - 페이지 로딩 시간 측정
   - 번들 크기 비교

## 📅 타임라인

### Day 1 (8시간)
- 09:00-11:00: 우선순위 페이지 분석
- 11:00-13:00: Critical 페이지 마이그레이션 시작
- 14:00-17:00: TypeScript 전환 작업
- 17:00-18:00: 일일 테스트 및 검증

### Day 2 (8시간)
- 09:00-12:00: Medium 페이지 마이그레이션
- 12:00-14:00: React Router 의존성 제거
- 14:00-17:00: 통합 테스트 작성
- 17:00-18:00: 빌드 및 검증

### Day 3 (4시간)
- 09:00-11:00: Vercel 배포 설정
- 11:00-12:00: 최종 테스트
- 12:00-13:00: 환각 현상 검증

---

**작성일**: 2025-08-16
**버전**: 1.0.0
**작성자**: Claude Code Assistant