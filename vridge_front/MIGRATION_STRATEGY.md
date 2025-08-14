# Next.js 14 마이그레이션 전략

## 프로젝트 개요
현재 React 18.2.0 (CRA) 기반 프로젝트를 Next.js 14 App Router로 마이그레이션

## 핵심 원칙
- **UI 100% 동일 유지**: 기존 스타일과 컴포넌트 구조 완전 보존
- **점진적 마이그레이션**: 기능별 단계적 전환
- **성능 최적화**: SSR/SSG 활용한 초기 로딩 성능 개선
- **개발자 경험 향상**: Hot Module Replacement, Fast Refresh 활용

## 현재 프로젝트 분석

### 기술 스택
- **Framework**: React 18.2.0 with Create React App
- **상태관리**: Redux Toolkit 1.9.5 + React Redux 8.1.0
- **라우팅**: React Router DOM 6.11.2
- **UI 라이브러리**: Ant Design 5.5.2
- **스타일링**: 
  - SASS 1.62.1
  - Styled Components 6.1.0
  - CSS Modules (Common.scss)
- **인증**: Google OAuth, Kakao Login
- **HTTP Client**: Axios 1.4.0
- **기타**: Swiper, React DatePicker, Moment.js

### 프로젝트 구조
```
src/
├── api/           # API 호출 함수
├── components/    # 공통 컴포넌트
├── css/          # 페이지별 스타일
├── font/         # 폰트 파일
├── hooks/        # 커스텀 훅
├── images/       # 이미지 자산
├── page/         # 페이지 컴포넌트
├── redux/        # Redux 스토어
├── routes/       # 라우팅 설정
├── tasks/        # 기능별 컴포넌트
└── util/         # 유틸리티 함수
```

### 라우팅 구조
- `/` - 홈
- `/Login`, `/Signup`, `/ResetPw` - 인증
- `/Calendar`, `/CmsHome`, `/Feedback`, `/Elearning` - CMS
- `/ProjectCreate`, `/ProjectEdit/:id`, `/ProjectView/:id` - 프로젝트
- `/Privacy`, `/Terms` - 정책

## 마이그레이션 전략

### Phase 1: 프로젝트 초기화 및 기본 설정

#### 1.1 Next.js 14 프로젝트 생성
```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.0",
    "antd": "^5.5.2",
    "sass": "^1.62.1",
    "styled-components": "^6.1.0",
    "@react-oauth/google": "^0.11.0",
    "axios": "^1.4.0",
    "swiper": "^10.1.0",
    "react-datepicker": "^4.14.1",
    "moment": "^2.29.4",
    "query-string": "^8.1.0",
    "classnames": "^2.3.2",
    "immer": "^10.0.2"
  }
}
```

#### 1.2 디렉토리 구조 설계
```
app/                          # App Router
├── (auth)/                   # 인증 그룹
│   ├── login/
│   ├── signup/
│   └── reset-password/
├── (cms)/                    # CMS 그룹
│   ├── calendar/
│   ├── cms-home/
│   ├── feedback/
│   │   └── [projectId]/
│   ├── elearning/
│   └── project/
│       ├── create/
│       ├── edit/
│       │   └── [projectId]/
│       └── view/
│           └── [projectId]/
├── privacy/
├── terms/
├── layout.tsx               # 루트 레이아웃
├── page.tsx                 # 홈페이지
└── global.scss              # 전역 스타일

components/                   # 기존 컴포넌트 유지
├── Header/
├── SideBar/
├── PageTemplate/
└── LoginIntro/

lib/                         # 유틸리티 및 설정
├── redux/
│   ├── store.ts
│   ├── provider.tsx
│   └── slices/
├── api/
├── hooks/
└── utils/

public/                      # 정적 자산
├── fonts/
└── images/
```

### Phase 2: 핵심 기능 마이그레이션

#### 2.1 Redux SSR 설정
```typescript
// lib/redux/provider.tsx
'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { useRef } from 'react'

export default function ReduxProvider({
  children
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<typeof store>()
  if (!storeRef.current) {
    storeRef.current = store
  }
  return <Provider store={storeRef.current}>{children}</Provider>
}
```

#### 2.2 라우팅 매핑
| React Router | Next.js App Router |
|-------------|-------------------|
| `/Login` | `/login` |
| `/ProjectEdit/:project_id` | `/project/edit/[projectId]` |
| `/Feedback/:project_id` | `/feedback/[projectId]` |
| `*` (404) | `not-found.tsx` |

#### 2.3 스타일 시스템 설정
```typescript
// next.config.js
const nextConfig = {
  compiler: {
    styledComponents: true
  },
  sassOptions: {
    includePaths: ['./styles']
  }
}
```

### Phase 3: 컴포넌트 마이그레이션

#### 3.1 레이아웃 컴포넌트
- `PageTemplate` → `app/layout.tsx`
- `Header`, `SideBar` → Client Components 유지

#### 3.2 페이지 컴포넌트
- Server Components 우선 적용
- 인터랙티브 부분만 Client Components로 분리

#### 3.3 API 라우트
```typescript
// app/api/auth/[...nextauth]/route.ts
// app/api/project/route.ts
// app/api/feedback/route.ts
```

### Phase 4: 최적화 및 성능 개선

#### 4.1 이미지 최적화
- `next/image` 컴포넌트 활용
- 자동 WebP 변환 및 lazy loading

#### 4.2 폰트 최적화
```typescript
// app/layout.tsx
import localFont from 'next/font/local'

const suit = localFont({
  src: './fonts/SUIT-Variable.ttf',
  variable: '--font-suit'
})
```

#### 4.3 코드 스플리팅
- 동적 import 활용
- 라우트 기반 자동 코드 스플리팅

### Phase 5: 배포 및 검증

#### 5.1 환경변수 마이그레이션
- `.env.local` 설정
- `NEXT_PUBLIC_` 프리픽스 적용

#### 5.2 빌드 최적화
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 예상 일정

| Phase | 작업 내용 | 예상 시간 |
|-------|---------|----------|
| 1 | 프로젝트 초기화 | 2시간 |
| 2 | 핵심 기능 설정 | 4시간 |
| 3 | 컴포넌트 마이그레이션 | 8시간 |
| 4 | 최적화 | 4시간 |
| 5 | 테스트 및 배포 | 2시간 |

## 주의사항

### 호환성 이슈
1. **React Router Hooks**: `useNavigate` → `useRouter` 변경
2. **환경변수**: `process.env.REACT_APP_` → `process.env.NEXT_PUBLIC_`
3. **정적 파일**: `public` 폴더 경로 변경

### 유지 사항
1. Ant Design 컴포넌트 및 테마
2. SASS 스타일 구조
3. Redux 상태 관리 로직
4. 모든 UI/UX 디자인

## 성능 개선 예상 지표

| 지표 | 현재 (CRA) | 목표 (Next.js) |
|-----|-----------|---------------|
| FCP | 2.5s | < 1.5s |
| LCP | 3.8s | < 2.5s |
| TTI | 4.2s | < 3.0s |
| Bundle Size | 450KB | < 300KB |

## 다음 단계
1. Next.js 프로젝트 초기화
2. 기본 레이아웃 및 라우팅 구성
3. Redux Provider 설정
4. 첫 번째 페이지 마이그레이션 (Home)