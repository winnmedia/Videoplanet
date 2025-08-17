#!/usr/bin/env node

/**
 * 배포 전 최종 체크리스트 검증 스크립트
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

console.log(`${colors.blue}${'='.repeat(60)}`);
console.log('VideoPlanet 배포 준비 상태 검증');
console.log(`시작 시간: ${new Date().toLocaleString()}`);
console.log(`${'='.repeat(60)}${colors.reset}`);

// 1. 필수 파일 확인
console.log(`\n${colors.cyan}[1. 필수 파일 확인]${colors.reset}`);
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'next.config.js',
  'tsconfig.json',
  'vercel.json',
  '.env.production',
  'DEPLOYMENT_GUIDE.md'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`${colors.green}✅ ${file}${colors.reset}`);
    checks.passed.push(`${file} 존재`);
  } else {
    console.log(`${colors.red}❌ ${file}${colors.reset}`);
    checks.failed.push(`${file} 누락`);
  }
});

// 2. 환경변수 확인
console.log(`\n${colors.cyan}[2. 환경변수 설정]${colors.reset}`);
const envPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_BACKEND_API_URL',
    'NEXT_PUBLIC_WS_URL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`${colors.green}✅ ${envVar}${colors.reset}`);
      checks.passed.push(`${envVar} 설정됨`);
    } else {
      console.log(`${colors.red}❌ ${envVar}${colors.reset}`);
      checks.failed.push(`${envVar} 누락`);
    }
  });
}

// 3. Git 상태
console.log(`\n${colors.cyan}[3. Git 상태]${colors.reset}`);
const { execSync } = require('child_process');

try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim() === '') {
    console.log(`${colors.green}✅ 모든 변경사항 커밋됨${colors.reset}`);
    checks.passed.push('Git 상태 깨끗함');
  } else {
    console.log(`${colors.yellow}⚠️ 커밋되지 않은 변경사항 있음${colors.reset}`);
    checks.warnings.push('커밋되지 않은 변경사항');
  }
  
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`${colors.blue}📍 현재 브랜치: ${branch}${colors.reset}`);
  
  const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
  console.log(`${colors.blue}📝 최근 커밋: ${lastCommit}${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}❌ Git 상태 확인 실패${colors.reset}`);
  checks.failed.push('Git 상태 확인 실패');
}

// 4. 빌드 가능 여부
console.log(`\n${colors.cyan}[4. 빌드 상태]${colors.reset}`);
const nextBuildPath = path.join(process.cwd(), '.next');
if (fs.existsSync(nextBuildPath)) {
  console.log(`${colors.green}✅ 빌드 폴더 존재${colors.reset}`);
  checks.passed.push('빌드 완료');
} else {
  console.log(`${colors.yellow}⚠️ 빌드 필요 (npm run build)${colors.reset}`);
  checks.warnings.push('빌드 필요');
}

// 5. 패키지 버전 확인
console.log(`\n${colors.cyan}[5. 주요 패키지 버전]${colors.reset}`);
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`• Next.js: ${packageJson.dependencies.next}`);
console.log(`• React: ${packageJson.dependencies.react}`);
console.log(`• TypeScript: ${packageJson.devDependencies.typescript}`);

// 결과 요약
console.log(`\n${colors.blue}${'='.repeat(60)}`);
console.log('📊 검증 결과 요약');
console.log(`${'='.repeat(60)}${colors.reset}`);

const totalChecks = checks.passed.length + checks.failed.length + checks.warnings.length;
const successRate = Math.round((checks.passed.length / totalChecks) * 100);

console.log(`\n${colors.green}✅ 통과: ${checks.passed.length}개${colors.reset}`);
console.log(`${colors.yellow}⚠️ 경고: ${checks.warnings.length}개${colors.reset}`);
console.log(`${colors.red}❌ 실패: ${checks.failed.length}개${colors.reset}`);
console.log(`\n📈 준비율: ${successRate}%`);

// 배포 가능 여부
console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
if (checks.failed.length === 0) {
  console.log(`${colors.green}✅ 배포 준비 완료!${colors.reset}`);
  console.log(`\n다음 명령어로 배포를 진행하세요:`);
  console.log(`${colors.cyan}npx vercel --prod${colors.reset}`);
  console.log(`\n또는 GitHub 푸시로 자동 배포:`);
  console.log(`${colors.cyan}git push origin master${colors.reset}`);
} else {
  console.log(`${colors.red}❌ 배포 전 수정 필요${colors.reset}`);
  console.log(`\n실패한 항목:`);
  checks.failed.forEach(item => console.log(`  • ${item}`));
}

console.log(`\n${colors.blue}📚 상세 가이드: DEPLOYMENT_GUIDE.md${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

process.exit(checks.failed.length > 0 ? 1 : 0);