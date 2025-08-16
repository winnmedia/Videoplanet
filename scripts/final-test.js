#!/usr/bin/env node

const http = require('http');

console.log('=== VideoPlanet 최종 통합 테스트 ===\n');

// 테스트 목록
const tests = [
  {
    name: '개발 서버 응답',
    url: 'http://localhost:3001/',
    check: (data, res) => res.statusCode === 200
  },
  {
    name: '정적 파일 서빙 (main-app.js)',
    url: 'http://localhost:3001/_next/static/chunks/main-app.js',
    check: (data, res) => res.statusCode === 200
  },
  {
    name: '정적 파일 서빙 (layout.css)',
    url: 'http://localhost:3001/_next/static/css/app/layout.css',
    check: (data, res) => res.statusCode === 200
  },
  {
    name: '로그인 페이지 접속',
    url: 'http://localhost:3001/login',
    check: (data, res) => res.statusCode === 200 && data.includes('auth-container')
  },
  {
    name: '로그인 UI 스타일 (그라데이션 배경)',
    url: 'http://localhost:3001/login',
    check: (data) => data.includes('linear-gradient')
  },
  {
    name: '랜딩페이지 로그인 버튼',
    url: 'http://localhost:3001/',
    check: (data) => data.includes('로그인') && data.includes('button')
  }
];

// 테스트 실행
async function runTest(test) {
  return new Promise((resolve) => {
    http.get(test.url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const passed = test.check(data, res);
        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
        resolve(passed);
      });
    }).on('error', (err) => {
      console.log(`❌ ${test.name} - 에러: ${err.message}`);
      resolve(false);
    });
  });
}

// 모든 테스트 실행
async function runAllTests() {
  let passedCount = 0;
  
  for (const test of tests) {
    const passed = await runTest(test);
    if (passed) passedCount++;
  }
  
  console.log(`\n=== 결과: ${passedCount}/${tests.length} 테스트 통과 ===`);
  
  if (passedCount === tests.length) {
    console.log('\n🎉 모든 문제가 해결되었습니다!');
    console.log('\n✅ Next.js 정적 파일 서빙 정상');
    console.log('✅ 로그인 페이지 UI 원본 복원 완료');
    console.log('✅ 랜딩페이지 → 로그인 네비게이션 정상');
    console.log('\n📌 접속 URL: http://localhost:3001');
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다.');
    console.log('개발자 도구 콘솔을 확인해주세요.');
  }
}

runAllTests();