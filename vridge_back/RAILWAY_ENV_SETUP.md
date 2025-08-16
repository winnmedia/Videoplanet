# Railway 환경 변수 설정 가이드

## 필수 환경 변수

Railway 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Django 기본 설정
```env
SECRET_KEY=your-very-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings_production
```

### 2. 도메인 설정 (vlanet.net)
```env
ALLOWED_HOSTS=vlanet.net,*.railway.app
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://your-backend.railway.app
CSRF_TRUSTED_ORIGINS=https://vlanet.net,https://your-backend.railway.app
```

### 3. 이메일 설정 (SendGrid)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@vlanet.net
```

### 4. 관리자 계정 (선택사항)
```env
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@vlanet.net
DJANGO_SUPERUSER_PASSWORD=your-secure-password
```

### 5. 로깅 설정
```env
LOG_LEVEL=INFO
DJANGO_LOG_LEVEL=INFO
```

## Railway가 자동으로 제공하는 변수

다음 변수들은 Railway가 자동으로 설정합니다:

- `DATABASE_URL` - PostgreSQL 서비스 추가 시 자동 설정
- `REDIS_URL` - Redis 서비스 추가 시 자동 설정
- `PORT` - 애플리케이션 포트
- `RAILWAY_PUBLIC_DOMAIN` - 앱의 공개 도메인
- `RAILWAY_ENVIRONMENT` - 현재 환경 (production/staging)

## 설정 방법

1. Railway 대시보드에서 프로젝트 선택
2. Settings → Variables 섹션으로 이동
3. "Add Variable" 클릭하여 각 변수 추가
4. 모든 변수 입력 후 자동으로 재배포 시작

## 주의사항

- `SECRET_KEY`는 반드시 강력한 랜덤 키 사용
- `DJANGO_SUPERUSER_PASSWORD`는 강력한 비밀번호 사용
- SendGrid API 키는 SendGrid 대시보드에서 생성
- 프로덕션에서는 `DEBUG=False` 필수

## 확인 방법

배포 후 다음 엔드포인트로 상태 확인:

- https://your-app.railway.app/ping/
- https://your-app.railway.app/status/
- https://your-app.railway.app/health/?simple=true