/**
 * CRITICAL VALIDATION: Prove Intelligent Placement Actually Works
 * 
 * This test validates that:
 * 1. Intelligent placement algorithm is actually being called
 * 2. Turbines are NOT in a regular grid
 * 3. Turbines visibly avoid obstacles
 * 4. Algorithm metadata is returned and displayed
 * 
 * This is NOT a unit test - this validates the COMPLETE END-TO-END flow
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });

// Test coordinates with known OSM features
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  description: 'Texas Panhandle - has buildings, roads, water'
};

async function validateIntelligentPlacement() {
  console.log('=' .repeat(80));
  console.log('🎯 CRITICAL VALIDATION: Intelligent Placement End-to-End Test');
  console.log('=' .repeat(80));
  console.log('');
  
  // STEP 1: Get Lambda function names (handle pagination)
  console.log('STEP 1: Finding Lambda functions...');
  
  let allFunctions = [];
  let marker = null;
  
  do {
    const params = marker ? { Marker: marker } : {};
    const lambdaList = await lambda.listFunctions(params).promise();
    allFunctions = allFunctions.concat(lambdaList.Functions);
    marker = lambdaList.NextMarker;
  } while (marker);
  
  console.log(`   Found ${allFunctions.length} total Lambda functions`);
  
  // Find Amplify-managed functions (these have proper IAM roles)
  const terrainLambda = allFunctions.find(f => 
    f.FunctionName.includes('RenewableTerrainTool')
  );
  
  const layoutLambda = allFunctions.find(f => 
    f.FunctionName.includes('RenewableLayoutTool')
  );
  
  if (!terrainLambda || !layoutLambda) {
    console.error('❌ FAILED: Could not find required Lambda functions');
    console.error('   Terrain Lambda:', terrainLambda?.FunctionName || 'NOT FOUND');
    console.error('   Layout Lambda:', layoutLambda?.FunctionName || 'NOT FOUND');
    return false;
  }
  
  console.log('✅ Found Lambda functions:');
  console.log('   Terrain:', terrainLambda.FunctionName);
  console.log('   Layout:', layoutLambda.FunctionName);
  console.log('');
  
  // STEP 2: Call terrain analysis to get OSM features
  console.log('STEP 2: Running terrain analysis to get OSM features...');
  console.log(`   Location: ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`);
  
  const terrainPayload = {
    parameters: {
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      radius_km: 5
    }
  };
  
  const terrainResponse = await lambda.invoke({
    FunctionName: terrainLambda.FunctionName,
    Payload: JSON.stringify(terrainPayload)
  }).promise();
  
  let terrainResult = JSON.parse(terrainResponse.Payload);
  
  // Handle Lambda response wrapper
  if (terrainResult.statusCode && terrainResult.body) {
    terrainResult = JSON.parse(terrainResult.body);
  }
  
  if (!terrainResult.success) {
    console.error('❌ FAILED: Terrain analysis failed');
    console.error('   Error:', terrainResult.error || terrainResult);
    return false;
  }
  
  const terrainData = terrainResult.data;
  
  // Check both exclusionZones and allFeatures for OSM data
  const exclusionZones = terrainData.exclusionZones || {};
  let buildings = exclusionZones.buildings || [];
  let roads = exclusionZones.roads || [];
  let waterBodies = exclusionZones.waterBodies || [];
  
  // If exclusionZones is empty, extract from allFeatures
  if (buildings.length === 0 && roads.length === 0 && waterBodies.length === 0) {
    const allFeatures = terrainData.allFeatures || [];
    buildings = allFeatures.filter(f => f.properties?.feature_type === 'building');
    roads = allFeatures.filter(f => f.properties?.feature_type === 'highway');
    waterBodies = allFeatures.filter(f => f.properties?.feature_type === 'water' || f.properties?.feature_type === 'waterway');
    
    // Update exclusionZones for layout Lambda
    exclusionZones.buildings = buildings;
    exclusionZones.roads = roads;
    exclusionZones.waterBodies = waterBodies;
  }
  
  const totalConstraints = buildings.length + roads.length + waterBodies.length;
  
  console.log('✅ Terrain analysis complete:');
  console.log(`   Buildings: ${buildings.length}`);
  console.log(`   Roads: ${roads.length}`);
  console.log(`   Water bodies: ${waterBodies.length}`);
  console.log(`   Total constraints: ${totalConstraints}`);
  console.log('');
  
  if (totalConstraints === 0) {
    console.warn('⚠️  WARNING: No OSM features found at test location');
    console.warn('   Intelligent placement will fall back to grid');
    console.warn('   This is expected for remote locations');
    console.warn('   Continuing with test...');
    console.log('');
  }
  
  // STEP 3: Call layout optimization with terrain context
  console.log('STEP 3: Running layout optimization with terrain constraints...');
  
  const layoutPayload = {
    parameters: {
      project_id: `test-intelligent-placement-${Date.now()}`,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      area_km2: 5.0,
      turbine_spacing_m: 500,
      num_turbines: 25
    },
    project_context: {
      terrain_results: {
        geojson: terrainData.geojson,
        exclusionZones: exclusionZones
      }
    }
  };
  
  const layoutResponse = await lambda.invoke({
    FunctionName: layoutLambda.FunctionName,
    Payload: JSON.stringify(layoutPayload)
  }).promise();
  
  let layoutResult = JSON.parse(layoutResponse.Payload);
  
  // Handle Lambda response wrapper
  if (layoutResult.statusCode && layoutResult.body) {
    layoutResult = JSON.parse(layoutResult.body);
  }
  
  if (!layoutResult.success) {
    console.error('❌ FAILED: Layout optimization failed');
    console.error('   Error:', layoutResult.error || layoutResult);
    return false;
  }
  
  const layoutData = layoutResult.data;
  console.log('✅ Layout optimization complete');
  console.log('');
  
  // STEP 4: Validate algorithm metadata
  console.log('STEP 4: Validating algorithm metadata...');
  
  const metadata = layoutData.metadata;
  if (!metadata) {
    console.error('❌ FAILED: No metadata in response');
    console.error('   Response:', JSON.stringify(layoutData, null, 2));
    return false;
  }
  
  console.log('   Algorithm:', metadata.algorithm);
  console.log('   Algorithm Proof:', metadata.algorithm_proof);
  console.log('   Constraints Applied:', metadata.constraints_applied);
  console.log('   Features Considered:', metadata.terrain_features_considered);
  console.log('');
  
  // CRITICAL VALIDATION: Check algorithm matches constraints
  const expectedAlgorithm = totalConstraints > 0 ? 'intelligent_placement' : 'grid';
  
  if (metadata.algorithm !== expectedAlgorithm) {
    console.error(`❌ FAILED: Algorithm is NOT ${expectedAlgorithm}`);
    console.error(`   Expected: ${expectedAlgorithm} (based on ${totalConstraints} constraints)`);
    console.error(`   Actual: ${metadata.algorithm}`);
    if (totalConstraints > 0) {
      console.error('   This means intelligent placement did NOT run despite having constraints!');
    }
    return false;
  }
  
  console.log(`✅ Algorithm is ${metadata.algorithm} (correct for ${totalConstraints} constraints)`);
  
  // CRITICAL VALIDATION: Check algorithm proof
  const expectedProof = totalConstraints > 0 ? 'INTELLIGENT_PLACEMENT' : 'GRID_PLACEMENT';
  if (!metadata.algorithm_proof || !metadata.algorithm_proof.includes(expectedProof)) {
    console.error('❌ FAILED: Algorithm proof mismatch');
    console.error(`   Expected proof containing: ${expectedProof}`);
    console.error(`   Actual: ${metadata.algorithm_proof}`);
    return false;
  }
  
  console.log('✅ Algorithm proof confirmed');
  
  // CRITICAL VALIDATION: Check constraints match expectations
  if (totalConstraints > 0 && metadata.constraints_applied === 0) {
    console.error('❌ FAILED: Constraints available but not applied');
    console.error(`   Available constraints: ${totalConstraints}`);
    console.error(`   Applied constraints: ${metadata.constraints_applied}`);
    console.error('   Intelligent placement should have used the constraints!');
    return false;
  }
  
  console.log(`✅ Constraints: ${metadata.constraints_applied} applied (${totalConstraints} available)`);
  console.log('');
  
  // STEP 5: Validate turbine positions are NOT in a grid
  console.log('STEP 5: Validating turbine positions are NOT in a regular grid...');
  
  const geojson = layoutData.geojson;
  if (!geojson || !geojson.features) {
    console.error('❌ FAILED: No GeoJSON in response');
    return false;
  }
  
  const turbines = geojson.features.filter(f => 
    f.properties?.type === 'turbine' || f.properties?.turbine_id
  );
  
  console.log(`   Found ${turbines.length} turbines`);
  
  if (turbines.length === 0) {
    console.error('❌ FAILED: No turbines in GeoJSON');
    return false;
  }
  
  // Extract turbine positions
  const positions = turbines.map(t => ({
    lat: t.geometry.coordinates[1],
    lon: t.geometry.coordinates[0],
    id: t.properties.turbine_id
  }));
  
  // Check if positions form a regular grid
  // In a grid, spacing between adjacent turbines should be very consistent
  const spacings = [];
  for (let i = 0; i < positions.length - 1; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const latDiff = Math.abs(positions[i].lat - positions[j].lat);
      const lonDiff = Math.abs(positions[i].lon - positions[j].lon);
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
      spacings.push(distance);
    }
  }
  
  // Calculate spacing variance
  const meanSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
  const variance = spacings.reduce((sum, s) => sum + Math.pow(s - meanSpacing, 2), 0) / spacings.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / meanSpacing;
  
  console.log('   Spacing statistics:');
  console.log(`     Mean spacing: ${meanSpacing.toFixed(6)} degrees`);
  console.log(`     Std deviation: ${stdDev.toFixed(6)} degrees`);
  console.log(`     Coefficient of variation: ${coefficientOfVariation.toFixed(4)}`);
  console.log('');
  
  // Grid layouts have very low variation (< 0.1)
  // Intelligent placement should have higher variation (> 0.15)
  if (coefficientOfVariation < 0.1) {
    console.error('❌ FAILED: Turbines appear to be in a regular grid');
    console.error('   Coefficient of variation is too low (< 0.1)');
    console.error('   This suggests grid placement, not intelligent placement');
    return false;
  }
  
  console.log('✅ Turbines are NOT in a regular grid (variation > 0.1)');
  console.log('');
  
  // STEP 6: Validate turbines avoid obstacles
  console.log('STEP 6: Validating turbines avoid obstacles...');
  
  let turbinesNearObstacles = 0;
  const safetyMargin = 0.001; // ~100m in degrees
  
  for (const turbine of positions) {
    let tooClose = false;
    
    // Check distance to buildings
    for (const building of buildings) {
      const geom = building.geometry;
      if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
        const coords = geom.coordinates[0];
        for (const coord of coords) {
          const latDiff = Math.abs(turbine.lat - coord[1]);
          const lonDiff = Math.abs(turbine.lon - coord[0]);
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          
          if (distance < safetyMargin) {
            tooClose = true;
            break;
          }
        }
      }
      if (tooClose) break;
    }
    
    if (tooClose) {
      turbinesNearObstacles++;
      console.log(`   ⚠️ Turbine ${turbine.id} is within ${safetyMargin * 111000}m of obstacle`);
    }
  }
  
  const percentageNearObstacles = (turbinesNearObstacles / turbines.length) * 100;
  
  console.log(`   Turbines near obstacles: ${turbinesNearObstacles} / ${turbines.length} (${percentageNearObstacles.toFixed(1)}%)`);
  console.log('');
  
  // Allow up to 10% of turbines to be near obstacles (algorithm isn't perfect)
  if (percentageNearObstacles > 10) {
    console.error('❌ FAILED: Too many turbines near obstacles');
    console.error(`   ${percentageNearObstacles.toFixed(1)}% of turbines are within safety margin`);
    console.error('   Intelligent placement should keep turbines away from obstacles');
    return false;
  }
  
  console.log('✅ Turbines avoid obstacles (< 10% near obstacles)');
  console.log('');
  
  // STEP 7: Validate OSM features are included in response
  console.log('STEP 7: Validating OSM features are included in layout response...');
  
  const terrainFeaturesInLayout = geojson.features.filter(f => 
    f.properties?.type !== 'turbine' && !f.properties?.turbine_id
  );
  
  console.log(`   Terrain features in layout: ${terrainFeaturesInLayout.length}`);
  
  const featureTypes = {};
  terrainFeaturesInLayout.forEach(f => {
    const type = f.properties?.type || 'unknown';
    featureTypes[type] = (featureTypes[type] || 0) + 1;
  });
  
  console.log('   Feature breakdown:', featureTypes);
  console.log('');
  
  if (terrainFeaturesInLayout.length === 0) {
    console.error('❌ FAILED: No terrain features in layout response');
    console.error('   OSM features should be merged with turbine positions');
    return false;
  }
  
  console.log('✅ OSM features are included in layout response');
  console.log('');
  
  // FINAL SUMMARY
  console.log('=' .repeat(80));
  console.log('🎉 SUCCESS: Intelligent Placement is Working!');
  console.log('=' .repeat(80));
  console.log('');
  console.log('Validation Results:');
  console.log(`  ✅ Algorithm: ${metadata.algorithm}`);
  console.log(`  ✅ Constraints applied: ${metadata.constraints_applied}`);
  console.log(`  ✅ Turbines: ${turbines.length}`);
  console.log(`  ✅ Spacing variation: ${coefficientOfVariation.toFixed(4)} (NOT a grid)`);
  console.log(`  ✅ Turbines near obstacles: ${percentageNearObstacles.toFixed(1)}% (< 10%)`);
  console.log(`  ✅ Terrain features included: ${terrainFeaturesInLayout.length}`);
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Test in browser UI at location:', TEST_LOCATION.description);
  console.log(`  2. Query: "optimize layout at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}"`);
  console.log('  3. Verify algorithm info box shows "intelligent_placement"');
  console.log('  4. Visually inspect turbine positions avoid obstacles');
  console.log('  5. Check CloudWatch logs for "INTELLIGENT_PLACEMENT" messages');
  console.log('');
  
  return true;
}

// Run validation
validateIntelligentPlacement()
  .then(success => {
    if (success) {
      console.log('✅ VALIDATION PASSED');
      process.exit(0);
    } else {
      console.log('❌ VALIDATION FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ VALIDATION ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  });
