import { test, expect } from '@playwright/test';
import { 
  SPACING_TOKENS,
  FONT_SIZE_TOKENS,
  verifySpacingToken,
  verifyFontSizeToken,
  verifyConsistentProperty,
  getComputedStyleProperty,
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet 간격 시스템 및 타이포그래피 일관성 검증
 * 
 * 검증 항목:
 * 1. 간격 토큰 (margin, padding) 준수
 * 2. 폰트 크기 토큰 사용 
 * 3. 버튼 간격 일관성
 * 4. 카드 컴포넌트 내부 간격
 * 5. 타이포그래피 계층 구조
 * 6. 행간(line-height) 일관성
 */

test.describe('간격 시스템 및 타이포그래피 검증', () => {
  const verificationResults: DesignVerificationResult[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = './test-results/design-verification-report';
    await fs.promises.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'spacing-typography-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  test('대시보드 - 버튼 패딩 간격 토큰 준수 확인', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttonSelectors = [
      '.btn-primary',
      '.btn-secondary', 
      '.btn-success',
      '.btn-danger',
      'button[type="submit"]',
      '[data-testid="create-project-btn"]'
    ];

    for (const selector of buttonSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      // 좌우 패딩 검증 (예상: 24px = $spacing-lg)
      const paddingLeftResult = await verifySpacingToken(page, selector, 'padding-left');
      const paddingRightResult = await verifySpacingToken(page, selector, 'padding-right');

      verificationResults.push(createVerificationResult(
        '버튼 좌측 패딩',
        selector,
        'padding-left',
        paddingLeftResult,
        '24px (lg)'
      ));

      verificationResults.push(createVerificationResult(
        '버튼 우측 패딩',
        selector,
        'padding-right',
        paddingRightResult,
        '24px (lg)'
      ));

      // 상하 패딩 검증 (예상: 12px = 0.75rem)
      const paddingTopResult = await verifySpacingToken(page, selector, 'padding-top');
      const paddingBottomResult = await verifySpacingToken(page, selector, 'padding-bottom');

      verificationResults.push(createVerificationResult(
        '버튼 상단 패딩',
        selector,
        'padding-top',
        paddingTopResult,
        '12px'
      ));

      // 적어도 하나의 축(가로 또는 세로)에서 토큰을 사용하고 있는지 확인
      const hasValidSpacing = paddingLeftResult.valid || paddingTopResult.valid;
      
      expect(hasValidSpacing,
        `${selector} 버튼의 패딩이 간격 토큰을 사용해야 합니다.
        좌우: ${paddingLeftResult.actualValue} (토큰: ${paddingLeftResult.matchedToken || 'none'})
        상하: ${paddingTopResult.actualValue} (토큰: ${paddingTopResult.matchedToken || 'none'})`
      ).toBe(true);
    }
  });

  test('카드 컴포넌트 내부 간격 일관성 확인', async ({ page }) => {
    const pages = [
      { url: '/dashboard', cardSelectors: ['.card', '.project-card', '.stats-card'] },
      { url: '/projects', cardSelectors: ['.project-item', '.card', '.project-card'] }
    ];

    for (const { url, cardSelectors } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      for (const cardSelector of cardSelectors) {
        const elements = await page.$$(cardSelector);
        if (elements.length === 0) continue;

        // 카드 내부 패딩 검증
        const paddingResult = await verifySpacingToken(page, cardSelector, 'padding');
        
        // padding 속성이 shorthand인 경우 개별 속성들도 확인
        if (!paddingResult.valid) {
          const paddingTop = await verifySpacingToken(page, cardSelector, 'padding-top');
          const paddingLeft = await verifySpacingToken(page, cardSelector, 'padding-left');
          
          verificationResults.push(createVerificationResult(
            `${url} - 카드 패딩`,
            cardSelector,
            'padding',
            { 
              valid: paddingTop.valid && paddingLeft.valid,
              actualValue: `${paddingTop.actualValue} ${paddingLeft.actualValue}`,
              topToken: paddingTop.matchedToken,
              leftToken: paddingLeft.matchedToken
            },
            '24px (lg) 또는 16px (md)'
          ));
        } else {
          verificationResults.push(createVerificationResult(
            `${url} - 카드 패딩`,
            cardSelector,
            'padding',
            paddingResult,
            '24px (lg)'
          ));
        }

        // 카드 간격 (margin-bottom) 확인
        const marginBottomResult = await verifySpacingToken(page, cardSelector, 'margin-bottom');
        
        verificationResults.push(createVerificationResult(
          `${url} - 카드 간격`,
          cardSelector,
          'margin-bottom',
          marginBottomResult,
          '16px (md) 또는 24px (lg)'
        ));
      }
    }
  });

  test('타이포그래피 계층 구조 - 폰트 크기 토큰 사용 확인', async ({ page }) => {
    const pages = ['/dashboard', '/planning', '/projects', '/feedback/1'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // H1 제목 (가장 큰 폰트)
      const h1Elements = await page.$$('h1, .h1, .heading-1');
      for (let i = 0; i < Math.min(h1Elements.length, 3); i++) {
        const selector = `h1:nth-of-type(${i + 1})`;
        if (await page.$(selector)) {
          const fontSizeResult = await verifyFontSizeToken(page, selector);
          
          verificationResults.push(createVerificationResult(
            `${url} - H1 폰트 크기`,
            selector,
            'font-size',
            fontSizeResult,
            '36px (4xl) 또는 30px (3xl)'
          ));

          expect(fontSizeResult.valid || fontSizeResult.pixelValue >= 24,
            `${url}의 H1 제목은 큰 폰트 크기를 사용해야 합니다.
            실제: ${fontSizeResult.actualValue} (토큰: ${fontSizeResult.matchedToken || 'none'})`
          ).toBe(true);
        }
      }

      // H2, H3 제목
      const headingSelectors = ['h2', 'h3', '.h2', '.h3', '.heading-2', '.heading-3'];
      for (const selector of headingSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const fontSizeResult = await verifyFontSizeToken(page, selector);
        
        verificationResults.push(createVerificationResult(
          `${url} - ${selector.toUpperCase()} 폰트 크기`,
          selector,
          'font-size',
          fontSizeResult,
          '18px (lg) ~ 24px (2xl)'
        ));
      }

      // 본문 텍스트
      const bodySelectors = ['p', '.text-body', '.content', 'span', '.description'];
      for (const selector of bodySelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const fontSizeResult = await verifyFontSizeToken(page, selector);
        
        verificationResults.push(createVerificationResult(
          `${url} - 본문 텍스트 폰트 크기`,
          selector,
          'font-size',
          fontSizeResult,
          '16px (base) 또는 14px (sm)'
        ));
      }
    }
  });

  test('행간(line-height) 일관성 확인', async ({ page }) => {
    const pages = ['/dashboard', '/planning'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 제목의 행간 (보통 1.2-1.4)
      const headingSelectors = ['h1', 'h2', 'h3'];
      const headingLineHeights: string[] = [];

      for (const selector of headingSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const lineHeight = await getComputedStyleProperty(page, selector, 'line-height');
        headingLineHeights.push(lineHeight);

        verificationResults.push(createVerificationResult(
          `${url} - ${selector.toUpperCase()} 행간`,
          selector,
          'line-height',
          { 
            valid: parseFloat(lineHeight) >= 1.2 && parseFloat(lineHeight) <= 1.5,
            actualValue: lineHeight 
          },
          '1.2 ~ 1.5'
        ));
      }

      // 본문의 행간 (보통 1.4-1.6)
      const bodySelectors = ['p', '.content', '.description'];
      const bodyLineHeights: string[] = [];

      for (const selector of bodySelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const lineHeight = await getComputedStyleProperty(page, selector, 'line-height');
        bodyLineHeights.push(lineHeight);

        verificationResults.push(createVerificationResult(
          `${url} - 본문 행간`,
          selector,
          'line-height',
          { 
            valid: parseFloat(lineHeight) >= 1.4 && parseFloat(lineHeight) <= 1.7,
            actualValue: lineHeight 
          },
          '1.4 ~ 1.7'
        ));
      }
    }
  });

  test('버튼 간격 일관성 - 동일한 컨테이너 내 버튼들', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 버튼 그룹이 있는 컨테이너들 찾기
    const buttonContainers = await page.$$('.btn-group, .button-group, .actions, .form-actions, [class*="button"]');

    for (let i = 0; i < buttonContainers.length; i++) {
      const containerSelector = `.btn-group:nth-of-type(${i + 1})`;
      const buttons = await page.$$(`${containerSelector} button, ${containerSelector} .btn`);

      if (buttons.length < 2) continue; // 버튼이 2개 이상일 때만 검증

      // 첫 번째 버튼을 기준으로 간격 일관성 확인
      const firstButtonMargin = await getComputedStyleProperty(
        page, 
        `${containerSelector} button:first-child`, 
        'margin-right'
      );

      const consistencyResult = await verifyConsistentProperty(
        page,
        Array.from({ length: buttons.length - 1 }, (_, i) => 
          `${containerSelector} button:nth-child(${i + 1})`
        ),
        'margin-right'
      );

      verificationResults.push(createVerificationResult(
        '버튼 그룹 간격 일관성',
        containerSelector,
        'margin-right',
        consistencyResult,
        firstButtonMargin
      ));

      expect(consistencyResult.consistent,
        `${containerSelector} 내 버튼들의 간격이 일관되어야 합니다.
        감지된 값들: ${JSON.stringify(consistencyResult.values)}`
      ).toBe(true);
    }
  });

  test('모바일 반응형 - 간격 조정 확인', async ({ page }) => {
    // 데스크톱 기준 간격 측정
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    const containerSelector = '.container, .main-content, .dashboard-content';
    const elements = await page.$$(containerSelector);
    
    if (elements.length === 0) return;

    const desktopPadding = await getComputedStyleProperty(
      page, 
      containerSelector, 
      'padding-left'
    );

    // 모바일로 변경
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500); // CSS 적용 대기

    const mobilePadding = await getComputedStyleProperty(
      page, 
      containerSelector, 
      'padding-left'
    );

    verificationResults.push(createVerificationResult(
      '모바일 반응형 간격',
      containerSelector,
      'padding-left',
      { 
        valid: parseFloat(mobilePadding) < parseFloat(desktopPadding),
        actualValue: mobilePadding,
        desktopValue: desktopPadding,
        reduced: parseFloat(mobilePadding) < parseFloat(desktopPadding)
      },
      '데스크톱보다 작은 간격'
    ));

    expect(parseFloat(mobilePadding) <= parseFloat(desktopPadding),
      `모바일에서는 간격이 줄어들어야 합니다.
      데스크톱: ${desktopPadding}, 모바일: ${mobilePadding}`
    ).toBe(true);

    // 태블릿 사이즈도 확인
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletPadding = await getComputedStyleProperty(
      page, 
      containerSelector, 
      'padding-left'
    );

    verificationResults.push(createVerificationResult(
      '태블릿 반응형 간격',
      containerSelector,
      'padding-left',
      { 
        valid: parseFloat(mobilePadding) <= parseFloat(tabletPadding) && parseFloat(tabletPadding) <= parseFloat(desktopPadding),
        actualValue: tabletPadding,
        mobileValue: mobilePadding,
        desktopValue: desktopPadding
      },
      '모바일과 데스크톱 사이 값'
    ));
  });

  test('텍스트 단락 간격 - 읽기 편의성 확인', async ({ page }) => {
    const pages = ['/planning', '/projects'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 문단 간격 확인
      const paragraphSelectors = ['p + p', '.content p + p', '.description p + p'];

      for (const selector of paragraphSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const marginTopResult = await verifySpacingToken(page, selector, 'margin-top');

        verificationResults.push(createVerificationResult(
          `${url} - 문단 간격`,
          selector,
          'margin-top',
          marginTopResult,
          '16px (md) 또는 24px (lg)'
        ));

        // 최소 간격 확보 여부 확인 (읽기 편의성)
        expect(marginTopResult.pixelValue >= 8,
          `${url}의 문단 간격이 최소 8px 이상이어야 합니다.
          실제: ${marginTopResult.actualValue} (${marginTopResult.pixelValue}px)`
        ).toBe(true);
      }
    }
  });
});