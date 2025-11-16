/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Optimize for Amplify deployment - disable experimental features
  experimental: {
    // Disable potentially problematic features during build
    esmExternals: false,
    serverComponentsExternalPackages: ['aws-sdk', '@aws-sdk', 'puppeteer', 'plotly.js', '@langchain'],
    // Disable memory-intensive features
    optimizeCss: false,
    optimizePackageImports: [],
    // Reduce memory usage during build
    webpackBuildWorker: false,
  },
  // Configure output for static export (no SSR)
  output: 'export',
  // Required for dynamic routes with static export
  trailingSlash: true,
  // Skip build-time generation of dynamic routes (they'll be handled client-side)
  skipTrailingSlashRedirect: true,
  // Reduce build memory usage
  swcMinify: false, // Disable to reduce memory usage
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Reduce bundle analysis during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript checking during build to prevent memory issues
  },
  // Note: headers() and rewrites() are not supported with static export
  // These should be configured in CloudFront or S3 bucket settings instead
  webpack: (config, { isServer, dev }) => {
    // Fix chunk loading issues in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };
      
      // Ensure proper chunk loading in development
      config.output = {
        ...config.output,
        publicPath: '/_next/',
        chunkFilename: 'static/chunks/[name].js',
      };
    } else {
      // Memory optimization for production builds only
      config.cache = false;
      config.parallelism = 1;
      
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        minimize: false, // Disable minification to save memory
        splitChunks: {
          chunks: 'all',
          minSize: 10000,
          maxSize: 100000,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
          cacheGroups: {
            default: false,
            vendors: false,
            plotly: {
              name: 'plotly',
              test: /[\\/]node_modules[\\/](plotly\.js|react-plotly\.js)/,
              chunks: 'async',
              priority: 40,
              reuseExistingChunk: true,
            },
            langchain: {
              name: 'langchain',
              test: /[\\/]node_modules[\\/](@langchain)/,
              chunks: 'async', 
              priority: 35,
              reuseExistingChunk: true,
            },
            aws: {
              name: 'aws-vendor',
              test: /[\\/]node_modules[\\/](@aws-sdk|aws-amplify|@aws-amplify)/,
              chunks: 'async',
              priority: 30,
              reuseExistingChunk: true,
            },
            vendor: {
              name: 'vendor',
              chunks: 'async',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              maxSize: 100000,
            },
          },
        },
      };
    }
    
    // Exclude problematic modules on server side
    if (isServer) {
      config.externals = [...(config.externals || []), 
        'canvas', 
        'jsdom', 
        'puppeteer',
        'plotly.js'
      ];
    }
    
    // Add resolve fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    
    return config;
  },
  // Configure images for static export
  images: {
    unoptimized: true, // Required for static export
  },
  // Configure for better Amplify compatibility
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
