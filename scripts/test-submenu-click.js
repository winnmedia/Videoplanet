// VideoplaNet 서브메뉴 클릭 테스트
// 브라우저 콘솔에서 실행하세요

console.log('🚀 서브메뉴 클릭 테스트 시작');

// 1. 서브메뉴 상태 확인
function checkSubmenuState() {
    const submenu = document.querySelector('[data-testid="submenu"]');
    if (submenu) {
        console.log('📊 서브메뉴 상태:');
        console.log('  - DOM에 존재: ✅');
        console.log('  - data-open:', submenu.dataset.open);
        console.log('  - data-tab:', submenu.dataset.tab);
        
        const styles = window.getComputedStyle(submenu);
        console.log('  - visibility:', styles.visibility);
        console.log('  - opacity:', styles.opacity);
        console.log('  - transform:', styles.transform);
        
        // 인라인 스타일 확인
        if (submenu.style.cssText) {
            console.log('  - 인라인 스타일 적용됨 ✅');
        }
        
        return submenu;
    } else {
        console.log('❌ 서브메뉴를 찾을 수 없습니다');
        return null;
    }
}

// 2. 메뉴 버튼 찾기
function findMenuButtons() {
    const buttons = Array.from(document.querySelectorAll('button'));
    const menuButtons = {
        project: buttons.find(b => b.textContent.includes('프로젝트 관리')),
        planning: buttons.find(b => b.textContent.includes('영상 기획')),
        feedback: buttons.find(b => b.textContent.includes('영상 피드백'))
    };
    
    console.log('🔍 메뉴 버튼 검색 결과:');
    console.log('  - 프로젝트 관리:', menuButtons.project ? '✅' : '❌');
    console.log('  - 영상 기획:', menuButtons.planning ? '✅' : '❌');
    console.log('  - 영상 피드백:', menuButtons.feedback ? '✅' : '❌');
    
    return menuButtons;
}

// 3. 메뉴 클릭 테스트
function testMenuClick(buttonType) {
    console.log(`\n🖱️ ${buttonType} 버튼 클릭 테스트`);
    
    const buttons = findMenuButtons();
    const button = buttons[buttonType];
    
    if (!button) {
        console.log(`❌ ${buttonType} 버튼을 찾을 수 없습니다`);
        return;
    }
    
    // 클릭 이벤트 발생
    console.log('  → 클릭 이벤트 발생...');
    button.click();
    
    // 잠시 후 상태 확인
    setTimeout(() => {
        console.log('  → 클릭 후 상태:');
        const submenu = checkSubmenuState();
        
        if (submenu && submenu.dataset.open === 'true') {
            console.log('✅ 서브메뉴가 열렸습니다!');
        } else {
            console.log('⚠️ 서브메뉴가 아직 닫혀있습니다');
        }
    }, 500);
}

// 4. 수동으로 서브메뉴 열기
function forceOpenSubmenu(tabName = 'project') {
    console.log(`\n💪 서브메뉴 강제 열기 (tab: ${tabName})`);
    
    const submenu = document.querySelector('[data-testid="submenu"]');
    if (!submenu) {
        console.log('❌ 서브메뉴 요소가 없습니다');
        return;
    }
    
    // 데이터 속성 변경
    submenu.dataset.open = 'true';
    submenu.dataset.tab = tabName;
    
    // 인라인 스타일로 강제 표시
    submenu.style.transform = 'translateX(0)';
    submenu.style.opacity = '1';
    submenu.style.visibility = 'visible';
    submenu.style.pointerEvents = 'auto';
    
    console.log('✅ 서브메뉴를 강제로 열었습니다');
    console.log('  - transform: translateX(0)');
    console.log('  - opacity: 1');
    console.log('  - visibility: visible');
}

// 5. React 상태 직접 변경 (React DevTools 필요)
function updateReactState() {
    console.log('\n⚛️ React 상태 업데이트 방법:');
    console.log('1. React DevTools 열기');
    console.log('2. EnhancedSideBar 컴포넌트 찾기');
    console.log('3. 다음 state 값 변경:');
    console.log('   - subMenuOpen: true');
    console.log('   - tabName: "project" (또는 "feedback", "video-planning")');
}

// 실행 메뉴
console.log('\n📝 사용 가능한 명령어:');
console.log('- checkSubmenuState() : 현재 서브메뉴 상태 확인');
console.log('- findMenuButtons() : 메뉴 버튼 찾기');
console.log('- testMenuClick("project") : 프로젝트 관리 클릭');
console.log('- testMenuClick("planning") : 영상 기획 클릭');
console.log('- testMenuClick("feedback") : 영상 피드백 클릭');
console.log('- forceOpenSubmenu("project") : 서브메뉴 강제 열기');
console.log('- updateReactState() : React 상태 변경 가이드');

// 초기 상태 확인
console.log('\n📋 초기 상태:');
checkSubmenuState();
findMenuButtons();

// 자동 테스트 실행 여부
console.log('\n💡 자동 테스트를 실행하려면: testMenuClick("project")');