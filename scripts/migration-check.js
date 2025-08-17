#!/usr/bin/env node

/**
 * FSD Architecture Migration Checker
 * 현재 프로젝트 구조를 분석하고 마이그레이션 진행 상황을 체크합니다.
 */

const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// FSD 레이어 정의
const FSD_LAYERS = {
  app: { path: 'app', color: colors.magenta },
  processes: { path: 'src/processes', color: colors.cyan },
  pages: { path: 'src/pages', color: colors.blue },
  widgets: { path: 'src/widgets', color: colors.green },
  features: { path: 'src/features', color: colors.yellow },
  entities: { path: 'src/entities', color: colors.red },
  shared: { path: 'src/shared', color: colors.bright },
};

// 현재 구조와 FSD 매핑
const MIGRATION_MAP = {
  'components/atoms': 'src/shared/ui',
  'components/molecules': 'src/shared/ui or src/widgets',
  'components/organisms': 'src/widgets',
  'components/templates': 'src/pages',
  'lib/api': 'src/shared/api',
  'lib/config': 'src/shared/config',
  'lib/utils': 'src/shared/lib',
  'lib/error-handling': 'src/shared/lib/error',
  'features/auth/api': 'src/entities/user/api',
  'features/projects/api': 'src/entities/project/api',
  'features/feedback/api': 'src/entities/feedback/api',
};

class MigrationChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.stats = {
      totalFiles: 0,
      migratedFiles: 0,
      pendingFiles: 0,
      layers: {},
    };
  }

  // 디렉토리 존재 확인
  checkDirectory(dir) {
    const fullPath = path.join(this.projectRoot, dir);
    return fs.existsSync(fullPath);
  }

  // 디렉토리 내 파일 수 계산
  countFiles(dir) {
    const fullPath = path.join(this.projectRoot, dir);
    if (!fs.existsSync(fullPath)) return 0;

    let count = 0;
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        count += this.countFiles(path.join(dir, item.name));
      } else if (item.isFile() && !item.name.startsWith('.')) {
        count++;
      }
    }
    
    return count;
  }

  // Public API (index.ts) 체크
  checkPublicAPI(dir) {
    const indexPath = path.join(this.projectRoot, dir, 'index.ts');
    const indexJsPath = path.join(this.projectRoot, dir, 'index.js');
    return fs.existsSync(indexPath) || fs.existsSync(indexJsPath);
  }

  // FSD 레이어 상태 체크
  checkFSDLayers() {
    console.log(`\n${colors.bright}📊 FSD 레이어 상태${colors.reset}`);
    console.log('─'.repeat(50));

    for (const [layer, config] of Object.entries(FSD_LAYERS)) {
      const exists = this.checkDirectory(config.path);
      const fileCount = exists ? this.countFiles(config.path) : 0;
      const status = exists ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
      
      this.stats.layers[layer] = { exists, fileCount };
      
      console.log(
        `${status} ${config.color}${layer.padEnd(12)}${colors.reset}` +
        `${exists ? `(${fileCount} files)` : '(not created)'}`
      );
    }
  }

  // 마이그레이션 매핑 체크
  checkMigrationStatus() {
    console.log(`\n${colors.bright}🔄 마이그레이션 상태${colors.reset}`);
    console.log('─'.repeat(50));

    for (const [oldPath, newPath] of Object.entries(MIGRATION_MAP)) {
      const oldExists = this.checkDirectory(oldPath);
      const oldCount = oldExists ? this.countFiles(oldPath) : 0;
      
      if (oldExists && oldCount > 0) {
        console.log(
          `${colors.yellow}⚠️${colors.reset}  ${oldPath.padEnd(30)} → ${newPath}\n` +
          `   ${oldCount} files pending migration`
        );
        this.stats.pendingFiles += oldCount;
      }
    }
  }

  // Public API 체크
  checkPublicAPIs() {
    console.log(`\n${colors.bright}🔌 Public API (Barrel Exports)${colors.reset}`);
    console.log('─'.repeat(50));

    const checkPaths = [
      'src/shared/ui',
      'src/shared/api',
      'src/shared/lib',
      'src/entities/user',
      'src/entities/project',
      'src/entities/feedback',
    ];

    for (const dir of checkPaths) {
      if (this.checkDirectory(dir)) {
        const hasIndex = this.checkPublicAPI(dir);
        const status = hasIndex ? `${colors.green}✅${colors.reset}` : `${colors.yellow}⚠️${colors.reset}`;
        console.log(
          `${status} ${dir.padEnd(30)} ${hasIndex ? 'has index.ts' : 'missing index.ts'}`
        );
      }
    }
  }

  // TypeScript 경로 별칭 체크
  checkTsConfig() {
    console.log(`\n${colors.bright}⚙️  TypeScript 경로 별칭${colors.reset}`);
    console.log('─'.repeat(50));

    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        // JSON with comments 처리
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8')
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // 주석 제거
        const tsconfig = JSON.parse(tsconfigContent);
        const paths = tsconfig.compilerOptions?.paths || {};
        
        const requiredPaths = [
          '@app/*',
          '@processes/*',
          '@pages/*',
          '@widgets/*',
          '@features/*',
          '@entities/*',
          '@shared/*',
        ];

        for (const pathAlias of requiredPaths) {
          const exists = pathAlias in paths;
          const status = exists ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
          console.log(`${status} ${pathAlias.padEnd(20)} ${exists ? 'configured' : 'not configured'}`);
        }
      } catch (error) {
        console.log(`${colors.yellow}⚠️  tsconfig.json 파싱 오류: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ tsconfig.json not found${colors.reset}`);
    }
  }

  // 의존성 체크
  checkDependencies() {
    console.log(`\n${colors.bright}📦 아키텍처 도구${colors.reset}`);
    console.log('─'.repeat(50));

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const tools = {
        'eslint-plugin-boundaries': 'Layer boundary enforcement',
        'madge': 'Circular dependency detection',
        '@reduxjs/toolkit': 'State management',
        'axios': 'API client',
      };

      for (const [dep, description] of Object.entries(tools)) {
        const installed = dep in allDeps;
        const status = installed ? `${colors.green}✅${colors.reset}` : `${colors.yellow}⚠️${colors.reset}`;
        console.log(
          `${status} ${dep.padEnd(30)} ${installed ? 'installed' : 'not installed'}\n` +
          `   ${colors.bright}${description}${colors.reset}`
        );
      }
    }
  }

  // 진행률 계산
  calculateProgress() {
    console.log(`\n${colors.bright}📈 마이그레이션 진행률${colors.reset}`);
    console.log('─'.repeat(50));

    const scores = {
      layers: 0,
      publicAPI: 0,
      tsconfig: 0,
      dependencies: 0,
    };

    // 레이어 점수 (40점)
    const createdLayers = Object.values(this.stats.layers).filter(l => l.exists).length;
    scores.layers = Math.round((createdLayers / Object.keys(FSD_LAYERS).length) * 40);

    // Public API 점수 (20점)
    // 간단히 shared와 entities 체크
    if (this.checkPublicAPI('src/shared')) scores.publicAPI += 10;
    if (this.checkPublicAPI('src/entities')) scores.publicAPI += 10;

    // TypeScript 설정 점수 (20점)
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8')
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const tsconfig = JSON.parse(tsconfigContent);
        if (tsconfig.compilerOptions?.paths) {
          const hasShared = '@shared/*' in tsconfig.compilerOptions.paths;
          const hasEntities = '@entities/*' in tsconfig.compilerOptions.paths;
          if (hasShared) scores.tsconfig += 10;
          if (hasEntities) scores.tsconfig += 10;
        }
      } catch (error) {
        // 파싱 오류 시 0점
      }
    }

    // 의존성 점수 (20점)
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      if ('eslint-plugin-boundaries' in allDeps) scores.dependencies += 10;
      if ('madge' in allDeps) scores.dependencies += 10;
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    // 진행률 바
    const progressBar = this.createProgressBar(totalScore, 100);
    
    console.log(`\n${progressBar}`);
    console.log(`\n총점: ${colors.bright}${totalScore}/100${colors.reset}`);
    
    // 세부 점수
    console.log('\n세부 점수:');
    console.log(`  레이어 구조: ${scores.layers}/40`);
    console.log(`  Public API: ${scores.publicAPI}/20`);
    console.log(`  TypeScript 설정: ${scores.tsconfig}/20`);
    console.log(`  의존성 도구: ${scores.dependencies}/20`);

    // 단계별 권장사항
    this.printRecommendations(totalScore);
  }

  // 진행률 바 생성
  createProgressBar(current, total) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 40;
    const filled = Math.round((current / total) * barLength);
    const empty = barLength - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const color = percentage < 30 ? colors.red : percentage < 70 ? colors.yellow : colors.green;
    
    return `${color}[${bar}] ${percentage}%${colors.reset}`;
  }

  // 권장사항 출력
  printRecommendations(score) {
    console.log(`\n${colors.bright}💡 다음 단계 권장사항${colors.reset}`);
    console.log('─'.repeat(50));

    if (score < 20) {
      console.log(`${colors.cyan}Phase 1: 기초 설정${colors.reset}`);
      console.log('1. src 폴더 구조 생성: mkdir -p src/{processes,pages,widgets,entities,shared}');
      console.log('2. tsconfig.json paths 설정 추가');
      console.log('3. eslint-plugin-boundaries 설치: npm i -D eslint-plugin-boundaries');
    } else if (score < 40) {
      console.log(`${colors.cyan}Phase 2: shared 레이어 구축${colors.reset}`);
      console.log('1. components/atoms → src/shared/ui 이관');
      console.log('2. lib → src/shared 이관');
      console.log('3. Public API (index.ts) 생성');
    } else if (score < 60) {
      console.log(`${colors.cyan}Phase 3: entities 레이어 구축${colors.reset}`);
      console.log('1. 도메인 모델 분리 (user, project, feedback)');
      console.log('2. Redux slices → entities/*/model');
      console.log('3. API 호출 → entities/*/api');
    } else if (score < 80) {
      console.log(`${colors.cyan}Phase 4: features 리팩토링${colors.reset}`);
      console.log('1. 사용자 행동 단위로 features 재구성');
      console.log('2. ui/model/api 폴더 구조 통일');
      console.log('3. 각 feature에 Public API 추가');
    } else {
      console.log(`${colors.green}Phase 5: 최종 정리 및 검증${colors.reset}`);
      console.log('1. 순환 의존성 검사: npm run check:circular');
      console.log('2. 경계 규칙 적용: npm run lint:arch');
      console.log('3. 기존 폴더 제거 및 문서 업데이트');
    }
  }

  // 메인 실행
  run() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     FSD Architecture Migration Checker      ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(colors.reset);

    this.checkFSDLayers();
    this.checkMigrationStatus();
    this.checkPublicAPIs();
    this.checkTsConfig();
    this.checkDependencies();
    this.calculateProgress();

    console.log(`\n${colors.bright}📚 참고 문서${colors.reset}`);
    console.log('─'.repeat(50));
    console.log('• FSD 마이그레이션 가이드: docs/FSD_ARCHITECTURE_MIGRATION.md');
    console.log('• Feature-Sliced Design: https://feature-sliced.design');
    console.log('');
  }
}

// 실행
const checker = new MigrationChecker();
checker.run();