"""
Dummy my_settings module for Railway deployment.
This file provides fallback values to prevent import errors.
In production, all values should come from environment variables.
"""

import os

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')

# Database
RDS_HOST = os.environ.get('RDS_HOST', 'localhost')
RDS_NAME = os.environ.get('RDS_NAME', 'vridge')
RDS_USER = os.environ.get('RDS_USER', 'postgres')
RDS_PASSWORD = os.environ.get('RDS_PASSWORD', '')

# Sentry
sentry_url = os.environ.get('SENTRY_DSN', '')

# SendGrid Email Configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@vridge.kr')
DEFAULT_FROM_NAME = os.environ.get('DEFAULT_FROM_NAME', 'Vlanet')