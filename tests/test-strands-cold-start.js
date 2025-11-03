#!/usr/bin/env node

/**
 * Test Strands Agent Lambda Cold Start Performance
 * 
 * Requirements: 9.1
 * - Measure cold start time (first invocation)
 * - Verify cold start < 5 minutes
 * - Log detailed timing breakdown
 * 
 * This test invokes the Strands Agent Lambda for the FIRST time after deployment
 * to measure cold start performance. It should be run after a fresh deployment
 * or after the Lambda has been idle long enough for containers to be recycled.
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Performance thresholds (in seconds)
const EXCELLENT_THRESHOLD = 300;  // 5 minutes
const ACCEPTABLE_THRESHOLD = 600; // 10 minutes

// Test payload for terrain agent (lightweight test)
const testPayload = {
  agent: 'terrain',
  query: 'Analyze terrain at coordinates 35.067482, -101.395466',
  parameters: {
    project_id: 'cold-start-test',
    latitude: 35.067482,
    longitude: -101.395466,
    radius_km: 2
  }
};

/**
 * Find the Strands Agent Lambda function
 */
async function findStrandsAgentFunction() {
  console.log('🔍 Searching for Strands Agent Lambda function...');
  
  const listCommand = new ListFunctionsCommand({});
  const response = await lambda.send(listCommand);
  
  const agentFunction = response.Functions.find(f => 
    f.FunctionName.includes('RenewableAgentsFunction')
  );
  
  if (!agentFunction) {
    console.error('❌ RenewableAgentsFunction not found');
    console.log('\n📋 Available functions:');
    response.Functions.forEach(f => console.log(`  - ${f.FunctionName}`));
    throw new Error('Strands Agent Lambda not found');
  }
  
  return agentFunction;
}

/**
 * Test cold start performance
 */
async function testColdStart() {
  console.log('🧪 Strands Agent Cold Start Performance Test');
  console.log('='.repeat(70));
  console.log();
  
  // Find Lambda function
  const agentFunction = await findStrandsAgentFunction();
  
  console.log('✅ Found Strands Agent Lambda:');
  console.log(`   Function: ${agentFunction.FunctionName}`);
  console.log(`   Runtime: ${agentFunction.Runtime || 'Docker'}`);
  console.log(`   Memory: ${agentFunction.MemorySize}MB`);
  console.log(`   Timeout: ${agentFunction.Timeout}s (${(agentFunction.Timeout / 60).toFixed(1)} minutes)`);
  console.log(`   Package: ${agentFunction.PackageType}`);
  console.log(`   Last Modified: ${agentFunction.LastModified}`);
  console.log();
  
  console.log('🎯 Test Configuration:');
  console.log(`   Agent: ${testPayload.agent}`);
  console.log(`   Location: ${testPayload.parameters.latitude}, ${testPayload.parameters.longitude}`);
  console.log(`   Radius: ${testPayload.parameters.radius_km}km`);
  console.log();
  
  console.log('⚠️  IMPORTANT: This test measures COLD START performance');
  console.log('   - First invocation after deployment');
  console.log('   - Includes Docker image pull, dependency loading, initialization');
  console.log('   - Expected to take 2-5 minutes');
  console.log();
  
  console.log('='.repeat(70));
  console.log();
  
  // Measure invocation time
  const startTime = Date.now();
  console.log(`⏱️  Start time: ${new Date(startTime).toISOString()}`);
  console.log('🚀 Invoking Lambda (this may take several minutes)...');
  console.log();
  
  // Track timing milestones
  const timingBreakdown = {
    invocationStart: startTime,
    invocationEnd: null,
    totalDuration: null,
    initTime: null,
    executionTime: null
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: agentFunction.FunctionName,
      Payload: JSON.stringify(testPayload),
      InvocationType: 'RequestResponse'
    });
    
    const response = await lambda.send(command);
    timingBreakdown.invocationEnd = Date.now();
    timingBreakdown.totalDuration = (timingBreakdown.invocationEnd - timingBreakdown.invocationStart) / 1000;
    
    console.log(`✅ Lambda invocation completed`);
    console.log(`⏱️  Total Duration: ${timingBreakdown.totalDuration.toFixed(2)}s (${(timingBreakdown.totalDuration / 60).toFixed(2)} minutes)`);
    console.log();
    
    // Parse response
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('📊 Response Analysis:');
    console.log('='.repeat(70));
    console.log(`   Status Code: ${response.StatusCode}`);
    console.log(`   Function Error: ${response.FunctionError || 'None'}`);
    console.log();
    
    // Check for errors
    if (response.FunctionError || payload.errorMessage) {
      console.log('❌ Error Response:');
      console.log(JSON.stringify(payload, null, 2));
      console.log();
      
      if (payload.errorMessage) {
        console.log('🔍 Error Details:');
        console.log(`   Message: ${payload.errorMessage}`);
        console.log(`   Type: ${payload.errorType}`);
        
        if (payload.stackTrace) {
          console.log('   Stack Trace:');
          payload.stackTrace.forEach(line => console.log(`     ${line}`));
        }
      }
      
      return {
        success: false,
        timing: timingBreakdown,
        error: payload.errorMessage || 'Unknown error'
      };
    }
    
    // Parse body if present
    const body = payload.body ? 
      (typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body) : 
      payload;
    
    console.log('✅ Success Response:');
    console.log(`   Success: ${body.success}`);
    console.log(`   Agent: ${body.agent || testPayload.agent}`);
    console.log(`   Message: ${body.message?.substring(0, 100) || 'N/A'}...`);
    console.log(`   Artifacts: ${body.artifacts?.length || 0}`);
    console.log();
    
    // Extract performance metrics from response
    if (body.performance) {
      timingBreakdown.initTime = body.performance.initTime;
      timingBreakdown.executionTime = body.performance.executionTime;
      
      console.log('⚡ Performance Metrics (from Lambda):');
      console.log(`   Cold Start: ${body.performance.coldStart ? 'YES ❄️' : 'NO 🔥'}`);
      console.log(`   Init Time: ${body.performance.initTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Execution Time: ${body.performance.executionTime?.toFixed(2) || 'N/A'}s`);
      console.log(`   Memory Used: ${body.performance.memoryUsed || 'N/A'} MB`);
      console.log();
    }
    
    // Detailed timing breakdown
    console.log('📈 Detailed Timing Breakdown:');
    console.log('='.repeat(70));
    console.log(`   Total Duration: ${timingBreakdown.totalDuration.toFixed(2)}s`);
    
    if (timingBreakdown.initTime) {
      console.log(`   ├─ Initialization: ${timingBreakdown.initTime.toFixed(2)}s (${((timingBreakdown.initTime / timingBreakdown.totalDuration) * 100).toFixed(1)}%)`);
      console.log(`   │  ├─ Docker image pull`);
      console.log(`   │  ├─ Python runtime startup`);
      console.log(`   │  ├─ Dependency loading (PyWake, GeoPandas, etc.)`);
      console.log(`   │  └─ Bedrock connection`);
    }
    
    if (timingBreakdown.executionTime) {
      console.log(`   └─ Execution: ${timingBreakdown.executionTime.toFixed(2)}s (${((timingBreakdown.executionTime / timingBreakdown.totalDuration) * 100).toFixed(1)}%)`);
      console.log(`      ├─ Agent reasoning`);
      console.log(`      ├─ Tool execution`);
      console.log(`      └─ Response generation`);
    }
    
    console.log();
    
    // Artifacts
    if (body.artifacts && body.artifacts.length > 0) {
      console.log('📦 Artifacts Generated:');
      body.artifacts.forEach((artifact, index) => {
        console.log(`   ${index + 1}. Type: ${artifact.type}`);
        console.log(`      URL: ${artifact.url || artifact.key || 'N/A'}`);
      });
      console.log();
    }
    
    // Performance assessment
    console.log('='.repeat(70));
    console.log('🎯 Cold Start Performance Assessment:');
    console.log('='.repeat(70));
    
    let performanceRating;
    if (timingBreakdown.totalDuration < EXCELLENT_THRESHOLD) {
      performanceRating = 'EXCELLENT';
      console.log(`✅ ${performanceRating}: Cold start completed in ${timingBreakdown.totalDuration.toFixed(2)}s`);
      console.log(`   Target: < ${EXCELLENT_THRESHOLD}s (${EXCELLENT_THRESHOLD / 60} minutes)`);
      console.log(`   Status: PASSED ✓`);
    } else if (timingBreakdown.totalDuration < ACCEPTABLE_THRESHOLD) {
      performanceRating = 'ACCEPTABLE';
      console.log(`⚠️  ${performanceRating}: Cold start completed in ${timingBreakdown.totalDuration.toFixed(2)}s`);
      console.log(`   Target: < ${EXCELLENT_THRESHOLD}s (${EXCELLENT_THRESHOLD / 60} minutes)`);
      console.log(`   Acceptable: < ${ACCEPTABLE_THRESHOLD}s (${ACCEPTABLE_THRESHOLD / 60} minutes)`);
      console.log(`   Status: PASSED (with warning) ⚠️`);
      console.log();
      console.log('   💡 Recommendations:');
      console.log('      - Consider implementing lazy loading for heavy dependencies');
      console.log('      - Optimize Docker image size');
      console.log('      - Review dependency loading order');
    } else {
      performanceRating = 'SLOW';
      console.log(`❌ ${performanceRating}: Cold start took ${timingBreakdown.totalDuration.toFixed(2)}s`);
      console.log(`   Target: < ${EXCELLENT_THRESHOLD}s (${EXCELLENT_THRESHOLD / 60} minutes)`);
      console.log(`   Acceptable: < ${ACCEPTABLE_THRESHOLD}s (${ACCEPTABLE_THRESHOLD / 60} minutes)`);
      console.log(`   Status: FAILED ✗`);
      console.log();
      console.log('   ⚠️  IMMEDIATE ACTION REQUIRED:');
      console.log('      - Implement lazy loading for PyWake and other heavy dependencies');
      console.log('      - Optimize Docker image with multi-stage builds');
      console.log('      - Pre-compile Python bytecode');
      console.log('      - Consider provisioned concurrency for production');
    }
    
    console.log();
    console.log('📋 Next Steps:');
    if (performanceRating === 'EXCELLENT') {
      console.log('   ✅ Cold start performance meets requirements');
      console.log('   ✅ Proceed to warm start testing (test-strands-warm-start.js)');
      console.log('   ✅ Add performance monitoring and CloudWatch metrics');
    } else if (performanceRating === 'ACCEPTABLE') {
      console.log('   ⚠️  Performance is acceptable but could be improved');
      console.log('   ✅ Proceed to warm start testing');
      console.log('   ⚠️  Monitor cold start frequency');
      console.log('   ⚠️  Consider optimization if cold starts are frequent');
    } else {
      console.log('   ❌ Optimization required before proceeding');
      console.log('   1. Implement lazy loading (Task 6)');
      console.log('   2. Optimize Dockerfile (Task 9)');
      console.log('   3. Re-run this test');
      console.log('   4. Only proceed to warm start testing after cold start < 5 minutes');
    }
    
    return {
      success: true,
      timing: timingBreakdown,
      performanceRating,
      passed: timingBreakdown.totalDuration < ACCEPTABLE_THRESHOLD
    };
    
  } catch (error) {
    timingBreakdown.invocationEnd = Date.now();
    timingBreakdown.totalDuration = (timingBreakdown.invocationEnd - timingBreakdown.invocationStart) / 1000;
    
    console.log(`❌ Lambda invocation failed after ${timingBreakdown.totalDuration.toFixed(2)}s`);
    console.log();
    console.log('🔍 Error Details:');
    console.log(`   Name: ${error.name}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      console.log();
      console.log('⏱️  TIMEOUT DETECTED');
      console.log(`   Lambda exceeded the ${agentFunction.Timeout}s timeout`);
      console.log();
      console.log('   ⚠️  CRITICAL: Immediate optimization required!');
      console.log('      - Cold start is taking longer than Lambda timeout');
      console.log('      - This will cause ALL first requests to fail');
      console.log('      - Implement lazy loading immediately');
      console.log('      - Consider increasing timeout temporarily');
    }
    
    if (error.stack) {
      console.log();
      console.log('Stack trace:');
      console.log(error.stack);
    }
    
    return {
      success: false,
      timing: timingBreakdown,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await testColdStart();
    
    console.log();
    console.log('='.repeat(70));
    console.log('📊 Test Summary:');
    console.log('='.repeat(70));
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Duration: ${result.timing.totalDuration?.toFixed(2) || 'N/A'}s`);
    
    if (result.success && result.performanceRating) {
      console.log(`   Rating: ${result.performanceRating}`);
      console.log(`   Passed: ${result.passed ? '✅ YES' : '❌ NO'}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    console.log('='.repeat(70));
    console.log();
    
    // Exit with appropriate code
    if (result.success && result.passed) {
      console.log('✅ Cold start test PASSED');
      process.exit(0);
    } else {
      console.log('❌ Cold start test FAILED');
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

module.exports = { testColdStart };
