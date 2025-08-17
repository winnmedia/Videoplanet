# VideoPlanet 테스트 계정 정보

## 🔐 테스트 계정 목록

### 1. 일반 사용자 계정
- **이메일**: test@videoplanet.com
- **비밀번호**: Test1234!
- **권한**: 일반 사용자
- **용도**: 일반 기능 테스트

### 2. 관리자 계정
- **이메일**: admin@videoplanet.com
- **비밀번호**: Admin1234!
- **권한**: 관리자 (슈퍼유저)
- **용도**: 관리자 기능 테스트

### 3. 데모 계정
- **이메일**: demo@videoplanet.com
- **비밀번호**: Demo1234!
- **권한**: 일반 사용자
- **용도**: 데모 및 프레젠테이션

## 📝 계정 생성 방법

### Django Admin을 통한 생성
```bash
# Railway 서버에서 실행
python manage.py createsuperuser
```

### API를 통한 회원가입
1. 로그인 페이지에서 "간편 가입하기" 클릭
2. 이메일과 비밀번호 입력
3. 이메일 인증 완료

## 🌐 접속 URL

### 로컬 개발 환경
- **프론트엔드**: http://localhost:3001
- **로그인 페이지**: http://localhost:3001/login

### 프로덕션 환경 (Vercel)
- **프론트엔드**: https://videoplanet.vercel.app
- **로그인 페이지**: https://videoplanet.vercel.app/login

### 백엔드 API (Railway)
- **API URL**: https://videoplanet.up.railway.app
- **Django Admin**: https://videoplanet.up.railway.app/admin

## ⚠️ 주의사항

1. **보안 주의**: 이 계정들은 개발/테스트 용도로만 사용하세요
2. **프로덕션 환경**: 실제 서비스에서는 더 강력한 비밀번호를 사용하세요
3. **계정 초기화**: 필요시 Django Admin에서 비밀번호 재설정 가능

## 🔧 문제 해결

### 로그인이 안 될 때
1. API URL이 올바르게 설정되었는지 확인
   - `.env.local` 파일 확인
   - `NEXT_PUBLIC_BACKEND_API_URL=https://videoplanet.up.railway.app`

2. 네트워크 탭에서 API 호출 확인
   - 브라우저 개발자 도구 (F12)
   - Network 탭에서 `/api/v1/auth/signin` 요청 확인

3. CORS 에러 확인
   - 백엔드 CORS 설정에 프론트엔드 URL 추가 필요

### 계정 생성이 필요할 때
Railway 서버에 SSH 접속 후:
```bash
python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_user(
    username='test@videoplanet.com',
    email='test@videoplanet.com',
    password='Test1234!'
)
```

---

**마지막 업데이트**: 2025-08-17
**작성자**: Claude Code Assistant