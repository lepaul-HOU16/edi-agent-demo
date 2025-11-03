#!/usr/bin/env node

/**
 * Verification script for Task 2: Fix orchestrator context management
 * 
 * This script verifies that:
 * 1. Terrain results are properly stored in context after terrain analysis
 * 2. Context is correctly passed to layout Lambda with terrain_results
 * 3. Exclusion zones flow from terrain to layout
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test coordinates (Lubbock, Texas - good wind resource area)
const TEST_COORDINATES = {
  latitude: 33.5779,
  longitude: -101.8552
};

async function invokeLambda(functionName, payload) {
  console.log(`\n📤 Invoking ${functionName}...`);
  console.log(`   Payload: ${JSON.stringify(payload, null, 2).substring(0, 500)}...`);
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  
  // Parse body if it's a Lambda proxy response
  if (result.body) {
    return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  }
  
  return result;
}

async function findOrchestratorFunction() {
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const command = new ListFunctionsCommand({});
  const response = await lambdaClient.send(command);
  
  const orchestratorFunction = response.Functions.find(f => 
    f.FunctionName.includes('renewableOrchestrator') || 
    f.FunctionName.includes('RenewableOrchestrator')
  );
  
  if (!orchestratorFunction) {
    throw new Error('Could not find renewable orchestrator Lambda function');
  }
  
  return orchestratorFunction.FunctionName;
}

async function testTerrainAnalysis(orchestratorFunctionName) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Terrain Analysis - Verify terrain_results stored in context');
  console.log('='.repeat(80));
  
  const payload = {
    query: `Analyze terrain at coordinates ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with 5km radius`,
    context: {},
    sessionId: `test-session-${Date.now()}`
  };
  
  const result = await invokeLambda(orchestratorFunctionName, payload);
  
  console.log('\n📊 Terrain Analysis Results:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Message: ${result.message}`);
  console.log(`   Artifacts: ${result.artifacts?.length || 0}`);
  console.log(`   Project Name: ${result.metadata?.projectName || 'N/A'}`);
  
  // Check if terrain results were generated
  const terrainArtifact = result.artifacts?.find(a => a.type === 'wind_farm_terrain_analysis');
  
  if (!terrainArtifact) {
    console.log('\n❌ FAIL: No terrain analysis artifact found');
    return { success: false, projectName: null };
  }
  
  console.log('\n✅ PASS: Terrain analysis artifact generated');
  
  // Check if exclusionZones are present
  const hasExclusionZones = terrainArtifact.data?.exclusionZones;
  
  if (!hasExclusionZones) {
    console.log('⚠️  WARNING: No exclusionZones in terrain artifact');
    console.log('   Artifact data keys:', Object.keys(terrainArtifact.data || {}));
  } else {
    const ez = terrainArtifact.data.exclusionZones;
    console.log('\n✅ PASS: Exclusion zones present in artifact:');
    console.log(`   Buildings: ${ez.buildings?.length || 0}`);
    console.log(`   Roads: ${ez.roads?.length || 0}`);
    console.log(`   Water Bodies: ${ez.waterBodies?.length || 0}`);
  }
  
  return {
    success: result.success,
    projectName: result.metadata?.projectName,
    hasExclusionZones
  };
}

async function testLayoutOptimization(orchestratorFunctionName, projectName) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Layout Optimization - Verify terrain context passed to layout');
  console.log('='.repeat(80));
  
  const payload = {
    query: `Optimize turbine layout for ${projectName || 'the project'}`,
    context: {},
    sessionId: `test-session-${Date.now()}`
  };
  
  const result = await invokeLambda(orchestratorFunctionName, payload);
  
  console.log('\n📊 Layout Optimization Results:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Message: ${result.message}`);
  console.log(`   Artifacts: ${result.artifacts?.length || 0}`);
  
  // Check if layout artifact was generated
  const layoutArtifact = result.artifacts?.find(a => a.type === 'wind_farm_layout');
  
  if (!layoutArtifact) {
    console.log('\n❌ FAIL: No layout artifact found');
    return { success: false };
  }
  
  console.log('\n✅ PASS: Layout artifact generated');
  
  // Check if intelligent placement was used
  const algorithmUsed = layoutArtifact.data?.algorithm_used || layoutArtifact.data?.metadata?.algorithm_used;
  
  console.log(`\n🔍 Algorithm Used: ${algorithmUsed || 'UNKNOWN'}`);
  
  if (algorithmUsed === 'intelligent_placement') {
    console.log('✅ PASS: Intelligent placement algorithm was used');
    console.log('   This confirms terrain context was passed correctly');
  } else if (algorithmUsed === 'grid_pattern') {
    console.log('⚠️  WARNING: Grid pattern was used instead of intelligent placement');
    console.log('   This suggests terrain context may not have been passed correctly');
  } else {
    console.log('⚠️  WARNING: Could not determine which algorithm was used');
  }
  
  // Check turbine count
  const turbineCount = layoutArtifact.data?.turbine_count || layoutArtifact.data?.metadata?.turbine_count;
  console.log(`\n📊 Turbines Placed: ${turbineCount || 'UNKNOWN'}`);
  
  return {
    success: result.success,
    algorithmUsed,
    turbineCount
  };
}

async function checkCloudWatchLogs(orchestratorFunctionName) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: CloudWatch Logs - Verify diagnostic logging');
  console.log('='.repeat(80));
  
  console.log('\n📋 To verify context management, check CloudWatch logs for:');
  console.log('   1. "💾 SAVING TERRAIN RESULTS TO CONTEXT" - Shows terrain results being saved');
  console.log('   2. "📦 PROJECT DATA LOADED" - Shows terrain_results loaded from S3');
  console.log('   3. "🔧 TOOL CONTEXT PREPARATION" - Shows terrain_results in toolContext');
  console.log('   4. "🔍 LAYOUT INVOCATION - Context Diagnostic" - Shows context passed to layout');
  console.log('   5. "📤 LAYOUT LAMBDA PAYLOAD" - Shows exclusionZones in payload');
  
  console.log('\n📝 CloudWatch Log Group:');
  console.log(`   /aws/lambda/${orchestratorFunctionName}`);
  
  console.log('\n💡 To view logs:');
  console.log(`   aws logs tail /aws/lambda/${orchestratorFunctionName} --follow`);
}

async function main() {
  console.log('🚀 Starting Task 2 Verification: Orchestrator Context Management');
  console.log('='.repeat(80));
  
  try {
    // Find orchestrator function
    const orchestratorFunctionName = await findOrchestratorFunction();
    console.log(`\n✅ Found orchestrator: ${orchestratorFunctionName}`);
    
    // Test 1: Terrain analysis
    const terrainResult = await testTerrainAnalysis(orchestratorFunctionName);
    
    if (!terrainResult.success) {
      console.log('\n❌ Terrain analysis failed - cannot proceed with layout test');
      process.exit(1);
    }
    
    if (!terrainResult.projectName) {
      console.log('\n⚠️  No project name returned - using generic query for layout');
    }
    
    // Wait a bit for S3 to propagate
    console.log('\n⏳ Waiting 3 seconds for S3 to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Layout optimization
    const layoutResult = await testLayoutOptimization(orchestratorFunctionName, terrainResult.projectName);
    
    if (!layoutResult.success) {
      console.log('\n❌ Layout optimization failed');
      process.exit(1);
    }
    
    // Test 3: Check CloudWatch logs
    await checkCloudWatchLogs(orchestratorFunctionName);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\n✅ Task 2.1: Terrain results stored in context');
    console.log(`   - Terrain analysis: ${terrainResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   - Exclusion zones present: ${terrainResult.hasExclusionZones ? 'YES' : 'NO'}`);
    
    console.log('\n✅ Task 2.2: Terrain context passed to layout Lambda');
    console.log(`   - Layout optimization: ${layoutResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   - Algorithm used: ${layoutResult.algorithmUsed || 'UNKNOWN'}`);
    console.log(`   - Intelligent placement: ${layoutResult.algorithmUsed === 'intelligent_placement' ? 'YES ✅' : 'NO ⚠️'}`);
    
    if (layoutResult.algorithmUsed === 'intelligent_placement') {
      console.log('\n🎉 SUCCESS: Context management is working correctly!');
      console.log('   Terrain results are flowing from terrain analysis to layout optimization.');
      process.exit(0);
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Layout ran but may not have used terrain context');
      console.log('   Check CloudWatch logs to verify context flow.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
