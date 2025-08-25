import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { IconButton } from './IconButton';
import '@testing-library/jest-dom';

// Mock icon components
const TestIcon = () => <svg data-testid="test-icon" />;
const LoadingIcon = () => <svg data-testid="loading-icon" />;

describe('IconButton', () => {
  describe('Basic Rendering', () => {
    it('should render with icon', () => {
      render(<IconButton icon={<TestIcon />} aria-label="Test button" />);
      
      const button = screen.getByRole('button', { name: 'Test button' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should apply default medium size class', () => {
      render(<IconButton icon={<TestIcon />} aria-label="Test button" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--medium');
    });

    it('should apply size classes correctly', () => {
      const { rerender } = render(
        <IconButton icon={<TestIcon />} size="small" aria-label="Test button" />
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--small');
      
      rerender(<IconButton icon={<TestIcon />} size="large" aria-label="Test button" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--large');
    });

    it('should apply variant classes correctly', () => {
      const { rerender } = render(
        <IconButton icon={<TestIcon />} variant="primary" aria-label="Test button" />
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--primary');
      
      rerender(<IconButton icon={<TestIcon />} variant="secondary" aria-label="Test button" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--secondary');
      
      rerender(<IconButton icon={<TestIcon />} variant="ghost" aria-label="Test button" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--ghost');
      
      rerender(<IconButton icon={<TestIcon />} variant="danger" aria-label="Test button" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--danger');
    });
  });

  describe('Accessibility', () => {
    it('should have minimum 44x44px touch target', () => {
      render(<IconButton icon={<TestIcon />} aria-label="Test button" />);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check for min-width and min-height
      expect(button).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });

    it('should support custom minimum touch size', () => {
      render(
        <IconButton icon={<TestIcon />} minTouchSize={48} aria-label="Test button" />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ minWidth: '48px', minHeight: '48px' });
    });

    it('should require aria-label when no visible text', () => {
      render(<IconButton icon={<TestIcon />} aria-label="Test action" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Test action');
    });

    it('should support aria-pressed for toggle buttons', () => {
      render(
        <IconButton icon={<TestIcon />} active={true} aria-label="Toggle" aria-pressed={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have correct aria-busy when loading', () => {
      render(<IconButton icon={<TestIcon />} loading={true} aria-label="Loading button" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-label', 'Loading button');
    });

    it('should be keyboard navigable', async () => {
      const handleClick = vi.fn();
      render(
        <IconButton icon={<TestIcon />} onClick={handleClick} aria-label="Keyboard test" />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip on hover', async () => {
      render(
        <IconButton
          icon={<TestIcon />}
          tooltip="This is a tooltip"
          aria-label="Button with tooltip"
        />
      );
      
      const button = screen.getByRole('button');
      
      // Hover over button
      await userEvent.hover(button);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('This is a tooltip');
      });
      
      // Unhover
      await userEvent.unhover(button);
      
      // Wait for tooltip to disappear
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip on focus for keyboard users', async () => {
      render(
        <IconButton
          icon={<TestIcon />}
          tooltip="Keyboard tooltip"
          aria-label="Button"
        />
      );
      
      const button = screen.getByRole('button');
      
      // Focus button
      button.focus();
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('Keyboard tooltip');
      });
      
      // Blur button
      button.blur();
      
      // Wait for tooltip to disappear
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should position tooltip correctly', async () => {
      const { rerender } = render(
        <IconButton
          icon={<TestIcon />}
          tooltip="Tooltip"
          tooltipPosition="top"
          aria-label="Button"
        />
      );
      
      let button = screen.getByRole('button');
      await userEvent.hover(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('tooltip--top');
      });
      
      await userEvent.unhover(button);
      
      // Test other positions
      const positions: Array<'bottom' | 'left' | 'right'> = ['bottom', 'left', 'right'];
      for (const position of positions) {
        rerender(
          <IconButton
            icon={<TestIcon />}
            tooltip="Tooltip"
            tooltipPosition={position}
            aria-label="Button"
          />
        );
        
        button = screen.getByRole('button');
        await userEvent.hover(button);
        
        await waitFor(() => {
          const tooltip = screen.getByRole('tooltip');
          expect(tooltip).toHaveClass(`tooltip--${position}`);
        });
        
        await userEvent.unhover(button);
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading icon when loading', () => {
      render(
        <IconButton
          icon={<TestIcon />}
          loading={true}
          loadingIcon={<LoadingIcon />}
          aria-label="Loading"
        />
      );
      
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('should show default spinner when loading without custom icon', () => {
      render(
        <IconButton icon={<TestIcon />} loading={true} aria-label="Loading" />
      );
      
      const spinner = screen.getByTestId('default-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('spinner');
    });

    it('should be disabled when loading', () => {
      render(
        <IconButton icon={<TestIcon />} loading={true} aria-label="Loading" />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not trigger click when loading', () => {
      const handleClick = vi.fn();
      render(
        <IconButton
          icon={<TestIcon />}
          loading={true}
          onClick={handleClick}
          aria-label="Loading"
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Ripple Effect', () => {
    it('should show ripple effect on click by default', async () => {
      render(<IconButton icon={<TestIcon />} aria-label="Ripple test" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Check for ripple element
      const ripple = button.querySelector('.ripple');
      expect(ripple).toBeInTheDocument();
      
      // Wait for ripple animation to complete
      await waitFor(() => {
        expect(button.querySelector('.ripple')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should not show ripple when ripple prop is false', () => {
      render(<IconButton icon={<TestIcon />} ripple={false} aria-label="No ripple" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const ripple = button.querySelector('.ripple');
      expect(ripple).not.toBeInTheDocument();
    });

    it('should position ripple at click coordinates', () => {
      render(<IconButton icon={<TestIcon />} aria-label="Ripple position" />);
      
      const button = screen.getByRole('button');
      const rect = button.getBoundingClientRect();
      
      // Simulate click at specific coordinates
      fireEvent.click(button, {
        clientX: rect.left + 10,
        clientY: rect.top + 10
      });
      
      const ripple = button.querySelector('.ripple') as HTMLElement;
      expect(ripple).toBeInTheDocument();
      
      // Check ripple position
      const style = window.getComputedStyle(ripple);
      expect(style.left).toBe('10px');
      expect(style.top).toBe('10px');
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode class when darkMode is true', () => {
      render(<IconButton icon={<TestIcon />} darkMode={true} aria-label="Dark mode" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--dark');
    });

    it('should apply dark mode from system preference', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
      
      render(<IconButton icon={<TestIcon />} aria-label="System dark mode" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--dark');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<IconButton icon={<TestIcon />} disabled={true} aria-label="Disabled" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('iconButton--disabled');
    });

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <IconButton
          icon={<TestIcon />}
          disabled={true}
          onClick={handleClick}
          aria-label="Disabled"
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not show tooltip when disabled', async () => {
      render(
        <IconButton
          icon={<TestIcon />}
          disabled={true}
          tooltip="Should not show"
          aria-label="Disabled"
        />
      );
      
      const button = screen.getByRole('button');
      await userEvent.hover(button);
      
      // Wait a bit to ensure tooltip doesn't appear
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should apply active class when active prop is true', () => {
      render(<IconButton icon={<TestIcon />} active={true} aria-label="Active" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton--active');
    });
  });

  describe('Custom Props', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <IconButton
          icon={<TestIcon />}
          type="submit"
          form="test-form"
          aria-label="Submit"
          data-testid="custom-button"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
    });

    it('should merge custom className', () => {
      render(
        <IconButton
          icon={<TestIcon />}
          className="custom-class"
          aria-label="Custom"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('iconButton');
      expect(button).toHaveClass('custom-class');
    });

    it('should handle onClick event', () => {
      const handleClick = vi.fn();
      render(
        <IconButton icon={<TestIcon />} onClick={handleClick} aria-label="Click test" />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});