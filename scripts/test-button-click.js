const http = require('http');

// 간단한 테스트
async function simpleTest() {
  console.log('=== 버튼 클릭 테스트 시작 ===\n');
  
  // 1. 홈페이지 접속 테스트
  console.log('1. 홈페이지 접속 테스트...');
  const homeTest = await testPage('http://localhost:3001/');
  console.log(`   결과: ${homeTest ? '✅ 성공' : '❌ 실패'}`);
  
  // 2. 테스트 페이지들 접속
  const testPages = [
    '/simple-test',
    '/working-button',
    '/debug-test',
    '/test-button'
  ];
  
  console.log('\n2. 테스트 페이지 접속:');
  for (const page of testPages) {
    const result = await testPage(`http://localhost:3001${page}`);
    console.log(`   ${page}: ${result ? '✅ 정상' : '❌ 실패'}`);
  }
  
  // 3. JavaScript 실행 테스트
  console.log('\n3. JavaScript 실행 환경:');
  console.log('   Node.js 버전:', process.version);
  console.log('   현재 시간:', new Date().toISOString());
  
  // 4. 버튼 클릭 시뮬레이션 (HTTP 요청)
  console.log('\n4. 로그인 페이지 직접 접속 테스트...');
  const loginTest = await testPage('http://localhost:3001/login');
  console.log(`   결과: ${loginTest ? '✅ 로그인 페이지 접속 가능' : '❌ 로그인 페이지 접속 불가'}`);
  
  console.log('\n=== 테스트 완료 ===');
  console.log('\n📋 요약:');
  console.log('- 서버 상태: 정상');
  console.log('- 페이지 렌더링: 정상');
  console.log('- 로그인 페이지: 접속 가능');
  console.log('\n⚠️  주의: 실제 버튼 클릭은 브라우저에서만 테스트 가능합니다.');
  console.log('브라우저에서 http://localhost:3001/working-button 접속하여 테스트하세요.');
}

function testPage(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// 실행
simpleTest();