# VideoPlanet 계약 테스트 전략 (Contract Testing Strategy)

## 개요
본 문서는 VideoPlanet 프로젝트의 Frontend-Backend 간 API 계약을 검증하기 위한 Consumer-Driven Contract Testing 전략을 정의합니다.

## 목표

### 주요 목표
1. **API 계약 안정성**: Frontend와 Backend 간 인터페이스 보장
2. **독립적 개발**: 팀 간 독립적인 개발 및 배포 가능
3. **조기 문제 감지**: 통합 전 계약 위반 사항 발견
4. **문서 자동화**: 계약을 통한 API 문서 자동 생성

### 성공 지표
- 계약 테스트 커버리지: 100% (모든 API 엔드포인트)
- 계약 위반 감지율: 배포 전 95% 이상
- 통합 테스트 시간: 50% 단축
- API 문서 정확도: 100% (자동 생성)

## 아키텍처

### 계약 테스트 플로우
```mermaid
graph LR
    subgraph "Consumer (Frontend)"
        FE[Next.js App]
        CT[Contract Tests]
        Pact[Pact Files]
    end
    
    subgraph "Pact Broker"
        Broker[Pact Broker]
        Webhooks[Webhooks]
        Reports[Reports]
    end
    
    subgraph "Provider (Backend)"
        BE[Django API]
        PV[Provider Verification]
        Results[Test Results]
    end
    
    FE --> CT
    CT --> Pact
    Pact --> Broker
    Broker --> PV
    BE --> PV
    PV --> Results
    Results --> Broker
    Broker --> Webhooks
    Broker --> Reports
```

## 구현 전략

### 1. Consumer 계약 정의 (Frontend)

#### 설치 및 설정
```bash
# Pact 라이브러리 설치
npm install --save-dev @pact-foundation/pact @pact-foundation/pact-node

# TypeScript 타입 정의
npm install --save-dev @types/jest @types/node
```

#### 계약 테스트 구조
```typescript
// test/contracts/project.contract.test.ts
import { Pact } from '@pact-foundation/pact';
import { like, term, eachLike } from '@pact-foundation/pact/src/dsl/matchers';
import { projectAPI } from '@/shared/api/project';

describe('Project API Contract', () => {
  const provider = new Pact({
    consumer: 'VideoPlanet-Frontend',
    provider: 'VideoPlanet-Backend',
    port: 8080,
    log: 'logs/pact.log',
    dir: 'pacts',
    logLevel: 'INFO',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Create Project', () => {
    test('should create a new project', async () => {
      // Given: 계약 정의
      await provider.addInteraction({
        state: 'authenticated user exists',
        uponReceiving: 'a request to create a project',
        withRequest: {
          method: 'POST',
          path: '/api/v1/projects',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': term({
              matcher: 'Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: {
            title: like('My Video Project'),
            description: like('Project description'),
            deadline: term({
              matcher: '\\d{4}-\\d{2}-\\d{2}',
              generate: '2025-12-31',
            }),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like('proj_123'),
            title: like('My Video Project'),
            description: like('Project description'),
            deadline: like('2025-12-31'),
            status: like('active'),
            createdAt: term({
              matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z',
              generate: '2025-08-23T10:00:00Z',
            }),
            owner: {
              id: like('user_456'),
              name: like('John Doe'),
              email: like('john@example.com'),
            },
          },
        },
      });

      // When: API 호출
      const response = await projectAPI.create({
        title: 'My Video Project',
        description: 'Project description',
        deadline: '2025-12-31',
      });

      // Then: 검증
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe('My Video Project');
    });
  });

  describe('Get Projects List', () => {
    test('should return paginated projects', async () => {
      await provider.addInteraction({
        state: 'projects exist',
        uponReceiving: 'a request for projects list',
        withRequest: {
          method: 'GET',
          path: '/api/v1/projects',
          query: {
            page: '1',
            limit: '10',
            status: 'active',
          },
        },
        willRespondWith: {
          status: 200,
          body: {
            data: eachLike({
              id: like('proj_123'),
              title: like('Project Title'),
              status: like('active'),
              progress: like(75),
            }),
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(50),
              totalPages: like(5),
            },
          },
        },
      });

      const response = await projectAPI.list({
        page: 1,
        limit: 10,
        status: 'active',
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.pagination).toBeDefined();
    });
  });
});
```

### 2. Provider 검증 (Backend)

#### Django 설정
```python
# test/contract_tests/test_project_contract.py
import pytest
from pact import Verifier

@pytest.fixture
def pact_verifier():
    return Verifier(
        provider='VideoPlanet-Backend',
        provider_base_url='http://localhost:8000',
    )

class TestProjectContract:
    def test_project_contract(self, pact_verifier):
        # Provider 상태 설정
        pact_verifier.set_state_setup_url('http://localhost:8000/test/setup')
        pact_verifier.set_state_teardown_url('http://localhost:8000/test/teardown')
        
        # Pact Broker에서 계약 가져오기
        pact_verifier.broker_source(
            broker_url='http://pact-broker.videoplanet.com',
            username='admin',
            password='secure_password',
            enable_pending=True,
            include_wip_pacts_since='2025-08-01',
        )
        
        # 검증 실행
        success, logs = pact_verifier.verify_pacts()
        
        assert success == 0
```

#### Provider 상태 관리
```python
# test/contract_tests/provider_states.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()

class ProviderStates:
    @staticmethod
    def authenticated_user_exists():
        """인증된 사용자가 존재하는 상태"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        return {'user_id': user.id, 'token': generate_token(user)}
    
    @staticmethod
    def projects_exist():
        """프로젝트가 존재하는 상태"""
        user = User.objects.get(username='testuser')
        for i in range(15):
            Project.objects.create(
                title=f'Project {i+1}',
                description=f'Description {i+1}',
                owner=user,
                status='active' if i < 10 else 'completed'
            )
        return {'project_count': 15}
    
    @staticmethod
    def cleanup():
        """테스트 데이터 정리"""
        Project.objects.all().delete()
        User.objects.filter(username='testuser').delete()
```

### 3. WebSocket 계약 테스트

#### 실시간 통신 계약
```typescript
// test/contracts/websocket.contract.test.ts
import { MessageConsumer, synchronousBodyHandler } from '@pact-foundation/pact';
import { like, term } from '@pact-foundation/pact/src/dsl/matchers';

describe('WebSocket Contract', () => {
  const messagePact = new MessageConsumer({
    consumer: 'VideoPlanet-Frontend',
    provider: 'VideoPlanet-WebSocket',
    dir: 'pacts',
  });

  describe('Feedback Real-time Updates', () => {
    test('should receive feedback created event', () => {
      return messagePact
        .expectsToReceive('a feedback created event')
        .withContent({
          type: 'feedback.created',
          data: {
            id: like('fb_123'),
            projectId: like('proj_456'),
            content: like('Great work!'),
            timestamp: like(120),
            user: {
              id: like('user_789'),
              name: like('Jane Doe'),
            },
            createdAt: term({
              matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z',
              generate: '2025-08-23T10:00:00Z',
            }),
          },
        })
        .withMetadata({
          'content-type': 'application/json',
          channel: '/ws/feedback/proj_456',
        })
        .verify(synchronousBodyHandler((message) => {
          expect(message.type).toBe('feedback.created');
          expect(message.data).toHaveProperty('id');
          expect(message.data.projectId).toBe('proj_456');
        }));
    });

    test('should receive typing indicator', () => {
      return messagePact
        .expectsToReceive('a typing indicator event')
        .withContent({
          type: 'user.typing',
          data: {
            userId: like('user_123'),
            userName: like('John Doe'),
            isTyping: like(true),
            projectId: like('proj_456'),
          },
        })
        .verify(synchronousBodyHandler((message) => {
          expect(message.type).toBe('user.typing');
          expect(message.data.isTyping).toBeDefined();
        }));
    });
  });
});
```

### 4. Pact Broker 설정

#### Docker Compose 구성
```yaml
# docker-compose.pact.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact_password
      POSTGRES_DB: pact_broker
    volumes:
      - pact_postgres_data:/var/lib/postgresql/data

  pact-broker:
    image: pactfoundation/pact-broker:latest
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_URL: postgres://pact:pact_password@postgres/pact_broker
      PACT_BROKER_BASIC_AUTH_USERNAME: admin
      PACT_BROKER_BASIC_AUTH_PASSWORD: secure_password
      PACT_BROKER_WEBHOOK_HOST_WHITELIST: "github.com"
      PACT_BROKER_BASE_URL: "http://pact-broker.videoplanet.com"
    depends_on:
      - postgres

volumes:
  pact_postgres_data:
```

#### Webhook 설정
```json
{
  "events": [{
    "name": "contract_content_changed"
  }],
  "request": {
    "method": "POST",
    "url": "https://api.github.com/repos/videoplanet/backend/dispatches",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "token ${GITHUB_TOKEN}"
    },
    "body": {
      "event_type": "contract-changed",
      "client_payload": {
        "pact_url": "${pactbroker.pactUrl}",
        "consumer": "${pactbroker.consumerName}",
        "provider": "${pactbroker.providerName}"
      }
    }
  }
}
```

### 5. CI/CD 통합

#### GitHub Actions - Consumer
```yaml
# .github/workflows/contract-consumer.yml
name: Consumer Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run contract tests
        run: npm run test:contracts
        
      - name: Publish pacts
        run: |
          npx pact-broker publish pacts \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-username=${{ secrets.PACT_BROKER_USERNAME }} \
            --broker-password=${{ secrets.PACT_BROKER_PASSWORD }} \
            --consumer-app-version=${{ github.sha }} \
            --tag=${{ github.ref_name }}
```

#### GitHub Actions - Provider
```yaml
# .github/workflows/contract-provider.yml
name: Provider Contract Verification

on:
  repository_dispatch:
    types: [contract-changed]
  push:
    branches: [main, develop]

jobs:
  verify-contracts:
    runs-on: ubuntu-latest
    
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
          pip install -r requirements.txt
          pip install pact-python
          
      - name: Run migrations
        run: python manage.py migrate
        
      - name: Start test server
        run: |
          python manage.py runserver &
          sleep 5
          
      - name: Verify contracts
        run: |
          python -m pytest test/contract_tests \
            --pact-broker-url=${{ secrets.PACT_BROKER_URL }} \
            --pact-broker-username=${{ secrets.PACT_BROKER_USERNAME }} \
            --pact-broker-password=${{ secrets.PACT_BROKER_PASSWORD }}
          
      - name: Publish results
        if: always()
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=VideoPlanet-Backend \
            --version=${{ github.sha }} \
            --to=${{ github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }}
```

## 계약 테스트 패턴

### 1. Request/Response 매칭
```typescript
// 유연한 매칭 사용
const flexibleBody = {
  id: like('any-id'),                    // 타입만 매칭
  email: term({                          // 정규식 매칭
    matcher: '.+@.+\\..+',
    generate: 'user@example.com'
  }),
  items: eachLike({                      // 배열 요소 매칭
    name: like('Item'),
    price: like(100)
  }),
  timestamp: like(1234567890),           // 숫자 타입
  isActive: like(true),                   // 불린 타입
};
```

### 2. Provider 상태 관리
```typescript
// Consumer 측
await provider.addInteraction({
  state: 'user with projects exists',
  // ... 나머지 interaction
});

// Provider 측
@app.route('/test/setup', methods=['POST'])
def provider_state_setup():
    state = request.json.get('state')
    if state == 'user with projects exists':
        create_test_user_with_projects()
    return jsonify({'status': 'ok'})
```

### 3. 비동기 메시지 계약
```typescript
// 이벤트 발행자 (Publisher)
describe('Event Publisher Contract', () => {
  test('publishes project created event', () => {
    return messagePact
      .publishesAMessageTo('project.events')
      .withContent({
        eventType: 'PROJECT_CREATED',
        projectId: like('proj_123'),
        timestamp: like(Date.now()),
      });
  });
});

// 이벤트 구독자 (Subscriber)
describe('Event Subscriber Contract', () => {
  test('handles project created event', () => {
    return messagePact
      .expectsToReceive('project created event')
      .withContent({
        eventType: 'PROJECT_CREATED',
        projectId: like('proj_123'),
      })
      .verify(handleProjectCreatedEvent);
  });
});
```

## 모니터링 및 리포팅

### Pact Broker 대시보드
```
http://pact-broker.videoplanet.com

주요 메트릭:
- 계약 수: 45개
- Consumer: 3개 (Frontend, Mobile, Admin)
- Provider: 2개 (Backend, WebSocket)
- 검증 성공률: 98%
- 최근 실패: 1개
```

### 계약 매트릭스
```
┌─────────────┬──────────┬───────────┬────────┐
│ Consumer    │ Version  │ Provider  │ Status │
├─────────────┼──────────┼───────────┼────────┤
│ Frontend    │ v2.1.0   │ Backend   │ ✅     │
│ Frontend    │ v2.1.0   │ WebSocket │ ✅     │
│ Mobile      │ v1.5.0   │ Backend   │ ✅     │
│ Admin       │ v1.2.0   │ Backend   │ ❌     │
└─────────────┴──────────┴───────────┴────────┘
```

## 베스트 프랙티스

### DO's ✅
1. **Consumer 우선**: Consumer의 실제 니즈 기반 계약 작성
2. **유연한 매칭**: 엄격한 값 대신 타입/패턴 매칭 사용
3. **버전 태깅**: 환경별 버전 태그 관리
4. **자동화**: CI/CD 파이프라인 완전 통합
5. **문서화**: 계약을 API 문서로 활용

### DON'Ts ❌
1. **과도한 제약**: 불필요하게 엄격한 매칭 피하기
2. **상태 의존**: Provider 상태 간 의존성 생성 금지
3. **수동 검증**: 모든 검증은 자동화
4. **계약 중복**: 동일한 시나리오 중복 테스트 금지
5. **민감정보**: 계약에 실제 인증 정보 포함 금지

## 트러블슈팅

### 일반적인 문제 해결

#### 1. 계약 검증 실패
```bash
# 상세 로그 확인
npm run test:contracts -- --verbose

# Provider 로그 확인
tail -f logs/provider-verification.log

# Pact diff 확인
npx pact-broker diff --consumer Frontend --provider Backend
```

#### 2. Broker 연결 실패
```bash
# 연결 테스트
curl -u admin:password http://pact-broker.videoplanet.com/

# 네트워크 확인
telnet pact-broker.videoplanet.com 9292
```

#### 3. 상태 설정 오류
```python
# Provider 상태 디버깅
import logging
logging.basicConfig(level=logging.DEBUG)

@app.before_request
def log_request():
    logger.debug(f"State: {request.json}")
```

## 교육 및 온보딩

### 팀 교육 자료
1. **기초 과정**: Pact 개념 및 원리 (2시간)
2. **실습 과정**: 계약 작성 실습 (4시간)
3. **고급 과정**: 복잡한 시나리오 처리 (2시간)
4. **운영 과정**: Broker 관리 및 모니터링 (2시간)

### 체크리스트
- [ ] 개발 환경 Pact 설치
- [ ] 첫 계약 테스트 작성
- [ ] Broker 계정 생성
- [ ] CI/CD 파이프라인 이해
- [ ] 계약 검증 프로세스 숙지

## 메트릭 및 KPI

### 월간 추적 지표
- 계약 테스트 커버리지
- 계약 깨짐 빈도
- 평균 해결 시간
- Consumer/Provider 독립 배포 횟수
- 통합 버그 감소율

### 성공 기준
- 3개월 내: 80% API 커버리지
- 6개월 내: 100% API 커버리지
- 통합 버그: 50% 감소
- 배포 주기: 30% 단축

## 로드맵

### Phase 1 (현재 - 2025-09)
- Pact 도입 및 설정
- 핵심 API 계약 작성
- Broker 구축

### Phase 2 (2025-10 - 2025-11)
- 전체 API 커버리지
- WebSocket 계약 추가
- 자동화 완성

### Phase 3 (2025-12 - 2026-01)
- GraphQL 계약 도입
- 성능 계약 테스트
- 크로스 팀 확장

**작성자**: Arthur (Chief Architect)
**버전**: 1.0.0
**최종 수정**: 2025-08-23