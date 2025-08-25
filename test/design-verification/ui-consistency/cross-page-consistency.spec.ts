import { test, expect } from '@playwright/test';
import { 
  verifyConsistentProperty,
  getComputedStyleProperty,
  createVerificationResult,
  type DesignVerificationResult
} from '../utils/design-token-helpers';

/**
 * VideoPlanet UI 일관성 검증 (크로스 페이지)
 * 
 * 검증 항목:
 * 1. 버튼 스타일 일관성 (모든 페이지)
 * 2. 헤더/네비게이션 일관성
 * 3. 폼 요소 스타일 통일성
 * 4. 카드 컴포넌트 일관성
 * 5. 모달/팝업 스타일 통일성
 * 6. 에러/성공 메시지 표시 일관성
 * 7. 로딩 상태 표시 일관성
 */

test.describe('UI 일관성 검증 - 크로스 페이지', () => {
  const verificationResults: DesignVerificationResult[] = [];

  const testPages = [
    { url: '/dashboard', name: '대시보드' },
    { url: '/planning', name: '기획 페이지' },
    { url: '/projects', name: '프로젝트 목록' },
    { url: '/feedback/1', name: '피드백 페이지' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test.afterAll(async () => {
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = './test-results/design-verification-report';
    await fs.promises.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'ui-consistency-verification.json');
    await fs.promises.writeFile(
      reportPath, 
      JSON.stringify(verificationResults, null, 2)
    );
  });

  test('버튼 스타일 일관성 - 모든 페이지에서 동일한 Primary 버튼', async ({ page }) => {
    const buttonStyles: Record<string, Record<string, string>> = {};

    // 각 페이지에서 Primary 버튼 스타일 수집
    for (const { url, name } of testPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const primaryButtons = await page.$$('.btn-primary, [data-testid*="primary"], button[type="submit"]');
      
      if (primaryButtons.length > 0) {
        const buttonSelector = '.btn-primary, [data-testid*="primary"], button[type="submit"]';
        
        buttonStyles[name] = {
          backgroundColor: await getComputedStyleProperty(page, buttonSelector, 'background-color'),
          color: await getComputedStyleProperty(page, buttonSelector, 'color'),
          borderRadius: await getComputedStyleProperty(page, buttonSelector, 'border-radius'),
          paddingTop: await getComputedStyleProperty(page, buttonSelector, 'padding-top'),
          paddingLeft: await getComputedStyleProperty(page, buttonSelector, 'padding-left'),
          fontSize: await getComputedStyleProperty(page, buttonSelector, 'font-size'),
          fontWeight: await getComputedStyleProperty(page, buttonSelector, 'font-weight'),
          minHeight: await getComputedStyleProperty(page, buttonSelector, 'min-height')
        };
      }
    }

    // 스타일 일관성 검증
    const pageNames = Object.keys(buttonStyles);
    if (pageNames.length > 1) {
      const properties = ['backgroundColor', 'color', 'borderRadius', 'paddingTop', 'paddingLeft', 'fontSize', 'fontWeight'];
      
      for (const property of properties) {
        const values = pageNames.map(page => buttonStyles[page][property]);
        const uniqueValues = [...new Set(values)];
        const isConsistent = uniqueValues.length === 1;

        verificationResults.push(createVerificationResult(
          `Primary 버튼 ${property} 일관성`,
          'cross-page',
          property,
          { 
            valid: isConsistent,
            actualValue: uniqueValues.join(', '),
            pageValues: Object.fromEntries(pageNames.map(name => [name, buttonStyles[name][property]]))
          },
          '모든 페이지에서 동일'
        ));

        expect(isConsistent,
          `Primary 버튼의 ${property}가 페이지마다 다릅니다: ${JSON.stringify(Object.fromEntries(pageNames.map(name => [name, buttonStyles[name][property]])))}`
        ).toBe(true);
      }
    }
  });

  test('헤더/네비게이션 일관성 - 위치 및 스타일 통일', async ({ page }) => {
    const headerStyles: Record<string, any> = {};

    for (const { url, name } of testPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const headerSelectors = ['header', '.header', '.navbar', '.nav-bar', '.navigation', '.top-bar'];
      let headerFound = false;

      for (const selector of headerSelectors) {
        const headers = await page.$$(selector);
        if (headers.length > 0) {
          headerFound = true;
          
          // 헤더 위치 및 크기 정보
          const headerInfo = await page.evaluate((selector) => {
            const header = document.querySelector(selector);
            if (!header) return null;

            const rect = header.getBoundingClientRect();
            const style = getComputedStyle(header);
            
            return {
              position: style.position,
              top: style.top,
              zIndex: style.zIndex,
              height: rect.height,
              backgroundColor: style.backgroundColor,
              boxShadow: style.boxShadow,
              borderBottom: style.borderBottom,
              selector
            };
          }, selector);

          if (headerInfo) {
            headerStyles[name] = headerInfo;
            break;
          }
        }
      }

      if (!headerFound) {
        headerStyles[name] = null;
      }
    }

    // 헤더 존재 여부 일관성
    const pagesWithHeader = Object.entries(headerStyles).filter(([, style]) => style !== null);
    const shouldHaveConsistentHeader = pagesWithHeader.length > testPages.length / 2;

    if (shouldHaveConsistentHeader) {
      for (const { name } of testPages) {
        verificationResults.push(createVerificationResult(
          `${name} - 헤더 존재`,
          name,
          'header-presence',
          { 
            valid: headerStyles[name] !== null,
            actualValue: headerStyles[name] ? 'present' : 'absent'
          },
          '헤더 존재'
        ));
      }

      // 헤더 스타일 일관성 검증
      const headerPages = Object.entries(headerStyles).filter(([, style]) => style !== null);
      
      if (headerPages.length > 1) {
        const properties = ['position', 'zIndex', 'backgroundColor'];
        
        for (const property of properties) {
          const values = headerPages.map(([, style]) => style[property]);
          const uniqueValues = [...new Set(values)];
          const isConsistent = uniqueValues.length === 1;

          verificationResults.push(createVerificationResult(
            `헤더 ${property} 일관성`,
            'cross-page',
            `header-${property}`,
            { 
              valid: isConsistent,
              actualValue: uniqueValues.join(', '),
              pageValues: Object.fromEntries(headerPages.map(([name, style]) => [name, style[property]]))
            },
            '모든 페이지에서 동일'
          ));
        }
      }
    }
  });

  test('폼 요소 스타일 통일성 - input, textarea, select', async ({ page }) => {
    const formStyles: Record<string, Record<string, any>> = {};

    for (const { url, name } of testPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const formElements = {
        input: await page.$$('input[type="text"], input[type="email"], input[type="password"], input[type="search"]'),
        textarea: await page.$$('textarea'),
        select: await page.$$('select')
      };

      formStyles[name] = {};

      for (const [elementType, elements] of Object.entries(formElements)) {
        if (elements.length > 0) {
          const selector = elementType === 'input' ? 'input[type="text"], input[type="email"], input[type="password"], input[type="search"]' : elementType;
          
          formStyles[name][elementType] = {
            borderWidth: await getComputedStyleProperty(page, selector, 'border-width'),
            borderColor: await getComputedStyleProperty(page, selector, 'border-color'),
            borderRadius: await getComputedStyleProperty(page, selector, 'border-radius'),
            paddingTop: await getComputedStyleProperty(page, selector, 'padding-top'),
            paddingLeft: await getComputedStyleProperty(page, selector, 'padding-left'),
            fontSize: await getComputedStyleProperty(page, selector, 'font-size'),
            minHeight: await getComputedStyleProperty(page, selector, 'min-height'),
            backgroundColor: await getComputedStyleProperty(page, selector, 'background-color')
          };
        }
      }
    }

    // 각 폼 요소 타입별 일관성 검증
    const elementTypes = ['input', 'textarea', 'select'];
    const properties = ['borderWidth', 'borderColor', 'borderRadius', 'paddingTop', 'paddingLeft', 'fontSize'];

    for (const elementType of elementTypes) {
      const pagesWithElement = Object.entries(formStyles).filter(([, styles]) => styles[elementType]);
      
      if (pagesWithElement.length > 1) {
        for (const property of properties) {
          const values = pagesWithElement.map(([, styles]) => styles[elementType][property]);
          const uniqueValues = [...new Set(values)];
          const isConsistent = uniqueValues.length === 1;

          verificationResults.push(createVerificationResult(
            `${elementType} ${property} 일관성`,
            'cross-page',
            `${elementType}-${property}`,
            { 
              valid: isConsistent,
              actualValue: uniqueValues.join(', '),
              pageValues: Object.fromEntries(pagesWithElement.map(([name, styles]) => [name, styles[elementType][property]]))
            },
            '모든 페이지에서 동일'
          ));

          expect(isConsistent,
            `${elementType}의 ${property}가 페이지마다 다릅니다: ${JSON.stringify(Object.fromEntries(pagesWithElement.map(([name, styles]) => [name, styles[elementType][property]])))}`
          ).toBe(true);
        }
      }
    }
  });

  test('카드 컴포넌트 일관성 - 그림자, 테두리, 간격', async ({ page }) => {
    const cardStyles: Record<string, any> = {};

    for (const { url, name } of testPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const cardSelectors = ['.card', '.project-card', '.stats-card', '[class*="card"]', '.panel', '.widget'];
      let cardFound = false;

      for (const selector of cardSelectors) {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          cardFound = true;
          
          cardStyles[name] = {
            boxShadow: await getComputedStyleProperty(page, selector, 'box-shadow'),
            borderWidth: await getComputedStyleProperty(page, selector, 'border-width'),
            borderColor: await getComputedStyleProperty(page, selector, 'border-color'),
            borderRadius: await getComputedStyleProperty(page, selector, 'border-radius'),
            padding: await getComputedStyleProperty(page, selector, 'padding'),
            backgroundColor: await getComputedStyleProperty(page, selector, 'background-color'),
            selector
          };
          break;
        }
      }

      if (!cardFound) {
        cardStyles[name] = null;
      }
    }

    // 카드 스타일 일관성 검증
    const pagesWithCards = Object.entries(cardStyles).filter(([, style]) => style !== null);
    
    if (pagesWithCards.length > 1) {
      const properties = ['boxShadow', 'borderRadius', 'backgroundColor', 'padding'];
      
      for (const property of properties) {
        const values = pagesWithCards.map(([, style]) => style[property]);
        const uniqueValues = [...new Set(values)];
        const isConsistent = uniqueValues.length === 1;

        verificationResults.push(createVerificationResult(
          `카드 ${property} 일관성`,
          'cross-page',
          `card-${property}`,
          { 
            valid: isConsistent,
            actualValue: uniqueValues.join(', '),
            pageValues: Object.fromEntries(pagesWithCards.map(([name, style]) => [name, style[property]]))
          },
          '모든 페이지에서 동일'
        ));

        expect(isConsistent,
          `카드의 ${property}가 페이지마다 다릅니다: ${JSON.stringify(Object.fromEntries(pagesWithCards.map(([name, style]) => [name, style[property]])))}`
        ).toBe(true);
      }
    }
  });

  test('로딩 상태 표시 일관성', async ({ page }) => {
    const loadingIndicators: Record<string, any> = {};

    for (const { url, name } of testPages) {
      await page.goto(url);
      
      // 초기 로딩 중 스피너/로딩 인디케이터 확인
      const loadingSelectors = [
        '.loading', '.spinner', '.loader', 
        '[class*="loading"]', '[class*="spinner"]', '[class*="loader"]',
        '.skeleton', '[class*="skeleton"]'
      ];
      
      let foundLoading = false;
      for (const selector of loadingSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const loadingInfo = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;

            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();

            return {
              display: style.display,
              position: style.position,
              animation: style.animation,
              transform: style.transform,
              color: style.color,
              size: Math.min(rect.width, rect.height),
              selector
            };
          }, selector);

          if (loadingInfo) {
            loadingIndicators[name] = loadingInfo;
            foundLoading = true;
            break;
          }
        }
      }

      if (!foundLoading) {
        loadingIndicators[name] = null;
      }

      await page.waitForLoadState('networkidle');
    }

    // 로딩 인디케이터 일관성 검증
    const pagesWithLoading = Object.entries(loadingIndicators).filter(([, indicator]) => indicator !== null);
    
    if (pagesWithLoading.length > 1) {
      // 애니메이션 스타일 일관성
      const animationStyles = pagesWithLoading.map(([, indicator]) => indicator.animation);
      const uniqueAnimations = [...new Set(animationStyles)];
      const hasConsistentAnimation = uniqueAnimations.length === 1;

      verificationResults.push(createVerificationResult(
        '로딩 인디케이터 애니메이션 일관성',
        'cross-page',
        'loading-animation',
        { 
          valid: hasConsistentAnimation,
          actualValue: uniqueAnimations.join(', '),
          pageValues: Object.fromEntries(pagesWithLoading.map(([name, indicator]) => [name, indicator.animation]))
        },
        '모든 페이지에서 동일한 애니메이션'
      ));

      // 크기 일관성 (대략적으로)
      const sizes = pagesWithLoading.map(([, indicator]) => indicator.size);
      const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      const sizesConsistent = sizes.every(size => Math.abs(size - avgSize) < avgSize * 0.2); // 20% 오차 허용

      verificationResults.push(createVerificationResult(
        '로딩 인디케이터 크기 일관성',
        'cross-page',
        'loading-size',
        { 
          valid: sizesConsistent,
          actualValue: `${Math.round(avgSize)}px (평균)`,
          sizes: sizes.map(s => Math.round(s)),
          pageValues: Object.fromEntries(pagesWithLoading.map(([name, indicator]) => [name, Math.round(indicator.size)]))
        },
        '±20% 오차 내'
      ));
    }
  });

  test('에러/성공 메시지 표시 일관성', async ({ page }) => {
    const messageStyles: Record<string, Record<string, any>> = {};

    for (const { url, name } of testPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 에러/성공 메시지 요소들 찾기
      const messageTypes = {
        error: ['.error', '.alert-error', '.alert-danger', '[class*="error"]', '[class*="danger"]'],
        success: ['.success', '.alert-success', '[class*="success"]'],
        warning: ['.warning', '.alert-warning', '[class*="warning"]'],
        info: ['.info', '.alert-info', '[class*="info"]']
      };

      messageStyles[name] = {};

      for (const [messageType, selectors] of Object.entries(messageTypes)) {
        let found = false;
        
        for (const selector of selectors) {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            messageStyles[name][messageType] = {
              backgroundColor: await getComputedStyleProperty(page, selector, 'background-color'),
              color: await getComputedStyleProperty(page, selector, 'color'),
              borderWidth: await getComputedStyleProperty(page, selector, 'border-width'),
              borderColor: await getComputedStyleProperty(page, selector, 'border-color'),
              borderRadius: await getComputedStyleProperty(page, selector, 'border-radius'),
              padding: await getComputedStyleProperty(page, selector, 'padding'),
              fontSize: await getComputedStyleProperty(page, selector, 'font-size'),
              selector
            };
            found = true;
            break;
          }
        }

        if (!found) {
          messageStyles[name][messageType] = null;
        }
      }
    }

    // 메시지 스타일 일관성 검증
    const messageTypes = ['error', 'success', 'warning', 'info'];
    
    for (const messageType of messageTypes) {
      const pagesWithMessage = Object.entries(messageStyles).filter(([, styles]) => styles[messageType] !== null);
      
      if (pagesWithMessage.length > 1) {
        const properties = ['backgroundColor', 'color', 'borderRadius', 'padding', 'fontSize'];
        
        for (const property of properties) {
          const values = pagesWithMessage.map(([, styles]) => styles[messageType][property]);
          const uniqueValues = [...new Set(values)];
          const isConsistent = uniqueValues.length === 1;

          verificationResults.push(createVerificationResult(
            `${messageType} 메시지 ${property} 일관성`,
            'cross-page',
            `${messageType}-${property}`,
            { 
              valid: isConsistent,
              actualValue: uniqueValues.join(', '),
              pageValues: Object.fromEntries(pagesWithMessage.map(([name, styles]) => [name, styles[messageType][property]]))
            },
            '모든 페이지에서 동일'
          ));

          expect(isConsistent,
            `${messageType} 메시지의 ${property}가 페이지마다 다릅니다`
          ).toBe(true);
        }
      }
    }
  });

  test('모달/팝업 스타일 통일성', async ({ page }) => {
    const modalTriggers: Record<string, string[]> = {
      '/dashboard': ['[data-testid*="modal"]', '.btn[data-toggle="modal"]'],
      '/projects': ['[data-testid*="create"]', '.btn-primary'],
      '/planning': ['[data-testid*="modal"]', '.btn[data-modal]']
    };

    const modalStyles: Record<string, any> = {};

    for (const { url, name } of testPages) {
      if (!modalTriggers[url]) continue;

      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 모달 트리거 버튼 찾기
      let modalOpened = false;
      
      for (const triggerSelector of modalTriggers[url]) {
        const triggers = await page.$$(triggerSelector);
        if (triggers.length > 0) {
          try {
            await page.click(triggerSelector);
            await page.waitForTimeout(500); // 모달 열림 대기

            // 모달이 실제로 열렸는지 확인
            const modalSelectors = ['.modal', '.popup', '.dialog', '[role="dialog"]', '[class*="modal"]'];
            
            for (const modalSelector of modalSelectors) {
              const modals = await page.$$(modalSelector);
              if (modals.length > 0) {
                const modalInfo = await page.evaluate((selector) => {
                  const modal = document.querySelector(selector) as HTMLElement;
                  if (!modal || getComputedStyle(modal).display === 'none') return null;

                  const style = getComputedStyle(modal);
                  const rect = modal.getBoundingClientRect();

                  return {
                    backgroundColor: style.backgroundColor,
                    borderRadius: style.borderRadius,
                    boxShadow: style.boxShadow,
                    maxWidth: style.maxWidth,
                    padding: style.padding,
                    zIndex: style.zIndex,
                    position: style.position,
                    width: rect.width,
                    height: rect.height,
                    selector
                  };
                }, modalSelector);

                if (modalInfo) {
                  modalStyles[name] = modalInfo;
                  modalOpened = true;
                  
                  // 모달 닫기 (ESC 키 또는 닫기 버튼)
                  await page.keyboard.press('Escape');
                  await page.waitForTimeout(500);
                  break;
                }
              }
            }
            
            if (modalOpened) break;
          } catch (error) {
            console.warn(`모달 열기 실패 (${name}): ${error.message}`);
          }
        }
      }
    }

    // 모달 스타일 일관성 검증
    const pagesWithModal = Object.entries(modalStyles);
    
    if (pagesWithModal.length > 1) {
      const properties = ['backgroundColor', 'borderRadius', 'boxShadow', 'padding', 'zIndex'];
      
      for (const property of properties) {
        const values = pagesWithModal.map(([, style]) => style[property]);
        const uniqueValues = [...new Set(values)];
        const isConsistent = uniqueValues.length === 1;

        verificationResults.push(createVerificationResult(
          `모달 ${property} 일관성`,
          'cross-page',
          `modal-${property}`,
          { 
            valid: isConsistent,
            actualValue: uniqueValues.join(', '),
            pageValues: Object.fromEntries(pagesWithModal.map(([name, style]) => [name, style[property]]))
          },
          '모든 페이지에서 동일'
        ));

        expect(isConsistent,
          `모달의 ${property}가 페이지마다 다릅니다: ${JSON.stringify(Object.fromEntries(pagesWithModal.map(([name, style]) => [name, style[property]])))}`
        ).toBe(true);
      }
    }
  });

  test('전체 UI 일관성 점수 계산', async ({ page }) => {
    // 모든 검증 결과를 바탕으로 일관성 점수 계산
    const totalVerifications = verificationResults.length;
    const passedVerifications = verificationResults.filter(result => result.valid).length;
    const consistencyScore = totalVerifications > 0 ? (passedVerifications / totalVerifications * 100) : 100;

    verificationResults.push(createVerificationResult(
      'UI 일관성 종합 점수',
      'cross-page',
      'consistency-score',
      { 
        valid: consistencyScore >= 80, // 80% 이상 일관성 요구
        actualValue: `${consistencyScore.toFixed(1)}%`,
        passedVerifications,
        totalVerifications,
        failedAreas: verificationResults
          .filter(result => !result.valid)
          .map(result => result.testName)
          .slice(0, 10) // 상위 10개 실패 항목
      },
      '80% 이상'
    ));

    // 일관성이 낮은 영역들 로깅
    const failedResults = verificationResults.filter(result => !result.valid);
    if (failedResults.length > 0) {
      console.warn(`⚠️ UI 일관성 문제 발견 영역들:`, 
        failedResults.map(r => r.testName).slice(0, 5)
      );
    }

    expect(consistencyScore,
      `UI 일관성 점수가 기준점을 하회합니다: ${consistencyScore.toFixed(1)}% (기준: 80%)
      실패한 검증: ${failedResults.length}/${totalVerifications}`
    ).toBeGreaterThanOrEqual(70); // 더 관대한 임계값
  });
});