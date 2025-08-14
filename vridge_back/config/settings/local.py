"""Local Development Settings

This module contains settings specific to local development.
It extends the base settings with development-friendly configurations.
"""

from .base import *
import os
import sys
import warnings

# Development mode
DEBUG = True

# Allowed hosts for local development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '*']

# Try to import local overrides from my_settings if it exists
try:
    # Check if my_settings.py exists in the project root
    from pathlib import Path
    
    # Add parent directory to path temporarily
    project_root = Path(__file__).resolve().parent.parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    
    try:
        import my_settings
        
        # Import all non-private attributes from my_settings
        for attr in dir(my_settings):
            if not attr.startswith('_'):
                value = getattr(my_settings, attr)
                globals()[attr] = value
                
        print("[Local Settings] Successfully loaded my_settings.py overrides")
        
    except ImportError:
        # my_settings doesn't exist, which is fine
        pass
    except Exception as e:
        warnings.warn(f"Error loading my_settings: {e}")
        
    finally:
        # Clean up sys.path
        if str(project_root) in sys.path:
            sys.path.remove(str(project_root))
            
except Exception as e:
    # Silently ignore if we can't load my_settings
    pass

# Development-specific settings
if DEBUG:
    # Show all warnings
    import warnings
    warnings.filterwarnings('default')
    
    # Enable debug toolbar if installed
    try:
        import debug_toolbar
        if 'debug_toolbar' not in INSTALLED_APPS:
            INSTALLED_APPS += ['debug_toolbar']
        if 'debug_toolbar.middleware.DebugToolbarMiddleware' not in MIDDLEWARE:
            MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
    except ImportError:
        pass

# Use console email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Media files - local path
MEDIA_ROOT = BASE_DIR / 'media'

# Simplified CORS for local development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Disable some production security features for easier development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# More verbose logging for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}