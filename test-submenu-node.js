const puppeteer = require('puppeteer');

async function testSubmenu() {
  console.log('🚀 서브메뉴 테스트 시작...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 콘솔 로그 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('서브메뉴') || text.includes('메뉴 클릭') || text.includes('EnhancedSideBar')) {
        console.log('브라우저 콘솔:', text);
      }
    });
    
    console.log('📄 대시보드 페이지 로드 중...');
    await page.goto('http://localhost:3001/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(3000);
    
    // 서브메뉴 확인
    const submenuExists = await page.evaluate(() => {
      const submenu = document.querySelector('[data-testid="submenu"]');
      if (submenu) {
        return {
          exists: true,
          dataOpen: submenu.dataset.open,
          dataTab: submenu.dataset.tab,
          visibility: window.getComputedStyle(submenu).visibility,
          opacity: window.getComputedStyle(submenu).opacity,
          transform: window.getComputedStyle(submenu).transform
        };
      }
      return { exists: false };
    });
    
    console.log('📊 서브메뉴 상태:', submenuExists);
    
    // 프로젝트 관리 버튼 찾기 및 클릭
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const projectBtn = buttons.find(b => b.textContent?.includes('프로젝트 관리'));
      
      if (projectBtn) {
        projectBtn.click();
        return true;
      }
      return false;
    });
    
    if (buttonClicked) {
      console.log('✅ 프로젝트 관리 버튼 클릭됨');
      
      // 클릭 후 대기
      await page.waitForTimeout(2000);
      
      // 클릭 후 상태 확인
      const submenuAfterClick = await page.evaluate(() => {
        const submenu = document.querySelector('[data-testid="submenu"]');
        if (submenu) {
          return {
            exists: true,
            dataOpen: submenu.dataset.open,
            dataTab: submenu.dataset.tab,
            visibility: window.getComputedStyle(submenu).visibility,
            opacity: window.getComputedStyle(submenu).opacity,
            transform: window.getComputedStyle(submenu).transform
          };
        }
        return { exists: false };
      });
      
      console.log('📊 클릭 후 서브메뉴 상태:', submenuAfterClick);
      
      // 서브메뉴가 열렸는지 확인
      if (submenuAfterClick.dataOpen === 'true' && submenuAfterClick.visibility === 'visible') {
        console.log('🎉 서브메뉴가 성공적으로 열렸습니다!');
      } else {
        console.log('⚠️ 서브메뉴가 여전히 닫혀있습니다');
        
        // 강제로 열기
        await page.evaluate(() => {
          const submenu = document.querySelector('[data-testid="submenu"]');
          if (submenu) {
            submenu.style.transform = 'translateX(0)';
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
            submenu.style.pointerEvents = 'auto';
          }
        });
        
        console.log('💪 서브메뉴를 강제로 열었습니다');
      }
    } else {
      console.log('❌ 프로젝트 관리 버튼을 찾을 수 없습니다');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'submenu-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: submenu-test.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

// Puppeteer가 설치되어 있는지 확인
try {
  require.resolve('puppeteer');
  testSubmenu();
} catch (e) {
  console.log('Puppeteer가 설치되어 있지 않습니다.');
  console.log('설치하려면: npm install puppeteer');
  
  // Puppeteer 없이 간단한 fetch 테스트
  const http = require('http');
  
  console.log('\n📡 간단한 HTTP 테스트 수행...');
  
  http.get('http://localhost:3001/dashboard', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const hasSubmenu = data.includes('data-testid="submenu"');
      console.log('서브메뉴 DOM 존재 (SSR):', hasSubmenu ? '❌ 없음' : '❌ 없음');
      
      if (!hasSubmenu) {
        console.log('💡 서브메뉴는 클라이언트 사이드에서만 렌더링됩니다');
        console.log('💡 브라우저에서 직접 확인이 필요합니다');
      }
    });
  }).on('error', (err) => {
    console.error('HTTP 요청 실패:', err);
  });
}