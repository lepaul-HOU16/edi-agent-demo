#!/usr/bin/env node

/**
 * Task 12: Verify Map Theme Persistence Implementation
 * 
 * This script verifies that all code changes from tasks 1-11 are present
 * in the MapComponent.tsx file.
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${COLORS.reset} ${message}`);
}

function success(message) {
  log(COLORS.green, '✅', message);
}

function error(message) {
  log(COLORS.red, '❌', message);
}

function info(message) {
  log(COLORS.blue, 'ℹ️ ', message);
}

function warning(message) {
  log(COLORS.yellow, '⚠️ ', message);
}

console.log('\n' + COLORS.cyan + '═'.repeat(70) + COLORS.reset);
console.log(COLORS.cyan + '  Task 12: Map Theme Persistence - Implementation Verification' + COLORS.reset);
console.log(COLORS.cyan + '═'.repeat(70) + COLORS.reset + '\n');

const mapComponentPath = path.join(__dirname, 'src', 'pages', 'MapComponent.tsx');

if (!fs.existsSync(mapComponentPath)) {
  error('MapComponent.tsx not found!');
  process.exit(1);
}

const content = fs.readFileSync(mapComponentPath, 'utf-8');

let allPassed = true;

// Task 1: State interface includes wellData and weatherLayers
info('Checking Task 1: State interface...');
const hasWellDataState = content.includes('wellData:') && content.includes('any | null');
const hasWeatherLayersState = content.includes('weatherLayers:') && content.includes('string[]');

if (hasWellDataState && hasWeatherLayersState) {
  success('State interface includes wellData and weatherLayers');
} else {
  error('State interface missing wellData or weatherLayers');
  if (!hasWellDataState) warning('  Missing: wellData: any | null');
  if (!hasWeatherLayersState) warning('  Missing: weatherLayers: string[]');
  allPassed = false;
}

// Task 2: Save well data in updateMapData
info('Checking Task 2: Save well data in updateMapData...');
const saveWellDataPattern = /setCurrentMapState.*wellData.*geoJsonData/s;
const hasSaveWellData = saveWellDataPattern.test(content);

if (hasSaveWellData) {
  success('updateMapData saves well data to state');
} else {
  error('updateMapData does not save well data to state');
  warning('  Expected: setCurrentMapState with wellData: geoJsonData');
  allPassed = false;
}

// Task 3: Track weather layers in toggleWeatherLayer
info('Checking Task 3: Track weather layers...');
const hasWeatherLayerTracking = content.includes('weatherLayers') && 
                                 content.includes('toggleWeatherLayer');

if (hasWeatherLayerTracking) {
  success('Weather layer tracking implemented');
} else {
  error('Weather layer tracking not found');
  allPassed = false;
}

// Task 4: Restore markers in theme change handler
info('Checking Task 4: Restore markers in theme change...');
const restoreMarkersPattern = /if.*currentMapState\.wellData.*updateMapData.*currentMapState\.wellData/s;
const hasRestoreMarkers = restoreMarkersPattern.test(content);

if (hasRestoreMarkers) {
  success('Theme change handler restores markers');
} else {
  error('Theme change handler does not restore markers');
  warning('  Expected: if (currentMapState.wellData) updateMapData(...)');
  allPassed = false;
}

// Task 5: Restore weather layers in theme change
info('Checking Task 5: Restore weather layers...');
const restoreWeatherPattern = /weatherLayers.*forEach|weatherLayers.*map/s;
const hasRestoreWeather = restoreWeatherPattern.test(content);

if (hasRestoreWeather) {
  success('Theme change handler restores weather layers');
} else {
  warning('Weather layer restoration not found (may not be implemented yet)');
}

// Task 6: Clear state in clearMap
info('Checking Task 6: Clear state in clearMap...');
const clearStatePattern = /clearMap.*wellData.*null.*weatherLayers.*\[\]/s;
const hasClearState = clearStatePattern.test(content) || 
                      (content.includes('clearMap') && 
                       content.includes('wellData: null') && 
                       content.includes('weatherLayers: []'));

if (hasClearState) {
  success('clearMap clears wellData and weatherLayers');
} else {
  error('clearMap does not clear state properly');
  warning('  Expected: wellData: null, weatherLayers: []');
  allPassed = false;
}

// Task 7: Defensive logging
info('Checking Task 7: Defensive logging...');
const loggingPatterns = [
  /console\.log.*Saving well data/i,
  /console\.log.*Theme change/i,
  /console\.log.*Restoring.*markers/i,
  /console\.log.*restored successfully/i,
];

const loggingCount = loggingPatterns.filter(pattern => pattern.test(content)).length;

if (loggingCount >= 3) {
  success(`Defensive logging implemented (${loggingCount}/4 patterns found)`);
} else {
  warning(`Limited logging found (${loggingCount}/4 patterns)`);
  warning('  Consider adding more console.log statements for debugging');
}

// Check for common issues
info('Checking for common issues...');

const hasFunctionalSetState = content.includes('setCurrentMapState(prev =>') || 
                               content.includes('setCurrentMapState((prev)');
if (hasFunctionalSetState) {
  success('Using functional setState (avoids stale closures)');
} else {
  warning('Not using functional setState - may have stale closure issues');
}

const hasStyleDataHandler = content.includes("'styledata'") || content.includes('"styledata"');
if (hasStyleDataHandler) {
  success('styledata event handler present');
} else {
  error('styledata event handler not found');
  allPassed = false;
}

// Summary
console.log('\n' + COLORS.cyan + '═'.repeat(70) + COLORS.reset);
if (allPassed) {
  console.log(COLORS.green + '  ✅ ALL CRITICAL CHECKS PASSED' + COLORS.reset);
  console.log(COLORS.cyan + '═'.repeat(70) + COLORS.reset + '\n');
  
  info('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000/catalog');
  console.log('  3. Test: Search for wells, then switch themes');
  console.log('  4. Verify: Markers persist across theme changes');
  console.log('  5. Check: Console logs show restoration messages\n');
  
  process.exit(0);
} else {
  console.log(COLORS.red + '  ❌ SOME CHECKS FAILED' + COLORS.reset);
  console.log(COLORS.cyan + '═'.repeat(70) + COLORS.reset + '\n');
  
  error('Implementation incomplete. Review failed checks above.');
  process.exit(1);
}
