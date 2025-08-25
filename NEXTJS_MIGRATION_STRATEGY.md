# Next.js 15 Migration Strategy for VideoPlanet
## Feature-Sliced Design + Test-Driven Development Integration

### Executive Summary
This document outlines a comprehensive strategy to migrate the VideoPlanet frontend from Create React App (CRA) to Next.js 15 with Feature-Sliced Design architecture and Test-Driven Development practices.

---

## 1. Current State Analysis

### Current Technology Stack
- **Framework**: Create React App (CRA) with React Scripts 5.0.1
- **React Version**: 18.2.0
- **UI Library**: Ant Design 5.5.2
- **State Management**: Redux Toolkit 1.9.5 (legacy createStore)
- **Routing**: React Router DOM 6.11.2
- **Styling**: SASS 1.62.1 + Styled Components 6.1.0
- **Build Tool**: Webpack (via CRA)
- **Testing**: React Testing Library 13.4.0, Jest (via CRA)

### Current Architecture Issues
1. **Monolithic Structure**: Components, pages, and business logic are intermixed
2. **Legacy Redux**: Using deprecated `legacy_createStore` instead of RTK's `configureStore`
3. **Inconsistent File Organization**: Mix of `components/`, `page/`, `tasks/`, and `css/` folders
4. **No Test Coverage**: No existing test files found
5. **Performance Bottlenecks**: CRA bundle size and build time limitations
6. **No SSR/SSG**: Client-side rendering only

---

## 2. Target Architecture: Next.js 15 + Feature-Sliced Design

### Technology Choices

#### Core Framework
- **Next.js 15.5** (Latest stable with React 19 support)
- **React 19** (Latest stable with Server Components)
- **TypeScript 5.7** (Latest stable)

#### UI & Styling
- **Ant Design 5.22** (Latest stable, excellent Next.js integration)
- **Tailwind CSS 3.4** (Utility-first CSS, industry standard 2025)
- **CSS Modules** (Component isolation, Next.js native support)
- **Storybook 8.4** (Component documentation and testing)

#### State Management
- **Redux Toolkit 2.3** (Modern Redux with RTK Query)
- **Zustand 5.0** (Lightweight alternative for simple states)
- **React Query/TanStack Query 5.59** (Server state management)

#### Testing Framework
- **Vitest 2.1** (Fast unit testing, Vite-powered)
- **React Testing Library 16.1** (User-centric testing)
- **Playwright 1.49** (E2E testing, faster than Cypress)
- **MSW 2.6** (API mocking for tests)

#### Development Tools
- **ESLint 9.15** (Latest with flat config)
- **Prettier 3.3** (Code formatting)
- **Husky 9.1** (Git hooks)
- **Lint-staged 15.2** (Pre-commit checks)

#### Deployment Platform
- **Vercel** (Primary choice, Next.js optimized)
- **Railway** (Alternative, cost-effective)
- **Cloudflare Pages** (Backup, performance-focused)

---

## 3. Feature-Sliced Design Architecture

### Layer Structure
```
src/
├── app/                    # App initialization, providers, global styles
│   ├── providers/         # Redux, React Query, theme providers
│   ├── styles/           # Global CSS, design tokens
│   └── store/            # Redux store configuration
├── processes/            # Complex user flows spanning multiple pages
│   ├── auth-flow/        # Login, signup, email verification flow
│   └── project-flow/     # Project creation to feedback workflow
├── pages/                # FSD pages (business logic)
│   ├── home/
│   ├── auth/
│   ├── project/
│   └── feedback/
├── widgets/              # Standalone UI blocks
│   ├── header/
│   ├── sidebar/
│   ├── project-card/
│   └── feedback-panel/
├── features/             # User-facing functionality
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── password-reset/
│   ├── project/
│   │   ├── create-project/
│   │   ├── edit-project/
│   │   └── invite-members/
│   └── feedback/
│       ├── create-feedback/
│       ├── manage-feedback/
│       └── feedback-comments/
├── entities/             # Business entities
│   ├── user/
│   ├── project/
│   ├── feedback/
│   └── comment/
├── shared/               # Reusable code
│   ├── ui/               # UI primitives
│   │   ├── button/
│   │   ├── input/
│   │   ├── modal/
│   │   └── form/
│   ├── api/              # API configuration
│   ├── lib/              # Utilities
│   ├── config/           # App configuration
│   └── types/            # TypeScript types
```

### Next.js App Router Integration
```
app/                      # Next.js App Router
├── layout.tsx           # Root layout with providers
├── page.tsx             # Home page (imports src/pages/home)
├── login/
│   └── page.tsx         # Login page (imports src/pages/auth)
├── signup/
│   └── page.tsx         # Signup page (imports src/pages/auth)
├── dashboard/
│   └── page.tsx         # Dashboard (imports src/pages/project)
├── projects/
│   ├── page.tsx         # Projects list
│   ├── create/
│   │   └── page.tsx     # Create project
│   └── [id]/
│       ├── page.tsx     # Project detail
│       ├── edit/
│       │   └── page.tsx # Edit project
│       └── feedback/
│           └── page.tsx # Project feedback
├── api/                 # API routes (proxy to Django backend)
│   ├── auth/
│   ├── projects/
│   └── feedback/
└── globals.css          # Global styles
```

---

## 4. Migration Strategy

### Phase 1: Foundation Setup (Week 1)
**Goal**: Create Next.js project structure with FSD architecture

#### Tasks:
1. **Initialize Next.js 15 Project**
   ```bash
   npx create-next-app@latest videoplanet-next --typescript --tailwind --eslint --app --src-dir
   ```

2. **Setup FSD Directory Structure**
   - Create all FSD layers in `src/` directory
   - Configure TypeScript path mapping for clean imports
   - Setup ESLint rules for FSD boundary enforcement

3. **Configure Development Tools**
   - Setup Prettier, Husky, lint-staged
   - Configure Storybook for component development
   - Setup Vitest and React Testing Library

4. **Design System Foundation**
   - Create design tokens (colors, spacing, typography)
   - Build UI primitives in `shared/ui`
   - Setup CSS modules and Tailwind integration

**Deliverables**:
- Empty Next.js project with FSD structure
- Design system with UI primitives
- Testing environment configured
- Development workflow established

### Phase 2: Core Migration (Week 2-3)
**Goal**: Migrate shared utilities, entities, and API layer

#### Tasks:
1. **API Layer Migration**
   - Convert axios-based API calls to Next.js API routes
   - Implement type-safe API client with OpenAPI/TypeScript
   - Setup MSW for API mocking in tests
   - Migrate authentication logic

2. **Entity Layer**
   - Define TypeScript interfaces for User, Project, Feedback
   - Implement entity-specific utilities
   - Create Zod schemas for runtime validation
   - Write entity unit tests

3. **State Management**
   - Migrate Redux store to RTK's configureStore
   - Convert legacy reducers to RTK slices
   - Implement RTK Query for server state
   - Write state management tests

4. **Shared Utilities**
   - Migrate utility functions from `util/util.js`
   - Convert custom hooks to TypeScript
   - Implement error handling utilities
   - Create date/time formatting helpers

**Deliverables**:
- Type-safe API layer with mocking
- Complete entity definitions
- Modern Redux state management
- Shared utilities with test coverage

### Phase 3: UI Components (Week 4-5)
**Goal**: Migrate and enhance UI components

#### Tasks:
1. **UI Primitives**
   - Create design system components (Button, Input, Modal, etc.)
   - Implement accessibility features (ARIA, keyboard navigation)
   - Setup visual regression testing with Storybook
   - Write comprehensive component tests

2. **Widget Migration**
   - Migrate Header component to `widgets/header`
   - Migrate Sidebar component to `widgets/sidebar`
   - Create reusable card components
   - Build feedback panel widget

3. **Component Testing Strategy**
   - Write failing tests first (TDD approach)
   - Test user interactions, not implementation details
   - Mock external dependencies
   - Ensure accessibility compliance

4. **Storybook Documentation**
   - Create stories for all UI components
   - Document component APIs and variants
   - Setup visual regression testing
   - Create usage guidelines

**Deliverables**:
- Complete design system with Storybook
- Accessible, tested UI components
- Visual regression testing setup
- Component documentation

### Phase 4: Feature Migration (Week 6-7)
**Goal**: Migrate business features with TDD

#### Tasks:
1. **Authentication Features**
   - Migrate login functionality to `features/auth/login`
   - Migrate signup with email verification
   - Implement password reset feature
   - Write integration tests for auth flows

2. **Project Management Features**
   - Migrate project creation feature
   - Implement project editing functionality
   - Build member invitation system
   - Create project listing and search

3. **Feedback System**
   - Migrate feedback creation and management
   - Implement comment system
   - Build feedback filtering and sorting
   - Create feedback analytics

4. **Feature Testing**
   - Write user journey tests
   - Test error scenarios and edge cases
   - Implement API error handling
   - Validate business logic

**Deliverables**:
- Complete feature set with test coverage
- User journey tests
- Error handling and validation
- Performance optimization

### Phase 5: Pages and Routing (Week 8)
**Goal**: Implement Next.js routing and page components

#### Tasks:
1. **Page Components**
   - Create page components in `src/pages/`
   - Implement server-side rendering where beneficial
   - Setup metadata and SEO optimization
   - Handle loading and error states

2. **App Router Setup**
   - Configure route handlers in `app/` directory
   - Implement nested routing for projects
   - Setup dynamic routes with proper TypeScript
   - Configure middleware for authentication

3. **Navigation and UX**
   - Implement programmatic navigation
   - Setup loading states and transitions
   - Handle 404 and error pages
   - Optimize Core Web Vitals

4. **Integration Testing**
   - Write end-to-end tests with Playwright
   - Test complete user workflows
   - Validate SEO and accessibility
   - Performance testing

**Deliverables**:
- Complete Next.js application
- SEO-optimized pages
- E2E test coverage
- Performance validation

### Phase 6: Deployment and Optimization (Week 9)
**Goal**: Deploy and optimize production application

#### Tasks:
1. **Production Setup**
   - Configure production builds
   - Setup environment variables
   - Implement error monitoring (Sentry)
   - Configure analytics and monitoring

2. **Performance Optimization**
   - Image optimization with next/image
   - Bundle analysis and optimization
   - Implement code splitting
   - Setup caching strategies

3. **Deployment Pipeline**
   - Setup CI/CD with GitHub Actions
   - Configure Vercel deployment
   - Setup staging environment
   - Implement blue-green deployment

4. **Quality Assurance**
   - Cross-browser testing
   - Mobile responsiveness validation
   - Accessibility audit
   - Security review

**Deliverables**:
- Production-ready application
- Automated deployment pipeline
- Performance optimizations
- Quality assurance validation

---

## 5. Updated Package.json

```json
{
  "name": "videoplanet-frontend",
  "version": "2.0.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "type-check": "tsc --noEmit",
    "prepare": "husky install",
    "analyze": "ANALYZE=true npm run build"
  },
  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    
    "@reduxjs/toolkit": "^2.3.0",
    "react-redux": "^9.1.2",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.0",
    
    "antd": "^5.22.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    
    "axios": "^1.7.0",
    "ky": "^1.7.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0",
    "immer": "^10.1.0",
    
    "framer-motion": "^12.0.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.10.0",
    "react-query-devtools": "^2.6.3"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    
    "@next/bundle-analyzer": "^15.5.0",
    "eslint": "^9.15.0",
    "eslint-config-next": "^15.5.0",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "eslint-plugin-boundaries": "^4.2.0",
    
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0",
    
    "@playwright/test": "^1.49.0",
    
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "@storybook/addon-essentials": "^8.4.0",
    "@storybook/addon-interactions": "^8.4.0",
    "@storybook/addon-a11y": "^8.4.0",
    
    "msw": "^2.6.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "commitizen": "^4.3.0",
    "cz-conventional-changelog": "^3.3.0"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

---

## 6. Risk Assessment & Mitigation

### High Risk Items

#### 1. Authentication Integration
**Risk**: Complex OAuth integration (Google, Kakao, Naver) may break
**Mitigation**: 
- Maintain separate auth service layer
- Implement comprehensive API mocking for tests
- Create auth integration tests
- Parallel development with backend team

#### 2. File Upload Functionality
**Risk**: File upload for feedback may require significant changes
**Mitigation**:
- Use Next.js API routes for file handling
- Implement proper multipart form support
- Test with actual file uploads early
- Consider S3/cloud storage integration

#### 3. Real-time Features (WebSocket)
**Risk**: Real-time feedback updates may need architectural changes
**Mitigation**:
- Plan WebSocket integration early
- Consider Server-Sent Events as alternative
- Implement progressive enhancement
- Test real-time features thoroughly

#### 4. SEO Requirements
**Risk**: Migration might negatively impact SEO
**Mitigation**:
- Implement proper meta tags and structured data
- Setup 301 redirects for changed URLs
- Use Next.js built-in SEO optimizations
- Test with Google Search Console

### Medium Risk Items

#### 1. Bundle Size
**Risk**: Next.js bundle might be larger than CRA
**Mitigation**:
- Implement proper code splitting
- Use Next.js dynamic imports
- Analyze bundle size regularly
- Optimize third-party libraries

#### 2. Third-party Library Compatibility
**Risk**: Some libraries might not work with Next.js SSR
**Mitigation**:
- Research SSR compatibility early
- Use dynamic imports for client-only libraries
- Consider alternative libraries if needed
- Test SSR/SSG thoroughly

---

## 7. Migration Checklist

### Pre-Migration
- [ ] Backup current application
- [ ] Document current functionality
- [ ] Setup new repository/branch
- [ ] Inform stakeholders of timeline
- [ ] Prepare development environment

### Phase 1: Foundation
- [ ] Initialize Next.js 15 project
- [ ] Setup FSD directory structure
- [ ] Configure TypeScript and path mapping
- [ ] Setup ESLint with FSD boundary rules
- [ ] Configure development tools (Prettier, Husky)
- [ ] Setup Storybook
- [ ] Configure Vitest and React Testing Library
- [ ] Create design tokens
- [ ] Build basic UI primitives

### Phase 2: Core Migration
- [ ] Setup Next.js API routes
- [ ] Implement type-safe API client
- [ ] Setup MSW for API mocking
- [ ] Migrate authentication logic
- [ ] Define TypeScript entity interfaces
- [ ] Create Zod validation schemas
- [ ] Migrate Redux store to RTK
- [ ] Implement RTK Query
- [ ] Migrate utility functions
- [ ] Convert custom hooks to TypeScript

### Phase 3: UI Components
- [ ] Create design system components
- [ ] Implement accessibility features
- [ ] Setup visual regression testing
- [ ] Migrate Header component
- [ ] Migrate Sidebar component
- [ ] Create card components
- [ ] Build feedback panel widget
- [ ] Write component tests (TDD)
- [ ] Create Storybook documentation

### Phase 4: Feature Migration
- [ ] Migrate login functionality
- [ ] Migrate signup and email verification
- [ ] Implement password reset
- [ ] Migrate project creation
- [ ] Implement project editing
- [ ] Build member invitation system
- [ ] Migrate feedback system
- [ ] Implement comment functionality
- [ ] Write integration tests
- [ ] Test error scenarios

### Phase 5: Pages and Routing
- [ ] Create page components
- [ ] Setup App Router structure
- [ ] Implement dynamic routing
- [ ] Configure middleware for auth
- [ ] Setup SEO and metadata
- [ ] Handle loading states
- [ ] Create 404 and error pages
- [ ] Write E2E tests
- [ ] Optimize Core Web Vitals

### Phase 6: Deployment
- [ ] Configure production build
- [ ] Setup environment variables
- [ ] Implement error monitoring
- [ ] Setup analytics
- [ ] Optimize images and assets
- [ ] Analyze and optimize bundles
- [ ] Setup CI/CD pipeline
- [ ] Configure Vercel deployment
- [ ] Setup staging environment
- [ ] Conduct cross-browser testing
- [ ] Validate mobile responsiveness
- [ ] Perform accessibility audit
- [ ] Security review

### Post-Migration
- [ ] Monitor application performance
- [ ] Track error rates
- [ ] Gather user feedback
- [ ] Update documentation
- [ ] Plan future optimizations

---

## 8. Timeline and Resource Allocation

### Timeline: 9 Weeks Total
- **Week 1**: Foundation Setup (40 hours)
- **Week 2-3**: Core Migration (80 hours)
- **Week 4-5**: UI Components (80 hours)
- **Week 6-7**: Feature Migration (80 hours)
- **Week 8**: Pages and Routing (40 hours)
- **Week 9**: Deployment and Optimization (40 hours)

### Resource Requirements
- **1 Lead Frontend Developer** (Sophia - FSD/TDD expertise)
- **1 Frontend Developer** (Component migration)
- **0.5 Backend Developer** (API integration support)
- **0.25 DevOps Engineer** (Deployment setup)

### Success Metrics
1. **Performance**: 
   - Lighthouse score > 90
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s

2. **Quality**:
   - Test coverage > 80%
   - Zero TypeScript errors
   - Zero accessibility violations

3. **Developer Experience**:
   - Build time < 30s
   - Hot reload < 500ms
   - Zero lint warnings

---

## 9. Conclusion

This migration strategy provides a comprehensive roadmap to modernize the VideoPlanet frontend with industry-leading technologies and architectural patterns. The Feature-Sliced Design approach ensures long-term maintainability, while Test-Driven Development practices guarantee code quality and reliability.

The phased approach minimizes risk while delivering incremental value. Each phase has clear deliverables and success criteria, enabling continuous progress validation and stakeholder communication.

**Key Benefits**:
- **Performance**: Next.js 15 with SSR/SSG capabilities
- **Maintainability**: FSD architecture with clear boundaries
- **Quality**: Comprehensive testing strategy with TDD
- **Developer Experience**: Modern tooling and development workflow
- **Future-Proof**: Latest stable technologies with upgrade paths

**Estimated Timeline**: 9 weeks with dedicated team
**Risk Level**: Medium (well-mitigated with parallel development and testing)
**ROI**: High (performance, maintainability, and developer productivity gains)