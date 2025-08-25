# VideoPlanet 피드백 시스템 Contract Testing 전략

## 1. Contract Testing 개요

### 1.1 목적
- **API 계약 보장**: Frontend와 Backend 간의 API 계약 준수 보장
- **독립적 개발**: 팀 간 독립적인 개발 및 배포 가능
- **조기 오류 감지**: 통합 전 계약 위반 사항 조기 발견
- **문서 자동화**: 계약을 통한 API 문서 자동 생성

### 1.2 도구 스택
```yaml
Contract Testing:
  - Framework: Pact
  - Broker: Pact Broker (Docker)
  - Provider Verification: Django Test + Pact
  - Consumer Testing: Jest + Pact
  - CI Integration: GitHub Actions

Schema Validation:
  - OpenAPI: openapi-typescript
  - JSON Schema: ajv
  - GraphQL: graphql-code-generator
```

## 2. Consumer-Driven Contract Testing

### 2.1 Consumer (Frontend) 계약 정의

#### 피드백 생성 계약
```typescript
// features/feedback/__tests__/feedback.pact.test.ts
import { Pact } from '@pact-foundation/pact';
import { FeedbackAPI } from '../api/feedback.api';
import { like, eachLike, term, uuid } from '@pact-foundation/pact/dsl/matchers';

describe('Feedback API Contract', () => {
  const provider = new Pact({
    consumer: 'VideoPlanet-Frontend',
    provider: 'VideoPlanet-Backend',
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('POST /api/v1/feedbacks', () => {
    it('should create feedback with timestamp', async () => {
      const expectedFeedback = {
        id: uuid('550e8400-e29b-41d4-a716-446655440000'),
        video_id: uuid('550e8400-e29b-41d4-a716-446655440001'),
        timestamp: like(30.5),
        content: like('Button alignment issue'),
        screenshot_url: term({
          matcher: '^https?://.*\\.(jpg|jpeg|png|webp)$',
          generate: 'https://cdn.example.com/screenshots/abc123.webp',
        }),
        drawing_data: like({
          shapes: eachLike({
            type: 'rectangle',
            coordinates: [100, 100, 200, 200],
            style: {
              color: term({
                matcher: '^#[0-9A-F]{6}$',
                generate: '#FF0000',
              }),
              width: like(2),
            },
          }),
        }),
        priority: term({
          matcher: 'low|medium|high|critical',
          generate: 'medium',
        }),
        status: 'open',
        user: {
          id: uuid('550e8400-e29b-41d4-a716-446655440002'),
          name: like('John Doe'),
          email: term({
            matcher: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
            generate: 'john@example.com',
          }),
        },
        created_at: term({
          matcher: ISO8601_DATETIME_REGEX,
          generate: '2025-08-24T10:00:00Z',
        }),
        updated_at: term({
          matcher: ISO8601_DATETIME_REGEX,
          generate: '2025-08-24T10:00:00Z',
        }),
      };

      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request to create feedback with timestamp',
        withRequest: {
          method: 'POST',
          path: '/api/v1/feedbacks',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': term({
              matcher: '^Bearer .+$',
              generate: 'Bearer valid-token',
            }),
          },
          body: {
            video_id: uuid('550e8400-e29b-41d4-a716-446655440001'),
            timestamp: 30.5,
            content: 'Button alignment issue',
            screenshot: like('data:image/webp;base64,UklGRg...'),
            drawing_data: {
              shapes: [{
                type: 'rectangle',
                coordinates: [100, 100, 200, 200],
                style: { color: '#FF0000', width: 2 },
              }],
            },
            priority: 'medium',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedFeedback,
        },
      });

      const api = new FeedbackAPI(provider.mockService.baseUrl);
      const result = await api.createFeedback({
        videoId: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: 30.5,
        content: 'Button alignment issue',
        screenshot: 'data:image/webp;base64,UklGRg...',
        drawingData: {
          shapes: [{
            type: 'rectangle',
            coordinates: [100, 100, 200, 200],
            style: { color: '#FF0000', width: 2 },
          }],
        },
        priority: 'medium',
      });

      expect(result.id).toBeDefined();
      expect(result.timestamp).toBe(30.5);
      expect(result.status).toBe('open');
    });
  });

  describe('GET /api/v1/feedbacks', () => {
    it('should list feedbacks for a video', async () => {
      await provider.addInteraction({
        state: 'video has feedbacks',
        uponReceiving: 'a request to list feedbacks',
        withRequest: {
          method: 'GET',
          path: '/api/v1/feedbacks',
          query: {
            video_id: '550e8400-e29b-41d4-a716-446655440001',
          },
        },
        willRespondWith: {
          status: 200,
          body: eachLike({
            id: uuid('550e8400-e29b-41d4-a716-446655440000'),
            video_id: uuid('550e8400-e29b-41d4-a716-446655440001'),
            timestamp: like(30.5),
            content: like('Feedback content'),
            status: term({
              matcher: 'open|in_progress|resolved|closed',
              generate: 'open',
            }),
          }),
        },
      });

      const api = new FeedbackAPI(provider.mockService.baseUrl);
      const feedbacks = await api.listFeedbacks({
        videoId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(feedbacks).toHaveLength(1);
      expect(feedbacks[0].video_id).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });
});
```

#### 댓글 시스템 계약
```typescript
// features/comment/__tests__/comment.pact.test.ts
describe('Comment API Contract', () => {
  describe('POST /api/v1/comments', () => {
    it('should create threaded comment', async () => {
      await provider.addInteraction({
        state: 'feedback exists',
        uponReceiving: 'a request to add comment to feedback',
        withRequest: {
          method: 'POST',
          path: '/api/v1/comments',
          body: {
            feedback_id: uuid('550e8400-e29b-41d4-a716-446655440000'),
            parent_id: uuid('550e8400-e29b-41d4-a716-446655440003'),
            content: 'This is a reply',
            mentions: [uuid('550e8400-e29b-41d4-a716-446655440002')],
          },
        },
        willRespondWith: {
          status: 201,
          body: {
            id: uuid('550e8400-e29b-41d4-a716-446655440004'),
            feedback_id: uuid('550e8400-e29b-41d4-a716-446655440000'),
            parent_id: uuid('550e8400-e29b-41d4-a716-446655440003'),
            content: 'This is a reply',
            user: like({
              id: uuid('550e8400-e29b-41d4-a716-446655440005'),
              name: 'Jane Doe',
            }),
            mentions: eachLike({
              id: uuid('550e8400-e29b-41d4-a716-446655440002'),
              name: 'John Doe',
            }),
            reactions: like({}),
            created_at: term({
              matcher: ISO8601_DATETIME_REGEX,
              generate: '2025-08-24T10:30:00Z',
            }),
          },
        },
      });

      const api = new CommentAPI(provider.mockService.baseUrl);
      const comment = await api.createComment({
        feedbackId: '550e8400-e29b-41d4-a716-446655440000',
        parentId: '550e8400-e29b-41d4-a716-446655440003',
        content: 'This is a reply',
        mentions: ['550e8400-e29b-41d4-a716-446655440002'],
      });

      expect(comment.parent_id).toBe('550e8400-e29b-41d4-a716-446655440003');
      expect(comment.mentions).toHaveLength(1);
    });

    it('should add reaction to comment', async () => {
      await provider.addInteraction({
        state: 'comment exists',
        uponReceiving: 'a request to add reaction',
        withRequest: {
          method: 'POST',
          path: '/api/v1/comments/550e8400-e29b-41d4-a716-446655440004/reactions',
          body: {
            emoji: '👍',
          },
        },
        willRespondWith: {
          status: 200,
          body: {
            success: true,
            reactions: {
              '👍': [uuid('550e8400-e29b-41d4-a716-446655440005')],
            },
          },
        },
      });

      const api = new CommentAPI(provider.mockService.baseUrl);
      const result = await api.addReaction(
        '550e8400-e29b-41d4-a716-446655440004',
        '👍'
      );

      expect(result.success).toBe(true);
      expect(result.reactions['👍']).toHaveLength(1);
    });
  });
});
```

### 2.2 Provider (Backend) 계약 검증

#### Django Provider 검증
```python
# feedbacks/tests/test_pact_provider.py
import json
import os
from django.test import TestCase
from pact import Verifier
from django.contrib.auth import get_user_model
from feedbacks.models import Feedback, FeedbackComment
from projects.models import Project, Video

User = get_user_model()

class FeedbackProviderTest(TestCase):
    """Provider contract verification for Feedback API"""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.verifier = Verifier(
            provider='VideoPlanet-Backend',
            provider_base_url='http://localhost:8000',
        )
    
    def setUp(self):
        """Set up provider states"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.user
        )
        
        self.video = Video.objects.create(
            id='550e8400-e29b-41d4-a716-446655440001',
            project=self.project,
            title='Test Video',
            url='https://example.com/video.mp4'
        )
    
    def test_verify_feedback_contract(self):
        """Verify all feedback-related contracts"""
        
        # Define provider states
        def provider_states(state):
            if state == 'user is authenticated':
                # Create auth token for test user
                from rest_framework.authtoken.models import Token
                Token.objects.create(user=self.user, key='valid-token')
                
            elif state == 'video has feedbacks':
                # Create sample feedbacks
                Feedback.objects.create(
                    id='550e8400-e29b-41d4-a716-446655440000',
                    video=self.video,
                    user=self.user,
                    timestamp=30.5,
                    content='Sample feedback',
                    status='open'
                )
                
            elif state == 'feedback exists':
                # Create feedback for comment testing
                Feedback.objects.create(
                    id='550e8400-e29b-41d4-a716-446655440000',
                    video=self.video,
                    user=self.user,
                    timestamp=30.5,
                    content='Sample feedback'
                )
                
            elif state == 'comment exists':
                # Create comment for reaction testing
                feedback = Feedback.objects.create(
                    video=self.video,
                    user=self.user,
                    timestamp=30.5,
                    content='Sample feedback'
                )
                FeedbackComment.objects.create(
                    id='550e8400-e29b-41d4-a716-446655440004',
                    feedback=feedback,
                    user=self.user,
                    content='Sample comment'
                )
        
        # Run verification
        output, logs = self.verifier.verify_pacts(
            './pacts/videoplanet-frontend-videoplanet-backend.json',
            provider_states_setup_url='http://localhost:8000/pact/provider-states',
            enable_pending=True,
            publish_verification_results=True
        )
        
        assert output == 0, f"Pact verification failed:\n{logs}"
```

#### Provider State Endpoint
```python
# feedbacks/views_pact.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json

@csrf_exempt
@require_POST
def provider_states(request):
    """Handle provider state setup for Pact testing"""
    
    data = json.loads(request.body)
    state = data.get('state')
    
    # Map states to setup functions
    state_handlers = {
        'user is authenticated': setup_authenticated_user,
        'video has feedbacks': setup_video_with_feedbacks,
        'feedback exists': setup_feedback,
        'comment exists': setup_comment,
    }
    
    handler = state_handlers.get(state)
    if handler:
        handler()
        return JsonResponse({'status': 'success'})
    
    return JsonResponse({'status': 'unknown state'}, status=400)

def setup_authenticated_user():
    """Create authenticated user state"""
    from django.contrib.auth import get_user_model
    from rest_framework.authtoken.models import Token
    
    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username='pact_test_user',
        defaults={'email': 'pact@test.com'}
    )
    Token.objects.get_or_create(user=user, key='valid-token')

def setup_video_with_feedbacks():
    """Create video with sample feedbacks"""
    from feedbacks.models import Feedback
    from projects.models import Video, Project
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    user = User.objects.get(username='pact_test_user')
    
    project, _ = Project.objects.get_or_create(
        name='Pact Test Project',
        defaults={'owner': user}
    )
    
    video, _ = Video.objects.get_or_create(
        id='550e8400-e29b-41d4-a716-446655440001',
        defaults={
            'project': project,
            'title': 'Pact Test Video',
            'url': 'https://example.com/video.mp4'
        }
    )
    
    Feedback.objects.get_or_create(
        id='550e8400-e29b-41d4-a716-446655440000',
        defaults={
            'video': video,
            'user': user,
            'timestamp': 30.5,
            'content': 'Sample feedback',
            'status': 'open'
        }
    )
```

## 3. Schema Validation Testing

### 3.1 OpenAPI Schema Validation
```typescript
// shared/lib/api/schema-validator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OpenAPIV3 } from 'openapi-types';
import openapiSchema from '../../../openapi.json';

export class SchemaValidator {
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();
  
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.loadSchemas();
  }
  
  private loadSchemas(): void {
    const spec = openapiSchema as OpenAPIV3.Document;
    
    // Extract and compile all schemas
    if (spec.components?.schemas) {
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        const compiled = this.ajv.compile(schema);
        this.schemas.set(name, compiled);
      });
    }
  }
  
  validate(schemaName: string, data: any): ValidationResult {
    const validator = this.schemas.get(schemaName);
    
    if (!validator) {
      return {
        valid: false,
        errors: [`Schema '${schemaName}' not found`],
      };
    }
    
    const valid = validator(data);
    
    return {
      valid,
      errors: valid ? [] : validator.errors?.map(e => 
        `${e.instancePath} ${e.message}`
      ) || [],
    };
  }
  
  validateRequest(
    path: string,
    method: string,
    data: any
  ): ValidationResult {
    // Find operation schema
    const operation = this.findOperation(path, method);
    if (!operation?.requestBody) {
      return { valid: true, errors: [] };
    }
    
    const schema = this.extractRequestSchema(operation.requestBody);
    return this.validateWithSchema(schema, data);
  }
  
  validateResponse(
    path: string,
    method: string,
    status: number,
    data: any
  ): ValidationResult {
    // Find operation schema
    const operation = this.findOperation(path, method);
    const response = operation?.responses?.[status];
    
    if (!response) {
      return {
        valid: false,
        errors: [`No schema for ${method} ${path} -> ${status}`],
      };
    }
    
    const schema = this.extractResponseSchema(response);
    return this.validateWithSchema(schema, data);
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### 3.2 Runtime Contract Validation
```typescript
// shared/lib/api/contract-middleware.ts
import { SchemaValidator } from './schema-validator';

export class ContractMiddleware {
  private validator = new SchemaValidator();
  
  async validateRequest(
    request: Request,
    next: (req: Request) => Promise<Response>
  ): Promise<Response> {
    const path = new URL(request.url).pathname;
    const method = request.method.toLowerCase();
    
    // Extract request body
    let body = null;
    if (request.body) {
      body = await request.json();
      
      // Validate against schema
      const validation = this.validator.validateRequest(path, method, body);
      
      if (!validation.valid) {
        console.error('Request validation failed:', validation.errors);
        
        if (process.env.NODE_ENV === 'development') {
          // In dev, log but allow request
          console.warn('Allowing invalid request in development');
        } else {
          // In production, reject invalid requests
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              details: validation.errors,
            }),
            { status: 400 }
          );
        }
      }
    }
    
    // Continue with request
    const response = await next(request);
    
    // Validate response
    if (response.ok) {
      const responseBody = await response.clone().json();
      const validation = this.validator.validateResponse(
        path,
        method,
        response.status,
        responseBody
      );
      
      if (!validation.valid) {
        console.error('Response validation failed:', validation.errors);
        
        // Track contract violation
        this.trackViolation({
          type: 'response',
          path,
          method,
          status: response.status,
          errors: validation.errors,
        });
      }
    }
    
    return response;
  }
  
  private trackViolation(violation: ContractViolation): void {
    // Send to monitoring service
    if (window.analytics) {
      window.analytics.track('Contract Violation', violation);
    }
    
    // In development, show notification
    if (process.env.NODE_ENV === 'development') {
      console.error('CONTRACT VIOLATION:', violation);
      
      // Show toast notification
      showToast({
        type: 'error',
        title: 'Contract Violation',
        message: `${violation.type} validation failed for ${violation.method} ${violation.path}`,
      });
    }
  }
}

interface ContractViolation {
  type: 'request' | 'response';
  path: string;
  method: string;
  status?: number;
  errors: string[];
}
```

## 4. WebSocket Contract Testing

### 4.1 WebSocket Message Contracts
```typescript
// shared/lib/realtime/__tests__/websocket.contract.test.ts
import { WebSocketContract } from '../websocket-contract';
import { z } from 'zod';

describe('WebSocket Message Contracts', () => {
  const contract = new WebSocketContract();
  
  beforeAll(() => {
    // Define message schemas
    contract.defineMessage('feedback.created', z.object({
      id: z.string().uuid(),
      video_id: z.string().uuid(),
      timestamp: z.number(),
      content: z.string(),
      user: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
      created_at: z.string().datetime(),
    }));
    
    contract.defineMessage('comment.added', z.object({
      id: z.string().uuid(),
      feedback_id: z.string().uuid(),
      parent_id: z.string().uuid().optional(),
      content: z.string(),
      user: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
      mentions: z.array(z.string().uuid()),
      created_at: z.string().datetime(),
    }));
    
    contract.defineMessage('user.joined', z.object({
      user_id: z.string().uuid(),
      name: z.string(),
      joined_at: z.string().datetime(),
    }));
    
    contract.defineMessage('user.left', z.object({
      user_id: z.string().uuid(),
      left_at: z.string().datetime(),
    }));
  });
  
  describe('Outgoing Messages', () => {
    it('should validate feedback.created message', () => {
      const message = {
        type: 'feedback.created',
        payload: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          video_id: '550e8400-e29b-41d4-a716-446655440001',
          timestamp: 30.5,
          content: 'Test feedback',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'John Doe',
          },
          created_at: '2025-08-24T10:00:00Z',
        },
      };
      
      const result = contract.validateOutgoing(message);
      expect(result.valid).toBe(true);
    });
    
    it('should reject invalid feedback.created message', () => {
      const message = {
        type: 'feedback.created',
        payload: {
          id: 'invalid-uuid',
          timestamp: 'not-a-number',
          // Missing required fields
        },
      };
      
      const result = contract.validateOutgoing(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid uuid');
    });
  });
  
  describe('Incoming Messages', () => {
    it('should validate and parse incoming messages', () => {
      const rawMessage = JSON.stringify({
        type: 'comment.added',
        payload: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          feedback_id: '550e8400-e29b-41d4-a716-446655440001',
          content: 'New comment',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Jane Doe',
          },
          mentions: [],
          created_at: '2025-08-24T10:30:00Z',
        },
      });
      
      const result = contract.parseIncoming(rawMessage);
      
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('comment.added');
      expect(result.data?.payload.content).toBe('New comment');
    });
  });
});
```

### 4.2 WebSocket Contract Implementation
```typescript
// shared/lib/realtime/websocket-contract.ts
import { z, ZodSchema } from 'zod';

export class WebSocketContract {
  private schemas = new Map<string, ZodSchema>();
  private violations: ContractViolation[] = [];
  
  defineMessage<T>(type: string, schema: ZodSchema<T>): void {
    this.schemas.set(type, schema);
  }
  
  validateOutgoing(message: any): ValidationResult {
    const schema = this.schemas.get(message.type);
    
    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown message type: ${message.type}`],
      };
    }
    
    try {
      schema.parse(message.payload);
      return { valid: true, errors: [] };
    } catch (error) {
      const errors = this.extractZodErrors(error);
      
      this.recordViolation({
        direction: 'outgoing',
        type: message.type,
        errors,
        timestamp: new Date().toISOString(),
      });
      
      return { valid: false, errors };
    }
  }
  
  parseIncoming(rawMessage: string): ParseResult {
    try {
      const message = JSON.parse(rawMessage);
      const schema = this.schemas.get(message.type);
      
      if (!schema) {
        throw new Error(`Unknown message type: ${message.type}`);
      }
      
      const payload = schema.parse(message.payload);
      
      return {
        success: true,
        data: { type: message.type, payload },
      };
    } catch (error) {
      const errors = error instanceof Error 
        ? [error.message] 
        : this.extractZodErrors(error);
      
      this.recordViolation({
        direction: 'incoming',
        type: 'unknown',
        errors,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        errors,
      };
    }
  }
  
  private extractZodErrors(error: any): string[] {
    if (error?.errors) {
      return error.errors.map((e: any) => 
        `${e.path.join('.')}: ${e.message}`
      );
    }
    return ['Validation error'];
  }
  
  private recordViolation(violation: ContractViolation): void {
    this.violations.push(violation);
    
    // Send to monitoring
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('WebSocket Contract Violation', violation);
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('WebSocket Contract Violation:', violation);
    }
  }
  
  getViolations(): ContractViolation[] {
    return [...this.violations];
  }
  
  clearViolations(): void {
    this.violations = [];
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface ParseResult {
  success: boolean;
  data?: any;
  errors?: string[];
}

interface ContractViolation {
  direction: 'incoming' | 'outgoing';
  type: string;
  errors: string[];
  timestamp: string;
}
```

## 5. Pact Broker Integration

### 5.1 Docker Compose Setup
```yaml
# docker-compose.pact.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact
      POSTGRES_DB: pact
    volumes:
      - pact-postgres:/var/lib/postgresql/data
    
  pact-broker:
    image: pactfoundation/pact-broker:latest
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_URL: postgres://pact:pact@postgres/pact
      PACT_BROKER_BASIC_AUTH_USERNAME: admin
      PACT_BROKER_BASIC_AUTH_PASSWORD: admin
      PACT_BROKER_ALLOW_PUBLIC_READ: "true"
      PACT_BROKER_LOG_LEVEL: INFO
    depends_on:
      - postgres
    
volumes:
  pact-postgres:
```

### 5.2 CI/CD Integration
```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

env:
  PACT_BROKER_URL: https://pact-broker.videoplanet.com
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

jobs:
  consumer-tests:
    name: Consumer Contract Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run consumer tests
        run: npm run test:pact:consumer
      
      - name: Publish contracts
        run: |
          npx pact-broker publish pacts \
            --broker-base-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN \
            --consumer-app-version=${{ github.sha }} \
            --tag=${{ github.ref_name }}
  
  provider-tests:
    name: Provider Contract Tests
    runs-on: ubuntu-latest
    needs: consumer-tests
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install
      
      - name: Run migrations
        run: poetry run python manage.py migrate
      
      - name: Verify contracts
        run: |
          poetry run python manage.py verify_pacts \
            --broker-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN \
            --provider-version=${{ github.sha }} \
            --publish-results
  
  can-i-deploy:
    name: Can I Deploy?
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Check deployment safety
        run: |
          npx pact-broker can-i-deploy \
            --broker-base-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN \
            --pacticipant=VideoPlanet-Frontend \
            --version=${{ github.sha }} \
            --to=production
          
          npx pact-broker can-i-deploy \
            --broker-base-url=$PACT_BROKER_URL \
            --broker-token=$PACT_BROKER_TOKEN \
            --pacticipant=VideoPlanet-Backend \
            --version=${{ github.sha }} \
            --to=production
```

## 6. Contract Monitoring

### 6.1 Runtime Contract Monitoring
```typescript
// shared/lib/monitoring/contract-monitor.ts
export class ContractMonitor {
  private violations: Map<string, ViolationStats> = new Map();
  private reportInterval: number = 60000; // 1 minute
  private timer: NodeJS.Timeout | null = null;
  
  start(): void {
    this.timer = setInterval(() => {
      this.reportViolations();
    }, this.reportInterval);
  }
  
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  recordViolation(violation: {
    endpoint: string;
    method: string;
    type: 'request' | 'response';
    error: string;
  }): void {
    const key = `${violation.method}:${violation.endpoint}:${violation.type}`;
    
    const stats = this.violations.get(key) || {
      count: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      errors: new Set<string>(),
    };
    
    stats.count++;
    stats.lastSeen = new Date();
    stats.errors.add(violation.error);
    
    this.violations.set(key, stats);
    
    // Alert on threshold
    if (stats.count > 10) {
      this.sendAlert({
        severity: 'high',
        message: `Contract violation threshold exceeded for ${key}`,
        details: stats,
      });
    }
  }
  
  private reportViolations(): void {
    if (this.violations.size === 0) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      violations: Array.from(this.violations.entries()).map(([key, stats]) => ({
        key,
        count: stats.count,
        firstSeen: stats.firstSeen.toISOString(),
        lastSeen: stats.lastSeen.toISOString(),
        uniqueErrors: stats.errors.size,
        errors: Array.from(stats.errors),
      })),
    };
    
    // Send to monitoring service
    fetch('/api/monitoring/contract-violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(console.error);
    
    // Clear violations after reporting
    this.violations.clear();
  }
  
  private sendAlert(alert: Alert): void {
    // Send to alerting service
    if (window.Sentry) {
      window.Sentry.captureMessage(alert.message, alert.severity);
    }
    
    console.error('Contract Alert:', alert);
  }
}

interface ViolationStats {
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  errors: Set<string>;
}

interface Alert {
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: any;
}
```

### 6.2 Contract Dashboard
```typescript
// pages/monitoring/contracts/page.tsx
import { useContractMetrics } from '@/features/monitoring/hooks/useContractMetrics';
import { ContractViolationChart } from '@/widgets/monitoring/ContractViolationChart';
import { ContractCoverageMatrix } from '@/widgets/monitoring/ContractCoverageMatrix';

export default function ContractDashboard() {
  const { violations, coverage, trends } = useContractMetrics();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Testing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Violation Trends</h2>
          <ContractViolationChart data={trends} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Coverage Matrix</h2>
          <ContractCoverageMatrix coverage={coverage} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Violations</h2>
          <ViolationsList violations={violations} />
        </div>
      </div>
    </div>
  );
}
```

## 7. 마이그레이션 가이드

### 7.1 단계별 도입 전략

#### Phase 1: 기반 구축 (Week 1)
```bash
# 1. Pact 설치
npm install --save-dev @pact-foundation/pact @pact-foundation/pact-node

# 2. Schema validation 설치
npm install --save-dev ajv ajv-formats openapi-types

# 3. Pact Broker 설정
docker-compose -f docker-compose.pact.yml up -d

# 4. 기본 contract 작성
npm run test:pact:consumer
```

#### Phase 2: 핵심 API 계약 (Week 2)
- [ ] Feedback API contracts
- [ ] Comment API contracts
- [ ] WebSocket message contracts
- [ ] Provider verification setup

#### Phase 3: 자동화 통합 (Week 3)
- [ ] CI/CD pipeline integration
- [ ] Pact Broker publishing
- [ ] Can-i-deploy checks
- [ ] Contract monitoring setup

#### Phase 4: 전체 적용 (Week 4)
- [ ] All endpoints covered
- [ ] Runtime validation enabled
- [ ] Dashboard deployment
- [ ] Team training complete

### 7.2 체크리스트

#### Consumer (Frontend)
- [ ] Pact tests for all API calls
- [ ] Schema validation middleware
- [ ] WebSocket contract validation
- [ ] Contract publishing to broker

#### Provider (Backend)
- [ ] Provider state handlers
- [ ] Contract verification tests
- [ ] Verification result publishing
- [ ] Backwards compatibility checks

#### Infrastructure
- [ ] Pact Broker deployed
- [ ] CI/CD pipelines configured
- [ ] Monitoring dashboards ready
- [ ] Alert rules configured

## 8. 모범 사례

### 8.1 Contract 작성 원칙
1. **최소한의 계약**: 필수 필드만 검증
2. **유연한 매칭**: 정확한 값보다 타입과 형식 검증
3. **버전 관리**: Breaking changes는 새 버전으로
4. **문서화**: 각 계약의 목적과 사용법 명시

### 8.2 테스트 전략
1. **격리된 테스트**: 외부 의존성 최소화
2. **결정론적 데이터**: 랜덤 값 대신 고정값 사용
3. **상태 관리**: Provider states 명확히 정의
4. **실패 처리**: Contract 위반 시 명확한 에러 메시지

### 8.3 팀 협업
1. **Contract-First 개발**: API 변경 전 계약 먼저 수정
2. **리뷰 프로세스**: Contract 변경은 양 팀 리뷰 필수
3. **버전 조율**: Consumer/Provider 버전 호환성 관리
4. **문서 자동화**: OpenAPI/AsyncAPI 문서 자동 생성

---

작성일: 2025-08-24
작성자: Arthur (Chief Architect)
버전: 1.0.0