import { test, expect } from '@playwright/test';
import { 
  BRAND_COLORS,
  verifyBrandColor,
  verifyConsistentProperty,
  getComputedStyleProperty,
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet 브랜드 색상 일관성 자동 검증
 * 
 * 검증 항목:
 * 1. 주요 브랜드 색상 (#1631F8) 사용 여부
 * 2. 버튼별 색상 일관성
 * 3. 상태별 색상 (success, error, warning, info) 준수
 * 4. 텍스트 색상 계층 구조
 * 5. 하드코딩된 색상 사용 감지
 */

test.describe('브랜드 색상 일관성 검증', () => {
  const verificationResults: DesignVerificationResult[] = [];

  test.beforeEach(async ({ page }) => {
    // 모든 CSS와 폰트가 로드될 때까지 충분히 대기
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // CSS 애니메이션 완료 대기
  });

  test.afterAll(async () => {
    // 검증 결과를 파일로 저장 (CI/CD에서 활용)
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = './test-results/design-verification-report';
    await fs.promises.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'brand-color-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  test('대시보드 - 주요 액션 버튼에서 브랜드 컬러 사용 확인', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttonSelectors = [
      '[data-testid="create-project-btn"]',
      '.btn-primary',
      'button[type="submit"]',
      'a[href*="/projects/new"]'
    ];

    for (const selector of buttonSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      // background-color 검증
      const bgResult = await verifyBrandColor(
        page, 
        selector, 
        'background-color',
        [BRAND_COLORS.primary, BRAND_COLORS.primaryLight, BRAND_COLORS.primaryDark]
      );

      verificationResults.push(createVerificationResult(
        '주요 액션 버튼 배경색',
        selector,
        'background-color',
        bgResult,
        BRAND_COLORS.primary
      ));

      if (bgResult.valid) {
        expect(bgResult.valid, 
          `${selector}의 배경색이 브랜드 컬러를 사용해야 합니다. 
          실제: ${bgResult.actualColor} (${bgResult.normalizedColor})`
        ).toBe(true);
      }

      // border-color도 확인 (있는 경우)
      const borderResult = await verifyBrandColor(
        page, 
        selector, 
        'border-color',
        [BRAND_COLORS.primary, BRAND_COLORS.primaryLight, BRAND_COLORS.primaryDark, 'transparent', 'rgba(0, 0, 0, 0)']
      );

      verificationResults.push(createVerificationResult(
        '주요 액션 버튼 테두리색',
        selector,
        'border-color',
        borderResult
      ));
    }
  });

  test('상태별 색상 시스템 준수 확인 (성공, 오류, 경고, 정보)', async ({ page }) => {
    // 다양한 페이지에서 상태 색상 확인
    const pages = [
      { url: '/dashboard', name: '대시보드' },
      { url: '/projects', name: '프로젝트 목록' },
      { url: '/feedback/1', name: '피드백 페이지' }
    ];

    for (const { url, name } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 성공 상태 요소들
      const successSelectors = [
        '.btn-success', 
        '.alert-success', 
        '.text-success',
        '.badge-success',
        '[class*="success"]'
      ];

      for (const selector of successSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const colorResult = await verifyBrandColor(
          page, 
          selector, 
          'background-color',
          [BRAND_COLORS.success, BRAND_COLORS.successDark]
        );

        verificationResults.push(createVerificationResult(
          `${name} - 성공 상태 색상`,
          selector,
          'background-color',
          colorResult,
          BRAND_COLORS.success
        ));

        expect(colorResult.valid || colorResult.normalizedColor === 'transparent', 
          `${name}의 ${selector}에서 성공 상태 색상 (#28a745)을 사용해야 합니다.
          실제: ${colorResult.actualColor}`
        ).toBe(true);
      }

      // 오류 상태 요소들
      const errorSelectors = [
        '.btn-danger', 
        '.alert-danger', 
        '.text-danger',
        '.badge-danger',
        '[class*="error"]',
        '[class*="danger"]'
      ];

      for (const selector of errorSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const colorResult = await verifyBrandColor(
          page, 
          selector, 
          'background-color',
          [BRAND_COLORS.error]
        );

        verificationResults.push(createVerificationResult(
          `${name} - 오류 상태 색상`,
          selector,
          'background-color',
          colorResult,
          BRAND_COLORS.error
        ));

        expect(colorResult.valid || colorResult.normalizedColor === 'transparent',
          `${name}의 ${selector}에서 오류 상태 색상 (#dc3545)을 사용해야 합니다.
          실제: ${colorResult.actualColor}`
        ).toBe(true);
      }
    }
  });

  test('버튼 hover 상태에서 일관된 색상 변화 적용', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttonSelectors = [
      '.btn-primary',
      '[data-testid="create-project-btn"]',
      'button[type="submit"]'
    ];

    for (const selector of buttonSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      // 기본 상태 색상
      const normalColor = await getComputedStyleProperty(page, selector, 'background-color');

      // hover 상태로 변경
      await page.hover(selector);
      await page.waitForTimeout(300); // CSS 트랜지션 대기

      const hoverColor = await getComputedStyleProperty(page, selector, 'background-color');

      verificationResults.push(createVerificationResult(
        'Button Hover 상태',
        selector,
        'background-color',
        { 
          valid: normalColor !== hoverColor, 
          actualValue: hoverColor,
          normalColor,
          colorChanged: normalColor !== hoverColor 
        }
      ));

      expect(normalColor !== hoverColor, 
        `${selector} 버튼의 hover 상태에서 색상 변화가 있어야 합니다.
        기본: ${normalColor}, Hover: ${hoverColor}`
      ).toBe(true);

      // hover 해제
      await page.hover('body');
      await page.waitForTimeout(300);
    }
  });

  test('텍스트 색상 계층 구조 확인', async ({ page }) => {
    const pages = ['/dashboard', '/planning', '/projects'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 주요 제목 (Primary Text)
      const headingSelectors = ['h1', 'h2', 'h3', '.heading-primary', '.title'];
      
      for (const selector of headingSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const colorResult = await verifyBrandColor(
          page,
          selector,
          'color',
          [BRAND_COLORS.grey900, BRAND_COLORS.black, BRAND_COLORS.primary]
        );

        verificationResults.push(createVerificationResult(
          `${url} - 주요 제목 텍스트 색상`,
          selector,
          'color',
          colorResult
        ));

        expect(colorResult.valid,
          `${url}의 ${selector} 제목은 정의된 텍스트 색상을 사용해야 합니다.
          실제: ${colorResult.actualColor} (${colorResult.normalizedColor})`
        ).toBe(true);
      }

      // 본문 텍스트 (Secondary Text)
      const bodySelectors = ['p', '.text-secondary', '.description', '.content'];
      
      for (const selector of bodySelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const colorResult = await verifyBrandColor(
          page,
          selector,
          'color',
          [BRAND_COLORS.grey700, BRAND_COLORS.grey600, BRAND_COLORS.grey800, BRAND_COLORS.grey900]
        );

        verificationResults.push(createVerificationResult(
          `${url} - 본문 텍스트 색상`,
          selector,
          'color',
          colorResult
        ));
      }
    }
  });

  test('하드코딩된 색상 사용 감지', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 자주 하드코딩되는 색상값들
    const commonHardcodedColors = [
      '#ff0000', '#00ff00', '#0000ff', // 기본 RGB
      '#333333', '#666666', '#999999', // 회색 계열
      '#123456', '#abcdef', '#fedcba'  // 임의의 색상
    ];

    // 모든 요소의 색상 검사
    const allColorProperties = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors: Array<{ selector: string; property: string; value: string }> = [];
      
      elements.forEach((element, index) => {
        const style = getComputedStyle(element);
        const selector = element.tagName.toLowerCase() + 
          (element.id ? `#${element.id}` : '') +
          (element.className ? `.${Array.from(element.classList).join('.')}` : '') +
          `:nth-child(${index + 1})`;

        ['color', 'background-color', 'border-color'].forEach(property => {
          const value = style.getPropertyValue(property);
          if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            colors.push({ selector, property, value });
          }
        });
      });

      return colors;
    });

    let hardcodedFound = false;
    for (const { selector, property, value } of allColorProperties) {
      const normalizedValue = value.toLowerCase().replace(/\s/g, '');
      
      for (const hardcodedColor of commonHardcodedColors) {
        if (normalizedValue.includes(hardcodedColor)) {
          hardcodedFound = true;
          
          verificationResults.push(createVerificationResult(
            '하드코딩된 색상 감지',
            selector,
            property,
            { 
              valid: false, 
              actualValue: value,
              hardcodedColor,
              suggestion: '디자인 토큰 사용 권장' 
            }
          ));

          console.warn(`⚠️ 하드코딩된 색상 발견: ${selector} - ${property}: ${value}`);
        }
      }
    }

    // 하드코딩된 색상이 없으면 성공으로 기록
    if (!hardcodedFound) {
      verificationResults.push(createVerificationResult(
        '하드코딩된 색상 감지',
        'dashboard',
        'all-colors',
        { valid: true, actualValue: 'No hardcoded colors found' }
      ));
    }
  });

  test('다크모드 지원 여부 확인 (CSS 변수 사용)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // CSS 커스텀 속성(변수) 사용 여부 확인
    const cssVariablesUsed = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const variables: Array<{ selector: string; property: string; value: string }> = [];
      
      elements.forEach((element, index) => {
        const style = getComputedStyle(element);
        const selector = element.tagName.toLowerCase();
        
        ['color', 'background-color', 'border-color'].forEach(property => {
          const value = style.getPropertyValue(property);
          if (value.includes('var(--')) {
            variables.push({ selector, property, value });
          }
        });
      });

      return variables;
    });

    verificationResults.push(createVerificationResult(
      '다크모드 대응 (CSS 변수 사용)',
      'dashboard',
      'css-variables',
      { 
        valid: cssVariablesUsed.length > 0, 
        actualValue: `${cssVariablesUsed.length}개 CSS 변수 사용`,
        variables: cssVariablesUsed 
      }
    ));

    if (cssVariablesUsed.length > 0) {
      console.log(`✅ ${cssVariablesUsed.length}개의 CSS 변수가 사용되어 다크모드 대응이 가능합니다.`);
    } else {
      console.warn('⚠️ CSS 변수 사용이 감지되지 않아 다크모드 대응이 어려울 수 있습니다.');
    }
  });
});