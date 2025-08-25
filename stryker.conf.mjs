/**
 * VideoPlanet Mutation Testing Configuration (Stryker)
 * 
 * 뮤테이션 테스트를 통해 테스트의 품질을 검증
 * - 코드 변형을 통한 테스트 강건성 검증
 * - 핵심 비즈니스 로직 우선 검사
 * - 성능 최적화된 실행
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // 기본 설정
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'vitest',
  
  // 커버리지 분석
  coverageAnalysis: 'perTest',
  
  // 뮤테이션 대상 파일 (핵심 비즈니스 로직 우선)
  mutate: [
    // 대시보드 위젯 로직
    'src/widgets/dashboard-overview/**/*.{ts,tsx}',
    '!src/widgets/dashboard-overview/**/*.test.{ts,tsx}',
    '!src/widgets/dashboard-overview/**/*.stories.{ts,tsx}',
    
    // 피처 레이어 비즈니스 로직
    'src/features/**/*.{ts,tsx}',
    '!src/features/**/*.test.{ts,tsx}',
    '!src/features/**/*.stories.{ts,tsx}',
    '!src/features/**/ui/**', // UI 컴포넌트 제외 (별도 테스트)
    
    // 엔티티 모델 로직
    'src/entities/**/*.{ts,tsx}',
    '!src/entities/**/*.test.{ts,tsx}',
    '!src/entities/**/ui/**',
    
    // 공유 유틸리티 및 라이브러리
    'src/shared/lib/**/*.{ts,tsx}',
    '!src/shared/lib/**/*.test.{ts,tsx}',
    
    // API 레이어
    'src/app/api/**/*.{ts,tsx}',
    '!src/app/api/**/*.test.{ts,tsx}',
  ],

  // 제외 대상
  ignore: [
    // 설정 파일들
    '**/*.config.{js,ts,mjs}',
    '**/*.d.ts',
    
    // Next.js 파일들
    'src/app/layout.tsx',
    'src/app/loading.tsx',
    'src/app/error.tsx',
    'src/app/not-found.tsx',
    'src/app/globals.css',
    
    // 테스트 파일들
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/__tests__/**',
    '**/test/**',
    
    // 스토리북
    '**/*.stories.{ts,tsx}',
    
    // 타입 정의만 있는 파일
    'src/shared/types/**',
    'src/entities/**/model/types.ts',
    
    // 스타일 파일
    '**/*.css',
    '**/*.scss',
    '**/*.module.css',
  ],

  // 뮤테이터 설정 (어떤 종류의 변형을 적용할지)
  mutator: {
    plugins: [
      '@stryker-mutator/javascript-mutator',
      '@stryker-mutator/typescript-checker',
    ],
    
    // 활성화할 뮤테이터들
    name: 'javascript',
    excludedMutations: [
      // 로깅 관련 뮤테이션 제외 (테스트에 영향 적음)
      'StringLiteral', // 문자열 리터럴 변경 제외
      'RegexLiteral',  // 정규식 리터럴 변경 제외
    ],
  },

  // 테스트 러너 설정
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max_old_space_size=4096'],
  
  // Vitest 특정 설정
  vitest: {
    configFile: 'vitest.config.ts',
    dir: 'src',
  },

  // 성능 최적화
  concurrency: 4, // CPU 코어 수에 맞게 조정
  maxConcurrentTestRunners: 2,
  
  // 타임아웃 설정
  timeoutMS: 60000,      // 뮤테이션당 타임아웃 (1분)
  timeoutFactor: 1.5,    // 원본 테스트 시간의 1.5배
  dryRunTimeoutMinutes: 5, // 드라이런 타임아웃 (5분)

  // 임계값 설정 (품질 게이트)
  thresholds: {
    high: 90,    // 90% 이상: 우수
    low: 70,     // 70% 미만: 개선 필요
    break: 60,   // 60% 미만: 빌드 실패
  },

  // 로그 레벨
  logLevel: 'info',
  fileLogLevel: 'debug',
  
  // 리포팅 설정
  htmlReporter: {
    baseDir: 'reports/mutation',
    fileName: 'mutation-report.html',
  },
  
  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json',
  },

  // 증분 뮤테이션 테스트 (변경된 파일만)
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',

  // 플러그인 설정
  plugins: [
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/html-reporter',
    '@stryker-mutator/json-reporter',
  ],

  // TypeScript 지원
  tsconfigFile: 'tsconfig.json',
  typescriptChecker: {
    enable: true,
    prioritizePerformanceOverAccuracy: true,
  },

  // 커스텀 뮤테이션 규칙
  dashboard: {
    project: 'github.com/your-org/videoplanet',
    version: process.env.CI_COMMIT_SHA || 'local',
    module: 'videoplanet-dashboard',
    baseUrl: 'https://dashboard.stryker-mutator.io/api/reports',
  },

  // 환경별 설정
  ...(process.env.CI && {
    // CI 환경에서는 더 엄격한 설정
    concurrency: 2,
    maxConcurrentTestRunners: 1,
    timeoutMS: 120000, // CI에서는 더 긴 타임아웃
    
    reporters: ['json', 'clear-text'], // CI에서는 HTML 리포트 생성 안함
    
    thresholds: {
      high: 85,    // CI에서는 조금 더 관대
      low: 65,     
      break: 55,   
    },
  }),

  // 핫스팟 분석 (중요한 파일에 더 많은 뮤테이션 적용)
  hotspots: [
    // 대시보드 핵심 로직
    {
      pattern: 'src/widgets/dashboard-overview/**/*.ts',
      multiplier: 1.5, // 50% 더 많은 뮤테이션
    },
    
    // 실시간 기능 로직
    {
      pattern: 'src/shared/lib/websocket/**/*.ts',
      multiplier: 2.0, // 2배 많은 뮤테이션
    },
    
    // 인증 및 권한 로직
    {
      pattern: 'src/features/auth/**/*.ts',
      multiplier: 1.8,
    },
    
    // 핵심 비즈니스 로직
    {
      pattern: 'src/entities/**/model/*.ts',
      multiplier: 1.6,
    },
  ],

  // 뮤테이션 우선순위 설정
  mutationPriority: [
    // 가장 중요한 뮤테이션부터
    'ConditionalExpression',   // if/else 조건
    'EqualityOperator',        // ==, !=, ===, !==
    'LogicalOperator',         // &&, ||
    'ArithmeticOperator',      // +, -, *, /, %
    'ComparisonOperator',      // <, >, <=, >=
    'BooleanLiteral',          // true/false
    'UnaryOperator',           // !, -
    'AssignmentOperator',      // =, +=, -=, etc.
    'ArrayDeclaration',        // 배열 선언
    'ArrowFunction',           // 화살표 함수
  ],

  // 스킵 조건 (성능 최적화)
  skipUnchanged: true, // 변경되지 않은 파일 스킵
  disableBail: false,  // 첫 번째 실패에서 중단
  
  // 캐싱
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,

  // 커스텀 뮤테이터 (필요시)
  customMutators: {
    // 비즈니스 로직에 특화된 커스텀 뮤테이터
    businessLogic: {
      // 상태 전환 로직
      stateTransition: true,
      // 날짜 계산 로직  
      dateCalculation: true,
      // 권한 검증 로직
      authorizationCheck: true,
    },
  },

  // 품질 메트릭 수집
  collectMetrics: true,
  metricsFile: 'reports/mutation/metrics.json',
  
  // 성능 모니터링
  performanceMonitoring: {
    enabled: true,
    memoryThreshold: '2GB',
    timeThreshold: '5m',
  },
};

/**
 * 뮤테이션 테스트 품질 기준
 * 
 * 스코어 해석:
 * - 90-100%: 매우 우수한 테스트 품질
 * - 80-89%:  좋은 테스트 품질  
 * - 70-79%:  보통 테스트 품질 (개선 권장)
 * - 60-69%:  낮은 테스트 품질 (개선 필요)
 * - 60% 미만: 매우 낮은 테스트 품질 (빌드 실패)
 * 
 * 파일별 목표 스코어:
 * - 핵심 비즈니스 로직: 90% 이상
 * - API 엔드포인트: 85% 이상  
 * - 유틸리티 함수: 80% 이상
 * - UI 컴포넌트 로직: 75% 이상
 */