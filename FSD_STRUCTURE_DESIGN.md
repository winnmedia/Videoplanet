# FSD-Compliant Folder Structure for Next.js App Router
## VideoPlanet Project Architecture Design

### Overview
This document defines the Feature-Sliced Design (FSD) architecture for the VideoPlanet Next.js application, ensuring clear separation of concerns, maintainable code structure, and efficient development workflows.

---

## 1. Root Project Structure

```
videoplanet-frontend/
├── .next/                          # Next.js build output
├── .storybook/                     # Storybook configuration
├── app/                            # Next.js App Router (routing only)
├── public/                         # Static assets
├── src/                            # FSD source code
├── tests/                          # Global test configuration
├── docs/                           # Project documentation
├── playwright.config.ts            # E2E testing configuration
├── vitest.config.ts                # Unit testing configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # Project overview
```

---

## 2. Next.js App Router Structure

```
app/                                # Next.js routing (infrastructure layer)
├── layout.tsx                      # Root layout with providers
├── page.tsx                        # Home page wrapper
├── loading.tsx                     # Global loading component
├── error.tsx                       # Global error component
├── not-found.tsx                   # 404 page
├── globals.css                     # Global styles and design tokens
├── favicon.ico                     # Site favicon
│
├── (auth)/                         # Route groups for auth pages
│   ├── login/
│   │   └── page.tsx               # → imports src/pages/auth/login
│   ├── signup/
│   │   └── page.tsx               # → imports src/pages/auth/signup
│   └── reset-password/
│       └── page.tsx               # → imports src/pages/auth/reset
│
├── dashboard/                      # Protected dashboard area
│   ├── page.tsx                   # → imports src/pages/dashboard
│   └── layout.tsx                 # Dashboard layout wrapper
│
├── projects/                       # Project management routes
│   ├── page.tsx                   # → imports src/pages/project/list
│   ├── create/
│   │   └── page.tsx              # → imports src/pages/project/create
│   └── [projectId]/
│       ├── page.tsx              # → imports src/pages/project/detail
│       ├── edit/
│       │   └── page.tsx          # → imports src/pages/project/edit
│       └── feedback/
│           └── page.tsx          # → imports src/pages/feedback/view
│
├── profile/                        # User profile routes
│   ├── page.tsx                   # → imports src/pages/user/profile
│   └── settings/
│       └── page.tsx              # → imports src/pages/user/settings
│
└── api/                           # Next.js API routes (backend proxy)
    ├── auth/
    │   ├── login/
    │   │   └── route.ts          # POST /api/auth/login
    │   ├── signup/
    │   │   └── route.ts          # POST /api/auth/signup
    │   └── logout/
    │       └── route.ts          # POST /api/auth/logout
    ├── projects/
    │   ├── route.ts              # GET/POST /api/projects
    │   └── [id]/
    │       ├── route.ts          # GET/PUT/DELETE /api/projects/[id]
    │       └── feedback/
    │           └── route.ts      # GET/POST /api/projects/[id]/feedback
    └── upload/
        └── route.ts              # POST /api/upload (file uploads)
```

---

## 3. FSD Source Structure

```
src/                                # Feature-Sliced Design layers
├── app/                           # Application initialization layer
├── processes/                     # Complex business processes
├── pages/                         # Page compositions
├── widgets/                       # UI blocks
├── features/                      # User functionality
├── entities/                      # Business entities
└── shared/                        # Reusable resources
```

### 3.1 App Layer (`src/app/`)

Application-level configuration, providers, and global setup.

```
src/app/
├── providers/                     # Application providers
│   ├── index.ts                  # → Public API barrel
│   ├── query-provider.tsx        # React Query provider
│   ├── redux-provider.tsx        # Redux provider
│   ├── theme-provider.tsx        # Ant Design theme provider
│   └── auth-provider.tsx         # Authentication provider
│
├── store/                        # Global state management
│   ├── index.ts                  # → Public API barrel
│   ├── store.ts                  # Redux store configuration
│   ├── middleware.ts             # Redux middleware
│   └── slices/                   # Redux slices
│       ├── auth.slice.ts
│       ├── ui.slice.ts
│       └── index.ts
│
├── styles/                       # Global styles and design tokens
│   ├── index.ts                  # → Public API barrel
│   ├── globals.scss              # Global SCSS styles
│   ├── variables.scss            # SCSS variables
│   ├── design-tokens.ts          # Design system tokens
│   └── themes/                   # Theme configurations
│       ├── light.ts
│       ├── dark.ts
│       └── index.ts
│
└── index.ts                      # → Public API barrel
```

### 3.2 Processes Layer (`src/processes/`)

Complex business workflows spanning multiple features.

```
src/processes/
├── auth-flow/                    # Complete authentication workflow
│   ├── index.ts                  # → Public API barrel
│   ├── ui/                       # Process-specific UI
│   │   ├── auth-layout.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── index.ts
│   ├── model/                    # Process logic
│   │   ├── auth-flow.ts
│   │   ├── oauth.ts
│   │   └── index.ts
│   └── lib/                      # Process utilities
│       ├── validation.ts
│       ├── constants.ts
│       └── index.ts
│
├── project-workflow/             # Project creation to feedback flow
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── project-stepper.tsx
│   │   ├── workflow-nav.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── project-workflow.ts
│   │   ├── steps.ts
│   │   └── index.ts
│   └── lib/
│       ├── validation.ts
│       └── index.ts
│
└── index.ts                      # → Public API barrel
```

### 3.3 Pages Layer (`src/pages/`)

Page-level compositions that combine widgets and features.

```
src/pages/
├── home/                         # Landing page
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── home-page.tsx
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   └── index.ts
│   └── model/
│       ├── home-page.ts
│       └── index.ts
│
├── auth/                         # Authentication pages
│   ├── login/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── login-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── login-page.ts
│   │       └── index.ts
│   ├── signup/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── signup-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── signup-page.ts
│   │       └── index.ts
│   └── reset/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── reset-page.tsx
│       │   └── index.ts
│       └── model/
│           ├── reset-page.ts
│           └── index.ts
│
├── dashboard/                    # Main dashboard
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── dashboard-page.tsx
│   │   ├── stats-overview.tsx
│   │   └── index.ts
│   └── model/
│       ├── dashboard.ts
│       └── index.ts
│
├── project/                      # Project-related pages
│   ├── list/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── projects-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── projects-list.ts
│   │       └── index.ts
│   ├── create/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── create-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── create-project.ts
│   │       └── index.ts
│   ├── detail/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── project-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── project-detail.ts
│   │       └── index.ts
│   └── edit/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── edit-page.tsx
│       │   └── index.ts
│       └── model/
│           ├── edit-project.ts
│           └── index.ts
│
├── feedback/                     # Feedback pages
│   ├── view/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── feedback-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── feedback-view.ts
│   │       └── index.ts
│   └── all/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── all-feedback-page.tsx
│       │   └── index.ts
│       └── model/
│           ├── feedback-list.ts
│           └── index.ts
│
├── user/                         # User profile pages
│   ├── profile/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── profile-page.tsx
│   │   │   └── index.ts
│   │   └── model/
│   │       ├── user-profile.ts
│   │       └── index.ts
│   └── settings/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── settings-page.tsx
│       │   └── index.ts
│       └── model/
│           ├── user-settings.ts
│           └── index.ts
│
└── index.ts                      # → Public API barrel
```

### 3.4 Widgets Layer (`src/widgets/`)

Standalone UI blocks that can be reused across pages.

```
src/widgets/
├── header/                       # Application header
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── header.tsx
│   │   ├── nav-menu.tsx
│   │   ├── user-menu.tsx
│   │   ├── header.module.scss
│   │   └── index.ts
│   ├── model/
│   │   ├── header.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── navigation.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── header.test.tsx
│       └── navigation.test.ts
│
├── sidebar/                      # Navigation sidebar
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── sidebar.tsx
│   │   ├── nav-item.tsx
│   │   ├── sidebar.module.scss
│   │   └── index.ts
│   ├── model/
│   │   ├── sidebar.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── menu-items.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── sidebar.test.tsx
│       └── nav-item.test.tsx
│
├── project-card/                 # Project display card
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── project-card.tsx
│   │   ├── project-actions.tsx
│   │   ├── project-stats.tsx
│   │   ├── project-card.module.scss
│   │   └── index.ts
│   ├── model/
│   │   ├── project-card.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── formatting.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── project-card.test.tsx
│       └── project-actions.test.tsx
│
├── feedback-panel/               # Feedback display widget
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── feedback-panel.tsx
│   │   ├── feedback-item.tsx
│   │   ├── feedback-filters.tsx
│   │   ├── feedback-panel.module.scss
│   │   └── index.ts
│   ├── model/
│   │   ├── feedback-panel.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── filtering.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── feedback-panel.test.tsx
│       └── feedback-filters.test.tsx
│
├── stats-dashboard/              # Statistics widget
│   ├── index.ts                  # → Public API barrel
│   ├── ui/
│   │   ├── stats-dashboard.tsx
│   │   ├── stat-card.tsx
│   │   ├── chart-widget.tsx
│   │   ├── stats.module.scss
│   │   └── index.ts
│   ├── model/
│   │   ├── stats.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── calculations.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── stats-dashboard.test.tsx
│       └── calculations.test.ts
│
└── index.ts                      # → Public API barrel
```

### 3.5 Features Layer (`src/features/`)

User-facing functionality organized by feature domains.

```
src/features/
├── auth/                         # Authentication features
│   ├── login/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── login-form.tsx
│   │   │   ├── oauth-login.tsx
│   │   │   ├── login-form.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── login.ts
│   │   │   ├── login.slice.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── login.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── login-form.test.tsx
│   │       ├── login.api.test.ts
│   │       └── validation.test.ts
│   │
│   ├── signup/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── signup-form.tsx
│   │   │   ├── email-verification.tsx
│   │   │   ├── signup.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── signup.ts
│   │   │   ├── signup.slice.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── signup.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── signup-form.test.tsx
│   │       └── email-verification.test.tsx
│   │
│   └── password-reset/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── reset-form.tsx
│       │   ├── reset-success.tsx
│       │   ├── reset.module.scss
│       │   └── index.ts
│       ├── model/
│       │   ├── password-reset.ts
│       │   └── index.ts
│       ├── api/
│       │   ├── reset.api.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── validation.ts
│       │   └── index.ts
│       └── __tests__/
│           ├── reset-form.test.tsx
│           └── reset.api.test.ts
│
├── project/                      # Project management features
│   ├── create-project/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── project-form.tsx
│   │   │   ├── upload-assets.tsx
│   │   │   ├── project-settings.tsx
│   │   │   ├── create-project.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── create-project.ts
│   │   │   ├── form-state.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── create-project.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   ├── file-upload.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── project-form.test.tsx
│   │       ├── file-upload.test.ts
│   │       └── validation.test.ts
│   │
│   ├── edit-project/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── edit-form.tsx
│   │   │   ├── project-status.tsx
│   │   │   ├── edit-project.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── edit-project.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── edit-project.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── edit-form.test.tsx
│   │       └── edit-project.api.test.ts
│   │
│   └── invite-members/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── invite-form.tsx
│       │   ├── member-list.tsx
│       │   ├── permissions.tsx
│       │   ├── invite.module.scss
│       │   └── index.ts
│       ├── model/
│       │   ├── invite-members.ts
│       │   └── index.ts
│       ├── api/
│       │   ├── invite.api.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── validation.ts
│       │   ├── permissions.ts
│       │   └── index.ts
│       └── __tests__/
│           ├── invite-form.test.tsx
│           └── permissions.test.ts
│
├── feedback/                     # Feedback system features
│   ├── create-feedback/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── feedback-form.tsx
│   │   │   ├── file-attachment.tsx
│   │   │   ├── feedback-preview.tsx
│   │   │   ├── feedback-form.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── create-feedback.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── feedback.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   ├── file-handling.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── feedback-form.test.tsx
│   │       └── file-handling.test.ts
│   │
│   ├── manage-feedback/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── ui/
│   │   │   ├── feedback-table.tsx
│   │   │   ├── feedback-actions.tsx
│   │   │   ├── bulk-actions.tsx
│   │   │   ├── manage.module.scss
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── manage-feedback.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── manage.api.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── filtering.ts
│   │   │   ├── sorting.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       ├── feedback-table.test.tsx
│   │       └── filtering.test.ts
│   │
│   └── feedback-comments/
│       ├── index.ts              # → Public API barrel
│       ├── ui/
│       │   ├── comments-list.tsx
│       │   ├── comment-form.tsx
│       │   ├── comment-item.tsx
│       │   ├── comments.module.scss
│       │   └── index.ts
│       ├── model/
│       │   ├── comments.ts
│       │   └── index.ts
│       ├── api/
│       │   ├── comments.api.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── formatting.ts
│       │   └── index.ts
│       └── __tests__/
│           ├── comments-list.test.tsx
│           └── comment-form.test.tsx
│
└── index.ts                      # → Public API barrel
```

### 3.6 Entities Layer (`src/entities/`)

Business entities with their data models and operations.

```
src/entities/
├── user/                         # User entity
│   ├── index.ts                  # → Public API barrel
│   ├── model/
│   │   ├── user.types.ts
│   │   ├── user.schema.ts        # Zod validation schema
│   │   ├── user.slice.ts         # Redux slice
│   │   └── index.ts
│   ├── api/
│   │   ├── user.api.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── user.utils.ts
│   │   ├── user.constants.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── user.slice.test.ts
│       ├── user.api.test.ts
│       └── user.utils.test.ts
│
├── project/                      # Project entity
│   ├── index.ts                  # → Public API barrel
│   ├── model/
│   │   ├── project.types.ts
│   │   ├── project.schema.ts
│   │   ├── project.slice.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── project.api.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── project.utils.ts
│   │   ├── project.constants.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── project.slice.test.ts
│       ├── project.api.test.ts
│       └── project.utils.test.ts
│
├── feedback/                     # Feedback entity
│   ├── index.ts                  # → Public API barrel
│   ├── model/
│   │   ├── feedback.types.ts
│   │   ├── feedback.schema.ts
│   │   ├── feedback.slice.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── feedback.api.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── feedback.utils.ts
│   │   ├── feedback.constants.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── feedback.slice.test.ts
│       ├── feedback.api.test.ts
│       └── feedback.utils.test.ts
│
├── comment/                      # Comment entity
│   ├── index.ts                  # → Public API barrel
│   ├── model/
│   │   ├── comment.types.ts
│   │   ├── comment.schema.ts
│   │   ├── comment.slice.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── comment.api.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── comment.utils.ts
│   │   └── index.ts
│   └── __tests__/
│       ├── comment.slice.test.ts
│       └── comment.api.test.ts
│
└── index.ts                      # → Public API barrel
```

### 3.7 Shared Layer (`src/shared/`)

Reusable code that doesn't belong to specific business domains.

```
src/shared/
├── ui/                           # UI primitives and components
│   ├── index.ts                  # → Public API barrel
│   │
│   ├── button/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── button.tsx
│   │   ├── button.module.scss
│   │   ├── button.stories.tsx
│   │   └── __tests__/
│   │       └── button.test.tsx
│   │
│   ├── input/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── input.tsx
│   │   ├── text-input.tsx
│   │   ├── password-input.tsx
│   │   ├── input.module.scss
│   │   ├── input.stories.tsx
│   │   └── __tests__/
│   │       ├── input.test.tsx
│   │       └── password-input.test.tsx
│   │
│   ├── modal/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── modal.tsx
│   │   ├── confirm-modal.tsx
│   │   ├── modal.module.scss
│   │   ├── modal.stories.tsx
│   │   └── __tests__/
│   │       ├── modal.test.tsx
│   │       └── confirm-modal.test.tsx
│   │
│   ├── form/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── form.tsx
│   │   ├── form-field.tsx
│   │   ├── form-error.tsx
│   │   ├── form.module.scss
│   │   ├── form.stories.tsx
│   │   └── __tests__/
│   │       ├── form.test.tsx
│   │       └── form-field.test.tsx
│   │
│   ├── loading/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── spinner.tsx
│   │   ├── skeleton.tsx
│   │   ├── loading.module.scss
│   │   ├── loading.stories.tsx
│   │   └── __tests__/
│   │       ├── spinner.test.tsx
│   │       └── skeleton.test.tsx
│   │
│   └── layout/
│       ├── index.ts              # → Public API barrel
│       ├── container.tsx
│       ├── grid.tsx
│       ├── stack.tsx
│       ├── layout.module.scss
│       ├── layout.stories.tsx
│       └── __tests__/
│           ├── container.test.tsx
│           └── grid.test.tsx
│
├── api/                          # API configuration and utilities
│   ├── index.ts                  # → Public API barrel
│   ├── client.ts                 # API client configuration
│   ├── endpoints.ts              # API endpoint constants
│   ├── interceptors.ts           # Request/response interceptors
│   ├── types.ts                  # Common API types
│   └── __tests__/
│       ├── client.test.ts
│       └── interceptors.test.ts
│
├── lib/                          # Utility functions and helpers
│   ├── index.ts                  # → Public API barrel
│   │
│   ├── utils/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── date.utils.ts
│   │   ├── string.utils.ts
│   │   ├── array.utils.ts
│   │   ├── object.utils.ts
│   │   └── __tests__/
│   │       ├── date.utils.test.ts
│   │       ├── string.utils.test.ts
│   │       └── array.utils.test.ts
│   │
│   ├── validation/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── common.schemas.ts
│   │   ├── validation.utils.ts
│   │   └── __tests__/
│   │       ├── common.schemas.test.ts
│   │       └── validation.utils.test.ts
│   │
│   ├── hooks/
│   │   ├── index.ts              # → Public API barrel
│   │   ├── use-local-storage.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-outside-click.ts
│   │   └── __tests__/
│   │       ├── use-local-storage.test.ts
│   │       ├── use-debounce.test.ts
│   │       └── use-media-query.test.ts
│   │
│   └── constants/
│       ├── index.ts              # → Public API barrel
│       ├── app.constants.ts
│       ├── api.constants.ts
│       ├── ui.constants.ts
│       └── routes.constants.ts
│
├── config/                       # Application configuration
│   ├── index.ts                  # → Public API barrel
│   ├── env.ts                    # Environment variables
│   ├── app.config.ts             # Application configuration
│   ├── api.config.ts             # API configuration
│   └── __tests__/
│       ├── env.test.ts
│       └── app.config.test.ts
│
├── types/                        # Global TypeScript types
│   ├── index.ts                  # → Public API barrel
│   ├── common.types.ts
│   ├── api.types.ts
│   ├── ui.types.ts
│   └── auth.types.ts
│
└── index.ts                      # → Public API barrel
```

---

## 4. Public API (Barrel Exports)

### 4.1 Barrel Export Strategy

Each FSD layer and segment uses barrel exports (`index.ts`) to create clean public APIs:

```typescript
// src/features/auth/login/index.ts
export { LoginForm } from './ui';
export { loginModel } from './model';
export { loginApi } from './api';
export type { LoginFormProps, LoginCredentials } from './lib/types';
```

### 4.2 Import Rules

```typescript
// ✅ Correct: Import from public API
import { LoginForm } from '@/features/auth/login';
import { Button } from '@/shared/ui';
import { userModel } from '@/entities/user';

// ❌ Wrong: Import from internal segments
import { LoginForm } from '@/features/auth/login/ui/login-form';
import { userSlice } from '@/entities/user/model/user.slice';
```

### 4.3 TypeScript Path Mapping

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/processes/*": ["./src/processes/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/widgets/*": ["./src/widgets/*"],
      "@/features/*": ["./src/features/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## 5. FSD Boundary Enforcement

### 5.1 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      {
        type: 'app',
        pattern: 'src/app/*',
      },
      {
        type: 'processes',
        pattern: 'src/processes/*',
      },
      {
        type: 'pages',
        pattern: 'src/pages/*',
      },
      {
        type: 'widgets',
        pattern: 'src/widgets/*',
      },
      {
        type: 'features',
        pattern: 'src/features/*',
      },
      {
        type: 'entities',
        pattern: 'src/entities/*',
      },
      {
        type: 'shared',
        pattern: 'src/shared/*',
      },
    ],
  },
  rules: {
    'boundaries/element-types': [
      2,
      {
        default: 'disallow',
        rules: [
          {
            from: 'app',
            allow: ['processes', 'pages', 'widgets', 'features', 'entities', 'shared'],
          },
          {
            from: 'processes',
            allow: ['pages', 'widgets', 'features', 'entities', 'shared'],
          },
          {
            from: 'pages',
            allow: ['widgets', 'features', 'entities', 'shared'],
          },
          {
            from: 'widgets',
            allow: ['features', 'entities', 'shared'],
          },
          {
            from: 'features',
            allow: ['entities', 'shared'],
          },
          {
            from: 'entities',
            allow: ['shared'],
          },
          {
            from: 'shared',
            allow: [],
          },
        ],
      },
    ],
  },
};
```

### 5.2 Dependency Rules

- **app** can import from all layers
- **processes** can import from pages, widgets, features, entities, shared
- **pages** can import from widgets, features, entities, shared
- **widgets** can import from features, entities, shared
- **features** can import from entities, shared
- **entities** can import from shared only
- **shared** cannot import from other layers

---

## 6. Testing Structure

### 6.1 Test Organization

```
src/
├── __tests__/                   # Global test utilities
│   ├── setup.ts                # Test environment setup
│   ├── utils.tsx               # Test utilities
│   ├── mocks/                  # Global mocks
│   │   ├── api.mock.ts
│   │   ├── router.mock.ts
│   │   └── storage.mock.ts
│   └── fixtures/               # Test fixtures
│       ├── user.fixture.ts
│       ├── project.fixture.ts
│       └── feedback.fixture.ts
│
└── [each-layer]/
    └── [each-slice]/
        └── __tests__/          # Component-specific tests
            ├── *.test.tsx      # Unit tests
            ├── *.integration.test.tsx  # Integration tests
            └── *.mock.ts       # Component-specific mocks
```

### 6.2 Test Naming Convention

```
feature-name.test.tsx           # Unit tests
feature-name.integration.test.tsx  # Integration tests
feature-name.e2e.test.ts        # End-to-end tests
```

---

## 7. Storybook Integration

### 7.1 Story Organization

```
src/
└── [layer]/
    └── [slice]/
        ├── ui/
        │   ├── component.tsx
        │   └── component.stories.tsx
        └── __tests__/
            └── component.test.tsx
```

### 7.2 Story Naming Convention

```
Component.stories.tsx           # Component stories
Component.docs.mdx             # Component documentation
```

---

## 8. Performance Considerations

### 8.1 Code Splitting

- Each FSD slice should be lazy-loadable
- Use dynamic imports for route-based code splitting
- Implement component-level code splitting for large widgets

### 8.2 Bundle Optimization

- Tree-shaking friendly barrel exports
- Separate vendor bundles
- Optimize asset loading with Next.js features

---

## 9. Migration Mapping

### 9.1 Current to FSD Mapping

| Current Structure | FSD Structure | Notes |
|------------------|---------------|-------|
| `src/components/Header.jsx` | `src/widgets/header/ui/header.tsx` | Convert to widget |
| `src/components/SideBar.jsx` | `src/widgets/sidebar/ui/sidebar.tsx` | Convert to widget |
| `src/page/User/Login.jsx` | `src/pages/auth/login/ui/login-page.tsx` | Split into page + feature |
| `src/tasks/Feedback/FeedbackInput.jsx` | `src/features/feedback/create-feedback/ui/feedback-form.tsx` | Convert to feature |
| `src/api/auth.js` | `src/entities/user/api/user.api.ts` | Move to entity API |
| `src/redux/store.js` | `src/app/store/store.ts` | Move to app layer |
| `src/util/util.js` | `src/shared/lib/utils/` | Split into specific utilities |

---

## 10. Development Workflow

### 10.1 Feature Development Process

1. **Define Entity Types** (if new entity needed)
2. **Create Feature Structure** with TDD approach
3. **Implement UI Components** with Storybook
4. **Write Integration Tests**
5. **Compose in Widgets** (if needed)
6. **Integrate in Pages**
7. **Add to Routing**

### 10.2 Component Development

1. **Write Failing Test** (TDD approach)
2. **Create Component Structure**
3. **Implement Minimal UI**
4. **Add Storybook Story**
5. **Refine Implementation**
6. **Write Additional Tests**
7. **Document in Story**

---

## 11. Quality Gates

### 11.1 Pre-commit Checks

- TypeScript compilation
- ESLint (including FSD boundary rules)
- Prettier formatting
- Unit tests
- Storybook build

### 11.2 Pre-merge Checks

- All tests pass
- E2E tests pass
- Storybook visual regression tests
- Bundle size analysis
- Performance budgets

---

This FSD structure provides:

1. **Clear Separation of Concerns**: Each layer has a specific responsibility
2. **Scalable Architecture**: Easy to add new features without affecting existing code
3. **Type Safety**: Full TypeScript integration with proper imports
4. **Testability**: Comprehensive testing strategy at all levels
5. **Developer Experience**: Clear development workflow and tooling
6. **Maintainability**: Consistent structure and documentation

The structure scales from small components to complex business workflows while maintaining clean boundaries and predictable import patterns.