// 로그인 버튼 Hydration 테스트 스크립트
const test = () => {
  console.log('=== 로그인 버튼 Hydration 테스트 ===');
  
  // 1초마다 버튼 상태 체크
  let checkCount = 0;
  const maxChecks = 10; // 최대 10초
  
  const interval = setInterval(() => {
    checkCount++;
    console.log(`\n[${checkCount}초] 버튼 상태 확인:`);
    
    const button = document.querySelector('.submit-button');
    if (button) {
      console.log('✓ 버튼 발견됨');
      console.log('  - disabled:', button.disabled);
      console.log('  - 텍스트:', button.textContent);
      console.log('  - onclick 이벤트:', !!button.onclick);
      console.log('  - addEventListener 확인:', button._reactInternalFiber ? '✓ React 연결됨' : '× React 미연결');
      
      // 클릭 테스트
      if (!button.disabled && button.textContent === '로그인') {
        console.log('🎯 Hydration 완료! 버튼 클릭 테스트 시도...');
        
        // 클릭 이벤트 시뮬레이션
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        
        button.dispatchEvent(clickEvent);
        console.log('🚀 버튼 클릭 이벤트 발생!');
        clearInterval(interval);
        return;
      }
    } else {
      console.log('✗ 버튼을 찾을 수 없음');
    }
    
    if (checkCount >= maxChecks) {
      console.log('\n❌ 테스트 타임아웃 (10초)');
      clearInterval(interval);
    }
  }, 1000);
};

// DOM 로딩 완료 후 테스트 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', test);
} else {
  test();
}