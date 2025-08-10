#!/usr/bin/env node

// Debug script to check environment variable loading
console.log('🔍 Environment Variable Debug');
console.log('============================');

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
console.log('📁 .env.local path:', envLocalPath);
console.log('📄 .env.local exists:', fs.existsSync(envLocalPath));

if (fs.existsSync(envLocalPath)) {
  console.log('📖 .env.local contents:');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('VITE_ENTITLEMENTS_API_URL')) {
      console.log(`   Line ${index + 1}: ${line}`);
    }
  });
}

console.log('\n🔧 Process Environment:');
console.log('VITE_ENTITLEMENTS_API_URL:', process.env.VITE_ENTITLEMENTS_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n💡 Expected URL: https://cbvpqprfcne7rnbaq3e4ghakzi.appsync-api.us-east-1.amazonaws.com/graphql');
console.log('💡 Old URL: https://ucbxezqhn5gjdcfak4ffsn65da.appsync-api.us-east-1.amazonaws.com/graphql');