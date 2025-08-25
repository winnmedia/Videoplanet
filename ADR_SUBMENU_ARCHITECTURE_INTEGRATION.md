# Architecture Decision Record: VideoPlanet 서브메뉴 시스템 통합 전략

**날짜**: 2025-08-24  
**작성자**: Arthur (Chief Architect)  
**상태**: 제안됨  
**결정자**: 아키텍처 팀  

## 요약

VideoPlanet 서브메뉴 시스템의 아키텍처 문제점을 분석하고, FSD 원칙에 따른 통합 전략을 수립합니다. 현재 두 개의 중복된 사이드바 컴포넌트(SideBar, EnhancedSideBar)가 존재하며, 이는 아키텍처 경계 위반과 유지보수성 저하를 야기하고 있습니다.

## 현황 분석

### 1. 아키텍처 위반 사항

#### 1.1 FSD 레이어 구조 위반
```
현재 상태:
- /src/shared/ui/SideBar.tsx (레거시)
- /src/shared/ui/EnhancedSideBar/ (개선 버전)
- /src/shared/ui/AppLayout.tsx (레거시 SideBar 사용)

문제점:
✗ shared 레이어에 비즈니스 로직 포함 (프로젝트 관리, 라우팅 로직)
✗ 직접적인 localStorage 접근 (인증 상태 관리)
✗ useRouter 직접 사용 (라우팅 로직)
```

#### 1.2 의존성 방향 위반
```typescript
// 잘못된 예시 - shared에서 비즈니스 로직 처리
// src/shared/ui/SideBar.tsx
const handleLogout = () => {
  localStorage.removeItem('isAuthenticated')  // ✗ 인증 로직
  localStorage.removeItem('user')              // ✗ 상태 관리
  router.push('/login')                        // ✗ 라우팅 로직
}
```

#### 1.3 Public API 원칙 미준수
```typescript
// AppLayout.tsx에서 직접 import
import { SideBar } from './SideBar'  // ✗ 내부 파일 직접 접근
import { Header } from './Header'    // ✗ 배럴 파일 미사용
```

### 2. 디자인 시스템 일관성 문제

#### 2.1 디자인 토큰 사용 불일치
```scss
// SideBar.module.scss
.sideBar {
  width: 300px;                    // ✗ 하드코딩된 값
  padding: 50px 30px;              // ✗ 토큰 미사용
  box-shadow: var(--shadow-lg);    // ✓ CSS 변수 사용 (부분적)
}

// EnhancedSideBar.module.scss
@import '../../styles/design-tokens.scss';
.hamburger {
  padding: $spacing-sm;            // ✓ 토큰 사용
  border-radius: $radius-md;       // ✓ 일관된 토큰
}
```

#### 2.2 스타일 파일 중복
- 두 개의 별도 SCSS 모듈 존재
- 일관되지 않은 클래스명 규칙
- 중복된 스타일 정의

### 3. 컴포넌트 표준화 수준

#### 3.1 Props 인터페이스 불일치
```typescript
// SideBar - 레거시 Props
interface SideBarProps {
  tab?: string
  onMenu?: boolean
  projects?: Array<{...}>
  onMenuClick?: (menuType: string) => void
  onClose?: () => void
}

// EnhancedSideBar - 확장된 Props
interface EnhancedSideBarProps {
  // ... 레거시 props +
  searchable?: boolean
  searchPlaceholder?: string
  breadcrumbs?: BreadcrumbItem[]
  customMenuItems?: MenuItem[]
  ariaLabel?: string
}
```

#### 3.2 접근성 지원 격차
- SideBar: 기본적인 접근성 미지원
- EnhancedSideBar: ARIA 속성, 키보드 네비게이션, 포커스 트랩 구현

## 제안된 해결책

### 1. 아키텍처 재구성

#### 1.1 레이어별 책임 분리
```
features/navigation/
├── model/
│   ├── navigation.slice.ts      # 네비게이션 상태 관리
│   └── navigation.types.ts      # 타입 정의
├── ui/
│   ├── NavigationMenu/          # 메인 네비게이션 컴포넌트
│   ├── SubMenu/                 # 서브메뉴 컴포넌트
│   └── MobileMenu/              # 모바일 메뉴 컴포넌트
└── index.ts                     # Public API

widgets/app-sidebar/
├── ui/
│   └── AppSidebar.tsx           # features/navigation 조합
└── index.ts

shared/ui/
├── MenuItem/                    # 순수 UI 컴포넌트
├── MenuList/                    # 재사용 가능한 메뉴 리스트
└── index.ts
```

#### 1.2 의존성 흐름 정리
```typescript
// features/navigation/model/navigation.slice.ts
import { createSlice } from '@reduxjs/toolkit'
import { authEntity } from '@/entities/auth'
import { projectEntity } from '@/entities/project'

// widgets/app-sidebar/ui/AppSidebar.tsx
import { NavigationMenu } from '@/features/navigation'
import { useProjects } from '@/entities/project'
import { MenuItem } from '@/shared/ui'

// app/layout.tsx
import { AppSidebar } from '@/widgets/app-sidebar'
```

### 2. 마이그레이션 전략

#### 2.1 단계별 마이그레이션 (3단계)

**Phase 1: 준비 단계 (1주)**
- [ ] 새로운 FSD 구조 생성
- [ ] 공통 타입 및 인터페이스 정의
- [ ] 테스트 케이스 작성

**Phase 2: 병렬 운영 (2주)**
- [ ] feature flag로 새/구 버전 토글
- [ ] 점진적 기능 이전
- [ ] A/B 테스팅

**Phase 3: 완전 전환 (1주)**
- [ ] 레거시 코드 제거
- [ ] 문서 업데이트
- [ ] 성능 최적화

#### 2.2 컴포넌트 통합 매트릭스

| 기능 | SideBar | EnhancedSideBar | 통합 버전 |
|-----|---------|-----------------|-----------|
| 기본 네비게이션 | ✓ | ✓ | ✓ |
| 서브메뉴 | ✓ | ✓ | ✓ |
| 검색 | ✗ | ✓ | ✓ |
| 브레드크럼 | ✗ | ✓ | ✓ |
| 모바일 지원 | ✗ | ✓ | ✓ |
| 접근성 | 부분 | ✓ | ✓ |
| 키보드 네비게이션 | ✗ | ✓ | ✓ |

### 3. 품질 보증 전략

#### 3.1 테스트 전략

**단위 테스트 (features/navigation)**
```typescript
describe('NavigationSlice', () => {
  test('메뉴 상태 토글')
  test('서브메뉴 열기/닫기')
  test('활성 메뉴 아이템 추적')
})
```

**통합 테스트 (widgets/app-sidebar)**
```typescript
describe('AppSidebar Integration', () => {
  test('프로젝트 목록과 네비게이션 연동')
  test('라우팅 변경 시 메뉴 상태 동기화')
  test('로그아웃 플로우')
})
```

**E2E 테스트**
```typescript
describe('Navigation E2E', () => {
  test('전체 네비게이션 플로우')
  test('모바일 반응형 동작')
  test('키보드 접근성')
})
```

#### 3.2 린트 규칙 강화

```json
// .eslintrc.json 추가 규칙
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/shared/ui/SideBar",
            "message": "Use @/widgets/app-sidebar instead"
          }
        ]
      }
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "prefix": ["I"],
        "format": ["PascalCase"]
      }
    ]
  }
}
```

#### 3.3 CI/CD 게이트

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Validation

on: [push, pull_request]

jobs:
  fsd-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check FSD boundaries
        run: npm run lint:architecture
      
      - name: Validate imports
        run: npm run validate:imports
      
      - name: Check circular dependencies
        run: npx madge --circular src/
      
      - name: Design token usage
        run: npm run check:design-tokens
```

### 4. 디자인 시스템 통합

#### 4.1 디자인 토큰 표준화

```scss
// shared/styles/tokens/_navigation.scss
$nav-width-desktop: 300px;
$nav-width-mobile: 280px;
$nav-padding-vertical: $spacing-2xl;
$nav-padding-horizontal: $spacing-xl;
$nav-item-spacing: $spacing-lg;
$nav-item-height: 44px;
$nav-transition-duration: 300ms;
$nav-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

#### 4.2 컴포넌트 스타일 가이드

```scss
// features/navigation/ui/NavigationMenu/NavigationMenu.module.scss
@use '@/shared/styles/tokens' as tokens;

.navigationMenu {
  width: tokens.$nav-width-desktop;
  padding: tokens.$nav-padding-vertical tokens.$nav-padding-horizontal;
  transition: all tokens.$nav-transition-duration tokens.$nav-transition-easing;
  
  @include tokens.mobile-only {
    width: tokens.$nav-width-mobile;
  }
}
```

## 위험 요소 및 완화 방안

### 위험 요소

1. **기존 기능 손상 위험**
   - 완화: Feature flag 사용, 점진적 롤아웃
   
2. **성능 저하 가능성**
   - 완화: 번들 크기 모니터링, 코드 스플리팅
   
3. **사용자 경험 일시적 저하**
   - 완화: A/B 테스팅, 사용자 피드백 수집

4. **개발 일정 지연**
   - 완화: 단계별 마일스톤, 병렬 작업

## 성공 지표

### 정량적 지표
- [ ] 번들 크기 20% 감소
- [ ] 테스트 커버리지 90% 이상
- [ ] Lighthouse 접근성 점수 95점 이상
- [ ] 0건의 아키텍처 경계 위반

### 정성적 지표
- [ ] 개발자 만족도 향상
- [ ] 코드 리뷰 시간 단축
- [ ] 신규 기능 개발 속도 향상

## 구현 예시

### Before (현재 상태)
```typescript
// src/shared/ui/SideBar.tsx
export function SideBar({ tab, onMenu, projects = [], onMenuClick, onClose }: SideBarProps) {
  const router = useRouter()  // ✗ 라우팅 로직
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')  // ✗ 인증 로직
    router.push('/login')
  }
  
  // ... 복잡한 비즈니스 로직
}
```

### After (제안된 구조)
```typescript
// features/navigation/ui/NavigationMenu/NavigationMenu.tsx
export function NavigationMenu({ items, activeId, onItemClick }: INavigationMenuProps) {
  // 순수한 UI 로직만 포함
  return (
    <nav className={styles.menu}>
      {items.map(item => (
        <MenuItem
          key={item.id}
          {...item}
          isActive={activeId === item.id}
          onClick={() => onItemClick(item.id)}
        />
      ))}
    </nav>
  )
}

// features/navigation/model/useNavigation.ts
export function useNavigation() {
  const dispatch = useAppDispatch()
  const { logout } = useAuth()  // entities/auth에서 가져옴
  
  const handleLogout = async () => {
    await logout()
    // 라우팅은 auth entity에서 처리
  }
  
  return { handleLogout }
}
```

## 결론

현재 VideoPlanet의 서브메뉴 시스템은 FSD 아키텍처 원칙을 위반하고 있으며, 이는 유지보수성과 확장성에 부정적인 영향을 미치고 있습니다. 제안된 통합 전략을 통해:

1. **명확한 아키텍처 경계** 확립
2. **재사용 가능한 컴포넌트** 구조
3. **일관된 디자인 시스템** 적용
4. **향상된 테스트 가능성** 확보

를 달성할 수 있을 것으로 예상됩니다.

## 다음 단계

1. 아키텍처 팀 리뷰 및 승인
2. 상세 구현 계획 수립
3. POC(Proof of Concept) 개발
4. 점진적 마이그레이션 시작

## 참고 문서

- [ARCHITECTURE_FSD.md](/home/winnmedia/Videoplanet/ARCHITECTURE_FSD.md)
- [DEVELOPMENT_RULES.md](/home/winnmedia/Videoplanet/DEVELOPMENT_RULES.md)
- [DEPENDENCY_BOUNDARY_RULES.md](/home/winnmedia/Videoplanet/DEPENDENCY_BOUNDARY_RULES.md)
- [Feature-Sliced Design 공식 문서](https://feature-sliced.design)

---

**검토자**: 
**승인 날짜**: 
**버전**: 1.0.0