#!/bin/bash

# Backend Server Startup Script for VideoplaNet
# This script starts the Django backend server with proper environment settings

echo "🚀 Starting VideoplaNet Backend Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend directory
BACKEND_DIR="/home/winnmedia/Videoplanet/vridge_back"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    echo "Please ensure the Django backend is properly installed."
    exit 1
fi

cd "$BACKEND_DIR"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check for virtual environment
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
else
    echo -e "${YELLOW}Warning: No virtual environment found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    
    # Install requirements if they exist
    if [ -f "requirements.txt" ]; then
        echo "Installing dependencies..."
        pip install -r requirements.txt
    fi
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL client not found${NC}"
    echo "Using SQLite for development instead"
fi

# Apply migrations
echo "Applying database migrations..."
python manage.py migrate

# Create superuser if needed
echo "Checking for superuser..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(0 if User.objects.filter(is_superuser=True).exists() else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}No superuser found. Creating one...${NC}"
    python manage.py createsuperuser --noinput --username admin --email admin@videoplanet.com 2>/dev/null || true
    echo "Note: Set the admin password with: python manage.py changepassword admin"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the server
echo -e "${GREEN}✅ Starting Django development server on http://localhost:8000${NC}"
echo -e "${GREEN}✅ WebSocket endpoint: ws://localhost:8000/ws/dashboard/${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
python manage.py runserver 0.0.0.0:8000