# VideoPlanet Deployment & Infrastructure Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Environments](#environments)
3. [Branch Strategy](#branch-strategy)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Observability](#monitoring--observability)
8. [Disaster Recovery](#disaster-recovery)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────────┬────────────────────┬────────────────────┘
                   │                    │
        ┌──────────▼──────────┐ ┌──────▼──────────┐
        │   Vercel (CDN)      │ │  Cloudflare     │
        │   - Frontend        │ │  - DNS          │
        │   - Static Assets   │ │  - DDoS Protect │
        └──────────┬──────────┘ └─────────────────┘
                   │
                   │ HTTPS/API Calls
                   │
        ┌──────────▼──────────────────────────────┐
        │         Railway Platform                 │
        │  ┌────────────────────────────────┐     │
        │  │   Django Application           │     │
        │  │   - REST API                   │     │
        │  │   - WebSocket (Channels)       │     │
        │  │   - Daphne ASGI Server         │     │
        │  └────────┬───────────────────────┘     │
        │           │                              │
        │  ┌────────▼────────┐  ┌────────────┐   │
        │  │  PostgreSQL     │  │   Redis    │   │
        │  │  - Primary DB   │  │  - Cache   │   │
        │  └─────────────────┘  │  - Channels│   │
        │                        └────────────┘   │
        └──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │    AWS S3           │
        │  - Media Storage    │
        │  - Static Files     │
        └─────────────────────┘
```

## Environments

### 1. Local Development
- **Purpose**: Individual developer workstations
- **URL**: http://localhost:3000 (frontend), http://localhost:8000 (backend)
- **Database**: SQLite or local PostgreSQL
- **Branch**: feature/* branches

### 2. Staging/Preview
- **Purpose**: Testing and QA
- **Frontend URL**: https://videoplanet-staging.vercel.app
- **Backend URL**: https://videoplanet-api-staging.railway.app
- **Database**: PostgreSQL (Railway staging)
- **Branch**: develop

### 3. Production
- **Purpose**: Live environment
- **Frontend URL**: https://videoplanet.com
- **Backend URL**: https://api.videoplanet.com
- **Database**: PostgreSQL (Railway production with backups)
- **Branch**: main

## Branch Strategy

```
main (production)
  │
  ├── develop (staging)
  │     │
  │     ├── feature/user-authentication
  │     ├── feature/video-upload
  │     └── feature/feedback-system
  │
  ├── hotfix/critical-bug-fix
  └── release/v1.2.0
```

### Branch Rules

| Branch | Protected | Auto Deploy | Reviews Required | Tests Required |
|--------|-----------|-------------|------------------|----------------|
| main | Yes | Production | 2 | All Pass |
| develop | Yes | Staging | 1 | All Pass |
| feature/* | No | None | 0 | Recommended |
| hotfix/* | No | None | 1 | Required |

### Git Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   # Create PR to develop
   ```

2. **Release Process**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   # Update version numbers, changelog
   git commit -m "chore: prepare release v1.2.0"
   # Create PR to main
   # After merge, tag the release
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

3. **Hotfix Process**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   # Make fix
   git commit -m "fix: resolve critical issue"
   # Create PR to main AND develop
   ```

## CI/CD Pipeline

### Pipeline Stages

1. **Code Quality** (2-3 minutes)
   - Linting (ESLint, Black, Flake8)
   - Formatting (Prettier, Black)
   - Type checking (TypeScript)
   - Security scanning (Bandit, npm audit)

2. **Testing** (5-7 minutes)
   - Unit tests
   - Integration tests
   - API tests
   - Component tests (React)

3. **Build** (3-4 minutes)
   - Docker image creation
   - Asset optimization
   - Bundle analysis

4. **Deploy** (2-3 minutes)
   - Environment-specific deployment
   - Database migrations
   - Cache invalidation

### GitHub Actions Secrets Required

```yaml
# Backend Secrets
RAILWAY_TOKEN
RAILWAY_STAGING_TOKEN
DATABASE_URL
SECRET_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_STORAGE_BUCKET_NAME
SENTRY_DSN

# Frontend Secrets
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
REACT_APP_API_URL
REACT_APP_GOOGLE_CLIENT_ID
REACT_APP_KAKAO_API_KEY

# Monitoring
DATADOG_API_KEY
SLACK_WEBHOOK_URL
```

## Environment Variables

### Backend (.env)
```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=api.videoplanet.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=videoplanet-media
AWS_S3_REGION_NAME=ap-northeast-2

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@videoplanet.com
EMAIL_HOST_PASSWORD=your-password

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Frontend (.env.local)
```bash
# API Configuration
REACT_APP_API_URL=https://api.videoplanet.com
REACT_APP_WS_URL=wss://api.videoplanet.com/ws

# OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_KAKAO_API_KEY=your-api-key
REACT_APP_NAVER_CLIENT_ID=your-client-id

# Analytics
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
REACT_APP_MIXPANEL_TOKEN=your-token
```

## Deployment Process

### Backend Deployment (Railway)

1. **Automatic Deployment** (via GitHub Actions)
   - Push to main branch triggers production deployment
   - Push to develop branch triggers staging deployment

2. **Manual Deployment**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy to production
   railway up --environment production
   
   # Deploy to staging
   railway up --environment staging
   ```

3. **Database Migrations**
   ```bash
   # Automatic in Dockerfile
   python manage.py migrate
   
   # Manual migration
   railway run python manage.py migrate
   ```

### Frontend Deployment (Vercel)

1. **Automatic Deployment**
   - Push to main → Production
   - Push to develop → Preview
   - Pull Requests → Preview URLs

2. **Manual Deployment**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy to production
   vercel --prod
   
   # Deploy preview
   vercel
   ```

## Monitoring & Observability

### Key Metrics (DORA)

| Metric | Target | Current | Tool |
|--------|--------|---------|------|
| Deployment Frequency | Daily | - | GitHub Actions |
| Lead Time for Changes | < 1 day | - | GitHub Insights |
| Mean Time to Recovery | < 1 hour | - | PagerDuty |
| Change Failure Rate | < 15% | - | Sentry |

### Monitoring Stack

1. **Application Performance**
   - Sentry: Error tracking
   - New Relic/Datadog: APM
   - Google Analytics: User analytics

2. **Infrastructure**
   - Railway Metrics: Resource usage
   - Vercel Analytics: Edge performance
   - CloudWatch: AWS services

3. **Alerting**
   - PagerDuty: Incident management
   - Slack: Team notifications
   - Email: Critical alerts

### Health Checks

```python
# Backend health endpoint
GET /health/
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "version": "1.2.0",
  "timestamp": "2024-01-14T10:30:00Z"
}
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups (Railway)
   - Point-in-time recovery (last 7 days)
   - Weekly backups to S3 (30-day retention)
   - Monthly archives (1-year retention)

2. **Code Repository**
   - GitHub (primary)
   - GitLab mirror (backup)
   - Local developer copies

3. **Media Files**
   - S3 versioning enabled
   - Cross-region replication
   - Lifecycle policies for cost optimization

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from Railway backup
   railway database:restore --backup-id xxx
   
   # Restore from S3 backup
   aws s3 cp s3://backups/db-backup.sql ./
   psql $DATABASE_URL < db-backup.sql
   ```

2. **Rollback Deployment**
   ```bash
   # Backend rollback
   railway rollback --environment production
   
   # Frontend rollback (Vercel)
   vercel rollback [deployment-url]
   ```

3. **Emergency Procedures**
   - Enable maintenance mode
   - Scale down to prevent data corruption
   - Restore from last known good state
   - Validate data integrity
   - Gradual traffic restoration

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 1 hour
- **Recovery Point Objective (RPO)**: 1 hour
- **Backup Testing**: Monthly
- **DR Drill**: Quarterly

## Performance Optimization

### Caching Strategy

1. **CDN (Vercel/CloudFlare)**
   - Static assets: 1 year
   - API responses: 5 minutes (for public data)
   - HTML pages: 1 hour

2. **Redis Cache**
   - Session data: 24 hours
   - API cache: 5-60 minutes
   - WebSocket connections: Active duration

3. **Database Optimization**
   - Query optimization
   - Index management
   - Connection pooling
   - Read replicas (future)

### Scaling Strategy

1. **Horizontal Scaling**
   - Railway: Auto-scaling based on CPU/Memory
   - Vercel: Automatic edge scaling

2. **Vertical Scaling**
   - Monitor resource usage
   - Scale up before hitting limits
   - Cost optimization review monthly

## Security Checklist

- [ ] HTTPS everywhere
- [ ] Secrets in environment variables
- [ ] Regular dependency updates
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Regular security audits

## Cost Management

### Monthly Cost Targets

| Service | Budget | Alert at |
|---------|--------|----------|
| Railway | $100 | $80 |
| Vercel | $20 | $15 |
| AWS S3 | $50 | $40 |
| Total | $170 | $135 |

### Optimization Strategies

1. Use spot instances where possible
2. Implement aggressive caching
3. Optimize images and videos
4. Archive old data to Glacier
5. Regular cost review meetings

## Support & Contacts

- **DevOps Lead**: devops@videoplanet.com
- **On-Call Rotation**: PagerDuty
- **Slack Channel**: #platform-team
- **Documentation**: Internal Wiki
- **Runbooks**: `/docs/runbooks/`

---

Last Updated: 2024-01-14
Version: 1.0.0