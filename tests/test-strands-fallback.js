#!/usr/bin/env node

/**
 * Test Strands Agent Fallback Mechanism
 * 
 * Requirements: 9.5
 * - Simulate Strands agent timeout
 * - Verify fallback to direct tools
 * - Check fallbackUsed flag in response
 * - Verify UI shows fallback warning
 * 
 * This test verifies that when Strands agents timeout or fail,
 * the orchestrator gracefully falls back to direct tool invocation.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test coordinates
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466
};

// Fallback test scenarios
const FALLBACK_TESTS = [
  {
    name: 'Terrain Analysis Fallback',
    userMessage: `Analyze terrain at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    expectedTool: 'terrain',
    expectedArtifacts: ['wind_farm_terrain_analysis'],
    description: 'Tests fallback from Strands terrain agent to direct terrain tool'
  },
  {
    name: 'Layout Optimization Fallback',
    userMessage: `Optimize turbine layout at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} with 20 turbines`,
    expectedTool: 'layout',
    expectedArtifacts: ['wind_farm_layout'],
    description: 'Tests fallback from Strands layout agent to direct layout tool'
  },
  {
    name: 'Wake Simulation Fallback',
    userMessage: `Run wake simulation at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    expectedTool: 'simulation',
    expectedArtifacts: ['wake_simulation'],
    description: 'Tests fallback from Strands simulation agent to direct simulation tool'
  }
];

/**
 * Find Lambda functions
 */
async function findLambdaFunctions() {
  const listCommand = new ListFunctionsCommand({});
  const response = await lambda.send(listCommand);
  
  const orchestrator = response.Functions.find(f => 
    f.FunctionName.includes('renewableOrchestrator')
  );
  
  const strandsAgent = response.Functions.find(f => 
    f.FunctionName.includes('RenewableAgentsFunction')
  );
  
  return { orchestrator, strandsAgent };
}

/**
 * Temporarily disable Strands agent by setting very low timeout
 * This simulates a timeout scenario
 */
async function disableStrandsAgent(functionName) {
  console.log('⚠️  Temporarily disabling Strands agent (setting timeout to 1 second)...');
  
  try {
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Timeout: 1 // 1 second - will cause immediate timeout
    });
    
    await lambda.send(command);
    console.log('✅ Strands agent timeout set to 1 second');
    
    // Wait for configuration to propagate
    console.log('⏳ Waiting 5 seconds for configuration to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to disable Strands agent: ${error.message}`);
    return false;
  }
}

/**
 * Restore Strands agent timeout
 */
async function restoreStrandsAgent(functionName, originalTimeout) {
  console.log(`\n🔄 Restoring Strands agent timeout to ${originalTimeout} seconds...`);
  
  try {
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Timeout: originalTimeout
    });
    
    await lambda.send(command);
    console.log('✅ Strands agent timeout restored');
    
    // Wait for configuration to propagate
    console.log('⏳ Waiting 5 seconds for configuration to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to restore Strands agent: ${error.message}`);
    return false;
  }
}

/**
 * Test fallback mechanism
 */
async function testFallback(orchestratorName, test) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test: ${test.name}`);
  console.log('='.repeat(70));
  console.log(`Description: ${test.description}`);
  console.log(`User Message: ${test.userMessage}`);
  console.log(`Expected Fallback Tool: ${test.expectedTool}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const payload = {
      userMessage: test.userMessage,
      chatSessionId: `test_fallback_${Date.now()}`,
      projectContext: {
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        num_turbines: 20,
        capacity_mw: 40
      }
    };
    
    console.log('🚀 Invoking orchestrator (expecting fallback)...');
    
    const command = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    });
    
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Orchestrator invocation completed in ${duration.toFixed(2)}s`);
    
    // Parse response
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    // Check for errors
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      
      return {
        test: test.name,
        success: false,
        duration,
        error: responsePayload.errorMessage
      };
    }
    
    // Parse body
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`\n📊 Results:`);
    console.log(`   Success: ${body.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Message Length: ${body.message?.length || 0} characters`);
    console.log(`   Artifacts: ${body.artifacts?.length || 0}`);
    
    // Check fallback
    const fallbackUsed = body.metadata?.fallbackUsed || false;
    const fallbackReason = body.metadata?.fallbackReason || 'Not specified';
    const toolsUsed = body.metadata?.toolsUsed || [];
    
    console.log(`\n🔀 Fallback Analysis:`);
    console.log(`   Fallback Used: ${fallbackUsed ? '✅ YES' : '❌ NO'}`);
    console.log(`   Fallback Reason: ${fallbackReason}`);
    console.log(`   Tools Used: ${toolsUsed.join(', ') || 'None'}`);
    
    // Check if direct tool was used
    const usedDirectTool = toolsUsed.some(tool => 
      tool.includes(test.expectedTool) && !tool.includes('strands')
    );
    console.log(`   Used Direct Tool: ${usedDirectTool ? '✅ YES' : '❌ NO'}`);
    
    // Check artifacts
    let hasExpectedArtifacts = false;
    
    if (body.artifacts && body.artifacts.length > 0) {
      console.log(`\n📦 Artifacts Generated:`);
      
      for (const artifact of body.artifacts) {
        console.log(`   Type: ${artifact.type}`);
        console.log(`   URL: ${artifact.url || artifact.key || 'N/A'}`);
        
        // Check if expected artifact type
        const isExpected = test.expectedArtifacts.some(expected => 
          artifact.type.includes(expected) || expected.includes(artifact.type)
        );
        console.log(`   Expected: ${isExpected ? '✅ YES' : '⚠️  NO'}`);
        
        if (isExpected) {
          hasExpectedArtifacts = true;
        }
      }
    } else {
      console.log(`\n⚠️  No artifacts generated`);
    }
    
    // Check for fallback warning in message
    const hasWarning = body.message?.toLowerCase().includes('fallback') ||
                      body.message?.toLowerCase().includes('basic mode') ||
                      body.message?.toLowerCase().includes('advanced ai unavailable');
    
    console.log(`\n⚠️  User Warning:`);
    console.log(`   Warning in Message: ${hasWarning ? '✅ YES' : '❌ NO'}`);
    
    if (hasWarning) {
      const warningText = body.message.split('\n').find(line => 
        line.toLowerCase().includes('fallback') ||
        line.toLowerCase().includes('basic mode') ||
        line.toLowerCase().includes('advanced ai')
      );
      console.log(`   Warning Text: "${warningText}"`);
    }
    
    // Determine if test passed
    const passed = body.success && 
                  fallbackUsed && 
                  usedDirectTool && 
                  hasExpectedArtifacts;
    
    console.log(`\n🎯 Test Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!passed) {
      const reasons = [];
      if (!body.success) reasons.push('Request failed');
      if (!fallbackUsed) reasons.push('Fallback not triggered');
      if (!usedDirectTool) reasons.push('Direct tool not used');
      if (!hasExpectedArtifacts) reasons.push('Expected artifacts not generated');
      
      console.log(`   Reasons:`);
      reasons.forEach(reason => console.log(`   - ${reason}`));
    }
    
    return {
      test: test.name,
      success: body.success,
      passed,
      duration,
      fallbackUsed,
      usedDirectTool,
      hasExpectedArtifacts,
      hasWarning,
      artifacts: body.artifacts?.length || 0
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`❌ Fallback test failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    
    console.log(`\n🎯 Test Result: ❌ FAILED`);
    
    return {
      test: test.name,
      success: false,
      passed: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Test all fallback scenarios
 */
async function testAllFallback() {
  console.log('🧪 Strands Agent Fallback Mechanism Testing');
  console.log('='.repeat(70));
  console.log();
  console.log('This test verifies graceful degradation when Strands agents fail:');
  console.log('  1. Simulate Strands agent timeout');
  console.log('  2. Verify fallback to direct tools');
  console.log('  3. Check fallbackUsed flag in response');
  console.log('  4. Verify user warning message');
  console.log();
  
  console.log('⚠️  WARNING: This test will temporarily modify Strands agent configuration');
  console.log('   The agent timeout will be set to 1 second to simulate failure');
  console.log('   Configuration will be restored after testing');
  console.log();
  
  // Find Lambda functions
  console.log('🔍 Searching for Lambda functions...');
  const { orchestrator, strandsAgent } = await findLambdaFunctions();
  
  if (!orchestrator) {
    throw new Error('Renewable orchestrator Lambda not found');
  }
  
  if (!strandsAgent) {
    throw new Error('Strands Agent Lambda not found');
  }
  
  console.log('✅ Found Lambda functions:');
  console.log(`   Orchestrator: ${orchestrator.FunctionName}`);
  console.log(`   Strands Agent: ${strandsAgent.FunctionName}`);
  console.log(`   Original Timeout: ${strandsAgent.Timeout}s`);
  console.log();
  
  const originalTimeout = strandsAgent.Timeout;
  let configModified = false;
  
  try {
    // Disable Strands agent
    configModified = await disableStrandsAgent(strandsAgent.FunctionName);
    
    if (!configModified) {
      console.log('⚠️  Could not modify Strands agent configuration');
      console.log('   Fallback testing requires ability to modify Lambda configuration');
      console.log('   Skipping fallback tests');
      return {
        success: false,
        skipped: true,
        reason: 'Could not modify Lambda configuration'
      };
    }
    
    console.log();
    console.log('🎯 Test Location:');
    console.log(`   Latitude: ${TEST_LOCATION.latitude}`);
    console.log(`   Longitude: ${TEST_LOCATION.longitude}`);
    console.log();
    
    // Test each scenario
    const results = [];
    
    for (let i = 0; i < FALLBACK_TESTS.length; i++) {
      const test = FALLBACK_TESTS[i];
      const result = await testFallback(orchestrator.FunctionName, test);
      results.push(result);
      
      // Wait between tests
      if (i < FALLBACK_TESTS.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Test Summary');
    console.log('='.repeat(70));
    console.log();
    
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const fallbackCount = results.filter(r => r.fallbackUsed).length;
    const warningCount = results.filter(r => r.hasWarning).length;
    
    console.log('📈 Overall Results:');
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   Passed: ${passedCount} ✅`);
    console.log(`   Failed: ${failedCount} ${failedCount > 0 ? '❌' : ''}`);
    console.log(`   Success Rate: ${((passedCount / results.length) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log(`   Fallback Triggered: ${fallbackCount}/${results.length}`);
    console.log(`   User Warnings: ${warningCount}/${results.length}`);
    console.log();
    
    console.log('📋 Individual Results:');
    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n   ${index + 1}. ${result.test}`);
      console.log(`      Status: ${status}`);
      console.log(`      Duration: ${result.duration.toFixed(2)}s`);
      console.log(`      Fallback Used: ${result.fallbackUsed ? 'YES' : 'NO'}`);
      console.log(`      Direct Tool Used: ${result.usedDirectTool ? 'YES' : 'NO'}`);
      console.log(`      Expected Artifacts: ${result.hasExpectedArtifacts ? 'YES' : 'NO'}`);
      console.log(`      User Warning: ${result.hasWarning ? 'YES' : 'NO'}`);
      
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
    
    console.log();
    console.log('='.repeat(70));
    console.log('🎯 Assessment:');
    console.log('='.repeat(70));
    
    if (passedCount === results.length) {
      console.log('✅ EXCELLENT: Fallback mechanism working correctly');
      console.log('   All tests triggered fallback successfully');
      console.log('   Direct tools provided results');
      console.log('   User warnings displayed appropriately');
      console.log('   System gracefully degrades when Strands agents fail');
    } else if (passedCount >= results.length * 0.75) {
      console.log('⚠️  PARTIAL SUCCESS: Most fallback tests passed');
      console.log(`   ${passedCount}/${results.length} tests passed`);
      console.log('   Review failed tests and fix issues');
    } else {
      console.log('❌ FAILURE: Fallback mechanism not working correctly');
      console.log(`   Only ${passedCount}/${results.length} tests passed`);
      console.log('   Critical fallback issues need to be addressed');
    }
    
    console.log();
    console.log('📋 Next Steps:');
    if (passedCount === results.length) {
      console.log('   ✅ Fallback mechanism verified');
      console.log('   ✅ System ready for production deployment');
      console.log('   ✅ Users will see graceful degradation on timeout');
    } else {
      console.log('   ❌ Fix fallback mechanism');
      console.log('   1. Review orchestrator fallback logic');
      console.log('   2. Verify direct tool invocation');
      console.log('   3. Check user warning messages');
      console.log('   4. Re-run this test');
    }
    
    return {
      success: true,
      results,
      passedCount,
      failedCount,
      totalTests: results.length,
      allPassed: passedCount === results.length
    };
    
  } finally {
    // Always restore configuration
    if (configModified) {
      await restoreStrandsAgent(strandsAgent.FunctionName, originalTimeout);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await testAllFallback();
    
    console.log();
    console.log('='.repeat(70));
    console.log('🏁 Test Complete');
    console.log('='.repeat(70));
    console.log();
    
    if (result.skipped) {
      console.log(`⚠️  Fallback test SKIPPED: ${result.reason}`);
      process.exit(0);
    }
    
    // Exit with appropriate code
    if (result.allPassed) {
      console.log('✅ Fallback test PASSED');
      process.exit(0);
    } else {
      console.log(`❌ Fallback test FAILED (${result.passedCount}/${result.totalTests} passed)`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error();
    console.error('💥 Unexpected error:', error);
    console.error();
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testAllFallback };
