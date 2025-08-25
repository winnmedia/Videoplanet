# CORS and Security Configuration Updates for Next.js Integration

## Current Security Issues Analysis

### Critical Security Vulnerabilities:
❌ **CSRF Protection Disabled**: `django.middleware.csrf.CsrfViewMiddleware` is commented out  
❌ **Overpermissive CORS**: `CORS_ALLOW_ALL_ORIGINS = False` but still too broad  
❌ **Mixed Security Headers**: Missing security headers for modern web standards  
❌ **No Rate Limiting**: API endpoints unprotected against abuse  
❌ **WebSocket Security**: Hardcoded origins in WebSocket validation  

### Current CORS Configuration Issues:
```python
# Current problematic configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = (
    "https://vridge.kr",
    "http://localhost:3000",
    "https://api.vridge.kr",
    "https://vlanet.net",    # Unclear if still needed
    "http://127.0.0.1",     # Missing port specification
)
```

## Modernized Security Architecture

### 1. Environment-Based CORS Configuration

#### Development vs Production Security:
```python
# security/cors.py
import os
from django.conf import settings

class CORSConfiguration:
    """Environment-aware CORS configuration"""
    
    @staticmethod
    def get_allowed_origins():
        """Get CORS origins based on environment"""
        if settings.DEBUG:
            # Development origins
            return [
                "http://localhost:3000",
                "http://localhost:3001",  # Next.js dev server alternative port
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://0.0.0.0:3000",    # Docker development
            ]
        else:
            # Production origins
            return [
                "https://vridge.kr",
                "https://www.vridge.kr",
                "https://app.vridge.kr",   # Next.js frontend domain
                "https://api.vridge.kr",   # API domain
                # Add Vercel preview URLs pattern
                "https://*.vercel.app",    # Handled by regex
            ]
    
    @staticmethod
    def get_allowed_origin_regexes():
        """Get regex patterns for dynamic origins"""
        if settings.DEBUG:
            return []
        else:
            return [
                r"^https://.*\.vercel\.app$",     # Vercel preview deployments
                r"^https://.*\.vridge\.kr$",      # Subdomains
            ]

# settings.py updates
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = CORSConfiguration.get_allowed_origins()
CORS_ALLOWED_ORIGIN_REGEXES = CORSConfiguration.get_allowed_origin_regexes()

# Restrict allowed methods for security
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET', 
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Secure headers configuration
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
    'x-user-id',              # For Next.js middleware
    'x-api-version',          # API versioning
    'x-request-id',           # Request tracing
]

# Security headers for responses
CORS_EXPOSE_HEADERS = [
    'x-ratelimit-remaining',
    'x-ratelimit-limit',
    'x-response-time',
    'x-api-version',
]
```

### 2. Progressive CSRF Protection

#### Conditional CSRF Implementation:
```python
# security/middleware.py
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import re

class ConditionalCSRFMiddleware:
    """Apply CSRF protection selectively based on endpoint and auth method"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.csrf_middleware = CsrfViewMiddleware(get_response)
        
        # API endpoints that should skip CSRF (JWT authenticated)
        self.csrf_exempt_patterns = [
            r'^/api/v1/auth/token/',
            r'^/api/v1/auth/social/',
            r'^/api/v1/projects/',
            r'^/api/v1/feedbacks/',
            r'^/api/v1/users/profile/',
        ]
        
        # Endpoints that require CSRF (cookie-based auth)
        self.csrf_required_patterns = [
            r'^/admin/',
            r'^/api/v1/auth/password-reset/',  # Sensitive operation
        ]
    
    def __call__(self, request):
        # Check if JWT authentication is being used
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        uses_jwt = auth_header.startswith('Bearer ')
        
        # Check URL patterns
        path = request.path
        
        # Skip CSRF for JWT-authenticated API calls
        if uses_jwt and any(re.match(pattern, path) for pattern in self.csrf_exempt_patterns):
            return self.get_response(request)
        
        # Require CSRF for sensitive endpoints
        if any(re.match(pattern, path) for pattern in self.csrf_required_patterns):
            return self.csrf_middleware(request)
        
        # Default behavior based on authentication method
        if uses_jwt:
            return self.get_response(request)
        else:
            return self.csrf_middleware(request)

# Update MIDDLEWARE in settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'security.middleware.ConditionalCSRFMiddleware',  # Replace CsrfViewMiddleware
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'security.middleware.SecurityHeadersMiddleware',    # New security headers
    'security.middleware.RateLimitMiddleware',          # New rate limiting
]
```

### 3. Comprehensive Security Headers

#### Security Headers Middleware:
```python
# security/middleware.py (continued)
from django.http import HttpResponse
from django.conf import settings

class SecurityHeadersMiddleware:
    """Add comprehensive security headers for modern web security"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        self.add_security_headers(response, request)
        
        return response
    
    def add_security_headers(self, response, request):
        """Add security headers based on environment and request type"""
        
        # Basic security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS for HTTPS (production only)
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Content Security Policy
        if request.path.startswith('/api/'):
            # API endpoints - restrictive CSP
            response['Content-Security-Policy'] = (
                "default-src 'none'; "
                "frame-ancestors 'none'; "
                "base-uri 'none'"
            )
        else:
            # Web pages - allow necessary resources
            csp_policy = self.get_web_csp_policy()
            response['Content-Security-Policy'] = csp_policy
        
        # Permissions Policy (formerly Feature Policy)
        response['Permissions-Policy'] = (
            'camera=(), '
            'microphone=(), '
            'geolocation=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'accelerometer=(), '
            'gyroscope=()'
        )
        
        # Cross-Origin policies for API
        if request.path.startswith('/api/'):
            response['Cross-Origin-Embedder-Policy'] = 'require-corp'
            response['Cross-Origin-Opener-Policy'] = 'same-origin'
            response['Cross-Origin-Resource-Policy'] = 'cross-origin'
    
    def get_web_csp_policy(self):
        """Get CSP policy for web pages"""
        if settings.DEBUG:
            # Development CSP - more permissive for development tools
            return (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*; "
                "img-src 'self' data: blob: https:; "
                "media-src 'self' blob: https:; "
                "connect-src 'self' ws: wss: https:; "
                "frame-ancestors 'none'"
            )
        else:
            # Production CSP - strict
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "media-src 'self' blob: https:; "
                "connect-src 'self' wss: https://api.vridge.kr; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
```

### 4. Rate Limiting Implementation

#### API Rate Limiting:
```python
# security/ratelimit.py
from django.core.cache import cache
from django.http import JsonResponse
import time
from functools import wraps

class RateLimiter:
    """Token bucket rate limiter with different limits per endpoint type"""
    
    RATE_LIMITS = {
        'auth': {'requests': 5, 'window': 60},        # 5 requests per minute
        'api_read': {'requests': 100, 'window': 60},  # 100 requests per minute  
        'api_write': {'requests': 30, 'window': 60},  # 30 requests per minute
        'file_upload': {'requests': 10, 'window': 60}, # 10 requests per minute
        'websocket': {'requests': 5, 'window': 1},    # 5 connections per second
    }
    
    @staticmethod
    def get_client_key(request):
        """Generate unique client identifier"""
        # Use authenticated user ID if available
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user_{request.user.id}"
        
        # Fall back to IP address for anonymous users
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        return f"ip_{ip}"
    
    @staticmethod
    def is_rate_limited(request, limit_type='api_read'):
        """Check if request should be rate limited"""
        client_key = RateLimiter.get_client_key(request)
        cache_key = f"ratelimit_{limit_type}_{client_key}"
        
        limit_config = RateLimiter.RATE_LIMITS.get(limit_type, RateLimiter.RATE_LIMITS['api_read'])
        max_requests = limit_config['requests']
        window_seconds = limit_config['window']
        
        # Get current request count
        current_count = cache.get(cache_key, 0)
        
        if current_count >= max_requests:
            return True, 0, max_requests
        
        # Increment counter
        if current_count == 0:
            # First request in window
            cache.set(cache_key, 1, window_seconds)
            remaining = max_requests - 1
        else:
            # Increment existing counter
            try:
                new_count = cache.get(cache_key, 0) + 1
                cache.set(cache_key, new_count, cache.ttl(cache_key))
                remaining = max_requests - new_count
            except:
                # Cache might have expired between get and set
                cache.set(cache_key, 1, window_seconds)
                remaining = max_requests - 1
        
        return False, remaining, max_requests

# security/middleware.py (continued)
class RateLimitMiddleware:
    """Apply rate limiting to API endpoints"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define endpoint patterns and their rate limit types
        self.endpoint_limits = {
            r'^/api/v1/auth/': 'auth',
            r'^/api/v1/.*/upload': 'file_upload',
            r'^/api/v1/.*': 'api_read',  # Default for API
        }
    
    def __call__(self, request):
        # Determine rate limit type for this request
        limit_type = self.get_limit_type(request)
        
        if limit_type:
            is_limited, remaining, limit = RateLimiter.is_rate_limited(request, limit_type)
            
            if is_limited:
                return JsonResponse({
                    'success': False,
                    'errors': [{
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'message': f'Rate limit exceeded. Maximum {limit} requests per minute.'
                    }]
                }, status=429)
        
        response = self.get_response(request)
        
        # Add rate limit headers
        if limit_type:
            _, remaining, limit = RateLimiter.is_rate_limited(request, limit_type)
            response['X-RateLimit-Limit'] = str(limit)
            response['X-RateLimit-Remaining'] = str(max(0, remaining))
        
        return response
    
    def get_limit_type(self, request):
        """Determine which rate limit applies to this request"""
        import re
        
        for pattern, limit_type in self.endpoint_limits.items():
            if re.match(pattern, request.path):
                # Adjust for write operations
                if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                    if limit_type == 'api_read':
                        return 'api_write'
                return limit_type
        
        return None

# Decorator for view-specific rate limiting
def rate_limit(limit_type='api_read'):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            is_limited, remaining, limit = RateLimiter.is_rate_limited(request, limit_type)
            
            if is_limited:
                return JsonResponse({
                    'success': False,
                    'errors': [{
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'message': f'Rate limit exceeded for {limit_type}. Try again later.'
                    }]
                }, status=429)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
```

### 5. WebSocket Security Updates

#### Secure WebSocket Configuration:
```python
# config/asgi.py - Updated
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.core.asgi import get_asgi_application
from feedbacks import routing
from security.websocket import SecureOriginValidator

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": SecureOriginValidator(
        AuthMiddlewareStack(
            URLRouter(routing.websocket_urlpatterns)
        )
    ),
})

# security/websocket.py
from channels.security.websocket import OriginValidator
from django.conf import settings
from urllib.parse import urlparse
import re

class SecureOriginValidator(OriginValidator):
    """Enhanced WebSocket origin validation with environment awareness"""
    
    def __init__(self, inner):
        # Don't call super().__init__() to avoid setting allowed_origins
        self.inner = inner
        self.allowed_origins = self.get_allowed_origins()
        self.allowed_origin_regexes = self.get_allowed_origin_regexes()
    
    def get_allowed_origins(self):
        """Get allowed origins based on environment"""
        if settings.DEBUG:
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000", 
                "http://0.0.0.0:3000",
            ]
        else:
            return [
                "https://vridge.kr",
                "https://www.vridge.kr",
                "https://app.vridge.kr",
            ]
    
    def get_allowed_origin_regexes(self):
        """Get regex patterns for dynamic origins"""
        if settings.DEBUG:
            return [
                r"^http://localhost:\d+$",
                r"^http://127\.0\.0\.1:\d+$",
            ]
        else:
            return [
                r"^https://.*\.vercel\.app$",
                r"^https://.*\.vridge\.kr$",
            ]
    
    def validate_origin(self, origin):
        """Validate WebSocket origin against allowed patterns"""
        if not origin:
            return False
        
        # Check exact matches
        if origin in self.allowed_origins:
            return True
        
        # Check regex patterns
        for pattern in self.allowed_origin_regexes:
            if re.match(pattern, origin):
                return True
        
        return False
    
    def __call__(self, scope, receive, send):
        if scope["type"] != "websocket":
            return self.inner(scope, receive, send)
        
        # Get origin from headers
        origin = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"origin":
                origin = header_value.decode("ascii")
                break
        
        # Validate origin
        if not self.validate_origin(origin):
            # Reject connection
            async def reject_connection(receive, send):
                await send({"type": "websocket.close", "code": 1008})
            
            return reject_connection(receive, send)
        
        return self.inner(scope, receive, send)
```

### 6. File Upload Security

#### Secure File Handling:
```python
# security/uploads.py
import magic
from django.core.exceptions import ValidationError
from django.conf import settings
import os

class SecureFileUploadValidator:
    """Validate uploaded files for security"""
    
    ALLOWED_MIME_TYPES = {
        'video': [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',  # .avi
            'video/webm',
        ],
        'image': [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ],
        'document': [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]
    }
    
    MAX_FILE_SIZES = {
        'video': 500 * 1024 * 1024,   # 500MB
        'image': 10 * 1024 * 1024,    # 10MB
        'document': 50 * 1024 * 1024, # 50MB
    }
    
    @staticmethod
    def validate_file(uploaded_file, file_type='video'):
        """Validate uploaded file for security and type"""
        
        # Check file size
        max_size = SecureFileUploadValidator.MAX_FILE_SIZES.get(file_type, 10 * 1024 * 1024)
        if uploaded_file.size > max_size:
            raise ValidationError(f'File size exceeds maximum allowed size of {max_size} bytes')
        
        # Check MIME type using python-magic
        file_mime_type = magic.from_buffer(uploaded_file.read(2048), mime=True)
        uploaded_file.seek(0)  # Reset file pointer
        
        allowed_types = SecureFileUploadValidator.ALLOWED_MIME_TYPES.get(file_type, [])
        if file_mime_type not in allowed_types:
            raise ValidationError(f'File type {file_mime_type} is not allowed')
        
        # Check file extension matches MIME type
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        expected_extensions = SecureFileUploadValidator.get_extensions_for_mime(file_mime_type)
        
        if file_extension not in expected_extensions:
            raise ValidationError(f'File extension {file_extension} does not match file type')
        
        return True
    
    @staticmethod
    def get_extensions_for_mime(mime_type):
        """Get expected file extensions for MIME type"""
        mime_to_ext = {
            'video/mp4': ['.mp4'],
            'video/mpeg': ['.mpeg', '.mpg'],
            'video/quicktime': ['.mov'],
            'video/x-msvideo': ['.avi'],
            'video/webm': ['.webm'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'application/pdf': ['.pdf'],
        }
        return mime_to_ext.get(mime_type, [])

# Apply to file upload views
from security.uploads import SecureFileUploadValidator

class SecureFileUploadView(View):
    @rate_limit('file_upload')
    def post(self, request):
        uploaded_file = request.FILES.get('file')
        
        if not uploaded_file:
            return JsonResponse({
                'success': False,
                'errors': [{'code': 'NO_FILE', 'message': 'No file provided'}]
            }, status=400)
        
        try:
            # Validate file security
            SecureFileUploadValidator.validate_file(uploaded_file, 'video')
            
            # Process file upload
            # ... existing upload logic ...
            
        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'errors': [{'code': 'INVALID_FILE', 'message': str(e)}]
            }, status=400)
```

## Updated Settings Configuration

### Complete Security Settings:
```python
# settings.py - Security section
import os
from security.cors import CORSConfiguration

# CORS Configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = CORSConfiguration.get_allowed_origins()
CORS_ALLOWED_ORIGIN_REGEXES = CORSConfiguration.get_allowed_origin_regexes()

CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
    'x-user-id', 'x-api-version', 'x-request-id',
]

CORS_EXPOSE_HEADERS = [
    'x-ratelimit-remaining', 'x-ratelimit-limit', 
    'x-response-time', 'x-api-version',
]

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

if not DEBUG:
    # Production security settings
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Session security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CSRF security
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = 'Lax'

# File Upload Security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# Rate Limiting (using Django-RateLimiter as fallback)
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# Channel Layers Security (Redis)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(os.environ.get('REDIS_HOST', '127.0.0.1'), 6379)],
            "password": os.environ.get('REDIS_PASSWORD', None),
            "ssl": not DEBUG,  # Use SSL in production
        },
    },
}
```

## Implementation Timeline

### Week 1: CORS and Basic Security
- [ ] Implement environment-based CORS configuration
- [ ] Add conditional CSRF protection
- [ ] Update security headers middleware

### Week 2: Rate Limiting and File Security
- [ ] Implement rate limiting system
- [ ] Add secure file upload validation
- [ ] Update WebSocket origin validation

### Week 3: Testing and Monitoring  
- [ ] Security testing with OWASP tools
- [ ] Rate limiting performance testing
- [ ] Security header validation

### Week 4: Documentation and Deployment
- [ ] Security configuration documentation
- [ ] Deployment security checklist
- [ ] Production security monitoring

## Security Validation Checklist

### Pre-deployment Security Audit:
- [ ] CSRF protection enabled for sensitive endpoints
- [ ] CORS properly configured for production domains
- [ ] Rate limiting active on all API endpoints
- [ ] Security headers present in all responses
- [ ] File upload validation working correctly
- [ ] WebSocket origins properly restricted
- [ ] HTTPS enforced in production
- [ ] Sensitive data not logged

## Success Metrics

1. **Security Headers**: 100% coverage on security scanning tools
2. **CORS Configuration**: Zero cross-origin policy violations in production
3. **Rate Limiting**: <0.1% false positive rate for legitimate users  
4. **File Upload Security**: Zero malicious file uploads successful
5. **WebSocket Security**: All connections from verified origins only

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: Critical - Security foundation for production deployment