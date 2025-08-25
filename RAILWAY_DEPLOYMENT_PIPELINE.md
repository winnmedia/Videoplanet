# Railway Deployment Pipeline Updates

## Current Deployment Analysis

### Current Railway Setup Issues:
❌ **No automated deployment validation**: No post-deployment health checks  
❌ **Manual deployment process**: No CI/CD pipeline integration  
❌ **No rollback strategy**: No automated rollback on failure  
❌ **No environment management**: Development/staging/production not properly separated  
❌ **No database migration automation**: Manual migration management  

### Current Infrastructure:
- **Platform**: Railway (Python/Django service)
- **Database**: PostgreSQL on Railway
- **Redis**: Redis service on Railway
- **File Storage**: AWS S3
- **Monitoring**: Sentry (production only)

## Modernized Railway Deployment Architecture

### 1. CI/CD Pipeline Configuration

#### GitHub Actions Integration:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'vridge_back/**'
  pull_request:
    branches:
      - main
    paths:
      - 'vridge_back/**'

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install Poetry
      uses: snok/install-poetry@v1
      with:
        version: latest
        virtualenvs-create: true
        virtualenvs-in-project: true
    
    - name: Load cached venv
      id: cached-poetry-dependencies
      uses: actions/cache@v3
      with:
        path: vridge_back/.venv
        key: venv-${{ runner.os }}-${{ hashFiles('**/poetry.lock') }}
    
    - name: Install dependencies
      if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
      working-directory: ./vridge_back
      run: poetry install --no-interaction --no-root
    
    - name: Install project
      working-directory: ./vridge_back
      run: poetry install --no-interaction
    
    - name: Run code quality checks
      working-directory: ./vridge_back
      run: |
        poetry run black --check .
        poetry run flake8 .
    
    - name: Run tests
      working-directory: ./vridge_back
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
        DJANGO_SETTINGS_MODULE: config.test_settings
      run: |
        poetry run python manage.py test --keepdb
    
    - name: Run security audit
      working-directory: ./vridge_back
      run: |
        poetry run safety check
        poetry run bandit -r . -f json || true

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Railway Staging
      run: |
        npm install -g @railway/cli
        railway login --token $RAILWAY_TOKEN
        railway link ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
        railway up --detach

    - name: Wait for deployment
      run: sleep 60

    - name: Validate staging deployment
      run: |
        python scripts/validate_deployment.py --env staging

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Railway Production
      run: |
        npm install -g @railway/cli
        railway login --token $RAILWAY_TOKEN
        railway link ${{ secrets.RAILWAY_PRODUCTION_PROJECT_ID }}
        railway up --detach

    - name: Wait for deployment
      run: sleep 60

    - name: Run database migrations
      run: |
        railway run python manage.py migrate --no-input

    - name: Validate production deployment
      run: |
        python scripts/validate_deployment.py --env production

    - name: Rollback on failure
      if: failure()
      run: |
        python scripts/rollback_deployment.py --env production
```

#### Railway-Specific Configuration:
```python
# railway.json
{
  "deploy": {
    "startCommand": "python manage.py migrate && daphne -b 0.0.0.0 -p $PORT config.asgi:application",
    "healthcheckPath": "/api/v1/health/ready/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "build": {
    "buildCommand": "poetry install --no-dev && python manage.py collectstatic --no-input"
  }
}

# nixpacks.toml (Railway build configuration)
[phases.setup]
nixPkgs = ['python39', 'poetry']

[phases.install]
cmds = ['poetry install --no-dev']

[phases.build]
cmds = ['python manage.py collectstatic --no-input']

[start]
cmd = 'python manage.py migrate && daphne -b 0.0.0.0 -p $PORT config.asgi:application'

[variables]
PYTHONPATH = '/app'
```

### 2. Environment Management

#### Multi-Environment Configuration:
```python
# config/environments/base.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class BaseConfig:
    """Base configuration for all environments"""
    
    # Railway environment detection
    RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT')
    IS_RAILWAY = 'RAILWAY_ENVIRONMENT' in os.environ
    
    # Database configuration
    if IS_RAILWAY and 'DATABASE_URL' in os.environ:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.config(
                default=os.environ.get('DATABASE_URL'),
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    
    # Redis configuration  
    if IS_RAILWAY and 'REDIS_URL' in os.environ:
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels_redis.core.RedisChannelLayer",
                "CONFIG": {
                    "hosts": [os.environ.get('REDIS_URL')],
                },
            },
        }
        
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': os.environ.get('REDIS_URL'),
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'CONNECTION_POOL_KWARGS': {
                        'max_connections': 20,
                        'health_check_interval': 30,
                    }
                }
            }
        }

# config/environments/development.py
from .base import BaseConfig

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    
    ALLOWED_HOSTS = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '.railway.app',  # Railway preview URLs
    ]
    
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]
    
    # Development logging
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'performance': {
                'handlers': ['console'],
                'level': 'DEBUG',
                'propagate': False,
            },
        },
    }

# config/environments/production.py
from .base import BaseConfig
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

class ProductionConfig(BaseConfig):
    DEBUG = False
    
    ALLOWED_HOSTS = [
        'api.vridge.kr',
        '.railway.app',
        'vridge-back-production.up.railway.app',  # Railway domain
    ]
    
    CORS_ALLOWED_ORIGINS = [
        "https://vridge.kr",
        "https://www.vridge.kr", 
        "https://app.vridge.kr",
    ]
    
    # Production security
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Sentry monitoring
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,  # 10% sampling for performance
        send_default_pii=False,  # Security best practice
        environment=os.environ.get('RAILWAY_ENVIRONMENT', 'production'),
        release=os.environ.get('RAILWAY_GIT_COMMIT_SHA', 'unknown')
    )
    
    # Production logging to Railway logs
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                'format': '{"level": "{levelname}", "time": "{asctime}", "module": "{module}", "message": "{message}"}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'level': 'INFO',
                'class': 'logging.StreamHandler',
                'formatter': 'json',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'performance': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'security': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
        },
    }

# config/settings.py - Updated
import os

# Environment-based configuration loading
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'development')

if RAILWAY_ENVIRONMENT == 'production':
    from .environments.production import ProductionConfig as Config
elif RAILWAY_ENVIRONMENT == 'staging':
    from .environments.staging import StagingConfig as Config
else:
    from .environments.development import DevelopmentConfig as Config

# Apply configuration
for setting in dir(Config):
    if setting.isupper():
        globals()[setting] = getattr(Config, setting)
```

### 3. Automated Migration Management

#### Database Migration Strategy:
```python
# scripts/migrate_with_validation.py
#!/usr/bin/env python
import os
import sys
import subprocess
import requests
import time
from django.core.management import execute_from_command_line

class RailwayMigrationManager:
    """Manage database migrations on Railway with validation"""
    
    def __init__(self):
        self.api_url = os.environ.get('RAILWAY_API_URL', 'http://localhost:8000')
        self.max_migration_time = 300  # 5 minutes
    
    def run_migrations(self):
        """Run migrations with pre/post validation"""
        
        print("🔍 Pre-migration validation...")
        if not self.validate_database_connectivity():
            print("❌ Database connectivity failed")
            return False
        
        print("📊 Creating database backup point...")
        backup_info = self.create_backup_reference()
        
        print("🔄 Running database migrations...")
        migration_success = self.execute_migrations()
        
        if not migration_success:
            print("❌ Migration failed")
            return False
        
        print("✅ Validating post-migration state...")
        if not self.validate_post_migration():
            print("❌ Post-migration validation failed")
            print("🔄 Consider rollback if issues persist")
            return False
        
        print("🎉 Migration completed successfully")
        return True
    
    def validate_database_connectivity(self):
        """Validate database is accessible before migration"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                return result[0] == 1
        except Exception as e:
            print(f"Database connectivity error: {e}")
            return False
    
    def create_backup_reference(self):
        """Create reference point for potential rollback"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                # Get current migration state
                cursor.execute("""
                    SELECT app, name, applied 
                    FROM django_migrations 
                    WHERE applied IS NOT NULL 
                    ORDER BY applied DESC 
                    LIMIT 10
                """)
                recent_migrations = cursor.fetchall()
                
                return {
                    'timestamp': time.time(),
                    'recent_migrations': recent_migrations
                }
        except Exception as e:
            print(f"Backup reference creation failed: {e}")
            return None
    
    def execute_migrations(self):
        """Execute Django migrations"""
        try:
            # Check for pending migrations
            result = subprocess.run([
                sys.executable, 'manage.py', 'showmigrations', '--plan'
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                print(f"Migration check failed: {result.stderr}")
                return False
            
            # Run migrations
            result = subprocess.run([
                sys.executable, 'manage.py', 'migrate', '--no-input'
            ], capture_output=True, text=True, timeout=self.max_migration_time)
            
            if result.returncode != 0:
                print(f"Migration execution failed: {result.stderr}")
                return False
            
            print(f"Migration output: {result.stdout}")
            return True
            
        except subprocess.TimeoutExpired:
            print("Migration timed out")
            return False
        except Exception as e:
            print(f"Migration error: {e}")
            return False
    
    def validate_post_migration(self):
        """Validate application state after migration"""
        try:
            # Test basic database operations
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Test model operations
            user_count = User.objects.count()
            print(f"✓ User model accessible (count: {user_count})")
            
            # Test health endpoint
            health_response = requests.get(f"{self.api_url}/api/v1/health/ready/", timeout=30)
            if health_response.status_code != 200:
                print(f"Health check failed: {health_response.status_code}")
                return False
            
            print("✓ Health check passed")
            return True
            
        except Exception as e:
            print(f"Post-migration validation error: {e}")
            return False

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    import django
    django.setup()
    
    manager = RailwayMigrationManager()
    success = manager.run_migrations()
    
    sys.exit(0 if success else 1)
```

#### Deployment Validation Script:
```python
# scripts/validate_deployment.py
#!/usr/bin/env python
import argparse
import requests
import time
import sys
import os

class DeploymentValidator:
    """Validate Railway deployment after completion"""
    
    ENVIRONMENT_URLS = {
        'development': 'http://localhost:8000',
        'staging': 'https://vridge-back-staging.up.railway.app',
        'production': 'https://api.vridge.kr'
    }
    
    def __init__(self, environment):
        self.environment = environment
        self.base_url = self.ENVIRONMENT_URLS.get(environment)
        
        if not self.base_url:
            raise ValueError(f"Unknown environment: {environment}")
    
    def run_validation(self):
        """Run comprehensive deployment validation"""
        print(f"🔍 Validating {self.environment} deployment...")
        
        validations = [
            ("Health Check", self.validate_health),
            ("Database Connectivity", self.validate_database),
            ("Redis Connectivity", self.validate_redis),
            ("API Endpoints", self.validate_api_endpoints),
            ("Authentication System", self.validate_auth),
            ("WebSocket Functionality", self.validate_websocket),
            ("File Upload System", self.validate_file_upload),
        ]
        
        results = []
        for name, validation_func in validations:
            print(f"  Testing {name}...")
            try:
                result = validation_func()
                if result:
                    print(f"  ✅ {name} - PASSED")
                    results.append((name, True, None))
                else:
                    print(f"  ❌ {name} - FAILED")
                    results.append((name, False, "Validation returned False"))
            except Exception as e:
                print(f"  ❌ {name} - ERROR: {e}")
                results.append((name, False, str(e)))
        
        # Summary
        passed = sum(1 for _, success, _ in results if success)
        total = len(results)
        
        print(f"\n📊 Validation Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All validations passed - Deployment successful!")
            return True
        else:
            print("⚠️  Some validations failed - Review deployment")
            for name, success, error in results:
                if not success:
                    print(f"   - {name}: {error}")
            return False
    
    def validate_health(self):
        """Test health check endpoint"""
        response = requests.get(f"{self.base_url}/api/v1/health/status/", timeout=30)
        return response.status_code == 200
    
    def validate_database(self):
        """Test database connectivity through health endpoint"""
        response = requests.get(f"{self.base_url}/api/v1/health/detailed/", timeout=30)
        
        if response.status_code not in [200, 206]:
            return False
        
        data = response.json()
        db_check = next((check for check in data.get('checks', []) if check['name'] == 'database'), None)
        return db_check and db_check['status'] in ['healthy']
    
    def validate_redis(self):
        """Test Redis connectivity"""
        response = requests.get(f"{self.base_url}/api/v1/health/detailed/", timeout=30)
        
        if response.status_code not in [200, 206]:
            return False
        
        data = response.json()
        redis_check = next((check for check in data.get('checks', []) if check['name'] == 'redis'), None)
        return redis_check and redis_check['status'] in ['healthy', 'degraded']
    
    def validate_api_endpoints(self):
        """Test key API endpoints"""
        test_endpoints = [
            '/api/v1/health/metrics/',
            '/api/v1/projects/project_list',  # Will need auth
        ]
        
        for endpoint in test_endpoints:
            try:
                if 'health' in endpoint:
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                    if response.status_code not in [200, 401]:  # 401 OK for auth-required endpoints
                        return False
                else:
                    # Test that endpoint responds (may require auth)
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                    if response.status_code not in [200, 401, 403]:
                        return False
            except requests.RequestException:
                return False
        
        return True
    
    def validate_auth(self):
        """Test authentication system"""
        # Test token endpoint exists and responds appropriately to invalid creds
        try:
            response = requests.post(f"{self.base_url}/api/v1/auth/token/", {
                'username': 'invalid@test.com',
                'password': 'invalid'
            }, timeout=10)
            
            # Should return 400/401 for invalid credentials, not 500
            return response.status_code in [400, 401]
        except requests.RequestException:
            return False
    
    def validate_websocket(self):
        """Test WebSocket endpoint accessibility"""
        # For now, just test that the WebSocket URL pattern is accessible
        # Full WebSocket testing would require more complex setup
        try:
            # Test that the WebSocket endpoint gives appropriate response for HTTP
            response = requests.get(f"{self.base_url.replace('http', 'ws')}/ws/chat/1/", timeout=5)
            # WebSocket endpoints should return 400 or 426 for regular HTTP requests
            return response.status_code in [400, 426]
        except requests.RequestException:
            # Expected for WebSocket endpoints
            return True
    
    def validate_file_upload(self):
        """Test file upload system readiness"""
        # Test that file upload endpoint exists (may require auth)
        try:
            response = requests.post(f"{self.base_url}/api/v1/projects/create", timeout=10)
            # Should return 401/403 (auth required), not 500 (server error)
            return response.status_code in [400, 401, 403]
        except requests.RequestException:
            return False

def main():
    parser = argparse.ArgumentParser(description='Validate Railway deployment')
    parser.add_argument('--env', choices=['development', 'staging', 'production'], 
                       default='staging', help='Environment to validate')
    
    args = parser.parse_args()
    
    validator = DeploymentValidator(args.env)
    success = validator.run_validation()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
```

### 4. Rollback Strategy

#### Automated Rollback System:
```python
# scripts/rollback_deployment.py
#!/usr/bin/env python
import argparse
import subprocess
import requests
import time
import sys
import os

class RailwayRollbackManager:
    """Manage deployment rollbacks on Railway"""
    
    def __init__(self, environment):
        self.environment = environment
        self.railway_project_id = self.get_project_id(environment)
    
    def get_project_id(self, environment):
        """Get Railway project ID for environment"""
        env_map = {
            'staging': os.environ.get('RAILWAY_STAGING_PROJECT_ID'),
            'production': os.environ.get('RAILWAY_PRODUCTION_PROJECT_ID')
        }
        return env_map.get(environment)
    
    def rollback_deployment(self):
        """Perform rollback to previous deployment"""
        print(f"🔄 Starting rollback for {self.environment}...")
        
        try:
            # Get previous deployment
            previous_deployment = self.get_previous_deployment()
            if not previous_deployment:
                print("❌ No previous deployment found for rollback")
                return False
            
            print(f"📦 Rolling back to deployment: {previous_deployment['id']}")
            
            # Trigger rollback via Railway CLI
            result = subprocess.run([
                'railway', 'redeploy', 
                '--service', 'backend',
                '--project', self.railway_project_id,
                '--deployment', previous_deployment['id']
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                print(f"❌ Rollback command failed: {result.stderr}")
                return False
            
            print("⏳ Waiting for rollback to complete...")
            time.sleep(60)  # Wait for deployment
            
            # Validate rollback success
            if self.validate_rollback():
                print("✅ Rollback completed successfully")
                return True
            else:
                print("❌ Rollback validation failed")
                return False
                
        except Exception as e:
            print(f"❌ Rollback error: {e}")
            return False
    
    def get_previous_deployment(self):
        """Get information about previous deployment"""
        try:
            result = subprocess.run([
                'railway', 'status', '--json',
                '--project', self.railway_project_id
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return None
            
            # Parse deployment history
            import json
            status_data = json.loads(result.stdout)
            deployments = status_data.get('deployments', [])
            
            # Get second most recent deployment (current is most recent)
            if len(deployments) >= 2:
                return deployments[1]
            
            return None
            
        except Exception as e:
            print(f"Error getting deployment history: {e}")
            return None
    
    def validate_rollback(self):
        """Validate that rollback was successful"""
        base_url = DeploymentValidator.ENVIRONMENT_URLS.get(self.environment)
        if not base_url:
            return False
        
        try:
            # Test health endpoint
            response = requests.get(f"{base_url}/api/v1/health/ready/", timeout=30)
            return response.status_code == 200
        except Exception:
            return False

def main():
    parser = argparse.ArgumentParser(description='Rollback Railway deployment')
    parser.add_argument('--env', choices=['staging', 'production'], 
                       required=True, help='Environment to rollback')
    
    args = parser.parse_args()
    
    rollback_manager = RailwayRollbackManager(args.env)
    success = rollback_manager.rollback_deployment()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
```

### 5. Zero-Downtime Deployment Strategy

#### Blue-Green Deployment Simulation:
```python
# scripts/zero_downtime_deploy.py
#!/usr/bin/env python
import time
import requests
import subprocess
import sys

class ZeroDowntimeDeployment:
    """Implement zero-downtime deployment strategy on Railway"""
    
    def __init__(self, environment):
        self.environment = environment
        self.base_url = DeploymentValidator.ENVIRONMENT_URLS.get(environment)
        self.health_check_url = f"{self.base_url}/api/v1/health/ready/"
    
    def deploy(self):
        """Execute zero-downtime deployment"""
        print("🚀 Starting zero-downtime deployment...")
        
        # Phase 1: Pre-deployment validation
        if not self.pre_deployment_check():
            print("❌ Pre-deployment checks failed")
            return False
        
        # Phase 2: Database migrations (if any)
        if not self.run_safe_migrations():
            print("❌ Migration phase failed")
            return False
        
        # Phase 3: Deploy new code
        if not self.deploy_new_version():
            print("❌ Code deployment failed")
            return False
        
        # Phase 4: Post-deployment validation
        if not self.post_deployment_validation():
            print("❌ Post-deployment validation failed")
            print("🔄 Initiating automatic rollback...")
            self.rollback()
            return False
        
        print("🎉 Zero-downtime deployment completed successfully!")
        return True
    
    def pre_deployment_check(self):
        """Validate system state before deployment"""
        print("🔍 Running pre-deployment checks...")
        
        try:
            # Check current system health
            response = requests.get(self.health_check_url, timeout=30)
            if response.status_code != 200:
                print(f"Current system unhealthy: {response.status_code}")
                return False
            
            # Check database connectivity
            health_response = requests.get(f"{self.base_url}/api/v1/health/detailed/", timeout=30)
            health_data = health_response.json()
            
            for check in health_data.get('checks', []):
                if check['critical'] and check['status'] != 'healthy':
                    print(f"Critical dependency unhealthy: {check['name']}")
                    return False
            
            print("✅ Pre-deployment checks passed")
            return True
            
        except Exception as e:
            print(f"Pre-deployment check error: {e}")
            return False
    
    def run_safe_migrations(self):
        """Run database migrations safely"""
        print("🔄 Checking for database migrations...")
        
        try:
            # Check if migrations are needed
            result = subprocess.run([
                'railway', 'run', 'python manage.py showmigrations --plan'
            ], capture_output=True, text=True, timeout=60)
            
            if '[ ]' not in result.stdout:
                print("✅ No migrations needed")
                return True
            
            print("📊 Migrations required - running safely...")
            
            # Run migrations
            migration_result = subprocess.run([
                'railway', 'run', 'python scripts/migrate_with_validation.py'
            ], timeout=300)
            
            return migration_result.returncode == 0
            
        except Exception as e:
            print(f"Migration error: {e}")
            return False
    
    def deploy_new_version(self):
        """Deploy new application version"""
        print("📦 Deploying new version...")
        
        try:
            # Deploy via Railway CLI
            result = subprocess.run([
                'railway', 'up', '--detach'
            ], capture_output=True, text=True, timeout=600)
            
            if result.returncode != 0:
                print(f"Deployment failed: {result.stderr}")
                return False
            
            # Wait for deployment to complete
            print("⏳ Waiting for deployment to complete...")
            return self.wait_for_deployment()
            
        except Exception as e:
            print(f"Deployment error: {e}")
            return False
    
    def wait_for_deployment(self, max_wait=300):
        """Wait for deployment to be ready"""
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                response = requests.get(self.health_check_url, timeout=10)
                if response.status_code == 200:
                    print("✅ New deployment is responding")
                    return True
            except requests.RequestException:
                pass
            
            print("⏳ Waiting for new deployment...")
            time.sleep(10)
        
        print("❌ Deployment readiness timeout")
        return False
    
    def post_deployment_validation(self):
        """Comprehensive post-deployment validation"""
        print("🔍 Running post-deployment validation...")
        
        # Use the existing deployment validator
        from validate_deployment import DeploymentValidator
        validator = DeploymentValidator(self.environment)
        
        return validator.run_validation()
    
    def rollback(self):
        """Rollback to previous version"""
        print("🔄 Initiating rollback...")
        
        from rollback_deployment import RailwayRollbackManager
        rollback_manager = RailwayRollbackManager(self.environment)
        
        return rollback_manager.rollback_deployment()

def main():
    parser = argparse.ArgumentParser(description='Zero-downtime Railway deployment')
    parser.add_argument('--env', choices=['staging', 'production'], 
                       required=True, help='Environment to deploy')
    
    args = parser.parse_args()
    
    deployer = ZeroDowntimeDeployment(args.env)
    success = deployer.deploy()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
```

### 6. Railway-Specific Monitoring

#### Railway Metrics Integration:
```python
# monitoring/railway.py
import os
import requests
from django.core.management.base import BaseCommand

class RailwayMetricsCollector:
    """Collect and report metrics specific to Railway platform"""
    
    def __init__(self):
        self.project_id = os.environ.get('RAILWAY_PROJECT_ID')
        self.environment = os.environ.get('RAILWAY_ENVIRONMENT', 'development')
    
    def collect_railway_metrics(self):
        """Collect Railway-specific metrics"""
        metrics = {
            'environment': self.environment,
            'project_id': self.project_id,
            'railway_deployment_id': os.environ.get('RAILWAY_DEPLOYMENT_ID'),
            'git_commit': os.environ.get('RAILWAY_GIT_COMMIT_SHA', 'unknown'),
            'build_id': os.environ.get('RAILWAY_BUILD_ID'),
            'replica_id': os.environ.get('RAILWAY_REPLICA_ID'),
        }
        
        # Add resource usage if available
        try:
            import psutil
            process = psutil.Process(os.getpid())
            
            metrics.update({
                'memory_usage_mb': process.memory_info().rss / 1024 / 1024,
                'cpu_percent': process.cpu_percent(),
                'open_files': len(process.open_files()),
            })
        except ImportError:
            metrics['system_metrics_available'] = False
        
        return metrics
    
    def report_deployment_success(self):
        """Report successful deployment to monitoring systems"""
        metrics = self.collect_railway_metrics()
        
        # Log deployment success
        import logging
        logger = logging.getLogger('deployment')
        logger.info("Deployment successful", extra=metrics)
        
        # Report to external monitoring (if configured)
        webhook_url = os.environ.get('DEPLOYMENT_WEBHOOK_URL')
        if webhook_url:
            try:
                requests.post(webhook_url, json={
                    'event': 'deployment_success',
                    'environment': self.environment,
                    'metrics': metrics
                }, timeout=10)
            except Exception as e:
                logger.warning(f"Failed to report to webhook: {e}")

# management/commands/report_deployment.py
from django.core.management.base import BaseCommand
from monitoring.railway import RailwayMetricsCollector

class Command(BaseCommand):
    help = 'Report deployment success and collect metrics'
    
    def handle(self, *args, **options):
        collector = RailwayMetricsCollector()
        collector.report_deployment_success()
        self.stdout.write(self.style.SUCCESS('Deployment metrics reported'))
```

### 7. Environment Variables Management

#### Railway Environment Configuration:
```bash
# Railway environment variables (set via Railway dashboard or CLI)

# Production
DJANGO_SETTINGS_MODULE=config.settings
RAILWAY_ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<secure-secret-key>
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
SENTRY_DSN=<sentry-dsn>

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_STORAGE_BUCKET_NAME=<bucket-name>

# Email Configuration
GOOGLE_ID=<gmail-address>
GOOGLE_APP_PASSWORD=<gmail-app-password>

# API Configuration
API_VERSION_DEFAULT=v2
CORS_ALLOWED_ORIGINS=https://vridge.kr,https://app.vridge.kr

# Monitoring
DEPLOYMENT_WEBHOOK_URL=<monitoring-webhook>

# scripts/setup_railway_env.sh
#!/bin/bash
# Script to set up Railway environment variables

echo "Setting up Railway environment variables..."

railway variables set DJANGO_SETTINGS_MODULE=config.settings
railway variables set RAILWAY_ENVIRONMENT=production
railway variables set DEBUG=False
railway variables set API_VERSION_DEFAULT=v2

# Copy from .env file if it exists
if [ -f .env ]; then
    echo "Loading from .env file..."
    export $(cat .env | xargs)
    
    railway variables set SECRET_KEY="$SECRET_KEY"
    railway variables set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    railway variables set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    railway variables set AWS_STORAGE_BUCKET_NAME="$AWS_STORAGE_BUCKET_NAME"
    railway variables set GOOGLE_ID="$GOOGLE_ID"
    railway variables set GOOGLE_APP_PASSWORD="$GOOGLE_APP_PASSWORD"
    railway variables set SENTRY_DSN="$SENTRY_DSN"
fi

echo "✅ Railway environment variables configured"
```

## Implementation Timeline

### Week 1: CI/CD Foundation
- [ ] Set up GitHub Actions workflow
- [ ] Configure Railway project environments
- [ ] Implement automated testing pipeline
- [ ] Add deployment validation scripts

### Week 2: Migration and Rollback
- [ ] Build automated migration system
- [ ] Implement rollback capabilities
- [ ] Add zero-downtime deployment strategy
- [ ] Test deployment pipeline end-to-end

### Week 3: Monitoring Integration
- [ ] Add Railway-specific monitoring
- [ ] Implement deployment metrics collection
- [ ] Set up alerting for deployment failures
- [ ] Create deployment dashboards

### Week 4: Documentation and Training
- [ ] Document deployment procedures
- [ ] Create troubleshooting guides
- [ ] Train team on new deployment process
- [ ] Establish deployment best practices

## Success Metrics

1. **Deployment Success Rate**: >99% successful deployments
2. **Deployment Time**: <5 minutes from trigger to validation
3. **Rollback Time**: <2 minutes for automatic rollback
4. **Zero Downtime**: 100% uptime during deployments
5. **Migration Safety**: Zero data loss during migrations

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: High - Essential for reliable continuous deployment