#!/usr/bin/env node

/**
 * VideoPlanet 테스트 계정 생성 스크립트
 * Railway Django 백엔드에 테스트 계정을 생성합니다.
 */

const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

// 테스트 계정 목록
const TEST_ACCOUNTS = [
  {
    email: 'test@videoplanet.com',
    password: 'Test1234!',
    username: 'test@videoplanet.com',
    name: '테스트 사용자',
    phone: '010-1234-5678'
  },
  {
    email: 'demo@videoplanet.com',
    password: 'Demo1234!',
    username: 'demo@videoplanet.com',
    name: '데모 사용자',
    phone: '010-9876-5432'
  }
];

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 회원가입 함수
async function signUp(accountData) {
  try {
    console.log(`\n📝 회원가입 시도: ${accountData.email}`);
    
    const response = await api.post('/users/signup', accountData);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ 회원가입 성공: ${accountData.email}`);
      return true;
    } else {
      console.log(`⚠️ 회원가입 응답: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ 회원가입 실패: ${error.response.status}`);
      console.log(`   에러 메시지: ${JSON.stringify(error.response.data)}`);
      
      // 이미 존재하는 계정인 경우
      if (error.response.data?.message?.includes('이미 존재') || 
          error.response.data?.email?.includes('already exists')) {
        console.log(`   → 이미 존재하는 계정입니다.`);
        return 'exists';
      }
    } else {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    return false;
  }
}

// 로그인 테스트 함수
async function testLogin(email, password) {
  try {
    console.log(`\n🔐 로그인 테스트: ${email}`);
    
    const response = await api.post('/users/login', {
      email: email,
      password: password
    });
    
    if (response.status === 200) {
      console.log(`✅ 로그인 성공!`);
      if (response.data.access || response.data.token) {
        console.log(`   토큰 수신: ${(response.data.access || response.data.token).substring(0, 20)}...`);
      }
      return true;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ 로그인 실패: ${error.response.status}`);
      console.log(`   에러: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    return false;
  }
}

// 메인 실행 함수
async function main() {
  console.log('========================================');
  console.log('VideoPlanet 테스트 계정 생성 스크립트');
  console.log(`백엔드 URL: ${API_BASE_URL}`);
  console.log('========================================');
  
  // 서버 상태 확인
  try {
    console.log('\n🔍 서버 상태 확인 중...');
    const healthCheck = await api.get('/health/');
    console.log(`✅ 서버 상태: ${healthCheck.data.status}`);
  } catch (error) {
    console.log('⚠️ 헬스체크 실패 (서버는 작동 중일 수 있음)');
  }
  
  // 각 테스트 계정 생성 시도
  for (const account of TEST_ACCOUNTS) {
    const result = await signUp(account);
    
    // 회원가입 성공 또는 이미 존재하는 경우 로그인 테스트
    if (result === true || result === 'exists') {
      await testLogin(account.email, account.password);
    }
  }
  
  console.log('\n========================================');
  console.log('스크립트 실행 완료');
  console.log('========================================');
}

// 스크립트 실행
main().catch(error => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
});