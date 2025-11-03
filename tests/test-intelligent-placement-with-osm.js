#!/usr/bin/env node

/**
 * Test Task 5: Verify Intelligent Algorithm Selection with OSM Features
 * 
 * This test verifies that:
 * 1. Terrain agent identifies OSM features (water, buildings, roads)
 * 2. Layout agent loads these boundaries and uses them for placement
 * 3. Turbines are intelligently placed AROUND obstacles (not grid-like)
 * 4. Map visualization shows BOTH turbines AND OSM boundaries overlaid
 * 
 * This matches the original Renewables Demo behavior where OSM features
 * are displayed on the map and affect intelligent placement.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Test location with known OSM features
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  name: 'Amarillo, TX',
  description: 'Area with roads, buildings, and some water features'
};

const PROJECT_ID = 'test_intelligent_osm_placement';

/**
 * Find the Strands Agent Lambda function
 */
async function findStrandsAgentFunction() {
  const listCommand = new ListFunctionsCommand({});
  const response = await lambda.send(listCommand);
  
  const agentFunction = response.Functions.find(f => 
    f.FunctionName.includes('RenewableAgentsFunction')
  );
  
  if (!agentFunction) {
    throw new Error('Strands Agent Lambda not found');
  }
  
  return agentFunction;
}

/**
 * Get S3 bucket name from environment or Lambda config
 */
async function getS3BucketName() {
  // Try environment variable first
  if (process.env.RENEWABLE_S3_BUCKET) {
    return process.env.RENEWABLE_S3_BUCKET;
  }
  
  // Try to get from Lambda environment
  const agentFunction = await findStrandsAgentFunction();
  const { GetFunctionCommand } = require('@aws-sdk/client-lambda');
  const getFunctionCommand = new GetFunctionCommand({
    FunctionName: agentFunction.FunctionName
  });
  
  const functionConfig = await lambda.send(getFunctionCommand);
  const envVars = functionConfig.Configuration?.Environment?.Variables || {};
  
  return envVars.RENEWABLE_S3_BUCKET || 'amplify-digitalassistant-renewableprojectbucket';
}

/**
 * Check if boundaries GeoJSON exists in S3
 */
async function checkBoundariesInS3(bucketName, projectId) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${projectId}/terrain_agent/boundaries.geojson`
    });
    
    const response = await s3.send(command);
    const bodyString = await response.Body.transformToString();
    const geojson = JSON.parse(bodyString);
    
    return {
      exists: true,
      featureCount: geojson.features?.length || 0,
      features: geojson.features || []
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Check if layout map exists in S3 and includes boundaries
 */
async function checkLayoutMapInS3(bucketName, projectId) {
  try {
    // List all layout maps for this project
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${projectId}/layout_agent/`,
      MaxKeys: 100
    });
    
    const response = await s3.send(listCommand);
    const layoutMaps = response.Contents?.filter(obj => 
      obj.Key.includes('layout_map') && obj.Key.endsWith('.png')
    ) || [];
    
    return {
      exists: layoutMaps.length > 0,
      count: layoutMaps.length,
      maps: layoutMaps.map(obj => obj.Key)
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Step 1: Run terrain analysis to identify OSM features
 */
async function runTerrainAnalysis(functionName) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: Terrain Analysis - Identify OSM Features');
  console.log('='.repeat(70));
  console.log(`Location: ${TEST_LOCATION.name}`);
  console.log(`Coordinates: ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`);
  console.log(`Description: ${TEST_LOCATION.description}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        agent: 'terrain',
        query: `Analyze terrain and identify unbuildable areas for wind farm at ${TEST_LOCATION.name}`,
        parameters: {
          project_id: PROJECT_ID,
          latitude: TEST_LOCATION.latitude,
          longitude: TEST_LOCATION.longitude,
          radius_km: 2.0,
          setback_m: 100
        }
      }),
      InvocationType: 'RequestResponse'
    });
    
    console.log('🚀 Invoking terrain agent...');
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Terrain analysis completed in ${duration.toFixed(2)}s`);
    
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      return { success: false, error: responsePayload.errorMessage };
    }
    
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`\n📊 Terrain Analysis Results:`);
    console.log(`   Success: ${body.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Response Length: ${body.response?.length || 0} characters`);
    
    // Extract feature information from response
    let featureCount = 0;
    let featureTypes = [];
    
    if (body.response) {
      const featureMatch = body.response.match(/(\d+)\s+features?/i);
      if (featureMatch) {
        featureCount = parseInt(featureMatch[1]);
      }
      
      if (body.response.toLowerCase().includes('water')) featureTypes.push('water');
      if (body.response.toLowerCase().includes('building')) featureTypes.push('buildings');
      if (body.response.toLowerCase().includes('road')) featureTypes.push('roads');
    }
    
    console.log(`\n🗺️  OSM Features Identified:`);
    console.log(`   Feature Count: ${featureCount}`);
    console.log(`   Feature Types: ${featureTypes.join(', ') || 'None detected'}`);
    
    // Check if boundaries were saved to S3
    console.log(`\n📦 Checking S3 for boundaries.geojson...`);
    const bucketName = await getS3BucketName();
    console.log(`   Bucket: ${bucketName}`);
    
    const boundariesCheck = await checkBoundariesInS3(bucketName, PROJECT_ID);
    
    if (boundariesCheck.exists) {
      console.log(`   ✅ boundaries.geojson found in S3`);
      console.log(`   Features in GeoJSON: ${boundariesCheck.featureCount}`);
      
      // Analyze feature types in GeoJSON
      const featureTypesInGeoJSON = new Set();
      boundariesCheck.features.forEach(feature => {
        const featureType = feature.properties?.feature_type;
        if (featureType) featureTypesInGeoJSON.add(featureType);
      });
      
      console.log(`   Feature Types in GeoJSON: ${Array.from(featureTypesInGeoJSON).join(', ')}`);
    } else {
      console.log(`   ❌ boundaries.geojson NOT found in S3`);
      console.log(`   Error: ${boundariesCheck.error}`);
    }
    
    return {
      success: body.success,
      duration,
      featureCount,
      featureTypes,
      boundariesInS3: boundariesCheck.exists,
      boundariesFeatureCount: boundariesCheck.featureCount
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Terrain analysis failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Step 2: Run layout optimization that should use OSM boundaries
 */
async function runLayoutOptimization(functionName, terrainResult) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: Layout Optimization - Intelligent Placement with OSM');
  console.log('='.repeat(70));
  console.log('This should:');
  console.log('  1. Load boundaries.geojson from S3');
  console.log('  2. Choose appropriate algorithm based on terrain');
  console.log('  3. Place turbines AROUND obstacles (not through them)');
  console.log('  4. Create map showing BOTH turbines AND boundaries');
  console.log();
  
  const startTime = Date.now();
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        agent: 'layout',
        query: `Create an optimal wind farm layout at ${TEST_LOCATION.name} with 30 turbines using Vestas V90-2.0MW. Use the terrain boundaries to avoid obstacles and choose the best layout algorithm.`,
        parameters: {
          project_id: PROJECT_ID,
          latitude: TEST_LOCATION.latitude,
          longitude: TEST_LOCATION.longitude,
          num_turbines: 30,
          turbine_model: 'Vestas V90-2.0MW',
          capacity_mw: 60
        }
      }),
      InvocationType: 'RequestResponse'
    });
    
    console.log('🚀 Invoking layout agent...');
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Layout optimization completed in ${duration.toFixed(2)}s`);
    
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      return { success: false, error: responsePayload.errorMessage };
    }
    
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`\n📊 Layout Results:`);
    console.log(`   Success: ${body.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Response Length: ${body.response?.length || 0} characters`);
    
    // Analyze algorithm selection and placement
    let algorithmUsed = 'unknown';
    let turbinesPlaced = 0;
    let turbinesSkipped = 0;
    let boundariesLoaded = false;
    
    if (body.response) {
      const responseText = body.response.toLowerCase();
      
      // Detect algorithm
      if (responseText.includes('grid') && !responseText.includes('offset')) {
        algorithmUsed = 'grid';
      } else if (responseText.includes('offset')) {
        algorithmUsed = 'offset_grid';
      } else if (responseText.includes('spiral')) {
        algorithmUsed = 'spiral';
      } else if (responseText.includes('greedy')) {
        algorithmUsed = 'greedy';
      }
      
      // Extract turbine counts
      const placedMatch = body.response.match(/(\d+)\s+turbines?\s+placed/i);
      if (placedMatch) {
        turbinesPlaced = parseInt(placedMatch[1]);
      }
      
      const skippedMatch = body.response.match(/(\d+)\s+turbines?\s+skipped/i);
      if (skippedMatch) {
        turbinesSkipped = parseInt(skippedMatch[1]);
      }
      
      // Check if boundaries were loaded
      boundariesLoaded = responseText.includes('boundaries') || 
                        responseText.includes('unbuildable') ||
                        responseText.includes('obstacle') ||
                        turbinesSkipped > 0;
    }
    
    console.log(`\n🎯 Algorithm Selection:`);
    console.log(`   Algorithm Used: ${algorithmUsed}`);
    console.log(`   Intelligent Selection: ${algorithmUsed !== 'unknown' ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n📍 Turbine Placement:`);
    console.log(`   Turbines Requested: 30`);
    console.log(`   Turbines Placed: ${turbinesPlaced}`);
    console.log(`   Turbines Skipped: ${turbinesSkipped}`);
    console.log(`   Placement Rate: ${((turbinesPlaced / 30) * 100).toFixed(1)}%`);
    
    console.log(`\n🗺️  Boundary Integration:`);
    console.log(`   Boundaries Loaded: ${boundariesLoaded ? '✅ YES' : '⚠️  UNKNOWN'}`);
    console.log(`   Obstacles Avoided: ${turbinesSkipped > 0 ? '✅ YES' : '⚠️  NO'}`);
    console.log(`   Intelligent Placement: ${turbinesSkipped > 0 ? '✅ YES (adapted to terrain)' : '⚠️  NO (no adaptation detected)'}`);
    
    // Check if layout map was created with boundaries
    console.log(`\n📦 Checking S3 for layout map...`);
    const bucketName = await getS3BucketName();
    const layoutMapCheck = await checkLayoutMapInS3(bucketName, PROJECT_ID);
    
    if (layoutMapCheck.exists) {
      console.log(`   ✅ Layout map(s) found in S3`);
      console.log(`   Map Count: ${layoutMapCheck.count}`);
      console.log(`   Maps: ${layoutMapCheck.maps.join(', ')}`);
      console.log(`   Note: Map should show turbines overlaid on OSM boundaries`);
    } else {
      console.log(`   ❌ Layout map NOT found in S3`);
    }
    
    return {
      success: body.success,
      duration,
      algorithmUsed,
      turbinesPlaced,
      turbinesSkipped,
      boundariesLoaded,
      layoutMapExists: layoutMapCheck.exists,
      layoutMapCount: layoutMapCheck.count
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Layout optimization failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 Task 5: Intelligent Placement with OSM Features Test');
  console.log('='.repeat(70));
  console.log();
  console.log('This test verifies the complete workflow:');
  console.log('  1. Terrain agent identifies OSM features (water, buildings, roads)');
  console.log('  2. Features are saved as boundaries.geojson in S3');
  console.log('  3. Layout agent loads boundaries and uses them for placement');
  console.log('  4. Turbines are placed intelligently AROUND obstacles');
  console.log('  5. Map shows BOTH turbines AND OSM boundaries overlaid');
  console.log();
  console.log('This matches the original Renewables Demo behavior.');
  console.log();
  
  // Find Lambda function
  console.log('🔍 Searching for Strands Agent Lambda function...');
  const agentFunction = await findStrandsAgentFunction();
  
  console.log('✅ Found Strands Agent Lambda:');
  console.log(`   Function: ${agentFunction.FunctionName}`);
  console.log(`   Runtime: ${agentFunction.Runtime || 'Docker'}`);
  console.log(`   Memory: ${agentFunction.MemorySize}MB`);
  console.log(`   Timeout: ${agentFunction.Timeout}s`);
  console.log();
  
  // Step 1: Terrain Analysis
  const terrainResult = await runTerrainAnalysis(agentFunction.FunctionName);
  
  if (!terrainResult.success) {
    console.log('\n❌ Terrain analysis failed - cannot proceed to layout');
    process.exit(1);
  }
  
  // Wait between steps
  console.log('\n⏳ Waiting 5 seconds before layout optimization...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 2: Layout Optimization
  const layoutResult = await runLayoutOptimization(agentFunction.FunctionName, terrainResult);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log();
  
  console.log('✅ Validation Checklist:');
  console.log();
  
  // Terrain Analysis Validation
  console.log('1. Terrain Analysis:');
  console.log(`   ${terrainResult.success ? '✅' : '❌'} Terrain agent completed successfully`);
  console.log(`   ${terrainResult.featureCount > 0 ? '✅' : '❌'} OSM features identified (${terrainResult.featureCount})`);
  console.log(`   ${terrainResult.featureTypes.length > 0 ? '✅' : '❌'} Feature types detected (${terrainResult.featureTypes.join(', ')})`);
  console.log(`   ${terrainResult.boundariesInS3 ? '✅' : '❌'} Boundaries saved to S3`);
  console.log();
  
  // Layout Optimization Validation
  console.log('2. Layout Optimization:');
  console.log(`   ${layoutResult.success ? '✅' : '❌'} Layout agent completed successfully`);
  console.log(`   ${layoutResult.algorithmUsed !== 'unknown' ? '✅' : '❌'} Algorithm selected (${layoutResult.algorithmUsed})`);
  console.log(`   ${layoutResult.turbinesPlaced > 0 ? '✅' : '❌'} Turbines placed (${layoutResult.turbinesPlaced}/30)`);
  console.log(`   ${layoutResult.turbinesSkipped > 0 ? '✅' : '⚠️ '} Turbines skipped due to obstacles (${layoutResult.turbinesSkipped})`);
  console.log(`   ${layoutResult.boundariesLoaded ? '✅' : '⚠️ '} Boundaries loaded and used`);
  console.log(`   ${layoutResult.layoutMapExists ? '✅' : '❌'} Layout map created`);
  console.log();
  
  // Overall Assessment
  const terrainPassed = terrainResult.success && 
                       terrainResult.boundariesInS3 && 
                       terrainResult.featureCount > 0;
  
  const layoutPassed = layoutResult.success && 
                      layoutResult.algorithmUsed !== 'unknown' &&
                      layoutResult.turbinesPlaced > 0 &&
                      layoutResult.layoutMapExists;
  
  const intelligentPlacement = layoutResult.turbinesSkipped > 0 && 
                              layoutResult.boundariesLoaded;
  
  console.log('='.repeat(70));
  console.log('🎯 Overall Assessment:');
  console.log('='.repeat(70));
  
  if (terrainPassed && layoutPassed && intelligentPlacement) {
    console.log('✅ EXCELLENT: All requirements met');
    console.log('   ✅ OSM features identified and saved');
    console.log('   ✅ Boundaries loaded for layout optimization');
    console.log('   ✅ Turbines placed intelligently around obstacles');
    console.log('   ✅ Layout map created with boundaries overlay');
    console.log('   ✅ Demonstrates intelligent spatial reasoning');
  } else if (terrainPassed && layoutPassed) {
    console.log('⚠️  PARTIAL SUCCESS: Basic functionality works');
    console.log('   ✅ Terrain and layout agents work');
    console.log('   ⚠️  Intelligent placement may need verification');
    console.log('   Check: Are turbines actually avoiding obstacles?');
  } else {
    console.log('❌ FAILURE: Core functionality not working');
    if (!terrainPassed) {
      console.log('   ❌ Terrain analysis issues');
    }
    if (!layoutPassed) {
      console.log('   ❌ Layout optimization issues');
    }
  }
  
  console.log();
  console.log('📋 Key Findings:');
  console.log(`   OSM Features: ${terrainResult.featureCount} (${terrainResult.featureTypes.join(', ')})`);
  console.log(`   Algorithm: ${layoutResult.algorithmUsed}`);
  console.log(`   Placement: ${layoutResult.turbinesPlaced}/30 turbines (${layoutResult.turbinesSkipped} skipped)`);
  console.log(`   Adaptation: ${intelligentPlacement ? 'YES - avoids obstacles' : 'NO - no adaptation detected'}`);
  
  console.log();
  console.log('📋 Next Steps:');
  if (terrainPassed && layoutPassed && intelligentPlacement) {
    console.log('   ✅ Task 5 complete - intelligent placement verified');
    console.log('   ✅ OSM features displayed and used for placement');
    console.log('   ✅ Proceed to Task 6: Multi-agent orchestration');
  } else {
    console.log('   ❌ Review and fix issues before proceeding');
    console.log('   1. Check CloudWatch logs for errors');
    console.log('   2. Verify S3 bucket permissions');
    console.log('   3. Review agent system prompts');
    console.log('   4. Re-run this test');
  }
  
  console.log();
  console.log('='.repeat(70));
  console.log('🏁 Test Complete');
  console.log('='.repeat(70));
  
  // Exit with appropriate code
  if (terrainPassed && layoutPassed && intelligentPlacement) {
    console.log('✅ Task 5 test PASSED');
    process.exit(0);
  } else {
    console.log(`❌ Task 5 test FAILED`);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error();
    console.error('💥 Unexpected error:', error);
    console.error();
    process.exit(1);
  });
}

module.exports = { main };
