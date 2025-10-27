#!/usr/bin/env node

/**
 * Frontend Deployment Validation Script
 * 
 * Validates that all frontend changes for fix-renewable-workflow-ui-issues are deployed correctly.
 * Tests artifact rendering, error handling, and user experience.
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Frontend Deployment Validation\n');
console.log('=' .repeat(80));

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, status, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  
  results.tests.push({ name, status, message });
  
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

// Test 1: Verify LayoutMapArtifact has defensive rendering
console.log('\n📋 Test 1: LayoutMapArtifact Defensive Rendering');
console.log('-'.repeat(80));

try {
  const layoutMapPath = path.join(__dirname, '../src/components/renewable/LayoutMapArtifact.tsx');
  const layoutMapContent = fs.readFileSync(layoutMapPath, 'utf8');
  
  // Check for validation checks
  const hasGeoJsonValidation = layoutMapContent.includes('if (!data.geojson)');
  const hasFeaturesValidation = layoutMapContent.includes('if (!data.geojson.features');
  const hasEmptyValidation = layoutMapContent.includes('features.length === 0');
  const hasContainerValidation = layoutMapContent.includes('getBoundingClientRect()');
  const hasFallbackUI = layoutMapContent.includes('Map Data Unavailable');
  const hasErrorBoundary = layoutMapContent.includes('try {') && layoutMapContent.includes('catch (error)');
  
  if (hasGeoJsonValidation && hasFeaturesValidation && hasEmptyValidation) {
    logTest('GeoJSON Validation', 'PASS', 'All GeoJSON validation checks present');
  } else {
    logTest('GeoJSON Validation', 'FAIL', 'Missing GeoJSON validation checks');
  }
  
  if (hasContainerValidation) {
    logTest('Container Validation', 'PASS', 'Container dimension validation present');
  } else {
    logTest('Container Validation', 'FAIL', 'Missing container dimension validation');
  }
  
  if (hasFallbackUI) {
    logTest('Fallback UI', 'PASS', 'Fallback UI for missing data present');
  } else {
    logTest('Fallback UI', 'FAIL', 'Missing fallback UI');
  }
  
  if (hasErrorBoundary) {
    logTest('Error Boundary', 'PASS', 'Error boundary implemented');
  } else {
    logTest('Error Boundary', 'FAIL', 'Missing error boundary');
  }
  
  // Check for perimeter rendering
  const hasPerimeterRendering = layoutMapContent.includes('type === \'perimeter\'');
  const hasPerimeterStyle = layoutMapContent.includes('dashArray');
  
  if (hasPerimeterRendering && hasPerimeterStyle) {
    logTest('Perimeter Rendering', 'PASS', 'Perimeter rendering with dashed style');
  } else {
    logTest('Perimeter Rendering', 'FAIL', 'Missing perimeter rendering');
  }
  
  // Check for terrain features rendering
  const hasTerrainRendering = layoutMapContent.includes('terrainFeatures');
  const hasTurbineRendering = layoutMapContent.includes('turbineFeatures');
  const hasRenderOrder = layoutMapContent.includes('Render terrain features first');
  
  if (hasTerrainRendering && hasTurbineRendering && hasRenderOrder) {
    logTest('Feature Rendering Order', 'PASS', 'Terrain rendered before turbines');
  } else {
    logTest('Feature Rendering Order', 'FAIL', 'Incorrect rendering order');
  }
  
} catch (error) {
  logTest('LayoutMapArtifact Tests', 'FAIL', `Error reading file: ${error.message}`);
}

// Test 2: Verify WakeAnalysisArtifact has heat map fallback
console.log('\n📋 Test 2: WakeAnalysisArtifact Heat Map Fallback');
console.log('-'.repeat(80));

try {
  const wakeArtifactPath = path.join(__dirname, '../src/components/renewable/WakeAnalysisArtifact.tsx');
  const wakeArtifactContent = fs.readFileSync(wakeArtifactPath, 'utf8');
  
  // Check for heat map fallback
  const hasHeatMapCheck = wakeArtifactContent.includes('wake_heat_map');
  const hasFallbackAlert = wakeArtifactContent.includes('Wake Heat Map Not Available');
  const hasAlternativeOption = wakeArtifactContent.includes('wake_analysis');
  const hasIframeError = wakeArtifactContent.includes('onError');
  
  if (hasHeatMapCheck && hasFallbackAlert) {
    logTest('Heat Map Fallback', 'PASS', 'Fallback UI for missing heat map');
  } else {
    logTest('Heat Map Fallback', 'FAIL', 'Missing heat map fallback');
  }
  
  if (hasAlternativeOption) {
    logTest('Alternative Visualization', 'PASS', 'Alternative visualization option provided');
  } else {
    logTest('Alternative Visualization', 'WARN', 'No alternative visualization suggested');
  }
  
  if (hasIframeError) {
    logTest('Iframe Error Handling', 'PASS', 'Iframe error handler present');
  } else {
    logTest('Iframe Error Handling', 'WARN', 'Missing iframe error handler');
  }
  
} catch (error) {
  logTest('WakeAnalysisArtifact Tests', 'FAIL', `Error reading file: ${error.message}`);
}

// Test 3: Verify WorkflowCTAButtons always renders
console.log('\n📋 Test 3: WorkflowCTAButtons Always Renders');
console.log('-'.repeat(80));

try {
  const ctaButtonsPath = path.join(__dirname, '../src/components/renewable/WorkflowCTAButtons.tsx');
  const ctaButtonsContent = fs.readFileSync(ctaButtonsPath, 'utf8');
  
  // Check for early return removal
  const hasEarlyReturn = ctaButtonsContent.match(/if\s*\([^)]*\.length\s*===\s*0\s*\)\s*return\s*null/);
  const hasAlwaysRender = ctaButtonsContent.includes('Next Steps') || ctaButtonsContent.includes('Suggested Next Step');
  
  if (!hasEarlyReturn && hasAlwaysRender) {
    logTest('Always Renders', 'PASS', 'No early return, always shows buttons');
  } else if (hasEarlyReturn) {
    logTest('Always Renders', 'FAIL', 'Early return still present');
  } else {
    logTest('Always Renders', 'WARN', 'Cannot verify rendering logic');
  }
  
} catch (error) {
  logTest('WorkflowCTAButtons Tests', 'FAIL', `Error reading file: ${error.message}`);
}

// Test 4: Verify build artifacts exist
console.log('\n📋 Test 4: Build Artifacts');
console.log('-'.repeat(80));

try {
  const buildDir = path.join(__dirname, '../.next');
  
  if (fs.existsSync(buildDir)) {
    logTest('Build Directory', 'PASS', '.next directory exists');
    
    // Check for specific build artifacts
    const serverDir = path.join(buildDir, 'server');
    const staticDir = path.join(buildDir, 'static');
    
    if (fs.existsSync(serverDir)) {
      logTest('Server Build', 'PASS', 'Server build artifacts present');
    } else {
      logTest('Server Build', 'FAIL', 'Server build artifacts missing');
    }
    
    if (fs.existsSync(staticDir)) {
      logTest('Static Build', 'PASS', 'Static build artifacts present');
    } else {
      logTest('Static Build', 'FAIL', 'Static build artifacts missing');
    }
  } else {
    logTest('Build Directory', 'FAIL', '.next directory does not exist - run npm run build');
  }
} catch (error) {
  logTest('Build Artifacts Tests', 'FAIL', `Error checking build: ${error.message}`);
}

// Test 5: Verify component imports
console.log('\n📋 Test 5: Component Imports');
console.log('-'.repeat(80));

try {
  const chatMessagePath = path.join(__dirname, '../src/components/ChatMessage.tsx');
  const chatMessageContent = fs.readFileSync(chatMessagePath, 'utf8');
  
  // Check for artifact component imports
  const hasLayoutMapImport = chatMessageContent.includes('LayoutMapArtifact');
  const hasWakeAnalysisImport = chatMessageContent.includes('WakeAnalysisArtifact');
  const hasWorkflowCTAImport = chatMessageContent.includes('WorkflowCTAButtons');
  
  if (hasLayoutMapImport) {
    logTest('LayoutMapArtifact Import', 'PASS', 'Component imported in ChatMessage');
  } else {
    logTest('LayoutMapArtifact Import', 'FAIL', 'Component not imported');
  }
  
  if (hasWakeAnalysisImport) {
    logTest('WakeAnalysisArtifact Import', 'PASS', 'Component imported in ChatMessage');
  } else {
    logTest('WakeAnalysisArtifact Import', 'FAIL', 'Component not imported');
  }
  
} catch (error) {
  logTest('Component Import Tests', 'FAIL', `Error reading file: ${error.message}`);
}

// Print summary
console.log('\n' + '='.repeat(80));
console.log('📊 Test Summary');
console.log('='.repeat(80));
console.log(`✅ Passed:   ${results.passed}`);
console.log(`❌ Failed:   ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log(`📝 Total:    ${results.tests.length}`);

// Deployment checklist
console.log('\n' + '='.repeat(80));
console.log('📋 Deployment Checklist');
console.log('='.repeat(80));

const checklist = [
  { item: 'Frontend build completed', status: fs.existsSync(path.join(__dirname, '../.next')) },
  { item: 'LayoutMapArtifact defensive rendering', status: results.tests.find(t => t.name === 'GeoJSON Validation')?.status === 'PASS' },
  { item: 'WakeAnalysisArtifact heat map fallback', status: results.tests.find(t => t.name === 'Heat Map Fallback')?.status === 'PASS' },
  { item: 'WorkflowCTAButtons always renders', status: results.tests.find(t => t.name === 'Always Renders')?.status === 'PASS' },
  { item: 'Perimeter rendering implemented', status: results.tests.find(t => t.name === 'Perimeter Rendering')?.status === 'PASS' },
  { item: 'Error boundaries in place', status: results.tests.find(t => t.name === 'Error Boundary')?.status === 'PASS' }
];

checklist.forEach(({ item, status }) => {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${item}`);
});

// Next steps
console.log('\n' + '='.repeat(80));
console.log('🚀 Next Steps');
console.log('='.repeat(80));

if (results.failed === 0) {
  console.log('✅ All frontend changes validated successfully!');
  console.log('\n📝 Manual Testing Required:');
  console.log('   1. Open browser and navigate to chat interface');
  console.log('   2. Test terrain analysis query - verify perimeter shows on map');
  console.log('   3. Test layout optimization - verify terrain features + turbines render');
  console.log('   4. Test wake simulation - verify heat map loads or fallback shows');
  console.log('   5. Verify action buttons appear at each step');
  console.log('   6. Test error states by providing invalid data');
  console.log('   7. Clear browser cache and retest');
  console.log('\n🌐 Test URLs:');
  console.log('   - Local: http://localhost:3000/chat/[session-id]');
  console.log('   - Deployed: Check Amplify console for deployment URL');
} else {
  console.log('❌ Some tests failed. Please fix issues before deploying.');
  console.log('\n🔧 Failed Tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
}

console.log('\n' + '='.repeat(80));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
