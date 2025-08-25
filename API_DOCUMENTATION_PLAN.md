# Comprehensive API Documentation for Frontend Integration

## Current Documentation Gaps

### Missing Documentation:
❌ **No OpenAPI/Swagger specification**: No machine-readable API documentation  
❌ **No endpoint documentation**: Frontend developers work from code inspection  
❌ **No error response documentation**: Inconsistent error handling understanding  
❌ **No authentication flow documentation**: Complex OAuth flows undocumented  
❌ **No WebSocket protocol documentation**: Real-time features undocumented  

### Integration Challenges:
- Frontend developers must reverse-engineer API contracts
- No standardized error handling patterns
- Authentication flow complexity causes integration issues
- WebSocket message formats not documented
- No API testing tools for frontend developers

## Comprehensive API Documentation Strategy

### 1. OpenAPI 3.0 Specification Generation

#### Automated Schema Generation:
```python
# docs/schema_generator.py
from rest_framework.schemas.openapi import AutoSchema
from rest_framework import serializers
from django.conf import settings

class VideoplanetAPISchema(AutoSchema):
    """Custom OpenAPI schema generator for Videoplanet API"""
    
    def get_info(self):
        """Get API information section"""
        return {
            'title': 'VideoplaNet API',
            'version': 'v2.0.0',
            'description': '''
# VideoplaNet API Documentation

VideoplaNet is a comprehensive video production project management platform.
This API provides endpoints for managing video projects, team collaboration,
feedback systems, and real-time communication.

## Authentication

The API uses JWT (JSON Web Token) authentication with Bearer token format.

### Getting Started
1. Register a new account or login with existing credentials
2. Obtain access and refresh tokens from `/api/v2/auth/token/`
3. Include the access token in the Authorization header: `Bearer <token>`
4. Refresh tokens before expiry using `/api/v2/auth/token/refresh/`

## Rate Limiting

API endpoints are rate limited to ensure fair usage:
- Authentication endpoints: 5 requests per minute
- Read operations: 100 requests per minute  
- Write operations: 30 requests per minute
- File uploads: 10 requests per minute

## Error Handling

All API responses follow a consistent format:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-08-21T12:00:00Z",
    "version": "v2"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2025-08-21T12:00:00Z", 
    "version": "v2"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "field": "email",
      "detail": "Email format is invalid"
    }
  ]
}
```

## WebSocket Real-Time Communication

The API supports real-time communication via WebSocket for feedback and collaboration features.

### Connection URL:
`wss://api.vridge.kr/ws/chat/<feedback_id>/`

### Message Format:
```json
{
  "type": "message",
  "data": {
    "user_id": 123,
    "text": "This is a feedback comment",
    "timestamp": "2025-08-21T12:00:00Z"
  }
}
```
            ''',
            'contact': {
                'name': 'VideoplaNet Support',
                'email': 'support@vridge.kr',
                'url': 'https://vridge.kr/support'
            },
            'license': {
                'name': 'MIT',
                'url': 'https://opensource.org/licenses/MIT'
            }
        }
    
    def get_servers(self, version='v2'):
        """Get server information"""
        return [
            {
                'url': f'https://api.vridge.kr/api/{version}/',
                'description': 'Production server'
            },
            {
                'url': f'http://localhost:8000/api/{version}/',
                'description': 'Development server'
            }
        ]
    
    def get_security_schemes(self):
        """Get security scheme definitions"""
        return {
            'BearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': 'JWT authentication using Bearer token'
            },
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key',
                'description': 'API key authentication for service-to-service calls'
            }
        }
    
    def get_common_responses(self):
        """Get common response schemas"""
        return {
            'StandardSuccessResponse': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean', 'example': True},
                    'data': {'type': 'object'},
                    'meta': {
                        'type': 'object',
                        'properties': {
                            'timestamp': {'type': 'string', 'format': 'date-time'},
                            'version': {'type': 'string', 'example': 'v2'}
                        }
                    }
                }
            },
            'StandardErrorResponse': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean', 'example': False},
                    'data': {'type': 'null'},
                    'meta': {
                        'type': 'object',
                        'properties': {
                            'timestamp': {'type': 'string', 'format': 'date-time'},
                            'version': {'type': 'string', 'example': 'v2'}
                        }
                    },
                    'errors': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'code': {'type': 'string', 'example': 'VALIDATION_ERROR'},
                                'message': {'type': 'string', 'example': 'Invalid input data'},
                                'field': {'type': 'string', 'example': 'email'},
                                'detail': {'type': 'string', 'example': 'Email format is invalid'}
                            }
                        }
                    }
                }
            },
            'UnauthorizedResponse': {
                'type': 'object',
                'allOf': [{'$ref': '#/components/schemas/StandardErrorResponse'}],
                'example': {
                    'success': False,
                    'data': None,
                    'errors': [{
                        'code': 'AUTHENTICATION_REQUIRED',
                        'message': 'Authentication credentials were not provided'
                    }]
                }
            },
            'ForbiddenResponse': {
                'type': 'object',
                'allOf': [{'$ref': '#/components/schemas/StandardErrorResponse'}],
                'example': {
                    'success': False,
                    'data': None,
                    'errors': [{
                        'code': 'PERMISSION_DENIED',
                        'message': 'You do not have permission to perform this action'
                    }]
                }
            },
            'NotFoundResponse': {
                'type': 'object',
                'allOf': [{'$ref': '#/components/schemas/StandardErrorResponse'}],
                'example': {
                    'success': False,
                    'data': None,
                    'errors': [{
                        'code': 'NOT_FOUND',
                        'message': 'The requested resource was not found'
                    }]
                }
            },
            'RateLimitResponse': {
                'type': 'object',
                'allOf': [{'$ref': '#/components/schemas/StandardErrorResponse'}],
                'example': {
                    'success': False,
                    'data': None,
                    'errors': [{
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'message': 'Rate limit exceeded. Please try again later'
                    }]
                }
            }
        }

# Enhanced serializers with OpenAPI documentation
class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Project detail serializer with comprehensive information
    
    Includes project metadata, timeline information, member details,
    and current status for frontend display.
    """
    
    timeline = serializers.SerializerMethodField(
        help_text="Project timeline with all phases and their status"
    )
    member_count = serializers.IntegerField(
        read_only=True,
        help_text="Total number of project members"
    )
    owner = serializers.SerializerMethodField(
        help_text="Project owner information"
    )
    current_phase = serializers.SerializerMethodField(
        help_text="Currently active project phase"
    )
    progress_percentage = serializers.SerializerMethodField(
        help_text="Overall project completion percentage (0-100)"
    )
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'manager', 'consumer', 'description', 'color',
            'timeline', 'member_count', 'owner', 'current_phase', 
            'progress_percentage', 'created_at', 'updated_at'
        ]
        
        # OpenAPI documentation
        swagger_schema_fields = {
            'example': {
                'id': 123,
                'name': 'Corporate Video Production',
                'manager': 'John Doe',
                'consumer': 'ABC Corporation',
                'description': 'Marketing video for new product launch',
                'color': '#1631F8',
                'timeline': {
                    'start_date': '2025-08-21T09:00:00Z',
                    'end_date': '2025-09-21T17:00:00Z',
                    'phases': [
                        {
                            'name': 'basic_plan',
                            'display_name': 'Basic Planning',
                            'start_date': '2025-08-21T09:00:00Z',
                            'end_date': '2025-08-25T17:00:00Z',
                            'status': 'completed'
                        }
                    ]
                },
                'member_count': 5,
                'owner': {
                    'id': 456,
                    'email': 'owner@example.com',
                    'nickname': 'Project Owner'
                },
                'current_phase': 'filming',
                'progress_percentage': 35,
                'created_at': '2025-08-21T09:00:00Z',
                'updated_at': '2025-08-21T15:30:00Z'
            }
        }
    
    def get_timeline(self, instance):
        """Get comprehensive timeline information"""
        phases = [
            ('basic_plan', 'Basic Planning'),
            ('story_board', 'Storyboard'),
            ('filming', 'Filming'),
            ('video_edit', 'Video Editing'),
            ('post_work', 'Post Work'),
            ('video_preview', 'Video Preview'),
            ('confirmation', 'Confirmation'),
            ('video_delivery', 'Video Delivery'),
        ]
        
        timeline_data = {
            'start_date': getattr(instance, 'earliest_start_date', None),
            'end_date': getattr(instance, 'latest_end_date', None),
            'phases': []
        }
        
        for phase_name, display_name in phases:
            phase_obj = getattr(instance, phase_name, None)
            if phase_obj:
                phase_data = {
                    'name': phase_name,
                    'display_name': display_name,
                    'start_date': phase_obj.start_date,
                    'end_date': phase_obj.end_date,
                    'status': 'completed' if phase_obj.end_date else 'in_progress' if phase_obj.start_date else 'pending'
                }
                timeline_data['phases'].append(phase_data)
        
        return timeline_data
```

### 2. Interactive API Documentation

#### Swagger UI Integration:
```python
# docs/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

class SwaggerUIView(View):
    """Serve Swagger UI for API documentation"""
    
    def get(self, request, version='v2'):
        """Render Swagger UI with version-specific schema"""
        context = {
            'api_version': version,
            'schema_url': f'/api/docs/schema/{version}/',
            'api_title': f'VideoplaNet API {version.upper()}',
        }
        return render(request, 'docs/swagger_ui.html', context)

class ReDocView(View):
    """Serve ReDoc documentation interface"""
    
    def get(self, request, version='v2'):
        """Render ReDoc with version-specific schema"""
        context = {
            'api_version': version,
            'schema_url': f'/api/docs/schema/{version}/',
            'api_title': f'VideoplaNet API {version.upper()}',
        }
        return render(request, 'docs/redoc.html', context)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_endpoints_list(request, version='v2'):
    """Provide machine-readable list of all API endpoints"""
    
    endpoints = {
        'authentication': {
            'base_url': f'/api/{version}/auth/',
            'endpoints': [
                {
                    'path': 'token/',
                    'method': 'POST',
                    'description': 'Obtain JWT token pair',
                    'requires_auth': False,
                    'rate_limit': '5/minute',
                    'request_format': {
                        'email': 'string (required)',
                        'password': 'string (required)'
                    },
                    'response_format': {
                        'access_token': 'string',
                        'refresh_token': 'string',
                        'expires_in': 'integer',
                        'user': 'object'
                    }
                },
                {
                    'path': 'token/refresh/',
                    'method': 'POST', 
                    'description': 'Refresh access token',
                    'requires_auth': False,
                    'rate_limit': '10/minute',
                    'request_format': {
                        'refresh': 'string (required)'
                    },
                    'response_format': {
                        'access': 'string'
                    }
                }
            ]
        },
        'projects': {
            'base_url': f'/api/{version}/projects/',
            'endpoints': [
                {
                    'path': '',
                    'method': 'GET',
                    'description': 'List user projects',
                    'requires_auth': True,
                    'rate_limit': '100/minute',
                    'query_parameters': {
                        'page': 'integer (optional)',
                        'per_page': 'integer (optional, max 100)',
                        'search': 'string (optional)',
                        'status': 'string (optional)'
                    },
                    'response_format': {
                        'data': 'array of project objects',
                        'meta': {
                            'pagination': 'object'
                        }
                    }
                },
                {
                    'path': '{id}/',
                    'method': 'GET',
                    'description': 'Get project details',
                    'requires_auth': True,
                    'rate_limit': '100/minute',
                    'path_parameters': {
                        'id': 'integer (required) - Project ID'
                    },
                    'response_format': 'ProjectDetail object'
                }
            ]
        },
        'feedback': {
            'base_url': f'/api/{version}/feedback/',
            'endpoints': [
                {
                    'path': '{id}/',
                    'method': 'GET',
                    'description': 'Get feedback thread',
                    'requires_auth': True,
                    'rate_limit': '100/minute',
                    'response_format': 'Feedback object with comments'
                }
            ]
        },
        'websocket': {
            'base_url': f'wss://api.vridge.kr/ws/',
            'endpoints': [
                {
                    'path': 'chat/{feedback_id}/',
                    'protocol': 'WebSocket',
                    'description': 'Real-time feedback chat',
                    'requires_auth': True,
                    'message_types': [
                        {
                            'type': 'message',
                            'description': 'Send chat message',
                            'format': {
                                'type': 'message',
                                'text': 'string',
                                'user_id': 'integer'
                            }
                        },
                        {
                            'type': 'comment',
                            'description': 'Send feedback comment',
                            'format': {
                                'type': 'comment',
                                'title': 'string',
                                'text': 'string',
                                'section': 'string',
                                'anonymous': 'boolean'
                            }
                        }
                    ]
                }
            ]
        }
    }
    
    return Response({
        'success': True,
        'data': endpoints,
        'meta': {
            'version': version,
            'generated_at': timezone.now().isoformat()
        }
    })
```

#### HTML Templates for Documentation:
```html
<!-- templates/docs/swagger_ui.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ api_title }} - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                url: '{{ schema_url }}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                docExpansion: "list",
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded for {{ api_title }}');
                }
            });
        };
    </script>
</body>
</html>

<!-- templates/docs/redoc.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ api_title }} - API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <redoc spec-url='{{ schema_url }}'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.2/bundles/redoc.standalone.js"></script>
</body>
</html>
```

### 3. Frontend Integration Guides

#### Next.js Integration Documentation:
```markdown
# Next.js Integration Guide

## Installation

```bash
npm install axios
# or
npm install @tanstack/react-query  # Recommended for better caching
```

## API Client Setup

```typescript
// lib/api-client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta: {
    timestamp: string;
    version: string;
    pagination?: {
      page: number;
      per_page: number;
      total: number;
      has_next: boolean;
    };
  };
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
    detail?: string;
  }>;
}

class VideoplanetAPIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v2/`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.videoplanet.v2+json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            // Retry original request with new token
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>> = await this.client.post('auth/token/', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      this.setTokens(response.data.data.access_token, response.data.data.refresh_token);
      return response.data.data.user;
    }

    throw new Error(response.data.errors?.[0]?.message || 'Login failed');
  }

  // Project methods
  async getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ projects: Project[]; pagination: PaginationInfo }> {
    const response: AxiosResponse<ApiResponse<Project[]>> = await this.client.get('projects/', {
      params,
    });

    if (response.data.success && response.data.data) {
      return {
        projects: response.data.data,
        pagination: response.data.meta.pagination!,
      };
    }

    throw new Error(response.data.errors?.[0]?.message || 'Failed to fetch projects');
  }

  async getProject(id: number): Promise<ProjectDetail> {
    const response: AxiosResponse<ApiResponse<ProjectDetail>> = await this.client.get(`projects/${id}/`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.errors?.[0]?.message || 'Failed to fetch project');
  }

  // WebSocket connection helper
  createWebSocketConnection(feedbackId: number): WebSocket {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const socket = new WebSocket(`${wsUrl}/ws/chat/${feedbackId}/`);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return socket;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    // Store refresh token securely (httpOnly cookie via API route)
    document.cookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // This would need to read from httpOnly cookie via API route
      const response = await this.client.post('auth/token/refresh/');
      
      if (response.data.success && response.data.data) {
        this.accessToken = response.data.data.access;
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
}

export const apiClient = new VideoplanetAPIClient();
export type { ApiResponse, Project, ProjectDetail, User };
```

#### React Query Integration Example:
```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export function useProjects(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiClient.getProjects(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectData: CreateProjectRequest) => 
      apiClient.createProject(projectData),
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// components/ProjectList.tsx - Usage example
import { useProjects } from '../hooks/useProjects';

export function ProjectList() {
  const { data, error, isLoading } = useProjects();
  
  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### 4. Error Handling Documentation

#### Error Code Reference:
```python
# docs/error_codes.py
ERROR_CODE_DOCUMENTATION = {
    # Authentication Errors
    'AUTHENTICATION_REQUIRED': {
        'status_code': 401,
        'description': 'Authentication credentials were not provided',
        'solution': 'Include valid JWT token in Authorization header',
        'example': 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    },
    'INVALID_TOKEN': {
        'status_code': 401,
        'description': 'The provided token is invalid or expired',
        'solution': 'Refresh the token using /auth/token/refresh/ endpoint',
        'example': 'POST /api/v2/auth/token/refresh/ with refresh token'
    },
    'PERMISSION_DENIED': {
        'status_code': 403,
        'description': 'User does not have permission for this action',
        'solution': 'Ensure user has required project membership or ownership',
        'example': 'Only project owners can delete projects'
    },
    
    # Validation Errors
    'VALIDATION_ERROR': {
        'status_code': 400,
        'description': 'Request data validation failed',
        'solution': 'Check the field-specific error details and correct input',
        'example': 'Email field must be a valid email address'
    },
    'REQUIRED_FIELD_MISSING': {
        'status_code': 400,
        'description': 'Required field was not provided',
        'solution': 'Include all required fields in request body',
        'example': 'The "name" field is required for project creation'
    },
    
    # Resource Errors  
    'NOT_FOUND': {
        'status_code': 404,
        'description': 'The requested resource was not found',
        'solution': 'Verify the resource ID exists and user has access',
        'example': 'Project with ID 123 does not exist'
    },
    'ALREADY_EXISTS': {
        'status_code': 409,
        'description': 'Resource already exists',
        'solution': 'Use a different unique identifier or update existing resource',
        'example': 'User with this email already exists'
    },
    
    # Rate Limiting
    'RATE_LIMIT_EXCEEDED': {
        'status_code': 429,
        'description': 'Too many requests within the time window',
        'solution': 'Wait before making additional requests',
        'example': 'Maximum 5 login attempts per minute'
    },
    
    # Server Errors
    'INTERNAL_SERVER_ERROR': {
        'status_code': 500,
        'description': 'An unexpected server error occurred',
        'solution': 'Try again later or contact support if persistent',
        'example': 'Database connection temporarily unavailable'
    },
    'SERVICE_UNAVAILABLE': {
        'status_code': 503,
        'description': 'Service is temporarily unavailable',
        'solution': 'Check service status and try again later',
        'example': 'System maintenance in progress'
    }
}

# docs/views.py (continued)
@api_view(['GET'])
@permission_classes([AllowAny])
def error_codes_reference(request):
    """Provide comprehensive error code documentation"""
    
    return Response({
        'success': True,
        'data': {
            'error_codes': ERROR_CODE_DOCUMENTATION,
            'usage_notes': [
                'All error responses include detailed error information',
                'Multiple errors may be returned in a single response',
                'Field-specific errors include the field name for easy form validation',
                'HTTP status codes follow REST conventions'
            ]
        }
    })
```

### 5. WebSocket Protocol Documentation

#### WebSocket API Specification:
```python
# docs/websocket_spec.py
WEBSOCKET_PROTOCOL_DOCUMENTATION = {
    'overview': {
        'description': 'Real-time communication protocol for feedback and collaboration',
        'base_url': 'wss://api.vridge.kr/ws/',
        'authentication': 'JWT token via query parameter or header',
        'connection_limit': '5 concurrent connections per user'
    },
    'endpoints': {
        'feedback_chat': {
            'url': 'chat/{feedback_id}/',
            'description': 'Real-time chat for project feedback',
            'connection_example': {
                'javascript': '''
const socket = new WebSocket('wss://api.vridge.kr/ws/chat/123/');

socket.onopen = function(event) {
    console.log('Connected to feedback chat');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

socket.send(JSON.stringify({
    type: 'message',
    data: {
        text: 'This is a chat message',
        user_id: 456
    }
}));
                ''',
                'react': '''
import { useEffect, useState } from 'react';

function useFeedbackChat(feedbackId: number) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const ws = new WebSocket(`wss://api.vridge.kr/ws/chat/${feedbackId}/`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                setMessages(prev => [...prev, data.data]);
            }
        };

        setSocket(ws);

        return () => ws.close();
    }, [feedbackId]);

    const sendMessage = (text: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                data: { text, user_id: currentUser.id }
            }));
        }
    };

    return { messages, sendMessage };
}
                '''
            },
            'message_types': {
                'message': {
                    'description': 'Regular chat message',
                    'format': {
                        'type': 'message',
                        'data': {
                            'text': 'string (required)',
                            'user_id': 'integer (required)'
                        }
                    },
                    'response_format': {
                        'type': 'message',
                        'data': {
                            'id': 'integer',
                            'text': 'string',
                            'user': 'User object',
                            'timestamp': 'ISO 8601 datetime'
                        }
                    }
                },
                'comment': {
                    'description': 'Feedback comment with video timestamp',
                    'format': {
                        'type': 'comment',
                        'data': {
                            'title': 'string (required)',
                            'text': 'string (required)',
                            'section': 'string (optional) - video timestamp',
                            'anonymous': 'boolean (optional)'
                        }
                    }
                },
                'typing': {
                    'description': 'User typing indicator',
                    'format': {
                        'type': 'typing',
                        'data': {
                            'user_id': 'integer',
                            'is_typing': 'boolean'
                        }
                    }
                }
            }
        }
    }
}
```

### 6. Testing and Validation Tools

#### API Testing Documentation:
```python
# docs/testing_guide.py
API_TESTING_EXAMPLES = {
    'curl_examples': {
        'authentication': '''
# Login to get tokens
curl -X POST https://api.vridge.kr/api/v2/auth/token/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Use token for authenticated requests
curl -X GET https://api.vridge.kr/api/v2/projects/ \\
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        ''',
        'project_management': '''
# Get project list
curl -X GET https://api.vridge.kr/api/v2/projects/ \\
  -H "Authorization: Bearer <token>"

# Get specific project
curl -X GET https://api.vridge.kr/api/v2/projects/123/ \\
  -H "Authorization: Bearer <token>"

# Create new project
curl -X POST https://api.vridge.kr/api/v2/projects/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Video Project",
    "manager": "John Doe",
    "consumer": "ABC Company",
    "description": "Marketing video production"
  }'
        ''',
        'file_upload': '''
# Upload feedback file
curl -X POST https://api.vridge.kr/api/v2/feedback/123/upload/ \\
  -H "Authorization: Bearer <token>" \\
  -F "file=@video.mp4"
        '''
    },
    'postman_collection': {
        'info': {
            'name': 'VideoplaNet API v2',
            'description': 'Complete API collection for VideoplaNet',
            'version': '2.0.0'
        },
        'auth': {
            'type': 'bearer',
            'bearer': {
                'token': '{{access_token}}'
            }
        },
        'variables': [
            {
                'key': 'base_url',
                'value': 'https://api.vridge.kr/api/v2',
                'type': 'string'
            },
            {
                'key': 'access_token',
                'value': '',
                'type': 'string'
            }
        ]
    }
}
```

## Implementation Timeline

### Week 1: Documentation Infrastructure
- [ ] Set up OpenAPI schema generation
- [ ] Create Swagger UI and ReDoc interfaces
- [ ] Build automated documentation pipeline
- [ ] Add endpoint annotations and examples

### Week 2: Integration Guides
- [ ] Write Next.js integration guide
- [ ] Create TypeScript API client
- [ ] Build React hooks examples
- [ ] Add WebSocket integration examples

### Week 3: Testing Documentation
- [ ] Create Postman collections
- [ ] Add cURL examples for all endpoints
- [ ] Build automated API testing suite
- [ ] Create troubleshooting guides

### Week 4: Final Documentation
- [ ] Complete error code reference
- [ ] Add performance optimization guides
- [ ] Create deployment documentation
- [ ] Review and finalize all documentation

## Success Metrics

1. **Documentation Coverage**: 100% of API endpoints documented
2. **Frontend Integration Time**: <2 hours for new developer setup
3. **API Contract Clarity**: Zero ambiguity in endpoint specifications
4. **Error Handling**: Complete error code reference with solutions
5. **Developer Experience**: Positive feedback from frontend team

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-21  
**Priority**: High - Essential for frontend team productivity