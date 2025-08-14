# Multi-stage build for production
FROM python:3.9-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.railway \
    PATH="/app/.venv/bin:$PATH"

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    ffmpeg \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r django && useradd -r -g django django

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=django:django . .

# CRITICAL: Remove old settings.py if it exists (must use settings package)
RUN rm -f /app/config/settings.py /app/config/my_settings.py /app/my_settings.py

# Verify settings package structure
RUN test -d /app/config/settings && \
    test -f /app/config/settings/__init__.py && \
    test -f /app/config/settings/base.py && \
    test -f /app/config/settings/railway.py && \
    echo "✓ Settings package structure verified" || \
    (echo "❌ ERROR: config/settings/ directory structure is missing!" && exit 1)

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R django:django /app && \
    chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER django

# Skip collectstatic during build - will run in entrypoint

# Health check - using simple endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/health/?simple=true || exit 1

# Expose port
EXPOSE 8000

# Start script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]