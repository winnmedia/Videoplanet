# Authentication Flow Modernization for Next.js Integration

## Current Authentication Analysis

### Current Issues:
❌ **Custom JWT in cookies**: Not compatible with Next.js middleware  
❌ **Mixed authentication methods**: Session cookies + JWT tokens  
❌ **Security vulnerabilities**: CSRF disabled, no rate limiting  
❌ **Social OAuth complexity**: Multiple redirect flows  
❌ **Token refresh handling**: Non-standard implementation  

### Current Flow Problems:
```python
# Current problematic flow
1. User login → Custom JWT in cookie + response
2. Frontend stores token in both cookie AND localStorage
3. Next.js middleware can't read HttpOnly cookies properly
4. No proper token validation on edge runtime
5. Social OAuth redirects to frontend, not API
```

## Modernized Authentication Architecture

### 1. JWT Token Strategy for Next.js

#### New Token Structure:
```json
{
  "access_token": "eyJ...", // Short-lived (15 minutes)
  "refresh_token": "eyJ...", // Long-lived (7 days)
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": 123,
    "username": "user@example.com",
    "nickname": "User"
  }
}
```

#### Implementation:
```python
# auth/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user information to token response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'nickname': self.user.nickname,
            'login_method': self.user.login_method
        }
        
        # Add token metadata for Next.js
        data['expires_in'] = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
        data['token_type'] = 'Bearer'
        
        return data

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add rotation information
        data['rotated'] = True
        data['expires_in'] = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
        
        return data
```

### 2. Next.js Middleware Compatible Flow

#### New Authentication Endpoints:
```python
# New authentication URLs
/api/v1/auth/
├── token/ - POST (Get access + refresh tokens)
├── token/refresh/ - POST (Refresh access token)
├── token/verify/ - POST (Verify token validity)
├── token/revoke/ - POST (Revoke refresh token)
├── user/profile/ - GET (Get authenticated user info)
├── user/profile/ - PATCH (Update user profile)
└── logout/ - POST (Logout and blacklist tokens)

/api/v1/auth/social/
├── google/url/ - GET (Get OAuth URL)
├── google/callback/ - POST (Handle OAuth callback)
├── kakao/url/ - GET (Get OAuth URL) 
├── kakao/callback/ - POST (Handle OAuth callback)
├── naver/url/ - GET (Get OAuth URL)
└── naver/callback/ - POST (Handle OAuth callback)
```

#### Next.js Middleware Integration:
```python
# auth/middleware.py
class NextJSCompatibleAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Extract token from Authorization header (Next.js middleware)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = self.get_user_from_token(token)
            if user:
                request.user = user
        
        response = self.get_response(request)
        
        # Add headers for Next.js middleware
        if hasattr(request, 'user') and request.user.is_authenticated:
            response['X-User-Id'] = str(request.user.id)
            response['X-User-Role'] = self.get_user_role(request.user)
        
        return response
    
    def get_user_from_token(self, token):
        try:
            validated_token = UntypedToken(token)
            user_id = validated_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, User.DoesNotExist):
            return None
```

### 3. Simplified Social OAuth Flow

#### Current Complex Flow:
```
Frontend → Social Provider → Frontend Callback → API Call → JWT Cookie
```

#### New Streamlined Flow:
```
Frontend → API OAuth URL → Social Provider → API Callback → JWT Response → Frontend
```

#### Implementation:
```python
# auth/social.py
from django_rest_social_auth.views import SocialLoginView

class GoogleOAuthView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get Google OAuth URL"""
        state = secrets.token_urlsafe(32)
        cache.set(f'oauth_state_{state}', True, 300)  # 5 minutes
        
        oauth_url = (
            f"https://accounts.google.com/o/oauth2/auth?"
            f"client_id={settings.GOOGLE_OAUTH_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}&"
            f"scope=email profile&"
            f"response_type=code&"
            f"state={state}"
        )
        
        return Response({
            'success': True,
            'data': {
                'oauth_url': oauth_url,
                'state': state
            }
        })
    
    def post(self, request):
        """Handle Google OAuth callback"""
        code = request.data.get('code')
        state = request.data.get('state')
        
        # Verify state
        if not cache.get(f'oauth_state_{state}'):
            return Response({
                'success': False,
                'errors': [{'code': 'INVALID_STATE', 'message': 'Invalid OAuth state'}]
            }, status=400)
        
        # Exchange code for tokens
        token_data = self.exchange_code_for_tokens(code)
        user_info = self.get_user_info(token_data['access_token'])
        
        # Get or create user
        user, created = User.objects.get_or_create(
            username=user_info['email'],
            defaults={
                'email': user_info['email'],
                'nickname': user_info['name'],
                'login_method': 'google'
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'token_type': 'Bearer',
                'expires_in': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'nickname': user.nickname,
                    'login_method': user.login_method
                }
            }
        })
```

### 4. Token Security Enhancements

#### Secure Token Configuration:
```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Short-lived
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # Long-lived
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    # Security enhancements
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': 'videoplanet-app',
    'ISSUER': 'videoplanet-api',
    
    # Claims
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Token validation
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    # Sliding tokens (optional)
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=15),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Rate limiting for auth endpoints
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',      # Anonymous requests
        'user': '60/minute',      # Authenticated requests
        'login': '5/minute',      # Login attempts
        'signup': '3/minute',     # Signup attempts
    }
}
```

### 5. Next.js Middleware Example

#### Client-side Token Management:
```typescript
// lib/auth.ts (Next.js)
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  async login(email: string, password: string): Promise<UserInfo> {
    const response = await fetch('/api/v1/auth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    const data: TokenResponse = await response.json();
    
    if (data.success) {
      this.setTokens(data.data.access_token, data.data.refresh_token, data.data.expires_in);
      return data.data.user;
    } else {
      throw new Error(data.errors[0]?.message || 'Login failed');
    }
  }

  private setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
    
    // Store in secure httpOnly cookies via API route
    document.cookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`;
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/v1/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: this.refreshToken })
    });

    const data = await response.json();
    
    if (data.success) {
      this.setTokens(data.data.access, this.refreshToken, data.data.expires_in);
    } else {
      this.logout();
      throw new Error('Token refresh failed');
    }
  }
}

// middleware.ts (Next.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token with backend
    return verifyTokenWithBackend(token, request);
  }
  
  return NextResponse.next();
}

async function verifyTokenWithBackend(token: string, request: NextRequest) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/auth/token/verify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      const userData = await response.json();
      
      // Add user info to request headers for server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userData.data.user_id);
      requestHeaders.set('x-user-role', userData.data.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 6. Security Improvements

#### CSRF Protection Re-enablement:
```python
# security/middleware.py
class ConditionalCSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip CSRF for API endpoints using JWT
        if request.path.startswith('/api/v1/') and 'Bearer' in request.META.get('HTTP_AUTHORIZATION', ''):
            return self.get_response(request)
        
        # Apply CSRF for form-based endpoints
        return CsrfViewMiddleware(self.get_response)(request)
```

#### Rate Limiting Implementation:
```python
# auth/throttling.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'
    
class SignupRateThrottle(AnonRateThrottle):
    scope = 'signup'

class PasswordResetRateThrottle(UserRateThrottle):
    scope = 'password_reset'

# Apply to views
class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer
```

## Migration Strategy

### Phase 1: Preparation (Week 1)
- [ ] Update JWT configuration for Next.js compatibility
- [ ] Implement new token serializers
- [ ] Add rate limiting and security middleware

### Phase 2: New Endpoints (Week 1-2)
- [ ] Create new `/api/v1/auth/` endpoints
- [ ] Implement social OAuth URL generators
- [ ] Add token verification endpoints

### Phase 3: Social OAuth Migration (Week 2)
- [ ] Update social OAuth flow
- [ ] Test with Google, Kakao, Naver providers
- [ ] Update frontend integration

### Phase 4: Security Hardening (Week 2-3)
- [ ] Re-enable CSRF protection selectively  
- [ ] Add comprehensive rate limiting
- [ ] Implement security monitoring

### Phase 5: Frontend Integration (Week 3)
- [ ] Update Next.js middleware
- [ ] Implement new auth flow in frontend
- [ ] Add proper error handling

## Testing Strategy

### Unit Tests:
```python
# tests/test_auth.py
class TestModernAuthFlow(TestCase):
    def test_token_obtain_pair(self):
        """Test JWT token generation"""
        response = self.client.post('/api/v1/auth/token/', {
            'username': 'test@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('access_token', data['data'])
        self.assertIn('refresh_token', data['data'])
        self.assertIn('user', data['data'])
    
    def test_social_oauth_flow(self):
        """Test social OAuth URL generation"""
        response = self.client.get('/api/v1/auth/social/google/url/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('oauth_url', data['data'])
        self.assertIn('accounts.google.com', data['data']['oauth_url'])
```

### Integration Tests:
- End-to-end authentication flow
- Token refresh mechanism
- Social OAuth complete flow
- Next.js middleware compatibility

## Success Metrics

1. **Token Validation Speed**: <50ms for token verification
2. **Social OAuth Success Rate**: >95% completion rate  
3. **Security Incidents**: Zero auth-related vulnerabilities
4. **Next.js Compatibility**: 100% middleware compatibility
5. **User Experience**: <2 seconds for complete login flow

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Implementation Priority**: High - Foundation for Next.js migration