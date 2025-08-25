# VideoPlanet AI 영상 기획 시스템 백엔드 아키텍처

## 개요

본 문서는 INSTRUCTION.md 기반 AI 영상 기획 시스템의 백엔드 아키텍처 설계서입니다. Domain-Driven Design과 Clean Architecture 원칙을 적용하여 확장 가능하고 유지보수성이 뛰어난 시스템을 구축했습니다.

## 🏗️ 시스템 아키텍처

### 1. 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Django REST Framework)                 │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ AI Orchestration│ Storyboard      │ Planning CRUD   │    │
│  │ ViewSet         │ ViewSet         │ ViewSet         │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Business Logic)                             │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ LLM             │ Image           │ PDF Export      │    │
│  │ Orchestration   │ Generation      │ Service         │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ PostgreSQL      │ Redis           │ AWS S3          │    │
│  │ (데이터)        │ (캐시/큐)       │ (파일저장)      │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2. 핵심 API 엔드포인트

#### A. LLM 오케스트레이션 API

```yaml
POST /api/ai/generate-story-stages/
  summary: "1단계 입력 → 4단계 스토리 변환"
  parameters:
    - project_description: "프로젝트 설명"
    - video_type: "영상 타입"
    - target_duration: "목표 길이(초)"
    - tone_and_style: "톤앤매너"
    - key_messages: "핵심 메시지"
  responses:
    200:
      content:
        hook: "1단계: 훅 내용"
        problem: "2단계: 문제 제기"
        solution: "3단계: 해결책 제시"  
        action: "4단계: 행동 유도"

POST /api/ai/generate-shots/
  summary: "4단계 스토리 → 12숏트 분해"
  parameters:
    - story_stages: "4단계 스토리 데이터"
    - video_style: "영상 스타일"
    - camera_preference: "카메라 선호도"
  responses:
    200:
      content:
        shots: [12개 숏트 배열]

POST /api/ai/generate-inserts/  
  summary: "숏트 → 인서트 3개 추천"
  parameters:
    - shot_description: "숏트 설명"
    - shot_type: "숏트 타입"
    - context: "전후 맥락"
  responses:
    200:
      content:
        inserts: [3개 인서트 배열]
```

#### B. Google 이미지 생성 API

```yaml
POST /api/storyboard/generate/
  summary: "콘티 생성"
  parameters:
    - shot_data: "숏트 데이터"
    - visual_style: "시각적 스타일"
    - aspect_ratio: "화면 비율"
    - quality: "생성 품질"
  responses:
    200:
      content:
        image_url: "생성된 이미지 URL"
        image_prompt: "생성 프롬프트"

POST /api/storyboard/regenerate/{frame_id}/
  summary: "콘티 재생성"
  
GET /api/storyboard/download/{frame_id}/
  summary: "콘티 다운로드"
```

#### C. PDF 내보내기 시스템

```yaml
POST /api/planning/{id}/export-pdf/
  summary: "여백 0 PDF 생성"
  parameters:
    - export_type: "pdf_planning|pdf_storyboard|pdf_complete|json_data"
    - page_format: "A4|A3|Letter"
    - orientation: "portrait|landscape"  
    - margin: "none|minimal|standard"
    - include_cover: true
    - include_story_stages: true
    - include_shot_breakdown: true
    - include_storyboard: true
  responses:
    200:
      content:
        file_url: "PDF 파일 URL"
        file_size: "파일 크기"
        expires_at: "만료일시"
```

## 🗄️ 도메인 모델 설계

### 핵심 엔티티

```python
# 영상 기획서 (집계 루트)
class VideoPlan(models.Model):
    id = models.UUIDField(primary_key=True)
    title = models.CharField(max_length=200)
    plan_type = models.CharField(choices=PLAN_TYPES)
    status = models.CharField(choices=STATUS_CHOICES)
    original_request = models.TextField()
    generated_story = JSONField()  # 4단계 스토리
    generated_shots = JSONField()  # 12숏트 데이터
    version = models.PositiveIntegerField(default=1)
    
# AI 생성 요청 추적
class AIGenerationRequest(models.Model):
    id = models.UUIDField(primary_key=True) 
    user = models.ForeignKey(User)
    generation_type = models.CharField(choices=GENERATION_TYPES)
    status = models.CharField(choices=STATUS_CHOICES)
    input_data = JSONField()
    output_data = JSONField()
    processing_time = models.FloatField()
    token_usage = JSONField()

# 4단계 스토리 섹션
class PlanSection(models.Model):
    video_plan = models.ForeignKey(VideoPlan)
    section_type = models.CharField(choices=SECTION_TYPES)
    order = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration_seconds = models.PositiveIntegerField()

# 12숏트 분해
class ShotBreakdown(models.Model):
    video_plan = models.ForeignKey(VideoPlan)
    shot_number = models.PositiveIntegerField()
    shot_type = models.CharField(choices=SHOT_TYPES)
    camera_movement = models.CharField(choices=CAMERA_MOVEMENTS)
    description = models.TextField()
    visual_elements = JSONField()
    recommended_inserts = JSONField()

# 스토리보드 프레임  
class StoryboardFrame(models.Model):
    shot = models.ForeignKey(ShotBreakdown)
    frame_number = models.PositiveIntegerField()
    generated_image_url = models.URLField()
    image_prompt = models.TextField()
    regeneration_count = models.PositiveIntegerField(default=0)
    regeneration_history = JSONField()
```

## 🧠 LLM 통합 아키텍처

### 1. 다중 LLM 제공자 지원

```python
class LLMOrchestrationService:
    def __init__(self):
        self.providers = {
            'openai': OpenAIProvider(api_key),
            'anthropic': AnthropicProvider(api_key)
        }
    
    def generate_story_stages(self, input_data):
        # 프롬프트 엔지니어링
        prompt = self.story_template.format(**input_data)
        
        # 캐시 확인
        cached = cache.get(cache_key)
        if cached:
            return cached
            
        # LLM 호출
        provider = self._get_provider()
        response = provider.generate_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # 결과 캐싱 및 반환
        result = self._parse_story_response(response)
        cache.set(cache_key, result, 3600)
        return result
```

### 2. 프롬프트 엔지니어링

#### 4단계 스토리 생성 프롬프트
```
당신은 전문적인 영상 기획자입니다. 다음 요청사항을 바탕으로 4단계 스토리 구조를 생성해주세요.

## 입력 정보:
- 프로젝트 설명: {project_description}
- 영상 타입: {video_type}
- 목표 길이: {target_duration}초
- 톤앤매너: {tone_and_style}

## 4단계 스토리 구조:
1. **훅 (Hook)**: 첫 3-5초 내에 시청자의 관심을 끌기
2. **문제 제기 (Problem)**: 타겟 고객의 고민이나 니즈를 명확히 제시
3. **해결책 제시 (Solution)**: 제품/서비스가 어떻게 문제를 해결하는지 설명
4. **행동 유도 (Action)**: 구체적인 콜투액션 제시

반드시 JSON 형식으로 응답해주세요.
```

#### 12숏트 분해 프롬프트  
```
당신은 영상 촬영 전문가입니다. 4단계 스토리를 바탕으로 12개의 구체적인 숏트로 분해해주세요.

## 입력된 스토리:
{story_stages}

## 숏트 타입 종류:
- 와이드샷, 미디엄샷, 클로즈업, 익스트림 클로즈업
- 오버숄더, POV, 인서트, 컷어웨이

총 12개의 숏트를 균형있게 분배하여 JSON 형식으로 응답해주세요.
```

## 🖼️ Google 이미지 생성 파이프라인

### 1. 다중 이미지 생성 제공자

```python
class ImageGenerationService:
    def __init__(self):
        self.providers = {
            'google_imagen': GoogleImagenProvider(),
            'stability_ai': StableDiffusionProvider()
        }
    
    def generate_storyboard_frame(self, input_data):
        # 프롬프트 강화
        enhanced_prompt = self._create_storyboard_prompt(
            shot_data=input_data['shot_data'],
            visual_style=input_data['visual_style']
        )
        
        # 이미지 생성
        provider = self._get_provider()
        result = provider.generate_image(
            prompt=enhanced_prompt,
            aspect_ratio=input_data['aspect_ratio'],
            quality=input_data['quality']
        )
        
        # 이미지 품질 검증 및 저장
        processed_image, quality_score = self._process_and_validate_image(result)
        image_url = self._save_image_to_storage(processed_image)
        
        return {
            'image_url': image_url,
            'quality_score': quality_score
        }
```

### 2. Google Vertex AI Imagen API 연동

```python
class GoogleImagenProvider:
    def generate_image(self, prompt, aspect_ratio="16:9"):
        # API 요청 데이터 구성
        request_data = {
            "instances": [{
                "prompt": f"{prompt}, storyboard panel, professional cinematography",
                "negativePrompt": "blurry, low quality, text, watermark",
                "aspectRatio": aspect_ratio.replace(":", "_"),
                "guidanceScale": 7.5
            }]
        }
        
        # Vertex AI API 호출
        endpoint = f"{self.api_endpoint}/v1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/imagegeneration:predict"
        
        response = requests.post(
            endpoint,
            headers=self.headers,
            json=request_data,
            timeout=120
        )
        
        # 응답 처리 및 이미지 저장
        result = response.json()
        image_data = base64.b64decode(result['predictions'][0]['bytesBase64Encoded'])
        
        return self._process_image(image_data)
```

## 📄 PDF 생성 시스템

### 1. 여백 0 PDF 아키텍처

```python
class VideoPlanetDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        
        # 여백 0 프레임 설정
        frame = Frame(
            0, 0,  # x, y (여백 0)
            *self.pagesize,  # width, height
            leftPadding=0, bottomPadding=0,
            rightPadding=0, topPadding=0
        )
        
        # 브랜드 페이지 템플릿
        template = PageTemplate(
            id='main', 
            frames=[frame], 
            onPage=self.draw_header_footer
        )
        self.addPageTemplates([template])
    
    def draw_header_footer(self, canvas, doc):
        # VideoPlanet 브랜드 헤더
        canvas.setFillColor(HexColor('#1631F8'))
        canvas.rect(0, page_height - 60, page_width, 60, fill=1)
        
        # 로고 및 페이지 정보
        canvas.setFillColor(white)
        canvas.drawString(30, page_height - 40, 'VideoPlanet AI 영상 기획')
```

### 2. UI형 레이아웃 생성

```python
class PDFLayoutBuilder:
    def create_story_stages_page(self, video_plan):
        """4단계 스토리를 카드 스타일로 레이아웃"""
        content = []
        
        stages = [
            ('hook', '1단계: 훅 (Hook)', '#FF6B6B'),
            ('problem', '2단계: 문제 제기', '#4ECDC4'),
            ('solution', '3단계: 해결책 제시', '#45B7D1'),
            ('action', '4단계: 행동 유도', '#96CEB4')
        ]
        
        for stage_key, stage_title, stage_color in stages:
            # 단계별 카드 테이블 생성
            stage_table = Table(stage_data, colWidths=[80, 400])
            stage_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor(stage_color)),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            content.append(stage_table)
            
        return content
    
    def create_storyboard_pages(self, video_plan):
        """스토리보드를 2x2 그리드로 배치"""
        frames = StoryboardFrame.objects.filter(
            shot__video_plan=video_plan
        ).order_by('shot__shot_number')
        
        # 4개씩 그룹핑하여 2x2 그리드 생성
        for frame_group in chunks(frames, 4):
            grid_data = self._create_2x2_grid(frame_group)
            storyboard_table = Table(grid_data, colWidths=[200, 200])
            content.append(storyboard_table)
```

## 🔒 보안 및 운영 시스템

### 1. API 키 보안 관리

```python
class APIKeyManager:
    def __init__(self):
        self.fernet = Fernet(settings.API_ENCRYPTION_KEY)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """API 키 암호화"""
        encrypted_key = self.fernet.encrypt(api_key.encode())
        return encrypted_key.decode()
    
    def get_openai_key(self) -> str:
        """OpenAI API 키 복호화 후 반환"""
        encrypted_key = settings.OPENAI_API_KEY_ENCRYPTED
        return self.decrypt_api_key(encrypted_key)
```

### 2. 사용량 제한 시스템

```python
class UsageTrackingService:
    def __init__(self, user: User):
        self.user = user
        self.limits = UsageLimit(
            daily_stories=10,
            daily_shots=5, 
            daily_images=20,
            daily_pdfs=5,
            monthly_tokens=100000
        )
    
    def can_generate_story(self) -> bool:
        """스토리 생성 가능 여부"""
        current = cache.get(f"usage_{self.user.id}_stories_daily")
        return current < self.limits.daily_stories
    
    def record_llm_usage(self, token_count: int):
        """LLM 사용량 기록 및 비용 추적"""
        cache.incr(f"usage_{self.user.id}_tokens_monthly", token_count)
        
        # 데이터베이스 기록
        APIUsageTracking.objects.update_or_create(
            user=self.user,
            usage_date=timezone.now().date(),
            defaults={
                'openai_tokens_used': F('openai_tokens_used') + token_count,
                'estimated_cost': F('estimated_cost') + (token_count * 0.002 / 1000)
            }
        )
```

### 3. 에러 처리 및 재시도 로직

```python
class RobustHTTPClient:
    def __init__(self):
        self.session = requests.Session()
        
        # 재시도 전략
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.3,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

class ErrorHandler:
    @staticmethod
    def handle_api_error(service: str, error: Exception):
        """API 에러 처리 및 알림"""
        # 로깅
        logger.error(f"API Error in {service}: {str(error)}")
        
        # 심각한 에러인 경우 즉시 알림
        if ErrorHandler._is_critical_error(error):
            ErrorHandler._send_alert({
                'service': service,
                'error': str(error),
                'timestamp': timezone.now().isoformat()
            })
```

### 4. 캐싱 전략

```python
class CacheService:
    def get_story_stages(self, input_data):
        """입력 해시 기반 스토리 캐싱"""
        cache_key = hashlib.md5(
            json.dumps(input_data, sort_keys=True).encode()
        ).hexdigest()
        return cache.get(f"story_stages_{cache_key}")
    
    def set_shot_breakdown(self, input_data, result, ttl=7200):
        """숏트 분해 결과 2시간 캐싱"""
        cache_key = self._create_cache_key("shot_breakdown", input_data)  
        cache.set(cache_key, result, ttl)
```

## 📊 데이터 관리 시스템

### 1. 자동저장 및 버전 관리

```python
# 자동저장 (단계별 스냅샷)
@transaction.atomic
def save_plan_version(video_plan, changes, user):
    """기획서 버전 자동 저장"""
    PlanVersion.objects.create(
        video_plan=video_plan,
        version_number=video_plan.version + 1,
        snapshot_data=serialize_plan_data(video_plan),
        changed_by=user,
        change_summary=changes,
        is_auto_save=True
    )
    
    video_plan.version += 1
    video_plan.save()

# 콘티 재생성 이력
def regenerate_storyboard_frame(frame, options):
    """재생성 이력 추적"""
    previous_url = frame.generated_image_url
    new_result = image_service.regenerate_frame(frame, options)
    
    frame.regeneration_count += 1
    frame.regeneration_history.append({
        'timestamp': timezone.now().isoformat(),
        'previous_url': previous_url,
        'new_url': new_result['image_url']
    })
    frame.save()
```

### 2. 동일 입력 해시 기반 캐싱

```python
def generate_with_cache(self, service_name, input_data, generator_func):
    """해시 기반 중복 요청 캐싱"""
    # 입력 데이터 해시 생성
    input_hash = hashlib.md5(
        json.dumps(input_data, sort_keys=True).encode()
    ).hexdigest()
    
    cache_key = f"{service_name}_{input_hash}"
    
    # 캐시 확인
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for {service_name}: {cache_key}")
        return cached_result
    
    # 새로 생성
    result = generator_func(input_data)
    
    # 캐시 저장
    cache.set(cache_key, result, self.get_cache_ttl(service_name))
    
    return result
```

## 🚀 배포 및 확장성

### 1. Docker 컨테이너화

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성  
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드
COPY . .

# 포트 노출
EXPOSE 8000

# 실행 명령
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

### 2. Railway 배포 설정

```toml
# railway.toml
[build]
builder = "DOCKER"

[deploy]
startCommand = "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT"

[environment]
DATABASE_URL = "${{DATABASE_URL}}"
REDIS_URL = "${{REDIS_URL}}"
OPENAI_API_KEY_ENCRYPTED = "${{OPENAI_API_KEY_ENCRYPTED}}"
GOOGLE_SERVICE_ACCOUNT_JSON = "${{GOOGLE_SERVICE_ACCOUNT_JSON}}"
```

### 3. 성능 최적화

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 데이터베이스 연결 풀링
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'MAX_CONNS': 20
        }
    }
}

# 파일 스토리지 (S3)
if not DEBUG:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
```

## 📈 모니터링 및 로깅

### 1. 구조화된 로깅

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level":"%(levelname)s","time":"%(asctime)s","module":"%(module)s","message":"%(message)s"}',
        }
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/ai_planning.log',
            'formatter': 'json',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'ai_planning': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False
        }
    }
}
```

### 2. API 성능 메트릭

```python
class APIMetricsMiddleware:
    """API 성능 메트릭 수집"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        # 메트릭 기록
        if request.path.startswith('/api/'):
            cache.lpush('api_metrics', json.dumps({
                'path': request.path,
                'method': request.method,
                'status_code': response.status_code,
                'duration': duration,
                'timestamp': timezone.now().isoformat()
            }))
        
        return response
```

## 🎯 최종 산출물

### 1. Django 모델 설계 ✅
- 11개 핵심 도메인 모델
- UUID 기반 식별자
- JSON 필드 활용 유연한 데이터 구조
- 외래키 관계 및 제약조건

### 2. API 엔드포인트 명세 (OpenAPI) ✅
- LLM 오케스트레이션: 3개 엔드포인트
- 스토리보드 생성: 3개 엔드포인트  
- 기획서 관리: CRUD + 협업 + 내보내기
- 분석 및 통계: 3개 엔드포인트

### 3. LLM 프롬프트 엔지니어링 ✅
- 4단계 스토리 생성 프롬프트
- 12숏트 분해 프롬프트
- 3개 인서트 추천 프롬프트
- JSON 응답 강제 및 검증

### 4. 이미지 생성 파이프라인 ✅
- Google Vertex AI Imagen 통합
- Stability AI 백업 제공자
- 스토리보드 전용 프롬프트 최적화
- 이미지 품질 검증 및 리사이징

### 5. PDF 생성 아키텍처 ✅
- 여백 0 A4 가로 레이아웃
- VideoPlanet 브랜드 템플릿
- UI형 카드 스타일 디자인
- 2x2 스토리보드 그리드 배치

### 6. 보안 및 운영 완성 ✅
- API 키 암호화 보관
- 사용량 제한 및 추적
- 에러 처리 및 재시도 로직
- 캐싱 전략 및 성능 최적화

## 🔧 설치 및 실행

### 1. 환경 설정

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env)
OPENAI_API_KEY=your_openai_key
GOOGLE_SERVICE_ACCOUNT_JSON=your_google_credentials
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### 2. 데이터베이스 마이그레이션

```bash
# Django 설정 업데이트
# settings.py의 INSTALLED_APPS에 'ai_planning' 추가

# 마이그레이션 생성 및 적용
python manage.py makemigrations ai_planning
python manage.py migrate
```

### 3. 서버 실행

```bash
# 개발 서버
python manage.py runserver

# 프로덕션 (Gunicorn)
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## 📝 향후 확장 계획

### 1. AI 기능 확장
- GPT-4V 비전 모델 활용 스토리보드 분석
- Claude 3 Opus 활용 더 정교한 스토리텔링
- Whisper API 연동 음성 내레이션 생성

### 2. 협업 기능 강화  
- 실시간 동시 편집 (Operational Transform)
- WebSocket 기반 라이브 커서
- 댓글 및 리뷰 시스템

### 3. 분석 및 인사이트
- 사용자 행동 분석
- A/B 테스트 프레임워크
- 성능 메트릭 대시보드

### 4. 모바일 지원
- React Native 앱 개발
- 모바일 최적화 PDF 생성
- 오프라인 지원

---

**개발완료일**: 2025-08-22  
**아키텍트**: Claude (Benjamin - Backend Lead)  
**기술스택**: Django 4.2 + DRF + PostgreSQL + Redis + OpenAI + Google Cloud  
**배포환경**: Railway (Backend) + Vercel (Frontend)  
**문서버전**: v1.0.0