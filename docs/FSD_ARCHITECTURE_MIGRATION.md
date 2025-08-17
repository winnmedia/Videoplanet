# 🏗️ FSD + Clean Architecture 마이그레이션 가이드

> VideoPlanet 프로젝트를 Feature-Sliced Design + Clean Architecture로 전환하는 종합 가이드

## 📋 목차
1. [현재 상태 분석](#1-현재-상태-분석)
2. [목표 아키텍처](#2-목표-아키텍처)
3. [마이그레이션 전략](#3-마이그레이션-전략)
4. [폴더 구조 매핑](#4-폴더-구조-매핑)
5. [단계별 실행 계획](#5-단계별-실행-계획)
6. [코드 예시](#6-코드-예시)
7. [체크리스트](#7-체크리스트)

---

## 1. 현재 상태 분석

### 현재 구조의 강점
- ✅ features 폴더로 도메인 분리 시작됨
- ✅ components에 Atomic Design 적용
- ✅ lib/api/client.ts로 API 통합
- ✅ TypeScript 전면 도입

### 개선 필요 사항
- ❌ 레이어 간 의존성 규칙 부재
- ❌ Public API (배럴 익스포트) 미흡
- ❌ 도메인 로직과 UI 로직 혼재
- ❌ 스타일링 방식 혼재 (SCSS Modules + Styled Components + AntD)

---

## 2. 목표 아키텍처

### 레이어 구조 (상→하 의존만 허용)
```
app        → 전역 부트스트랩 (Providers, 라우팅, 에러 경계)
   ↓
processes  → 다중 페이지/피처 복합 플로우 (온보딩, 체크아웃)
   ↓
pages      → 라우트 단위 조립 (Next.js app 라우트와 1:1)
   ↓
widgets    → 페이지를 구성하는 큰 블록 (헤더, 사이드바)
   ↓
features   → 사용자 행동 단위 (로그인, 댓글, 프로젝트 생성)
   ↓
entities   → 도메인 모델 (User, Project, Feedback)
   ↓
shared     → 완전 범용 (UI Kit, Utils, API Client)
```

### 새로운 폴더 구조
```
src/
├── app/                          # Next.js App Router (유지)
│   └── providers/                # Redux, Query, Theme, ErrorBoundary
│
├── processes/                    # [신규] 복합 플로우
│   ├── onboarding/              # 회원가입 → 프로젝트 생성 → 투어
│   └── project-setup/           # 프로젝트 초기 설정 플로우
│
├── pages/                        # [신규] 페이지 조립 레이어
│   ├── dashboard/
│   ├── projects/
│   └── feedback/
│
├── widgets/                      # [신규] 페이지 블록
│   ├── sidebar/
│   │   ├── index.ts             # Public API
│   │   ├── ui/
│   │   └── model/
│   ├── header/
│   └── project-stats/
│
├── features/                     # [개선] 사용자 행동 단위
│   ├── auth/
│   │   ├── sign-in/
│   │   │   ├── index.ts        # Public API
│   │   │   ├── ui/             # 컴포넌트
│   │   │   ├── model/          # 훅, 상태, 로직
│   │   │   └── api/            # API 호출
│   │   └── sign-up/
│   ├── projects/
│   │   ├── create/
│   │   ├── edit/
│   │   └── delete/
│   └── feedback/
│       ├── submit/
│       └── view/
│
├── entities/                     # [신규] 도메인 모델
│   ├── user/
│   │   ├── index.ts
│   │   ├── model/              # Redux slice, selectors
│   │   ├── api/                # RTK Query or Axios
│   │   └── lib/                # normalizers, validators
│   ├── project/
│   └── feedback/
│
└── shared/                       # [통합] 완전 범용
    ├── ui/                      # components/atoms → 여기로
    │   ├── button/
    │   ├── input/
    │   └── layout/
    ├── api/
    │   ├── client.ts           # lib/api/client.ts → 여기로
    │   └── baseApi.ts          # RTK Query base
    ├── lib/                    # lib/utils → 여기로
    │   ├── date/
    │   └── validation/
    ├── config/                 # lib/config.ts → 여기로
    └── types/
```

---

## 3. 마이그레이션 전략

### 3.1 핵심 원칙
1. **무중단 전환**: 기존 코드와 새 구조 공존
2. **점진적 이관**: 새 기능부터 FSD 적용
3. **자동화 우선**: 린트, 경로 별칭으로 규칙 강제

### 3.2 기존 → 새 구조 매핑

| 현재 위치 | 새 위치 | 이유 |
|---------|--------|------|
| `components/atoms/*` | `shared/ui/*` | 도메인 독립적 UI |
| `components/molecules/*` | `shared/ui/*` 또는 `widgets/*` | 복잡도에 따라 |
| `components/organisms/Sidebar` | `widgets/sidebar` | 페이지 블록 |
| `features/auth/api` | `entities/user/api` | 도메인 데이터 |
| `features/auth/hooks` | `features/auth/sign-in/model` | 행동별 분리 |
| `lib/api/client.ts` | `shared/api/client.ts` | 공용 인프라 |
| `lib/config.ts` | `shared/config/env.ts` | 환경 설정 |

---

## 4. 폴더 구조 매핑

### 4.1 TypeScript 경로 별칭 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["app/*"],
      "@processes/*": ["src/processes/*"],
      "@pages/*": ["src/pages/*"],
      "@widgets/*": ["src/widgets/*"],
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

### 4.2 ESLint 경계 규칙
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['boundaries'],
  extends: ['plugin:boundaries/recommended'],
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'app/*' },
      { type: 'processes', pattern: 'src/processes/*' },
      { type: 'pages', pattern: 'src/pages/*' },
      { type: 'widgets', pattern: 'src/widgets/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'entities', pattern: 'src/entities/*' },
      { type: 'shared', pattern: 'src/shared/*' },
    ],
    'boundaries/ignore': ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['processes', 'pages', 'widgets', 'features', 'entities', 'shared'] },
          { from: 'processes', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
          { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
          { from: 'widgets', allow: ['features', 'entities', 'shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared', allow: ['shared'] },
        ],
      },
    ],
  },
};
```

---

## 5. 단계별 실행 계획

### Phase 1: 기초 설정 (Day 0-1)
```bash
# 1. 새 폴더 구조 생성
mkdir -p src/{processes,pages,widgets,entities,shared}/{ui,api,lib,config,types}

# 2. 의존성 설치
npm install --save-dev eslint-plugin-boundaries madge

# 3. tsconfig.json paths 설정
# 4. .eslintrc.js boundaries 설정
# 5. package.json 스크립트 추가
```

**package.json 스크립트**:
```json
{
  "scripts": {
    "lint:arch": "eslint . --ext .ts,.tsx --rule 'boundaries/element-types: error'",
    "check:circular": "madge --circular --extensions ts,tsx ./src",
    "migrate:check": "node scripts/migration-check.js"
  }
}
```

### Phase 2: 공용 레이어 이관 (Week 1)

#### shared 레이어 구축
```typescript
// 1. API Client 이관
// lib/api/client.ts → src/shared/api/client.ts

// 2. 환경 설정 이관
// lib/config.ts → src/shared/config/env.ts

// 3. UI 컴포넌트 이관
// components/atoms/Button → src/shared/ui/button
// components/atoms/Input → src/shared/ui/input

// 4. Public API 생성
// src/shared/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Layout } from './layout';
```

### Phase 3: 도메인 레이어 구축 (Week 2)

#### entities 레이어 구축
```typescript
// src/entities/user/model/user.slice.ts
import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: { /* ... */ },
  reducers: { /* ... */ }
});

// src/entities/user/api/user.api.ts
import { api } from '@shared/api';

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// src/entities/user/index.ts (Public API)
export { userSlice, userSelectors } from './model';
export { userApi } from './api';
export type { User, UserProfile } from './types';
```

### Phase 4: 기능 레이어 리팩토링 (Week 3)

#### features 레이어 개선
```typescript
// src/features/auth/sign-in/ui/SignInForm.tsx
import { Button, Input } from '@shared/ui';
import { useSignIn } from '../model/useSignIn';

export const SignInForm = () => {
  const { submit, isLoading } = useSignIn();
  // ...
};

// src/features/auth/sign-in/model/useSignIn.ts
import { userApi } from '@entities/user';
import { useAppDispatch } from '@shared/lib';

export const useSignIn = () => {
  // 로그인 로직
};

// src/features/auth/sign-in/index.ts (Public API)
export { SignInForm } from './ui/SignInForm';
export { useSignIn } from './model/useSignIn';
```

### Phase 5: 위젯 레이어 구축 (Week 4)

#### widgets 레이어 구축
```typescript
// src/widgets/sidebar/ui/Sidebar.tsx
import { NavItem } from '@shared/ui';
import { useProjects } from '@features/projects/list';

export const Sidebar = () => {
  const { projects } = useProjects();
  // 사이드바 렌더링
};

// src/widgets/sidebar/index.ts
export { Sidebar } from './ui/Sidebar';
export { useSidebar } from './model/useSidebar';
```

---

## 6. 코드 예시

### 6.1 완성된 페이지 조립 예시
```typescript
// app/(main)/dashboard/page.tsx
import { DashboardPage } from '@pages/dashboard';

export default function Dashboard() {
  return <DashboardPage />;
}

// src/pages/dashboard/ui/DashboardPage.tsx
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { ProjectStats } from '@widgets/project-stats';
import { RecentFeedback } from '@features/feedback/recent';

export const DashboardPage = () => {
  return (
    <div>
      <Header />
      <Sidebar />
      <main>
        <ProjectStats />
        <RecentFeedback />
      </main>
    </div>
  );
};
```

### 6.2 의존성 규칙 예시
```typescript
// ✅ 올바른 의존성
// features → entities → shared
import { userApi } from '@entities/user';
import { Button } from '@shared/ui';

// ❌ 잘못된 의존성
// entities → features (상향 의존)
import { SignInForm } from '@features/auth/sign-in';

// ❌ 내부 파일 직접 접근
import { Button } from '@shared/ui/button/Button.tsx';
```

---

## 7. 체크리스트

### 7.1 Day 0-1: 기초 설정
- [ ] src 폴더 구조 생성
- [ ] tsconfig.json paths 설정
- [ ] ESLint boundaries 플러그인 설치 및 설정
- [ ] package.json 아키텍처 검증 스크립트 추가
- [ ] ARCHITECTURE.md 문서 작성

### 7.2 Week 1: shared 레이어
- [ ] lib → shared 이관 시작
- [ ] components/atoms → shared/ui 이관
- [ ] API client 통합 및 이관
- [ ] 디자인 토큰 CSS 변수화
- [ ] Public API (index.ts) 생성

### 7.3 Week 2: entities 레이어
- [ ] user entity 구축
- [ ] project entity 구축
- [ ] feedback entity 구축
- [ ] Redux slices 이관
- [ ] API 레이어 분리

### 7.4 Week 3: features 리팩토링
- [ ] auth features 분리 (sign-in, sign-up, reset)
- [ ] projects features 분리 (create, edit, delete)
- [ ] feedback features 분리 (submit, view, edit)
- [ ] 각 feature에 Public API 추가
- [ ] model/ui/api 폴더 구조 통일

### 7.5 Week 4: widgets & pages
- [ ] Sidebar → widgets/sidebar
- [ ] Header → widgets/header
- [ ] 대시보드 위젯 분리
- [ ] pages 레이어 구축
- [ ] processes 레이어 (온보딩 등) 구축

### 7.6 검증 및 강화
- [ ] 순환 의존성 검사 (madge)
- [ ] 경계 규칙 위반 검사
- [ ] 테스트 커버리지 확인
- [ ] 성능 메트릭 측정
- [ ] 팀 교육 및 문서화

---

## 8. 성공 지표

### 정량적 지표
- PR당 평균 변경 파일 수: 50% 감소
- 빌드 시간: 20% 단축
- 번들 크기: 15% 감소
- 테스트 실행 시간: 30% 단축

### 정성적 지표
- 신규 개발자 온보딩 시간 단축
- "이 코드 어디에 넣어야 해요?" 질문 감소
- 기능 간 충돌 및 회귀 버그 감소
- 코드 리뷰 시간 단축

---

## 9. 마이그레이션 스크립트

### 자동 이관 도구
```javascript
// scripts/migrate-component.js
const fs = require('fs');
const path = require('path');

function migrateComponent(from, to) {
  // 1. 파일 복사
  // 2. import 경로 수정
  // 3. Public API 생성
  // 4. 기존 파일에 deprecation 경고 추가
}

// 사용법
// node scripts/migrate-component.js components/atoms/Button shared/ui/button
```

---

## 10. FAQ

### Q: 기존 코드는 언제까지 유지하나요?
A: 3개월 전환 기간 후 제거. deprecation 경고로 점진적 유도.

### Q: 스타일링은 어떻게 통일하나요?
A: SCSS Modules를 주력으로, AntD는 wrapper 컴포넌트로 격리.

### Q: 테스트는 어디에 두나요?
A: 각 레이어 폴더 내 `__tests__` 폴더 또는 `*.test.ts` 파일.

### Q: 모든 컴포넌트를 이관해야 하나요?
A: 새 기능부터 FSD 적용, 기존 코드는 점진적 이관.

---

## 부록: 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [Clean Architecture in Frontend](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Boundaries ESLint Plugin](https://github.com/patricklafrance/eslint-plugin-boundaries)
- [Madge - Circular Dependencies](https://github.com/pahen/madge)

---

**작성일**: 2025-08-18  
**버전**: 1.0.0  
**작성자**: VideoPlanet Architecture Team