/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Optimize for Amplify deployment - disable experimental features
  experimental: {
    // Disable potentially problematic features during build
    esmExternals: false,
    serverComponentsExternalPackages: ['aws-sdk'],
    // Disable memory-intensive features
    optimizeCss: false,
    optimizePackageImports: [],
  },
  // Configure output for Amplify SSR
  output: 'standalone',
  // Reduce build memory usage
  swcMinify: true,
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  async headers() {
    return [
      {
        source: '/file/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; style-src 'self' 'unsafe-inline' https: data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-src 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/.well-known/appspecific/:path*',
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Memory optimization for builds
    if (!dev) {
      config.cache = false;
    }
    
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Create a separate chunk for AWS SDK and large libraries
          aws: {
            name: 'aws-vendor',
            test: /[\\/]node_modules[\\/](@aws-sdk|aws-amplify|@aws-amplify)/,
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Vendor chunk for other third-party libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            maxSize: 150000,
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
    
    // Exclude problematic modules on server side
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    
    return config;
  },
  // Increase the timeout for static generation
  staticPageGenerationTimeout: 300,
  // Configure images for Amplify
  images: {
    unoptimized: true, // Amplify handles image optimization
    domains: ['amplify.com'],
  },
  // Configure for better Amplify compatibility
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
