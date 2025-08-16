"""Settings Package Initialization

This module handles the initialization of the settings package.
It provides intelligent routing to the appropriate settings module.
"""

import os
import sys
from pathlib import Path

# Determine environment and import appropriate settings
def _get_environment():
    """Determine the current environment."""
    # Check for explicit environment variable
    env = os.environ.get('DJANGO_ENV', '').lower()
    
    # Check for Railway
    if os.environ.get('RAILWAY_ENVIRONMENT'):
        return 'railway'
    
    # Check for production indicators
    if os.environ.get('DATABASE_URL'):
        return 'railway'
    
    # Default to local
    return env or 'local'

_env = _get_environment()

# Import the appropriate settings
try:
    if _env == 'railway':
        from .railway import *
    elif _env == 'local':
        from .local import *
    else:
        from .base import *
except ImportError as e:
    # Fallback to base if specific environment fails
    from .base import *
    import warnings
    warnings.warn(f"Could not load {_env} settings, using base: {e}")

# Log which settings are loaded (useful for debugging)
if os.environ.get('DEBUG_SETTINGS'):
    print(f"[Settings Package] Loaded settings for environment: {_env}")