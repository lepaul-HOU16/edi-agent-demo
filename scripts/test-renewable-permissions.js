#!/usr/bin/env node

/**
 * Test script to verify renewable orchestrator permissions are working
 */

import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

async function testPermissions() {
  console.log('🧪 Testing Renewable Orchestrator Permissions\n');
  console.log('=' .repeat(80));
  
  const orchestratorFunctionName = 'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd';
  
  // Test 1: Check if orchestrator function exists
  console.log('\n📋 Test 1: Verify orchestrator function exists');
  try {
    const getFunctionCommand = new GetFunctionCommand({
      FunctionName: orchestratorFunctionName
    });
    
    const functionInfo = await lambdaClient.send(getFunctionCommand);
    console.log(`✅ Orchestrator function found: ${functionInfo.Configuration.FunctionName}`);
    console.log(`   Runtime: ${functionInfo.Configuration.Runtime}`);
    console.log(`   Last Modified: ${functionInfo.Configuration.LastModified}`);
  } catch (error) {
    console.error(`❌ Failed to get orchestrator function:`, error.message);
    return false;
  }
  
  // Test 2: Invoke lightweight agent with renewable query
  console.log('\n📋 Test 2: Invoke lightweight agent with renewable query');
  const lightweightAgentFunctionName = 'amplify-digitalassistant--lightweightAgentlambda3D-SvyqMpiwGrVq';
  
  const testPayload = {
    chatSessionId: 'test-session-' + Date.now(),
    message: 'Analyze terrain for wind farm at 35.067482, -101.395466',
    foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    userId: 'test-user'
  };
  
  try {
    const invokeCommand = new InvokeCommand({
      FunctionName: lightweightAgentFunctionName,
      Payload: JSON.stringify(testPayload)
    });
    
    console.log(`   Invoking: ${lightweightAgentFunctionName}`);
    console.log(`   Query: "${testPayload.message}"`);
    
    const response = await lambdaClient.send(invokeCommand);
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log(`\n📊 Response Status: ${response.StatusCode}`);
    
    if (responsePayload.success) {
      console.log(`✅ SUCCESS: Renewable agent responded successfully`);
      console.log(`   Message preview: ${responsePayload.message?.substring(0, 100)}...`);
      console.log(`   Artifacts: ${responsePayload.artifacts?.length || 0}`);
      return true;
    } else {
      console.log(`⚠️  Agent returned success=false`);
      console.log(`   Message: ${responsePayload.message}`);
      
      // Check if it's still a permission error
      if (responsePayload.message?.includes('Permission denied') || 
          responsePayload.message?.includes('not authorized')) {
        console.log(`❌ PERMISSION ERROR STILL EXISTS`);
        return false;
      } else {
        console.log(`✅ No permission error (different issue)`);
        return true;
      }
    }
  } catch (error) {
    console.error(`❌ Failed to invoke lightweight agent:`, error.message);
    return false;
  }
}

// Run the test
testPermissions()
  .then(success => {
    console.log('\n' + '='.repeat(80));
    if (success) {
      console.log('✅ PERMISSIONS TEST PASSED');
      process.exit(0);
    } else {
      console.log('❌ PERMISSIONS TEST FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test script error:', error);
    process.exit(1);
  });
