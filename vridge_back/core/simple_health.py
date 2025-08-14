"""
Simple health check view for initial deployment verification
"""
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from datetime import datetime


@csrf_exempt
def simple_health(request):
    """
    Minimal health check endpoint that doesn't depend on any external services
    Used during initial deployment and startup phase
    """
    return JsonResponse({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "vridge-backend",
        "port": os.environ.get('PORT', '8000')
    }, status=200)


@csrf_exempt
def ping(request):
    """
    Ultra-simple ping endpoint
    """
    return HttpResponse("pong", content_type="text/plain", status=200)