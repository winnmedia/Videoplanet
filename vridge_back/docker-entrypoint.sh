#!/bin/bash
set -e

echo "=========================================="
echo "Starting Vridge Backend"
echo "=========================================="
echo "Environment Variables:"
echo "PORT: ${PORT:-Not set}"
echo "DATABASE_URL: ${DATABASE_URL:+Set}"
echo "REDIS_URL: ${REDIS_URL:-Not set}"
echo "RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT:-Not set}"
echo "RAILWAY_PUBLIC_DOMAIN: ${RAILWAY_PUBLIC_DOMAIN:-Not set}"
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-Not set}"
echo "=========================================="

# Set Django settings module
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings_production}
echo "Using Django settings: $DJANGO_SETTINGS_MODULE"

# Wait for database (with timeout)
if [ "$DATABASE_URL" ]; then
    echo "Waiting for database to be ready..."
    python << END
import sys
import time
import psycopg2
from urllib.parse import urlparse
import os

db_url = os.environ.get('DATABASE_URL', '')
if not db_url:
    print("No DATABASE_URL found, skipping database wait")
    sys.exit(0)

try:
    parsed = urlparse(db_url)
    retries = 30
    delay = 2

    while retries > 0:
        try:
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path[1:] if parsed.path else None,
                connect_timeout=5
            )
            conn.close()
            print("✓ Database is ready!")
            break
        except psycopg2.OperationalError as e:
            retries -= 1
            if retries > 0:
                print(f"Database not ready. Waiting {delay}s... ({retries} retries left)")
                time.sleep(delay)
            else:
                print(f"WARNING: Could not connect to database after 60 seconds")
                print(f"Error: {str(e)}")
                print("Continuing anyway (app may fail if database is required)")
                break
except Exception as e:
    print(f"Error parsing DATABASE_URL: {str(e)}")
    print("Continuing without database check")
END
else
    echo "No DATABASE_URL configured, skipping database wait"
fi

# Run migrations (with error handling)
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "WARNING: Migrations failed. This might be expected during initial setup."
    echo "The application will continue to start."
}

# Create superuser if configured and doesn't exist
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Checking for superuser..."
    python manage.py shell << END || true
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', f'{username}@example.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if username and password:
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"✓ Superuser '{username}' created!")
    else:
        print(f"✓ Superuser '{username}' already exists")
else:
    print("Superuser credentials not configured")
END
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || {
    echo "WARNING: Static file collection failed"
    echo "The application will continue to start."
}

# Ensure media directories exist
echo "Creating media directories..."
python manage.py ensure_media_dirs || {
    echo "Creating media directories manually..."
    python << END || true
import os
from pathlib import Path

base_dir = Path('/app')
media_root = base_dir / 'media'
media_root.mkdir(parents=True, exist_ok=True)
print(f"✓ Media root created at: {media_root}")

# Create subdirectories
for subdir in ['uploads', 'project_file', 'feedback_file']:
    path = media_root / subdir
    path.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created: {path}")
END
}

# Start the application
echo "=========================================="
echo "Starting Daphne server..."
echo "Port: ${PORT:-8000}"
echo "=========================================="

# If PORT is set by Railway, use it
if [ "$PORT" ]; then
    echo "Using Railway PORT: $PORT"
    exec daphne -b 0.0.0.0 -p "$PORT" config.asgi:application
else
    echo "Using default port: 8000"
    exec "$@"
fi