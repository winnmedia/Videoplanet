#!/usr/bin/env node

/**
 * VideoPlanet 로그인 테스트 스크립트
 */

const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

// 테스트할 계정 목록 (다양한 패스워드 조합 시도)
const TEST_CREDENTIALS = [
  { email: 'test@videoplanet.com', password: 'Test1234!' },
  { email: 'test@videoplanet.com', password: 'test1234' },
  { email: 'test@videoplanet.com', password: 'Test123!' },
  { email: 'test@videoplanet.com', password: 'password' },
  { email: 'admin@videoplanet.com', password: 'Admin1234!' },
  { email: 'admin@videoplanet.com', password: 'admin' },
  { email: 'demo@videoplanet.com', password: 'Demo1234!' },
];

// axios 인스턴스
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 로그인 시도 함수
async function attemptLogin(email, password) {
  try {
    console.log(`\n🔐 로그인 시도: ${email} / ${password}`);
    
    const response = await api.post('/users/login', {
      email: email,
      password: password
    });
    
    if (response.status === 200) {
      console.log(`✅ 로그인 성공!`);
      console.log(`   응답 데이터:`, JSON.stringify(response.data, null, 2));
      
      // 토큰이 있으면 표시
      const token = response.data.access || response.data.token || response.data.access_token;
      if (token) {
        console.log(`   🎫 토큰: ${token.substring(0, 30)}...`);
      }
      
      // 사용자 정보가 있으면 표시
      if (response.data.user) {
        console.log(`   👤 사용자:`, response.data.user);
      }
      
      return { success: true, data: response.data };
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ 로그인 실패: ${error.response.status}`);
      
      // 구체적인 에러 메시지 표시
      const errorData = error.response.data;
      if (errorData.message) {
        console.log(`   메시지: ${errorData.message}`);
      } else if (errorData.error) {
        console.log(`   에러: ${errorData.error}`);
      } else {
        console.log(`   응답:`, JSON.stringify(errorData));
      }
    } else {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    return { success: false };
  }
}

// 프로젝트 목록 조회 테스트
async function testProjectList(token) {
  try {
    console.log(`\n📋 프로젝트 목록 조회 테스트...`);
    
    const response = await api.get('/projects/project_list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ 프로젝트 목록 조회 성공!`);
    console.log(`   프로젝트 수: ${response.data.result?.length || 0}`);
    return true;
  } catch (error) {
    console.log(`❌ 프로젝트 목록 조회 실패: ${error.response?.status || error.message}`);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  console.log('========================================');
  console.log('VideoPlanet 로그인 테스트');
  console.log(`백엔드 URL: ${API_BASE_URL}`);
  console.log('========================================');
  
  let successfulLogin = null;
  
  // 모든 자격 증명으로 로그인 시도
  for (const cred of TEST_CREDENTIALS) {
    const result = await attemptLogin(cred.email, cred.password);
    
    if (result.success) {
      successfulLogin = result;
      console.log('\n🎉 로그인 성공한 계정 발견!');
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      
      // 토큰으로 API 접근 테스트
      const token = result.data.access || result.data.token || result.data.access_token;
      if (token) {
        await testProjectList(token);
      }
      
      break;
    }
  }
  
  if (!successfulLogin) {
    console.log('\n⚠️ 모든 로그인 시도 실패');
    console.log('💡 팁: Railway 콘솔에서 직접 계정을 생성해야 할 수 있습니다:');
    console.log('   python manage.py createsuperuser');
  }
  
  console.log('\n========================================');
  console.log('테스트 완료');
  console.log('========================================');
}

// 스크립트 실행
main().catch(error => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
});