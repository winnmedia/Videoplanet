# VideoPlanet 환경변수 설정 가이드

## 개발 환경 (.env.local)

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet.up.railway.app

# Development Settings
NODE_ENV=development

# Next.js Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 프로덕션 환경 (Vercel)

### 현재 Vercel에 설정된 환경변수들:
- `NEXT_PUBLIC_API_URL` - API 서버 URL (설정 필요: `https://videoplanet.up.railway.app`)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (설정 필요: `wss://videoplanet.up.railway.app`)
- `NEXT_PUBLIC_SOCKET_URI` - Socket.IO URL
- `NEXT_PUBLIC_PRODUCTION_DOMAIN` - 프로덕션 도메인
- `NEXT_PUBLIC_APP` - 앱 URL
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - reCAPTCHA 사이트 키
- `ALLOWED_HOSTS` - 허용된 호스트

### 필수 업데이트가 필요한 환경변수:

1. **API URL 설정**
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://videoplanet.up.railway.app
   ```

2. **WebSocket URL 설정**
   ```
   Name: NEXT_PUBLIC_WS_URL
   Value: wss://videoplanet.up.railway.app
   ```

### 코드 호환성
코드는 다음 우선순위로 환경변수를 체크합니다:
1. `NEXT_PUBLIC_API_URL` (Vercel 환경변수)
2. `NEXT_PUBLIC_BACKEND_API_URL` (로컬 환경변수)
3. 기본값: `https://videoplanet.up.railway.app`

4. **재배포**
   - 환경변수 설정 후 재배포 필요
   - Deployments → Redeploy 클릭

## Railway 백엔드 URL

현재 백엔드 API URL: `https://videoplanet.up.railway.app`

## 검증 방법

브라우저 콘솔에서 확인:
```javascript
console.log(process.env.NEXT_PUBLIC_BACKEND_API_URL)
// 출력: https://videoplanet.up.railway.app
```

네트워크 탭에서 API 호출 확인:
- 모든 API 요청이 `https://videoplanet.up.railway.app`로 전송되어야 함

---

**마지막 업데이트**: 2025-08-17