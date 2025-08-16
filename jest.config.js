// Jest 설정 - Next.js createJestConfig 없이 직접 설정
module.exports = {
  // 각 테스트 전에 실행할 설정 파일 (선택사항)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 모듈 별칭 설정
  moduleNameMapper: {
    // @ 별칭을 tsconfig.json과 일치하게 매핑 (더 구체적인 경로부터)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/tasks/(.*)$': '<rootDir>/src/tasks/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // 정적 자산 모킹
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  
  // 테스트 환경 설정
  testEnvironment: 'jest-environment-jsdom',
  
  // 테스트 파일 위치 패턴
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // 커버리지 수집할 파일들
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'features/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!components/**/*.d.ts',
    '!features/**/*.d.ts',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!components/**/index.{js,jsx,ts,tsx}',
    '!features/**/index.{js,jsx,ts,tsx}',
    '!src/api/**',
    '!src/assets/**',
    '!src/styles/**',
  ],
  
  // 커버리지 임계값 설정
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 테스트 변환 설정
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // 모듈 변환 제외
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // 테스트 결과 리포터
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }],
  ],
  
  // 병렬 테스트 설정
  maxWorkers: '50%',
  
  // 캐시 설정
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
}