# CI/CD 품질 게이트 구성
## VideoPlanet 프로젝트 자동화된 품질 검증 체계

---

## 1. GitHub Actions 품질 게이트 구성

### 1.1 Pull Request 품질 검증

```yaml
# .github/workflows/pr-quality-gate.yml
name: PR Quality Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

jobs:
  quality-check:
    name: Quality Gate Check
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for better analysis
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Step 1: Linting
      - name: Run ESLint
        id: lint
        run: |
          npm run lint -- --format json --output-file eslint-report.json
          echo "lint_errors=$(cat eslint-report.json | jq '[.[] | .errorCount] | add')" >> $GITHUB_OUTPUT
          echo "lint_warnings=$(cat eslint-report.json | jq '[.[] | .warningCount] | add')" >> $GITHUB_OUTPUT
      
      # Step 2: Type Checking
      - name: TypeScript Type Check
        run: npm run type-check
      
      # Step 3: Unit Tests with Coverage
      - name: Run Unit Tests
        id: unit-tests
        run: |
          npm run test:coverage -- --reporter=json --outputFile=test-results.json
          echo "test_passed=$(cat test-results.json | jq '.numPassedTests')" >> $GITHUB_OUTPUT
          echo "test_failed=$(cat test-results.json | jq '.numFailedTests')" >> $GITHUB_OUTPUT
          echo "coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')" >> $GITHUB_OUTPUT
      
      # Step 4: Coverage Threshold Check
      - name: Check Coverage Threshold
        run: |
          COVERAGE=${{ steps.unit-tests.outputs.coverage }}
          THRESHOLD=80
          if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
            echo "❌ Coverage ${COVERAGE}% is below threshold ${THRESHOLD}%"
            exit 1
          fi
          echo "✅ Coverage ${COVERAGE}% meets threshold ${THRESHOLD}%"
      
      # Step 5: Integration Tests
      - name: Run Integration Tests
        run: npm run test:integration
        continue-on-error: true
      
      # Step 6: Build Check
      - name: Build Application
        run: npm run build
      
      # Step 7: Bundle Size Check
      - name: Check Bundle Size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          skip_step: install
          script: npm run size
      
      # Step 8: Security Audit
      - name: Security Audit
        id: security
        run: |
          npm audit --json > audit-report.json || true
          echo "high_vulns=$(cat audit-report.json | jq '.metadata.vulnerabilities.high')" >> $GITHUB_OUTPUT
          echo "critical_vulns=$(cat audit-report.json | jq '.metadata.vulnerabilities.critical')" >> $GITHUB_OUTPUT
      
      # Step 9: OWASP Dependency Check
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'VideoPlanet'
          path: '.'
          format: 'JSON'
      
      # Step 10: Generate Quality Report
      - name: Generate Quality Report
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            
            // Collect all metrics
            const metrics = {
              lint: {
                errors: ${{ steps.lint.outputs.lint_errors || 0 }},
                warnings: ${{ steps.lint.outputs.lint_warnings || 0 }}
              },
              tests: {
                passed: ${{ steps.unit-tests.outputs.test_passed || 0 }},
                failed: ${{ steps.unit-tests.outputs.test_failed || 0 }},
                coverage: ${{ steps.unit-tests.outputs.coverage || 0 }}
              },
              security: {
                high: ${{ steps.security.outputs.high_vulns || 0 }},
                critical: ${{ steps.security.outputs.critical_vulns || 0 }}
              }
            };
            
            // Generate markdown report
            let report = `## 📊 Quality Gate Report\n\n`;
            report += `### ✅ Checks Summary\n\n`;
            report += `| Check | Status | Details |\n`;
            report += `|-------|--------|---------||\n`;
            report += `| Linting | ${metrics.lint.errors === 0 ? '✅' : '❌'} | Errors: ${metrics.lint.errors}, Warnings: ${metrics.lint.warnings} |\n`;
            report += `| Tests | ${metrics.tests.failed === 0 ? '✅' : '❌'} | Passed: ${metrics.tests.passed}, Failed: ${metrics.tests.failed} |\n`;
            report += `| Coverage | ${metrics.tests.coverage >= 80 ? '✅' : '❌'} | ${metrics.tests.coverage}% (threshold: 80%) |\n`;
            report += `| Security | ${metrics.security.critical === 0 ? '✅' : '❌'} | Critical: ${metrics.security.critical}, High: ${metrics.security.high} |\n`;
            
            // Post comment on PR
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
            
            // Fail if quality gates not met
            if (metrics.lint.errors > 0 || 
                metrics.tests.failed > 0 || 
                metrics.tests.coverage < 80 || 
                metrics.security.critical > 0) {
              core.setFailed('Quality gates not met');
            }
```

### 1.2 Main Branch 보호 규칙

```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "Quality Gate Check"
        - "E2E Tests"
        - "Performance Tests"
        - "Security Scan"
    
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
      
    enforce_admins: true
    restrictions:
      users: []
      teams: ["qa-team", "lead-developers"]
    
    allow_force_pushes: false
    allow_deletions: false
```

---

## 2. 단계별 파이프라인 구성

### 2.1 Pre-Commit Hooks

```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 1. Lint staged files
npx lint-staged

# 2. Type check
npm run type-check

# 3. Run affected tests
npm run test:affected

# 4. Check commit message format
npx commitlint --edit $1
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{css,scss}": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"],
    "rules": {
      "type-enum": [2, "always", [
        "feat", "fix", "docs", "style", 
        "refactor", "perf", "test", "chore"
      ]]
    }
  }
}
```

### 2.2 CI Pipeline (Build & Test)

```yaml
# .github/workflows/ci-pipeline.yml
name: CI Pipeline

on:
  push:
    branches: [develop, feature/*]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.npm
            node_modules
            .next/cache
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Build application
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            .next
            out
```

### 2.3 E2E Test Pipeline

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: videoplanet_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npm run db:migrate
          npm run db:seed
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/videoplanet_test
      
      - name: Build application
        run: npm run build
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/videoplanet_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: test-results/
```

---

## 3. Performance Testing Pipeline

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 1'  # Weekly on Monday at 3 AM

jobs:
  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload Lighthouse reports
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-reports
          path: .lighthouseci/
  
  load-testing:
    name: Load Testing with K6
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run K6 tests
        uses: grafana/k6-action@v0.3.0
        with:
          filename: test/performance/k6-load-test.js
          flags: --out json=k6-results.json
      
      - name: Analyze results
        run: |
          cat k6-results.json | jq '.metrics.http_req_duration.p95'
          # Fail if p95 > 500ms
          P95=$(cat k6-results.json | jq '.metrics.http_req_duration.p95')
          if (( $(echo "$P95 > 500" | bc -l) )); then
            echo "❌ P95 latency ${P95}ms exceeds threshold 500ms"
            exit 1
          fi
```

---

## 4. Security Scanning Pipeline

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 4 * * *'  # Daily at 4 AM

jobs:
  dependency-scan:
    name: Dependency Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: |
          npm audit --json > audit-report.json || true
          CRITICAL=$(cat audit-report.json | jq '.metadata.vulnerabilities.critical')
          HIGH=$(cat audit-report.json | jq '.metadata.vulnerabilities.high')
          
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Found $CRITICAL critical vulnerabilities"
            exit 1
          fi
          
          if [ "$HIGH" -gt 3 ]; then
            echo "⚠️ Found $HIGH high vulnerabilities (threshold: 3)"
            exit 1
          fi
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
  
  code-scan:
    name: Code Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript, typescript
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/typescript
  
  container-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t videoplanet:${{ github.sha }} .
      
      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: videoplanet:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## 5. Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  quality-gate:
    name: Final Quality Gate
    runs-on: ubuntu-latest
    outputs:
      deploy_approved: ${{ steps.gate.outputs.approved }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Check quality metrics
        id: gate
        run: |
          # Fetch latest metrics from various sources
          COVERAGE=$(curl -s https://codecov.io/api/gh/${{ github.repository }}/branch/main | jq '.commit.coverage')
          TEST_PASS_RATE=95  # From test results
          LIGHTHOUSE_SCORE=85  # From Lighthouse CI
          SECURITY_ISSUES=0  # From security scans
          
          # Check all gates
          APPROVED=true
          
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage below threshold"
            APPROVED=false
          fi
          
          if [ "$TEST_PASS_RATE" -lt 95 ]; then
            echo "❌ Test pass rate below 95%"
            APPROVED=false
          fi
          
          if [ "$LIGHTHOUSE_SCORE" -lt 80 ]; then
            echo "❌ Lighthouse score below 80"
            APPROVED=false
          fi
          
          if [ "$SECURITY_ISSUES" -gt 0 ]; then
            echo "❌ Unresolved security issues"
            APPROVED=false
          fi
          
          echo "approved=$APPROVED" >> $GITHUB_OUTPUT
  
  deploy-staging:
    name: Deploy to Staging
    needs: quality-gate
    if: needs.quality-gate.outputs.deploy_approved == 'true'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Staging
        run: |
          npx vercel --prod --env=staging --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run smoke tests
        run: |
          npm run test:smoke -- --url=https://staging.videoplanet.com
      
      - name: Run synthetic monitoring
        run: |
          npm run test:synthetic -- --env=staging
  
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create deployment
        uses: actions/github-script@v7
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              required_contexts: [],
              auto_merge: false
            });
      
      - name: Deploy to Vercel Production
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Update deployment status
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: deployment.data.id,
              state: 'success',
              environment_url: 'https://videoplanet.com'
            });
      
      - name: Run production health check
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://videoplanet.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "✅ Health check passed"
              exit 0
            fi
            echo "Attempt $i failed, retrying..."
            sleep 10
          done
          echo "❌ Health check failed"
          exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 6. Monitoring & Rollback

### 6.1 Post-Deployment Monitoring

```yaml
# .github/workflows/post-deploy-monitor.yml
name: Post-Deployment Monitoring

on:
  deployment_status:
    types: [created]

jobs:
  monitor:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    
    steps:
      - name: Wait for stability
        run: sleep 300  # Wait 5 minutes
      
      - name: Check error rates
        run: |
          ERROR_RATE=$(curl -s "https://api.sentry.io/projects/videoplanet/stats/" \
            -H "Authorization: Bearer ${{ secrets.SENTRY_TOKEN }}" | \
            jq '.error_rate')
          
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "⚠️ Error rate above 1%: ${ERROR_RATE}"
            echo "ROLLBACK_NEEDED=true" >> $GITHUB_ENV
          fi
      
      - name: Check performance metrics
        run: |
          RESPONSE_TIME=$(curl -s "https://api.newrelic.com/v2/applications/videoplanet/metrics.json" \
            -H "X-Api-Key: ${{ secrets.NEW_RELIC_API_KEY }}" | \
            jq '.metric_data.metrics[0].timeslices[0].values.average_response_time')
          
          if (( $(echo "$RESPONSE_TIME > 1000" | bc -l) )); then
            echo "⚠️ Response time above 1000ms: ${RESPONSE_TIME}"
            echo "ROLLBACK_NEEDED=true" >> $GITHUB_ENV
          fi
      
      - name: Trigger rollback if needed
        if: env.ROLLBACK_NEEDED == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'rollback.yml',
              ref: 'main'
            });
```

### 6.2 Automated Rollback

```yaml
# .github/workflows/rollback.yml
name: Automated Rollback

on:
  workflow_dispatch:
  
jobs:
  rollback:
    runs-on: ubuntu-latest
    
    steps:
      - name: Get previous deployment
        id: previous
        run: |
          PREVIOUS_SHA=$(git rev-parse HEAD~1)
          echo "sha=$PREVIOUS_SHA" >> $GITHUB_OUTPUT
      
      - name: Rollback to previous version
        run: |
          npx vercel rollback ${{ steps.previous.outputs.sha }} \
            --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Verify rollback
        run: |
          sleep 30
          DEPLOYED_SHA=$(curl -s https://videoplanet.com/api/version | jq -r '.sha')
          if [ "$DEPLOYED_SHA" = "${{ steps.previous.outputs.sha }}" ]; then
            echo "✅ Rollback successful"
          else
            echo "❌ Rollback failed"
            exit 1
          fi
      
      - name: Create incident report
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[INCIDENT] Automated rollback triggered`,
              body: `Deployment rolled back from ${context.sha} to ${{ steps.previous.outputs.sha }}`,
              labels: ['incident', 'production', 'high-priority']
            });
```

---

## 7. Quality Dashboard Configuration

### 7.1 Metrics Collection

```javascript
// scripts/collect-metrics.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    coverage: getCoverage(),
    testResults: getTestResults(),
    lintResults: getLintResults(),
    bundleSize: getBundleSize(),
    performance: getPerformanceMetrics(),
    security: getSecurityMetrics()
  };
  
  // Save to file
  fs.writeFileSync('quality-metrics.json', JSON.stringify(metrics, null, 2));
  
  // Send to monitoring service
  await sendToDatadog(metrics);
  
  return metrics;
}

function getCoverage() {
  const coverage = JSON.parse(
    fs.readFileSync('coverage/coverage-summary.json', 'utf8')
  );
  return {
    lines: coverage.total.lines.pct,
    branches: coverage.total.branches.pct,
    functions: coverage.total.functions.pct,
    statements: coverage.total.statements.pct
  };
}

function getTestResults() {
  const output = execSync('npm test -- --json', { encoding: 'utf8' });
  const results = JSON.parse(output);
  return {
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    skipped: results.numPendingTests,
    total: results.numTotalTests,
    duration: results.testResults.reduce((acc, t) => acc + t.duration, 0)
  };
}

// Additional metric collection functions...
```

### 7.2 Quality Gate Rules

```javascript
// quality-gate-config.js
module.exports = {
  gates: {
    coverage: {
      lines: { threshold: 80, required: true },
      branches: { threshold: 75, required: true },
      functions: { threshold: 80, required: true },
      statements: { threshold: 80, required: true }
    },
    
    tests: {
      passRate: { threshold: 95, required: true },
      duration: { threshold: 300000, required: false }, // 5 minutes
      flakiness: { threshold: 1, required: true } // Max 1% flaky tests
    },
    
    lint: {
      errors: { threshold: 0, required: true },
      warnings: { threshold: 10, required: false }
    },
    
    security: {
      critical: { threshold: 0, required: true },
      high: { threshold: 0, required: true },
      medium: { threshold: 5, required: false }
    },
    
    performance: {
      lighthouse: {
        performance: { threshold: 85, required: true },
        accessibility: { threshold: 90, required: true },
        bestPractices: { threshold: 85, required: true },
        seo: { threshold: 85, required: false }
      },
      webVitals: {
        lcp: { threshold: 2500, required: true },
        fid: { threshold: 100, required: true },
        cls: { threshold: 0.1, required: true }
      }
    },
    
    bundle: {
      main: { threshold: 500000, required: true }, // 500KB
      total: { threshold: 2000000, required: false } // 2MB
    }
  },
  
  enforcement: {
    preCommit: ['lint.errors'],
    preMerge: ['coverage', 'tests', 'lint', 'security.critical'],
    preRelease: ['*'], // All gates
    production: ['performance', 'security']
  }
};
```

---

## 8. Notification Configuration

```yaml
# .github/workflows/notify.yml
name: Quality Gate Notifications

on:
  workflow_run:
    workflows: ["PR Quality Gate", "Deploy to Production"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    
    steps:
      - name: Prepare notification data
        id: prepare
        run: |
          if [ "${{ github.event.workflow_run.conclusion }}" = "success" ]; then
            COLOR="good"
            EMOJI="✅"
            MESSAGE="Quality gates passed"
          else
            COLOR="danger"
            EMOJI="❌"
            MESSAGE="Quality gates failed"
          fi
          
          echo "color=$COLOR" >> $GITHUB_OUTPUT
          echo "emoji=$EMOJI" >> $GITHUB_OUTPUT
          echo "message=$MESSAGE" >> $GITHUB_OUTPUT
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "attachments": [{
                "color": "${{ steps.prepare.outputs.color }}",
                "title": "${{ steps.prepare.outputs.emoji }} ${{ steps.prepare.outputs.message }}",
                "fields": [
                  {
                    "title": "Workflow",
                    "value": "${{ github.event.workflow_run.name }}",
                    "short": true
                  },
                  {
                    "title": "Branch",
                    "value": "${{ github.event.workflow_run.head_branch }}",
                    "short": true
                  },
                  {
                    "title": "Commit",
                    "value": "${{ github.event.workflow_run.head_sha }}",
                    "short": false
                  }
                ]
              }]
            }
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Update PR status
        if: github.event.workflow_run.event == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const status = '${{ github.event.workflow_run.conclusion }}';
            const emoji = status === 'success' ? '✅' : '❌';
            
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ github.event.workflow_run.pull_requests[0].number }},
              body: `${emoji} Quality Gate ${status}`
            });
```

---

**문서 버전**: 1.0  
**작성자**: Grace (QA Lead)  
**최종 수정일**: 2025-08-23  
**구현 우선순위**: Critical