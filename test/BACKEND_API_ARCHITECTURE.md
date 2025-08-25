# VideoPlanet Backend API Architecture & Optimization Strategy

## 🏗 Executive Summary

현재 VideoPlanet 백엔드는 Django + DRF 기반으로 구현되어 있으며, 평균 응답 시간이 500ms로 목표치인 200ms를 초과하고 있습니다. 도메인 주도 설계(DDD)와 헥사고날 아키텍처를 적용하여 확장 가능하고 유지보수가 용이한 시스템으로 개선이 필요합니다.

## 📊 현재 상태 분석

### 기술 스택
- **Framework**: Django 4.2.2 + Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Cache**: Redis
- **WebSocket**: Django Channels + Redis
- **Authentication**: JWT (simplejwt)
- **File Storage**: AWS S3
- **Monitoring**: Sentry
- **Deployment**: Railway

### 성능 현황
- **현재 응답 시간**: ~500ms (평균)
- **목표 응답 시간**: <200ms
- **병목 지점**:
  - N+1 쿼리 문제 (일부 해결됨)
  - 캐싱 전략 미흡
  - 대용량 파일 처리
  - WebSocket 연결 관리

### 기존 최적화 구현
- ✅ Query Optimizer 클래스 구현
- ✅ Cache Manager 구현 (Redis 기반)
- ✅ Database Health Checker
- ✅ Performance Monitor
- ⚠️ 부분적인 select_related/prefetch_related 적용

## 🎯 도메인 모델 정의

### 1. Bounded Contexts (바운디드 컨텍스트)

```
VideoPlanet
├── Identity & Access Context (인증/권한)
│   ├── User Aggregate
│   ├── Authentication Service
│   └── Permission Service
│
├── Project Management Context (프로젝트 관리)
│   ├── Project Aggregate
│   ├── Member Management
│   └── Invitation Service
│
├── Feedback Context (피드백 시스템)
│   ├── Feedback Aggregate
│   ├── Comment Thread
│   ├── Reaction System
│   └── Real-time Notification
│
├── AI Planning Context (AI 기획)
│   ├── Video Plan Aggregate
│   ├── Story Generation
│   ├── Shot Breakdown
│   └── Storyboard Generation
│
└── Schedule Context (일정 관리)
    ├── Schedule Aggregate
    ├── Task Management
    └── Gantt Chart Service
```

### 2. Core Domain Entities

#### User Aggregate
```python
class User:
    - id: UUID
    - email: str
    - username: str
    - login_method: Enum[email, kakao, naver, google]
    - is_verified: bool
    - created_at: datetime
    
    Business Rules:
    - 이메일 중복 불가
    - 소셜 로그인 시 자동 계정 생성
    - 이메일 인증 필수
```

#### Project Aggregate
```python
class Project:
    - id: UUID
    - name: str
    - owner: User
    - members: List[Member]
    - status: Enum[active, archived, deleted]
    - settings: ProjectSettings
    
    Business Rules:
    - 프로젝트당 최대 멤버 수: 50
    - 소유자는 변경 불가 (이전 가능)
    - 삭제 시 30일간 복구 가능
```

#### Feedback Aggregate
```python
class Feedback:
    - id: UUID
    - project: Project
    - video_file: File
    - status: Enum[open, in_progress, resolved, closed]
    - priority: Enum[low, medium, high, critical]
    - timestamp: Decimal
    - comments: List[Comment]
    - reactions: List[Reaction]
    
    Business Rules:
    - 비디오 파일 최대 크기: 500MB
    - 타임스탬프 기반 댓글
    - 실시간 알림 필수
```

## 🏛 API Architecture Design

### 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                 │
│         (Controllers/Serializers)            │
├─────────────────────────────────────────────┤
│           Application Layer                  │
│            (Use Cases/Services)              │
├─────────────────────────────────────────────┤
│             Domain Layer                     │
│        (Entities/Domain Services)            │
├─────────────────────────────────────────────┤
│          Infrastructure Layer                │
│    (Repositories/External Services)          │
└─────────────────────────────────────────────┘
```

### 2. Directory Structure (Feature-Sliced Design)

```
vridge_back/
├── core/                      # Shared kernel
│   ├── domain/
│   │   ├── base_entity.py
│   │   ├── base_aggregate.py
│   │   └── value_objects.py
│   ├── application/
│   │   ├── base_service.py
│   │   └── base_use_case.py
│   └── infrastructure/
│       ├── base_repository.py
│       └── base_mapper.py
│
├── identity/                  # Identity & Access Context
│   ├── domain/
│   │   ├── user.py
│   │   ├── user_repository.py
│   │   └── auth_service.py
│   ├── application/
│   │   ├── login_use_case.py
│   │   ├── register_use_case.py
│   │   └── verify_email_use_case.py
│   ├── infrastructure/
│   │   ├── django_user_repository.py
│   │   ├── jwt_service.py
│   │   └── oauth_providers/
│   └── presentation/
│       ├── views.py
│       ├── serializers.py
│       └── urls.py
│
├── projects/                  # Project Management Context
│   ├── domain/
│   │   ├── project.py
│   │   ├── member.py
│   │   └── invitation.py
│   ├── application/
│   │   ├── create_project_use_case.py
│   │   ├── invite_member_use_case.py
│   │   └── project_stats_service.py
│   ├── infrastructure/
│   │   └── django_project_repository.py
│   └── presentation/
│       ├── views.py
│       └── serializers.py
│
├── feedback/                  # Feedback Context
│   ├── domain/
│   │   ├── feedback.py
│   │   ├── comment.py
│   │   └── reaction.py
│   ├── application/
│   │   ├── submit_feedback_use_case.py
│   │   ├── add_comment_use_case.py
│   │   └── real_time_service.py
│   ├── infrastructure/
│   │   ├── django_feedback_repository.py
│   │   └── websocket_service.py
│   └── presentation/
│       ├── views.py
│       ├── consumers.py
│       └── serializers.py
│
└── ai_planning/              # AI Planning Context
    ├── domain/
    │   ├── video_plan.py
    │   ├── story_section.py
    │   └── shot_breakdown.py
    ├── application/
    │   ├── generate_story_use_case.py
    │   ├── generate_shots_use_case.py
    │   └── export_pdf_use_case.py
    ├── infrastructure/
    │   ├── openai_service.py
    │   ├── google_images_service.py
    │   └── pdf_generator.py
    └── presentation/
        ├── views.py
        └── serializers.py
```

## 📋 OpenAPI Specification

### Base Configuration
```yaml
openapi: 3.0.3
info:
  title: VideoPlanet API
  version: 2.0.0
  description: Video collaboration and feedback platform API
servers:
  - url: https://api.vridge.kr/v2
    description: Production server
  - url: http://localhost:8000/v2
    description: Development server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Authentication Endpoints
```yaml
/auth/login:
  post:
    summary: User login
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [email, password]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 8
    responses:
      200:
        description: Login successful
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token:
                  type: string
                refresh_token:
                  type: string
                user:
                  $ref: '#/components/schemas/User'

/auth/register:
  post:
    summary: User registration
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [email, password, username]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 8
              username:
                type: string
                minLength: 3
                maxLength: 30
```

### Project Management Endpoints
```yaml
/projects:
  get:
    summary: List user projects
    security:
      - BearerAuth: []
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: page_size
        in: query
        schema:
          type: integer
          default: 10
          maximum: 50
      - name: status
        in: query
        schema:
          type: string
          enum: [active, archived, all]
    responses:
      200:
        description: Projects list
        content:
          application/json:
            schema:
              type: object
              properties:
                count:
                  type: integer
                next:
                  type: string
                  nullable: true
                previous:
                  type: string
                  nullable: true
                results:
                  type: array
                  items:
                    $ref: '#/components/schemas/Project'

  post:
    summary: Create new project
    security:
      - BearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProjectCreate'
```

### Feedback System Endpoints
```yaml
/feedback/{projectId}:
  get:
    summary: List project feedbacks
    security:
      - BearerAuth: []
    parameters:
      - name: projectId
        in: path
        required: true
        schema:
          type: string
          format: uuid
      - name: status
        in: query
        schema:
          type: string
          enum: [open, in_progress, resolved, closed]
      - name: priority
        in: query
        schema:
          type: string
          enum: [low, medium, high, critical]
    responses:
      200:
        description: Feedbacks list
        content:
          application/json:
            schema:
              type: object
              properties:
                results:
                  type: array
                  items:
                    $ref: '#/components/schemas/Feedback'
                stats:
                  type: object
                  properties:
                    total:
                      type: integer
                    open:
                      type: integer
                    in_progress:
                      type: integer
                    resolved:
                      type: integer

  post:
    summary: Submit new feedback
    security:
      - BearerAuth: []
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            required: [video_file, timestamp]
            properties:
              video_file:
                type: string
                format: binary
              timestamp:
                type: number
                format: float
              priority:
                type: string
                enum: [low, medium, high, critical]
```

### WebSocket Events
```yaml
ws://api.vridge.kr/ws/feedback/{projectId}:
  subscribe:
    summary: Real-time feedback updates
    message:
      oneOf:
        - $ref: '#/components/messages/FeedbackCreated'
        - $ref: '#/components/messages/CommentAdded'
        - $ref: '#/components/messages/StatusChanged'
        - $ref: '#/components/messages/UserTyping'
```

## 🚀 Performance Optimization Strategy

### 1. Database Optimization

#### Query Optimization
```python
# Before (N+1 problem)
projects = Project.objects.all()
for project in projects:
    members = project.members.all()  # N queries

# After (Optimized)
projects = Project.objects.prefetch_related(
    Prefetch('members', 
             queryset=Member.objects.select_related('user'))
).annotate(
    member_count=Count('members'),
    feedback_count=Count('feedbacks'),
    open_feedback_count=Count('feedbacks', 
                              filter=Q(feedbacks__status='open'))
)
```

#### Index Strategy
```sql
-- Composite indexes for frequent queries
CREATE INDEX idx_feedback_project_status 
ON feedbacks_feedback(project_id, status);

CREATE INDEX idx_comment_feedback_created 
ON feedbacks_feedbackcomment(feedback_id, created);

-- Full-text search indexes
CREATE INDEX idx_project_search 
ON projects_project USING GIN(to_tsvector('korean', name || ' ' || description));
```

### 2. Caching Strategy

#### Multi-layer Caching
```python
# L1: Application Memory Cache (5-10s)
# L2: Redis Cache (5-30min)
# L3: Database

class CacheStrategy:
    CACHE_LAYERS = {
        'hot_data': {      # Frequently accessed
            'ttl': 60,     # 1 minute
            'layer': 'memory'
        },
        'warm_data': {     # Moderately accessed
            'ttl': 600,    # 10 minutes
            'layer': 'redis'
        },
        'cold_data': {     # Rarely accessed
            'ttl': 3600,   # 1 hour
            'layer': 'redis'
        }
    }
```

#### Cache Invalidation
```python
# Event-driven invalidation
class CacheInvalidator:
    @staticmethod
    def on_project_update(project_id):
        patterns = [
            f"project:{project_id}:*",
            f"dashboard:*:projects",
            f"stats:project:{project_id}"
        ]
        cache_manager.delete_patterns(patterns)
    
    @staticmethod
    def on_feedback_create(project_id):
        patterns = [
            f"project:{project_id}:feedbacks",
            f"project:{project_id}:stats",
            f"dashboard:*"
        ]
        cache_manager.delete_patterns(patterns)
```

### 3. API Response Optimization

#### Pagination
```python
class OptimizedPagination:
    page_size = 20
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'page_info': {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous()
            }
        })
```

#### Field Selection
```python
# Allow clients to specify required fields
GET /api/projects?fields=id,name,created,owner

class FieldSelectionMixin:
    def get_fields(self):
        fields = self.request.query_params.get('fields')
        if fields:
            return fields.split(',')
        return None
```

#### Response Compression
```python
# Enable gzip compression for large responses
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... other middleware
]

# Conditional compression based on content type
class SmartCompressionMiddleware:
    def process_response(self, request, response):
        if response.get('Content-Type', '').startswith('application/json'):
            if len(response.content) > 1024:  # Compress if > 1KB
                response['Content-Encoding'] = 'gzip'
                response.content = gzip.compress(response.content)
        return response
```

### 4. Async Processing

#### Background Tasks
```python
from celery import shared_task

@shared_task
def process_video_feedback(feedback_id):
    """Process video thumbnail generation asynchronously"""
    feedback = Feedback.objects.get(id=feedback_id)
    
    # Generate thumbnails
    thumbnails = generate_video_thumbnails(feedback.video_file)
    
    # Update feedback
    feedback.thumbnails = thumbnails
    feedback.save()
    
    # Send notifications
    notify_project_members(feedback.project_id, feedback_id)
```

#### WebSocket Optimization
```python
class OptimizedFeedbackConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'feedback_{self.project_id}'
        
        # Rate limiting
        if not await self.check_rate_limit():
            await self.close()
            return
        
        # Connection pooling
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def check_rate_limit(self):
        # Implement rate limiting logic
        connections = await cache.get(f"ws:connections:{self.scope['user'].id}")
        if connections and connections > 5:
            return False
        return True
```

## 🔒 Security Implementation Guide

### 1. Authentication & Authorization

#### JWT Configuration
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'RS256',  # Use RSA for better security
    'SIGNING_KEY': settings.JWT_PRIVATE_KEY,
    'VERIFYING_KEY': settings.JWT_PUBLIC_KEY,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    'JTI_CLAIM': 'jti',
}
```

#### Role-Based Access Control (RBAC)
```python
class ProjectPermissions:
    OWNER = 'owner'
    ADMIN = 'admin'
    EDITOR = 'editor'
    VIEWER = 'viewer'
    
    PERMISSIONS = {
        'owner': ['*'],  # All permissions
        'admin': ['create', 'read', 'update', 'delete', 'invite'],
        'editor': ['create', 'read', 'update'],
        'viewer': ['read']
    }
    
    @classmethod
    def has_permission(cls, user_role, action):
        if user_role not in cls.PERMISSIONS:
            return False
        
        permissions = cls.PERMISSIONS[user_role]
        return '*' in permissions or action in permissions
```

### 2. API Security

#### Rate Limiting
```python
from django_ratelimit.decorators import ratelimit

class FeedbackViewSet(viewsets.ModelViewSet):
    @ratelimit(key='user', rate='100/h', method='POST')
    def create(self, request, *args, **kwargs):
        # Create feedback logic
        pass
    
    @ratelimit(key='ip', rate='1000/h', method='GET')
    def list(self, request, *args, **kwargs):
        # List feedbacks logic
        pass
```

#### Input Validation
```python
from django.core.validators import RegexValidator, EmailValidator
from rest_framework import serializers

class SecureFeedbackSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        max_length=200,
        validators=[
            RegexValidator(
                regex=r'^[\w\s\-\.]+$',
                message='Title contains invalid characters'
            )
        ]
    )
    
    video_file = serializers.FileField(
        validators=[
            FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi']),
            FileSizeValidator(max_size=500 * 1024 * 1024)  # 500MB
        ]
    )
    
    def validate(self, data):
        # Additional validation logic
        if self.check_for_malicious_content(data):
            raise serializers.ValidationError("Malicious content detected")
        return data
```

#### SQL Injection Prevention
```python
# Always use parameterized queries
from django.db import connection

def get_project_stats(project_id):
    with connection.cursor() as cursor:
        # Safe: Uses parameterized query
        cursor.execute(
            """
            SELECT 
                COUNT(DISTINCT f.id) as feedback_count,
                COUNT(DISTINCT c.id) as comment_count,
                AVG(f.priority) as avg_priority
            FROM feedbacks_feedback f
            LEFT JOIN feedbacks_feedbackcomment c ON f.id = c.feedback_id
            WHERE f.project_id = %s
            """,
            [project_id]  # Parameters are escaped automatically
        )
        return cursor.fetchone()
```

### 3. Data Protection

#### Encryption at Rest
```python
from django.db import models
from django_cryptography.fields import encrypt

class SensitiveData(models.Model):
    # Automatically encrypted fields
    api_key = encrypt(models.CharField(max_length=255))
    personal_notes = encrypt(models.TextField())
    
    # Regular fields
    created_at = models.DateTimeField(auto_now_add=True)
```

#### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "https://vridge.kr",
    "https://app.vridge.kr",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF Protection
CSRF_TRUSTED_ORIGINS = [
    'https://vridge.kr',
    'https://api.vridge.kr',
]
```

## 📈 Performance Monitoring

### 1. Metrics to Track
```python
class PerformanceMetrics:
    METRICS = {
        'response_time': {
            'target': 200,  # ms
            'warning': 500,  # ms
            'critical': 1000  # ms
        },
        'database_queries': {
            'target': 5,
            'warning': 10,
            'critical': 20
        },
        'cache_hit_rate': {
            'target': 80,  # %
            'warning': 60,  # %
            'critical': 40  # %
        },
        'error_rate': {
            'target': 0.1,  # %
            'warning': 1,  # %
            'critical': 5  # %
        }
    }
```

### 2. Monitoring Implementation
```python
import time
from django.db import connection
from functools import wraps

def monitor_performance(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        initial_queries = len(connection.queries)
        
        try:
            response = view_func(request, *args, **kwargs)
            
            # Calculate metrics
            execution_time = (time.time() - start_time) * 1000
            query_count = len(connection.queries) - initial_queries
            
            # Log metrics
            logger.info(f"Performance: {view_func.__name__}", extra={
                'execution_time_ms': execution_time,
                'query_count': query_count,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'endpoint': request.path,
                'method': request.method,
                'status_code': response.status_code
            })
            
            # Send to monitoring service
            if execution_time > 500:
                send_slow_request_alert(view_func.__name__, execution_time)
            
            return response
            
        except Exception as e:
            # Log error
            logger.error(f"Error in {view_func.__name__}: {str(e)}")
            raise
    
    return wrapper
```

## 🚦 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement domain models
- [ ] Setup test infrastructure
- [ ] Create base repositories and services
- [ ] Configure monitoring

### Phase 2: Core Features (Week 3-4)
- [ ] Migrate authentication system
- [ ] Implement project management
- [ ] Setup feedback system
- [ ] Configure WebSocket connections

### Phase 3: Optimization (Week 5-6)
- [ ] Apply caching strategy
- [ ] Optimize database queries
- [ ] Implement background tasks
- [ ] Setup CDN for static files

### Phase 4: Security & Testing (Week 7-8)
- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Documentation

## 📊 Success Metrics

### Performance KPIs
- API response time p50 < 100ms
- API response time p95 < 200ms
- API response time p99 < 500ms
- Cache hit rate > 80%
- Database query count per request < 10
- Zero downtime deployments

### Business Metrics
- User session duration increase by 20%
- API error rate < 0.1%
- WebSocket connection stability > 99.9%
- File upload success rate > 99%

## 🔧 Maintenance & Monitoring

### Health Checks
```python
# /health/live - Kubernetes liveness probe
def liveness_check(request):
    return JsonResponse({'status': 'healthy'})

# /health/ready - Kubernetes readiness probe
def readiness_check(request):
    checks = {
        'database': check_database(),
        'redis': check_redis(),
        'storage': check_s3(),
    }
    
    is_ready = all(checks.values())
    status_code = 200 if is_ready else 503
    
    return JsonResponse({
        'status': 'ready' if is_ready else 'not_ready',
        'checks': checks
    }, status=status_code)
```

### Automated Alerts
```yaml
alerts:
  - name: HighResponseTime
    condition: response_time_p95 > 500ms
    duration: 5m
    action: notify_slack
    
  - name: HighErrorRate
    condition: error_rate > 1%
    duration: 5m
    action: page_oncall
    
  - name: LowCacheHitRate
    condition: cache_hit_rate < 60%
    duration: 15m
    action: notify_email
```

## 📚 References

- [Django Performance Optimization](https://docs.djangoproject.com/en/4.2/topics/performance/)
- [DRF Best Practices](https://www.django-rest-framework.org/api-guide/performance/)
- [Domain-Driven Design in Python](https://github.com/cosmicpython/book)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Author**: Benjamin (Backend Lead Architect)  
**Last Updated**: 2025-08-23  
**Version**: 1.0.0