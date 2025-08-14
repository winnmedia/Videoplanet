"""
Django Settings Compatibility Layer
====================================
This module provides backward compatibility for both old and new settings structures.
It intelligently detects which configuration to use and handles missing modules gracefully.

Author: Benjamin (Backend Lead)
Purpose: Seamless migration from monolithic settings to modular settings package
"""

import os
import sys
import warnings
from pathlib import Path

# Get the config directory path
CONFIG_DIR = Path(__file__).resolve().parent
BASE_DIR = CONFIG_DIR.parent

# Determine which settings structure to use
def get_settings_module():
    """
    Determines the appropriate settings module based on environment and available files.
    
    Returns:
        str: The module path to use for Django settings
    """
    # Check environment variable first
    env_settings = os.environ.get('DJANGO_SETTINGS_MODULE')
    
    # If explicitly set and not the old path, use it
    if env_settings and env_settings != 'config.settings':
        return env_settings
    
    # Check for Railway environment
    if os.environ.get('RAILWAY_ENVIRONMENT'):
        return 'config.settings.railway'
    
    # Check for production indicators
    if os.environ.get('DATABASE_URL') or os.environ.get('REDIS_URL'):
        return 'config.settings.railway'
    
    # Default to local development
    return 'config.settings.local'

# Set the Django settings module if not already set
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ['DJANGO_SETTINGS_MODULE'] = get_settings_module()

# Import settings based on the determined module
settings_module = get_settings_module()

try:
    # Try to import from the new package structure
    if settings_module == 'config.settings.railway':
        from config.settings.railway import *
    elif settings_module == 'config.settings.local':
        from config.settings.local import *
    else:
        # Try to import the specified module dynamically
        module_path = settings_module.replace('.', '/')
        if 'config/settings' in module_path:
            # New structure
            module_name = settings_module.split('.')[-1]
            if module_name == 'railway':
                from config.settings.railway import *
            elif module_name == 'local':
                from config.settings.local import *
            else:
                from config.settings.base import *
        else:
            # Fallback to base settings
            from config.settings.base import *
            
except ImportError as e:
    # If new structure fails, try to load base settings at minimum
    try:
        from config.settings.base import *
        warnings.warn(f"Failed to load {settings_module}, falling back to base settings: {e}")
    except ImportError:
        # Ultimate fallback: construct minimal settings inline
        print(f"WARNING: Could not load any settings module. Using emergency fallback settings.")
        
        from pathlib import Path
        from datetime import timedelta
        import dj_database_url
        from corsheaders.defaults import default_headers
        
        # Emergency settings - minimal configuration to keep the app running
        BASE_DIR = Path(__file__).resolve().parent.parent
        SECRET_KEY = os.environ.get('SECRET_KEY', 'emergency-key-replace-immediately')
        DEBUG = False
        ALLOWED_HOSTS = ['*']  # Temporary, should be restricted
        
        INSTALLED_APPS = [
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sessions",
            "django.contrib.messages",
            "django.contrib.staticfiles",
            "corsheaders",
            "rest_framework",
            "core",
            "users",
            "projects",
            "feedbacks",
            "onlines",
        ]
        
        MIDDLEWARE = [
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "corsheaders.middleware.CorsMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ]
        
        ROOT_URLCONF = "config.urls"
        
        TEMPLATES = [
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "DIRS": [BASE_DIR / "templates"],
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [
                        "django.template.context_processors.debug",
                        "django.template.context_processors.request",
                        "django.contrib.auth.context_processors.auth",
                        "django.contrib.messages.context_processors.messages",
                    ],
                },
            },
        ]
        
        # Database
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if DATABASE_URL:
            DATABASES = {
                'default': dj_database_url.config(
                    default=DATABASE_URL,
                    conn_max_age=600,
                )
            }
        else:
            DATABASES = {
                "default": {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": BASE_DIR / "db.sqlite3",
                }
            }
        
        # Basic settings
        LANGUAGE_CODE = "en-us"
        TIME_ZONE = "UTC"
        USE_I18N = True
        USE_TZ = True
        STATIC_URL = "/static/"
        STATIC_ROOT = BASE_DIR / "staticfiles"
        DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
        AUTH_USER_MODEL = "users.User"
        
        # CORS
        CORS_ALLOW_ALL_ORIGINS = True  # Temporary
        
        warnings.warn("Running with emergency fallback settings. Please fix your settings configuration!")

# Handle legacy my_settings import gracefully
try:
    # Try to import my_settings if it exists (for backward compatibility)
    import my_settings
    
    # Override settings with values from my_settings if they exist
    for attr in dir(my_settings):
        if not attr.startswith('_'):
            value = getattr(my_settings, attr)
            # Only override if not already set or if it's a default value
            if not locals().get(attr) or attr in ['SECRET_KEY', 'DEBUG', 'SENDGRID_API_KEY']:
                locals()[attr] = value
                
except ImportError:
    # my_settings doesn't exist, which is fine - we're using environment variables
    pass
except Exception as e:
    # Log the error but don't fail
    warnings.warn(f"Could not import my_settings: {e}")

# Ensure critical settings are always present
if 'SECRET_KEY' not in locals() or not locals().get('SECRET_KEY'):
    SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-key-change-in-production')
    warnings.warn("Using default SECRET_KEY. Please set a secure key in production!")

if 'DEBUG' not in locals():
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

if 'ALLOWED_HOSTS' not in locals() or not locals().get('ALLOWED_HOSTS'):
    ALLOWED_HOSTS = os.environ.get(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1,*.railway.app'
    ).split(',')
    ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS if host.strip()]

# Validate that essential settings are present
REQUIRED_SETTINGS = [
    'BASE_DIR', 'SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS',
    'INSTALLED_APPS', 'MIDDLEWARE', 'ROOT_URLCONF',
    'DATABASES', 'STATIC_URL', 'STATIC_ROOT'
]

missing_settings = []
for setting in REQUIRED_SETTINGS:
    if setting not in locals():
        missing_settings.append(setting)

if missing_settings:
    error_msg = f"Critical settings are missing: {', '.join(missing_settings)}"
    warnings.warn(error_msg)
    # Don't raise an exception - let Django handle it
    
# Log which configuration is being used
if DEBUG or os.environ.get('LOG_SETTINGS_SOURCE'):
    print(f"[Settings] Using configuration: {settings_module}")
    print(f"[Settings] DEBUG mode: {DEBUG}")
    print(f"[Settings] Database configured: {'DATABASE_URL' in os.environ}")
    print(f"[Settings] Redis configured: {'REDIS_URL' in os.environ}")