# VideoPlanet - Video Feedback Platform

A professional video feedback and collaboration platform built with Django REST Framework and React.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/your-org/videoplanet.git
cd videoplanet
```

2. **Start with Docker Compose**
```bash
make dev-docker
# or
docker-compose up
```

3. **Access the applications**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- pgAdmin: http://localhost:5050 (with profile: tools)
- Redis Commander: http://localhost:8081 (with profile: tools)

### Manual Setup

**Backend Setup:**
```bash
cd vridge_back
poetry install
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend Setup:**
```bash
cd vridge_front
npm install
npm start
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Django API     │
│   (Vercel)      │     │   (Railway)     │
└─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐       ┌──────▼──────┐
              │PostgreSQL │       │    Redis    │
              └───────────┘       └─────────────┘
```

## CI/CD Pipeline

### Automated Workflows

1. **Backend CI/CD** (`backend-ci-cd.yml`)
   - Code quality checks (Black, Flake8)
   - Security scanning (Bandit)
   - Unit & integration tests
   - Docker image build
   - Auto-deploy to Railway

2. **Frontend CI/CD** (`frontend-ci-cd.yml`)
   - ESLint & Prettier checks
   - React component tests
   - Bundle size analysis
   - Auto-deploy to Vercel

3. **Dependency Updates** (`dependency-update.yml`)
   - Weekly automated updates
   - Security vulnerability scanning
   - Automatic PR creation

### Deployment Environments

| Environment | Frontend URL | Backend URL | Branch |
|------------|--------------|-------------|---------|
| Production | videoplanet.com | api.videoplanet.com | main |
| Staging | videoplanet-staging.vercel.app | videoplanet-api-staging.railway.app | develop |
| Local | localhost:3000 | localhost:8000 | feature/* |

## Project Structure

```
videoplanet/
├── vridge_back/           # Django backend
│   ├── config/           # Django settings
│   ├── core/            # Core app with health checks
│   ├── users/           # User authentication
│   ├── projects/        # Project management
│   ├── feedbacks/       # Feedback system
│   └── onlines/         # Online status
├── vridge_front/         # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── api/        # API integration
│   │   ├── hooks/      # Custom React hooks
│   │   └── redux/      # State management
├── .github/
│   ├── workflows/      # GitHub Actions
│   └── CODEOWNERS      # Code ownership
└── docker-compose.yml   # Local development

```

## Development Commands

```bash
# Install dependencies
make install

# Start development servers
make dev

# Run tests
make test

# Format code
make format

# Run linters
make lint

# Build for production
make build

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-production
```

## Environment Variables

Create `.env` files based on the examples:

**Backend (.env):**
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0
```

**Frontend (.env.local):**
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws
```

See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for production secrets configuration.

## Monitoring

- **Health Check**: `/health/` - System health status
- **Ready Check**: `/ready/` - Readiness for traffic
- **Liveness Check**: `/live/` - Application liveness

## Deployment

### Deploy to Production
1. Merge PR to `main` branch
2. GitHub Actions automatically deploys to:
   - Backend: Railway
   - Frontend: Vercel

### Deploy to Staging
1. Merge PR to `develop` branch
2. Automatic deployment to staging environment

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment documentation
- [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md) - Secret management guide
- [Style Migration Guide](STYLE_MIGRATION_GUIDE.md) - Frontend style migration

## Contributing

1. Create feature branch from `develop`
2. Make changes and commit
3. Create PR with template
4. Wait for reviews and CI checks
5. Merge after approval

## License

Proprietary - VideoPlanet © 2024

## Support

- DevOps: devops@videoplanet.com
- Development: dev@videoplanet.com
- Security: security@videoplanet.com

---

Built with care by the VideoPlanet Team