# Next.js Migration Analysis & Plan

## Component Inventory

### 1. Common Components (`/src/components/`)
- **Header.jsx** - Navigation header component
- **PageTemplate.jsx** - Main layout wrapper with authentication logic
- **SideBar.jsx** - Navigation sidebar
- **LoginIntro.jsx** - Authentication intro component

### 2. Page Components (`/src/page/`)
- **Home.jsx** - Landing page (SSG compatible)
- **Privacy.jsx** - Privacy policy (SSG compatible)  
- **Terms.jsx** - Terms of service (SSG compatible)
- **User/Login.jsx** - Login page (Client-side)
- **User/Signup.jsx** - Signup page (Client-side)
- **User/ResetPw.jsx** - Password reset (Client-side)
- **User/EmailCheck.jsx** - Email verification (Client-side)
- **Cms/CmsHome.jsx** - Dashboard (Client-side, requires auth)
- **Cms/Calendar.jsx** - Calendar view (Client-side, requires auth)
- **Cms/ProjectCreate.jsx** - Project creation (Client-side, requires auth)
- **Cms/ProjectEdit.jsx** - Project editing (Client-side, requires auth)
- **Cms/ProjectView.jsx** - Project viewing (SSR compatible with auth)
- **Cms/Feedback.jsx** - Feedback management (Client-side, requires auth)
- **Cms/FeedbackAll.jsx** - All feedback view (Client-side, requires auth)
- **Cms/Elearning.jsx** - E-learning content (SSR compatible with auth)

### 3. Task Components (`/src/tasks/`)
- **AuthEmail.jsx** - Email authentication
- **Calendar/** - Calendar-related components (5 files)
- **Feedback/** - Feedback-related components (4 files)
- **Project/** - Project management components (3 files)

### 4. Custom Hooks (`/src/hooks/`)
- **UseAxios.js** - API request management
- **UseInput.js** - Input state management
- **UseTab.js** - Tab management
- **Usefile.js** - File handling

## Client/Server Component Classification

### Server Components (SSG/SSR Compatible)
- **Home.jsx** - Static landing page content
- **Privacy.jsx** - Static content
- **Terms.jsx** - Static content
- **ProjectView.jsx** (with proper auth handling)
- **Elearning.jsx** (with proper auth handling)

### Client Components (Require 'use client')
- **Header.jsx** - Uses useNavigate, event handlers
- **PageTemplate.jsx** - Uses Redux, useNavigate, localStorage
- **SideBar.jsx** - Interactive navigation
- **LoginIntro.jsx** - Authentication UI
- **All User pages** - Form interactions, authentication
- **All CMS pages** (except ProjectView, Elearning) - Interactive features
- **All task components** - Form interactions, state management
- **All hooks** - Client-side logic

## Dependency Analysis

### React Router Dependencies
Components using `useNavigate`, `Link`, route parameters:
- Header.jsx
- PageTemplate.jsx
- AppRoute.js (needs complete rewrite)
- Most page components

### Redux Dependencies
Components using Redux state:
- PageTemplate.jsx (user/nickname state)
- Redux store configuration
- Project state management

### Browser API Dependencies
Components using browser-specific APIs:
- UseAxios.js (localStorage, window.alert, navigate)
- PageTemplate.jsx (localStorage for session)
- FeedbackInput.jsx (window.alert)
- All authentication-related components

### External API Dependencies
- Axios for backend communication
- Google OAuth integration
- Kakao login integration
- File upload functionality

## Migration Priority Order

### Phase 1: Foundation (Highest Priority)
1. **Setup Next.js project structure**
2. **Migrate utility functions** (util.js)
3. **Migrate custom hooks** with Next.js compatibility
4. **Setup Redux with Next.js** (app router compatible)
5. **Migrate static assets** (images, fonts, styles)

### Phase 2: Static Content (High Priority)
1. **Home.jsx** → `/app/page.tsx`
2. **Privacy.jsx** → `/app/privacy/page.tsx`
3. **Terms.jsx** → `/app/terms/page.tsx`
4. **Create layout.tsx** with Header and common structure

### Phase 3: Core Components (Medium Priority)
1. **Header.jsx** → Client component with Next.js navigation
2. **PageTemplate.jsx** → Layout wrapper with authentication
3. **SideBar.jsx** → Navigation client component
4. **LoginIntro.jsx** → Authentication component

### Phase 4: Authentication Pages (Medium Priority)
1. **Login.jsx** → `/app/login/page.tsx`
2. **Signup.jsx** → `/app/signup/page.tsx`
3. **ResetPw.jsx** → `/app/reset-password/page.tsx`
4. **EmailCheck.jsx** → `/app/email-check/page.tsx`

### Phase 5: CMS Pages (Lower Priority)
1. **CmsHome.jsx** → `/app/cms/page.tsx`
2. **Calendar.jsx** → `/app/cms/calendar/page.tsx`
3. **Project pages** → Dynamic routes with [id]
4. **Feedback pages** → Dynamic routes with [id]
5. **Elearning.jsx** → `/app/cms/elearning/page.tsx`

### Phase 6: Task Components (Lowest Priority)
1. Migrate all task components maintaining functionality
2. Update imports and dependencies
3. Test all interactive features

## Next.js Specific Optimizations

### 1. Image Optimization
- Replace `<img>` tags with Next.js `Image` component
- Optimize image loading and lazy loading

### 2. Font Optimization
- Move fonts to Next.js font optimization system
- Update font loading in layout

### 3. Metadata & SEO
- Add metadata to each page
- Implement proper head management

### 4. API Routes
- Consider moving some client-side API calls to Next.js API routes
- Implement proper error handling

### 5. Authentication Strategy
- Implement Next.js compatible authentication
- Use middleware for route protection
- Update session management

## Testing Strategy

### 1. Visual Regression Testing
- Screenshot comparison before/after migration
- Component-by-component visual verification

### 2. Functionality Testing
- Authentication flow testing
- Form submission testing
- Navigation testing
- State management testing

### 3. Performance Testing
- Page load time comparison
- Bundle size analysis
- Core Web Vitals measurement

## Migration Challenges & Solutions

### 1. React Router → Next.js Router
**Challenge**: Different routing paradigms
**Solution**: 
- Use Next.js App Router
- Replace useNavigate with useRouter
- Update Link components

### 2. Redux with SSR
**Challenge**: Redux hydration with Next.js
**Solution**:
- Implement proper Redux SSR setup
- Use Redux Toolkit with Next.js
- Handle hydration mismatches

### 3. Authentication State
**Challenge**: Server-side authentication state
**Solution**:
- Implement middleware for route protection
- Use server components for initial auth checks
- Client components for interactive auth features

### 4. API Integration
**Challenge**: Axios configuration with SSR
**Solution**:
- Update axios configuration for SSR
- Implement proper error handling
- Use Next.js API routes where beneficial

## Implementation Steps

1. **Create Next.js project alongside existing React app**
2. **Migrate components incrementally**
3. **Test each component in isolation**
4. **Update routing and navigation**
5. **Migrate state management**
6. **Test complete user flows**
7. **Performance optimization**
8. **Final QA and deployment**

This migration plan ensures 100% UI and functionality preservation while optimizing for Next.js performance benefits.