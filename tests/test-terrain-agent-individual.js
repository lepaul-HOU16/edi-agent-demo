#!/usr/bin/env node

/**
 * Test individual terrain agent invocation
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testTerrainAgent() {
  console.log('🧪 Testing Terrain Agent Individual Invocation\n');
  console.log('============================================================');

  const lambda = new LambdaClient({ region: 'us-east-1' });

  // Find the RenewableAgentsFunction
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const listResult = await lambda.send(new ListFunctionsCommand({}));
  const agentFunction = listResult.Functions.find(f => f.FunctionName.includes('RenewableAgentsFunction'));

  if (!agentFunction) {
    console.log('❌ RenewableAgentsFunction not found');
    process.exit(1);
  }

  console.log(`✅ Found function: ${agentFunction.FunctionName}`);
  console.log(`   Runtime: ${agentFunction.Runtime}`);
  console.log(`   Memory: ${agentFunction.MemorySize}MB`);
  console.log(`   Timeout: ${agentFunction.Timeout}s`);
  console.log(`   Image: ${agentFunction.PackageType}`);

  // Test terrain agent
  console.log('\nTest 1: Terrain Analysis Agent');
  console.log('------------------------------------------------------------');
  console.log('Invoking terrain agent...');

  const payload = {
    agent: 'terrain',
    query: 'Analyze terrain for wind farm development',
    parameters: {
      project_id: 'test_123',
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 2.0
    }
  };

  const startTime = Date.now();
  const result = await lambda.send(new InvokeCommand({
    FunctionName: agentFunction.FunctionName,
    Payload: JSON.stringify(payload)
  }));
  const duration = Date.now() - startTime;

  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📊 Status Code: ${result.StatusCode}`);

  const response = JSON.parse(Buffer.from(result.Payload).toString());
  
  if (result.FunctionError) {
    console.log(`❌ Function Error: ${result.FunctionError}`);
    console.log(`📄 Error Response:`, JSON.stringify(response, null, 2));
    process.exit(1);
  }

  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  
  console.log(`✅ Success: ${body.success}`);
  console.log(`🤖 Agent: ${body.agent}`);
  console.log(`📝 Response length: ${body.response?.length || 0} characters`);
  console.log(`🎨 Artifacts: ${body.artifacts?.length || 0}`);
  console.log(`📄 Response preview: ${body.response?.substring(0, 100)}...`);

  if (body.success) {
    console.log('\n✅ TERRAIN AGENT TEST PASSED');
  } else {
    console.log('\n❌ TERRAIN AGENT TEST FAILED');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('🏁 Test Complete');
}

testTerrainAgent().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
