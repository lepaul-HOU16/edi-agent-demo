#!/usr/bin/env node

/**
 * Test All Strands Agents Individually
 * 
 * Requirements: 9.3
 * - Test terrain agent invocation
 * - Test layout agent invocation
 * - Test simulation agent invocation
 * - Test report agent invocation
 * - Verify all agents respond successfully
 * 
 * This test invokes each of the 4 Strands agents individually to verify
 * they all work correctly and generate appropriate artifacts.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test coordinates (Amarillo, TX area - good wind resource)
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 2
};

// Test payloads for each agent
const AGENT_TESTS = [
  {
    name: 'Terrain Analysis Agent',
    agent: 'terrain',
    query: `Analyze terrain for wind farm development at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    parameters: {
      project_id: 'test_all_agents_terrain',
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      radius_km: TEST_LOCATION.radius_km,
      setback_m: 100
    },
    expectedArtifacts: ['wind_farm_terrain_analysis', 'terrain_map'],
    description: 'Analyzes terrain features, obstacles, and suitability for wind farm development'
  },
  {
    name: 'Layout Optimization Agent',
    agent: 'layout',
    query: `Optimize turbine layout for wind farm at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} with 20 turbines`,
    parameters: {
      project_id: 'test_all_agents_layout',
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      num_turbines: 20,
      turbine_model: 'Vestas V90-2.0MW',
      capacity_mw: 40
    },
    expectedArtifacts: ['wind_farm_layout', 'layout_map'],
    description: 'Optimizes turbine placement considering wake effects and terrain constraints'
  },
  {
    name: 'Wake Simulation Agent',
    agent: 'simulation',
    query: `Run wake simulation for wind farm at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    parameters: {
      project_id: 'test_all_agents_simulation',
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      num_turbines: 20,
      turbine_model: 'Vestas V90-2.0MW',
      capacity_mw: 40
    },
    expectedArtifacts: ['wake_simulation', 'wind_rose', 'energy_production'],
    description: 'Simulates wake effects and calculates energy production using PyWake'
  },
  {
    name: 'Report Generation Agent',
    agent: 'report',
    query: `Generate comprehensive report for wind farm project at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    parameters: {
      project_id: 'test_all_agents_report',
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      num_turbines: 20,
      capacity_mw: 40
    },
    expectedArtifacts: ['project_report', 'executive_summary'],
    description: 'Generates comprehensive project report with all analysis results'
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
 * Test a single agent
 */
async function testAgent(functionName, agentTest) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${agentTest.name}`);
  console.log('='.repeat(70));
  console.log(`Agent: ${agentTest.agent}`);
  console.log(`Description: ${agentTest.description}`);
  console.log(`Query: ${agentTest.query.substring(0, 80)}...`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        agent: agentTest.agent,
        query: agentTest.query,
        parameters: agentTest.parameters
      }),
      InvocationType: 'RequestResponse'
    });
    
    console.log('🚀 Invoking agent...');
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Agent invocation completed in ${duration.toFixed(2)}s`);
    
    // Parse response
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    // Check for errors
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      
      if (responsePayload.errorType) {
        console.log(`   Type: ${responsePayload.errorType}`);
      }
      
      if (responsePayload.stackTrace) {
        console.log('   Stack Trace:');
        responsePayload.stackTrace.slice(0, 5).forEach(line => console.log(`     ${line}`));
      }
      
      return {
        agent: agentTest.agent,
        name: agentTest.name,
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
    console.log(`   Agent: ${body.agent || agentTest.agent}`);
    console.log(`   Response Length: ${body.response?.length || body.message?.length || 0} characters`);
    console.log(`   Artifacts: ${body.artifacts?.length || 0}`);
    
    // Check artifacts
    if (body.artifacts && body.artifacts.length > 0) {
      console.log(`\n📦 Artifacts Generated:`);
      body.artifacts.forEach((artifact, index) => {
        console.log(`   ${index + 1}. Type: ${artifact.type}`);
        console.log(`      URL: ${artifact.url || artifact.key || 'N/A'}`);
        
        // Check if expected artifact type
        const isExpected = agentTest.expectedArtifacts.some(expected => 
          artifact.type.includes(expected) || expected.includes(artifact.type)
        );
        console.log(`      Expected: ${isExpected ? '✅ YES' : '⚠️  NO'}`);
      });
      
      // Verify expected artifacts
      const missingArtifacts = agentTest.expectedArtifacts.filter(expected => 
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
      console.log(`   Expected: ${agentTest.expectedArtifacts.join(', ')}`);
    }
    
    // Performance metrics
    if (body.performance) {
      console.log(`\n⚡ Performance:`);
      console.log(`   Cold Start: ${body.performance.coldStart ? 'YES ❄️' : 'NO 🔥'}`);
      console.log(`   Init Time: ${body.performance.initTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Execution Time: ${body.performance.executionTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Memory Used: ${body.performance.memoryUsed || 'N/A'} MB`);
    }
    
    // Response preview
    if (body.response || body.message) {
      const responseText = body.response || body.message;
      console.log(`\n📄 Response Preview:`);
      console.log(`   ${responseText.substring(0, 200)}...`);
    }
    
    // Determine if test passed
    const hasArtifacts = body.artifacts && body.artifacts.length > 0;
    const hasResponse = (body.response || body.message) && (body.response?.length > 0 || body.message?.length > 0);
    const passed = body.success && (hasArtifacts || hasResponse);
    
    console.log(`\n🎯 Test Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!passed) {
      if (!body.success) {
        console.log('   Reason: Agent reported failure');
      } else if (!hasArtifacts && !hasResponse) {
        console.log('   Reason: No artifacts or response generated');
      }
    }
    
    return {
      agent: agentTest.agent,
      name: agentTest.name,
      success: body.success,
      passed,
      duration,
      artifacts: body.artifacts?.length || 0,
      responseLength: body.response?.length || body.message?.length || 0,
      coldStart: body.performance?.coldStart,
      hasExpectedArtifacts: hasArtifacts
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`❌ Agent invocation failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      console.log('   ⏱️  TIMEOUT: Agent exceeded Lambda timeout');
    }
    
    console.log(`\n🎯 Test Result: ❌ FAILED`);
    
    return {
      agent: agentTest.agent,
      name: agentTest.name,
      success: false,
      passed: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Test all agents
 */
async function testAllAgents() {
  console.log('🧪 Strands Agent Individual Testing');
  console.log('='.repeat(70));
  console.log();
  console.log('This test verifies that all 4 Strands agents work correctly:');
  console.log('  1. Terrain Analysis Agent');
  console.log('  2. Layout Optimization Agent');
  console.log('  3. Wake Simulation Agent');
  console.log('  4. Report Generation Agent');
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
  
  console.log('🎯 Test Location:');
  console.log(`   Latitude: ${TEST_LOCATION.latitude}`);
  console.log(`   Longitude: ${TEST_LOCATION.longitude}`);
  console.log(`   Radius: ${TEST_LOCATION.radius_km}km`);
  console.log();
  
  // Test each agent
  const results = [];
  
  for (let i = 0; i < AGENT_TESTS.length; i++) {
    const agentTest = AGENT_TESTS[i];
    const result = await testAgent(agentFunction.FunctionName, agentTest);
    results.push(result);
    
    // Wait between tests to avoid throttling
    if (i < AGENT_TESTS.length - 1) {
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
  const avgDuration = totalDuration / results.length;
  
  console.log('📈 Overall Results:');
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Passed: ${passedCount} ✅`);
  console.log(`   Failed: ${failedCount} ${failedCount > 0 ? '❌' : ''}`);
  console.log(`   Success Rate: ${((passedCount / results.length) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log(`   Average Duration: ${avgDuration.toFixed(2)}s`);
  console.log();
  
  console.log('📋 Individual Results:');
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n   ${index + 1}. ${result.name}`);
    console.log(`      Status: ${status}`);
    console.log(`      Duration: ${result.duration.toFixed(2)}s`);
    console.log(`      Artifacts: ${result.artifacts}`);
    console.log(`      Response: ${result.responseLength} characters`);
    
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
    
    if (result.coldStart !== undefined) {
      console.log(`      Cold Start: ${result.coldStart ? 'YES' : 'NO'}`);
    }
  });
  
  console.log();
  console.log('='.repeat(70));
  console.log('🎯 Assessment:');
  console.log('='.repeat(70));
  
  if (passedCount === results.length) {
    console.log('✅ EXCELLENT: All agents working correctly');
    console.log('   All 4 agents responded successfully');
    console.log('   All agents generated appropriate artifacts');
    console.log('   System is ready for multi-agent orchestration testing');
  } else if (passedCount >= results.length * 0.75) {
    console.log('⚠️  PARTIAL SUCCESS: Most agents working');
    console.log(`   ${passedCount}/${results.length} agents passed`);
    console.log('   Review failed agents and fix issues');
    console.log('   Re-run test after fixes');
  } else {
    console.log('❌ FAILURE: Multiple agents not working');
    console.log(`   Only ${passedCount}/${results.length} agents passed`);
    console.log('   Critical issues need to be addressed');
    console.log('   Review logs and error messages');
  }
  
  console.log();
  console.log('📋 Next Steps:');
  if (passedCount === results.length) {
    console.log('   ✅ All agents verified');
    console.log('   ✅ Proceed to orchestration testing (test-strands-orchestration.js)');
    console.log('   ✅ Test multi-agent workflows');
  } else {
    console.log('   ❌ Fix failing agents before proceeding');
    console.log('   1. Review error messages and logs');
    console.log('   2. Check agent implementation');
    console.log('   3. Verify tool integrations');
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
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await testAllAgents();
    
    console.log();
    console.log('='.repeat(70));
    console.log('🏁 Test Complete');
    console.log('='.repeat(70));
    console.log();
    
    // Exit with appropriate code
    if (result.allPassed) {
      console.log('✅ All agents test PASSED');
      process.exit(0);
    } else {
      console.log(`❌ All agents test FAILED (${result.passedCount}/${result.totalTests} passed)`);
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

module.exports = { testAllAgents };
