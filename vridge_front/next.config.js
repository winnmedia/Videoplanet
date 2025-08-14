/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // React 18 Strict Mode
  reactStrictMode: false, // 기존 프로젝트와 동일하게 false로 설정
  
  // Styled Components 컴파일러 설정
  compiler: {
    styledComponents: true
  },
  
  // SASS 설정
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'styles'),
      path.join(__dirname, 'src/css'),
      path.join(__dirname, 'src')
    ]
  },
  
  // 이미지 도메인 설정
  images: {
    domains: ['localhost'],
    unoptimized: true // 초기 마이그레이션 시 기존 이미지 그대로 사용
  },
  
  // 환경변수 매핑
  env: {
    NEXT_PUBLIC_API_URL: process.env.REACT_APP_API_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_KAKAO_APP_KEY: process.env.REACT_APP_KAKAO_APP_KEY,
    NEXT_PUBLIC_MODE: process.env.REACT_APP_MODE
  },
  
  // 웹팩 설정
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 절대 경로 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      'api': path.resolve(__dirname, 'src/api'),
      'components': path.resolve(__dirname, 'src/components'),
      'css': path.resolve(__dirname, 'src/css'),
      'font': path.resolve(__dirname, 'src/font'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
      'images': path.resolve(__dirname, 'src/images'),
      'page': path.resolve(__dirname, 'src/page'),
      'redux': path.resolve(__dirname, 'src/redux'),
      'tasks': path.resolve(__dirname, 'src/tasks'),
      'util': path.resolve(__dirname, 'src/util'),
      'Common.scss': path.resolve(__dirname, 'src/Common.scss')
    }
    
    // 폰트 파일 로더
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    })
    
    return config
  },
  
  // 리다이렉트 설정 (기존 라우트 호환)
  async redirects() {
    return [
      {
        source: '/Login',
        destination: '/login',
        permanent: true
      },
      {
        source: '/Signup',
        destination: '/signup',
        permanent: true
      },
      {
        source: '/ResetPw',
        destination: '/reset-password',
        permanent: true
      },
      {
        source: '/Calendar',
        destination: '/calendar',
        permanent: true
      },
      {
        source: '/CmsHome',
        destination: '/cms-home',
        permanent: true
      },
      {
        source: '/ProjectCreate',
        destination: '/project/create',
        permanent: true
      },
      {
        source: '/ProjectEdit/:project_id',
        destination: '/project/edit/:project_id',
        permanent: true
      },
      {
        source: '/ProjectView/:project_id',
        destination: '/project/view/:project_id',
        permanent: true
      },
      {
        source: '/Feedback/:project_id',
        destination: '/feedback/:project_id',
        permanent: true
      },
      {
        source: '/Elearning',
        destination: '/elearning',
        permanent: true
      },
      {
        source: '/EmailCheck',
        destination: '/email-check',
        permanent: true
      },
      {
        source: '/FeedbackAll',
        destination: '/feedback-all',
        permanent: true
      },
      {
        source: '/Privacy',
        destination: '/privacy',
        permanent: true
      },
      {
        source: '/Terms',
        destination: '/terms',
        permanent: true
      }
    ]
  },
  
  // 실험적 기능
  experimental: {
    // App Router 최적화
    optimizeCss: true
  }
}

// Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer(nextConfig)