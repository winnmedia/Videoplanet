import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from './index';

describe('EmptyState', () => {
  it('should render with default props', () => {
    render(<EmptyState />);
    
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <EmptyState 
        title="No results" 
        description="Try adjusting your search criteria"
      />
    );
    
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('should render custom icon component', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
    render(<EmptyState icon={<CustomIcon />} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should render with predefined icon type', () => {
    render(<EmptyState iconType="search" />);
    
    const icon = screen.getByLabelText('No search results');
    expect(icon).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState 
        action={{
          label: 'Add new item',
          onClick: handleAction,
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add new item' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('should render multiple actions', () => {
    const primaryAction = vi.fn();
    const secondaryAction = vi.fn();
    
    render(
      <EmptyState 
        actions={[
          { label: 'Primary', onClick: primaryAction, variant: 'primary' },
          { label: 'Secondary', onClick: secondaryAction, variant: 'secondary' },
        ]}
      />
    );
    
    const primaryButton = screen.getByRole('button', { name: 'Primary' });
    const secondaryButton = screen.getByRole('button', { name: 'Secondary' });
    
    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
    
    fireEvent.click(primaryButton);
    fireEvent.click(secondaryButton);
    
    expect(primaryAction).toHaveBeenCalledTimes(1);
    expect(secondaryAction).toHaveBeenCalledTimes(1);
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<EmptyState size="small" />);
    expect(screen.getByRole('status')).toHaveClass('empty-state--small');
    
    rerender(<EmptyState size="medium" />);
    expect(screen.getByRole('status')).toHaveClass('empty-state--medium');
    
    rerender(<EmptyState size="large" />);
    expect(screen.getByRole('status')).toHaveClass('empty-state--large');
  });

  it('should render with custom image', () => {
    render(
      <EmptyState 
        image="/path/to/image.png"
        imageAlt="Empty illustration"
      />
    );
    
    const image = screen.getByAltText('Empty illustration');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/path/to/image.png');
  });

  it('should apply custom className', () => {
    render(<EmptyState className="custom-empty-state" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('custom-empty-state');
  });

  it('should render children content', () => {
    render(
      <EmptyState>
        <div data-testid="custom-content">Custom content</div>
      </EmptyState>
    );
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <EmptyState 
        title="No items"
        description="Your list is empty"
      />
    );
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', 'Empty state: No items');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('should render different icon types correctly', () => {
    const iconTypes = ['inbox', 'search', 'folder', 'data', 'users'] as const;
    
    iconTypes.forEach(type => {
      const { unmount } = render(<EmptyState iconType={type} />);
      const icon = document.querySelector(`[aria-label*="${type}"]`);
      expect(icon).toBeInTheDocument();
      unmount();
    });
  });

  it('should support compact variant', () => {
    render(<EmptyState variant="compact" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('empty-state--compact');
  });

  it('should support centered alignment', () => {
    render(<EmptyState align="center" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('empty-state--center');
  });

  it('should disable action button when specified', () => {
    render(
      <EmptyState 
        action={{
          label: 'Disabled action',
          onClick: vi.fn(),
          disabled: true,
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Disabled action' });
    expect(button).toBeDisabled();
  });
});