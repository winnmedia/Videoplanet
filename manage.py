#!/usr/bin/env python
"""
Django's command-line utility for administrative tasks.
Proxy to the actual manage.py in vridge_back directory.
"""
import os
import sys
import subprocess

if __name__ == '__main__':
    # Change to the Django project directory
    django_dir = os.path.join(os.path.dirname(__file__), 'vridge_back')
    manage_py = os.path.join(django_dir, 'manage.py')
    
    # Execute the actual manage.py with all arguments
    sys.exit(subprocess.call([sys.executable, manage_py] + sys.argv[1:]))