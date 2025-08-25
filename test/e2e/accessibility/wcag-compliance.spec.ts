import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { testData } from '../fixtures/test-data';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * WCAG 2.1 AA 준수 테스트
 * 
 * 테스트 영역:
 * - Level A: 필수 접근성 요구사항
 * - Level AA: 권장 접근성 요구사항
 * - 키보드 네비게이션
 * - 스크린 리더 호환성
 * - 색상 대비
 * - 포커스 관리
 */

test.describe('WCAG 2.1 Compliance Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testData.users.member);
  });

  test.describe('Level A Compliance', () => {
    test('Dashboard - Level A', async ({ page }) => {
      await page.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag21a'])
        .analyze();
      
      // Level A 위반 사항이 없어야 함
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // 특정 Level A 요구사항 확인
      // 1.1.1 Non-text Content
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const ariaLabelledBy = await img.getAttribute('aria-labelledby');
        
        // 이미지는 대체 텍스트가 있어야 함
        expect(alt || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
      
      // 1.3.1 Info and Relationships
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0); // 제목 구조가 있어야 함
      
      // 2.1.1 Keyboard
      await page.keyboard.press('Tab');
      const firstFocused = await page.locator(':focus');
      await expect(firstFocused).toBeVisible();
      
      // 2.4.1 Bypass Blocks
      const skipLink = page.locator('[href="#main"], [href="#content"]');
      if (await skipLink.count() > 0) {
        await expect(skipLink.first()).toHaveAttribute('href', /#(main|content)/);
      }
      
      // 3.1.1 Language of Page
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', /^[a-z]{2}(-[A-Z]{2})?$/);
      
      // 4.1.2 Name, Role, Value
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // 버튼은 접근 가능한 이름이 있어야 함
        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('Project Page - Level A', async ({ page }) => {
      await page.goto(`/projects/${testData.projects.existing.id}`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag21a'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Form 요소 레이블 확인
      const inputs = page.locator('input:not([type="hidden"]), textarea, select');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // 모든 폼 요소는 레이블이 있어야 함
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });
  });

  test.describe('Level AA Compliance', () => {
    test('Dashboard - Level AA', async ({ page }) => {
      await page.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Level AA 위반 사항이 없어야 함
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // 1.4.3 Contrast (Minimum)
      // 텍스트 색상 대비 확인 (4.5:1 이상)
      const textElements = page.locator('p, span, div, a, button');
      const sampleSize = Math.min(await textElements.count(), 10);
      
      for (let i = 0; i < sampleSize; i++) {
        const element = textElements.nth(i);
        const color = await element.evaluate(el => 
          window.getComputedStyle(el).color
        );
        const backgroundColor = await element.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // 색상이 설정되어 있으면 대비 확인
        if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = await calculateContrast(color, backgroundColor);
          expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
      }
      
      // 1.4.4 Resize text
      // 텍스트가 200%까지 확대 가능해야 함
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      
      // 주요 콘텐츠가 여전히 보이는지 확인
      await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
      
      // 원래 크기로 복원
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      
      // 2.4.7 Focus Visible
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const focusOutline = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow;
      });
      
      // 포커스 표시가 있어야 함
      expect(focusOutline).not.toBe('none');
      expect(focusOutline).not.toBe('');
    });

    test('Feedback Page - Level AA', async ({ page }) => {
      await page.goto(`/projects/${testData.projects.withVideo.id}/feedback`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // 1.4.10 Reflow
      // 320px 너비에서도 수평 스크롤 없이 사용 가능해야 함
      await page.setViewportSize({ width: 320, height: 568 });
      
      const horizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      expect(horizontalScroll).toBeFalsy();
      
      // 1.4.11 Non-text Contrast
      // UI 컴포넌트와 그래픽 요소의 대비 (3:1 이상)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const borderColor = await button.evaluate(el => 
          window.getComputedStyle(el).borderColor
        );
        const backgroundColor = await button.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        if (borderColor && borderColor !== backgroundColor) {
          const contrast = await calculateContrast(borderColor, backgroundColor);
          expect(contrast).toBeGreaterThanOrEqual(3);
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Complete keyboard navigation flow', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Tab 순서가 논리적인지 확인
      const focusableElements = [];
      let previousElement = null;
      
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        const tagName = await focused.evaluate(el => el.tagName);
        const text = await focused.textContent();
        
        focusableElements.push({ tagName, text });
        
        // 포커스가 실제로 이동했는지 확인
        if (previousElement) {
          const currentElement = await focused.elementHandle();
          expect(currentElement).not.toBe(previousElement);
        }
        previousElement = await focused.elementHandle();
      }
      
      // 포커스 가능한 요소가 충분히 있는지 확인
      expect(focusableElements.length).toBeGreaterThan(10);
      
      // Shift+Tab으로 역방향 네비게이션
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Shift+Tab');
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
      }
      
      // Enter 키로 버튼 활성화
      await page.goto('/projects');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedButton = page.locator(':focus');
      const isButton = await focusedButton.evaluate(el => el.tagName === 'BUTTON');
      
      if (isButton) {
        await page.keyboard.press('Enter');
        // 버튼 클릭 동작 확인
        await page.waitForTimeout(500);
      }
      
      // Escape 키로 모달/메뉴 닫기
      const hasModal = await page.locator('[role="dialog"]').count() > 0;
      if (hasModal) {
        await page.keyboard.press('Escape');
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      }
    });

    test('Form keyboard interaction', async ({ page }) => {
      await page.goto('/projects/create');
      
      // 폼 필드 간 Tab 이동
      await page.keyboard.press('Tab');
      let focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('type', /text|email|password|tel/);
      
      // 텍스트 입력
      await page.keyboard.type('Test Project');
      
      // Tab으로 다음 필드로 이동
      await page.keyboard.press('Tab');
      focused = page.locator(':focus');
      
      // Select 요소에서 화살표 키 사용
      const isSelect = await focused.evaluate(el => el.tagName === 'SELECT');
      if (isSelect) {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      
      // 체크박스/라디오 버튼 Space 키 토글
      const checkboxes = page.locator('input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        await checkboxes.first().focus();
        await page.keyboard.press('Space');
        
        const isChecked = await checkboxes.first().isChecked();
        expect(isChecked).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('ARIA labels and roles', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 주요 영역에 적절한 role이 있는지 확인
      const navigation = page.locator('[role="navigation"]');
      await expect(navigation.first()).toBeVisible();
      
      const main = page.locator('[role="main"], main');
      await expect(main.first()).toBeVisible();
      
      // 버튼에 적절한 ARIA 속성이 있는지 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaDescribedBy = await button.getAttribute('aria-describedby');
        
        // 버튼은 설명이 있어야 함
        expect(text || ariaLabel || ariaDescribedBy).toBeTruthy();
        
        // 상태를 나타내는 버튼은 aria-pressed 속성이 있어야 함
        const isToggle = await button.getAttribute('data-toggle');
        if (isToggle) {
          const ariaPressed = await button.getAttribute('aria-pressed');
          expect(ariaPressed).toBeDefined();
        }
      }
      
      // 동적 콘텐츠 영역에 aria-live 속성 확인
      const liveRegions = page.locator('[aria-live]');
      if (await liveRegions.count() > 0) {
        const liveValue = await liveRegions.first().getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(liveValue);
      }
      
      // 로딩 상태에 적절한 ARIA 속성
      const loadingElements = page.locator('[data-loading="true"]');
      if (await loadingElements.count() > 0) {
        const ariaBusy = await loadingElements.first().getAttribute('aria-busy');
        expect(ariaBusy).toBe('true');
      }
    });

    test('Heading structure', async ({ page }) => {
      await page.goto('/dashboard');
      
      // h1이 정확히 하나 있어야 함
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // 제목 레벨이 순차적이어야 함
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let previousLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.substring(1));
        
        // 레벨이 2단계 이상 건너뛰면 안됨
        if (previousLevel > 0) {
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }
        previousLevel = level;
      }
    });

    test('Link context', async ({ page }) => {
      await page.goto('/projects');
      
      // 링크가 목적지를 명확히 나타내는지 확인
      const links = page.locator('a');
      const linkCount = await links.count();
      
      for (let i = 0; i < Math.min(linkCount, 20); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // 링크 텍스트가 의미 있어야 함
        const hasContext = text || ariaLabel || title;
        expect(hasContext).toBeTruthy();
        
        // "여기", "클릭" 같은 모호한 텍스트 피하기
        if (text) {
          expect(text.toLowerCase()).not.toMatch(/^(여기|클릭|더보기)$/);
        }
      }
    });
  });

  test.describe('Focus Management', () => {
    test('Focus trap in modal', async ({ page }) => {
      await page.goto('/projects');
      
      // 모달 열기
      await page.click('[data-testid="create-project-button"]');
      const modal = page.locator('[role="dialog"]');
      
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
        
        // 포커스가 모달 안으로 이동했는지 확인
        const focusedElement = page.locator(':focus');
        const isInModal = await focusedElement.evaluate((el, modalSelector) => {
          const modal = document.querySelector(modalSelector);
          return modal?.contains(el);
        }, '[role="dialog"]');
        
        expect(isInModal).toBeTruthy();
        
        // Tab 키로 모달 내부만 순환하는지 확인
        const focusableInModal = await modal.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').count();
        
        for (let i = 0; i < focusableInModal + 2; i++) {
          await page.keyboard.press('Tab');
          const focused = page.locator(':focus');
          const stillInModal = await focused.evaluate((el, modalSelector) => {
            const modal = document.querySelector(modalSelector);
            return modal?.contains(el);
          }, '[role="dialog"]');
          
          expect(stillInModal).toBeTruthy();
        }
        
        // Escape로 모달 닫기
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
        
        // 포커스가 트리거 요소로 돌아갔는지 확인
        const triggerButton = page.locator('[data-testid="create-project-button"]');
        await expect(triggerButton).toBeFocused();
      }
    });

    test('Focus restoration after action', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 특정 요소에 포커스
      const targetButton = page.locator('button').first();
      await targetButton.focus();
      
      // 액션 수행 (예: 알림 읽음 처리)
      if (await targetButton.getAttribute('data-testid') === 'mark-read') {
        await targetButton.click();
        
        // 포커스가 적절한 위치에 있는지 확인
        await page.waitForTimeout(500);
        const newFocus = page.locator(':focus');
        await expect(newFocus).toBeVisible();
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('Color independence', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 색상만으로 정보를 전달하지 않는지 확인
      const statusElements = page.locator('[data-status]');
      const statusCount = await statusElements.count();
      
      for (let i = 0; i < Math.min(statusCount, 5); i++) {
        const element = statusElements.nth(i);
        const text = await element.textContent();
        const icon = await element.locator('svg, img').count();
        const ariaLabel = await element.getAttribute('aria-label');
        
        // 상태를 나타내는 요소는 텍스트나 아이콘도 있어야 함
        expect(text || icon > 0 || ariaLabel).toBeTruthy();
      }
    });

    test('High contrast mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 고대비 모드 시뮬레이션
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // 주요 요소가 여전히 보이는지 확인
      await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
      
      // 텍스트가 읽을 수 있는지 확인
      const textElement = page.locator('p').first();
      const color = await textElement.evaluate(el => 
        window.getComputedStyle(el).color
      );
      const backgroundColor = await textElement.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // 다크 모드에서도 충분한 대비가 있는지 확인
      if (color && backgroundColor) {
        const contrast = await calculateContrast(color, backgroundColor);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  test.describe('Responsive and Zoom', () => {
    test('Zoom to 400%', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 400% 확대
      await page.evaluate(() => {
        document.documentElement.style.zoom = '4';
      });
      
      // 주요 콘텐츠가 여전히 접근 가능한지 확인
      const mainContent = page.locator('[role="main"], main').first();
      await expect(mainContent).toBeVisible();
      
      // 수평 스크롤이 필요하지 않은지 확인 (리플로우)
      const needsHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth * 1.1;
      });
      
      // 일부 수평 스크롤은 허용하지만 과도하지 않아야 함
      expect(needsHorizontalScroll).toBeFalsy();
      
      // 원래 크기로 복원
      await page.evaluate(() => {
        document.documentElement.style.zoom = '';
      });
    });

    test('Orientation change', async ({ page }) => {
      // 모바일 뷰포트로 시작
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // 세로 모드에서 사용 가능한지 확인
      await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
      
      // 가로 모드로 변경
      await page.setViewportSize({ width: 667, height: 375 });
      
      // 가로 모드에서도 사용 가능한지 확인
      await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
      
      // 콘텐츠가 잘리지 않는지 확인
      const isContentCut = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
            return true;
          }
        }
        return false;
      });
      
      expect(isContentCut).toBeFalsy();
    });
  });
});

// 색상 대비 계산 헬퍼 함수
async function calculateContrast(color1: string, color2: string): Promise<number> {
  // RGB 값 추출
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);
  
  // 상대 휘도 계산
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  // 대비 비율 계산
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRGB(color: string): { r: number; g: number; b: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}