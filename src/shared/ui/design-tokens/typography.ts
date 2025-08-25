/**
 * Typography Design Tokens for VideoPlanet
 * Ensuring readability and accessibility
 */

export interface TypographyVariant {
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: string;
  fontFamily?: string;
}

export interface TypographyTokens {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
  variants: {
    h1: TypographyVariant;
    h2: TypographyVariant;
    h3: TypographyVariant;
    h4: TypographyVariant;
    h5: TypographyVariant;
    h6: TypographyVariant;
    body1: TypographyVariant;
    body2: TypographyVariant;
    button: TypographyVariant;
    caption: TypographyVariant;
    overline: TypographyVariant;
  };
  responsive: {
    scale: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
}

export const typography: TypographyTokens = {
  fontFamily: {
    primary: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    monospace: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", monospace'
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem'     // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  },
  variants: {
    h1: {
      fontSize: '3rem',      // 48px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em'
    },
    h2: {
      fontSize: '2.25rem',   // 36px
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.005em'
    },
    h3: {
      fontSize: '1.875rem',  // 30px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '0'
    },
    h4: {
      fontSize: '1.5rem',    // 24px
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '0'
    },
    h5: {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0'
    },
    h6: {
      fontSize: '1.125rem',  // 18px
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: '0'
    },
    body1: {
      fontSize: '1rem',      // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0'
    },
    body2: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0'
    },
    button: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.025em'
    },
    caption: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em'
    },
    overline: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.1em'
    }
  },
  responsive: {
    scale: {
      mobile: 0.875,    // 87.5% of base size
      tablet: 1,        // 100% of base size
      desktop: 1.125    // 112.5% of base size
    }
  }
};

/**
 * Get font size by key
 */
export function getFontSize(size: keyof typeof typography.fontSize): string {
  return typography.fontSize[size] || typography.fontSize.base;
}

/**
 * Get line height by key
 */
export function getLineHeight(height: keyof typeof typography.lineHeight): number {
  return typography.lineHeight[height] || typography.lineHeight.normal;
}

/**
 * Get font weight by key
 */
export function getFontWeight(weight: keyof typeof typography.fontWeight): number {
  return typography.fontWeight[weight] || typography.fontWeight.normal;
}

/**
 * Get typography variant
 */
export function getVariant(variant: keyof typeof typography.variants): TypographyVariant {
  return typography.variants[variant];
}

/**
 * Create responsive font size
 */
export function createResponsiveFontSize(baseSize: string): {
  mobile: string;
  tablet: string;
  desktop: string;
} {
  const size = parseFloat(baseSize);
  const unit = baseSize.replace(/[\d.]/g, '');
  
  return {
    mobile: `${size * typography.responsive.scale.mobile}${unit}`,
    tablet: `${size * typography.responsive.scale.tablet}${unit}`,
    desktop: `${size * typography.responsive.scale.desktop}${unit}`
  };
}

/**
 * Calculate reading time based on word count
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 225;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create CSS font shorthand
 */
export function createFontShorthand(variant: TypographyVariant): string {
  const { fontSize, fontWeight, lineHeight, fontFamily } = variant;
  const family = fontFamily || typography.fontFamily.primary;
  return `${fontWeight} ${fontSize}/${lineHeight} ${family}`;
}

// Export typography utility functions
export const typographyUtils = {
  getFontSize,
  getLineHeight,
  getFontWeight,
  getVariant,
  createResponsiveFontSize,
  calculateReadingTime,
  truncateText,
  createFontShorthand
};