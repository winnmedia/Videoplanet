// 서브메뉴 UX 분석 스크립트
// 브라우저 콘솔에서 실행하여 서브메뉴 상태를 분석합니다.

(function analyzeSubmenu() {
  console.log('=== VideoplaNet 서브메뉴 UX 분석 시작 ===\n');

  // 1. 서브메뉴 요소 찾기
  const submenu = document.querySelector('[data-testid="submenu"]');
  const sidebar = document.querySelector('[role="navigation"]');
  
  if (!submenu) {
    console.error('❌ 서브메뉴를 찾을 수 없습니다.');
    return;
  }

  // 2. 현재 렌더링 상태 분석
  const computedStyles = window.getComputedStyle(submenu);
  const rect = submenu.getBoundingClientRect();
  
  console.log('📊 서브메뉴 렌더링 상태:');
  console.log('----------------------------');
  console.log('Display:', computedStyles.display);
  console.log('Visibility:', computedStyles.visibility);
  console.log('Opacity:', computedStyles.opacity);
  console.log('Transform:', computedStyles.transform);
  console.log('Position:', computedStyles.position);
  console.log('Left:', computedStyles.left);
  console.log('Width:', computedStyles.width);
  console.log('Height:', computedStyles.height);
  console.log('Z-index:', computedStyles.zIndex);
  console.log('Overflow:', computedStyles.overflow);
  console.log('\n📐 Bounding Box:');
  console.log('X:', rect.x, 'Y:', rect.y);
  console.log('Width:', rect.width, 'Height:', rect.height);
  console.log('Visible in viewport:', rect.width > 0 && rect.height > 0);

  // 3. 데이터 속성 확인
  console.log('\n🏷️ 데이터 속성:');
  console.log('----------------------------');
  console.log('data-open:', submenu.getAttribute('data-open'));
  console.log('data-tab:', submenu.getAttribute('data-tab'));
  console.log('aria-hidden:', submenu.getAttribute('aria-hidden'));
  console.log('aria-label:', submenu.getAttribute('aria-label'));
  console.log('role:', submenu.getAttribute('role'));
  console.log('className:', submenu.className);

  // 4. CSS 클래스 분석
  console.log('\n🎨 CSS 클래스:');
  console.log('----------------------------');
  const classes = submenu.className.split(' ');
  classes.forEach(cls => {
    if (cls) console.log('-', cls);
  });

  // 5. 트랜지션 분석
  console.log('\n⚡ 애니메이션/트랜지션:');
  console.log('----------------------------');
  console.log('Transition:', computedStyles.transition);
  console.log('Animation:', computedStyles.animation);
  console.log('Transform-origin:', computedStyles.transformOrigin);

  // 6. 부모 요소 관계 분석
  console.log('\n👪 부모 요소 관계:');
  console.log('----------------------------');
  const parent = submenu.parentElement;
  if (parent) {
    console.log('Parent tag:', parent.tagName);
    console.log('Parent class:', parent.className);
    const parentStyles = window.getComputedStyle(parent);
    console.log('Parent position:', parentStyles.position);
    console.log('Parent overflow:', parentStyles.overflow);
  }

  // 7. 사이드바와의 위치 관계
  if (sidebar) {
    const sidebarRect = sidebar.getBoundingClientRect();
    console.log('\n📍 사이드바와의 관계:');
    console.log('----------------------------');
    console.log('사이드바 right edge:', sidebarRect.right);
    console.log('서브메뉴 left edge:', rect.left);
    console.log('Gap:', rect.left - sidebarRect.right);
  }

  // 8. 접근성 체크
  console.log('\n♿ 접근성 체크:');
  console.log('----------------------------');
  const focusableElements = submenu.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  console.log('포커스 가능한 요소 수:', focusableElements.length);
  console.log('키보드 트랩 설정:', submenu.hasAttribute('data-focus-trap'));
  
  // 9. 반응형 체크
  console.log('\n📱 반응형 상태:');
  console.log('----------------------------');
  console.log('Viewport width:', window.innerWidth);
  console.log('Is mobile (< 768px):', window.innerWidth < 768);
  console.log('Media query matches:');
  console.log('- mobile:', window.matchMedia('(max-width: 767px)').matches);
  console.log('- tablet:', window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches);
  console.log('- desktop:', window.matchMedia('(min-width: 1024px)').matches);

  // 10. 문제 진단
  console.log('\n🔍 문제 진단:');
  console.log('----------------------------');
  
  const issues = [];
  
  if (computedStyles.display === 'none') {
    issues.push('❌ display가 none으로 설정됨');
  }
  if (computedStyles.visibility === 'hidden') {
    issues.push('❌ visibility가 hidden으로 설정됨');
  }
  if (parseFloat(computedStyles.opacity) === 0) {
    issues.push('❌ opacity가 0으로 설정됨');
  }
  if (rect.width === 0 || rect.height === 0) {
    issues.push('❌ 요소의 크기가 0');
  }
  if (rect.left < -rect.width) {
    issues.push('❌ 화면 왼쪽 밖으로 벗어남');
  }
  if (rect.right > window.innerWidth + rect.width) {
    issues.push('❌ 화면 오른쪽 밖으로 벗어남');
  }
  
  const transform = computedStyles.transform;
  if (transform && transform !== 'none') {
    const match = transform.match(/translateX\(([-\d.]+)/);
    if (match && parseFloat(match[1]) < -100) {
      issues.push(`❌ translateX(${match[1]})로 화면 밖으로 이동됨`);
    }
  }

  if (issues.length > 0) {
    console.log('발견된 문제:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ 렌더링 문제 없음');
  }

  // 11. 상태 변경 시뮬레이션
  console.log('\n🎮 상태 변경 테스트:');
  console.log('----------------------------');
  console.log('프로젝트 관리 버튼을 클릭하여 서브메뉴를 열어보세요.');
  console.log('또는 다음 명령을 실행하세요:');
  console.log("document.querySelector('button:has-text(\"프로젝트 관리\")').click()");

  console.log('\n=== 분석 완료 ===');
  
  // 결과 객체 반환
  return {
    found: true,
    visible: rect.width > 0 && rect.height > 0 && 
             computedStyles.display !== 'none' && 
             computedStyles.visibility !== 'hidden' &&
             parseFloat(computedStyles.opacity) > 0,
    issues: issues,
    state: {
      display: computedStyles.display,
      visibility: computedStyles.visibility,
      opacity: computedStyles.opacity,
      transform: computedStyles.transform,
      dataOpen: submenu.getAttribute('data-open'),
      dataTab: submenu.getAttribute('data-tab')
    }
  };
})();