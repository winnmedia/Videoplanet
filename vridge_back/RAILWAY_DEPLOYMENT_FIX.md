# Railway 배포 문제 해결 완료

## 수정된 주요 문제들

### A. 설정 모듈 불일치 해결 ✅
- **문제**: `config.settings.railway` 참조했지만 실제로는 존재하지 않아 `config/settings.py`가 로드되며 `my_settings` import 실패
- **해결**: 
  - `DJANGO_SETTINGS_MODULE=config.settings`로 통일
  - `config/settings.py`에서 `my_settings` import 제거
  - 모든 설정값을 환경변수 기반으로 변경

### B. my_settings 의존성 제거 ✅
- **변경 전**: `import my_settings`로 로컬 파일 의존
- **변경 후**: 환경변수 직접 사용
  ```python
  SECRET_KEY = os.environ.get('SECRET_KEY', 'default-key')
  DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')
  ```

### C. 미디어 경로 권한 문제 해결 ✅
- **문제**: `/app/media`는 컨테이너 내부에서 읽기 전용
- **해결**: 
  ```python
  MEDIA_ROOT = os.environ.get('MEDIA_ROOT', '/data/media' if os.path.exists('/data') else str(BASE_DIR / 'media'))
  ```
  - Railway 볼륨은 `/data`에 마운트
  - 로컬 개발 시 fallback 경로 제공

### D. Redis 미설정 시 폴백 처리 ✅
- **문제**: Redis 없으면 앱 시작 실패
- **해결**: InMemoryChannelLayer로 자동 폴백
  ```python
  if REDIS_URL:
      CHANNEL_LAYERS = {"default": {"BACKEND": "channels_redis.core.RedisChannelLayer"}}
  else:
      CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
  ```

### E. 데이터베이스 설정 개선 ✅
- **변경**: `dj_database_url` 사용으로 DATABASE_URL 파싱 자동화
- **장점**: Railway가 제공하는 DATABASE_URL 직접 사용 가능

## Railway 환경변수 설정

### 필수 환경변수
```env
# Django 핵심 설정
SECRET_KEY=your-very-secure-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings

# 도메인 설정
ALLOWED_HOSTS=vlanet.net,*.railway.app
CORS_ALLOWED_ORIGINS=https://vlanet.net
CSRF_TRUSTED_ORIGINS=https://vlanet.net

# 미디어 파일 경로 (Railway 볼륨)
MEDIA_ROOT=/data/media

# 이메일 설정 (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@vlanet.net
```

### Railway가 자동 제공하는 변수
- `DATABASE_URL` - PostgreSQL 추가 시 자동
- `REDIS_URL` - Redis 추가 시 자동 (선택사항)
- `PORT` - 앱 포트
- `RAILWAY_PUBLIC_DOMAIN` - 공개 도메인

## Railway 설정 체크리스트

1. ✅ **환경변수 설정**
   - Railway 대시보드 → Settings → Variables
   - 위 필수 환경변수 모두 추가

2. ✅ **PostgreSQL 서비스 추가**
   - Railway에서 PostgreSQL 서비스 추가
   - DATABASE_URL 자동 설정됨

3. ✅ **볼륨 설정 (미디어 파일용)**
   - Railway 대시보드 → Volumes
   - Mount path: `/data`
   - 미디어 파일 영구 저장

4. ⚠️ **Redis 서비스 (선택사항)**
   - WebSocket 사용 시 필요
   - 없어도 InMemoryChannelLayer로 동작

## 배포 확인

### 헬스체크 엔드포인트
- `/ping/` - 가장 간단한 체크
- `/status/` - 기본 상태
- `/health/?simple=true` - Railway 헬스체크용

### 로그 확인
```bash
# Railway CLI
railway logs

# 또는 Railway 대시보드에서 Logs 탭 확인
```

## 문제 해결 완료

모든 설정 파일이 환경변수 기반으로 수정되어 Railway 배포가 성공할 것입니다.

주요 변경 파일:
- `/vridge_back/config/settings.py` - my_settings 제거, 환경변수 사용
- `/vridge_back/railway.json` - DJANGO_SETTINGS_MODULE을 config.settings로 변경
- `/vridge_back/docker-entrypoint.sh` - my_settings.py 생성 로직 제거, /data/media 경로 사용