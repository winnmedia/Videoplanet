import { describe, it, expect } from 'vitest';
import { spacing, getSpacing, createSpacing, spacingScale } from '../spacing';

describe('Spacing Tokens', () => {
  describe('Spacing Scale', () => {
    it('should have all spacing scales defined', () => {
      expect(spacing.none).toBeDefined();
      expect(spacing.xs).toBeDefined();
      expect(spacing.sm).toBeDefined();
      expect(spacing.md).toBeDefined();
      expect(spacing.lg).toBeDefined();
      expect(spacing.xl).toBeDefined();
      expect(spacing['2xl']).toBeDefined();
      expect(spacing['3xl']).toBeDefined();
      expect(spacing['4xl']).toBeDefined();
      expect(spacing['5xl']).toBeDefined();
    });

    it('should have zero value for none', () => {
      expect(spacing.none).toBe('0');
    });

    it('should follow 8px grid system', () => {
      // Based on 8px grid for consistency
      expect(spacing.xs).toBe('0.25rem'); // 4px
      expect(spacing.sm).toBe('0.5rem'); // 8px
      expect(spacing.md).toBe('1rem'); // 16px
      expect(spacing.lg).toBe('1.5rem'); // 24px
      expect(spacing.xl).toBe('2rem'); // 32px
      expect(spacing['2xl']).toBe('3rem'); // 48px
      expect(spacing['3xl']).toBe('4rem'); // 64px
      expect(spacing['4xl']).toBe('6rem'); // 96px
      expect(spacing['5xl']).toBe('8rem'); // 128px
    });

    it('should have progressive spacing scale', () => {
      const values = [
        parseFloat(spacing.none),
        parseFloat(spacing.xs),
        parseFloat(spacing.sm),
        parseFloat(spacing.md),
        parseFloat(spacing.lg),
        parseFloat(spacing.xl),
        parseFloat(spacing['2xl']),
        parseFloat(spacing['3xl']),
        parseFloat(spacing['4xl']),
        parseFloat(spacing['5xl'])
      ];

      // Check that values are in ascending order
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i + 1]).toBeGreaterThanOrEqual(values[i]);
      }
    });
  });

  describe('Component Spacing', () => {
    it('should have button padding defined', () => {
      expect(spacing.button).toBeDefined();
      expect(spacing.button.paddingX).toBeDefined();
      expect(spacing.button.paddingY).toBeDefined();
      expect(spacing.button.gap).toBeDefined();
    });

    it('should have input padding defined', () => {
      expect(spacing.input).toBeDefined();
      expect(spacing.input.paddingX).toBeDefined();
      expect(spacing.input.paddingY).toBeDefined();
    });

    it('should have card padding defined', () => {
      expect(spacing.card).toBeDefined();
      expect(spacing.card.padding).toBeDefined();
      expect(spacing.card.gap).toBeDefined();
    });

    it('should have section spacing defined', () => {
      expect(spacing.section).toBeDefined();
      expect(spacing.section.marginBottom).toBeDefined();
      expect(spacing.section.paddingY).toBeDefined();
    });
  });

  describe('Layout Spacing', () => {
    it('should have container padding defined', () => {
      expect(spacing.layout).toBeDefined();
      expect(spacing.layout.containerPadding).toBeDefined();
      expect(spacing.layout.containerPadding.mobile).toBeDefined();
      expect(spacing.layout.containerPadding.tablet).toBeDefined();
      expect(spacing.layout.containerPadding.desktop).toBeDefined();
    });

    it('should have grid gaps defined', () => {
      expect(spacing.layout.gridGap).toBeDefined();
      expect(spacing.layout.gridGap.sm).toBeDefined();
      expect(spacing.layout.gridGap.md).toBeDefined();
      expect(spacing.layout.gridGap.lg).toBeDefined();
    });

    it('should have stack spacing defined', () => {
      expect(spacing.layout.stack).toBeDefined();
      expect(spacing.layout.stack.xs).toBeDefined();
      expect(spacing.layout.stack.sm).toBeDefined();
      expect(spacing.layout.stack.md).toBeDefined();
      expect(spacing.layout.stack.lg).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    it('should get spacing value', () => {
      expect(getSpacing('md')).toBe(spacing.md);
      expect(getSpacing('lg')).toBe(spacing.lg);
      expect(getSpacing('2xl')).toBe(spacing['2xl']);
    });

    it('should handle invalid spacing key', () => {
      // @ts-expect-error - Testing invalid input
      expect(getSpacing('invalid')).toBe(spacing.md); // Should return default
    });

    it('should create spacing with multiplier', () => {
      expect(createSpacing(1)).toBe('1rem');
      expect(createSpacing(2)).toBe('2rem');
      expect(createSpacing(0.5)).toBe('0.5rem');
      expect(createSpacing(1.5)).toBe('1.5rem');
    });

    it('should have correct spacing scale values', () => {
      expect(spacingScale.xs).toBe(0.25);
      expect(spacingScale.sm).toBe(0.5);
      expect(spacingScale.md).toBe(1);
      expect(spacingScale.lg).toBe(1.5);
      expect(spacingScale.xl).toBe(2);
    });
  });

  describe('Accessibility Spacing', () => {
    it('should have minimum touch target spacing', () => {
      // WCAG requires minimum 44x44px touch targets
      const buttonPaddingY = parseFloat(spacing.button.paddingY);
      const buttonPaddingX = parseFloat(spacing.button.paddingX);
      
      // Assuming font size of ~16px, padding should help achieve 44px minimum
      expect(buttonPaddingY).toBeGreaterThanOrEqual(0.75); // 12px minimum
      expect(buttonPaddingX).toBeGreaterThanOrEqual(1); // 16px minimum
    });

    it('should have adequate spacing between interactive elements', () => {
      const gap = parseFloat(spacing.button.gap);
      expect(gap).toBeGreaterThanOrEqual(0.5); // At least 8px between buttons
    });
  });

  describe('Responsive Spacing', () => {
    it('should have responsive container padding', () => {
      const mobile = parseFloat(spacing.layout.containerPadding.mobile);
      const tablet = parseFloat(spacing.layout.containerPadding.tablet);
      const desktop = parseFloat(spacing.layout.containerPadding.desktop);

      // Padding should increase with screen size
      expect(tablet).toBeGreaterThanOrEqual(mobile);
      expect(desktop).toBeGreaterThanOrEqual(tablet);
    });

    it('should have responsive grid gaps', () => {
      const sm = parseFloat(spacing.layout.gridGap.sm);
      const md = parseFloat(spacing.layout.gridGap.md);
      const lg = parseFloat(spacing.layout.gridGap.lg);

      expect(md).toBeGreaterThan(sm);
      expect(lg).toBeGreaterThan(md);
    });
  });
});