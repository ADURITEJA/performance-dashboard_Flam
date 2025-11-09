const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Import the base Next.js config
const nextConfig = require('../next.config');

// Merge with the bundle analyzer config
module.exports = withBundleAnalyzer({
  ...nextConfig,
  webpack: (config, { isServer }) => {
    // Add the bundle analyzer plugin
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: `../.next/analyze/${isServer ? 'server' : 'client'}.html`,
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: `../.next/analyze/${isServer ? 'server' : 'client'}-stats.json`,
        })
      );
    }

    // Apply any custom webpack config from next.config.js
    if (typeof nextConfig.webpack === 'function') {
      return nextConfig.webpack(config, { isServer });
    }

    return config;
  },
});
