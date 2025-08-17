#!/usr/bin/env node

/**
 * 환경변수 검증 스크립트
 * VideoPlanet 프로젝트 - Vercel 배포 환경변수 검증
 * 
 * 사용법:
 * npm run validate-env
 * node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg_red: '\x1b[41m',
  bg_green: '\x1b[42m',
  bg_yellow: '\x1b[43m'
};

// 로깅 헬퍼
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

// 필수 환경변수 정의
const REQUIRED_ENV_VARS = {
  // Backend API 설정
  'NEXT_PUBLIC_API_URL': {
    description: 'Backend API URL (Railway)',
    example: 'https://videoplanet.up.railway.app',
    required: true,
    validation: 'url_https'
  },
  'NEXT_PUBLIC_BACKEND_API_URL': {
    description: 'Backend API URL (Legacy support)',
    example: 'https://videoplanet.up.railway.app', 
    required: false, // API_URL이 있으면 선택사항
    validation: 'url_https'
  },
  
  // WebSocket 설정
  'NEXT_PUBLIC_WS_URL': {
    description: 'WebSocket URL',
    example: 'wss://videoplanet.up.railway.app',
    required: true,
    validation: 'url_ws'
  },
  'NEXT_PUBLIC_SOCKET_URI': {
    description: 'WebSocket URL (Legacy support)',
    example: 'wss://videoplanet.up.railway.app',
    required: false, // WS_URL이 있으면 선택사항
    validation: 'url_ws'
  },
  
  // Frontend App 설정
  'NEXT_PUBLIC_APP_URL': {
    description: 'Frontend App URL',
    example: 'https://videoplanet.vercel.app',
    required: true,
    validation: 'url_https'
  },
  
  // 환경 구분
  'NODE_ENV': {
    description: 'Node Environment',
    example: 'production',
    required: true,
    validation: 'node_env'
  }
};

// URL 검증 함수들
const validators = {
  url_https: (value) => {
    if (!value) return { valid: false, error: 'Value is empty' };
    
    // 프로토콜 검증
    if (!value.startsWith('https://') && !value.startsWith('http://')) {
      return { valid: false, error: 'Missing protocol (should start with https://)' };
    }
    
    // 프로덕션에서 localhost 사용 금지
    if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
      return { valid: false, error: 'localhost is not allowed in production' };
    }
    
    // 잘못된 도메인 패턴 검증
    if (value.includes('www.vlanet.net')) {
      return { valid: false, error: 'Invalid domain pattern detected' };
    }
    
    // 트레일링 슬래시 검증
    if (value.endsWith('/')) {
      return { valid: false, error: 'URL should not end with trailing slash' };
    }
    
    // 중복 슬래시 검증
    if (value.match(/([^:])\/\/+/)) {
      return { valid: false, error: 'URL contains double slashes' };
    }
    
    // URL 객체로 파싱 검증
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { valid: false, error: 'Invalid protocol' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid URL format: ${error.message}` };
    }
  },
  
  url_ws: (value) => {
    if (!value) return { valid: false, error: 'Value is empty' };
    
    // WebSocket 프로토콜 검증
    if (!value.startsWith('wss://') && !value.startsWith('ws://')) {
      return { valid: false, error: 'Missing WebSocket protocol (should start with wss://)' };
    }
    
    // 프로덕션에서 localhost 사용 금지
    if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
      return { valid: false, error: 'localhost is not allowed in production' };
    }
    
    // 트레일링 슬래시 검증
    if (value.endsWith('/')) {
      return { valid: false, error: 'WebSocket URL should not end with trailing slash' };
    }
    
    // URL 객체로 파싱 검증 (ws를 http로 변환하여 검증)
    try {
      const httpUrl = value.replace(/^wss?:\/\//, 'https://');
      new URL(httpUrl);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid WebSocket URL format: ${error.message}` };
    }
  },
  
  node_env: (value) => {
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(value)) {
      return { valid: false, error: `Invalid NODE_ENV. Must be one of: ${validEnvs.join(', ')}` };
    }
    return { valid: true };
  }
};

// .env 파일 읽기
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// 환경변수 수집
function collectEnvironmentVariables() {
  const envSources = {
    process: process.env,
    envLocal: readEnvFile('.env.local'),
    envProduction: readEnvFile('.env.production'),
    envProductionLocal: readEnvFile('.env.production.local')
  };
  
  // 우선순위: process.env > .env.production.local > .env.production > .env.local
  const mergedEnv = {
    ...envSources.envLocal,
    ...envSources.envProduction,
    ...envSources.envProductionLocal,
    ...envSources.process
  };
  
  return { merged: mergedEnv, sources: envSources };
}

// 환경변수 검증
function validateEnvironmentVariables() {
  log.title('🔍 VideoPlanet 환경변수 검증 시작');
  
  const { merged: env, sources } = collectEnvironmentVariables();
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
    warnings: []
  };
  
  // 소스 파일 상태 출력
  log.section('📁 환경변수 소스 파일 상태');
  Object.entries(sources).forEach(([source, vars]) => {
    if (source === 'process') {
      log.info(`Process ENV: ${Object.keys(vars).filter(k => k.startsWith('NEXT_PUBLIC_')).length} variables`);
    } else {
      const fileName = source.replace(/([A-Z])/g, '.$1').toLowerCase().replace(/^\./, '');
      const filePath = `.${fileName}`;
      const exists = fs.existsSync(filePath);
      const count = Object.keys(vars).length;
      
      if (exists) {
        log.success(`${filePath}: ${count} variables`);
      } else {
        log.warning(`${filePath}: Not found`);
      }
    }
  });
  
  log.section('🧪 필수 환경변수 검증');
  
  // 각 필수 환경변수 검증
  Object.entries(REQUIRED_ENV_VARS).forEach(([varName, config]) => {
    const value = env[varName];
    
    log.info(`\nChecking ${varName}:`);
    log.info(`  Description: ${config.description}`);
    log.info(`  Example: ${config.example}`);
    log.info(`  Current: ${value || '(not set)'}`);
    
    if (!value) {
      if (config.required) {
        results.failed++;
        const error = `${varName} is required but not set`;
        results.errors.push(error);
        log.error(`  ❌ ${error}`);
      } else {
        results.warnings++;
        const warning = `${varName} is not set (optional)`;
        results.warnings.push(warning);
        log.warning(`  ⚠️  ${warning}`);
      }
      return;
    }
    
    // 값 검증
    const validator = validators[config.validation];
    if (validator) {
      const validation = validator(value);
      if (validation.valid) {
        results.passed++;
        log.success(`  ✅ Valid`);
      } else {
        results.failed++;
        const error = `${varName}: ${validation.error}`;
        results.errors.push(error);
        log.error(`  ❌ ${error}`);
      }
    } else {
      results.passed++;
      log.success(`  ✅ Present (no validation rule)`);
    }
  });
  
  // 상호 의존성 검증
  log.section('🔗 상호 의존성 검증');
  
  // API URL 중복 검증
  const apiUrl = env['NEXT_PUBLIC_API_URL'];
  const backendApiUrl = env['NEXT_PUBLIC_BACKEND_API_URL'];
  
  if (apiUrl && backendApiUrl && apiUrl !== backendApiUrl) {
    results.warnings++;
    const warning = 'NEXT_PUBLIC_API_URL and NEXT_PUBLIC_BACKEND_API_URL have different values';
    results.warnings.push(warning);
    log.warning(`⚠️  ${warning}`);
  } else if (apiUrl && backendApiUrl && apiUrl === backendApiUrl) {
    log.success('✅ API URL consistency check passed');
  }
  
  // WebSocket URL 중복 검증
  const wsUrl = env['NEXT_PUBLIC_WS_URL'];
  const socketUri = env['NEXT_PUBLIC_SOCKET_URI'];
  
  if (wsUrl && socketUri && wsUrl !== socketUri) {
    results.warnings++;
    const warning = 'NEXT_PUBLIC_WS_URL and NEXT_PUBLIC_SOCKET_URI have different values';
    results.warnings.push(warning);
    log.warning(`⚠️  ${warning}`);
  } else if (wsUrl && socketUri && wsUrl === socketUri) {
    log.success('✅ WebSocket URL consistency check passed');
  }
  
  return results;
}

// Vercel 설정 가이드 출력
function printVercelGuide() {
  log.section('🚀 Vercel 대시보드 설정 가이드');
  
  console.log(`
${colors.cyan}1. Vercel 대시보드 접속:${colors.reset}
   https://vercel.com/dashboard → Videoplanet 프로젝트 → Settings → Environment Variables

${colors.cyan}2. 다음 환경변수들을 추가하세요:${colors.reset}`);

  Object.entries(REQUIRED_ENV_VARS)
    .filter(([_, config]) => config.required)
    .forEach(([varName, config]) => {
      console.log(`
   Name: ${colors.yellow}${varName}${colors.reset}
   Value: ${colors.green}${config.example}${colors.reset}
   Environment: Production, Preview, Development`);
    });

  console.log(`
${colors.cyan}3. 저장 후 자동 재배포 대기${colors.reset}

${colors.cyan}4. 배포 완료 후 브라우저 개발자 도구에서 확인:${colors.reset}
   console.log('Environment:', {
     API_URL: process.env.NEXT_PUBLIC_API_URL,
     WS_URL: process.env.NEXT_PUBLIC_WS_URL,
     APP_URL: process.env.NEXT_PUBLIC_APP_URL
   });
`);
}

// 수정 제안 출력
function printSuggestions(results) {
  if (results.errors.length === 0 && results.warnings.length === 0) {
    return;
  }
  
  log.section('💡 수정 제안');
  
  if (results.errors.length > 0) {
    log.error('오류 수정이 필요합니다:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (results.warnings.length > 0) {
    log.warning('경고 사항:');
    results.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  console.log(`
${colors.cyan}권장 조치:${colors.reset}
1. .env.production.local 파일에 올바른 환경변수 설정
2. Vercel 대시보드에서 환경변수 설정
3. 재배포 후 다시 검증 실행

${colors.cyan}도움말:${colors.reset}
- 체크리스트: docs/VERCEL_ENV_CHECKLIST.md
- 설정 파일: lib/config.ts`);
}

// Vercel 빌드 설정 검증
function validateVercelConfiguration() {
  log.section('🔧 Vercel 빌드 설정 검증');
  
  const vercelJsonPath = './vercel.json';
  const nextConfigPath = './next.config.js';
  const packageJsonPath = './package.json';
  
  const checks = {
    passed: 0,
    failed: 0,
    warnings: []
  };
  
  // vercel.json 존재 확인
  if (fs.existsSync(vercelJsonPath)) {
    log.success('✅ vercel.json 파일 존재');
    checks.passed++;
    
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      
      // 필수 설정 확인
      if (vercelConfig.framework === 'nextjs') {
        log.success('✅ Next.js 프레임워크 설정 확인');
        checks.passed++;
      } else {
        log.warning('⚠️  framework가 nextjs로 설정되지 않음');
        checks.warnings.push('vercel.json에서 framework: "nextjs" 설정 권장');
      }
      
      // 지역 설정 확인
      if (vercelConfig.regions && vercelConfig.regions.includes('icn1')) {
        log.success('✅ 서울 리전(icn1) 설정 확인');
        checks.passed++;
      }
      
      // 보안 헤더 확인
      if (vercelConfig.headers && Array.isArray(vercelConfig.headers)) {
        const securityHeaders = vercelConfig.headers.some(h => 
          h.headers && h.headers.some(header => 
            ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'].includes(header.key)
          )
        );
        
        if (securityHeaders) {
          log.success('✅ 보안 헤더 설정 확인');
          checks.passed++;
        } else {
          log.warning('⚠️  보안 헤더 설정이 부족함');
          checks.warnings.push('보안 헤더 설정 추가 권장');
        }
      }
      
      // 캐시 헤더 확인
      if (vercelConfig.headers) {
        const cacheHeaders = vercelConfig.headers.some(h => 
          h.headers && h.headers.some(header => header.key === 'Cache-Control')
        );
        
        if (cacheHeaders) {
          log.success('✅ 캐시 헤더 설정 확인');
          checks.passed++;
        }
      }
      
    } catch (error) {
      log.error(`❌ vercel.json 파싱 오류: ${error.message}`);
      checks.failed++;
    }
  } else {
    log.error('❌ vercel.json 파일이 존재하지 않음');
    checks.failed++;
  }
  
  // next.config.js 검증
  if (fs.existsSync(nextConfigPath)) {
    log.success('✅ next.config.js 파일 존재');
    checks.passed++;
  } else {
    log.warning('⚠️  next.config.js 파일이 존재하지 않음');
    checks.warnings.push('Next.js 설정 파일 권장');
  }
  
  // package.json 스크립트 검증
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = ['build', 'start', 'validate-env'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      log.success('✅ 필수 npm 스크립트 모두 존재');
      checks.passed++;
    } else {
      log.warning(`⚠️  누락된 스크립트: ${missingScripts.join(', ')}`);
      checks.warnings.push(`package.json에 누락된 스크립트 추가: ${missingScripts.join(', ')}`);
    }
  }
  
  return checks;
}

// 빌드 및 배포 준비 상태 검증
function validateBuildReadiness() {
  log.section('🏗️  빌드 준비 상태 검증');
  
  const checks = {
    passed: 0,
    failed: 0,
    warnings: []
  };
  
  // TypeScript 설정 확인
  if (fs.existsSync('./tsconfig.json')) {
    log.success('✅ TypeScript 설정 파일 존재');
    checks.passed++;
  }
  
  // 중요 디렉토리 확인
  const requiredDirs = ['app', 'components', 'lib'];
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      log.success(`✅ ${dir} 디렉토리 존재`);
      checks.passed++;
    } else {
      log.warning(`⚠️  ${dir} 디렉토리가 존재하지 않음`);
      checks.warnings.push(`${dir} 디렉토리 확인 필요`);
    }
  });
  
  // .gitignore 확인
  if (fs.existsSync('./.gitignore')) {
    const gitignore = fs.readFileSync('./.gitignore', 'utf8');
    if (gitignore.includes('.env.local') && gitignore.includes('.next')) {
      log.success('✅ .gitignore 적절히 설정됨');
      checks.passed++;
    } else {
      log.warning('⚠️  .gitignore에 중요 파일/폴더가 누락될 수 있음');
      checks.warnings.push('.gitignore 설정 확인 (.env.local, .next 등)');
    }
  }
  
  return checks;
}

// 종합 배포 준비 검증
function validateDeploymentReadiness() {
  log.section('🚀 배포 준비도 종합 검증');
  
  const envResults = validateEnvironmentVariables();
  const vercelResults = validateVercelConfiguration();
  const buildResults = validateBuildReadiness();
  
  const totalPassed = envResults.passed + vercelResults.passed + buildResults.passed;
  const totalFailed = envResults.failed + vercelResults.failed + buildResults.failed;
  const totalWarnings = envResults.warnings.length + vercelResults.warnings.length + buildResults.warnings.length;
  
  log.section('📊 종합 준비도 점수');
  log.info(`총 통과: ${totalPassed}개`);
  
  if (totalFailed > 0) {
    log.error(`총 실패: ${totalFailed}개`);
  }
  
  if (totalWarnings > 0) {
    log.warning(`총 경고: ${totalWarnings}개`);
  }
  
  // 배포 준비도 점수 계산 (100점 만점)
  const maxPossibleScore = 20; // 예상 최대 점수
  const score = Math.round((totalPassed / maxPossibleScore) * 100);
  
  log.section('🎯 배포 준비도 점수');
  if (score >= 90) {
    log.success(`🎉 배포 준비도: ${score}점 - 우수 (배포 가능)`);
  } else if (score >= 70) {
    log.warning(`⚠️  배포 준비도: ${score}점 - 양호 (배포 가능, 개선 권장)`);
  } else {
    log.error(`❌ 배포 준비도: ${score}점 - 부족 (배포 전 수정 필요)`);
  }
  
  return {
    env: envResults,
    vercel: vercelResults,
    build: buildResults,
    score,
    ready: totalFailed === 0
  };
}

// 메인 실행 함수
function main() {
  try {
    const overallResults = validateDeploymentReadiness();
    
    // 상세 결과
    if (overallResults.ready && overallResults.score >= 80) {
      log.success('\n🎉 Vercel 배포 준비 완료!');
      log.info('모든 검증을 통과했습니다. 안전하게 배포할 수 있습니다.');
      
      // 빠른 배포 가이드
      console.log(`
${colors.cyan}🚀 빠른 배포 명령어:${colors.reset}
git add . && git commit -m "feat: Vercel 배포 설정 최적화" && git push

${colors.cyan}📋 배포 후 확인사항:${colors.reset}
1. Vercel 대시보드에서 배포 상태 확인
2. 브라우저에서 사이트 정상 작동 확인
3. 개발자 도구에서 환경변수 값 확인
`);
    } else {
      // 문제점 정리
      const allWarnings = [
        ...overallResults.env.warnings,
        ...overallResults.vercel.warnings,
        ...overallResults.build.warnings
      ];
      
      const allErrors = overallResults.env.errors || [];
      
      if (allErrors.length > 0 || !overallResults.ready) {
        printSuggestions({ errors: allErrors, warnings: allWarnings });
        printVercelGuide();
        
        log.error('\n❌ 배포 전 수정이 필요합니다.');
        process.exit(1);
      } else {
        log.warning('\n⚠️  경고사항이 있지만 배포는 가능합니다.');
        if (allWarnings.length > 0) {
          log.warning('권장 개선사항:');
          allWarnings.forEach((warning, index) => {
            console.log(`   ${index + 1}. ${warning}`);
          });
        }
      }
    }
    
  } catch (error) {
    log.error(`검증 중 오류 발생: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  REQUIRED_ENV_VARS,
  validators
};