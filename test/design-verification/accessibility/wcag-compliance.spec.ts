import { test, expect } from '@playwright/test';
import { 
  verifyAccessibilityAttributes,
  getComputedStyleProperty,
  normalizeColor,
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet WCAG 2.1 AA 접근성 표준 준수 검증
 * 
 * 검증 항목:
 * 1. 키보드 네비게이션 지원
 * 2. 색상 대비율 (4.5:1 이상)
 * 3. ARIA 속성 적절성
 * 4. 이미지 대체 텍스트
 * 5. 폼 라벨링
 * 6. 포커스 표시기
 * 7. 의미있는 링크 텍스트
 * 8. 페이지 구조 (헤딩 계층)
 */

test.describe('WCAG 2.1 AA 접근성 준수 검증', () => {
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
    
    const reportPath = path.join(reportDir, 'wcag-compliance-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  /**
   * RGB를 Luminance로 변환하는 함수 (WCAG 대비율 계산용)
   */
  function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * 두 색상 간 대비율 계산 (WCAG 기준)
   */
  function getContrastRatio(color1: string, color2: string): number {
    const parseColor = (color: string) => {
      const hex = normalizeColor(color).replace('#', '');
      if (hex === 'ffffff') return { r: 255, g: 255, b: 255 };
      if (hex === '000000') return { r: 0, g: 0, b: 0 };
      
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return { r, g, b };
    };

    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    const l1 = getLuminance(c1.r, c1.g, c1.b);
    const l2 = getLuminance(c2.r, c2.g, c2.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  test('키보드 네비게이션 - Tab 순서 및 포커스 관리', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 포커스 가능한 요소들 수집
    const focusableElements = await page.$$eval(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      elements => elements.map((el, index) => ({
        tagName: el.tagName.toLowerCase(),
        id: el.id || '',
        className: el.className || '',
        index,
        tabIndex: el.tabIndex,
        ariaLabel: el.getAttribute('aria-label') || '',
        textContent: el.textContent?.trim().substring(0, 50) || ''
      }))
    );

    verificationResults.push(createVerificationResult(
      '키보드 네비게이션 - 포커스 가능한 요소 수',
      'dashboard',
      'focusable-elements',
      { 
        valid: focusableElements.length > 0,
        actualValue: `${focusableElements.length}개 요소`,
        elements: focusableElements.slice(0, 10) // 첫 10개만 저장
      },
      '1개 이상'
    ));

    expect(focusableElements.length > 0, 
      '대시보드에 키보드로 탐색 가능한 요소가 있어야 합니다.'
    ).toBe(true);

    // Tab 키로 순차 이동 테스트 (첫 5개 요소)
    let currentFocusIndex = 0;
    for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName.toLowerCase(),
          id: el?.id || '',
          className: el?.className || '',
          textContent: el?.textContent?.trim().substring(0, 50) || ''
        };
      });

      const hasFocus = focusedElement.tagName !== 'body';
      
      verificationResults.push(createVerificationResult(
        `키보드 네비게이션 - Tab ${i + 1}번째`,
        `focusable-element-${i}`,
        'tab-navigation',
        { 
          valid: hasFocus,
          actualValue: `${focusedElement.tagName}${focusedElement.id ? '#' + focusedElement.id : ''}`,
          expectedElement: focusableElements[i]
        },
        '포커스 이동 성공'
      ));
    }
  });

  test('색상 대비율 - 텍스트와 배경 간 4.5:1 이상 확인', async ({ page }) => {
    const pages = [
      { url: '/dashboard', name: '대시보드' },
      { url: '/planning', name: '기획 페이지' },
      { url: '/projects', name: '프로젝트 목록' }
    ];

    for (const { url, name } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 주요 텍스트 요소들의 색상 대비 확인
      const textSelectors = [
        'h1', 'h2', 'h3', 'p', 'span', 'a', 'button',
        '.btn', '.text-primary', '.text-secondary'
      ];

      for (const selector of textSelectors) {
        const elements = await page.$$(selector);
        if (elements.length === 0) continue;

        // 첫 번째 요소만 테스트 (성능 최적화)
        const textColor = await getComputedStyleProperty(page, selector, 'color');
        const backgroundColor = await getComputedStyleProperty(page, selector, 'background-color');
        
        // 배경이 투명한 경우 부모 요소의 배경색 확인
        let finalBgColor = backgroundColor;
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          finalBgColor = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (!element) return '#ffffff';
            
            let parent = element.parentElement;
            while (parent) {
              const style = getComputedStyle(parent);
              const bgColor = style.backgroundColor;
              if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
              }
              parent = parent.parentElement;
            }
            return '#ffffff'; // 기본값
          }, selector);
        }

        try {
          const contrastRatio = getContrastRatio(textColor, finalBgColor);
          const meetsWCAG = contrastRatio >= 4.5;

          verificationResults.push(createVerificationResult(
            `${name} - ${selector} 색상 대비`,
            selector,
            'color-contrast',
            { 
              valid: meetsWCAG,
              actualValue: `${contrastRatio.toFixed(2)}:1`,
              textColor: normalizeColor(textColor),
              backgroundColor: normalizeColor(finalBgColor),
              wcagRequirement: '4.5:1'
            },
            '4.5:1 이상'
          ));

          if (contrastRatio < 4.5 && contrastRatio > 1) {
            console.warn(`⚠️ ${name}의 ${selector} 대비율 부족: ${contrastRatio.toFixed(2)}:1 (텍스트: ${textColor}, 배경: ${finalBgColor})`);
          }
        } catch (error) {
          verificationResults.push(createVerificationResult(
            `${name} - ${selector} 색상 대비 (오류)`,
            selector,
            'color-contrast',
            { 
              valid: false,
              actualValue: `분석 실패: ${error.message}`,
              textColor,
              backgroundColor: finalBgColor
            },
            '4.5:1 이상'
          ));
        }
      }
    }
  });

  test('ARIA 속성 - 적절한 접근성 라벨링', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 버튼에 적절한 ARIA 라벨이나 텍스트가 있는지 확인
    const buttons = await page.$$('button, [role="button"]');
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const buttonSelector = `button:nth-of-type(${i + 1})`;
      
      const buttonInfo = await page.evaluate((selector) => {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (!button) return null;

        return {
          textContent: button.textContent?.trim() || '',
          ariaLabel: button.getAttribute('aria-label') || '',
          ariaLabelledby: button.getAttribute('aria-labelledby') || '',
          ariaDescribedby: button.getAttribute('aria-describedby') || '',
          title: button.getAttribute('title') || '',
          type: button.type || '',
          disabled: button.disabled
        };
      }, buttonSelector);

      if (!buttonInfo) continue;

      const hasAccessibleName = !!(
        buttonInfo.textContent || 
        buttonInfo.ariaLabel || 
        buttonInfo.ariaLabelledby || 
        buttonInfo.title
      );

      verificationResults.push(createVerificationResult(
        'ARIA - 버튼 접근 가능한 이름',
        buttonSelector,
        'accessible-name',
        { 
          valid: hasAccessibleName,
          actualValue: buttonInfo.textContent || buttonInfo.ariaLabel || 'none',
          buttonInfo
        },
        '텍스트 또는 ARIA 라벨 필요'
      ));

      expect(hasAccessibleName,
        `버튼(${buttonSelector})에 접근 가능한 이름이 필요합니다.
        텍스트: "${buttonInfo.textContent}", aria-label: "${buttonInfo.ariaLabel}"`
      ).toBe(true);
    }

    // 폼 입력 필드와 라벨 연결 확인
    const formInputs = await page.$$('input, textarea, select');
    
    for (let i = 0; i < Math.min(formInputs.length, 5); i++) {
      const inputSelector = `input:nth-of-type(${i + 1})`;
      
      const inputInfo = await page.evaluate((selector) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (!input) return null;

        // 연결된 라벨 찾기
        const associatedLabel = input.id ? 
          document.querySelector(`label[for="${input.id}"]`) : 
          input.closest('label');

        return {
          id: input.id || '',
          type: input.type || '',
          placeholder: input.placeholder || '',
          ariaLabel: input.getAttribute('aria-label') || '',
          ariaLabelledby: input.getAttribute('aria-labelledby') || '',
          hasLabel: !!associatedLabel,
          labelText: associatedLabel?.textContent?.trim() || ''
        };
      }, inputSelector);

      if (!inputInfo) continue;

      const hasProperLabeling = !!(
        inputInfo.hasLabel ||
        inputInfo.ariaLabel ||
        inputInfo.ariaLabelledby ||
        (inputInfo.type === 'submit' || inputInfo.type === 'button') // 제출/버튼 타입은 예외
      );

      verificationResults.push(createVerificationResult(
        'ARIA - 입력 필드 라벨링',
        inputSelector,
        'input-labeling',
        { 
          valid: hasProperLabeling,
          actualValue: inputInfo.labelText || inputInfo.ariaLabel || inputInfo.placeholder || 'none',
          inputInfo
        },
        'label 요소 또는 ARIA 라벨 필요'
      ));
    }
  });

  test('이미지 대체 텍스트 - alt 속성 적절성', async ({ page }) => {
    const pages = ['/dashboard', '/projects', '/feedback/1'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const images = await page.$$('img');
      
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        const imgSelector = `img:nth-of-type(${i + 1})`;
        
        const imageInfo = await page.evaluate((selector) => {
          const img = document.querySelector(selector) as HTMLImageElement;
          if (!img) return null;

          return {
            src: img.src || '',
            alt: img.alt || '',
            ariaLabel: img.getAttribute('aria-label') || '',
            role: img.getAttribute('role') || '',
            isDecorative: img.alt === '' && img.getAttribute('role') === 'presentation'
          };
        }, imgSelector);

        if (!imageInfo) continue;

        // 장식용 이미지가 아닌 경우 alt 텍스트 필요
        const hasAppropriateAlt = 
          imageInfo.isDecorative || // 명시적으로 장식용으로 표시
          imageInfo.alt.length > 0 || // alt 텍스트 있음
          imageInfo.ariaLabel.length > 0; // aria-label 있음

        const isInformativeImage = 
          !imageInfo.isDecorative && 
          !imageInfo.src.includes('decoration') &&
          !imageInfo.src.includes('bg-') &&
          !imageInfo.src.includes('background');

        verificationResults.push(createVerificationResult(
          `${url} - 이미지 대체 텍스트`,
          imgSelector,
          'alt-text',
          { 
            valid: hasAppropriateAlt || !isInformativeImage,
            actualValue: imageInfo.alt || imageInfo.ariaLabel || '(없음)',
            imageInfo,
            isInformative: isInformativeImage
          },
          '정보 전달 이미지는 alt 텍스트 필요'
        ));

        if (isInformativeImage) {
          expect(hasAppropriateAlt,
            `${url}의 이미지(${imgSelector})에 적절한 대체 텍스트가 필요합니다.
            src: ${imageInfo.src}, alt: "${imageInfo.alt}"`
          ).toBe(true);
        }
      }
    }
  });

  test('포커스 표시기 - 시각적 포커스 인디케이터', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const interactiveSelectors = [
      'button', 'a[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'
    ];

    for (const selector of interactiveSelectors) {
      const elements = await page.$$(selector);
      if (elements.length === 0) continue;

      // 첫 번째 요소에 포커스 주기
      const firstElementSelector = `${selector}:first-of-type`;
      await page.focus(firstElementSelector);
      await page.waitForTimeout(100); // 포커스 스타일 적용 대기

      const focusStyles = await page.evaluate((selector) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (!element || document.activeElement !== element) return null;

        const style = getComputedStyle(element);
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          outlineColor: style.outlineColor,
          boxShadow: style.boxShadow,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth
        };
      }, firstElementSelector);

      if (!focusStyles) continue;

      // 포커스 표시기가 있는지 확인
      const hasFocusIndicator = 
        (focusStyles.outline && focusStyles.outline !== 'none') ||
        focusStyles.boxShadow.includes('rgb') ||
        focusStyles.outlineWidth !== '0px';

      verificationResults.push(createVerificationResult(
        '포커스 표시기',
        firstElementSelector,
        'focus-indicator',
        { 
          valid: hasFocusIndicator,
          actualValue: focusStyles.outline || focusStyles.boxShadow || 'none',
          focusStyles
        },
        'outline, box-shadow 등 시각적 표시 필요'
      ));

      expect(hasFocusIndicator,
        `${firstElementSelector}에 시각적 포커스 표시기가 필요합니다.
        outline: ${focusStyles.outline}, box-shadow: ${focusStyles.boxShadow}`
      ).toBe(true);
    }
  });

  test('페이지 구조 - 헤딩 계층 구조 적절성', async ({ page }) => {
    const pages = ['/dashboard', '/planning', '/projects'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const headings = await page.$$eval(
        'h1, h2, h3, h4, h5, h6',
        elements => elements.map((el, index) => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent?.trim().substring(0, 50) || '',
          index
        }))
      );

      if (headings.length === 0) continue;

      // H1이 하나만 있는지 확인
      const h1Count = headings.filter(h => h.level === 1).length;
      const hasProperH1Structure = h1Count === 1;

      verificationResults.push(createVerificationResult(
        `${url} - H1 헤딩 구조`,
        'page-structure',
        'h1-count',
        { 
          valid: hasProperH1Structure,
          actualValue: `${h1Count}개`,
          headings: headings.filter(h => h.level === 1)
        },
        '1개'
      ));

      // 헤딩 레벨이 순차적인지 확인 (레벨을 건너뛰지 않는지)
      let hasProperSequence = true;
      let prevLevel = 0;
      
      for (const heading of headings) {
        if (heading.level > prevLevel + 1) {
          hasProperSequence = false;
          break;
        }
        prevLevel = heading.level;
      }

      verificationResults.push(createVerificationResult(
        `${url} - 헤딩 레벨 순차성`,
        'page-structure',
        'heading-sequence',
        { 
          valid: hasProperSequence,
          actualValue: headings.map(h => `H${h.level}`).join(' → '),
          headings
        },
        '순차적 레벨 (H1→H2→H3...)'
      ));

      expect(hasProperH1Structure,
        `${url}에는 H1 헤딩이 정확히 1개 있어야 합니다. 현재: ${h1Count}개`
      ).toBe(true);

      expect(hasProperSequence,
        `${url}의 헤딩 레벨이 순차적이어야 합니다. 
        현재 순서: ${headings.map(h => `H${h.level}`).join(' → ')}`
      ).toBe(true);
    }
  });

  test('의미있는 링크 텍스트 - "여기를 클릭" 등 제거', async ({ page }) => {
    const pages = ['/dashboard', '/projects'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const links = await page.$$eval(
        'a[href]',
        elements => elements.map((el, index) => ({
          href: el.getAttribute('href') || '',
          text: el.textContent?.trim() || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          title: el.getAttribute('title') || '',
          index
        }))
      );

      const problematicTexts = [
        '여기', '클릭', 'click', 'here', '바로가기', '더보기', 'more',
        '링크', 'link', '자세히', 'detail', '보기', 'view'
      ];

      for (const link of links.slice(0, 10)) { // 첫 10개만 확인
        const linkText = (link.text || link.ariaLabel || link.title).toLowerCase();
        const isProblematic = problematicTexts.some(text => 
          linkText === text || (linkText.length < 10 && linkText.includes(text))
        );

        const isMeaningful = 
          !isProblematic && 
          linkText.length > 2 && 
          !linkText.match(/^[\s\-_.,!?]*$/); // 특수문자만 있는 경우 제외

        verificationResults.push(createVerificationResult(
          `${url} - 링크 텍스트 의미성`,
          `a[href="${link.href}"]`,
          'meaningful-link-text',
          { 
            valid: isMeaningful,
            actualValue: linkText,
            isProblematic,
            link
          },
          '구체적이고 의미있는 텍스트'
        ));

        if (isProblematic && linkText) {
          console.warn(`⚠️ ${url}에서 의미 없는 링크 텍스트 발견: "${linkText}" (${link.href})`);
        }
      }
    }
  });

  test('색상 정보 의존성 - 색상 외 추가 정보 제공', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 상태를 색상으로만 표현하는 요소들 찾기
    const statusElements = await page.$$('[class*="success"], [class*="error"], [class*="warning"], [class*="danger"], [class*="info"]');

    for (let i = 0; i < Math.min(statusElements.length, 5); i++) {
      const selector = `[class*="success"]:nth-of-type(${i + 1})`;
      
      const statusInfo = await page.evaluate((selector) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) return null;

        const hasIcon = element.querySelector('svg, i, .icon, [class*="icon"]');
        const hasText = element.textContent?.trim().length > 0;
        const hasAriaLabel = element.getAttribute('aria-label');
        const hasTitle = element.getAttribute('title');

        return {
          className: element.className,
          hasIcon: !!hasIcon,
          hasText: !!hasText,
          hasAriaLabel: !!hasAriaLabel,
          hasTitle: !!hasTitle,
          textContent: element.textContent?.trim().substring(0, 50) || ''
        };
      }, selector);

      if (!statusInfo) continue;

      // 색상 외에 추가 정보가 있는지 확인
      const hasAdditionalInfo = 
        statusInfo.hasIcon ||
        statusInfo.hasText ||
        statusInfo.hasAriaLabel ||
        statusInfo.hasTitle;

      verificationResults.push(createVerificationResult(
        '색상 의존성 - 상태 표시 추가 정보',
        selector,
        'color-independence',
        { 
          valid: hasAdditionalInfo,
          actualValue: statusInfo.hasIcon ? 'icon' : statusInfo.hasText ? 'text' : 'none',
          statusInfo
        },
        '아이콘, 텍스트 또는 ARIA 라벨 필요'
      ));

      expect(hasAdditionalInfo,
        `상태 표시 요소(${selector})에 색상 외 추가 정보가 필요합니다.
        클래스: ${statusInfo.className}, 텍스트: "${statusInfo.textContent}"`
      ).toBe(true);
    }
  });
});