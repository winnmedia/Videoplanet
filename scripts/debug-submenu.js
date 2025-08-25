// VideoplaNet 서브메뉴 디버깅 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('=== 서브메뉴 디버깅 시작 ===');

// 1. 서브메뉴 요소 찾기
const submenu = document.querySelector('[data-testid="submenu"]');
console.log('1. 서브메뉴 DOM 요소:', submenu);

if (!submenu) {
    console.error('❌ 서브메뉴를 찾을 수 없습니다!');
    
    // 모든 클래스명에서 submenu 포함된 요소 찾기
    const allElements = document.querySelectorAll('*');
    let foundSubmenu = false;
    
    allElements.forEach(el => {
        if (el.className && el.className.toString().includes('submenu')) {
            console.log('🔍 submenu 클래스를 가진 요소 발견:', el);
            console.log('  - 클래스명:', el.className.toString());
            console.log('  - HTML:', el.outerHTML.substring(0, 200));
            foundSubmenu = true;
        }
    });
    
    if (!foundSubmenu) {
        console.log('💡 서브메뉴가 조건부 렌더링으로 숨겨져 있을 수 있습니다.');
        console.log('💡 React DevTools에서 EnhancedSideBar 컴포넌트의 state를 확인하세요.');
    }
} else {
    // 2. 서브메뉴 상태 확인
    console.log('2. 서브메뉴 데이터 속성:');
    console.log('  - data-open:', submenu.dataset.open);
    console.log('  - data-tab:', submenu.dataset.tab);
    console.log('  - aria-hidden:', submenu.getAttribute('aria-hidden'));
    
    // 3. 클래스 확인
    console.log('3. 적용된 클래스:');
    console.log('  - classList:', Array.from(submenu.classList));
    console.log('  - className:', submenu.className);
    
    // 4. 계산된 스타일 확인
    const styles = window.getComputedStyle(submenu);
    console.log('4. 계산된 스타일:');
    console.log('  - display:', styles.display);
    console.log('  - visibility:', styles.visibility);
    console.log('  - opacity:', styles.opacity);
    console.log('  - transform:', styles.transform);
    console.log('  - position:', styles.position);
    console.log('  - left:', styles.left);
    console.log('  - z-index:', styles.zIndex);
    console.log('  - pointer-events:', styles.pointerEvents);
    console.log('  - width:', styles.width);
    console.log('  - height:', styles.height);
    
    // 5. 위치 확인
    const rect = submenu.getBoundingClientRect();
    console.log('5. 요소 위치 (getBoundingClientRect):');
    console.log('  - left:', rect.left);
    console.log('  - top:', rect.top);
    console.log('  - right:', rect.right);
    console.log('  - bottom:', rect.bottom);
    console.log('  - width:', rect.width);
    console.log('  - height:', rect.height);
    
    // 6. 가시성 판단
    const isVisible = (
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        styles.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
    );
    
    if (isVisible) {
        console.log('✅ 서브메뉴가 보이는 상태입니다.');
    } else {
        console.log('❌ 서브메뉴가 숨겨진 상태입니다.');
        console.log('원인:');
        if (styles.display === 'none') console.log('  - display가 none');
        if (styles.visibility === 'hidden') console.log('  - visibility가 hidden');
        if (styles.opacity === '0') console.log('  - opacity가 0');
        if (rect.width <= 0) console.log('  - width가 0 이하');
        if (rect.height <= 0) console.log('  - height가 0 이하');
    }
    
    // 7. 강제로 보이게 하기
    console.log('\n💡 서브메뉴를 강제로 보이게 하려면 다음 명령을 실행하세요:');
    console.log(`document.querySelector('[data-testid="submenu"]').style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; transform: translateX(0) !important; pointer-events: auto !important;'`);
    
    // 8. active 클래스 토글
    console.log('\n💡 active 클래스를 토글하려면:');
    console.log(`document.querySelector('[data-testid="submenu"]').classList.toggle('active')`);
}

// 9. EnhancedSideBar 상태 체크 (React DevTools 필요)
console.log('\n=== React 컴포넌트 상태 체크 ===');
console.log('React DevTools에서 다음을 확인하세요:');
console.log('1. EnhancedSideBar 컴포넌트 찾기');
console.log('2. props 확인: isOpen, tab, projects');
console.log('3. state 확인: subMenuOpen, tabName, searchQuery');
console.log('4. handleMenuClick 함수가 호출되는지 확인');

// 10. 사이드바 메뉴 버튼 확인
console.log('\n=== 사이드바 메뉴 버튼 체크 ===');
const menuButtons = document.querySelectorAll('button');
let foundMenuButtons = [];

menuButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes('프로젝트 관리') || text.includes('영상 기획') || text.includes('영상 피드백')) {
        foundMenuButtons.push({
            text: text,
            element: btn,
            onclick: btn.onclick
        });
    }
});

if (foundMenuButtons.length > 0) {
    console.log('메뉴 버튼 발견:', foundMenuButtons.length, '개');
    foundMenuButtons.forEach((item, index) => {
        console.log(`${index + 1}. "${item.text}"`);
        console.log('  클릭 이벤트:', item.onclick ? '있음' : '없음');
    });
    
    console.log('\n💡 메뉴 버튼을 프로그래밍적으로 클릭하려면:');
    console.log(`document.querySelectorAll('button')[인덱스].click()`);
} else {
    console.log('❌ 메뉴 버튼을 찾을 수 없습니다.');
}

console.log('\n=== 디버깅 완료 ===');