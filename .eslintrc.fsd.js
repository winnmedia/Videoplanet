/**
 * FSD Architecture ESLint Configuration
 * Feature-Sliced Design 레이어 경계 규칙 설정
 */

module.exports = {
  plugins: ['boundaries'],
  extends: ['plugin:boundaries/recommended'],
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'app/*' },
      { type: 'processes', pattern: 'src/processes/*' },
      { type: 'pages', pattern: 'src/pages/*' },
      { type: 'widgets', pattern: 'src/widgets/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'features-legacy', pattern: 'features/*' },
      { type: 'entities', pattern: 'src/entities/*' },
      { type: 'shared', pattern: 'src/shared/*' },
    ],
    'boundaries/ignore': [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.stories.{ts,tsx,js,jsx}',
      '**/__tests__/**/*',
      '**/scripts/**/*',
    ],
  },
  rules: {
    // 레이어 간 의존성 규칙 (상→하만 허용)
    'boundaries/element-types': [
      'warn', // 초기에는 경고로 시작, 추후 'error'로 변경
      {
        default: 'disallow',
        rules: [
          // app은 모든 레이어 사용 가능
          {
            from: 'app',
            allow: ['processes', 'pages', 'widgets', 'features', 'features-legacy', 'entities', 'shared'],
          },
          // processes는 하위 레이어만 사용
          {
            from: 'processes',
            allow: ['pages', 'widgets', 'features', 'features-legacy', 'entities', 'shared'],
          },
          // pages는 하위 레이어만 사용
          {
            from: 'pages',
            allow: ['widgets', 'features', 'features-legacy', 'entities', 'shared'],
          },
          // widgets는 하위 레이어만 사용
          {
            from: 'widgets',
            allow: ['features', 'features-legacy', 'entities', 'shared'],
          },
          // features는 entities와 shared만 사용
          {
            from: 'features',
            allow: ['entities', 'shared'],
          },
          // features-legacy (임시, 마이그레이션 기간 동안)
          {
            from: 'features-legacy',
            allow: ['entities', 'shared'],
          },
          // entities는 shared만 사용
          {
            from: 'entities',
            allow: ['shared'],
          },
          // shared는 shared만 사용 (내부 의존성)
          {
            from: 'shared',
            allow: ['shared'],
          },
        ],
      },
    ],
    // Public API 강제 (index.ts 통해서만 import)
    'boundaries/entry-point': [
      'warn',
      {
        default: 'disallow',
        rules: [
          {
            target: ['shared', 'entities', 'features', 'widgets'],
            allow: 'index.(ts|tsx|js|jsx)',
          },
        ],
      },
    ],
    // 외부 의존성 제한
    'boundaries/external': [
      'warn',
      {
        default: 'allow',
        rules: [
          {
            from: ['entities'],
            disallow: ['react-router-dom', 'next/router', 'next/navigation'],
            message: 'Entities should not depend on routing',
          },
          {
            from: ['shared'],
            disallow: ['@reduxjs/toolkit', 'redux'],
            message: 'Shared layer should not depend on state management',
          },
        ],
      },
    ],
  },
};