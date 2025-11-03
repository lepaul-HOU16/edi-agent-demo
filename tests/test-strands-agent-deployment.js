#!/usr/bin/env node

/**
 * Test Strands Agent Deployment
 * 
 * This script tests the deployed Strands Agent Lambda function
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });

async function testStrandsAgent() {
  console.log('🧪 Testing Strands Agent Deployment\n');
  console.log('=' .repeat(60));
  
  // Find the Lambda function
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const listCommand = new ListFunctionsCommand({});
  const functions = await lambda.send(listCommand);
  
  const agentFunction = functions.Functions.find(f => 
    f.FunctionName.includes('RenewableAgentsFunction')
  );
  
  if (!agentFunction) {
    console.error('❌ RenewableAgentsFunction not found');
    console.log('\nAvailable functions:');
    functions.Functions.forEach(f => console.log(`  - ${f.FunctionName}`));
    process.exit(1);
  }
  
  console.log(`✅ Found function: ${agentFunction.FunctionName}`);
  console.log(`   Runtime: ${agentFunction.Runtime}`);
  console.log(`   Memory: ${agentFunction.MemorySize}MB`);
  console.log(`   Timeout: ${agentFunction.Timeout}s\n`);
  
  // Test 1: Simple terrain analysis
  console.log('Test 1: Terrain Analysis Agent');
  console.log('-'.repeat(60));
  
  const terrainPayload = {
    agent: 'terrain',
    query: 'Analyze terrain for wind farm at coordinates 35.067482, -101.395466 with 100m setback',
    parameters: {
      project_id: 'test_deployment_001',
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 2.0,
      setback_m: 100
    }
  };
  
  try {
    console.log('Invoking terrain agent...');
    const startTime = Date.now();
    
    const command = new InvokeCommand({
      FunctionName: agentFunction.FunctionName,
      Payload: JSON.stringify(terrainPayload),
    });
    
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`\n⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status Code: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      console.log(`✅ Success: ${body.success}`);
      console.log(`🤖 Agent: ${body.agent}`);
      console.log(`📝 Response length: ${body.response?.length || 0} characters`);
      console.log(`🎨 Artifacts: ${body.artifacts?.length || 0}`);
      
      if (body.response) {
        console.log(`\n📄 Response preview:`);
        console.log(body.response.substring(0, 300) + '...');
      }
      
      if (body.artifacts && body.artifacts.length > 0) {
        console.log(`\n🎨 Artifacts:`);
        body.artifacts.forEach((artifact, i) => {
          console.log(`   ${i + 1}. ${artifact.type} - ${artifact.key}`);
        });
      }
      
      console.log('\n✅ TERRAIN AGENT TEST PASSED');
    } else {
      const body = JSON.parse(result.body);
      console.error(`\n❌ TERRAIN AGENT TEST FAILED`);
      console.error(`Error: ${body.error}`);
      console.error(`Category: ${body.errorCategory}`);
      if (body.details) {
        console.error(`Details:`, body.details);
      }
    }
    
  } catch (error) {
    console.error(`\n❌ TERRAIN AGENT TEST FAILED`);
    console.error(`Error: ${error.message}`);
    if (error.cause) {
      console.error(`Cause:`, error.cause);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete\n');
}

// Run tests
testStrandsAgent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
