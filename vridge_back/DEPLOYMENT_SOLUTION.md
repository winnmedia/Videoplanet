# Railway 배포 문제 최종 해결

## 문제 원인
- Railway가 여전히 `/app/config/settings.py`를 찾고 있었음
- `config.settings.railway`를 제대로 인식하지 못함

## 해결 방법

### 1. 기존 settings.py 제거
```bash
mv config/settings.py config/settings.py.backup
```

### 2. Settings 패키지 구조 생성
```
config/
├── settings/
│   ├── __init__.py    # from .base import *
│   ├── base.py        # 기본 설정 (환경변수 기반)
│   ├── railway.py     # Railway 전용 설정
│   └── local.py       # 로컬 개발용 설정
```

### 3. 주요 파일 수정
- **Dockerfile**: `DJANGO_SETTINGS_MODULE=config.settings.railway`
- **railway.json**: `DJANGO_SETTINGS_MODULE=config.settings.railway`
- **docker-entrypoint.sh**: my_settings.py 생성 로직 제거
- **.dockerignore**: 불필요한 파일 제외

## Railway 환경변수 설정 (필수)

```env
# Django 핵심
SECRET_KEY=your-very-secure-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.railway

# 데이터베이스 (Railway가 자동 제공)
DATABASE_URL=postgresql://...

# 도메인
ALLOWED_HOSTS=vlanet.net,*.railway.app
CORS_ALLOWED_ORIGINS=https://vlanet.net

# 미디어 경로 (Railway 볼륨)
MEDIA_ROOT=/data/media

# 이메일 (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@vlanet.net
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
EMAIL_USE_TLS=True
```

## Railway 서비스 설정

### 1. PostgreSQL 추가
- Railway 대시보드 → New → PostgreSQL
- DATABASE_URL 자동 설정됨

### 2. Redis 추가 (선택사항)
- WebSocket 사용 시 필요
- 없어도 InMemoryChannelLayer로 동작

### 3. 볼륨 추가 (미디어 파일)
- Settings → Volumes → Add Volume
- Mount Path: `/data`
- 용량: 1GB 이상

## 배포 명령

```bash
# 변경사항 커밋
git add .
git commit -m "Fix: Railway deployment settings structure"
git push origin master

# Railway가 자동으로 재배포 시작
```

## 확인 사항

### 헬스체크 엔드포인트
- https://your-app.railway.app/ping/
- https://your-app.railway.app/status/
- https://your-app.railway.app/health/?simple=true

### 로그 확인
```bash
railway logs --tail
```

## 특별 주의사항

1. **settings.py 파일이 있으면 안 됨**
   - 반드시 settings 디렉토리 구조 사용
   - config/settings.py 파일 삭제 필수

2. **my_settings 모듈 완전 제거**
   - 모든 설정을 환경변수로 처리
   - import my_settings 코드 제거

3. **미디어 파일 경로**
   - Railway 볼륨: `/data/media`
   - 로컬: `BASE_DIR/media`

이제 배포가 성공할 것입니다!