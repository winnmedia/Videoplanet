// Server-side polyfill
require('./server-polyfill');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router는 Next.js 13.4+에서 stable이므로 별도 설정 불필요
  poweredByHeader: false, // 보안: X-Powered-By 헤더 제거
  
  // SASS 설정
  sassOptions: {
    includePaths: ['./src'],
    prependData: `@import "src/styles/variables.scss";`,
  },
  
  // 컴파일러 설정
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  
  // 이미지 최적화 설정
  images: {
    domains: ['localhost', 'videoplanet.up.railway.app'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 실험적 기능 활성화
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // 패키지 트랜스파일 설정
  transpilePackages: [
    'antd', 
    '@ant-design', 
    'rc-util', 
    'rc-pagination', 
    'rc-picker', 
    'rc-notification', 
    'rc-tooltip', 
    'rc-tree', 
    'rc-table', 
    'rc-input'
  ],
  
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://videoplanet.vercel.app'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
  
  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  
  // 웹팩 설정
  webpack: (config, { isServer, dev, webpack }) => {
    // Storybook 파일들을 빌드에서 제외
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('tsx|ts')) {
        rule.exclude = [
          ...(rule.exclude || []),
          /\.stories\.(js|jsx|ts|tsx)$/,
        ];
      }
    });
    
    // 서버/클라이언트별 설정
    if (isServer) {
      // 서버 빌드에서 self polyfill 추가
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'global',
        })
      );
    } else {
      // 클라이언트 빌드 설정
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // 프로덕션 빌드 최적화 (splitChunks 비활성화)
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        // splitChunks는 기본 설정 유지 (vendors 분리 비활성화)
        // self is not defined 오류 방지
      };
    }
    
    return config;
  },
  
  // 환경변수 검증 (빌드 시)
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString(),
  },
}

module.exports = nextConfig