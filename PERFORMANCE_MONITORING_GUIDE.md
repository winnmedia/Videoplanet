# VideoPlanet Performance Monitoring & Regression Testing Guide

## 📋 Overview

This comprehensive guide covers the performance monitoring and regression testing system implemented for VideoPlanet. The system includes Real User Monitoring (RUM), Core Web Vitals tracking, load testing, automated regression detection, and continuous performance monitoring through CI/CD pipelines.

## 🎯 Performance Requirements & Thresholds

### Core Web Vitals Standards

| Metric | Good | Needs Improvement | Poor | Description |
|--------|------|-------------------|------|-------------|
| **First Contentful Paint (FCP)** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | Time to first visible content |
| **Largest Contentful Paint (LCP)** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | Time to largest content element |
| **First Input Delay (FID)** | ≤ 100ms | 100ms - 300ms | > 300ms | Time to first user interaction |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | Visual stability score |
| **Time to Interactive (TTI)** | ≤ 3.8s | 3.8s - 7.3s | > 7.3s | Time to full interactivity |
| **Time to First Byte (TTFB)** | ≤ 800ms | 800ms - 1.8s | > 1.8s | Server response time |

### Application-Specific Metrics

| Metric | Target | Warning | Critical | Description |
|--------|--------|---------|----------|-------------|
| **Video Player Initialization** | < 2s | 2s - 5s | > 5s | Time to start video playback |
| **Dashboard Widget Loading** | < 3s | 3s - 6s | > 6s | Widget content load time |
| **API Response Times** | < 200ms | 200ms - 1s | > 1s | Backend API response time |
| **File Upload Progress** | Accurate | Minor delays | Major delays | Upload progress tracking |
| **WebSocket Connection** | < 100ms | 100ms - 500ms | > 500ms | Real-time connection latency |

### Load Testing Criteria

| Metric | Minimum | Target | Description |
|--------|---------|--------|-------------|
| **Concurrent Users** | 50 | 100+ | Simultaneous active users |
| **Success Rate** | 95% | 99%+ | Request success percentage |
| **Average Response Time** | < 2s | < 1s | Average page load time |
| **Requests per Second** | 10 | 50+ | Server throughput |
| **Error Rate** | < 5% | < 1% | Request failure percentage |

## 🔧 System Architecture

### 1. Real User Monitoring (RUM)

```typescript
// Web Vitals Monitor automatically tracks:
- Core Web Vitals (FCP, LCP, FID, CLS, TTI, TTFB)
- Custom performance metrics
- Resource loading times
- API response times
- User interaction metrics
```

**Location**: `/src/shared/lib/performance/web-vitals-monitor.ts`

**Features**:
- Automatic Core Web Vitals collection
- Custom metric tracking for application features
- Offline storage with automatic sync
- Real-time alerting on threshold breaches
- Statistical analysis and trending

### 2. Performance Analytics API

**Endpoints**:
- `GET /api/analytics/performance` - Retrieve performance metrics
- `POST /api/analytics/performance` - Store performance data
- `GET /api/monitoring/alerts` - Get performance alerts
- `POST /api/monitoring/alerts` - Create performance alerts

**Data Storage**:
- In-memory storage for development
- LocalStorage for client-side caching
- Configurable backend integration for production

### 3. Performance Dashboard

**URL**: `/performance-dashboard`

**Features**:
- Real-time Core Web Vitals visualization
- Custom metrics display
- Alert management interface
- Historical trend analysis
- Export functionality

### 4. Regression Detection System

**Location**: `/src/shared/lib/performance/regression-detector.ts`

**Capabilities**:
- Baseline establishment and management
- Statistical regression analysis
- Automated alerting (Slack, email, webhooks)
- Configurable thresholds
- Multi-environment support

## 🧪 Testing Framework

### 1. Core Web Vitals Testing

```bash
# Run Core Web Vitals tests
npm run test:performance:core-vitals

# Run all performance tests
npm run test:performance
```

**Test Coverage**:
- All major application pages
- Performance threshold validation
- Baseline comparison
- Regression detection
- Resource performance analysis

### 2. Load Testing

```bash
# Playwright load testing
npm run test:performance:load

# K6 load testing
npm run test:load:k6

# Autocannon quick load test
npm run test:load:autocannon

# Heavy load testing
npm run test:load:heavy
```

**Test Scenarios**:
- Concurrent user simulation (10-100 users)
- File upload stress testing
- WebSocket connection testing
- Database query load testing
- API endpoint stress testing
- Memory leak detection
- Network latency simulation

### 3. Lighthouse CI Integration

```bash
# Full Lighthouse audit
npm run lighthouse:ci

# Collect only
npm run lighthouse:collect

# Assert against thresholds
npm run lighthouse:assert
```

**Configuration**: `lighthouserc.js`
- Performance budget enforcement
- Accessibility testing
- Best practices validation
- SEO optimization checks

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/performance-monitoring.yml`

**Triggers**:
- Pull requests to main/master
- Daily scheduled runs (2 AM UTC)
- Manual workflow dispatch
- Push to main branches

**Jobs**:
1. **Lighthouse Audit**: Core Web Vitals and performance scoring
2. **Core Web Vitals Testing**: Playwright-based performance tests
3. **Load Testing**: Multi-tool load testing (Playwright, K6, Autocannon)
4. **Regression Analysis**: Automated regression detection
5. **Notification**: Slack/email alerts for regressions

### Performance Gates

**Quality Gates**:
- All Core Web Vitals must meet "Good" or "Needs Improvement" thresholds
- Load testing success rate > 95%
- No critical performance regressions
- Lighthouse performance score > 90

**Failure Actions**:
- Block PR merge on critical failures
- Send immediate alerts for regressions
- Generate detailed performance reports
- Store artifacts for analysis

## 📊 Monitoring & Alerting

### Alert Types

#### Severity Levels
- **Critical**: 50%+ performance degradation
- **High**: 30%+ performance degradation
- **Medium**: 20%+ performance degradation
- **Low**: 10%+ performance degradation

#### Alert Channels
1. **Slack Integration**: Real-time notifications
2. **Email Alerts**: Critical issues and daily summaries
3. **Webhook Integration**: Custom monitoring systems
4. **Dashboard Alerts**: In-app notifications

### Baseline Management

#### Creating Baselines
```typescript
import { regressionDetector } from '@/shared/lib/performance/regression-detector';

// Create baseline for production environment
await regressionDetector.createBaseline(
  'Production Release v2.1.0',
  'production',
  {
    coreWebVitals: { /* metrics */ },
    customMetrics: { /* metrics */ },
    loadMetrics: { /* metrics */ }
  },
  {
    userAgent: navigator.userAgent,
    deviceType: 'desktop',
    cacheEnabled: true
  }
);
```

#### Regression Analysis
```typescript
// Analyze current performance against baseline
const alerts = await regressionDetector.analyzeRegression(
  currentMetrics,
  'production'
);

// Check for critical regressions
const criticalIssues = alerts.filter(alert => 
  alert.severity === 'critical'
);
```

## 🚀 Getting Started

### 1. Installation & Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install K6 (optional, for advanced load testing)
# Follow K6 installation guide for your OS
```

### 2. Configure Environment

```bash
# Set environment variables (optional)
export PERFORMANCE_ALERT_EMAIL="your-email@example.com"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/your-webhook"
export LHCI_GITHUB_APP_TOKEN="your-lighthouse-token"
```

### 3. Establish Baseline

```bash
# Start the application
npm run build && npm run start

# Create initial baseline
npm run performance:baseline
```

### 4. Run Performance Tests

```bash
# Complete performance monitoring
npm run performance:monitor

# Individual test suites
npm run test:performance:core-vitals
npm run test:performance:load
npm run lighthouse:ci
```

## 📈 Using the Performance Dashboard

### Accessing the Dashboard

1. Navigate to `/performance-dashboard`
2. Select time range (1h, 24h, 7d, 30d)
3. Enable/disable auto-refresh
4. Export reports as needed

### Key Features

#### Metrics Overview
- **Total Metrics**: Count of collected data points
- **Recent Activity**: Last 24 hours summary
- **Active Alerts**: Current performance issues
- **Issues Found**: Detected problems count

#### Core Web Vitals Display
- Real-time metric values
- Status indicators (Good/Warning/Poor)
- Comparison with thresholds
- Historical trending

#### Custom Metrics Tracking
- Application-specific performance data
- Video player initialization times
- API response times
- File upload performance
- WebSocket latency metrics

#### Alert Management
- View active alerts by severity
- Alert details and timestamps
- Resolution tracking
- Historical alert data

## 🔍 Troubleshooting

### Common Issues

#### 1. High FCP/LCP Times
**Symptoms**: Slow page loading, poor user experience
**Solutions**:
- Optimize critical resource loading
- Implement resource preloading
- Use CDN for static assets
- Optimize images (WebP, lazy loading)
- Minimize render-blocking resources

#### 2. Poor CLS Scores
**Symptoms**: Layout shifts, visual instability
**Solutions**:
- Set explicit dimensions for images/videos
- Reserve space for dynamic content
- Avoid injecting content above existing content
- Use CSS containment

#### 3. High FID/INP Times
**Symptoms**: Slow user interaction response
**Solutions**:
- Reduce JavaScript execution time
- Implement code splitting
- Optimize event handlers
- Use web workers for heavy computations

#### 4. Load Testing Failures
**Symptoms**: High error rates, slow response times
**Solutions**:
- Scale server infrastructure
- Implement caching strategies
- Optimize database queries
- Add load balancing

### Debug Tools

#### Browser DevTools
```javascript
// Check Core Web Vitals in console
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### Performance API
```javascript
// Get navigation timing
const navigation = performance.getEntriesByType('navigation')[0];
console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd);
console.log('Load Complete:', navigation.loadEventEnd);

// Get resource timing
const resources = performance.getEntriesByType('resource');
console.log('Resource Count:', resources.length);
```

#### Lighthouse CLI
```bash
# Run Lighthouse audit
lighthouse http://localhost:3005 --output=json --output-path=./audit.json

# Run with specific configuration
lighthouse http://localhost:3005 --config-path=./lighthouse-config.js
```

## 📚 Best Practices

### Development Workflow

1. **Pre-Development**:
   - Establish baseline for current feature
   - Set performance budget
   - Define success criteria

2. **During Development**:
   - Run performance tests locally
   - Monitor metrics in development dashboard
   - Test on different devices/connections

3. **Pre-Production**:
   - Run full performance test suite
   - Compare against baseline
   - Validate all thresholds
   - Test under load conditions

4. **Post-Production**:
   - Monitor production metrics
   - Set up alerting
   - Regular performance reviews
   - Update baselines for major releases

### Performance Optimization

#### Frontend Optimizations
- Implement lazy loading for non-critical content
- Use React.memo() for expensive components
- Optimize bundle size with tree shaking
- Implement service worker caching
- Use performance-friendly libraries

#### Backend Optimizations
- Implement database query optimization
- Add response compression (gzip/brotli)
- Use CDN for static assets
- Implement API response caching
- Optimize image processing

#### Infrastructure Optimizations
- Use appropriate server sizing
- Implement horizontal scaling
- Add load balancing
- Use database connection pooling
- Monitor resource utilization

## 🚨 Alert Response Procedures

### Critical Alerts (50%+ Degradation)
1. **Immediate Response** (< 15 minutes)
   - Acknowledge alert
   - Check system status
   - Identify root cause
   - Implement temporary fix if possible

2. **Investigation** (< 1 hour)
   - Analyze performance data
   - Review recent deployments
   - Check infrastructure metrics
   - Identify permanent solution

3. **Resolution** (< 4 hours)
   - Implement fix
   - Validate performance restoration
   - Update monitoring
   - Document incident

### High/Medium Alerts (20-50% Degradation)
1. **Assessment** (< 1 hour)
   - Review alert details
   - Determine impact scope
   - Plan response strategy

2. **Resolution** (< 24 hours)
   - Implement optimization
   - Test performance improvement
   - Monitor for recurrence

### Low Alerts (10-20% Degradation)
1. **Review** (< 1 business day)
   - Analyze trend data
   - Plan optimization work
   - Schedule implementation

2. **Optimization** (< 1 week)
   - Implement improvements
   - Measure results
   - Update baselines

## 📝 Reporting & Analytics

### Daily Reports
- Automated email summary of key metrics
- Alert activity summary
- Performance trend analysis
- Recommendations for optimization

### Weekly Reports
- Comprehensive performance dashboard
- Regression analysis
- Baseline comparison
- Optimization progress tracking

### Monthly Reports
- Executive performance summary
- Business impact analysis
- Performance improvement ROI
- Strategic recommendations

### Custom Reports
- Export performance data (JSON/CSV)
- Create custom dashboards
- Integration with BI tools
- API access for custom analytics

## 🔗 External Integrations

### Monitoring Services
- **DataDog**: Full-stack monitoring integration
- **New Relic**: Application performance monitoring
- **Sentry**: Error tracking with performance context
- **LogRocket**: User session replay with performance data

### Communication Platforms
- **Slack**: Real-time alerts and notifications
- **Microsoft Teams**: Enterprise communication
- **PagerDuty**: Incident management
- **Email**: Critical alert notifications

### Development Tools
- **GitHub Actions**: CI/CD performance testing
- **Vercel Analytics**: Deployment performance tracking
- **Railway**: Backend infrastructure monitoring
- **Lighthouse CI**: Automated performance auditing

## 📋 Maintenance Schedule

### Daily Tasks
- [ ] Check performance dashboard
- [ ] Review active alerts
- [ ] Monitor key metrics trends
- [ ] Validate CI/CD performance tests

### Weekly Tasks
- [ ] Analyze performance trends
- [ ] Review baseline accuracy
- [ ] Update alert thresholds if needed
- [ ] Performance optimization planning

### Monthly Tasks
- [ ] Comprehensive performance review
- [ ] Update performance baselines
- [ ] Review and update documentation
- [ ] Optimize monitoring configuration

### Quarterly Tasks
- [ ] Performance strategy review
- [ ] Tool and process evaluation
- [ ] Team training and updates
- [ ] Performance budget review

---

## 🆘 Support & Contact

For questions about performance monitoring:
- **Technical Issues**: Create GitHub issue with `performance` label
- **Critical Incidents**: Use emergency escalation procedures
- **Feature Requests**: Submit enhancement proposals
- **Documentation**: Update this guide with improvements

## 📚 Additional Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse Performance Auditing](https://developers.google.com/web/tools/lighthouse)
- [Playwright Testing Framework](https://playwright.dev/)
- [K6 Load Testing](https://k6.io/docs/)
- [Core Web Vitals Optimization](https://web.dev/optimize-cwv/)

---

**Last Updated**: August 22, 2025  
**Version**: 1.0.0  
**Maintainer**: VideoPlanet Development Team