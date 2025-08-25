# Comprehensive Testing Strategy for Video Feedback Platform Enhancements

**Document Owner**: Grace (QA Lead)  
**Version**: 1.0.0  
**Date**: 2025-08-22  
**Architecture**: Feature-Sliced Design (FSD) Aligned

## Executive Summary

This document defines a comprehensive testing strategy for the video feedback platform enhancements, ensuring quality is built into every layer of the development pipeline. Our approach follows the Test Pyramid principle with strict TDD enforcement and quality gates that prevent defects before they reach production.

## 1. Test Pyramid Strategy by Feature Enhancement

### 1.1 Sidebar Navigation Enhancement (콘텐츠 menu removal)

#### Test Distribution
- **Unit Tests (70%)**: Navigation state management, route filtering, menu item configuration
- **Integration Tests (20%)**: Navigation-content synchronization, route transitions
- **E2E Tests (10%)**: Complete navigation workflows across user journeys

#### Test Matrix

| Component | Unit Tests | Integration Tests | E2E Tests | Coverage Target |
|-----------|------------|-------------------|-----------|-----------------|
| SideBar Component | Menu rendering, state changes, accessibility | Route filtering, content updates | Complete navigation flows | 95% |
| Navigation State | Redux actions, selectors, reducers | State-UI synchronization | User journey flows | 90% |
| Route Guards | Permission checks, redirect logic | Authentication flow | Protected route access | 85% |

#### Quality Gates
- **Unit Coverage**: ≥ 90% for navigation components
- **Integration Coverage**: ≥ 80% for navigation workflows
- **E2E Success Rate**: ≥ 99% for critical navigation paths
- **Performance**: Navigation response time < 100ms

---

### 1.2 Enhanced Video Player Controls

#### Test Distribution
- **Unit Tests (60%)**: Control component logic, state management, utility functions
- **Integration Tests (30%)**: Player-control synchronization, backend integration
- **E2E Tests (10%)**: Complete video interaction workflows

#### Critical Test Areas

##### A. Video Upload Component
```typescript
// Test Requirements
describe('VideoUploadControl', () => {
  // Unit Tests (Coverage: 95%)
  - File validation (format, size, codec)
  - Upload progress tracking
  - Error handling and recovery
  - Chunk upload logic
  - Cancellation handling
  
  // Integration Tests (Coverage: 85%)
  - Player integration after upload
  - Backend API communication
  - Real-time progress updates
  - Error boundary behavior
  
  // E2E Tests (Coverage: Critical paths)
  - Complete upload workflow
  - Large file handling
  - Network interruption recovery
  - Multiple file uploads
});
```

##### B. Video Replace Functionality
```typescript
describe('VideoReplaceControl', () => {
  // Unit Tests (Coverage: 90%)
  - Replace validation logic
  - Version management
  - Backup handling
  - Permission checks
  
  // Integration Tests (Coverage: 80%)
  - Player state preservation
  - Comment timestamp adjustment
  - Feedback data migration
  - Version history tracking
  
  // E2E Tests (Coverage: Critical workflows)
  - Replace with comments preservation
  - Rollback functionality
  - Multi-user replace scenarios
});
```

##### C. Timestamp Feedback System
```typescript
describe('TimestampFeedbackControl', () => {
  // Unit Tests (Coverage: 95%)
  - Timestamp calculation accuracy
  - Feedback positioning logic
  - Comment threading
  - Real-time synchronization
  
  // Integration Tests (Coverage: 85%)
  - Video player synchronization
  - WebSocket real-time updates
  - Database persistence
  - Comment collision handling
  
  // E2E Tests (Coverage: Critical paths)
  - Multi-user simultaneous feedback
  - Feedback during video playback
  - Timeline navigation with feedback
});
```

##### D. Screenshot Capture
```typescript
describe('ScreenshotControl', () => {
  // Unit Tests (Coverage: 90%)
  - Canvas rendering logic
  - Image quality optimization
  - Timestamp association
  - Storage handling
  
  // Integration Tests (Coverage: 80%)
  - Video frame extraction
  - Backend upload integration
  - Comment attachment
  - Metadata preservation
  
  // E2E Tests (Coverage: Essential workflows)
  - Screenshot during playback
  - Screenshot annotation workflow
  - High-resolution capture
});
```

##### E. Share Functionality
```typescript
describe('ShareControl', () => {
  // Unit Tests (Coverage: 85%)
  - Share link generation
  - Permission validation
  - Expiration handling
  - Access control logic
  
  // Integration Tests (Coverage: 80%)
  - Email integration
  - Social media sharing
  - Permission enforcement
  - Analytics tracking
  
  // E2E Tests (Coverage: Key scenarios)
  - Public share workflows
  - Private share with permissions
  - Bulk sharing operations
});
```

#### Performance Testing Criteria
- **Video Load Time**: < 3 seconds for 1080p video
- **Control Response Time**: < 100ms for all interactions
- **Upload Performance**: > 80% of theoretical maximum bandwidth
- **Screenshot Generation**: < 2 seconds for 4K frames
- **Share Link Generation**: < 500ms including validation

---

### 1.3 Member Invitation System with Email

#### Integration Testing Strategy

##### A. Invitation Workflow Testing
```typescript
describe('MemberInvitationWorkflow', () => {
  // Integration Test Suite (Coverage: 90%)
  
  test('Complete invitation flow', async () => {
    // 1. Project owner sends invitation
    // 2. Email service integration
    // 3. Invitation link generation
    // 4. Recipient email delivery
    // 5. Link validation and acceptance
    // 6. User onboarding to project
    // 7. Permission assignment
    // 8. Notification to project team
  });
  
  test('Invitation with custom permissions', async () => {
    // Test role-based invitation flows
    // Verify permission inheritance
    // Validate access restrictions
  });
  
  test('Bulk invitation processing', async () => {
    // Test multiple simultaneous invitations
    // Verify email delivery batching
    // Handle invitation conflicts
  });
  
  test('Invitation expiration handling', async () => {
    // Test expired link behavior
    // Verify cleanup processes
    // Handle re-invitation scenarios
  });
});
```

##### B. Email Service Integration
```typescript
describe('EmailInvitationService', () => {
  // Integration Tests with External Services
  
  test('Email delivery integration', async () => {
    // Mock email service responses
    // Test delivery confirmation
    // Handle delivery failures
    // Verify email content formatting
  });
  
  test('Template rendering and localization', async () => {
    // Test email template rendering
    // Verify multi-language support
    // Validate brand consistency
  });
  
  test('Bounce and failure handling', async () => {
    // Test invalid email handling
    // Verify retry mechanisms
    // Handle permanent failures
  });
});
```

#### Quality Gates for Invitation System
- **Email Delivery Rate**: ≥ 98% successful delivery
- **Invitation Acceptance Rate**: Track and optimize for > 70%
- **Security**: 100% validation of invitation tokens
- **Performance**: Invitation processing < 2 seconds per invite

---

### 1.4 Repositioned Project Information Display

#### Component Testing Strategy
```typescript
describe('ProjectInformationDisplay', () => {
  // Unit Tests (Coverage: 90%)
  test('Information layout and positioning', () => {
    // Test responsive layout adaptation
    // Verify information hierarchy
    // Validate accessibility compliance
  });
  
  test('Real-time information updates', () => {
    // Test WebSocket data synchronization
    // Verify state management
    // Handle concurrent updates
  });
  
  // Integration Tests (Coverage: 85%)
  test('Integration with project dashboard', () => {
    // Test dashboard synchronization
    // Verify data consistency
    // Handle layout conflicts
  });
  
  test('Performance with large datasets', () => {
    // Test rendering performance
    // Verify memory usage
    // Handle data pagination
  });
});
```

---

### 1.5 Enhanced Comment System with Emotions and Nested Replies

#### Comprehensive Testing Approach

##### A. Comment Threading System
```typescript
describe('CommentThreadingSystem', () => {
  // Unit Tests (Coverage: 95%)
  test('Nested comment structure', () => {
    // Test comment hierarchy logic
    // Verify parent-child relationships
    // Handle deep nesting scenarios
    // Test comment ordering algorithms
  });
  
  test('Comment state management', () => {
    // Test Redux comment store
    // Verify optimistic updates
    // Handle conflict resolution
    // Test comment normalization
  });
  
  // Integration Tests (Coverage: 85%)
  test('Real-time comment synchronization', () => {
    // Test WebSocket comment updates
    // Verify multi-user scenarios
    // Handle comment conflicts
    // Test comment ordering consistency
  });
  
  test('Comment persistence and loading', () => {
    // Test database integration
    // Verify comment loading performance
    // Handle large comment threads
    // Test comment search functionality
  });
});
```

##### B. Emotion System
```typescript
describe('CommentEmotionSystem', () => {
  // Unit Tests (Coverage: 90%)
  test('Emotion rendering and interaction', () => {
    // Test emotion component rendering
    // Verify emotion state management
    // Handle emotion updates
    // Test accessibility compliance
  });
  
  test('Emotion aggregation logic', () => {
    // Test emotion counting
    // Verify emotion statistics
    // Handle emotion conflicts
    // Test emotion analytics
  });
  
  // Integration Tests (Coverage: 80%)
  test('Real-time emotion updates', () => {
    // Test emotion WebSocket updates
    // Verify emotion synchronization
    // Handle concurrent emotion changes
    // Test emotion notification system
  });
});
```

##### C. Performance Testing for Comment System
- **Comment Loading Time**: < 2 seconds for 100 comments
- **Real-time Update Latency**: < 200ms for comment sync
- **Search Performance**: < 1 second for comment search
- **Emotion Update Response**: < 100ms for emotion interactions

#### Quality Gates for Comment System
- **Thread Integrity**: 100% parent-child relationship accuracy
- **Real-time Sync**: ≥ 99.5% message delivery success
- **Search Accuracy**: ≥ 95% relevant result precision
- **Emotion Consistency**: 100% emotion state accuracy

---

## 2. Cross-Cutting Testing Requirements

### 2.1 Performance Testing Criteria

#### Video Operations Performance
```typescript
describe('VideoPerformanceTests', () => {
  test('Video loading performance', async () => {
    // Target: < 3 seconds for 1080p video
    // Measure: First frame render time
    // Verify: Progressive loading behavior
  });
  
  test('Video seeking performance', async () => {
    // Target: < 500ms seek response
    // Measure: Seek accuracy and speed
    // Verify: Frame precision
  });
  
  test('Multiple video handling', async () => {
    // Target: Support 4+ simultaneous videos
    // Measure: Memory usage and CPU load
    // Verify: Performance degradation limits
  });
});
```

#### Comment Loading Performance
```typescript
describe('CommentLoadingPerformance', () => {
  test('Initial comment load', async () => {
    // Target: < 2 seconds for 100 comments
    // Measure: Time to first comment render
    // Verify: Progressive loading implementation
  });
  
  test('Infinite scroll performance', async () => {
    // Target: < 500ms for additional comment batches
    // Measure: Scroll response time
    // Verify: Memory management for large threads
  });
  
  test('Real-time comment updates', async () => {
    // Target: < 200ms update latency
    // Measure: WebSocket message handling
    // Verify: Update batching efficiency
  });
});
```

### 2.2 Accessibility Testing Checklist

#### Video Player Accessibility
- [ ] **Keyboard Navigation**
  - Tab order follows logical sequence
  - All controls accessible via keyboard
  - Custom key bindings for video operations
  - Escape key handling for modals

- [ ] **Screen Reader Support**
  - ARIA labels for all controls
  - Video description and captions
  - Progress announcement during playback
  - Error message accessibility

- [ ] **Visual Accessibility**
  - High contrast mode support
  - Focus indicators visible
  - Text scaling compatibility
  - Color blindness considerations

#### Comment System Accessibility
- [ ] **Thread Navigation**
  - Logical reading order for nested comments
  - Thread collapse/expand announcements
  - Reply relationship clarity
  - Comment count announcements

- [ ] **Emotion System**
  - Alt text for emotion icons
  - Keyboard emotion selection
  - Emotion state announcements
  - Screen reader friendly emotion counts

#### Form Accessibility
- [ ] **Input Validation**
  - Error message association
  - Required field indication
  - Validation state announcement
  - Error correction guidance

### 2.3 Cross-Browser Compatibility Requirements

#### Browser Support Matrix
| Browser | Version | Desktop Support | Mobile Support | Critical Features |
|---------|---------|-----------------|----------------|-------------------|
| Chrome | Latest 2 versions | ✅ Full | ✅ Full | All features |
| Firefox | Latest 2 versions | ✅ Full | ✅ Full | All features |
| Safari | Latest 2 versions | ✅ Full | ✅ Full | Video codec compatibility |
| Edge | Latest 2 versions | ✅ Full | ✅ Partial | All features |
| Samsung Internet | Latest | ❌ Not tested | ✅ Basic | Core functionality |

#### Feature Compatibility Testing
```typescript
describe('CrossBrowserCompatibility', () => {
  test('Video codec support', async () => {
    // Test H.264, WebM, AV1 support
    // Verify fallback mechanisms
    // Handle unsupported formats
  });
  
  test('WebSocket compatibility', async () => {
    // Test real-time features
    // Verify reconnection logic
    // Handle connection failures
  });
  
  test('Local storage and caching', async () => {
    // Test data persistence
    // Verify cache behavior
    // Handle storage limitations
  });
});
```

### 2.4 Mobile Responsiveness Testing Strategy

#### Device Testing Matrix
| Device Category | Screen Sizes | Orientation | Key Test Areas |
|-----------------|--------------|-------------|----------------|
| Small Phones | 320px - 480px | Portrait/Landscape | Touch targets, readability |
| Large Phones | 481px - 768px | Portrait/Landscape | Video controls, comments |
| Tablets | 769px - 1024px | Portrait/Landscape | Layout adaptation |
| Desktop | 1025px+ | Landscape | Full feature set |

#### Mobile-Specific Testing
```typescript
describe('MobileResponsiveness', () => {
  test('Touch interaction optimization', async () => {
    // Test touch target sizes (44px minimum)
    // Verify gesture support
    // Handle touch conflicts
  });
  
  test('Video player mobile experience', async () => {
    // Test fullscreen functionality
    // Verify mobile video controls
    // Handle orientation changes
  });
  
  test('Comment system mobile usability', async () => {
    // Test virtual keyboard handling
    // Verify scrolling behavior
    // Handle comment thread navigation
  });
});
```

---

## 3. Test Implementation Strategy

### 3.1 Test Development Workflow

#### TDD Implementation Process
1. **Red Phase**: Write failing tests that define expected behavior
2. **Green Phase**: Implement minimal code to make tests pass
3. **Refactor Phase**: Improve code quality while maintaining test coverage

#### Test Categories by Development Phase

##### Phase 1: Component Unit Tests
```bash
# Command execution
npm run test -- --testMatch="**/*.unit.test.*"

# Coverage target: 90%+ for business logic
# Focus: Individual component behavior
```

##### Phase 2: Integration Tests
```bash
# Command execution
npm run test -- --testMatch="**/*.integration.test.*"

# Coverage target: 80%+ for feature interactions
# Focus: Component collaboration
```

##### Phase 3: E2E Tests
```bash
# Command execution
npm run test:e2e

# Coverage target: Critical user journeys
# Focus: Complete workflows
```

### 3.2 Quality Gates Configuration

#### Pre-commit Gates
```yaml
pre-commit-checks:
  - lint: ESLint with accessibility rules
  - type-check: TypeScript strict mode
  - unit-tests: All unit tests must pass
  - coverage: Minimum 85% line coverage
  - security: Dependency vulnerability scan
```

#### Pre-merge Gates
```yaml
pull-request-checks:
  - integration-tests: All integration tests pass
  - e2e-smoke: Critical path E2E tests
  - performance: Performance regression detection
  - accessibility: Automated a11y checks
  - cross-browser: Core browser compatibility
```

#### Pre-deployment Gates
```yaml
deployment-gates:
  - full-test-suite: Complete test execution
  - performance-benchmark: Performance targets met
  - security-scan: Security vulnerability assessment
  - load-testing: System capacity verification
```

### 3.3 Test Infrastructure Requirements

#### Test Environment Setup
```typescript
// Test Configuration
export const testConfig = {
  // Database
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5433, // Test database port
    database: 'videoplanet_test',
    synchronize: true,
    dropSchema: true
  },
  
  // Redis for testing
  redis: {
    host: 'localhost',
    port: 6380, // Test Redis port
    db: 1 // Separate test database
  },
  
  // Mock services
  mockServices: {
    emailService: true,
    videoProcessing: true,
    fileStorage: true,
    notifications: true
  },
  
  // Performance thresholds
  performance: {
    pageLoad: 3000, // 3 seconds
    apiResponse: 1000, // 1 second
    videoLoad: 5000, // 5 seconds
    commentLoad: 2000 // 2 seconds
  }
};
```

#### CI/CD Integration
```yaml
# GitHub Actions Workflow
name: Video Feedback Platform Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: test-results/
```

---

## 4. Coverage Requirements and Metrics

### 4.1 Coverage Targets by Component

| Component | Unit Coverage | Integration Coverage | E2E Coverage | Mutation Score |
|-----------|---------------|---------------------|---------------|----------------|
| Video Player Controls | 95% | 85% | Critical Paths | 80% |
| Comment System | 90% | 80% | All Features | 75% |
| Member Invitation | 85% | 90% | Complete Flow | 70% |
| Navigation System | 90% | 75% | Core Journeys | 75% |
| Project Information | 85% | 80% | Key Scenarios | 70% |

### 4.2 Quality Metrics Dashboard

#### Real-time Quality Indicators
```typescript
interface QualityMetrics {
  // Test Coverage
  unitCoverage: number; // Target: >85%
  integrationCoverage: number; // Target: >80%
  e2eCoverage: number; // Target: Critical paths
  
  // Test Reliability
  flakyTestRate: number; // Target: <1%
  testExecutionTime: number; // Target: <10 minutes
  
  // Performance Metrics
  coreWebVitals: {
    lcp: number; // Target: <2.5s
    fid: number; // Target: <100ms
    cls: number; // Target: <0.1
  };
  
  // Accessibility Score
  accessibilityScore: number; // Target: >95 (Lighthouse)
  
  // Security Metrics
  vulnerabilityCount: number; // Target: 0 high/critical
  securityTestCoverage: number; // Target: >90%
}
```

### 4.3 Regression Testing Strategy

#### Automated Regression Suite
```typescript
describe('RegressionTestSuite', () => {
  describe('Video Player Regressions', () => {
    test('Video seeking accuracy maintained', async () => {
      // Prevent regression: Seek position drift
      // Verify: Frame-accurate seeking
    });
    
    test('Multiple video performance', async () => {
      // Prevent regression: Memory leaks
      // Verify: Stable performance with multiple videos
    });
  });
  
  describe('Comment System Regressions', () => {
    test('Nested comment threading integrity', async () => {
      // Prevent regression: Thread structure corruption
      // Verify: Parent-child relationships maintained
    });
    
    test('Real-time update reliability', async () => {
      // Prevent regression: Message delivery failures
      // Verify: 99.9% message delivery rate
    });
  });
});
```

---

## 5. Test Execution and Monitoring

### 5.1 Test Execution Schedule

#### Continuous Testing
- **Unit Tests**: On every commit
- **Integration Tests**: On PR creation
- **Accessibility Tests**: Daily automated run
- **Performance Tests**: Weekly regression check
- **Security Tests**: On dependency updates

#### Release Testing
- **Full E2E Suite**: Before each release
- **Cross-browser Testing**: Release candidate validation
- **Load Testing**: Production capacity verification
- **User Acceptance Testing**: Stakeholder validation

### 5.2 Test Result Monitoring

#### Automated Reporting
```typescript
interface TestReport {
  // Execution Summary
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  
  // Coverage Report
  coverageByFeature: Map<string, number>;
  overallCoverage: number;
  
  // Performance Results
  performanceMetrics: QualityMetrics;
  
  // Failure Analysis
  failureCategories: Map<string, number>;
  flakyTests: string[];
  
  // Trends
  coverageTrend: number[];
  performanceTrend: number[];
}
```

#### Alert Configuration
```yaml
alerts:
  - trigger: Test failure rate > 5%
    action: Slack notification to QA team
    
  - trigger: Coverage drop > 2%
    action: Block deployment
    
  - trigger: Performance regression > 10%
    action: Email to development leads
    
  - trigger: Security vulnerability detected
    action: Immediate team notification
```

---

## 6. Risk Mitigation and Contingency Planning

### 6.1 Testing Risk Assessment

#### High-Risk Areas
1. **Video Player Integration**: Complex multimedia handling
2. **Real-time Features**: WebSocket reliability
3. **Cross-browser Compatibility**: Codec and API differences
4. **Performance at Scale**: Large comment threads and video files

#### Mitigation Strategies
```typescript
interface RiskMitigation {
  // Video Player Risks
  videoPlayerRisks: {
    risk: 'Codec compatibility issues';
    mitigation: 'Comprehensive codec testing matrix';
    fallback: 'Progressive format fallbacks';
  };
  
  // Real-time Feature Risks
  realtimeRisks: {
    risk: 'WebSocket connection instability';
    mitigation: 'Robust reconnection logic testing';
    fallback: 'Polling-based fallback mechanism';
  };
  
  // Performance Risks
  performanceRisks: {
    risk: 'Large dataset performance degradation';
    mitigation: 'Stress testing with production-like data';
    fallback: 'Pagination and virtualization';
  };
}
```

### 6.2 Test Environment Maintenance

#### Environment Health Monitoring
- **Database Performance**: Query execution time monitoring
- **Test Data Management**: Automated cleanup and refresh
- **Service Dependencies**: Mock service health checks
- **Infrastructure Monitoring**: Resource usage tracking

---

## 7. Success Metrics and KPIs

### 7.1 Quality KPIs

#### Test Effectiveness Metrics
- **Defect Detection Rate**: % of bugs caught before production
- **Test Coverage Accuracy**: Coverage vs. actual bug detection
- **Test Execution Efficiency**: Tests per minute
- **False Positive Rate**: < 2% for automated tests

#### User Experience Metrics
- **Feature Adoption Rate**: Usage of new enhancements
- **User Satisfaction Score**: Post-release feedback
- **Error Rate in Production**: < 0.1% for critical features
- **Performance Satisfaction**: Core Web Vitals compliance

### 7.2 Continuous Improvement

#### Regular Assessment Schedule
- **Weekly**: Test execution metrics review
- **Monthly**: Coverage and quality trend analysis
- **Quarterly**: Testing strategy effectiveness review
- **Annually**: Testing infrastructure and tooling evaluation

---

## Conclusion

This comprehensive testing strategy ensures that the video feedback platform enhancements are delivered with the highest quality standards. By implementing rigorous testing at every layer of the FSD architecture, we maintain our commitment to building quality in rather than inspecting it in.

The strategy emphasizes early defect detection, comprehensive coverage, and user-focused quality metrics. Through automated testing pipelines, continuous monitoring, and proactive risk mitigation, we ensure that our video feedback platform delivers an exceptional user experience while maintaining system reliability and performance.

**Next Steps:**
1. Begin implementation of unit tests for video player controls
2. Set up integration testing infrastructure for member invitation workflow  
3. Configure cross-browser testing pipeline
4. Establish performance benchmarking for video operations
5. Implement accessibility testing automation

---

**Document Approval:**
- Grace (QA Lead) - Testing Strategy Owner
- Technical Review Required: Development Team Leads
- Stakeholder Review: Product Owner

**Related Documents:**
- `FSD_TESTING_ARCHITECTURE.md` - Architectural testing patterns
- `PERFORMANCE_MONITORING_GUIDE.md` - Performance testing framework
- `QUALITY_GATES_CICD.md` - CI/CD quality configurations