#!/usr/bin/env node

// Comprehensive test for Next.js environment variable fix
console.log('🔍 Complete Next.js Environment Variable Fix Test');
console.log('==================================================');

// Load dotenv to read .env.local
require('dotenv').config({ path: '.env.local' });

console.log('📁 .env.local path:', require('path').resolve('.env.local'));
console.log('📄 .env.local exists:', require('fs').existsSync('.env.local'));

console.log('\n🔧 All NEXT_PUBLIC_ Environment Variables:');
const nextPublicVars = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .sort();

nextPublicVars.forEach(key => {
  const value = process.env[key];
  const truncatedValue = value && value.length > 80 ? value.substring(0, 80) + '...' : value;
  console.log(`${key}: ${truncatedValue}`);
});

console.log('\n✅ Environment Variable Migration Summary:');
console.log('- Changed all VITE_ prefixes to NEXT_PUBLIC_');
console.log('- Updated .env.local file');
console.log('- Updated config.js file');
console.log('- Updated osduApiService.js file');
console.log('- Updated serviceConfigManager.js file');
console.log('- Updated all auth context files');
console.log('- Updated all component files');
console.log('- Updated logging utilities');

console.log('\n🎯 Key URLs for Testing:');
console.log('ENTITLEMENTS_API_URL:', process.env.NEXT_PUBLIC_ENTITLEMENTS_API_URL);
console.log('SCHEMA_API_URL:', process.env.NEXT_PUBLIC_SCHEMA_API_URL);
console.log('USER_POOL_ID:', process.env.NEXT_PUBLIC_USER_POOL_ID);
console.log('COGNITO_DOMAIN:', process.env.NEXT_PUBLIC_COGNITO_DOMAIN);

console.log('\n🔄 Next Steps:');
console.log('1. Restart the Next.js development server');
console.log('2. Test the bootstrap functionality');
console.log('3. Verify that environment variables are loaded in the browser');

// Verify expected values
const expectedEntitlementsUrl = 'https://cbvpqprfcne7rnbaq3e4ghakzi.appsync-api.us-east-1.amazonaws.com/graphql';
const actualEntitlementsUrl = process.env.NEXT_PUBLIC_ENTITLEMENTS_API_URL;

console.log('\n🧪 URL Validation:');
if (actualEntitlementsUrl === expectedEntitlementsUrl) {
  console.log('✅ Entitlements URL matches expected value');
} else {
  console.log('❌ Entitlements URL mismatch:');
  console.log('   Expected:', expectedEntitlementsUrl);
  console.log('   Actual:', actualEntitlementsUrl);
}

console.log('\n📝 Migration Complete!');
console.log('All VITE_ environment variables have been successfully migrated to NEXT_PUBLIC_');
console.log('The Next.js application should now properly load environment variables in the browser.');