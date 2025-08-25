# VideoPlanet Performance Optimization Implementation Guide

## 🎯 목표 및 현황

### 성능 목표
- **API 응답 시간**: p50 < 100ms, p95 < 200ms, p99 < 500ms
- **데이터베이스 쿼리**: < 10 queries per request
- **캐시 적중률**: > 80%
- **동시 접속자**: 1,000+ concurrent users
- **WebSocket 연결**: 5,000+ simultaneous connections

### 현재 병목 지점
1. **N+1 Query 문제** (부분적 해결)
2. **캐싱 전략 미흡**
3. **대용량 파일 처리**
4. **WebSocket 연결 관리**
5. **동기식 처리로 인한 블로킹**

## 📊 데이터베이스 최적화

### 1. Query Optimization Implementation

```python
# vridge_back/core/infrastructure/optimized_repository.py

from typing import List, Optional, Dict, Any
from django.db.models import QuerySet, Prefetch, Q, Count, Avg, F
from django.db import connection, reset_queries
import logging

logger = logging.getLogger(__name__)

class OptimizedRepository:
    """Base repository with built-in query optimization"""
    
    def __init__(self, model_class):
        self.model = model_class
        self._query_count = 0
        
    def get_with_relations(self, pk: Any, relations: List[str]) -> Optional[Any]:
        """Get entity with eager loading of relations"""
        try:
            queryset = self.model.objects.select_related(*[
                r for r in relations if '__' not in r
            ]).prefetch_related(*[
                r for r in relations if '__' in r
            ])
            return queryset.get(pk=pk)
        except self.model.DoesNotExist:
            return None
    
    def list_optimized(
        self, 
        filters: Dict[str, Any] = None,
        select_related: List[str] = None,
        prefetch_related: List[str] = None,
        annotations: Dict[str, Any] = None,
        limit: int = None
    ) -> QuerySet:
        """List with optimized query"""
        queryset = self.model.objects.all()
        
        # Apply filters
        if filters:
            queryset = queryset.filter(**filters)
        
        # Apply select_related for foreign keys
        if select_related:
            queryset = queryset.select_related(*select_related)
        
        # Apply prefetch_related for many-to-many
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        # Apply annotations
        if annotations:
            queryset = queryset.annotate(**annotations)
        
        # Apply limit
        if limit:
            queryset = queryset[:limit]
        
        # Log query count for monitoring
        reset_queries()
        list(queryset)  # Force evaluation
        self._query_count = len(connection.queries)
        
        if self._query_count > 5:
            logger.warning(f"High query count: {self._query_count} queries")
        
        return queryset

# Specific repository implementations
class ProjectRepository(OptimizedRepository):
    """Optimized project repository"""
    
    def get_user_projects_optimized(self, user_id: int) -> QuerySet:
        """Get user projects with all necessary data in minimal queries"""
        from projects.models import Project
        from feedbacks.models import FeedBack
        
        return self.list_optimized(
            filters=Q(user_id=user_id) | Q(members__user_id=user_id),
            select_related=['user'],
            prefetch_related=[
                Prefetch('members', 
                    queryset=Member.objects.select_related('user')
                ),
                Prefetch('feedbacks',
                    queryset=FeedBack.objects.filter(status='open')[:5]
                )
            ],
            annotations={
                'total_feedbacks': Count('feedbacks', distinct=True),
                'open_feedbacks': Count(
                    'feedbacks',
                    filter=Q(feedbacks__status='open'),
                    distinct=True
                ),
                'member_count': Count('members', distinct=True) + 1,
                'latest_activity': Max('feedbacks__created')
            }
        )
    
    def get_project_dashboard(self, project_id: int) -> Dict[str, Any]:
        """Get complete project dashboard data in 2-3 queries max"""
        from django.db.models import Case, When, IntegerField
        
        project = self.get_with_relations(
            project_id,
            relations=['user', 'members__user', 'feedbacks__comments']
        )
        
        if not project:
            return None
        
        # Additional statistics in single query
        stats = FeedBack.objects.filter(project_id=project_id).aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='open')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            resolved=Count('id', filter=Q(status='resolved')),
            avg_resolution_time=Avg(
                F('updated') - F('created'),
                filter=Q(status='resolved')
            ),
            priority_distribution=Count(
                Case(
                    When(priority='critical', then=1),
                    When(priority='high', then=1),
                    When(priority='medium', then=1),
                    When(priority='low', then=1),
                    output_field=IntegerField()
                )
            )
        )
        
        return {
            'project': project,
            'stats': stats,
            'query_count': self._query_count
        }
```

### 2. Database Indexing Strategy

```sql
-- vridge_back/migrations/0002_performance_indexes.py

from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0001_initial'),
        ('feedbacks', '0001_initial'),
    ]
    
    operations = [
        # Composite indexes for frequent queries
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_feedback_project_status_created "
            "ON feedbacks_feedback(project_id, status, created DESC);"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_comment_feedback_created "
            "ON feedbacks_feedbackcomment(feedback_id, created DESC);"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_project_user_status "
            "ON projects_project(user_id, status) WHERE status = 'active';"
        ),
        
        # Partial indexes for specific conditions
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_feedback_open "
            "ON feedbacks_feedback(project_id, created DESC) "
            "WHERE status = 'open';"
        ),
        
        # Full-text search indexes
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_project_search "
            "ON projects_project USING GIN("
            "to_tsvector('korean', name || ' ' || COALESCE(description, '')))"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_comment_search "
            "ON feedbacks_feedbackcomment USING GIN("
            "to_tsvector('korean', title || ' ' || text))"
        ),
        
        # BRIN indexes for time-series data
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_feedback_created_brin "
            "ON feedbacks_feedback USING BRIN(created) WITH (pages_per_range = 128);"
        ),
    ]
```

### 3. Connection Pooling Configuration

```python
# vridge_back/config/settings.py

import dj_database_url
from django_postgrespool2 import pool

# Database connection pooling
DATABASES = {
    'default': {
        'ENGINE': 'django_postgrespool2',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '5432',
        'CONN_MAX_AGE': 600,  # 10 minutes
        'OPTIONS': {
            'MAX_CONNS': 50,
            'MIN_CONNS': 5,
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 seconds
        }
    }
}

# Read replica for read-heavy operations
DATABASES['replica'] = DATABASES['default'].copy()
DATABASES['replica']['HOST'] = os.environ.get('DB_REPLICA_HOST', DATABASES['default']['HOST'])

# Database routing
DATABASE_ROUTERS = ['core.infrastructure.db_router.ReadWriteRouter']
```

## 🚀 캐싱 전략 구현

### 1. Multi-Layer Cache Implementation

```python
# vridge_back/core/infrastructure/advanced_cache.py

import json
import hashlib
import pickle
from typing import Any, Optional, Callable, List
from functools import wraps
from django.core.cache import caches
from django.conf import settings
import redis
import msgpack

class MultiLayerCache:
    """
    L1: Process Memory (fastest, smallest)
    L2: Redis Memory (fast, medium)
    L3: Redis Disk (slower, largest)
    """
    
    def __init__(self):
        self.l1_cache = {}  # Process memory
        self.l2_cache = caches['redis_memory']  # Redis in-memory
        self.l3_cache = caches['redis_disk']  # Redis with persistence
        self.stats = {
            'l1_hits': 0,
            'l2_hits': 0,
            'l3_hits': 0,
            'misses': 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get from cache with fallback through layers"""
        
        # L1: Process memory
        if key in self.l1_cache:
            self.stats['l1_hits'] += 1
            return self.l1_cache[key]
        
        # L2: Redis memory
        value = self.l2_cache.get(key)
        if value is not None:
            self.stats['l2_hits'] += 1
            self.l1_cache[key] = value  # Promote to L1
            return value
        
        # L3: Redis disk
        value = self.l3_cache.get(key)
        if value is not None:
            self.stats['l3_hits'] += 1
            self.l2_cache.set(key, value, 300)  # Promote to L2
            self.l1_cache[key] = value  # Promote to L1
            return value
        
        self.stats['misses'] += 1
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """Set in all cache layers with appropriate TTLs"""
        self.l1_cache[key] = value
        self.l2_cache.set(key, value, ttl)
        self.l3_cache.set(key, value, ttl * 4)  # Longer TTL for L3
    
    def invalidate(self, pattern: str):
        """Invalidate cache by pattern"""
        # Clear L1
        keys_to_delete = [k for k in self.l1_cache if pattern in k]
        for key in keys_to_delete:
            del self.l1_cache[key]
        
        # Clear L2 and L3
        self.l2_cache.delete_pattern(pattern)
        self.l3_cache.delete_pattern(pattern)

# Smart cache decorator with compression
def smart_cache(
    ttl: int = 300,
    key_prefix: str = None,
    compress: bool = True,
    cache_none: bool = False
):
    """Advanced caching decorator with compression and smart invalidation"""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = generate_cache_key(func, args, kwargs, key_prefix)
            
            # Try to get from cache
            cache = MultiLayerCache()
            cached_value = cache.get(cache_key)
            
            if cached_value is not None:
                if compress:
                    cached_value = decompress_value(cached_value)
                return cached_value
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result
            if result is not None or cache_none:
                value_to_cache = compress_value(result) if compress else result
                cache.set(cache_key, value_to_cache, ttl)
            
            return result
        
        return wrapper
    return decorator

def generate_cache_key(func, args, kwargs, prefix=None):
    """Generate a unique cache key"""
    key_parts = [
        prefix or func.__module__ + '.' + func.__name__,
        str(args),
        str(sorted(kwargs.items()))
    ]
    key_string = ':'.join(key_parts)
    
    # Hash if too long
    if len(key_string) > 200:
        key_string = hashlib.md5(key_string.encode()).hexdigest()
    
    return key_string

def compress_value(value):
    """Compress value using msgpack"""
    return msgpack.packb(value, use_bin_type=True)

def decompress_value(value):
    """Decompress value using msgpack"""
    return msgpack.unpackb(value, raw=False)
```

### 2. Cache Warming Strategy

```python
# vridge_back/core/infrastructure/cache_warmer.py

from celery import shared_task
from django.core.management.base import BaseCommand
from typing import List
import logging

logger = logging.getLogger(__name__)

class CacheWarmer:
    """Proactive cache warming for frequently accessed data"""
    
    @shared_task
    def warm_user_dashboard_cache(self, user_ids: List[int]):
        """Warm dashboard cache for active users"""
        from core.application.services import DashboardService
        
        service = DashboardService()
        warmed_count = 0
        
        for user_id in user_ids:
            try:
                # This will populate the cache
                service.get_user_dashboard(user_id, force_refresh=True)
                warmed_count += 1
            except Exception as e:
                logger.error(f"Failed to warm cache for user {user_id}: {e}")
        
        logger.info(f"Warmed cache for {warmed_count}/{len(user_ids)} users")
        return warmed_count
    
    @shared_task
    def warm_project_cache(self, project_ids: List[int]):
        """Warm project cache for active projects"""
        from projects.repositories import ProjectRepository
        
        repo = ProjectRepository()
        warmed_count = 0
        
        for project_id in project_ids:
            try:
                # Preload project with all relations
                repo.get_project_dashboard(project_id)
                warmed_count += 1
            except Exception as e:
                logger.error(f"Failed to warm cache for project {project_id}: {e}")
        
        return warmed_count
    
    @shared_task
    def identify_hot_data(self):
        """Identify frequently accessed data for warming"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Find most active users (last 24 hours)
            cursor.execute("""
                SELECT user_id, COUNT(*) as access_count
                FROM api_access_log
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY user_id
                ORDER BY access_count DESC
                LIMIT 100
            """)
            hot_users = [row[0] for row in cursor.fetchall()]
            
            # Find most active projects
            cursor.execute("""
                SELECT project_id, COUNT(*) as access_count
                FROM feedbacks_feedback
                WHERE created > NOW() - INTERVAL '24 hours'
                GROUP BY project_id
                ORDER BY access_count DESC
                LIMIT 50
            """)
            hot_projects = [row[0] for row in cursor.fetchall()]
        
        # Schedule warming tasks
        warm_user_dashboard_cache.delay(hot_users)
        warm_project_cache.delay(hot_projects)
        
        return {
            'hot_users': len(hot_users),
            'hot_projects': len(hot_projects)
        }

# Management command for manual cache warming
class Command(BaseCommand):
    help = 'Warm application caches'
    
    def handle(self, *args, **options):
        warmer = CacheWarmer()
        result = warmer.identify_hot_data()
        self.stdout.write(
            self.style.SUCCESS(
                f"Cache warming initiated: {result}"
            )
        )
```

### 3. Cache Invalidation Strategy

```python
# vridge_back/core/infrastructure/cache_invalidation.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class CacheInvalidator:
    """Intelligent cache invalidation based on data changes"""
    
    @staticmethod
    def invalidate_project_cache(project_id: int):
        """Invalidate all project-related caches"""
        patterns = [
            f"project:{project_id}:*",
            f"dashboard:*:projects",  # User dashboards containing this project
            f"stats:project:{project_id}",
            f"gantt:{project_id}:*",
            f"search:*"  # Search results might contain this project
        ]
        
        for pattern in patterns:
            cache.delete_pattern(pattern)
            logger.debug(f"Invalidated cache pattern: {pattern}")
    
    @staticmethod
    def invalidate_feedback_cache(feedback_id: int, project_id: int):
        """Invalidate feedback-related caches"""
        patterns = [
            f"feedback:{feedback_id}:*",
            f"project:{project_id}:feedbacks",
            f"project:{project_id}:stats",
            f"comments:feedback:{feedback_id}:*",
            f"dashboard:*"  # Dashboard stats affected
        ]
        
        for pattern in patterns:
            cache.delete_pattern(pattern)
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate user-related caches"""
        patterns = [
            f"user:{user_id}:*",
            f"dashboard:{user_id}:*",
            f"permissions:{user_id}:*",
            f"notifications:{user_id}:*"
        ]
        
        for pattern in patterns:
            cache.delete_pattern(pattern)

# Signal receivers for automatic invalidation
@receiver(post_save, sender='projects.Project')
def invalidate_project_on_save(sender, instance, **kwargs):
    CacheInvalidator.invalidate_project_cache(instance.id)

@receiver(post_save, sender='feedbacks.FeedBack')
def invalidate_feedback_on_save(sender, instance, **kwargs):
    CacheInvalidator.invalidate_feedback_cache(
        instance.id,
        instance.project_id
    )

@receiver(post_delete, sender='projects.Project')
def invalidate_project_on_delete(sender, instance, **kwargs):
    CacheInvalidator.invalidate_project_cache(instance.id)
```

## ⚡ API Response Optimization

### 1. Smart Pagination Implementation

```python
# vridge_back/core/infrastructure/pagination.py

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.utils.functional import cached_property
import hashlib

class OptimizedPagination(PageNumberPagination):
    """Optimized pagination with cursor support and caching"""
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Enhanced response with additional metadata"""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'page_info': {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.get_page_size(self.request),
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
                'start_index': self.page.start_index(),
                'end_index': self.page.end_index()
            },
            'cache_key': self._generate_cache_key()
        })
    
    def _generate_cache_key(self):
        """Generate cache key for this page"""
        request = self.request
        key_parts = [
            request.path,
            str(request.GET.dict()),
            str(self.page.number)
        ]
        key_string = ':'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()

class CursorPagination(PageNumberPagination):
    """Cursor-based pagination for real-time feeds"""
    
    cursor_query_param = 'cursor'
    page_size = 20
    
    def paginate_queryset(self, queryset, request, view=None):
        """Paginate using cursor for better performance on large datasets"""
        cursor = request.query_params.get(self.cursor_query_param)
        
        if cursor:
            # Decode cursor and filter queryset
            decoded_cursor = self.decode_cursor(cursor)
            queryset = queryset.filter(created__lt=decoded_cursor)
        
        # Order by creation time
        queryset = queryset.order_by('-created')
        
        # Get page
        page = queryset[:self.page_size + 1]
        
        # Check if there's more
        has_next = len(page) > self.page_size
        if has_next:
            page = page[:-1]
        
        # Generate next cursor
        if page and has_next:
            next_cursor = self.encode_cursor(page[-1].created)
        else:
            next_cursor = None
        
        self.next_cursor = next_cursor
        return list(page)
    
    def encode_cursor(self, timestamp):
        """Encode timestamp as cursor"""
        import base64
        return base64.b64encode(str(timestamp).encode()).decode()
    
    def decode_cursor(self, cursor):
        """Decode cursor to timestamp"""
        import base64
        from datetime import datetime
        decoded = base64.b64decode(cursor.encode()).decode()
        return datetime.fromisoformat(decoded)
```

### 2. Field Selection and Response Optimization

```python
# vridge_back/core/infrastructure/serializer_optimization.py

from rest_framework import serializers
from django.db.models import Prefetch
from typing import List, Dict, Any

class OptimizedModelSerializer(serializers.ModelSerializer):
    """Base serializer with field selection and query optimization"""
    
    def __init__(self, *args, **kwargs):
        # Allow field selection via query params
        request = kwargs.get('context', {}).get('request')
        fields = None
        
        if request:
            fields = request.query_params.get('fields')
            expand = request.query_params.get('expand')
            
            # Handle field expansion
            if expand:
                self._expand_fields(expand.split(','))
        
        super().__init__(*args, **kwargs)
        
        # Apply field selection
        if fields:
            allowed = set(fields.split(','))
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
    
    def _expand_fields(self, expand_fields: List[str]):
        """Dynamically expand nested fields"""
        for field in expand_fields:
            if field == 'user':
                self.fields['user'] = UserSerializer(read_only=True)
            elif field == 'comments':
                self.fields['comments'] = CommentSerializer(many=True, read_only=True)
            # Add more expansion options as needed
    
    @classmethod
    def setup_eager_loading(cls, queryset, request=None):
        """Setup eager loading based on requested fields"""
        # Default eager loading
        select_related = []
        prefetch_related = []
        
        # Check requested fields
        if request:
            fields = request.query_params.get('fields', '').split(',')
            expand = request.query_params.get('expand', '').split(',')
            
            # Add eager loading based on requested fields
            if 'user' in fields or 'user' in expand:
                select_related.append('user')
            
            if 'comments' in fields or 'comments' in expand:
                prefetch_related.append('comments')
            
            if 'members' in fields or 'members' in expand:
                prefetch_related.append(
                    Prefetch('members',
                        queryset=Member.objects.select_related('user')
                    )
                )
        
        # Apply eager loading
        if select_related:
            queryset = queryset.select_related(*select_related)
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        return queryset

# Example usage in views
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    
    def get_queryset(self):
        queryset = Project.objects.all()
        # Setup eager loading based on requested fields
        queryset = ProjectSerializer.setup_eager_loading(
            queryset,
            self.request
        )
        return queryset
```

### 3. Response Compression and CDN Integration

```python
# vridge_back/core/middleware/compression.py

import gzip
import json
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

class SmartCompressionMiddleware(MiddlewareMixin):
    """Intelligent response compression based on content"""
    
    MIN_COMPRESS_SIZE = 1024  # 1KB
    COMPRESSIBLE_TYPES = [
        'application/json',
        'text/html',
        'text/plain',
        'text/css',
        'text/javascript',
        'application/javascript'
    ]
    
    def process_response(self, request, response):
        """Compress response if beneficial"""
        
        # Check if compression is beneficial
        if not self.should_compress(request, response):
            return response
        
        # Check content type
        content_type = response.get('Content-Type', '').split(';')[0]
        if content_type not in self.COMPRESSIBLE_TYPES:
            return response
        
        # Check content size
        if len(response.content) < self.MIN_COMPRESS_SIZE:
            return response
        
        # Compress content
        compressed_content = gzip.compress(response.content)
        
        # Only use compression if it reduces size
        if len(compressed_content) < len(response.content) * 0.9:
            response.content = compressed_content
            response['Content-Encoding'] = 'gzip'
            response['Content-Length'] = len(compressed_content)
        
        return response
    
    def should_compress(self, request, response):
        """Determine if compression should be applied"""
        # Check if client accepts gzip
        if 'gzip' not in request.META.get('HTTP_ACCEPT_ENCODING', ''):
            return False
        
        # Don't compress if already compressed
        if response.get('Content-Encoding'):
            return False
        
        # Don't compress streaming responses
        if response.streaming:
            return False
        
        return True

# CDN configuration for static assets
class CDNMiddleware(MiddlewareMixin):
    """Rewrite static asset URLs to CDN"""
    
    CDN_DOMAIN = 'cdn.vridge.kr'
    
    def process_response(self, request, response):
        """Rewrite static URLs in HTML responses"""
        
        if response.get('Content-Type', '').startswith('text/html'):
            content = response.content.decode('utf-8')
            
            # Replace static URLs
            content = content.replace(
                '/static/',
                f'https://{self.CDN_DOMAIN}/static/'
            )
            content = content.replace(
                '/media/',
                f'https://{self.CDN_DOMAIN}/media/'
            )
            
            response.content = content.encode('utf-8')
        
        return response
```

## 🔄 Asynchronous Processing

### 1. Celery Task Implementation

```python
# vridge_back/core/infrastructure/async_tasks.py

from celery import shared_task, Task
from celery.result import AsyncResult
from django.core.cache import cache
import logging
import time

logger = logging.getLogger(__name__)

class CallbackTask(Task):
    """Task with callbacks for success/failure"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Success callback"""
        cache.set(f"task:result:{task_id}", {
            'status': 'success',
            'result': retval,
            'completed_at': time.time()
        }, 3600)
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Failure callback"""
        cache.set(f"task:result:{task_id}", {
            'status': 'failed',
            'error': str(exc),
            'traceback': str(einfo),
            'failed_at': time.time()
        }, 3600)

@shared_task(base=CallbackTask, bind=True, max_retries=3)
def process_video_upload(self, video_id: int):
    """Process video upload asynchronously"""
    from feedbacks.models import FeedBack
    from core.services.video_processor import VideoProcessor
    
    try:
        feedback = FeedBack.objects.get(id=video_id)
        processor = VideoProcessor()
        
        # Generate thumbnails
        self.update_state(state='PROCESSING', meta={'step': 'thumbnails'})
        thumbnails = processor.generate_thumbnails(feedback.files)
        
        # Extract metadata
        self.update_state(state='PROCESSING', meta={'step': 'metadata'})
        metadata = processor.extract_metadata(feedback.files)
        
        # Optimize video for streaming
        self.update_state(state='PROCESSING', meta={'step': 'optimization'})
        optimized_url = processor.optimize_for_streaming(feedback.files)
        
        # Update feedback
        feedback.thumbnails = thumbnails
        feedback.metadata = metadata
        feedback.optimized_url = optimized_url
        feedback.processing_status = 'completed'
        feedback.save()
        
        # Notify via WebSocket
        notify_video_processed.delay(video_id)
        
        return {
            'video_id': video_id,
            'thumbnails': thumbnails,
            'metadata': metadata,
            'optimized_url': optimized_url
        }
        
    except Exception as exc:
        logger.error(f"Video processing failed for {video_id}: {exc}")
        self.retry(exc=exc, countdown=60)

@shared_task
def generate_ai_storyboard(plan_id: int, regenerate: bool = False):
    """Generate AI storyboard asynchronously"""
    from ai_planning.models import VideoPlan
    from ai_planning.services import StoryboardGenerator
    
    try:
        plan = VideoPlan.objects.get(id=plan_id)
        generator = StoryboardGenerator()
        
        # Check cache first
        if not regenerate:
            cached = cache.get(f"storyboard:{plan_id}")
            if cached:
                return cached
        
        # Generate storyboard
        storyboard = generator.generate(plan)
        
        # Cache result
        cache.set(f"storyboard:{plan_id}", storyboard, 3600)
        
        # Update plan
        plan.storyboard_data = storyboard
        plan.save()
        
        return storyboard
        
    except Exception as exc:
        logger.error(f"Storyboard generation failed: {exc}")
        raise

@shared_task
def cleanup_expired_files():
    """Clean up expired files periodically"""
    from django.utils import timezone
    from feedbacks.models import FeedBack
    
    expiry_date = timezone.now() - timezone.timedelta(days=30)
    
    # Find expired feedbacks
    expired = FeedBack.objects.filter(
        created__lt=expiry_date,
        status='closed'
    )
    
    deleted_count = 0
    for feedback in expired:
        try:
            # Delete file from storage
            if feedback.files:
                feedback.files.delete()
            deleted_count += 1
        except Exception as e:
            logger.error(f"Failed to delete file for feedback {feedback.id}: {e}")
    
    logger.info(f"Cleaned up {deleted_count} expired files")
    return deleted_count
```

### 2. WebSocket Optimization

```python
# vridge_back/feedbacks/optimized_consumers.py

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import json
import asyncio
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class OptimizedFeedbackConsumer(AsyncWebsocketConsumer):
    """Optimized WebSocket consumer with connection pooling and rate limiting"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.project_id = None
        self.user_id = None
        self.rate_limiter = RateLimiter()
        self.message_queue = asyncio.Queue(maxsize=100)
        self.send_task = None
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.user_id = self.scope['user'].id
        
        # Check rate limit
        if not await self.check_rate_limit():
            await self.close(code=4029, reason="Rate limit exceeded")
            return
        
        # Check permissions
        if not await self.check_permissions():
            await self.close(code=4003, reason="Permission denied")
            return
        
        # Join room group
        self.room_group_name = f'feedback_{self.project_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept connection
        await self.accept()
        
        # Start message sender task
        self.send_task = asyncio.create_task(self.message_sender())
        
        # Send initial state
        await self.send_initial_state()
        
        # Update connection count
        await self.update_connection_count(1)
        
        logger.info(f"WebSocket connected: user={self.user_id}, project={self.project_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Cancel sender task
        if self.send_task:
            self.send_task.cancel()
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        
        # Update connection count
        await self.update_connection_count(-1)
        
        logger.info(f"WebSocket disconnected: user={self.user_id}, code={close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Rate limiting per message type
            if not await self.rate_limiter.check(self.user_id, message_type):
                await self.send_error("Rate limit exceeded")
                return
            
            # Route message to handler
            handler = getattr(self, f'handle_{message_type}', None)
            if handler:
                await handler(data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Internal error")
    
    async def handle_comment_add(self, data):
        """Handle adding a comment"""
        comment_data = data.get('comment')
        
        # Validate data
        if not self.validate_comment(comment_data):
            await self.send_error("Invalid comment data")
            return
        
        # Save comment
        comment = await self.save_comment(comment_data)
        
        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'comment_message',
                'comment': comment,
                'user_id': self.user_id
            }
        )
    
    async def handle_typing_indicator(self, data):
        """Handle typing indicator"""
        is_typing = data.get('is_typing', False)
        
        # Broadcast typing status (but not to sender)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_message',
                'user_id': self.user_id,
                'is_typing': is_typing,
                'exclude_channel': self.channel_name
            }
        )
    
    async def comment_message(self, event):
        """Send comment to WebSocket"""
        if event.get('exclude_channel') != self.channel_name:
            await self.message_queue.put({
                'type': 'comment',
                'comment': event['comment'],
                'user_id': event['user_id']
            })
    
    async def typing_message(self, event):
        """Send typing indicator to WebSocket"""
        if event.get('exclude_channel') != self.channel_name:
            await self.message_queue.put({
                'type': 'typing',
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            })
    
    async def message_sender(self):
        """Batch and send messages from queue"""
        batch = []
        while True:
            try:
                # Collect messages for batching
                timeout = 0.1 if batch else None
                message = await asyncio.wait_for(
                    self.message_queue.get(),
                    timeout=timeout
                )
                batch.append(message)
                
                # Send batch if size limit reached
                if len(batch) >= 10:
                    await self.send_batch(batch)
                    batch = []
                    
            except asyncio.TimeoutError:
                # Send pending batch
                if batch:
                    await self.send_batch(batch)
                    batch = []
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in message sender: {e}")
    
    async def send_batch(self, messages):
        """Send batch of messages"""
        await self.send(text_data=json.dumps({
            'type': 'batch',
            'messages': messages
        }))
    
    async def send_error(self, error_message):
        """Send error message"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message
        }))
    
    @database_sync_to_async
    def check_permissions(self):
        """Check user permissions for project"""
        from projects.models import Project, Member
        
        try:
            project = Project.objects.get(id=self.project_id)
            
            # Check if user is owner or member
            if project.user_id == self.user_id:
                return True
            
            return Member.objects.filter(
                project_id=self.project_id,
                user_id=self.user_id
            ).exists()
            
        except Project.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_comment(self, comment_data):
        """Save comment to database"""
        from feedbacks.models import FeedBackComment
        
        comment = FeedBackComment.objects.create(
            feedback_id=comment_data['feedback_id'],
            user_id=self.user_id,
            title=comment_data.get('title'),
            text=comment_data['text'],
            section=comment_data.get('section'),
            security=comment_data.get('security', False)
        )
        
        return {
            'id': str(comment.id),
            'text': comment.text,
            'user_id': self.user_id,
            'created': comment.created.isoformat()
        }
    
    async def check_rate_limit(self):
        """Check connection rate limit"""
        key = f"ws:connections:{self.user_id}"
        conn_count = await cache.aget(key, 0)
        
        if conn_count >= 5:  # Max 5 connections per user
            return False
        
        await cache.aset(key, conn_count + 1, 60)
        return True
    
    async def update_connection_count(self, delta):
        """Update connection count"""
        key = f"ws:connections:{self.user_id}"
        conn_count = await cache.aget(key, 0)
        new_count = max(0, conn_count + delta)
        await cache.aset(key, new_count, 60)
    
    async def send_initial_state(self):
        """Send initial state to client"""
        # Get recent comments from cache or database
        recent_comments = await self.get_recent_comments()
        
        await self.send(text_data=json.dumps({
            'type': 'initial_state',
            'project_id': self.project_id,
            'comments': recent_comments
        }))
    
    @database_sync_to_async
    def get_recent_comments(self):
        """Get recent comments for project"""
        from feedbacks.models import FeedBackComment
        
        # Try cache first
        cache_key = f"recent_comments:{self.project_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Get from database
        comments = list(
            FeedBackComment.objects.filter(
                feedback__project_id=self.project_id
            ).select_related('user').order_by('-created')[:20].values(
                'id', 'text', 'user__username', 'created'
            )
        )
        
        # Cache for 5 minutes
        cache.set(cache_key, comments, 300)
        
        return comments
    
    def validate_comment(self, data):
        """Validate comment data"""
        required_fields = ['feedback_id', 'text']
        return all(field in data for field in required_fields)

class RateLimiter:
    """Rate limiting for WebSocket messages"""
    
    LIMITS = {
        'comment_add': (10, 60),  # 10 per minute
        'typing_indicator': (30, 60),  # 30 per minute
        'reaction_add': (20, 60),  # 20 per minute
    }
    
    async def check(self, user_id: int, message_type: str) -> bool:
        """Check if action is within rate limit"""
        limit, window = self.LIMITS.get(message_type, (100, 60))
        
        key = f"rate:{user_id}:{message_type}"
        current = await cache.aget(key, 0)
        
        if current >= limit:
            return False
        
        await cache.aset(key, current + 1, window)
        return True
```

## 📈 Monitoring & Performance Tracking

### 1. Performance Monitoring Implementation

```python
# vridge_back/core/monitoring/performance.py

from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache
from prometheus_client import Counter, Histogram, Gauge
import time
import logging

logger = logging.getLogger(__name__)

# Prometheus metrics
request_count = Counter('django_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('django_request_duration_seconds', 'Request duration', ['method', 'endpoint'])
db_query_count = Gauge('django_db_queries', 'Database queries per request')
cache_hit_rate = Gauge('django_cache_hit_rate', 'Cache hit rate')
ws_connections = Gauge('websocket_connections', 'Active WebSocket connections')

class PerformanceMonitor:
    """Real-time performance monitoring"""
    
    def __init__(self):
        self.metrics = {
            'requests': [],
            'slow_queries': [],
            'cache_stats': {},
            'error_rate': 0
        }
    
    def track_request(self, request, response, duration):
        """Track API request performance"""
        # Update Prometheus metrics
        request_count.labels(
            method=request.method,
            endpoint=request.path,
            status=response.status_code
        ).inc()
        
        request_duration.labels(
            method=request.method,
            endpoint=request.path
        ).observe(duration)
        
        # Track slow requests
        if duration > 0.5:  # 500ms
            self.metrics['requests'].append({
                'path': request.path,
                'method': request.method,
                'duration': duration,
                'timestamp': time.time(),
                'user_id': getattr(request.user, 'id', None)
            })
            
            # Alert if too many slow requests
            if len(self.metrics['requests']) > 10:
                self.send_alert('High number of slow requests detected')
    
    def track_database_queries(self):
        """Track database query performance"""
        queries = connection.queries
        slow_queries = [q for q in queries if float(q['time']) > 0.1]
        
        if slow_queries:
            self.metrics['slow_queries'].extend(slow_queries)
            logger.warning(f"Slow queries detected: {len(slow_queries)}")
        
        # Update metric
        db_query_count.set(len(queries))
    
    def track_cache_performance(self):
        """Track cache hit rate"""
        stats = cache.get_stats()
        hit_rate = stats.get('hit_rate', 0)
        
        # Update metric
        cache_hit_rate.set(hit_rate)
        
        # Alert if hit rate is low
        if hit_rate < 60:
            self.send_alert(f'Low cache hit rate: {hit_rate}%')
    
    def generate_report(self):
        """Generate performance report"""
        return {
            'slow_requests': len(self.metrics['requests']),
            'avg_response_time': self.calculate_avg_response_time(),
            'slow_queries': len(self.metrics['slow_queries']),
            'cache_hit_rate': cache_hit_rate._value.get(),
            'db_queries_avg': db_query_count._value.get(),
            'ws_connections': ws_connections._value.get(),
            'error_rate': self.calculate_error_rate()
        }
    
    def calculate_avg_response_time(self):
        """Calculate average response time"""
        if not self.metrics['requests']:
            return 0
        
        total = sum(r['duration'] for r in self.metrics['requests'])
        return total / len(self.metrics['requests'])
    
    def calculate_error_rate(self):
        """Calculate error rate"""
        # Implementation depends on your error tracking
        return 0.1  # Placeholder
    
    def send_alert(self, message):
        """Send performance alert"""
        logger.error(f"PERFORMANCE ALERT: {message}")
        # Send to monitoring service (e.g., Sentry, PagerDuty)

# Middleware for automatic tracking
class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.monitor = PerformanceMonitor()
    
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        # Track performance
        self.monitor.track_request(request, response, duration)
        self.monitor.track_database_queries()
        self.monitor.track_cache_performance()
        
        # Add performance headers
        response['X-Response-Time'] = f"{duration:.3f}"
        response['X-DB-Queries'] = len(connection.queries)
        
        return response
```

## 🎯 성능 최적화 체크리스트

### 데이터베이스 최적화
- [ ] 모든 외래 키에 인덱스 생성
- [ ] 복합 인덱스 적용 (frequent WHERE clauses)
- [ ] Full-text search 인덱스 구성
- [ ] Connection pooling 설정
- [ ] Read replica 구성
- [ ] Query optimization (N+1 해결)
- [ ] Partial indexes 적용
- [ ] VACUUM/ANALYZE 스케줄링

### 캐싱 전략
- [ ] Multi-layer 캐싱 구현
- [ ] Cache warming 스케줄 설정
- [ ] Smart invalidation 구현
- [ ] Response caching
- [ ] Query result caching
- [ ] Session caching
- [ ] Static file CDN 설정

### API 최적화
- [ ] Field selection 구현
- [ ] Smart pagination
- [ ] Response compression
- [ ] Batch endpoints
- [ ] GraphQL consideration
- [ ] API versioning
- [ ] Rate limiting

### 비동기 처리
- [ ] Celery worker 설정
- [ ] Task queue optimization
- [ ] WebSocket connection pooling
- [ ] Message batching
- [ ] Background job scheduling
- [ ] Dead letter queue

### 모니터링
- [ ] APM 도구 설정 (New Relic/DataDog)
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Alert rules
- [ ] Log aggregation
- [ ] Error tracking (Sentry)
- [ ] Performance budgets

### 인프라 최적화
- [ ] Load balancer 설정
- [ ] Auto-scaling rules
- [ ] Container optimization
- [ ] Resource limits
- [ ] Health checks
- [ ] Graceful shutdown
- [ ] Zero-downtime deployment

## 📊 예상 성능 개선

### Before Optimization
- Response time: ~500ms (p50)
- Database queries: 15-20 per request
- Cache hit rate: <30%
- Concurrent users: ~100

### After Optimization
- Response time: <100ms (p50)
- Database queries: 3-5 per request
- Cache hit rate: >80%
- Concurrent users: 1000+

### 성능 개선 효과
- **60% 응답 시간 감소**
- **75% 데이터베이스 부하 감소**
- **10x 동시 접속자 처리 능력**
- **90% 캐시 활용률**

---

**Author**: Benjamin (Backend Lead Architect)  
**Last Updated**: 2025-08-23  
**Version**: 1.0.0