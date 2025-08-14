/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: ['./src'],
    prependData: `@import "src/styles/variables.scss";`,
  },
  compiler: {
    styledComponents: true,
  },
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig