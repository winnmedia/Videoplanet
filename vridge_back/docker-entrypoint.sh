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

# Run pre-start script to fix any import issues
echo "Running pre-start import fixer..."
if [ -f "/app/pre-start.sh" ]; then
    bash /app/pre-start.sh
elif [ -f "./pre-start.sh" ]; then
    bash ./pre-start.sh
else
    echo "Warning: pre-start.sh not found, skipping import fixes"
fi
echo "Pre-start complete"
echo "=========================================="

# Determine and set Django settings module
if [ -z "$DJANGO_SETTINGS_MODULE" ]; then
    # Check if we're in Railway environment
    if [ "$RAILWAY_ENVIRONMENT" ]; then
        export DJANGO_SETTINGS_MODULE=config.settings.railway
    # Check if we have production indicators
    elif [ "$DATABASE_URL" ] || [ "$REDIS_URL" ]; then
        export DJANGO_SETTINGS_MODULE=config.settings.railway
    # Check if new settings package exists
    elif [ -d "/app/config/settings" ]; then
        export DJANGO_SETTINGS_MODULE=config.settings.railway
    # Fallback to compatibility layer
    else
        export DJANGO_SETTINGS_MODULE=config.settings
    fi
fi

echo "Using Django settings: $DJANGO_SETTINGS_MODULE"

# Handle settings migration gracefully
echo "Checking settings configuration..."

# If old settings.py exists, check if we have new structure
if [ -f "/app/config/settings.py" ]; then
    # Check if it's our compatibility layer (contains "Compatibility Layer" in first 20 lines)
    if head -20 /app/config/settings.py | grep -q "Compatibility Layer"; then
        echo "✓ Using compatibility layer at config/settings.py"
    elif [ -d "/app/config/settings" ] && [ -f "/app/config/settings/__init__.py" ]; then
        echo "WARNING: Both old settings.py and new settings package exist"
        echo "The compatibility layer will handle this situation"
    else
        echo "✓ Using legacy settings.py (migration pending)"
    fi
fi

# Verify settings structure
if [ -d "/app/config/settings" ]; then
    echo "✓ Settings package structure found:"
    ls -la /app/config/settings/ | head -10
elif [ -f "/app/config/settings.py" ]; then
    echo "✓ Settings file found (compatibility mode)"
else
    echo "WARNING: No settings found! The application may fail to start."
    echo "Creating emergency settings..."
    # This shouldn't happen, but provide a fallback
    mkdir -p /app/config
    cat > /app/config/settings.py << 'EOF'
# Emergency fallback settings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY', 'emergency-key')
DEBUG = False
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]
ROOT_URLCONF = 'config.urls'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
EOF
fi

# Wait for database (with timeout)
if [ "$DATABASE_URL" ]; then
    echo "Waiting for database to be ready..."
    python << END
import sys
import time
import os

# Try to import psycopg2, but don't fail if it's not available
try:
    import psycopg2
    from urllib.parse import urlparse
    
    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url:
        print("No DATABASE_URL found, skipping database wait")
        sys.exit(0)
    
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
except ImportError:
    print("psycopg2 not installed, skipping database check")
    print("Database connectivity will be verified by Django")
except Exception as e:
    print(f"Error during database check: {str(e)}")
    print("Continuing without database check")
END
else
    echo "No DATABASE_URL configured, skipping database wait"
fi

# Run migrations (with error handling)
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "WARNING: Migrations failed. This might be expected during initial setup."
    echo "Error details above. The application will continue to start."
    
    # Try to at least create the database schema
    echo "Attempting to create initial database schema..."
    python manage.py migrate --run-syncdb --noinput || true
}

# Create superuser if configured and doesn't exist
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Checking for superuser..."
    python manage.py shell << END || true
from django.contrib.auth import get_user_model
import os

try:
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
except Exception as e:
    print(f"Could not create superuser: {e}")
END
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || {
    echo "WARNING: Static file collection failed"
    echo "The application will continue to start without static files."
}

# Ensure media directories exist
echo "Creating media directories..."
if [ -d "/data" ]; then
    mkdir -p /data/media/uploads /data/media/project_file /data/media/feedback_file
    echo "✓ Media directories created at /data/media"
else
    # Fallback to /app/media if /data doesn't exist
    mkdir -p /app/media/uploads /app/media/project_file /app/media/feedback_file
    echo "✓ Media directories created at /app/media (fallback)"
fi

# Print final configuration
echo "=========================================="
echo "Configuration Summary:"
python -c "
import os
import sys
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '$DJANGO_SETTINGS_MODULE')

try:
    import django
    django.setup()
    from django.conf import settings
    
    print(f'Settings Module: {os.environ.get(\"DJANGO_SETTINGS_MODULE\")}')
    print(f'Debug Mode: {settings.DEBUG}')
    print(f'Database Engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
    print(f'Static Root: {settings.STATIC_ROOT}')
    print(f'Media Root: {settings.MEDIA_ROOT}')
    print('✓ Django configuration loaded successfully')
except Exception as e:
    print(f'Warning: Could not load Django settings: {e}')
    print('The application will attempt to start anyway')
" || true
echo "=========================================="

# Start the application
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