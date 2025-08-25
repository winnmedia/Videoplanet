# API Versioning Strategy for Gradual Migration

## Current API Architecture Issues

### Lack of Versioning Infrastructure:
❌ **No version namespacing**: All endpoints at root level without versioning  
❌ **Breaking changes possible**: No protection against API changes  
❌ **No deprecation strategy**: No way to sunset old endpoints safely  
❌ **Frontend coupling**: Direct dependency on current API structure  
❌ **No backward compatibility**: Changes affect all consumers immediately  

### Current Endpoint Structure Problems:
```
Current Structure (No Versioning):
/users/login
/projects/project_list  
/feedbacks/{id}

Issues:
- Any change potentially breaks frontend
- No way to introduce new features safely
- No migration path for breaking changes
- No API contract guarantees
```

## Comprehensive API Versioning Strategy

### 1. Multi-Strategy Versioning Approach

#### Versioning Methods Supported:
1. **URL Path Versioning** (Primary): `/api/v1/`, `/api/v2/`
2. **Header Versioning** (Secondary): `Accept: application/vnd.videoplanet.v1+json`
3. **Query Parameter Versioning** (Fallback): `?version=v1`

#### Implementation Architecture:
```python
# versioning/middleware.py
import re
from django.http import JsonResponse
from django.conf import settings

class APIVersioningMiddleware:
    """Handle API versioning across multiple strategies"""
    
    SUPPORTED_VERSIONS = ['v1', 'v2']  # Will expand as needed
    DEFAULT_VERSION = 'v1'
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip non-API requests
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Determine API version
        api_version = self.extract_api_version(request)
        
        # Validate version
        if api_version not in self.SUPPORTED_VERSIONS:
            return JsonResponse({
                'success': False,
                'errors': [{
                    'code': 'UNSUPPORTED_API_VERSION',
                    'message': f'API version {api_version} is not supported',
                    'supported_versions': self.SUPPORTED_VERSIONS
                }]
            }, status=400)
        
        # Add version to request for use in views
        request.api_version = api_version
        
        # Rewrite URL for internal routing
        if not request.path.startswith(f'/api/{api_version}/'):
            request.path_info = f'/api/{api_version}{request.path_info[4:]}'
        
        response = self.get_response(request)
        
        # Add version info to response headers
        response['X-API-Version'] = api_version
        response['X-Supported-Versions'] = ','.join(self.SUPPORTED_VERSIONS)
        
        return response
    
    def extract_api_version(self, request):
        """Extract API version from request using multiple strategies"""
        
        # Strategy 1: URL Path versioning (primary)
        path_version = self.extract_version_from_path(request.path)
        if path_version:
            return path_version
        
        # Strategy 2: Header versioning
        accept_header = request.META.get('HTTP_ACCEPT', '')
        header_version = self.extract_version_from_header(accept_header)
        if header_version:
            return header_version
        
        # Strategy 3: Query parameter versioning
        query_version = request.GET.get('version', '').replace('v', '')
        if query_version and f'v{query_version}' in self.SUPPORTED_VERSIONS:
            return f'v{query_version}'
        
        # Default version
        return self.DEFAULT_VERSION
    
    def extract_version_from_path(self, path):
        """Extract version from URL path"""
        match = re.match(r'^/api/(v\d+)/', path)
        return match.group(1) if match else None
    
    def extract_version_from_header(self, accept_header):
        """Extract version from Accept header"""
        # Format: application/vnd.videoplanet.v1+json
        match = re.search(r'application/vnd\.videoplanet\.(v\d+)', accept_header)
        return match.group(1) if match else None

# versioning/decorators.py
from functools import wraps
from django.http import JsonResponse

def api_version(supported_versions):
    """Decorator to specify which versions support this endpoint"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            request_version = getattr(request, 'api_version', 'v1')
            
            if request_version not in supported_versions:
                return JsonResponse({
                    'success': False,
                    'errors': [{
                        'code': 'VERSION_NOT_SUPPORTED',
                        'message': f'This endpoint does not support version {request_version}',
                        'supported_versions': supported_versions
                    }]
                }, status=400)
            
            return view_func(request, *args, **kwargs)
        
        wrapper.supported_versions = supported_versions
        return wrapper
    return decorator

def deprecated_version(version, deprecation_date, replacement_info=None):
    """Decorator to mark API version as deprecated"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            request_version = getattr(request, 'api_version', 'v1')
            
            if request_version == version:
                response = view_func(request, *args, **kwargs)
                
                # Add deprecation warnings to response
                response['X-API-Deprecated'] = 'true'
                response['X-API-Deprecation-Date'] = deprecation_date
                response['X-API-Sunset-Date'] = deprecation_date  # Same for now
                
                if replacement_info:
                    response['X-API-Replacement'] = replacement_info
                
                # Add deprecation warning to response body if JSON
                if hasattr(response, 'data') and isinstance(response.data, dict):
                    response.data['deprecation_warning'] = {
                        'message': f'API version {version} is deprecated',
                        'deprecation_date': deprecation_date,
                        'replacement': replacement_info
                    }
                
                return response
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
```

### 2. Version-Specific URL Configuration

#### Versioned URL Structure:
```python
# config/urls.py - Updated with versioning
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# API v1 URLs (current/legacy)
api_v1_patterns = [
    path("users/", include("users.urls_v1")),
    path("projects/", include("projects.urls_v1")),
    path("feedbacks/", include("feedbacks.urls_v1")),
    path("onlines/", include("onlines.urls_v1")),
    path("health/", include("health.urls")),
]

# API v2 URLs (new/modernized)
api_v2_patterns = [
    path("auth/", include("users.urls_v2")),           # Renamed from users
    path("projects/", include("projects.urls_v2")),     # Enhanced project management
    path("feedback/", include("feedbacks.urls_v2")),    # Renamed from feedbacks
    path("presence/", include("onlines.urls_v2")),      # Renamed from onlines
    path("health/", include("health.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Versioned API endpoints
    path("api/v1/", include(api_v1_patterns)),
    path("api/v2/", include(api_v2_patterns)),
    
    # Legacy endpoints (redirect to v1 with deprecation warning)
    path("users/", include("legacy.redirects")),
    path("projects/", include("legacy.redirects")),
    path("feedbacks/", include("legacy.redirects")),
    path("onlines/", include("legacy.redirects")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# legacy/redirects.py
from django.http import JsonResponse
from django.views import View
from django.urls import path
import logging

logger = logging.getLogger(__name__)

class LegacyRedirectView(View):
    """Handle legacy endpoint redirects with deprecation warnings"""
    
    def dispatch(self, request, *args, **kwargs):
        # Log legacy usage
        logger.warning(f"Legacy API endpoint accessed: {request.path}", extra={
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': request.META.get('REMOTE_ADDR', ''),
            'referer': request.META.get('HTTP_REFERER', '')
        })
        
        # Return deprecation response
        return JsonResponse({
            'success': False,
            'errors': [{
                'code': 'LEGACY_ENDPOINT_DEPRECATED',
                'message': 'This endpoint has been deprecated. Please use the versioned API.',
                'migration_guide': 'https://docs.videoplanet.com/api/migration',
                'new_endpoint': f'/api/v1{request.path}',
            }]
        }, status=410)  # HTTP 410 Gone

# Legacy redirect URLs
urlpatterns = [
    path('<path:path>', LegacyRedirectView.as_view(), name='legacy_redirect'),
]
```

### 3. Version-Specific View Implementation

#### Backward Compatible View Architecture:
```python
# versioning/base_views.py
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from versioning.decorators import api_version, deprecated_version

class VersionedAPIView(APIView):
    """Base class for versioned API views"""
    
    def dispatch(self, request, *args, **kwargs):
        # Add version-specific behavior
        version = getattr(request, 'api_version', 'v1')
        
        # Check if view supports this version
        if hasattr(self, 'supported_versions') and version not in self.supported_versions:
            return Response({
                'success': False,
                'errors': [{
                    'code': 'VERSION_NOT_SUPPORTED',
                    'message': f'This endpoint does not support version {version}'
                }]
            }, status=400)
        
        return super().dispatch(request, *args, **kwargs)
    
    def get_serializer_class(self):
        """Get version-specific serializer"""
        version = getattr(self.request, 'api_version', 'v1')
        
        # Try version-specific serializer first
        version_serializer = getattr(self, f'serializer_class_{version}', None)
        if version_serializer:
            return version_serializer
        
        # Fall back to default
        return getattr(self, 'serializer_class', None)
    
    def get_response_format(self, data):
        """Format response based on API version"""
        version = getattr(self.request, 'api_version', 'v1')
        
        if version == 'v1':
            # Legacy format
            return data
        elif version == 'v2':
            # Standardized format
            return {
                'success': True,
                'data': data,
                'meta': {
                    'timestamp': timezone.now().isoformat(),
                    'version': version
                }
            }
        
        return data

# Example: Versioned Project List Views
# projects/views_v1.py (Legacy)
from versioning.base_views import VersionedAPIView
from versioning.decorators import api_version, deprecated_version

class ProjectListV1(VersionedAPIView):
    supported_versions = ['v1']
    
    @api_version(['v1'])
    @deprecated_version('v1', '2025-12-31', '/api/v2/projects/')
    def get(self, request):
        # Legacy implementation (current code)
        try:
            user = request.user
            project_list = user.projects.all().select_related(
                "basic_plan", "story_board", "filming", "video_edit",
                "post_work", "video_preview", "confirmation", "video_delivery",
            )
            
            result = []
            for project in project_list:
                # ... existing logic ...
                pass
            
            return JsonResponse({"result": result}, status=200)
            
        except Exception as e:
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)

# projects/views_v2.py (Modernized)
class ProjectListV2(VersionedAPIView):
    supported_versions = ['v2']
    
    @api_version(['v2'])
    def get(self, request):
        # Modern implementation with optimizations
        try:
            user = request.user
            
            # Use optimized queries
            projects = Project.objects.for_user(user).with_timeline_data()
            
            # Use standardized response format
            result_data = []
            for project in projects:
                result_data.append({
                    'id': project.id,
                    'name': project.name,
                    'manager': project.manager,
                    'consumer': project.consumer,
                    'description': project.description,
                    'color': project.color,
                    'timeline': {
                        'start_date': project.earliest_start_date,
                        'end_date': project.latest_end_date,
                    },
                    'member_count': project.member_count,
                    'created_at': project.created.isoformat(),
                    'updated_at': project.updated.isoformat(),
                })
            
            return Response(self.get_response_format(result_data))
            
        except Exception as e:
            return Response({
                'success': False,
                'errors': [{
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'An internal server error occurred'
                }]
            }, status=500)

# projects/urls_v1.py
from django.urls import path
from .views_v1 import ProjectListV1

app_name = "projects_v1"

urlpatterns = [
    path("project_list", ProjectListV1.as_view(), name="project_list"),
    # ... other v1 endpoints
]

# projects/urls_v2.py  
from django.urls import path
from .views_v2 import ProjectListV2

app_name = "projects_v2"

urlpatterns = [
    path("", ProjectListV2.as_view(), name="project_list"),  # Cleaner URL structure
    # ... other v2 endpoints
]
```

### 4. Version-Specific Serializers

#### Serializer Evolution Strategy:
```python
# projects/serializers.py
from rest_framework import serializers
from .models import Project

# V1 Serializers (Legacy format)
class ProjectSerializerV1(serializers.ModelSerializer):
    """Legacy project serializer for backward compatibility"""
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'manager', 'consumer', 'description', 'color']
    
    def to_representation(self, instance):
        """Custom representation for v1 compatibility"""
        data = super().to_representation(instance)
        
        # Add legacy timeline format
        data.update({
            'basic_plan': {
                'start_date': instance.basic_plan.start_date if instance.basic_plan else None,
                'end_date': instance.basic_plan.end_date if instance.basic_plan else None,
            },
            # ... other legacy fields
        })
        
        return data

# V2 Serializers (Modern format)
class ProjectSerializerV2(serializers.ModelSerializer):
    """Modern project serializer with enhanced features"""
    
    timeline = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True)
    owner = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'manager', 'consumer', 'description', 'color',
            'timeline', 'member_count', 'owner', 'created_at', 'updated_at'
        ]
    
    def get_timeline(self, instance):
        """Get optimized timeline data"""
        return {
            'start_date': getattr(instance, 'earliest_start_date', None),
            'end_date': getattr(instance, 'latest_end_date', None),
            'phases': [
                {
                    'name': 'basic_plan',
                    'start_date': instance.basic_plan.start_date if instance.basic_plan else None,
                    'end_date': instance.basic_plan.end_date if instance.basic_plan else None,
                },
                # ... other phases
            ]
        }
    
    def get_owner(self, instance):
        """Get project owner information"""
        return {
            'id': instance.user.id,
            'username': instance.user.username,
            'nickname': instance.user.nickname,
        }

# Authentication Serializers Evolution
# users/serializers.py

class TokenObtainPairSerializerV1(serializers.Serializer):
    """Legacy token format for v1"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        # Legacy validation and response format
        # ... existing logic
        return {
            'vridge_session': token,  # Legacy field name
            'user': user.username,
        }

class TokenObtainPairSerializerV2(serializers.Serializer):
    """Modern token format for v2"""
    email = serializers.EmailField()  # Renamed from username
    password = serializers.CharField()
    
    def validate(self, attrs):
        # Modern validation and response format
        # ... validation logic
        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'token_type': 'Bearer',
            'expires_in': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            'user': {
                'id': user.id,
                'email': user.username,
                'nickname': user.nickname,
                'login_method': user.login_method
            }
        }
```

### 5. Migration Strategy and Timeline

#### Phase 1: Infrastructure Setup (Week 1)
```python
# Migration checklist for Phase 1
PHASE_1_TASKS = [
    "✓ Implement versioning middleware",
    "✓ Create version-specific URL routing", 
    "✓ Set up legacy redirect system",
    "✓ Add versioning decorators and base classes",
    "✓ Configure v1 endpoints (current functionality)",
]

# Keep existing functionality intact
# All current endpoints work under /api/v1/ prefix
# Legacy endpoints redirect with deprecation warnings
```

#### Phase 2: V2 API Development (Weeks 2-3)
```python
PHASE_2_TASKS = [
    "□ Implement v2 authentication endpoints",
    "□ Create v2 project management endpoints",
    "□ Build v2 feedback system endpoints", 
    "□ Add v2 user presence endpoints",
    "□ Implement v2 response format standardization",
]

# V2 API Improvements:
# - Standardized response format
# - Better error handling
# - Optimized database queries
# - Enhanced security
# - Next.js compatibility features
```

#### Phase 3: Frontend Migration Support (Week 4)
```python
PHASE_3_TASKS = [
    "□ Create API version detection for Next.js",
    "□ Build migration utilities for frontend",
    "□ Add version-specific client libraries",
    "□ Implement gradual rollout features",
    "□ Create comprehensive migration documentation",
]

# Frontend Migration Tools:
class APIClient:
    def __init__(self, version='v2'):
        self.version = version
        self.base_url = f'/api/{version}/'
    
    def request(self, method, endpoint, **kwargs):
        # Automatic version handling
        headers = kwargs.get('headers', {})
        headers['Accept'] = f'application/vnd.videoplanet.{self.version}+json'
        kwargs['headers'] = headers
        
        return requests.request(method, self.base_url + endpoint, **kwargs)
```

### 6. Version Lifecycle Management

#### Deprecation and Sunset Strategy:
```python
# versioning/lifecycle.py
from datetime import datetime, timedelta
from django.conf import settings

class APIVersionLifecycle:
    """Manage API version lifecycle"""
    
    VERSION_LIFECYCLE = {
        'v1': {
            'status': 'deprecated',
            'introduced': '2024-01-01',
            'deprecated': '2025-08-21',
            'sunset': '2026-02-21',  # 6 months deprecation period
            'replacement': 'v2'
        },
        'v2': {
            'status': 'current',
            'introduced': '2025-08-21',
            'deprecated': None,
            'sunset': None,
            'replacement': None
        }
    }
    
    @classmethod
    def get_version_info(cls, version):
        """Get lifecycle information for a version"""
        return cls.VERSION_LIFECYCLE.get(version, {})
    
    @classmethod
    def is_version_supported(cls, version):
        """Check if version is still supported"""
        version_info = cls.get_version_info(version)
        if not version_info:
            return False
        
        sunset_date = version_info.get('sunset')
        if sunset_date and datetime.now().strftime('%Y-%m-%d') > sunset_date:
            return False
        
        return True
    
    @classmethod
    def get_deprecation_warnings(cls, version):
        """Get deprecation warnings for a version"""
        version_info = cls.get_version_info(version)
        if version_info.get('status') != 'deprecated':
            return None
        
        return {
            'deprecated': True,
            'deprecation_date': version_info.get('deprecated'),
            'sunset_date': version_info.get('sunset'),
            'replacement_version': version_info.get('replacement'),
            'migration_guide': f'https://docs.videoplanet.com/api/migration/{version}-to-{version_info.get("replacement")}'
        }

# Integration with views
class VersionLifecycleMiddleware:
    """Add version lifecycle information to responses"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        if hasattr(request, 'api_version'):
            version = request.api_version
            
            # Add lifecycle headers
            version_info = APIVersionLifecycle.get_version_info(version)
            if version_info:
                response['X-API-Status'] = version_info.get('status', 'unknown')
                
                deprecation_info = APIVersionLifecycle.get_deprecation_warnings(version)
                if deprecation_info:
                    response['X-API-Deprecated'] = 'true'
                    response['X-API-Sunset-Date'] = deprecation_info['sunset_date']
                    response['X-API-Replacement'] = deprecation_info['replacement_version']
        
        return response
```

### 7. API Documentation Generation

#### Version-Specific OpenAPI Documentation:
```python
# docs/generators.py
from rest_framework.schemas.openapi import AutoSchema
from rest_framework_simplejwt.schemas import TokenObtainPairView

class VersionedOpenAPIGenerator:
    """Generate version-specific OpenAPI documentation"""
    
    def generate_schema(self, version='v2'):
        """Generate OpenAPI schema for specific version"""
        
        schema = {
            "openapi": "3.0.2",
            "info": {
                "title": f"VideoplaNet API {version.upper()}",
                "version": version,
                "description": f"VideoplaNet API {version.upper()} Documentation",
                "contact": {
                    "name": "VideoplaNet API Support",
                    "email": "api-support@videoplanet.com"
                }
            },
            "servers": [
                {
                    "url": f"https://api.vridge.kr/api/{version}/",
                    "description": "Production server"
                },
                {
                    "url": f"http://localhost:8000/api/{version}/",
                    "description": "Development server"
                }
            ],
            "paths": {},
            "components": {
                "securitySchemes": {
                    "BearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                }
            }
        }
        
        # Add version-specific paths
        if version == 'v1':
            schema["paths"].update(self.get_v1_paths())
        elif version == 'v2':
            schema["paths"].update(self.get_v2_paths())
        
        return schema
    
    def get_v1_paths(self):
        """Get V1 API paths with deprecation notices"""
        return {
            "/users/login": {
                "post": {
                    "summary": "User Login (Deprecated)",
                    "deprecated": True,
                    "description": "This endpoint is deprecated. Use /api/v2/auth/token/ instead.",
                    "tags": ["Authentication (V1)"],
                    # ... rest of specification
                }
            },
            # ... other v1 paths
        }
    
    def get_v2_paths(self):
        """Get V2 API paths"""
        return {
            "/auth/token/": {
                "post": {
                    "summary": "Obtain JWT Token Pair",
                    "description": "Get access and refresh tokens for authentication.",
                    "tags": ["Authentication"],
                    # ... rest of specification
                }
            },
            # ... other v2 paths
        }

# docs/views.py
from django.http import JsonResponse
from django.views import View

class OpenAPISchemaView(View):
    """Serve version-specific OpenAPI schemas"""
    
    def get(self, request, version='v2'):
        generator = VersionedOpenAPIGenerator()
        
        if version not in ['v1', 'v2']:
            return JsonResponse({'error': 'Unsupported API version'}, status=400)
        
        schema = generator.generate_schema(version)
        return JsonResponse(schema)

# docs/urls.py
from django.urls import path
from .views import OpenAPISchemaView

urlpatterns = [
    path('schema/<str:version>/', OpenAPISchemaView.as_view(), name='openapi-schema'),
    path('schema/', OpenAPISchemaView.as_view(), {'version': 'v2'}, name='openapi-schema-default'),
]
```

## Implementation Timeline

### Week 1: Versioning Infrastructure
- [x] Implement versioning middleware and routing
- [x] Create legacy redirect system  
- [x] Set up v1 endpoints (current functionality)
- [ ] Add versioning decorators and base classes

### Week 2: V2 API Development
- [ ] Implement v2 authentication endpoints
- [ ] Create v2 project management endpoints
- [ ] Build v2 feedback system endpoints
- [ ] Standardize v2 response formats

### Week 3: Migration Support
- [ ] Create migration utilities
- [ ] Build version-specific documentation
- [ ] Implement gradual rollout features
- [ ] Add comprehensive testing

### Week 4: Documentation and Deployment
- [ ] Generate OpenAPI documentation
- [ ] Create migration guides
- [ ] Set up monitoring for version usage
- [ ] Deploy versioned API system

## Success Metrics

1. **Zero Breaking Changes**: No disruption to existing frontend during migration
2. **Version Adoption Rate**: >80% of traffic moved to v2 within 3 months
3. **API Response Consistency**: 100% standardized responses in v2
4. **Documentation Coverage**: Complete OpenAPI specs for all versions
5. **Deprecation Timeline**: v1 sunset completed within 6 months

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: Critical - Foundation for safe API evolution and Next.js migration