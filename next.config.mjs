/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['canvas'],
    optimizeCss: true,
    webpackBuildWorker: true,
    optimizePackageImports: [
      'react',
      'react-dom',
      'lodash',
      'date-fns',
    ],
  },
  
  // Enable React's experimental features
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Configure images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Add worker-loader for Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: [
        {
          loader: 'worker-loader',
          options: {
            filename: 'static/worker/[contenthash].worker.js',
            publicPath: '/_next/',
          },
        },
        'babel-loader',
      ],
    });
    
    // Add file-loader for binary files
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
      type: 'asset/resource',
    });
    
    // Add support for WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Only run ESLint on the client during development
    if (!dev) {
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        loader: 'eslint-loader',
      });
    }
    
    // Add bundle analyzer in development
    if (process.env.ANALYZE) {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true',
      });
      return withBundleAnalyzer(config);
    }
    
    return config;
  },
  
  // Configure headers
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
        ],
      },
    ];
  },
  
  // Configure output
  output: 'standalone',
  
  // Configure production browser source maps
  productionBrowserSourceMaps: false,
  
  // Configure static export
  output: 'export',
  
  // Configure images
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
