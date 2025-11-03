#!/usr/bin/env node

/**
 * Test Strands Agent Orchestration
 * 
 * Requirements: 9.4
 * - Test orchestrator routing to Strands agents
 * - Test complete multi-agent workflow
 * - Verify artifacts generated and stored
 * 
 * This test verifies that the renewable orchestrator correctly routes
 * requests to Strands agents and that multi-agent workflows complete successfully.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Test coordinates (Amarillo, TX area)
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466
};

// Test scenarios for orchestration
const ORCHESTRATION_TESTS = [
  {
    name: 'Single Agent Routing - Terrain',
    userMessage: `Analyze terrain for wind farm at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    expectedAgent: 'terrain',
    expectedArtifacts: ['wind_farm_terrain_analysis', 'terrain_map'],
    description: 'Tests orchestrator routing to terrain agent'
  },
  {
    name: 'Single Agent Routing - Layout',
    userMessage: `Optimize turbine layout at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} with 20 turbines`,
    expectedAgent: 'layout',
    expectedArtifacts: ['wind_farm_layout', 'layout_map'],
    description: 'Tests orchestrator routing to layout agent'
  },
  {
    name: 'Single Agent Routing - Simulation',
    userMessage: `Run wake simulation for wind farm at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    expectedAgent: 'simulation',
    expectedArtifacts: ['wake_simulation', 'wind_rose'],
    description: 'Tests orchestrator routing to simulation agent'
  },
  {
    name: 'Multi-Agent Workflow',
    userMessage: `Complete wind farm analysis at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} with 20 turbines - analyze terrain, optimize layout, and run simulation`,
    expectedAgent: 'multi',
    expectedArtifacts: ['wind_farm_terrain_analysis', 'wind_farm_layout', 'wake_simulation'],
    description: 'Tests multi-agent orchestration workflow'
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
 * Verify artifact exists in S3
 */
async function verifyArtifactInS3(artifactUrl) {
  try {
    // Extract bucket and key from URL
    const url = new URL(artifactUrl);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.substring(1); // Remove leading /
    
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    await s3.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Test orchestrator routing
 */
async function testOrchestration(orchestratorName, test) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test: ${test.name}`);
  console.log('='.repeat(70));
  console.log(`Description: ${test.description}`);
  console.log(`User Message: ${test.userMessage}`);
  console.log(`Expected Agent: ${test.expectedAgent}`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const payload = {
      userMessage: test.userMessage,
      chatSessionId: `test_orchestration_${Date.now()}`,
      projectContext: {
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        num_turbines: 20,
        capacity_mw: 40
      }
    };
    
    console.log('🚀 Invoking orchestrator...');
    
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
    
    // Check routing
    const toolsUsed = body.metadata?.toolsUsed || [];
    const routedToStrands = toolsUsed.some(tool => tool.includes('strands'));
    
    console.log(`\n🔀 Routing:`);
    console.log(`   Routed to Strands: ${routedToStrands ? '✅ YES' : '❌ NO'}`);
    console.log(`   Tools Used: ${toolsUsed.join(', ') || 'None'}`);
    
    if (body.metadata?.fallbackUsed) {
      console.log(`   ⚠️  Fallback Used: YES`);
      console.log(`   Reason: ${body.metadata.fallbackReason || 'Unknown'}`);
    }
    
    // Check artifacts
    let artifactsVerified = 0;
    let artifactsInS3 = 0;
    
    if (body.artifacts && body.artifacts.length > 0) {
      console.log(`\n📦 Artifacts Generated:`);
      
      for (const artifact of body.artifacts) {
        console.log(`\n   Type: ${artifact.type}`);
        console.log(`   URL: ${artifact.url || artifact.key || 'N/A'}`);
        
        // Check if expected artifact type
        const isExpected = test.expectedArtifacts.some(expected => 
          artifact.type.includes(expected) || expected.includes(artifact.type)
        );
        console.log(`   Expected: ${isExpected ? '✅ YES' : '⚠️  NO'}`);
        
        if (isExpected) {
          artifactsVerified++;
        }
        
        // Verify in S3
        if (artifact.url) {
          console.log(`   Verifying S3 storage...`);
          const inS3 = await verifyArtifactInS3(artifact.url);
          console.log(`   In S3: ${inS3 ? '✅ YES' : '❌ NO'}`);
          
          if (inS3) {
            artifactsInS3++;
          }
        }
      }
      
      // Check for missing expected artifacts
      const missingArtifacts = test.expectedArtifacts.filter(expected => 
        !body.artifacts.some(artifact => 
          artifact.type.includes(expected) || expected.includes(artifact.type)
        )
      );
      
      if (missingArtifacts.length > 0) {
        console.log(`\n⚠️  Missing Expected Artifacts:`);
        missingArtifacts.forEach(missing => console.log(`   - ${missing}`));
      }
    } else {
      console.log(`\n⚠️  No artifacts generated`);
      console.log(`   Expected: ${test.expectedArtifacts.join(', ')}`);
    }
    
    // Performance metrics
    if (body.metadata) {
      console.log(`\n⚡ Performance:`);
      console.log(`   Execution Time: ${body.metadata.executionTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Request ID: ${body.metadata.requestId || 'N/A'}`);
    }
    
    // Determine if test passed
    const hasArtifacts = body.artifacts && body.artifacts.length > 0;
    const hasExpectedArtifacts = artifactsVerified > 0;
    const artifactsStored = artifactsInS3 === body.artifacts?.length;
    const passed = body.success && routedToStrands && hasExpectedArtifacts && artifactsStored;
    
    console.log(`\n🎯 Test Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!passed) {
      const reasons = [];
      if (!body.success) reasons.push('Orchestrator reported failure');
      if (!routedToStrands) reasons.push('Not routed to Strands agents');
      if (!hasExpectedArtifacts) reasons.push('Expected artifacts not generated');
      if (!artifactsStored) reasons.push('Artifacts not stored in S3');
      
      console.log(`   Reasons:`);
      reasons.forEach(reason => console.log(`   - ${reason}`));
    }
    
    return {
      test: test.name,
      success: body.success,
      passed,
      duration,
      routedToStrands,
      artifacts: body.artifacts?.length || 0,
      artifactsVerified,
      artifactsInS3,
      fallbackUsed: body.metadata?.fallbackUsed || false
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`❌ Orchestration test failed after ${duration.toFixed(2)}s`);
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
 * Test all orchestration scenarios
 */
async function testAllOrchestration() {
  console.log('🧪 Strands Agent Orchestration Testing');
  console.log('='.repeat(70));
  console.log();
  console.log('This test verifies orchestrator routing to Strands agents:');
  console.log('  1. Single agent routing (terrain, layout, simulation)');
  console.log('  2. Multi-agent workflow orchestration');
  console.log('  3. Artifact generation and S3 storage');
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
  console.log();
  
  console.log('🎯 Test Location:');
  console.log(`   Latitude: ${TEST_LOCATION.latitude}`);
  console.log(`   Longitude: ${TEST_LOCATION.longitude}`);
  console.log();
  
  // Test each scenario
  const results = [];
  
  for (let i = 0; i < ORCHESTRATION_TESTS.length; i++) {
    const test = ORCHESTRATION_TESTS[i];
    const result = await testOrchestration(orchestrator.FunctionName, test);
    results.push(result);
    
    // Wait between tests
    if (i < ORCHESTRATION_TESTS.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
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
  const totalArtifacts = results.reduce((sum, r) => r.artifacts || 0, 0);
  const totalArtifactsInS3 = results.reduce((sum, r) => r.artifactsInS3 || 0, 0);
  const fallbackCount = results.filter(r => r.fallbackUsed).length;
  
  console.log('📈 Overall Results:');
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Passed: ${passedCount} ✅`);
  console.log(`   Failed: ${failedCount} ${failedCount > 0 ? '❌' : ''}`);
  console.log(`   Success Rate: ${((passedCount / results.length) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log(`   Artifacts Generated: ${totalArtifacts}`);
  console.log(`   Artifacts in S3: ${totalArtifactsInS3}`);
  console.log(`   Fallback Used: ${fallbackCount} times`);
  console.log();
  
  console.log('📋 Individual Results:');
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n   ${index + 1}. ${result.test}`);
    console.log(`      Status: ${status}`);
    console.log(`      Duration: ${result.duration.toFixed(2)}s`);
    console.log(`      Routed to Strands: ${result.routedToStrands ? 'YES' : 'NO'}`);
    console.log(`      Artifacts: ${result.artifacts || 0}`);
    console.log(`      Artifacts in S3: ${result.artifactsInS3 || 0}`);
    
    if (result.fallbackUsed) {
      console.log(`      ⚠️  Fallback Used: YES`);
    }
    
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log();
  console.log('='.repeat(70));
  console.log('🎯 Assessment:');
  console.log('='.repeat(70));
  
  if (passedCount === results.length && fallbackCount === 0) {
    console.log('✅ EXCELLENT: All orchestration tests passed');
    console.log('   Orchestrator correctly routes to Strands agents');
    console.log('   All agents generate and store artifacts');
    console.log('   Multi-agent workflows complete successfully');
    console.log('   No fallbacks triggered');
  } else if (passedCount === results.length && fallbackCount > 0) {
    console.log('⚠️  PASSED WITH WARNINGS: Tests passed but fallbacks used');
    console.log(`   ${fallbackCount} test(s) used fallback to direct tools`);
    console.log('   This indicates Strands agents may be timing out');
    console.log('   Review cold start performance and optimization');
  } else if (passedCount >= results.length * 0.75) {
    console.log('⚠️  PARTIAL SUCCESS: Most tests passed');
    console.log(`   ${passedCount}/${results.length} tests passed`);
    console.log('   Review failed tests and fix issues');
  } else {
    console.log('❌ FAILURE: Multiple orchestration tests failed');
    console.log(`   Only ${passedCount}/${results.length} tests passed`);
    console.log('   Critical orchestration issues need to be addressed');
  }
  
  console.log();
  console.log('📋 Next Steps:');
  if (passedCount === results.length && fallbackCount === 0) {
    console.log('   ✅ Orchestration verified');
    console.log('   ✅ Proceed to fallback testing (test-strands-fallback.js)');
    console.log('   ✅ System ready for production use');
  } else if (passedCount === results.length && fallbackCount > 0) {
    console.log('   ⚠️  Optimize cold start performance');
    console.log('   ⚠️  Run cold start tests to identify bottlenecks');
    console.log('   ✅ Proceed to fallback testing');
  } else {
    console.log('   ❌ Fix failing orchestration tests');
    console.log('   1. Review orchestrator routing logic');
    console.log('   2. Verify Strands agent integration');
    console.log('   3. Check artifact generation and storage');
    console.log('   4. Re-run this test');
  }
  
  return {
    success: true,
    results,
    passedCount,
    failedCount,
    totalTests: results.length,
    allPassed: passedCount === results.length,
    fallbackCount
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await testAllOrchestration();
    
    console.log();
    console.log('='.repeat(70));
    console.log('🏁 Test Complete');
    console.log('='.repeat(70));
    console.log();
    
    // Exit with appropriate code
    if (result.allPassed) {
      console.log('✅ Orchestration test PASSED');
      process.exit(0);
    } else {
      console.log(`❌ Orchestration test FAILED (${result.passedCount}/${result.totalTests} passed)`);
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

module.exports = { testAllOrchestration };
