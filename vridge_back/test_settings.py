#!/usr/bin/env python
"""
Test script to verify Django settings can be loaded without errors
"""

import os
import sys

def test_settings_import():
    """Test importing different settings modules"""
    
    print("=" * 60)
    print("Testing Django Settings Import")
    print("=" * 60)
    
    # Test 1: Import settings_production directly
    print("\n1. Testing direct import of settings_production...")
    try:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings_production'
        from config import settings_production
        print("   ✓ settings_production imported successfully")
    except ImportError as e:
        print(f"   ✗ Failed to import settings_production: {e}")
        return False
    
    # Test 2: Import through Django
    print("\n2. Testing Django settings initialization...")
    try:
        import django
        django.setup()
        from django.conf import settings
        print(f"   ✓ Django initialized with settings module: {settings.SETTINGS_MODULE}")
        print(f"   ✓ DEBUG={settings.DEBUG}")
        print(f"   ✓ ALLOWED_HOSTS={settings.ALLOWED_HOSTS}")
    except Exception as e:
        print(f"   ✗ Failed to initialize Django: {e}")
        return False
    
    # Test 3: Check for my_settings dependency
    print("\n3. Checking my_settings availability...")
    try:
        import my_settings
        print("   ✓ my_settings module found")
    except ImportError:
        print("   ⚠ my_settings module not found (this is OK for production)")
    
    # Test 4: Import base settings (this might fail, which is expected)
    print("\n4. Testing base settings import (might fail in production)...")
    try:
        from config import settings
        print("   ✓ Base settings imported")
    except Exception as e:
        print(f"   ⚠ Base settings import failed: {e}")
        print("   (This is expected if my_settings is not available)")
    
    print("\n" + "=" * 60)
    print("Settings test completed")
    print("=" * 60)
    return True

if __name__ == '__main__':
    # Add current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Set environment for production
    os.environ['RAILWAY_ENVIRONMENT'] = 'production'
    
    success = test_settings_import()
    sys.exit(0 if success else 1)