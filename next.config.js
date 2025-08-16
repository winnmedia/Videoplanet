/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router는 Next.js 13.4+에서 stable이므로 별도 설정 불필요
  sassOptions: {
    includePaths: ['./src'],
    prependData: `@import "src/styles/variables.scss";`,
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['localhost'],
  },
  transpilePackages: ['antd', '@ant-design', 'rc-util', 'rc-pagination', 'rc-picker', 'rc-notification', 'rc-tooltip', 'rc-tree', 'rc-table', 'rc-input'],
  webpack: (config, { isServer }) => {
    // Storybook 파일들을 빌드에서 제외
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('tsx|ts')) {
        rule.exclude = [
          ...(rule.exclude || []),
          /\.stories\.(js|jsx|ts|tsx)$/,
        ];
      }
    });
    
    // antd의 ESM 문제 해결
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig