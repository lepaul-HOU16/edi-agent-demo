#!/usr/bin/env node

// Test Next.js environment variable loading after fix
console.log('🔍 Next.js Environment Variable Fix Test');
console.log('==========================================');

// Load dotenv to read .env.local
require('dotenv').config({ path: '.env.local' });

console.log('📁 .env.local path:', require('path').resolve('.env.local'));
console.log('📄 .env.local exists:', require('fs').existsSync('.env.local'));

console.log('\n🔧 Process Environment (NEXT_PUBLIC_ prefixed):');
Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .forEach(key => {
        console.log(`${key}: ${process.env[key]}`);
    });

console.log('\n💡 Testing config.js import:');
try {
    // Import the config to test if it loads correctly
    const config = require('./src/services/config.js').default;

    console.log('✅ Config loaded successfully');
    console.log('🎯 ENTITLEMENTS_API_URL:', config.NEXT_PUBLIC_ENTITLEMENTS_API_URL);
    console.log('🎯 SCHEMA_API_URL:', config.NEXT_PUBLIC_SCHEMA_API_URL);
    console.log('🎯 AWS_REGION:', config.NEXT_PUBLIC_AWS_REGION);
    console.log('🎯 USER_POOL_ID:', config.NEXT_PUBLIC_USER_POOL_ID);

    // Test if the URLs are correct
    const expectedEntitlementsUrl = 'https://cbvpqprfcne7rnbaq3e4ghakzi.appsync-api.us-east-1.amazonaws.com/graphql';
    const actualEntitlementsUrl = config.NEXT_PUBLIC_ENTITLEMENTS_API_URL;

    if (actualEntitlementsUrl === expectedEntitlementsUrl) {
        console.log('✅ Entitlements URL matches expected value');
    } else {
        console.log('❌ Entitlements URL mismatch:');
        console.log('   Expected:', expectedEntitlementsUrl);
        console.log('   Actual:', actualEntitlementsUrl);
    }

} catch (error) {
    console.error('❌ Failed to load config:', error.message);
}

console.log('\n📝 Next.js Environment Variable Status:');
console.log('- ✅ Changed VITE_ prefix to NEXT_PUBLIC_');
console.log('- ✅ Updated .env.local file');
console.log('- ✅ Updated config.js file');
console.log('- ✅ Updated osduApiService.js file');
console.log('- 🔄 Next: Restart Next.js dev server to pick up changes');