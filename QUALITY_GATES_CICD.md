# Quality Gates & CI/CD Integration for VideoPlanet Next.js Migration

## Executive Summary
This document defines comprehensive quality gates, automated checks, and CI/CD pipeline configuration to ensure code quality, prevent regressions, and maintain system reliability throughout the Next.js migration process.

## 1. Quality Gates Overview

### 1.1 Gate Hierarchy
```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                    │
├─────────────────────────────────────────────────────────────┤
│ ✓ All E2E Tests Pass          ✓ Performance Benchmarks     │
│ ✓ Security Scan Clean         ✓ Accessibility Score >90%   │
│ ✓ Manual QA Sign-off          ✓ Stakeholder Approval       │
└─────────────────────────────────────────────────────────────┘
                               ↑
┌─────────────────────────────────────────────────────────────┐
│                    STAGING DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────┤
│ ✓ Integration Tests Pass      ✓ API Contract Tests Pass    │
│ ✓ Database Migrations Clean   ✓ Environment Config Valid   │
│ ✓ Smoke Tests Pass            ✓ Load Test Baseline Met     │
└─────────────────────────────────────────────────────────────┘
                               ↑
┌─────────────────────────────────────────────────────────────┐
│                      MERGE TO MAIN                         │
├─────────────────────────────────────────────────────────────┤
│ ✓ All Unit Tests Pass         ✓ Code Coverage >75%         │
│ ✓ Component Tests Pass        ✓ No Flaky Tests             │
│ ✓ TypeScript Check Pass       ✓ ESLint Rules Pass          │
│ ✓ FSD Architecture Rules      ✓ No Circular Dependencies   │
│ ✓ Required Reviews (2+)       ✓ No Merge Conflicts         │
└─────────────────────────────────────────────────────────────┘
                               ↑
┌─────────────────────────────────────────────────────────────┐
│                      COMMIT TO BRANCH                      │
├─────────────────────────────────────────────────────────────┤
│ ✓ Pre-commit Hooks Pass       ✓ Commit Message Format      │
│ ✓ File Size Limits            ✓ No Debug Code/Console.log  │
│ ✓ Prettier Formatting         ✓ Related Tests Added        │
└─────────────────────────────────────────────────────────────┘
```

## 2. Detailed Quality Gate Definitions

### 2.1 Pre-Commit Quality Gates

#### File-Level Checks
```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write",
    "jest --findRelatedTests --passWithNoTests --silent"
  ],
  "*.{js,jsx}": [
    "eslint --fix --max-warnings 0", 
    "prettier --write"
  ],
  "*.{css,scss}": [
    "stylelint --fix",
    "prettier --write"
  ],
  "*.{json,md,yaml,yml}": [
    "prettier --write"
  ]
}
```

#### Pre-commit Hook Configuration
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: no-debug-code
        name: Check for debug code
        entry: grep -r "console\.log\|debugger\|TODO\|FIXME" src/
        language: system
        pass_filenames: false
        always_run: true
        
      - id: file-size-check
        name: Check file sizes
        entry: find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 500 {print "File too large: " $2 " (" $1 " lines)"}'
        language: system
        pass_filenames: false
        always_run: true
        
      - id: fsd-architecture-check
        name: FSD Architecture Rules
        entry: npm run lint:architecture
        language: system
        pass_filenames: false
        always_run: true
```

### 2.2 Pull Request Quality Gates

#### Required Checks Configuration
```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "ci/typescript"
        - "ci/eslint" 
        - "ci/unit-tests"
        - "ci/component-tests"
        - "ci/integration-tests"
        - "ci/architecture-compliance"
        - "ci/dependency-check"
        - "ci/security-scan"
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    restrictions:
      users: []
      teams: ["frontend-leads", "qa-team"]
    enforce_admins: false
    allow_force_pushes: false
    allow_deletions: false
```

#### Code Quality Metrics
```typescript
// jest.config.ts - Coverage thresholds
const coverageThresholds = {
  global: {
    branches: 75,
    functions: 75, 
    lines: 75,
    statements: 75
  },
  // Stricter requirements for critical layers
  "./src/entities/**/*.ts": {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  },
  "./src/features/**/*.{ts,tsx}": {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  "./src/shared/**/*.ts": {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
};
```

### 2.3 Deployment Quality Gates

#### Staging Deployment Checks
```yaml
# staging-deployment.yml
staging_checks:
  required_passes:
    - integration_tests: "100%"
    - api_contract_tests: "100%"
    - database_migrations: "clean"
    - environment_validation: "pass"
    - smoke_tests: "100%"
    - performance_baseline: ">= previous"
  
  quality_metrics:
    lighthouse_performance: ">= 80"
    lighthouse_accessibility: ">= 90"
    lighthouse_best_practices: ">= 80"
    lighthouse_seo: ">= 80"
```

#### Production Deployment Checks
```yaml
# production-deployment.yml
production_checks:
  mandatory_passes:
    - e2e_tests: "100%"
    - security_scan: "no_high_vulnerabilities"
    - accessibility_audit: ">= 90%"
    - performance_budget: "within_limits"
    - manual_qa_signoff: "approved"
    - stakeholder_approval: "approved"
  
  rollback_triggers:
    - error_rate: "> 1%"
    - response_time: "> 2s"
    - user_complaints: "> 5"
    - core_functionality_broken: true
```

## 3. CI/CD Pipeline Configuration

### 3.1 GitHub Actions Workflows

#### Main CI Pipeline
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Needed for SonarCloud
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: TypeScript type checking
        run: npm run type-check
      
      - name: ESLint (including FSD rules)
        run: npm run lint -- --max-warnings 0
      
      - name: Prettier format check
        run: npm run format:check
      
      - name: Architecture compliance
        run: npm run lint:architecture
      
      - name: Dependency audit
        run: npm audit --audit-level high
  
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage --watchAll=false
        env:
          CI: true
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          name: unit-tests
          fail_ci_if_error: true
  
  component-tests:
    name: Component Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Run component tests
        run: npm run test:component -- --coverage --watchAll=false
        env:
          CI: true
      
      - name: Generate component test report
        run: npm run test:component -- --coverage --watchAll=false --reporters=default --reporters=jest-junit
        env:
          JEST_JUNIT_OUTPUT_DIR: ./test-results
          JEST_JUNIT_OUTPUT_NAME: component-test-results.xml
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: component-test-results
          path: test-results/
  
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
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
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Setup test database
        run: npm run db:test:setup
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/videoplanet_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/videoplanet_test
          REDIS_URL: redis://localhost:6379
          API_BASE_URL: http://localhost:3000
  
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    needs: [code-quality, unit-tests, component-tests]
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}
      
      - name: Test build artifacts
        run: |
          npm run start:test &
          SERVER_PID=$!
          sleep 10
          curl -f http://localhost:3000 || exit 1
          kill $SERVER_PID
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/
          retention-days: 7
  
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
      
      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@v2
```

#### E2E Test Pipeline
```yaml
# .github/workflows/e2e.yml
name: End-to-End Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  e2e-tests:
    name: Playwright E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1, 2, 3, 4] # Run tests in parallel
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.E2E_API_URL }}
      
      - name: Start application
        run: npm run start:e2e &
        env:
          PORT: 3000
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: http://localhost:3000
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results-${{ matrix.browser }}-${{ matrix.shard }}
          path: |
            test-results/
            playwright-report/
          retention-days: 7
```

### 3.2 Quality Monitoring and Reporting

#### Automated Quality Reports
```typescript
// scripts/quality-report.ts
import { execSync } from 'child_process';
import fs from 'fs';

interface QualityMetrics {
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  codeQuality: {
    lintErrors: number;
    lintWarnings: number;
    typeErrors: number;
    cyclomaticComplexity: number;
  };
  testMetrics: {
    totalTests: number;
    passingTests: number;
    failingTests: number;
    skippedTests: number;
    flakiness: number;
  };
  performance: {
    buildTime: number;
    testRunTime: number;
    bundleSize: number;
  };
  security: {
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

function generateQualityReport(): QualityMetrics {
  // Run coverage analysis
  const coverageResult = execSync('npm run test:coverage -- --silent').toString();
  const coverage = parseCoverageOutput(coverageResult);
  
  // Run lint analysis
  const lintResult = execSync('npm run lint -- --format json', { encoding: 'utf-8' });
  const lintData = JSON.parse(lintResult);
  
  // Run type checking
  const typeCheckResult = execSync('npx tsc --noEmit --listFiles | wc -l').toString();
  
  // Calculate metrics
  const metrics: QualityMetrics = {
    coverage,
    codeQuality: {
      lintErrors: lintData.filter((r: any) => r.severity === 2).length,
      lintWarnings: lintData.filter((r: any) => r.severity === 1).length,
      typeErrors: parseInt(typeCheckResult.trim()),
      cyclomaticComplexity: calculateComplexity()
    },
    testMetrics: gatherTestMetrics(),
    performance: measurePerformance(),
    security: runSecurityScan()
  };
  
  // Generate HTML report
  generateHtmlReport(metrics);
  
  // Check if metrics meet quality gates
  validateQualityGates(metrics);
  
  return metrics;
}

function validateQualityGates(metrics: QualityMetrics): void {
  const failures: string[] = [];
  
  if (metrics.coverage.lines < 75) {
    failures.push(`Line coverage ${metrics.coverage.lines}% below threshold 75%`);
  }
  
  if (metrics.codeQuality.lintErrors > 0) {
    failures.push(`${metrics.codeQuality.lintErrors} ESLint errors found`);
  }
  
  if (metrics.testMetrics.flakiness > 1) {
    failures.push(`Test flakiness ${metrics.testMetrics.flakiness}% above threshold 1%`);
  }
  
  if (metrics.security.vulnerabilities.critical > 0) {
    failures.push(`${metrics.security.vulnerabilities.critical} critical security vulnerabilities found`);
  }
  
  if (failures.length > 0) {
    console.error('Quality gates failed:');
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exit(1);
  }
  
  console.log('✅ All quality gates passed');
}
```

#### Performance Monitoring
```typescript
// scripts/performance-monitor.ts
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

interface PerformanceMetrics {
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

async function runPerformanceAudit(url: string): Promise<PerformanceMetrics> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  if (!runnerResult) {
    throw new Error('Lighthouse audit failed');
  }
  
  const { lhr } = runnerResult;
  
  return {
    performanceScore: lhr.categories.performance.score * 100,
    firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
    largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
    cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
    timeToInteractive: lhr.audits['interactive'].numericValue,
    totalBlockingTime: lhr.audits['total-blocking-time'].numericValue,
  };
}

// Performance budget configuration
const PERFORMANCE_BUDGETS = {
  performanceScore: 80,
  firstContentfulPaint: 2000,
  largestContentfulPaint: 4000,
  cumulativeLayoutShift: 0.1,
  timeToInteractive: 5000,
  totalBlockingTime: 300,
};

async function validatePerformanceBudget(url: string): Promise<void> {
  const metrics = await runPerformanceAudit(url);
  const violations: string[] = [];
  
  Object.entries(PERFORMANCE_BUDGETS).forEach(([metric, threshold]) => {
    const value = metrics[metric as keyof PerformanceMetrics];
    
    if (metric === 'performanceScore' && value < threshold) {
      violations.push(`Performance score ${value} below threshold ${threshold}`);
    } else if (metric !== 'performanceScore' && value > threshold) {
      violations.push(`${metric} ${value}ms exceeds budget ${threshold}ms`);
    }
  });
  
  if (violations.length > 0) {
    console.error('Performance budget violations:');
    violations.forEach(violation => console.error(`- ${violation}`));
    throw new Error('Performance budget exceeded');
  }
  
  console.log('✅ Performance budget satisfied');
}
```

## 4. Flaky Test Prevention & Management

### 4.1 Flaky Test Detection
```typescript
// scripts/flaky-test-detector.ts
interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  timestamp: Date;
}

class FlakyTestDetector {
  private testResults: Map<string, TestResult[]> = new Map();
  
  addTestResult(result: TestResult): void {
    if (!this.testResults.has(result.testName)) {
      this.testResults.set(result.testName, []);
    }
    
    const results = this.testResults.get(result.testName)!;
    results.push(result);
    
    // Keep only last 10 runs
    if (results.length > 10) {
      results.shift();
    }
  }
  
  detectFlakyTests(threshold = 0.8): string[] {
    const flakyTests: string[] = [];
    
    for (const [testName, results] of this.testResults) {
      if (results.length < 5) continue; // Need minimum runs
      
      const passRate = results.filter(r => r.status === 'pass').length / results.length;
      
      if (passRate > 0 && passRate < threshold) {
        flakyTests.push(testName);
      }
    }
    
    return flakyTests;
  }
  
  quarantineFlakyTests(flakyTests: string[]): void {
    // Move flaky tests to quarantine suite
    const quarantineConfig = {
      displayName: 'Quarantined Tests',
      testMatch: flakyTests.map(test => `**/${test.replace(/\s+/g, '-')}.test.{ts,tsx}`),
      reporters: [['jest-junit', { outputName: 'quarantine-results.xml' }]]
    };
    
    fs.writeFileSync(
      'jest.quarantine.config.js',
      `module.exports = ${JSON.stringify(quarantineConfig, null, 2)};`
    );
  }
}
```

### 4.2 Test Stability Monitoring
```yaml
# .github/workflows/test-stability.yml
name: Test Stability Monitor

on:
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM

jobs:
  stability-check:
    name: Monitor Test Stability
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run stability test (10x execution)
        run: |
          for i in {1..10}; do
            echo "Test run $i"
            npm run test:unit -- --verbose --json --outputFile="test-results-$i.json" || true
          done
      
      - name: Analyze test stability
        run: node scripts/analyze-test-stability.js
      
      - name: Create issue for flaky tests
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const flakyTests = JSON.parse(fs.readFileSync('flaky-tests.json', 'utf8'));
            
            if (flakyTests.length > 0) {
              github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: `🚨 Flaky Tests Detected - ${new Date().toISOString().split('T')[0]}`,
                body: `
                  ## Flaky Tests Detected
                  
                  The following tests are showing flaky behavior:
                  
                  ${flakyTests.map(test => `- ${test.name} (${test.flakinessRate}% failure rate)`).join('\n')}
                  
                  ## Next Steps
                  1. Investigate root causes
                  2. Add proper waits/mocks
                  3. Quarantine if needed
                  4. Rewrite if unfixable
                `,
                labels: ['bug', 'flaky-test', 'high-priority']
              });
            }
```

## 5. Deployment Pipeline Quality Gates

### 5.1 Staging Deployment Pipeline
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  pre-deployment-checks:
    name: Pre-deployment Quality Gates
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run all quality checks
        run: |
          npm run test:all
          npm run lint
          npm run type-check
          npm run test:integration
      
      - name: Build for staging
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}
          NEXT_PUBLIC_ENV: staging
      
      - name: Deploy to staging
        run: npm run deploy:staging
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      - name: Run post-deployment smoke tests
        run: npm run test:smoke:staging
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
      
      - name: Performance audit
        run: npm run audit:performance ${{ secrets.STAGING_URL }}
      
      - name: Accessibility audit
        run: npm run audit:accessibility ${{ secrets.STAGING_URL }}
```

### 5.2 Production Deployment Pipeline
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  production-deployment:
    name: Production Deployment
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Validate release tag
        run: |
          if [[ ! "${{ github.ref_name }}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Invalid release tag format"
            exit 1
          fi
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --production=false
      
      - name: Final quality gate checks
        run: |
          npm run test:all:ci
          npm run e2e:critical
          npm run security:scan
      
      - name: Build for production
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PROD_API_URL }}
          NEXT_PUBLIC_ENV: production
      
      - name: Deploy to production
        run: npm run deploy:production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      - name: Wait for deployment
        run: sleep 60
      
      - name: Production health check
        run: |
          curl -f ${{ secrets.PROD_URL }}/api/health || exit 1
      
      - name: Run production smoke tests
        run: npm run test:smoke:production
        env:
          PROD_URL: ${{ secrets.PROD_URL }}
      
      - name: Notify team
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: "🚀 Production deployment successful: ${{ github.ref_name }}"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Rollback on failure
        if: failure()
        run: |
          npm run deploy:rollback
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            --data '{"text":"🚨 Production deployment failed and rolled back: ${{ github.ref_name }}"}'
```

## 6. Monitoring and Alerting

### 6.1 Quality Metrics Dashboard
```typescript
// scripts/quality-dashboard.ts
interface QualityDashboard {
  overall: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  testing: {
    coverage: number;
    flakinessRate: number;
    testCount: number;
    executionTime: number;
  };
  codeQuality: {
    maintainabilityIndex: number;
    technicalDebt: number;
    duplicateLines: number;
    codeSmells: number;
  };
  security: {
    vulnerabilities: number;
    lastScanDate: Date;
    riskScore: number;
  };
  performance: {
    buildTime: number;
    bundleSize: number;
    lighthouse: {
      performance: number;
      accessibility: number;
      seo: number;
      bestPractices: number;
    };
  };
}

class QualityMetricsCollector {
  async collectMetrics(): Promise<QualityDashboard> {
    return {
      overall: await this.calculateOverallScore(),
      testing: await this.getTestingMetrics(),
      codeQuality: await this.getCodeQualityMetrics(),
      security: await this.getSecurityMetrics(),
      performance: await this.getPerformanceMetrics()
    };
  }
  
  async generateReport(metrics: QualityDashboard): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quality Dashboard - VideoPlanet</title>
          <style>
            /* Dashboard CSS */
          </style>
        </head>
        <body>
          <h1>Quality Dashboard</h1>
          <div class="metric-grid">
            ${this.renderMetricCards(metrics)}
          </div>
          <div class="charts">
            ${this.renderTrendCharts(metrics)}
          </div>
        </body>
      </html>
    `;
    
    fs.writeFileSync('quality-dashboard.html', html);
  }
}
```

### 6.2 Alert Configuration
```yaml
# alerts.yml
alerts:
  quality_gates:
    coverage_drop:
      condition: "coverage < 75"
      severity: "high"
      notify: ["qa-team", "tech-leads"]
      message: "Test coverage dropped below 75%"
    
    flaky_tests:
      condition: "flakiness_rate > 1"
      severity: "medium" 
      notify: ["qa-team"]
      message: "Flaky test rate exceeds 1%"
    
    build_failure:
      condition: "build_status == 'failed'"
      severity: "critical"
      notify: ["all-developers"]
      message: "Build pipeline failed"
  
  security:
    vulnerability_detected:
      condition: "critical_vulns > 0"
      severity: "critical"
      notify: ["security-team", "tech-leads"]
      message: "Critical security vulnerability detected"
  
  performance:
    performance_regression:
      condition: "lighthouse_performance < 80"
      severity: "medium"
      notify: ["performance-team"]
      message: "Performance score below threshold"
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-21  
**Document Owner**: Grace (QA Lead)