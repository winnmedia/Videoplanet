# Performance Testing Suite

This directory contains comprehensive performance testing tools and scripts for VideoPlanet.

## 📁 Structure

```
test/performance/
├── core-web-vitals.spec.ts    # Core Web Vitals performance tests
├── load-testing.spec.ts       # Load testing with Playwright
├── k6-load-test.js            # K6 load testing script
├── results.json               # Core Web Vitals test results
├── load-test-results.json     # Load testing results
├── baseline-results.json      # Performance baselines
└── README.md                  # This file
```

## 🧪 Test Suites

### Core Web Vitals Testing
- **File**: `core-web-vitals.spec.ts`
- **Purpose**: Tests all major pages against Core Web Vitals thresholds
- **Metrics**: FCP, LCP, FID, CLS, TTFB, INP
- **Features**: Baseline comparison, regression detection, resource analysis

### Load Testing
- **File**: `load-testing.spec.ts`  
- **Purpose**: Stress testing with concurrent users
- **Tests**: 10-100 concurrent users, file uploads, WebSocket connections
- **Features**: Memory leak detection, resource limits testing

### K6 Load Testing
- **File**: `k6-load-test.js`
- **Purpose**: Advanced load testing with K6
- **Scenarios**: Realistic user journeys, API testing, static assets
- **Features**: Staged load testing, custom metrics, thresholds

## 🚀 Running Tests

```bash
# Run all performance tests
npm run test:performance

# Run Core Web Vitals tests
npm run test:performance:core-vitals

# Run load testing
npm run test:performance:load

# Run K6 load tests
npm run test:load:k6

# Run Autocannon load tests
npm run test:load:autocannon
```

## 📊 Results

Test results are automatically stored in JSON files:
- `results.json`: Core Web Vitals measurements
- `load-test-results.json`: Load testing statistics
- `baseline-results.json`: Performance baselines for comparison

## 🔧 Configuration

### Core Web Vitals Thresholds
- FCP: < 1.8s (good), < 3.0s (needs improvement)
- LCP: < 2.5s (good), < 4.0s (needs improvement)  
- FID: < 100ms (good), < 300ms (needs improvement)
- CLS: < 0.1 (good), < 0.25 (needs improvement)
- TTFB: < 800ms (good), < 1.8s (needs improvement)

### Load Testing Criteria
- Success Rate: > 95%
- Average Response Time: < 2s
- Requests per Second: > 10
- Error Rate: < 5%

## 📈 Monitoring

Results are integrated with:
- Performance Dashboard (`/performance-dashboard`)
- CI/CD pipeline alerts
- Regression detection system
- Real-time monitoring APIs