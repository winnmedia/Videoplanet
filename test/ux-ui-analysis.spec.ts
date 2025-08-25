import { test, expect, Page } from '@playwright/test';

/**
 * UX/UI 분석 테스트
 * - 레이아웃 구조 평가
 * - 버튼 크기 및 클릭 영역 검증
 * - 디자인 요소 위치 적절성
 * - 사용자 관점 접근성
 */

interface UXMetrics {
  layout: {
    hasHeader: boolean;
    hasSidebar: boolean;
    hasMainContent: boolean;
    isResponsive: boolean;
  };
  buttons: {
    count: number;
    minSize: { width: number; height: number };
    avgSize: { width: number; height: number };
    tooSmall: string[];
  };
  accessibility: {
    contrastRatio: boolean;
    focusIndicators: boolean;
    ariaLabels: boolean;
    keyboardNavigation: boolean;
  };
  usability: {
    loadTime: number;
    clickableAreaSize: boolean;
    spacing: boolean;
    readability: boolean;
  };
}

test.describe('UX/UI 레이아웃 및 디자인 분석', () => {
  let page: Page;
  let metrics: UXMetrics;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:3005/dashboard', { 
      waitUntil: 'networkidle' 
    });
    
    // 초기 메트릭 설정
    metrics = {
      layout: {
        hasHeader: false,
        hasSidebar: false,
        hasMainContent: false,
        isResponsive: false
      },
      buttons: {
        count: 0,
        minSize: { width: Infinity, height: Infinity },
        avgSize: { width: 0, height: 0 },
        tooSmall: []
      },
      accessibility: {
        contrastRatio: false,
        focusIndicators: false,
        ariaLabels: false,
        keyboardNavigation: false
      },
      usability: {
        loadTime: 0,
        clickableAreaSize: false,
        spacing: false,
        readability: false
      }
    };
  });

  test('페이지 레이아웃 구조 분석', async () => {
    // 헤더 확인
    const header = await page.$('header, [role="banner"], .header');
    metrics.layout.hasHeader = !!header;
    
    if (header) {
      const headerBox = await header.boundingBox();
      expect(headerBox?.height).toBeGreaterThanOrEqual(50);
      expect(headerBox?.height).toBeLessThanOrEqual(100);
      console.log(`✓ 헤더 높이: ${headerBox?.height}px (적정 범위: 50-100px)`);
    }

    // 사이드바 확인
    const sidebar = await page.$('aside, nav, [role="navigation"], .sidebar');
    metrics.layout.hasSidebar = !!sidebar;
    
    if (sidebar) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.width).toBeGreaterThanOrEqual(200);
      expect(sidebarBox?.width).toBeLessThanOrEqual(300);
      console.log(`✓ 사이드바 너비: ${sidebarBox?.width}px (적정 범위: 200-300px)`);
    }

    // 메인 컨텐츠 영역
    const main = await page.$('main, [role="main"], .main-content, .content');
    metrics.layout.hasMainContent = !!main;
    
    if (main) {
      const mainBox = await main.boundingBox();
      const viewport = page.viewportSize();
      if (viewport && mainBox) {
        const contentRatio = mainBox.width / viewport.width;
        expect(contentRatio).toBeGreaterThanOrEqual(0.5);
        console.log(`✓ 메인 컨텐츠 비율: ${(contentRatio * 100).toFixed(1)}% (최소 50% 이상)`);
      }
    }

    // 반응형 레이아웃 테스트
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const isResponsive = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth <= window.innerWidth;
      });
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${isResponsive ? '✓' : '✗'} 가로 스크롤 없음`);
    }
  });

  test('버튼 크기 및 클릭 영역 검증', async () => {
    // 모든 버튼 요소 찾기
    const buttons = await page.$$('button, a[role="button"], input[type="button"], input[type="submit"], .btn, .button');
    metrics.buttons.count = buttons.length;
    
    const MIN_BUTTON_SIZE = 44; // WCAG 권장 최소 크기
    let totalWidth = 0;
    let totalHeight = 0;
    let validButtons = 0;

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (!box) continue;

      totalWidth += box.width;
      totalHeight += box.height;
      validButtons++;

      // 최소 크기 확인
      if (box.width < MIN_BUTTON_SIZE || box.height < MIN_BUTTON_SIZE) {
        const text = await button.textContent() || 'Unknown';
        metrics.buttons.tooSmall.push(`"${text.trim()}" (${box.width}x${box.height}px)`);
      }

      // 최소값 갱신
      metrics.buttons.minSize.width = Math.min(metrics.buttons.minSize.width, box.width);
      metrics.buttons.minSize.height = Math.min(metrics.buttons.minSize.height, box.height);
    }

    // 평균 크기 계산
    if (validButtons > 0) {
      metrics.buttons.avgSize.width = Math.round(totalWidth / validButtons);
      metrics.buttons.avgSize.height = Math.round(totalHeight / validButtons);
    }

    console.log(`\n버튼 분석 결과:`);
    console.log(`- 총 버튼 수: ${metrics.buttons.count}개`);
    console.log(`- 평균 크기: ${metrics.buttons.avgSize.width}x${metrics.buttons.avgSize.height}px`);
    console.log(`- 최소 크기: ${metrics.buttons.minSize.width}x${metrics.buttons.minSize.height}px`);
    
    if (metrics.buttons.tooSmall.length > 0) {
      console.log(`⚠ WCAG 최소 크기(44x44px) 미달 버튼: ${metrics.buttons.tooSmall.length}개`);
      metrics.buttons.tooSmall.forEach(btn => console.log(`  - ${btn}`));
    } else {
      console.log(`✓ 모든 버튼이 WCAG 최소 크기 기준을 충족합니다.`);
    }

    // 버튼 간격 확인
    const buttonPositions = [];
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) buttonPositions.push(box);
    }

    // 인접 버튼 간 최소 간격 확인 (8px 권장)
    const MIN_SPACING = 8;
    let spacingIssues = 0;
    
    for (let i = 0; i < buttonPositions.length; i++) {
      for (let j = i + 1; j < buttonPositions.length; j++) {
        const b1 = buttonPositions[i];
        const b2 = buttonPositions[j];
        
        // 수평 또는 수직으로 인접한 경우 간격 확인
        const horizontalGap = Math.min(
          Math.abs(b2.x - (b1.x + b1.width)),
          Math.abs(b1.x - (b2.x + b2.width))
        );
        const verticalGap = Math.min(
          Math.abs(b2.y - (b1.y + b1.height)),
          Math.abs(b1.y - (b2.y + b2.height))
        );
        
        if ((horizontalGap < MIN_SPACING && horizontalGap >= 0) || 
            (verticalGap < MIN_SPACING && verticalGap >= 0)) {
          spacingIssues++;
        }
      }
    }
    
    if (spacingIssues > 0) {
      console.log(`⚠ 버튼 간격 부족: ${spacingIssues}개 쌍`);
    } else {
      console.log(`✓ 버튼 간격이 적절합니다.`);
    }
  });

  test('색상 대비 및 가독성 검증', async () => {
    // 텍스트 색상 대비 확인
    const textElements = await page.$$('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    let contrastIssues = 0;
    
    for (const element of textElements.slice(0, 20)) { // 샘플링
      const contrast = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // 간단한 대비 계산 (실제로는 더 복잡한 알고리즘 필요)
        const rgb = (str: string) => {
          const match = str.match(/\d+/g);
          return match ? match.map(Number) : [0, 0, 0];
        };
        
        const [r1, g1, b1] = rgb(color);
        const [r2, g2, b2] = rgb(bgColor);
        
        const luminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const l1 = luminance(r1, g1, b1);
        const l2 = luminance(r2, g2, b2);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        return ratio;
      }, element);
      
      if (contrast < 4.5) { // WCAG AA 기준
        contrastIssues++;
      }
    }
    
    metrics.accessibility.contrastRatio = contrastIssues === 0;
    console.log(`\n색상 대비 분석:`);
    console.log(contrastIssues > 0 
      ? `⚠ 대비 부족 요소: ${contrastIssues}개 (WCAG AA 4.5:1 미달)` 
      : `✓ 색상 대비가 적절합니다.`);

    // 폰트 크기 확인
    const fontSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, a, button');
      const sizes: number[] = [];
      
      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize > 0) sizes.push(fontSize);
      });
      
      return {
        min: Math.min(...sizes),
        avg: sizes.reduce((a, b) => a + b, 0) / sizes.length,
        max: Math.max(...sizes)
      };
    });
    
    console.log(`\n폰트 크기 분석:`);
    console.log(`- 최소: ${fontSizes.min}px ${fontSizes.min < 12 ? '⚠ (12px 미만)' : '✓'}`);
    console.log(`- 평균: ${fontSizes.avg.toFixed(1)}px`);
    console.log(`- 최대: ${fontSizes.max}px`);
  });

  test('키보드 네비게이션 및 포커스 관리', async () => {
    // Tab 키로 네비게이션 테스트
    const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    console.log(`\n포커스 가능 요소: ${focusableElements.length}개`);

    // 포커스 인디케이터 확인
    let focusIndicatorCount = 0;
    for (const element of focusableElements.slice(0, 5)) { // 샘플링
      await element.focus();
      
      const hasIndicator = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        const outline = style.outline;
        const boxShadow = style.boxShadow;
        const border = style.border;
        
        return outline !== 'none' || boxShadow !== 'none' || border !== 'none';
      }, element);
      
      if (hasIndicator) focusIndicatorCount++;
    }
    
    metrics.accessibility.focusIndicators = focusIndicatorCount > 0;
    console.log(focusIndicatorCount > 0 
      ? `✓ 포커스 인디케이터가 제공됩니다.` 
      : `⚠ 포커스 인디케이터가 부족합니다.`);

    // ARIA 레이블 확인
    const ariaElements = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
    const formElements = await page.$$('input, select, textarea, button');
    
    const ariaRatio = ariaElements.length / Math.max(formElements.length, 1);
    metrics.accessibility.ariaLabels = ariaRatio > 0.5;
    
    console.log(`\nARIA 레이블 사용률: ${(ariaRatio * 100).toFixed(1)}% ${ariaRatio > 0.5 ? '✓' : '⚠'}`);
  });

  test('사용자 경험 흐름 분석', async () => {
    console.log('\n사용자 경험 흐름 분석:');
    
    // 주요 액션 버튼 확인
    const primaryActions = await page.$$('[class*="primary"], [class*="main"], button:has-text("시작"), button:has-text("생성"), button:has-text("추가")');
    console.log(`- 주요 액션 버튼: ${primaryActions.length}개`);
    
    // 네비게이션 메뉴 확인
    const navLinks = await page.$$('nav a, aside a, [role="navigation"] a');
    console.log(`- 네비게이션 링크: ${navLinks.length}개`);
    
    // 폼 요소 확인
    const forms = await page.$$('form');
    const inputs = await page.$$('input:not([type="hidden"]), select, textarea');
    console.log(`- 폼: ${forms.length}개, 입력 필드: ${inputs.length}개`);
    
    // 로딩 상태 확인
    const loadingIndicators = await page.$$('[class*="loading"], [class*="spinner"], [role="status"]');
    console.log(`- 로딩 인디케이터: ${loadingIndicators.length}개`);
    
    // 에러 메시지 영역 확인
    const errorElements = await page.$$('[class*="error"], [class*="alert"], [role="alert"]');
    console.log(`- 에러/알림 영역: ${errorElements.length}개`);
  });

  test.afterAll(async () => {
    // 최종 리포트 생성
    console.log('\n========================================');
    console.log('UX/UI 분석 요약');
    console.log('========================================\n');
    
    // 레이아웃 평가
    console.log('📐 레이아웃 구조:');
    console.log(`  헤더: ${metrics.layout.hasHeader ? '✓' : '✗'}`);
    console.log(`  사이드바: ${metrics.layout.hasSidebar ? '✓' : '✗'}`);
    console.log(`  메인 컨텐츠: ${metrics.layout.hasMainContent ? '✓' : '✗'}`);
    
    // 버튼 평가
    console.log('\n🔘 버튼 및 인터랙션:');
    console.log(`  총 버튼 수: ${metrics.buttons.count}개`);
    console.log(`  평균 크기: ${metrics.buttons.avgSize.width}x${metrics.buttons.avgSize.height}px`);
    console.log(`  WCAG 미달: ${metrics.buttons.tooSmall.length}개`);
    
    // 접근성 평가
    console.log('\n♿ 접근성:');
    console.log(`  색상 대비: ${metrics.accessibility.contrastRatio ? '✓' : '⚠'}`);
    console.log(`  포커스 인디케이터: ${metrics.accessibility.focusIndicators ? '✓' : '⚠'}`);
    console.log(`  ARIA 레이블: ${metrics.accessibility.ariaLabels ? '✓' : '⚠'}`);
    
    // 개선 권장사항
    console.log('\n💡 개선 권장사항:');
    if (metrics.buttons.tooSmall.length > 0) {
      console.log(`  - ${metrics.buttons.tooSmall.length}개 버튼의 크기를 44x44px 이상으로 확대`);
    }
    if (!metrics.accessibility.contrastRatio) {
      console.log(`  - 텍스트와 배경 간 색상 대비 개선 (최소 4.5:1)`);
    }
    if (!metrics.accessibility.focusIndicators) {
      console.log(`  - 모든 인터랙티브 요소에 명확한 포커스 인디케이터 추가`);
    }
    if (!metrics.accessibility.ariaLabels) {
      console.log(`  - 폼 요소와 버튼에 ARIA 레이블 추가로 스크린리더 지원 개선`);
    }
  });
});