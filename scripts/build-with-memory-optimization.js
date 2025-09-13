#!/usr/bin/env node

/**
 * Custom build script with aggressive memory optimization for Amplify cloud builds
 * This script handles memory pressure and garbage collection during the build process
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Memory management configuration
const MEMORY_CONFIG = {
  maxOldSpaceSize: 12288, // 12GB
  maxSemiSpaceSize: 1024, // 1GB
  exposeGC: true,
  optimizeForSize: true,
  noDeprecation: true
};

// Enhanced Node.js flags for memory optimization
const nodeOptions = [
  `--max-old-space-size=${MEMORY_CONFIG.maxOldSpaceSize}`,
  `--max-semi-space-size=${MEMORY_CONFIG.maxSemiSpaceSize}`,
  '--expose-gc',
  '--no-deprecation',
  '--no-warnings'
];

console.log('🚀 Starting optimized build process...');
console.log(`📊 Memory configuration: ${MEMORY_CONFIG.maxOldSpaceSize}MB heap, ${MEMORY_CONFIG.maxSemiSpaceSize}MB semi-space`);

// Force garbage collection if available
function forceGC() {
  if (global.gc) {
    try {
      global.gc();
      console.log('🗑️  Forced garbage collection');
    } catch (error) {
      console.warn('⚠️  Garbage collection failed:', error.message);
    }
  }
}

// Log memory usage
function logMemoryUsage(label = 'Memory') {
  const usage = process.memoryUsage();
  console.log(`📈 ${label}:`, {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
  });
}

// Set up memory monitoring
function setupMemoryMonitoring() {
  // Log memory usage every 30 seconds during build
  const memoryInterval = setInterval(() => {
    logMemoryUsage('Build Progress');
    forceGC();
  }, 30000);

  // Clean up interval on exit
  process.on('exit', () => clearInterval(memoryInterval));
  process.on('SIGINT', () => {
    clearInterval(memoryInterval);
    process.exit(0);
  });
}

// Run the build with optimized settings
async function runOptimizedBuild() {
  logMemoryUsage('Build Start');
  setupMemoryMonitoring();

  // Set environment variables for memory optimization
  process.env.NODE_OPTIONS = nodeOptions.join(' ');
  process.env.NODE_ENV = 'production';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.DISABLE_ESLINT_PLUGIN = 'true';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.CI = 'true';
  process.env.NEXT_BUILD_WORKERS = '1';
  process.env.NEXT_PRIVATE_SKIP_SIZE_LIMIT_CHECK = '1';

  console.log('🔧 Environment configured for memory optimization');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      env: process.env
    });

    buildProcess.on('close', (code) => {
      logMemoryUsage('Build Complete');
      
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        console.error(`❌ Build failed with exit code ${code}`);
        reject(new Error(`Build process exited with code ${code}`));
      }
    });

    buildProcess.on('error', (error) => {
      console.error('❌ Build process error:', error);
      reject(error);
    });

    // Handle memory pressure during build
    buildProcess.on('message', (message) => {
      if (message && message.type === 'memory-warning') {
        console.log('⚠️  Memory pressure detected, forcing garbage collection');
        forceGC();
      }
    });
  });
}

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  forceGC();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  forceGC();
  process.exit(1);
});

// Run the optimized build
runOptimizedBuild()
  .then(() => {
    console.log('🎉 Optimized build process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Optimized build process failed:', error);
    process.exit(1);
  });
