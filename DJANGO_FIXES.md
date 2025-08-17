# Django 백엔드 수정 필요사항

## 1. CSRF 토큰 문제 해결

### 옵션 1: API View에 CSRF 면제 적용
```python
# vridge_back/users/views.py
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    def post(self, request):
        # 로그인 로직
```

### 옵션 2: CORS 및 CSRF 설정 수정
```python
# vridge_back/settings.py
CSRF_TRUSTED_ORIGINS = [
    'https://videoplanet.vercel.app',
    'http://localhost:3001',
    'https://videoplanet.up.railway.app',
]

CORS_ALLOWED_ORIGINS = [
    'https://videoplanet.vercel.app',
    'http://localhost:3001',
]

CORS_ALLOW_CREDENTIALS = True
```

## 2. JSON 파싱 에러 수정

### 문제
특수문자가 포함된 비밀번호 처리 시 에러 발생

### 해결
```python
# vridge_back/users/views.py
import json

def post(self, request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError as e:
        return JsonResponse({'message': 'Invalid JSON format'}, status=400)
```

## 3. Django Admin 정적 파일 경로 수정

### settings.py 수정
```python
# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Admin 정적 파일 경로 명시적 설정
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Railway 배포 시 정적 파일 서빙
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Railway 배포 스크립트 수정
```bash
# railway.json 또는 Procfile
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn vridge_back.wsgi:application
```

## 4. API 엔드포인트 정리

### 현재 사용 가능한 엔드포인트
- POST `/users/login` - 로그인
- POST `/users/signup` - 회원가입
- GET `/users/profile/` - 프로필 조회

### 프론트엔드 수정 필요
```typescript
// features/auth/api/authApi.ts
signIn: (data: LoginCredentials) => {
  return axiosCredentials(
    'post',
    `${API_BASE_URL}/users/login`,  // 올바른 엔드포인트
    data
  )
}
```

## 5. 로그인 API 응답 형식 통일

### 현재 응답
```json
{
  "message": "존재하지 않는 사용자입니다."
}
```

### 권장 응답 형식
```json
{
  "success": false,
  "message": "존재하지 않는 사용자입니다.",
  "error_code": "USER_NOT_FOUND"
}
```

## 6. 테스트 계정 생성

Django shell을 통한 테스트 계정 생성:
```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# 테스트 계정 생성
User.objects.create_user(
    username='demo@videoplanet.com',
    email='demo@videoplanet.com',
    password='Demo1234!'
)

User.objects.create_user(
    username='test@videoplanet.com',
    email='test@videoplanet.com',
    password='Test1234!'
)
```

## 7. 환경 변수 확인

Railway 대시보드에서 설정 필요:
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` = videoplanet.up.railway.app
- `DJANGO_DEBUG` = False
- `DATABASE_URL` (PostgreSQL)

## 8. 로깅 개선

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## 즉시 적용 가능한 수정사항

1. **CSRF 면제** - 가장 빠른 해결책
2. **JSON 파싱 에러 처리** - 안정성 향상
3. **테스트 계정 생성** - 즉시 테스트 가능

## 장기적 개선사항

1. JWT 토큰 기반 인증으로 전환
2. API 문서화 (Swagger/OpenAPI)
3. Rate limiting 구현
4. 로그 모니터링 시스템 구축