#!/bin/bash
set -e

echo "Starting VideoPlanet Backend..."

# Wait for database
if [ "$DATABASE_URL" ]; then
    echo "Waiting for database..."
    python << END
import sys
import time
import psycopg2
from urllib.parse import urlparse

db_url = urlparse("$DATABASE_URL")
retries = 30

while retries > 0:
    try:
        conn = psycopg2.connect(
            host=db_url.hostname,
            port=db_url.port,
            user=db_url.username,
            password=db_url.password,
            database=db_url.path[1:]
        )
        conn.close()
        print("Database is ready!")
        break
    except psycopg2.OperationalError:
        retries -= 1
        print(f"Database not ready. Waiting... ({retries} retries left)")
        time.sleep(2)
else:
    print("Could not connect to database!")
    sys.exit(1)
END
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
python manage.py shell << END
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@videoplanet.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser {username} created!")
else:
    print(f"Superuser {username} already exists")
END

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"