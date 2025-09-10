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
  // Configure output for Amplify SSR
  output: 'standalone',
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
    ignoreBuildErrors: false,
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
      // Reduce parallelism to save memory
      config.parallelism = 1;
    }
    
    // Aggressive memory optimization
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      // Reduce memory usage
      minimize: !dev ? false : config.optimization.minimize, // Disable minification to save memory during build
      splitChunks: {
        chunks: 'all',
        minSize: 10000,
        maxSize: 100000, // Smaller chunks
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        cacheGroups: {
          default: false,
          vendors: false,
          // Create separate chunks for heavy libraries
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
