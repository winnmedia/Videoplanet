# Vercel 배포 가이드 - API URL 설정

## 🚨 중요: 프로토콜 누락 문제 해결

### 문제 상황
- 환경변수에 `videoplanet.up.railway.app` (프로토콜 없음) 설정 시
- 브라우저가 상대 경로로 인식하여 `https://www.vlanet.net/videoplanet.up.railway.app`로 잘못 요청

### 해결 방법

## 1. Vercel 대시보드 환경변수 설정

### 필수 환경변수 (모든 환경: Production, Preview, Development)

```bash
# ✅ 올바른 설정 (프로토콜 포함)
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_WS_URL=wss://videoplanet.up.railway.app
NEXT_PUBLIC_SOCKET_URI=wss://videoplanet.up.railway.app
NEXT_PUBLIC_APP_URL=https://videoplanet.vercel.app
NODE_ENV=production
```

### ❌ 잘못된 설정 (절대 금지)

```bash
# 프로토콜 없음 - 상대 경로 문제 발생
NEXT_PUBLIC_API_URL=videoplanet.up.railway.app

# 잘못된 프로토콜
NEXT_PUBLIC_WS_URL=https://videoplanet.up.railway.app  # WebSocket은 wss://

# 트레일링 슬래시
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app/
```

## 2. Vercel 배포 단계별 가이드

### Step 1: Vercel 대시보드 접속
1. https://vercel.com/dashboard 이동
2. VideoplanetProject 선택
3. Settings → Environment Variables

### Step 2: 환경변수 추가
각 환경변수를 다음과 같이 설정:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://videoplanet.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_BACKEND_API_URL` | `https://videoplanet.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_WS_URL` | `wss://videoplanet.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_SOCKET_URI` | `wss://videoplanet.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://videoplanet.vercel.app` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### Step 3: 배포 및 검증
1. 환경변수 저장 후 자동 재배포 대기
2. 배포 완료 후 브라우저에서 확인
3. F12 개발자 도구 → Console에서 검증:
   ```javascript
   console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
   ```

## 3. 문제 발생 시 디버깅

### 디버그 페이지 접속
- URL: `https://[your-domain]/debug-url`
- 모든 환경변수와 URL 설정 상태 확인 가능

### 로그 확인
개발자 도구 Console에서 다음 로그 확인:
```
[normalizeUrl] Normalized: videoplanet.up.railway.app → https://videoplanet.up.railway.app
[API Client] URL construction test passed: https://videoplanet.up.railway.app/test
[API Client] Initialized with baseURL: https://videoplanet.up.railway.app
```

### 문제 징후
❌ 다음 로그가 나타나면 환경변수 재설정 필요:
```
[normalizeUrl] Adding protocol to: videoplanet.up.railway.app
[API Client] Warning: API_BASE_URL does not contain expected railway.app domain
API request failed: ERR_NETWORK
```

## 4. 자동 검증 스크립트

### 로컬 검증
```bash
npm run validate-env
```

### API 연결 테스트
```bash
curl -X POST "https://videoplanet.up.railway.app/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 5. 체크리스트

### 배포 전 확인사항
- [ ] 모든 환경변수에 올바른 프로토콜 포함 (`https://`, `wss://`)
- [ ] 트레일링 슬래시 제거
- [ ] Railway 백엔드 정상 작동 확인
- [ ] 로컬 환경에서 환경변수 검증 통과

### 배포 후 확인사항
- [ ] `/debug-url` 페이지에서 URL 설정 정상 확인
- [ ] 로그인 기능 정상 작동
- [ ] API 요청이 올바른 도메인으로 전송되는지 확인
- [ ] Network 탭에서 요청 URL 검증

## 6. 응급 복구 방법

문제 발생 시 즉시 복구:

1. **환경변수 롤백**
   ```bash
   NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
   ```

2. **재배포 트리거**
   - Vercel 대시보드 → Deployments → 최신 배포 → Redeploy

3. **로컬에서 검증 후 재배포**
   ```bash
   npm run validate-env
   npm run build
   ```

## 7. 지원 및 문의

- 배포 문제 발생 시: 이 가이드의 Step 2부터 재시도
- API 연결 문제: Railway 백엔드 상태 확인
- 환경변수 문제: `npm run validate-env` 로 로컬 검증 먼저 실행

---

**최종 업데이트**: 2025-08-17  
**버전**: 2.0.0 (프로토콜 누락 문제 해결)