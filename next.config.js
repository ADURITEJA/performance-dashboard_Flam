/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
  },
  webpack: (config, { isServer, dev, webpack }) => {
    // Enable top-level await in Webpack 5
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    };

    // Handle Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: [
        {
          loader: 'worker-loader',
          options: {
            filename: 'static/worker/[contenthash].worker.js',
            publicPath: '/_next/',
            worker: {
              type: 'Worker',
              options: {
                name: 'dataProcessor',
                type: 'module',
              },
            },
          },
        },
        // Add Babel loader for worker files
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      ],
    });

    // Handle worker files in the output
    if (!isServer) {
      config.output.publicPath = '/_next/';
      config.output.workerChunkLoading = 'import-scripts';
    }

    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      worker_threads: false,
      child_process: false,
    };

    // Only enable source maps in development
    if (!dev) {
      config.devtool = 'source-map';
    }

    return config;
  },
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true, // Disable image optimization if not needed
  },
  // Performance optimizations
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  // Disable TypeScript type checking during build (handled by CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable ESLint during build (handled by CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;