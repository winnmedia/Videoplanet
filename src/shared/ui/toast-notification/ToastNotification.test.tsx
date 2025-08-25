import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider, useToast, Toast } from './index';

// Test component to trigger toasts
const TestComponent = () => {
  const { showToast, dismissToast, dismissAllToasts } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast({ message: 'Success message', type: 'success' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ message: 'Error message', type: 'error' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ 
        message: 'Custom toast', 
        type: 'info',
        duration: 1000,
        id: 'custom-id'
      })}>
        Show Custom
      </button>
      <button onClick={() => dismissToast('custom-id')}>
        Dismiss Custom
      </button>
      <button onClick={dismissAllToasts}>
        Dismiss All
      </button>
    </div>
  );
};

describe('ToastNotification', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('Toast Component', () => {
    it('should render success toast', () => {
      render(
        <Toast 
          id="1"
          type="success"
          message="Success message"
          onDismiss={() => {}}
        />
      );
      
      const toast = screen.getByRole('status');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('toast--success');
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should render error toast', () => {
      render(
        <Toast 
          id="2"
          type="error"
          message="Error message"
          onDismiss={() => {}}
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast--error');
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should render with title and description', () => {
      render(
        <Toast 
          id="3"
          type="info"
          title="Info Title"
          message="Info description"
          onDismiss={() => {}}
        />
      );
      
      expect(screen.getByText('Info Title')).toBeInTheDocument();
      expect(screen.getByText('Info description')).toBeInTheDocument();
    });

    it('should call onDismiss when close button is clicked', () => {
      const onDismiss = vi.fn();
      
      render(
        <Toast 
          id="4"
          type="info"
          message="Dismissible"
          onDismiss={onDismiss}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onDismiss).toHaveBeenCalledWith('4');
    });

    it('should render with action button', () => {
      const onAction = vi.fn();
      
      render(
        <Toast 
          id="5"
          type="info"
          message="With action"
          action={{
            label: 'Undo',
            onClick: onAction
          }}
          onDismiss={() => {}}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Undo' });
      fireEvent.click(actionButton);
      
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should show progress bar when showProgress is true', () => {
      render(
        <Toast 
          id="6"
          type="success"
          message="With progress"
          showProgress={true}
          duration={5000}
          onDismiss={() => {}}
        />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuemax', '5000');
    });
  });

  describe('ToastProvider and useToast', () => {
    it('should show toast when showToast is called', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      const showButton = screen.getByText('Show Success');
      fireEvent.click(showButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });

    it('should show multiple toasts', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('should dismiss specific toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Custom'));
      
      await waitFor(() => {
        expect(screen.getByText('Custom toast')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Dismiss Custom'));
      
      await waitFor(() => {
        expect(screen.queryByText('Custom toast')).not.toBeInTheDocument();
      });
    });

    it('should dismiss all toasts', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Dismiss All'));
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });

    it('should auto-dismiss toast after duration', async () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Custom'));
      
      expect(screen.getByText('Custom toast')).toBeInTheDocument();
      
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Custom toast')).not.toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });

    it('should limit maximum number of toasts', async () => {
      render(
        <ToastProvider maxToasts={2}>
          <TestComponent />
        </ToastProvider>
      );
      
      // Show 3 toasts
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Custom'));
      
      await waitFor(() => {
        // Only 2 should be visible
        const toasts = screen.getAllByRole(/status|alert/);
        expect(toasts).toHaveLength(2);
      });
    });

    it('should position toasts correctly', () => {
      const { rerender } = render(
        <ToastProvider position="top-right">
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Success'));
      
      let container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--top-right');
      
      rerender(
        <ToastProvider position="bottom-left">
          <TestComponent />
        </ToastProvider>
      );
      
      container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--bottom-left');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Toast 
          id="a11y"
          type="success"
          message="Accessible toast"
          onDismiss={() => {}}
        />
      );
      
      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('should use alert role for error toasts', () => {
      render(
        <Toast 
          id="error"
          type="error"
          message="Error toast"
          onDismiss={() => {}}
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('should announce toast messages to screen readers', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Success'));
      
      await waitFor(() => {
        const toast = screen.getByRole('status');
        expect(toast).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});