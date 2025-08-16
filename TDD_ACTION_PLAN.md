# TDD 기반 VideoPlanet 개선 액션플랜

## 🎯 목표
- Windows 환경 호환성 확보
- 누락된 핵심 컴포넌트 구현
- 기존 코드와 새 코드 통합
- 프로덕션 빌드 성공

## 📋 TDD 프로세스

### Phase 1: 환경 설정 (Day 1)

#### 1.1 Windows 경로 문제 해결
```javascript
// ❌ 문제가 되는 경로 패턴
app/(auth)/  // Windows에서 괄호가 문제될 수 있음

// ✅ 해결 방안
app/auth-group/  // 또는
app/_auth/       // Next.js 권장 private 폴더
```

#### 1.2 경로 별칭 통합
```javascript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./components/*"],
      "@features/*": ["./features/*"],
      "@app/*": ["./app/*"],
      "@lib/*": ["./lib/*"],
      "@types/*": ["./types/*"]
    }
  }
}
```

### Phase 2: TDD 컴포넌트 개발 (Day 2-3)

#### 2.1 Button 컴포넌트

**Step 1: 테스트 작성**
```typescript
// __tests__/components/atoms/Button.test.tsx
describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('should apply variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>)
    expect(container.firstChild).toHaveClass('button--primary')
  })
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

**Step 2: 구현**
```typescript
// components/atoms/Button/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="button__loader" /> : children}
    </button>
  )
}
```

#### 2.2 Input 컴포넌트

**Step 1: 테스트 작성**
```typescript
// __tests__/components/atoms/Input.test.tsx
describe('Input Component', () => {
  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })
  
  it('should handle value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })
  
  it('should display error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })
})
```

### Phase 3: 통합 테스트 (Day 4)

#### 3.1 페이지 통합 테스트
```typescript
// __tests__/integration/login-flow.test.tsx
describe('Login Flow Integration', () => {
  it('should complete login flow successfully', async () => {
    render(<LoginPage />)
    
    // 1. 입력 필드 테스트
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // 2. 제출 테스트
    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)
    
    // 3. 성공 후 리다이렉트 테스트
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })
})
```

### Phase 4: 빌드 최적화 (Day 5)

#### 4.1 개발 환경 빌드
```bash
# 개발 환경 테스트
npm run dev
# http://localhost:3000 접속 확인

# 린트 및 타입 체크
npm run lint
npm run type-check
```

#### 4.2 프로덕션 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 분석
npm run analyze

# 프로덕션 서버 시작
npm run start
```

## 🔧 Windows 특화 해결책

### 1. 디렉토리 구조 변경
```
# 변경 전
app/(auth)/         # Windows 문제 가능
app/(main)/         # Windows 문제 가능

# 변경 후
app/_auth/          # Next.js private 폴더 패턴
app/_main/          # 또는
app/auth-pages/     # 명시적 네이밍
app/main-pages/
```

### 2. 스크립트 크로스 플랫폼 호환
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rimraf .next out",
    "clean:all": "rimraf .next out node_modules"
  }
}
```

### 3. WSL 환경 활용 (선택사항)
```bash
# WSL에서 실행
wsl
cd /mnt/c/Users/유석근PD/Desktop/developments/Videoplanet
npm run dev
```

## 📊 성공 지표

### 필수 달성 목표
- [ ] Windows 환경에서 개발 서버 정상 작동
- [ ] 모든 테스트 통과 (Unit + Integration)
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint 에러 0개
- [ ] 프로덕션 빌드 성공
- [ ] Lighthouse 점수 90+

### 테스트 커버리지 목표
- [ ] Button 컴포넌트: 100%
- [ ] Input 컴포넌트: 100%
- [ ] 인증 플로우: 90%+
- [ ] 전체 커버리지: 80%+

## 🚀 실행 순서

1. **환경 설정** (30분)
   - tsconfig.json paths 설정
   - 디렉토리 구조 조정
   - 크로스 플랫폼 스크립트 설정

2. **테스트 작성** (2시간)
   - Button 테스트
   - Input 테스트
   - 통합 테스트

3. **컴포넌트 구현** (3시간)
   - Button 구현
   - Input 구현
   - 기타 Atom 컴포넌트

4. **통합 및 리팩토링** (2시간)
   - 기존 코드와 통합
   - 경로 문제 해결
   - 빌드 최적화

5. **배포 준비** (1시간)
   - 프로덕션 빌드 테스트
   - Vercel 배포 설정
   - 환경변수 설정

## 📝 체크리스트

### 개발 환경
- [ ] Windows에서 npm run dev 정상 작동
- [ ] Hot Reload 작동
- [ ] TypeScript 자동 완성 작동

### 테스트
- [ ] Jest 테스트 실행 가능
- [ ] Cypress E2E 테스트 실행 가능
- [ ] 테스트 커버리지 80% 이상

### 빌드
- [ ] 개발 빌드 성공
- [ ] 프로덕션 빌드 성공
- [ ] 번들 사이즈 최적화

### 배포
- [ ] Vercel 배포 성공
- [ ] Railway 백엔드 연동
- [ ] 프로덕션 환경 정상 작동

---

**작성일**: 2024-08-16
**버전**: 1.0.0
**목표 완료일**: 2024-08-20