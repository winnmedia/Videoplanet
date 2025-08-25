import { describe, it, expect } from 'vitest';
import { colors, getContrastRatio, isAccessible } from '../colors';

describe('Color Tokens', () => {
  describe('Color Token Structure', () => {
    it('should have primary colors defined', () => {
      expect(colors.primary).toBeDefined();
      expect(colors.primary.main).toBeDefined();
      expect(colors.primary.light).toBeDefined();
      expect(colors.primary.dark).toBeDefined();
      expect(colors.primary.contrastText).toBeDefined();
    });

    it('should have secondary colors defined', () => {
      expect(colors.secondary).toBeDefined();
      expect(colors.secondary.main).toBeDefined();
      expect(colors.secondary.light).toBeDefined();
      expect(colors.secondary.dark).toBeDefined();
      expect(colors.secondary.contrastText).toBeDefined();
    });

    it('should have semantic colors defined', () => {
      expect(colors.error).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.info).toBeDefined();
      expect(colors.success).toBeDefined();
    });

    it('should have neutral colors defined', () => {
      expect(colors.grey).toBeDefined();
      expect(colors.grey[50]).toBeDefined();
      expect(colors.grey[100]).toBeDefined();
      expect(colors.grey[200]).toBeDefined();
      expect(colors.grey[300]).toBeDefined();
      expect(colors.grey[400]).toBeDefined();
      expect(colors.grey[500]).toBeDefined();
      expect(colors.grey[600]).toBeDefined();
      expect(colors.grey[700]).toBeDefined();
      expect(colors.grey[800]).toBeDefined();
      expect(colors.grey[900]).toBeDefined();
    });

    it('should have background colors defined', () => {
      expect(colors.background).toBeDefined();
      expect(colors.background.default).toBeDefined();
      expect(colors.background.paper).toBeDefined();
      expect(colors.background.elevation1).toBeDefined();
      expect(colors.background.elevation2).toBeDefined();
    });

    it('should have text colors defined', () => {
      expect(colors.text).toBeDefined();
      expect(colors.text.primary).toBeDefined();
      expect(colors.text.secondary).toBeDefined();
      expect(colors.text.disabled).toBeDefined();
      expect(colors.text.hint).toBeDefined();
    });
  });

  describe('WCAG Accessibility', () => {
    it('should have accessible contrast ratio for primary button', () => {
      const ratio = getContrastRatio(colors.primary.main, colors.primary.contrastText);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
    });

    it('should have accessible contrast ratio for secondary button', () => {
      const ratio = getContrastRatio(colors.secondary.main, colors.secondary.contrastText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have accessible contrast ratio for error states', () => {
      const ratio = getContrastRatio(colors.error.main, colors.error.contrastText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have accessible contrast ratio for success states', () => {
      const ratio = getContrastRatio(colors.success.main, colors.success.contrastText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have accessible contrast for text on background', () => {
      const primaryTextRatio = getContrastRatio(
        colors.text.primary,
        colors.background.default
      );
      expect(primaryTextRatio).toBeGreaterThanOrEqual(4.5);

      const secondaryTextRatio = getContrastRatio(
        colors.text.secondary,
        colors.background.default
      );
      expect(secondaryTextRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate accessibility with isAccessible helper', () => {
      expect(isAccessible(colors.primary.main, colors.primary.contrastText)).toBe(true);
      expect(isAccessible(colors.secondary.main, colors.secondary.contrastText)).toBe(true);
      expect(isAccessible(colors.error.main, colors.error.contrastText)).toBe(true);
    });
  });

  describe('Color Format Validation', () => {
    it('should have valid hex color format', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      
      expect(colors.primary.main).toMatch(hexRegex);
      expect(colors.secondary.main).toMatch(hexRegex);
      expect(colors.error.main).toMatch(hexRegex);
      expect(colors.success.main).toMatch(hexRegex);
      expect(colors.warning.main).toMatch(hexRegex);
      expect(colors.info.main).toMatch(hexRegex);
    });
  });

  describe('Brand Consistency', () => {
    it('should use VideoPlanet brand primary color', () => {
      expect(colors.primary.main).toBe('#1631F8');
    });

    it('should maintain consistent color palette', () => {
      // Ensure colors match the design system requirements
      expect(colors.error.main).toBe('#dc3545');
      expect(colors.success.main).toBe('#1E7E34'); // Updated for better accessibility
      expect(colors.warning.main).toBe('#ffc107');
      expect(colors.info.main).toBe('#17a2b8');
    });
  });
});