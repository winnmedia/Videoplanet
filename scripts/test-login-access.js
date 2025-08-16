#!/usr/bin/env node

/**
 * 로그인 페이지 접속 테스트 스크립트
 * 실제 브라우저 환경을 시뮬레이션하여 문제를 진단합니다.
 */

const http = require('http');

const testUrls = [
  'http://localhost:3001/login',
  'http://localhost:3001/Login',  // 대문자 테스트
  'http://localhost:3001/(auth)/login',  // 잘못된 경로
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n테스트: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  상태 코드: ${res.statusCode}`);
        console.log(`  Location: ${res.headers.location || 'N/A'}`);
        
        // HTML 컨텐츠 확인
        if (data.includes('auth-container')) {
          console.log('  ✅ 로그인 페이지 HTML 발견');
        } else if (data.includes('404')) {
          console.log('  ❌ 404 페이지');
        } else if (data.includes('<!DOCTYPE html>')) {
          console.log('  ⚠️  HTML은 있지만 로그인 페이지가 아님');
          
          // 주요 요소 체크
          if (data.includes('email') || data.includes('password')) {
            console.log('    → 이메일/비밀번호 필드 발견');
          }
          if (data.includes('Login.scss') || data.includes('Login.css')) {
            console.log('    → 로그인 스타일시트 로드됨');
          }
        }
        
        resolve();
      });
    }).on('error', (err) => {
      console.log(`  ❌ 에러: ${err.message}`);
      resolve();
    });
  });
}

async function runTests() {
  console.log('=== 로그인 페이지 접속 테스트 시작 ===');
  
  for (const url of testUrls) {
    await testUrl(url);
  }
  
  console.log('\n=== 테스트 완료 ===');
  
  // 권장사항
  console.log('\n📋 권장사항:');
  console.log('1. 브라우저 캐시 삭제 (Ctrl+Shift+R)');
  console.log('2. 개발자 도구 Network 탭에서 상태 확인');
  console.log('3. 콘솔 에러 메시지 확인');
  console.log('4. http://localhost:3001/login 직접 접속');
}

runTests();