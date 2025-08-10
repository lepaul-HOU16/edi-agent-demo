#!/usr/bin/env node

/**
 * Legal Tags Page Diagnostic Script
 * 
 * This script helps diagnose issues with the legal tags page
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Legal Tags Page Diagnostic');
console.log('============================\n');

// Check if all required files exist
const requiredFiles = [
  'src/app/legal-tags/page.tsx',
  'src/components/WithAuth.tsx',
  'src/components/LegalTagForm.tsx',
  'src/components/LegalTagDetail.tsx',
  'src/components/LegalTagDebug.tsx',
  'src/hooks/useLegalTagOperations.ts',
  'src/services/osduApiService.js'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📦 Checking package.json dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredDeps = [
  '@mui/material',
  '@mui/icons-material',
  'react',
  'next'
];

requiredDeps.forEach(dep => {
  const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
  const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
  const exists = hasInDeps || hasInDevDeps;
  console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${hasInDeps || hasInDevDeps})` : ''}`);
});

console.log('\n🔧 Checking TypeScript configuration:');
const tsConfigExists = fs.existsSync('tsconfig.json');
console.log(`${tsConfigExists ? '✅' : '❌'} tsconfig.json`);

if (tsConfigExists) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log(`✅ TypeScript config is valid`);
    console.log(`   - Module: ${tsConfig.compilerOptions?.module || 'default'}`);
    console.log(`   - Target: ${tsConfig.compilerOptions?.target || 'default'}`);
    console.log(`   - JSX: ${tsConfig.compilerOptions?.jsx || 'default'}`);
  } catch (error) {
    console.log(`❌ TypeScript config is invalid: ${error.message}`);
  }
}

console.log('\n🌐 Checking Next.js configuration:');
const nextConfigExists = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs');
console.log(`${nextConfigExists ? '✅' : '❌'} Next.js config file`);

console.log('\n📝 Summary:');
if (allFilesExist) {
  console.log('✅ All required files are present');
} else {
  console.log('❌ Some required files are missing');
}

console.log('\n🚀 Recommendations:');
console.log('1. Ensure the development server is running: npm run dev');
console.log('2. Try accessing the page at: http://localhost:3000/legal-tags');
console.log('3. Check browser console for JavaScript errors');
console.log('4. Verify authentication is working properly');

console.log('\n🔍 Next steps if page still not loading:');
console.log('- Check browser network tab for failed requests');
console.log('- Look for authentication redirects');
console.log('- Verify all imports are resolving correctly');
console.log('- Check for any runtime JavaScript errors');