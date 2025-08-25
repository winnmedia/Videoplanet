import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSkeleton } from './index';

describe('LoadingSkeleton', () => {
  it('should render basic skeleton with default props', () => {
    render(<LoadingSkeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('should render with custom width and height', () => {
    render(<LoadingSkeleton width="200px" height="50px" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('should render circle variant', () => {
    render(<LoadingSkeleton variant="circle" width="50px" height="50px" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton.className).toMatch(/skeleton--circle/);
  });

  it('should render text variant with multiple lines', () => {
    render(<LoadingSkeleton variant="text" lines={3} />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(3);
  });

  it('should render card variant with title and content', () => {
    render(<LoadingSkeleton variant="card" />);
    const container = screen.getByTestId('skeleton-card');
    // Check for elements with partial class match due to CSS modules
    const title = container.querySelector('[class*="skeleton__card-title"]');
    const content = container.querySelector('[class*="skeleton__card-content"]');
    
    expect(title).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it('should render table variant with rows and columns', () => {
    render(<LoadingSkeleton variant="table" rows={5} columns={4} />);
    const table = screen.getByTestId('skeleton-table');
    const rows = table.querySelectorAll('[class*="skeleton__table-row"]');
    
    expect(rows).toHaveLength(5);
    rows.forEach(row => {
      const cells = row.querySelectorAll('[class*="skeleton__table-cell"]');
      expect(cells).toHaveLength(4);
    });
  });

  it('should apply custom className', () => {
    render(<LoadingSkeleton className="custom-skeleton" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('should render with animation', () => {
    render(<LoadingSkeleton animation="pulse" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton.className).toMatch(/skeleton--pulse/);
  });

  it('should render without animation when animation is none', () => {
    render(<LoadingSkeleton animation="none" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton.className).not.toMatch(/skeleton--pulse/);
    expect(skeleton.className).not.toMatch(/skeleton--wave/);
  });

  it('should render list variant with custom item count', () => {
    render(<LoadingSkeleton variant="list" count={4} />);
    const items = screen.getAllByTestId('skeleton-list-item');
    expect(items).toHaveLength(4);
  });

  it('should support responsive sizing', () => {
    render(
      <LoadingSkeleton 
        width={{ mobile: '100%', tablet: '50%', desktop: '300px' }}
        height={{ mobile: '40px', tablet: '50px', desktop: '60px' }}
      />
    );
    const skeleton = screen.getByRole('status');
    expect(skeleton.className).toMatch(/skeleton--responsive/);
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSkeleton ariaLabel="Loading user profile" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading user profile');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });
});