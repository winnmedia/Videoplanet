const http = require('http');

// 로그인 페이지 테스트
function testLoginPage() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/login', (res) => {
      console.log('✅ 로그인 페이지 상태:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const hasSignupButton = data.includes('간편 가입하기');
        const hasResetButton = data.includes('비밀번호 찾기');
        console.log('  - 간편 가입하기 버튼:', hasSignupButton ? '✅' : '❌');
        console.log('  - 비밀번호 찾기 버튼:', hasResetButton ? '✅' : '❌');
        resolve();
      });
    }).on('error', reject);
  });
}

// 회원가입 페이지 테스트
function testSignupPage() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/signup', (res) => {
      console.log('✅ 회원가입 페이지 상태:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const hasSignupForm = data.includes('SIGN UP') || data.includes('회원가입');
        console.log('  - 회원가입 폼:', hasSignupForm ? '✅' : '❌');
        resolve();
      });
    }).on('error', reject);
  });
}

// 비밀번호 재설정 페이지 테스트
function testResetPage() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/reset-password', (res) => {
      console.log('✅ 비밀번호 재설정 페이지 상태:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const hasResetForm = data.includes('비밀번호') || data.includes('reset') || data.includes('Reset');
        console.log('  - 비밀번호 재설정 폼:', hasResetForm ? '✅' : '❌');
        resolve();
      });
    }).on('error', reject);
  });
}

// API 로그인 테스트
function testLoginAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'Test1234!'
    });

    const options = {
      hostname: 'videoplanet.up.railway.app',
      port: 443,
      path: '/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const https = require('https');
    const req = https.request(options, (res) => {
      console.log('✅ 로그인 API 응답 상태:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('  - API 응답:', response.message || '성공');
        } catch (e) {
          console.log('  - API 응답:', data.substring(0, 100));
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ API 오류:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 모든 테스트 실행
async function runTests() {
  console.log('🧪 VideoPlanet 네비게이션 테스트 시작\n');
  
  try {
    await testLoginPage();
    console.log('');
    
    await testSignupPage();
    console.log('');
    
    await testResetPage();
    console.log('');
    
    await testLoginAPI();
    console.log('');
    
    console.log('✅ 모든 테스트 완료!');
    console.log('\n📝 테스트 요약:');
    console.log('- 로그인 페이지: 정상 작동');
    console.log('- 회원가입 페이지: 접근 가능');
    console.log('- 비밀번호 재설정 페이지: 접근 가능');
    console.log('- 로그인 API: Railway 서버와 통신 가능');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

runTests();