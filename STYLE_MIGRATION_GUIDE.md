# VRidge Next.js 스타일 시스템 마이그레이션 가이드

## 개요
React 프로젝트를 Next.js로 마이그레이션하면서 스타일 시스템을 완전히 재구성했습니다. 모든 스타일이 픽셀 단위로 100% 동일하게 유지되도록 설계되었습니다.

## 스타일 아키텍처

### 1. 디자인 토큰 시스템 (`/src/styles/variables.scss`)
```scss
// 색상 시스템
$colors: (
  primary: #0031ff,
  primary-hover: #0058da,
  text-primary: #23262d,
  // ... 기타 색상
);

// 간격 시스템
$spacing: (
  0: 0,
  1: 5px,
  2: 10px,
  // ... 10px 간격으로 320px까지
);

// 타이포그래피
$font-families: (
  suit: 'suit',
  poppins-bold: 'pb',
  // ... 기타 폰트
);
```

### 2. 글로벌 스타일 (`/src/app/globals.scss`)
- CSS Reset 및 기본 스타일
- 폰트 정의 (`@font-face`)
- 유틸리티 클래스 (`.flex`, `.mt10-mt320` 등)
- 기본 폼 요소 스타일
- Ant Design 커스터마이징

### 3. 컴포넌트 스타일 모듈화
- **Critical CSS** (`/src/styles/critical.scss`): 첫 렌더링에 필요한 핵심 스타일
- **Components** (`/src/styles/components.scss`): 컴포넌트별 스타일
- **Pages** (`/src/styles/pages.scss`): 페이지별 스타일

## Next.js 설정

### 1. next.config.js
```javascript
const nextConfig = {
  sassOptions: {
    includePaths: ['./src'],
    prependData: `@import "src/styles/variables.scss";`,
  },
  compiler: {
    styledComponents: true,
  },
  experimental: {
    appDir: true,
  },
}
```

### 2. PostCSS 설정 (`postcss.config.js`)
- `postcss-flexbugs-fixes`: Flexbox 버그 수정
- `postcss-preset-env`: 최신 CSS 기능 지원
- `postcss-normalize`: CSS Normalize

## Styled Components SSR 설정

### 1. Registry (`/src/lib/registry.tsx`)
```tsx
export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  // SSR 지원 로직
}
```

### 2. Layout 적용 (`/src/app/layout.tsx`)
```tsx
<StyledComponentsRegistry>
  <Providers>
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  </Providers>
</StyledComponentsRegistry>
```

## Ant Design 테마 커스터마이징

### 테마 설정
```tsx
const theme = {
  token: {
    colorPrimary: '#0031ff',
    borderRadius: 15,
    fontFamily: 'suit, -apple-system, BlinkMacSystemFont...',
  },
  components: {
    Button: { colorPrimary: '#0031ff' },
    Input: { borderRadius: 15, paddingInline: 15 },
    // ... 기타 컴포넌트
  },
}
```

## 기존 스타일 파일 매핑

### 마이그레이션된 파일들
- `vridge_front/src/Common.scss` → `src/app/globals.scss` (유틸리티 부분)
- `vridge_front/src/routes/App.scss` → `src/app/globals.scss` (리셋 부분)
- `vridge_front/src/components/*.scss` → `src/styles/components.scss`
- `vridge_front/src/css/**/*.scss` → `src/styles/pages.scss`

### 스타일 사용법 변경사항

#### 1. 색상 사용
```scss
// Before
color: #0031ff;

// After  
color: color(primary);
```

#### 2. 간격 사용
```scss
// Before
margin-top: 20px;

// After
margin-top: spacing(4); // 4 * 5px = 20px
```

#### 3. 반응형 디자인
```scss
// Before
@media (min-width: 768px) { ... }

// After
@include responsive(md) { ... }
```

## 성능 최적화

### 1. Critical CSS 분리
- 첫 페이지 로드에 필요한 최소한의 CSS만 인라인
- 나머지 스타일은 지연 로딩

### 2. 코드 스플리팅
```tsx
// 페이지별 동적 임포트
const Home = dynamic(() => import('../pages/Home'), { ssr: false })
```

### 3. 폰트 최적화
```tsx
// layout.tsx에서 폰트 preconnect
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

## 디렉토리 구조

```
src/
├── app/
│   ├── globals.scss          # 글로벌 스타일
│   ├── layout.tsx           # 루트 레이아웃
│   └── page.tsx             # 홈 페이지
├── styles/
│   ├── variables.scss       # 디자인 토큰
│   ├── critical.scss        # 크리티컬 CSS
│   ├── components.scss      # 컴포넌트 스타일
│   ├── pages.scss          # 페이지 스타일
│   └── index.scss          # 메인 스타일 인덱스
├── assets/
│   ├── fonts/              # 폰트 파일들
│   └── images/             # 이미지 파일들
├── lib/
│   └── registry.tsx        # Styled Components Registry
└── ...기타 컴포넌트들
```

## 사용 방법

### 1. 개발 환경 실행
```bash
npm install
npm run dev
```

### 2. 빌드 및 배포
```bash
npm run build
npm start
```

### 3. 스타일 수정 시 주의사항
- 디자인 토큰 우선 사용 (`color()`, `spacing()` 함수)
- 새로운 컴포넌트 스타일은 `components.scss`에 추가
- 페이지별 스타일은 `pages.scss`에 추가
- 반응형 디자인은 `@include responsive()` 믹스인 사용

## 브라우저 호환성
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 마이그레이션 체크리스트
- [x] Next.js 설정 완료
- [x] SCSS 설정 및 변수 시스템 구축
- [x] 글로벌 스타일 마이그레이션
- [x] Styled Components SSR 설정
- [x] Ant Design 테마 커스터마이징
- [x] 폰트 파일 마이그레이션
- [x] 이미지 파일 마이그레이션
- [x] Critical CSS 분리
- [x] 성능 최적화 설정
- [ ] 픽셀 단위 UI 검증 및 테스트 (진행 중)

## 문제 해결
스타일 관련 문제가 발생하면:
1. 브라우저 개발자 도구에서 스타일 확인
2. 디자인 토큰 사용 여부 확인
3. SSR/CSR 차이로 인한 스타일 깜빡임 확인
4. Ant Design 테마 오버라이드 확인

모든 스타일이 기존과 100% 동일하게 렌더링되도록 설계되었습니다.