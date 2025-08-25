import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from '../Icon';
import { iconMap } from '../iconMap';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Icon Component', () => {
  describe('Rendering', () => {
    it('should render icon by name', () => {
      render(<Icon name="play" aria-label="Play video" />);
      const icon = screen.getByLabelText('Play video');
      expect(icon).toBeInTheDocument();
      expect(icon.tagName.toLowerCase()).toBe('svg');
    });

    it('should render all available icons', () => {
      const iconNames = Object.keys(iconMap) as Array<keyof typeof iconMap>;
      
      iconNames.forEach(name => {
        const { container } = render(
          <Icon name={name} aria-label={`${name} icon`} />
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should apply size prop', () => {
      const { rerender } = render(<Icon name="close" size="small" />);
      let icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');

      rerender(<Icon name="close" size="medium" />);
      icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');

      rerender(<Icon name="close" size="large" />);
      icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');

      rerender(<Icon name="close" size={40} />);
      icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('width', '40');
      expect(icon).toHaveAttribute('height', '40');
    });

    it('should apply color prop', () => {
      render(<Icon name="star" color="#ff0000" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('fill', '#ff0000');
    });

    it('should apply stroke color for outline icons', () => {
      render(<Icon name="heart-outline" strokeColor="#00ff00" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('stroke', '#00ff00');
    });

    it('should apply className', () => {
      render(<Icon name="settings" className="custom-icon" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('custom-icon');
      expect(icon).toHaveClass('icon'); // Base class
    });

    it('should forward data attributes', () => {
      render(<Icon name="user" data-testid="user-icon" />);
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Icon Map', () => {
    it('should have essential UI icons', () => {
      const essentialIcons = [
        'close',
        'check',
        'chevron-up',
        'chevron-down',
        'chevron-left',
        'chevron-right',
        'arrow-left',
        'arrow-right',
        'menu',
        'search',
        'filter',
        'settings',
        'user',
        'home',
        'edit',
        'delete',
        'add',
        'remove',
        'info',
        'warning',
        'error',
        'success'
      ];

      essentialIcons.forEach(iconName => {
        expect(iconMap).toHaveProperty(iconName);
        expect(typeof iconMap[iconName as keyof typeof iconMap]).toBe('function');
      });
    });

    it('should have video-related icons', () => {
      const videoIcons = [
        'play',
        'pause',
        'stop',
        'record',
        'fast-forward',
        'rewind',
        'volume-up',
        'volume-down',
        'volume-mute',
        'fullscreen',
        'fullscreen-exit',
        'picture-in-picture',
        'subtitles',
        'camera',
        'video'
      ];

      videoIcons.forEach(iconName => {
        expect(iconMap).toHaveProperty(iconName);
      });
    });

    it('should have feedback and communication icons', () => {
      const feedbackIcons = [
        'comment',
        'reply',
        'like',
        'dislike',
        'star',
        'star-outline',
        'notification',
        'notification-off',
        'send',
        'share',
        'link',
        'download',
        'upload'
      ];

      feedbackIcons.forEach(iconName => {
        expect(iconMap).toHaveProperty(iconName);
      });
    });

    it('should have project management icons', () => {
      const projectIcons = [
        'folder',
        'folder-open',
        'file',
        'document',
        'calendar',
        'clock',
        'task',
        'kanban',
        'gantt',
        'dashboard',
        'analytics',
        'report'
      ];

      projectIcons.forEach(iconName => {
        expect(iconMap).toHaveProperty(iconName);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations with aria-label', async () => {
      const { container } = render(
        <Icon name="play" aria-label="Play video" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be hidden from screen readers when decorative', () => {
      render(<Icon name="star" decorative />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have role="img" when not decorative', () => {
      render(<Icon name="info" aria-label="Information" />);
      const icon = screen.getByRole('img', { name: 'Information' });
      expect(icon).toBeInTheDocument();
    });

    it('should warn when non-decorative icon lacks aria-label', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<Icon name="warning" />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Icon should have aria-label or be marked as decorative')
      );
      
      consoleSpy.mockRestore();
    });

    it('should support title for tooltip', () => {
      render(<Icon name="help" title="Get help" aria-label="Help" />);
      const icon = screen.getByRole('img', { name: 'Help' });
      const title = icon.querySelector('title');
      expect(title).toHaveTextContent('Get help');
    });

    it('should have focusable attribute when interactive', () => {
      render(
        <Icon 
          name="settings" 
          aria-label="Settings"
          onClick={() => {}}
          tabIndex={0}
        />
      );
      const icon = screen.getByRole('img', { name: 'Settings' });
      expect(icon).toHaveAttribute('tabIndex', '0');
      expect(icon).toHaveAttribute('focusable', 'true');
    });
  });

  describe('SVG Properties', () => {
    it('should preserve viewBox', () => {
      render(<Icon name="play" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('viewBox');
    });

    it('should support custom viewBox', () => {
      render(<Icon name="custom" viewBox="0 0 100 100" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('viewBox', '0 0 100 100');
    });

    it('should maintain aspect ratio', () => {
      render(<Icon name="play" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });

    it('should support strokeWidth for outline icons', () => {
      render(<Icon name="heart-outline" strokeWidth={2} />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('stroke-width', '2');
    });

    it('should apply fill="none" for outline icons', () => {
      render(<Icon name="heart-outline" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('fill', 'none');
    });

    it('should support currentColor', () => {
      render(<Icon name="star" color="currentColor" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Animation', () => {
    it('should support spin animation', () => {
      render(<Icon name="loading" spin />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('icon--spin');
    });

    it('should support pulse animation', () => {
      render(<Icon name="heart" pulse />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('icon--pulse');
    });

    it('should support custom animation', () => {
      render(<Icon name="bell" animation="shake" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('icon--shake');
    });
  });

  describe('Responsive Sizing', () => {
    it('should support responsive size prop', () => {
      render(
        <Icon 
          name="dashboard" 
          size={{ mobile: 'small', tablet: 'medium', desktop: 'large' }}
        />
      );
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('icon--responsive');
    });
  });

  describe('Icon Sprite', () => {
    it('should support sprite mode for performance', () => {
      render(<Icon name="user" sprite />);
      const use = document.querySelector('use');
      expect(use).toBeInTheDocument();
      expect(use).toHaveAttribute('href', '#icon-user');
    });
  });

  describe('Error Handling', () => {
    it('should render fallback for unknown icon', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // @ts-expect-error - Testing invalid icon name
      render(<Icon name="unknown-icon" />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Icon "unknown-icon" not found')
      );
      
      // Should render a placeholder or question mark icon
      const fallback = screen.getByRole('img', { hidden: true });
      expect(fallback).toHaveClass('icon--fallback');
      
      consoleSpy.mockRestore();
    });
  });
});