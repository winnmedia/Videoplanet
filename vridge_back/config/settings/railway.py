"""Railway Production Settings

This module contains settings specific to Railway deployments.
It extends the base settings with production-grade configurations.
Handles graceful fallbacks for missing dependencies.
"""

from .base import *
import os
import sys
import warnings

# Railway environment
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'production')

# Override DEBUG for production
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

# Railway provides these automatically
RAILWAY_PUBLIC_DOMAIN = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
RAILWAY_STATIC_URL = os.environ.get('RAILWAY_STATIC_URL')

# Update ALLOWED_HOSTS with Railway domain
ALLOWED_HOSTS = ['*']  # Temporarily allow all for debugging
# Production configuration (use after debugging):
# ALLOWED_HOSTS = ['vlanet.net', 'www.vlanet.net', 'api.vlanet.net']
# if RAILWAY_PUBLIC_DOMAIN:
#     ALLOWED_HOSTS.append(RAILWAY_PUBLIC_DOMAIN)
#     ALLOWED_HOSTS.append(f"*.{RAILWAY_PUBLIC_DOMAIN}")
#     ALLOWED_HOSTS.extend(['.railway.app', '*.railway.app'])

# Try to import settings from my_settings if it exists (backward compatibility)
# This allows for smooth transition from old to new structure
try:
    # Check multiple possible locations for my_settings
    possible_paths = [
        '/app',  # Docker container path
        str(Path(__file__).resolve().parent.parent.parent),  # Project root
        str(Path(__file__).resolve().parent.parent),  # Config directory
    ]
    
    my_settings_imported = False
    for path in possible_paths:
        if path not in sys.path:
            sys.path.insert(0, path)
        try:
            import my_settings
            
            # Import specific production-relevant settings only
            production_settings = [
                'SECRET_KEY', 'SENDGRID_API_KEY', 'DEFAULT_FROM_EMAIL',
                'DEFAULT_FROM_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
                'AWS_STORAGE_BUCKET_NAME', 'SENTRY_DSN', 'ALGORITHM'
            ]
            
            for attr in production_settings:
                if hasattr(my_settings, attr):
                    value = getattr(my_settings, attr)
                    if value:  # Only override if value is not empty
                        globals()[attr] = value
                        
            my_settings_imported = True
            print(f"[Railway Settings] Loaded overrides from my_settings at {path}")
            break
            
        except ImportError:
            continue
        except Exception as e:
            warnings.warn(f"Error importing my_settings from {path}: {e}")
            
    if not my_settings_imported:
        print("[Railway Settings] No my_settings.py found, using environment variables only")
        
except Exception as e:
    warnings.warn(f"Unexpected error handling my_settings: {e}")

# Ensure critical settings from environment take precedence
SECRET_KEY = os.environ.get('SECRET_KEY', globals().get('SECRET_KEY', 'django-insecure-production-key'))
if SECRET_KEY == 'django-insecure-production-key':
    warnings.warn("Using insecure SECRET_KEY! Set SECRET_KEY environment variable!")

# CORS configuration for production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://api.vlanet.net',
]
if RAILWAY_PUBLIC_DOMAIN:
    CORS_ALLOWED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Add environment variable overrides
additional_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and not origin.startswith(('http://', 'https://')):
            origin = f'https://{origin}'
        if origin:
            CORS_ALLOWED_ORIGINS.append(origin)

# CSRF configuration
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://api.vlanet.net',
    'https://*.railway.app',
]
if RAILWAY_PUBLIC_DOMAIN:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RAILWAY_PUBLIC_DOMAIN}")

# Static files - use Railway's static URL if available
if RAILWAY_STATIC_URL:
    # Ensure STATIC_URL always ends with a slash
    STATIC_URL = RAILWAY_STATIC_URL if RAILWAY_STATIC_URL.endswith('/') else f"{RAILWAY_STATIC_URL}/"
else:
    STATIC_URL = '/static/'

# Media files - ensure using Railway volume with fallback
# Check if /data exists and is writable
if os.path.exists('/data'):
    try:
        # Try to create a test file to check write permissions
        test_file = '/data/.write_test'
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        MEDIA_ROOT = '/data/media'
    except (PermissionError, IOError):
        # /data exists but not writable, use app directory
        MEDIA_ROOT = os.environ.get('MEDIA_ROOT', str(BASE_DIR / 'media'))
        warnings.warn("Cannot write to /data, using local media directory")
else:
    # Fallback for local testing or containers without volume
    MEDIA_ROOT = os.environ.get('MEDIA_ROOT', str(BASE_DIR / 'media'))
    
# Ensure media directory exists (suppress permission errors)
try:
    os.makedirs(MEDIA_ROOT, exist_ok=True)
except (PermissionError, OSError) as e:
    # This is expected on Railway with read-only filesystem
    pass  # Silently ignore as Railway handles media differently

# Security settings for production
SECURE_SSL_REDIRECT = False  # Railway handles SSL termination
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Email configuration with fallback
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', globals().get('SENDGRID_API_KEY', ''))
if SENDGRID_API_KEY:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = 'smtp.sendgrid.net'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = 'apikey'
    EMAIL_HOST_PASSWORD = SENDGRID_API_KEY
else:
    # Fallback to console for debugging
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    warnings.warn("No SENDGRID_API_KEY found, using console email backend")

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', globals().get('DEFAULT_FROM_EMAIL', 'noreply@vlanet.net'))
DEFAULT_FROM_NAME = os.environ.get('DEFAULT_FROM_NAME', globals().get('DEFAULT_FROM_NAME', 'Vlanet'))

# Sentry configuration (optional)
SENTRY_DSN = os.environ.get('SENTRY_DSN', globals().get('SENTRY_DSN', ''))
if SENTRY_DSN and not DEBUG:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=0.1,  # Reduced for production
            send_default_pii=False,  # Privacy conscious
            environment=RAILWAY_ENVIRONMENT,
        )
        print("[Railway Settings] Sentry monitoring enabled")
    except ImportError:
        warnings.warn("Sentry DSN configured but sentry-sdk not installed")
    except Exception as e:
        warnings.warn(f"Failed to initialize Sentry: {e}")

# Logging for Railway
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {name} {module} {funcName} {lineno}: {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose" if DEBUG else "simple",
            "stream": sys.stdout,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("LOG_LEVEL", "INFO" if not DEBUG else "DEBUG"),
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
            "level": "WARNING" if not DEBUG else "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING" if not DEBUG else "INFO",
            "propagate": False,
        },
    },
}

# Print startup configuration
def print_config_summary():
    """Print configuration summary for debugging."""
    print("=" * 60)
    print("Railway Settings Loaded Successfully")
    print("-" * 60)
    print(f"Environment: {RAILWAY_ENVIRONMENT}")
    print(f"Debug Mode: {DEBUG}")
    print(f"Railway Domain: {RAILWAY_PUBLIC_DOMAIN or 'Not set'}")
    print(f"Database: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (fallback)'}")
    print(f"Redis: {'Configured' if os.environ.get('REDIS_URL') else 'In-memory (fallback)'}")
    print(f"Email: {'SendGrid' if SENDGRID_API_KEY else 'Console (fallback)'}")
    print(f"Media Root: {MEDIA_ROOT}")
    print(f"Static URL: {STATIC_URL}")
    print(f"Sentry: {'Enabled' if SENTRY_DSN and not DEBUG else 'Disabled'}")
    print(f"Settings Module: config.settings.railway")
    print("=" * 60)

# Only print in development or if explicitly requested
if DEBUG or os.environ.get('SHOW_CONFIG_SUMMARY'):
    print_config_summary()