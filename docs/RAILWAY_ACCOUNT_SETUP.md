# Railway Django 백엔드 테스트 계정 생성 가이드

## 📌 현재 상황
- **백엔드 서버**: ✅ 정상 작동 중 (https://videoplanet.up.railway.app)
- **API 엔드포인트**: ✅ 정상 응답
- **문제점**: 테스트 계정이 데이터베이스에 존재하지 않음

## 🔧 Railway 콘솔을 통한 계정 생성 방법

### 1단계: Railway 대시보드 접속
1. [Railway](https://railway.app) 로그인
2. VideoPlanet 프로젝트 선택
3. Django 서비스 선택

### 2단계: Railway Shell 실행
Railway 대시보드에서:
```bash
# Railway CLI 사용 시
railway run python manage.py shell

# 또는 Railway 웹 콘솔에서 직접 실행
```

### 3단계: 테스트 계정 생성
Django shell에서 다음 명령어 실행:

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# 일반 테스트 계정 생성
test_user = User.objects.create_user(
    username='test@videoplanet.com',
    email='test@videoplanet.com',
    password='Test1234!'
)
print(f"✅ 테스트 계정 생성: {test_user.email}")

# 관리자 계정 생성
admin_user = User.objects.create_superuser(
    username='admin@videoplanet.com',
    email='admin@videoplanet.com',
    password='Admin1234!'
)
print(f"✅ 관리자 계정 생성: {admin_user.email}")

# 데모 계정 생성
demo_user = User.objects.create_user(
    username='demo@videoplanet.com',
    email='demo@videoplanet.com',
    password='Demo1234!'
)
print(f"✅ 데모 계정 생성: {demo_user.email}")
```

### 4단계: 계정 생성 확인
```python
# 생성된 계정 확인
users = User.objects.all()
for user in users:
    print(f"- {user.email} (관리자: {user.is_superuser})")
```

## 📝 테스트 계정 정보

| 이메일 | 비밀번호 | 권한 | 용도 |
|--------|----------|------|------|
| test@videoplanet.com | Test1234! | 일반 | 일반 사용자 테스트 |
| admin@videoplanet.com | Admin1234! | 관리자 | 관리 기능 테스트 |
| demo@videoplanet.com | Demo1234! | 일반 | 데모 및 프레젠테이션 |

## 🧪 계정 생성 후 테스트

### API를 통한 로그인 테스트
```bash
curl -X POST https://videoplanet.up.railway.app/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@videoplanet.com", "password": "Test1234!"}'
```

### 프론트엔드에서 테스트
1. https://localhost:3001/login 접속
2. 테스트 계정으로 로그인
3. 대시보드 및 각 페이지 접근 확인

## ⚠️ 주의사항

1. **보안**: 프로덕션 환경에서는 더 강력한 비밀번호 사용
2. **백업**: 계정 생성 전 데이터베이스 백업 권장
3. **환경 분리**: 개발/스테이징/프로덕션 환경별 다른 계정 사용

## 🔍 문제 해결

### "이미 존재하는 사용자" 오류
```python
# 기존 사용자 삭제 후 재생성
User.objects.filter(email='test@videoplanet.com').delete()
```

### 비밀번호 재설정
```python
user = User.objects.get(email='test@videoplanet.com')
user.set_password('NewPassword123!')
user.save()
```

### Django Admin 접속
- URL: https://videoplanet.up.railway.app/admin/
- 관리자 계정으로 로그인 후 GUI로 사용자 관리 가능

## 📚 참고 자료
- [Django 사용자 모델 문서](https://docs.djangoproject.com/en/4.0/topics/auth/default/)
- [Railway 문서](https://docs.railway.app/)
- VideoPlanet API 문서: `/docs/API.md`