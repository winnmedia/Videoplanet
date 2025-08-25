import { describe, it, expect } from 'vitest';
import { typography, getFontSize, getLineHeight, getFontWeight } from '../typography';

describe('Typography Tokens', () => {
  describe('Font Family', () => {
    it('should have font families defined', () => {
      expect(typography.fontFamily).toBeDefined();
      expect(typography.fontFamily.primary).toBeDefined();
      expect(typography.fontFamily.secondary).toBeDefined();
      expect(typography.fontFamily.monospace).toBeDefined();
    });

    it('should have system font stack as fallback', () => {
      expect(typography.fontFamily.primary).toContain('system-ui');
      expect(typography.fontFamily.primary).toContain('-apple-system');
      expect(typography.fontFamily.primary).toContain('sans-serif');
    });
  });

  describe('Font Sizes', () => {
    it('should have all font size scales defined', () => {
      expect(typography.fontSize.xs).toBeDefined();
      expect(typography.fontSize.sm).toBeDefined();
      expect(typography.fontSize.base).toBeDefined();
      expect(typography.fontSize.lg).toBeDefined();
      expect(typography.fontSize.xl).toBeDefined();
      expect(typography.fontSize['2xl']).toBeDefined();
      expect(typography.fontSize['3xl']).toBeDefined();
      expect(typography.fontSize['4xl']).toBeDefined();
      expect(typography.fontSize['5xl']).toBeDefined();
    });

    it('should have proper font size progression', () => {
      const sizes = [
        typography.fontSize.xs,
        typography.fontSize.sm,
        typography.fontSize.base,
        typography.fontSize.lg,
        typography.fontSize.xl,
        typography.fontSize['2xl'],
        typography.fontSize['3xl'],
        typography.fontSize['4xl'],
        typography.fontSize['5xl']
      ];

      // Check that sizes are in ascending order
      for (let i = 0; i < sizes.length - 1; i++) {
        const currentSize = parseFloat(sizes[i]);
        const nextSize = parseFloat(sizes[i + 1]);
        expect(nextSize).toBeGreaterThan(currentSize);
      }
    });

    it('should have readable base font size', () => {
      const baseSize = parseFloat(typography.fontSize.base);
      expect(baseSize).toBeGreaterThanOrEqual(14); // Minimum readable size
      expect(baseSize).toBeLessThanOrEqual(18); // Maximum comfortable size
    });
  });

  describe('Font Weights', () => {
    it('should have all font weight scales defined', () => {
      expect(typography.fontWeight.light).toBeDefined();
      expect(typography.fontWeight.normal).toBeDefined();
      expect(typography.fontWeight.medium).toBeDefined();
      expect(typography.fontWeight.semibold).toBeDefined();
      expect(typography.fontWeight.bold).toBeDefined();
    });

    it('should have proper font weight values', () => {
      expect(typography.fontWeight.light).toBe(300);
      expect(typography.fontWeight.normal).toBe(400);
      expect(typography.fontWeight.medium).toBe(500);
      expect(typography.fontWeight.semibold).toBe(600);
      expect(typography.fontWeight.bold).toBe(700);
    });
  });

  describe('Line Heights', () => {
    it('should have all line height scales defined', () => {
      expect(typography.lineHeight.tight).toBeDefined();
      expect(typography.lineHeight.snug).toBeDefined();
      expect(typography.lineHeight.normal).toBeDefined();
      expect(typography.lineHeight.relaxed).toBeDefined();
      expect(typography.lineHeight.loose).toBeDefined();
    });

    it('should have appropriate line height values for readability', () => {
      expect(typography.lineHeight.tight).toBeGreaterThanOrEqual(1.1);
      expect(typography.lineHeight.normal).toBeGreaterThanOrEqual(1.5);
      expect(typography.lineHeight.loose).toBeLessThanOrEqual(2);
    });
  });

  describe('Letter Spacing', () => {
    it('should have letter spacing scales defined', () => {
      expect(typography.letterSpacing).toBeDefined();
      expect(typography.letterSpacing.tight).toBeDefined();
      expect(typography.letterSpacing.normal).toBeDefined();
      expect(typography.letterSpacing.wide).toBeDefined();
    });
  });

  describe('Typography Variants', () => {
    it('should have heading variants defined', () => {
      expect(typography.variants.h1).toBeDefined();
      expect(typography.variants.h2).toBeDefined();
      expect(typography.variants.h3).toBeDefined();
      expect(typography.variants.h4).toBeDefined();
      expect(typography.variants.h5).toBeDefined();
      expect(typography.variants.h6).toBeDefined();
    });

    it('should have body variants defined', () => {
      expect(typography.variants.body1).toBeDefined();
      expect(typography.variants.body2).toBeDefined();
      expect(typography.variants.caption).toBeDefined();
      expect(typography.variants.overline).toBeDefined();
    });

    it('should have button variant defined', () => {
      expect(typography.variants.button).toBeDefined();
      expect(typography.variants.button.fontWeight).toBeGreaterThanOrEqual(500);
      expect(typography.variants.button.letterSpacing).toBeDefined();
    });

    it('should have proper hierarchy in heading sizes', () => {
      const h1Size = parseFloat(typography.variants.h1.fontSize);
      const h2Size = parseFloat(typography.variants.h2.fontSize);
      const h3Size = parseFloat(typography.variants.h3.fontSize);
      const h4Size = parseFloat(typography.variants.h4.fontSize);
      const h5Size = parseFloat(typography.variants.h5.fontSize);
      const h6Size = parseFloat(typography.variants.h6.fontSize);

      expect(h1Size).toBeGreaterThan(h2Size);
      expect(h2Size).toBeGreaterThan(h3Size);
      expect(h3Size).toBeGreaterThan(h4Size);
      expect(h4Size).toBeGreaterThan(h5Size);
      expect(h5Size).toBeGreaterThanOrEqual(h6Size);
    });
  });

  describe('Helper Functions', () => {
    it('should get font size with rem unit', () => {
      const size = getFontSize('lg');
      expect(size).toContain('rem');
      expect(size).toBe(typography.fontSize.lg);
    });

    it('should get line height value', () => {
      const lineHeight = getLineHeight('normal');
      expect(lineHeight).toBe(typography.lineHeight.normal);
    });

    it('should get font weight value', () => {
      const weight = getFontWeight('bold');
      expect(weight).toBe(typography.fontWeight.bold);
    });

    it('should handle invalid inputs gracefully', () => {
      // @ts-expect-error - Testing invalid input
      expect(getFontSize('invalid')).toBe(typography.fontSize.base);
      // @ts-expect-error - Testing invalid input
      expect(getLineHeight('invalid')).toBe(typography.lineHeight.normal);
      // @ts-expect-error - Testing invalid input
      expect(getFontWeight('invalid')).toBe(typography.fontWeight.normal);
    });
  });

  describe('Responsive Typography', () => {
    it('should have responsive scale factors', () => {
      expect(typography.responsive).toBeDefined();
      expect(typography.responsive.scale).toBeDefined();
      expect(typography.responsive.scale.mobile).toBeLessThan(1);
      expect(typography.responsive.scale.tablet).toBe(1);
      expect(typography.responsive.scale.desktop).toBeGreaterThan(1);
    });
  });
});