# Railway 배포 가이드

## 사전 준비

1. Railway 계정 생성 (https://railway.app)
2. Railway CLI 설치 (선택사항)
   ```bash
   npm install -g @railway/cli
   ```

## 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정해야 합니다:

### 필수 환경 변수

```bash
# Django
SECRET_KEY=your-secret-key-here-generate-new-one
DEBUG=False
ALGORITHM=HS256
RAILWAY_ENVIRONMENT=production

# Database (Railway에서 PostgreSQL 서비스 추가시 자동 생성)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Redis (Railway에서 Redis 서비스 추가시 자동 생성)
REDIS_URL=redis://default:password@host:port

# Allowed Hosts (Railway 도메인 포함)
ALLOWED_HOSTS=yourdomain.com,your-app.railway.app

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://your-frontend.vercel.app
```

### 선택적 환경 변수

```bash
# Email (Gmail 사용시)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# OAuth (필요한 경우)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
KAKAO_API_KEY=your-kakao-api-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_SECRET_KEY=your-naver-secret-key

# Sentry (에러 트래킹)
SENTRY_DSN=your-sentry-dsn
```

## 배포 절차

### 1. GitHub 저장소 준비

```bash
git add .
git commit -m "Railway 배포 준비"
git push origin main
```

### 2. Railway 프로젝트 생성

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. GitHub 저장소 연결 및 선택

### 3. 서비스 추가

#### PostgreSQL 데이터베이스
1. "New" → "Database" → "Add PostgreSQL" 클릭
2. 생성 후 DATABASE_URL이 자동으로 환경 변수에 추가됨

#### Redis (WebSocket용)
1. "New" → "Database" → "Add Redis" 클릭
2. 생성 후 REDIS_URL이 자동으로 환경 변수에 추가됨

### 4. 볼륨 설정 (미디어 파일 저장)

```bash
# Railway CLI 사용
railway volume create media --mount /app/media

# 또는 대시보드에서
# Settings → Volumes → Add Volume
# Mount path: /app/media
```

### 5. 기존 데이터 마이그레이션 (선택사항)

#### S3에서 파일 마이그레이션
```bash
# 로컬에서 실행
python scripts/migrate_from_s3.py

# 파일을 볼륨으로 업로드
railway run python manage.py ensure_media_dirs
```

#### 데이터베이스 마이그레이션
```bash
# 기존 데이터 덤프
pg_dump old_database > backup.sql

# Railway PostgreSQL로 복원
railway run psql $DATABASE_URL < backup.sql
```

### 6. 배포 확인

1. Railway 대시보드에서 빌드 로그 확인
2. 배포 완료 후 도메인 확인
3. 관리자 계정 생성:
   ```bash
   railway run python manage.py createsuperuser
   ```

## 커스텀 도메인 설정

1. Railway 대시보드 → Settings → Domains
2. "Add Domain" 클릭
3. 도메인 입력 (예: api.yourdomain.com)
4. DNS 설정:
   - CNAME 레코드 추가
   - Name: api (또는 원하는 서브도메인)
   - Value: your-app.railway.app

## 모니터링 및 로그

### 로그 확인
```bash
# CLI 사용
railway logs

# 또는 대시보드에서 Deployments → View Logs
```

### 메트릭 확인
- Railway 대시보드 → Metrics
- CPU, Memory, Network 사용량 모니터링

## 트러블슈팅

### 1. Static 파일이 로드되지 않는 경우
```bash
railway run python manage.py collectstatic --noinput
```

### 2. 마이그레이션 오류
```bash
railway run python manage.py migrate --run-syncdb
```

### 3. WebSocket 연결 실패
- REDIS_URL 환경 변수 확인
- ALLOWED_HOSTS에 WebSocket 도메인 추가
- CORS_ALLOWED_ORIGINS 확인

### 4. 미디어 파일 업로드 실패
- 볼륨이 올바르게 마운트되었는지 확인
- 권한 문제 확인:
  ```bash
  railway run python manage.py ensure_media_dirs
  ```

## 로컬 개발 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 수정
nano .env

# Poetry 의존성 설치
poetry install

# 개발 서버 실행
poetry run python manage.py runserver
```

## 업데이트 배포

```bash
# 코드 변경 후
git add .
git commit -m "Update: 기능 설명"
git push origin main

# Railway가 자동으로 재배포
```

## 롤백

Railway 대시보드에서:
1. Deployments 탭으로 이동
2. 이전 성공적인 배포 선택
3. "Redeploy" 클릭

## 보안 체크리스트

- [ ] SECRET_KEY 변경 (프로덕션용 새로 생성)
- [ ] DEBUG=False 설정
- [ ] ALLOWED_HOSTS 제한
- [ ] CORS_ALLOWED_ORIGINS 제한
- [ ] HTTPS 강제 사용
- [ ] 민감한 정보는 환경 변수로 관리
- [ ] Sentry 또는 에러 트래킹 설정
- [ ] 정기 백업 설정

## 성능 최적화

1. **Gunicorn Workers 조정**
   - Procfile에서 worker 수 조정
   - 기본값: 4 workers

2. **데이터베이스 연결 풀링**
   - settings_production.py의 conn_max_age 조정

3. **정적 파일 압축**
   - WhiteNoise가 자동으로 처리

4. **캐싱 설정** (선택사항)
   - Redis를 캐시 백엔드로 활용

## 지원 및 문서

- Railway 문서: https://docs.railway.app
- Django 배포 가이드: https://docs.djangoproject.com/en/4.2/howto/deployment/
- 문제 발생시: Railway Discord 커뮤니티