"""
WSGI config proxy for VideoPlanet project.
Points to the actual WSGI application in vridge_back.
"""
import os
import sys

# Add the Django project directory to Python path
django_dir = os.path.join(os.path.dirname(__file__), 'vridge_back')
sys.path.insert(0, django_dir)

# Import the actual WSGI application
from config.wsgi import application