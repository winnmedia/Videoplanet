"""
Local development settings
"""

from .base import *

# Override for local development
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# CORS - allow localhost for development
CORS_ALLOW_ALL_ORIGINS = True

# Use console email backend for local development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Media files - local path
MEDIA_ROOT = BASE_DIR / 'media'

# Disable SSL redirect for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False