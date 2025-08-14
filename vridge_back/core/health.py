"""
Health check endpoint for monitoring and load balancer health checks
"""
import json
from datetime import datetime
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import redis
import logging

logger = logging.getLogger(__name__)


def health_check(request):
    """
    Health check endpoint that verifies all critical services are operational
    Returns HTTP 200 if healthy, HTTP 503 if unhealthy
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": getattr(settings, 'APP_VERSION', '1.0.0'),
        "environment": getattr(settings, 'ENVIRONMENT', 'production'),
        "checks": {}
    }
    
    is_healthy = True
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status["checks"]["database"] = {
            "status": "healthy",
            "response_time_ms": 0
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        is_healthy = False
    
    # Check Redis connection
    try:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
        r = redis.from_url(redis_url)
        r.ping()
        health_status["checks"]["redis"] = {
            "status": "healthy",
            "response_time_ms": 0
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        is_healthy = False
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') == 'ok':
            health_status["checks"]["cache"] = {
                "status": "healthy"
            }
        else:
            raise Exception("Cache write/read failed")
    except Exception as e:
        logger.error(f"Cache health check failed: {str(e)}")
        health_status["checks"]["cache"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        is_healthy = False
    
    # Check storage (if S3 is configured)
    if getattr(settings, 'USE_S3', False):
        try:
            from django.core.files.storage import default_storage
            # Just check if we can access the storage backend
            default_storage.exists('health_check.txt')
            health_status["checks"]["storage"] = {
                "status": "healthy",
                "backend": "S3"
            }
        except Exception as e:
            logger.error(f"Storage health check failed: {str(e)}")
            health_status["checks"]["storage"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            # Storage issues shouldn't mark the entire service as unhealthy
    
    # Overall status
    if not is_healthy:
        health_status["status"] = "unhealthy"
        return JsonResponse(health_status, status=503)
    
    return JsonResponse(health_status, status=200)


def ready_check(request):
    """
    Readiness check for Kubernetes/container orchestration
    Returns HTTP 200 if ready to receive traffic
    """
    try:
        # Quick database check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        return JsonResponse({
            "ready": True,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, status=200)
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JsonResponse({
            "ready": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, status=503)


def liveness_check(request):
    """
    Liveness check for Kubernetes/container orchestration
    Simple check to verify the application is running
    """
    return JsonResponse({
        "alive": True,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }, status=200)