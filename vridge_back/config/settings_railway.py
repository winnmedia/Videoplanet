"""
Railway-specific Django settings
This file is used when DJANGO_SETTINGS_MODULE=config.settings.railway
"""

# Import everything from production settings
from config.settings_production import *

# Railway-specific overrides
import os

# Ensure we're using Railway environment variables
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'production')

# Railway provides these automatically
RAILWAY_PUBLIC_DOMAIN = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
RAILWAY_STATIC_URL = os.environ.get('RAILWAY_STATIC_URL')

# Update ALLOWED_HOSTS with Railway domain
if RAILWAY_PUBLIC_DOMAIN:
    ALLOWED_HOSTS.append(RAILWAY_PUBLIC_DOMAIN)
    ALLOWED_HOSTS.append(f"*.{RAILWAY_PUBLIC_DOMAIN}")

# Update CSRF_TRUSTED_ORIGINS with Railway domain
if RAILWAY_PUBLIC_DOMAIN:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Ensure static files are served correctly on Railway
if RAILWAY_STATIC_URL:
    STATIC_URL = RAILWAY_STATIC_URL

# Railway-specific logging
print("=" * 60)
print("Railway Settings Loaded")
print(f"RAILWAY_ENVIRONMENT: {RAILWAY_ENVIRONMENT}")
print(f"RAILWAY_PUBLIC_DOMAIN: {RAILWAY_PUBLIC_DOMAIN}")
print(f"RAILWAY_STATIC_URL: {RAILWAY_STATIC_URL}")
print(f"Using settings: config.settings.railway")
print("=" * 60)