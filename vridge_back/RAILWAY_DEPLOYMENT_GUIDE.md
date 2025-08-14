# Railway Deployment Guide for Vridge Backend

## Overview
이 가이드는 Vridge Django 백엔드를 Railway에 배포하는 방법을 설명합니다.

## 주요 개선사항

### 1. 헬스체크 개선
- **간단한 헬스체크 엔드포인트 추가**: `/health/?simple=true`
  - 데이터베이스 연결 없이도 응답 가능
  - Railway 헬스체크에 적합
- **다양한 헬스체크 엔드포인트**:
  - `/ping/` - 가장 간단한 체크
  - `/status/` - 기본 상태 확인
  - `/health/` - 전체 시스템 체크
  - `/health/?simple=true` - 의존성 없는 체크

### 2. 설정 파일 개선
- `settings_production.py` 개선:
  - ALLOWED_HOSTS를 `['*']`로 설정 (디버깅용, 나중에 제한 필요)
  - 향상된 로깅 설정
  - 시작 시 환경 변수 출력
  - Redis/Database 실패 시에도 앱 시작 가능

### 3. Docker 및 시작 스크립트 개선
- `docker-entrypoint.sh`:
  - 데이터베이스 연결 실패 시에도 계속 진행
  - 환경 변수 로깅
  - 에러 처리 개선
- `Dockerfile`:
  - curl 설치 (헬스체크용)
  - 간단한 헬스체크 사용

## Railway 배포 단계

### 1. Railway 프로젝트 설정

1. [Railway](https://railway.app) 계정 생성/로그인
2. 새 프로젝트 생성
3. GitHub 저장소 연결

### 2. 서비스 추가

#### PostgreSQL 데이터베이스
```bash
# Railway CLI 사용 (선택사항)
railway add postgresql
```
또는 Railway 대시보드에서 PostgreSQL 서비스 추가

#### Redis (선택사항, WebSocket 사용 시)
```bash
railway add redis
```

### 3. 환경 변수 설정

Railway 대시보드에서 다음 환경 변수 설정:

```env
# 필수 설정
SECRET_KEY=your-very-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings_production

# 도메인 설정 (Railway가 자동으로 제공하는 도메인 사용)
ALLOWED_HOSTS=*.railway.app

# CORS 설정 (프론트엔드 도메인)
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# 관리자 계정 (선택사항)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=secure-password-here

# 로깅 레벨
LOG_LEVEL=INFO
DJANGO_LOG_LEVEL=INFO
```

### 4. 배포 설정

`railway.json` 파일이 이미 구성되어 있음:
- Dockerfile 경로: `vridge_back/Dockerfile`
- 헬스체크: `/health/?simple=true`
- 자동 재시작 정책

### 5. 배포 실행

```bash
# GitHub에 푸시
git add .
git commit -m "Configure for Railway deployment"
git push origin main

# Railway가 자동으로 배포 시작
```

### 6. 배포 확인

1. Railway 대시보드에서 로그 확인
2. 다음 엔드포인트 테스트:
   - `https://your-app.railway.app/ping/`
   - `https://your-app.railway.app/status/`
   - `https://your-app.railway.app/health/?simple=true`

## 트러블슈팅

### 헬스체크 실패
1. 로그 확인: Railway 대시보드 → Logs
2. `/ping/` 엔드포인트 먼저 테스트
3. 환경 변수 확인 (특히 PORT)

### 데이터베이스 연결 실패
1. DATABASE_URL 환경 변수 확인
2. PostgreSQL 서비스 상태 확인
3. 마이그레이션 실행 확인

### 정적 파일 문제
1. `python manage.py collectstatic` 실행 확인
2. WhiteNoise 미들웨어 설정 확인
3. STATIC_ROOT 설정 확인

## 보안 권장사항

배포 후 다음 사항 적용:

1. **ALLOWED_HOSTS 제한**:
   ```python
   # settings_production.py
   ALLOWED_HOSTS = ['your-app.railway.app']
   ```

2. **CORS 설정 제한**:
   ```python
   CORS_ALLOW_ALL_ORIGINS = False
   CORS_ALLOWED_ORIGINS = ['https://your-frontend.com']
   ```

3. **보안 헤더 활성화**:
   ```python
   if not DEBUG:
       SECURE_SSL_REDIRECT = True
       SESSION_COOKIE_SECURE = True
       CSRF_COOKIE_SECURE = True
   ```

4. **SECRET_KEY 변경**:
   - 강력한 랜덤 키 사용
   - 절대 코드에 하드코딩하지 않음

## 모니터링

### 헬스체크 모니터링
- Railway 내장 헬스체크 사용
- 외부 모니터링 서비스 연동 (UptimeRobot, Pingdom 등)

### 로그 모니터링
- Railway 로그 뷰어 사용
- Sentry 통합 (선택사항):
  ```env
  SENTRY_DSN=your-sentry-dsn
  ```

## 성능 최적화

1. **데이터베이스 연결 풀링**:
   - `conn_max_age=600` 설정됨
   - 필요시 pgbouncer 추가

2. **Redis 캐싱**:
   - Django 캐시 백엔드로 Redis 사용
   - 세션 스토리지로 Redis 사용

3. **정적 파일 최적화**:
   - WhiteNoise로 압축 및 캐싱
   - CDN 사용 고려

## 유지보수

### 데이터베이스 마이그레이션
```bash
# Railway CLI 사용
railway run python manage.py migrate
```

### 정적 파일 업데이트
```bash
railway run python manage.py collectstatic --noinput
```

### 로그 확인
```bash
railway logs
```

## 문제 발생 시 연락처

- Railway 지원: https://railway.app/help
- 프로젝트 이슈: GitHub Issues

---

마지막 업데이트: 2024