# VideoPlanet Migration Deployment Runbook

## Overview
This runbook provides step-by-step procedures for deploying each phase of the FSD migration, including pre-deployment checks, deployment execution, validation, and rollback procedures.

---

## Pre-Deployment Checklist

### Code Quality Gates
- [ ] All tests pass (unit, integration, E2E)
- [ ] Test coverage meets targets (70% overall, 85% entities)
- [ ] ESLint passes with FSD boundary rules enforced
- [ ] TypeScript compilation succeeds with strict mode
- [ ] No circular dependencies detected
- [ ] Bundle size analysis complete (no >20% increase)
- [ ] Performance regression tests pass

### Environment Validation  
- [ ] Staging environment mirrors production configuration
- [ ] Database migrations tested on staging data copy
- [ ] Third-party service integrations validated
- [ ] Environment variables verified and secure
- [ ] SSL certificates valid and current
- [ ] CDN configuration updated if needed

### Team Readiness
- [ ] Deployment team identified and available
- [ ] Rollback team on standby
- [ ] Communication channels established (#deployment-alerts)
- [ ] Customer support team notified of deployment window
- [ ] Monitoring dashboards prepared and accessible

---

## Deployment Procedures by Phase

### Phase 1: Foundation Layer Deployment

#### Pre-Deployment (T-60 minutes)
```bash
# 1. Verify staging environment
npm run test:e2e -- --env=staging
npm run build:analyze
npm run lighthouse:staging

# 2. Database backup (if schema changes)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M).sql

# 3. Feature flag preparation
# Set foundation flags to 0% rollout
curl -X POST $FEATURE_FLAG_API/flags/fsd-shared-components \
  -d '{"enabled": false, "rollout": 0}'
```

#### Deployment Execution (T-0)
```bash
# 1. Deploy to Vercel staging
vercel deploy --prod=false --token=$VERCEL_TOKEN

# 2. Run smoke tests
npm run test:smoke -- --env=staging

# 3. Deploy to production with feature flags disabled
vercel deploy --prod --token=$VERCEL_TOKEN

# 4. Enable feature flag gradual rollout
curl -X PATCH $FEATURE_FLAG_API/flags/fsd-shared-components \
  -d '{"rollout": 10}'
```

#### Post-Deployment Validation (T+15 minutes)
```bash
# 1. Health checks
curl -f https://api.vridge.kr/health || exit 1
curl -f https://vridge.kr/api/health || exit 1

# 2. Core user journeys
npm run test:smoke:production

# 3. Performance validation
npm run lighthouse:production -- --assertions

# 4. Monitor error rates
# Check Sentry dashboard for error spikes >2%
```

### Phase 2: Domain Entities Deployment

#### Pre-Deployment (T-120 minutes)
```bash
# 1. State migration script preparation
node scripts/prepare-state-migration.js --dry-run

# 2. Backup current user state
node scripts/backup-user-state.js

# 3. Test migration on staging copy
node scripts/migrate-state.js --env=staging --validate
```

#### Deployment Execution (T-0)
```bash
# 1. Enable maintenance mode for state-critical operations
curl -X POST $API_BASE/admin/maintenance -d '{"enabled": true}'

# 2. Deploy backend with dual state support
railway deploy --service=vridge-back

# 3. Run state migration
node scripts/migrate-state.js --env=production

# 4. Deploy frontend with new entity layer
vercel deploy --prod

# 5. Disable maintenance mode
curl -X POST $API_BASE/admin/maintenance -d '{"enabled": false}'
```

#### Validation & Rollout (T+10 minutes)
```bash
# 1. Validate state integrity
node scripts/validate-state-integrity.js

# 2. Gradual feature flag rollout
for percent in 10 25 50 100; do
  curl -X PATCH $FEATURE_FLAG_API/flags/fsd-entities \
    -d "{\"rollout\": $percent}"
  sleep 600  # Wait 10 minutes between rollouts
  npm run monitor:errors -- --threshold=2
done
```

### Phase 3-6: Feature, Widget, App Layer Deployments

#### Standard Feature Deployment Process
```bash
# 1. Deploy with feature flag disabled
vercel deploy --prod

# 2. Enable for internal team (1% rollout to specific users)
curl -X PATCH $FEATURE_FLAG_API/flags/$FEATURE_NAME \
  -d '{"rollout": 1, "segments": ["internal"]}'

# 3. Monitor for 1 hour, then gradual rollout
for percent in 10 25 50 100; do
  curl -X PATCH $FEATURE_FLAG_API/flags/$FEATURE_NAME \
    -d "{\"rollout\": $percent}"
  sleep 1800  # Wait 30 minutes between rollouts
  npm run monitor:dashboard -- --feature=$FEATURE_NAME
done
```

---

## Rollback Procedures

### Emergency Rollback (< 5 minutes)

#### Level 1: Feature Flag Rollback
```bash
# Immediate disable via feature flag
curl -X PATCH $FEATURE_FLAG_API/flags/$FEATURE_NAME \
  -d '{"enabled": false, "rollout": 0}'

# Verify rollback success
curl -s https://vridge.kr/api/flags | jq '.[$FEATURE_NAME].enabled' # Should return false
```

#### Level 2: Application Rollback (< 15 minutes)
```bash
# 1. Revert to previous Vercel deployment
PREVIOUS_DEPLOYMENT=$(vercel list --token=$VERCEL_TOKEN | grep READY | sed -n '2p' | awk '{print $1}')
vercel promote $PREVIOUS_DEPLOYMENT --token=$VERCEL_TOKEN

# 2. Revert Railway backend if needed
railway rollback --service=vridge-back

# 3. Validate rollback
npm run test:smoke:production
```

#### Level 3: Database Rollback (< 30 minutes)
```bash
# 1. Enable maintenance mode
curl -X POST $API_BASE/admin/maintenance -d '{"enabled": true}'

# 2. Restore database backup
psql $DATABASE_URL < backup_$(date +%Y%m%d)_*.sql

# 3. Revert application to matching version
vercel promote $BACKUP_DEPLOYMENT_ID --token=$VERCEL_TOKEN

# 4. Validate data integrity
node scripts/validate-rollback.js

# 5. Disable maintenance mode
curl -X POST $API_BASE/admin/maintenance -d '{"enabled": false}'
```

### Rollback Decision Matrix

| Condition | Trigger Threshold | Rollback Level | Response Time |
|-----------|------------------|----------------|---------------|
| Error rate spike | >2% above baseline | Level 1 | < 5 minutes |
| Performance degradation | LCP >5 seconds | Level 1 | < 5 minutes |
| Authentication failures | >1% of login attempts | Level 2 | < 15 minutes |
| Data corruption detected | Any confirmed case | Level 3 | < 30 minutes |
| User complaints spike | >10 simultaneous reports | Level 1 | < 5 minutes |
| Revenue impact | Any payment processing issues | Level 2 | < 15 minutes |

---

## Monitoring & Validation Scripts

### Health Check Script
```javascript
// scripts/health-check.js
const endpoints = [
  'https://api.vridge.kr/health',
  'https://vridge.kr/api/health',
  'https://api.vridge.kr/auth/status'
];

async function runHealthChecks() {
  const results = await Promise.allSettled(
    endpoints.map(url => fetch(url).then(r => ({url, status: r.status})))
  );
  
  const failed = results.filter(r => r.status === 'rejected' || r.value.status !== 200);
  
  if (failed.length > 0) {
    console.error('Health check failures:', failed);
    process.exit(1);
  }
  
  console.log('All health checks passed');
}
```

### Error Rate Monitor
```javascript
// scripts/monitor-errors.js
const SENTRY_API = process.env.SENTRY_API_TOKEN;
const THRESHOLD = parseFloat(process.argv[2]) || 2.0; // 2% default

async function checkErrorRate() {
  const response = await fetch(`https://sentry.io/api/0/organizations/videoplanet/stats/`, {
    headers: {'Authorization': `Bearer ${SENTRY_API}`}
  });
  
  const stats = await response.json();
  const errorRate = (stats.errors / stats.total) * 100;
  
  if (errorRate > THRESHOLD) {
    console.error(`Error rate ${errorRate}% exceeds threshold ${THRESHOLD}%`);
    process.exit(1);
  }
  
  console.log(`Error rate: ${errorRate}% (within threshold)`);
}
```

### Performance Validation
```javascript
// scripts/validate-performance.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceCheck(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  const score = runnerResult.lhr.categories.performance.score * 100;
  
  await chrome.kill();
  
  if (score < 75) {
    console.error(`Performance score ${score} below threshold 75`);
    process.exit(1);
  }
  
  console.log(`Performance score: ${score}`);
}
```

---

## Emergency Contacts & Escalation

### On-Call Rotation
- **Primary**: Frontend Lead (Slack: @frontend-lead)
- **Secondary**: Backend Developer (Slack: @backend-dev)  
- **Escalation**: Engineering Manager (Phone: +1-xxx-xxx-xxxx)
- **Executive**: CTO (Emergency only: +1-xxx-xxx-xxxx)

### Communication Channels
- **Alerts**: #deployment-alerts (auto-notifications)
- **Status**: #deployment-status (human updates)
- **Incident**: #incident-response (emergency escalation)
- **External**: status.vridge.kr (customer communication)

### External Dependencies
- **Vercel Support**: support@vercel.com (Enterprise support)
- **Railway Support**: help@railway.app  
- **AWS Support**: Case priority High for storage issues
- **Sentry**: support@sentry.io for monitoring issues

---

## Post-Deployment Activities

### Immediate (T+2 hours)
- [ ] Monitor error rates and performance metrics
- [ ] Review user feedback and support tickets
- [ ] Document any issues encountered during deployment
- [ ] Update deployment status in project channels

### Short-term (T+24 hours)  
- [ ] Analyze user adoption metrics for new features
- [ ] Review performance impact on Core Web Vitals
- [ ] Generate deployment success/failure report
- [ ] Plan next phase deployment if successful

### Long-term (T+1 week)
- [ ] Retrospective on deployment process
- [ ] Update runbook based on lessons learned
- [ ] Plan feature flag cleanup for stable features
- [ ] Archive deployment artifacts and logs

---

## Automation Scripts

### Pre-Deployment Automation
```bash
#!/bin/bash
# scripts/pre-deploy.sh

set -e

echo "🔍 Running pre-deployment checks..."

# Code quality
npm run lint
npm run type-check
npm run test
npm run test:e2e

# Bundle analysis
npm run build:analyze
if [ $BUNDLE_SIZE_INCREASE -gt 20 ]; then
  echo "❌ Bundle size increased by >20%"
  exit 1
fi

# Performance baseline
npm run lighthouse:staging --assertions

echo "✅ All pre-deployment checks passed"
```

### Post-Deployment Validation
```bash
#!/bin/bash  
# scripts/post-deploy.sh

set -e

echo "🚀 Running post-deployment validation..."

# Wait for deployment to propagate
sleep 30

# Health checks
node scripts/health-check.js

# Smoke tests
npm run test:smoke:production

# Performance validation
node scripts/validate-performance.js https://vridge.kr

# Error rate check
node scripts/monitor-errors.js 2.0

echo "✅ Deployment validation successful"
```

---

**Document Owner**: DevOps Engineer  
**Review Frequency**: After each deployment  
**Last Updated**: 2025-08-21  
**Version**: 1.0  
**Emergency Hotline**: Slack #incident-response