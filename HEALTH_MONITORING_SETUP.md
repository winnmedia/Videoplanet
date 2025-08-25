# Health Check Endpoints and Monitoring Setup

## Current Monitoring Gaps

### Missing Health Checks:
❌ **No health check endpoints**: Cannot verify service status  
❌ **No dependency health checks**: Database, Redis, S3 status unknown  
❌ **No performance monitoring**: Response times not tracked  
❌ **No error tracking**: Errors not systematically monitored  
❌ **No deployment validation**: No automated post-deployment checks  

### Current Monitoring Issues:
- Sentry only enabled in production
- No systematic logging structure
- No real-time performance metrics
- No dependency status visibility
- No automated alerting system

## Comprehensive Health Check Architecture

### 1. Multi-Level Health Check System

#### Health Check Endpoint Structure:
```
/api/v1/health/
├── status/ - GET (Basic service status)
├── detailed/ - GET (Detailed health with dependencies)  
├── ready/ - GET (Kubernetes readiness probe)
├── live/ - GET (Kubernetes liveness probe)
├── dependencies/ - GET (External service status)
└── metrics/ - GET (Performance metrics summary)
```

#### Implementation:
```python
# health/checks.py
import time
import redis
import boto3
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)

class HealthCheckStatus:
    """Health check status constants"""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"

class BaseHealthCheck:
    """Base class for health checks"""
    
    def __init__(self, name, critical=True):
        self.name = name
        self.critical = critical
    
    def check(self):
        """Override this method in subclasses"""
        raise NotImplementedError
    
    def run_check(self):
        """Run the health check with timing and error handling"""
        start_time = time.time()
        
        try:
            result = self.check()
            execution_time = time.time() - start_time
            
            return {
                'name': self.name,
                'status': result.get('status', HealthCheckStatus.HEALTHY),
                'message': result.get('message', 'OK'),
                'execution_time': round(execution_time, 3),
                'critical': self.critical,
                'details': result.get('details', {})
            }
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Health check {self.name} failed: {e}")
            
            return {
                'name': self.name,
                'status': HealthCheckStatus.UNHEALTHY,
                'message': str(e),
                'execution_time': round(execution_time, 3),
                'critical': self.critical,
                'details': {'error': str(e)}
            }

class DatabaseHealthCheck(BaseHealthCheck):
    """Check database connectivity and performance"""
    
    def check(self):
        # Test basic connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        if result[0] != 1:
            return {
                'status': HealthCheckStatus.UNHEALTHY,
                'message': 'Database query returned unexpected result'
            }
        
        # Test connection pool
        from django.db import connections
        db_conn = connections['default']
        
        details = {
            'database': settings.DATABASES['default']['NAME'],
            'host': settings.DATABASES['default'].get('HOST', 'localhost'),
            'port': settings.DATABASES['default'].get('PORT', '5432'),
            'connection_pool_size': getattr(db_conn, 'queries_count', 0)
        }
        
        return {
            'status': HealthCheckStatus.HEALTHY,
            'message': 'Database connectivity OK',
            'details': details
        }

class RedisHealthCheck(BaseHealthCheck):
    """Check Redis connectivity and performance"""
    
    def check(self):
        try:
            # Test basic Redis operations
            cache.set('health_check_test', 'ok', timeout=10)
            result = cache.get('health_check_test')
            cache.delete('health_check_test')
            
            if result != 'ok':
                return {
                    'status': HealthCheckStatus.UNHEALTHY,
                    'message': 'Redis cache operation failed'
                }
            
            # Get Redis info
            redis_client = redis.Redis.from_url(settings.CACHES['default']['LOCATION'])
            redis_info = redis_client.info()
            
            # Check memory usage
            used_memory_mb = redis_info.get('used_memory', 0) / 1024 / 1024
            max_memory_mb = redis_info.get('maxmemory', 0) / 1024 / 1024
            
            memory_usage_percent = (used_memory_mb / max_memory_mb * 100) if max_memory_mb > 0 else 0
            
            status = HealthCheckStatus.HEALTHY
            message = 'Redis connectivity OK'
            
            # Check for degraded performance
            if memory_usage_percent > 80:
                status = HealthCheckStatus.DEGRADED
                message = f'Redis memory usage high: {memory_usage_percent:.1f}%'
            
            details = {
                'used_memory_mb': round(used_memory_mb, 2),
                'max_memory_mb': round(max_memory_mb, 2),
                'memory_usage_percent': round(memory_usage_percent, 1),
                'connected_clients': redis_info.get('connected_clients', 0),
                'redis_version': redis_info.get('redis_version', 'unknown')
            }
            
            return {
                'status': status,
                'message': message,
                'details': details
            }
            
        except Exception as e:
            return {
                'status': HealthCheckStatus.UNHEALTHY,
                'message': f'Redis health check failed: {str(e)}'
            }

class S3HealthCheck(BaseHealthCheck):
    """Check S3/AWS storage connectivity"""
    
    def __init__(self, name="s3", critical=False):
        super().__init__(name, critical)
    
    def check(self):
        if settings.DEBUG:
            return {
                'status': HealthCheckStatus.HEALTHY,
                'message': 'S3 check skipped in development',
                'details': {'environment': 'development'}
            }
        
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            
            # Test bucket access
            response = s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            
            # Test object listing (limited)
            objects = s3_client.list_objects_v2(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                MaxKeys=1
            )
            
            details = {
                'bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'region': s3_client.meta.region_name,
                'object_count_sample': objects.get('KeyCount', 0)
            }
            
            return {
                'status': HealthCheckStatus.HEALTHY,
                'message': 'S3 connectivity OK',
                'details': details
            }
            
        except Exception as e:
            return {
                'status': HealthCheckStatus.DEGRADED,
                'message': f'S3 connectivity issue: {str(e)}'
            }

class WebSocketHealthCheck(BaseHealthCheck):
    """Check WebSocket/Channels functionality"""
    
    def check(self):
        try:
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            # Test channel layer connectivity
            if channel_layer is None:
                return {
                    'status': HealthCheckStatus.UNHEALTHY,
                    'message': 'Channel layer not configured'
                }
            
            # For Redis channel layer, test Redis connectivity
            if hasattr(channel_layer, 'hosts'):
                redis_host = channel_layer.hosts[0][0]
                redis_port = channel_layer.hosts[0][1]
                
                details = {
                    'backend': str(type(channel_layer).__name__),
                    'redis_host': redis_host,
                    'redis_port': redis_port
                }
            else:
                details = {
                    'backend': str(type(channel_layer).__name__)
                }
            
            return {
                'status': HealthCheckStatus.HEALTHY,
                'message': 'WebSocket layer OK',
                'details': details
            }
            
        except Exception as e:
            return {
                'status': HealthCheckStatus.DEGRADED,
                'message': f'WebSocket check failed: {str(e)}'
            }

class ApplicationHealthCheck(BaseHealthCheck):
    """Check application-specific health metrics"""
    
    def check(self):
        from django.contrib.auth import get_user_model
        from projects.models import Project
        from feedbacks.models import FeedBack
        
        User = get_user_model()
        
        try:
            # Basic application metrics
            user_count = User.objects.count()
            project_count = Project.objects.count()
            feedback_count = FeedBack.objects.count()
            
            # Check for basic data integrity
            users_with_projects = User.objects.filter(projects__isnull=False).distinct().count()
            projects_with_feedback = Project.objects.filter(feedback__isnull=False).count()
            
            details = {
                'total_users': user_count,
                'total_projects': project_count,
                'total_feedbacks': feedback_count,
                'users_with_projects': users_with_projects,
                'projects_with_feedback': projects_with_feedback,
                'app_version': getattr(settings, 'APP_VERSION', '1.0.0')
            }
            
            return {
                'status': HealthCheckStatus.HEALTHY,
                'message': 'Application metrics OK',
                'details': details
            }
            
        except Exception as e:
            return {
                'status': HealthCheckStatus.UNHEALTHY,
                'message': f'Application check failed: {str(e)}'
            }
```

#### Health Check Views:
```python
# health/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from django.views import View
import time

class HealthCheckManager:
    """Manage and execute health checks"""
    
    def __init__(self):
        self.checks = [
            DatabaseHealthCheck("database", critical=True),
            RedisHealthCheck("redis", critical=True),
            S3HealthCheck("s3", critical=False),
            WebSocketHealthCheck("websocket", critical=False),
            ApplicationHealthCheck("application", critical=True),
        ]
    
    def run_all_checks(self):
        """Run all health checks and return results"""
        results = []
        overall_status = HealthCheckStatus.HEALTHY
        total_time = 0
        
        for check in self.checks:
            result = check.run_check()
            results.append(result)
            total_time += result['execution_time']
            
            # Determine overall status
            if result['status'] == HealthCheckStatus.UNHEALTHY and result['critical']:
                overall_status = HealthCheckStatus.UNHEALTHY
            elif result['status'] == HealthCheckStatus.DEGRADED and overall_status == HealthCheckStatus.HEALTHY:
                overall_status = HealthCheckStatus.DEGRADED
        
        return {
            'overall_status': overall_status,
            'total_execution_time': round(total_time, 3),
            'checks': results,
            'timestamp': time.time()
        }
    
    def run_critical_checks(self):
        """Run only critical health checks for readiness probe"""
        critical_results = []
        overall_status = HealthCheckStatus.HEALTHY
        
        for check in self.checks:
            if check.critical:
                result = check.run_check()
                critical_results.append(result)
                
                if result['status'] == HealthCheckStatus.UNHEALTHY:
                    overall_status = HealthCheckStatus.UNHEALTHY
        
        return {
            'overall_status': overall_status,
            'checks': critical_results,
            'timestamp': time.time()
        }

class BasicHealthView(APIView):
    """Basic health check endpoint"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'message': 'Service is running',
            'timestamp': time.time()
        })

class DetailedHealthView(APIView):
    """Detailed health check with all dependencies"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        health_manager = HealthCheckManager()
        results = health_manager.run_all_checks()
        
        status_code = 200
        if results['overall_status'] == HealthCheckStatus.UNHEALTHY:
            status_code = 503  # Service Unavailable
        elif results['overall_status'] == HealthCheckStatus.DEGRADED:
            status_code = 206  # Partial Content
        
        return Response(results, status=status_code)

class ReadinessProbeView(APIView):
    """Kubernetes readiness probe endpoint"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        health_manager = HealthCheckManager()
        results = health_manager.run_critical_checks()
        
        if results['overall_status'] == HealthCheckStatus.UNHEALTHY:
            return Response(results, status=503)
        
        return Response(results)

class LivenessProbeView(APIView):
    """Kubernetes liveness probe endpoint"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Simple check that the application can respond
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return Response({
                'status': 'alive',
                'timestamp': time.time()
            })
        except Exception as e:
            return Response({
                'status': 'dead',
                'error': str(e),
                'timestamp': time.time()
            }, status=503)

class MetricsView(APIView):
    """Performance metrics endpoint"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from django.core.cache import cache
        from django.db import connection
        
        # Get cached metrics or compute
        metrics = cache.get('health_metrics')
        if not metrics:
            metrics = self.compute_metrics()
            cache.set('health_metrics', metrics, 300)  # Cache for 5 minutes
        
        return Response(metrics)
    
    def compute_metrics(self):
        """Compute application metrics"""
        from django.contrib.auth import get_user_model
        from projects.models import Project
        from feedbacks.models import FeedBack
        import psutil
        import os
        
        User = get_user_model()
        
        # Application metrics
        app_metrics = {
            'users_total': User.objects.count(),
            'projects_total': Project.objects.count(),
            'feedbacks_total': FeedBack.objects.count(),
            'active_users_24h': User.objects.filter(
                last_login__gte=timezone.now() - timedelta(hours=24)
            ).count() if hasattr(User, 'last_login') else 0,
        }
        
        # System metrics (if available)
        system_metrics = {}
        try:
            process = psutil.Process(os.getpid())
            system_metrics = {
                'cpu_percent': process.cpu_percent(),
                'memory_mb': process.memory_info().rss / 1024 / 1024,
                'open_files': len(process.open_files()),
            }
        except:
            system_metrics = {'available': False}
        
        # Database metrics
        db_metrics = {
            'connection_queries': connection.queries_log.count() if hasattr(connection, 'queries_log') else 0,
        }
        
        return {
            'application': app_metrics,
            'system': system_metrics,
            'database': db_metrics,
            'timestamp': time.time()
        }
```

### 2. Monitoring and Alerting System

#### Performance Monitoring Middleware:
```python
# monitoring/middleware.py
import time
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger('performance')

class PerformanceMonitoringMiddleware:
    """Monitor API performance and log metrics"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        
        # Add request ID for tracing
        request.request_id = self.generate_request_id()
        
        response = self.get_response(request)
        
        # Calculate performance metrics
        end_time = time.time()
        response_time = end_time - start_time
        
        # Log performance data
        self.log_performance_metrics(request, response, response_time)
        
        # Add performance headers
        response['X-Response-Time'] = f"{response_time:.3f}"
        response['X-Request-ID'] = request.request_id
        
        return response
    
    def generate_request_id(self):
        """Generate unique request ID for tracing"""
        import uuid
        return str(uuid.uuid4())[:8]
    
    def log_performance_metrics(self, request, response, response_time):
        """Log detailed performance metrics"""
        
        # Skip logging for static files and health checks
        if (request.path.startswith('/static/') or 
            request.path.startswith('/media/') or
            request.path.startswith('/api/v1/health/')):
            return
        
        # Performance data
        perf_data = {
            'request_id': request.request_id,
            'method': request.method,
            'path': request.path,
            'response_time': response_time,
            'status_code': response.status_code,
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:100],
            'remote_ip': self.get_client_ip(request),
        }
        
        # Log based on performance thresholds
        if response_time > 2.0:
            logger.error("Slow request", extra=perf_data)
        elif response_time > 1.0:
            logger.warning("Moderate request", extra=perf_data)
        else:
            logger.info("Fast request", extra=perf_data)
        
        # Store metrics in cache for aggregation
        self.store_metrics(perf_data)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def store_metrics(self, perf_data):
        """Store metrics for aggregation"""
        # Store in Redis for real-time metrics
        cache_key = f"metrics_{int(time.time() // 60)}"  # Per-minute buckets
        
        current_metrics = cache.get(cache_key, {
            'request_count': 0,
            'total_response_time': 0,
            'slow_requests': 0,
            'error_requests': 0
        })
        
        current_metrics['request_count'] += 1
        current_metrics['total_response_time'] += perf_data['response_time']
        
        if perf_data['response_time'] > 1.0:
            current_metrics['slow_requests'] += 1
        
        if perf_data['status_code'] >= 400:
            current_metrics['error_requests'] += 1
        
        cache.set(cache_key, current_metrics, 3600)  # Store for 1 hour

class ErrorTrackingMiddleware:
    """Track and log application errors"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Track error responses
        if response.status_code >= 400:
            self.log_error_response(request, response)
        
        return response
    
    def process_exception(self, request, exception):
        """Log unhandled exceptions"""
        error_data = {
            'request_id': getattr(request, 'request_id', 'unknown'),
            'method': request.method,
            'path': request.path,
            'exception_type': type(exception).__name__,
            'exception_message': str(exception),
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        }
        
        logger.error("Unhandled exception", extra=error_data, exc_info=True)
        
        # Store error for monitoring
        self.store_error_metrics(error_data)
    
    def log_error_response(self, request, response):
        """Log error responses for monitoring"""
        error_data = {
            'request_id': getattr(request, 'request_id', 'unknown'),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        }
        
        if response.status_code >= 500:
            logger.error("Server error response", extra=error_data)
        else:
            logger.warning("Client error response", extra=error_data)
        
        self.store_error_metrics(error_data)
    
    def store_error_metrics(self, error_data):
        """Store error metrics for monitoring"""
        cache_key = f"errors_{int(time.time() // 300)}"  # Per 5-minute buckets
        
        current_errors = cache.get(cache_key, {
            'total_errors': 0,
            'server_errors': 0,
            'client_errors': 0
        })
        
        current_errors['total_errors'] += 1
        
        status_code = error_data.get('status_code', 500)
        if status_code >= 500:
            current_errors['server_errors'] += 1
        elif status_code >= 400:
            current_errors['client_errors'] += 1
        
        cache.set(cache_key, current_errors, 3600)
```

### 3. Deployment Validation System

#### Post-Deployment Health Validation:
```python
# deployment/validation.py
import requests
import time
from django.conf import settings

class DeploymentValidator:
    """Validate deployment health after deployment"""
    
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.validation_results = []
    
    def run_validation(self):
        """Run complete deployment validation"""
        validations = [
            self.validate_basic_health,
            self.validate_detailed_health,
            self.validate_api_endpoints,
            self.validate_authentication,
            self.validate_database_connectivity,
            self.validate_file_upload,
        ]
        
        for validation in validations:
            try:
                result = validation()
                self.validation_results.append(result)
            except Exception as e:
                self.validation_results.append({
                    'check': validation.__name__,
                    'status': 'failed',
                    'error': str(e),
                    'timestamp': time.time()
                })
        
        return self.get_validation_summary()
    
    def validate_basic_health(self):
        """Validate basic health endpoint"""
        response = requests.get(f"{self.base_url}/api/v1/health/status/", timeout=10)
        
        return {
            'check': 'basic_health',
            'status': 'passed' if response.status_code == 200 else 'failed',
            'response_time': response.elapsed.total_seconds(),
            'status_code': response.status_code,
            'timestamp': time.time()
        }
    
    def validate_detailed_health(self):
        """Validate detailed health endpoint"""
        response = requests.get(f"{self.base_url}/api/v1/health/detailed/", timeout=30)
        
        return {
            'check': 'detailed_health',
            'status': 'passed' if response.status_code in [200, 206] else 'failed',
            'response_time': response.elapsed.total_seconds(),
            'status_code': response.status_code,
            'timestamp': time.time()
        }
    
    def validate_api_endpoints(self):
        """Validate key API endpoints are responding"""
        endpoints = [
            '/api/v1/auth/token/',
            '/api/v1/projects/project_list',
            '/api/v1/health/metrics/',
        ]
        
        results = []
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                results.append({
                    'endpoint': endpoint,
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds()
                })
            except Exception as e:
                results.append({
                    'endpoint': endpoint,
                    'error': str(e)
                })
        
        return {
            'check': 'api_endpoints',
            'status': 'passed' if all('error' not in r for r in results) else 'failed',
            'details': results,
            'timestamp': time.time()
        }
    
    def validate_authentication(self):
        """Validate authentication system"""
        # This would typically use a test account
        # For now, just check the token endpoint responds correctly to invalid credentials
        
        response = requests.post(f"{self.base_url}/api/v1/auth/token/", {
            'username': 'invalid@test.com',
            'password': 'invalid'
        }, timeout=10)
        
        # Should return 401 or 400 for invalid credentials
        return {
            'check': 'authentication',
            'status': 'passed' if response.status_code in [400, 401] else 'failed',
            'status_code': response.status_code,
            'timestamp': time.time()
        }
    
    def get_validation_summary(self):
        """Get summary of all validations"""
        passed = sum(1 for r in self.validation_results if r.get('status') == 'passed')
        total = len(self.validation_results)
        
        return {
            'overall_status': 'passed' if passed == total else 'failed',
            'passed_checks': passed,
            'total_checks': total,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.validation_results,
            'timestamp': time.time()
        }
```

### 4. Health Check URL Configuration

#### URL Routing:
```python
# health/urls.py
from django.urls import path
from . import views

app_name = 'health'

urlpatterns = [
    path('status/', views.BasicHealthView.as_view(), name='basic'),
    path('detailed/', views.DetailedHealthView.as_view(), name='detailed'),
    path('ready/', views.ReadinessProbeView.as_view(), name='readiness'),
    path('live/', views.LivenessProbeView.as_view(), name='liveness'),
    path('metrics/', views.MetricsView.as_view(), name='metrics'),
]

# config/urls.py - Add health check URLs
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/users/", include("users.urls")),
    path("api/v1/projects/", include("projects.urls")),
    path("api/v1/feedbacks/", include("feedbacks.urls")),
    path("api/v1/onlines/", include("onlines.urls")),
    path("api/v1/health/", include("health.urls")),  # New health endpoints
]
```

## Implementation Timeline

### Week 1: Basic Health Checks
- [ ] Implement basic health check infrastructure
- [ ] Add database and Redis connectivity checks
- [ ] Create health check URL endpoints

### Week 2: Advanced Monitoring
- [ ] Add performance monitoring middleware
- [ ] Implement error tracking system
- [ ] Create metrics collection system

### Week 3: Deployment Validation
- [ ] Build deployment validation system
- [ ] Add post-deployment health verification
- [ ] Create monitoring dashboards

### Week 4: Alerting and Documentation
- [ ] Set up alerting rules
- [ ] Document health check endpoints
- [ ] Create monitoring runbooks

## Railway Platform Integration

### Railway-Specific Health Configuration:
```python
# settings.py - Railway configuration
if 'RAILWAY_ENVIRONMENT' in os.environ:
    # Railway-specific settings
    ALLOWED_HOSTS.append('.railway.app')
    
    # Health check configuration for Railway
    HEALTH_CHECK = {
        'path': '/api/v1/health/ready/',
        'port': int(os.environ.get('PORT', 8000)),
        'timeout': 30,
    }
    
    # Railway database connection
    if 'DATABASE_URL' in os.environ:
        import dj_database_url
        DATABASES['default'] = dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    
    # Railway Redis configuration
    if 'REDIS_URL' in os.environ:
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels_redis.core.RedisChannelLayer",
                "CONFIG": {
                    "hosts": [os.environ.get('REDIS_URL')],
                },
            },
        }

# Railway health check script
# railway-healthcheck.py
import requests
import sys
import os

def main():
    port = os.environ.get('PORT', 8000)
    url = f"http://localhost:{port}/api/v1/health/ready/"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print("Health check passed")
            sys.exit(0)
        else:
            print(f"Health check failed with status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Health check error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

## Monitoring Dashboard Endpoints

### Metrics API for Monitoring Tools:
```python
# monitoring/api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from datetime import datetime, timedelta
import time

class PerformanceMetricsAPI(APIView):
    """API endpoint for external monitoring tools"""
    
    def get(self, request):
        # Aggregate performance metrics from cache
        current_minute = int(time.time() // 60)
        metrics_data = []
        
        # Get last 10 minutes of data
        for i in range(10):
            minute_key = f"metrics_{current_minute - i}"
            minute_data = cache.get(minute_key, {})
            
            if minute_data.get('request_count', 0) > 0:
                avg_response_time = (
                    minute_data['total_response_time'] / minute_data['request_count']
                )
                
                metrics_data.append({
                    'timestamp': (current_minute - i) * 60,
                    'request_count': minute_data['request_count'],
                    'avg_response_time': round(avg_response_time, 3),
                    'slow_requests': minute_data.get('slow_requests', 0),
                    'error_requests': minute_data.get('error_requests', 0),
                })
        
        return Response({
            'metrics': metrics_data,
            'summary': self.get_summary_metrics(metrics_data)
        })
    
    def get_summary_metrics(self, metrics_data):
        """Calculate summary metrics"""
        if not metrics_data:
            return {}
        
        total_requests = sum(m['request_count'] for m in metrics_data)
        total_slow = sum(m['slow_requests'] for m in metrics_data)
        total_errors = sum(m['error_requests'] for m in metrics_data)
        
        avg_response_times = [m['avg_response_time'] for m in metrics_data if m['request_count'] > 0]
        overall_avg = sum(avg_response_times) / len(avg_response_times) if avg_response_times else 0
        
        return {
            'total_requests': total_requests,
            'slow_request_rate': (total_slow / total_requests * 100) if total_requests > 0 else 0,
            'error_rate': (total_errors / total_requests * 100) if total_requests > 0 else 0,
            'avg_response_time': round(overall_avg, 3)
        }
```

## Success Metrics

1. **Health Check Response Time**: <1 second for all health endpoints
2. **Service Uptime**: 99.9% availability based on health checks
3. **Error Detection**: <1 minute to detect service degradation
4. **Deployment Validation**: 100% success rate for post-deployment checks
5. **Monitoring Coverage**: All critical dependencies monitored

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: High - Essential for production monitoring and reliability