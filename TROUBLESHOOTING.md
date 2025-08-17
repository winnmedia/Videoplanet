# 🔧 VideoPlanet 문제 해결 가이드

## 📋 현재 상태

### ✅ 작동하는 것들
1. **백엔드 서버** (Railway): https://videoplanet.up.railway.app
   - Health check: `/health/` - 200 OK
   - Login API: `/users/login` - 403 (정상 - 사용자 없음)

2. **프론트엔드 서버** (로컬): http://localhost:3001
   - 홈페이지 정상 로드
   - 로그인 페이지 정상 렌더링

### ❌ 문제점
1. **로그인 버튼 클릭 시 무반응**
   - 콘솔 로그가 출력되지 않음
   - API 호출이 발생하지 않음

## 🔍 문제 진단 방법

### 1. 브라우저 콘솔에서 직접 테스트
```javascript
// 브라우저 개발자 도구 콘솔(F12)에서 실행
console.log('테스트 시작');

// 1. API 연결 테스트
fetch('https://videoplanet.up.railway.app/health/')
  .then(res => res.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err));

// 2. 로그인 API 테스트
fetch('https://videoplanet.up.railway.app/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  })
})
.then(res => res.json())
.then(data => console.log('Login response:', data))
.catch(err => console.error('Login failed:', err));

// 3. 버튼 클릭 이벤트 테스트
document.querySelector('.submit-button')?.click();
```

### 2. Next.js Hydration 문제 확인
```javascript
// 페이지가 완전히 로드되었는지 확인
console.log('Page loaded:', document.readyState);
console.log('React hydrated:', window.__NEXT_DATA__ ? 'Yes' : 'No');
```

### 3. 이벤트 리스너 확인
```javascript
// 버튼의 이벤트 리스너 확인
const button = document.querySelector('.submit-button');
console.log('Button found:', button);
console.log('Button onclick:', button?.onclick);

// 수동으로 이벤트 트리거
if (button) {
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
```

## 🛠️ 해결 방법

### 해결책 1: React Hydration 대기
```javascript
// 페이지 로드 후 3초 대기
setTimeout(() => {
  console.log('Trying to click login button...');
  document.querySelector('.submit-button')?.click();
}, 3000);
```

### 해결책 2: CORS 헤더 확인
Railway 대시보드에서 환경변수 추가:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
ALLOWED_HOSTS=videoplanet.up.railway.app,localhost
```

### 해결책 3: 캐시 초기화
```bash
# 터미널에서 실행
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### 해결책 4: 브라우저 캐시 초기화
1. 개발자 도구 열기 (F12)
2. Network 탭 → Disable cache 체크
3. Ctrl+Shift+R (강제 새로고침)

## 📊 API 엔드포인트 정보

### 인증 관련
- **Health Check**: GET `/health/`
- **로그인**: POST `/users/login`
  - Body: `{"email": "test@example.com", "password": "test123"}`
- **회원가입**: POST `/users/signup`
- **비밀번호 재설정**: POST `/users/password_reset`

### 응답 코드
- **200**: 성공
- **403**: 인증 실패 (사용자 없음)
- **404**: 엔드포인트 없음
- **500**: 서버 에러

## 🚨 알려진 문제

### 1. Next.js Client-Side Hydration
- **증상**: 페이지 로드 후 버튼이 작동하지 않음
- **원인**: React hydration이 완료되지 않음
- **해결**: 페이지 완전 로드 후 테스트

### 2. CORS 정책
- **증상**: API 호출 시 CORS 에러
- **원인**: Railway 백엔드에서 localhost 허용 안 함
- **해결**: Railway 환경변수에 CORS 설정 추가

### 3. 환경변수 로드
- **증상**: API_BASE_URL undefined
- **원인**: .env.local 파일이 로드되지 않음
- **해결**: 서버 재시작

## 📝 체크리스트

로그인 기능이 작동하지 않을 때:

- [ ] 브라우저 콘솔에 에러가 있는가?
- [ ] Network 탭에서 API 요청이 보이는가?
- [ ] 로그인 버튼 클릭 시 콘솔 로그가 출력되는가?
- [ ] API_BASE_URL이 올바르게 설정되었는가?
- [ ] Railway 백엔드가 실행 중인가?
- [ ] CORS 설정이 올바른가?
- [ ] 브라우저 캐시를 지웠는가?
- [ ] Next.js 캐시를 지웠는가?

## 🆘 긴급 연락처

- **Railway 상태**: https://status.railway.app
- **Vercel 상태**: https://www.vercel-status.com
- **GitHub Issues**: https://github.com/anthropics/claude-code/issues

---

**마지막 업데이트**: 2025-08-17
**작성자**: Claude Code Assistant