#!/usr/bin/env node

// Debug Next.js environment variable loading
console.log('🔍 Next.js Environment Variable Debug');
console.log('====================================');

// Load dotenv to read .env.local
require('dotenv').config({ path: '.env.local' });

console.log('📁 .env.local path:', require('path').resolve('.env.local'));
console.log('📄 .env.local exists:', require('fs').existsSync('.env.local'));

if (require('fs').existsSync('.env.local')) {
  console.log('📖 .env.local contents:');
  const envContent = require('fs').readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach((line, index) => {
    if (line.trim() && !line.startsWith('#')) {
      console.log(`Line ${index + 1}: ${line}`);
    }
  });
}

console.log('\n🔧 Process Environment (VITE_ prefixed):');
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

console.log('\n🔧 Process Environment (NEXT_PUBLIC_ prefixed):');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

console.log('\n💡 Current VITE_ENTITLEMENTS_API_URL:', process.env.VITE_ENTITLEMENTS_API_URL);
console.log('💡 Expected URL: https://cbvpqprfcne7rnbaq3e4ghakzi.appsync-api.us-east-1.amazonaws.com/graphql');

console.log('\n📝 Next.js Environment Variable Rules:');
console.log('- Client-side variables must be prefixed with NEXT_PUBLIC_');
console.log('- VITE_ prefix is for Vite applications, not Next.js');
console.log('- Server-side variables can use any name but are not available in browser');