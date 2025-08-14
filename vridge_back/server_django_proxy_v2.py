#!/usr/bin/env python3
"""
Railway Compatibility Layer - Proxy to correct startup script
This file exists to handle Railway's hardcoded start command.
It redirects to the proper Django startup process.
"""

import os
import sys
import subprocess

def main():
    """
    Redirect to the proper Django startup process.
    This handles Railway's expectation of server_django_proxy_v2.py
    while using our actual Django application.
    """
    print("=" * 60)
    print("Railway Proxy Script - Redirecting to Django startup")
    print("=" * 60)
    
    # Set the Django settings module if not already set
    if not os.environ.get('DJANGO_SETTINGS_MODULE'):
        # Check for Railway environment
        if os.environ.get('RAILWAY_ENVIRONMENT'):
            os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.railway'
        else:
            os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print(f"PORT: {os.environ.get('PORT', '8000')}")
    print(f"RAILWAY_ENVIRONMENT: {os.environ.get('RAILWAY_ENVIRONMENT', 'Not set')}")
    
    # Get the port from environment
    port = os.environ.get('PORT', '8000')
    
    # Check if we should use the bulletproof starter
    if os.path.exists('/app/bulletproof-start.py'):
        print("\nUsing bulletproof-start.py for startup...")
        print("=" * 60)
        # Execute the bulletproof starter
        sys.exit(subprocess.call([sys.executable, '/app/bulletproof-start.py']))
    
    # Check if docker-entrypoint.sh exists and is executable
    elif os.path.exists('/app/docker-entrypoint.sh'):
        print("\nUsing docker-entrypoint.sh for startup...")
        print("=" * 60)
        # Execute the docker entrypoint script
        sys.exit(subprocess.call(['/bin/bash', '/app/docker-entrypoint.sh']))
    
    # Fallback to direct Daphne/Gunicorn startup
    else:
        print("\nFalling back to direct server startup...")
        print("=" * 60)
        
        # Try to run migrations first
        try:
            print("Running migrations...")
            subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], check=False)
        except Exception as e:
            print(f"Migration warning: {e}")
        
        # Try to collect static files
        try:
            print("Collecting static files...")
            subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=False)
        except Exception as e:
            print(f"Static files warning: {e}")
        
        # Check if we should use Daphne (for WebSocket support) or Gunicorn
        try:
            import daphne
            print(f"Starting Daphne on port {port}...")
            sys.exit(subprocess.call([
                sys.executable, '-m', 'daphne',
                '-b', '0.0.0.0',
                '-p', port,
                'config.asgi:application'
            ]))
        except ImportError:
            # Fallback to Gunicorn
            print(f"Starting Gunicorn on port {port}...")
            sys.exit(subprocess.call([
                sys.executable, '-m', 'gunicorn',
                'config.wsgi:application',
                '--bind', f'0.0.0.0:{port}',
                '--workers', '4',
                '--threads', '4',
                '--timeout', '120'
            ]))

if __name__ == '__main__':
    main()