/**
 * Spacing Design Tokens for VideoPlanet
 * Based on 8px grid system for consistency
 */

export interface SpacingTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  button: {
    paddingX: string;
    paddingY: string;
    gap: string;
  };
  input: {
    paddingX: string;
    paddingY: string;
  };
  card: {
    padding: string;
    gap: string;
  };
  section: {
    marginBottom: string;
    paddingY: string;
  };
  layout: {
    containerPadding: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    gridGap: {
      sm: string;
      md: string;
      lg: string;
    };
    stack: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
  };
}

export const spacing: SpacingTokens = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px
  button: {
    paddingX: '1.5rem',  // 24px - ensures 44px min touch target
    paddingY: '0.75rem', // 12px - ensures 44px min touch target
    gap: '0.5rem'        // 8px between buttons
  },
  input: {
    paddingX: '1rem',    // 16px
    paddingY: '0.75rem'  // 12px
  },
  card: {
    padding: '1.5rem',   // 24px
    gap: '1rem'          // 16px
  },
  section: {
    marginBottom: '3rem', // 48px
    paddingY: '4rem'     // 64px
  },
  layout: {
    containerPadding: {
      mobile: '1rem',    // 16px
      tablet: '1.5rem',  // 24px
      desktop: '2rem'    // 32px
    },
    gridGap: {
      sm: '1rem',        // 16px
      md: '1.5rem',      // 24px
      lg: '2rem'         // 32px
    },
    stack: {
      xs: '0.5rem',      // 8px
      sm: '1rem',        // 16px
      md: '1.5rem',      // 24px
      lg: '2rem'         // 32px
    }
  }
};

/**
 * Scale values for spacing calculations
 */
export const spacingScale = {
  xs: 0.25,
  sm: 0.5,
  md: 1,
  lg: 1.5,
  xl: 2,
  '2xl': 3,
  '3xl': 4,
  '4xl': 6,
  '5xl': 8
};

/**
 * Get spacing value by key
 */
export function getSpacing(key: keyof Omit<SpacingTokens, 'button' | 'input' | 'card' | 'section' | 'layout'>): string {
  const simpleSpacings = {
    none: spacing.none,
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    '2xl': spacing['2xl'],
    '3xl': spacing['3xl'],
    '4xl': spacing['4xl'],
    '5xl': spacing['5xl']
  };
  
  return simpleSpacings[key] || spacing.md;
}

/**
 * Create spacing with multiplier
 */
export function createSpacing(multiplier: number): string {
  return `${multiplier}rem`;
}

/**
 * Create margin shorthand
 */
export function createMargin(
  top?: string | number,
  right?: string | number,
  bottom?: string | number,
  left?: string | number
): string {
  const values = [top, right, bottom, left]
    .filter(v => v !== undefined)
    .map(v => typeof v === 'number' ? `${v}rem` : v);
  
  return values.join(' ');
}

/**
 * Create padding shorthand
 */
export function createPadding(
  top?: string | number,
  right?: string | number,
  bottom?: string | number,
  left?: string | number
): string {
  return createMargin(top, right, bottom, left);
}

/**
 * Create gap for flexbox/grid
 */
export function createGap(gap: string | number, rowGap?: string | number): string {
  if (rowGap !== undefined) {
    const gapValue = typeof gap === 'number' ? `${gap}rem` : gap;
    const rowGapValue = typeof rowGap === 'number' ? `${rowGap}rem` : rowGap;
    return `${rowGapValue} ${gapValue}`;
  }
  return typeof gap === 'number' ? `${gap}rem` : gap;
}

/**
 * Calculate touch target size
 * WCAG requires minimum 44x44px
 */
export function calculateTouchTarget(
  contentHeight: number,
  paddingY: number = 12
): boolean {
  const totalHeight = contentHeight + (paddingY * 2);
  return totalHeight >= 44;
}

/**
 * Create responsive spacing
 */
export function createResponsiveSpacing(baseSpacing: string): {
  mobile: string;
  tablet: string;
  desktop: string;
} {
  const value = parseFloat(baseSpacing);
  const unit = baseSpacing.replace(/[\d.]/g, '');
  
  return {
    mobile: `${value * 0.75}${unit}`,
    tablet: `${value}${unit}`,
    desktop: `${value * 1.25}${unit}`
  };
}

/**
 * Convert spacing to pixels (assuming 1rem = 16px)
 */
export function spacingToPixels(spacing: string): number {
  const value = parseFloat(spacing);
  const unit = spacing.replace(/[\d.]/g, '').trim();
  
  switch (unit) {
    case 'rem':
      return value * 16;
    case 'em':
      return value * 16; // Assuming base font size
    case 'px':
      return value;
    default:
      return 0;
  }
}

// Export spacing utility functions
export const spacingUtils = {
  getSpacing,
  createSpacing,
  createMargin,
  createPadding,
  createGap,
  calculateTouchTarget,
  createResponsiveSpacing,
  spacingToPixels
};