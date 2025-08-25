const { chromium } = require('playwright');

(async () => {
  console.log('🎨 VideoPlanet UX/UI 분석 시작...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 대시보드 페이지 로드
    console.log('📄 대시보드 페이지 로드 중...');
    await page.goto('http://localhost:3005/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 1. 레이아웃 구조 분석
    console.log('\n📐 레이아웃 구조 분석:');
    console.log('========================================');
    
    const header = await page.$('header, [role="banner"], .header');
    console.log(`헤더: ${header ? '✓ 존재' : '✗ 없음'}`);
    
    const sidebar = await page.$('aside, nav, [role="navigation"], .sidebar, .SideBar');
    console.log(`사이드바: ${sidebar ? '✓ 존재' : '✗ 없음'}`);
    
    const main = await page.$('main, [role="main"], .main-content, .content');
    console.log(`메인 컨텐츠: ${main ? '✓ 존재' : '✗ 없음'}`);
    
    // 2. 버튼 분석
    console.log('\n🔘 버튼 및 클릭 영역 분석:');
    console.log('========================================');
    
    const buttons = await page.$$('button, a[role="button"], .btn, .button');
    console.log(`총 버튼 수: ${buttons.length}개`);
    
    const MIN_SIZE = 44; // WCAG 권장 최소 크기
    let tooSmallButtons = [];
    let totalWidth = 0, totalHeight = 0, validCount = 0;
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (!box) continue;
      
      validCount++;
      totalWidth += box.width;
      totalHeight += box.height;
      
      if (box.width < MIN_SIZE || box.height < MIN_SIZE) {
        const text = await button.textContent() || 'Unknown';
        tooSmallButtons.push({
          text: text.trim().substring(0, 30),
          size: `${Math.round(box.width)}x${Math.round(box.height)}px`
        });
      }
    }
    
    if (validCount > 0) {
      console.log(`평균 버튼 크기: ${Math.round(totalWidth/validCount)}x${Math.round(totalHeight/validCount)}px`);
    }
    
    if (tooSmallButtons.length > 0) {
      console.log(`\n⚠️  WCAG 최소 크기(44x44px) 미달 버튼: ${tooSmallButtons.length}개`);
      tooSmallButtons.slice(0, 5).forEach(btn => {
        console.log(`   - "${btn.text}" (${btn.size})`);
      });
      if (tooSmallButtons.length > 5) {
        console.log(`   ... 외 ${tooSmallButtons.length - 5}개`);
      }
    } else {
      console.log(`✓ 모든 버튼이 WCAG 최소 크기 기준 충족`);
    }
    
    // 3. 반응형 레이아웃 테스트
    console.log('\n📱 반응형 레이아웃 테스트:');
    console.log('========================================');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop (1920x1080)' },
      { width: 768, height: 1024, name: 'Tablet (768x1024)' },
      { width: 375, height: 667, name: 'Mobile (375x667)' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      console.log(`${viewport.name}: ${hasHorizontalScroll ? '✗ 가로 스크롤 발생' : '✓ 가로 스크롤 없음'}`);
    }
    
    // 4. 색상 및 가독성
    console.log('\n🎨 색상 및 가독성 분석:');
    console.log('========================================');
    
    const fontSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
      const sizes = [];
      
      for (let i = 0; i < Math.min(elements.length, 50); i++) {
        const fontSize = parseFloat(window.getComputedStyle(elements[i]).fontSize);
        if (fontSize > 0) sizes.push(fontSize);
      }
      
      return {
        min: Math.min(...sizes),
        avg: sizes.reduce((a, b) => a + b, 0) / sizes.length,
        max: Math.max(...sizes),
        tooSmall: sizes.filter(s => s < 12).length
      };
    });
    
    console.log(`최소 폰트 크기: ${fontSizes.min}px ${fontSizes.min < 12 ? '⚠️ (12px 미만)' : '✓'}`);
    console.log(`평균 폰트 크기: ${fontSizes.avg.toFixed(1)}px`);
    console.log(`최대 폰트 크기: ${fontSizes.max}px`);
    if (fontSizes.tooSmall > 0) {
      console.log(`⚠️  12px 미만 텍스트: ${fontSizes.tooSmall}개`);
    }
    
    // 5. 접근성 요소
    console.log('\n♿ 접근성 분석:');
    console.log('========================================');
    
    const ariaElements = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
    const formElements = await page.$$('input, select, textarea, button');
    const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    console.log(`ARIA 레이블 사용: ${ariaElements.length}개 요소`);
    console.log(`폼 요소: ${formElements.length}개`);
    console.log(`포커스 가능 요소: ${focusableElements.length}개`);
    
    const ariaRatio = formElements.length > 0 ? (ariaElements.length / formElements.length * 100).toFixed(1) : 0;
    console.log(`ARIA 레이블 커버리지: ${ariaRatio}% ${ariaRatio > 50 ? '✓' : '⚠️ (50% 미만)'}`);
    
    // 6. 네비게이션 분석
    console.log('\n🧭 네비게이션 및 사용자 흐름:');
    console.log('========================================');
    
    const navLinks = await page.$$('nav a, aside a, [role="navigation"] a');
    const primaryButtons = await page.$$('[class*="primary"], button[class*="main"]');
    const forms = await page.$$('form');
    const inputs = await page.$$('input:not([type="hidden"]), select, textarea');
    
    console.log(`네비게이션 링크: ${navLinks.length}개`);
    console.log(`주요 액션 버튼: ${primaryButtons.length}개`);
    console.log(`폼: ${forms.length}개`);
    console.log(`입력 필드: ${inputs.length}개`);
    
    // 7. 성능 지표
    console.log('\n⚡ 성능 지표:');
    console.log('========================================');
    
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });
    
    console.log(`DOM 로드 시간: ${performanceMetrics.domContentLoaded}ms ${performanceMetrics.domContentLoaded < 1000 ? '✓' : '⚠️ (1초 초과)'}`);
    console.log(`전체 로드 시간: ${performanceMetrics.loadComplete}ms ${performanceMetrics.loadComplete < 3000 ? '✓' : '⚠️ (3초 초과)'}`);
    
    // 최종 요약
    console.log('\n📊 UX/UI 분석 요약:');
    console.log('========================================');
    
    const issues = [];
    const improvements = [];
    
    if (!header) issues.push('헤더 없음');
    if (!sidebar) issues.push('사이드바 없음');
    if (tooSmallButtons.length > 0) issues.push(`${tooSmallButtons.length}개 버튼 크기 미달`);
    if (fontSizes.min < 12) issues.push('너무 작은 폰트 사용');
    if (ariaRatio < 50) issues.push('ARIA 레이블 부족');
    
    if (tooSmallButtons.length > 0) improvements.push('버튼 크기를 44x44px 이상으로 확대');
    if (fontSizes.min < 12) improvements.push('최소 폰트 크기를 12px 이상으로 조정');
    if (ariaRatio < 50) improvements.push('폼 요소에 ARIA 레이블 추가');
    if (navLinks.length < 5) improvements.push('네비게이션 메뉴 보강');
    
    if (issues.length > 0) {
      console.log('\n⚠️  발견된 이슈:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ 주요 이슈 없음');
    }
    
    if (improvements.length > 0) {
      console.log('\n💡 개선 권장사항:');
      improvements.forEach(imp => console.log(`   - ${imp}`));
    }
    
    console.log('\n========================================');
    console.log('✨ UX/UI 분석 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
})();