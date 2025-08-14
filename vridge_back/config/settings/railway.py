"""
Railway-specific Django settings
This file extends base.py with Railway environment-specific configurations
"""

from .base import *
import os

# Railway environment
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'production')

# Override DEBUG for production
DEBUG = False

# Railway provides these automatically
RAILWAY_PUBLIC_DOMAIN = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
RAILWAY_STATIC_URL = os.environ.get('RAILWAY_STATIC_URL')

# Update ALLOWED_HOSTS with Railway domain
ALLOWED_HOSTS = ['*']  # Temporarily allow all for debugging
# Production configuration (use after debugging):
# ALLOWED_HOSTS = ['vlanet.net', 'www.vlanet.net']
# if RAILWAY_PUBLIC_DOMAIN:
#     ALLOWED_HOSTS.append(RAILWAY_PUBLIC_DOMAIN)
#     ALLOWED_HOSTS.append(f"*.{RAILWAY_PUBLIC_DOMAIN}")
#     ALLOWED_HOSTS.extend(['.railway.app', '*.railway.app'])

# CORS configuration for production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
]
if RAILWAY_PUBLIC_DOMAIN:
    CORS_ALLOWED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# CSRF configuration
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
]
if RAILWAY_PUBLIC_DOMAIN:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Static files - use Railway's static URL if available
if RAILWAY_STATIC_URL:
    STATIC_URL = RAILWAY_STATIC_URL
else:
    STATIC_URL = '/static/'

# Media files - ensure using Railway volume
MEDIA_ROOT = '/data/media'

# Security settings for production
SECURE_SSL_REDIRECT = False  # Railway handles SSL termination
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Logging for Railway
import sys
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {name} {module} {funcName} {lineno}: {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "stream": sys.stdout,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "django.server": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# Print startup configuration
print("=" * 60)
print("Railway Settings Loaded")
print(f"RAILWAY_ENVIRONMENT: {RAILWAY_ENVIRONMENT}")
print(f"RAILWAY_PUBLIC_DOMAIN: {RAILWAY_PUBLIC_DOMAIN}")
print(f"DATABASE_URL configured: {'Yes' if os.environ.get('DATABASE_URL') else 'No'}")
print(f"REDIS_URL configured: {'Yes' if os.environ.get('REDIS_URL') else 'No'}")
print(f"MEDIA_ROOT: {MEDIA_ROOT}")
print(f"Using settings: config.settings.railway")
print("=" * 60)