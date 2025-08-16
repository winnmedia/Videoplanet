#!/usr/bin/env python
"""
Health check diagnostic script for Railway deployment
Run this to debug health check issues
"""
import os
import sys
import django
import time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_production')
django.setup()

from django.test import Client
from django.conf import settings
import json

def check_health_endpoints():
    """Test all health check endpoints"""
    client = Client()
    port = os.environ.get('PORT', '8000')
    
    print("=" * 60)
    print("Health Check Diagnostic Tool")
    print("=" * 60)
    print(f"Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"PORT environment variable: {port}")
    print(f"DATABASE_URL set: {'Yes' if os.environ.get('DATABASE_URL') else 'No'}")
    print(f"REDIS_URL: {os.environ.get('REDIS_URL', 'Not set')}")
    print("=" * 60)
    
    endpoints = [
        ('/ping/', 'Ping'),
        ('/simple-health/', 'Simple Health'),
        ('/live/', 'Liveness'),
        ('/health/', 'Full Health'),
        ('/ready/', 'Readiness'),
    ]
    
    for endpoint, name in endpoints:
        try:
            print(f"\nTesting {name} endpoint: {endpoint}")
            start_time = time.time()
            
            # Set environment variables for simple mode
            if endpoint == '/health/':
                os.environ['HEALTH_CHECK_SIMPLE'] = 'true'
            
            response = client.get(endpoint)
            elapsed = (time.time() - start_time) * 1000
            
            print(f"  Status: {response.status_code}")
            print(f"  Response time: {elapsed:.2f}ms")
            
            if response.status_code == 200:
                try:
                    data = json.loads(response.content.decode('utf-8'))
                    print(f"  Response: {json.dumps(data, indent=2)}")
                except:
                    print(f"  Response: {response.content.decode('utf-8')}")
            else:
                print(f"  Error: {response.content.decode('utf-8')}")
                
        except Exception as e:
            print(f"  Failed: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Diagnostic complete")
    print("=" * 60)

if __name__ == '__main__':
    check_health_endpoints()