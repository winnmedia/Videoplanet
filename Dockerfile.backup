# Django Backend Dockerfile for Railway
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy entire project first
COPY . /app/

# Install Python dependencies
RUN cd vridge_back && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PYTHONPATH=/app/vridge_back
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Change to Django directory
WORKDIR /app/vridge_back

# Collect static files (with error handling)
RUN python manage.py collectstatic --noinput --clear || echo "Static files collection failed, continuing..."

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health/ || exit 1

# Start command with proper port binding
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p $PORT config.asgi:application"]