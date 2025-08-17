# Django CORS 설정 가이드

## 현재 상황 분석

### ✅ 현재 허용된 도메인들
Railway 백엔드에서 현재 다음 도메인들이 CORS에서 허용되고 있습니다:

- ✅ `https://vlanet.net`
- ✅ `https://www.vlanet.net` 
- ✅ `https://api.vlanet.net`
- ✅ `https://videoplanet.vercel.app` (메인 Vercel 도메인)
- ✅ `http://localhost:3000` (로컬 개발)

### ❌ 차단된 도메인들
다음 도메인들은 현재 CORS에서 차단되고 있습니다:

- ❌ `https://videoplanet-git-master-winnmedia.vercel.app` (Vercel Git branch 배포)
- ❌ `https://videoplanet-123abc.vercel.app` (Vercel Preview 배포)
- ❌ `http://127.0.0.1:3000` (로컬 IP 주소)

## 필요한 설정 변경

### 1. 환경변수를 통한 동적 도메인 추가

현재 `vridge_back/config/settings/railway.py` 파일의 라인 93-100에서 환경변수를 통해 CORS 도메인을 추가할 수 있습니다:

```python
# Add environment variable overrides
additional_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and not origin.startswith(('http://', 'https://')):
            origin = f'https://{origin}'
        if origin:
            CORS_ALLOWED_ORIGINS.append(origin)
```

**Railway 환경변수에 다음 값을 설정하세요:**

```bash
CORS_ALLOWED_ORIGINS=videoplanet-git-master-winnmedia.vercel.app,127.0.0.1:3000
```

### 2. 동적 Vercel Preview 도메인 처리

Vercel은 각 PR과 branch마다 고유한 preview 도메인을 생성합니다 (`videoplanet-[hash].vercel.app`). 이를 처리하기 위해 정규식 패턴을 사용합니다.

**`railway.py` 파일에 다음 설정을 추가:**

```python
# Vercel preview 도메인을 위한 정규식 패턴
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://videoplanet.*\.vercel\.app$',  # 모든 Vercel preview 도메인
]
```

### 3. 개발/프로덕션 환경 분리

현재 설정을 개선하여 환경별로 다른 CORS 정책을 적용:

```python
# CORS configuration for production
CORS_ALLOW_ALL_ORIGINS = False

# Base allowed origins
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://api.vlanet.net',
    'https://videoplanet.vercel.app',
]

# Development-specific origins
if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ])

# Railway domain (if available)
if RAILWAY_PUBLIC_DOMAIN:
    CORS_ALLOWED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Environment variable overrides
additional_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and not origin.startswith(('http://', 'https://')):
            origin = f'https://{origin}'
        if origin and origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)

# Vercel preview domains
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://videoplanet.*\.vercel\.app$',
]
```

### 4. CORS 헤더 세부 설정

현재 CORS 설정에서 추가로 검토할 사항들:

```python
# CORS 기본 설정
CORS_ALLOW_CREDENTIALS = True  # 인증 쿠키 허용
CORS_ALLOW_ALL_ORIGINS = False  # 보안을 위해 False 유지

# 허용할 HTTP 메서드
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET', 
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 허용할 HTTP 헤더
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'vridge_session',  # 프로젝트 특정 헤더
]

# Preflight 요청 캐시 시간 (24시간)
CORS_PREFLIGHT_MAX_AGE = 86400
```

## Railway 환경변수 설정 방법

### 1. Railway CLI 사용

```bash
# Railway CLI 로그인
railway login

# 프로젝트 연결
railway link [PROJECT_ID]

# 환경변수 설정
railway variables set CORS_ALLOWED_ORIGINS="videoplanet-git-master-winnmedia.vercel.app,127.0.0.1:3000"
```

### 2. Railway Dashboard 사용

1. [Railway Dashboard](https://railway.app/dashboard) 접속
2. VideoplanetBackend 프로젝트 선택
3. Variables 탭 클릭
4. `CORS_ALLOWED_ORIGINS` 추가:
   ```
   videoplanet-git-master-winnmedia.vercel.app,127.0.0.1:3000
   ```

## CORS 테스트 방법

### 자동 테스트 실행

프로젝트에 포함된 CORS 테스트 스크립트를 사용:

```bash
./scripts/test-cors.sh
```

### 수동 테스트

특정 도메인의 CORS 설정을 확인:

```bash
# Preflight 요청 테스트
curl -I -X OPTIONS https://videoplanet.up.railway.app/api/v1/auth/login/ \
  -H "Origin: https://your-domain.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"

# 응답에서 다음 헤더들을 확인:
# - access-control-allow-origin
# - access-control-allow-methods  
# - access-control-allow-headers
```

### 브라우저에서 테스트

개발자 도구 콘솔에서:

```javascript
// Fetch API로 CORS 테스트
fetch('https://videoplanet.up.railway.app/api/v1/auth/login/', {
  method: 'OPTIONS',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => console.log('CORS OK:', response.status))
.catch(error => console.error('CORS Error:', error));
```

## 보안 고려사항

### 1. 프로덕션 환경에서의 엄격한 CORS

프로덕션에서는 `CORS_ALLOW_ALL_ORIGINS = True`를 절대 사용하지 마세요:

```python
# ❌ 절대 금지
CORS_ALLOW_ALL_ORIGINS = True

# ✅ 권장 방법
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    # 명시적으로 허용할 도메인들만 나열
]
```

### 2. 민감한 엔드포인트 추가 보호

특정 API 엔드포인트에 대해서만 추가 CORS 제한:

```python
# Django views.py에서
from django.views.decorators.csrf import csrf_exempt
from corsheaders.decorators import cors_exempt

@cors_exempt  # 특정 뷰에서 CORS 제한
def sensitive_api_view(request):
    # 민감한 API 로직
    pass
```

### 3. 로깅 및 모니터링

CORS 관련 요청을 모니터링:

```python
# settings.py에 추가
LOGGING = {
    'loggers': {
        'corsheaders': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'WARNING',
            'propagate': False,
        },
    },
}
```

## 문제 해결

### 1. CORS 오류가 여전히 발생하는 경우

1. Railway 서비스 재시작:
   ```bash
   railway service restart
   ```

2. 브라우저 캐시 삭제
   - 개발자 도구 → Network 탭 → "Disable cache" 체크
   - 또는 시크릿 모드에서 테스트

3. Preflight 요청 확인:
   ```bash
   curl -v -X OPTIONS https://videoplanet.up.railway.app/api/v1/auth/login/ \
     -H "Origin: https://your-domain.com"
   ```

### 2. 환경변수가 적용되지 않는 경우

Railway 환경변수 확인:

```bash
# Railway CLI로 확인
railway variables

# 또는 Django 로그에서 확인 (DEBUG=True일 때)
# Railway 로그에서 "[Settings] Using configuration" 메시지 확인
```

### 3. Vercel Preview 도메인이 차단되는 경우

정규식 패턴 확인:

```python
# 디버깅용 로깅 추가
import re
import logging

logger = logging.getLogger(__name__)

def test_cors_regex(origin):
    pattern = r'^https://videoplanet.*\.vercel\.app$'
    match = re.match(pattern, origin)
    logger.info(f"Testing origin: {origin}, Match: {bool(match)}")
    return bool(match)

# 테스트
test_cors_regex("https://videoplanet-abc123.vercel.app")  # True여야 함
```

## 권장 최종 설정

**`vridge_back/config/settings/railway.py`에 다음 설정 적용:**

```python
# CORS configuration for Railway production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Base production domains
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net', 
    'https://api.vlanet.net',
    'https://videoplanet.vercel.app',
]

# Development origins (DEBUG mode only)
if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ])

# Railway domain
if RAILWAY_PUBLIC_DOMAIN:
    CORS_ALLOWED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Environment variable overrides
additional_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and not origin.startswith(('http://', 'https://')):
            origin = f'https://{origin}'
        if origin and origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)

# Vercel preview domains regex
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://videoplanet.*\.vercel\.app$',
]

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()
if RAILWAY_PUBLIC_DOMAIN:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")
```

**Railway 환경변수 설정:**

```bash
CORS_ALLOWED_ORIGINS=videoplanet-git-master-winnmedia.vercel.app
```

이 설정으로 모든 Vercel 도메인 (메인, Git branch, Preview)과 로컬 개발 환경에서 정상적으로 API 호출이 가능합니다.