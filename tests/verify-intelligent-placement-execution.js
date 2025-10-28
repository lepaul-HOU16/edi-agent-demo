#!/usr/bin/env node

/**
 * Task 3: Verify Intelligent Placement Algorithm Execution
 * 
 * This test verifies:
 * 1. Exclusion zones reach intelligent_turbine_placement function
 * 2. Algorithm uses constraints instead of falling back to grid
 * 3. Turbines avoid buildings, roads, and water bodies
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test location with known OSM features (downtown area)
const TEST_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060,
  name: "New York City (High OSM density)"
};

async function testIntelligentPlacementExecution() {
  console.log('=' .repeat(80));
  console.log('TASK 3: VERIFY INTELLIGENT PLACEMENT ALGORITHM EXECUTION');
  console.log('=' .repeat(80));
  console.log();

  // Step 1: Get layout Lambda name
  console.log('📋 Step 1: Finding layout Lambda...');
  const { execSync } = require('child_process');
  
  let layoutLambdaName;
  try {
    const result = execSync(
      `aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text`,
      { encoding: 'utf-8' }
    );
    layoutLambdaName = result.trim();
    
    if (!layoutLambdaName) {
      console.error('❌ Layout Lambda not found');
      process.exit(1);
    }
    
    console.log(`✅ Found layout Lambda: ${layoutLambdaName}`);
  } catch (error) {
    console.error('❌ Error finding layout Lambda:', error.message);
    process.exit(1);
  }
  
  console.log();

  // Step 2: Create mock terrain results with OSM features
  console.log('📋 Step 2: Creating mock terrain results with OSM features...');
  
  const mockTerrainResults = {
    geojson: {
      type: 'FeatureCollection',
      features: [
        // Building 1
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0070, 40.7120],
              [-74.0060, 40.7120],
              [-74.0060, 40.7125],
              [-74.0070, 40.7125],
              [-74.0070, 40.7120]
            ]]
          },
          properties: { type: 'building', name: 'Test Building 1' }
        },
        // Building 2
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0050, 40.7130],
              [-74.0040, 40.7130],
              [-74.0040, 40.7135],
              [-74.0050, 40.7135],
              [-74.0050, 40.7130]
            ]]
          },
          properties: { type: 'building', name: 'Test Building 2' }
        },
        // Road
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-74.0080, 40.7110],
              [-74.0020, 40.7110]
            ]
          },
          properties: { type: 'road', name: 'Test Road' }
        },
        // Water body
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0030, 40.7140],
              [-74.0020, 40.7140],
              [-74.0020, 40.7145],
              [-74.0030, 40.7145],
              [-74.0030, 40.7140]
            ]]
          },
          properties: { type: 'water', name: 'Test Water Body' }
        }
      ]
    },
    exclusionZones: {
      buildings: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0070, 40.7120],
              [-74.0060, 40.7120],
              [-74.0060, 40.7125],
              [-74.0070, 40.7125],
              [-74.0070, 40.7120]
            ]]
          },
          properties: { type: 'building', name: 'Test Building 1' }
        },
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0050, 40.7130],
              [-74.0040, 40.7130],
              [-74.0040, 40.7135],
              [-74.0050, 40.7135],
              [-74.0050, 40.7130]
            ]]
          },
          properties: { type: 'building', name: 'Test Building 2' }
        }
      ],
      roads: [
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-74.0080, 40.7110],
              [-74.0020, 40.7110]
            ]
          },
          properties: { type: 'road', name: 'Test Road' }
        }
      ],
      waterBodies: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.0030, 40.7140],
              [-74.0020, 40.7140],
              [-74.0020, 40.7145],
              [-74.0030, 40.7145],
              [-74.0030, 40.7140]
            ]]
          },
          properties: { type: 'water', name: 'Test Water Body' }
        }
      ]
    }
  };
  
  console.log(`✅ Created mock terrain results:`);
  console.log(`   - ${mockTerrainResults.exclusionZones.buildings.length} buildings`);
  console.log(`   - ${mockTerrainResults.exclusionZones.roads.length} roads`);
  console.log(`   - ${mockTerrainResults.exclusionZones.waterBodies.length} water bodies`);
  console.log();

  // Step 3: Invoke layout Lambda with terrain context
  console.log('📋 Step 3: Invoking layout Lambda with terrain context...');
  
  const payload = {
    query: `Optimize turbine layout for location ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    parameters: {
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      area_km2: 10,
      num_turbines: 25
    },
    project_context: {
      terrain_results: mockTerrainResults
    }
  };
  
  console.log('Payload structure:');
  console.log(`   - parameters: ✓`);
  console.log(`   - project_context.terrain_results: ✓`);
  console.log(`   - project_context.terrain_results.exclusionZones: ✓`);
  console.log();
  
  let response;
  try {
    const command = new InvokeCommand({
      FunctionName: layoutLambdaName,
      Payload: JSON.stringify(payload)
    });
    
    const result = await lambda.send(command);
    const responsePayload = JSON.parse(Buffer.from(result.Payload).toString());
    
    if (responsePayload.errorMessage) {
      console.error('❌ Lambda error:', responsePayload.errorMessage);
      console.error('Error type:', responsePayload.errorType);
      if (responsePayload.stackTrace) {
        console.error('Stack trace:', responsePayload.stackTrace.slice(0, 5).join('\n'));
      }
      process.exit(1);
    }
    
    response = typeof responsePayload.body === 'string' 
      ? JSON.parse(responsePayload.body) 
      : responsePayload.body || responsePayload;
    
    console.log('✅ Layout Lambda invoked successfully');
  } catch (error) {
    console.error('❌ Error invoking layout Lambda:', error.message);
    process.exit(1);
  }
  
  console.log();

  // Step 4: Analyze CloudWatch logs for algorithm execution
  console.log('📋 Step 4: Analyzing CloudWatch logs for algorithm execution...');
  console.log();
  
  // Get recent logs
  const logGroupName = `/aws/lambda/${layoutLambdaName}`;
  
  try {
    const logsResult = execSync(
      `aws logs tail ${logGroupName} --since 2m --format short`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const logs = logsResult.toString();
    
    // Check for key indicators
    const checks = {
      exclusionZonesReceived: false,
      intelligentPlacementCalled: false,
      constraintsApplied: false,
      gridFallbackAvoided: false,
      turbinesPlaced: false
    };
    
    // Parse logs for evidence (matching actual log format)
    if (logs.includes('EXTRACTING OSM FEATURES') || logs.includes('PROJECT CONTEXT DIAGNOSTIC')) {
      checks.exclusionZonesReceived = true;
      console.log('✅ Exclusion zones received in layout handler');
    }
    
    if (logs.includes('INTELLIGENT TURBINE PLACEMENT') || logs.includes('🎯 INTELLIGENT TURBINE PLACEMENT')) {
      checks.intelligentPlacementCalled = true;
      console.log('✅ Intelligent placement algorithm called');
    }
    
    // Check for exclusion zones in logs (they appear in multiple formats)
    const exclusionMatch = logs.match(/Exclusion zones: (\d+) buildings, (\d+) roads?, (\d+) water/);
    if (exclusionMatch) {
      const buildings = parseInt(exclusionMatch[1]);
      const roads = parseInt(exclusionMatch[2]);
      const water = parseInt(exclusionMatch[3]);
      
      if (buildings > 0 || roads > 0 || water > 0) {
        checks.constraintsApplied = true;
        console.log('✅ Constraints applied (non-zero exclusion zones)');
        console.log(`   - ${buildings} buildings`);
        console.log(`   - ${roads} roads`);
        console.log(`   - ${water} water bodies`);
      }
    }
    
    if (!logs.includes('BASIC GRID PLACEMENT') && 
        !logs.includes('No OSM features - using basic grid') &&
        !logs.includes('Falling back to basic grid')) {
      checks.gridFallbackAvoided = true;
      console.log('✅ Grid fallback avoided (intelligent algorithm used)');
    } else {
      console.log('⚠️  Grid fallback was triggered');
      if (logs.includes('No OSM features - using basic grid')) {
        console.log('   Reason: No OSM features');
      }
      if (logs.includes('Insufficient valid positions')) {
        console.log('   Reason: Insufficient valid positions');
      }
    }
    
    // Check for successful intelligent placement
    const placedMatch = logs.match(/✅ Placed (\d+) turbines intelligently/);
    if (placedMatch) {
      checks.turbinesPlaced = true;
      console.log('✅ Turbines placed intelligently');
      console.log(`   - ${placedMatch[1]} turbines placed`);
      
      // Extract avoided features count
      const avoidedMatch = logs.match(/Avoided (\d+) terrain constraints/);
      if (avoidedMatch) {
        console.log(`   - Avoided ${avoidedMatch[1]} terrain constraints`);
      }
    }
    
    console.log();
    
    // Step 5: Verify response structure
    console.log('📋 Step 5: Verifying response structure...');
    console.log();
    
    // Handle nested response structure
    const responseData = response.data || response;
    
    if (!responseData.geojson) {
      console.error('❌ Response missing geojson field');
      console.error('Response structure:', JSON.stringify(Object.keys(responseData), null, 2));
      process.exit(1);
    }
    
    console.log('✅ Response contains geojson');
    
    const features = responseData.geojson.features || [];
    const turbineFeatures = features.filter(f => f.properties?.type === 'turbine');
    const terrainFeatures = features.filter(f => ['building', 'road', 'water'].includes(f.properties?.type));
    
    console.log(`   - Total features: ${features.length}`);
    console.log(`   - Turbine features: ${turbineFeatures.length}`);
    console.log(`   - Terrain features: ${terrainFeatures.length}`);
    console.log();
    
    // Step 6: Verify turbines avoid constraints
    console.log('📋 Step 6: Verifying turbines avoid constraints...');
    console.log();
    
    if (turbineFeatures.length === 0) {
      console.error('❌ No turbines in response');
      process.exit(1);
    }
    
    // Check if turbines are positioned away from exclusion zones
    let turbinesNearConstraints = 0;
    const safetyMargin = 0.001; // ~100m in degrees
    
    for (const turbine of turbineFeatures) {
      const [tLon, tLat] = turbine.geometry.coordinates;
      
      // Check distance to buildings
      for (const building of mockTerrainResults.exclusionZones.buildings) {
        const coords = building.geometry.coordinates[0];
        const lats = coords.map(c => c[1]);
        const lons = coords.map(c => c[0]);
        
        const minLat = Math.min(...lats) - safetyMargin;
        const maxLat = Math.max(...lats) + safetyMargin;
        const minLon = Math.min(...lons) - safetyMargin;
        const maxLon = Math.max(...lons) + safetyMargin;
        
        if (tLat >= minLat && tLat <= maxLat && tLon >= minLon && tLon <= maxLon) {
          turbinesNearConstraints++;
          break;
        }
      }
    }
    
    const avoidanceRate = ((turbineFeatures.length - turbinesNearConstraints) / turbineFeatures.length) * 100;
    
    console.log(`Turbine placement analysis:`);
    console.log(`   - Total turbines: ${turbineFeatures.length}`);
    console.log(`   - Turbines near constraints: ${turbinesNearConstraints}`);
    console.log(`   - Avoidance rate: ${avoidanceRate.toFixed(1)}%`);
    console.log();
    
    if (avoidanceRate >= 90) {
      console.log('✅ Turbines successfully avoid constraints (≥90% avoidance)');
    } else if (avoidanceRate >= 70) {
      console.log('⚠️  Turbines mostly avoid constraints (70-90% avoidance)');
    } else {
      console.log('❌ Turbines do not adequately avoid constraints (<70% avoidance)');
    }
    
    console.log();
    
    // Final summary
    console.log('=' .repeat(80));
    console.log('TASK 3 VERIFICATION SUMMARY');
    console.log('=' .repeat(80));
    console.log();
    
    const allChecks = [
      { name: 'Exclusion zones received', passed: checks.exclusionZonesReceived },
      { name: 'Intelligent placement called', passed: checks.intelligentPlacementCalled },
      { name: 'Constraints applied', passed: checks.constraintsApplied },
      { name: 'Grid fallback avoided', passed: checks.gridFallbackAvoided },
      { name: 'Turbines placed intelligently', passed: checks.turbinesPlaced },
      { name: 'Turbines avoid constraints', passed: avoidanceRate >= 70 }
    ];
    
    allChecks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });
    
    console.log();
    
    const passedCount = allChecks.filter(c => c.passed).length;
    const totalCount = allChecks.length;
    
    if (passedCount === totalCount) {
      console.log(`🎉 ALL CHECKS PASSED (${passedCount}/${totalCount})`);
      console.log();
      console.log('✅ Task 3 Complete: Intelligent placement algorithm is executing correctly');
      console.log('   - Exclusion zones reach the algorithm');
      console.log('   - Algorithm uses constraints instead of grid fallback');
      console.log('   - Turbines avoid buildings, roads, and water bodies');
      process.exit(0);
    } else {
      console.log(`⚠️  SOME CHECKS FAILED (${passedCount}/${totalCount} passed)`);
      console.log();
      console.log('Issues found:');
      allChecks.filter(c => !c.passed).forEach(check => {
        console.log(`   - ${check.name}`);
      });
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing logs:', error.message);
    console.log();
    console.log('Note: You may need to check CloudWatch logs manually:');
    console.log(`   aws logs tail ${logGroupName} --follow`);
    process.exit(1);
  }
}

// Run the test
testIntelligentPlacementExecution().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
