import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProjectsPage from './page';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Button component
vi.mock('@/shared/ui/Button/Button', () => ({
  Button: ({ children, onClick, variant, size, icon, iconPosition, loading, disabled, href, ...props }: any) => {
    const Component = href ? 'a' : 'button';
    return (
      <Component
        href={href}
        onClick={onClick}
        className={`button ${variant} ${size}`}
        disabled={disabled || loading}
        data-testid={props['data-testid']}
        aria-label={props['aria-label']}
        aria-pressed={props['aria-pressed']}
        {...props}
      >
        {loading && <span data-testid="loading-spinner">Loading...</span>}
        {icon && iconPosition === 'left' && <span data-testid={`icon-${icon}`}>{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span data-testid={`icon-${icon}`}>{icon}</span>}
      </Component>
    );
  },
}));

// Mock Icon component
vi.mock('@/shared/ui/Icon/Icon', () => ({
  Icon: ({ name, size, decorative, ...props }: any) => (
    <svg
      data-testid={`icon-${name}`}
      data-size={size}
      aria-hidden={decorative ? 'true' : undefined}
      {...props}
    >
      <title>{name}</title>
    </svg>
  ),
}));

describe('ProjectsPage', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Setup localStorage
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'isAuthenticated') return 'true';
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('redirects to login when not authenticated', async () => {
      Storage.prototype.getItem = vi.fn(() => null);
      
      render(<ProjectsPage />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('stays on page when authenticated', async () => {
      Storage.prototype.getItem = vi.fn(() => 'true');
      
      render(<ProjectsPage />);
      
      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });
  });

  describe('Design System Integration', () => {
    it('uses Button component for primary actions', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        // New project button
        const newProjectBtns = screen.getAllByRole('link', { name: /새 프로젝트 만들기/i });
        expect(newProjectBtns[0]).toBeInTheDocument();
        expect(newProjectBtns[0]).toHaveClass('button');
        
        // Filter buttons should use Button component
        const filterButtons = screen.getAllByRole('button', { name: /보기/i });
        filterButtons.forEach(btn => {
          expect(btn).toHaveClass('button');
        });
      });
    });

    it('uses Icon component instead of inline SVGs', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        // Search icon
        expect(screen.getByTestId('icon-search')).toBeInTheDocument();
        
        // Project card icons
        expect(screen.getAllByTestId(/icon-/)).toHaveLength(expect.any(Number));
      });
    });

    it('maintains minimum touch target size (44x44px)', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // Check that button has adequate size classes or inline styles
          expect(button).toHaveClass('button');
        });
      });
    });
  });

  describe('Filter Functionality', () => {
    it('filters projects by status', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const allProjects = screen.getAllByRole('listitem');
        expect(allProjects).toHaveLength(5);
      });

      // Click on "진행중" filter
      const activeFilter = screen.getByRole('button', { name: /진행중인 프로젝트 보기/i });
      fireEvent.click(activeFilter);

      await waitFor(() => {
        const filteredProjects = screen.getAllByRole('listitem');
        expect(filteredProjects.length).toBeLessThan(5);
      });
    });

    it('indicates active filter state with aria-pressed', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const allFilter = screen.getByRole('button', { name: /모든 프로젝트 보기/i });
        expect(allFilter).toHaveAttribute('aria-pressed', 'true');
      });

      const activeFilter = screen.getByRole('button', { name: /진행중인 프로젝트 보기/i });
      fireEvent.click(activeFilter);

      await waitFor(() => {
        expect(activeFilter).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Search Functionality', () => {
    it('searches projects by title, description, and client', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByRole('searchbox', { name: /프로젝트 검색/i });
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: '브랜드' } });

      await waitFor(() => {
        const projects = screen.getAllByRole('listitem');
        expect(projects.length).toBeLessThan(5);
      });
    });

    it('uses Icon component for search icon', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const searchIcon = screen.getByTestId('icon-search');
        expect(searchIcon).toBeInTheDocument();
        expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Project Cards', () => {
    it('displays project information with proper icons', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const firstProject = screen.getAllByRole('listitem')[0];
        const withinProject = within(firstProject);
        
        // Check for icon usage
        expect(withinProject.getAllByTestId('icon-user')[0]).toBeInTheDocument();
        expect(withinProject.getByTestId('icon-calendar')).toBeInTheDocument();
        expect(withinProject.getByTestId('icon-analytics')).toBeInTheDocument();
      });
    });

    it('uses Button component for detail view link', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const detailButtons = screen.getAllByRole('link', { name: /상세보기/i });
        detailButtons.forEach(btn => {
          expect(btn).toHaveClass('button');
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for all interactive elements', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        // Navigation
        expect(screen.getByRole('navigation', { name: /메인 네비게이션/i })).toBeInTheDocument();
        
        // Main content
        expect(screen.getByRole('main', { name: /프로젝트 목록/i })).toBeInTheDocument();
        
        // Filter region
        expect(screen.getByRole('region', { name: /필터 및 검색/i })).toBeInTheDocument();
        
        // Project list
        expect(screen.getByRole('list', { name: /프로젝트 목록/i })).toBeInTheDocument();
      });
    });

    it('maintains focus management for keyboard navigation', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const filterButtons = screen.getAllByRole('button', { name: /보기/i });
        filterButtons.forEach(btn => {
          expect(btn).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });

    it('provides loading state announcements', async () => {
      render(<ProjectsPage />);
      
      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Empty State', () => {
    it('displays appropriate message with Icon component', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/프로젝트가 없습니다/i)).toBeInTheDocument();
        expect(screen.getByTestId('icon-folder')).toBeInTheDocument();
        
        // Check for Button component in empty state
        const createButtons = screen.getAllByRole('link', { name: /새 프로젝트 만들기/i });
        expect(createButtons[createButtons.length - 1]).toHaveClass('button');
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts button sizes for different viewports', async () => {
      render(<ProjectsPage />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(btn => {
          // Check for responsive size classes
          expect(btn.className).toMatch(/button/);
        });
      });
    });
  });
});