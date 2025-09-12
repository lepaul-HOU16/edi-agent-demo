#!/usr/bin/env node

/**
 * Memory-optimized wrapper for Amplify sandbox command
 * This script sets proper memory limits for the Amplify CLI to prevent heap errors
 */

const { spawn } = require('child_process');

// Memory configuration for Amplify CLI
const AMPLIFY_MEMORY_CONFIG = {
  maxOldSpaceSize: 8192, // 8GB for Amplify CLI
  maxSemiSpaceSize: 512,  // 512MB semi-space
};

// Node.js flags for memory optimization
const nodeOptions = [
  `--max-old-space-size=${AMPLIFY_MEMORY_CONFIG.maxOldSpaceSize}`,
  `--max-semi-space-size=${AMPLIFY_MEMORY_CONFIG.maxSemiSpaceSize}`,
  '--expose-gc',
  '--no-deprecation',
  '--no-warnings'
];

console.log('🚀 Starting Amplify sandbox with memory optimization...');
console.log(`📊 Memory configuration: ${AMPLIFY_MEMORY_CONFIG.maxOldSpaceSize}MB heap, ${AMPLIFY_MEMORY_CONFIG.maxSemiSpaceSize}MB semi-space`);

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

// Run Amplify sandbox with optimized settings
async function runOptimizedSandbox() {
  logMemoryUsage('Sandbox Start');

  // Set environment variables for memory optimization
  const env = { ...process.env };
  env.NODE_OPTIONS = nodeOptions.join(' ');
  env.AMPLIFY_CLI_MEMORY_OPTIMIZATION = 'true';
  env.TSC_NONPOLLING_WATCHER = 'true';
  env.TSC_WATCHFILE = 'UseFsEvents';
  
  // Additional memory optimizations for TypeScript
  env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
    skipLibCheck: true,
    skipDefaultLibCheck: true,
    incremental: true,
    isolatedModules: true
  });

  console.log('🔧 Environment configured for Amplify sandbox memory optimization');
  
  return new Promise((resolve, reject) => {
    // Get command line arguments (excluding node and script name)
    const args = process.argv.slice(2);
    
    const sandboxProcess = spawn('npx', ['ampx', 'sandbox', ...args], {
      stdio: 'inherit',
      env: env
    });

    // Set up periodic memory monitoring
    const memoryInterval = setInterval(() => {
      logMemoryUsage('Sandbox Progress');
      forceGC();
    }, 60000); // Check every minute

    sandboxProcess.on('close', (code) => {
      clearInterval(memoryInterval);
      logMemoryUsage('Sandbox Complete');
      
      if (code === 0) {
        console.log('✅ Amplify sandbox completed successfully');
        resolve();
      } else {
        console.error(`❌ Amplify sandbox failed with exit code ${code}`);
        reject(new Error(`Sandbox process exited with code ${code}`));
      }
    });

    sandboxProcess.on('error', (error) => {
      clearInterval(memoryInterval);
      console.error('❌ Sandbox process error:', error);
      reject(error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down Amplify sandbox...');
      clearInterval(memoryInterval);
      sandboxProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Terminating Amplify sandbox...');
      clearInterval(memoryInterval);
      sandboxProcess.kill('SIGTERM');
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

// Run the optimized sandbox
runOptimizedSandbox()
  .then(() => {
    console.log('🎉 Optimized Amplify sandbox process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Optimized Amplify sandbox process failed:', error);
    process.exit(1);
  });
