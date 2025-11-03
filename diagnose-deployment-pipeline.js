const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 DEPLOYMENT PIPELINE DIAGNOSIS');
console.log('=' .repeat(80));

// 1. Check if there's a running sandbox
console.log('\n📋 Step 1: Check Amplify Sandbox Status');
console.log('-'.repeat(50));
try {
  const processes = execSync('ps aux | grep "ampx sandbox"', { encoding: 'utf8' });
  console.log('Sandbox processes:');
  console.log(processes);
} catch (error) {
  console.log('❌ No sandbox process found');
}

// 2. Check amplify_outputs.json timestamp
console.log('\n📋 Step 2: Check amplify_outputs.json');
console.log('-'.repeat(50));
if (fs.existsSync('amplify_outputs.json')) {
  const stats = fs.statSync('amplify_outputs.json');
  const lastModified = new Date(stats.mtime);
  const now = new Date();
  const hoursSinceUpdate = (now - lastModified) / (1000 * 60 * 60);
  
  console.log(`Last modified: ${lastModified.toISOString()}`);
  console.log(`Hours since update: ${hoursSinceUpdate.toFixed(2)}`);
  
  if (hoursSinceUpdate > 24) {
    console.log('⚠️  WARNING: amplify_outputs.json is over 24 hours old!');
    console.log('⚠️  Your frontend is likely using stale backend configuration');
  }
} else {
  console.log('❌ amplify_outputs.json NOT FOUND');
}

// 3. Check .next build cache
console.log('\n📋 Step 3: Check Next.js Build Cache');
console.log('-'.repeat(50));
if (fs.existsSync('.next')) {
  const stats = fs.statSync('.next');
  const lastModified = new Date(stats.mtime);
  const now = new Date();
  const hoursSinceUpdate = (now - lastModified) / (1000 * 60 * 60);
  
  console.log(`Last modified: ${lastModified.toISOString()}`);
  console.log(`Hours since update: ${hoursSinceUpdate.toFixed(2)}`);
  
  if (hoursSinceUpdate > 24) {
    console.log('⚠️  WARNING: .next build cache is over 24 hours old!');
    console.log('⚠️  Your frontend is serving stale code');
  }
} else {
  console.log('❌ .next directory NOT FOUND');
}

// 4. Check if dev server is running
console.log('\n📋 Step 4: Check Dev Server Status');
console.log('-'.repeat(50));
try {
  const processes = execSync('ps aux | grep "next dev"', { encoding: 'utf8' });
  const lines = processes.split('\n').filter(line => 
    line.includes('next dev') && !line.includes('grep')
  );
  
  if (lines.length > 0) {
    console.log('✅ Dev server is running');
    console.log(lines.join('\n'));
  } else {
    console.log('❌ Dev server is NOT running');
  }
} catch (error) {
  console.log('❌ Dev server is NOT running');
}

// 5. Check recent git commits vs deployed code
console.log('\n📋 Step 5: Check Git vs Deployed Code');
console.log('-'.repeat(50));
try {
  const lastCommit = execSync('git log -1 --format="%H %ci %s"', { encoding: 'utf8' }).trim();
  console.log(`Last commit: ${lastCommit}`);
  
  const uncommittedChanges = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (uncommittedChanges) {
    const changeCount = uncommittedChanges.split('\n').length;
    console.log(`⚠️  ${changeCount} uncommitted changes`);
    console.log('First 10 changes:');
    console.log(uncommittedChanges.split('\n').slice(0, 10).join('\n'));
  } else {
    console.log('✅ No uncommitted changes');
  }
} catch (error) {
  console.log('❌ Git check failed:', error.message);
}

// 6. Check browser cache issue
console.log('\n📋 Step 6: Browser Cache Detection');
console.log('-'.repeat(50));
console.log('To check if browser cache is the issue:');
console.log('1. Open DevTools (F12)');
console.log('2. Go to Network tab');
console.log('3. Check "Disable cache" checkbox');
console.log('4. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)');
console.log('5. Check if changes appear');

// 7. THE REAL ISSUE - Check deployment flow
console.log('\n📋 Step 7: DEPLOYMENT FLOW CHECK');
console.log('-'.repeat(50));
console.log('Current deployment flow:');
console.log('1. Code changes made ✅');
console.log('2. Sandbox running? (check above)');
console.log('3. amplify_outputs.json updated? (check above)');
console.log('4. Frontend rebuilt? (check above)');
console.log('5. Dev server restarted? (check above)');
console.log('6. Browser cache cleared? (manual check needed)');

console.log('\n' + '='.repeat(80));
console.log('🎯 DIAGNOSIS COMPLETE');
console.log('\nMost likely issues:');
console.log('1. Sandbox not running → backend changes not deployed');
console.log('2. Dev server not restarted → frontend serving old code');
console.log('3. Browser cache → showing old UI');
console.log('4. amplify_outputs.json stale → frontend using old backend URLs');
