# Next.js App Router API Optimization Plan

## Overview
This document outlines the specific optimizations needed to make the Django backend fully compatible with Next.js App Router patterns including ISR, SSG, and server components.

## 1. API Response Format Standardization

### Current Issues:
- Inconsistent response formats across endpoints
- Mixed success/error response structures
- No standardized pagination
- Missing metadata for caching

### Solution: Standardized API Response Format

```python
# New standardized response format
{
    "success": true,
    "data": {
        # Actual response data
    },
    "meta": {
        "timestamp": "2025-08-21T12:00:00Z",
        "version": "v1",
        "cache_ttl": 300,
        "pagination": {
            "page": 1,
            "per_page": 20,
            "total": 100,
            "has_next": true
        }
    },
    "errors": null
}

# Error response format
{
    "success": false,
    "data": null,
    "meta": {
        "timestamp": "2025-08-21T12:00:00Z",
        "version": "v1"
    },
    "errors": [
        {
            "code": "VALIDATION_ERROR",
            "message": "Invalid input data",
            "field": "email",
            "detail": "Email format is invalid"
        }
    ]
}
```

### Implementation:
```python
# api/middleware.py
class StandardResponseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/api/v1/'):
            return self.standardize_response(response)
        return response

# api/serializers.py
class StandardResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = serializers.JSONField(allow_null=True)
    meta = serializers.JSONField()
    errors = serializers.ListField(allow_null=True)
```

## 2. ISR (Incremental Static Regeneration) Support

### Current Issues:
- No revalidation endpoints
- No cache invalidation strategy
- Static data not optimized for regeneration

### Solution: ISR-Compatible Endpoints

```python
# New ISR-specific endpoints
/api/v1/revalidation/
├── projects/{id}/revalidate - POST (Trigger project page regeneration)
├── users/{id}/revalidate - POST (Trigger user profile regeneration)  
├── webhooks/content-update - POST (Batch revalidation trigger)
└── cache/invalidate - POST (Manual cache invalidation)

# Cache tags for selective invalidation
CACHE_TAGS = {
    'project': ['project_list', 'project_detail'],
    'user': ['user_profile', 'project_members'],
    'feedback': ['feedback_list', 'project_feedback']
}
```

### Implementation:
```python
# api/views/revalidation.py
class RevalidationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def revalidate_project(self, request, pk=None):
        project = get_object_or_404(Project, pk=pk)
        
        # Invalidate related caches
        cache_keys = [
            f'project_{pk}',
            f'project_list_user_{project.user_id}',
            f'project_members_{pk}'
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        # Trigger Next.js revalidation
        revalidation_urls = [
            f'/projects/{pk}',
            f'/dashboard/projects',
            f'/projects/{pk}/members'
        ]
        
        # Send webhook to Next.js
        self.trigger_nextjs_revalidation(revalidation_urls)
        
        return Response({
            'success': True,
            'data': {'revalidated_urls': revalidation_urls}
        })
```

## 3. SSG (Static Site Generation) Optimization

### Current Issues:
- Large API responses not suitable for build-time generation
- No data pre-processing for static generation
- Missing build-time data validation

### Solution: SSG-Optimized Endpoints

```python
# New SSG endpoints for build-time data fetching
/api/v1/ssg/
├── projects/list - GET (Lightweight project list for static generation)
├── projects/{id}/static - GET (Static project data without dynamic content)
├── users/public-profiles - GET (Public user data for static pages)
└── metadata/site-data - GET (Global site metadata)

# Optimized serializers for static generation
class ProjectStaticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'color']
        # Exclude dynamic fields like member count, last activity
```

### Implementation:
```python
# api/views/ssg.py
class SSGViewSet(viewsets.ReadOnlyModelViewSet):
    """Optimized endpoints for Static Site Generation"""
    
    @action(detail=False, methods=['get'])
    def projects_static(self, request):
        # Cache for 24 hours (build-time data changes infrequently)
        cache_key = 'ssg_projects_list'
        cached_data = cache.get(cache_key)
        
        if not cached_data:
            projects = Project.objects.select_related('user').prefetch_related('members')
            serializer = ProjectStaticSerializer(projects, many=True)
            cached_data = serializer.data
            cache.set(cache_key, cached_data, 86400)  # 24 hours
        
        return Response({
            'success': True,
            'data': cached_data,
            'meta': {
                'cache_ttl': 86400,
                'generated_at': timezone.now(),
                'suitable_for_ssg': True
            }
        })
```

## 4. Server Components Data Fetching

### Current Issues:
- No server-side data fetching optimization
- Missing prefetch strategies
- No data deduplication

### Solution: Server Components API Pattern

```python
# Server Components optimized endpoints
/api/v1/server/
├── projects/{id}/prefetch - GET (Prefetch related data in one request)
├── dashboard/initial-data - GET (Dashboard data for server rendering)
├── users/{id}/complete-profile - GET (User data with all relations)
└── batch/multiple-resources - POST (Batch data fetching)

# Prefetch patterns for server components
class ProjectPrefetchView(APIView):
    def get(self, request, pk):
        project = Project.objects.select_related(
            'user', 'feedback', 'basic_plan', 'story_board'
        ).prefetch_related(
            'members__user', 'files', 'memos'
        ).get(pk=pk)
        
        # Single optimized query with all related data
        data = {
            'project': ProjectDetailSerializer(project).data,
            'members': [MemberSerializer(m).data for m in project.members.all()],
            'recent_activities': self.get_recent_activities(project),
            'file_count': project.files.count(),
            'memo_count': project.memos.count()
        }
        
        return Response({
            'success': True,
            'data': data,
            'meta': {
                'optimized_for': 'server_components',
                'query_count': 1,  # Single optimized query
                'cache_ttl': 300
            }
        })
```

## 5. Streaming and Progressive Enhancement

### Current Issues:
- No streaming data support
- Large file uploads block the UI
- No progressive loading patterns

### Solution: Streaming API Endpoints

```python
# Streaming endpoints for progressive enhancement
/api/v1/stream/
├── projects/{id}/activities - GET (Server-Sent Events for real-time updates)
├── files/upload/progressive - POST (Progressive file upload)
└── search/live-results - GET (Streaming search results)

# Server-Sent Events for real-time updates
class ProjectActivityStreamView(APIView):
    def get(self, request, pk):
        def event_stream():
            project = get_object_or_404(Project, pk=pk)
            
            # Send initial data
            yield f"data: {json.dumps({'type': 'initial', 'data': 'connected'})}\n\n"
            
            # Stream updates
            while True:
                activities = self.get_recent_activities(project)
                if activities:
                    yield f"data: {json.dumps({'type': 'activity', 'data': activities})}\n\n"
                time.sleep(1)
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        return response
```

## 6. Edge Runtime Compatibility

### Current Issues:
- Heavy Django views not suitable for edge runtime
- No lightweight endpoint alternatives
- Database connections not optimized for edge

### Solution: Edge-Compatible Endpoints

```python
# Lightweight endpoints for edge runtime
/api/v1/edge/
├── auth/verify-token - GET (Lightweight token verification)
├── projects/metadata - GET (Project metadata without heavy queries)
├── users/session-info - GET (Minimal user session data)
└── health/quick-check - GET (Fast health check)

class EdgeAuthView(APIView):
    """Lightweight authentication check for edge runtime"""
    
    def get(self, request):
        # Minimal token verification without database queries
        token = request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return Response({
                'success': True,
                'data': {
                    'user_id': payload.get('user_id'),
                    'exp': payload.get('exp'),
                    'valid': True
                }
            })
        except jwt.InvalidTokenError:
            return Response({
                'success': False,
                'errors': [{'code': 'INVALID_TOKEN', 'message': 'Token is invalid'}]
            }, status=401)
```

## 7. Caching Strategy for Next.js

### Cache Layers:
1. **Redis Cache**: API response caching (5-60 minutes)
2. **Database Query Cache**: Expensive queries (1-24 hours)
3. **CDN Cache**: Static assets and public data (1-7 days)
4. **Next.js Cache**: Page-level caching with revalidation

### Implementation:
```python
# Cache configuration for different data types
CACHE_STRATEGIES = {
    'user_profile': {'ttl': 300, 'tags': ['user']},
    'project_list': {'ttl': 600, 'tags': ['project', 'user']},
    'project_detail': {'ttl': 300, 'tags': ['project']},
    'feedback_thread': {'ttl': 60, 'tags': ['feedback']},
    'public_data': {'ttl': 86400, 'tags': ['static']}
}

# Cache middleware with tag-based invalidation
class TaggedCacheMiddleware:
    def process_view(self, request, view_func, view_args, view_kwargs):
        cache_config = self.get_cache_config(request.path)
        if cache_config:
            cache_key = self.generate_cache_key(request)
            cached_response = cache.get(cache_key)
            
            if cached_response:
                # Add cache headers for Next.js
                response = HttpResponse(cached_response)
                response['Cache-Control'] = f'max-age={cache_config["ttl"]}'
                response['X-Cache'] = 'HIT'
                return response
        
        return None
```

## 8. Performance Monitoring

### Metrics to Track:
- API response times by endpoint
- Cache hit ratios
- Database query counts
- Next.js build times
- ISR revalidation frequency

### Implementation:
```python
# Performance monitoring middleware
class NextJSOptimizationMiddleware:
    def process_response(self, request, response):
        if request.path.startswith('/api/v1/'):
            # Add performance headers for Next.js
            response['X-Response-Time'] = str(time.time() - request._start_time)
            response['X-Query-Count'] = str(connection.queries_count)
            response['X-Cache-Status'] = getattr(response, 'cache_status', 'MISS')
            
            # Log performance metrics
            logger.info(f"API Performance: {request.path}", extra={
                'response_time': response['X-Response-Time'],
                'query_count': response['X-Query-Count'],
                'cache_status': response['X-Cache-Status']
            })
        
        return response
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Implement standardized response format
- [ ] Add API versioning middleware
- [ ] Create base optimization classes

### Week 2: ISR/SSG Support  
- [ ] Build revalidation endpoints
- [ ] Implement cache invalidation
- [ ] Create SSG-optimized serializers

### Week 3: Server Components
- [ ] Develop prefetch endpoints
- [ ] Add batch data fetching
- [ ] Implement streaming responses

### Week 4: Edge & Performance
- [ ] Create edge-compatible endpoints
- [ ] Add comprehensive caching
- [ ] Implement performance monitoring

## Success Criteria

1. **Response Time**: <100ms for cached endpoints
2. **Cache Hit Ratio**: >90% for frequently accessed data
3. **ISR Efficiency**: <1s revalidation time
4. **SSG Build Time**: <50% of current build time
5. **Edge Compatibility**: 100% of auth endpoints work in edge runtime

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Next Review**: Implementation Phase Completion