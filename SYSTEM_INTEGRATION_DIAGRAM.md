# VideoPlanet 시스템 통합 아키텍처 다이어그램

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App - Future]
    end
    
    subgraph "CDN & Edge"
        Vercel[Vercel Edge Network]
        CloudFront[CloudFront CDN]
    end
    
    subgraph "Frontend - Next.js App"
        subgraph "FSD Architecture"
            APP[app layer]
            PROC[processes layer]
            PAGES[pages layer]
            WIDGETS[widgets layer]
            FEATURES[features layer]
            ENTITIES[entities layer]
            SHARED[shared layer]
        end
        
        subgraph "State Management"
            Redux[Redux Toolkit]
            RTKQuery[RTK Query]
            WSManager[WebSocket Manager]
        end
    end
    
    subgraph "API Gateway"
        APIGW[API Gateway]
        Auth[Auth Service]
        RateLimit[Rate Limiter]
    end
    
    subgraph "Backend - Django"
        subgraph "Django Apps"
            Core[core]
            Projects[projects]
            Feedbacks[feedbacks]
            AIPlanning[ai_planning]
            Users[users]
        end
        
        subgraph "Middleware"
            CORS[CORS Handler]
            JWT[JWT Auth]
            Throttle[Throttling]
        end
        
        subgraph "Real-time"
            Channels[Django Channels]
            Daphne[Daphne ASGI]
        end
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[AWS S3]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        GoogleImg[Google Images API]
        SendGrid[SendGrid Email]
        Sentry[Sentry Monitoring]
    end
    
    Browser --> Vercel
    Mobile --> CloudFront
    Vercel --> APP
    CloudFront --> APP
    
    APP --> PROC
    PROC --> PAGES
    PAGES --> WIDGETS
    WIDGETS --> FEATURES
    FEATURES --> ENTITIES
    ENTITIES --> SHARED
    
    FEATURES --> Redux
    ENTITIES --> RTKQuery
    FEATURES --> WSManager
    
    RTKQuery --> APIGW
    WSManager --> Daphne
    
    APIGW --> Auth
    APIGW --> RateLimit
    APIGW --> Core
    
    Core --> Projects
    Core --> Feedbacks
    Core --> AIPlanning
    Core --> Users
    
    Daphne --> Channels
    Channels --> Redis
    
    Projects --> PostgreSQL
    Feedbacks --> PostgreSQL
    AIPlanning --> PostgreSQL
    Users --> PostgreSQL
    
    AIPlanning --> OpenAI
    AIPlanning --> GoogleImg
    Users --> SendGrid
    Core --> Sentry
    
    Projects --> S3
    Feedbacks --> S3
```

## 2. FSD 레이어 의존성 다이어그램

```mermaid
graph TD
    subgraph "Import Direction (Top to Bottom Only)"
        APP[app - Routes & Providers]
        PROC[processes - Multi-step Flows]
        PAGES[pages - Page Components]
        WIDGETS[widgets - Complex UI Blocks]
        FEATURES[features - User Actions]
        ENTITIES[entities - Business Logic]
        SHARED[shared - Utilities]
    end
    
    APP --> PROC
    APP --> PAGES
    APP --> WIDGETS
    APP --> FEATURES
    APP --> ENTITIES
    APP --> SHARED
    
    PROC --> PAGES
    PROC --> WIDGETS
    PROC --> FEATURES
    PROC --> ENTITIES
    PROC --> SHARED
    
    PAGES --> WIDGETS
    PAGES --> FEATURES
    PAGES --> ENTITIES
    PAGES --> SHARED
    
    WIDGETS --> FEATURES
    WIDGETS --> ENTITIES
    WIDGETS --> SHARED
    
    FEATURES --> ENTITIES
    FEATURES --> SHARED
    
    ENTITIES --> SHARED
    
    style APP fill:#e1f5fe
    style PROC fill:#b3e5fc
    style PAGES fill:#81d4fa
    style WIDGETS fill:#4fc3f7
    style FEATURES fill:#29b6f6
    style ENTITIES fill:#03a9f4
    style SHARED fill:#0288d1
```

## 3. API 통합 플로우

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant APIGateway
    participant Django
    participant DB
    participant Redis
    
    User->>Browser: 액션 수행
    Browser->>NextJS: 요청 전송
    NextJS->>NextJS: RTK Query 캐시 확인
    
    alt 캐시 히트
        NextJS-->>Browser: 캐시된 데이터 반환
    else 캐시 미스
        NextJS->>APIGateway: API 요청
        APIGateway->>APIGateway: 인증 검증
        APIGateway->>APIGateway: Rate Limit 체크
        APIGateway->>Django: 요청 전달
        
        Django->>Redis: 캐시 확인
        alt Redis 캐시 히트
            Redis-->>Django: 캐시 데이터
        else Redis 캐시 미스
            Django->>DB: 쿼리 실행
            DB-->>Django: 결과 반환
            Django->>Redis: 캐시 저장
        end
        
        Django-->>APIGateway: 응답
        APIGateway-->>NextJS: 응답
        NextJS->>NextJS: RTK Query 캐시 저장
        NextJS-->>Browser: 데이터 렌더링
    end
    
    Browser-->>User: UI 업데이트
```

## 4. WebSocket 실시간 통신 아키텍처

```mermaid
graph LR
    subgraph "Clients"
        C1[Client 1]
        C2[Client 2]
        C3[Client 3]
    end
    
    subgraph "WebSocket Connections"
        WS1[WS Connection 1]
        WS2[WS Connection 2]
        WS3[WS Connection 3]
    end
    
    subgraph "Django Channels"
        subgraph "Channel Layers"
            CL1[Channel Layer]
            CL2[Channel Layer]
        end
        
        subgraph "Consumers"
            FC[FeedbackConsumer]
            PC[ProjectConsumer]
            NC[NotificationConsumer]
        end
    end
    
    subgraph "Redis PubSub"
        RP[Redis PubSub]
        Groups[Channel Groups]
    end
    
    C1 --> WS1
    C2 --> WS2
    C3 --> WS3
    
    WS1 --> CL1
    WS2 --> CL1
    WS3 --> CL2
    
    CL1 --> FC
    CL1 --> PC
    CL2 --> NC
    
    FC --> RP
    PC --> RP
    NC --> RP
    
    RP --> Groups
    Groups --> CL1
    Groups --> CL2
```

## 5. 캐싱 전략 다이어그램

```mermaid
graph TB
    subgraph "L1: Browser Cache"
        RTK[RTK Query Cache<br/>TTL: 5min]
        LocalStorage[LocalStorage<br/>TTL: Session]
    end
    
    subgraph "L2: Edge Cache"
        VercelCache[Vercel Edge Cache<br/>TTL: 1hr]
        StaticAssets[Static Assets<br/>TTL: 30days]
    end
    
    subgraph "L3: Application Cache"
        RedisCache[Redis Cache<br/>TTL: 24hr]
        QueryCache[Query Result Cache]
        SessionCache[Session Cache]
    end
    
    subgraph "L4: Database"
        PostgreSQL[(PostgreSQL<br/>Persistent)]
        Indexes[Optimized Indexes]
    end
    
    RTK --> VercelCache
    LocalStorage --> VercelCache
    VercelCache --> RedisCache
    StaticAssets --> RedisCache
    RedisCache --> PostgreSQL
    QueryCache --> PostgreSQL
    SessionCache --> PostgreSQL
    PostgreSQL --> Indexes
    
    style RTK fill:#fff3e0
    style LocalStorage fill:#ffe0b2
    style VercelCache fill:#ffcc80
    style StaticAssets fill:#ffb74d
    style RedisCache fill:#ffa726
    style QueryCache fill:#ff9800
    style SessionCache fill:#fb8c00
    style PostgreSQL fill:#f57c00
```

## 6. 배포 파이프라인

```mermaid
graph LR
    subgraph "Development"
        Dev[Local Development]
        Tests[Unit/Integration Tests]
    end
    
    subgraph "CI/CD"
        GitHub[GitHub]
        Actions[GitHub Actions]
        Quality[Quality Gates]
    end
    
    subgraph "Staging"
        VercelPreview[Vercel Preview]
        RailwayStaging[Railway Staging]
    end
    
    subgraph "Production"
        VercelProd[Vercel Production]
        RailwayProd[Railway Production]
    end
    
    subgraph "Monitoring"
        Sentry[Sentry]
        Analytics[Analytics]
        Logs[CloudWatch Logs]
    end
    
    Dev --> Tests
    Tests --> GitHub
    GitHub --> Actions
    Actions --> Quality
    
    Quality -->|Pass| VercelPreview
    Quality -->|Pass| RailwayStaging
    
    VercelPreview -->|Approve| VercelProd
    RailwayStaging -->|Approve| RailwayProd
    
    VercelProd --> Sentry
    RailwayProd --> Sentry
    VercelProd --> Analytics
    RailwayProd --> Logs
```

## 7. 데이터 플로우 다이어그램

```mermaid
graph TB
    subgraph "User Actions"
        CreateProject[프로젝트 생성]
        UploadVideo[비디오 업로드]
        AddFeedback[피드백 추가]
        GeneratePlan[AI 기획 생성]
    end
    
    subgraph "Frontend Processing"
        Validation[입력 검증]
        Optimization[낙관적 업데이트]
        StateUpdate[상태 업데이트]
    end
    
    subgraph "API Layer"
        REST[REST API]
        WebSocket[WebSocket]
        GraphQL[GraphQL - Future]
    end
    
    subgraph "Backend Processing"
        BusinessLogic[비즈니스 로직]
        Authorization[권한 검증]
        DataTransform[데이터 변환]
    end
    
    subgraph "Data Persistence"
        Database[(Database)]
        FileStorage[File Storage]
        Cache[(Cache)]
    end
    
    subgraph "Event Broadcasting"
        EventBus[Event Bus]
        Notifications[알림]
        RealtimeSync[실시간 동기화]
    end
    
    CreateProject --> Validation
    UploadVideo --> Validation
    AddFeedback --> Validation
    GeneratePlan --> Validation
    
    Validation --> Optimization
    Optimization --> StateUpdate
    StateUpdate --> REST
    StateUpdate --> WebSocket
    
    REST --> BusinessLogic
    WebSocket --> BusinessLogic
    BusinessLogic --> Authorization
    Authorization --> DataTransform
    
    DataTransform --> Database
    DataTransform --> FileStorage
    DataTransform --> Cache
    
    Database --> EventBus
    EventBus --> Notifications
    EventBus --> RealtimeSync
    
    RealtimeSync --> WebSocket
    Notifications --> REST
```

## 8. 보안 아키텍처

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            HTTPS[HTTPS/TLS]
            WAF[Web Application Firewall]
            DDoS[DDoS Protection]
        end
        
        subgraph "Application Security"
            CORS[CORS Policy]
            CSP[Content Security Policy]
            XSS[XSS Protection]
            CSRF[CSRF Protection]
        end
        
        subgraph "Authentication & Authorization"
            JWT[JWT Tokens]
            OAuth[OAuth 2.0 - Future]
            RBAC[Role-Based Access Control]
            MFA[Multi-Factor Auth - Future]
        end
        
        subgraph "Data Security"
            Encryption[Encryption at Rest]
            Transit[Encryption in Transit]
            PII[PII Protection]
            Audit[Audit Logging]
        end
    end
    
    HTTPS --> WAF
    WAF --> DDoS
    DDoS --> CORS
    CORS --> CSP
    CSP --> XSS
    XSS --> CSRF
    CSRF --> JWT
    JWT --> OAuth
    OAuth --> RBAC
    RBAC --> MFA
    MFA --> Encryption
    Encryption --> Transit
    Transit --> PII
    PII --> Audit
```

## 9. 성능 모니터링 아키텍처

```mermaid
graph LR
    subgraph "Metrics Collection"
        WebVitals[Web Vitals]
        APM[APM Metrics]
        Custom[Custom Metrics]
    end
    
    subgraph "Processing"
        Aggregation[Aggregation]
        Analysis[Analysis]
        Alerting[Alerting]
    end
    
    subgraph "Storage"
        TimeSeries[(Time Series DB)]
        Logs[(Log Storage)]
    end
    
    subgraph "Visualization"
        Dashboard[Dashboard]
        Reports[Reports]
        Alerts[Alert Notifications]
    end
    
    WebVitals --> Aggregation
    APM --> Aggregation
    Custom --> Aggregation
    
    Aggregation --> Analysis
    Analysis --> Alerting
    
    Analysis --> TimeSeries
    Alerting --> Logs
    
    TimeSeries --> Dashboard
    Logs --> Reports
    Alerting --> Alerts
```

## 주요 통합 포인트

### 1. Frontend ↔ Backend
- **REST API**: `/api/v1/*` 엔드포인트
- **WebSocket**: `/ws/*` 실시간 채널
- **파일 업로드**: Multipart form-data

### 2. 캐싱 계층
- **브라우저**: RTK Query (5분)
- **CDN**: Vercel Edge (1시간)
- **Redis**: Application Cache (24시간)
- **Database**: Persistent Storage

### 3. 인증 플로우
- **JWT 토큰**: Access (7일) / Refresh (28일)
- **세션 관리**: Redis 기반
- **권한 체크**: RBAC 모델

### 4. 실시간 동기화
- **WebSocket 채널**: 프로젝트별 구독
- **이벤트 브로드캐스팅**: Redis PubSub
- **상태 일관성**: Optimistic UI + Server Reconciliation

### 5. 에러 처리
- **Frontend**: Error Boundary + Toast
- **Backend**: Custom Exception Classes
- **모니터링**: Sentry Integration
- **로깅**: Structured Logging

## 구현 우선순위

1. **Phase 1**: API Gateway 구현
2. **Phase 2**: WebSocket Manager 개발
3. **Phase 3**: 캐싱 전략 구현
4. **Phase 4**: 모니터링 설정
5. **Phase 5**: 보안 강화

이 아키텍처는 확장 가능하고 유지보수가 용이한 시스템을 구축하기 위한 청사진입니다.