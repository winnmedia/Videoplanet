#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== 전체 프로젝트 심층 스캔 시작 ===\n');

// 스캔할 패턴들
const patterns = {
  useClient: /^'use client'/,
  onClick: /onClick\s*=\s*{/g,
  routerPush: /router\.push\(/g,
  useRouter: /useRouter\(/g,
  navigate: /navigate\(/g,
  linkComponent: /<Link\s+/g,
  handleClick: /handle.*Click/gi,
  buttonElements: /<button/g,
  preventDefault: /e\.preventDefault\(\)/g,
  stopPropagation: /e\.stopPropagation\(\)/g,
  windowLocation: /window\.location/g,
  ariaLabel: /aria-label/g,
  roleButton: /role="button"/g,
  tabIndex: /tabIndex/g,
};

// 문제 있는 파일들
const issues = {
  missingUseClient: [],
  missingPreventDefault: [],
  hardcodedPaths: [],
  missingAccessibility: [],
  duplicateComponents: [],
  inconsistentPatterns: []
};

// 디렉토리 스캔 함수
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      scanFile(filePath);
    }
  });
}

// 파일 스캔 함수
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // use client 체크
  const hasUseClient = patterns.useClient.test(lines[0]);
  const hasOnClick = patterns.onClick.test(content);
  const hasRouter = patterns.useRouter.test(content);
  const hasNavigate = patterns.navigate.test(content);
  
  // 클라이언트 사이드 기능이 있는데 use client가 없는 경우
  if ((hasOnClick || hasRouter) && !hasUseClient) {
    issues.missingUseClient.push(filePath);
  }
  
  // onClick 있지만 preventDefault 없는 경우
  if (hasOnClick && !patterns.preventDefault.test(content)) {
    issues.missingPreventDefault.push(filePath);
  }
  
  // 하드코딩된 경로 확인
  const hardcodedPaths = content.match(/navigate\(['"]\/[^'"]+['"]\)/g);
  if (hardcodedPaths) {
    issues.hardcodedPaths.push({ file: filePath, paths: hardcodedPaths });
  }
  
  // 버튼에 접근성 속성 누락
  const hasButtons = patterns.buttonElements.test(content);
  const hasAriaLabel = patterns.ariaLabel.test(content);
  if (hasButtons && !hasAriaLabel) {
    issues.missingAccessibility.push(filePath);
  }
  
  // 중복 컴포넌트 확인
  if (filePath.includes('src/components/') && 
      (filePath.includes('Header') || filePath.includes('SideBar'))) {
    const componentName = path.basename(filePath, path.extname(filePath));
    const newPath = filePath.replace('src/components', 'components/organisms');
    if (fs.existsSync(newPath)) {
      issues.duplicateComponents.push({ old: filePath, new: newPath });
    }
  }
}

// 스캔 시작
const projectRoot = '/home/winnmedia/videoplanet/Videoplanet';
scanDirectory(path.join(projectRoot, 'app'));
scanDirectory(path.join(projectRoot, 'src'));
scanDirectory(path.join(projectRoot, 'components'));

// 결과 출력
console.log('📊 스캔 결과\n');
console.log('='.repeat(50));

console.log('\n🚨 발견된 문제들:\n');

console.log(`1. 'use client' 누락 (${issues.missingUseClient.length}개):`);
issues.missingUseClient.slice(0, 5).forEach(file => {
  console.log(`   ❌ ${file.replace(projectRoot, '.')}`);
});
if (issues.missingUseClient.length > 5) {
  console.log(`   ... 외 ${issues.missingUseClient.length - 5}개`);
}

console.log(`\n2. preventDefault 누락 (${issues.missingPreventDefault.length}개):`);
issues.missingPreventDefault.slice(0, 5).forEach(file => {
  console.log(`   ⚠️  ${file.replace(projectRoot, '.')}`);
});

console.log(`\n3. 하드코딩된 경로 (${issues.hardcodedPaths.length}개):`);
issues.hardcodedPaths.slice(0, 5).forEach(item => {
  console.log(`   ⚠️  ${item.file.replace(projectRoot, '.')}`);
  item.paths.slice(0, 3).forEach(path => {
    console.log(`      - ${path}`);
  });
});

console.log(`\n4. 접근성 속성 누락 (${issues.missingAccessibility.length}개):`);
issues.missingAccessibility.slice(0, 5).forEach(file => {
  console.log(`   ⚠️  ${file.replace(projectRoot, '.')}`);
});

console.log(`\n5. 중복 컴포넌트 (${issues.duplicateComponents.length}개):`);
issues.duplicateComponents.forEach(item => {
  console.log(`   🔄 ${item.old.replace(projectRoot, '.')}`);
  console.log(`      → ${item.new.replace(projectRoot, '.')}`);
});

// 통계
console.log('\n📈 통계:');
console.log('='.repeat(50));
const totalIssues = 
  issues.missingUseClient.length +
  issues.missingPreventDefault.length +
  issues.hardcodedPaths.length +
  issues.missingAccessibility.length +
  issues.duplicateComponents.length;

console.log(`총 문제: ${totalIssues}개`);
console.log(`심각도 높음: ${issues.missingUseClient.length}개`);
console.log(`심각도 중간: ${issues.hardcodedPaths.length + issues.duplicateComponents.length}개`);
console.log(`심각도 낮음: ${issues.missingPreventDefault.length + issues.missingAccessibility.length}개`);

// 권장사항
console.log('\n💡 권장 해결 순서:');
console.log('1. 중복 컴포넌트 정리 (컴포넌트 통합)');
console.log('2. 하드코딩된 경로를 ROUTES 상수로 변경');
console.log('3. 누락된 use client 추가');
console.log('4. 접근성 속성 추가');
console.log('5. preventDefault/stopPropagation 일관성 확보');

console.log('\n=== 스캔 완료 ===');