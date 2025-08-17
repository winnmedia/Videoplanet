# Vercel 배포 환경변수 체크리스트

## 🎯 필수 환경변수 목록

### 1. Backend API 설정
```bash
# Railway 백엔드 서버 URL
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet.up.railway.app
```

### 2. WebSocket 설정
```bash
# WebSocket 연결 URL (wss:// 프로토콜 필수)
NEXT_PUBLIC_WS_URL=wss://videoplanet.up.railway.app
NEXT_PUBLIC_SOCKET_URI=wss://videoplanet.up.railway.app
```

### 3. Frontend App 설정
```bash
# Vercel 배포 도메인 (실제 배포 후 확정)
NEXT_PUBLIC_APP_URL=https://videoplanet.vercel.app
NEXT_PUBLIC_PRODUCTION_DOMAIN=https://videoplanet.vercel.app
```

### 4. 환경 구분
```bash
# 프로덕션 환경 설정
NODE_ENV=production
```

## ✅ 환경변수 검증 항목

### 1. URL 형식 검증
- [ ] **프로토콜 포함 확인**: 모든 URL에 `https://` 또는 `wss://` 프로토콜이 포함되어야 함
- [ ] **트레일링 슬래시 제거**: URL 끝에 `/`가 없어야 함
- [ ] **중복 슬래시 제거**: URL 중간에 `//`가 없어야 함
- [ ] **localhost 금지**: 프로덕션 환경에서 `localhost` 사용 금지

### 2. Backend API URL 검증
```javascript
// 올바른 형식
✅ https://videoplanet.up.railway.app
✅ https://api.example.com

// 잘못된 형식
❌ videoplanet.up.railway.app (프로토콜 누락)
❌ https://videoplanet.up.railway.app/ (트레일링 슬래시)
❌ http://localhost:8000 (프로덕션에서 localhost 사용)
❌ www.vlanet.net (잘못된 도메인 패턴)
```

### 3. WebSocket URL 검증
```javascript
// 올바른 형식
✅ wss://videoplanet.up.railway.app
✅ wss://ws.example.com

// 잘못된 형식
❌ videoplanet.up.railway.app (프로토콜 누락)
❌ https://videoplanet.up.railway.app (HTTP 프로토콜)
❌ ws://localhost:8000 (프로덕션에서 localhost 사용)
```

### 4. App URL 검증
```javascript
// 올바른 형식
✅ https://videoplanet.vercel.app
✅ https://my-app.vercel.app

// 잘못된 형식
❌ videoplanet.vercel.app (프로토콜 누락)
❌ http://localhost:3000 (프로덕션에서 localhost 사용)
```

## 🔧 Vercel 대시보드 설정 방법

### 1. Vercel 프로젝트 대시보드 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 로그인
2. `Videoplanet` 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 선택

### 2. 환경변수 추가 절차
```bash
# 각 환경변수를 개별적으로 추가
Name: NEXT_PUBLIC_API_URL
Value: https://videoplanet.up.railway.app
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_WS_URL
Value: wss://videoplanet.up.railway.app
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_APP_URL
Value: https://videoplanet.vercel.app
Environment: Production, Preview, Development

Name: NODE_ENV
Value: production
Environment: Production
```

### 3. 환경변수 적용 범위 설정
- **Production**: 메인 도메인 배포시 사용
- **Preview**: Git branch 배포시 사용
- **Development**: 로컬 개발시 사용 (선택사항)

## 🚀 배포 후 검증 절차

### 1. 자동 재배포 트리거
- 환경변수 저장 후 Vercel이 자동으로 재배포 시작
- **Deployments** 탭에서 진행 상황 확인

### 2. 배포 완료 후 검증
```bash
# 브라우저 개발자 도구 Console에서 확인
console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('SOCKET_URL:', process.env.NEXT_PUBLIC_WS_URL)
console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
```

### 3. 기능 테스트
- [ ] **로그인 기능**: 백엔드 API 연결 확인
- [ ] **프로젝트 목록**: API 데이터 로딩 확인
- [ ] **실시간 기능**: WebSocket 연결 확인
- [ ] **피드백 시스템**: 전체 기능 동작 확인

## ⚠️ 주의사항

### 1. 환경변수 이름 규칙
- `NEXT_PUBLIC_` 접두사: 클라이언트 사이드에서 접근 가능
- 접두사 없는 변수: 서버 사이드에서만 접근 가능

### 2. 보안 고려사항
- API 키나 시크릿은 `NEXT_PUBLIC_` 접두사 사용 금지
- 공개 URL만 `NEXT_PUBLIC_` 접두사 사용

### 3. 캐시 정책
- Vercel은 환경변수 변경 시 자동으로 빌드 캐시 무효화
- 변경사항이 즉시 반영되지 않을 경우 강제 재배포 실행

## 🔍 문제 해결 가이드

### 1. 환경변수가 undefined로 나타나는 경우
```bash
# 원인 1: Vercel 대시보드에 환경변수 미설정
해결: 위의 설정 방법에 따라 환경변수 추가

# 원인 2: 잘못된 환경변수 이름 사용
해결: NEXT_PUBLIC_ 접두사 확인

# 원인 3: 배포 후 캐시 문제
해결: Vercel 대시보드에서 강제 재배포 실행
```

### 2. API 연결 오류 발생 시
```bash
# 원인 1: 프로토콜 누락
❌ videoplanet.up.railway.app
✅ https://videoplanet.up.railway.app

# 원인 2: Railway 백엔드 서버 다운
해결: Railway 대시보드에서 서버 상태 확인

# 원인 3: CORS 설정 문제
해결: Railway Django 설정에서 Vercel 도메인 추가
```

### 3. WebSocket 연결 실패 시
```bash
# 원인 1: HTTP 프로토콜 사용
❌ https://videoplanet.up.railway.app
✅ wss://videoplanet.up.railway.app

# 원인 2: WebSocket 서버 미실행
해결: Railway Django WebSocket 설정 확인
```

## 📋 최종 체크리스트

배포 전 다음 항목들을 모두 확인하세요:

- [ ] 모든 필수 환경변수가 Vercel 대시보드에 설정됨
- [ ] URL 형식이 올바름 (프로토콜 포함, 트레일링 슬래시 제거)
- [ ] `NODE_ENV=production` 설정됨
- [ ] 환경변수 적용 범위가 올바르게 설정됨 (Production, Preview)
- [ ] 재배포 완료 후 브라우저에서 환경변수 값 확인
- [ ] 주요 기능들이 정상 작동함 (로그인, API 호출, WebSocket)

---

**최종 업데이트**: 2025-08-17  
**작성자**: VideoPlanet 개발팀  
**관련 파일**: `lib/config.ts`, `.env.production`, `vercel.json`