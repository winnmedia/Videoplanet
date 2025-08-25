# FSD Testing Architecture for VideoPlanet Next.js Migration

## Overview
This document defines the testing architecture aligned with Feature-Sliced Design (FSD) methodology, ensuring each layer has appropriate test coverage with clear boundaries and responsibilities.

## 1. FSD Layer Testing Responsibilities

### Layer Testing Matrix

| Layer | Test Focus | Coverage Target | Key Test Types |
|-------|------------|-----------------|----------------|
| **app** | Routing, Layout, Pages | 60%+ | Integration, Route |
| **processes** | Multi-step User Flows | 70%+ | Integration, E2E |
| **widgets** | Complex UI Composition | 70%+ | Component, Integration |
| **features** | User Interactions | 80%+ | Component, Unit |
| **entities** | Business Logic | 85%+ | Unit, Store |
| **shared** | Utilities, UI Primitives | 90%+ | Unit |

## 2. Directory Structure & Test Organization

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.test.tsx        # Page component tests
│   │   │   └── page.tsx
│   │   └── signup/
│   │       ├── page.test.tsx
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── page.test.tsx
│   │   └── page.tsx
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── page.test.tsx
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   ├── page.test.tsx
│   │   │   └── page.tsx
│   │   ├── page.test.tsx
│   │   └── page.tsx
│   ├── feedback/
│   │   ├── [projectId]/
│   │   │   ├── page.test.tsx
│   │   │   └── page.tsx
│   │   └── public/
│   │       └── [shareId]/
│   │           ├── page.test.tsx
│   │           └── page.tsx
│   ├── layout.test.tsx              # Root layout tests
│   ├── layout.tsx
│   └── api/                         # API Route handlers
│       ├── auth/
│       │   ├── login/
│       │   │   ├── route.test.ts
│       │   │   └── route.ts
│       │   └── signup/
│       │       ├── route.test.ts
│       │       └── route.ts
│       ├── projects/
│       │   ├── route.test.ts
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.test.ts
│       │       └── route.ts
│       └── feedback/
│           ├── route.test.ts
│           └── route.ts
│
├── processes/                       # Complex user journeys
│   ├── project-onboarding/
│   │   ├── __tests__/
│   │   │   ├── integration/
│   │   │   │   └── onboarding-flow.test.tsx
│   │   │   └── unit/
│   │   │       └── onboarding-steps.test.ts
│   │   ├── model/
│   │   │   ├── onboarding-store.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── OnboardingWizard.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── feedback-review/
│       ├── __tests__/
│       │   ├── integration/
│       │   │   └── feedback-review-flow.test.tsx
│       │   └── unit/
│       │       └── review-logic.test.ts
│       ├── model/
│       ├── ui/
│       └── index.ts
│
├── widgets/                         # Composite UI blocks
│   ├── project-dashboard/
│   │   ├── __tests__/
│   │   │   ├── ui/
│   │   │   │   ├── ProjectDashboard.test.tsx
│   │   │   │   ├── ProjectCard.test.tsx
│   │   │   │   └── ProjectStats.test.tsx
│   │   │   └── model/
│   │   │       └── dashboard-selectors.test.ts
│   │   ├── ui/
│   │   │   ├── ProjectDashboard.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectStats.tsx
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── dashboard-selectors.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── feedback-player/
│   │   ├── __tests__/
│   │   │   ├── ui/
│   │   │   │   ├── VideoPlayer.test.tsx
│   │   │   │   ├── FeedbackTimeline.test.tsx
│   │   │   │   └── FeedbackControls.test.tsx
│   │   │   └── lib/
│   │   │       └── player-utils.test.ts
│   │   ├── ui/
│   │   ├── lib/
│   │   └── index.ts
│   └── navigation-sidebar/
│       ├── __tests__/
│       │   └── ui/
│       │       ├── NavigationSidebar.test.tsx
│       │       └── NavItem.test.tsx
│       ├── ui/
│       └── index.ts
│
├── features/                        # User interactions & business features
│   ├── auth/
│   │   ├── login/
│   │   │   ├── __tests__/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   │   └── SocialLoginButtons.test.tsx
│   │   │   │   ├── model/
│   │   │   │   │   ├── login-store.test.ts
│   │   │   │   │   └── login-validation.test.ts
│   │   │   │   └── lib/
│   │   │   │       └── auth-helpers.test.ts
│   │   │   ├── ui/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SocialLoginButtons.tsx
│   │   │   │   └── index.ts
│   │   │   ├── model/
│   │   │   │   ├── login-store.ts
│   │   │   │   ├── login-validation.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── auth-helpers.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── signup/
│   │   └── password-reset/
│   ├── project-management/
│   │   ├── create-project/
│   │   │   ├── __tests__/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── CreateProjectForm.test.tsx
│   │   │   │   │   ├── ProjectNameInput.test.tsx
│   │   │   │   │   └── ProjectTypeSelector.test.tsx
│   │   │   │   ├── model/
│   │   │   │   │   ├── create-project-store.test.ts
│   │   │   │   │   └── project-validation.test.ts
│   │   │   │   └── lib/
│   │   │   │       └── project-utils.test.ts
│   │   │   ├── ui/
│   │   │   ├── model/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   ├── edit-project/
│   │   ├── delete-project/
│   │   └── project-list/
│   ├── feedback-management/
│   │   ├── submit-feedback/
│   │   │   ├── __tests__/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── FeedbackForm.test.tsx
│   │   │   │   │   ├── EmotionSelector.test.tsx
│   │   │   │   │   ├── TimestampInput.test.tsx
│   │   │   │   │   └── FileUpload.test.tsx
│   │   │   │   ├── model/
│   │   │   │   │   ├── feedback-store.test.ts
│   │   │   │   │   └── feedback-validation.test.ts
│   │   │   │   └── lib/
│   │   │   │       └── feedback-helpers.test.ts
│   │   │   ├── ui/
│   │   │   ├── model/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   ├── feedback-list/
│   │   ├── feedback-reply/
│   │   └── feedback-moderation/
│   └── video-player/
│       ├── video-controls/
│       ├── screenshot-capture/
│       └── timeline-navigation/
│
├── entities/                        # Business domains
│   ├── user/
│   │   ├── __tests__/
│   │   │   ├── model/
│   │   │   │   ├── user-store.test.ts
│   │   │   │   ├── user-selectors.test.ts
│   │   │   │   └── user-actions.test.ts
│   │   │   └── lib/
│   │   │       ├── user-transformers.test.ts
│   │   │       └── user-validators.test.ts
│   │   ├── model/
│   │   │   ├── user-store.ts
│   │   │   ├── user-selectors.ts
│   │   │   ├── user-actions.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── user-transformers.ts
│   │   │   ├── user-validators.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── user-api.test.ts
│   │   │   ├── user-api.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── project/
│   │   ├── __tests__/
│   │   │   ├── model/
│   │   │   │   ├── project-store.test.ts
│   │   │   │   ├── project-selectors.test.ts
│   │   │   │   └── project-normalizers.test.ts
│   │   │   ├── lib/
│   │   │   │   ├── project-transformers.test.ts
│   │   │   │   ├── project-validators.test.ts
│   │   │   │   └── project-utils.test.ts
│   │   │   └── api/
│   │   │       └── project-api.test.ts
│   │   ├── model/
│   │   ├── lib/
│   │   ├── api/
│   │   └── index.ts
│   ├── feedback/
│   │   ├── __tests__/
│   │   ├── model/
│   │   ├── lib/
│   │   ├── api/
│   │   └── index.ts
│   └── notification/
│       ├── __tests__/
│       ├── model/
│       ├── lib/
│       ├── api/
│       └── index.ts
│
└── shared/                          # Common utilities
    ├── ui/                          # UI primitives
    │   ├── __tests__/
    │   │   ├── Button.test.tsx
    │   │   ├── Input.test.tsx
    │   │   ├── Modal.test.tsx
    │   │   ├── Form.test.tsx
    │   │   └── LoadingSpinner.test.tsx
    │   ├── Button/
    │   │   ├── Button.test.tsx
    │   │   ├── Button.tsx
    │   │   ├── Button.stories.tsx
    │   │   └── index.ts
    │   ├── Input/
    │   ├── Modal/
    │   ├── Form/
    │   └── index.ts
    ├── lib/                         # Utilities
    │   ├── __tests__/
    │   │   ├── formatters.test.ts
    │   │   ├── validators.test.ts
    │   │   ├── date-utils.test.ts
    │   │   ├── storage.test.ts
    │   │   └── constants.test.ts
    │   ├── formatters.ts
    │   ├── validators.ts
    │   ├── date-utils.ts
    │   ├── storage.ts
    │   ├── constants.ts
    │   └── index.ts
    ├── api/                         # API utilities
    │   ├── __tests__/
    │   │   ├── api-client.test.ts
    │   │   ├── interceptors.test.ts
    │   │   └── error-handling.test.ts
    │   ├── api-client.ts
    │   ├── interceptors.ts
    │   ├── error-handling.ts
    │   └── index.ts
    ├── config/
    │   ├── __tests__/
    │   │   └── app-config.test.ts
    │   ├── app-config.ts
    │   └── index.ts
    └── testing/                     # Test utilities
        ├── providers/
        │   ├── TestProviders.tsx
        │   └── index.ts
        ├── mocks/
        │   ├── handlers.ts
        │   ├── server.ts
        │   ├── websocket.ts
        │   └── index.ts
        ├── factories/
        │   ├── user.factory.ts
        │   ├── project.factory.ts
        │   ├── feedback.factory.ts
        │   └── index.ts
        └── utils/
            ├── test-utils.tsx
            ├── custom-matchers.ts
            └── index.ts
```

## 3. Detailed Testing Patterns by Layer

### 3.1 Entities Layer - Business Logic Testing

#### Domain Store Testing Pattern
```typescript
// entities/project/model/project-store.test.ts
import { configureStore } from '@reduxjs/toolkit';
import { projectSlice, ProjectState, selectProjectById, selectActiveProjects } from './project-store';

describe('Project Entity Store', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    store = configureStore({
      reducer: { project: projectSlice.reducer }
    });
  });
  
  describe('actions', () => {
    test('addProject normalizes and stores project data', () => {
      const project = {
        id: '1',
        name: 'Test Project',
        status: 'active' as const,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };
      
      store.dispatch(projectSlice.actions.addProject(project));
      
      const state = store.getState().project;
      expect(state.byId['1']).toEqual(project);
      expect(state.allIds).toContain('1');
    });
    
    test('updateProject updates existing project', () => {
      // Setup initial state
      store.dispatch(projectSlice.actions.addProject({
        id: '1',
        name: 'Original Name',
        status: 'draft' as const
      }));
      
      // Update project
      store.dispatch(projectSlice.actions.updateProject({
        id: '1',
        changes: { name: 'Updated Name', status: 'active' as const }
      }));
      
      const updatedProject = selectProjectById(store.getState(), '1');
      expect(updatedProject).toMatchObject({
        id: '1',
        name: 'Updated Name',
        status: 'active'
      });
    });
    
    test('removeProject removes project and updates indices', () => {
      // Setup
      store.dispatch(projectSlice.actions.addProject({ id: '1', name: 'Test' }));
      store.dispatch(projectSlice.actions.addProject({ id: '2', name: 'Test2' }));
      
      // Remove
      store.dispatch(projectSlice.actions.removeProject('1'));
      
      const state = store.getState().project;
      expect(state.byId['1']).toBeUndefined();
      expect(state.allIds).not.toContain('1');
      expect(state.allIds).toContain('2');
    });
  });
  
  describe('selectors', () => {
    beforeEach(() => {
      const projects = [
        { id: '1', name: 'Active Project', status: 'active' as const },
        { id: '2', name: 'Draft Project', status: 'draft' as const },
        { id: '3', name: 'Completed Project', status: 'completed' as const }
      ];
      
      projects.forEach(project => {
        store.dispatch(projectSlice.actions.addProject(project));
      });
    });
    
    test('selectProjectById returns correct project', () => {
      const project = selectProjectById(store.getState(), '2');
      expect(project).toMatchObject({
        id: '2',
        name: 'Draft Project',
        status: 'draft'
      });
    });
    
    test('selectActiveProjects filters by active status', () => {
      const activeProjects = selectActiveProjects(store.getState());
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0]).toMatchObject({
        id: '1',
        status: 'active'
      });
    });
    
    test('selector returns undefined for non-existent project', () => {
      const project = selectProjectById(store.getState(), 'nonexistent');
      expect(project).toBeUndefined();
    });
  });
});
```

#### Data Transformation Testing
```typescript
// entities/project/lib/project-transformers.test.ts
import { transformProjectFromDTO, transformProjectToDTO } from './project-transformers';
import type { ProjectDTO } from '../api/types';
import type { Project } from '../model/types';

describe('Project Transformers', () => {
  describe('transformProjectFromDTO', () => {
    test('transforms server DTO to domain model correctly', () => {
      const dto: ProjectDTO = {
        project_id: 123,
        project_name: 'Server Project',
        project_description: 'Description from server',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-02T15:30:00Z',
        is_active: true,
        project_status: 'IN_PROGRESS',
        owner_id: 456,
        team_members: [789, 101112]
      };
      
      const domain = transformProjectFromDTO(dto);
      
      expect(domain).toEqual<Project>({
        id: '123',
        name: 'Server Project',
        description: 'Description from server',
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-02T15:30:00Z'),
        status: 'active',
        ownerId: '456',
        memberIds: ['789', '101112']
      });
    });
    
    test('handles optional fields correctly', () => {
      const minimalDTO: ProjectDTO = {
        project_id: 123,
        project_name: 'Minimal Project',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        is_active: false,
        project_status: 'DRAFT'
      };
      
      const domain = transformProjectFromDTO(minimalDTO);
      
      expect(domain).toEqual<Project>({
        id: '123',
        name: 'Minimal Project',
        description: null,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z'),
        status: 'draft',
        ownerId: null,
        memberIds: []
      });
    });
    
    test('throws error for invalid date format', () => {
      const invalidDTO: ProjectDTO = {
        project_id: 123,
        project_name: 'Invalid Date Project',
        created_at: 'invalid-date',
        updated_at: '2025-01-01T10:00:00Z',
        is_active: true,
        project_status: 'ACTIVE'
      };
      
      expect(() => transformProjectFromDTO(invalidDTO)).toThrow('Invalid date format');
    });
  });
  
  describe('transformProjectToDTO', () => {
    test('transforms domain model to server DTO format', () => {
      const domain: Project = {
        id: '123',
        name: 'Domain Project',
        description: 'Domain description',
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-02T15:30:00Z'),
        status: 'active',
        ownerId: '456',
        memberIds: ['789', '101112']
      };
      
      const dto = transformProjectToDTO(domain);
      
      expect(dto).toEqual<ProjectDTO>({
        project_id: 123,
        project_name: 'Domain Project',
        project_description: 'Domain description',
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-02T15:30:00.000Z',
        is_active: true,
        project_status: 'IN_PROGRESS',
        owner_id: 456,
        team_members: [789, 101112]
      });
    });
  });
});
```

### 3.2 Features Layer - User Interaction Testing

#### Feature Component Testing
```typescript
// features/project-management/create-project/ui/CreateProjectForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from 'shared/testing/TestProviders';
import { CreateProjectForm } from './CreateProjectForm';
import { server } from 'shared/testing/mocks/server';
import { rest } from 'msw';

describe('CreateProjectForm', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const renderForm = (props = {}) => {
    return render(
      <TestProviders>
        <CreateProjectForm 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          {...props}
        />
      </TestProviders>
    );
  };
  
  describe('Form Validation', () => {
    test('shows validation error for empty project name', async () => {
      renderForm();
      
      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Project name is required');
      expect(submitButton).toBeDisabled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
    
    test('shows validation error for project name too short', async () => {
      renderForm();
      
      await user.type(screen.getByLabelText(/project name/i), 'AB');
      await user.click(screen.getByRole('button', { name: /create project/i }));
      
      expect(screen.getByRole('alert')).toHaveTextContent('Project name must be at least 3 characters');
    });
    
    test('shows validation error for project name too long', async () => {
      renderForm();
      
      const longName = 'A'.repeat(101); // Assuming 100 char limit
      await user.type(screen.getByLabelText(/project name/i), longName);
      await user.click(screen.getByRole('button', { name: /create project/i }));
      
      expect(screen.getByRole('alert')).toHaveTextContent('Project name must be 100 characters or less');
    });
    
    test('validates end date is after start date', async () => {
      renderForm();
      
      await user.type(screen.getByLabelText(/project name/i), 'Valid Project');
      await user.type(screen.getByLabelText(/start date/i), '2025-02-01');
      await user.type(screen.getByLabelText(/end date/i), '2025-01-01');
      await user.click(screen.getByRole('button', { name: /create project/i }));
      
      expect(screen.getByRole('alert')).toHaveTextContent('End date must be after start date');
    });
  });
  
  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      server.use(
        rest.post('/api/projects', (req, res, ctx) => {
          return res(
            ctx.json({
              id: '1',
              name: 'New Video Project',
              description: 'Test description',
              status: 'draft'
            })
          );
        })
      );
      
      renderForm();
      
      await user.type(screen.getByLabelText(/project name/i), 'New Video Project');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.selectOptions(screen.getByLabelText(/project type/i), 'video-production');
      await user.click(screen.getByRole('button', { name: /create project/i }));
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          id: '1',
          name: 'New Video Project',
          description: 'Test description',
          status: 'draft'
        });
      });
    });
    
    test('shows loading state during submission', async () => {
      server.use(
        rest.post('/api/projects', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ id: '1' }));
        })
      );
      
      renderForm();
      
      await user.type(screen.getByLabelText(/project name/i), 'Loading Test');
      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);
      
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    test('handles server error gracefully', async () => {
      server.use(
        rest.post('/api/projects', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Project name already exists' })
          );
        })
      );
      
      renderForm();
      
      await user.type(screen.getByLabelText(/project name/i), 'Existing Project');
      await user.click(screen.getByRole('button', { name: /create project/i }));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Project name already exists');
      });
      
      expect(screen.getByRole('alert')).toHaveTextContent('Project name already exists');
      expect(screen.getByRole('button', { name: /create project/i })).toBeEnabled();
    });
  });
  
  describe('Accessibility', () => {
    test('form is keyboard navigable', async () => {
      renderForm();
      
      const nameInput = screen.getByLabelText(/project name/i);
      const descInput = screen.getByLabelText(/description/i);
      const typeSelect = screen.getByLabelText(/project type/i);
      const submitButton = screen.getByRole('button', { name: /create project/i });
      
      nameInput.focus();
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(descInput).toHaveFocus();
      
      await user.tab();
      expect(typeSelect).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
    
    test('has proper ARIA labels and descriptions', () => {
      renderForm();
      
      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
      
      const helpText = screen.getByText(/choose a descriptive name/i);
      expect(helpText).toHaveAttribute('id', nameInput.getAttribute('aria-describedby'));
    });
  });
  
  describe('Form State Persistence', () => {
    test('preserves form data on unmount and remount', async () => {
      const { unmount } = renderForm({ persistFormData: true });
      
      await user.type(screen.getByLabelText(/project name/i), 'Persistent Project');
      await user.type(screen.getByLabelText(/description/i), 'This should persist');
      
      unmount();
      
      renderForm({ persistFormData: true });
      
      expect(screen.getByLabelText(/project name/i)).toHaveValue('Persistent Project');
      expect(screen.getByLabelText(/description/i)).toHaveValue('This should persist');
    });
  });
});
```

### 3.3 Widgets Layer - Composition Testing

#### Widget Integration Testing
```typescript
// widgets/project-dashboard/ui/ProjectDashboard.test.tsx
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from 'shared/testing/TestProviders';
import { ProjectDashboard } from './ProjectDashboard';
import { server } from 'shared/testing/mocks/server';
import { rest } from 'msw';
import { createMockProjects } from 'shared/testing/factories';

describe('ProjectDashboard Widget', () => {
  const user = userEvent.setup();
  
  const mockProjects = createMockProjects([
    { id: '1', name: 'Active Project', status: 'active', progress: 75 },
    { id: '2', name: 'Draft Project', status: 'draft', progress: 0 },
    { id: '3', name: 'Completed Project', status: 'completed', progress: 100 }
  ]);
  
  beforeEach(() => {
    server.use(
      rest.get('/api/projects', (req, res, ctx) => {
        return res(ctx.json({ projects: mockProjects }));
      })
    );
  });
  
  describe('Data Loading and Display', () => {
    test('loads and displays project data correctly', async () => {
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      // Loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Verify all projects are displayed
      const projectCards = screen.getAllByTestId('project-card');
      expect(projectCards).toHaveLength(3);
      
      // Check individual project data
      const activeProject = projectCards.find(card => 
        within(card).queryByText('Active Project')
      );
      expect(activeProject).toBeInTheDocument();
      expect(within(activeProject!).getByText('75%')).toBeInTheDocument();
      expect(within(activeProject!).getByText(/active/i)).toBeInTheDocument();
    });
    
    test('displays empty state when no projects', async () => {
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res(ctx.json({ projects: [] }));
        })
      );
      
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create first project/i })).toBeInTheDocument();
    });
    
    test('handles loading error gracefully', async () => {
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );
      
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load projects/i);
      });
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
  
  describe('Filtering and Sorting', () => {
    test('filters projects by status', async () => {
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(3);
      });
      
      // Filter by active projects only
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusFilter, 'active');
      
      await waitFor(() => {
        const visibleCards = screen.getAllByTestId('project-card');
        expect(visibleCards).toHaveLength(1);
        expect(within(visibleCards[0]).getByText('Active Project')).toBeInTheDocument();
      });
    });
    
    test('sorts projects by different criteria', async () => {
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(3);
      });
      
      // Sort by progress (descending)
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.selectOptions(sortSelect, 'progress-desc');
      
      await waitFor(() => {
        const cards = screen.getAllByTestId('project-card');
        const progressTexts = cards.map(card => within(card).getByTestId('progress-percentage').textContent);
        expect(progressTexts).toEqual(['100%', '75%', '0%']);
      });
    });
  });
  
  describe('User Interactions', () => {
    test('navigates to project detail on card click', async () => {
      const mockPush = jest.fn();
      
      render(
        <TestProviders routerMock={{ push: mockPush }}>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(3);
      });
      
      const firstCard = screen.getAllByTestId('project-card')[0];
      await user.click(firstCard);
      
      expect(mockPush).toHaveBeenCalledWith('/projects/1');
    });
    
    test('opens context menu on right click', async () => {
      render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(3);
      });
      
      const firstCard = screen.getAllByTestId('project-card')[0];
      await user.pointer({ keys: '[MouseRight]', target: firstCard });
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /edit project/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /delete project/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /share project/i })).toBeInTheDocument();
    });
  });
  
  describe('Real-time Updates', () => {
    test('updates project list when WebSocket event received', async () => {
      const { mockWebSocket } = render(
        <TestProviders>
          <ProjectDashboard />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(3);
      });
      
      // Simulate WebSocket update
      const newProject = { id: '4', name: 'New Project', status: 'draft', progress: 10 };
      mockWebSocket.simulateMessage({
        type: 'PROJECT_CREATED',
        data: newProject
      });
      
      await waitFor(() => {
        expect(screen.getAllByTestId('project-card')).toHaveLength(4);
        expect(screen.getByText('New Project')).toBeInTheDocument();
      });
    });
  });
});
```

### 3.4 App Layer - Route and Layout Testing

#### Page Component Testing
```typescript
// app/projects/page.test.tsx
import { render, screen } from '@testing-library/react';
import { TestProviders } from 'shared/testing/TestProviders';
import ProjectsPage from './page';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams()
}));

describe('Projects Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders projects page with correct layout', async () => {
    render(
      <TestProviders>
        <ProjectsPage />
      </TestProviders>
    );
    
    // Check page structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /projects/i })).toBeInTheDocument();
    
    // Check key components are rendered
    expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });
  
  test('requires authentication', async () => {
    render(
      <TestProviders initialState={{ auth: { user: null } }}>
        <ProjectsPage />
      </TestProviders>
    );
    
    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/projects');
  });
  
  test('shows correct page title and metadata', async () => {
    render(
      <TestProviders>
        <ProjectsPage />
      </TestProviders>
    );
    
    // These would be tested with next/head or metadata API
    expect(document.title).toContain('Projects');
  });
});
```

## 4. Cross-Layer Integration Testing

### 4.1 Feature Flow Testing
```typescript
// __tests__/integration/project-creation-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from 'shared/testing/TestProviders';
import { App } from 'app/layout';
import { server } from 'shared/testing/mocks/server';
import { rest } from 'msw';

describe('Project Creation Flow Integration', () => {
  const user = userEvent.setup();
  
  test('complete project creation journey', async () => {
    // Mock successful API responses
    server.use(
      rest.post('/api/projects', (req, res, ctx) => {
        return res(
          ctx.json({
            id: '1',
            name: 'Integration Test Project',
            status: 'draft'
          })
        );
      }),
      rest.get('/api/projects', (req, res, ctx) => {
        return res(
          ctx.json({
            projects: [{
              id: '1',
              name: 'Integration Test Project',
              status: 'draft'
            }]
          })
        );
      })
    );
    
    render(
      <TestProviders initialRoute="/projects">
        <App />
      </TestProviders>
    );
    
    // Step 1: Navigate to create project
    await user.click(screen.getByRole('button', { name: /new project/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create project/i })).toBeInTheDocument();
    });
    
    // Step 2: Fill out project form
    await user.type(screen.getByLabelText(/project name/i), 'Integration Test Project');
    await user.type(screen.getByLabelText(/description/i), 'This is a test project');
    await user.selectOptions(screen.getByLabelText(/project type/i), 'video-production');
    
    // Step 3: Submit form
    await user.click(screen.getByRole('button', { name: /create project/i }));
    
    // Step 4: Verify success and redirect
    await waitFor(() => {
      expect(screen.getByText(/project created successfully/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Integration Test Project')).toBeInTheDocument();
    });
    
    // Verify project appears in dashboard
    expect(screen.getByTestId('project-card')).toBeInTheDocument();
  });
});
```

## 5. Test Utilities and Factories

### 5.1 Data Factories
```typescript
// shared/testing/factories/project.factory.ts
import { faker } from '@faker-js/faker';
import type { Project } from 'entities/project';

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['draft', 'active', 'completed']),
    progress: faker.number.int({ min: 0, max: 100 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ownerId: faker.string.uuid(),
    memberIds: faker.helpers.multiple(() => faker.string.uuid(), { count: { min: 1, max: 5 } }),
    ...overrides
  };
}

export function createMockProjects(
  overrides: Partial<Project>[] = [],
  count = 3
): Project[] {
  return Array.from({ length: count }, (_, index) =>
    createMockProject(overrides[index] || {})
  );
}
```

### 5.2 Custom Test Matchers
```typescript
// shared/testing/utils/custom-matchers.ts
import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidProject(): R;
      toHaveCorrectFSDStructure(): R;
    }
  }
}

expect.extend({
  toBeValidProject(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      ['draft', 'active', 'completed'].includes(received.status);
    
    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid project`
          : `Expected ${received} to be a valid project`,
      pass
    };
  },
  
  toHaveCorrectFSDStructure(received) {
    const requiredFiles = ['index.ts'];
    const hasRequiredFiles = requiredFiles.every(file =>
      received.includes(file)
    );
    
    return {
      message: () =>
        hasRequiredFiles
          ? `Expected ${received} not to have correct FSD structure`
          : `Expected ${received} to have correct FSD structure with files: ${requiredFiles.join(', ')}`,
      pass: hasRequiredFiles
    };
  }
});
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-21  
**Document Owner**: Grace (QA Lead)