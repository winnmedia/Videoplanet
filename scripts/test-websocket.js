#!/usr/bin/env node

/**
 * WebSocket 연결 테스트 스크립트
 * 사용법: node scripts/test-websocket.js
 */

const WebSocket = require('ws');
const readline = require('readline');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 테스트 설정
const WS_URL = process.env.WS_URL || 'ws://localhost:8000';
const TEST_ENDPOINTS = [
  '/ws/notifications/',
  '/ws/feedback/test-feedback-123/',
  '/ws/project/test-project-456/',
  '/ws/collaboration/test-session-789/',
];

// 로그 함수
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// WebSocket 연결 테스트
async function testWebSocketConnection(endpoint) {
  return new Promise((resolve) => {
    const url = `${WS_URL}${endpoint}`;
    log(`\n테스트: ${url}`, 'cyan');
    
    const ws = new WebSocket(url);
    let connected = false;
    let messageReceived = false;
    
    // 타임아웃 설정 (5초)
    const timeout = setTimeout(() => {
      if (!connected) {
        log(`  ❌ 연결 타임아웃`, 'red');
        ws.close();
        resolve({ endpoint, success: false, error: 'Timeout' });
      }
    }, 5000);
    
    ws.on('open', () => {
      connected = true;
      clearTimeout(timeout);
      log(`  ✅ 연결 성공`, 'green');
      
      // 테스트 메시지 전송
      const testMessage = JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      });
      
      ws.send(testMessage);
      log(`  📤 메시지 전송: ${testMessage}`, 'blue');
      
      // 응답 대기 (2초)
      setTimeout(() => {
        if (!messageReceived) {
          log(`  ⚠️  응답 없음`, 'yellow');
        }
        ws.close();
        resolve({ endpoint, success: true, messageReceived });
      }, 2000);
    });
    
    ws.on('message', (data) => {
      messageReceived = true;
      log(`  📥 메시지 수신: ${data}`, 'green');
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      log(`  ❌ 에러: ${error.message}`, 'red');
      resolve({ endpoint, success: false, error: error.message });
    });
    
    ws.on('close', (code, reason) => {
      log(`  🔌 연결 종료 (코드: ${code}, 이유: ${reason || '없음'})`, 'yellow');
    });
  });
}

// 부하 테스트
async function loadTest(endpoint, connections = 10) {
  log(`\n📊 부하 테스트 시작: ${connections}개 동시 연결`, 'magenta');
  
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < connections; i++) {
    promises.push(
      new Promise((resolve) => {
        const ws = new WebSocket(`${WS_URL}${endpoint}`);
        const connectionStart = Date.now();
        
        ws.on('open', () => {
          const connectionTime = Date.now() - connectionStart;
          resolve({ success: true, connectionTime });
          ws.close();
        });
        
        ws.on('error', () => {
          resolve({ success: false, connectionTime: -1 });
        });
        
        setTimeout(() => {
          ws.close();
          resolve({ success: false, connectionTime: -1 });
        }, 10000);
      })
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successful = results.filter(r => r.success).length;
  const avgConnectionTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.connectionTime, 0) / successful || 0;
  
  log(`\n📊 부하 테스트 결과:`, 'cyan');
  log(`  - 총 연결 시도: ${connections}`);
  log(`  - 성공: ${successful} (${(successful / connections * 100).toFixed(1)}%)`);
  log(`  - 실패: ${connections - successful}`);
  log(`  - 평균 연결 시간: ${avgConnectionTime.toFixed(2)}ms`);
  log(`  - 총 소요 시간: ${totalTime}ms`);
}

// 대화형 테스트
async function interactiveTest() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  log('\n💬 대화형 WebSocket 테스트', 'magenta');
  
  rl.question('WebSocket 엔드포인트 입력 (기본: /ws/notifications/): ', (endpoint) => {
    endpoint = endpoint || '/ws/notifications/';
    const url = `${WS_URL}${endpoint}`;
    
    log(`\n연결 중: ${url}`, 'cyan');
    const ws = new WebSocket(url);
    
    ws.on('open', () => {
      log('✅ 연결됨! 메시지를 입력하세요 (exit로 종료):', 'green');
      
      rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
          ws.close();
          rl.close();
          process.exit(0);
        }
        
        // JSON 형식 자동 감지
        let message = input;
        try {
          JSON.parse(input);
        } catch {
          // JSON이 아니면 기본 메시지 형식으로 래핑
          message = JSON.stringify({
            type: 'message',
            content: input,
            timestamp: Date.now(),
          });
        }
        
        ws.send(message);
        log(`📤 전송: ${message}`, 'blue');
      });
    });
    
    ws.on('message', (data) => {
      log(`📥 수신: ${data}`, 'green');
    });
    
    ws.on('error', (error) => {
      log(`❌ 에러: ${error.message}`, 'red');
      rl.close();
      process.exit(1);
    });
    
    ws.on('close', () => {
      log('연결 종료됨', 'yellow');
      rl.close();
      process.exit(0);
    });
  });
}

// 메인 함수
async function main() {
  log('🚀 VideoP lanet WebSocket 테스트', 'cyan');
  log('=====================================\n');
  
  // 서버 연결 확인
  log('1️⃣  서버 연결 테스트', 'yellow');
  for (const endpoint of TEST_ENDPOINTS) {
    await testWebSocketConnection(endpoint);
  }
  
  // 부하 테스트
  log('\n2️⃣  부하 테스트', 'yellow');
  await loadTest('/ws/notifications/', 20);
  
  // 대화형 테스트 옵션
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('\n대화형 테스트를 시작하시겠습니까? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.close();
      interactiveTest();
    } else {
      log('\n✅ 테스트 완료!', 'green');
      rl.close();
      process.exit(0);
    }
  });
}

// WebSocket 모듈 확인
try {
  require.resolve('ws');
} catch (e) {
  log('ws 모듈을 설치해주세요: npm install -g ws', 'red');
  process.exit(1);
}

// 실행
main().catch((error) => {
  log(`\n❌ 테스트 실패: ${error.message}`, 'red');
  process.exit(1);
});