/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['canvas'],
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return config;
  },
  images: {
    domains: [],
  },
  // Performance optimizations
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
};

module.exports = nextConfig;