/**
 * esbuild configuration for Lambda functions
 * 
 * This configuration is used to bundle TypeScript Lambda functions
 * for deployment via CDK.
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

/**
 * Build a single Lambda function
 * @param {string} functionName - Name of the function directory
 * @param {string} entryPoint - Entry point file (default: auto-detect)
 */
async function buildFunction(functionName, entryPoint = null) {
  const outputDir = path.join(__dirname, 'dist', 'lambda-functions', functionName);

  // Auto-detect entry point if not specified
  if (!entryPoint) {
    const indexPath = path.join(__dirname, 'lambda-functions', functionName, 'index.ts');
    const handlerPath = path.join(__dirname, 'lambda-functions', functionName, 'handler.ts');
    
    if (fs.existsSync(indexPath)) {
      entryPoint = 'index.ts';
    } else if (fs.existsSync(handlerPath)) {
      entryPoint = 'handler.ts';
    } else {
      console.warn(`⚠️  Skipping ${functionName}: No index.ts or handler.ts found`);
      return;
    }
  }

  const inputPath = path.join(__dirname, 'lambda-functions', functionName, entryPoint);

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️  Skipping ${functionName}: ${inputPath} not found`);
    return;
  }

  console.log(`📦 Building ${functionName}...`);

  try {
    await esbuild.build({
      entryPoints: [inputPath],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: path.join(outputDir, 'index.js'),
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      external: [
        // AWS SDK v3 is provided by Lambda runtime
        '@aws-sdk/*',
        'aws-sdk',
        // Note: aws-jwt-verify should be bundled, not external
      ],
      format: 'cjs',
      mainFields: ['module', 'main'],
      logLevel: 'info',
    });

    console.log(`✅ Built ${functionName}`);
  } catch (error) {
    console.error(`❌ Failed to build ${functionName}:`, error);
    throw error;
  }
}

/**
 * Build all Lambda functions
 */
async function buildAll() {
  const lambdaFunctionsDir = path.join(__dirname, 'lambda-functions');
  
  // Check if directory exists
  if (!fs.existsSync(lambdaFunctionsDir)) {
    console.log('📁 Creating lambda-functions directory...');
    fs.mkdirSync(lambdaFunctionsDir, { recursive: true });
    console.log('ℹ️  No Lambda functions to build yet');
    return;
  }

  // Get all function directories
  const functionDirs = fs.readdirSync(lambdaFunctionsDir)
    .filter(name => {
      const fullPath = path.join(lambdaFunctionsDir, name);
      return fs.statSync(fullPath).isDirectory() && name !== 'shared';
    });

  if (functionDirs.length === 0) {
    console.log('ℹ️  No Lambda functions to build yet');
    return;
  }

  console.log(`📦 Building ${functionDirs.length} Lambda function(s)...\n`);

  // Build all functions
  for (const functionName of functionDirs) {
    await buildFunction(functionName);
  }

  console.log('\n✅ All Lambda functions built successfully!');
}

/**
 * Watch mode for development
 */
async function watch() {
  console.log('👀 Watching for changes...\n');

  const lambdaFunctionsDir = path.join(__dirname, 'lambda-functions');
  
  // Simple file watcher (for production, consider using chokidar)
  fs.watch(lambdaFunctionsDir, { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`\n📝 File changed: ${filename}`);
      
      // Extract function name from path
      const functionName = filename.split(path.sep)[0];
      
      if (functionName && functionName !== 'shared') {
        await buildFunction(functionName);
      } else {
        // If shared file changed, rebuild all
        await buildAll();
      }
    }
  });

  console.log('Press Ctrl+C to stop watching\n');
}

// CLI interface
const command = process.argv[2];
const functionName = process.argv[3];

if (command === 'build') {
  if (functionName) {
    buildFunction(functionName).catch(err => {
      console.error('Build failed:', err);
      process.exit(1);
    });
  } else {
    buildAll().catch(err => {
      console.error('Build failed:', err);
      process.exit(1);
    });
  }
} else if (command === 'watch') {
  buildAll()
    .then(() => watch())
    .catch(err => {
      console.error('Watch failed:', err);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node esbuild.config.js build [function-name]  - Build all or specific function');
  console.log('  node esbuild.config.js watch                  - Watch for changes');
  process.exit(1);
}
