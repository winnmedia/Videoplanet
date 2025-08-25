import { Page } from '@playwright/test';

/**
 * 디자인 토큰 검증을 위한 헬퍼 함수 모음
 * VideoPlanet 브랜드 가이드라인 자동 검증
 */

// 브랜드 색상 정의 (design-tokens.scss와 동일)
export const BRAND_COLORS = {
  primary: '#1631f8',
  primaryLight: '#4a5bf9',
  primaryDark: '#0f23c5',
  secondary: '#6c757d',
  success: '#28a745',
  successDark: '#1e7e34',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  white: '#ffffff',
  black: '#000000',
  grey50: '#fafafa',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121'
} as const;

// 간격 시스템 (rem 기준)
export const SPACING_TOKENS = {
  none: 0,
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem  
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  '2xl': 48, // 3rem
  '3xl': 64, // 4rem
  '4xl': 96, // 6rem
  '5xl': 128 // 8rem
} as const;

// 폰트 크기 (px 기준)
export const FONT_SIZE_TOKENS = {
  xs: 12,   // 0.75rem
  sm: 14,   // 0.875rem
  base: 16, // 1rem
  lg: 18,   // 1.125rem
  xl: 20,   // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 30, // 1.875rem
  '4xl': 36, // 2.25rem
  '5xl': 48  // 3rem
} as const;

// z-index 레이어 시스템
export const Z_INDEX_TOKENS = {
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080
} as const;

/**
 * RGB 값을 hex 색상으로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16).padStart(2, '0');
    return hex;
  }).join('')}`;
}

/**
 * CSS 색상 값을 hex로 정규화 (rgb(), rgba(), hsl() 등 지원)
 */
export function normalizeColor(color: string): string {
  // 이미 hex인 경우
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }
  
  // rgb() 또는 rgba() 형식
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
  }
  
  // 기본적으로 소문자 변환
  return color.toLowerCase().trim();
}

/**
 * 요소의 계산된 스타일에서 특정 CSS 속성 값 추출
 */
export async function getComputedStyleProperty(
  page: Page, 
  selector: string, 
  property: string
): Promise<string> {
  return await page.evaluate(
    ({ selector, property }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      const style = getComputedStyle(element);
      return style.getPropertyValue(property).trim();
    },
    { selector, property }
  );
}

/**
 * 여러 요소의 동일 속성이 일관되게 적용되었는지 검증
 */
export async function verifyConsistentProperty(
  page: Page,
  selectors: string[],
  property: string,
  expectedValue?: string
): Promise<{
  consistent: boolean;
  values: Record<string, string>;
  expectedValue?: string;
}> {
  const values: Record<string, string> = {};
  
  for (const selector of selectors) {
    try {
      values[selector] = await getComputedStyleProperty(page, selector, property);
    } catch (error) {
      values[selector] = `ERROR: ${error.message}`;
    }
  }
  
  const uniqueValues = [...new Set(Object.values(values))];
  const consistent = uniqueValues.length === 1 && !uniqueValues[0].startsWith('ERROR');
  
  return {
    consistent,
    values,
    expectedValue: expectedValue || uniqueValues[0]
  };
}

/**
 * 브랜드 색상 사용 여부 검증
 */
export async function verifyBrandColor(
  page: Page,
  selector: string,
  property: 'color' | 'background-color' | 'border-color',
  allowedColors?: string[]
): Promise<{
  valid: boolean;
  actualColor: string;
  normalizedColor: string;
  matchedBrandColor?: string;
}> {
  const actualColor = await getComputedStyleProperty(page, selector, property);
  const normalizedColor = normalizeColor(actualColor);
  
  const brandColorValues = Object.values(BRAND_COLORS);
  const allowedColorValues = allowedColors || brandColorValues;
  
  const matchedBrandColor = Object.entries(BRAND_COLORS).find(
    ([, value]) => value === normalizedColor
  )?.[0];
  
  const valid = allowedColorValues.includes(normalizedColor);
  
  return {
    valid,
    actualColor,
    normalizedColor,
    matchedBrandColor
  };
}

/**
 * 간격(margin, padding) 토큰 사용 여부 검증
 */
export async function verifySpacingToken(
  page: Page,
  selector: string,
  property: string
): Promise<{
  valid: boolean;
  actualValue: string;
  pixelValue: number;
  matchedToken?: string;
}> {
  const actualValue = await getComputedStyleProperty(page, selector, property);
  const pixelMatch = actualValue.match(/^(\d+(?:\.\d+)?)px$/);
  
  if (!pixelMatch) {
    return {
      valid: false,
      actualValue,
      pixelValue: 0
    };
  }
  
  const pixelValue = parseFloat(pixelMatch[1]);
  const matchedToken = Object.entries(SPACING_TOKENS).find(
    ([, value]) => Math.abs(value - pixelValue) < 0.5 // 0.5px 오차 허용
  )?.[0];
  
  return {
    valid: !!matchedToken,
    actualValue,
    pixelValue,
    matchedToken
  };
}

/**
 * 폰트 크기 토큰 사용 여부 검증
 */
export async function verifyFontSizeToken(
  page: Page,
  selector: string
): Promise<{
  valid: boolean;
  actualValue: string;
  pixelValue: number;
  matchedToken?: string;
}> {
  const actualValue = await getComputedStyleProperty(page, selector, 'font-size');
  const pixelMatch = actualValue.match(/^(\d+(?:\.\d+)?)px$/);
  
  if (!pixelMatch) {
    return {
      valid: false,
      actualValue,
      pixelValue: 0
    };
  }
  
  const pixelValue = parseFloat(pixelMatch[1]);
  const matchedToken = Object.entries(FONT_SIZE_TOKENS).find(
    ([, value]) => Math.abs(value - pixelValue) < 0.5
  )?.[0];
  
  return {
    valid: !!matchedToken,
    actualValue,
    pixelValue,
    matchedToken
  };
}

/**
 * z-index 레이어 시스템 준수 여부 검증
 */
export async function verifyZIndexLayer(
  page: Page,
  selector: string,
  expectedLayer?: keyof typeof Z_INDEX_TOKENS
): Promise<{
  valid: boolean;
  actualValue: string;
  zIndexValue: number;
  matchedLayer?: string;
  expectedLayer?: string;
}> {
  const actualValue = await getComputedStyleProperty(page, selector, 'z-index');
  const zIndexValue = parseInt(actualValue) || 0;
  
  const matchedLayer = Object.entries(Z_INDEX_TOKENS).find(
    ([, value]) => value === zIndexValue
  )?.[0];
  
  const valid = expectedLayer 
    ? Z_INDEX_TOKENS[expectedLayer] === zIndexValue
    : !!matchedLayer;
  
  return {
    valid,
    actualValue,
    zIndexValue,
    matchedLayer,
    expectedLayer
  };
}

/**
 * 요소가 화면에 실제로 보이는지 확인 (opacity, visibility, display 고려)
 */
export async function isElementVisuallyVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  return await page.evaluate((selector) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return false;
    
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return (
      style.opacity !== '0' &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }, selector);
}

/**
 * 요소의 접근성 속성 검증
 */
export async function verifyAccessibilityAttributes(
  page: Page,
  selector: string,
  requiredAttributes: string[] = []
): Promise<{
  valid: boolean;
  missingAttributes: string[];
  presentAttributes: Record<string, string>;
}> {
  const attributes = await page.evaluate(
    ({ selector, requiredAttributes }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      
      const result: Record<string, string> = {};
      const missing: string[] = [];
      
      for (const attr of requiredAttributes) {
        const value = element.getAttribute(attr);
        if (value !== null) {
          result[attr] = value;
        } else {
          missing.push(attr);
        }
      }
      
      return { presentAttributes: result, missingAttributes: missing };
    },
    { selector, requiredAttributes }
  );
  
  return {
    valid: attributes.missingAttributes.length === 0,
    missingAttributes: attributes.missingAttributes,
    presentAttributes: attributes.presentAttributes
  };
}

/**
 * 디자인 검증 결과 정리를 위한 타입 정의
 */
export interface DesignVerificationResult {
  testName: string;
  selector: string;
  property: string;
  expectedValue?: string;
  actualValue: string;
  valid: boolean;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * 검증 결과 생성 헬퍼
 */
export function createVerificationResult(
  testName: string,
  selector: string,
  property: string,
  result: { valid: boolean; actualValue?: string; [key: string]: any },
  expectedValue?: string
): DesignVerificationResult {
  return {
    testName,
    selector,
    property,
    expectedValue,
    actualValue: result.actualValue || 'N/A',
    valid: result.valid,
    details: { ...result, actualValue: undefined }, // actualValue 제외한 나머지 정보
    timestamp: new Date().toISOString()
  };
}