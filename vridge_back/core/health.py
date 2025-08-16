"""
Health check endpoints for monitoring and load balancer health checks
"""
import json
import os
from datetime import datetime
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def simple_health_check(request):
    """
    Simple health check endpoint for Railway deployment
    Returns HTTP 200 immediately without checking dependencies
    This is used during startup when services might not be ready yet
    """
    logger.info("Simple health check called")
    return JsonResponse({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": "simple",
        "service": "vridge-backend"
    }, status=200)


def health_check(request):
    """
    Comprehensive health check endpoint
    Returns HTTP 200 if healthy, HTTP 503 if unhealthy
    Use ?simple=true for a simple health check without dependency checks
    """
    # Allow simple health check for load balancers during startup
    if request.GET.get('simple') == 'true':
        return simple_health_check(request)
    
    logger.info("Full health check called")
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": getattr(settings, 'APP_VERSION', '1.0.0'),
        "environment": os.environ.get('RAILWAY_ENVIRONMENT', 'production'),
        "checks": {}
    }
    
    is_critical_failure = False
    
    # Check database connection (degraded if fails during startup)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status["checks"]["database"] = {
            "status": "healthy",
            "response_time_ms": 0
        }
        logger.debug("Database health check passed")
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"Database health check failed: {error_msg}")
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": error_msg[:200]  # Limit error message length
        }
        # Only fail if not during startup period (first 60 seconds)
        import time
        startup_time = getattr(settings, 'STARTUP_TIME', time.time())
        if time.time() - startup_time > 60:
            is_critical_failure = True
    
    # Check Redis connection (optional - degraded service if fails)
    try:
        import redis
        # Get Redis URL from environment or CHANNEL_LAYERS config
        redis_url = os.environ.get('REDIS_URL')
        if not redis_url:
            channel_layers = getattr(settings, 'CHANNEL_LAYERS', {})
            redis_config = channel_layers.get('default', {}).get('CONFIG', {})
            redis_hosts = redis_config.get('hosts', [])
            
            if redis_hosts:
                if isinstance(redis_hosts[0], str):
                    redis_url = redis_hosts[0]
                else:
                    host, port = redis_hosts[0] if redis_hosts else ('localhost', 6379)
                    redis_url = f"redis://{host}:{port}/0"
        
        if redis_url:
            r = redis.from_url(redis_url, socket_connect_timeout=2)
            r.ping()
            health_status["checks"]["redis"] = {
                "status": "healthy",
                "response_time_ms": 0
            }
            logger.debug("Redis health check passed")
        else:
            health_status["checks"]["redis"] = {
                "status": "not_configured"
            }
    except Exception as e:
        logger.info(f"Redis health check failed (non-critical): {str(e)}")
        health_status["checks"]["redis"] = {
            "status": "degraded",
            "error": str(e)[:200]
        }
        # Redis failure is not critical
    
    # Check cache (optional)
    try:
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') == 'ok':
            health_status["checks"]["cache"] = {
                "status": "healthy"
            }
            logger.debug("Cache health check passed")
        else:
            raise Exception("Cache write/read failed")
    except Exception as e:
        logger.info(f"Cache health check failed (non-critical): {str(e)}")
        health_status["checks"]["cache"] = {
            "status": "degraded",
            "error": str(e)[:200]
        }
        # Cache failure is not critical
    
    # Check storage (if configured)
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
            logger.info(f"Storage health check failed (non-critical): {str(e)}")
            health_status["checks"]["storage"] = {
                "status": "degraded",
                "error": str(e)[:200]
            }
    
    # Overall status
    if is_critical_failure:
        health_status["status"] = "unhealthy"
        logger.error(f"Health check failed: {json.dumps(health_status)}")
        return JsonResponse(health_status, status=503)
    
    # Check if any service is degraded
    degraded_services = [
        name for name, check in health_status["checks"].items() 
        if check.get("status") in ["degraded", "unhealthy"]
    ]
    
    if degraded_services:
        health_status["status"] = "degraded"
        health_status["degraded_services"] = degraded_services
        logger.warning(f"Health check degraded: {', '.join(degraded_services)}")
    else:
        logger.info("Health check passed - all services healthy")
    
    return JsonResponse(health_status, status=200)


def ready_check(request):
    """
    Readiness check for Kubernetes/container orchestration
    Returns HTTP 200 if ready to receive traffic
    """
    logger.debug("Readiness check called")
    
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
            "error": str(e)[:200],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, status=503)


def liveness_check(request):
    """
    Liveness check for Kubernetes/container orchestration
    Simple check to verify the application is running
    """
    logger.debug("Liveness check called")
    return JsonResponse({
        "alive": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "pid": os.getpid()
    }, status=200)