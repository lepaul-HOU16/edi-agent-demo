#!/usr/bin/env node

/**
 * Test renewable orchestrator invocation
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: 'us-east-1' });

async function testInvoke() {
  console.log('🧪 Testing Renewable Orchestrator Invocation\n');
  
  const functionName = 'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd';
  
  const testPayload = {
    query: 'Analyze terrain for wind farm at 40.7128, -74.0060',
    context: {
      projectId: 'test-project-nyc'
    }
  };
  
  console.log(`📋 Function: ${functionName}`);
  console.log(`📦 Payload:`, JSON.stringify(testPayload, null, 2));
  console.log('\n🚀 Invoking...\n');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await client.send(command);
    
    console.log('✅ Invocation successful!');
    console.log('\n📊 Response:');
    console.log('Status Code:', response.StatusCode);
    
    if (response.Payload) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      console.log('\n📦 Payload:');
      console.log(JSON.stringify(payload, null, 2));
    }
    
    if (response.FunctionError) {
      console.log('\n❌ Function Error:', response.FunctionError);
    }
    
  } catch (error) {
    console.error('\n❌ Invocation failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testInvoke();
