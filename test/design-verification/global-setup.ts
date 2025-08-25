import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎨 VideoPlanet 디자인 검증 시스템 시작');
  console.log('─'.repeat(60));
  
  // 개발 서버 상태 확인
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('📡 개발 서버 연결 확인 중...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ 개발 서버 연결 성공 (http://localhost:3001)');
  } catch (error) {
    console.error('❌ 개발 서버에 연결할 수 없습니다:', error.message);
    console.error('💡 다음 명령으로 개발 서버를 시작하세요: npm run dev -- -p 3001');
    throw error;
  }

  // 디자인 토큰 파일 존재 여부 확인
  try {
    const fs = require('fs');
    const tokenPath = './src/shared/styles/design-tokens.scss';
    if (fs.existsSync(tokenPath)) {
      console.log('✅ 디자인 토큰 파일 확인 완료');
    } else {
      console.warn('⚠️ 디자인 토큰 파일을 찾을 수 없습니다:', tokenPath);
    }
  } catch (error) {
    console.warn('⚠️ 디자인 토큰 파일 확인 실패:', error.message);
  }

  // 테스트 결과 디렉토리 생성
  const fs = require('fs').promises;
  const path = require('path');
  
  const reportDirs = [
    './test-results/design-verification-report',
    './test-results/design-verification-artifacts',
    './test-results/design-verification-screenshots'
  ];

  for (const dir of reportDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 리포트 디렉토리 생성: ${dir}`);
    } catch (error) {
      console.warn(`⚠️ 디렉토리 생성 실패: ${dir}`, error.message);
    }
  }

  // 브라우저 환경 정보 출력
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const viewport = await page.viewportSize();
  
  console.log('🖥️ 브라우저 환경:');
  console.log(`   User Agent: ${userAgent}`);
  console.log(`   Viewport: ${viewport?.width}x${viewport?.height}`);
  
  await browser.close();
  
  console.log('─'.repeat(60));
  console.log('🚀 디자인 검증 테스트 시작 준비 완료');
  console.log('');
}

export default globalSetup;