# VideoPlanet Security Implementation Guide

## 🔒 Security Architecture Overview

### Security Layers
1. **Network Security**: WAF, DDoS Protection, SSL/TLS
2. **Application Security**: Authentication, Authorization, Input Validation
3. **Data Security**: Encryption, Data Masking, Secure Storage
4. **Infrastructure Security**: Container Security, Secrets Management
5. **Monitoring & Compliance**: Audit Logs, SIEM, Compliance Checks

### Threat Model
- **External Threats**: SQL Injection, XSS, CSRF, DDoS
- **Internal Threats**: Privilege Escalation, Data Exfiltration
- **API Threats**: Broken Authentication, Excessive Data Exposure
- **File Upload Threats**: Malware, Path Traversal, Size Attacks

## 🔐 Authentication & Authorization

### 1. JWT Implementation with RSA

```python
# vridge_back/core/security/jwt_auth.py

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from datetime import datetime, timedelta
from django.conf import settings
from typing import Dict, Any, Optional
import redis
import hashlib

class SecureJWTService:
    """Enhanced JWT service with RSA signing and token management"""
    
    def __init__(self):
        self.private_key = self._load_private_key()
        self.public_key = self._load_public_key()
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.algorithm = 'RS256'
    
    def _load_private_key(self):
        """Load RSA private key for signing"""
        with open(settings.JWT_PRIVATE_KEY_PATH, 'rb') as key_file:
            return serialization.load_pem_private_key(
                key_file.read(),
                password=settings.JWT_KEY_PASSWORD.encode(),
                backend=default_backend()
            )
    
    def _load_public_key(self):
        """Load RSA public key for verification"""
        with open(settings.JWT_PUBLIC_KEY_PATH, 'rb') as key_file:
            return serialization.load_pem_public_key(
                key_file.read(),
                backend=default_backend()
            )
    
    def generate_tokens(self, user) -> Dict[str, str]:
        """Generate access and refresh tokens"""
        # Token IDs for tracking
        access_jti = self._generate_jti()
        refresh_jti = self._generate_jti()
        
        # Access token payload
        access_payload = {
            'user_id': str(user.id),
            'email': user.email,
            'username': user.username,
            'roles': self._get_user_roles(user),
            'exp': datetime.utcnow() + timedelta(minutes=15),
            'iat': datetime.utcnow(),
            'jti': access_jti,
            'type': 'access'
        }
        
        # Refresh token payload
        refresh_payload = {
            'user_id': str(user.id),
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow(),
            'jti': refresh_jti,
            'type': 'refresh'
        }
        
        # Sign tokens
        access_token = jwt.encode(
            access_payload,
            self.private_key,
            algorithm=self.algorithm
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            self.private_key,
            algorithm=self.algorithm
        )
        
        # Store token metadata in Redis for tracking
        self._store_token_metadata(access_jti, user.id, 'access', 900)
        self._store_token_metadata(refresh_jti, user.id, 'refresh', 604800)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 900
        }
    
    def verify_token(self, token: str, token_type: str = 'access') -> Optional[Dict]:
        """Verify and decode JWT token"""
        try:
            # Decode token
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm]
            )
            
            # Verify token type
            if payload.get('type') != token_type:
                return None
            
            # Check if token is blacklisted
            if self._is_blacklisted(payload['jti']):
                return None
            
            # Check if token exists in Redis
            if not self._token_exists(payload['jti']):
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Generate new access token from refresh token"""
        payload = self.verify_token(refresh_token, 'refresh')
        
        if not payload:
            return None
        
        # Get user
        from users.models import User
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return None
        
        # Generate new access token only
        access_jti = self._generate_jti()
        
        access_payload = {
            'user_id': str(user.id),
            'email': user.email,
            'username': user.username,
            'roles': self._get_user_roles(user),
            'exp': datetime.utcnow() + timedelta(minutes=15),
            'iat': datetime.utcnow(),
            'jti': access_jti,
            'type': 'access'
        }
        
        access_token = jwt.encode(
            access_payload,
            self.private_key,
            algorithm=self.algorithm
        )
        
        # Store new token metadata
        self._store_token_metadata(access_jti, user.id, 'access', 900)
        
        return {
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 900
        }
    
    def revoke_token(self, token: str):
        """Revoke a token by blacklisting"""
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm],
                options={"verify_exp": False}
            )
            
            # Add to blacklist
            self._blacklist_token(payload['jti'], payload['exp'])
            
            # Remove from active tokens
            self.redis_client.delete(f"token:{payload['jti']}")
            
        except jwt.InvalidTokenError:
            pass
    
    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        # Get all user tokens
        pattern = f"token:*:user:{user_id}"
        for key in self.redis_client.scan_iter(match=pattern):
            token_jti = key.decode().split(':')[1]
            self._blacklist_token(token_jti, 0)
            self.redis_client.delete(key)
    
    def _generate_jti(self) -> str:
        """Generate unique token ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _get_user_roles(self, user) -> List[str]:
        """Get user roles for authorization"""
        roles = ['user']
        
        if user.is_staff:
            roles.append('staff')
        if user.is_superuser:
            roles.append('admin')
        
        # Add project-specific roles
        from projects.models import Member
        memberships = Member.objects.filter(user=user).values_list('role', flat=True)
        roles.extend(memberships)
        
        return list(set(roles))
    
    def _store_token_metadata(self, jti: str, user_id: str, token_type: str, ttl: int):
        """Store token metadata in Redis"""
        key = f"token:{jti}"
        metadata = {
            'user_id': str(user_id),
            'type': token_type,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.redis_client.setex(
            key,
            ttl,
            json.dumps(metadata)
        )
        
        # Also store user->token mapping for bulk revocation
        user_key = f"token:{jti}:user:{user_id}"
        self.redis_client.setex(user_key, ttl, "1")
    
    def _token_exists(self, jti: str) -> bool:
        """Check if token exists in Redis"""
        return self.redis_client.exists(f"token:{jti}")
    
    def _blacklist_token(self, jti: str, exp: int):
        """Add token to blacklist"""
        ttl = max(exp - int(datetime.utcnow().timestamp()), 86400)  # Min 1 day
        self.redis_client.setex(f"blacklist:{jti}", ttl, "1")
    
    def _is_blacklisted(self, jti: str) -> bool:
        """Check if token is blacklisted"""
        return self.redis_client.exists(f"blacklist:{jti}")
```

### 2. Role-Based Access Control (RBAC)

```python
# vridge_back/core/security/rbac.py

from typing import List, Dict, Any
from functools import wraps
from django.http import JsonResponse
from rest_framework import status

class RBACService:
    """Role-Based Access Control service"""
    
    # Permission matrix
    PERMISSIONS = {
        'admin': ['*'],  # All permissions
        'project_owner': [
            'project:read', 'project:write', 'project:delete',
            'member:invite', 'member:remove',
            'feedback:read', 'feedback:write', 'feedback:delete',
            'settings:read', 'settings:write'
        ],
        'project_admin': [
            'project:read', 'project:write',
            'member:invite',
            'feedback:read', 'feedback:write', 'feedback:delete',
            'settings:read', 'settings:write'
        ],
        'project_editor': [
            'project:read',
            'feedback:read', 'feedback:write',
            'comment:read', 'comment:write'
        ],
        'project_viewer': [
            'project:read',
            'feedback:read',
            'comment:read'
        ],
        'user': [
            'profile:read', 'profile:write'
        ]
    }
    
    @classmethod
    def has_permission(cls, user_roles: List[str], required_permission: str) -> bool:
        """Check if user has required permission"""
        # Admin has all permissions
        if 'admin' in user_roles:
            return True
        
        # Check each role
        for role in user_roles:
            permissions = cls.PERMISSIONS.get(role, [])
            
            # Check wildcard
            if '*' in permissions:
                return True
            
            # Check specific permission
            if required_permission in permissions:
                return True
            
            # Check permission prefix (e.g., 'project:*' matches 'project:read')
            permission_prefix = required_permission.split(':')[0]
            if f"{permission_prefix}:*" in permissions:
                return True
        
        return False
    
    @classmethod
    def get_user_permissions(cls, user_roles: List[str]) -> List[str]:
        """Get all permissions for user roles"""
        permissions = set()
        
        for role in user_roles:
            role_permissions = cls.PERMISSIONS.get(role, [])
            permissions.update(role_permissions)
        
        return list(permissions)

def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Get user roles from JWT token
            user_roles = getattr(request, 'user_roles', [])
            
            # Check permission
            if not RBACService.has_permission(user_roles, permission):
                return JsonResponse(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def require_project_permission(permission: str):
    """Decorator to require project-specific permission"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, project_id, *args, **kwargs):
            # Get user's role in project
            from projects.models import Project, Member
            
            user = request.user
            
            # Check if owner
            try:
                project = Project.objects.get(id=project_id)
                if project.user == user:
                    user_role = 'project_owner'
                else:
                    # Check membership
                    member = Member.objects.get(project_id=project_id, user=user)
                    user_role = f"project_{member.role}"
            except (Project.DoesNotExist, Member.DoesNotExist):
                return JsonResponse(
                    {'error': 'Project not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permission
            if not RBACService.has_permission([user_role], permission):
                return JsonResponse(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Add project and role to request
            request.project = project
            request.project_role = user_role
            
            return view_func(request, project_id, *args, **kwargs)
        return wrapper
    return decorator
```

### 3. OAuth2 Implementation

```python
# vridge_back/core/security/oauth2.py

import requests
from typing import Dict, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class OAuth2Service:
    """OAuth2 integration service"""
    
    PROVIDERS = {
        'google': {
            'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_url': 'https://oauth2.googleapis.com/token',
            'user_info_url': 'https://www.googleapis.com/oauth2/v1/userinfo',
            'scopes': ['openid', 'email', 'profile']
        },
        'kakao': {
            'auth_url': 'https://kauth.kakao.com/oauth/authorize',
            'token_url': 'https://kauth.kakao.com/oauth/token',
            'user_info_url': 'https://kapi.kakao.com/v2/user/me',
            'scopes': ['profile', 'account_email']
        },
        'naver': {
            'auth_url': 'https://nid.naver.com/oauth2.0/authorize',
            'token_url': 'https://nid.naver.com/oauth2.0/token',
            'user_info_url': 'https://openapi.naver.com/v1/nid/me',
            'scopes': ['profile', 'email']
        }
    }
    
    def get_authorization_url(self, provider: str, state: str) -> str:
        """Generate OAuth2 authorization URL"""
        config = self.PROVIDERS.get(provider)
        if not config:
            raise ValueError(f"Unknown provider: {provider}")
        
        params = {
            'client_id': settings.OAUTH_CREDENTIALS[provider]['client_id'],
            'redirect_uri': settings.OAUTH_CREDENTIALS[provider]['redirect_uri'],
            'response_type': 'code',
            'scope': ' '.join(config['scopes']),
            'state': state
        }
        
        # Provider-specific parameters
        if provider == 'google':
            params['access_type'] = 'offline'
            params['prompt'] = 'consent'
        
        # Build URL
        from urllib.parse import urlencode
        return f"{config['auth_url']}?{urlencode(params)}"
    
    def exchange_code_for_token(self, provider: str, code: str) -> Optional[Dict]:
        """Exchange authorization code for access token"""
        config = self.PROVIDERS.get(provider)
        if not config:
            return None
        
        data = {
            'client_id': settings.OAUTH_CREDENTIALS[provider]['client_id'],
            'client_secret': settings.OAUTH_CREDENTIALS[provider]['client_secret'],
            'redirect_uri': settings.OAUTH_CREDENTIALS[provider]['redirect_uri'],
            'code': code,
            'grant_type': 'authorization_code'
        }
        
        try:
            response = requests.post(config['token_url'], data=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"OAuth token exchange failed: {e}")
            return None
    
    def get_user_info(self, provider: str, access_token: str) -> Optional[Dict]:
        """Get user information from OAuth provider"""
        config = self.PROVIDERS.get(provider)
        if not config:
            return None
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        try:
            response = requests.get(config['user_info_url'], headers=headers)
            response.raise_for_status()
            
            # Normalize user data
            raw_data = response.json()
            return self._normalize_user_data(provider, raw_data)
            
        except requests.RequestException as e:
            logger.error(f"Failed to get user info: {e}")
            return None
    
    def _normalize_user_data(self, provider: str, raw_data: Dict) -> Dict:
        """Normalize user data across different providers"""
        if provider == 'google':
            return {
                'provider': 'google',
                'provider_id': raw_data['id'],
                'email': raw_data['email'],
                'name': raw_data.get('name'),
                'picture': raw_data.get('picture'),
                'verified_email': raw_data.get('verified_email', False)
            }
        
        elif provider == 'kakao':
            kakao_account = raw_data.get('kakao_account', {})
            profile = kakao_account.get('profile', {})
            
            return {
                'provider': 'kakao',
                'provider_id': str(raw_data['id']),
                'email': kakao_account.get('email'),
                'name': profile.get('nickname'),
                'picture': profile.get('profile_image_url'),
                'verified_email': kakao_account.get('is_email_verified', False)
            }
        
        elif provider == 'naver':
            response = raw_data.get('response', {})
            
            return {
                'provider': 'naver',
                'provider_id': response['id'],
                'email': response.get('email'),
                'name': response.get('name'),
                'picture': response.get('profile_image'),
                'verified_email': True  # Naver requires email verification
            }
        
        return raw_data
```

## 🛡️ Input Validation & Sanitization

### 1. Request Validation

```python
# vridge_back/core/security/validators.py

import re
import magic
from typing import Any, Dict, List
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, EmailValidator
from rest_framework import serializers
import bleach
import html

class SecureValidators:
    """Security-focused validators"""
    
    # Regex patterns for validation
    PATTERNS = {
        'username': r'^[a-zA-Z0-9_-]{3,30}$',
        'project_name': r'^[\w\s\-\.가-힣]{1,200}$',
        'safe_text': r'^[^<>&"\'`]*$',
        'url': r'^https?://[\w\-\.]+(:\d+)?(/[\w\-\./?%&=]*)?$',
        'filename': r'^[\w\-\.]+\.(jpg|jpeg|png|gif|pdf|mp4|mov|avi)$'
    }
    
    @classmethod
    def validate_username(cls, value: str) -> str:
        """Validate username"""
        if not re.match(cls.PATTERNS['username'], value):
            raise ValidationError(
                'Username must be 3-30 characters, alphanumeric, underscore, or hyphen only'
            )
        
        # Check for reserved usernames
        reserved = ['admin', 'api', 'root', 'system', 'www']
        if value.lower() in reserved:
            raise ValidationError('This username is reserved')
        
        return value
    
    @classmethod
    def validate_email(cls, value: str) -> str:
        """Validate email with additional checks"""
        # Basic email validation
        validator = EmailValidator()
        validator(value)
        
        # Check for disposable email domains
        disposable_domains = [
            'tempmail.com', 'throwaway.email', 'guerrillamail.com',
            '10minutemail.com', 'mailinator.com'
        ]
        
        domain = value.split('@')[1].lower()
        if domain in disposable_domains:
            raise ValidationError('Disposable email addresses are not allowed')
        
        return value.lower()
    
    @classmethod
    def sanitize_html(cls, value: str, allowed_tags: List[str] = None) -> str:
        """Sanitize HTML content"""
        if allowed_tags is None:
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
        
        allowed_attributes = {
            'a': ['href', 'title', 'target']
        }
        
        # Clean HTML
        cleaned = bleach.clean(
            value,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
        
        # Additional sanitization
        cleaned = html.escape(cleaned, quote=False)
        
        return cleaned
    
    @classmethod
    def validate_file_upload(cls, file) -> None:
        """Validate uploaded file"""
        # Check file size
        max_size = 500 * 1024 * 1024  # 500MB
        if file.size > max_size:
            raise ValidationError(f'File size exceeds maximum of {max_size/1024/1024}MB')
        
        # Check file type using python-magic
        file_mime = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)  # Reset file pointer
        
        allowed_mimes = {
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/x-msvideo',
            'application/pdf'
        }
        
        if file_mime not in allowed_mimes:
            raise ValidationError(f'File type {file_mime} is not allowed')
        
        # Check filename
        if not re.match(cls.PATTERNS['filename'], file.name):
            raise ValidationError('Invalid filename')
        
        # Scan for malware (integrate with ClamAV or similar)
        # cls._scan_for_malware(file)
    
    @classmethod
    def validate_json_input(cls, data: Dict[str, Any], schema: Dict) -> Dict:
        """Validate JSON input against schema"""
        from jsonschema import validate, ValidationError as JSONSchemaError
        
        try:
            validate(instance=data, schema=schema)
            return data
        except JSONSchemaError as e:
            raise ValidationError(f'Invalid JSON structure: {e.message}')
    
    @classmethod
    def prevent_sql_injection(cls, value: str) -> str:
        """Prevent SQL injection attempts"""
        # Block common SQL injection patterns
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE)\b)",
            r"(--|#|\/\*|\*\/)",
            r"(\bOR\b\s*\d+\s*=\s*\d+)",
            r"(\bAND\b\s*\d+\s*=\s*\d+)",
            r"('|\"|;|\\x00|\\n|\\r|\\x1a)"
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError('Potential SQL injection detected')
        
        return value
    
    @classmethod
    def prevent_xss(cls, value: str) -> str:
        """Prevent XSS attacks"""
        # Check for script tags and event handlers
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
            r'<embed[^>]*>',
            r'<object[^>]*>'
        ]
        
        for pattern in xss_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError('Potential XSS attack detected')
        
        # Escape special characters
        return html.escape(value)

# Serializer with built-in validation
class SecureModelSerializer(serializers.ModelSerializer):
    """Base serializer with security validations"""
    
    def validate(self, attrs):
        """Apply security validations to all fields"""
        for field_name, value in attrs.items():
            if isinstance(value, str):
                # Apply XSS prevention
                attrs[field_name] = SecureValidators.prevent_xss(value)
                
                # Apply SQL injection prevention
                attrs[field_name] = SecureValidators.prevent_sql_injection(value)
        
        return super().validate(attrs)
```

### 2. Rate Limiting Implementation

```python
# vridge_back/core/security/rate_limiting.py

from django.core.cache import cache
from django.http import JsonResponse
from functools import wraps
import hashlib
import time
from typing import Callable, Optional
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Advanced rate limiting with multiple strategies"""
    
    def __init__(self):
        self.strategies = {
            'fixed_window': self.fixed_window_check,
            'sliding_window': self.sliding_window_check,
            'token_bucket': self.token_bucket_check,
            'leaky_bucket': self.leaky_bucket_check
        }
    
    def fixed_window_check(self, key: str, limit: int, window: int) -> bool:
        """Fixed window rate limiting"""
        current_minute = int(time.time() / window)
        cache_key = f"rate:fixed:{key}:{current_minute}"
        
        current_count = cache.get(cache_key, 0)
        if current_count >= limit:
            return False
        
        cache.set(cache_key, current_count + 1, window)
        return True
    
    def sliding_window_check(self, key: str, limit: int, window: int) -> bool:
        """Sliding window rate limiting using Redis sorted sets"""
        import redis
        r = redis.from_url(cache._cache.connection_pool.connection_kwargs['url'])
        
        now = time.time()
        cache_key = f"rate:sliding:{key}"
        
        # Remove old entries
        r.zremrangebyscore(cache_key, 0, now - window)
        
        # Count current entries
        current_count = r.zcard(cache_key)
        if current_count >= limit:
            return False
        
        # Add new entry
        r.zadd(cache_key, {str(now): now})
        r.expire(cache_key, window)
        
        return True
    
    def token_bucket_check(self, key: str, capacity: int, refill_rate: float) -> bool:
        """Token bucket rate limiting"""
        cache_key = f"rate:token:{key}"
        
        # Get current bucket state
        bucket = cache.get(cache_key, {
            'tokens': capacity,
            'last_refill': time.time()
        })
        
        # Refill tokens
        now = time.time()
        time_passed = now - bucket['last_refill']
        tokens_to_add = time_passed * refill_rate
        
        bucket['tokens'] = min(capacity, bucket['tokens'] + tokens_to_add)
        bucket['last_refill'] = now
        
        # Check if token available
        if bucket['tokens'] < 1:
            cache.set(cache_key, bucket, 3600)
            return False
        
        # Consume token
        bucket['tokens'] -= 1
        cache.set(cache_key, bucket, 3600)
        
        return True
    
    def leaky_bucket_check(self, key: str, capacity: int, leak_rate: float) -> bool:
        """Leaky bucket rate limiting"""
        cache_key = f"rate:leaky:{key}"
        
        # Get current bucket state
        bucket = cache.get(cache_key, {
            'volume': 0,
            'last_leak': time.time()
        })
        
        # Leak water
        now = time.time()
        time_passed = now - bucket['last_leak']
        leaked = time_passed * leak_rate
        
        bucket['volume'] = max(0, bucket['volume'] - leaked)
        bucket['last_leak'] = now
        
        # Check if bucket can accept more
        if bucket['volume'] >= capacity:
            cache.set(cache_key, bucket, 3600)
            return False
        
        # Add to bucket
        bucket['volume'] += 1
        cache.set(cache_key, bucket, 3600)
        
        return True

def rate_limit(
    limit: int = 100,
    window: int = 60,
    strategy: str = 'sliding_window',
    key_func: Optional[Callable] = None,
    error_message: str = "Rate limit exceeded"
):
    """Rate limiting decorator"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func(request)
            else:
                # Default key based on user or IP
                if request.user.is_authenticated:
                    key = f"user:{request.user.id}"
                else:
                    key = f"ip:{get_client_ip(request)}"
            
            # Apply rate limiting
            limiter = RateLimiter()
            strategy_func = limiter.strategies.get(strategy)
            
            if not strategy_func(key, limit, window):
                logger.warning(f"Rate limit exceeded for {key}")
                
                return JsonResponse({
                    'error': error_message,
                    'retry_after': window
                }, status=429, headers={
                    'X-RateLimit-Limit': str(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': str(int(time.time()) + window),
                    'Retry-After': str(window)
                })
            
            # Add rate limit headers
            response = view_func(request, *args, **kwargs)
            response['X-RateLimit-Limit'] = str(limit)
            # response['X-RateLimit-Remaining'] = str(remaining)  # Calculate remaining
            
            return response
        return wrapper
    return decorator

def get_client_ip(request) -> str:
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    # Hash IP for privacy
    return hashlib.md5(ip.encode()).hexdigest()

# Endpoint-specific rate limits
class EndpointRateLimits:
    """Predefined rate limits for different endpoints"""
    
    LIMITS = {
        # Authentication endpoints
        'auth:login': (5, 300, 'sliding_window'),  # 5 attempts per 5 minutes
        'auth:register': (3, 3600, 'fixed_window'),  # 3 per hour
        'auth:password_reset': (3, 3600, 'fixed_window'),  # 3 per hour
        
        # API endpoints
        'api:read': (1000, 3600, 'token_bucket'),  # 1000 per hour
        'api:write': (100, 3600, 'token_bucket'),  # 100 per hour
        'api:delete': (10, 3600, 'fixed_window'),  # 10 per hour
        
        # File uploads
        'upload:video': (5, 3600, 'fixed_window'),  # 5 per hour
        'upload:image': (20, 3600, 'sliding_window'),  # 20 per hour
        
        # AI generation
        'ai:generate': (10, 3600, 'token_bucket'),  # 10 per hour
        
        # WebSocket
        'ws:connect': (5, 60, 'fixed_window'),  # 5 connections per minute
        'ws:message': (100, 60, 'leaky_bucket'),  # 100 messages per minute
    }
    
    @classmethod
    def get_limit(cls, endpoint: str):
        """Get rate limit for endpoint"""
        return cls.LIMITS.get(endpoint, (100, 60, 'sliding_window'))
```

## 🔐 Data Security

### 1. Encryption Implementation

```python
# vridge_back/core/security/encryption.py

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from django.conf import settings
import base64
import os
from typing import Union

class EncryptionService:
    """Data encryption service"""
    
    def __init__(self):
        self.key = self._derive_key()
        self.cipher = Fernet(self.key)
    
    def _derive_key(self) -> bytes:
        """Derive encryption key from master key"""
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=settings.ENCRYPTION_SALT.encode(),
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(settings.MASTER_KEY.encode())
        )
        return key
    
    def encrypt(self, data: Union[str, bytes]) -> str:
        """Encrypt data"""
        if isinstance(data, str):
            data = data.encode()
        
        encrypted = self.cipher.encrypt(data)
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt data"""
        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception:
            raise ValueError("Decryption failed")
    
    def encrypt_file(self, file_path: str) -> str:
        """Encrypt file and return encrypted path"""
        encrypted_path = f"{file_path}.encrypted"
        
        with open(file_path, 'rb') as f:
            data = f.read()
        
        encrypted_data = self.cipher.encrypt(data)
        
        with open(encrypted_path, 'wb') as f:
            f.write(encrypted_data)
        
        # Securely delete original file
        self._secure_delete(file_path)
        
        return encrypted_path
    
    def decrypt_file(self, encrypted_path: str) -> str:
        """Decrypt file and return decrypted path"""
        decrypted_path = encrypted_path.replace('.encrypted', '')
        
        with open(encrypted_path, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted_data = self.cipher.decrypt(encrypted_data)
        
        with open(decrypted_path, 'wb') as f:
            f.write(decrypted_data)
        
        return decrypted_path
    
    def _secure_delete(self, file_path: str):
        """Securely delete file by overwriting"""
        file_size = os.path.getsize(file_path)
        
        with open(file_path, 'ba+', buffering=0) as f:
            # Overwrite with random data 3 times
            for _ in range(3):
                f.seek(0)
                f.write(os.urandom(file_size))
        
        os.remove(file_path)

# Django model field for encrypted data
from django.db import models

class EncryptedTextField(models.TextField):
    """Encrypted text field for Django models"""
    
    def __init__(self, *args, **kwargs):
        self.encryption_service = EncryptionService()
        super().__init__(*args, **kwargs)
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return self.encryption_service.decrypt(value)
    
    def to_python(self, value):
        if value is None or isinstance(value, str):
            return value
        return self.encryption_service.decrypt(value)
    
    def get_prep_value(self, value):
        if value is None:
            return value
        return self.encryption_service.encrypt(value)
```

### 2. Secure File Storage

```python
# vridge_back/core/security/secure_storage.py

import os
import hashlib
import uuid
from typing import Optional, Tuple
from django.core.files.storage import Storage
from django.core.files import File
import boto3
from botocore.exceptions import ClientError
import magic

class SecureS3Storage(Storage):
    """Secure S3 storage with encryption and access control"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.encryption_service = EncryptionService()
    
    def _generate_secure_filename(self, filename: str) -> str:
        """Generate secure filename"""
        # Extract extension
        ext = os.path.splitext(filename)[1]
        
        # Generate UUID-based name
        secure_name = f"{uuid.uuid4()}{ext}"
        
        # Add timestamp prefix for organization
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y/%m/%d')
        
        return f"{timestamp}/{secure_name}"
    
    def _scan_for_malware(self, file_content: bytes) -> bool:
        """Scan file for malware using ClamAV"""
        # Integration with ClamAV or other antivirus
        # For now, just check file magic
        file_type = magic.from_buffer(file_content, mime=True)
        
        # Block executable files
        blocked_types = [
            'application/x-executable',
            'application/x-dosexec',
            'application/x-msdownload',
            'application/x-msi'
        ]
        
        return file_type not in blocked_types
    
    def save(self, name: str, content: File, max_length: Optional[int] = None) -> str:
        """Save file securely to S3"""
        # Read file content
        content.seek(0)
        file_content = content.read()
        
        # Scan for malware
        if not self._scan_for_malware(file_content):
            raise ValueError("File failed security scan")
        
        # Generate secure filename
        secure_name = self._generate_secure_filename(name)
        
        # Calculate file hash for integrity
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Upload to S3 with encryption
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=secure_name,
                Body=file_content,
                ServerSideEncryption='AES256',
                Metadata={
                    'original_name': name,
                    'file_hash': file_hash,
                    'upload_date': str(datetime.now())
                },
                ContentType=magic.from_buffer(file_content, mime=True),
                # Add object lock for compliance
                ObjectLockMode='GOVERNANCE',
                ObjectLockRetainUntilDate=datetime.now() + timedelta(days=30)
            )
            
            return secure_name
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise
    
    def url(self, name: str) -> str:
        """Generate presigned URL for secure access"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': name},
                ExpiresIn=3600  # 1 hour expiry
            )
            return url
        except ClientError:
            return ""
    
    def delete(self, name: str):
        """Securely delete file from S3"""
        try:
            # Check if object lock allows deletion
            response = self.s3_client.get_object_legal_hold(
                Bucket=self.bucket_name,
                Key=name
            )
            
            if response.get('LegalHold', {}).get('Status') != 'ON':
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=name
                )
        except ClientError as e:
            logger.error(f"S3 deletion failed: {e}")
```

## 🔍 Security Monitoring & Auditing

### 1. Audit Logging

```python
# vridge_back/core/security/audit.py

from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
import json
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

class AuditLog(models.Model):
    """Audit log model for security events"""
    
    ACTION_TYPES = (
        ('auth', 'Authentication'),
        ('access', 'Access Control'),
        ('data', 'Data Modification'),
        ('admin', 'Admin Action'),
        ('security', 'Security Event')
    )
    
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action = models.CharField(max_length=100)
    
    # Object reference
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True)
    object_id = models.CharField(max_length=255, null=True)
    
    # Request information
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    request_method = models.CharField(max_length=10)
    request_path = models.TextField()
    
    # Event details
    success = models.BooleanField(default=True)
    details = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
        ]

class AuditLogger:
    """Service for logging security events"""
    
    @staticmethod
    def log_authentication(request, user, success: bool, details: Dict = None):
        """Log authentication attempts"""
        AuditLog.objects.create(
            user=user if success else None,
            action_type='auth',
            action='login' if success else 'failed_login',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            request_method=request.method,
            request_path=request.path,
            success=success,
            details=details or {}
        )
        
        # Alert on suspicious activity
        if not success:
            AuditLogger._check_failed_login_pattern(
                get_client_ip(request),
                details.get('username')
            )
    
    @staticmethod
    def log_access(request, resource: str, action: str, allowed: bool):
        """Log access control events"""
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action_type='access',
            action=f"{action}_{resource}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            request_method=request.method,
            request_path=request.path,
            success=allowed,
            details={'resource': resource, 'action': action}
        )
    
    @staticmethod
    def log_data_change(request, instance, action: str):
        """Log data modifications"""
        AuditLog.objects.create(
            user=request.user,
            action_type='data',
            action=action,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=str(instance.pk),
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            request_method=request.method,
            request_path=request.path,
            success=True,
            details={
                'model': instance.__class__.__name__,
                'pk': str(instance.pk)
            }
        )
    
    @staticmethod
    def _check_failed_login_pattern(ip: str, username: str = None):
        """Check for suspicious login patterns"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Check failed attempts from IP in last hour
        recent_failures = AuditLog.objects.filter(
            ip_address=ip,
            action='failed_login',
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if recent_failures >= 10:
            # Send security alert
            logger.critical(f"Brute force attack detected from IP: {ip}")
            # Trigger IP blocking or additional security measures
        
        # Check account targeted attacks
        if username:
            account_failures = AuditLog.objects.filter(
                details__username=username,
                action='failed_login',
                created_at__gte=timezone.now() - timedelta(hours=1)
            ).count()
            
            if account_failures >= 5:
                logger.warning(f"Multiple failed login attempts for user: {username}")
                # Consider temporary account lock

# Middleware for automatic audit logging
class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.audit_logger = AuditLogger()
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log high-risk actions
        if request.method in ['POST', 'PUT', 'DELETE']:
            if request.user.is_authenticated:
                # Log sensitive endpoints
                sensitive_paths = [
                    '/api/projects/',
                    '/api/users/',
                    '/api/settings/'
                ]
                
                for path in sensitive_paths:
                    if request.path.startswith(path):
                        self.audit_logger.log_access(
                            request,
                            path,
                            request.method,
                            response.status_code < 400
                        )
                        break
        
        return response
```

## 🚨 Security Response Plan

### 1. Incident Response

```python
# vridge_back/core/security/incident_response.py

from enum import Enum
from typing import Dict, List
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class SecurityIncidentType(Enum):
    BRUTE_FORCE = "brute_force"
    SQL_INJECTION = "sql_injection"
    XSS_ATTEMPT = "xss_attempt"
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE_UPLOAD = "malware_upload"

class IncidentResponse:
    """Security incident response system"""
    
    def __init__(self):
        self.response_actions = {
            SecurityIncidentType.BRUTE_FORCE: self.handle_brute_force,
            SecurityIncidentType.SQL_INJECTION: self.handle_sql_injection,
            SecurityIncidentType.XSS_ATTEMPT: self.handle_xss,
            SecurityIncidentType.DATA_BREACH: self.handle_data_breach,
            SecurityIncidentType.UNAUTHORIZED_ACCESS: self.handle_unauthorized_access,
            SecurityIncidentType.MALWARE_UPLOAD: self.handle_malware
        }
    
    def respond_to_incident(
        self,
        incident_type: SecurityIncidentType,
        details: Dict
    ):
        """Main incident response handler"""
        # Log incident
        logger.critical(f"SECURITY INCIDENT: {incident_type.value}", extra=details)
        
        # Execute response action
        handler = self.response_actions.get(incident_type)
        if handler:
            handler(details)
        
        # Notify security team
        self.notify_security_team(incident_type, details)
        
        # Create incident report
        self.create_incident_report(incident_type, details)
    
    def handle_brute_force(self, details: Dict):
        """Handle brute force attack"""
        ip = details.get('ip_address')
        
        # Block IP immediately
        self.block_ip(ip, duration=3600)
        
        # Check if account compromise occurred
        if details.get('successful_after_attempts'):
            # Force password reset
            user_id = details.get('user_id')
            self.force_password_reset(user_id)
            
            # Revoke all sessions
            self.revoke_user_sessions(user_id)
    
    def handle_sql_injection(self, details: Dict):
        """Handle SQL injection attempt"""
        # Block request source
        ip = details.get('ip_address')
        self.block_ip(ip, duration=86400)  # 24 hours
        
        # Log detailed request for analysis
        self.log_malicious_request(details)
        
        # Check for data exposure
        if details.get('potential_data_exposure'):
            self.initiate_data_audit()
    
    def handle_xss(self, details: Dict):
        """Handle XSS attempt"""
        # Sanitize affected content
        content_id = details.get('content_id')
        self.sanitize_content(content_id)
        
        # Block attacker
        ip = details.get('ip_address')
        self.block_ip(ip, duration=3600)
    
    def handle_data_breach(self, details: Dict):
        """Handle data breach"""
        # Immediate actions
        affected_users = details.get('affected_users', [])
        
        # Force password reset for affected users
        for user_id in affected_users:
            self.force_password_reset(user_id)
            self.revoke_user_sessions(user_id)
        
        # Notify affected users
        self.notify_affected_users(affected_users, details)
        
        # Initiate forensic analysis
        self.start_forensic_analysis(details)
    
    def handle_unauthorized_access(self, details: Dict):
        """Handle unauthorized access"""
        user_id = details.get('user_id')
        resource = details.get('resource')
        
        # Revoke access
        self.revoke_access(user_id, resource)
        
        # Audit permissions
        self.audit_user_permissions(user_id)
    
    def handle_malware(self, details: Dict):
        """Handle malware upload"""
        file_id = details.get('file_id')
        
        # Quarantine file
        self.quarantine_file(file_id)
        
        # Scan all recent uploads from user
        user_id = details.get('user_id')
        self.scan_user_uploads(user_id)
        
        # Block user temporarily
        self.suspend_user(user_id, duration=3600)
    
    def block_ip(self, ip: str, duration: int):
        """Block IP address"""
        from django.core.cache import cache
        
        cache.set(f"blocked_ip:{ip}", True, duration)
        logger.info(f"Blocked IP {ip} for {duration} seconds")
    
    def force_password_reset(self, user_id: str):
        """Force user to reset password"""
        from users.models import User
        
        try:
            user = User.objects.get(id=user_id)
            user.set_unusable_password()
            user.save()
            
            # Send password reset email
            # ... implementation
            
        except User.DoesNotExist:
            pass
    
    def revoke_user_sessions(self, user_id: str):
        """Revoke all user sessions"""
        from core.security.jwt_auth import SecureJWTService
        
        jwt_service = SecureJWTService()
        jwt_service.revoke_all_user_tokens(user_id)
    
    def notify_security_team(
        self,
        incident_type: SecurityIncidentType,
        details: Dict
    ):
        """Notify security team of incident"""
        subject = f"[CRITICAL] Security Incident: {incident_type.value}"
        
        message = f"""
        Security Incident Detected
        
        Type: {incident_type.value}
        Time: {details.get('timestamp')}
        IP: {details.get('ip_address')}
        User: {details.get('user_id')}
        
        Details:
        {json.dumps(details, indent=2)}
        
        Please investigate immediately.
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            settings.SECURITY_TEAM_EMAILS,
            fail_silently=False
        )
    
    def create_incident_report(
        self,
        incident_type: SecurityIncidentType,
        details: Dict
    ):
        """Create detailed incident report"""
        from core.models import SecurityIncident
        
        SecurityIncident.objects.create(
            incident_type=incident_type.value,
            severity='critical',
            details=details,
            status='investigating'
        )
```

## 🔐 Security Checklist

### Authentication & Authorization
- [ ] JWT with RSA signing
- [ ] Token rotation and blacklisting
- [ ] OAuth2 integration
- [ ] Multi-factor authentication
- [ ] Session management
- [ ] Password policy enforcement
- [ ] Account lockout mechanism

### Input Validation
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] File upload validation
- [ ] Request size limits
- [ ] Content-Type validation

### API Security
- [ ] Rate limiting (multiple strategies)
- [ ] API versioning
- [ ] Request signing
- [ ] CORS configuration
- [ ] API key management
- [ ] IP whitelisting
- [ ] Request/Response encryption

### Data Protection
- [ ] Encryption at rest
- [ ] Encryption in transit (TLS 1.3)
- [ ] Field-level encryption
- [ ] Secure file storage
- [ ] Data masking
- [ ] Secure deletion
- [ ] Backup encryption

### Infrastructure Security
- [ ] Secrets management (Vault)
- [ ] Container security scanning
- [ ] Network segmentation
- [ ] WAF configuration
- [ ] DDoS protection
- [ ] Security groups/firewalls
- [ ] VPN access

### Monitoring & Compliance
- [ ] Audit logging
- [ ] Security event monitoring
- [ ] Intrusion detection
- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] Compliance reporting
- [ ] Incident response plan

### Development Security
- [ ] Secure coding guidelines
- [ ] Code review process
- [ ] Dependency scanning
- [ ] SAST/DAST integration
- [ ] Security testing
- [ ] Security training
- [ ] Security champions program

## 📊 Security Metrics

### Key Security Indicators
- **Failed Login Attempts**: < 0.1% of total
- **API Abuse Rate**: < 0.01%
- **Security Incident Response Time**: < 15 minutes
- **Vulnerability Patching Time**: < 24 hours
- **Security Test Coverage**: > 90%
- **Encryption Coverage**: 100% for sensitive data

---

**Author**: Benjamin (Backend Lead Architect)  
**Last Updated**: 2025-08-23  
**Version**: 1.0.0