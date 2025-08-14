# GitHub Secrets Configuration Guide

This guide explains how to set up the required GitHub Secrets for the VideoPlanet CI/CD pipeline.

## Prerequisites

1. GitHub repository with Actions enabled
2. Railway account and project created
3. Vercel account and project created
4. AWS account (for S3 storage)
5. Email service configured (Gmail/SendGrid)

## Required Secrets

### 1. Backend Deployment Secrets

#### Railway Tokens
```bash
# Production Railway Token
RAILWAY_TOKEN
# Get from: https://railway.app/account/tokens

# Staging Railway Token  
RAILWAY_STAGING_TOKEN
# Create separate token for staging environment
```

#### Database Configuration
```bash
DATABASE_URL
# Format: postgresql://user:password@host:port/database
# Example: postgresql://postgres:password@db.railway.internal:5432/videoplanet
```

#### Django Settings
```bash
SECRET_KEY
# Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# Example: django-insecure-xyz123abc456...
```

#### AWS S3 Storage
```bash
AWS_ACCESS_KEY_ID
# Get from: AWS IAM Console > Users > Security credentials

AWS_SECRET_ACCESS_KEY
# Get from: AWS IAM Console > Users > Security credentials

AWS_STORAGE_BUCKET_NAME
# Example: videoplanet-media
```

#### Error Tracking
```bash
SENTRY_DSN
# Get from: https://sentry.io/settings/[org]/projects/[project]/keys/
# Example: https://abc123@o123456.ingest.sentry.io/123456
```

### 2. Frontend Deployment Secrets

#### Vercel Configuration
```bash
VERCEL_TOKEN
# Get from: https://vercel.com/account/tokens

VERCEL_ORG_ID
# Get from: Vercel project settings > General > Project ID

VERCEL_PROJECT_ID
# Get from: Vercel project settings > General > Project ID
```

#### API Configuration
```bash
REACT_APP_API_URL
# Production: https://api.videoplanet.com
# Staging: https://videoplanet-api-staging.railway.app
```

#### OAuth Credentials
```bash
REACT_APP_GOOGLE_CLIENT_ID
# Get from: https://console.cloud.google.com/apis/credentials

REACT_APP_KAKAO_API_KEY
# Get from: https://developers.kakao.com/console/app
```

### 3. Monitoring & Notifications

```bash
SLACK_WEBHOOK_URL
# Get from: https://api.slack.com/apps > Incoming Webhooks
# Example: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

DATADOG_API_KEY
# Get from: https://app.datadoghq.com/organization-settings/api-keys
```

## How to Add Secrets to GitHub

### Via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. Select **Secrets and variables** > **Actions** from the left sidebar
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
# or
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh  # Ubuntu/Debian

# Authenticate
gh auth login

# Add secrets
gh secret set RAILWAY_TOKEN --body "your-railway-token"
gh secret set DATABASE_URL --body "postgresql://user:pass@host:5432/db"
gh secret set SECRET_KEY --body "your-django-secret-key"
# ... add other secrets
```

### Bulk Import Script

Create a `.env.secrets` file (DO NOT COMMIT):
```bash
RAILWAY_TOKEN=your-railway-token
RAILWAY_STAGING_TOKEN=your-staging-token
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
SENTRY_DSN=your-sentry-dsn
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
REACT_APP_API_URL=https://api.videoplanet.com
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_KAKAO_API_KEY=your-kakao-key
```

Then run this script:
```bash
#!/bin/bash
# save as import-secrets.sh

while IFS='=' read -r key value; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    echo "Setting secret: $key"
    gh secret set "$key" --body "$value"
  fi
done < .env.secrets

echo "All secrets imported successfully!"
```

## Environment-Specific Secrets

### Production Environment
- Use production database URL
- Production API endpoints
- Production OAuth redirect URLs
- Error tracking enabled

### Staging Environment
- Use staging database URL
- Staging API endpoints
- Staging OAuth redirect URLs
- Debug mode can be enabled

### Local Development
Create `.env` files locally (not committed):

**Backend (.env)**:
```bash
SECRET_KEY=local-development-key
DEBUG=True
DATABASE_URL=postgresql://postgres:password@localhost:5432/videoplanet_dev
REDIS_URL=redis://localhost:6379/0
```

**Frontend (.env.local)**:
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_GOOGLE_CLIENT_ID=your-dev-client-id
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate secrets regularly** (every 90 days)
3. **Use different secrets** for each environment
4. **Limit access** to production secrets
5. **Enable audit logging** for secret access
6. **Use secret scanning** tools to detect exposed secrets
7. **Document secret dependencies** but not the values

## Troubleshooting

### Secret Not Found
```
Error: Input required and not supplied: RAILWAY_TOKEN
```
**Solution**: Ensure the secret name matches exactly (case-sensitive)

### Invalid Secret Format
```
Error: Invalid DATABASE_URL format
```
**Solution**: Check the secret value format and escape special characters

### Permission Denied
```
Error: Resource not accessible by integration
```
**Solution**: Check repository settings > Actions > General > Workflow permissions

## Secret Rotation Schedule

| Secret | Rotation Period | Last Rotated | Next Rotation |
|--------|----------------|--------------|---------------|
| Django SECRET_KEY | 90 days | - | - |
| Database Password | 90 days | - | - |
| AWS Keys | 90 days | - | - |
| OAuth Secrets | 1 year | - | - |
| API Tokens | 90 days | - | - |

## Contact

For secret management issues:
- DevOps Team: devops@videoplanet.com
- Security Team: security@videoplanet.com

---

Last Updated: 2024-01-14
Version: 1.0.0