# VideoPlanet 프론트엔드 리팩토링 실행 계획

## 🎯 목표
- **UI/UX 100% 동일 유지**
- **코드베이스 통합 (중복 제거)**
- **Next.js 14 최적화 활용**
- **테스트 커버리지 80% 달성**

## 📊 현재 상태
- 두 개의 독립 프론트엔드 존재 (/src, /vridge_front)
- 100% 코드 중복
- TypeScript 사용률 20%
- 테스트 코드 0개

## 🏗️ 통합 프로젝트 구조

```
videoplanet/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # 인증 그룹
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (main)/              # 메인 앱 그룹
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   └── view/
│   │   ├── feedback/
│   │   │   └── [projectId]/
│   │   ├── calendar/
│   │   └── settings/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   └── Icon/
│   ├── molecules/
│   │   ├── FormGroup/
│   │   ├── SearchBox/
│   │   └── MenuItem/
│   ├── organisms/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── ProjectCard/
│   │   └── FeedbackForm/
│   └── templates/
│       ├── PageLayout/
│       └── AuthLayout/
├── features/              # 기능별 모듈
│   ├── auth/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   ├── projects/
│   ├── feedback/
│   └── calendar/
├── lib/                   # 공통 유틸리티
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── hooks/
│   └── utils/
├── styles/
│   ├── design-tokens.scss
│   ├── mixins.scss
│   └── globals.scss
├── store/
│   ├── index.ts
│   └── middleware.ts
├── types/
│   └── global.d.ts
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## 🔄 마이그레이션 전략

### Phase 1: 기반 구축 (Day 1-3)
1. **통합 프로젝트 구조 생성**
2. **테스트 환경 설정**
3. **CI/CD 파이프라인 구축**
4. **환경변수 통합**

### Phase 2: 병렬 모듈 개발 (Day 4-14)

#### 🔀 병렬 작업 영역

##### Team 1: 인증 모듈
- **담당 컴포넌트**
  - Login.jsx → app/(auth)/login/page.tsx
  - Signup.jsx → app/(auth)/signup/page.tsx
  - AuthEmail.jsx → components/organisms/AuthEmail/
- **테스트 시나리오**
  - 로그인 성공/실패
  - 회원가입 유효성 검증
  - 이메일 인증 플로우

##### Team 2: 프로젝트 모듈
- **담당 컴포넌트**
  - ProjectList.jsx → app/(main)/projects/page.tsx
  - ProjectCreate.jsx → app/(main)/projects/create/page.tsx
  - ProjectEdit.jsx → app/(main)/projects/[id]/edit/page.tsx
  - ProjectView.jsx → app/(main)/projects/[id]/view/page.tsx
- **테스트 시나리오**
  - 프로젝트 CRUD 작업
  - 권한 검증
  - 파일 업로드

##### Team 3: 피드백 모듈
- **담당 컴포넌트**
  - Feedback.jsx → app/(main)/feedback/[projectId]/page.tsx
  - FeedbackManage.jsx → components/organisms/FeedbackManage/
  - FeedbackMessage.jsx → components/molecules/FeedbackMessage/
- **테스트 시나리오**
  - 댓글 작성/수정/삭제
  - 실시간 업데이트
  - 알림 시스템

##### Team 4: 캘린더 모듈
- **담당 컴포넌트**
  - Calendar.jsx → app/(main)/calendar/page.tsx
  - CalendarBody.jsx → components/organisms/CalendarBody/
  - CalendarDate.jsx → components/molecules/CalendarDate/
- **테스트 시나리오**
  - 일정 추가/수정
  - 드래그 앤 드롭
  - 월/주/일 뷰 전환

##### Team 5: 공통 컴포넌트
- **담당 컴포넌트**
  - Header.jsx → components/organisms/Header/
  - SideBar.jsx → components/organisms/Sidebar/
  - PageTemplate.jsx → components/templates/PageLayout/
- **디자인 시스템**
  - Design Tokens 통합
  - 컴포넌트 라이브러리 구축
  - Storybook 설정

### Phase 3: 통합 및 최적화 (Day 15-20)
1. **모듈 통합 테스트**
2. **성능 최적화**
3. **번들 사이즈 최적화**
4. **SEO 최적화**

### Phase 4: 배포 준비 (Day 21-25)
1. **스테이징 환경 테스트**
2. **부하 테스트**
3. **롤백 계획 수립**
4. **모니터링 설정**

## 📝 테스트 전략

### 1. Unit Tests (컴포넌트)
```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('should match UI snapshot', () => {
    const { container } = render(<Button variant="primary">Submit</Button>)
    expect(container).toMatchSnapshot()
  })
})
```

### 2. Integration Tests (기능 플로우)
```typescript
// login.spec.ts
describe('Login Flow', () => {
  it('should login successfully with valid credentials', () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type('user@example.com')
    cy.get('[data-testid="password-input"]').type('password')
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

### 3. E2E Tests (크리티컬 패스)
```typescript
// project-creation.e2e.ts
test('Complete project creation flow', async ({ page }) => {
  await page.goto('/projects/create')
  await page.fill('[name="title"]', 'New Project')
  await page.selectOption('[name="category"]', 'video')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/projects\/\d+/)
})
```

## 🚀 배포 전략

### 개발 환경
```bash
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

### 스테이징 환경
```bash
# .env.staging
NEXT_PUBLIC_API_URL=https://staging-api.videoplanet.com
NEXT_PUBLIC_ENV=staging
```

### 프로덕션 환경
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.videoplanet.com
NEXT_PUBLIC_ENV=production
```

## 📊 성공 지표

### 필수 달성 목표
- [ ] UI/UX 100% 동일성 유지
- [ ] 코드 중복 0%
- [ ] TypeScript 사용률 80% 이상
- [ ] 테스트 커버리지 80% 이상
- [ ] Lighthouse 점수 90+ (Performance)
- [ ] 번들 사이즈 30% 감소
- [ ] 빌드 시간 50% 단축

### 품질 지표
- [ ] 0 Critical 보안 취약점
- [ ] ESLint 에러 0개
- [ ] console.log 제거 100%
- [ ] !important 사용 0개
- [ ] 접근성 WCAG 2.1 AA 준수

## 🛠️ 기술 스택

### Core
- Next.js 14.2.0
- React 18.2.0
- TypeScript 5.4.0

### State Management
- Redux Toolkit 2.0
- RTK Query

### Styling
- SCSS Modules
- Styled Components (점진적 제거)
- Design Tokens

### Testing
- Jest 29
- React Testing Library 14
- Cypress 13
- Playwright 1.40

### Build & Deploy
- Turbopack
- Vercel
- GitHub Actions

## 📅 타임라인

| 주차 | 작업 내용 | 완료 기준 |
|------|-----------|-----------|
| Week 1 | 기반 구축 및 테스트 환경 | 테스트 실행 가능 |
| Week 2 | 병렬 모듈 개발 (50%) | 각 모듈 독립 동작 |
| Week 3 | 병렬 모듈 완성 (100%) | 모든 기능 구현 |
| Week 4 | 통합 테스트 및 최적화 | 성능 목표 달성 |
| Week 5 | 배포 준비 및 문서화 | 프로덕션 준비 완료 |

## 🔍 리스크 관리

### 주요 리스크
1. **UI 불일치**: 스냅샷 테스트로 방지
2. **기능 누락**: 체크리스트 기반 검증
3. **성능 저하**: 단계별 성능 측정
4. **배포 실패**: 롤백 계획 수립

### 대응 방안
- 일일 스탠드업 미팅
- 주간 진행 상황 리뷰
- 블로커 즉시 에스컬레이션
- 페어 프로그래밍 활용

---

**작성일**: 2024-01-15
**버전**: 1.0.0
**담당**: Frontend Team