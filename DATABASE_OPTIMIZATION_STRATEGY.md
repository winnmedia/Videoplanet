# Database Query Optimization and Caching Strategy

## Current Database Performance Analysis

### Identified Performance Issues

#### 1. N+1 Query Problems
❌ **Project List View**: Each project triggers additional queries for related objects  
❌ **Member filtering**: `project.members.all().filter(user__username=email)` - inefficient  
❌ **Feedback queries**: Missing select_related for user relationships  
❌ **Complex date logic**: Multiple conditional queries for date calculations  

#### 2. Missing Database Indexes
❌ **User lookup by username**: No index on frequently queried field  
❌ **Project member relationships**: No compound indexes  
❌ **Feedback filtering**: No indexes on foreign keys  
❌ **Date range queries**: No indexes on start_date/end_date fields  

#### 3. Inefficient Query Patterns
❌ **Manual date calculations**: Complex Python logic instead of database aggregation  
❌ **Redundant exists() calls**: Multiple database hits for permission checks  
❌ **Missing query optimization**: No use of prefetch_related for many-to-many  

## Optimization Strategy

### 1. Query Optimization with ORM Improvements

#### Current Problematic Code:
```python
# Current inefficient project list
project_list = user.projects.all().select_related(
    "basic_plan", "story_board", "filming", "video_edit",
    "post_work", "video_preview", "confirmation", "video_delivery",
)

# N+1 problem in loop
for i in project_list:
    if i.video_delivery.end_date:  # Additional query
        end_date = i.video_delivery.end_date
    # ... more conditional queries
```

#### Optimized Implementation:
```python
# performance/querysets.py
from django.db import models
from django.db.models import Case, When, F, Q, Exists, OuterRef

class ProjectQuerySet(models.QuerySet):
    def with_timeline_data(self):
        """Optimize project timeline queries with single database hit"""
        return self.select_related(
            'user', 'feedback',
            'basic_plan', 'story_board', 'filming', 'video_edit',
            'post_work', 'video_preview', 'confirmation', 'video_delivery'
        ).annotate(
            # Calculate earliest start date using database
            earliest_start_date=Case(
                When(basic_plan__start_date__isnull=False, then=F('basic_plan__start_date')),
                When(story_board__start_date__isnull=False, then=F('story_board__start_date')),
                When(filming__start_date__isnull=False, then=F('filming__start_date')),
                When(video_edit__start_date__isnull=False, then=F('video_edit__start_date')),
                When(post_work__start_date__isnull=False, then=F('post_work__start_date')),
                When(video_preview__start_date__isnull=False, then=F('video_preview__start_date')),
                When(confirmation__start_date__isnull=False, then=F('confirmation__start_date')),
                default=F('video_delivery__start_date'),
                output_field=models.DateTimeField()
            ),
            # Calculate latest end date using database
            latest_end_date=Case(
                When(video_delivery__end_date__isnull=False, then=F('video_delivery__end_date')),
                When(confirmation__end_date__isnull=False, then=F('confirmation__end_date')),
                When(video_preview__end_date__isnull=False, then=F('video_preview__end_date')),
                When(post_work__end_date__isnull=False, then=F('post_work__end_date')),
                When(video_edit__end_date__isnull=False, then=F('video_edit__end_date')),
                When(filming__end_date__isnull=False, then=F('filming__end_date')),
                When(story_board__end_date__isnull=False, then=F('story_board__end_date')),
                default=F('basic_plan__end_date'),
                output_field=models.DateTimeField()
            ),
            # Count members efficiently
            member_count=models.Count('members'),
            # Check if user has access efficiently
            user_has_access=Case(
                When(user=OuterRef('user_id'), then=models.Value(True)),
                When(members__user=OuterRef('user_id'), then=models.Value(True)),
                default=models.Value(False),
                output_field=models.BooleanField()
            )
        )
    
    def for_user(self, user):
        """Get projects accessible by user with single query"""
        return self.filter(
            Q(user=user) | Q(members__user=user)
        ).distinct()
    
    def with_feedback_data(self):
        """Prefetch feedback data efficiently"""
        return self.prefetch_related(
            'feedback__comments__user',
            'feedback__messages__user',
            'members__user',
            'files',
            'memos'
        )

class ProjectManager(models.Manager):
    def get_queryset(self):
        return ProjectQuerySet(self.model, using=self._db)
    
    def with_timeline_data(self):
        return self.get_queryset().with_timeline_data()
    
    def for_user(self, user):
        return self.get_queryset().for_user(user)

# Update models.py
class Project(core_model.TimeStampedModel):
    # ... existing fields ...
    
    objects = ProjectManager()
    
    class Meta:
        verbose_name = "1.프로젝트"
        verbose_name_plural = "1.프로젝트"
        # Add database indexes
        indexes = [
            models.Index(fields=['user', 'created']),
            models.Index(fields=['name']),
            models.Index(fields=['created', '-updated']),
        ]
```

#### Optimized Views:
```python
# projects/views.py - Optimized ProjectList
class ProjectListOptimized(View):
    @user_validator
    def get(self, request):
        try:
            user = request.user
            
            # Single optimized query instead of N+1
            projects = Project.objects.for_user(user).with_timeline_data()
            
            # Use values() to reduce memory usage
            result = list(projects.values(
                'id', 'name', 'manager', 'consumer', 'description', 'color',
                'earliest_start_date', 'latest_end_date', 'member_count',
                'basic_plan__start_date', 'basic_plan__end_date',
                'story_board__start_date', 'story_board__end_date',
                'filming__start_date', 'filming__end_date',
                'video_edit__start_date', 'video_edit__end_date',
                'post_work__start_date', 'post_work__end_date',
                'video_preview__start_date', 'video_preview__end_date',
                'confirmation__start_date', 'confirmation__end_date',
                'video_delivery__start_date', 'video_delivery__end_date',
            ))
            
            return JsonResponse({"result": result}, status=200)
            
        except Exception as e:
            logging.error(f"ProjectList error: {e}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
```

### 2. Database Index Strategy

#### Required Indexes:
```python
# migration file: add_performance_indexes.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0005_usermemo'),
        ('projects', '0013_alter_basicplan_end_date_alter_basicplan_start_date_and_more'),
        ('feedbacks', '0007_alter_feedback_options_and_more'),
    ]

    operations = [
        # User model indexes
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_users_user_username ON users_user(username);",
            reverse_sql="DROP INDEX idx_users_user_username;"
        ),
        
        # Project model indexes
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_projects_project_user_created ON projects_project(user_id, created);",
            reverse_sql="DROP INDEX idx_projects_project_user_created;"
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_projects_project_name_trgm ON projects_project USING gin(name gin_trgm_ops);",
            reverse_sql="DROP INDEX idx_projects_project_name_trgm;"
        ),
        
        # Members model indexes
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_projects_members_project_user ON projects_members(project_id, user_id);",
            reverse_sql="DROP INDEX idx_projects_members_project_user;"
        ),
        
        # Feedback model indexes
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_feedbacks_comment_feedback_created ON feedbacks_feedbackcomment(feedback_id, created);",
            reverse_sql="DROP INDEX idx_feedbacks_comment_feedback_created;"
        ),
        
        # Timeline-related indexes for date filtering
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_timeline_start_end_dates ON projects_basicplan(start_date, end_date) WHERE start_date IS NOT NULL;",
            reverse_sql="DROP INDEX idx_timeline_start_end_dates;"
        ),
        
        # Add similar indexes for other timeline models
        # ... additional timeline indexes ...
    ]
```

### 3. Redis Caching Strategy

#### Multi-Layer Caching Architecture:
```python
# caching/strategies.py
import redis
from django.core.cache import cache
from django.conf import settings
import json
import hashlib

class CacheStrategy:
    """Multi-layer caching for different data types"""
    
    # Cache TTL configuration
    CACHE_TTL = {
        'user_profile': 300,        # 5 minutes
        'project_list': 600,        # 10 minutes  
        'project_detail': 300,      # 5 minutes
        'feedback_thread': 60,      # 1 minute (real-time data)
        'member_permissions': 900,  # 15 minutes
        'timeline_data': 1800,      # 30 minutes (changes infrequently)
        'static_data': 86400,       # 24 hours (rarely changes)
    }
    
    @staticmethod
    def generate_cache_key(prefix: str, *args, **kwargs):
        """Generate consistent cache keys"""
        key_parts = [prefix]
        key_parts.extend(str(arg) for arg in args)
        
        if kwargs:
            key_parts.append(hashlib.md5(
                json.dumps(kwargs, sort_keys=True).encode()
            ).hexdigest()[:8])
        
        return ':'.join(key_parts)
    
    @staticmethod
    def cache_user_projects(user_id):
        """Cache user's project list with related data"""
        cache_key = CacheStrategy.generate_cache_key('user_projects', user_id)
        cached_data = cache.get(cache_key)
        
        if cached_data is None:
            user = User.objects.get(id=user_id)
            projects = Project.objects.for_user(user).with_timeline_data()
            
            # Convert to JSON-serializable format
            cached_data = []
            for project in projects:
                project_data = {
                    'id': project.id,
                    'name': project.name,
                    'manager': project.manager,
                    'consumer': project.consumer,
                    'description': project.description,
                    'color': project.color,
                    'earliest_start_date': project.earliest_start_date,
                    'latest_end_date': project.latest_end_date,
                    'member_count': project.member_count,
                    # ... timeline data ...
                }
                cached_data.append(project_data)
            
            cache.set(cache_key, cached_data, CacheStrategy.CACHE_TTL['project_list'])
        
        return cached_data
    
    @staticmethod
    def invalidate_user_cache(user_id):
        """Invalidate all user-related cache"""
        keys_to_invalidate = [
            CacheStrategy.generate_cache_key('user_projects', user_id),
            CacheStrategy.generate_cache_key('user_profile', user_id),
            CacheStrategy.generate_cache_key('user_permissions', user_id),
        ]
        
        cache.delete_many(keys_to_invalidate)
    
    @staticmethod
    def invalidate_project_cache(project_id):
        """Invalidate project-related cache"""
        project = Project.objects.get(id=project_id)
        
        # Invalidate project owner's cache
        CacheStrategy.invalidate_user_cache(project.user_id)
        
        # Invalidate all project members' cache
        member_user_ids = project.members.values_list('user_id', flat=True)
        for user_id in member_user_ids:
            CacheStrategy.invalidate_user_cache(user_id)
        
        # Invalidate specific project cache
        project_cache_keys = [
            CacheStrategy.generate_cache_key('project_detail', project_id),
            CacheStrategy.generate_cache_key('project_timeline', project_id),
            CacheStrategy.generate_cache_key('project_members', project_id),
        ]
        cache.delete_many(project_cache_keys)

# caching/decorators.py
from functools import wraps
from django.http import JsonResponse
import json

def cache_response(cache_key_prefix, ttl_key, user_dependent=True):
    """Decorator for caching API responses"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Generate cache key
            if user_dependent and hasattr(request, 'user'):
                cache_key = CacheStrategy.generate_cache_key(
                    cache_key_prefix, request.user.id, *args, **kwargs
                )
            else:
                cache_key = CacheStrategy.generate_cache_key(
                    cache_key_prefix, *args, **kwargs
                )
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response:
                return JsonResponse(cached_response)
            
            # Call original view
            response = view_func(self, request, *args, **kwargs)
            
            # Cache successful responses
            if response.status_code == 200:
                response_data = json.loads(response.content)
                cache.set(
                    cache_key, 
                    response_data, 
                    CacheStrategy.CACHE_TTL[ttl_key]
                )
            
            return response
        return wrapper
    return decorator
```

### 4. Optimized Views Implementation

#### Updated Project Views:
```python
# projects/views_optimized.py
from caching.strategies import CacheStrategy
from caching.decorators import cache_response

class ProjectListOptimized(View):
    @user_validator
    @cache_response('project_list', 'project_list', user_dependent=True)
    def get(self, request):
        try:
            user = request.user
            projects_data = CacheStrategy.cache_user_projects(user.id)
            return JsonResponse({"result": projects_data}, status=200)
            
        except Exception as e:
            logging.error(f"ProjectList error: {e}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)

class ProjectDetailOptimized(View):
    @user_validator
    @cache_response('project_detail', 'project_detail')
    def get(self, request, project_id):
        try:
            user = request.user
            
            # Single optimized query with all related data
            project = Project.objects.select_related(
                'user', 'feedback',
                'basic_plan', 'story_board', 'filming', 'video_edit',
                'post_work', 'video_preview', 'confirmation', 'video_delivery'
            ).prefetch_related(
                'members__user',
                'files',
                'memos',
                'feedback__comments__user',
                'feedback__messages__user'
            ).get(id=project_id)
            
            # Check permissions efficiently
            has_access = (
                project.user == user or 
                project.members.filter(user=user).exists()
            )
            
            if not has_access:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # Build response using prefetched data
            result = {
                'id': project.id,
                'name': project.name,
                'manager': project.manager,
                'consumer': project.consumer,
                'description': project.description,
                'owner_nickname': project.user.nickname,
                'owner_email': project.user.username,
                'created': project.created,
                'updated': project.updated,
                'member_list': [
                    {
                        'id': member.id,
                        'rating': member.rating,
                        'email': member.user.username,
                        'nickname': member.user.nickname
                    }
                    for member in project.members.all()
                ],
                # Timeline data using prefetched relationships
                'timeline': {
                    'basic_plan': {
                        'start_date': project.basic_plan.start_date if project.basic_plan else None,
                        'end_date': project.basic_plan.end_date if project.basic_plan else None,
                    },
                    # ... other timeline data ...
                },
                # Feedback data using prefetched relationships
                'feedback': {
                    'file_url': project.feedback.files.url if project.feedback and project.feedback.files else None,
                    'comments_count': len(project.feedback.comments.all()) if project.feedback else 0,
                    'recent_activity': project.feedback.messages.all()[:5] if project.feedback else []
                }
            }
            
            return JsonResponse({"result": result}, status=200)
            
        except Project.DoesNotExist:
            return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logging.error(f"ProjectDetail error: {e}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
```

### 5. Cache Invalidation Strategy

#### Signal-Based Cache Invalidation:
```python
# signals.py
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import Project, Members, FeedBackComment
from caching.strategies import CacheStrategy

@receiver(post_save, sender=Project)
def invalidate_project_cache(sender, instance, created, **kwargs):
    """Invalidate cache when project is created/updated"""
    if not created:  # Only for updates, not new creations
        CacheStrategy.invalidate_project_cache(instance.id)

@receiver(post_save, sender=Members)
@receiver(post_delete, sender=Members)
def invalidate_member_cache(sender, instance, **kwargs):
    """Invalidate cache when project membership changes"""
    CacheStrategy.invalidate_project_cache(instance.project_id)

@receiver(post_save, sender=FeedBackComment)
def invalidate_feedback_cache(sender, instance, created, **kwargs):
    """Invalidate feedback cache when new comments are added"""
    if created:
        project_id = instance.feedback.projects.id if instance.feedback.projects else None
        if project_id:
            CacheStrategy.invalidate_project_cache(project_id)
```

### 6. Performance Monitoring

#### Query Performance Monitoring:
```python
# performance/middleware.py
import time
import logging
from django.db import connection
from django.conf import settings

class QueryCountDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        if settings.DEBUG:
            queries_before = len(connection.queries)
            start_time = time.time()
            
        response = self.get_response(request)
        
        if settings.DEBUG:
            queries_after = len(connection.queries)
            query_count = queries_after - queries_before
            execution_time = time.time() - start_time
            
            if query_count > 10:  # Alert for potential N+1 problems
                logging.warning(f"High query count: {query_count} queries for {request.path}")
                
            response['X-Query-Count'] = str(query_count)
            response['X-Response-Time'] = f"{execution_time:.3f}s"
            
        return response

# Performance logging
class PerformanceLogger:
    @staticmethod
    def log_slow_query(query_time, query_sql, endpoint):
        if query_time > 0.5:  # Log queries taking more than 500ms
            logging.warning(f"Slow query detected: {query_time:.3f}s - {endpoint}")
            logging.debug(f"Query: {query_sql}")
    
    @staticmethod
    def log_cache_performance(cache_key, hit_or_miss, response_time):
        logging.info(f"Cache {hit_or_miss}: {cache_key} ({response_time:.3f}s)")
```

## Implementation Timeline

### Week 1: Database Optimization
- [ ] Create optimized QuerySets and Managers
- [ ] Update models with database indexes
- [ ] Optimize existing views with select_related/prefetch_related

### Week 2: Caching Implementation
- [ ] Set up Redis caching infrastructure
- [ ] Implement cache strategies for different data types
- [ ] Add cache invalidation signals

### Week 3: Performance Monitoring
- [ ] Add query performance monitoring
- [ ] Implement cache hit/miss tracking
- [ ] Set up alerting for performance issues

### Week 4: Testing & Optimization
- [ ] Load testing with optimized queries
- [ ] Cache performance validation
- [ ] Fine-tune cache TTL values

## Expected Performance Improvements

### Query Performance:
- **Project List**: 50+ queries → 1-2 queries (95% reduction)
- **Project Detail**: 20+ queries → 1 query (95% reduction)
- **Response Time**: 2-5 seconds → 50-200ms (90% improvement)

### Cache Performance:
- **Cache Hit Ratio**: Target >85% for frequently accessed data
- **Memory Usage**: Controlled cache size with TTL management
- **Cache Invalidation**: Real-time updates for data consistency

### Database Performance:
- **Index Usage**: 90%+ of queries using indexes
- **Query Execution Time**: <50ms for 95th percentile
- **Connection Pool**: Optimized for Railway PostgreSQL limits

## Success Metrics

1. **API Response Time**: <200ms for 95th percentile
2. **Database Query Count**: <3 queries per API call average
3. **Cache Hit Ratio**: >85% for project and user data
4. **Memory Usage**: Redis cache <100MB for optimal Railway usage
5. **Database Connection Usage**: <80% of connection limit

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: High - Critical for Next.js performance