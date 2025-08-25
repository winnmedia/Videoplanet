import { test, expect } from '@playwright/test';
import { 
  getComputedStyleProperty,
  isElementVisuallyVisible,
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet 반응형 디자인 검증
 * 
 * 검증 항목:
 * 1. 뷰포트별 레이아웃 적응성
 * 2. 모바일 네비게이션 (햄버거 메뉴) 동작
 * 3. 터치 인터랙션 대응
 * 4. 컨테이너 폭 조정
 * 5. 폰트 크기 반응형 조정
 * 6. 이미지/미디어 반응형 처리
 */

test.describe('반응형 디자인 검증', () => {
  const verificationResults: DesignVerificationResult[] = [];

  // 테스트할 뷰포트 크기들
  const viewports = {
    mobile: { width: 390, height: 844, name: '모바일 (iPhone 14)' },
    tablet: { width: 768, height: 1024, name: '태블릿 (iPad)' },
    desktop: { width: 1920, height: 1080, name: '데스크톱' },
    ultrawide: { width: 2560, height: 1440, name: '울트라와이드' }
  };

  test.afterAll(async () => {
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = './test-results/design-verification-report';
    await fs.promises.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'responsive-design-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  test('대시보드 - 뷰포트별 컨테이너 폭 적응', async ({ page }) => {
    const containerSelectors = [
      '.container', 
      '.main-content', 
      '.dashboard-content',
      '[class*="container"]'
    ];

    for (const [viewportName, { width, height, name }] of Object.entries(viewports)) {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      for (const selector of containerSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        // 컨테이너 실제 폭 측정
        const containerWidth = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (!element) return 0;
          const rect = element.getBoundingClientRect();
          return rect.width;
        }, selector);

        // 뷰포트 대비 적절한 폭 사용 여부 확인
        const widthRatio = containerWidth / width;
        const isAppropriateWidth = 
          (viewportName === 'mobile' && widthRatio > 0.85) || // 모바일: 85% 이상
          (viewportName === 'tablet' && widthRatio > 0.7) ||   // 태블릿: 70% 이상
          (viewportName === 'desktop' && widthRatio < 0.9);    // 데스크톱: 90% 이하

        verificationResults.push(createVerificationResult(
          `${name} - 컨테이너 폭 적응`,
          selector,
          'width',
          { 
            valid: isAppropriateWidth,
            actualValue: `${containerWidth}px`,
            widthRatio: widthRatio,
            viewportWidth: width
          },
          viewportName === 'mobile' ? '85% 이상' : viewportName === 'tablet' ? '70% 이상' : '90% 이하'
        ));

        expect(isAppropriateWidth,
          `${name}에서 ${selector}의 폭이 적절하지 않습니다.
          컨테이너 폭: ${containerWidth}px, 뷰포트 폭: ${width}px, 비율: ${(widthRatio * 100).toFixed(1)}%`
        ).toBe(true);
      }
    }
  });

  test('사이드바 - 모바일에서 햄버거 메뉴 전환', async ({ page }) => {
    // 데스크톱에서 시작
    await page.setViewportSize(viewports.desktop);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 데스크톱에서 사이드바 표시 확인
    const sidebarVisible = await isElementVisuallyVisible(page, '.sidebar, .side-nav, [class*="sidebar"]');
    const hamburgerVisible = await isElementVisuallyVisible(page, '.hamburger, .menu-toggle, [class*="hamburger"]');

    verificationResults.push(createVerificationResult(
      '데스크톱 - 사이드바 표시',
      '.sidebar',
      'visibility',
      { valid: sidebarVisible, actualValue: sidebarVisible ? 'visible' : 'hidden' },
      'visible'
    ));

    // 모바일로 전환
    await page.setViewportSize(viewports.mobile);
    await page.waitForTimeout(500); // CSS 미디어 쿼리 적용 대기

    const mobileSidebarVisible = await isElementVisuallyVisible(page, '.sidebar, .side-nav, [class*="sidebar"]');
    const mobileHamburgerVisible = await isElementVisuallyVisible(page, '.hamburger, .menu-toggle, [class*="hamburger"]');

    verificationResults.push(createVerificationResult(
      '모바일 - 햄버거 메뉴 표시',
      '.hamburger',
      'visibility',
      { valid: mobileHamburgerVisible, actualValue: mobileHamburgerVisible ? 'visible' : 'hidden' },
      'visible'
    ));

    verificationResults.push(createVerificationResult(
      '모바일 - 사이드바 숨김',
      '.sidebar',
      'visibility',
      { valid: !mobileSidebarVisible, actualValue: mobileSidebarVisible ? 'visible' : 'hidden' },
      'hidden'
    ));

    // 반응형 전환이 올바르게 작동하는지 확인
    expect(mobileHamburgerVisible,
      '모바일에서는 햄버거 메뉴가 표시되어야 합니다.'
    ).toBe(true);

    // 햄버거 메뉴 클릭 테스트 (있는 경우)
    if (mobileHamburgerVisible) {
      await page.click('.hamburger, .menu-toggle, [class*="hamburger"]');
      await page.waitForTimeout(500); // 애니메이션 대기

      const sidebarOpenedVisible = await isElementVisuallyVisible(page, '.sidebar, .side-nav, [class*="sidebar"]');
      
      verificationResults.push(createVerificationResult(
        '모바일 - 햄버거 메뉴 클릭 후 사이드바 표시',
        '.sidebar',
        'visibility',
        { valid: sidebarOpenedVisible, actualValue: sidebarOpenedVisible ? 'visible' : 'hidden' },
        'visible'
      ));
    }
  });

  test('폰트 크기 반응형 조정 - 뷰포트별 가독성', async ({ page }) => {
    const textSelectors = [
      { selector: 'h1', type: '메인 제목' },
      { selector: 'h2', type: '섹션 제목' },
      { selector: 'p', type: '본문 텍스트' },
      { selector: '.btn', type: '버튼 텍스트' }
    ];

    const fontSizes: Record<string, Record<string, number>> = {};

    // 각 뷰포트에서 폰트 크기 측정
    for (const [viewportName, { width, height, name }] of Object.entries(viewports)) {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      fontSizes[viewportName] = {};

      for (const { selector, type } of textSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        const fontSize = await getComputedStyleProperty(page, selector, 'font-size');
        const pixelSize = parseFloat(fontSize.replace('px', ''));
        fontSizes[viewportName][type] = pixelSize;

        verificationResults.push(createVerificationResult(
          `${name} - ${type} 폰트 크기`,
          selector,
          'font-size',
          { 
            valid: pixelSize >= 12, // 최소 가독성 확보
            actualValue: fontSize,
            pixelSize
          },
          '12px 이상'
        ));
      }
    }

    // 뷰포트 간 폰트 크기 적응성 검증
    for (const { selector, type } of textSelectors) {
      if (fontSizes.desktop[type] && fontSizes.mobile[type]) {
        const desktopSize = fontSizes.desktop[type];
        const mobileSize = fontSizes.mobile[type];
        
        // 모바일에서는 폰트가 같거나 약간 작아질 수 있음 (하지만 너무 작으면 안됨)
        const appropriateScaling = mobileSize >= desktopSize * 0.8 && mobileSize <= desktopSize * 1.2;

        verificationResults.push(createVerificationResult(
          `${type} - 반응형 폰트 크기 조정`,
          selector,
          'responsive-font-scaling',
          { 
            valid: appropriateScaling,
            actualValue: `Mobile: ${mobileSize}px, Desktop: ${desktopSize}px`,
            scalingRatio: mobileSize / desktopSize
          },
          '0.8 ~ 1.2 비율 유지'
        ));

        expect(appropriateScaling,
          `${type}의 반응형 폰트 스케일링이 적절하지 않습니다.
          데스크톱: ${desktopSize}px, 모바일: ${mobileSize}px, 비율: ${(mobileSize / desktopSize).toFixed(2)}`
        ).toBe(true);
      }
    }
  });

  test('버튼 및 인터랙션 요소 - 터치 친화적 크기', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const interactiveSelectors = [
      { selector: 'button', type: '버튼', minSize: 44 },
      { selector: '.btn', type: '스타일 버튼', minSize: 44 },
      { selector: 'a[href]', type: '링크', minSize: 32 },
      { selector: 'input', type: '입력 필드', minSize: 44 },
      { selector: '[data-testid*="btn"]', type: '테스트 버튼', minSize: 44 }
    ];

    for (const { selector, type, minSize } of interactiveSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      // 처음 3개 요소만 테스트 (성능 최적화)
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        const elementSelector = `${selector}:nth-of-type(${i + 1})`;
        
        const dimensions = await page.evaluate((selector) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) return { width: 0, height: 0 };
          
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          
          return {
            width: rect.width,
            height: rect.height,
            paddingTop: parseFloat(style.paddingTop),
            paddingBottom: parseFloat(style.paddingBottom)
          };
        }, elementSelector);

        const meetsMinSize = dimensions.height >= minSize && dimensions.width >= 24;
        const hasAdequatePadding = dimensions.paddingTop + dimensions.paddingBottom >= 8;

        verificationResults.push(createVerificationResult(
          `모바일 터치 - ${type} 크기`,
          elementSelector,
          'touch-target-size',
          { 
            valid: meetsMinSize,
            actualValue: `${dimensions.width}×${dimensions.height}px`,
            minRequirement: `${minSize}px 높이, 24px 폭`,
            dimensions
          },
          `최소 ${minSize}px 높이`
        ));

        verificationResults.push(createVerificationResult(
          `모바일 터치 - ${type} 패딩`,
          elementSelector,
          'touch-padding',
          { 
            valid: hasAdequatePadding,
            actualValue: `${dimensions.paddingTop + dimensions.paddingBottom}px`,
            requirement: '8px 이상'
          },
          '상하 패딩 합계 8px 이상'
        ));

        expect(meetsMinSize,
          `${type}(${elementSelector})이 터치하기에 충분한 크기가 아닙니다.
          실제: ${dimensions.width}×${dimensions.height}px, 최소: ${minSize}px 높이`
        ).toBe(true);
      }
    }
  });

  test('그리드/플렉스 레이아웃 - 뷰포트별 열 수 조정', async ({ page }) => {
    const gridContainers = [
      { url: '/projects', selector: '.project-grid, .projects-container, [class*="grid"]' },
      { url: '/dashboard', selector: '.stats-grid, .dashboard-grid, [class*="stats"]' }
    ];

    for (const { url, selector } of gridContainers) {
      for (const [viewportName, { width, height, name }] of Object.entries(viewports)) {
        await page.setViewportSize({ width, height });
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        // 그리드 아이템 수와 배치 확인
        const gridInfo = await page.evaluate((selector) => {
          const container = document.querySelector(selector) as HTMLElement;
          if (!container) return null;

          const style = getComputedStyle(container);
          const children = Array.from(container.children) as HTMLElement[];
          
          // 첫 번째 행의 아이템 수 계산 (같은 top 위치를 가진 요소들)
          const firstRowTop = children[0]?.getBoundingClientRect().top;
          const firstRowItems = children.filter(child => 
            Math.abs(child.getBoundingClientRect().top - firstRowTop) < 5
          ).length;

          return {
            display: style.display,
            gridTemplateColumns: style.gridTemplateColumns,
            flexWrap: style.flexWrap,
            firstRowItems,
            totalItems: children.length
          };
        }, selector);

        if (!gridInfo) continue;

        // 뷰포트별 적절한 열 수 기대값
        const expectedColumns = {
          mobile: 1,
          tablet: viewportName === 'tablet' ? 2 : 3,
          desktop: 3,
          ultrawide: 4
        };

        const appropriateColumnCount = 
          gridInfo.firstRowItems <= expectedColumns[viewportName as keyof typeof expectedColumns] + 1 &&
          gridInfo.firstRowItems >= expectedColumns[viewportName as keyof typeof expectedColumns] - 1;

        verificationResults.push(createVerificationResult(
          `${name} - 그리드 열 수 조정`,
          selector,
          'grid-columns',
          { 
            valid: appropriateColumnCount,
            actualValue: `${gridInfo.firstRowItems}열`,
            expected: `${expectedColumns[viewportName as keyof typeof expectedColumns]}열 (±1)`,
            gridInfo
          },
          `${expectedColumns[viewportName as keyof typeof expectedColumns]}열`
        ));
      }
    }
  });

  test('이미지 및 미디어 - 반응형 크기 조정', async ({ page }) => {
    const pages = ['/dashboard', '/projects', '/feedback/1'];

    for (const url of pages) {
      for (const [viewportName, { width, height }] of Object.entries(viewports)) {
        await page.setViewportSize({ width, height });
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 이미지 요소들 확인
        const images = await page.$$('img, video, [class*="image"], [class*="media"]');
        
        for (let i = 0; i < Math.min(images.length, 3); i++) {
          const imageSelector = `img:nth-of-type(${i + 1})`;
          const elements = await page.$$(imageSelector);
          if (elements.length === 0) continue;

          const imageInfo = await page.evaluate((selector) => {
            const img = document.querySelector(selector) as HTMLImageElement;
            if (!img) return null;

            const rect = img.getBoundingClientRect();
            const style = getComputedStyle(img);
            const containerRect = img.parentElement?.getBoundingClientRect();

            return {
              width: rect.width,
              height: rect.height,
              maxWidth: style.maxWidth,
              objectFit: style.objectFit,
              containerWidth: containerRect?.width || 0,
              overflowing: rect.width > (containerRect?.width || window.innerWidth)
            };
          }, imageSelector);

          if (!imageInfo) continue;

          // 이미지가 컨테이너를 넘지 않는지 확인
          const appropriateSize = !imageInfo.overflowing && 
            imageInfo.width <= width && 
            imageInfo.maxWidth !== 'none';

          verificationResults.push(createVerificationResult(
            `${viewportName} - 이미지 반응형 크기`,
            imageSelector,
            'responsive-sizing',
            { 
              valid: appropriateSize,
              actualValue: `${imageInfo.width}×${imageInfo.height}px`,
              maxWidth: imageInfo.maxWidth,
              overflowing: imageInfo.overflowing,
              viewportWidth: width
            },
            '컨테이너 내 적절한 크기'
          ));

          expect(!imageInfo.overflowing,
            `${url}의 이미지가 ${viewportName}에서 컨테이너를 넘쳐흐릅니다.
            이미지 폭: ${imageInfo.width}px, 뷰포트 폭: ${width}px`
          ).toBe(true);
        }
      }
    }
  });

  test('스크롤 동작 - 모바일 터치 스크롤 최적화', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 스크롤 가능한 영역들 확인
    const scrollableSelectors = [
      '.scrollable',
      '.overflow-auto', 
      '.overflow-scroll',
      '[style*="overflow"]'
    ];

    for (const selector of scrollableSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      const scrollInfo = await page.evaluate((selector) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) return null;

        const style = getComputedStyle(element);
        
        return {
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          webkitOverflowScrolling: style.webkitOverflowScrolling,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          isScrollable: element.scrollHeight > element.clientHeight
        };
      }, selector);

      if (!scrollInfo || !scrollInfo.isScrollable) continue;

      // 터치 스크롤 최적화 확인 (-webkit-overflow-scrolling: touch)
      const hasTouchScrolling = scrollInfo.webkitOverflowScrolling === 'touch';

      verificationResults.push(createVerificationResult(
        '모바일 터치 스크롤 최적화',
        selector,
        '-webkit-overflow-scrolling',
        { 
          valid: hasTouchScrolling,
          actualValue: scrollInfo.webkitOverflowScrolling || 'auto',
          recommendation: 'touch 사용 권장'
        },
        'touch'
      ));

      // 스크롤 영역이 적절한 높이를 가지는지 확인
      const appropriateHeight = scrollInfo.clientHeight >= 100; // 최소 100px

      verificationResults.push(createVerificationResult(
        '스크롤 영역 최소 높이',
        selector,
        'scrollable-height',
        { 
          valid: appropriateHeight,
          actualValue: `${scrollInfo.clientHeight}px`,
          minHeight: '100px'
        },
        '100px 이상'
      ));
    }
  });
});