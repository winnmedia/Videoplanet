import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormFeedback } from './index';

describe('FormFeedback', () => {
  it('should render success feedback', () => {
    render(
      <FormFeedback 
        type="success" 
        message="Form submitted successfully"
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toBeInTheDocument();
    expect(feedback).toHaveClass('form-feedback--success');
    expect(screen.getByText('Form submitted successfully')).toBeInTheDocument();
  });

  it('should render error feedback', () => {
    render(
      <FormFeedback 
        type="error" 
        message="Please fix the errors below"
      />
    );
    
    const feedback = screen.getByRole('alert');
    expect(feedback).toHaveClass('form-feedback--error');
    expect(screen.getByText('Please fix the errors below')).toBeInTheDocument();
  });

  it('should render warning feedback', () => {
    render(
      <FormFeedback 
        type="warning" 
        message="Please review your input"
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveClass('form-feedback--warning');
    expect(screen.getByText('Please review your input')).toBeInTheDocument();
  });

  it('should render info feedback', () => {
    render(
      <FormFeedback 
        type="info" 
        message="Additional information"
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveClass('form-feedback--info');
    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('should render multiple messages as list', () => {
    const messages = [
      'Email is required',
      'Password must be at least 8 characters',
      'Username already taken'
    ];
    
    render(
      <FormFeedback 
        type="error" 
        messages={messages}
      />
    );
    
    messages.forEach(message => {
      expect(screen.getByText(message)).toBeInTheDocument();
    });
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('should render with custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
    
    render(
      <FormFeedback 
        type="info" 
        message="Custom icon message"
        icon={<CustomIcon />}
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(
      <FormFeedback 
        type="success" 
        message="No icon"
        showIcon={false}
      />
    );
    
    const icon = screen.queryByLabelText(/success icon/i);
    expect(icon).not.toBeInTheDocument();
  });

  it('should be dismissible when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    
    render(
      <FormFeedback 
        type="info" 
        message="Dismissible message"
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after duration', async () => {
    const onDismiss = vi.fn();
    
    render(
      <FormFeedback 
        type="success" 
        message="Auto-dismiss message"
        autoDismiss={true}
        dismissDuration={100}
        onDismiss={onDismiss}
      />
    );
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('should render field-level feedback', () => {
    render(
      <FormFeedback 
        type="error" 
        message="Invalid email format"
        fieldName="email"
      />
    );
    
    const feedback = screen.getByRole('alert');
    expect(feedback).toHaveAttribute('id', 'email-error');
    expect(feedback).toHaveAttribute('aria-describedby', 'email');
  });

  it('should render with animation', () => {
    render(
      <FormFeedback 
        type="success" 
        message="Animated feedback"
        animate={true}
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveClass('form-feedback--animated');
  });

  it('should support inline variant', () => {
    render(
      <FormFeedback 
        type="info" 
        message="Inline feedback"
        variant="inline"
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveClass('form-feedback--inline');
  });

  it('should support block variant', () => {
    render(
      <FormFeedback 
        type="warning" 
        message="Block feedback"
        variant="block"
      />
    );
    
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveClass('form-feedback--block');
  });

  it('should apply custom className', () => {
    render(
      <FormFeedback 
        type="error" 
        message="Custom class"
        className="custom-feedback"
      />
    );
    
    const feedback = screen.getByRole('alert');
    expect(feedback).toHaveClass('custom-feedback');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <FormFeedback 
        type="error" 
        message="Accessibility test"
        fieldName="password"
      />
    );
    
    const feedback = screen.getByRole('alert');
    expect(feedback).toHaveAttribute('aria-live', 'assertive');
    expect(feedback).toHaveAttribute('aria-atomic', 'true');
    expect(feedback).toHaveAttribute('id', 'password-error');
  });

  it('should render with title', () => {
    render(
      <FormFeedback 
        type="error" 
        title="Validation Errors"
        messages={['Error 1', 'Error 2']}
      />
    );
    
    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('should support different sizes', () => {
    const { rerender } = render(
      <FormFeedback 
        type="info" 
        message="Small size"
        size="small"
      />
    );
    expect(screen.getByRole('status')).toHaveClass('form-feedback--small');
    
    rerender(
      <FormFeedback 
        type="info" 
        message="Medium size"
        size="medium"
      />
    );
    expect(screen.getByRole('status')).toHaveClass('form-feedback--medium');
    
    rerender(
      <FormFeedback 
        type="info" 
        message="Large size"
        size="large"
      />
    );
    expect(screen.getByRole('status')).toHaveClass('form-feedback--large');
  });
});