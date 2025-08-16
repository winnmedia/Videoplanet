#!/bin/bash
# Railway startup script with health check debugging

echo "=========================================="
echo "Railway Deployment Starting"
echo "=========================================="
echo "Environment Variables:"
echo "  PORT: ${PORT:-Not set}"
echo "  DATABASE_URL: ${DATABASE_URL:+Set (hidden)}"
echo "  REDIS_URL: ${REDIS_URL:+Set (hidden)}"
echo "  RAILWAY_PUBLIC_DOMAIN: ${RAILWAY_PUBLIC_DOMAIN:-Not set}"
echo "  RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT:-Not set}"
echo "=========================================="

# Set startup phase flag
export STARTUP_PHASE=true
export HEALTH_CHECK_SIMPLE=true

echo "Running database migrations..."
# First ensure Django can load
python manage.py check --deploy --quiet || echo "Django check failed, continuing..."

# Run migrations with explicit ordering for better reliability
echo "Running content types migration first..."
python manage.py migrate contenttypes --noinput || echo "Content types migration failed, continuing..."

echo "Running auth migration..."
python manage.py migrate auth --noinput || echo "Auth migration failed, continuing..."

echo "Running admin migration..."
python manage.py migrate admin --noinput || echo "Admin migration failed, continuing..."

echo "Running all remaining migrations..."
python manage.py migrate --noinput || echo "Migration failed, continuing..."

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static collection failed, continuing..."

echo "Creating media directories..."
python manage.py ensure_media_dirs || echo "Media directory creation failed, continuing..."

# Clear startup phase flag after initialization
export STARTUP_PHASE=false

echo "=========================================="
echo "Starting Daphne server on port ${PORT:-8000}"
echo "=========================================="

# Start the server with the PORT environment variable
exec daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application