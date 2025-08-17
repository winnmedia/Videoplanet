# 📚 VideoPlanet 배포 가이드

## 🚀 Vercel 배포 방법

### 방법 1: Vercel CLI를 통한 배포

1. **Vercel CLI 로그인**
```bash
npx vercel login
```

2. **프로젝트 연결 (최초 1회)**
```bash
npx vercel link
```
- 프로젝트 선택 또는 새 프로젝트 생성
- 팀 계정 선택

3. **환경변수 설정**
```bash
# Production 환경변수 설정
npx vercel env add NEXT_PUBLIC_API_URL production
# 값: https://videoplanet.up.railway.app

npx vercel env add NEXT_PUBLIC_BACKEND_API_URL production
# 값: https://videoplanet.up.railway.app

npx vercel env add NEXT_PUBLIC_WS_URL production
# 값: wss://videoplanet.up.railway.app
```

4. **프로덕션 배포**
```bash
npx vercel --prod
```

### 방법 2: GitHub 자동 배포 (권장)

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com) 로그인
   
2. **프로젝트 Import**
   - "New Project" 클릭
   - GitHub 리포지토리 선택: `winnmedia/Videoplanet`
   - Framework Preset: Next.js 자동 감지

3. **환경변수 설정**
   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | NEXT_PUBLIC_API_URL | https://videoplanet.up.railway.app | Production |
   | NEXT_PUBLIC_BACKEND_API_URL | https://videoplanet.up.railway.app | Production |
   | NEXT_PUBLIC_WS_URL | wss://videoplanet.up.railway.app | Production |

4. **빌드 설정**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy 클릭**

### 방법 3: 수동 웹 배포

1. **빌드 생성**
```bash
npm run build
```

2. **Vercel 웹사이트에서 배포**
   - [vercel.com/new](https://vercel.com/new) 접속
   - "Import Git Repository" 선택
   - `https://github.com/winnmedia/Videoplanet` 입력

## 📝 배포 전 체크리스트

- [x] 프로덕션 빌드 테스트 완료
- [x] TypeScript 타입 체크 통과
- [x] 환경변수 설정 확인
- [x] Railway 백엔드 서버 정상 작동
- [x] Git 커밋 및 푸시 완료

## 🔍 배포 후 검증

### 1. 기본 접속 테스트
```bash
# 배포된 URL 확인 (예: https://videoplanet.vercel.app)
curl -I https://videoplanet.vercel.app
```

### 2. API 연결 테스트
```bash
# 브라우저 개발자 도구에서 확인
# Network 탭에서 API 요청이 https://videoplanet.up.railway.app로 가는지 확인
```

### 3. 주요 페이지 테스트
- `/login` - 로그인 페이지
- `/dashboard` - 대시보드 (인증 필요)
- `/projects` - 프로젝트 목록 (인증 필요)
- `/planning` - 기획 페이지

## 🛠 문제 해결

### CORS 오류 발생 시
Railway 백엔드에서 Vercel 도메인 허용:
```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "https://videoplanet.vercel.app",
    "https://*.vercel.app",  # Preview deployments
]
```

### 환경변수가 적용되지 않을 때
1. Vercel 대시보드 > Settings > Environment Variables
2. 변수 추가 후 Redeploy 필요
3. `NEXT_PUBLIC_` 접두사 확인

### 빌드 실패 시
1. 로컬에서 `npm run build` 성공 확인
2. Node.js 버전 확인 (18.x 권장)
3. `package-lock.json` 파일 포함 확인

## 📊 배포 정보

- **GitHub Repository**: https://github.com/winnmedia/Videoplanet
- **Railway Backend**: https://videoplanet.up.railway.app
- **Vercel Frontend**: https://videoplanet.vercel.app (예정)
- **프레임워크**: Next.js 14.2.31
- **Node Version**: 18.x
- **Region**: ICN1 (Seoul)

## 🔄 지속적 배포

GitHub master 브랜치에 푸시하면 자동으로 배포됩니다:
```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin master
```

## 📞 지원

배포 관련 문제 발생 시:
1. Vercel 대시보드에서 빌드 로그 확인
2. Railway 대시보드에서 백엔드 로그 확인
3. GitHub Issues에 문제 보고

---

최종 업데이트: 2025-08-18