const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // 기본 설정
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // 브라우저 설정
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // 타임아웃 설정
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // 테스트 실행 설정
    testIsolation: true,
    experimentalStudio: true,
    
    // 비디오 및 스크린샷 설정
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    
    // 재시도 설정
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // 환경 변수
    env: {
      apiUrl: 'http://localhost:8000/api',
      testUser: {
        email: 'test@videoplanet.com',
        password: 'testpassword123',
      },
    },
    
    // 설정 함수
    setupNodeEvents(on, config) {
      // 커스텀 태스크 정의
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        
        // 데이터베이스 초기화 (필요한 경우)
        resetDb() {
          // 데이터베이스 초기화 로직
          return null
        },
        
        // 테스트 데이터 생성
        createTestData(data) {
          // 테스트 데이터 생성 로직
          console.log('Creating test data:', data)
          return null
        },
      })
      
      // 파일 전처리기 설정 (TypeScript 지원)
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
          },
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { transpileOnly: true },
              },
            ],
          },
        },
      }))
      
      return config
    },
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
})