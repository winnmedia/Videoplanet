#!/usr/bin/env python
"""
Test script to verify all import fixes work
Run this to ensure the deployment will succeed
"""

import os
import sys
import json
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all critical imports work"""
    print("=" * 60)
    print("TESTING IMPORT FIXES")
    print("=" * 60)
    
    results = []
    
    # Test 1: my_settings import
    print("\n1. Testing my_settings import...")
    try:
        import my_settings
        print("   ✓ my_settings imported successfully")
        results.append(('my_settings', True))
    except ImportError as e:
        print(f"   ✗ Failed to import my_settings: {e}")
        results.append(('my_settings', False))
    
    # Test 2: Check for Google OAuth JSON
    print("\n2. Checking for vridge_google_login.json...")
    json_path = Path('vridge_google_login.json')
    if json_path.exists():
        try:
            with open(json_path) as f:
                data = json.load(f)
            print("   ✓ vridge_google_login.json exists and is valid JSON")
            results.append(('google_json', True))
        except:
            print("   ⚠ vridge_google_login.json exists but is invalid")
            results.append(('google_json', False))
    else:
        print("   ✗ vridge_google_login.json not found")
        results.append(('google_json', False))
    
    # Test 3: Django settings import
    print("\n3. Testing Django settings import...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.conf import settings
        print("   ✓ Django settings imported successfully")
        results.append(('django_settings', True))
    except ImportError as e:
        print(f"   ✗ Failed to import Django settings: {e}")
        results.append(('django_settings', False))
    
    # Test 4: Check app directories
    print("\n4. Checking Django app directories...")
    apps = ['accounts', 'alarmtalk', 'core', 'materials', 'myinfo', 
            'notice', 'proposal', 'supports', 'vlahome', 'vlapartners']
    
    apps_exist = True
    for app in apps:
        if not Path(app).exists():
            print(f"   ✗ App directory '{app}' missing")
            apps_exist = False
    
    if apps_exist:
        print(f"   ✓ All {len(apps)} app directories exist")
    results.append(('app_dirs', apps_exist))
    
    # Test 5: Check settings structure
    print("\n5. Checking settings structure...")
    settings_files = [
        'config/__init__.py',
        'config/settings/__init__.py',
        'config/settings/base.py',
        'config/settings/railway.py'
    ]
    
    settings_ok = True
    for file_path in settings_files:
        if not Path(file_path).exists():
            print(f"   ✗ Missing: {file_path}")
            settings_ok = False
    
    if settings_ok:
        print("   ✓ Settings structure complete")
    results.append(('settings_structure', settings_ok))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    all_passed = all(result[1] for result in results)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    print("=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - Ready for deployment!")
    else:
        print("✗ SOME TESTS FAILED - Run pre-start.sh to fix issues")
    print("=" * 60)
    
    return all_passed

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)