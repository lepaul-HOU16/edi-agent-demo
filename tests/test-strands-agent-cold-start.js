#!/usr/bin/env node

/**
 * Test Strands Agent Lambda Cold Start Performance
 * 
 * This script tests the Strands Agent Lambda function by:
 * 1. Invoking it directly with a test payload
 * 2. Measuring cold start time
 * 3. Checking for timeout errors
 * 4. Verifying response structure
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test payload for terrain agent
const testPayload = {
  agent: 'terrain',
  query: 'Analyze terrain at coordinates 35.067482, -101.395466',
  parameters: {
    project_id: 'cold-start-test',
    latitude: 35.067482,
    longitude: -101.395466,
    radius_km: 5
  }
};

async function testColdStart() {
  console.log('🧪 Testing Strands Agent Lambda Cold Start\n');
  console.log('=' .repeat(60));
  
  // Get Lambda function name
  const functionName = 'amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm';
  console.log(`📦 Function: ${functionName}`);
  console.log(`🎯 Agent: ${testPayload.agent}`);
  console.log(`📍 Location: ${testPayload.parameters.latitude}, ${testPayload.parameters.longitude}`);
  console.log('=' .repeat(60));
  console.log();
  
  // Measure invocation time
  const startTime = Date.now();
  console.log(`⏱️  Start time: ${new Date(startTime).toISOString()}`);
  console.log('🚀 Invoking Lambda (this may take several minutes for cold start)...\n');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload),
      InvocationType: 'RequestResponse'
    });
    
    const response = await lambda.send(command);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Lambda invocation completed`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds (${(duration / 60).toFixed(2)} minutes)`);
    console.log();
    
    // Parse response
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('📊 Response Analysis:');
    console.log('=' .repeat(60));
    console.log(`Status Code: ${response.StatusCode}`);
    console.log(`Function Error: ${response.FunctionError || 'None'}`);
    console.log();
    
    if (payload.errorMessage) {
      console.log('❌ Error Response:');
      console.log(JSON.stringify(payload, null, 2));
      console.log();
      console.log('🔍 Error Details:');
      console.log(`  Message: ${payload.errorMessage}`);
      console.log(`  Type: ${payload.errorType}`);
      return false;
    }
    
    console.log('✅ Success Response:');
    console.log(`  Success: ${payload.success}`);
    console.log(`  Message: ${payload.message || 'N/A'}`);
    
    if (payload.performance) {
      console.log();
      console.log('⚡ Performance Metrics:');
      console.log(`  Cold Start: ${payload.performance.coldStart ? 'YES' : 'NO'}`);
      console.log(`  Init Time: ${payload.performance.initTime?.toFixed(2) || 'N/A'} seconds`);
      console.log(`  Execution Time: ${payload.performance.executionTime?.toFixed(2) || 'N/A'} seconds`);
      console.log(`  Memory Used: ${payload.performance.memoryUsed || 'N/A'} MB`);
    }
    
    if (payload.artifacts && payload.artifacts.length > 0) {
      console.log();
      console.log('📦 Artifacts Generated:');
      payload.artifacts.forEach((artifact, index) => {
        console.log(`  ${index + 1}. Type: ${artifact.type}`);
        console.log(`     URL: ${artifact.url || 'N/A'}`);
      });
    }
    
    console.log();
    console.log('=' .repeat(60));
    console.log('🎯 Cold Start Performance Assessment:');
    console.log('=' .repeat(60));
    
    if (duration < 300) {
      console.log(`✅ EXCELLENT: Cold start completed in ${duration.toFixed(2)}s (< 5 minutes)`);
    } else if (duration < 600) {
      console.log(`⚠️  ACCEPTABLE: Cold start completed in ${duration.toFixed(2)}s (< 10 minutes)`);
      console.log('   Consider optimization if this is consistent');
    } else {
      console.log(`❌ SLOW: Cold start took ${duration.toFixed(2)}s (> 10 minutes)`);
      console.log('   Optimization required!');
    }
    
    console.log();
    console.log('📋 Next Steps:');
    if (duration < 300) {
      console.log('  ✅ Cold start performance is good');
      console.log('  ✅ Proceed to warm start testing');
      console.log('  ✅ Add performance monitoring');
    } else {
      console.log('  ⚠️  Implement lazy loading for heavy dependencies');
      console.log('  ⚠️  Optimize Docker image size');
      console.log('  ⚠️  Consider provisioned concurrency');
    }
    
    return true;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`❌ Lambda invocation failed after ${duration.toFixed(2)} seconds`);
    console.log();
    console.log('🔍 Error Details:');
    console.log(`  Name: ${error.name}`);
    console.log(`  Message: ${error.message}`);
    console.log(`  Code: ${error.code || 'N/A'}`);
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      console.log();
      console.log('⏱️  TIMEOUT DETECTED');
      console.log('  This indicates the Lambda exceeded the 15-minute timeout');
      console.log('  Immediate optimization required!');
    }
    
    console.log();
    console.log('Stack trace:');
    console.log(error.stack);
    
    return false;
  }
}

// Run the test
testColdStart()
  .then(success => {
    console.log();
    console.log('=' .repeat(60));
    if (success) {
      console.log('✅ Cold start test completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Cold start test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
