/**
 * Test Feature Count Restoration
 * 
 * This script tests that terrain analysis returns all features (not limited to 60)
 * and verifies the orchestrator passes correct parameters to the terrain Lambda.
 * 
 * Task 15: Test feature count restoration
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test location with known high feature count (Texas Panhandle)
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 5,
  name: 'Texas Panhandle Test Site'
};

// Expected minimum feature count (should be > 60 if working correctly)
const EXPECTED_MIN_FEATURES = 100;
const BROKEN_FEATURE_LIMIT = 60;

async function testFeatureCountRestoration() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 FEATURE COUNT RESTORATION TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Test Location: ${TEST_LOCATION.name}`);
  console.log(`🌍 Coordinates: ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`);
  console.log(`📏 Radius: ${TEST_LOCATION.radius_km}km`);
  console.log(`🎯 Expected: >${EXPECTED_MIN_FEATURES} features`);
  console.log(`❌ Broken Limit: ${BROKEN_FEATURE_LIMIT} features`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    orchestratorTest: null,
    directTerrainTest: null,
    parameterValidation: null,
    featureCountComparison: null
  };

  try {
    // Test 1: Query through orchestrator
    console.log('📋 Test 1: Query through Orchestrator');
    console.log('─────────────────────────────────────────────────────────');
    results.orchestratorTest = await testThroughOrchestrator();
    
    // Test 2: Query terrain Lambda directly
    console.log('\n📋 Test 2: Query Terrain Lambda Directly');
    console.log('─────────────────────────────────────────────────────────');
    results.directTerrainTest = await testTerrainDirect();
    
    // Test 3: Validate parameter passing
    console.log('\n📋 Test 3: Validate Parameter Passing');
    console.log('─────────────────────────────────────────────────────────');
    results.parameterValidation = validateParameterPassing(
      results.orchestratorTest,
      results.directTerrainTest
    );
    
    // Test 4: Compare feature counts
    console.log('\n📋 Test 4: Feature Count Comparison');
    console.log('─────────────────────────────────────────────────────────');
    results.featureCountComparison = compareFeatureCounts(
      results.orchestratorTest,
      results.directTerrainTest
    );
    
    // Generate final report
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 FINAL TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    generateFinalReport(results);
    
    // Determine overall pass/fail
    const allTestsPassed = 
      results.orchestratorTest?.passed &&
      results.directTerrainTest?.passed &&
      results.parameterValidation?.passed &&
      results.featureCountComparison?.passed;
    
    if (allTestsPassed) {
      console.log('\n✅ ALL TESTS PASSED - Feature count restoration verified!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED - Feature count restoration needs attention');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

async function testThroughOrchestrator() {
  const startTime = Date.now();
  
  try {
    const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 
      'amplify-nextjsamplifyge-renewableOrchestrator-';
    
    console.log(`🎯 Invoking orchestrator: ${orchestratorFunctionName}`);
    
    const query = `Analyze terrain at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} within ${TEST_LOCATION.radius_km}km radius`;
    
    const payload = {
      query,
      context: {
        test: true,
        expectedFeatures: EXPECTED_MIN_FEATURES
      }
    };
    
    console.log(`📤 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const command = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Success: ${responsePayload.success}`);
    
    // Extract feature count from response
    let featureCount = 0;
    let projectId = null;
    let radiusKm = null;
    
    if (responsePayload.artifacts && responsePayload.artifacts.length > 0) {
      const terrainArtifact = responsePayload.artifacts.find(a => 
        a.type === 'terrain_analysis' || a.data?.messageContentType === 'wind_farm_terrain_analysis'
      );
      
      if (terrainArtifact) {
        featureCount = terrainArtifact.data?.metrics?.totalFeatures || 
                      terrainArtifact.data?.featureCount || 0;
        projectId = terrainArtifact.data?.projectId;
        radiusKm = terrainArtifact.data?.metrics?.radiusKm;
        
        console.log(`📊 Feature Count: ${featureCount}`);
        console.log(`🆔 Project ID: ${projectId}`);
        console.log(`📏 Radius: ${radiusKm}km`);
      }
    }
    
    // Check if feature count meets expectations
    const passed = featureCount >= EXPECTED_MIN_FEATURES;
    const isLimited = featureCount === BROKEN_FEATURE_LIMIT;
    
    if (passed) {
      console.log(`✅ PASS: Feature count (${featureCount}) exceeds minimum (${EXPECTED_MIN_FEATURES})`);
    } else if (isLimited) {
      console.log(`❌ FAIL: Feature count limited to ${BROKEN_FEATURE_LIMIT} (artificial limit detected)`);
    } else {
      console.log(`⚠️  WARNING: Feature count (${featureCount}) below expected (${EXPECTED_MIN_FEATURES})`);
    }
    
    return {
      passed,
      featureCount,
      projectId,
      radiusKm,
      duration,
      isLimited,
      response: responsePayload
    };
    
  } catch (error) {
    console.error(`❌ Orchestrator test failed: ${error.message}`);
    return {
      passed: false,
      error: error.message,
      featureCount: 0
    };
  }
}

async function testTerrainDirect() {
  const startTime = Date.now();
  
  try {
    const terrainFunctionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 
      'amplify-nextjsamplifyge-renewableToolsTerrain-';
    
    console.log(`🎯 Invoking terrain Lambda directly: ${terrainFunctionName}`);
    
    const payload = {
      query: `Analyze terrain at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
      parameters: {
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        radius_km: TEST_LOCATION.radius_km,
        project_id: `direct-test-${Date.now()}`
      }
    };
    
    console.log(`📤 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const command = new InvokeCommand({
      FunctionName: terrainFunctionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Success: ${responsePayload.success}`);
    
    // Extract feature count from direct response
    let featureCount = 0;
    let projectId = null;
    let radiusKm = null;
    
    if (responsePayload.data) {
      featureCount = responsePayload.data.metrics?.totalFeatures || 
                    responsePayload.data.featureCount || 0;
      projectId = responsePayload.data.projectId;
      radiusKm = responsePayload.data.metrics?.radiusKm;
      
      console.log(`📊 Feature Count: ${featureCount}`);
      console.log(`🆔 Project ID: ${projectId}`);
      console.log(`📏 Radius: ${radiusKm}km`);
    }
    
    // Check if feature count meets expectations
    const passed = featureCount >= EXPECTED_MIN_FEATURES;
    const isLimited = featureCount === BROKEN_FEATURE_LIMIT;
    
    if (passed) {
      console.log(`✅ PASS: Feature count (${featureCount}) exceeds minimum (${EXPECTED_MIN_FEATURES})`);
    } else if (isLimited) {
      console.log(`❌ FAIL: Feature count limited to ${BROKEN_FEATURE_LIMIT} (artificial limit detected)`);
    } else {
      console.log(`⚠️  WARNING: Feature count (${featureCount}) below expected (${EXPECTED_MIN_FEATURES})`);
    }
    
    return {
      passed,
      featureCount,
      projectId,
      radiusKm,
      duration,
      isLimited,
      response: responsePayload
    };
    
  } catch (error) {
    console.error(`❌ Direct terrain test failed: ${error.message}`);
    return {
      passed: false,
      error: error.message,
      featureCount: 0
    };
  }
}

function validateParameterPassing(orchestratorResult, directResult) {
  console.log('🔍 Validating parameter passing from orchestrator to terrain Lambda');
  
  const issues = [];
  let passed = true;
  
  // Check if orchestrator passed radius correctly
  if (orchestratorResult.radiusKm !== TEST_LOCATION.radius_km) {
    issues.push(`Radius mismatch: orchestrator=${orchestratorResult.radiusKm}, expected=${TEST_LOCATION.radius_km}`);
    passed = false;
  } else {
    console.log(`✅ Radius parameter passed correctly: ${orchestratorResult.radiusKm}km`);
  }
  
  // Check if project ID was generated (not "default-project")
  if (!orchestratorResult.projectId || orchestratorResult.projectId === 'default-project') {
    issues.push(`Invalid project ID: ${orchestratorResult.projectId}`);
    passed = false;
  } else {
    console.log(`✅ Project ID generated correctly: ${orchestratorResult.projectId}`);
  }
  
  // Check if feature counts are similar (within 10% tolerance)
  if (orchestratorResult.featureCount > 0 && directResult.featureCount > 0) {
    const difference = Math.abs(orchestratorResult.featureCount - directResult.featureCount);
    const tolerance = Math.max(orchestratorResult.featureCount, directResult.featureCount) * 0.1;
    
    if (difference > tolerance) {
      issues.push(`Feature count mismatch: orchestrator=${orchestratorResult.featureCount}, direct=${directResult.featureCount}`);
      passed = false;
    } else {
      console.log(`✅ Feature counts are consistent (within 10% tolerance)`);
    }
  }
  
  if (passed) {
    console.log('✅ PASS: All parameters passed correctly');
  } else {
    console.log('❌ FAIL: Parameter passing issues detected');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return {
    passed,
    issues
  };
}

function compareFeatureCounts(orchestratorResult, directResult) {
  console.log('📊 Comparing feature counts between orchestrator and direct calls');
  
  const comparison = {
    orchestrator: orchestratorResult.featureCount,
    direct: directResult.featureCount,
    difference: Math.abs(orchestratorResult.featureCount - directResult.featureCount),
    percentDifference: 0
  };
  
  if (orchestratorResult.featureCount > 0 && directResult.featureCount > 0) {
    comparison.percentDifference = 
      (comparison.difference / Math.max(orchestratorResult.featureCount, directResult.featureCount)) * 100;
  }
  
  console.log(`📈 Orchestrator: ${comparison.orchestrator} features`);
  console.log(`📈 Direct: ${comparison.direct} features`);
  console.log(`📊 Difference: ${comparison.difference} features (${comparison.percentDifference.toFixed(1)}%)`);
  
  // Check for artificial limits
  const orchestratorLimited = orchestratorResult.isLimited;
  const directLimited = directResult.isLimited;
  
  if (orchestratorLimited || directLimited) {
    console.log('❌ FAIL: Artificial feature limit detected');
    if (orchestratorLimited) {
      console.log(`   - Orchestrator limited to ${BROKEN_FEATURE_LIMIT} features`);
    }
    if (directLimited) {
      console.log(`   - Direct call limited to ${BROKEN_FEATURE_LIMIT} features`);
    }
    
    return {
      passed: false,
      comparison,
      artificialLimitDetected: true
    };
  }
  
  // Check if both meet minimum expectations
  const bothMeetMinimum = 
    orchestratorResult.featureCount >= EXPECTED_MIN_FEATURES &&
    directResult.featureCount >= EXPECTED_MIN_FEATURES;
  
  if (bothMeetMinimum) {
    console.log(`✅ PASS: Both methods return >${EXPECTED_MIN_FEATURES} features`);
    return {
      passed: true,
      comparison,
      artificialLimitDetected: false
    };
  } else {
    console.log(`⚠️  WARNING: Feature counts below expected minimum`);
    return {
      passed: false,
      comparison,
      artificialLimitDetected: false,
      belowMinimum: true
    };
  }
}

function generateFinalReport(results) {
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                    TEST SUMMARY                         │');
  console.log('└─────────────────────────────────────────────────────────┘');
  
  // Test 1: Orchestrator
  console.log('\n1️⃣  Orchestrator Test:');
  if (results.orchestratorTest?.passed) {
    console.log(`   ✅ PASS - ${results.orchestratorTest.featureCount} features returned`);
  } else {
    console.log(`   ❌ FAIL - ${results.orchestratorTest?.featureCount || 0} features returned`);
    if (results.orchestratorTest?.isLimited) {
      console.log(`   ⚠️  Artificial limit detected (${BROKEN_FEATURE_LIMIT} features)`);
    }
  }
  
  // Test 2: Direct Terrain
  console.log('\n2️⃣  Direct Terrain Test:');
  if (results.directTerrainTest?.passed) {
    console.log(`   ✅ PASS - ${results.directTerrainTest.featureCount} features returned`);
  } else {
    console.log(`   ❌ FAIL - ${results.directTerrainTest?.featureCount || 0} features returned`);
    if (results.directTerrainTest?.isLimited) {
      console.log(`   ⚠️  Artificial limit detected (${BROKEN_FEATURE_LIMIT} features)`);
    }
  }
  
  // Test 3: Parameter Validation
  console.log('\n3️⃣  Parameter Validation:');
  if (results.parameterValidation?.passed) {
    console.log('   ✅ PASS - All parameters passed correctly');
  } else {
    console.log('   ❌ FAIL - Parameter passing issues detected');
    results.parameterValidation?.issues?.forEach(issue => {
      console.log(`      - ${issue}`);
    });
  }
  
  // Test 4: Feature Count Comparison
  console.log('\n4️⃣  Feature Count Comparison:');
  if (results.featureCountComparison?.passed) {
    console.log('   ✅ PASS - Feature counts are consistent and meet expectations');
  } else {
    console.log('   ❌ FAIL - Feature count issues detected');
    if (results.featureCountComparison?.artificialLimitDetected) {
      console.log('      - Artificial feature limit detected');
    }
    if (results.featureCountComparison?.belowMinimum) {
      console.log('      - Feature counts below expected minimum');
    }
  }
  
  // Overall assessment
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                 OVERALL ASSESSMENT                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
  
  const allPassed = 
    results.orchestratorTest?.passed &&
    results.directTerrainTest?.passed &&
    results.parameterValidation?.passed &&
    results.featureCountComparison?.passed;
  
  if (allPassed) {
    console.log('\n🎉 SUCCESS: Feature count restoration is working correctly!');
    console.log('   - No artificial limits detected');
    console.log('   - Parameters passed correctly');
    console.log('   - Feature counts meet expectations');
  } else {
    console.log('\n⚠️  ISSUES DETECTED: Feature count restoration needs attention');
    
    if (results.orchestratorTest?.isLimited || results.directTerrainTest?.isLimited) {
      console.log('\n🔍 ROOT CAUSE: Artificial feature limit detected');
      console.log('   Possible causes:');
      console.log('   1. OSM query has hardcoded limit in osm_client.py');
      console.log('   2. Terrain handler truncates results');
      console.log('   3. Orchestrator limits response size');
      console.log('\n💡 REMEDIATION:');
      console.log('   1. Check osm_client.py for query limits');
      console.log('   2. Review terrain/handler.py for result truncation');
      console.log('   3. Verify orchestrator response handling');
    }
    
    if (!results.parameterValidation?.passed) {
      console.log('\n🔍 PARAMETER ISSUES: Orchestrator not passing parameters correctly');
      console.log('   Check orchestrator handler.ts parameter extraction');
    }
  }
}

// Run the test
testFeatureCountRestoration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
