# Railway 백엔드 CORS 설정 가이드

## 🔗 로컬 프론트엔드와 Railway 백엔드 연결

### 현재 설정
- **로컬 프론트엔드**: http://localhost:3001
- **Railway 백엔드**: https://videoplanet.up.railway.app

### ✅ 프론트엔드 설정 (완료)
`.env.local` 파일:
```env
NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
```

### ⚠️ Railway 백엔드 CORS 설정 (필요)

Railway 대시보드에서 다음 환경변수를 추가해야 합니다:

#### 1. CORS 허용 도메인 추가
```env
CORS_ALLOWED_ORIGINS=https://videoplanet.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002
ALLOWED_HOSTS=videoplanet.up.railway.app,localhost
```

#### 2. Django settings.py CORS 설정
`vridge_back/config/settings.py` 또는 `settings_railway.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://videoplanet.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### 🧪 연결 테스트

#### 1. 개발 서버 재시작
```bash
# 프론트엔드 재시작
npm run dev
```

#### 2. API 연결 테스트
브라우저 콘솔에서:
```javascript
fetch('https://videoplanet.up.railway.app/api/v1/health/')
  .then(res => res.json())
  .then(data => console.log(data))
```

#### 3. 로그인 테스트
- URL: http://localhost:3001/login
- 테스트 계정:
  - 이메일: test@videoplanet.com
  - 비밀번호: Test1234!

### 🔍 문제 해결

#### CORS 에러가 발생하는 경우
1. 브라우저 개발자 도구 > Network 탭 확인
2. 에러 메시지 확인:
   - `Access-Control-Allow-Origin` 헤더 누락
   - 자격 증명 포함 요청 거부

#### 해결 방법
1. Railway 대시보드에서 환경변수 확인
2. 백엔드 재배포:
   ```bash
   railway up
   ```

### 📝 API 엔드포인트

#### 인증 관련
- **로그인**: POST `/api/v1/auth/signin/`
- **회원가입**: POST `/api/v1/auth/signup/`
- **로그아웃**: POST `/api/v1/auth/signout/`
- **세션 확인**: GET `/api/v1/auth/session/`

#### 프로젝트 관련
- **프로젝트 목록**: GET `/api/v1/projects/`
- **프로젝트 생성**: POST `/api/v1/projects/`
- **프로젝트 상세**: GET `/api/v1/projects/{id}/`

### 🎯 장점

1. **실시간 테스트**: 프로덕션 백엔드를 사용하여 실제 환경과 동일한 테스트
2. **데이터 일관성**: 프로덕션 데이터베이스 사용
3. **빠른 개발**: 백엔드 서버를 로컬에서 실행할 필요 없음

### ⚠️ 주의사항

1. **프로덕션 데이터**: 실제 데이터를 다루므로 주의 필요
2. **API 제한**: Railway 무료 플랜의 경우 요청 제한 있음
3. **보안**: 민감한 데이터 처리 시 HTTPS 사용 필수

---

**마지막 업데이트**: 2025-08-17
**작성자**: Claude Code Assistant