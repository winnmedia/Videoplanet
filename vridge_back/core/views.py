"""
Core views for the application
"""
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def ping(request):
    """
    Ultra-simple ping endpoint that always returns 200
    Used for initial health checks during deployment
    """
    return HttpResponse("pong", content_type="text/plain", status=200)


@csrf_exempt
@require_http_methods(["GET"])
def status(request):
    """
    Basic status endpoint
    Returns minimal application status without checking dependencies
    """
    return JsonResponse({
        "status": "running",
        "service": "vridge-backend"
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
def root(request):
    """
    Root endpoint handler
    """
    return JsonResponse({
        "message": "Vridge Backend API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health/",
            "status": "/status/",
            "ping": "/ping/",
            "admin": "/admin/",
            "api": {
                "users": "/users/",
                "projects": "/projects/",
                "feedbacks": "/feedbacks/",
                "onlines": "/onlines/"
            }
        }
    }, status=200)
