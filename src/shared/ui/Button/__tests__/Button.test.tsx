import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--primary');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--secondary');

      rerender(<Button variant="tertiary">Tertiary</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--tertiary');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--danger');

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--ghost');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--small');

      rerender(<Button size="medium">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--medium');

      rerender(<Button size="large">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--large');
    });

    it('should render full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--fullWidth');
    });

    it('should render with icon', () => {
      render(
        <Button icon="play" iconPosition="left">
          Play Video
        </Button>
      );
      const button = screen.getByRole('button', { name: /play video/i });
      const icon = button.querySelector('[data-testid="icon-play"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon on right side', () => {
      render(
        <Button icon="arrow-right" iconPosition="right">
          Next
        </Button>
      );
      const button = screen.getByRole('button', { name: /next/i });
      expect(button).toHaveClass('button--iconRight');
    });

    it('should render icon-only button', () => {
      render(<Button icon="close" aria-label="Close dialog" iconOnly />);
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toHaveClass('button--iconOnly');
    });

    it('should render loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /disabled/i });
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button', { name: /press enter/i });
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should support form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should require aria-label for icon-only buttons', () => {
      // This should log a warning in development
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<Button icon="close" iconOnly />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Icon-only buttons must have an aria-label')
      );
      
      consoleSpy.mockRestore();
    });

    it('should have minimum touch target size', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button', { name: /touch target/i });
      const styles = window.getComputedStyle(button);
      
      // WCAG requires minimum 44x44px
      const minSize = 44;
      const height = parseFloat(styles.minHeight) || parseFloat(styles.height);
      const width = parseFloat(styles.minWidth) || parseFloat(styles.width);
      
      expect(height).toBeGreaterThanOrEqual(minSize);
      expect(width).toBeGreaterThanOrEqual(minSize);
    });

    it('should be keyboard focusable', () => {
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );
      
      const firstButton = screen.getByRole('button', { name: /first/i });
      const secondButton = screen.getByRole('button', { name: /second/i });
      
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      // Tab to next button
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      secondButton.focus();
      expect(document.activeElement).toBe(secondButton);
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('button'); // Should still have base class
    });

    it('should forward data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should apply inline styles', () => {
      render(<Button style={{ marginTop: '10px' }}>Styled</Button>);
      const button = screen.getByRole('button', { name: /styled/i });
      expect(button).toHaveStyle({ marginTop: '10px' });
    });
  });

  describe('Button as Link', () => {
    it('should render as anchor when href is provided', () => {
      render(<Button href="/dashboard">Go to Dashboard</Button>);
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('should support target attribute for links', () => {
      render(
        <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
          External Link
        </Button>
      );
      const link = screen.getByRole('link', { name: /external link/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Advanced Features', () => {
    it('should support tooltip', async () => {
      render(
        <Button tooltip="This action cannot be undone" tooltipPosition="top">
          Delete
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /delete/i });
      
      // Hover to show tooltip
      await userEvent.hover(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(
          'This action cannot be undone'
        );
      });
      
      // Unhover to hide tooltip
      await userEvent.unhover(button);
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should support ripple effect on click', () => {
      render(<Button ripple>Ripple Button</Button>);
      const button = screen.getByRole('button', { name: /ripple button/i });
      
      fireEvent.click(button);
      
      const ripple = button.querySelector('.button__ripple');
      expect(ripple).toBeInTheDocument();
    });

    it('should handle async onClick', async () => {
      const asyncClick = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      render(<Button onClick={asyncClick}>Async</Button>);
      const button = screen.getByRole('button', { name: /async/i });
      
      await userEvent.click(button);
      
      // Button should show loading state during async operation
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      await waitFor(() => {
        expect(button).not.toHaveAttribute('aria-busy');
      });
      
      expect(asyncClick).toHaveBeenCalled();
    });
  });
});