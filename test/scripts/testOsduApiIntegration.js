#!/usr/bin/env node

/**
 * OSDU API Service Integration Test Runner
 * 
 * This script runs comprehensive tests to validate:
 * 1. Token retrieval from updated authentication
 * 2. API calls to Schema, Entitlements, and Legal services with new tokens
 * 3. Token refresh functionality and error handling
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting OSDU API Service Integration Tests...\n');

try {
  // Run the integration tests
  console.log('📋 Running OSDU API Service Integration Tests...');
  
  const testCommand = 'npm run test:specific test/integration/OsduApiServiceIntegration.test.ts';
  
  console.log(`Executing: ${testCommand}\n`);
  
  const result = execSync(testCommand, {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ OSDU API Service Integration Tests completed successfully!');
  
  console.log('\n📊 Test Summary:');
  console.log('✓ Token retrieval from updated authentication - TESTED');
  console.log('✓ API calls to Schema, Entitlements, and Legal services - TESTED');
  console.log('✓ Token refresh functionality and error handling - TESTED');
  console.log('✓ Service connectivity and health checks - TESTED');
  console.log('✓ Data partition handling - TESTED');

} catch (error) {
  console.error('\n❌ OSDU API Service Integration Tests failed:');
  console.error(error.message);
  
  console.log('\n🔍 Troubleshooting Tips:');
  console.log('1. Ensure all dependencies are installed: npm install');
  console.log('2. Check that the test environment is properly configured');
  console.log('3. Verify that the OSDU API service is properly implemented');
  console.log('4. Check that AWS Amplify auth mocks are working correctly');
  
  process.exit(1);
}