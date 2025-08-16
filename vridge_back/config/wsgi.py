"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Use production settings if RAILWAY_ENVIRONMENT is set
if os.environ.get('RAILWAY_ENVIRONMENT'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_production")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
