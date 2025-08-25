// VideoplaNet 서브메뉴 수정 스크립트
console.log('🔧 서브메뉴 수정 시작...');

// 서브메뉴 찾기
const submenu = document.querySelector('[data-testid="submenu"]');

if (submenu) {
    console.log('✅ 서브메뉴 발견');
    
    // 현재 상태
    console.log('현재 클래스:', submenu.className);
    console.log('data-open:', submenu.dataset.open);
    
    // CSS 클래스 수정
    const cssClass = Array.from(submenu.classList).find(c => c.includes('submenu'));
    const activeClass = Array.from(submenu.classList).find(c => c.includes('active'));
    
    console.log('CSS 모듈 클래스:', cssClass);
    console.log('Active 클래스:', activeClass);
    
    // 강제 표시
    submenu.style.cssText = `
        display: block !important;
        position: fixed !important;
        left: 300px !important;
        top: 0 !important;
        width: 330px !important;
        height: 100vh !important;
        background: #f8f8f8 !important;
        z-index: 9999 !important;
        transform: translateX(0) !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        box-shadow: 0 0 20px rgba(0,0,0,0.2) !important;
        border-radius: 0 30px 30px 0 !important;
        padding: 50px 30px !important;
        overflow-y: auto !important;
    `;
    
    console.log('✅ 서브메뉴를 강제로 표시했습니다!');
    
    // 내용 확인
    const title = submenu.querySelector('h2');
    if (title) {
        console.log('서브메뉴 제목:', title.textContent);
    }
    
    // 메뉴 항목 확인
    const menuItems = submenu.querySelectorAll('button');
    console.log('서브메뉴 항목 수:', menuItems.length);
    
} else {
    console.log('❌ 서브메뉴를 찾을 수 없습니다');
    console.log('💡 프로젝트 관리 버튼을 클릭해보세요');
}

console.log('🏁 스크립트 완료');
