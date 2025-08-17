#!/usr/bin/env node

/**
 * Vercel 빌드 최적화 스크립트
 * VideoPlanet 프로젝트 - 빌드 성능 향상 및 캐시 최적화
 * 
 * 사용법:
 * npm run build:optimize
 * node scripts/optimize-build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
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

// Next.js 빌드 분석
function analyzeBuild() {
  log.section('📊 Next.js 빌드 분석');
  
  try {
    // 빌드 폴더 크기 측정
    if (fs.existsSync('.next')) {
      const buildSize = execSync('du -sh .next', { encoding: 'utf8' }).trim();
      log.info(`빌드 폴더 크기: ${buildSize.split('\t')[0]}`);
    }
    
    // package.json 의존성 분석
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    
    log.info(`프로덕션 의존성: ${depCount}개`);
    log.info(`개발 의존성: ${devDepCount}개`);
    
    // node_modules 크기 (존재하는 경우)
    if (fs.existsSync('node_modules')) {
      try {
        const nodeModulesSize = execSync('du -sh node_modules', { encoding: 'utf8' }).trim();
        log.info(`node_modules 크기: ${nodeModulesSize.split('\t')[0]}`);
      } catch (error) {
        log.warning('node_modules 크기 측정 실패');
      }
    }
    
    return { depCount, devDepCount };
  } catch (error) {
    log.error(`빌드 분석 중 오류: ${error.message}`);
    return null;
  }
}

// 빌드 캐시 최적화
function optimizeBuildCache() {
  log.section('🗄️  빌드 캐시 최적화');
  
  const optimizations = [];
  
  // .next 캐시 정리 (오래된 캐시)
  if (fs.existsSync('.next/cache')) {
    try {
      const cacheFiles = fs.readdirSync('.next/cache');
      log.info(`캐시 파일 수: ${cacheFiles.length}개`);
      
      // 7일 이상 된 캐시 파일 정리
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let cleanedFiles = 0;
      
      cacheFiles.forEach(file => {
        const filePath = path.join('.next/cache', file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          cleanedFiles++;
        }
      });
      
      if (cleanedFiles > 0) {
        log.success(`오래된 캐시 파일 ${cleanedFiles}개 정리됨`);
        optimizations.push(`캐시 파일 ${cleanedFiles}개 정리`);
      } else {
        log.info('정리할 오래된 캐시 파일 없음');
      }
    } catch (error) {
      log.warning(`캐시 정리 중 오류: ${error.message}`);
    }
  }
  
  // TypeScript 빌드 정보 캐시 확인
  if (fs.existsSync('tsconfig.tsbuildinfo')) {
    const stats = fs.statSync('tsconfig.tsbuildinfo');
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    log.info(`TypeScript 빌드 캐시: ${sizeInMB}MB`);
    
    // 크기가 10MB 이상이면 경고
    if (stats.size > 10 * 1024 * 1024) {
      log.warning('TypeScript 빌드 캐시가 큰 편입니다. 정리를 고려하세요.');
    }
  }
  
  return optimizations;
}

// 번들 사이즈 최적화 제안
function suggestBundleOptimizations() {
  log.section('📦 번들 사이즈 최적화 제안');
  
  const suggestions = [];
  
  // package.json 분석
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  // 큰 라이브러리 체크
  const heavyLibraries = [
    'moment', 'lodash', 'antd', 'bootstrap'
  ];
  
  const foundHeavyLibs = heavyLibraries.filter(lib => dependencies[lib]);
  
  if (foundHeavyLibs.length > 0) {
    log.warning(`큰 라이브러리 발견: ${foundHeavyLibs.join(', ')}`);
    foundHeavyLibs.forEach(lib => {
      switch (lib) {
        case 'moment':
          suggestions.push('moment → day.js로 교체 고려 (번들 크기 ~75% 감소)');
          break;
        case 'lodash':
          suggestions.push('lodash → lodash-es 또는 개별 함수 import 고려');
          break;
        case 'antd':
          suggestions.push('antd → 필요한 컴포넌트만 import하여 tree-shaking 활용');
          break;
        default:
          suggestions.push(`${lib} 사용량 검토 및 대안 라이브러리 고려`);
      }
    });
  }
  
  // Next.js 최적화 설정 확인
  if (fs.existsSync('next.config.js')) {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    // 이미지 최적화 설정 확인
    if (!nextConfig.includes('images')) {
      suggestions.push('next.config.js에 이미지 최적화 설정 추가 권장');
    }
    
    // 번들 분석기 설정 확인
    if (!nextConfig.includes('bundleAnalyzer')) {
      suggestions.push('@next/bundle-analyzer 설치로 번들 크기 분석 권장');
    }
  }
  
  // Tree-shaking 최적화 체크
  if (!packageJson.sideEffects) {
    suggestions.push('package.json에 "sideEffects": false 추가로 tree-shaking 최적화');
  }
  
  return suggestions;
}

// Vercel 배포 최적화 설정
function optimizeVercelSettings() {
  log.section('🚀 Vercel 배포 최적화');
  
  const optimizations = [];
  
  // vercel.json 확인 및 최적화
  if (fs.existsSync('vercel.json')) {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // 함수 타임아웃 설정 확인
    if (!vercelConfig.functions) {
      log.warning('vercel.json에 함수 타임아웃 설정이 없습니다');
      optimizations.push('functions 설정으로 API 타임아웃 최적화 권장');
    }
    
    // 빌드 출력 최적화 확인
    if (vercelConfig.outputDirectory !== '.next') {
      log.warning('출력 디렉토리 설정이 Next.js 기본값과 다릅니다');
    } else {
      log.success('출력 디렉토리 설정 올바름');
    }
    
    // 지역 설정 확인
    if (vercelConfig.regions && vercelConfig.regions.includes('icn1')) {
      log.success('서울 리전(icn1) 설정으로 지연시간 최적화됨');
    } else {
      optimizations.push('regions에 icn1(서울) 추가로 지연시간 최적화 권장');
    }
    
    // 캐시 헤더 설정 확인
    const hasStaticCaching = vercelConfig.headers?.some(h => 
      h.source.includes('static') && 
      h.headers?.some(header => header.key === 'Cache-Control')
    );
    
    if (hasStaticCaching) {
      log.success('정적 파일 캐시 헤더 설정됨');
    } else {
      optimizations.push('정적 파일 캐시 헤더 설정으로 로딩 속도 최적화 권장');
    }
  } else {
    log.error('vercel.json 파일이 없습니다');
    optimizations.push('vercel.json 파일 생성 필요');
  }
  
  return optimizations;
}

// 환경별 최적화 제안
function suggestEnvironmentOptimizations() {
  log.section('🌍 환경별 최적화 제안');
  
  const suggestions = {
    development: [],
    production: []
  };
  
  // 개발 환경 최적화
  suggestions.development.push('next dev --turbo 사용으로 개발 빌드 속도 향상');
  suggestions.development.push('SWC 컴파일러 활용 (Next.js 12+ 기본)');
  
  // 프로덕션 환경 최적화
  suggestions.production.push('빌드 시간 단축을 위한 병렬 처리 활용');
  suggestions.production.push('Vercel Analytics 연동으로 성능 모니터링');
  suggestions.production.push('Core Web Vitals 최적화');
  
  return suggestions;
}

// 최적화 실행
function runOptimizations() {
  log.title('🚀 Vercel 빌드 최적화 실행');
  
  const results = {
    analysis: analyzeBuild(),
    cacheOptimizations: optimizeBuildCache(),
    bundleSuggestions: suggestBundleOptimizations(),
    vercelOptimizations: optimizeVercelSettings(),
    environmentSuggestions: suggestEnvironmentOptimizations()
  };
  
  // 최적화 요약
  log.section('📋 최적화 요약');
  
  const totalOptimizations = results.cacheOptimizations.length + 
                           results.vercelOptimizations.length;
  
  if (totalOptimizations > 0) {
    log.success(`${totalOptimizations}개 최적화 항목 처리됨`);
    
    if (results.cacheOptimizations.length > 0) {
      log.info('캐시 최적화:');
      results.cacheOptimizations.forEach(opt => log.info(`  - ${opt}`));
    }
    
    if (results.vercelOptimizations.length > 0) {
      log.info('Vercel 최적화:');
      results.vercelOptimizations.forEach(opt => log.info(`  - ${opt}`));
    }
  } else {
    log.success('모든 설정이 이미 최적화되어 있습니다');
  }
  
  // 개선 제안
  const totalSuggestions = results.bundleSuggestions.length + 
                          results.environmentSuggestions.development.length +
                          results.environmentSuggestions.production.length;
  
  if (totalSuggestions > 0) {
    log.section('💡 개선 제안');
    
    if (results.bundleSuggestions.length > 0) {
      log.warning('번들 사이즈 최적화:');
      results.bundleSuggestions.forEach(suggestion => 
        log.warning(`  - ${suggestion}`)
      );
    }
    
    if (results.environmentSuggestions.development.length > 0) {
      log.info('개발 환경 최적화:');
      results.environmentSuggestions.development.forEach(suggestion => 
        log.info(`  - ${suggestion}`)
      );
    }
    
    if (results.environmentSuggestions.production.length > 0) {
      log.info('프로덕션 환경 최적화:');
      results.environmentSuggestions.production.forEach(suggestion => 
        log.info(`  - ${suggestion}`)
      );
    }
  }
  
  // 다음 단계 가이드
  log.section('🎯 다음 단계');
  console.log(`
${colors.cyan}즉시 실행 가능:${colors.reset}
1. npm run build:optimize 정기 실행 (주 1회)
2. 번들 분석기로 큰 라이브러리 확인
3. Core Web Vitals 성능 측정

${colors.cyan}장기 최적화:${colors.reset}
1. 불필요한 의존성 제거
2. 코드 스플리팅 적용
3. 이미지 최적화 (WebP, AVIF)
4. CDN 및 캐싱 전략 수립

${colors.cyan}모니터링:${colors.reset}
1. Vercel Analytics 활용
2. Lighthouse 점수 추적
3. 번들 크기 변화 모니터링
`);
  
  return results;
}

// 메인 실행
function main() {
  try {
    const results = runOptimizations();
    
    log.success('\n✨ 빌드 최적화 완료!');
    log.info('정기적으로 이 스크립트를 실행하여 성능을 유지하세요.');
    
  } catch (error) {
    log.error(`최적화 중 오류 발생: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  runOptimizations,
  analyzeBuild,
  optimizeBuildCache,
  suggestBundleOptimizations
};