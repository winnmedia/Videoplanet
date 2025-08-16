#!/usr/bin/env node

const http = require('http');

console.log('=== 📊 VideoPlanet 통합 테스트 ===\n');
console.log('테스트 시간:', new Date().toLocaleString());
console.log('='.repeat(50));

const tests = [
  { name: '홈페이지', url: 'http://localhost:3001/', check: 'body' },
  { name: '로그인 페이지', url: 'http://localhost:3001/login', check: 'auth-container' },
  { name: '회원가입 페이지', url: 'http://localhost:3001/signup', check: 'auth-container' },
  { name: '대시보드', url: 'http://localhost:3001/dashboard', check: 'dashboard' },
  { name: 'Simple 테스트', url: 'http://localhost:3001/simple-test', check: '간단한 테스트' },
  { name: 'Working 버튼 테스트', url: 'http://localhost:3001/working-button', check: '작동하는 버튼' },
  { name: 'Debug 테스트', url: 'http://localhost:3001/debug-test', check: '디버그 테스트' },
  { name: 'JavaScript 청크', url: 'http://localhost:3001/_next/static/chunks/main-app.js', check: null },
  { name: 'CSS 파일', url: 'http://localhost:3001/_next/static/css/app/layout.css', check: null },
];

async function runTest(test) {
  return new Promise((resolve) => {
    http.get(test.url, (res) => {
      if (test.check === null) {
        // 정적 파일은 상태 코드만 확인
        resolve({
          name: test.name,
          status: res.statusCode === 200 ? '✅' : '❌',
          code: res.statusCode
        });
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const found = test.check ? data.includes(test.check) : true;
          resolve({
            name: test.name,
            status: res.statusCode === 200 && found ? '✅' : '❌',
            code: res.statusCode,
            content: found ? 'Found' : 'Not found'
          });
        });
      }
    }).on('error', (err) => {
      resolve({
        name: test.name,
        status: '❌',
        error: err.message
      });
    });
  });
}

async function runAllTests() {
  console.log('\n📋 테스트 결과:\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    console.log(`${result.status} ${result.name.padEnd(25)} [${result.code || 'ERROR'}]`);
    
    if (result.status === '✅') passCount++;
    else failCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 최종 결과: ${passCount}/${tests.length} 성공`);
  
  if (failCount === 0) {
    console.log('\n🎉 모든 테스트 통과!');
    console.log('\n✅ 서버가 정상적으로 작동 중입니다.');
    console.log('✅ 모든 페이지가 접근 가능합니다.');
    console.log('✅ 정적 파일이 올바르게 서빙됩니다.');
    console.log('\n📌 브라우저에서 테스트하세요:');
    console.log('   1. http://localhost:3001/working-button');
    console.log('   2. 각 버튼을 클릭하여 동작 확인');
    console.log('   3. F12 → Console에서 에러 확인');
  } else {
    console.log(`\n⚠️  ${failCount}개 테스트 실패`);
    console.log('실패한 항목을 확인하고 수정이 필요합니다.');
  }
  
  console.log('\n=== 테스트 종료 ===');
}

runAllTests();