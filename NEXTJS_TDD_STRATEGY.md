# Next.js TDD Strategy for VideoPlanet Migration

## Executive Summary
This document outlines the comprehensive Test-Driven Development strategy for migrating VideoPlanet from React to Next.js 14 with App Router, implementing Feature-Sliced Design (FSD) architecture while maintaining quality gates throughout the migration.

## 1. Testing Architecture Overview

### Test Pyramid Distribution
```
      E2E (5%) - Critical User Journeys
     ────────────────────────────
    Integration (15%) - Feature Flows  
   ──────────────────────────────────
  Component Tests (30%) - UI Behavior
 ────────────────────────────────────────
Unit Tests (50%) - Business Logic & Utils
──────────────────────────────────────────
```

### Coverage Targets by FSD Layer
- **entities**: 85%+ (core business logic)
- **features**: 80%+ (user interactions)
- **widgets**: 70%+ (composition logic) 
- **app**: 60%+ (routing/layout)
- **shared**: 90%+ (utilities/helpers)

## 2. Next.js App Router Testing Strategy

### 2.1 Server Components vs Client Components

#### Server Components Testing
```typescript
// RSC Testing Pattern - entities/project/model/project.test.ts
import { validateProjectData } from './project';

describe('Project Entity (Server)', () => {
  test('validates project data schema correctly', () => {
    const validProject = { name: 'Test Project', status: 'active' };
    expect(validateProjectData(validProject)).toEqual(validProject);
  });
  
  test('throws validation error for invalid data', () => {
    expect(() => validateProjectData({})).toThrow('Project name required');
  });
});
```

#### Client Components Testing
```typescript
// Client Component Testing - features/project-form/ui/ProjectForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectForm } from './ProjectForm';

describe('ProjectForm (Client)', () => {
  test('submits valid project data', async () => {
    const onSubmit = jest.fn();
    render(<ProjectForm onSubmit={onSubmit} />);
    
    await fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'New Project' }
    });
    
    await fireEvent.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'New Project' });
    });
  });
});
```

### 2.2 Route Handler Testing

```typescript
// app/api/projects/route.test.ts
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/projects', () => {
  test('GET returns projects list', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('projects');
  });
  
  test('POST creates new project', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Project' })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

## 3. FSD Layer Testing Architecture

### 3.1 Entities Layer (Business Logic Core)

#### Test Structure:
```
entities/
  project/
    __tests__/
      model/
        project-store.test.ts
        project-selectors.test.ts
        project-normalizer.test.ts
      lib/
        validators.test.ts
        transformers.test.ts
```

#### Testing Pattern - Domain Logic:
```typescript
// entities/project/model/project-store.test.ts
import { projectSlice, selectProjectById } from './project-store';

describe('Project Entity Store', () => {
  const initialState = { projects: {}, loading: false };
  
  test('adds project to normalized state', () => {
    const action = projectSlice.actions.addProject({
      id: '1',
      name: 'Test Project',
      status: 'active'
    });
    
    const nextState = projectSlice.reducer(initialState, action);
    
    expect(nextState.projects['1']).toEqual({
      id: '1',
      name: 'Test Project', 
      status: 'active'
    });
  });
  
  test('selector returns project by id', () => {
    const state = {
      project: {
        projects: { '1': { id: '1', name: 'Test' } }
      }
    };
    
    expect(selectProjectById(state, '1')).toEqual({
      id: '1',
      name: 'Test'
    });
  });
});
```

#### Data Transformation Testing:
```typescript
// entities/project/lib/transformers.test.ts
import { transformProjectDTO } from './transformers';

describe('Project DTO Transformers', () => {
  test('transforms server DTO to domain model', () => {
    const serverDTO = {
      project_id: 123,
      project_name: 'Server Project',
      created_at: '2025-01-01T00:00:00Z',
      is_active: true
    };
    
    const domainModel = transformProjectDTO(serverDTO);
    
    expect(domainModel).toEqual({
      id: '123',
      name: 'Server Project',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      status: 'active'
    });
  });
});
```

### 3.2 Features Layer (User Interactions)

#### Test Structure:
```
features/
  project-creation/
    __tests__/
      ui/
        ProjectCreationForm.test.tsx
        ProjectCreationModal.test.tsx
      model/
        project-creation-store.test.ts
      lib/
        validation.test.ts
```

#### Component Behavior Testing:
```typescript
// features/project-creation/ui/ProjectCreationForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from 'shared/testing/TestProviders';
import { ProjectCreationForm } from './ProjectCreationForm';

describe('ProjectCreationForm', () => {
  const user = userEvent.setup();
  
  test('validates required fields before submission', async () => {
    render(
      <TestProviders>
        <ProjectCreationForm />
      </TestProviders>
    );
    
    await user.click(screen.getByRole('button', { name: /create project/i }));
    
    expect(screen.getByRole('alert')).toHaveTextContent('Project name is required');
    expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled();
  });
  
  test('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(
      <TestProviders>
        <ProjectCreationForm onSubmit={mockOnSubmit} />
      </TestProviders>
    );
    
    await user.type(
      screen.getByLabelText(/project name/i),
      'New Video Project'
    );
    
    await user.type(
      screen.getByLabelText(/description/i), 
      'Test project description'
    );
    
    await user.click(screen.getByRole('button', { name: /create project/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Video Project',
        description: 'Test project description',
        status: 'draft'
      });
    });
  });
  
  test('shows loading state during submission', async () => {
    render(
      <TestProviders initialState={{ project: { loading: true } }}>
        <ProjectCreationForm />
      </TestProviders>
    );
    
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### 3.3 Widgets Layer (Complex Components)

#### Test Focus: Composition and Integration
```typescript
// widgets/project-dashboard/ui/ProjectDashboard.test.tsx  
import { render, screen, within } from '@testing-library/react';
import { TestProviders } from 'shared/testing/TestProviders';
import { ProjectDashboard } from './ProjectDashboard';

describe('ProjectDashboard Widget', () => {
  const mockProjects = [
    { id: '1', name: 'Project 1', status: 'active', progress: 75 },
    { id: '2', name: 'Project 2', status: 'completed', progress: 100 }
  ];
  
  test('renders project list with correct data', () => {
    render(
      <TestProviders initialState={{ project: { projects: mockProjects } }}>
        <ProjectDashboard />
      </TestProviders>
    );
    
    const projectCards = screen.getAllByTestId('project-card');
    expect(projectCards).toHaveLength(2);
    
    const firstCard = projectCards[0];
    expect(within(firstCard).getByText('Project 1')).toBeInTheDocument();
    expect(within(firstCard).getByText('75%')).toBeInTheDocument();
  });
  
  test('shows empty state when no projects', () => {
    render(
      <TestProviders initialState={{ project: { projects: [] } }}>
        <ProjectDashboard />
      </TestProviders>
    );
    
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create first project/i })).toBeInTheDocument();
  });
});
```

### 3.4 App Layer (Routing & Layout)

#### Page Component Testing:
```typescript
// app/dashboard/page.test.tsx
import { render, screen } from '@testing-library/react';
import { TestProviders } from 'shared/testing/TestProviders';
import DashboardPage from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/dashboard'
}));

describe('Dashboard Page', () => {
  test('renders dashboard layout with navigation', () => {
    render(
      <TestProviders>
        <DashboardPage />
      </TestProviders>
    );
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
  });
  
  test('redirects to login if not authenticated', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush });
    
    render(
      <TestProviders initialState={{ auth: { user: null } }}>
        <DashboardPage />
      </TestProviders>
    );
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
```

## 4. Mocking Strategy & Test Data Management

### 4.1 API Mocking with MSW (Mock Service Worker)

```typescript
// shared/testing/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.json({
        projects: [
          { id: '1', name: 'Mock Project 1', status: 'active' },
          { id: '2', name: 'Mock Project 2', status: 'completed' }
        ]
      })
    );
  }),
  
  rest.post('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: '3', name: 'Created Project', status: 'draft' })
    );
  }),
  
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-jwt-token'
      })
    );
  })
];
```

### 4.2 WebSocket Mocking

```typescript
// shared/testing/mocks/websocket.ts
export class MockWebSocket {
  private listeners: { [key: string]: Function[] } = {};
  
  constructor(url: string) {
    // Simulate connection
    setTimeout(() => this.trigger('open'), 10);
  }
  
  addEventListener(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }
  
  send(data: string) {
    // Echo back for testing
    setTimeout(() => {
      this.trigger('message', { data: `echo: ${data}` });
    }, 5);
  }
  
  private trigger(event: string, data?: any) {
    this.listeners[event]?.forEach(listener => listener(data));
  }
}

// Usage in tests
beforeEach(() => {
  global.WebSocket = MockWebSocket as any;
});
```

### 4.3 Test Providers Setup

```typescript
// shared/testing/TestProviders.tsx
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from 'shared/ui/theme';

interface TestProvidersProps {
  children: ReactNode;
  initialState?: any;
}

export function TestProviders({ children, initialState = {} }: TestProvidersProps) {
  const store = configureStore({
    reducer: {
      // Add your reducers here
    },
    preloadedState: initialState
  });
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
```

## 5. Quality Gates & CI/CD Integration

### 5.1 Pre-commit Hooks (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test:ci"
    }
  }
}
```

### 5.2 GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      # Type checking
      - run: npm run type-check
      
      # Linting (includes architecture boundary rules)
      - run: npm run lint
      
      # Unit & Integration Tests
      - run: npm run test:coverage
      
      # Upload coverage to Codecov
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      # E2E Tests (only on main branch)
      - name: Playwright E2E
        if: github.ref == 'refs/heads/main'
        run: npm run e2e:ci
```

### 5.3 Coverage Thresholds

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 75,
      "lines": 75,
      "statements": 75
    },
    "./src/entities/**/*.ts": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./src/features/**/*.{ts,tsx}": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## 6. Testing Tools & Configuration

### 6.1 Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './'
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^shared/(.*)$': '<rootDir>/src/shared/$1',
    '^entities/(.*)$': '<rootDir>/src/entities/$1',
    '^features/(.*)$': '<rootDir>/src/features/$1',
    '^widgets/(.*)$': '<rootDir>/src/widgets/$1'
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.stories.(ts|tsx)'
  ]
};

export default createJestConfig(config);
```

### 6.2 Testing Library Setup

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from 'shared/testing/mocks/server';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}));

// Start MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 7. Migration Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
1. **Setup Next.js 14 project structure with App Router**
2. **Configure testing infrastructure** (Jest, RTL, MSW, Playwright)
3. **Implement shared layer** with design tokens and basic utilities
4. **Create test utilities and providers**

### Phase 2: Core Entities (Weeks 3-4)  
1. **Migrate project entity with full TDD**
   - Write failing tests for project store, selectors, transformers
   - Implement minimum viable entity code to pass tests
   - Refactor and optimize

2. **Migrate user/auth entity**
3. **Implement feedback entity**

### Phase 3: Features Layer (Weeks 5-7)
1. **Project management features** (CRUD operations)
2. **Authentication flows** (login, signup, password reset)  
3. **Feedback submission and management**
4. **Video player controls and timeline features**

### Phase 4: Widgets & Pages (Weeks 8-9)
1. **Dashboard widgets** (project overview, recent activity)
2. **Project management interface**
3. **Feedback interface widgets**

### Phase 5: Integration & Polish (Weeks 10-12)
1. **End-to-end testing** with real API integration
2. **Performance optimization** and code splitting
3. **Accessibility testing and improvements**
4. **Production deployment and monitoring setup**

## 8. Success Metrics & KPIs

### Development Velocity
- **Test Coverage**: Maintain >75% overall, >85% entities
- **Build Time**: <2 minutes for full test suite
- **Deployment**: Zero-downtime deployments with rollback capability

### Quality Metrics
- **Flaky Test Rate**: <1% (tests failing intermittently)
- **Escaped Defects**: <3 per release (bugs found in production)
- **Mean Time to Recovery**: <2 hours for critical issues

### Developer Experience
- **Test Execution Speed**: Unit tests <10s, Integration <30s
- **Hot Reload Performance**: <1s for component changes
- **Type Safety**: 100% TypeScript coverage with strict mode

## 9. Risk Mitigation

### Technical Risks
1. **Next.js App Router Learning Curve**
   - Mitigation: Dedicated training sessions and documentation
   - Fallback: Gradual migration starting with static pages

2. **FSD Architecture Complexity**
   - Mitigation: Clear guidelines and automated lint rules
   - Fallback: Incremental adoption with legacy structure support

3. **Test Suite Performance**
   - Mitigation: Parallel test execution and optimized CI pipeline
   - Fallback: Test sharding and selective test runs

### Business Risks
1. **Feature Parity During Migration**
   - Mitigation: Feature flags and gradual rollout
   - Fallback: Blue-green deployment strategy

2. **User Experience Disruption**
   - Mitigation: Comprehensive E2E testing and staging environment
   - Fallback: Immediate rollback procedures

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-21  
**Document Owner**: Grace (QA Lead)