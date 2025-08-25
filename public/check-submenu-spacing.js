// 서브메뉴 간격 확인 스크립트
console.log('🔍 서브메뉴 스타일 점검 중...');

const submenu = document.querySelector('[data-testid="submenu"]');
if (submenu) {
    // 서브메뉴 스타일 확인
    const styles = window.getComputedStyle(submenu);
    console.log('📏 서브메뉴 레이아웃:');
    console.log('  - 너비:', styles.width);
    console.log('  - 패딩:', styles.padding);
    console.log('  - 배경:', styles.background);
    
    // 메뉴 아이템 확인
    const menuItems = submenu.querySelectorAll('button');
    if (menuItems.length > 0) {
        const firstItem = menuItems[0];
        const itemStyles = window.getComputedStyle(firstItem);
        console.log('\n📏 메뉴 아이템 스타일:');
        console.log('  - 패딩:', itemStyles.padding);
        console.log('  - 최소 높이:', itemStyles.minHeight);
        console.log('  - 라인 높이:', itemStyles.lineHeight);
        
        // 아이콘 확인
        const icon = firstItem.querySelector('.submenuIcon, [class*="submenuIcon"]');
        if (icon) {
            const iconStyles = window.getComputedStyle(icon);
            console.log('\n🎨 아이콘 스타일:');
            console.log('  - 크기:', iconStyles.width, 'x', iconStyles.height);
            console.log('  - 위치 (left):', iconStyles.left);
            console.log('  - 배경:', iconStyles.background);
        }
        
        // 항목 간 간격 확인
        if (menuItems.length > 1) {
            const li1 = menuItems[0].parentElement;
            const li2 = menuItems[1].parentElement;
            if (li1 && li2) {
                const margin = window.getComputedStyle(li1).marginBottom;
                console.log('\n📏 항목 간 간격:', margin);
            }
        }
    }
    
    // 헤더 확인
    const header = submenu.querySelector('[class*="submenuHeader"]');
    if (header) {
        const headerStyles = window.getComputedStyle(header);
        console.log('\n📋 헤더 스타일:');
        console.log('  - 마진 하단:', headerStyles.marginBottom);
        console.log('  - 패딩 하단:', headerStyles.paddingBottom);
        console.log('  - 테두리:', headerStyles.borderBottom);
    }
    
    console.log('\n✅ 스타일 점검 완료');
} else {
    console.log('❌ 서브메뉴를 찾을 수 없습니다');
    console.log('💡 먼저 프로젝트 관리 버튼을 클릭하세요');
}
