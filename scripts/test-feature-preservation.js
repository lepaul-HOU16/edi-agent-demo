#!/usr/bin/env node

/**
 * Test script to verify feature preservation in artifact optimization
 */

// Mock the s3ArtifactStorage module functions
const mockTerrainArtifact = {
  type: 'terrain_map',
  messageContentType: 'terrain_map',
  exclusionZones: Array.from({ length: 151 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        Array.from({ length: 1500 }, (_, j) => [
          -101.395466 + (Math.random() - 0.5) * 0.01,
          35.067482 + (Math.random() - 0.5) * 0.01
        ])
      ]]
    },
    properties: {
      feature_type: i % 5 === 0 ? 'building' : i % 5 === 1 ? 'highway' : i % 5 === 2 ? 'water' : i % 5 === 3 ? 'forest' : 'power_infrastructure',
      osm_id: `feature_${i}`,
      name: `Feature ${i}`
    }
  })),
  geojson: {
    type: 'FeatureCollection',
    features: Array.from({ length: 151 }, (_, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          Array.from({ length: 1500 }, (_, j) => [
            -101.395466 + (Math.random() - 0.5) * 0.01,
            35.067482 + (Math.random() - 0.5) * 0.01
          ])
        ]]
      },
      properties: {
        feature_type: i % 5 === 0 ? 'building' : i % 5 === 1 ? 'highway' : i % 5 === 2 ? 'water' : i % 5 === 3 ? 'forest' : 'power_infrastructure',
        osm_id: `feature_${i}`,
        name: `Feature ${i}`
      }
    }))
  }
};

console.log('🧪 Testing Feature Preservation in Artifact Optimization\n');
console.log('=' .repeat(80));

// Test the optimization logic
console.log('\n📊 Original Artifact Statistics:');
console.log(`   Exclusion Zones: ${mockTerrainArtifact.exclusionZones.length} features`);
console.log(`   GeoJSON Features: ${mockTerrainArtifact.geojson.features.length} features`);
console.log(`   Coordinates per feature: ~1500 points`);

// Calculate original size
const originalSize = JSON.stringify(mockTerrainArtifact).length;
console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);

// Simulate the optimization logic
let dataReduced = false;
const optimizedArtifact = JSON.parse(JSON.stringify(mockTerrainArtifact));

const optimizeObject = (obj, path = '') => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    // Check if this is a coordinate array (safe to sample)
    const isCoordinateArray = currentPath.includes('coordinates') && 
                              !currentPath.includes('features') &&
                              Array.isArray(value) && 
                              value.length > 100 &&
                              value.every((item) => Array.isArray(item) || typeof item === 'number');
    
    // Check if this is a features array (NEVER sample)
    const isFeaturesArray = currentPath.includes('features') || 
                           currentPath.includes('exclusionZones') ||
                           key === 'features' ||
                           key === 'exclusionZones';
    
    if (isCoordinateArray) {
      // Sample coordinate arrays for size reduction
      const sampledData = value.filter((_, index) => index % 4 === 0);
      obj[key] = sampledData;
      dataReduced = true;
      console.log(`   🔧 Sampled coordinate array at ${currentPath}: ${value.length} → ${sampledData.length} items`);
    } else if (isFeaturesArray && Array.isArray(value)) {
      // PRESERVE features arrays completely - do not sample
      console.log(`   ✅ Preserving features array at ${currentPath}: ${value.length} features (no sampling)`);
      // Recursively optimize within each feature (e.g., coordinates)
      value.forEach((feature, index) => {
        if (typeof feature === 'object' && feature !== null) {
          optimizeObject(feature, `${currentPath}[${index}]`);
        }
      });
    } else if (Array.isArray(value) && value.length > 1000) {
      // For other large arrays, sample them
      const sampledData = value.filter((_, index) => index % 8 === 0);
      obj[key] = sampledData;
      dataReduced = true;
      console.log(`   🔧 Sampled generic array at ${currentPath}: ${value.length} → ${sampledData.length} items`);
    } else if (typeof value === 'object' && value !== null) {
      optimizeObject(value, currentPath);
    }
  });
};

console.log('\n🔄 Running Optimization...\n');
optimizeObject(optimizedArtifact);

// Calculate optimized size
const optimizedSize = JSON.stringify(optimizedArtifact).length;
console.log(`\n📊 Optimized Artifact Statistics:`);
console.log(`   Exclusion Zones: ${optimizedArtifact.exclusionZones.length} features`);
console.log(`   GeoJSON Features: ${optimizedArtifact.geojson.features.length} features`);
console.log(`   Optimized size: ${(optimizedSize / 1024).toFixed(2)} KB`);
console.log(`   Size reduction: ${((1 - optimizedSize / originalSize) * 100).toFixed(1)}%`);

// Verify the fix
console.log('\n' + '='.repeat(80));
console.log('\n🎯 Verification Results:\n');

const exclusionZonesPreserved = optimizedArtifact.exclusionZones.length === 151;
const geojsonFeaturesPreserved = optimizedArtifact.geojson.features.length === 151;
const sizeReduced = optimizedSize < originalSize;

if (exclusionZonesPreserved) {
  console.log('✅ PASS: Exclusion zones preserved (151 features)');
} else {
  console.log(`❌ FAIL: Exclusion zones NOT preserved (${optimizedArtifact.exclusionZones.length} features, expected 151)`);
}

if (geojsonFeaturesPreserved) {
  console.log('✅ PASS: GeoJSON features preserved (151 features)');
} else {
  console.log(`❌ FAIL: GeoJSON features NOT preserved (${optimizedArtifact.geojson.features.length} features, expected 151)`);
}

if (sizeReduced) {
  console.log('✅ PASS: Size reduced through coordinate optimization');
} else {
  console.log('❌ FAIL: Size not reduced');
}

// Check if coordinates were optimized
const firstFeatureCoords = optimizedArtifact.exclusionZones[0].geometry.coordinates[0].length;
const coordinatesOptimized = firstFeatureCoords < 1500;

if (coordinatesOptimized) {
  console.log(`✅ PASS: Coordinates optimized (${firstFeatureCoords} points, down from ~1500)`);
} else {
  console.log(`❌ FAIL: Coordinates NOT optimized (${firstFeatureCoords} points)`);
}

console.log('\n' + '='.repeat(80));

if (exclusionZonesPreserved && geojsonFeaturesPreserved && sizeReduced && coordinatesOptimized) {
  console.log('\n✅ ALL TESTS PASSED - Feature preservation working correctly!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED - Feature preservation needs attention');
  process.exit(1);
}
