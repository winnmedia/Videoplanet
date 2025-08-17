# Vercel 배포 환경변수 설정 가이드

## 필수 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 설정해야 합니다:

### 1. 백엔드 API URL
```bash
NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet-backend.railway.app
```

### 2. WebSocket URL (선택사항)
```bash
NEXT_PUBLIC_SOCKET_URI=wss://videoplanet-backend.railway.app
```

### 3. 프론트엔드 앱 URL (선택사항)
```bash
NEXT_PUBLIC_APP_URL=https://videoplanet.vercel.app
```

## 설정 방법

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 
   - VideoPlanet 프로젝트 선택

2. **Environment Variables 설정**
   - Settings → Environment Variables
   - Add New Variable 클릭

3. **각 환경변수 추가**
   ```
   Name: NEXT_PUBLIC_BACKEND_API_URL
   Value: https://videoplanet-backend.railway.app
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

4. **배포 트리거**
   - GitHub에 커밋 푸시하면 자동 재배포
   - 또는 Vercel 대시보드에서 수동 재배포

## 검증 방법

배포 후 다음 방법으로 환경변수가 올바르게 설정되었는지 확인:

1. **브라우저 개발자 도구**
   ```javascript
   // 콘솔에서 확인
   console.log('API_BASE_URL configured:', process.env.NEXT_PUBLIC_BACKEND_API_URL)
   ```

2. **Network 탭 확인**
   - API 요청이 https://videoplanet-backend.railway.app으로 전송되는지 확인
   - undefined 또는 localhost로 요청되면 환경변수 미설정

3. **로그인 페이지 테스트**
   - 로그인 시도 시 올바른 API 엔드포인트로 요청되는지 확인

## 문제 해결

### API_BASE_URL이 undefined인 경우
1. Vercel 환경변수 설정 확인
2. 변수명 정확성 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 재배포 필요 (환경변수 변경 후)

### localhost로 요청되는 경우
1. 프로덕션 환경에서 개발 환경변수가 사용되고 있음
2. Environment 설정에서 Production 체크 확인
3. 캐시 클리어 후 재배포

## 주의사항

- `NEXT_PUBLIC_` 접두사가 있는 환경변수만 클라이언트에서 접근 가능
- 환경변수 변경 후 반드시 재배포 필요
- 민감한 정보는 `NEXT_PUBLIC_` 접두사 사용 금지

## 현재 설정 상태

✅ 개발 환경: .env.local 파일로 설정 완료
❌ 프로덕션 환경: Vercel 환경변수 설정 필요

## 추가 확인 사항

### Railway 백엔드 CORS 설정
Django 백엔드에서 Vercel 도메인 허용 확인:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://videoplanet.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
]
```

### 환경변수 우선순위
1. `NEXT_PUBLIC_BACKEND_API_URL` (최우선)
2. `REACT_APP_BACKEND_API_URL` (레거시 호환)
3. 기본값: `https://videoplanet-backend.railway.app`