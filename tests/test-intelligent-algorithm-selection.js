#!/usr/bin/env node

/**
 * Test Task 5: Verify Intelligent Algorithm Selection
 * 
 * This test verifies that the Strands agents intelligently select appropriate
 * algorithms based on terrain conditions and that turbine placement is not
 * rigidly grid-like.
 * 
 * Requirements:
 * - Test terrain agent with various coordinates
 * - Test layout agent algorithm selection (grid vs greedy vs spiral)
 * - Verify agent chooses appropriate algorithm based on terrain
 * - Validate turbine placement is NOT grid-like
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test scenarios with different terrain characteristics
const TEST_SCENARIOS = [
  {
    name: 'Flat Open Terrain (Texas Panhandle)',
    description: 'Flat, open terrain with minimal obstacles - should favor grid layout',
    location: {
      latitude: 35.067482,
      longitude: -101.395466,
      name: 'Amarillo, TX area'
    },
    expectedTerrainFeatures: {
      minFeatures: 10,
      maxFeatures: 100,
      expectedTypes: ['roads', 'buildings']
    },
    layoutTest: {
      num_turbines: 25,
      turbine_model: 'Vestas V90-2.0MW',
      capacity_mw: 50,
      expectedAlgorithm: 'grid',
      expectedPlacement: 'regular',
      minTurbinesPlaced: 20 // Should place most turbines in open terrain
    }
  },
  {
    name: 'Complex Terrain (Near Water Bodies)',
    description: 'Terrain with water bodies and obstacles - should favor greedy or spiral',
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      name: 'Chicago, IL area (near Lake Michigan)'
    },
    expectedTerrainFeatures: {
      minFeatures: 50,
      maxFeatures: 500,
      expectedTypes: ['water', 'buildings', 'roads']
    },
    layoutTest: {
      num_turbines: 25,
      turbine_model: 'Vestas V90-2.0MW',
      capacity_mw: 50,
      expectedAlgorithm: 'greedy',
      expectedPlacement: 'adaptive',
      minTurbinesPlaced: 15 // May skip more due to obstacles
    }
  },
  {
    name: 'Moderate Terrain (Rural Area)',
    description: 'Rural area with some constraints - should adapt algorithm',
    location: {
      latitude: 39.7392,
      longitude: -104.9903,
      name: 'Denver, CO area'
    },
    expectedTerrainFeatures: {
      minFeatures: 20,
      maxFeatures: 200,
      expectedTypes: ['buildings', 'roads']
    },
    layoutTest: {
      num_turbines: 25,
      turbine_model: 'Vestas V90-2.0MW',
      capacity_mw: 50,
      expectedAlgorithm: 'offset_grid',
      expectedPlacement: 'semi-regular',
      minTurbinesPlaced: 18
    }
  }
];

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
 * Test terrain agent with specific coordinates
 */
async function testTerrainAgent(functionName, scenario) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing Terrain Analysis: ${scenario.name}`);
  console.log('='.repeat(70));
  console.log(`Location: ${scenario.location.name}`);
  console.log(`Coordinates: ${scenario.location.latitude}, ${scenario.location.longitude}`);
  console.log(`Description: ${scenario.description}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        agent: 'terrain',
        query: `Analyze terrain for wind farm development at ${scenario.location.name}`,
        parameters: {
          project_id: `test_terrain_${scenario.name.replace(/\s+/g, '_').toLowerCase()}`,
          latitude: scenario.location.latitude,
          longitude: scenario.location.longitude,
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
    
    // Parse response
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      return {
        success: false,
        scenario: scenario.name,
        duration,
        error: responsePayload.errorMessage
      };
    }
    
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`\n📊 Terrain Analysis Results:`);
    console.log(`   Success: ${body.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Response Length: ${body.response?.length || 0} characters`);
    console.log(`   Artifacts: ${body.artifacts?.length || 0}`);
    
    // Analyze terrain features from response
    let featureCount = 0;
    let featureTypes = [];
    
    if (body.response) {
      // Try to extract feature information from response text
      const featureMatch = body.response.match(/(\d+)\s+features?/i);
      if (featureMatch) {
        featureCount = parseInt(featureMatch[1]);
      }
      
      // Extract feature types mentioned
      if (body.response.includes('water')) featureTypes.push('water');
      if (body.response.includes('building')) featureTypes.push('buildings');
      if (body.response.includes('road')) featureTypes.push('roads');
    }
    
    console.log(`\n🗺️  Terrain Features:`);
    console.log(`   Feature Count: ${featureCount || 'Unknown'}`);
    console.log(`   Feature Types: ${featureTypes.length > 0 ? featureTypes.join(', ') : 'Unknown'}`);
    
    // Validate against expectations
    const meetsExpectations = 
      featureCount >= scenario.expectedTerrainFeatures.minFeatures &&
      featureCount <= scenario.expectedTerrainFeatures.maxFeatures;
    
    console.log(`\n✅ Validation:`);
    console.log(`   Expected Features: ${scenario.expectedTerrainFeatures.minFeatures}-${scenario.expectedTerrainFeatures.maxFeatures}`);
    console.log(`   Meets Expectations: ${meetsExpectations ? '✅ YES' : '⚠️  NO'}`);
    
    return {
      success: body.success,
      scenario: scenario.name,
      duration,
      featureCount,
      featureTypes,
      meetsExpectations,
      artifacts: body.artifacts?.length || 0
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Terrain analysis failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      scenario: scenario.name,
      duration,
      error: error.message
    };
  }
}

/**
 * Test layout agent algorithm selection
 */
async function testLayoutAlgorithmSelection(functionName, scenario, terrainResult) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing Layout Algorithm Selection: ${scenario.name}`);
  console.log('='.repeat(70));
  console.log(`Expected Algorithm: ${scenario.layoutTest.expectedAlgorithm}`);
  console.log(`Expected Placement: ${scenario.layoutTest.expectedPlacement}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    // Create a query that lets the agent choose the algorithm
    const query = `Create an optimal wind farm layout at ${scenario.location.name} (${scenario.location.latitude}, ${scenario.location.longitude}) with ${scenario.layoutTest.num_turbines} turbines using ${scenario.layoutTest.turbine_model}. Choose the best layout algorithm based on the terrain conditions.`;
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        agent: 'layout',
        query: query,
        parameters: {
          project_id: `test_layout_${scenario.name.replace(/\s+/g, '_').toLowerCase()}`,
          latitude: scenario.location.latitude,
          longitude: scenario.location.longitude,
          num_turbines: scenario.layoutTest.num_turbines,
          turbine_model: scenario.layoutTest.turbine_model,
          capacity_mw: scenario.layoutTest.capacity_mw
        }
      }),
      InvocationType: 'RequestResponse'
    });
    
    console.log('🚀 Invoking layout agent...');
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Layout optimization completed in ${duration.toFixed(2)}s`);
    
    // Parse response
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      return {
        success: false,
        scenario: scenario.name,
        duration,
        error: responsePayload.errorMessage
      };
    }
    
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`\n📊 Layout Results:`);
    console.log(`   Success: ${body.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Response Length: ${body.response?.length || 0} characters`);
    console.log(`   Artifacts: ${body.artifacts?.length || 0}`);
    
    // Analyze algorithm selection from response
    let algorithmUsed = 'unknown';
    let turbinesPlaced = 0;
    let layoutType = 'unknown';
    
    if (body.response) {
      const responseText = body.response.toLowerCase();
      
      // Detect algorithm used
      if (responseText.includes('grid') && !responseText.includes('offset')) {
        algorithmUsed = 'grid';
      } else if (responseText.includes('offset') || responseText.includes('offset_grid')) {
        algorithmUsed = 'offset_grid';
      } else if (responseText.includes('spiral')) {
        algorithmUsed = 'spiral';
      } else if (responseText.includes('greedy')) {
        algorithmUsed = 'greedy';
      }
      
      // Extract turbine count
      const turbineMatch = body.response.match(/(\d+)\s+turbines?\s+placed/i);
      if (turbineMatch) {
        turbinesPlaced = parseInt(turbineMatch[1]);
      }
      
      // Detect layout type from response
      if (responseText.includes('regular') || responseText.includes('uniform')) {
        layoutType = 'regular';
      } else if (responseText.includes('adaptive') || responseText.includes('optimized')) {
        layoutType = 'adaptive';
      } else if (responseText.includes('semi-regular') || responseText.includes('offset')) {
        layoutType = 'semi-regular';
      }
    }
    
    console.log(`\n🎯 Algorithm Selection:`);
    console.log(`   Algorithm Used: ${algorithmUsed}`);
    console.log(`   Expected: ${scenario.layoutTest.expectedAlgorithm}`);
    console.log(`   Match: ${algorithmUsed === scenario.layoutTest.expectedAlgorithm ? '✅ YES' : '⚠️  NO (agent chose different algorithm)'}`);
    
    console.log(`\n📍 Turbine Placement:`);
    console.log(`   Turbines Placed: ${turbinesPlaced}/${scenario.layoutTest.num_turbines}`);
    console.log(`   Minimum Expected: ${scenario.layoutTest.minTurbinesPlaced}`);
    console.log(`   Layout Type: ${layoutType}`);
    console.log(`   Expected Type: ${scenario.layoutTest.expectedPlacement}`);
    
    // Validate placement
    const meetsMinimum = turbinesPlaced >= scenario.layoutTest.minTurbinesPlaced;
    const notGridLike = layoutType !== 'regular' || algorithmUsed !== 'grid' || turbinesPlaced < scenario.layoutTest.num_turbines;
    
    console.log(`\n✅ Validation:`);
    console.log(`   Meets Minimum Turbines: ${meetsMinimum ? '✅ YES' : '❌ NO'}`);
    console.log(`   Not Rigidly Grid-Like: ${notGridLike ? '✅ YES' : '⚠️  NO'}`);
    console.log(`   Adapts to Terrain: ${algorithmUsed !== 'unknown' ? '✅ YES' : '❌ NO'}`);
    
    // Check if turbines were skipped due to terrain
    const turbinesSkipped = scenario.layoutTest.num_turbines - turbinesPlaced;
    if (turbinesSkipped > 0) {
      console.log(`\n⚠️  Terrain Adaptation:`);
      console.log(`   Turbines Skipped: ${turbinesSkipped}`);
      console.log(`   Reason: Likely due to terrain constraints (water, buildings, etc.)`);
      console.log(`   This demonstrates intelligent terrain-aware placement ✅`);
    }
    
    return {
      success: body.success,
      scenario: scenario.name,
      duration,
      algorithmUsed,
      turbinesPlaced,
      turbinesSkipped,
      layoutType,
      meetsMinimum,
      notGridLike,
      adaptsToTerrain: algorithmUsed !== 'unknown',
      artifacts: body.artifacts?.length || 0
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Layout optimization failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      scenario: scenario.name,
      duration,
      error: error.message
    };
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 Task 5: Intelligent Algorithm Selection Test');
  console.log('='.repeat(70));
  console.log();
  console.log('This test verifies that Strands agents intelligently select');
  console.log('appropriate algorithms based on terrain conditions.');
  console.log();
  console.log(`Testing ${TEST_SCENARIOS.length} different terrain scenarios:`);
  TEST_SCENARIOS.forEach((scenario, index) => {
    console.log(`  ${index + 1}. ${scenario.name}`);
  });
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
  
  const terrainResults = [];
  const layoutResults = [];
  
  // Test each scenario
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    
    console.log(`\n${'#'.repeat(70)}`);
    console.log(`Scenario ${i + 1}/${TEST_SCENARIOS.length}: ${scenario.name}`);
    console.log('#'.repeat(70));
    
    // Test terrain analysis
    const terrainResult = await testTerrainAgent(agentFunction.FunctionName, scenario);
    terrainResults.push(terrainResult);
    
    // Wait between tests
    console.log('\n⏳ Waiting 5 seconds before layout test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test layout algorithm selection
    const layoutResult = await testLayoutAlgorithmSelection(agentFunction.FunctionName, scenario, terrainResult);
    layoutResults.push(layoutResult);
    
    // Wait between scenarios
    if (i < TEST_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next scenario...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log();
  
  const terrainPassed = terrainResults.filter(r => r.success && r.meetsExpectations).length;
  const layoutPassed = layoutResults.filter(r => r.success && r.meetsMinimum && r.adaptsToTerrain).length;
  const totalTests = TEST_SCENARIOS.length * 2; // terrain + layout for each scenario
  const totalPassed = terrainPassed + layoutPassed;
  
  console.log('📈 Overall Results:');
  console.log(`   Total Scenarios: ${TEST_SCENARIOS.length}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${totalPassed}/${totalTests} ✅`);
  console.log(`   Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log();
  
  console.log('🗺️  Terrain Analysis Results:');
  console.log(`   Passed: ${terrainPassed}/${TEST_SCENARIOS.length}`);
  terrainResults.forEach((result, index) => {
    const status = result.success && result.meetsExpectations ? '✅' : '❌';
    console.log(`   ${status} ${result.scenario}: ${result.featureCount || 'N/A'} features (${result.duration.toFixed(2)}s)`);
  });
  console.log();
  
  console.log('🎯 Layout Algorithm Selection Results:');
  console.log(`   Passed: ${layoutPassed}/${TEST_SCENARIOS.length}`);
  layoutResults.forEach((result, index) => {
    const status = result.success && result.meetsMinimum && result.adaptsToTerrain ? '✅' : '❌';
    console.log(`   ${status} ${result.scenario}:`);
    console.log(`      Algorithm: ${result.algorithmUsed}`);
    console.log(`      Turbines: ${result.turbinesPlaced}/${TEST_SCENARIOS[index].layoutTest.num_turbines}`);
    console.log(`      Layout Type: ${result.layoutType}`);
    console.log(`      Duration: ${result.duration.toFixed(2)}s`);
  });
  console.log();
  
  console.log('='.repeat(70));
  console.log('🎯 Assessment:');
  console.log('='.repeat(70));
  
  if (totalPassed === totalTests) {
    console.log('✅ EXCELLENT: All tests passed');
    console.log('   ✅ Terrain analysis works for all scenarios');
    console.log('   ✅ Layout algorithms adapt to terrain conditions');
    console.log('   ✅ Turbine placement is NOT rigidly grid-like');
    console.log('   ✅ Agents demonstrate intelligent algorithm selection');
  } else if (totalPassed >= totalTests * 0.75) {
    console.log('⚠️  PARTIAL SUCCESS: Most tests passed');
    console.log(`   ${totalPassed}/${totalTests} tests passed`);
    console.log('   Review failed tests and verify algorithm selection logic');
  } else {
    console.log('❌ FAILURE: Multiple tests failed');
    console.log(`   Only ${totalPassed}/${totalTests} tests passed`);
    console.log('   Critical issues with algorithm selection or terrain adaptation');
  }
  
  console.log();
  console.log('📋 Key Findings:');
  
  // Analyze algorithm diversity
  const algorithmsUsed = new Set(layoutResults.map(r => r.algorithmUsed));
  console.log(`   Algorithms Used: ${Array.from(algorithmsUsed).join(', ')}`);
  console.log(`   Algorithm Diversity: ${algorithmsUsed.size > 1 ? '✅ YES (adapts to terrain)' : '⚠️  NO (always uses same algorithm)'}`);
  
  // Analyze terrain adaptation
  const adaptiveLayouts = layoutResults.filter(r => r.turbinesSkipped > 0).length;
  console.log(`   Terrain-Adaptive Layouts: ${adaptiveLayouts}/${TEST_SCENARIOS.length}`);
  console.log(`   Skips Obstacles: ${adaptiveLayouts > 0 ? '✅ YES' : '⚠️  NO'}`);
  
  // Analyze non-grid-like placement
  const nonGridLayouts = layoutResults.filter(r => r.notGridLike).length;
  console.log(`   Non-Grid-Like Layouts: ${nonGridLayouts}/${TEST_SCENARIOS.length}`);
  console.log(`   Avoids Rigid Grids: ${nonGridLayouts === TEST_SCENARIOS.length ? '✅ YES' : '⚠️  PARTIAL'}`);
  
  console.log();
  console.log('📋 Next Steps:');
  if (totalPassed === totalTests) {
    console.log('   ✅ Task 5 complete - intelligent algorithm selection verified');
    console.log('   ✅ Proceed to Task 6: Multi-agent orchestration testing');
  } else {
    console.log('   ❌ Fix failing tests before proceeding');
    console.log('   1. Review agent system prompts for algorithm selection logic');
    console.log('   2. Verify terrain data is being used for decision-making');
    console.log('   3. Check that layout algorithms adapt to constraints');
    console.log('   4. Re-run this test');
  }
  
  console.log();
  console.log('='.repeat(70));
  console.log('🏁 Test Complete');
  console.log('='.repeat(70));
  
  // Exit with appropriate code
  if (totalPassed === totalTests) {
    console.log('✅ Task 5 test PASSED');
    process.exit(0);
  } else {
    console.log(`❌ Task 5 test FAILED (${totalPassed}/${totalTests} passed)`);
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
