# Vercel 배포 가이드

## 🚀 Vercel 대시보드 환경변수 설정

### 1. Vercel 대시보드 접속

1. **Vercel 로그인**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **프로젝트 선택**: `Videoplanet` 또는 `winnmedia/Videoplanet` 프로젝트 클릭
3. **설정 메뉴**: 상단 탭에서 **Settings** 클릭
4. **환경변수 메뉴**: 왼쪽 사이드바에서 **Environment Variables** 클릭

### 2. 필수 환경변수 설정

아래 환경변수들을 **반드시** Vercel 대시보드에 추가해야 합니다:

#### 🔧 Backend API 설정
```bash
Name: NEXT_PUBLIC_API_URL
Value: https://videoplanet.up.railway.app
Environment: ✅ Production ✅ Preview ✅ Development
```

```bash  
Name: NEXT_PUBLIC_BACKEND_API_URL
Value: https://videoplanet.up.railway.app
Environment: ✅ Production ✅ Preview ✅ Development
```

#### 🔌 WebSocket 설정
```bash
Name: NEXT_PUBLIC_WS_URL
Value: wss://videoplanet.up.railway.app
Environment: ✅ Production ✅ Preview ✅ Development
```

```bash
Name: NEXT_PUBLIC_SOCKET_URI  
Value: wss://videoplanet.up.railway.app
Environment: ✅ Production ✅ Preview ✅ Development
```

#### 🌐 Frontend App 설정
```bash
Name: NEXT_PUBLIC_APP_URL
Value: https://videoplanet.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

#### 🏗️ 환경 구분
```bash
Name: NODE_ENV
Value: production
Environment: ✅ Production (Preview와 Development는 체크하지 않음)
```

### 3. 환경변수 추가 절차

#### Step 1: 환경변수 추가 버튼 클릭
- **Add New** 또는 **+ Add** 버튼 클릭

#### Step 2: 환경변수 정보 입력
- **Name**: 위의 변수명 정확히 입력 (대소문자 구분)
- **Value**: 위의 값 정확히 입력 (프로토콜 포함)
- **Environments**: 해당 환경 체크박스 선택

#### Step 3: 저장 및 반복
- **Save** 버튼 클릭
- 위의 6개 환경변수 모두 반복하여 추가

### 4. 환경 범위 설명

#### 🟢 Production (필수)
- **사용 시점**: `videoplanet.vercel.app` 메인 도메인 배포
- **적용 대상**: `master` 브랜치 배포
- **모든 환경변수 필요**: 6개 모두 설정

#### 🟡 Preview (권장)
- **사용 시점**: Git branch별 미리보기 배포
- **적용 대상**: `feature/xxx` 브랜치 등
- **URL 형태**: `videoplanet-git-branch-winnmedia.vercel.app`

#### 🔵 Development (선택)
- **사용 시점**: 로컬 개발 환경 (거의 사용 안 함)
- **적용 대상**: `vercel dev` 명령어 실행 시
- **참고**: 로컬에서는 `.env.local` 파일 우선 사용

## 🔄 배포 프로세스

### 1. 자동 배포 트리거

환경변수 설정 완료 후:
1. **자동 재배포 시작**: Vercel이 자동으로 최신 커밋으로 재배포
2. **배포 진행 확인**: **Deployments** 탭에서 진행 상황 모니터링
3. **완료 대기**: 보통 1-3분 소요

### 2. 수동 재배포 (필요시)

자동 배포가 시작되지 않는 경우:
1. **Deployments** 탭 이동
2. 최신 배포 항목의 **⋯** 메뉴 클릭
3. **Redeploy** 선택
4. **Use existing Build Cache** 체크 해제 (권장)
5. **Redeploy** 버튼 클릭

## ✅ 배포 완료 후 검증

### 1. 환경변수 확인 (브라우저)

배포된 사이트에서 F12 개발자 도구 → Console 탭:

```javascript
// 환경변수 출력
console.log('Environment Check:', {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL, 
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV
});

// 기대값
// API_URL: "https://videoplanet.up.railway.app"
// WS_URL: "wss://videoplanet.up.railway.app"
// APP_URL: "https://videoplanet.vercel.app"
// NODE_ENV: "production"
```

### 2. 기능 테스트 체크리스트

- [ ] **🔐 로그인 기능**: 사용자 인증 및 토큰 발급
- [ ] **📋 프로젝트 목록**: API에서 데이터 정상 로딩
- [ ] **💬 피드백 기능**: 댓글 작성 및 조회
- [ ] **⚡ 실시간 기능**: WebSocket 연결 및 알림
- [ ] **📊 대시보드**: 위젯 데이터 표시
- [ ] **📅 캘린더**: 일정 데이터 로딩

### 3. 네트워크 확인 (개발자 도구)

F12 → Network 탭에서 확인:
- **API 호출**: `videoplanet.up.railway.app`으로 요청
- **WebSocket**: `wss://videoplanet.up.railway.app`으로 연결
- **상태 코드**: 200 OK 또는 적절한 응답

## 🛠️ 로컬 검증 도구

### 1. 환경변수 검증 스크립트 실행

```bash
# 프로젝트 루트에서 실행
npm run validate-env

# 또는 직접 실행
node scripts/validate-env.js
```

**기대 출력**:
```
🎉 모든 환경변수 검증 통과!
Vercel 배포가 준비되었습니다.
```

### 2. 빌드 테스트

```bash
# 프로덕션 빌드 테스트
npm run build

# 빌드 성공 시 출력
✓ Compiled successfully
```

## ❌ 문제 해결 가이드

### 1. 환경변수가 undefined인 경우

**증상**: `process.env.NEXT_PUBLIC_API_URL`이 `undefined`

**원인 및 해결**:
```bash
# 원인 1: Vercel 대시보드에 환경변수 미설정
해결: 위의 설정 절차 따라 모든 환경변수 추가

# 원인 2: 환경변수 이름 오타
확인: NEXT_PUBLIC_ 접두사 정확한지 확인

# 원인 3: 배포 캐시 문제  
해결: Vercel에서 Build Cache 없이 재배포
```

### 2. API 연결 오류 (CORS/Network)

**증상**: `Failed to fetch` 또는 CORS 에러

**원인 및 해결**:
```bash
# 원인 1: Railway 백엔드 서버 다운
확인: https://videoplanet.up.railway.app/admin/ 접속 테스트

# 원인 2: Railway CORS 설정 문제
해결: Railway Django settings.py에서 ALLOWED_HOSTS 확인
ALLOWED_HOSTS = ['videoplanet.vercel.app', '*.vercel.app']

# 원인 3: 프로토콜 문제
확인: https:// 포함되어 있는지 검증
```

### 3. WebSocket 연결 실패

**증상**: 실시간 기능 작동 안 함

**원인 및 해결**:
```bash
# 원인 1: wss:// 프로토콜 누락
확인: NEXT_PUBLIC_WS_URL이 wss://로 시작하는지 확인

# 원인 2: Railway WebSocket 설정 문제
확인: Railway에서 WebSocket 지원 활성화 확인

# 원인 3: 방화벽/프록시 차단
테스트: 다른 네트워크에서 접속 시도
```

### 4. 빌드 실패

**증상**: Vercel 배포 시 Build Error

**원인 및 해결**:
```bash
# 원인 1: TypeScript 타입 에러
해결: npm run build로 로컬에서 먼저 확인

# 원인 2: 환경변수 검증 실패
해결: npm run validate-env로 환경변수 검증

# 원인 3: 메모리 부족
해결: Vercel Pro 플랜 또는 빌드 최적화
```

## 📋 배포 체크리스트

배포 전 다음 사항들을 모두 확인하세요:

### Pre-deployment ✅
- [ ] 모든 환경변수가 Vercel 대시보드에 설정됨
- [ ] 환경변수 검증 스크립트 통과 (`npm run validate-env`)
- [ ] 로컬 빌드 테스트 통과 (`npm run build`)
- [ ] Railway 백엔드 서버 정상 작동 확인

### Post-deployment ✅  
- [ ] 배포 성공 및 사이트 접속 가능
- [ ] 브라우저에서 환경변수 값 확인
- [ ] 주요 기능 테스트 통과 (로그인, API, WebSocket)
- [ ] 네트워크 요청 정상 작동 확인

### Monitoring ✅
- [ ] Vercel 배포 로그 에러 없음
- [ ] Railway 서버 상태 정상
- [ ] 사용자 피드백 모니터링

## 🔗 관련 문서

- **환경변수 체크리스트**: `/docs/VERCEL_ENV_CHECKLIST.md`
- **환경변수 설정 파일**: `/lib/config.ts`
- **검증 스크립트**: `/scripts/validate-env.js`
- **프로덕션 환경변수**: `/.env.production.local`

---

**최종 업데이트**: 2025-08-17  
**작성자**: VideoPlanet 개발팀  
**버전**: 1.0.0