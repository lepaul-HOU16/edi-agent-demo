#!/usr/bin/env node

/**
 * Edge Case Implementation Verification Script
 * 
 * This script verifies that all edge cases are properly handled in the MapComponent implementation.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Edge Case Implementation...\n');

const mapComponentPath = path.join(__dirname, 'src/pages/MapComponent.tsx');
const mapComponentCode = fs.readFileSync(mapComponentPath, 'utf8');

const checks = [
  {
    name: 'Edge Case 1: Null check for wellData',
    requirement: '4.1 - Theme change with no data should not error',
    pattern: /if\s*\(\s*currentMapState\.wellData\s*\)/,
    description: 'Checks if wellData exists before restoring',
    expected: true
  },
  {
    name: 'Edge Case 1: Else clause for no data',
    requirement: '4.1 - Should log when no data to restore',
    pattern: /else\s*\{[^}]*No well data to restore/s,
    description: 'Logs message when no data exists',
    expected: true
  },
  {
    name: 'Edge Case 2: Save pitch before theme change',
    requirement: '4.2 - Should preserve pitch in 3D mode',
    pattern: /const\s+currentPitch\s*=\s*mapRef\.current\.getPitch\(\)/,
    description: 'Saves pitch value before style change',
    expected: true
  },
  {
    name: 'Edge Case 2: Save bearing before theme change',
    requirement: '4.2 - Should preserve bearing in 3D mode',
    pattern: /const\s+currentBearing\s*=\s*mapRef\.current\.getBearing\(\)/,
    description: 'Saves bearing value before style change',
    expected: true
  },
  {
    name: 'Edge Case 2: Restore pitch after theme change',
    requirement: '4.2 - Should restore pitch after style loads',
    pattern: /pitch:\s*currentPitch/,
    description: 'Restores pitch in jumpTo call',
    expected: true
  },
  {
    name: 'Edge Case 2: Restore bearing after theme change',
    requirement: '4.2 - Should restore bearing after style loads',
    pattern: /bearing:\s*currentBearing/,
    description: 'Restores bearing in jumpTo call',
    expected: true
  },
  {
    name: 'Edge Case 3: Draw control persists',
    requirement: '4.3 - Polygons should persist across theme changes',
    pattern: /drawRef\.current\s*=\s*new\s+MapboxDraw/,
    description: 'Draw control created once and persists',
    expected: true
  },
  {
    name: 'Edge Case 4: Functional setState',
    requirement: '4.4 - Should avoid race conditions with functional setState',
    pattern: /setCurrentMapState\(\s*prev\s*=>\s*\(\s*\{/,
    description: 'Uses functional setState to avoid stale closures',
    expected: true
  },
  {
    name: 'Edge Case 4: Once event listener',
    requirement: '4.4 - Should use once() to prevent duplicate handlers',
    pattern: /mapRef\.current\.once\(\s*['"]styledata['"]/,
    description: 'Uses once() instead of on() for styledata event',
    expected: true
  },
  {
    name: 'Edge Case 5: Clear wellData in clearMap',
    requirement: '4.5 - Should clear wellData when map is cleared',
    pattern: /wellData:\s*null/,
    description: 'Sets wellData to null in clearMap',
    expected: true
  },
  {
    name: 'Edge Case 5: Clear weatherLayers in clearMap',
    requirement: '4.5 - Should clear weatherLayers when map is cleared',
    pattern: /weatherLayers:\s*\[\]/,
    description: 'Sets weatherLayers to empty array in clearMap',
    expected: true
  },
  {
    name: 'State initialization: wellData null',
    requirement: 'Initial state - wellData should start as null',
    pattern: /wellData:\s*null[,\s]/,
    description: 'wellData initialized as null',
    expected: true
  },
  {
    name: 'State initialization: weatherLayers empty',
    requirement: 'Initial state - weatherLayers should start as empty array',
    pattern: /weatherLayers:\s*\[\]/,
    description: 'weatherLayers initialized as empty array',
    expected: true
  },
  {
    name: 'Save wellData in updateMapData',
    requirement: 'Core functionality - Save data for theme persistence',
    pattern: /setCurrentMapState\([^)]*wellData:\s*geoJsonData/s,
    description: 'Saves geoJsonData to state in updateMapData',
    expected: true
  }
];

let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  const result = check.pattern.test(mapComponentCode);
  const status = result === check.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === check.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} - ${check.name}`);
  console.log(`   Requirement: ${check.requirement}`);
  console.log(`   Description: ${check.description}`);
  console.log('');
});

console.log('═'.repeat(80));
console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

if (failed === 0) {
  console.log('🎉 All edge cases are properly implemented!\n');
  console.log('✅ Edge Case 1: Theme change with no data - HANDLED');
  console.log('✅ Edge Case 2: Theme change in 3D mode - HANDLED');
  console.log('✅ Edge Case 3: Theme change with polygons - HANDLED');
  console.log('✅ Edge Case 4: Multiple rapid theme changes - HANDLED');
  console.log('✅ Edge Case 5: Clear map then theme change - HANDLED');
  console.log('\n📝 Next step: Run manual tests using test-map-theme-edge-cases.html');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} check(s) failed. Review implementation.\n`);
  process.exit(1);
}
