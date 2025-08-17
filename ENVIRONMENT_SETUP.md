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

Vercel 대시보드에서 다음 환경변수를 설정하세요:

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - VideoPlanet 프로젝트 선택

2. **환경변수 설정**
   - Settings → Environment Variables
   - Add New Variable 클릭

3. **필수 환경변수**
   ```
   Name: NEXT_PUBLIC_BACKEND_API_URL
   Value: https://videoplanet.up.railway.app
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

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