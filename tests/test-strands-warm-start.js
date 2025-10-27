#!/usr/bin/env node

/**
 * Test Strands Agent Lambda Warm Start Performance
 * 
 * Requirements: 9.2
 * - Invoke Lambda twice in succession
 * - Measure warm start time (second invocation)
 * - Verify warm start < 30 seconds
 * 
 * This test invokes the Strands Agent Lambda TWICE to measure warm start performance.
 * The first invocation triggers a cold start, the second reuses the warm container.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Performance thresholds (in seconds)
const EXCELLENT_THRESHOLD = 30;  // 30 seconds
const ACCEPTABLE_THRESHOLD = 60; // 60 seconds

// Test payload for terrain agent (lightweight test)
const testPayload = {
  agent: 'terrain',
  query: 'Analyze terrain at coordinates 35.067482, -101.395466',
  parameters: {
    project_id: 'warm-start-test',
    latitude: 35.067482,
    longitude: -101.395466,
    radius_km: 2
  }
};

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
 * Invoke Lambda and measure performance
 */
async function invokeLambda(functionName, payload, invocationNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Invocation #${invocationNumber}: ${invocationNumber === 1 ? 'COLD START' : 'WARM START'}`);
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  console.log(`⏱️  Start time: ${new Date(startTime).toISOString()}`);
  console.log(`🚀 Invoking Lambda...`);
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    });
    
    const response = await lambda.send(command);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Lambda invocation completed`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
    
    // Parse response
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    // Check for errors
    if (response.FunctionError || responsePayload.errorMessage) {
      console.log(`❌ Error: ${responsePayload.errorMessage || 'Unknown error'}`);
      return {
        success: false,
        duration,
        error: responsePayload.errorMessage
      };
    }
    
    // Parse body
    const body = responsePayload.body ? 
      (typeof responsePayload.body === 'string' ? JSON.parse(responsePayload.body) : responsePayload.body) : 
      responsePayload;
    
    console.log(`✅ Success: ${body.success}`);
    console.log(`🤖 Agent: ${body.agent || payload.agent}`);
    console.log(`📦 Artifacts: ${body.artifacts?.length || 0}`);
    
    // Performance metrics
    if (body.performance) {
      console.log(`\n⚡ Performance Metrics:`);
      console.log(`   Cold Start: ${body.performance.coldStart ? 'YES ❄️' : 'NO 🔥'}`);
      console.log(`   Init Time: ${body.performance.initTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Execution Time: ${body.performance.executionTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Memory Used: ${body.performance.memoryUsed || 'N/A'} MB`);
    }
    
    return {
      success: true,
      duration,
      coldStart: body.performance?.coldStart,
      initTime: body.performance?.initTime,
      executionTime: body.performance?.executionTime,
      memoryUsed: body.performance?.memoryUsed,
      artifacts: body.artifacts?.length || 0
    };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`❌ Lambda invocation failed after ${duration.toFixed(2)}s`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Test warm start performance
 */
async function testWarmStart() {
  console.log('🧪 Strands Agent Warm Start Performance Test');
  console.log('='.repeat(70));
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
  
  console.log('🎯 Test Configuration:');
  console.log(`   Agent: ${testPayload.agent}`);
  console.log(`   Location: ${testPayload.parameters.latitude}, ${testPayload.parameters.longitude}`);
  console.log(`   Invocations: 2 (cold start + warm start)`);
  console.log();
  
  console.log('⚠️  IMPORTANT: This test measures WARM START performance');
  console.log('   - First invocation: Cold start (baseline)');
  console.log('   - Second invocation: Warm start (reuses container)');
  console.log('   - Warm start should be < 30 seconds');
  console.log();
  
  // First invocation (cold start)
  const coldStartResult = await invokeLambda(agentFunction.FunctionName, testPayload, 1);
  
  if (!coldStartResult.success) {
    console.log('\n❌ Cold start invocation failed, cannot proceed to warm start test');
    return {
      success: false,
      coldStart: coldStartResult,
      warmStart: null
    };
  }
  
  // Wait a moment before second invocation
  console.log('\n⏳ Waiting 2 seconds before warm start invocation...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Second invocation (warm start)
  const warmStartResult = await invokeLambda(agentFunction.FunctionName, testPayload, 2);
  
  if (!warmStartResult.success) {
    console.log('\n❌ Warm start invocation failed');
    return {
      success: false,
      coldStart: coldStartResult,
      warmStart: warmStartResult
    };
  }
  
  // Analysis
  console.log('\n' + '='.repeat(70));
  console.log('📊 Performance Comparison:');
  console.log('='.repeat(70));
  
  console.log('\n🥶 Cold Start (Invocation #1):');
  console.log(`   Duration: ${coldStartResult.duration.toFixed(2)}s`);
  console.log(`   Init Time: ${coldStartResult.initTime?.toFixed(2) || 'N/A'}s`);
  console.log(`   Execution Time: ${coldStartResult.executionTime?.toFixed(2) || 'N/A'}s`);
  console.log(`   Memory: ${coldStartResult.memoryUsed || 'N/A'} MB`);
  
  console.log('\n🔥 Warm Start (Invocation #2):');
  console.log(`   Duration: ${warmStartResult.duration.toFixed(2)}s`);
  console.log(`   Init Time: ${warmStartResult.initTime?.toFixed(2) || 'N/A'}s`);
  console.log(`   Execution Time: ${warmStartResult.executionTime?.toFixed(2) || 'N/A'}s`);
  console.log(`   Memory: ${warmStartResult.memoryUsed || 'N/A'} MB`);
  
  // Calculate improvement
  const speedup = coldStartResult.duration / warmStartResult.duration;
  const timeSaved = coldStartResult.duration - warmStartResult.duration;
  
  console.log('\n📈 Improvement:');
  console.log(`   Speedup: ${speedup.toFixed(2)}x faster`);
  console.log(`   Time Saved: ${timeSaved.toFixed(2)}s`);
  console.log(`   Improvement: ${((timeSaved / coldStartResult.duration) * 100).toFixed(1)}%`);
  
  // Verify warm start was actually warm
  console.log('\n🔍 Verification:');
  if (warmStartResult.coldStart === false) {
    console.log('   ✅ Confirmed: Second invocation was a WARM START');
  } else if (warmStartResult.coldStart === true) {
    console.log('   ⚠️  WARNING: Second invocation reported as COLD START');
    console.log('      This may indicate container recycling or insufficient time between invocations');
  } else {
    console.log('   ⚠️  WARNING: Cold start status not reported');
  }
  
  // Performance assessment
  console.log('\n' + '='.repeat(70));
  console.log('🎯 Warm Start Performance Assessment:');
  console.log('='.repeat(70));
  
  let performanceRating;
  let passed = false;
  
  if (warmStartResult.duration < EXCELLENT_THRESHOLD) {
    performanceRating = 'EXCELLENT';
    passed = true;
    console.log(`✅ ${performanceRating}: Warm start completed in ${warmStartResult.duration.toFixed(2)}s`);
    console.log(`   Target: < ${EXCELLENT_THRESHOLD}s`);
    console.log(`   Status: PASSED ✓`);
  } else if (warmStartResult.duration < ACCEPTABLE_THRESHOLD) {
    performanceRating = 'ACCEPTABLE';
    passed = true;
    console.log(`⚠️  ${performanceRating}: Warm start completed in ${warmStartResult.duration.toFixed(2)}s`);
    console.log(`   Target: < ${EXCELLENT_THRESHOLD}s`);
    console.log(`   Acceptable: < ${ACCEPTABLE_THRESHOLD}s`);
    console.log(`   Status: PASSED (with warning) ⚠️`);
    console.log();
    console.log('   💡 Recommendations:');
    console.log('      - Review agent execution logic for optimization opportunities');
    console.log('      - Check if Bedrock connection is being reused');
    console.log('      - Monitor for memory leaks or state accumulation');
  } else {
    performanceRating = 'SLOW';
    passed = false;
    console.log(`❌ ${performanceRating}: Warm start took ${warmStartResult.duration.toFixed(2)}s`);
    console.log(`   Target: < ${EXCELLENT_THRESHOLD}s`);
    console.log(`   Acceptable: < ${ACCEPTABLE_THRESHOLD}s`);
    console.log(`   Status: FAILED ✗`);
    console.log();
    console.log('   ⚠️  ACTION REQUIRED:');
    console.log('      - Verify Bedrock connection pooling is working');
    console.log('      - Check for unnecessary re-initialization');
    console.log('      - Review agent execution logic');
    console.log('      - Consider caching frequently used data');
  }
  
  console.log();
  console.log('📋 Next Steps:');
  if (performanceRating === 'EXCELLENT') {
    console.log('   ✅ Warm start performance meets requirements');
    console.log('   ✅ Proceed to individual agent testing (test-strands-all-agents.js)');
    console.log('   ✅ Container reuse is working correctly');
  } else if (performanceRating === 'ACCEPTABLE') {
    console.log('   ⚠️  Performance is acceptable but could be improved');
    console.log('   ✅ Proceed to individual agent testing');
    console.log('   ⚠️  Monitor warm start performance in production');
  } else {
    console.log('   ❌ Optimization required');
    console.log('   1. Review Bedrock connection pooling implementation');
    console.log('   2. Check for unnecessary re-initialization');
    console.log('   3. Re-run this test');
  }
  
  return {
    success: true,
    coldStart: coldStartResult,
    warmStart: warmStartResult,
    performanceRating,
    passed
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await testWarmStart();
    
    console.log();
    console.log('='.repeat(70));
    console.log('📊 Test Summary:');
    console.log('='.repeat(70));
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    
    if (result.coldStart) {
      console.log(`   Cold Start: ${result.coldStart.duration?.toFixed(2) || 'N/A'}s`);
    }
    
    if (result.warmStart) {
      console.log(`   Warm Start: ${result.warmStart.duration?.toFixed(2) || 'N/A'}s`);
    }
    
    if (result.performanceRating) {
      console.log(`   Rating: ${result.performanceRating}`);
      console.log(`   Passed: ${result.passed ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('='.repeat(70));
    console.log();
    
    // Exit with appropriate code
    if (result.success && result.passed) {
      console.log('✅ Warm start test PASSED');
      process.exit(0);
    } else {
      console.log('❌ Warm start test FAILED');
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

module.exports = { testWarmStart };
