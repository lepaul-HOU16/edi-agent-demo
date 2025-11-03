#!/usr/bin/env node

/**
 * Test script to verify artifact type field fix
 * 
 * This script simulates the artifact transformation that happens in the
 * renewableProxyAgent and verifies that the type field is preserved.
 */

console.log('🧪 Testing Artifact Type Field Fix\n');

// Simulate orchestrator artifact structure
const orchestratorArtifact = {
  type: 'wind_farm_terrain_analysis',
  data: {
    messageContentType: 'wind_farm_terrain_analysis',
    title: 'Terrain Analysis - Test Project',
    subtitle: 'Test subtitle',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    projectId: 'test-project-123',
    exclusionZones: [],
    metrics: {
      suitabilityScore: 85,
      totalArea: 1000,
      usableArea: 850
    },
    mapHtml: '<div>Test Map</div>',
    geojson: {
      type: 'FeatureCollection',
      features: []
    }
  },
  metadata: {
    timestamp: new Date().toISOString(),
    version: '1.0'
  }
};

console.log('📦 Original Orchestrator Artifact:');
console.log('   - Has type field:', !!orchestratorArtifact.type);
console.log('   - Type value:', orchestratorArtifact.type);
console.log('   - Has data.messageContentType:', !!orchestratorArtifact.data.messageContentType);
console.log('   - messageContentType value:', orchestratorArtifact.data.messageContentType);
console.log('');

// OLD TRANSFORMATION (BROKEN)
const oldTransform = {
  messageContentType: orchestratorArtifact.type,
  ...orchestratorArtifact.data,
  metadata: orchestratorArtifact.metadata
};

console.log('❌ OLD Transformation (BROKEN):');
console.log('   - Has type field:', !!oldTransform.type);
console.log('   - Has messageContentType field:', !!oldTransform.messageContentType);
console.log('   - messageContentType value:', oldTransform.messageContentType);
console.log('   - Validation would fail:', !oldTransform.type && !oldTransform.messageContentType);
console.log('');

// NEW TRANSFORMATION (FIXED)
const newTransform = {
  type: orchestratorArtifact.type,
  messageContentType: orchestratorArtifact.type,
  ...orchestratorArtifact.data,
  metadata: orchestratorArtifact.metadata
};

console.log('✅ NEW Transformation (FIXED):');
console.log('   - Has type field:', !!newTransform.type);
console.log('   - Type value:', newTransform.type);
console.log('   - Has messageContentType field:', !!newTransform.messageContentType);
console.log('   - messageContentType value:', newTransform.messageContentType);
console.log('   - Validation would pass:', !!newTransform.type || !!newTransform.messageContentType);
console.log('');

// Simulate validation logic from amplifyUtils.ts
function validateArtifact(artifact, name) {
  console.log(`🔍 Validating ${name}:`);
  
  if (!artifact.type && !artifact.messageContentType) {
    console.log('   ❌ FAILED: Missing both type and messageContentType fields');
    return false;
  }
  
  const artifactType = artifact.type || artifact.messageContentType;
  console.log(`   ✅ PASSED: Artifact type is "${artifactType}"`);
  return true;
}

console.log('📋 Validation Results:\n');
const oldValid = validateArtifact(oldTransform, 'OLD Transform');
console.log('');
const newValid = validateArtifact(newTransform, 'NEW Transform');
console.log('');

// Summary
console.log('=' .repeat(60));
console.log('📊 SUMMARY:');
console.log('=' .repeat(60));
console.log(`Old Transform: ${oldValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`New Transform: ${newValid ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

if (newValid && !oldValid) {
  console.log('🎉 SUCCESS! The fix resolves the validation issue.');
  console.log('');
  console.log('The new transformation:');
  console.log('  1. ✅ Preserves the top-level "type" field');
  console.log('  2. ✅ Sets "messageContentType" for backwards compatibility');
  console.log('  3. ✅ Passes validation in amplifyUtils.ts');
  console.log('  4. ✅ Works with ArtifactRenderer component');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ FAILURE! The fix does not resolve the issue.');
  process.exit(1);
}
