#!/bin/bash
set -e

echo "=========================================="
echo "RAILWAY DEPLOYMENT DIAGNOSTIC SCRIPT"
echo "=========================================="
echo "This script diagnoses and fixes deployment issues"
echo "=========================================="

# Print environment info
echo "Environment Information:"
echo "- Working Directory: $(pwd)"
echo "- User: $(whoami)"
echo "- Python: $(python --version 2>&1)"
echo "- Pip packages: $(pip list | wc -l) packages installed"
echo "=========================================="

# Check for critical files
echo "Checking critical files..."
FILES_TO_CHECK=(
    "/app/manage.py"
    "/app/config/__init__.py"
    "/app/config/settings.py"
    "/app/config/settings/__init__.py"
    "/app/config/settings/railway.py"
    "/app/my_settings.py"
    "/app/docker-entrypoint.sh"
    "/app/pre-start.sh"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists ($(stat -c%s "$file") bytes)"
    else
        echo "✗ $file MISSING!"
    fi
done

echo "=========================================="

# Check directory structure
echo "Directory structure:"
ls -la /app/ | head -20
echo "..."
echo "Config directory:"
ls -la /app/config/ 2>/dev/null || echo "Config directory not found"
echo "Settings directory:"
ls -la /app/config/settings/ 2>/dev/null || echo "Settings directory not found"

echo "=========================================="

# Test Django import
echo "Testing Django import..."
python << 'EOF'
import sys
import os

# Set up paths
sys.path.insert(0, '/app')

# Test various settings modules
modules_to_test = [
    'config.settings.railway',
    'config.settings',
    'config.settings.base'
]

for module in modules_to_test:
    try:
        os.environ['DJANGO_SETTINGS_MODULE'] = module
        import django
        django.setup()
        from django.conf import settings
        print(f"✓ {module} - SUCCESS")
        print(f"  - DEBUG: {settings.DEBUG}")
        print(f"  - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...")
        break
    except Exception as e:
        print(f"✗ {module} - FAILED: {str(e)[:100]}...")
EOF

echo "=========================================="

# Check for import errors
echo "Checking for import errors in settings..."
python -c "import sys; sys.path.insert(0, '/app'); from config.settings import railway" 2>&1 | head -20

echo "=========================================="
echo "Diagnostic complete. Check logs above for issues."
echo "=========================================="

# If all checks pass, start the application
exec /bin/bash /app/docker-entrypoint.sh