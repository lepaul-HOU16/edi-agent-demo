/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/.well-known/appspecific/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Increase timeout for chunk loading
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
      poll: 1000,
    };
    
    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for third-party libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
  // Increase the timeout for static generation
  staticPageGenerationTimeout: 180,
  // Disable image optimization during development to speed up builds
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
