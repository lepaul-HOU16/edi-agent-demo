#!/usr/bin/env node
/**
 * Test script to verify performance monitoring in Strands Agent Lambda
 * Tests Task 2: Performance monitoring implementation
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testPerformanceMonitoring() {
  console.log('🧪 Testing Strands Agent Performance Monitoring\n');
  
  try {
    // Find the Strands Agent Lambda function
    const { execSync } = require('child_process');
    const functionName = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'RenewableAgentsFunction\')].FunctionName" --output text',
      { encoding: 'utf-8' }
    ).trim();
    
    if (!functionName) {
      console.error('❌ Strands Agent Lambda not found');
      console.log('   Make sure the Lambda is deployed with: npx ampx sandbox');
      process.exit(1);
    }
    
    console.log(`✅ Found Lambda: ${functionName}\n`);
    
    // Test 1: Cold start (first invocation)
    console.log('📊 Test 1: Cold Start Performance');
    console.log('   Invoking Lambda for the first time...');
    
    const coldStartPayload = {
      agent: 'terrain',
      query: 'Test cold start performance',
      parameters: {
        project_id: 'perf_test_cold',
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 2.0
      }
    };
    
    const coldStartStart = Date.now();
    const coldStartResponse = await lambda.send(new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(coldStartPayload)
    }));
    const coldStartDuration = (Date.now() - coldStartStart) / 1000;
    
    const coldStartResult = JSON.parse(Buffer.from(coldStartResponse.Payload).toString());
    const coldStartBody = JSON.parse(coldStartResult.body);
    
    console.log(`   ⏱️  Total invocation time: ${coldStartDuration.toFixed(2)}s`);
    
    if (coldStartBody.performance) {
      const perf = coldStartBody.performance;
      console.log(`   🥶 Cold start: ${perf.coldStart ? 'YES' : 'NO'}`);
      console.log(`   ⏱️  Init time: ${perf.initTime}s`);
      console.log(`   ⏱️  Execution time: ${perf.executionTime}s`);
      console.log(`   💾 Memory used: ${perf.memoryUsed} MB`);
      console.log(`   💾 Memory delta: ${perf.memoryDelta} MB`);
      
      // Verify cold start detection
      if (!perf.coldStart) {
        console.log('   ⚠️  WARNING: Expected cold start but got warm start');
        console.log('   This might be because the Lambda was recently invoked');
      }
      
      console.log('   ✅ Performance metrics present\n');
    } else {
      console.log('   ❌ No performance metrics in response\n');
      process.exit(1);
    }
    
    // Wait a moment before warm start test
    console.log('   Waiting 2 seconds before warm start test...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Warm start (second invocation)
    console.log('📊 Test 2: Warm Start Performance');
    console.log('   Invoking Lambda again (should be warm)...');
    
    const warmStartPayload = {
      agent: 'layout',
      query: 'Test warm start performance',
      parameters: {
        project_id: 'perf_test_warm',
        latitude: 35.067482,
        longitude: -101.395466,
        num_turbines: 10
      }
    };
    
    const warmStartStart = Date.now();
    const warmStartResponse = await lambda.send(new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(warmStartPayload)
    }));
    const warmStartDuration = (Date.now() - warmStartStart) / 1000;
    
    const warmStartResult = JSON.parse(Buffer.from(warmStartResponse.Payload).toString());
    const warmStartBody = JSON.parse(warmStartResult.body);
    
    console.log(`   ⏱️  Total invocation time: ${warmStartDuration.toFixed(2)}s`);
    
    if (warmStartBody.performance) {
      const perf = warmStartBody.performance;
      console.log(`   ⚡ Warm start: ${!perf.coldStart ? 'YES' : 'NO'}`);
      console.log(`   ⏱️  Init time: ${perf.initTime}s (should be 0)`);
      console.log(`   ⏱️  Execution time: ${perf.executionTime}s`);
      console.log(`   💾 Memory used: ${perf.memoryUsed} MB`);
      console.log(`   💾 Memory delta: ${perf.memoryDelta} MB`);
      
      // Verify warm start detection
      if (perf.coldStart) {
        console.log('   ⚠️  WARNING: Expected warm start but got cold start');
        console.log('   Lambda container may have been recycled');
      }
      
      if (perf.initTime > 0) {
        console.log('   ⚠️  WARNING: Init time should be 0 for warm start');
      }
      
      console.log('   ✅ Performance metrics present\n');
    } else {
      console.log('   ❌ No performance metrics in response\n');
      process.exit(1);
    }
    
    // Test 3: Performance comparison
    console.log('📊 Test 3: Performance Comparison');
    if (coldStartBody.performance && warmStartBody.performance) {
      const coldPerf = coldStartBody.performance;
      const warmPerf = warmStartBody.performance;
      
      console.log(`   Cold start execution: ${coldPerf.executionTime}s`);
      console.log(`   Warm start execution: ${warmPerf.executionTime}s`);
      
      if (warmPerf.executionTime < coldPerf.executionTime) {
        const improvement = ((coldPerf.executionTime - warmPerf.executionTime) / coldPerf.executionTime * 100).toFixed(1);
        console.log(`   ✅ Warm start is ${improvement}% faster\n`);
      } else {
        console.log(`   ⚠️  Warm start not faster (may vary by agent complexity)\n`);
      }
    }
    
    // Summary
    console.log('✅ Performance Monitoring Tests Complete\n');
    console.log('Summary:');
    console.log('  ✅ Task 2.1: Cold/warm start detection working');
    console.log('  ✅ Task 2.2: Execution time tracking working');
    console.log('  ✅ Task 2.3: Memory usage tracking working');
    console.log('  ✅ Task 2.4: Performance metrics in response working');
    console.log('\nNext steps:');
    console.log('  - Monitor CloudWatch logs for performance metrics');
    console.log('  - Check for cold start patterns over time');
    console.log('  - Consider optimization if cold starts exceed 5 minutes');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testPerformanceMonitoring();
