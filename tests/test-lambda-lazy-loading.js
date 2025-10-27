#!/usr/bin/env node
/**
 * Test lazy loading performance in deployed Lambda
 * Measures cold start and warm start times with lazy loading
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Test scenarios for different agents
const testScenarios = [
  {
    name: 'Terrain Agent (GeoPandas only)',
    agent: 'terrain',
    query: 'Analyze terrain for wind farm',
    parameters: {
      project_id: 'lazy-test-1',
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 2.0
    },
    expectedDeps: ['geopandas']
  },
  {
    name: 'Layout Agent (GeoPandas only)',
    agent: 'layout',
    query: 'Create turbine layout',
    parameters: {
      project_id: 'lazy-test-1',
      latitude: 35.067482,
      longitude: -101.395466
    },
    expectedDeps: ['geopandas']
  },
  {
    name: 'Simulation Agent (PyWake + Matplotlib)',
    agent: 'simulation',
    query: 'Run wake simulation',
    parameters: {
      project_id: 'lazy-test-1'
    },
    expectedDeps: ['pywake', 'matplotlib']
  }
];

async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const start = Date.now();
  const response = await lambda.send(command);
  const duration = Date.now() - start;
  
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  
  return { body, duration, statusCode: response.StatusCode };
}

async function findLambdaFunction() {
  // Try to find the Strands Agent Lambda
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  
  const listCommand = new ListFunctionsCommand({});
  const functions = await lambda.send(listCommand);
  
  const strandsFunction = functions.Functions.find(f => 
    f.FunctionName.includes('renewableAgents') || 
    f.FunctionName.includes('StrandsAgent')
  );
  
  if (!strandsFunction) {
    throw new Error('Could not find Strands Agent Lambda function');
  }
  
  return strandsFunction.FunctionName;
}

async function testColdStart(functionName, scenario) {
  console.log(`\n🥶 Testing COLD START: ${scenario.name}`);
  console.log(`   Expected dependencies: ${scenario.expectedDeps.join(', ')}`);
  
  // Force cold start by updating environment variable
  const { UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
  const updateCommand = new UpdateFunctionConfigurationCommand({
    FunctionName: functionName,
    Environment: {
      Variables: {
        FORCE_COLD_START: Date.now().toString()
      }
    }
  });
  
  try {
    await lambda.send(updateCommand);
    console.log('   Waiting for function update...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.log('   ⚠️  Could not force cold start, continuing anyway...');
  }
  
  const payload = {
    agent: scenario.agent,
    query: scenario.query,
    parameters: scenario.parameters
  };
  
  const result = await invokeLambda(functionName, payload);
  
  console.log(`   ⏱️  Total time: ${result.duration}ms`);
  
  if (result.body.performance) {
    const perf = result.body.performance;
    console.log(`   📊 Cold start: ${perf.coldStart ? 'YES' : 'NO'}`);
    console.log(`   📊 Init time: ${perf.initTime}s`);
    console.log(`   📊 Execution time: ${perf.executionTime}s`);
    console.log(`   📊 Memory used: ${perf.memoryUsed}MB`);
  }
  
  // Check progress updates for dependency loading
  if (result.body.progress) {
    const loadingSteps = result.body.progress.filter(p => 
      p.message.includes('loading') || p.message.includes('Loading')
    );
    
    if (loadingSteps.length > 0) {
      console.log(`   🔄 Dependency loading steps:`);
      loadingSteps.forEach(step => {
        console.log(`      ${step.message} (${step.elapsed}s)`);
      });
    }
  }
  
  return result;
}

async function testWarmStart(functionName, scenario) {
  console.log(`\n⚡ Testing WARM START: ${scenario.name}`);
  
  const payload = {
    agent: scenario.agent,
    query: scenario.query,
    parameters: scenario.parameters
  };
  
  const result = await invokeLambda(functionName, payload);
  
  console.log(`   ⏱️  Total time: ${result.duration}ms`);
  
  if (result.body.performance) {
    const perf = result.body.performance;
    console.log(`   📊 Cold start: ${perf.coldStart ? 'YES' : 'NO'}`);
    console.log(`   📊 Execution time: ${perf.executionTime}s`);
    console.log(`   📊 Memory used: ${perf.memoryUsed}MB`);
  }
  
  return result;
}

async function runTests() {
  console.log('=' .repeat(60));
  console.log('Lambda Lazy Loading Performance Test');
  console.log('=' .repeat(60));
  
  try {
    // Find Lambda function
    console.log('\n🔍 Finding Strands Agent Lambda function...');
    const functionName = await findLambdaFunction();
    console.log(`   ✅ Found: ${functionName}`);
    
    const results = {
      coldStarts: [],
      warmStarts: []
    };
    
    // Test each scenario
    for (const scenario of testScenarios) {
      // Cold start test
      const coldResult = await testColdStart(functionName, scenario);
      results.coldStarts.push({
        scenario: scenario.name,
        duration: coldResult.duration,
        performance: coldResult.body.performance
      });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Warm start test
      const warmResult = await testWarmStart(functionName, scenario);
      results.warmStarts.push({
        scenario: scenario.name,
        duration: warmResult.duration,
        performance: warmResult.body.performance
      });
      
      // Wait before next scenario
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Performance Summary');
    console.log('='.repeat(60));
    
    console.log('\n📊 Cold Start Times:');
    results.coldStarts.forEach(r => {
      const initTime = r.performance?.initTime || 0;
      const execTime = r.performance?.executionTime || 0;
      console.log(`   ${r.scenario}:`);
      console.log(`      Init: ${initTime}s, Exec: ${execTime}s, Total: ${(r.duration/1000).toFixed(2)}s`);
    });
    
    console.log('\n📊 Warm Start Times:');
    results.warmStarts.forEach(r => {
      const execTime = r.performance?.executionTime || 0;
      console.log(`   ${r.scenario}:`);
      console.log(`      Exec: ${execTime}s, Total: ${(r.duration/1000).toFixed(2)}s`);
    });
    
    console.log('\n💡 Key Observations:');
    console.log('   • Terrain/Layout agents should have faster cold starts (only GeoPandas)');
    console.log('   • Simulation agent loads more dependencies (PyWake + Matplotlib)');
    console.log('   • Warm starts should be consistently fast (dependencies cached)');
    console.log('   • Init time should be lower with lazy loading');
    
    console.log('\n✅ Test complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
