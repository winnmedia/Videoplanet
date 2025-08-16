#!/usr/bin/env node

const http = require('http');

// 클라이언트 JavaScript가 로드되는지 확인
http.get('http://localhost:3001/', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('=== 클라이언트 JavaScript 로드 확인 ===\n');
    
    // JavaScript 파일 로드 확인
    const jsFiles = html.match(/static\/chunks\/[^"]+\.js/g) || [];
    console.log(`✅ JavaScript 파일 ${jsFiles.length}개 발견:`);
    jsFiles.forEach(file => console.log(`   - ${file}`));
    
    // onClick 속성 확인
    const onClickCount = (html.match(/onClick/g) || []).length;
    console.log(`\n❌ HTML에 onClick 속성: ${onClickCount}개 (0개는 SSR만 실행됨)`);
    
    // 'use client' 확인
    const hasUseClient = html.includes('use client');
    console.log(`\n${hasUseClient ? '✅' : '❌'} 'use client' 디렉티브: ${hasUseClient ? '포함됨' : '없음'}`);
    
    // Next.js hydration 스크립트 확인
    const hasHydration = html.includes('__next_f');
    console.log(`${hasHydration ? '✅' : '❌'} Next.js Hydration: ${hasHydration ? '활성화' : '비활성화'}`);
    
    // main-app.js 확인
    const hasMainApp = html.includes('main-app.js');
    console.log(`${hasMainApp ? '✅' : '❌'} main-app.js: ${hasMainApp ? '로드됨' : '없음'}`);
    
    console.log('\n=== 진단 결과 ===');
    if (onClickCount === 0 && hasMainApp) {
      console.log('⚠️  클라이언트 JavaScript는 로드되지만 이벤트 핸들러가 연결되지 않음');
      console.log('   → Hydration 문제 또는 컴포넌트 렌더링 문제');
      console.log('\n해결 방법:');
      console.log('1. 브라우저 개발자 도구 Console 탭에서 에러 확인');
      console.log('2. Network 탭에서 JS 파일이 404 없이 로드되는지 확인');
      console.log('3. React DevTools로 컴포넌트 상태 확인');
    }
  });
});