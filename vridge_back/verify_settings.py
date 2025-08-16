#!/usr/bin/env python
"""
Settings Configuration Verification Script
==========================================
This script verifies that the Django settings are properly configured
and can handle both old and new structures gracefully.

Author: Benjamin (Backend Lead)
Purpose: Validate settings migration and compatibility
"""

import os
import sys
import importlib.util
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def check_file_exists(path, description):
    """Check if a file exists and report status."""
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {description}: {path}")
    return exists

def check_module_import(module_name):
    """Try to import a module and report success/failure."""
    try:
        module = importlib.import_module(module_name)
        print(f"  ✓ Successfully imported: {module_name}")
        return True, module
    except ImportError as e:
        print(f"  ✗ Failed to import {module_name}: {e}")
        return False, None
    except Exception as e:
        print(f"  ✗ Unexpected error importing {module_name}: {e}")
        return False, None

def verify_settings_attributes(settings_module):
    """Verify that essential Django settings are present."""
    required_attrs = [
        'BASE_DIR', 'SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS',
        'INSTALLED_APPS', 'MIDDLEWARE', 'DATABASES',
        'STATIC_URL', 'STATIC_ROOT'
    ]
    
    print("\n3. Verifying Required Settings Attributes:")
    all_present = True
    for attr in required_attrs:
        if hasattr(settings_module, attr):
            value = getattr(settings_module, attr)
            # Don't print sensitive values
            if attr == 'SECRET_KEY':
                display_value = "***HIDDEN***"
            elif attr == 'DATABASES':
                display_value = f"{type(value).__name__} with {len(value)} entries"
            elif isinstance(value, (list, tuple)):
                display_value = f"{type(value).__name__} with {len(value)} items"
            else:
                display_value = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            print(f"  ✓ {attr}: {display_value}")
        else:
            print(f"  ✗ {attr}: NOT FOUND")
            all_present = False
    
    return all_present

def test_django_setup():
    """Try to setup Django and report any issues."""
    print("\n4. Testing Django Setup:")
    
    # Set Django settings module based on environment
    if not os.environ.get('DJANGO_SETTINGS_MODULE'):
        if os.path.exists('config/settings/__init__.py'):
            os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
        else:
            os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    try:
        import django
        django.setup()
        print(f"  ✓ Django setup successful")
        print(f"  ✓ Using settings: {os.environ['DJANGO_SETTINGS_MODULE']}")
        
        from django.conf import settings
        print(f"  ✓ DEBUG: {settings.DEBUG}")
        print(f"  ✓ Database: {settings.DATABASES['default']['ENGINE']}")
        return True
    except Exception as e:
        print(f"  ✗ Django setup failed: {e}")
        return False

def main():
    """Main verification routine."""
    print("=" * 60)
    print("Django Settings Configuration Verification")
    print("=" * 60)
    
    # Check current directory
    print(f"\nCurrent Directory: {os.getcwd()}")
    print(f"Python Path: {sys.path[:3]}...")
    
    # 1. Check file structure
    print("\n1. Checking File Structure:")
    
    # Check for settings files
    has_package = check_file_exists("config/settings/__init__.py", "Settings package")
    has_base = check_file_exists("config/settings/base.py", "Base settings")
    has_local = check_file_exists("config/settings/local.py", "Local settings")
    has_railway = check_file_exists("config/settings/railway.py", "Railway settings")
    has_compat = check_file_exists("config/settings.py", "Compatibility layer")
    has_my_settings = check_file_exists("my_settings.py", "Legacy my_settings")
    
    # 2. Test imports
    print("\n2. Testing Module Imports:")
    
    if has_compat:
        success, module = check_module_import("config.settings")
        if success:
            verify_settings_attributes(module)
    
    if has_package:
        check_module_import("config.settings.base")
        check_module_import("config.settings.local")
        check_module_import("config.settings.railway")
    
    # 3. Test Django setup
    django_ok = test_django_setup()
    
    # 4. Environment-specific tests
    print("\n5. Environment Detection:")
    if os.environ.get('RAILWAY_ENVIRONMENT'):
        print(f"  ✓ Railway environment detected: {os.environ['RAILWAY_ENVIRONMENT']}")
    elif os.environ.get('DATABASE_URL'):
        print("  ✓ Production database configured")
    else:
        print("  ✓ Local development environment")
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    if has_package and has_base:
        print("✓ New settings package structure is properly configured")
    
    if has_compat:
        print("✓ Compatibility layer is in place for smooth migration")
    
    if has_my_settings:
        print("✓ Legacy my_settings.py found (backward compatibility maintained)")
    
    if django_ok:
        print("✓ Django can successfully load and use the settings")
        print("\n✅ SETTINGS CONFIGURATION IS VALID AND WORKING")
    else:
        print("\n⚠️  Django setup failed - please check the errors above")
    
    print("=" * 60)
    
    return 0 if django_ok else 1

if __name__ == "__main__":
    sys.exit(main())