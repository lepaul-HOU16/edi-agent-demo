#!/usr/bin/env node

/**
 * Verify Terrain Query Routing Fix Deployment
 * 
 * This script verifies that the pattern matching fixes are deployed
 * and working correctly in the sandbox environment.
 */

const { LambdaClient, GetFunctionConfigurationCommand, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function findOrchestratorLambda() {
  console.log('🔍 Finding renewable orchestrator Lambda...');
  
  const { execSync } = require('child_process');
  const result = execSync(
    'aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text',
    { encoding: 'utf-8' }
  );
  
  const functionName = result.trim();
  if (!functionName) {
    throw new Error('Renewable orchestrator Lambda not found');
  }
  
  console.log(`✅ Found orchestrator: ${functionName}`);
  return functionName;
}

async function verifyDeployment(functionName) {
  console.log('\n📋 Checking Lambda configuration...');
  
  const command = new GetFunctionConfigurationCommand({
    FunctionName: functionName
  });
  
  const response = await lambdaClient.send(command);
  
  console.log(`   Runtime: ${response.Runtime}`);
  console.log(`   Last Modified: ${response.LastModified}`);
  console.log(`   Memory: ${response.MemorySize} MB`);
  console.log(`   Timeout: ${response.Timeout} seconds`);
  
  return response;
}

async function testTerrainQuery(functionName) {
  console.log('\n🧪 Testing terrain analysis query...');
  
  const testEvent = {
    query: 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
    context: {},
    sessionId: 'test-session-' + Date.now()
  };
  
  console.log(`   Query: "${testEvent.query}"`);
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(testEvent)
  });
  
  try {
    const response = await lambdaClient.send(command);
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`   Status: ${response.StatusCode}`);
    
    if (payload.errorMessage) {
      console.log(`   ❌ Error: ${payload.errorMessage}`);
      return false;
    }
    
    // Check if it routed to terrain analysis (not project list)
    const isProjectList = payload.message && payload.message.includes('Your Renewable Energy Projects');
    const hasTerrainArtifacts = payload.artifacts && payload.artifacts.some(a => 
      a.type === 'wind_farm_terrain_analysis'
    );
    
    if (isProjectList) {
      console.log('   ❌ FAILED: Query incorrectly routed to project list');
      return false;
    }
    
    if (hasTerrainArtifacts || payload.metadata?.toolsUsed?.includes('terrain_analysis')) {
      console.log('   ✅ PASSED: Query correctly routed to terrain analysis');
      return true;
    }
    
    console.log('   ⚠️  UNCLEAR: Response does not clearly indicate routing');
    console.log('   Response:', JSON.stringify(payload, null, 2).substring(0, 500));
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error invoking Lambda: ${error.message}`);
    return false;
  }
}

async function testProjectListQuery(functionName) {
  console.log('\n🧪 Testing project list query...');
  
  const testEvent = {
    query: 'list my renewable projects',
    context: {},
    sessionId: 'test-session-' + Date.now()
  };
  
  console.log(`   Query: "${testEvent.query}"`);
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(testEvent)
  });
  
  try {
    const response = await lambdaClient.send(command);
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`   Status: ${response.StatusCode}`);
    
    if (payload.errorMessage) {
      console.log(`   ❌ Error: ${payload.errorMessage}`);
      return false;
    }
    
    // Check if it routed to project list (not terrain)
    const isProjectList = payload.message && (
      payload.message.includes('Your Renewable Energy Projects') ||
      payload.message.includes('don\'t have any renewable energy projects')
    );
    const hasTerrainArtifacts = payload.artifacts && payload.artifacts.some(a => 
      a.type === 'wind_farm_terrain_analysis'
    );
    
    if (hasTerrainArtifacts) {
      console.log('   ❌ FAILED: Query incorrectly routed to terrain analysis');
      return false;
    }
    
    if (isProjectList || payload.metadata?.toolsUsed?.includes('project_list')) {
      console.log('   ✅ PASSED: Query correctly routed to project list');
      return true;
    }
    
    console.log('   ⚠️  UNCLEAR: Response does not clearly indicate routing');
    console.log('   Response:', JSON.stringify(payload, null, 2).substring(0, 500));
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error invoking Lambda: ${error.message}`);
    return false;
  }
}

async function checkCloudWatchLogs(functionName) {
  console.log('\n📊 Checking CloudWatch logs for routing decisions...');
  console.log('   (This requires manual verification in AWS Console)');
  console.log(`   Log Group: /aws/lambda/${functionName}`);
  console.log('   Look for: [ProjectListHandler] log messages');
  console.log('   Expected: Pattern matching and action verb checks');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Terrain Query Routing Fix - Deployment Verification');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Find the orchestrator Lambda
    const functionName = await findOrchestratorLambda();
    
    // Verify deployment
    await verifyDeployment(functionName);
    
    // Test terrain query routing
    const terrainTest = await testTerrainQuery(functionName);
    
    // Test project list query routing
    const projectListTest = await testProjectListQuery(functionName);
    
    // Check CloudWatch logs
    await checkCloudWatchLogs(functionName);
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  DEPLOYMENT VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`   Terrain Query Test:      ${terrainTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Project List Query Test: ${projectListTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (terrainTest && projectListTest) {
      console.log('\n✅ ALL TESTS PASSED - Deployment verified successfully!');
      console.log('\nNext steps:');
      console.log('1. Test with real user queries in the UI');
      console.log('2. Monitor CloudWatch logs for routing decisions');
      console.log('3. Verify no false positives or negatives');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED - Deployment may need attention');
      console.log('\nTroubleshooting:');
      console.log('1. Check if sandbox was restarted after code changes');
      console.log('2. Verify projectListHandler.ts changes are deployed');
      console.log('3. Check CloudWatch logs for errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
