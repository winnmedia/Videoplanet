/**
 * Color Design Tokens for VideoPlanet
 * Following WCAG AA accessibility standards
 */

export interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface ColorTokens {
  primary: ColorPalette;
  secondary: ColorPalette;
  error: ColorPalette;
  warning: ColorPalette;
  info: ColorPalette;
  success: ColorPalette;
  grey: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  background: {
    default: string;
    paper: string;
    elevation1: string;
    elevation2: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
  divider: string;
  action: {
    active: string;
    hover: string;
    selected: string;
    disabled: string;
    disabledBackground: string;
  };
}

export const colors: ColorTokens = {
  primary: {
    main: '#1631F8',
    light: '#4A5BF9',
    dark: '#0F23C5',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#6C757D',
    light: '#8B949C',
    dark: '#4D565E',
    contrastText: '#FFFFFF'
  },
  error: {
    main: '#dc3545',
    light: '#E55763',
    dark: '#B02A37',
    contrastText: '#FFFFFF'
  },
  warning: {
    main: '#ffc107',
    light: '#FFCD38',
    dark: '#E6AC00',
    contrastText: '#000000'
  },
  info: {
    main: '#17a2b8',
    light: '#3AB5C9',
    dark: '#128293',
    contrastText: '#FFFFFF'
  },
  success: {
    main: '#1E7E34',  // Darker green for better contrast
    light: '#28a745',
    dark: '#155724',
    contrastText: '#FFFFFF'
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
    elevation1: '#FAFAFA',
    elevation2: '#F5F5F5'
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#9E9E9E',
    hint: '#BDBDBD'
  },
  divider: '#E0E0E0',
  action: {
    active: '#1631F8',
    hover: 'rgba(22, 49, 248, 0.08)',
    selected: 'rgba(22, 49, 248, 0.12)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)'
  }
};

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(channel => {
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground: string, background: string): number {
  const lumForeground = getLuminance(foreground);
  const lumBackground = getLuminance(background);
  
  const lighter = Math.max(lumForeground, lumBackground);
  const darker = Math.min(lumForeground, lumBackground);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet WCAG AA accessibility standards
 */
export function isAccessible(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = largeText ? 3 : 4.5;
  return ratio >= threshold;
}

/**
 * Get the appropriate text color for a given background
 */
export function getTextColorOnBackground(background: string): string {
  const whiteContrast = getContrastRatio('#FFFFFF', background);
  const blackContrast = getContrastRatio('#000000', background);
  
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Darken a color by a percentage
 */
export function darken(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 - amount;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Lighten a color by a percentage
 */
export function lighten(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Add transparency to a color
 */
export function alpha(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

// Export color utility functions
export const colorUtils = {
  getContrastRatio,
  isAccessible,
  getTextColorOnBackground,
  darken,
  lighten,
  alpha
};