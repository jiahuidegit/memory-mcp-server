import type { NextConfig } from 'next';

const config: NextConfig = {
  // 禁用严格模式以避免开发时的双重渲染
  reactStrictMode: true,

  // 禁用静态导出优化，因为我们的页面需要动态渲染
  output: undefined,

  // TypeScript 和 ESLint 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default config;
