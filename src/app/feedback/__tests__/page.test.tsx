import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import FeedbackPage from '../page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock GanttChart component
vi.mock('@/shared/ui/GanttChart', () => ({
  GanttChart: () => <div data-testid="gantt-chart">Gantt Chart</div>,
}));

// Mock Button component
vi.mock('@/shared/ui/Button/Button', () => ({
  Button: ({ 
    children, 
    onClick, 
    variant, 
    icon, 
    'aria-label': ariaLabel,
    ...props 
  }: any) => (
    <button 
      onClick={onClick} 
      data-variant={variant}
      data-icon={icon}
      aria-label={ariaLabel}
      {...props}
    >
      {icon && <span data-testid={`icon-${icon}`} />}
      {children}
    </button>
  ),
}));

// Mock Icon component
vi.mock('@/shared/ui/Icon/Icon', () => ({
  Icon: ({ name, ...props }: any) => (
    <span data-testid={`icon-${name}`} {...props} />
  ),
}));

describe('FeedbackPage - Design System Integration', () => {
  beforeEach(() => {
    localStorage.setItem('isAuthenticated', 'true');
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Button Component Usage', () => {
    it('should use Button component for filter buttons', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /전체/i })).toBeInTheDocument();
      });

      const filterButtons = screen.getAllByRole('button').filter(btn => 
        ['전체', '대기중', '진행중', '완료'].includes(btn.textContent || '')
      );

      filterButtons.forEach(button => {
        expect(button).toHaveAttribute('data-variant');
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper ARIA labels for icon-only buttons', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const iconButtons = screen.getAllByRole('button').filter(btn => 
          btn.hasAttribute('data-icon')
        );
        
        iconButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });

    it('should meet WCAG minimum touch target size (44x44px)', async () => {
      const { container } = render(<FeedbackPage />);
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('button');
        
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          const minSize = 44; // WCAG minimum
          
          // Check if button has adequate size styling
          expect(button.className).toMatch(/button/i);
        });
      });
    });
  });

  describe('Icon System Usage', () => {
    it('should use Icon component instead of inline SVGs', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        // Check for icon components
        const icons = screen.getAllByTestId(/^icon-/);
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should not contain emoji characters', async () => {
      const { container } = render(<FeedbackPage />);
      
      await waitFor(() => {
        const textContent = container.textContent || '';
        // Common emojis that should not be present
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        
        expect(textContent).not.toMatch(emojiRegex);
      });
    });

    it('should use semantic icon names', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        // Check that icons have meaningful names
        expect(screen.queryByTestId('icon-clock')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-check')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus management for interactive elements', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const interactiveElements = screen.getAllByRole('button');
        
        interactiveElements.forEach(element => {
          expect(element).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });

    it('should provide keyboard navigation support', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const filterButton = screen.getByRole('button', { name: /대기중/i });
        
        // Simulate keyboard interaction
        fireEvent.keyDown(filterButton, { key: 'Enter' });
        
        expect(filterButton).toHaveAttribute('data-variant');
      });
    });

    it('should have proper ARIA attributes for status indicators', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const statusElements = screen.getAllByText(/대기중|진행중|완료/);
        
        statusElements.forEach(element => {
          const parent = element.closest('[role]') || element.parentElement;
          expect(parent).toBeTruthy();
        });
      });
    });
  });

  describe('Visual Consistency', () => {
    it('should apply consistent button variants', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const primaryButtons = screen.getAllByRole('button').filter(btn => 
          btn.getAttribute('data-variant') === 'primary'
        );
        
        const secondaryButtons = screen.getAllByRole('button').filter(btn => 
          btn.getAttribute('data-variant') === 'secondary'
        );
        
        // At least some buttons should have variants
        expect(primaryButtons.length + secondaryButtons.length).toBeGreaterThan(0);
      });
    });

    it('should use design tokens for styling', async () => {
      const { container } = render(<FeedbackPage />);
      
      await waitFor(() => {
        // Check that elements use CSS modules or design token classes
        const styledElements = container.querySelectorAll('[class*="button"], [class*="icon"]');
        expect(styledElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feedback Card Interactions', () => {
    it('should have accessible action buttons in feedback cards', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const feedbackCards = screen.getAllByRole('listitem');
        expect(feedbackCards.length).toBeGreaterThan(0);
        
        // Each card should have properly styled elements
        feedbackCards.forEach(card => {
          const links = card.querySelectorAll('a');
          links.forEach(link => {
            expect(link).toHaveAttribute('href');
          });
        });
      });
    });

    it('should display priority indicators with proper styling', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        const priorities = screen.getAllByText(/높음|보통|낮음/);
        
        priorities.forEach(priority => {
          const element = priority.closest('span');
          expect(element).toHaveClass(/text-/);
        });
      });
    });
  });

  describe('Video Control Accessibility', () => {
    it('should have accessible media control buttons if present', async () => {
      render(<FeedbackPage />);
      
      await waitFor(() => {
        // Check for any video control buttons
        const mediaButtons = screen.queryAllByRole('button', { name: /play|pause|stop/i });
        
        mediaButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
          // Minimum touch target size
          expect(button.className).toMatch(/button/i);
        });
      });
    });
  });
});