# VideoPlanet 의존성 경계 규칙 (Dependency Boundary Rules)

## 개요
본 문서는 VideoPlanet 프로젝트의 Feature-Sliced Design(FSD) 아키텍처를 준수하기 위한 의존성 규칙을 정의합니다. 모든 개발자는 이 규칙을 반드시 따라야 하며, CI/CD 파이프라인에서 자동으로 검증됩니다.

## 핵심 원칙

### 1. 단방향 의존성 (Unidirectional Dependencies)
```
app → processes → pages → widgets → features → entities → shared
```
- 상위 레이어는 하위 레이어에만 의존할 수 있습니다
- 하위에서 상위로의 의존은 엄격히 금지됩니다
- 같은 레벨의 슬라이스 간 직접 의존은 금지됩니다

### 2. Public API 원칙
- 모든 슬라이스는 `index.ts` 파일을 통해서만 외부에 노출됩니다
- 내부 구현 파일을 직접 import하는 것은 금지됩니다
- 배럴 파일(index.ts)은 명시적으로 공개할 항목만 export합니다

### 3. 도메인 순수성
- `entities` 레이어는 프레임워크 독립적이어야 합니다
- React, Next.js 등 UI 프레임워크 의존성을 가질 수 없습니다
- 순수한 TypeScript/JavaScript로만 구현되어야 합니다

## 레이어별 상세 규칙

### 📱 app 레이어
**책임**: 애플리케이션 진입점, 라우팅, 프로바이더 설정

**허용된 import**:
```typescript
// ✅ 허용
import { ProcessFlow } from '@/processes/checkout';
import { DashboardPage } from '@/pages/dashboard';
import { Header } from '@/widgets/header';
import { AuthFeature } from '@/features/auth';
import { userEntity } from '@/entities/user';
import { api, utils } from '@/shared';

// ❌ 금지
import { Button } from '@/features/auth/ui/Button'; // 내부 파일 직접 접근
import { UserModel } from '@/entities/user/model/user'; // 내부 구조 접근
```

**금지 사항**:
- 비즈니스 로직 직접 구현
- 상태 관리 로직 포함
- UI 컴포넌트 직접 구현

### 🔄 processes 레이어
**책임**: 여러 페이지에 걸친 복잡한 비즈니스 프로세스

**허용된 import**:
```typescript
// ✅ 허용
import { CheckoutPage, PaymentPage } from '@/pages';
import { CartWidget } from '@/widgets/cart';
import { usePayment } from '@/features/payment';
import { orderEntity } from '@/entities/order';
import { api } from '@/shared';

// ❌ 금지
import { ProcessFlow } from '@/processes/another-process'; // 동일 레벨 의존
import { App } from '@/app'; // 상위 레이어 의존
```

**사용 예시**:
- 다단계 회원가입 플로우
- 결제 프로세스
- 온보딩 튜토리얼

### 📄 pages 레이어
**책임**: 페이지 컴포넌트 (Next.js 13+에서는 app 레이어에 통합)

**허용된 import**:
```typescript
// ✅ 허용
import { DashboardWidget } from '@/widgets/dashboard';
import { ProjectList } from '@/features/project';
import { useProjects } from '@/entities/project';
import { PageLayout } from '@/shared/ui';

// ❌ 금지
import { CheckoutProcess } from '@/processes/checkout'; // 상위 레이어 의존
import { HomePage } from '@/pages/home'; // 동일 레벨 의존
```

### 🧩 widgets 레이어
**책임**: 여러 features를 조합한 큰 UI 블록

**허용된 import**:
```typescript
// ✅ 허용
import { VideoPlayer } from '@/features/video';
import { CommentList } from '@/features/comment';
import { FeedbackForm } from '@/features/feedback';
import { videoEntity } from '@/entities/video';
import { Card } from '@/shared/ui';

// ❌ 금지
import { DashboardPage } from '@/pages/dashboard'; // 상위 레이어 의존
import { HeaderWidget } from '@/widgets/header'; // 동일 레벨 의존
```

**예시 위젯**:
```typescript
// src/widgets/video-feedback-panel/index.tsx
export const VideoFeedbackPanel = () => {
  return (
    <div>
      <VideoPlayer />      {/* from features */}
      <FeedbackForm />     {/* from features */}
      <CommentList />      {/* from features */}
    </div>
  );
};
```

### 🎯 features 레이어
**책임**: 사용자 인터랙션과 비즈니스 기능

**허용된 import**:
```typescript
// ✅ 허용
import { userEntity, projectEntity } from '@/entities';
import { Button, Input, Modal } from '@/shared/ui';
import { useApi, formatDate } from '@/shared/lib';

// ❌ 금지
import { DashboardWidget } from '@/widgets/dashboard'; // 상위 레이어 의존
import { LoginFeature } from '@/features/auth'; // 동일 레벨 의존
import { UserForm } from '@/features/user/ui/UserForm'; // 다른 feature 내부 접근
```

**구조 패턴**:
```
features/
└── auth/
    ├── ui/           # UI 컴포넌트
    ├── model/        # 상태 관리
    ├── api/          # API 통신
    ├── lib/          # 유틸리티
    └── index.ts      # Public API
```

### 💼 entities 레이어
**책임**: 핵심 비즈니스 도메인과 데이터

**허용된 import**:
```typescript
// ✅ 허용
import { createSlice } from '@reduxjs/toolkit';
import { api } from '@/shared/api';
import { validateEmail } from '@/shared/lib';
import type { ID, Timestamp } from '@/shared/types';

// ❌ 금지
import React from 'react'; // UI 프레임워크 의존
import { Button } from '@/shared/ui'; // UI 컴포넌트 의존
import { useAuth } from '@/features/auth'; // 상위 레이어 의존
import { projectEntity } from '@/entities/project'; // 동일 레벨 직접 의존
```

**도메인 간 통신**:
```typescript
// ❌ 잘못된 방법
// src/entities/user/model/user.slice.ts
import { projectSlice } from '@/entities/project/model/project.slice';

// ✅ 올바른 방법
// src/features/user-projects/model/index.ts
import { userEntity } from '@/entities/user';
import { projectEntity } from '@/entities/project';

// features 레이어에서 두 엔티티를 조합
```

### 🔧 shared 레이어
**책임**: 완전히 재사용 가능한 공통 코드

**허용된 import**:
```typescript
// ✅ 허용
import { clsx } from 'clsx'; // 외부 라이브러리
import type { ReactNode } from 'react'; // 타입만 허용

// ❌ 금지
import { userEntity } from '@/entities/user'; // 상위 레이어 의존
import { LoginFeature } from '@/features/auth'; // 상위 레이어 의존
```

**하위 분류**:
```
shared/
├── ui/          # 공통 UI 컴포넌트
├── api/         # API 클라이언트
├── lib/         # 유틸리티 함수
├── config/      # 설정 상수
├── types/       # 공통 타입 정의
└── styles/      # 전역 스타일
```

## ESLint 설정

### 의존성 규칙 적용
```json
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/shared",
            "from": "./src/entities",
            "message": "shared cannot import from entities"
          },
          {
            "target": "./src/entities",
            "from": "./src/features",
            "message": "entities cannot import from features"
          },
          {
            "target": "./src/features",
            "from": "./src/widgets",
            "message": "features cannot import from widgets"
          },
          {
            "target": "./src/widgets",
            "from": "./src/pages",
            "message": "widgets cannot import from pages"
          },
          {
            "target": "./src/pages",
            "from": "./src/processes",
            "message": "pages cannot import from processes"
          },
          {
            "target": "./src/processes",
            "from": "./src/app",
            "message": "processes cannot import from app"
          }
        ]
      }
    ],
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["*/ui/*", "*/model/*", "*/api/*", "*/lib/*"],
            "message": "Use public API (index.ts) instead of internal modules"
          }
        ]
      }
    ]
  }
}
```

## TypeScript 경로 설정

### tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/app/*": ["./src/app/*"],
      "@/processes/*": ["./src/processes/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/widgets/*": ["./src/widgets/*"],
      "@/features/*": ["./src/features/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

## CI/CD 검증

### GitHub Actions 워크플로우
```yaml
name: Dependency Check

on: [push, pull_request]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check dependencies
        run: npm run lint:dependencies
      
      - name: Check circular dependencies
        run: npx madge --circular src/
      
      - name: Validate imports
        run: npm run validate:imports
```

## 예외 처리

### 허용된 예외 케이스
1. **테스트 파일**: 테스트 목적으로 내부 모듈 접근 허용
2. **타입 전용 import**: 타입만 import하는 경우 일부 제약 완화
3. **마이그레이션 기간**: 레거시 코드 마이그레이션 중 임시 예외

### 예외 신청 프로세스
1. 기술적 필요성 문서화
2. 아키텍트 리뷰 및 승인
3. 예외 코드에 주석 추가
4. 기한 설정 및 추적

```typescript
// eslint-disable-next-line import/no-restricted-paths
// TODO: Remove after migration (2025-10-01)
// Approved by: Arthur
// Reason: Legacy code migration
import { internalModule } from '@/features/legacy/internal';
```

## 위반 시 조치

### 개발 환경
- ESLint 에러로 표시
- 커밋 불가 (pre-commit hook)
- VS Code에서 빨간 밑줄 표시

### CI/CD 환경
- PR 빌드 실패
- 머지 차단
- 자동 리뷰 코멘트

## 모니터링 및 개선

### 의존성 메트릭
- 월간 의존성 그래프 생성
- 순환 의존성 검사
- 복잡도 분석
- 위반 빈도 추적

### 개선 프로세스
1. 분기별 아키텍처 리뷰
2. 의존성 규칙 업데이트
3. 팀 교육 및 워크샵
4. 베스트 프랙티스 문서화

## 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design)
- [Clean Architecture 원칙](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [의존성 역전 원칙 (DIP)](https://en.wikipedia.org/wiki/Dependency_inversion_principle)

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2025-08-23 | Arthur | 초기 작성 |

**다음 리뷰**: 2025-09-23